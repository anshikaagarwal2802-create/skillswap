// src/components/VerificationTab.tsx
import React, { useState } from "react";
import { Sparkles, Award, Shield, CheckCircle2, ChevronRight, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { QuizQuestion, Profile, QuizResult } from "../types";

interface VerificationProps {
  currentUser: Profile | null;
  onProfileUpdated: (updatedProfile: Profile) => void;
  onCoinsUpdate: (newCoins: number) => void;
}

export default function VerificationTab({ currentUser, onProfileUpdated, onCoinsUpdate }: VerificationProps) {
  const [targetSkill, setTargetSkill] = useState<string>("React");
  const [targetLevel, setTargetLevel] = useState<"Beginner" | "Intermediate" | "Advanced" | "Expert">("Intermediate");
  const [loading, setLoading] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  // Interactive testing states
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  
  // Grading result States
  const [gradingResult, setGradingResult] = useState<QuizResult | null>(null);
  const [gradingLoading, setGradingLoading] = useState<boolean>(false);

  // Suggested tags to verify quickly
  const popularSkills = ["React", "Python", "UI/UX Design", "C++", "Figma", "Node.js", "SQL"];

  const handleStartAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setQuestions([]);
      setActiveQuestionIndex(0);
      setSelectedAnswers({});
      setQuizFinished(false);
      setGradingResult(null);

      const res = await fetch("/api/verification/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: targetSkill, level: targetLevel })
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Failed to generate quiz assessment", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    const qId = questions[activeQuestionIndex].id;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: index }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    return Math.round((correctCount / questions.length) * 100);
  };

  const handleSubmitQuiz = async () => {
    if (!currentUser) return;
    try {
      setGradingLoading(true);
      const gradeScore = calculateScore();

      const res = await fetch("/api/verification/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: targetSkill,
          gradeScore,
          level: targetLevel
        })
      });

      const data = await res.json();
      if (data.success) {
        setGradingResult({
          gradeScore,
          badgeAssigned: data.badgeAssigned,
          passed: data.passed,
          feedback: data.feedback
        });
        
        onProfileUpdated(data.profile);
        onCoinsUpdate(data.currentCoins);
        setQuizFinished(true);
      }
    } catch (err) {
      console.error("Grading failed", err);
    } finally {
      setGradingLoading(false);
    }
  };

  return (
    <div id="verification-tab-root" className="space-y-6">
      {/* Intro Dashboard Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">AI Skill Badge Verification Center</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Take an AI-generated, interactive check to list skill certifications on your marketplace profile and boost matching visibility.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 self-start md:self-center bg-teal-50/60 border border-teal-100 text-teal-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>Passed checks reward: 🪙 2 SkillCoins bonus</span>
          </div>
        </div>

        {/* Current badges held by User */}
        {currentUser && (
          <div className="pt-5 mt-5 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
              Your Current Verified Badges:
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.keys(currentUser.skillsVerified).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No verified skill badges yet. Pick a skill below and start testing!</span>
              ) : (
                Object.entries(currentUser.skillsVerified).map(([skill, badge]) => (
                  <span
                    key={skill}
                    className="text-xs bg-slate-900 text-white rounded-xl py-1.5 px-3 border border-slate-950 font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Shield className="w-3.5 h-3.5 text-teal-400" />
                    <span>{skill}</span>
                    <span className="text-[10px] bg-teal-500 text-slate-950 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider relative left-1">
                      {badge}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {questions.length === 0 && !quizFinished ? (
        /* Setup / Picker Form */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-xl mx-auto space-y-5 animate-fade-in">
          <h3 className="font-bold text-slate-800 text-base">Select Skill & Target Badge Tiers</h3>

          <form onSubmit={handleStartAssessment} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Enter Skill Name</label>
              <input
                id="verify-skill-input"
                type="text"
                required
                value={targetSkill}
                onChange={(e) => setTargetSkill(e.target.value)}
                placeholder="e.g. Python, SQL, UI/UX Design, Docker, React"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all"
              />
              {/* Popular recommendations suggestions tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {popularSkills.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => setTargetSkill(sk)}
                    className={`text-[11px] font-medium font-sans px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      targetSkill === sk
                        ? "bg-teal-500 border-teal-500 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {sk}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Target Badge Level</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setTargetLevel(level as any)}
                    className={`rounded-xl py-2.5 border text-xs font-bold cursor-pointer transition-all ${
                      targetLevel === level
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-100"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic mt-1">
                Advanced and Expert require solving complex multi-layered architectural case challenges format dynamically.
              </p>
            </div>

            {loading ? (
              <button
                type="button"
                disabled
                className="w-full bg-slate-100 text-slate-400 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                Gemini Generating Technical Assessment...
              </button>
            ) : (
              <button
                type="submit"
                className="w-full bg-teal-600 text-white hover:bg-teal-700 rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-teal-50"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Assessment Quiz
              </button>
            )}
          </form>
        </div>
      ) : !quizFinished ? (
        /* Active Quiz Screen */
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm max-w-2xl mx-auto space-y-6 animate-slide-in">
          {/* Progress bar info */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] bg-teal-50 border border-teal-100 text-teal-800 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
                Review Underway
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-1">
                Skill Swap Verification: {targetSkill} ({targetLevel})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              Question {activeQuestionIndex + 1} of {questions.length}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full transition-all duration-300"
              style={{ width: `${((activeQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Active Question Box */}
          <div className="space-y-4">
            <p className="text-base text-slate-900 font-bold leading-relaxed">
              {questions[activeQuestionIndex]?.question}
            </p>

            <div className="flex flex-col gap-2.5">
              {questions[activeQuestionIndex]?.options.map((opt, oIdx) => {
                const qId = questions[activeQuestionIndex].id;
                const isSelected = selectedAnswers[qId] === oIdx;

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`text-left p-3.5 rounded-xl text-xs transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 font-medium"
                        : "bg-slate-50 hover:bg-slate-100/80 text-slate-800 border border-slate-200"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center ${
                      isSelected ? "bg-teal-500 text-slate-900" : "bg-slate-200 text-slate-600"
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="relative top-0.5 leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeQuestionIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40"
            >
              Previous
            </button>

            {activeQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                disabled={selectedAnswers[questions[activeQuestionIndex].id] === undefined}
                className="bg-slate-950 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                Next Step
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={activeQuestionIndex < questions.length - 1 || selectedAnswers[questions[activeQuestionIndex].id] === undefined || gradingLoading}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm shadow-teal-50 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {gradingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Grading Quiz...
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    Complete AI Assessment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Quiz grading results page */
        gradingResult && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm max-w-xl mx-auto text-center space-y-6 animate-fade-in">
            {gradingResult.passed ? (
              <div className="space-y-2">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-widest inline-block px-2.5 py-0.5 rounded-full">
                  Skill Verified
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  Congratulations! You Passed details.
                </h3>
                <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                  Your skill level for <strong>{targetSkill}</strong> has been updated to <strong>{targetLevel}</strong> inside the SkillSwap AI catalog.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border-2 border-red-300">
                  <XCircle className="w-8 h-8" />
                </div>
                <p className="text-[10px] bg-red-100 text-red-800 font-bold uppercase tracking-widest inline-block px-2.5 py-0.5 rounded-full">
                  Keep Studying
                </p>
                <h3 className="text-xl font-bold text-slate-900">
                  Assessment Unsuccessful
                </h3>
                <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto">
                  We require 80% to certify expertise. Your result was <strong>{gradingResult.gradeScore}%</strong>. Don't worry! Use the co-pilot to prepare and retest.
                </p>
              </div>
            )}

            {/* AI Grading result block explanations */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left text-xs leading-relaxed text-slate-600 italic">
              <p className="font-bold font-sans text-slate-800 not-italic mb-1 flex items-center gap-1 text-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Assessor Feedback Brief:
              </p>
              "{gradingResult.feedback}"
            </div>

            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={() => {
                  setQuestions([]);
                  setQuizFinished(false);
                  setGradingResult(null);
                }}
                className="flex-1 bg-slate-900 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
              >
                Go to Verification Main
              </button>
              
              {!gradingResult.passed && (
                <button
                  type="button"
                  onClick={handleStartAssessment}
                  className="flex-1 bg-teal-600 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-teal-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Retesting Now
                </button>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
