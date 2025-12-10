import React, { useState,useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import axios from "../config/axios";
import { UserContext } from "../context/user.context";
const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); // 🧠 state for error message
  const navigate = useNavigate();

const {setUser}=useContext(UserContext);

  async function submithandler(e) {
    e.preventDefault();
    setErrorMsg(""); // clear old error before submitting

    try {
      const res = await axios.post("/user/register", { email, password });
      console.log(res.data);
      localStorage.setItem("token", res.data.token);

      setUser(res.data.user); // set user in context
      
      navigate("/home");
    } catch (err) {
      console.log(err);

      if (err.response) {
        if (err.response.status === 409) {
          setErrorMsg(err.response.data.message || "Email already exists");
        } else if (err.response.status === 400) {
          setErrorMsg("Please fill all required fields correctly.");
        } else {
          setErrorMsg("Something went wrong. Please try again.");
        }
      } else {
        setErrorMsg("Server not reachable. Check your connection.");
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[#6a11cb] to-[#2575fc] text-gray-900">
      <div className="w-full max-w-md mt-10 px-6">
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-semibold tracking-wide">AI BATCHIT</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Get Started Free
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Free forever. No credit card needed.
          </p>

          {/* 🛑 Show Error Message */}
          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-center">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={submithandler}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-300"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-300 pr-10"
              />
              <p className="text-xs text-green-600 mt-1">Strong</p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-blue-600 hover:to-indigo-500 transition-all duration-500 shadow-md hover:shadow-lg"
            >
              Sign Up
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <span className="flex-1 h-px bg-gray-200"></span>
            <span className="mx-2 text-gray-400 text-sm">Or sign up with</span>
            <span className="flex-1 h-px bg-gray-200"></span>
          </div>

          {/* Social Signup */}
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-400 transition-all">
              <FaGoogle className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:border-blue-400 transition-all">
              <FaFacebookF className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Facebook
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
