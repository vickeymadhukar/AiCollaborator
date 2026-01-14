import express from "express";
import morgan from "morgan";
import connect from "./db/db.js";
import userRoutes from "./Routes/user.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import projectRoutes from "./Routes/project.routes.js";
import aiRoutes from "./Routes/ai.routes.js";
connect();

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      "https://aicollaborator-1.onrender.com", // production frontend
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/user", userRoutes);
app.use("/project", projectRoutes);
app.use("/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("Hello world");
});

export default app;
