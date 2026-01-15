import React from "react";
import { Link } from "react-router-dom";


const Landing = () => {
  const projects = [
    { title: "E-Commerce Platform", tag: "Next.js / Stripe" },
    { title: "Chat Application", tag: "Socket.io" },
    { title: "Admin Dashboard", tag: "MERN Stack" },
    { title: "Task Manager", tag: "React + Redux" },
    { title: "Portfolio Website", tag: "Framer Motion" },
  ];
   

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#050013] via-[#060016] to-[#03000b] text-white">

      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-80 w-80 rounded-full bg-fuchsia-600/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-indigo-500/40 blur-3xl" />

      {/* NAVBAR – Centered glass island */}
      <div className="fixed top-4 inset-x-0 z-50 flex justify-center">
        <nav className="flex items-center gap-8 rounded-full border border-white/10 bg-white/5 px-8 py-3 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
          
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-fuchsia-200/80">
            AI BATCHIT
          </span>

          <ul className="hidden md:flex items-center gap-6 text-sm text-slate-100/80">
            <li className="cursor-pointer hover:text-white transition"> <Link to="/">Home</Link></li>
            <li className="cursor-pointer hover:text-white transition">About</li>
            <li className="cursor-pointer hover:text-white transition"> <Link to="/register">Sign up</Link></li>
          </ul>

          <button className="rounded-full bg-fuchsia-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-fuchsia-400 transition">
            Get Started
          </button>
        </nav>
      </div>

      {/* HERO SECTION */}
<main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-40">
        
        <section className="text-center max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.3em] text-fuchsia-300/90 uppercase">
            React / MERN Developer
          </p>

          <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
            Build & Launch Modern
            <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}Web Project
            </span>
          </h1>

          <p className="mt-4 text-sm md:text-base text-slate-300/90">
            High-performance web applications with clean UI, reusable components,
            and production-ready MERN architecture.
          </p>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button className="rounded-full bg-fuchsia-500 px-6 py-2 text-sm font-semibold shadow hover:bg-fuchsia-400 transition">
              View Projects
            </button>
            <button className="rounded-full border border-slate-500/70 px-6 py-2 text-sm font-semibold text-slate-100 hover:border-slate-300 transition">
              <Link to="/login">Login</Link>
            </button>
          </div>
        </section>

        {/* SEMI-CIRCLE PROJECTS */}
        <section className="mt-16 w-full max-w-5xl">
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-slate-300/80 uppercase">
            Selected Projects
          </p>

          <div className="mt-8 flex flex-col items-center gap-10">

            {/* Desktop Semi-circle */}
          <div className="cardcontainer hidden md:flex justify-center gap-2">
  <ProjectCard project={projects[0]} className="rotate-[-10deg] translate-y-4" />
  <ProjectCard project={projects[1]} className="rotate-[-5deg] translate-y-2" />
  <ProjectCard project={projects[2]} highlight className="scale-105" />
  <ProjectCard project={projects[3]} className="rotate-[5deg] translate-y-2" />
  <ProjectCard project={projects[4]} className="rotate-[10deg] translate-y-4" />
</div>


            {/* Mobile Scroll */}
            <div className="flex w-full gap-4 overflow-x-auto px-2 md:hidden">
              {projects.map((p, i) => (
                <ProjectCard key={i} project={p} className="min-w-[230px]" highlight={i===2} />
              ))}
            </div>
          </div>
        </section>

    {/* DEMO VIDEO SECTION */}
<section className="mt-28 w-full max-w-4xl mx-auto text-center px-4">
  <h2 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
    How to Use This Project
  </h2>

  <p className="mt-2 text-slate-300/80 text-sm max-w-xl mx-auto">
    Watch this quick walkthrough explaining how my system works. 
    You can explore the features, usage flow, and how to get started.
  </p>

  {/* VIDEO WRAPPER */}
  <div className="mt-8 relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.6)]">
    
    {/* Replace this with your own video link */}
    <iframe
      className="w-full h-full"
      src=""
      title="Demo Video"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>

  </div>
</section>

      </main>
    </div>
  );
};

const ProjectCard = ({ project, className = "", highlight = false }) => {
  return (
    <div
      className={`group relative w-52 rounded-3xl border border-white/10 bg-white/5 px-5 py-6 backdrop-blur-xl 
      shadow-[0_18px_40px_rgba(0,0,0,0.6)]
      transition hover:-translate-y-3 hover:scale-105 hover:border-fuchsia-400/70 hover:bg-fuchsia-500/20
      ${highlight ? "bg-gradient-to-b from-fuchsia-500/30 to-sky-500/10 border-fuchsia-300/60" : ""}
      ${className}`}
    >
      <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-fuchsia-500 to-sky-500 opacity-90 group-hover:opacity-100 transition" />
      
      <h3 className="mt-4 text-sm font-semibold leading-snug">{project.title}</h3>
      <p className="mt-1 text-xs text-slate-300/80">{project.tag}</p>

      <button className="mt-4 inline-flex items-center text-xs font-semibold text-fuchsia-300 group-hover:text-fuchsia-100">
        View Case Study <span className="ml-1 text-sm">→</span>
      </button>
    </div>
  );
};

export default Landing;
