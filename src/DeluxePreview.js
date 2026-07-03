// src/DeluxePreview.js
import React, { useEffect, useRef } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";
import "./DeluxePreview.css";

marked.setOptions({
  gfm: true,
  breaks: true,
  highlight: (code, lang) => {
    try {
      if (lang && hljs.getLanguage && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch (e) {
      return code;
    }
  },
});

export default function DeluxePreview({ text = "" }) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (!previewRef.current) return;
    // parse markdown -> html
    previewRef.current.innerHTML = marked.parse(text || "");

    // render math (KaTeX) inside the preview
    try {
      renderMathInElement(previewRef.current, {
        // same delimiters used in your example
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    } catch (err) {
      // swallow KaTeX errors so preview still shows
      // console.warn("KaTeX render error:", err);
    }
  }, [text]);

  // 📂 NEW: Intercept local folder link clicks safely
  useEffect(() => {
    const handleFolderClick = (e) => {
      const target = e.target.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (href && href.startsWith("open-folder://")) {
        e.preventDefault(); // Stop the app from going blank white!
        
        // Extract the clean Windows path out of the link
        const cleanPath = decodeURIComponent(href.replace("open-folder://", ""));
        
        // Send it to Electron main process to open safely in Windows Explorer
        if (window.electronAPI && window.electronAPI.openLocalFolder) {
          window.electronAPI.openLocalFolder(cleanPath);
        } else {
          console.warn("Electron API bridge 'openLocalFolder' missing.");
        }
      }
       // 🐍 NEW: Handle Python script running execution
        if (href && href.startsWith("run-script://")) {
        e.preventDefault(); // Stop the screen from going white
        const cleanPath = decodeURIComponent(href.replace("run-script://", ""));
    
        if (window.electronAPI && window.electronAPI.executePythonScript) {
        window.electronAPI.executePythonScript(cleanPath);
        } else {
        console.warn("Electron API bridge 'executePythonScript' missing.");
        } 
      }
      // 🌐 NEW: Handle standard website links (Gemini, GitHub, etc.)
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
         e.preventDefault(); // Stop it from messing up the internal app view!
  
      // Send it to Electron to open safely in your actual desktop browser
      if (window.electronAPI && window.electronAPI.openExternalLink) {
       window.electronAPI.openExternalLink(href);
      } else {
        console.warn("Electron API bridge 'openExternalLink' missing.");
      }
    }
  };
    const element = previewRef.current;
    if (element) {
      element.addEventListener("click", handleFolderClick);
    }
    return () => {
      if (element) element.removeEventListener("click", handleFolderClick);
    };
  }, [text]);

  return <div className="markdown-preview deluxe-preview" ref={previewRef} />;
}
