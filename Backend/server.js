import "dotenv/config.js";

import http from "http";
import app from "./app.js";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import mongoose from "mongoose";
import projectmodel from "./models/project.model.js";
import { generateContent } from "./services/ai.services.js";
const port = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
  },
});

// helper to parse cookie string and return object
const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return acc;
      const key = pair.slice(0, idx);
      const val = pair.slice(idx + 1);
      acc[key] = decodeURIComponent(val);
      return acc;
    }, {});

io.use(async (socket, next) => {
  try {
    const authToken = socket.handshake?.auth?.token;
    const authHeader = socket.handshake?.headers?.authorization;
    let token = authToken || null;
    const projectId = socket.handshake?.query?.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      const err = new Error("Invalid project ID");
      err.data = { code: "INVALID_PROJECT_ID" };
      return next(err);
    }

    socket.project = await projectmodel.findById(projectId);

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      const cookies = parseCookies(socket.handshake?.headers?.cookie || "");
      token = cookies.token || null;
    }

    if (!token) {
      const err = new Error("Unauthorized: socket token not found");
      err.data = { code: "NO_SOCKET_TOKEN" };
      return next(err);
    }

    const secret = process.env.SECRET_KEY || process.env.SCERECT_KEY;
    if (!secret) {
      const err = new Error("Server misconfiguration: JWT secret missing");
      return next(err);
    }

    const decoded = jwt.verify(token, secret);
    if (!decoded) {
      const err = new Error("Unauthorized: invalid socket token");
      return next(err);
    }

    socket.user = decoded;
    return next();
  } catch (err) {
    console.error("Socket authentication error:", err);
    const e = new Error("Unauthorized");
    e.data = { message: err.message };
    return next(e);
  }
});

io.on("connection", (socket) => {
  console.log("a user connected:");

  socket.roomId = socket.project._id.toString();

  socket.join(socket.roomId);
  console.log("JOIN SENT");

  socket.on("project-message", async (data) => {
    const message = data.text;

    const isAipresentinprompt = message.toLowerCase().includes("@ai ");

    if (isAipresentinprompt) {
      console.log("AI mention detected in message:", message);
      const prompt = message.replace(/@ai /gi, "").trim();
      const result = await generateContent(prompt);

      io.to(socket.roomId).emit("project-message", {
        user: "AI",
        message: result.result,

        timestamp: new Date(),
      });
    }

    console.log("message received on project:", data);
    socket.broadcast.to(socket.roomId).emit("project-message", {
      user: socket.user,
      message: data.text,
      timestamp: new Date(),
    });
  });

  socket.on("event", (data) => {
    /* … */
  });
  socket.on("disconnect", () => {
    socket.leave(socket.roomId);
  });
});

server.listen(port, () => {
  console.log(`server is running at ${port} port`);
});
