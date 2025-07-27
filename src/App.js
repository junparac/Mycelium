import React, { useState, useEffect, useRef  } from 'react';
import './styles.css';
import GraphView from './GraphView';
import extractLinkedTitles from './extractLinkedTitles';

function App() {
  const [vaultPath, setVaultPath] = useState(null);
  const [noteFiles, setNoteFiles] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [text, setText] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editorText, setEditorText] = useState('');
  const [nodeArray, setNodeArray] = useState([]);
  const [links, setLinks] = useState([]);
  const [synonyms, setSynonyms] = useState({});

// Load synonyms once, e.g. on vault open or app start
useEffect(() => {
  window.electronAPI.loadSynonyms()
    .then(loadedSynonyms => setSynonyms(loadedSynonyms || {}));
}, []);

// Updated buildGraph
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

    // Call your async extractLinkedTitles with synonyms
    const linkedTitles = await extractLinkedTitles(content, noteTitles, synonyms);

    linkedTitles.forEach(toTitle => {
      if (toTitle !== fromTitle && noteTitles.includes(toTitle)) {
        links.push({ source: fromTitle, target: toTitle });
      }
    });
  }

  setNodeArray(nodes);
  setLinks(links);

  // Save synonyms after build (optional, if extractLinkedTitles auto-learns)
  window.electronAPI.saveSynonyms(synonyms);
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



const handleNewNote = () => {
  if (!vaultPath) {
    alert('Please open a vault folder first!');
    return;
  }

  setText('');
  setNoteTitle('');
  setSelectedNote(null);
};



  const handleSaveNote = async () => {
    if (!vaultPath || !selectedNote) return;

    const filePath = path.join(vaultPath, selectedNote.title);

    try {
      await window.electronAPI.saveMarkdownFile(filePath, updatedText);
      // Optionally reload the vault or update the note list if needed
    } catch (err) {
      console.error('Failed to save note:', err);
    }
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
           <button onClick={handleNewNote}>➕ New Note</button>
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
            <button onClick={handleNewNote}>📝 New Note</button>
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
