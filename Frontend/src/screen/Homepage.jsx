import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiMoreVertical, FiUsers } from "react-icons/fi";

const Homepage = () => {
  const navigate = useNavigate(); // rename from Navigate to navigate

  const { user } = useContext(UserContext);
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");

  const openModal = () => {
    setProjectName("");
    setError("");
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);

  async function createProject(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/project/create", { name: projectName });
      // optimistic UI update
      setProjects((p) => [res.data.project, ...p]);
      closeModal();
    } catch (err) {
      console.error("Error creating project:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;




    
    axios
      .get("/project/all")
      .then((res) => {
        if (mounted) setProjects(res.data.projects || []);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err.response?.data || err.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Projects
            </h1>
            <p className="text-sm text-gray-500">Manage your projects and collaborators</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-64 outline-none text-sm text-gray-700"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{user?.email ?? "Guest"}</div>
                <div className="text-xs text-gray-400">Account</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0)?.toUpperCase() ?? "G"}
              </div>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Your Projects</h2>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow"
            >
              <FiPlus /> New Project
            </button>
          </div>
        </section>

        <section>
          {filtered.length === 0 ? (
            <div className="mt-12 rounded-lg border border-dashed border-gray-200 p-10 text-center text-gray-500">
              <p className="text-lg font-medium mb-2">No projects yet</p>
              <p className="text-sm">Create your first project to get started.</p>
              <button
                onClick={openModal}
                className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                <FiPlus /> Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {filtered.map((project) => (
                <article
                  key={project._id ?? project.id}
                  onClick={() => navigate(`/project`, { state: { project } })}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between cursor-pointer"
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/project`, { state: { project } }); }}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); /* open menu */ }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                      >
                        <FiMoreVertical />
                      </button>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      {project.description ?? "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {(project.Users ?? []).slice(0, 3).map((u, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-slate-200 border border-white text-xs flex items-center justify-center text-gray-700"
                          title={typeof u === "string" ? u : u.email}
                        >
                          {(typeof u === "string" ? u : u.email)?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FiUsers className="text-gray-400" />
                      <span>
                        {(project.Users ?? []).length} contributor
                        {(project.Users ?? []).length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating action for small screens */}
      <button
        onClick={openModal}
        aria-label="Create project"
        className="fixed right-6 bottom-6 md:hidden inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg"
      >
        <FiPlus />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 backdrop-blur-sm z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Project</h3>
            <p className="text-sm text-gray-500 mb-4">Give your project a name to get started.</p>

            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm text-gray-700 mb-1">Project name</label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="e.g. Marketing Website"
                  required
                  minLength={3}
                  disabled={loading}
                />
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Homepage;
