// ==========================================
// LINGORA — LESSON DATA
// ==========================================

const lingoraLessons = {

    speaking: [
        {
            id: 1,
            title: "Introduce Yourself",
            level: "A1",
            xp: 10,
            question: "Tell us about yourself.",
            example: "My name is Alex. I am 14 years old. I live in Uzbekistan."
        },
        {
            id: 2,
            title: "My Daily Routine",
            level: "A1",
            xp: 15,
            question: "Describe your typical day.",
            example: "I wake up at 7 o'clock. I go to school and study English."
        },
        {
            id: 3,
            title: "My Hobbies",
            level: "A2",
            xp: 20,
            question: "What do you like doing in your free time?",
            example: "I like playing games, listening to music and learning new things."
        }
    ],

    writing: [
        {
            id: 1,
            title: "Write About Yourself",
            level: "A1",
            xp: 10,
            task: "Write 3–5 sentences about yourself."
        },
        {
            id: 2,
            title: "My Best Friend",
            level: "A1",
            xp: 15,
            task: "Write a short paragraph about your best friend."
        },
        {
            id: 3,
            title: "My Future Plans",
            level: "A2",
            xp: 20,
            task: "Write about what you want to do in the future."
        }
    ],

    reading: [
        {
            id: 1,
            title: "A Normal Day",
            level: "A1",
            xp: 10,
            text: `
                Alex wakes up at seven o'clock every morning.
                He eats breakfast and goes to school.
                After school, he comes home and does his homework.
                In the evening, he likes reading books.
            `,
            question: "What does Alex do after school?",
            options: [
                "He goes to sleep.",
                "He does his homework.",
                "He goes to work.",
                "He plays football."
            ],
            answer: 1
        },

        {
            id: 2,
            title: "Learning English",
            level: "A2",
            xp: 15,
            text: `
                Emma started learning English two years ago.
                At first, English was difficult for her.
                She practiced every day by reading books,
                watching videos and speaking with her friends.
                Now she can communicate confidently in English.
            `,
            question: "How did Emma improve her English?",
            options: [
                "She stopped studying.",
                "She only played games.",
                "She practiced every day.",
                "She moved to another country."
            ],
            answer: 2
        }
    ],

    listening: [
        {
            id: 1,
            title: "Basic Conversation",
            level: "A1",
            xp: 10,
            text: "Hello! My name is Daniel. Nice to meet you.",
            question: "What is the speaker's name?",
            options: [
                "David",
                "Daniel",
                "Alex",
                "John"
            ],
            answer: 1
        },

        {
            id: 2,
            title: "At School",
            level: "A1",
            xp: 15,
            text: "I have English class every Monday and Wednesday.",
            question: "When does the speaker have English class?",
            options: [
                "Monday and Wednesday",
                "Tuesday and Friday",
                "Every day",
                "Saturday only"
            ],
            answer: 0
        }
    ],

    vocabulary: [
        {
            id: 1,
            word: "Improve",
            meaning: "To become better.",
            example: "I want to improve my English."
        },
        {
            id: 2,
            word: "Confident",
            meaning: "Feeling sure about yourself.",
            example: "She feels confident when speaking English."
        },
        {
            id: 3,
            word: "Journey",
            meaning: "A trip or a process of development.",
            example: "Learning English is a long journey."
        },
        {
            id: 4,
            word: "Achieve",
            meaning: "To successfully reach a goal.",
            example: "I want to achieve my English goals."
        }
    ],

    grammar: [
        {
            id: 1,
            title: "Present Simple",
            level: "A1",
            xp: 10,
            question: "She ___ English every day.",
            options: [
                "study",
                "studies",
                "studying",
                "studied"
            ],
            answer: 1
        },

        {
            id: 2,
            title: "Past Simple",
            level: "A2",
            xp: 15,
            question: "Yesterday, I ___ to school.",
            options: [
                "go",
                "going",
                "went",
                "gone"
            ],
            answer: 2
        },

        {
            id: 3,
            title: "Future Simple",
            level: "A2",
            xp: 20,
            question: "I ___ learn English tomorrow.",
            options: [
                "will",
                "was",
                "did",
                "am"
            ],
            answer: 0
        }
    ]
};


// ==========================================
// LINGORA LESSON HELPERS
// ==========================================

function getLessons(type) {
    if (!lingoraLessons[type]) {
        return [];
    }

    return lingoraLessons[type];
}


function getLesson(type, id) {
    const lessons = getLessons(type);

    return lessons.find(lesson => lesson.id === Number(id));
}


function getTotalLessons() {
    let total = 0;

    Object.keys(lingoraLessons).forEach(type => {
        total += lingoraLessons[type].length;
    });

    return total;
}


function getLessonStats(type) {
    const lessons = getLessons(type);

    return {
        total: lessons.length,
        xp: lessons.reduce((sum, lesson) => {
            return sum + (lesson.xp || 0);
        }, 0)
    };
}


// ==========================================
// LINGORA — VOCABULARY
// ==========================================

let currentVocabularyIndex = 0;

function showVocabularyWord() {

    const words = lingoraLessons.vocabulary;

    if (!words.length) return;

    const word = words[currentVocabularyIndex];

    const wordElement = document.getElementById("vocabWord");
    const meaningElement = document.getElementById("vocabMeaning");
    const exampleElement = document.getElementById("vocabExample");

    if (wordElement) {
        wordElement.textContent = word.word;
    }

    if (meaningElement) {
        meaningElement.textContent = word.meaning;
    }

    if (exampleElement) {
        exampleElement.textContent = `"${word.example}"`;
    }
}


function nextVocabularyWord() {

    const words = lingoraLessons.vocabulary;

    if (!words.length) return;

    currentVocabularyIndex++;

    if (currentVocabularyIndex >= words.length) {
        currentVocabularyIndex = 0;
    }

    showVocabularyWord();
}


// ==========================================
// LINGORA — LESSON PROGRESS
// ==========================================

function getCompletedLessons() {

    try {
        return JSON.parse(
            localStorage.getItem("lingoraCompletedLessons")
        ) || {};
    } catch (error) {
        return {};
    }
}


function saveCompletedLesson(type, id) {

    const completed = getCompletedLessons();

    if (!completed[type]) {
        completed[type] = [];
    }

    if (!completed[type].includes(Number(id))) {
        completed[type].push(Number(id));
    }

    localStorage.setItem(
        "lingoraCompletedLessons",
        JSON.stringify(completed)
    );
}


function isLessonCompleted(type, id) {

    const completed = getCompletedLessons();

    return (
        completed[type] &&
        completed[type].includes(Number(id))
    );
}


// ==========================================
// LINGORA — INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    showVocabularyWord();

    console.log(
        `Lingora loaded ${getTotalLessons()} lessons.`
    );

});