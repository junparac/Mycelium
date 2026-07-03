// src/MarkdownEditor.js
import React from 'react';

function MarkdownEditor({ text, setText }) {
  return (
    <div className="markdown-editor">
      <textarea
        className="markdown-editor-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your note here..."
      />
    </div>
  );
}

export default MarkdownEditor;
