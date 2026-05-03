import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#020617] via-[#000000] to-[#020817] text-white">

      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-10 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl" />

      {/* NAVBAR – Centered glass island */}
      <div className="fixed top-4 inset-x-0 z-50 flex justify-center">
        <nav className="flex items-center gap-8 rounded-full border border-white/10 bg-white/5 px-8 py-3 backdrop-blur-xl shadow-[0_18px_45px_rgba(0,0,0,0.6)]">

          <span className="text-xs font-bold tracking-[0.25em] uppercase text-blue-200/90">
            AiCollaborator
          </span>

          <ul className="hidden md:flex items-center gap-6 text-sm text-slate-100/80">
            <li className="cursor-pointer hover:text-white transition"> <Link to="/">Home</Link></li>
            <li className="cursor-pointer hover:text-white transition"> <a href="#how-it-works">How it Works</a></li>
            <li className="cursor-pointer hover:text-white transition"> <Link to="/register">Sign Up</Link></li>
            <li className="cursor-pointer hover:text-white transition"> <Link to="/login">Login</Link></li>
          </ul>

          <Link to="/register">
            <button className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-blue-500 transition">
              Get Started
            </button>
          </Link>
        </nav>
      </div>

      {/* HERO SECTION */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-40">

        <section className="text-center max-w-4xl">
          <p className="text-xs font-semibold tracking-[0.3em] text-blue-300/90 uppercase">
            AI-Powered Chat Application
          </p>

          <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-tight">
            Collaborate Smarter with
            <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              {" "}AI Intelligence
            </span>
          </h1>

          <p className="mt-6 text-sm md:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
            Experience next-generation communication. Our intelligent chat platform assists you in real-time, helping you brainstorm, write code, and collaborate more effectively than ever before.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register">
              <button className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all">
                Start Chatting Now
              </button>
            </Link>
            <Link to="/login">
              <button className="rounded-full border border-slate-500/70 px-8 py-3 text-sm font-semibold text-slate-100 hover:border-slate-300 transition-all bg-white/5 backdrop-blur-sm">
                Login to Account
              </button>
            </Link>
          </div>
        </section>

        {/* DEMO VIDEO SECTION */}
        <section id="how-it-works" className="mt-32 w-full max-w-5xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
            See AiCollaborator in Action
          </h2>

          <p className="mt-4 text-slate-300/80 text-base max-w-2xl mx-auto">
            Watch our quick walkthrough to see how seamless and powerful AI-assisted collaboration can be for your team's workflow.
          </p>

          <div className="mt-12 relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.6)] group">

            {/* Optional glow effect behind video */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-sky-400/10 opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>

            <div className="text-center relative z-10 p-8 flex flex-col items-center justify-center h-full w-full">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                <svg className="h-10 w-10 ml-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Watch Demo Video</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Due to browser security policies (COEP) required by WebContainers, this embedded video cannot be loaded directly in Firefox.
              </p>
              <a 
                href="https://drive.google.com/file/d/1pL92x5kPqAWV_09ivD4qKxDjJKqrHfRo/view?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
              >
                Open Video in New Tab
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Landing;
