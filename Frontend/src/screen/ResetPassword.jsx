import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import axios from "../config/axios";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { token } = useParams();
  const navigate = useNavigate();

  async function submitHandler(e) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (password.length < 3) {
      setErrorMsg("Password must be at least 3 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`user/reset-password/${token}`, { password });
      setMessage(res.data.message || "Password reset successfully.");
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (err) {
      console.log(err);
      if (err.response) {
        setErrorMsg(err.response.data.message || "Invalid or expired token.");
      } else {
        setErrorMsg("Server not reachable. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-linear-to-b from-[#6a11cb] to-[#2575fc] text-gray-900">
      <div className="w-full max-w-md mt-20 px-6">
        <div className="text-center text-white mb-6">
          <h1 className="text-3xl font-semibold tracking-wide">AI BATCHIT</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 w-full">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Reset Password
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Enter your new password
          </p>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg mb-4 text-center">
              {message}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-center">
              {errorMsg}
            </div>
          )}

          <form className="space-y-5" onSubmit={submitHandler}>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-300 pr-10"
              />
              <FaEye className="absolute right-3 top-10 text-gray-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-lg text-white bg-linear-to-r from-indigo-500 to-blue-500 hover:from-blue-600 hover:to-indigo-500 transition-all duration-500 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Remember your password?{" "}
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

export default ResetPassword;
