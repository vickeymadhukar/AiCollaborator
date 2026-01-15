import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiMoreVertical, FiUsers, FiGrid, FiSettings, FiBriefcase, FiChevronDown } from "react-icons/fi";

const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");

  const openModal = () => { setProjectName(""); setError(""); setIsOpen(true); };
  const closeModal = () => setIsOpen(false);

  async function createProject(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/project/create", { name: projectName });
      setProjects((p) => [res.data.project, ...p]);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    axios.get("/project/all")
      .then((res) => { if (mounted) setProjects(res.data.projects || []); })
      .catch((err) => console.error(err));
    return () => { mounted = false; };
  }, []);

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      {/* Sidebar - Fixed Left */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1E293B] text-white p-4">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">P</div>
          <span className="text-xl font-bold tracking-tight">Proflow</span>
        </div>
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-indigo-600 rounded-lg text-sm font-medium transition-colors">
            <FiGrid size={18} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
            <FiBriefcase size={18} /> Projects
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">
            <FiSettings size={18} /> Settings
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="relative flex items-center flex-1 max-w-md">
            <FiSearch className="absolute left-3 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects... (Ctrl + K)"
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-4 ml-4">
            <button
              onClick={openModal}
              className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <FiPlus /> New Project
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold border-2 border-white shadow-sm">
                {user?.email?.charAt(0)?.toUpperCase() ?? "G"}
              </div>
              <FiChevronDown className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track your workspace activities.</p>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FiBriefcase className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No projects found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-1">Get started by creating your first project to collaborate with your team.</p>
              <button onClick={openModal} className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md">
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project) => (
                <article
                  key={project._id ?? project.id}
                  onClick={() => navigate(`/project`, { state: { project } })}
                  className="group relative bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col h-full"
                >
                  {/* Visual Accent Strip */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl text-indigo-600">
                      <FiBriefcase size={20} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-100">Live</span>
                      <button onClick={(e) => { e.stopPropagation(); }} className="text-slate-400 hover:text-slate-600">
                        <FiMoreVertical />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow">
                    {project.description ?? "No description provided for this project."}
                  </p>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(project.Users ?? []).slice(0, 3).map((u, i) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {(typeof u === "string" ? u : u.email)?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}
                      {(project.Users ?? []).length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{(project.Users ?? []).length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                      <FiUsers />
                      <span>{(project.Users ?? []).length} Member{(project.Users ?? []).length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal - Modernized */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Create New Project</h3>
            <p className="text-sm text-slate-500 mb-6">Launch a new workspace for your team.</p>

            <form onSubmit={createProject} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name</label>
                <input
                  autoFocus
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-slate-900"
                  placeholder="e.g. Mobile App Redesign"
                  required
                  disabled={loading}
                />
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 transition-all" disabled={loading}>
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;