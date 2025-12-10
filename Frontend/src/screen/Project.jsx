// src/screen/Project.jsx
import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import { FiUsers, FiX, FiChevronLeft, FiUserPlus, FiMaximize2, FiPlay } from "react-icons/fi";
import axios from "../config/axios.js";
import { initializeSocket, receviceMessage, sendMessage } from "../config/socket.js";
import { UserContext } from "../context/user.context.jsx";
import Markdown from "markdown-to-jsx";

/**
 * Project.jsx - Chat + Workspace viewer + WebContainer runner integrated.
 *
 * Requirements:
 *   npm i @webcontainer/api
 *
 * Note:
 * - This file includes a robust safeDecode helper that handles varied chunk shapes.
 * - The runWorkspace and dependency streaming code uses safeDecode everywhere.
 * - Ensure your app is served with COOP/COEP headers (vite.config or server) so WebContainer can boot.
 */

// -------------------- Utility helpers --------------------
const safeString = (v, fallback = "") => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (v && typeof v === "object") {
    if (typeof v.email === "string") return v.email;
    if (typeof v.name === "string") return v.name;
    try { return JSON.stringify(v); } catch { return fallback; }
  }
  return fallback;
};

// strip possible triple backticks and leading ```json if present
const stripCodeFence = (raw) => {
  if (!raw) return raw;
  if (typeof raw !== "string") return raw;
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```[a-zA-Z0-9]*\n/, "").replace(/```$/, "").trim();
  return s;
};

const parseAiWorkspace = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object" && raw.type === "workspace") return raw;
  const cleaned = stripCodeFence(raw);
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && parsed.type === "workspace" && Array.isArray(parsed.files)) return parsed;
  } catch (e) {
    return null;
  }
  return null;
};

// ------------------ URL detection helpers (permanent) ------------------
// Use RegExp constructor to avoid parser escaping/syntax issues
const URL_REGEX_SOURCE = 'https?:\\/\\/(?:127\\.0\\.0\\.1:\\d+|localhost:\\d+|[^\\s/]+(?:\\/[^\s]*)?)';
const URL_REGEX = new RegExp(URL_REGEX_SOURCE, 'i');
const HOST_PORT_REGEX = new RegExp('(127\\.0\\.0\\.1|localhost):\\d+', 'i');

const detectServerUrlFromText = (text) => {
  if (!text) return null;
  const s = typeof text === "string" ? text : String(text);
  const m = s.match(URL_REGEX);
  if (m && m[0]) {
    try { return new URL(m[0].trim()).href; } catch {}
  }
  const hp = s.match(HOST_PORT_REGEX);
  if (hp && hp[0]) {
    try { return new URL(`http://${hp[0].trim()}`).href; } catch {}
  }
  const tokens = s.split(/\s+/);
  for (const t of tokens) {
    if (t.includes('://') || t.includes('localhost') || t.includes('127.0.0.1') || t.match(/:\d+$/)) {
      const maybe = t.replace(/[\]\)\.?,;'"`]$/g, '');
      try { return new URL(maybe.includes('://') ? maybe : `http://${maybe}`).href; } catch {}
    }
  }
  return null;
};

// ------------------ workspace -> tree converter ------------------
const workspaceToTree = (workspace, rootName = "app") => {
  const tree = {};
  tree[rootName] = { directory: {} };
  if (!workspace || !Array.isArray(workspace.files)) return tree;

  for (const f of workspace.files) {
    const p = (f.path || "").replace(/^\/+/, "");
    if (!p) continue;
    const segments = p.split("/");
    let cur = tree[rootName].directory;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const isFile = i === segments.length - 1;
      if (isFile) {
        cur[seg] = { file: { contents: f.content ?? f.contents ?? "" } };
      } else {
        if (!cur[seg]) cur[seg] = { directory: {} };
        cur = cur[seg].directory;
      }
    }
  }

  if (workspace.readme) {
    tree[rootName].directory["README.md"] = { file: { contents: workspace.readme } };
  }
  return tree;
};

// ------------------ robust decoder helper (permanent) ------------------
const _textDecoder = new TextDecoder();

function safeDecode(chunk) {
  if (chunk === null || chunk === undefined) return "";

  // 1) already a string
  if (typeof chunk === "string") return chunk;

  // 2) Node Buffer (when running in Node-like env)
  if (typeof Buffer !== "undefined" && typeof Buffer.isBuffer === "function" && Buffer.isBuffer(chunk)) {
    try {
      return chunk.toString("utf8");
    } catch (e) {
      try { return _textDecoder.decode(chunk); } catch { return String(chunk); }
    }
  }

  // 3) TypedArray / ArrayBufferView
  try {
    if (ArrayBuffer.isView(chunk)) {
      return _textDecoder.decode(chunk);
    }
  } catch (e) { /* fallthrough */ }

  // 4) ArrayBuffer
  try {
    if (chunk instanceof ArrayBuffer) {
      return _textDecoder.decode(new Uint8Array(chunk));
    }
  } catch (e) { /* fallthrough */ }

  // 5) Some libs send plain Arrays of numbers
  if (Array.isArray(chunk) && chunk.every(n => typeof n === "number")) {
    try { return _textDecoder.decode(new Uint8Array(chunk)); } catch (e) { /* fallthrough */ }
  }

  // 6) Some streams deliver objects with a `buffer` or `data` property
  if (typeof chunk === "object") {
    try {
      if (chunk.buffer instanceof ArrayBuffer) {
        return _textDecoder.decode(new Uint8Array(chunk.buffer));
      }
    } catch (e) { /* fallthrough */ }

    if (chunk.data) {
      try { return safeDecode(chunk.data); } catch (e) { /* fallthrough */ }
    }
  }

  // 7) final fallback
  try { return String(chunk); } catch { return ""; }
}

// ------------------ write tree to container (mount fallback) ------------------
async function ensureDir(container, dirPath) {
  if (!dirPath) return;
  try {
    if (container.fs && typeof container.fs.mkdir === "function") {
      await container.fs.mkdir(dirPath, { recursive: true }).catch(()=>{});
      return;
    }
  } catch {}
  // fallback iterative create
  const parts = dirPath.split("/").filter(Boolean);
  let cur = "";
  for (const p of parts) {
    cur = cur ? `${cur}/${p}` : p;
    try { if (container.fs && typeof container.fs.mkdir === "function") await container.fs.mkdir(cur).catch(()=>{}); } catch {}
  }
}

async function writeTreeFallback(container, tree, basePrefix = "") {
  async function walk(node, currentPath = "") {
    if (!node) return;
    if (node.directory) {
      for (const name of Object.keys(node.directory)) {
        const child = node.directory[name];
        const childPath = currentPath ? `${currentPath}/${name}` : name;
        if (child.file) {
          const dirOfFile = childPath.split("/").slice(0, -1).join("/");
          await ensureDir(container, dirOfFile);
          if (child.file.symlink) {
            if (container.fs && typeof container.fs.symlink === "function") {
              try { await container.fs.symlink(child.file.symlink, childPath); continue; } catch {}
            }
            try { await container.fs.writeFile(childPath, `// symlink -> ${child.file.symlink}`); } catch {}
          } else {
            const contents = child.file.contents ?? "";
            try { await container.fs.writeFile(childPath, contents); } catch {}
          }
        } else if (child.directory) {
          await ensureDir(container, childPath);
          await walk(child, childPath);
        }
      }
    }
  }

  for (const topKey of Object.keys(tree)) {
    const node = tree[topKey];
    const base = basePrefix ? `${basePrefix}/${topKey}` : topKey;
    await ensureDir(container, base);
    await walk(node, base);
  }
}

async function writeTreeToContainer(container, tree) {
  if (!container) throw new Error("No container instance provided");
  if (typeof container.mount === "function") {
    try { await container.mount(tree); return { success: true, method: "mount" }; } catch (e) { /* fallback */ }
  }

  if (!container.fs || typeof container.fs.writeFile !== "function") {
    return { success: false, error: "container.fs.writeFile not available" };
  }

  try {
    await writeTreeFallback(container, tree);
    return { success: true, method: "writeFile" };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ------------------ get WebContainer instance (singleton) ------------------
let _cachedContainer = null;
async function getWebContainerInstance() {
  if (_cachedContainer) return _cachedContainer;
  try {
    const wc = await import("@webcontainer/api");
    const container = await wc.WebContainer.boot();
    _cachedContainer = container;
    return container;
  } catch (err) {
    throw new Error("Failed to boot WebContainer; ensure @webcontainer/api is installed and environment supports it. " + (err?.message || err));
  }
}

// ------------------ runner: install + run + stream (uses safeDecode) ------------------
async function runWorkspace({ workspace, tree, appendLog = ()=>{}, setServerUrl = ()=>{} }) {
  if (!workspace && !tree) throw new Error("workspace or tree required");

  const container = await getWebContainerInstance();
  const finalTree = tree ?? workspaceToTree(workspace, "app");

  appendLog("Writing workspace to container...\n");
  const res = await writeTreeToContainer(container, finalTree);
  if (!res.success) { appendLog("Write failed: " + (res.error || "unknown") + "\n"); return { success: false, error: res.error || "write failed" }; }
  appendLog("Workspace written (" + res.method + ")\n");

  // detect package.json
  const hasPkg = (() => {
    try {
      for (const top of Object.keys(finalTree)) {
        const node = finalTree[top];
        if (node && node.directory && node.directory["package.json"]) return true;
      }
    } catch {}
    return false;
  })();

  if (hasPkg) {
    appendLog("Installing dependencies...\n");
    try {
      const p = await container.spawn("bash", ["-lc", "cd app && (pnpm install --no-frozen-lockfile || npm install --no-audit --no-fund)"]);
      if (p.output && typeof p.output.getReader === "function") {
        const reader = p.output.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = safeDecode(value);
          appendLog(text);
        }
      } else if (p.output && typeof p.output.on === "function") {
        p.output.on("data", (c) => {
          const t = safeDecode(c);
          appendLog(t);
        });
        // if p exposes exit or promise, we can optionally await; not required here
      }
    } catch (e) {
      appendLog("Dependency install failed (continuing): " + (e?.message || e) + "\n");
    }
  }

  // determine run command
  let runCommand = "cd app && node index.js";
  if (hasPkg) {
    try {
      if (container.fs && typeof container.fs.readFile === "function") {
        const raw = await container.fs.readFile("app/package.json", "utf8").catch(()=>null);
        if (raw) {
          const pkg = JSON.parse(raw);
          if (pkg && pkg.scripts && pkg.scripts.start) runCommand = "cd app && npm run start";
        }
      }
    } catch {}
  }

  appendLog("Starting: " + runCommand + "\n");
  const runProc = await container.spawn("bash", ["-lc", runCommand]);

  // stream output & detect server URL (robust & uses safeDecode)
  (async ()=>{
    try {
      let buffer = "";
      if (runProc.output && typeof runProc.output.getReader === "function") {
        const reader = runProc.output.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = safeDecode(value);
          appendLog(text);
          buffer += text;
          const maybe = detectServerUrlFromText(buffer);
          if (maybe) {
            setServerUrl(maybe);
            buffer = "";
          }
        }
      } else if (runProc.output && typeof runProc.output.on === "function") {
        let buff = "";
        runProc.output.on("data", (chunk) => {
          const t = safeDecode(chunk);
          appendLog(t);
          buff += t;
          const maybe = detectServerUrlFromText(buff);
          if (maybe) {
            setServerUrl(maybe);
            buff = "";
          }
        });
      } else {
        appendLog("Process started but output streaming is not available for this runtime.\n");
      }
    } catch (e) {
      appendLog("Error reading run output: " + (e?.message || e) + "\n");
    }
  })();

  return { success: true, container, runProc };
}

// -------------------- Project component --------------------
const Project = () => {
  const location = useLocation();
  const project = location.state?.project ?? {};

  const [usersState, setUsersState] = useState((project.Users ?? []).map(u => (typeof u === "string" ? { email: u } : u)));
  const [contributorsOpen, setContributorsOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectss, setProjectss] = useState(project || {});
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // workspace + tree
  const [workspace, setWorkspace] = useState(null);
  const [activeFilePath, setActiveFilePath] = useState("");
  const [runnerOpen, setRunnerOpen] = useState(false);
  const [logs, setLogs] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const { user } = useContext(UserContext);
  const webContRef = useRef(null);

  const projectId = projectss?._id || project?._id;

  useEffect(() => {
    if (!projectId) return;

    initializeSocket(projectId);
    receviceMessage("project-message", (data) => {
      const sender = data?.sender || data?.user || "user";
      const rawText = typeof data?.message === "string" ? data.message : typeof data?.text === "string" ? data.text : "";
      if (sender === "AI" && rawText) {
        const ws = parseAiWorkspace(rawText);
        if (ws) {
          setWorkspace(ws);
          if (ws.files && ws.files.length > 0) setActiveFilePath(ws.files[0].path);
        }
      }
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: rawText,
        sender,
        author: data?.author ?? sender ?? "Someone",
        time: new Date().toLocaleTimeString()
      }]);
    });
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    axios.get(`/project/get-project/${projectId}`).then(res => setProjectss(res.data.project || {})).catch(err => console.error(err));
    let mounted = true;
    axios.get("/user/all").then(res => {
      if (!mounted) return;
      setAvailableUsers((res.data.users || []).map(u => (typeof u === "string" ? { email: u } : u)));
    }).catch(err => console.error(err));
    return () => { mounted = false; };
  }, [projectId]);

  const send = () => {
    if (!message.trim()) return;
    const obj = { id: Date.now(), text: message, sender: "me", author: user?.name || "Me", time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, obj]);
    sendMessage("project-message", obj);
    setMessage("");
  };

  const isAlreadyAdded = (u) => {
    const key = u._id ?? u.email ?? u.name;
    return usersState.some(s => (s._id ?? s.email ?? s.name) === key);
  };

  const handleAddFromList = (u) => {
    if (!u) return;
    if (isAlreadyAdded(u)) return;
    axios.put("/project/add-user", { projectId, users: [u._id ?? u.email ?? u.name] })
      .then(res => setUsersState(s => [...s, u]))
      .catch(err => console.error(err));
  };

  const filteredAvailable = availableUsers.filter(u => {
    if (isAlreadyAdded(u)) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return ( (u.name ?? "").toString().toLowerCase().includes(q) || (u.email ?? "").toString().toLowerCase().includes(q) );
  });

  const activeFile = workspace?.files?.find(f => f.path === activeFilePath) || null;

  // runner helpers
  const appendLog = (t) => setLogs(prev => prev + t);
  const clearLogs = () => setLogs("");

  const handleRun = async () => {
    if (!workspace) {
      appendLog("No workspace available to run. Ask AI to generate a workspace (chat).\n");
      setRunnerOpen(true);
      return;
    }
    setRunnerOpen(true);
    setIsRunning(true);
    setLogs("");
    setServerUrl("");

    try {
      const result = await runWorkspace({
        workspace,
        appendLog: (txt) => appendLog(txt),
        setServerUrl: (url) => setServerUrl(url)
      });
      if (!result.success) appendLog("Run failed: " + (result.error || "unknown") + "\n");
      webContRef.current = result.container ?? webContRef.current;
    } catch (err) {
      appendLog("Runner error: " + (err?.message || err) + "\n");
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      const c = webContRef.current;
      if (!c) { appendLog("No container to stop.\n"); return; }
      if (typeof c.kill === "function") await c.kill();
      if (typeof c.dispose === "function") await c.dispose();
      webContRef.current = null;
      appendLog("Container stopped.\n");
      setServerUrl("");
    } catch (e) {
      appendLog("Error stopping container: " + (e?.message || e) + "\n");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100">
      {/* CHAT LEFT */}
      <aside className="w-80 min-w-[18rem] bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div>
            <h2 className="text-sm font-semibold">{projectss?.name ?? project?.name ?? "Project"}</h2>
            <div className="text-xs text-gray-400">{projectss?.description ?? project?.description ?? "No description"}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setContributorsOpen(true)} className="p-2 rounded-md hover:bg-gray-700" title="Contributors"><FiUsers className="w-5 h-5 text-gray-200" /></button>
          </div>
        </header>

        <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">Chat — discuss and ask AI to generate code</div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scroll">
          {messages.map(msg => {
            const isMe = msg.sender === "me";
            const aiWs = msg.sender === "AI" && typeof msg.text === "string" ? parseAiWorkspace(msg.text) : null;
            const author = isMe ? "You" : safeString(msg.author, "Someone");
            const initial = safeString(msg.author || "U", "U").charAt(0).toUpperCase();
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && <div className="mr-3 flex-shrink-0"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">{initial}</div></div>}
                <div className="max-w-[70%]">
                  <div className={`px-4 py-2 rounded-2xl break-words ${isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-700 text-gray-100 rounded-bl-none"}`}>
                    {aiWs ? (
                      <div className="text-xs">
                        Generated workspace with <span className="font-semibold">{aiWs.files.length}</span> files{aiWs.files.length > 0 && (<>: <span className="text-gray-200">{aiWs.files.slice(0,3).map(f => f.path).join(", ")}{aiWs.files.length>3 && " ..."}</span></>)}
                        <div className="mt-1 text-[11px] text-gray-300">Full file tree & code on the right panel.</div>
                      </div>
                    ) : msg.sender === "AI" ? (
                      <Markdown className="text-sm">{safeString(msg.text, "")}</Markdown>
                    ) : (
                      <div className="text-sm">{safeString(msg.text, "")}</div>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${isMe ? "text-gray-400 text-right" : "text-gray-500 text-left"}`}>
                    <span className="font-medium text-xs mr-2">{author}</span>
                    <span className="text-[11px]">{msg.time}</span>
                  </div>
                </div>

                {isMe && <div className="ml-3 flex-shrink-0"><div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-semibold">Y</div></div>}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-700 flex gap-2 items-center">
          <input placeholder='Type message or ask AI: "create an express server"' className="flex-1 bg-gray-700 text-gray-200 placeholder-gray-400 px-3 py-2 rounded-md outline-none border border-gray-700" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} />
          <button onClick={send} disabled={!message.trim()} className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white">Send</button>
        </div>
      </aside>

      {/* RIGHT: workspace + run UI */}
      <main className="flex-1 p-6">
        <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-inner border border-gray-700 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{projectss?.name ?? "Project"}</h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">{(projectss?.Users?.length ?? 0)} contributors</div>
              <button onClick={() => setContributorsOpen(true)} className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-sm text-gray-100"><FiUserPlus className="w-4 h-4" /> Add</button>
            </div>
          </div>

          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Files tree */}
            <div className="w-64 bg-gray-800 border border-gray-700 rounded-lg flex flex-col">
              <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Files</div>
                <div className="flex gap-2">
                  <button onClick={handleRun} className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs flex items-center gap-2"><FiPlay /> Run</button>
                  <button onClick={() => setRunnerOpen(true)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs flex items-center gap-2"><FiMaximize2 /> Open</button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {!workspace || !workspace.files?.length ? (
                  <div className="p-3 text-xs text-gray-500">Ask AI in chat to generate code (e.g. "create an express server"). When AI replies with a workspace, files will appear here.</div>
                ) : (
                  <ul className="text-xs">
                    {workspace.files.map(file => (
                      <li key={file.path}>
                        <button onClick={() => setActiveFilePath(file.path)} className={`w-full text-left px-3 py-2 break-all hover:bg-gray-700 ${file.path === activeFilePath ? "bg-gray-700 text-indigo-300" : "text-gray-200"}`}>{file.path}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Code viewer + readme */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="bg-gray-800 border border-gray-700 rounded-lg flex flex-col">
                <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">{activeFile ? activeFile.path : "No file selected"}</div>
                  <div className="text-[10px] text-gray-500">{activeFile?.language?.toUpperCase() || ""}</div>
                </div>
                <div className="h-[60vh] overflow-x-auto overflow-y-auto">
                  {activeFile ? (
                    <pre className="text-[11px] md:text-xs p-3 font-mono whitespace-pre min-w-full">{activeFile.content}</pre>
                  ) : (
                    <div className="p-3 text-xs text-gray-500">Select a file from the file tree to view its content. package.json and index.js are common.</div>
                  )}
                </div>
              </div>

              <div className="h-40 bg-gray-800 border border-gray-700 rounded-lg p-3 overflow-auto">
                <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Readme</div>
                {workspace?.readme ? <Markdown className="text-xs text-gray-200">{workspace.readme}</Markdown> : <div className="text-xs text-gray-500">When AI includes a README in the workspace, it will be shown here.</div>}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Runner full-screen overlay */}
      {runnerOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-stretch">
          <div className="m-auto w-[90%] h-[90%] bg-gray-900 border border-gray-700 rounded-lg flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">Runner</div>
                <div className="text-xs text-gray-400">{workspace?.files?.length ?? 0} files</div>
                {isRunning && <div className="text-xs text-indigo-400">Running...</div>}
              </div>
              <div className="flex items-center gap-2">
                {serverUrl && <a href={serverUrl} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 bg-gray-800 rounded text-indigo-300">Open server</a>}
                <button onClick={handleStop} className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-xs">Stop</button>
                <button onClick={() => setRunnerOpen(false)} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs">Close</button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/2 border-r border-gray-700 p-3 overflow-auto bg-black text-xs font-mono text-green-200"><div className="whitespace-pre-wrap">{logs || "No logs yet. Click Run to start the workspace."}</div></div>
              <div className="flex-1 bg-gray-800 p-2">
                {serverUrl ? <iframe title="preview" src={serverUrl} className="w-full h-full border rounded" /> : <div className="text-xs text-gray-400 p-4">No preview URL detected. If your project starts a web server it usually prints a localhost URL (e.g., http://127.0.0.1:3000). The runner tries to detect such lines in the process output and will show the preview here.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contributors slide-over */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ${contributorsOpen ? "translate-x-0" : "-translate-x-full"}`} aria-hidden={!contributorsOpen}>
        <div className="h-full bg-gray-900 border-r border-gray-700 shadow-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <button onClick={() => setContributorsOpen(false)} className="p-2 rounded-md hover:bg-gray-800" aria-label="Close contributors"><FiChevronLeft className="w-5 h-5 text-gray-200" /></button>
              <h4 className="text-sm font-semibold">Contributors</h4>
            </div>
            <button onClick={() => setContributorsOpen(false)} className="p-2 rounded-md hover:bg-gray-800" aria-label="Close"><FiX className="w-5 h-5 text-gray-200" /></button>
          </div>

          <div className="px-4 py-3 border-b border-gray-800 space-y-3">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users by name or email" className="w-full bg-gray-800 text-gray-100 placeholder-gray-500 px-3 py-2 rounded-md border border-gray-700 outline-none" />
            <div className="max-h-36 overflow-auto">
              <div className="text-xs text-gray-400 mb-2">Search results</div>
              {filteredAvailable.length === 0 ? <div className="text-sm text-gray-500 px-2">No users found</div> : (
                <ul className="space-y-1">
                  {filteredAvailable.map(u => {
                    const key = u._id ?? u.email ?? u.name;
                    const initial = safeString(u.name ?? u.email ?? "U", "U").charAt(0).toUpperCase();
                    return (
                      <li key={key} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">{initial}</div>
                          <div className="text-sm">
                            <div className="font-medium text-gray-100">{safeString(u.name ?? u.email, "User")}</div>
                            <div className="text-xs text-gray-400">{safeString(u.email, "")}</div>
                          </div>
                        </div>
                        <div><button onClick={() => handleAddFromList(u)} className="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white">Add</button></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="mt-3 border-t pt-2 max-h-40 overflow-auto">
              <div className="text-xs text-gray-400 mb-2">All users</div>
              {availableUsers.length === 0 ? <div className="text-sm text-gray-500 px-2">No users available</div> : (
                <ul className="space-y-1">
                  {availableUsers.map(u => {
                    const key = u._id ?? u.email ?? u.name;
                    const added = isAlreadyAdded(u);
                    const initial = safeString(u.name ?? u.email ?? "U", "U").charAt(0).toUpperCase();
                    return (
                      <li key={key} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">{initial}</div>
                          <div className="text-sm">
                            <div className="font-medium text-gray-100">{safeString(u.name ?? u.email, "User")}</div>
                            <div className="text-xs text-gray-400">{safeString(u.email, "")}</div>
                          </div>
                        </div>
                        <div><button onClick={() => handleAddFromList(u)} disabled={added} className={`text-xs px-2 py-1 rounded ${added ? "bg-gray-600 text-gray-300" : "bg-indigo-600 hover:bg-indigo-500 text-white"}`}>{added ? "Added" : "Add"}</button></div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <ul className="space-y-3 flex-1 overflow-auto px-2 py-3">
            {projectss?.Users?.map((u, i) => {
              const initial = safeString(u.name ?? u.email ?? "U", "U").charAt(0).toUpperCase();
              return (
                <li key={u._id || i} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-800 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">{initial}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-100">{safeString(u.name ?? `User ${i+1}`, `User ${i+1}`)}</div>
                    <div className="text-xs text-gray-400">{safeString(u.email, "")}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Project;
