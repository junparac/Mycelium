import React, { useState, useEffect } from 'react';
import './styles.css';
import GraphView from './GraphView';
import extractLinkedTitles from './extractLinkedTitles';

function App() {
  const [vaultPath, setVaultPath] = useState(null);
  const [noteFiles, setNoteFiles] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [text, setText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');

  const [nodeArray, setNodeArray] = useState([]);
  const [links, setLinks] = useState([]);

  const extractLinkedTitles = (content) => {
    const linkPattern = /\[\[([^\]]+)\]\]/g;
    const matches = [...content.matchAll(linkPattern)];
    return matches.map(match => match[1].trim());
  };

  const buildGraph = (files, vaultPath) => {
    const nodes = [];
    const links = [];

    files.forEach(file => {
      const title = file.replace(/\.md$/, '');
      nodes.push({ id: title });
    });

    files.forEach(async (file) => {
      const fullPath = `${vaultPath}/${file}`;
      const content = await window.electronAPI.readMarkdownFile(fullPath);
      const fromTitle = file.replace(/\.md$/, '');
      const linkedTitles = extractLinkedTitles(content);

      linkedTitles.forEach(toTitle => {
        if (toTitle !== fromTitle && files.includes(`${toTitle}.md`)) {
          links.push({ source: fromTitle, target: toTitle });
        }
      });

      // Wait for all async ops to complete before updating state
      setNodeArray(nodes);
      setLinks([...links]); // new array to trigger re-render
    });
  };

    const handleOpenVault = async () => {
      try {
        const folderPath = await window.electronAPI.openVaultDialog();
        if (folderPath) {
          console.log('Vault path selected:', folderPath);
          setVaultPath(folderPath);
          // You can trigger loading notes here if you want
        } else {
          console.log('Vault open dialog was canceled.');
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
    <div className="app">
      <header className="header">
        <h1>Mycelium</h1>
        <button onClick={handleOpenVault}>Open Vault</button>
      </header>

      <div className="content">
        <aside className="sidebar">
          <h2>Notes</h2>
          <ul>
            {noteFiles.map(file => (
              <li
                key={file}
                className={file === selectedNote ? 'active' : ''}
                onClick={() => setSelectedNote(file)}
              >
                {file.replace(/\.md$/, '')}
              </li>
            ))}
          </ul>
        </aside>

        <main className="editor">
          <input
            type="text"
            placeholder="Note title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your note here..."
          />
          <div className="actions">
            <button onClick={handleSave}>💾 Save</button>
            <button onClick={handleDelete} disabled={!selectedNote}>🗑️ Delete</button>
          </div>
        </main>

        <div className="graph-panel">
          <GraphView nodes={nodeArray} links={links} />
        </div>
      </div>
    </div>
  );
}

export default App;
