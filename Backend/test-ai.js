import "dotenv/config.js";
import { generateContent } from "./services/ai.services.js";

async function run() {
  const result = await generateContent("create a simple express server");
  console.log("RESULT:", result);
}
run();
