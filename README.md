# 📦 AiCollaborator
### *AI-powered collaborative coding environment with real-time chat, file-tree workspace generation, and in-browser code execution using WebContainers.*

AiCollaborator helps teams build software together with the help of an AI coding assistant.  
Users can chat, generate full project structures, preview files, and run Node.js projects directly in the browser — no installation needed.

---

## 🚀 Features

### 🤖 AI-Assisted Coding
- Generates complete file structures using Google Gemini.
- Always returns structured JSON of a *project workspace*:
  ```json
  {
    "type": "workspace",
    "files": [...],
    "readme": "..."
  }
  ```
- Supports frontend, backend, and full-stack project creation.

### 💬 Real-Time Collaborative Chat
- Chat per project using WebSockets.
- AI responses display short preview in chat.
- Full generated code appears in the workspace panel.

### 📁 File Tree + Code Viewer
- Automatically builds a file tree from AI-generated workspace.
- Click any file to view its contents.
- Syntax-highlighted `<pre>` styling for code.

### 🖥️ Run Code in Browser with WebContainers
- Runs Node.js inside the browser.
- Supports `npm install`, `npm run start`, dev servers, and backend APIs.
- Live server logs + auto-detected local preview URL.

### 👥 Project & Contributor Management
- Add/remove contributors.
- Real-time updates.
- Project-level isolation for workspace and chat.

---

## 🛠️ Tech Stack

### **Frontend**
- React + Vite  
- TailwindCSS  
- @webcontainer/api  
- socket.io-client  
- markdown-to-jsx  

### **Backend**
- Node.js + Express  
- MongoDB + Mongoose  
- JWT Authentication  
- socket.io  
- CORS + Cookies  

### **AI**
- Google Gemini 2.5 Flash  
- JSON-based workspace generation  

---

## 📂 Folder Structure

```
AiCollaborator/
│
├── Frontend/
│   ├── src/
│   ├── components/
│   ├── context/
│   ├── screen/
│   └── vite.config.js
│
├── Backend/
│   ├── Routes/
│   ├── db/
│   ├── controllers/
│   ├── models/
│   ├── server.js
│   └── app.js
│
└── README.md
```

---

## ⚙️ Environment Variables

### **Backend (`Backend/.env`)**
```
MONGO_URL=your_mongo_url
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=8080
```

### **Frontend (`Frontend/.env`)**
```
VITE_BACKEND_URL=http://localhost:8080
VITE_GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Environment files are excluded using `.gitignore`.  
> Never push them to GitHub.

---

## 🧪 Run Locally

### 1. Clone repo
```bash
git clone https://github.com/vickeymadhukar/AiCollaborator.git
cd AiCollaborator
```

### 2. Start Backend
```bash
cd Backend
npm install
npm start
```

### 3. Start Frontend
```bash
cd Frontend
npm install
npm run dev
```

---

## 🌐 WebContainer Requirements

To run Node.js inside the browser, these headers are required:

### **Vite (Frontend)**
```js
server: {
  headers: {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
}
```

### **Express (Backend)**
```js
res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
```

---

## 🤖 Example AI Workspace Output

```json
{
  "type": "workspace",
  "files": [
    {
      "path": "package.json",
      "language": "json",
      "content": "{ ... }"
    },
    {
      "path": "src/index.js",
      "language": "js",
      "content": "console.log('hello world');"
    }
  ],
  "readme": "Project description..."
}
```

---

## 🧑‍💻 Author

**Vikas Kumar Madhukar**  
Full-Stack Developer • AI & WebContainers Enthusiast

---

## ⭐ Contributing

Pull requests are welcome.  
Fork → Branch → Commit → PR.

---

## 🛡️ License

MIT License.

