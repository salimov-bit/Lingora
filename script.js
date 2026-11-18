// ==========================================
// LINGORA — MAIN SCRIPT
// ==========================================

"use strict";

// ==========================================
// DEFAULT USER
// ==========================================

const DEFAULT_USER = {
    loggedIn: false,
    name: "",
    email: "",
    level: 1,
    xp: 0,
    xpToNext: 100,
    streak: 0,
    accuracy: 0,
    rank: null,
    dailyXP: 0,
    lastActiveDate: null,
    questionsAnswered: 0,
    correctAnswers: 0
};

let user = loadUser();

// ==========================================
// DOM HELPERS
// ==========================================

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

// ==========================================
// LOCAL STORAGE
// ==========================================

function loadUser() {
    const saved = localStorage.getItem("lingoraUser");

    if (!saved) {
        return { ...DEFAULT_USER };
    }

    try {
        return {
            ...DEFAULT_USER,
            ...JSON.parse(saved)
        };
    } catch (error) {
        console.error("Lingora user data could not be loaded.");
        return { ...DEFAULT_USER };
    }
}

function saveUser() {
    localStorage.setItem("lingoraUser", JSON.stringify(user));
}

// ==========================================
// DATE
// ==========================================

function getToday() {
    const date = new Date();

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}-${String(
        date.getDate()
    ).padStart(2, "0")}`;
}

// ==========================================
// DAILY ACTIVITY
// ==========================================

function checkDailyActivity() {
    const today = getToday();

    if (!user.lastActiveDate) {
        user.lastActiveDate = today;
        saveUser();
        return;
    }

    if (user.lastActiveDate !== today) {
        user.dailyXP = 0;

        const previous = new Date(user.lastActiveDate);
        const current = new Date(today);

        const difference =
            Math.floor(
                (current - previous) / (1000 * 60 * 60 * 24)
            );

        if (difference === 1 && user.loggedIn) {
            user.streak++;
        } else if (difference > 1) {
            user.streak = 0;
        }

        user.lastActiveDate = today;

        saveUser();
    }
}

// ==========================================
// NOTIFICATION
// ==========================================

let notificationTimer = null;

function showNotification(message) {
    const notification = $("notification");
    const notificationText = $("notificationText");

    if (!notification || !notificationText) {
        console.log(message);
        return;
    }

    notificationText.textContent = message;

    notification.classList.add("show");

    clearTimeout(notificationTimer);

    notificationTimer = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showPage(pageName) {
    const pages = $all(".page");
    const navItems = $all(".nav-item");

    pages.forEach(page => {
        page.classList.remove("active-page");
    });

    const selectedPage = $(pageName);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    navItems.forEach(item => {
        item.classList.remove("active");

        if (item.dataset.page === pageName) {
            item.classList.add("active");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Navigation buttons
document.addEventListener("click", event => {
    const button = event.target.closest("[data-page]");

    if (!button) return;

    const page = button.dataset.page;

    if (page) {
        showPage(page);
    }
});

// ==========================================
// USER UI
// ==========================================

function updateUserUI() {
    const displayName =
        user.loggedIn && user.name
            ? user.name
            : "Guest";

    const level = user.level;

    // Names
    const nameElements = [
        $("topUserName"),
        $("dashboardUserName")
    ];

    nameElements.forEach(element => {
        if (element) {
            element.textContent = displayName;
        }
    });

    // Levels
    const levelElements = [
        $("topUserLevel"),
        $("dashboardLevel")
    ];

    levelElements.forEach(element => {
        if (element) {
            element.textContent = `Level ${level}`;
        }
    });

    if ($("statLevel")) {
        $("statLevel").textContent = level;
    }

    // XP
    if ($("statXP")) {
        $("statXP").textContent = user.xp;
    }

    if ($("totalXP")) {
        $("totalXP").textContent = user.xp;
    }

    // Streak
    if ($("statStreak")) {
        $("statStreak").textContent = user.streak;
    }

    if ($("streakValue")) {
        $("streakValue").textContent = user.streak;
    }

    // Accuracy
    if ($("statAccuracy")) {
        $("statAccuracy").textContent =
            `${user.accuracy}%`;
    }

    // Rank
    if ($("rankValue")) {
        $("rankValue").textContent =
            user.rank
                ? `#${user.rank}`
                : "Unranked";
    }

    updateXPProgress();
    updateDailyGoal();
    updateProgressPage();
    updateAccountStatus();
}

// ==========================================
// XP
// ==========================================

function addXP(amount) {
    if (!user.loggedIn) {
        showNotification("Create an account to save your progress.");
        openAuth();
        return;
    }

    user.xp += amount;
    user.dailyXP += amount;

    while (user.xp >= user.xpToNext) {
        user.xp -= user.xpToNext;

        user.level++;

        user.xpToNext =
            Math.round(user.xpToNext * 1.25);

        showNotification(
            `🎉 Level Up! You are now Level ${user.level}!`
        );
    }

    saveUser();

    updateUserUI();

    showNotification(`⭐ +${amount} XP`);
}

// ==========================================
// XP PROGRESS
// ==========================================

function updateXPProgress() {
    const percentage =
        Math.min(
            (user.xp / user.xpToNext) * 100,
            100
        );

    if ($("xpProgress")) {
        $("xpProgress").style.width =
            `${percentage}%`;
    }

    if ($("xpText")) {
        $("xpText").textContent =
            `${user.xp} / ${user.xpToNext} XP`;
    }

    if ($("statXPNext")) {
        $("statXPNext").textContent =
            `${user.xp} / ${user.xpToNext} XP`;
    }
}

// ==========================================
// DAILY GOAL
// ==========================================

function updateDailyGoal() {
    const dailyGoal = 20;

    const percentage =
        Math.min(
            (user.dailyXP / dailyGoal) * 100,
            100
        );

    if ($("dailyProgress")) {
        $("dailyProgress").style.width =
            `${percentage}%`;
    }

    if ($("dailyPercent")) {
        $("dailyPercent").textContent =
            `${Math.round(percentage)}%`;
    }

    if ($("dailyXPText")) {
        $("dailyXPText").textContent =
            `${user.dailyXP} / ${dailyGoal} XP`;
    }
}

// ==========================================
// ACCOUNT
// ==========================================

const authModal = $("authModal");
const closeAuth = $("closeAuth");
const authForm = $("authForm");
const switchAuth = $("switchAuth");

const authTitle = $("authTitle");
const authDescription = $("authDescription");

const nameInput = $("nameInput");
const emailInput = $("emailInput");
const passwordInput = $("passwordInput");

let signInMode = false;

function openAuth() {
    if (authModal) {
        authModal.classList.add("show");
    }
}

function closeAuthModal() {
    if (authModal) {
        authModal.classList.remove("show");
    }
}

if (closeAuth) {
    closeAuth.addEventListener(
        "click",
        closeAuthModal
    );
}

if (authModal) {
    authModal.addEventListener("click", event => {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });
}

// ==========================================
// SWITCH AUTH MODE
// ==========================================

if (switchAuth) {
    switchAuth.addEventListener("click", event => {
        event.preventDefault();

        signInMode = !signInMode;

        if (signInMode) {
            if (authTitle) {
                authTitle.textContent =
                    "Welcome back to Lingora";
            }

            if (authDescription) {
                authDescription.textContent =
                    "Sign in to continue learning.";
            }

            if (nameInput) {
                nameInput.style.display = "none";
            }

            const button =
                authForm?.querySelector(".primary-btn");

            if (button) {
                button.textContent = "Sign In";
            }

            switchAuth.textContent =
                "Create account";

        } else {
            if (authTitle) {
                authTitle.textContent =
                    "Create your Lingora account";
            }

            if (authDescription) {
                authDescription.textContent =
                    "Start your English learning journey.";
            }

            if (nameInput) {
                nameInput.style.display = "";
            }

            const button =
                authForm?.querySelector(".primary-btn");

            if (button) {
                button.textContent =
                    "Create Account";
            }

            switchAuth.textContent =
                "Sign in";
        }
    });
}

// ==========================================
// CREATE ACCOUNT / SIGN IN
// ==========================================

if (authForm) {
    authForm.addEventListener("submit", event => {
        event.preventDefault();

        const email =
            emailInput?.value.trim();

        const password =
            passwordInput?.value.trim();

        if (!email || !password) {
            showNotification(
                "Please fill in all required fields."
            );
            return;
        }

        // ------------------------------
        // SIGN IN
        // ------------------------------

        if (signInMode) {
            const savedAccount =
                localStorage.getItem("lingoraAccount");

            if (!savedAccount) {
                showNotification(
                    "No account found. Create an account first."
                );
                return;
            }

            try {
                const account =
                    JSON.parse(savedAccount);

                if (account.email !== email) {
                    showNotification(
                        "Incorrect email."
                    );
                    return;
                }

                if (account.password !== password) {
                    showNotification(
                        "Incorrect password."
                    );
                    return;
                }

                user = {
                    ...DEFAULT_USER,
                    ...account.user,
                    loggedIn: true
                };

                saveUser();

                updateUserUI();

                closeAuthModal();

                showNotification(
                    `Welcome back, ${user.name}! 👋`
                );

                authForm.reset();

            } catch (error) {
                showNotification(
                    "Account data is corrupted."
                );
            }

            return;
        }

        // ------------------------------
        // CREATE ACCOUNT
        // ------------------------------

        const name =
            nameInput?.value.trim();

        if (!name) {
            showNotification(
                "Please enter your name."
            );
            return;
        }

        if (password.length < 6) {
            showNotification(
                "Password must be at least 6 characters."
            );
            return;
        }

        const existing =
            localStorage.getItem("lingoraAccount");

        if (existing) {
            try {
                const account =
                    JSON.parse(existing);

                if (account.email === email) {
                    showNotification(
                        "An account with this email already exists."
                    );
                    return;
                }
            } catch {}
        }

        // NEW USER ALWAYS STARTS FROM ZERO
        user = {
            ...DEFAULT_USER,

            loggedIn: true,

            name,

            email,

            level: 1,

            xp: 0,

            xpToNext: 100,

            streak: 0,

            accuracy: 0,

            rank: null,

            dailyXP: 0,

            lastActiveDate: getToday(),

            questionsAnswered: 0,

            correctAnswers: 0
        };

        localStorage.setItem(
            "lingoraAccount",
            JSON.stringify({
                email,
                password,
                user
            })
        );

        saveUser();

        updateUserUI();

        closeAuthModal();

        authForm.reset();

        showNotification(
            `Account created! Welcome to Lingora, ${name}! 🎉`
        );
    });
}

// ==========================================
// ACCOUNT BUTTONS
// ==========================================

const profileBtn = $("profileBtn");

if (profileBtn) {
    profileBtn.addEventListener("click", () => {
        if (user.loggedIn) {
            showPage("settings");
        } else {
            openAuth();
        }
    });
}

const accountBtn = $("accountBtn");

if (accountBtn) {
    accountBtn.addEventListener("click", () => {
        if (user.loggedIn) {
            logout();
        } else {
            openAuth();
        }
    });
}

// ==========================================
// LOGOUT
// ==========================================

function logout() {
    user = {
        ...DEFAULT_USER
    };

    localStorage.removeItem("lingoraUser");

    updateUserUI();

    showPage("dashboard");

    showNotification(
        "You have been logged out."
    );
}

// ==========================================
// ACCOUNT STATUS
// ==========================================

function updateAccountStatus() {
    const status = $("accountStatus");
    const button = $("accountBtn");

    if (!status || !button) {
        return;
    }

    if (user.loggedIn) {
        status.textContent =
            `Signed in as ${user.email}`;

        button.textContent = "Log Out";

    } else {
        status.textContent =
            "Guest account";

        button.textContent =
            "Create Account";
    }
}

// ==========================================
// SPEAKING
// ==========================================

const startSpeaking =
    $("startSpeaking");

if (startSpeaking) {

    startSpeaking.addEventListener(
        "click",
        () => {

            if (!user.loggedIn) {
                openAuth();
                return;
            }

            let seconds = 0;

            startSpeaking.disabled = true;

            startSpeaking.textContent =
                "🎤 Speaking 0s";

            const timer =
                setInterval(() => {

                    seconds++;

                    startSpeaking.textContent =
                        `🎤 Speaking ${seconds}s`;

                }, 1000);

            setTimeout(() => {

                clearInterval(timer);

                startSpeaking.disabled = false;

                startSpeaking.textContent =
                    "🎤 Start Speaking";

                addXP(10);

            }, 5000);
        }
    );
}

// ==========================================
// WRITING
// ==========================================

const submitWriting =
    $("submitWriting");

if (submitWriting) {

    submitWriting.addEventListener(
        "click",
        () => {

            if (!user.loggedIn) {
                openAuth();
                return;
            }

            const input =
                $("writingInput");

            if (!input) return;

            const text =
                input.value.trim();

            if (text.length < 10) {

                showNotification(
                    "Write at least 10 characters."
                );

                return;
            }

            addXP(10);

            input.value = "";

            showNotification(
                "Writing submitted successfully! ✍️"
            );
        }
    );
}

// ==========================================
// READING
// ==========================================

$all(".answer-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (!user.loggedIn) {
                    openAuth();
                    return;
                }

                const alreadyAnswered =
                    button.dataset.answered === "true";

                if (alreadyAnswered) {
                    return;
                }

                button.dataset.answered = "true";

                const correct =
                    button.classList.contains(
                        "correct-answer"
                    );

                user.questionsAnswered++;

                if (correct) {

                    user.correctAnswers++;

                    user.accuracy =
                        Math.round(
                            (
                                user.correctAnswers /
                                user.questionsAnswered
                            ) * 100
                        );

                    button.classList.add(
                        "answer-correct"
                    );

                    addXP(10);

                    showNotification(
                        "✅ Correct! +10 XP"
                    );

                } else {

                    user.accuracy =
                        Math.round(
                            (
                                user.correctAnswers /
                                user.questionsAnswered
                            ) * 100
                        );

                    button.classList.add(
                        "answer-wrong"
                    );

                    saveUser();

                    updateUserUI();

                    showNotification(
                        "❌ Not quite. Try again!"
                    );
                }
            }
        );
    });

// ==========================================
// LISTENING
// ==========================================

const playListening =
    $("playListening");

if (playListening) {

    playListening.addEventListener(
        "click",
        () => {

            if (
                !("speechSynthesis" in window)
            ) {

                showNotification(
                    "Speech is not supported by this browser."
                );

                return;
            }

            const text =
                "Hello. My name is Daniel. Nice to meet you.";

            window.speechSynthesis.cancel();

            const speech =
                new SpeechSynthesisUtterance(
                    text
                );

            speech.lang = "en-US";

            speech.rate = 0.85;

            window.speechSynthesis.speak(
                speech
            );

            showNotification(
                "🔊 Listening exercise started."
            );
        }
    );
}

// ==========================================
// VOCABULARY
// ==========================================

const vocabulary = [
    {
        word: "Improve",
        meaning: "To become better.",
        example:
            "I want to improve my English."
    },

    {
        word: "Confident",
        meaning:
            "Feeling sure about yourself.",
        example:
            "She feels confident when speaking English."
    },

    {
        word: "Achieve",
        meaning:
            "To successfully reach a goal.",
        example:
            "I want to achieve my goals."
    },

    {
        word: "Journey",
        meaning:
            "A trip or process of development.",
        example:
            "Learning English is a long journey."
    },

    {
        word: "Opportunity",
        meaning:
            "A chance to do something.",
        example:
            "English gives you more opportunities."
    },

    {
        word: "Accurate",
        meaning:
            "Correct and without mistakes.",
        example:
            "Try to give an accurate answer."
    },

    {
        word: "Develop",
        meaning:
            "To grow or improve a skill.",
        example:
            "I want to develop my speaking skills."
    }
];

let vocabularyIndex = 0;

function showVocabularyWord() {

    const item =
        vocabulary[vocabularyIndex];

    if ($("vocabWord")) {
        $("vocabWord").textContent =
            item.word;
    }

    if ($("vocabMeaning")) {
        $("vocabMeaning").textContent =
            item.meaning;
    }

    if ($("vocabExample")) {
        $("vocabExample").textContent =
            item.example;
    }
}

const nextWord =
    $("nextWord");

if (nextWord) {

    nextWord.addEventListener(
        "click",
        () => {

            vocabularyIndex++;

            if (
                vocabularyIndex >=
                vocabulary.length
            ) {
                vocabularyIndex = 0;
            }

            showVocabularyWord();

            addXP(5);
        }
    );
}

// ==========================================
// GRAMMAR
// ==========================================

const grammarQuestions = [
    {
        question:
            "She ___ to school every day.",
        answer: "goes"
    },

    {
        question:
            "They ___ playing football.",
        answer: "are"
    },

    {
        question:
            "I ___ English every day.",
        answer: "study"
    }
];

let grammarIndex = 0;

function loadGrammarQuestion() {

    const question =
        grammarQuestions[grammarIndex];

    const questionElement =
        $("grammarQuestion");

    if (questionElement) {
        questionElement.textContent =
            question.question;
    }
}

const grammarNext =
    $("grammarNext");

if (grammarNext) {

    grammarNext.addEventListener(
        "click",
        () => {

            grammarIndex++;

            if (
                grammarIndex >=
                grammarQuestions.length
            ) {
                grammarIndex = 0;
            }

            loadGrammarQuestion();
        }
    );
}

// ==========================================
// TESTS
// ==========================================

const testButtons =
    $all(".test-answer");

testButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            if (!user.loggedIn) {
                openAuth();
                return;
            }

            if (
                button.dataset.answered === "true"
            ) {
                return;
            }

            button.dataset.answered = "true";

            const correct =
                button.dataset.correct === "true" ||
                button.classList.contains(
                    "correct-answer"
                );

            user.questionsAnswered++;

            if (correct) {

                user.correctAnswers++;

                button.classList.add(
                    "answer-correct"
                );

                addXP(15);

                showNotification(
                    "✅ Correct! +15 XP"
                );

            } else {

                button.classList.add(
                    "answer-wrong"
                );

                showNotification(
                    "❌ Wrong answer."
                );
            }

            user.accuracy =
                Math.round(
                    (
                        user.correctAnswers /
                        user.questionsAnswered
                    ) * 100
                );

            saveUser();

            updateUserUI();
        }
    );
});

// ==========================================
// PROGRESS
// ==========================================

function updateProgressPage() {

    if ($("progressLevel")) {
        $("progressLevel").textContent =
            user.level;
    }

    const percentage =
        Math.min(
            (user.xp / user.xpToNext) * 100,
            100
        );

    if ($("progressBar")) {
        $("progressBar").style.width =
            `${percentage}%`;
    }

    if ($("progressText")) {
        $("progressText").textContent =
            `${user.xp} / ${user.xpToNext} XP`;
    }

    if ($("progressXP")) {
        $("progressXP").textContent =
            user.xp;
    }

    if ($("progressStreak")) {
        $("progressStreak").textContent =
            user.streak;
    }

    if ($("progressAccuracy")) {
        $("progressAccuracy").textContent =
            `${user.accuracy}%`;
    }
}

// ==========================================
// AI TUTOR
// ==========================================

async function askLingoraAI(message) {

    try {

        const response =
            await fetch("/api/ai", {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    message
                })
            });

        if (!response.ok) {
            throw new Error(
                "AI server error"
            );
        }

        const data =
            await response.json();

        return (
            data.reply ||
            "I couldn't generate an answer."
        );

    } catch (error) {

        console.error(
            "AI connection error:",
            error
        );

        return (
            "AI is not connected yet. " +
            "The frontend is ready, but the AI server needs to be started."
        );
    }
}

const sendAI =
    $("sendAI");

if (sendAI) {

    sendAI.addEventListener(
        "click",
        async () => {

            const input =
                $("aiInput");

            if (!input) return;

            const message =
                input.value.trim();

            if (!message) {

                showNotification(
                    "Type a message first."
                );

                return;
            }

            if (!user.loggedIn) {
                openAuth();
                return;
            }

            sendAI.disabled = true;

            sendAI.textContent =
                "Thinking...";

            const reply =
                await askLingoraAI(
                    message
                );

            const aiResponse =
                $("aiResponse");

            if (aiResponse) {
                aiResponse.textContent =
                    reply;
            }

            input.value = "";

            sendAI.disabled = false;

            sendAI.textContent =
                "Send";

            addXP(2);
        }
    );
}

// Enter = send AI message
const aiInput =
    $("aiInput");

if (aiInput) {

    aiInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                if (sendAI) {
                    sendAI.click();
                }
            }
        }
    );
}

// ==========================================
// SEARCH
// ==========================================

const searchInput =
    $("searchInput");

if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();

            if (!query) {
                return;
            }

            const pages = {
                dashboard: [
                    "dashboard",
                    "home"
                ],

                speaking: [
                    "speaking",
                    "speak",
                    "conversation"
                ],

                writing: [
                    "writing",
                    "write"
                ],

                reading: [
                    "reading",
                    "read"
                ],

                listening: [
                    "listening",
                    "listen"
                ],

                vocabulary: [
                    "vocabulary",
                    "word",
                    "words"
                ],

                grammar: [
                    "grammar"
                ],

                tests: [
                    "test",
                    "tests",
                    "exam"
                ],

                progress: [
                    "progress",
                    "xp",
                    "level"
                ],

                ai: [
                    "ai",
                    "tutor"
                ],

                settings: [
                    "settings",
                    "account"
                ]
            };

            for (
                const page in pages
            ) {

                const keywords =
                    pages[page];

                if (
                    keywords.some(
                        keyword =>
                            query.includes(
                                keyword
                            )
                    )
                ) {

                    showPage(page);

                    searchInput.value =
                        "";

                    return;
                }
            }

            showNotification(
                "No Lingora lesson found."
            );
        }
    );
}

// ==========================================
// CTRL + K
// ==========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            if (searchInput) {
                searchInput.focus();
            }
        }
    }
);

// ==========================================
// INITIALIZATION
// ==========================================

checkDailyActivity();

updateUserUI();

showVocabularyWord();

loadGrammarQuestion();

showPage("dashboard");

console.log(
    "🚀 Lingora is ready!"
);