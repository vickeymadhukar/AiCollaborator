import * as ai from "../services/ai.services.js";

export const generateAIContent = async (req, res) => {
  try {
    const prompt = req.query.prompt;

    console.log("Received prompt:", prompt); // <-- DEBUG

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const aiResponse = await ai.generateContent(prompt);
    res.send(aiResponse);
  } catch (err) {
    console.error("Error in generateAIContent controller:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
