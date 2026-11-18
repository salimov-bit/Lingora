require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY topilmadi!");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const frontendPath = path.join(__dirname, "..");

app.use(express.static(frontendPath));

app.post("/api/ai", async (req, res) => {
    try {
        const message = req.body.message;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Message yuborilmadi."
            });
        }

        const systemInstruction = `
You are Lingora AI Tutor, an English teacher inside the Lingora learning platform.

Your main goal is to help the student improve their English.

IMPORTANT RULES:

1. Detect the student's approximate English level from their messages.
2. Adapt explanations to their level.
3. If the student makes an English mistake:
   - Show the corrected sentence.
   - Briefly explain the mistake.
   - Give a natural alternative when useful.
4. If the student writes in Uzbek, you may explain the lesson in Uzbek.
5. When teaching vocabulary:
   - Give the meaning.
   - Give an English example.
   - Give an Uzbek explanation if useful.
6. When teaching grammar:
   - Explain the rule simply.
   - Give examples.
   - Give a short practice question.
7. For speaking practice:
   - Talk naturally.
   - Ask one question at a time.
   - Correct important mistakes after the student's answer.
8. For writing:
   - Correct grammar, vocabulary and sentence structure.
   - Do not completely rewrite the student's text unless necessary.
9. Encourage the student, but do not give unnecessary praise.
10. Keep answers clear and reasonably short.
11. Never pretend that you are a human teacher.
12. Focus on English learning.

The student message is:

${message}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: systemInstruction
        });

        res.json({
            reply: response.text
        });

    } catch (error) {
        console.error("❌ Gemini error:", error);

        res.status(500).json({
            error: "AI bilan bog‘lanishda xatolik yuz berdi."
        });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("🚀 LINGORA AI SERVER");
    console.log("================================");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("🤖 AI Tutor: ACTIVE");
    console.log("================================");
});