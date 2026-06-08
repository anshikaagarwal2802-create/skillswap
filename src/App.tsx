import React, { useState, useEffect } from "react";
import { Sparkles, Award, Coins, BookOpen, Compass, Calendar, UserCheck, ShieldAlert, CheckCircle2, ChevronRight, User, Zap } from "lucide-react";
import { Profile } from "./types";
import MarketplaceTab from "./components/MarketplaceTab";
import RoadmapsTab from "./components/RoadmapsTab";
import VerificationTab from "./components/VerificationTab";
import LiveSessionSandbox from "./components/LiveSessionSandbox";
import MyProfileTab from "./components/MyProfileTab";

export default function App() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "roadmaps" | "verification" | "classroom" | "profile">("marketplace");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profiles/me");
      const data = await res.json();
      setCurrentUser(data);
    } catch (err) {
      console.error("Failed to load user profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoinsUpdate = (newCoins: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, skillCoins: newCoins });
    }
  };

  const handleProfileUpdated = (updatedProfile: Profile) => {
    setCurrentUser(updatedProfile);
  };

  const handleSessionBooked = () => {
    // Refresh coins balance immediately
    fetchMyProfile();
    // Redirect to classroom tab to see scheduled swap
    setActiveTab("classroom");
  };

  return (
    <div id="skillswap-app-root" className="min-h-screen bg-slate-50/70 text-slate-800 font-sans antialiased">
      {/* Top Universal Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Logo and slogan */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-indigo-950 text-amber-400 shadow-sm border border-slate-800">
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse stroke-[1.5]" />
              <div className="absolute -top-1 -right-1 px-1 py-0.5 rounded-full bg-teal-600 border border-teal-400 flex items-center justify-center text-[6px] font-black text-white shadow-sm">
                PEER
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                  Skill<span className="bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">Swap</span>
                </h1>
                <span className="text-[9px] bg-teal-50 border border-teal-100 text-teal-700 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider leading-none">
                  Community
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-widest leading-none">
                100% Peer Learning Exchange
              </p>
            </div>
          </div>

          {/* Quick info metrics bar */}
          {currentUser && (
            <div className="flex items-center gap-4">
              {/* Coin metrics */}
              <div
                title="Your Available SkillCoins. Book sessions by spending these, or earn them by teaching others."
                className="bg-amber-500/10 border border-amber-500/20 text-amber-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-help"
              >
                <Coins className="w-4 h-4 animate-bounce" />
                <span>🪙 {currentUser.skillCoins} Coins</span>
              </div>

              {/* Min stats */}
              <div className="hidden md:flex items-center gap-2 text-xs border-l border-slate-200 pl-4">
                <span className="text-slate-400">Rating: </span>
                <span className="font-bold text-slate-800">⭐️ {currentUser.rating}</span>
                <span className="text-slate-200">|</span>
                <span className="text-slate-400">Swaps: </span>
                <span className="font-bold text-slate-800">{currentUser.totalSessionsCompleted}</span>
              </div>

              {/* User Avatar tag link */}
              <button
                id="btn-goto-profile"
                onClick={() => setActiveTab("profile")}
                className="flex items-center gap-2 p-1 pr-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block">
                  {currentUser.name}
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Welcome banner */}
      <section className="bg-slate-900 text-white py-10 px-4 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient from-indigo-505/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Knowledge Exchanged, Not Sold.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              "Instead of paying expensive cash subscriptions, teach what you know to earn SkillCoins, then study something new from community mentors."
            </p>
          </div>
          <div className="hidden lg:block bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-5 max-w-xs text-xs space-y-2">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Platform Philosophy
            </span>
            <p className="text-slate-200 font-sans leading-relaxed">
              Every peer conversation, dynamic verify check, and personalized roadmap is designed to democratize high-quality skill growth for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Module Tab Selector Rails */}
        <div className="flex border-b border-slate-200 overflow-x-auto pb-px gap-1 bg-white p-1 rounded-xl border border-slate-150 shadow-xs">
          <button
            id="tab-btn-marketplace"
            onClick={() => setActiveTab("marketplace")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "marketplace"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Compass className="w-4 h-4" />
            Skill Swap Marketplace
          </button>

          <button
            id="tab-btn-roadmaps"
            onClick={() => setActiveTab("roadmaps")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "roadmaps"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            AI Study Roadmaps & Co-Pilot
          </button>

          <button
            id="tab-btn-verification"
            onClick={() => setActiveTab("verification")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "verification"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Award className="w-4 h-4" />
            AI Verification Badges
          </button>

          <button
            id="tab-btn-classroom"
            onClick={() => setActiveTab("classroom")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "classroom"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Active Classrooms & Study Review
          </button>

          <button
            id="tab-btn-profile"
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            Manage My Profile
          </button>
        </div>

        {/* Tab body rendering */}
        {loading ? (
          <div className="min-h-80 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 p-10 shadow-xs">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <span className="text-sm text-slate-500 mt-3 font-semibold animate-pulse">Initializing peer classrooms...</span>
          </div>
        ) : (
          <div className="transition-all duration-300">
            {activeTab === "marketplace" && (
              <MarketplaceTab
                currentUser={currentUser}
                onCoinsUpdate={handleCoinsUpdate}
                onSessionBooked={handleSessionBooked}
              />
            )}
            
            {activeTab === "roadmaps" && (
              <RoadmapsTab />
            )}

            {activeTab === "verification" && (
              <VerificationTab
                currentUser={currentUser}
                onProfileUpdated={handleProfileUpdated}
                onCoinsUpdate={handleCoinsUpdate}
              />
            )}

            {activeTab === "classroom" && (
              <LiveSessionSandbox
                currentUser={currentUser}
                onSessionChanged={fetchMyProfile}
                onCoinsUpdate={handleCoinsUpdate}
              />
            )}

            {activeTab === "profile" && (
              <MyProfileTab
                currentUser={currentUser}
                onProfileUpdated={handleProfileUpdated}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="text-xs text-slate-400 font-sans tracking-wide">
            SkillSwap – Teach to Earn Learning System © 2026. Built securely in full-stack Sandboxed VMS.
          </p>
          <p className="text-[10px] text-slate-400 font-sans">
            Bridging study barriers with AI-Assisted verification, complementary matching and direct SkillCoins balance credits.
          </p>
        </div>
      </footer>
    </div>
  );
}
