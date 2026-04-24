import "dotenv/config.js";
import { generateContent } from "./services/ai.services.js";

async function run() {
  console.log("Testing AI generation...");
  const res = await generateContent("can you make project using MERN todolist");
  console.log("Result:", JSON.stringify(res, null, 2));
}

run();
