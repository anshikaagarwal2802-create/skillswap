// src/components/LiveSessionSandbox.tsx
import React, { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Mic, MicOff, Send, CheckCircle, Star, Sparkles, MessageSquare, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import { Session, Profile } from "../types";

interface LiveSessionProps {
  currentUser: Profile | null;
  onSessionChanged: () => void;
  onCoinsUpdate: (newCoins: number) => void;
}

export default function LiveSessionSandbox({ currentUser, onSessionChanged, onCoinsUpdate }: LiveSessionProps) {
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Classroom media states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);

  // Chat/Editor inputs
  const [chatMessage, setChatMessage] = useState<string>("");
  const [whiteboardText, setWhiteboardText] = useState<string>("");
  const [savingWhiteboard, setSavingWhiteboard] = useState<boolean>(false);
  const [aiReponding, setAiResponding] = useState<boolean>(false);

  // Grading review modal states
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessionsList(data);
      
      // Auto select first active scheduled session
      const scheduled = data.find((s: Session) => s.status === "scheduled" || s.status === "active");
      if (scheduled) {
        selectSession(scheduled);
      }
    } catch (err) {
      console.error("Error retrieving sessions", err);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = (sess: Session) => {
    setActiveSession(sess);
    setWhiteboardText(sess.whiteboardNotes || "");
    setCameraActive(false);
    setMicActive(false);
  };

  const handleSendChatMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    if (!activeSession || !currentUser) return;

    const textToSend = customText || chatMessage;
    if (!textToSend.trim()) return;

    try {
      const res = await fetch("/api/sessions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          sender: currentUser.name,
          text: textToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            chatHistory: [...(prev.chatHistory || []), data.msg]
          };
        });
        if (!customText) setChatMessage("");
      }
    } catch (err) {
      console.error("Failed to send chat", err);
    }
  };

  const handleSaveWhiteboard = async () => {
    if (!activeSession) return;
    try {
      setSavingWhiteboard(true);
      const res = await fetch("/api/sessions/whiteboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          whiteboardNotes: whiteboardText
        })
      });
      if (res.ok) {
        setActiveSession((prev) => prev ? { ...prev, whiteboardNotes: whiteboardText } : null);
      }
    } catch (err) {
      console.error("Error saving whiteboard", err);
    } finally {
      setSavingWhiteboard(false);
    }
  };

  // Simulated AI response helper - very fun!
  const triggerAiPeerResponse = async () => {
    if (!activeSession || !currentUser) return;
    try {
      setAiResponding(true);
      
      const teacherMode = activeSession.teacherId === currentUser.id;
      const peerName = teacherMode ? activeSession.learnerName : activeSession.teacherName;
      
      // We will ask Gemini to generate an in-character message regarding what is written on whiteboard or chats
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skill: activeSession.skill,
          topic: `Simulate a quick on-topic question or answer in our 1-on-1 tutoring session.
          The user is currently studying with me. On our shared board is defined:
          "${whiteboardText.slice(0, 300)}"
          Generate a short chat reply as if you are ${peerName}.`
        })
      });
      const data = await res.json();
      
      // Standard message fallback
      let rawText = `This is a very neat concept in ${activeSession.skill}! Let's make sure we test it together.`;
      if (data.flashcards && data.flashcards.length > 0) {
        rawText = `Interesting query! Could you help clarify: ${data.flashcards[0].front}?`;
      }

      const chatRes = await fetch("/api/sessions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          sender: peerName,
          text: rawText
        })
      });
      const chatData = await chatRes.json();
      if (chatData.success) {
        setActiveSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            chatHistory: [...(prev.chatHistory || []), chatData.msg]
          };
        });
      }
    } catch (err) {
      console.error("Failed to trigger AI peer message", err);
    } finally {
      setAiResponding(false);
    }
  };

  const handleFinishAndSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !currentUser) return;

    try {
      setSubmittingReview(true);
      // Save whiteboard one last time
      await handleSaveWhiteboard();

      const res = await fetch("/api/sessions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          rating: ratingInput,
          feedback: feedbackInput,
          whiteboardNotes: whiteboardText
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowReviewModal(false);
        setActiveSession(null);
        onSessionChanged(); // Refresh global coins & state logs
        fetchActiveSessions();
      }
    } catch (err) {
      console.error("Failed to finalize session review", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const scheduledSessions = sessionsList.filter((s) => s.status === "scheduled" || s.status === "active");
  const pastSessions = sessionsList.filter((s) => s.status === "completed");

  return (
    <div id="classroom-tab-root" className="space-y-6">
      {/* Selector/Title */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            📺 Live Peer-Tutoring Classrooms
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Simulate secure 1-on-1 scheduled swaps. Exchange knowledge code, solve roadmaps, and submit coins feedback.
          </p>
        </div>

        {scheduledSessions.length > 0 && (
          <div className="flex gap-2">
            <select
              value={activeSession?.id || ""}
              onChange={(e) => {
                const found = sessionsList.find((s) => s.id === e.target.value);
                if (found) selectSession(found);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700"
            >
              {scheduledSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.skill} study swap with {s.teacherId === currentUser?.id ? s.learnerName : s.teacherName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 p-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
          <span className="text-sm text-slate-500 mt-3 font-semibold animate-pulse">Entering learning corridors...</span>
        </div>
      ) : !activeSession ? (
        /* Empty / Scheduling prompt & Past History Log */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
            <h3 className="font-bold text-slate-800 text-lg">No Active Sessions scheduled right now</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5">
              Navigate to the 🤝 Peer Marketplace to book a mentoring session or list skills and wait for matches.
            </p>
          </div>

          {/* Past reviews index */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm h-fit">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Swap Exchange History</h4>
            {pastSessions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No historical complete sessions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {pastSessions.map((s) => (
                  <div key={s.id} className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 leading-snug">{s.skill}</span>
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500" /> {s.rating}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic font-sans leading-relaxed">
                      "{s.feedback}"
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Tutor: {s.teacherName}</span>
                      <span>Coins Swap: 🪙{s.coinsTransferred}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SPlit Classroom Sandbox Workspace layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-in">
          {/* Main whiteboard editor Left column */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
            <div className="space-y-3.5">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 font-bold text-xs flex items-center justify-center">
                    📖
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-none">
                      Shared Collaborative Scratchpad
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Type code, solve equations, design prompts, or outline session notes in real-time.
                    </p>
                  </div>
                </div>

                {/* Webcam simulated indicators controls */}
                <div className="flex items-center gap-1.5 shadow-sm rounded-lg border border-slate-100 p-1 bg-slate-50">
                  <button
                    onClick={() => setCameraActive(!cameraActive)}
                    className={`p-2 rounded-md transition-all cursor-pointer ${
                      cameraActive ? "bg-teal-500 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title="Toggle Video Connection"
                  >
                    {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setMicActive(!micActive)}
                    className={`p-2 rounded-md transition-all cursor-pointer ${
                      micActive ? "bg-teal-500 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title="Toggle Mic Connection"
                  >
                    {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cameras streams simulation overlays */}
              {cameraActive && (
                <div className="grid grid-cols-2 gap-4 h-32 animate-fade-in mb-3">
                  <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-950 flex items-center justify-center">
                    <span className="absolute bottom-2 left-2 text-[10px] uppercase font-bold tracking-widest text-slate-300">
                      You (Naomi Chen)
                    </span>
                    <video className="w-full h-full object-cover opacity-80" />
                    <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping top-3 right-3" />
                  </div>

                  <div className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-950 flex items-center justify-center">
                    <span className="absolute bottom-2 left-2 text-[10px] uppercase font-bold tracking-widest text-slate-300 animate-pulse">
                      Peer (Live Connection)
                    </span>
                    <div className="p-3 text-center text-slate-400">
                      <div className="w-2.5 h-2.5 bg-teal-500 rounded-full mx-auto animate-bounce mb-1" />
                      <p className="text-[9px] font-semibold text-teal-400">Audio/Video active</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Central Text scratchpad */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Markdown Board:</label>
                  <button
                    onClick={handleSaveWhiteboard}
                    disabled={savingWhiteboard}
                    className="text-[10px] text-teal-600 font-semibold hover:text-teal-700 cursor-pointer"
                  >
                    {savingWhiteboard ? "Saving to Cloud..." : "Force Save Board"}
                  </button>
                </div>

                <textarea
                  id="scratchpad-editor"
                  value={whiteboardText}
                  onChange={(e) => setWhiteboardText(e.target.value)}
                  onBlur={handleSaveWhiteboard}
                  placeholder="Paste study materials, code snippets, or notes here..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500/30 focus:border-teal-500 transition-all min-h-[300px]"
                />
              </div>
            </div>

            {/* Complete action footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 italic">
                Fees held on lock: 🪙{activeSession.coinsTransferred} SkillCoins. Complete study to payout tutor reputation.
              </span>
              <button
                id="btn-complete-session"
                onClick={() => setShowReviewModal(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-sm shadow-emerald-50 cursor-pointer flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Complete Peer Study Session
              </button>
            </div>
          </div>

          {/* Right Column chat sidebar widget */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[500px]">
            <div className="space-y-3.5 flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Direct Session Messaging
                </span>
                
                <button
                  onClick={triggerAiPeerResponse}
                  disabled={aiReponding}
                  className="text-[10px] bg-amber-500 hover:bg-amber-600 text-white rounded px-2 py-0.5 font-bold cursor-pointer transition-all flex items-center gap-0.5 shrink-0"
                  title="Force peer companion to respond intelligently regarding topic using Gemini AI parameters"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {aiReponding ? "Thinking..." : "AI Response"}
                </button>
              </div>

              {/* Chat Scroll List container */}
              <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1 text-xs">
                {activeSession.chatHistory && activeSession.chatHistory.length > 0 ? (
                  activeSession.chatHistory.map((chat, idx) => {
                    const isMe = chat.sender === currentUser?.name;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <span className="text-[10px] text-slate-400 font-semibold mb-0.5">{chat.sender}</span>
                        <div className={`p-2.5 rounded-xl border ${
                          isMe
                            ? "bg-slate-900 border-slate-900 text-white rounded-tr-none"
                            : "bg-slate-50 border-slate-200 text-slate-800 rounded-tl-none"
                        }`}>
                          <p className="leading-relaxed font-sans">{chat.text}</p>
                        </div>
                        <span className="text-[8px] text-slate-400 mt-0.5">{chat.timestamp}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 italic">
                    <p className="text-[11px]">Chat box is completely quiet.</p>
                    <p className="text-[10px] mt-1">Hello each other, coordinate audio meetings, or prompt the companion above!</p>
                  </div>
                )}
              </div>

              {/* Chat Send Form inputs */}
              <form onSubmit={(e) => handleSendChatMessage(e)} className="flex items-center gap-2 shrink-0 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="Write message to peer..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-lg shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete and review modal rating overlay */}
      {showReviewModal && activeSession && (
        <div id="review-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 border border-slate-100 shadow-xl overflow-hidden relative">
            <h3 className="text-lg font-semibold text-slate-900">Finish and Submit Swap Review</h3>
            <p className="text-xs text-slate-500 mt-1">
              Finalizing the session will unlock the 🪙 <strong>{activeSession.coinsTransferred} SkillCoins</strong> fee parameters and update reputation files.
            </p>

            <form onSubmit={handleFinishAndSubmitReview} className="mt-5 space-y-4">
              {/* Star controls */}
              <div className="space-y-1.5 flex flex-col items-center">
                <label className="text-xs font-bold text-slate-700">Tutor Reputation Quality Rating</label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-2 rounded-xl mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      className="text-amber-400 hover:scale-110 transition-all cursor-pointer p-1"
                    >
                      <Star className={`w-6 h-6 ${ratingInput >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Feedback input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Feedback / Contribution Details</label>
                <textarea
                  required
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="e.g. Naomi was an absolute gold mine for learning modern state containers! Built responsive layouts in minutes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none min-h-[80px]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={submittingReview}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Back to Session
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  {submittingReview ? "Submitting Review..." : "Confirm Finalize Swap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
