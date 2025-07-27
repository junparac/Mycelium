# 🧠 Mycelium

**Mycelium** is a privacy-focused, Markdown-based knowledge graph and note-taking app built with Electron and React that stores your notes locally by default. Inspired by the way mycelium networks connect information organically, this app helps you visualize and grow your notes like a living system.

<img width="1917" height="1019" alt="Screenshot 2025-07-27 192255" src="https://github.com/user-attachments/assets/ed7b3a15-c92c-414f-aa5f-db6e1e95979f" />
---

## ✨ Features

📁 Vault system to organize Markdown files by folder

📝 Built-in Markdown editor with real-time save support

🧩 Advanced bi-directional linking with smart synonym and pattern detection (beyond simple [[NoteName]])

🕸️ Interactive, zoomable, and draggable graph view powered by force-graph-2d

🔗 Synonym support for enhanced note discovery and link expansion

🔄 Auto-link detection and dynamic graph building across notes

🗂 Sidebar for quick navigation between notes

➕ New Note creation with title input and editor reset

🗑️ File operations: create, save, delete markdown notes

⚡ Smooth UX improvements including auto focus and error handling


---

## 🔧 Tech Stack

- **Electron** – Desktop wrapper
- **React** – UI components
- **force-graph-2d** – Graph visualization
- **Node.js IPC** – Communication between renderer and main processes
- **Markdown (.md)** – Note format

---

## 🚀 Getting Started

1. **Clone the repo:**

   ```bash
   git clone https://github.com/junparac/Mycelium.git
   cd Mycelium
Install dependencies:

bash
Copy
Edit
npm install
Start the app:

bash
Copy
Edit
npm run start
🛡️ Security
Note: During development, you may see Electron security warnings (e.g., CSP issues). These are expected and can be addressed in production builds.

📌 Roadmap (Coming Soon)
📦 Export/import vaults

🧠 Auto-learn new synonyms from usage

🎨 Theme customization

🔍 Global search

📄 License
MIT License

💬 Author
Made with curiosity and perseverance by Junrey Paracuelles 🌱
