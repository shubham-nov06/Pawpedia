import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:4173", process.env.FRONTEND_URL].filter(Boolean),
}));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ status: "Pawpedia Backend Running! 🐾" });
});

// ── Groq Route ────────────────────────────────────────────────────────────────
app.post("/api/groq", async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid messages" });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages,
                max_tokens: 1200,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json({ error: err });
        }

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });
    } catch (err) {
        console.error("Groq error:", err);
        res.status(500).json({ error: "Groq API failed" });
    }
});

// ── Pexels Route ──────────────────────────────────────────────────────────────
app.get("/api/pexels/:animal", async (req, res) => {
    try {
        const animalName = decodeURIComponent(req.params.animal);

        const response = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(animalName + " animal")}&per_page=3&orientation=landscape`,
            {
                headers: { Authorization: process.env.PEXELS_KEY },
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: "Pexels API failed" });
        }

        const data = await response.json();
        const url = data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null;
        res.json({ url });
    } catch (err) {
        console.error("Pexels error:", err);
        res.status(500).json({ error: "Pexels API failed" });
    }
});

app.listen(PORT, () => {
    console.log(`🐾 Pawpedia backend running on port ${PORT}`);
});