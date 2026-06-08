// src/types.ts

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  role: string;
  bio: string;
  canTeach: string[];
  wantsToLearn: string[];
  experienceLevel: string;
  skillsVerified: { [key: string]: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' };
  skillCoins: number;
  reputationScore: number; // percentage e.g. 98
  rating: number; // e.g. 4.9
  totalSessionsCompleted: number;
  isCurrentUser?: boolean;
}

export interface Session {
  id: string;
  teacherId: string;
  teacherName: string;
  learnerId: string;
  learnerName: string;
  skill: string;
  date: string;
  time: string;
  durationHours: number;
  coinsTransferred: number;
  status: 'scheduled' | 'active' | 'completed';
  rating?: number;
  feedback?: string;
  chatHistory?: { sender: string; text: string; timestamp: string }[];
  whiteboardNotes?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResult {
  gradeScore: number; // 0 - 100
  badgeAssigned: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  passed: boolean;
  feedback: string;
}

export interface RoadmapStep {
  week: string;
  title: string;
  description: string;
  topics: string[];
}

export interface Roadmap {
  sourceSkill: string;
  targetSkill: string;
  steps: RoadmapStep[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface PracticeQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedContent {
  skill: string;
  topic: string;
  notes: string;
  flashcards: Flashcard[];
  practiceQuestions: PracticeQuestion[];
}

export interface MatchRecommendation {
  profileId: string;
  compatibilityScore: number;
  commonGround: string;
  learningPathSync: string;
  mentorBenefit: string;
}
