// server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Session } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with custom user agent and robust fallback warning
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI Features will operate using fallback generators.");
}

// -------------------------------------------------------------
// IN-MEMORY STATE FOR SKILLSWAP AI PROTOTYPE
// -------------------------------------------------------------
let profiles = [
  {
    id: "user-current",
    name: "Naomi Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    role: "CS Student & Frontend Enthusiast",
    bio: "Passionate about creating modern, accessible user interfaces. Currently learning React & Figma, but looking to master backend algorithms and database integrations to become a solid full-stack developer.",
    canTeach: ["React", "UI/UX Design", "Figma", "CSS/Tailwind"],
    wantsToLearn: ["Data Structures & Algorithms", "C++", "Python", "Node.js"],
    experienceLevel: "Intermediate",
    skillsVerified: {
      "React": "Intermediate" as const,
      "Figma": "Advanced" as const
    },
    skillCoins: 8,
    reputationScore: 98,
    rating: 4.9,
    totalSessionsCompleted: 12,
    isCurrentUser: true
  },
  {
    id: "peer-1",
    name: "Aarav Sharma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    role: "Computer Science Graduate",
    bio: "Core C++ fan and DSA specialist. Spends weekends solving high-complexity problems. I want to improve my frontend and visual design skills because my apps currently look like terminal grids.",
    canTeach: ["Data Structures & Algorithms", "C++", "System Design"],
    wantsToLearn: ["React", "UI/UX Design", "Tailwind CSS"],
    experienceLevel: "Advanced",
    skillsVerified: {
      "C++": "Expert" as const,
      "Data Structures & Algorithms": "Expert" as const
    },
    skillCoins: 4,
    reputationScore: 100,
    rating: 5.0,
    totalSessionsCompleted: 24
  },
  {
    id: "peer-2",
    name: "Chloe Dubois",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    role: "Product Designer @ Figma Community",
    bio: "Figma master and digital illustrator. I love styling experiences, picking color palettes, and creating user flows. Want to learn JavaScript & basic React to prototype my designs directly in code.",
    canTeach: ["UI/UX Design", "Figma", "Digital Illustration", "Framer"],
    wantsToLearn: ["React", "JavaScript", "CSS/Tailwind"],
    experienceLevel: "Expert",
    skillsVerified: {
      "Figma": "Expert" as const,
      "UI/UX Design": "Expert" as const
    },
    skillCoins: 5,
    reputationScore: 95,
    rating: 4.8,
    totalSessionsCompleted: 18
  },
  {
    id: "peer-3",
    name: "Kenji Sato",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    role: "Machine Learning Engineer",
    bio: "Python developer specialized in deep learning, notebooks, and pandas. I teach core Python syntax up to ML. Looking to build responsive web interfaces for my AI models and learn Figma styling.",
    canTeach: ["Python", "Machine Learning", "SQL", "Pandas"],
    wantsToLearn: ["React", "UI/UX Design", "Figma"],
    experienceLevel: "Expert",
    skillsVerified: {
      "Python": "Expert" as const,
      "Machine Learning": "Advanced" as const
    },
    skillCoins: 3,
    reputationScore: 97,
    rating: 4.7,
    totalSessionsCompleted: 15
  },
  {
    id: "peer-4",
    name: "Sarah Jenkins",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    role: "Backend Architect",
    bio: "Love solving database scaling issues, Docker files, and microservices in Node.js. Wanting to pick up mobile development or learn more about UI systems like Figma to collaborate with designers better.",
    canTeach: ["Node.js", "Docker", "Database Integration", "MongoDB"],
    wantsToLearn: ["Figma", "React Native", "TypeScript"],
    experienceLevel: "Advanced",
    skillsVerified: {
      "Node.js": "Advanced" as const,
      "Database Integration": "Advanced" as const
    },
    skillCoins: 6,
    reputationScore: 99,
    rating: 4.9,
    totalSessionsCompleted: 19
  }
];

let sessions: Session[] = [
  {
    id: "session-1",
    teacherId: "peer-1",
    teacherName: "Aarav Sharma",
    learnerId: "user-current",
    learnerName: "Naomi Chen",
    skill: "Data Structures & Algorithms",
    date: "2026-06-10",
    time: "15:00",
    durationHours: 1,
    coinsTransferred: 1,
    status: "scheduled",
    chatHistory: [
      { sender: "Aarav Sharma", text: "Hey Naomi! Ready to master Binary Search Trees in our upcoming session?", timestamp: "10:15 AM" },
      { sender: "Naomi Chen", text: "Absolutely, Aarav! I have some tricky questions ready.", timestamp: "10:20 AM" }
    ],
    whiteboardNotes: "# Binary Search Trees (BST)\n- Left node < Parent < Right node\n- Inorder traversal returns sorted order!\n- Time complexity for operations: O(log N) average."
  },
  {
    id: "session-2",
    teacherId: "user-current",
    teacherName: "Naomi Chen",
    learnerId: "peer-2",
    learnerName: "Chloe Dubois",
    skill: "React",
    date: "2026-06-12",
    time: "10:00",
    durationHours: 2,
    coinsTransferred: 2,
    status: "scheduled",
    chatHistory: [],
    whiteboardNotes: ""
  },
  {
    id: "history-1",
    teacherId: "user-current",
    teacherName: "Naomi Chen",
    learnerId: "peer-1",
    learnerName: "Aarav Sharma",
    skill: "CSS/Tailwind",
    date: "2026-06-05",
    time: "14:00",
    durationHours: 1,
    coinsTransferred: 1,
    status: "completed",
    rating: 5,
    feedback: "Naomi explained Tailwind responsive utility classes so easily! Built a beautiful landing page layout in just 45 minutes of active swap tutoring."
  }
];

// Helper fallback generators for when Gemini is loading/key is missing
const fallbackQuizzes: { [key: string]: any[] } = {
  "default": [
    {
      id: 1,
      question: "Which of the following describes the key rule of a Peer-to-Peer Skill Swap?",
      options: [
        "Paying real monetary subscriptions for certificate tracks",
        "Earning SkillCoins by teaching others, then using those coins to learn",
        "Waiting for an institutional professor to grade video submissions",
        "Paying dynamic cash bids to secure high-rating mentors"
      ],
      correctIndex: 1,
      explanation: "SkillSwap AI relies on the 'Teach to Earn Learning' credit flow (SkillCoins) avoiding monetary bars."
    },
    {
      id: 2,
      question: "What is the best way to earn reputation score on SkillSwap AI?",
      options: [
        "By leaving toxic ratings",
        "By being highly active, tutoring on-time, and receiving positive feedback",
        "By purchasing reputation boosts via credit card",
        "By taking 100 assessments without booking human swaps"
      ],
      correctIndex: 1,
      explanation: "Being robust, on-time, and keeping high student rating yields pristine reputation scores."
    }
  ]
};

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// API status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", localizedTime: new Date().toISOString(), geminiLoaded: !!ai });
});

// Profiles Endpoint
app.get("/api/profiles", (req, res) => {
  res.json(profiles);
});

// Get current user profile
app.get("/api/profiles/me", (req, res) => {
  const me = profiles.find(p => p.isCurrentUser);
  res.json(me);
});

// Update Profile
app.post("/api/profiles/update", (req, res) => {
  const { bio, canTeach, wantsToLearn, experienceLevel, name, role } = req.body;
  const meIdx = profiles.findIndex(p => p.isCurrentUser);
  if (meIdx > -1) {
    profiles[meIdx] = {
      ...profiles[meIdx],
      name: name || profiles[meIdx].name,
      role: role || profiles[meIdx].role,
      bio: bio ?? profiles[meIdx].bio,
      canTeach: Array.isArray(canTeach) ? canTeach : profiles[meIdx].canTeach,
      wantsToLearn: Array.isArray(wantsToLearn) ? wantsToLearn : profiles[meIdx].wantsToLearn,
      experienceLevel: experienceLevel || profiles[meIdx].experienceLevel
    };
    return res.json({ success: true, profile: profiles[meIdx] });
  }
  res.status(404).json({ error: "Current user profile not found." });
});

// Sessions Endpoints
app.get("/api/sessions", (req, res) => {
  res.json(sessions);
});

// Book a session
app.post("/api/sessions/book", (req, res) => {
  const { teacherId, skill, date, time, durationHours } = req.body;

  const teacher = profiles.find(p => p.id === teacherId);
  const me = profiles.find(p => p.isCurrentUser);

  if (!teacher || !me) {
    return res.status(404).json({ error: "Teacher or learner profile not found." });
  }

  const cost = Number(durationHours || 1);

  if (me.skillCoins < cost) {
    return res.status(400).json({ error: `Insufficient SkillCoins. You need ${cost} SkillCoins but only have ${me.skillCoins}.` });
  }

  // Deduct coins as hold
  me.skillCoins -= cost;

  const newSession: Session = {
    id: `session-${Date.now()}`,
    teacherId: teacher.id,
    teacherName: teacher.name,
    learnerId: me.id,
    learnerName: me.name,
    skill: skill,
    date: date || new Date().toISOString().split('T')[0],
    time: time || "14:00",
    durationHours: cost,
    coinsTransferred: cost,
    status: "scheduled",
    chatHistory: [],
    whiteboardNotes: `# Welcome to your Live Session!\n\n**Topic**: ${skill}\n**Mentor**: ${teacher.name}\n\nUse the chat on the side to talk, code together or communicate!`
  };

  sessions.unshift(newSession);
  res.json({ success: true, session: newSession, currentCoins: me.skillCoins });
});

// Complete scheduled session & rate
app.post("/api/sessions/complete", (req, res) => {
  const { sessionId, rating, feedback, whiteboardNotes } = req.body;
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session tracker not found." });
  }

  if (session.status !== "completed") {
    session.status = "completed";
    session.rating = Number(rating) || 5;
    session.feedback = feedback || "Great session!";
    if (whiteboardNotes !== undefined) {
      session.whiteboardNotes = whiteboardNotes;
    }

    // Transfer coins to teacher permanently
    const teacher = profiles.find(p => p.id === session.teacherId);
    if (teacher) {
      teacher.skillCoins += session.coinsTransferred;
      teacher.totalSessionsCompleted += 1;
      
      // Dynamic updates of rating
      const previousReviews = sessions.filter(s => s.teacherId === teacher.id && s.status === 'completed' && s.rating);
      const scores = previousReviews.map(s => s.rating || 5);
      const avgScore = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      teacher.rating = parseFloat(avgScore.toFixed(1));
    }

    const learner = profiles.find(p => p.id === session.learnerId);
    if (learner) {
      learner.totalSessionsCompleted += 1;
    }
  }

  res.json({ success: true, session });
});

// Send Chat Message inside Active Session
app.post("/api/sessions/chat", (req, res) => {
  const { sessionId, sender, text } = req.body;
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  const msg = {
    sender: sender || "System",
    text: text || "",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  if (!session.chatHistory) session.chatHistory = [];
  session.chatHistory.push(msg);
  res.json({ success: true, msg });
});

// Update Whiteboard content
app.post("/api/sessions/whiteboard", (req, res) => {
  const { sessionId, whiteboardNotes } = req.body;
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  session.whiteboardNotes = whiteboardNotes;
  res.json({ success: true });
});

// -------------------------------------------------------------
// GEMINI API FOR MATCHING Engine
// -------------------------------------------------------------
app.post("/api/match", async (req, res) => {
  const me = profiles.find(p => p.isCurrentUser);
  if (!me) return res.status(404).json({ error: "User profile not found." });

  // Exclude current user from candidate matching
  const candidates = profiles.filter(p => !p.isCurrentUser);

  if (!ai) {
    // Generate simple local logic model if api key is missing
    const scores = candidates.map(c => {
      // Direct overlaps
      let matchesTeach = me.wantsToLearn.filter(s => c.canTeach.includes(s));
      let matchesLearn = me.canTeach.filter(s => c.wantsToLearn.includes(s));
      let score = 50 + (matchesTeach.length * 20) + (matchesLearn.length * 10);
      if (score > 98) score = 98;
      
      return {
        profileId: c.id,
        compatibilityScore: score,
        commonGround: `Shared interests in ${matchesTeach.concat(matchesLearn).join(", ") || "Technical Swapping"}.`,
        learningPathSync: `Swap of ${matchesTeach.join(", ") || "Requested Skills"} for ${matchesLearn.join(", ") || "Taught Skills"}.`,
        mentorBenefit: `Allows bidirectional sharing of specialized knowledge at ${c.experienceLevel} tier.`
      };
    });
    return res.json({ matches: scores });
  }

  try {
    const prompt = `
      You are an AI Matching assistant for SkillSwap AI.
      We have a primary user:
      Name: ${me.name}
      Can Teach: ${JSON.stringify(me.canTeach)}
      Wants to Learn: ${JSON.stringify(me.wantsToLearn)}
      Bio: ${me.bio}
      Experience Level: ${me.experienceLevel}

      We have peer learning candidates:
      ${candidates.map(c => `
        - Participant ID: "${c.id}"
          Name: "${c.name}"
          Can Teach: ${JSON.stringify(c.canTeach)}
          Wants to Learn: ${JSON.stringify(c.wantsToLearn)}
          Bio: "${c.bio}"
          Experience level: "${c.experienceLevel}"
      `).join("\n")};

      Compare the primary user against each peer candidate and compute matching compatibility.
      Overlapping interests are extremely valuable: when Candidate A can teach what User wants to learn, and Candidate A wants to learn what User can teach.
      Provide compatibility score out of 100, common ground points, exact learning path sync, and why it is beneficial. No fluff. Return JSON exactly.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  profileId: { type: Type.STRING },
                  compatibilityScore: { type: Type.INTEGER, description: "Compatibility score percentage out of 100" },
                  commonGround: { type: Type.STRING, description: "Key overlapping technologies or alignments" },
                  learningPathSync: { type: Type.STRING, description: "How can-teach overlaps wants-to-learn" },
                  mentorBenefit: { type: Type.STRING, description: "Why this exchange is highly rewarding for both individuals" }
                },
                required: ["profileId", "compatibilityScore", "commonGround", "learningPathSync", "mentorBenefit"]
              }
            }
          },
          required: ["matches"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Gemini Match error", err);
    res.status(500).json({ error: "Failed to run AI Match engine.", details: err.message });
  }
});

// -------------------------------------------------------------
// GEMINI API FOR SKILL VERIFICATION QUIZ
// -------------------------------------------------------------
app.post("/api/verification/quiz", async (req, res) => {
  const { skill, level } = req.body;
  const targetSkill = skill || "React";
  const difficulty = level || "Intermediate";

  if (!ai) {
    // Return mock fallback quiz structure immediately
    const mockQuestions = [
      {
        id: 1,
        question: `In modern ${targetSkill}, which concept describes the core architecture of state management?`,
        options: [
          "Direct property mutation inside component structures",
          "Immutable updates triggering React schedules and virtual DOM renders",
          "Global globalThis overrides in system config",
          "Continuous setInterval hooks updating absolute window models"
        ],
        correctIndex: 1,
        explanation: "Immutable updates allow components to safely track changes and avoid side effects."
      },
      {
        id: 2,
        question: `How does the browser handle async rendering for a complex system in ${targetSkill}?`,
        options: [
          "Blocking all paint frames until compilation processes",
          "Using dynamic requestIdleCallback or Fiber prioritized schedulers",
          "Throwing system runtime faults",
          "Directly rendering raw binary streams"
        ],
        correctIndex: 1,
        explanation: "Fiber split updates into prioritize blocks, keeping frames active and avoiding page freezes."
      },
      {
        id: 3,
        question: `What represents a primary anti-pattern when designing container hooks in ${targetSkill}?`,
        options: [
          "Using clean state handlers locked inside dependency arrays",
          "Executing immediate infinite side-effects inside raw block renders without hooks",
          "Using descriptive memo properties",
          "Exporting components inside custom directories"
        ],
        correctIndex: 1,
        explanation: "Updating states inside raw block renders forces infinite render loops and crashes the tab."
      },
      {
        id: 4,
        question: `Under ${targetSkill} architecture, what is standard practice for memory optimizations?`,
        options: [
          "Declaring infinite globally-shared non-garbage collected classes",
          "Using useMemo or useCallback hooks to prevent deep structural referential differences during render updates",
          "Restarting the device on each tab navigation",
          "Running calculations compiled side-by-side in custom parallel ports"
        ],
        correctIndex: 1,
        explanation: "useMemo preserves object references between renders, reducing unnecessary layout updates."
      },
      {
        id: 5,
        question: `Which is a recommended testing paradigm to secure long-term reliable code in ${targetSkill}?`,
        options: [
          "Manual human cursor checking without scripts on production servers",
          "Rigorous component unit tests paired with integration workflows mimicking user interactions",
          "Never checking codes until deployment completes",
          "Copy pasting from online community forums without review"
        ],
        correctIndex: 1,
        explanation: "Unit and integration tests guarantee components are responsive and preserve state safely."
      }
    ];

    return res.json({ questions: mockQuestions });
  }

  try {
    const prompt = `
      You are an expert technical interviewer and AI assessor for SkillSwap AI.
      Create a highly technical 5-question multiple choice test to evaluate if a user is at the "${difficulty}" tier of expertise for "${targetSkill}".
      The questions must be highly authentic and testing intermediate-to-expert knowledge (not super basic trivia).
      For each question, provide 4 options, a correctIndex (0-3), and a clear constructive explanation of WHY that option is correct.
      Output ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER, description: "0-indexed correctly matching index inside options array (0 to 3)" },
                  explanation: { type: Type.STRING, description: "Why that answer is correct and educational feedback" }
                },
                required: ["id", "question", "options", "correctIndex", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Gemini Quiz error", err);
    res.status(500).json({ error: "Failed to generate AI Quiz.", details: err.message });
  }
});

// Update skills verification badges
app.post("/api/verification/grade", (req, res) => {
  const { skill, gradeScore, level } = req.body;
  const me = profiles.find(p => p.isCurrentUser);

  if (!me) {
    return res.status(404).json({ error: "User not found." });
  }

  const passed = gradeScore >= 80;
  let feedback = `You scored ${gradeScore}%. We require 80% to award the Skill Badge. Keep learning and try again!`;
  
  if (passed) {
    me.skillsVerified[skill] = level as any;
    // Reward bonus coins for successful expertise verification!
    me.skillCoins += 2;
    feedback = `Congratulations! You scored ${gradeScore}% and earned the official "${level}" Verification Badge. You've been rewarded with 🪙 2 SkillCoins bonus as a qualified peer-tutor!`;
  }

  res.json({
    success: true,
    passed,
    gradeScore,
    badgeAssigned: passed ? level : null,
    feedback,
    currentCoins: me.skillCoins,
    profile: me
  });
});

// -------------------------------------------------------------
// GEMINI API FOR ROADMAPS GENERATOR
// -------------------------------------------------------------
app.post("/api/roadmap", async (req, res) => {
  const { currentSkill, targetSkill } = req.body;

  if (!currentSkill || !targetSkill) {
    return res.status(400).json({ error: "currentSkill and targetSkill are required." });
  }

  if (!ai) {
    const fallbackRoadmap = {
      sourceSkill: currentSkill,
      targetSkill: targetSkill,
      steps: [
        {
          week: "Week 1",
          title: "Foundational Bridging to Core Syntax",
          description: `Initialize target structures using your ${currentSkill} background to build clean syntactic pathways.`,
          topics: ["Variable bounds & Types", "Basic logical flow comparisons", "Standard compiler parameters"]
        },
        {
          week: "Week 2",
          title: "Introduction to Core Architectures",
          description: `Explore structural schemas and model hierarchies to align systems accurately.`,
          topics: ["Object declarations", "State models", "Basic file modularity"]
        },
        {
          week: "Week 3",
          title: "Developing Mock APIs & Basic I/O",
          description: "Establish foundational data streams and wire up user input elements with responsive functions.",
          topics: ["API configurations", "Event-handlers", "State bindings"]
        },
        {
          week: "Week 4",
          title: "Integrating Persistent Storage Databases",
          description: `Create structured queries and connect local repositories to expand features.`,
          topics: ["Schema layouts", "Basic query CRUD", "Relational links"]
        },
        {
          week: "Week 5",
          title: "Advanced Optimization & Parallel Systems",
          description: "Optimize calculations, reduce garbage footprints, and establish modular files.",
          topics: ["Memory bounds", "Caching logic", "Refactoring and testing"]
        },
        {
          week: "Week 6",
          title: "Full-Scale Deployment & Portfolio Release",
          description: "Deploy client packages and configure network tunnels to share with peers on SkillSwap.",
          topics: ["Build configurations", "Static file CDNs", "Sharing on SkillSwap marketplace"]
        }
      ]
    };
    return res.json(fallbackRoadmap);
  }

  try {
    const prompt = `
      You are an AI learning path advisor for SkillSwap AI.
      Create a step-by-step 6-week personalized learning roadmap for a student who currently knows "${currentSkill}" and wants to master "${targetSkill}".
      Leverage their existing background to bridge common logic, structures, or concepts, making learning faster and more intuitive.
      For each of the 6 weeks, provide a week-indicator (e.g. "Week 1"), a week goal title, a concise helpful description bridging their background, and list 3 key topics (sub-bullets) they must study.
      Output ONLY clean valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sourceSkill: { type: Type.STRING },
            targetSkill: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  week: { type: Type.STRING, description: "e.g., 'Week 1', 'Week 2' etc." },
                  title: { type: Type.STRING, description: "A high-level engaging week title" },
                  description: { type: Type.STRING, description: "Detailed guide or goal of the week bridging targetSkill to currentSkill" },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 highly tangible subtopics to learn"
                  }
                },
                required: ["week", "title", "description", "topics"]
              }
            }
          },
          required: ["sourceSkill", "targetSkill", "steps"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Gemini Roadmap error", err);
    res.status(500).json({ error: "Failed to generate AI Roadmap.", details: err.message });
  }
});

// -------------------------------------------------------------
// GEMINI API FOR GENERATING TUTORING MATERIALS
// -------------------------------------------------------------
app.post("/api/content/generate", async (req, res) => {
  const { skill, topic } = req.body;
  const targetSkill = skill || "React Router";
  const targetTopic = topic || "Dynamic Nested Routes";

  if (!ai) {
    // Return mock teaching materials directly
    const fallbackMat = {
      skill: targetSkill,
      topic: targetTopic,
      notes: `<h3>Mastering ${targetTopic} in ${targetSkill}</h3>
      <p>Peer tutoring is highly engaging! When teaching <strong>${targetTopic}</strong>, make sure to frame it as dividing larger problems into isolated chunks.</p>
      <p>Key guidelines include:</p>
      <ul>
        <li><strong>Structural Isolation:</strong> Always keep individual elements modular and dry.</li>
        <li><strong>Reactive State updates:</strong> Ensure data properties flow downward and trigger renders deterministically.</li>
        <li><strong>Clean Hook Declarations:</strong> Keep side operations packed cleanly inside dependency hooks.</li>
      </ul>`,
      flashcards: [
        { front: "What is the primary role of layout routes?", back: "To render shared shell wrappers (like sidebars/headers) alongside varying child components seamlessly." },
        { front: "How is dynamic parameters fetched inside a path?", back: "By defining routes with a colon parameter (e.g. user/:id) and retrieving them with the useParams hooks." },
        { front: "What prevents dynamic infinite rendering when matching routes?", back: "Matching precise paths explicitly and stabilizing routing states securely." }
      ],
      practiceQuestions: [
        {
          id: 1,
          question: `Which helper represents the modern standard to trigger programmatic navigating inside a tutor module of ${targetSkill}?`,
          options: ["window.location.replace()", "The useNavigate() hook invocation", "Dynamic <a href> link overrides", "A complex router loop process"],
          correctIndex: 1,
          explanation: "useNavigate() utilizes the internal History Context API, allowing smooth client transitions without page refreshes."
        },
        {
          id: 2,
          question: `What represents the main error to check for if a nested child route is NOT displaying at all?`,
          options: ["Whether the child component was created as a class", "Missing the <Outlet /> layout component inside the parent route component", "A missing package declaration in index.html", "Overriding standard css variables"],
          correctIndex: 1,
          explanation: "The parent route MUST render an <Outlet /> component so the router compiles where to mount child trees."
        }
      ]
    };
    return res.json(fallbackMat);
  }

  try {
    const prompt = `
      You are an AI content co-pilot for SkillSwap AI.
      A peer-mentor is preparing to teach a lesson on "${targetTopic}" as part of their "${targetSkill}" course.
      To support them with materials, generate:
      1. Complete, styled HTML-formatted notes (e.g. utilizing <h3>, <p>, <ul>, <strong>, <code> tag blocks). Emphasize core concepts, simple illustrations, and practical rules in around 2-3 detailed paragraphs.
      2. Exactly 3 Q&A Flashcards (each having a "front" side question and a "back" side answer).
      3. Exactly 2 Multiple choice practice questions (each having an "id", "question", an array of 4 "options", "correctIndex" (0-3), and an "explanation" detailing why it is correct).
      No markdown wrapper on JSON, output strict valid string JSON matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skill: { type: Type.STRING },
            topic: { type: Type.STRING },
            notes: { type: Type.STRING, description: "Elegant styled notes with header tags and strong descriptions." },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "Short prompt or question" },
                  back: { type: Type.STRING, description: "Clear precise explanation or answer" }
                },
                required: ["front", "back"]
              }
            },
            practiceQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctIndex", "explanation"]
              }
            }
          },
          required: ["skill", "topic", "notes", "flashcards", "practiceQuestions"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Gemini Content Generate error", err);
    res.status(500).json({ error: "Failed to generate teaching materials.", details: err.message });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC BUILD MIDDLEWARE
// -------------------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Development Server Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build items from static folder...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SkillSwap AI] Listening on http://localhost:${PORT}`);
  });
}

setupVite().catch(err => {
  console.error("Failed to start server", err);
});
