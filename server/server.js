require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// GEMINI
// ===============================

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY topilmadi!");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ===============================
// DATABASE
// ===============================

const dbPath = path.join(__dirname, "lingora.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,

        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,

        premium INTEGER DEFAULT 0,
        premium_start TEXT,
        premium_end TEXT,

        learned_words INTEGER DEFAULT 0,
        daily_progress INTEGER DEFAULT 0,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

// ===============================
// JWT
// ===============================

const JWT_SECRET =
    process.env.JWT_SECRET || "lingora-change-this-secret";

function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        JWT_SECRET,
        {
            expiresIn: "30d"
        }
    );
}

// ===============================
// AUTH MIDDLEWARE
// ===============================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Avtorizatsiya talab qilinadi."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            error: "Token yaroqsiz yoki muddati tugagan."
        });
    }
}

// ===============================
// USER HELPER
// ===============================

function getUserById(id) {
    return db.prepare(`
        SELECT
            id,
            name,
            email,
            level,
            xp,
            streak,
            premium,
            premium_start,
            premium_end,
            learned_words,
            daily_progress,
            created_at
        FROM users
        WHERE id = ?
    `).get(id);
}

// ===============================
// REGISTER
// ===============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "Barcha maydonlarni to‘ldiring."
            });
        }

        if (name.length < 2) {
            return res.status(400).json({
                error: "Ism kamida 2 ta belgidan iborat bo‘lishi kerak."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Parol kamida 6 ta belgidan iborat bo‘lishi kerak."
            });
        }

        const existingUser = db.prepare(`
            SELECT id FROM users WHERE email = ?
        `).get(email);

        if (existingUser) {
            return res.status(409).json({
                error: "Bu email bilan akkaunt allaqachon mavjud."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = db.prepare(`
            INSERT INTO users (
                name,
                email,
                password,
                level,
                xp,
                streak,
                premium,
                learned_words,
                daily_progress
            )
            VALUES (?, ?, ?, 1, 0, 0, 0, 0, 0)
        `).run(
            name,
            email,
            hashedPassword
        );

        const user = getUserById(result.lastInsertRowid);

        const token = createToken(user);

        return res.status(201).json({
            message: "Akkaunt muvaffaqiyatli yaratildi.",
            token,
            user
        });

    } catch (error) {
        console.error("❌ Register error:", error);

        return res.status(500).json({
            error: "Akkaunt yaratishda xatolik yuz berdi."
        });
    }
});

// ===============================
// LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                error: "Email va parolni kiriting."
            });
        }

        const user = db.prepare(`
            SELECT * FROM users WHERE email = ?
        `).get(email);

        if (!user) {
            return res.status(401).json({
                error: "Email yoki parol noto‘g‘ri."
            });
        }

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordCorrect) {
            return res.status(401).json({
                error: "Email yoki parol noto‘g‘ri."
            });
        }

        const safeUser = getUserById(user.id);

        const token = createToken(safeUser);

        return res.json({
            message: "Login muvaffaqiyatli.",
            token,
            user: safeUser
        });

    } catch (error) {
        console.error("❌ Login error:", error);

        return res.status(500).json({
            error: "Login vaqtida xatolik yuz berdi."
        });
    }
});

// ===============================
// CURRENT USER
// ===============================

app.get("/api/auth/me", authenticateToken, (req, res) => {
    try {
        const user = getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: "Foydalanuvchi topilmadi."
            });
        }

        return res.json({
            user
        });

    } catch (error) {
        console.error("❌ /me error:", error);

        return res.status(500).json({
            error: "Foydalanuvchi ma'lumotlarini olishda xatolik."
        });
    }
});

// ===============================
// UPDATE PROFILE
// ===============================

app.put("/api/user/profile", authenticateToken, (req, res) => {
    try {
        const name = String(req.body.name || "").trim();

        if (!name || name.length < 2) {
            return res.status(400).json({
                error: "Ism noto‘g‘ri."
            });
        }

        db.prepare(`
            UPDATE users
            SET name = ?
            WHERE id = ?
        `).run(name, req.user.id);

        const user = getUserById(req.user.id);

        return res.json({
            message: "Profil yangilandi.",
            user
        });

    } catch (error) {
        console.error("❌ Profile error:", error);

        return res.status(500).json({
            error: "Profilni yangilashda xatolik."
        });
    }
});

// ===============================
// USER STATS
// ===============================

app.get("/api/user/stats", authenticateToken, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT
                level,
                xp,
                streak,
                premium,
                premium_start,
                premium_end,
                learned_words,
                daily_progress
            FROM users
            WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: "Foydalanuvchi topilmadi."
            });
        }

        return res.json({
            stats: user
        });

    } catch (error) {
        console.error("❌ Stats error:", error);

        return res.status(500).json({
            error: "Statistikani olishda xatolik."
        });
    }
});

// ===============================
// ADD XP
// ===============================

app.post("/api/user/xp", authenticateToken, (req, res) => {
    try {
        let amount = Number(req.body.amount);

        if (!Number.isFinite(amount)) {
            return res.status(400).json({
                error: "XP miqdori noto‘g‘ri."
            });
        }

        amount = Math.floor(amount);

        if (amount < 0) {
            return res.status(400).json({
                error: "XP manfiy bo‘lishi mumkin emas."
            });
        }

        if (amount > 100) {
            amount = 100;
        }

        const user = db.prepare(`
            SELECT level, xp
            FROM users
            WHERE id = ?
        `).get(req.user.id);

        if (!user) {
            return res.status(404).json({
                error: "Foydalanuvchi topilmadi."
            });
        }

        let newXP = user.xp + amount;
        let newLevel = user.level;

        const XP_PER_LEVEL = 100;

        while (newXP >= XP_PER_LEVEL) {
            newXP -= XP_PER_LEVEL;
            newLevel++;
        }

        db.prepare(`
            UPDATE users
            SET xp = ?, level = ?
            WHERE id = ?
        `).run(
            newXP,
            newLevel,
            req.user.id
        );

        const updatedUser = getUserById(req.user.id);

        return res.json({
            message: "XP qo‘shildi.",
            user: updatedUser
        });

    } catch (error) {
        console.error("❌ XP error:", error);

        return res.status(500).json({
            error: "XP qo‘shishda xatolik."
        });
    }
});

// ===============================
// AI TUTOR
// ===============================

app.post("/api/ai", authenticateToken, async (req, res) => {
    try {
        const message = String(req.body.message || "");

        if (!message.trim()) {
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

        // AI ishlatilganda 2 XP va avtomatik Level Up
const aiUser = db.prepare(`
    SELECT level, xp
    FROM users
    WHERE id = ?
`).get(req.user.id);

if (aiUser) {
    let newXP = aiUser.xp + 2;
    let newLevel = aiUser.level;

    const XP_PER_LEVEL = 100;

    while (newXP >= XP_PER_LEVEL) {
        newXP -= XP_PER_LEVEL;
        newLevel++;
    }

    db.prepare(`
        UPDATE users
        SET xp = ?, level = ?
        WHERE id = ?
    `).run(newXP, newLevel, req.user.id);
}
        return res.json({
            reply: response.text
        });

    } catch (error) {
        console.error("❌ Gemini error:", error);

        return res.status(500).json({
            error: "AI bilan bog‘lanishda xatolik yuz berdi."
        });
    }
});

// ===============================
// FRONTEND
// ===============================

const frontendPath = path.join(__dirname, "..");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(
        path.join(frontendPath, "index.html")
    );
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
    console.error("❌ Server error:", err);

    res.status(500).json({
        error: "Server xatosi yuz berdi."
    });
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("🚀 LINGORA AI SERVER");
    console.log("================================");
    console.log(`🌐 Port: ${PORT}`);
    console.log("🤖 AI Tutor: ACTIVE");
    console.log("🔐 Authentication: ACTIVE");
    console.log("🗄️ SQLite Database: ACTIVE");
    console.log("⭐ XP System: ACTIVE");
    console.log("================================");
});
