/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CAMPAIGN_CHAPTERS,
  CampaignChapter,
  CampaignProgress,
  loadCampaignProgress,
} from "../game/campaign";
import { Language } from "../types/game";
import { sound } from "../game/audio";
import {
  Crown,
  Lock,
  Star,
  Play,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  Sparkles,
  MapPin,
  Shield,
  Swords,
  Trophy,
} from "lucide-react";

interface CampaignMapModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onSelectChapter: (chapterId: number) => void;
}

export const CampaignMapModal: React.FC<CampaignMapModalProps> = ({
  isOpen,
  lang,
  onClose,
  onSelectChapter,
}) => {
  const [progress, setProgress] = useState<CampaignProgress>(() => loadCampaignProgress());
  const [selectedId, setSelectedId] = useState<number>(() => {
    const p = loadCampaignProgress();
    return Math.min(5, Math.max(1, p.unlockedChapter));
  });

  if (!isOpen) return null;

  const selectedChapter =
    CAMPAIGN_CHAPTERS.find((c) => c.id === selectedId) || CAMPAIGN_CHAPTERS[0];
  const isUnlocked = selectedChapter.id <= progress.unlockedChapter;
  const chapterData = progress.chapters[selectedChapter.id] || {
    completed: false,
    stars: 0,
    highScore: 0,
  };

  const chapterList = Object.values(progress.chapters) as Array<{ completed: boolean; stars: number; highScore: number }>;
  const totalStars = chapterList.reduce(
    (acc, c) => acc + (c.stars || 0),
    0
  );
  const totalCompleted = chapterList.filter((c) => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[820px] bg-gradient-to-b from-[#180e14] via-[#10080d] to-[#080406] border-2 border-[#825e2d] outline outline-1 outline-[#d9ad3f]/40 rounded-2xl shadow-2xl flex flex-col text-[#cdc3ac] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-[#5c4323]/50 bg-[#140b10]/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playSfx("click");
                onClose();
              }}
              className="p-1.5 bg-[#24131b] border border-[#5c4323] hover:border-[#d9ad3f] text-[#f4c97a] rounded-lg transition-all active:scale-95 shadow"
              title={lang === "pt" ? "Voltar ao Menu" : "Back to Menu"}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="font-serif font-black text-base md:text-xl text-[#f2c95a] tracking-wide flex items-center gap-2">
                <Crown size={18} className="text-amber-400" />
                <span>{lang === "pt" ? "Campanha da Coroa" : "Crown Campaign"}</span>
              </div>
              <div className="text-[10px] md:text-xs font-mono text-[#a8926a]">
                {lang === "pt"
                  ? "Reconquiste as terras do Reino contra a Horda Corrompida"
                  : "Reclaim the Realm lands from the Corrupted Swarm"}
              </div>
            </div>
          </div>

          {/* Campaign Global Stars & Completion Badges */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-1 px-3 py-1 bg-black/60 border border-amber-500/40 rounded-full text-xs font-mono text-amber-300 shadow">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="font-bold">{totalStars} / 15</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-black/60 border border-[#5c4323] rounded-full text-xs font-mono text-[#a8926a] shadow">
              <Trophy size={13} className="text-amber-400" />
              <span>{totalCompleted} / 5</span>
            </div>
          </div>
        </div>

        {/* Main Content Area: Split between World Map & Chapter Briefing */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Top: Interactive Kingdom Map */}
          <div className="flex-1 relative bg-radial from-[#22131b] via-[#140a10] to-[#090408] p-4 md:p-6 flex flex-col justify-between overflow-y-auto">
            <div className="text-xs font-mono text-[#a8926a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin size={13} className="text-amber-400" />
              <span>{lang === "pt" ? "Mapa Estratégico do Reino" : "Realm Strategic Map"}</span>
            </div>

            {/* Campaign Journey Pathway Line & Nodes */}
            <div className="my-auto py-4 flex flex-col gap-3 md:gap-4 max-w-xl mx-auto w-full">
              {CAMPAIGN_CHAPTERS.map((chap, idx) => {
                const unlocked = chap.id <= progress.unlockedChapter;
                const active = chap.id === selectedId;
                const data = progress.chapters[chap.id] || { completed: false, stars: 0, highScore: 0 };

                return (
                  <div
                    key={chap.id}
                    onClick={() => {
                      if (unlocked) {
                        sound.playSfx("select");
                        setSelectedId(chap.id);
                      } else {
                        sound.playSfx("warn");
                      }
                    }}
                    className={`relative group flex items-center gap-3.5 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      active
                        ? "bg-gradient-to-r from-[#381f2b] to-[#1c1017] border-[#f2c95a] shadow-[0_0_20px_rgba(242,201,90,0.3)] scale-[1.02]"
                        : unlocked
                        ? "bg-[#180c13]/90 border-[#5c4323] hover:border-[#d9ad3f]/70 hover:bg-[#201019]"
                        : "bg-[#0f070b]/60 border-[#2f1c24]/80 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {/* Node Icon Avatar */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 transition-transform ${
                        active
                          ? "bg-gradient-to-br from-[#d9ad3f] to-[#8a6a1f] text-black shadow-md scale-110"
                          : unlocked
                          ? "bg-[#281622] border border-[#d9ad3f]/40 text-[#f2c95a]"
                          : "bg-black/60 border border-neutral-800 text-neutral-500"
                      }`}
                    >
                      {unlocked ? (
                        chap.icon
                      ) : (
                        <Lock size={18} className="text-neutral-500" />
                      )}
                    </div>

                    {/* Chapter Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#d9ad3f]">
                          {lang === "pt" ? `Capítulo ${chap.id}` : `Chapter ${chap.id}`}
                        </span>
                        {data.completed && (
                          <span className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3].map((starNum) => (
                              <Star
                                key={starNum}
                                size={11}
                                className={starNum <= data.stars ? "fill-amber-400 text-amber-400" : "text-neutral-600"}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="font-serif font-bold text-sm md:text-base text-[#f5ebd7] truncate">
                        {chap.title[lang]}
                      </div>
                      <div className="text-[11px] font-mono text-[#a8926a] flex items-center gap-1">
                        <MapPin size={10} />
                        <span>{chap.location[lang]}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right flex-shrink-0">
                      {data.completed ? (
                        <div className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold rounded-full flex items-center gap-1 shadow">
                          <CheckCircle2 size={11} />
                          <span>{lang === "pt" ? "Concluído" : "Cleared"}</span>
                        </div>
                      ) : unlocked ? (
                        <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-bold rounded-full animate-pulse">
                          {lang === "pt" ? "Disponível" : "Unlocked"}
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-500 text-[10px] font-mono rounded-full flex items-center gap-1">
                          <Lock size={10} />
                          <span>{lang === "pt" ? "Bloqueado" : "Locked"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] font-mono text-center text-[#8a7a5c]/80 mt-2">
              {lang === "pt"
                ? "Conclua os objetivos primários de cada capítulo para desbloquear o próximo!"
                : "Complete each chapter's primary objectives to unlock the next territory!"}
            </div>
          </div>

          {/* Right / Bottom: Selected Chapter Strategic Briefing */}
          <div className="w-full lg:w-[420px] bg-[#12090e]/95 border-t lg:border-t-0 lg:border-l border-[#5c4323]/50 p-4 md:p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Badge & Title */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[#d9ad3f]/20 border border-[#d9ad3f]/50 text-[#ffd56b] text-[10px] font-mono font-bold uppercase rounded-full">
                  {selectedChapter.badge[lang]}
                </span>
                <span className="text-xs font-mono text-[#a8926a]">
                  {selectedChapter.location[lang]}
                </span>
              </div>

              <h3 className="font-serif font-black text-lg md:text-xl text-[#f2c95a] mb-1">
                {selectedChapter.title[lang]}
              </h3>
              <p className="text-xs text-[#cdc3ac]/80 leading-relaxed mb-4">
                {selectedChapter.subtitle[lang]}
              </p>

              {/* Primary Objectives Checklist */}
              <div className="mb-4 bg-black/40 border border-[#5c4323]/60 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#d9ad3f] font-bold mb-2 flex items-center gap-1.5">
                  <Shield size={12} />
                  <span>{lang === "pt" ? "Objetivos Primários (Obrigatórios)" : "Primary Objectives (Required)"}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#ece4d0]">
                  {selectedChapter.primaryObjectives.map((obj) => (
                    <li key={obj.id} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold mt-0.5">•</span>
                      <span>{obj.label[lang]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Secondary Objectives (Bonus Stars) */}
              <div className="mb-4 bg-black/40 border border-[#5c4323]/40 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#ffd56b] font-bold mb-2 flex items-center gap-1.5">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{lang === "pt" ? "Objetivos Secundários (+Estrelas)" : "Secondary Objectives (+Stars)"}</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#cdc3ac]/80">
                  {selectedChapter.secondaryObjectives.map((obj) => (
                    <li key={obj.id} className="flex items-start gap-2">
                      <Star size={11} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{obj.label[lang]}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Starting Troops & Resources Preview */}
              <div className="bg-[#180a11] border border-[#5c4323]/30 rounded-xl p-3 text-[11px] font-mono text-[#a8926a] mb-4">
                <div className="font-bold text-[#ffd56b] uppercase mb-1">
                  {lang === "pt" ? "Suprimentos Iniciais" : "Initial Supplies"}:
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-amber-200">🪵 {selectedChapter.startResources.wood}</span>
                  <span className="text-slate-300">🪨 {selectedChapter.startResources.stone}</span>
                  <span className="text-yellow-300">💰 {selectedChapter.startResources.gold}</span>
                  <span className="text-emerald-300">🌾 {selectedChapter.startResources.food}</span>
                  <span className="text-cyan-300">💎 {selectedChapter.startResources.crystal}</span>
                </div>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2">
              {isUnlocked ? (
                <button
                  onClick={() => {
                    sound.playSfx("click");
                    onSelectChapter(selectedChapter.id);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#d9ad3f] via-[#f2c95a] to-[#8a6a1f] text-[#180a04] font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(217,173,63,0.4)] hover:shadow-[0_0_30px_rgba(217,173,63,0.7)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={16} className="fill-current" />
                  <span>{lang === "pt" ? "Iniciar Missão do Capítulo" : "Start Chapter Mission"}</span>
                </button>
              ) : (
                <div className="w-full py-3 bg-neutral-900 border border-neutral-800 text-neutral-500 font-bold text-xs uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-2">
                  <Lock size={14} />
                  <span>{lang === "pt" ? "Complete os capítulos anteriores primeiro" : "Complete previous chapters first"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
