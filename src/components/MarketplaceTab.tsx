// src/components/MarketplaceTab.tsx
import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, BookOpen, Search, User, Coins, Award, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { Profile, MatchRecommendation, Session } from "../types";

interface MarketplaceProps {
  currentUser: Profile | null;
  onCoinsUpdate: (newCoins: number) => void;
  onSessionBooked: () => void;
}

export default function MarketplaceTab({ currentUser, onCoinsUpdate, onSessionBooked }: MarketplaceProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "teach" | "learn">("all");
  
  // AI Matching state
  const [aiMatchingActive, setAiMatchingActive] = useState<boolean>(false);
  const [matchingLoading, setMatchingLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<{ [id: string]: MatchRecommendation }>({});
  
  // Schedule Form State
  const [bookingProfile, setBookingProfile] = useState<Profile | null>(null);
  const [bookingSkill, setBookingSkill] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("2026-06-10");
  const [bookingTime, setBookingTime] = useState<string>("14:00");
  const [bookingDuration, setBookingDuration] = useState<number>(1);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profiles");
      const data = await res.json();
      // Exclude current user from public marketplace view
      setProfiles(data.filter((p: Profile) => p.id !== "user-current"));
    } catch (err) {
      console.error("Error fetching profiles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiMatching = async () => {
    if (aiMatchingActive) {
      setAiMatchingActive(false);
      setMatches({});
      return;
    }

    try {
      setMatchingLoading(true);
      setAiMatchingActive(true);
      const res = await fetch("/api/match", { method: "POST" });
      const data = await res.json();
      if (data.matches && Array.isArray(data.matches)) {
        const matchObj: { [id: string]: MatchRecommendation } = {};
        data.matches.forEach((m: MatchRecommendation) => {
          matchObj[m.profileId] = m;
        });
        setMatches(matchObj);
      }
    } catch (err) {
      console.error("AI Matching failed", err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const openBookingModal = (profile: Profile) => {
    setBookingProfile(profile);
    // Auto select first skill they teach
    setBookingSkill(profile.canTeach[0] || "");
    setBookingError(null);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProfile || !currentUser) return;

    if (currentUser.skillCoins < bookingDuration) {
      setBookingError(`Insufficient SkillCoins. You need ${bookingDuration} but have ${currentUser.skillCoins}. Please teach standard sessions to earn more coins!`);
      return;
    }

    try {
      setIsSubmittingBooking(true);
      setBookingError(null);
      const res = await fetch("/api/sessions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: bookingProfile.id,
          skill: bookingSkill,
          date: bookingDate,
          time: bookingTime,
          durationHours: bookingDuration
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book session");
      }

      onCoinsUpdate(data.currentCoins);
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingProfile(null);
        setBookingSuccess(false);
        onSessionBooked();
      }, 2000);
    } catch (err: any) {
      setBookingError(err.message || "Something went wrong.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Filter logic
  const filteredProfiles = profiles.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.role.toLowerCase().includes(query) ||
      p.canTeach.some((s) => s.toLowerCase().includes(query)) ||
      p.wantsToLearn.some((s) => s.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterType === "teach") {
      return p.canTeach.some((s) => s.toLowerCase().includes(query));
    }
    if (filterType === "learn") {
      return p.wantsToLearn.some((s) => s.toLowerCase().includes(query));
    }
    return true;
  });

  return (
    <div id="marketplace-tab-root" className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            🤝 Peer-to-Peer Learning Swap
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse active students, collaborate via dual study sessions, or swap services without money.
          </p>
        </div>
        
        {/* Toggle AI Match Alignments */}
        <button
          id="btn-ai-matching"
          onClick={handleRunAiMatching}
          disabled={matchingLoading}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            aiMatchingActive
              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-100"
              : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${matchingLoading ? "animate-spin" : "animate-pulse"}`} />
          {matchingLoading
            ? "Analyzing Alignments..."
            : aiMatchingActive
            ? "Disable AI Match Scores"
            : "Run AI Match Alignment"}
        </button>
      </div>

      {/* Main Grid Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Search Filters</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input
              id="search-skills"
              type="text"
              placeholder="Search skills, names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Filter By Type</label>
            <div className="flex flex-col gap-1.5 mt-1">
              <button
                id="filter-all"
                onClick={() => setFilterType("all")}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Community Members
              </button>
              <button
                id="filter-teach"
                onClick={() => setFilterType("teach")}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  filterType === "teach"
                    ? "bg-teal-50 text-teal-800 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Can Teach My Queries
              </button>
              <button
                id="filter-learn"
                onClick={() => setFilterType("learn")}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  filterType === "learn"
                    ? "bg-indigo-50 text-indigo-800 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Wants to Learn My Teaches
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Standard fee: <strong>1 Coin/Hour</strong></span>
            </div>
            <p>Every completed hour of tutoring transfers 1 SkillCoin to the teacher.</p>
          </div>
        </div>

        {/* Public Catalog cards */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="min-h-60 flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
              <span className="text-sm text-slate-500 mt-3 font-medium">Scanning community matching parameters...</span>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="min-h-60 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
              <span className="text-slate-800 font-medium">No results found for your filters!</span>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Try typing different search criteria, or reset selection filters to all members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((p) => {
                const matchRec = matches[p.id];
                return (
                  <div
                    key={p.id}
                    id={`profile-card-${p.id}`}
                    className={`bg-white rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between hover:shadow-md ${
                      matchRec && aiMatchingActive
                        ? "border-amber-300 ring-2 ring-amber-50"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      {/* Badge Score Overlay */}
                      {matchRec && aiMatchingActive && (
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-2.5 mb-4 text-xs font-medium relative overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              AI Match Compatibility
                            </span>
                            <span className="font-bold text-sm bg-white/20 px-2 py-0.5 rounded-md">
                              {matchRec.compatibilityScore}% Match
                            </span>
                          </div>
                          <div className="mt-2 text-white/90 space-y-1">
                            <p>🧬 <strong className="text-white">Mutual Swap Alignment:</strong> {matchRec.learningPathSync}</p>
                            <p>🤝 <strong className="text-white">Overlap Ground:</strong> {matchRec.commonGround}</p>
                            <p>🎓 <strong className="text-white">Tutor ROI:</strong> {matchRec.mentorBenefit}</p>
                          </div>
                        </div>
                      )}

                      {/* Header profile info */}
                      <div className="flex items-start gap-4">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-100"
                        />
                        <div className="space-y-0.5">
                          <h4 className="font-semibold text-slate-900 text-base">{p.name}</h4>
                          <p className="text-xs text-teal-600 font-medium">{p.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-slate-50 font-medium text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md">
                              {p.experienceLevel} Level
                            </span>
                            <span className="text-xs text-amber-500 font-bold">
                              ⭐️ {p.rating}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({p.totalSessionsCompleted} swaps)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-500 line-clamp-3 mt-4 italic font-sans">
                        "{p.bio}"
                      </p>

                      {/* Skills tags list */}
                      <div className="mt-4 space-y-2.5">
                        <div className="space-y-1">
                          <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Teaches:</h5>
                          <div className="flex flex-wrap gap-1">
                            {p.canTeach.map((tech) => {
                              const badge = p.skillsVerified[tech];
                              return (
                                <span
                                  key={tech}
                                  className="text-[11px] bg-teal-50/70 border border-teal-100 text-teal-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5"
                                >
                                  {tech}
                                  {badge && (
                                    <span
                                      title={`AI Verified ${badge}`}
                                      className="w-2 h-2 rounded-full bg-teal-500 inline-block"
                                    />
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wants to Learn:</h5>
                          <div className="flex flex-wrap gap-1">
                            {p.wantsToLearn.map((tech) => (
                              <span
                                key={tech}
                                className="text-[11px] bg-indigo-50/70 border border-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        <Coins className="w-3.5 h-3.5" />
                        <span>🪙 {p.skillCoins} Coins</span>
                      </div>
                      <button
                        id={`btn-book-${p.id}`}
                        onClick={() => openBookingModal(p)}
                        className="bg-slate-950 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Calendar className="w-3 h-3" />
                        Schedule Swap
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Dialog Modal overlay */}
      {bookingProfile && (
        <div id="booking-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-100 shadow-xl overflow-hidden relative">
            <h3 className="text-lg font-semibold text-slate-900">Schedule Skill Swap</h3>
            <p className="text-xs text-slate-500 mt-1">
              You are planning a bidirectional session with <strong>{bookingProfile.name}</strong>.
            </p>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Pick a Teachable Skill from {bookingProfile.name}</label>
                <select
                  value={bookingSkill}
                  onChange={(e) => setBookingSkill(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:outline-none"
                >
                  {bookingProfile.canTeach.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Time (UTC)</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 flex justify-between">
                  <span>Swap Session Duration</span>
                  <span className="text-amber-500">🪙 {bookingDuration} SkillCoins</span>
                </label>
                <div className="flex gap-2 mt-1">
                  {[1, 2, 3].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setBookingDuration(hours)}
                      className={`flex-1 rounded-lg py-2 border text-xs font-medium cursor-pointer ${
                        bookingDuration === hours
                          ? "bg-amber-500 border-amber-500 text-white shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {hours} Hour{hours > 1 && "s"} ({hours} Coin{hours > 1 && "s"})
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Coins will be temporarily locked and transferred to {bookingProfile.name} upon successful completion of the sandbox session.
                </p>
              </div>

              {/* Error Box */}
              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Success Box */}
              {bookingSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Swap scheduled successfully! Initializing classroom portal...</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookingProfile(null)}
                  disabled={isSubmittingBooking}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking || bookingSuccess}
                  className="flex-1 bg-teal-600 text-white rounded-lg py-2 text-xs font-semibold hover:bg-teal-700 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                >
                  {isSubmittingBooking ? "Booking Swap..." : "Confirm Swap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
