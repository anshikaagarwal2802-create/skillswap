// src/components/MyProfileTab.tsx
import React, { useState, useEffect } from "react";
import { User, Shield, Info, Edit, Check, CreditCard, Award, Coins } from "lucide-react";
import { Profile } from "../types";

interface ProfileProps {
  currentUser: Profile | null;
  onProfileUpdated: (updatedProfile: Profile) => void;
}

export default function MyProfileTab({ currentUser, onProfileUpdated }: ProfileProps) {
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  
  // Teaches / Wants to Learn string tags
  const [canTeachString, setCanTeachString] = useState<string>("");
  const [wantsToLearnString, setWantsToLearnString] = useState<string>("");
  
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setRole(currentUser.role || "");
      setBio(currentUser.bio || "");
      setExperienceLevel(currentUser.experienceLevel || "Intermediate");
      setCanTeachString((currentUser.canTeach || []).join(", "));
      setWantsToLearnString((currentUser.wantsToLearn || []).join(", "));
    }
  }, [currentUser]);

  const handleSubmitProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setSaving(true);
      setSuccess(false);

      const parsedCanTeach = canTeachString
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const parsedWantsToLearn = wantsToLearnString
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch("/api/profiles/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          bio,
          experienceLevel,
          canTeach: parsedCanTeach,
          wantsToLearn: parsedWantsToLearn
        })
      });

      const data = await res.json();
      if (data.success) {
        onProfileUpdated(data.profile);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Error updating profile", err);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div id="my-profile-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Profile Overview Card */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 h-fit">
        <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-slate-100">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-150 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{currentUser.name}</h3>
            <p className="text-xs text-teal-600 font-semibold mt-0.5">{currentUser.role}</p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1.5 px-3.5 rounded-full text-xs text-amber-500 font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>🪙 {currentUser.skillCoins} Coins Balance</span>
          </div>
        </div>

        {/* User stats index */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rating Score</span>
            <p className="text-lg font-bold text-slate-800">⭐️ {currentUser.rating}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100/80 p-3 rounded-xl space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completed Sessions</span>
            <p className="text-lg font-bold text-slate-800">{currentUser.totalSessionsCompleted}</p>
          </div>
        </div>

        {/* Rules index brief */}
        <div className="bg-teal-50/50 border border-teal-100/60 p-4 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            "Teach to Earn Learning" System
          </h4>
          <p className="text-[11px] text-teal-700/90 leading-relaxed font-sans">
            You currently hold <strong>🪙 {currentUser.skillCoins} SkillCoins</strong>. You can:
          </p>
          <ul className="text-[10px] text-teal-700/90 list-disc list-inside space-y-1 font-sans pl-1">
            <li>Instruct others to obtain 🪙 1 Coin/Hour</li>
            <li>Purchase 1-on-1 swaps from verified mentors</li>
            <li>Take assessments in Verification Center to gain coins and badges</li>
          </ul>
        </div>
      </div>

      {/* Edit Form Section */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Edit className="w-4 h-4 text-slate-500" />
          Update Skill Profiles & Portfolio Parameters
        </h3>

        <form onSubmit={handleSubmitProfileUpdate} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Your Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Your Role / Headline</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Biography / Learning Goals Summary</label>
            <textarea
              required
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other students about your tech stack, goals, or what makes you unique..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Skills You Can Teach</label>
                <span className="text-[9px] text-slate-400">Comma-separated</span>
              </div>
              <input
                type="text"
                value={canTeachString}
                onChange={(e) => setCanTeachString(e.target.value)}
                placeholder="e.g. React, UI/UX Design, CSS"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Skills You Want to Learn</label>
                <span className="text-[9px] text-slate-400">Comma-separated</span>
              </div>
              <input
                type="text"
                value={wantsToLearnString}
                onChange={(e) => setWantsToLearnString(e.target.value)}
                placeholder="e.g. Algorithms, Python, Docker"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">General Tutoring Experience Tier</label>
            <div className="flex gap-2">
              {["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`flex-1 rounded-xl py-2 border text-xs font-bold cursor-pointer transition-all ${
                    experienceLevel === level
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-105"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-3.5 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Skill profile successfully updated in matching catalogs! Ready to swap.</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-slate-950 text-white hover:bg-slate-800 font-bold text-xs rounded-xl px-5 py-2.5 transition-all shadow-md shadow-slate-100 cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
