// src/components/RoadmapsTab.tsx
import React, { useState } from "react";
import { Sparkles, Map, ChevronRight, HelpCircle, FileText, ArrowRight, BookOpen, Layers, RefreshCw, AlertCircle, Copy, Check } from "lucide-react";
import { Roadmap, RoadmapStep, GeneratedContent } from "../types";

export default function RoadmapsTab() {
  const [currentSkill, setCurrentSkill] = useState<string>("C++");
  const [targetSkill, setTargetSkill] = useState<string>("React & Web Development");
  const [loading, setLoading] = useState<boolean>(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  
  // Teaching Material Co-Pilot States
  const [materialTopic, setMaterialTopic] = useState<string | null>(null);
  const [materialLoading, setMaterialLoading] = useState<boolean>(false);
  const [generatedMaterial, setGeneratedMaterial] = useState<GeneratedContent | null>(null);
  
  // Flashcard flipping state
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Practice quiz states
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  
  // Interactive UI helpers
  const [activeWeek, setActiveWeek] = useState<string>("Week 1");
  const [copierState, setCopierState] = useState<boolean>(false);

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setGeneratedMaterial(null);
      setMaterialTopic(null);
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentSkill, targetSkill })
      });
      const data = await res.json();
      setRoadmap(data);
      if (data.steps && data.steps.length > 0) {
        setActiveWeek(data.steps[0].week);
      }
    } catch (err) {
      console.error("Failed to generate roadmap", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMaterials = async (topic: string) => {
    try {
      setMaterialTopic(topic);
      setMaterialLoading(true);
      setGeneratedMaterial(null);
      
      // Reset quiz/flashcard controls
      setActiveFlashcardIndex(0);
      setIsFlipped(false);
      setSelectedAnswers({});
      setQuizSubmitted(false);

      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: roadmap?.targetSkill || targetSkill, topic })
      });
      const data = await res.json();
      setGeneratedMaterial(data);
    } catch (err) {
      console.error("Failed to generate materials", err);
    } finally {
      setMaterialLoading(false);
    }
  };

  const handleSelectAnswer = (qId: number, index: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: index }));
  };

  const handleCopyNotes = () => {
    if (!generatedMaterial) return;
    // Replace html tags with plain text for quick copy
    const textOnly = generatedMaterial.notes.replace(/<[^>]*>/g, "");
    navigator.clipboard.writeText(textOnly);
    setCopierState(true);
    setTimeout(() => setCopierState(false), 2000);
  };

  return (
    <div id="roadmaps-tab-root" className="space-y-6">
      {/* Set configuration Form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">AI Personalized Roadmaps</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Input what you know and what you want to learn. Gemini bridges the logical gaps dynamically.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateRoadmap} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Skills You Have Already</label>
            <input
              type="text"
              required
              placeholder="e.g., C++, HTML, Figma, Basic Design"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="md:col-span-1 hidden md:flex items-center justify-center pb-3">
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Skills You Want to Master</label>
            <input
              type="text"
              required
              placeholder="e.g., React & Full Stack, Machine Learning"
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl py-2.5 px-5 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100 h-10.5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Engineering Road...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Roadmap
              </>
            )}
          </button>
        </form>
      </div>

      {roadmap && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 6-Week timeline path overview */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <span className="text-xs text-indigo-600 font-bold tracking-wider uppercase">Your 6-Week Route</span>
              <span className="text-[11px] bg-slate-100 font-medium text-slate-500 px-2 py-0.5 rounded-full">
                Custom Path
              </span>
            </div>

            <div className="space-y-3">
              {roadmap.steps.map((step) => (
                <button
                  key={step.week}
                  onClick={() => setActiveWeek(step.week)}
                  className={`w-full text-left rounded-xl p-3.5 border transition-all text-sm relative flex items-start gap-3 cursor-pointer ${
                    activeWeek === step.week
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-700"
                  }`}
                >
                  <span className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center ${
                    activeWeek === step.week ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                  }`}>
                    W{step.week.match(/\d+/)?.[0]}
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-xs leading-none uppercase text-indigo-400">
                      {step.week}
                    </p>
                    <h4 className={`font-semibold ${activeWeek === step.week ? "text-white" : "text-slate-800"}`}>
                      {step.title}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active step details and Content Co-Pilot */}
          <div className="lg:col-span-2 space-y-6">
            {roadmap.steps.map((step) => {
              if (step.week !== activeWeek) return null;
              return (
                <div key={step.week} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5 animate-slide-in">
                  <div className="space-y-1">
                    <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{step.week} Milestone</span>
                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-slate-500 font-sans italic pt-1">{step.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Key Subtopics to Study:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {step.topics.map((topic) => (
                        <div
                          key={topic}
                          className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between gap-3 group hover:border-slate-300 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs text-slate-800 font-medium">{topic}</span>
                          </div>
                          
                          <button
                            onClick={() => handleGenerateMaterials(topic)}
                            disabled={materialLoading && materialTopic === topic}
                            className="bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold hover:bg-indigo-600 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            {materialLoading && materialTopic === topic ? "Writing..." : "Co-Pilot AI"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Teaching co-pilot content displays */}
            {materialTopic && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
                {/* Header branding */}
                <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Co-Pilot Output Material</span>
                      <h4 className="text-sm font-bold text-white relative bottom-0.5">{materialTopic}</h4>
                    </div>
                  </div>
                  {generatedMaterial && (
                    <button
                      onClick={handleCopyNotes}
                      className="text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copierState ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Notes!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Notes</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {materialLoading ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                    <p className="text-sm font-semibold text-slate-700 animate-pulse">
                      Gemini preparing highly authentic Study Notes, Flashcards, and Practice assessments...
                    </p>
                    <span className="text-xs text-slate-400">Takes less than 5 seconds to assemble!</span>
                  </div>
                ) : generatedMaterial ? (
                  <div className="divide-y divide-slate-100">
                    {/* Part A: Study Notes */}
                    <div className="p-6 space-y-3">
                      <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Instructor Study Guide
                      </h5>
                      {/* Elegant structured styling injected */}
                      <div
                        className="prose prose-slate prose-xs max-w-none text-slate-600 font-sans leading-relaxed text-sm space-y-3"
                        dangerouslySetInnerHTML={{ __html: generatedMaterial.notes }}
                      />
                    </div>

                    {/* Part B: Flashcards Panel */}
                    <div className="p-6 space-y-4">
                      <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Interactive Teaching Flashcards ({activeFlashcardIndex + 1} / {generatedMaterial.flashcards.length})
                      </h5>

                      <div className="flex flex-col items-center space-y-4">
                        {/* 3D-Style Card Container */}
                        <div
                          onClick={() => setIsFlipped(!isFlipped)}
                          className="w-full max-w-md h-40 rounded-xl border border-amber-200/75 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all duration-300 shadow-xs relative p-6 flex flex-col justify-center text-center items-center select-none"
                        >
                          <span className="absolute bottom-3 right-3 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                            {isFlipped ? "Answer (Front)" : "Question (Back)"}
                          </span>
                          
                          {isFlipped ? (
                            <div className="animate-fade-in space-y-1">
                              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Answer</p>
                              <p className="text-slate-800 text-sm font-medium">
                                {generatedMaterial.flashcards[activeFlashcardIndex].back}
                              </p>
                            </div>
                          ) : (
                            <div className="animate-fade-in space-y-1">
                              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Question</p>
                              <p className="text-slate-900 text-base font-bold">
                                {generatedMaterial.flashcards[activeFlashcardIndex].front}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Navigation dots */}
                        <div className="flex items-center gap-2">
                          {generatedMaterial.flashcards.map((f, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveFlashcardIndex(idx);
                                setIsFlipped(false);
                              }}
                              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                                activeFlashcardIndex === idx ? "bg-amber-500 scale-125" : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Part C: Assignment Assessment */}
                    <div className="p-6 space-y-5">
                      <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Tutor Homework Assessment
                      </h5>

                      <div className="space-y-4.5">
                        {generatedMaterial.practiceQuestions.map((q) => {
                          const isCorrect = q.correctIndex === selectedAnswers[q.id];
                          const selectedIdx = selectedAnswers[q.id];
                          
                          return (
                            <div key={q.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                              <p className="text-sm font-semibold text-slate-900">
                                {q.id}. {q.question}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                {q.options.map((opt, oIdx) => {
                                  const isSelected = selectedIdx === oIdx;
                                  let bgStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                                  
                                  if (quizSubmitted) {
                                    if (oIdx === q.correctIndex) {
                                      bgStyle = "bg-emerald-50 border-emerald-300 text-emerald-800";
                                    } else if (isSelected) {
                                      bgStyle = "bg-red-50 border-red-300 text-red-800";
                                    }
                                  } else if (isSelected) {
                                    bgStyle = "bg-indigo-50 border-indigo-400 text-indigo-800";
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectAnswer(q.id, oIdx)}
                                      disabled={quizSubmitted}
                                      className={`text-left border p-2.5 rounded-lg text-xs transition-all flex items-start gap-2 cursor-pointer ${bgStyle}`}
                                    >
                                      <span className="font-bold text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {quizSubmitted && (
                                <div className={`mt-3 p-3 rounded-lg text-xs border ${
                                  isCorrect ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" : "bg-red-50/50 border-red-100 text-red-800"
                                }`}>
                                  <p className="font-bold flex items-center gap-1">
                                    {isCorrect ? "✅ Correct Option" : "❌ Incorrect Choice"}
                                  </p>
                                  <p className="mt-1 leading-relaxed text-slate-600">{q.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2">
                        {!quizSubmitted ? (
                          <button
                            onClick={() => setQuizSubmitted(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Submit Homework Grading
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAnswers({});
                              setQuizSubmitted(false);
                            }}
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
                          >
                            Reset Homework Answers
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
