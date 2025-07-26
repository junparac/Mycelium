import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownEditor = forwardRef(function MarkdownEditor({
  vaultPath,
  selectedNote,
  onAddNoteToGraph
}, ref) {
  const [text, setText] = useState('');
  const [noteTitle, setNoteTitle] = useState('Untitled');
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  // Load content if selectedNote changes
  useEffect(() => {
    if (!selectedNote) {
      setText('');
      setNoteTitle('Untitled');
      return;
    }

    // If selectedNote has content already (passed from parent), use it
    if (typeof selectedNote === 'object' && selectedNote.content) {
      setText(selectedNote.content);
      setNoteTitle(selectedNote.title || 'Untitled');
      return;
    }

    // If selectedNote is just a title string, read file via IPC (preferred)
    if (vaultPath && typeof selectedNote === 'string') {
      window.electronAPI.invoke('read-markdown-file', `${vaultPath}/${selectedNote}`).then(content => {
        setText(content);
        setNoteTitle(selectedNote.replace(/\.md$/, ''));
      }).catch(() => {
        setText('');
      });
    }
  }, [selectedNote, vaultPath]);

  // Save note handler
  const handleSave = async () => {
    if (!vaultPath) {
      alert('Vault path not set.');
      return;
    }
    if (!noteTitle.trim()) {
      alert('Please enter a valid note title.');
      return;
    }

    const fileName = noteTitle.trim().endsWith('.md') ? noteTitle.trim() : `${noteTitle.trim()}.md`;
    const filePath = `${vaultPath}/${fileName}`;

    try {
      await window.electronAPI.invoke('save-markdown-file', filePath, text);
      alert(`Note saved to:\n${filePath}`);

      if (onAddNoteToGraph) {
        onAddNoteToGraph(noteTitle, text);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert('Failed to save note.');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ flex: 1 }}>
        <input
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note Title"
          style={{ marginBottom: '10px', width: '100%', padding: '5px' }}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', height: '400px', fontSize: '16px' }}
        />
        <button onClick={handleSave} style={{ marginTop: '10px', padding: '5px 10px' }}>
          Save Note
        </button>
        <button
          onClick={() => {
            setNoteTitle('Untitled');
            setText('');
            textareaRef.current?.focus();
          }}
          style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px' }}
        >
          New Note
        </button>
      </div>

      <div
        style={{
          flex: 1,
          height: '400px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          background: '#f9f9f9'
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <span
                style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => alert(`Blocked navigation to: ${href}`)}
              >
                {children}
              </span>
            )
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default MarkdownEditor;
