/*
 * Mycelium
 * Copyright (C) 2026 Junrey Paracuelles
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * This program is distributed WITHOUT ANY WARRANTY.
 * See the LICENSE file for details.
 */


import React, { useState, useEffect, useRef  } from 'react';
import './styles.css';
import GraphView from './GraphView';
import extractLinkedTitles from './extractLinkedTitles';
import { querySemanticSearch } from './semanticSearch';
import MarkdownEditor from './MarkdownEditor';
import { marked } from "marked";
import DeluxePreview from './DeluxePreview';

function App() {
  const [vaultPath, setVaultPath] = useState(null);
  const [noteFiles, setNoteFiles] = useState([]);
  const [text, setText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editorText, setEditorText] = useState('');
  const [nodeArray, setNodeArray] = useState([]);
  const [synonyms, setSynonyms] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('editor'); // or 'graph'
  const [viewMode, setViewMode] = useState("side"); // "side" or "preview"

  // 🧠 NEW AI & SIDEBAR STATES
  const [sidebarTab, setSidebarTab] = useState('files'); // 'files' or 'ai'
  const [aiQuery, setAiQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    const res = await querySemanticSearch(query); 
    console.log('Semantic search results:', res);
    setResults(res || []); 
  }

  // 🧠 NEW: Send prompt to local python server (port 5050)
  async function handleAskAI() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    
    try {
      const response = await fetch('http://127.0.0.1:5050/ask-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      const data = await response.json();
      if (data.error) {
        setAiAnswer(`⚠️ Error: ${data.error}`);
      } else {
        setAiAnswer(data.answer);
      }
    } catch (err) {
      setAiAnswer("❌ Could not connect to your Python server. Make sure server_v2.py is running on port 5050.");
    } finally {
      setAiLoading(false);
    }
  }

  const handleResultClick = (filename) => {
    setSelectedNote(filename);
  };

  // Load synonyms once, e.g. on vault open or app start
  useEffect(() => {
    window.electronAPI.loadSynonyms()
      .then(loadedSynonyms => setSynonyms(loadedSynonyms || {}));
  }, []);

  const buildGraph = async (files, vaultPath) => {
    const nodes = files.map(file => ({ id: file.replace(/\.md$/, '') }));
    const noteTitles = nodes.map(n => n.id);
    const links = [];

    const contents = await Promise.all(
      files.map(file => window.electronAPI.readMarkdownFile(`${vaultPath}/${file}`))
    );

    for (let i = 0; i < files.length; i++) {
      const fromTitle = noteTitles[i];
      const content = contents[i];
      const linkedTitles = await extractLinkedTitles(content, noteTitles, synonyms);

      linkedTitles.forEach(toTitle => {
        if (toTitle !== fromTitle && noteTitles.includes(toTitle)) {
          links.push({ source: fromTitle, target: toTitle });
        }
      });
    }

    setNodeArray(nodes);
    setLinks(links);
    window.electronAPI.saveSynonyms(synonyms);
  };

  const handleOpenVault = async () => {
    try {
      const folderPath = await window.electronAPI.openVaultDialog();
      if (folderPath) {
        setVaultPath(folderPath);
      }
    } catch (error) {
      console.error('Error opening vault dialog:', error);
    }
  };

  useEffect(() => {
    if (vaultPath) {
      window.electronAPI.getMarkdownFiles(vaultPath)
        .then(files => {
          setNoteFiles(files);
          buildGraph(files, vaultPath);
        });
    }
  }, [vaultPath]);

  useEffect(() => {
    if (vaultPath && selectedNote) {
      const fullPath = `${vaultPath}/${selectedNote}`;
      window.electronAPI.readMarkdownFile(fullPath)
        .then(content => {
          setText(content);
          setNoteTitle(selectedNote.replace(/\.md$/, ''));
        });
    }
  }, [selectedNote, vaultPath]);

  const handleSave = async () => {
    if (!noteTitle || !vaultPath) return;
    const filename = `${noteTitle}.md`;
    const fullPath = `${vaultPath}/${filename}`;
    await window.electronAPI.saveMarkdownFile(fullPath, text);

    if (!noteFiles.includes(filename)) {
      setNoteFiles(prev => [...prev, filename]);
    }
    setSelectedNote(filename);
    buildGraph([...noteFiles, filename], vaultPath);
  };

  const handleNoteSelect = (noteId) => {
    setSelectedNote(noteId + '.md'); 
  };

  const handleNewNote = () => {
    if (!vaultPath) {
      alert('Please open a vault folder first!');
      return;
    }
    setText('');
    setNoteTitle('');
    setSelectedNote(null);
  };

  const handleDelete = async () => {
    if (!selectedNote || !vaultPath) return;
    const fullPath = `${vaultPath}/${selectedNote}`;
    await window.electronAPI.deleteMarkdownFile(fullPath);
    const updatedFiles = noteFiles.filter(f => f !== selectedNote);
    setNoteFiles(updatedFiles);
    setSelectedNote(null);
    setText('');
    setNoteTitle('');
    buildGraph(updatedFiles, vaultPath);
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <h2>Mycelium</h2>
        
        <div className="sidebar-buttons">
          <button onClick={handleOpenVault}>🗃️ Open Vault</button>
          <button onClick={() => setActiveTab(activeTab === "editor" ? "graph" : "editor")}>
            {activeTab === "editor" ? "🕸️ View Graph" : "✏️ View Editor"}
          </button>
        </div>

        {/* 🧠 NEW: Spacious Sidebar Navigation Tabs */}
        <div className="sidebar-tabs" style={{ display: 'flex', marginTop: '15px', borderBottom: '2px solid #162e29' }}>
          <button 
            onClick={() => setSidebarTab('files')}
            style={{ flex: 1, padding: '8px', background: sidebarTab === 'files' ? '#162e29' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer', borderBottom: sidebarTab === 'files' ? '2px solid #00ffcc' : 'none' }}
          >
            📁 Files
          </button>
          <button 
            onClick={() => setSidebarTab('ai')}
            style={{ flex: 1, padding: '8px', background: sidebarTab === 'ai' ? '#162e29' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer', borderBottom: sidebarTab === 'ai' ? '2px solid #00ffcc' : 'none' }}
          >
            🧠 AI Brain
          </button>
        </div>

        {/* TAB CONTENT Area */}
        <div className="sidebar-tab-content" style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
          
          {/* TAB 1: Classic Note File List */}
          {sidebarTab === 'files' && (
            <ul className="notes-list">
              {noteFiles.map((file) => (
                <li
                  key={file}
                  className={file === selectedNote ? "active" : ""}
                  onClick={() => setSelectedNote(file)}
                >
                  📄 {file.replace(/\.md$/, "")}
                </li>
              ))}
            </ul>
          )}

          {/* TAB 2: Combined Semantic Search and Local RAG AI Panel */}
          {sidebarTab === 'ai' && (
            <div className="ai-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Semantic Search Section */}
              <div style={{ background: '#0e241f', padding: '12px', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#00ffcc' }}>🔍 Semantic Match</h4>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Search context..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: 1, padding: '6px', background: '#111', color: '#fff', border: '1px solid #162e29', borderRadius: '4px' }}
                  />
                  <button onClick={handleSearch} style={{ padding: '6px 12px', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Find</button>
                </div>
                
                <ul style={{ paddingLeft: '0', listStyle: 'none', marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                  {results.map((res, index) => (
                    <li
                      key={index}
                      onClick={() => handleResultClick(res.filename)}
                      style={{ cursor: "pointer", padding: '5px', marginBottom: '4px', background: '#162e29', borderRadius: '4px', fontSize: '0.85em' }}
                    >
                      📍 <strong>{res.filename.replace(/\.md$/, '')}</strong>
                      <div style={{ color: '#00ffcc', fontSize: '0.8em' }}>Relevance: {(res.score * 100).toFixed(1)}%</div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ask AI Section */}
              <div style={{ background: '#0e241f', padding: '12px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: '0', color: '#00ffcc' }}>🤖 Ask My Vault</h4>
                <p style={{ fontSize: '0.75em', color: '#888', margin: '0' }}>Queries your top relevant notes using your local Qwen engine.</p>
                
                <textarea
                  placeholder="Ask something about your notes..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', background: '#111', color: '#fff', border: '1px solid #162e29', borderRadius: '4px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                
                <button 
                  onClick={handleAskAI} 
                  disabled={aiLoading}
                  style={{ width: '100%', padding: '8px', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: aiLoading ? 'not-allowed' : 'pointer' }}
                >
                  {aiLoading ? '🔄 Processing Vault...' : 'Ask AI Brain'}
                </button>

                {aiAnswer && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#111', borderLeft: '3px solid #00ffcc', borderRadius: '4px', fontSize: '0.85em', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' }}>
                    <strong>Answer:</strong>
                    <p style={{ margin: '5px 0 0 0', lineHeight: '1.4', color: '#ddd' }}>{aiAnswer}</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </aside>

      {/* Main Panel Content (Editor or Graph) */}
      <div className="main-panel">
        {activeTab === "editor" ? (
          <main className="editor">
            {/* Toolbar */}
            <div className="editor-toolbar">
              <button onClick={handleNewNote}>📝 New</button>
              <button onClick={handleSave}>💾 Save</button>
              <button onClick={handleDelete} disabled={!selectedNote}>🗑️ Delete</button>
              <div className="view-toggle">
                <button className={viewMode === "side" ? "active" : ""} onClick={() => setViewMode("side")}>🖊️ Side by Side</button>
                <button className={viewMode === "preview" ? "active" : ""} onClick={() => setViewMode("preview")}>👁️ Preview Only</button>
              </div>
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Note title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="note-title"
            />

            {/* Editor Area */}
            <div className="editor-area">
              {viewMode === "side" ? (
                <div className="split-view">
                  <div className="editor-pane">
                    <MarkdownEditor text={text} setText={setText} />
                  </div>
                  <div className="preview-pane">
                    <DeluxePreview text={text} />
                  </div>
                </div>
              ) : (
                <div className="preview-only">
                  <DeluxePreview text={text} />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className="graph-panel">
            <GraphView
              nodes={nodeArray}
              links={links}
              onNoteSelect={handleNoteSelect}
              selectedNote={selectedNote ? selectedNote.replace(/\.md$/, '') : null}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;