import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateContent = async (prompt) => {
  try {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt must be a non-empty string");
    }

    // 👇 Format instruction: hamesha workspace JSON do
    const formatInstruction = `
You are helping users collaboratively build software projects.

You MUST ALWAYS respond with a SINGLE VALID JSON OBJECT (UTF-8, no comments), 
with this exact structure:

{
  "type": "workspace",
  "files": [
    {
      "path": "string (e.g. 'src/index.js' or 'app.js')",
      "language": "string (e.g. 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json')",
      "content": "full file content as a single string"
    }
  ],
  "readme": "Markdown string describing the project, how files work, and how to run it"
}

STRICT RULES:
- Do NOT include any text outside the JSON.
- Do NOT wrap the JSON in backticks.
- Do NOT explain what you are doing.
- Do NOT use markdown formatting outside "readme".
- Put ALL code only inside the "content" fields of files.
- Use a realistic, clean file/folder structure.

Example (for 'create an express server'):

{
  "type": "workspace",
  "files": [
    {
      "path": "package.json",
      "language": "json",
      "content": "{\\n  \\"name\\": \\"express-server\\",\\n  \\"version\\": \\"1.0.0\\",\\n  \\"main\\": \\"index.js\\",\\n  \\"scripts\\": { \\"start\\": \\"node index.js\\" },\\n  \\"dependencies\\": { \\"express\\": \\"^4.19.0\\" }\\n}"
    },
    {
      "path": "index.js",
      "language": "js",
      "content": "import express from 'express';\\n\\nconst app = express();\\nconst PORT = process.env.PORT || 3000;\\n\\napp.get('/', (req, res) => {\\n  res.send('Hello from Express server');\\n});\\n\\napp.listen(PORT, () => {\\n  console.log(\`Server running on port \${PORT}\`);\\n});\\n"
    }
  ],
  "readme": "# Express Server\\n\\nThis is a simple Express server with a single GET route at \`/\`."
}

Now, generate such a workspace for the following user request.
`;

    const finalPrompt = `${formatInstruction}\n\nUSER REQUEST:\n${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: finalPrompt,
      config: {
        systemInstruction:
          "Follow the given instructions exactly. Output ONLY the JSON object described, with no extra text or markdown.",
      },
    });

    if (!response || !response.text) {
      throw new Error("No response from AI model");
    }

    // IMPORTANT: response.text ab ek JSON string hoga
    return {
      success: true,
      result: response.text,
    };
  } catch (err) {
    console.error("AI generation error:", err);
    return {
      success: false,
      error: err.message,
    };
  }
};
