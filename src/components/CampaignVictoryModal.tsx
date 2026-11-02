/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GameEngine } from "../game/engine";
import { CAMPAIGN_CHAPTERS } from "../game/campaign";
import { Language } from "../types/game";
import { sound } from "../game/audio";
import {
  Trophy,
  Star,
  ChevronRight,
  RotateCcw,
  Map,
  Sparkles,
  Crown,
} from "lucide-react";

interface CampaignVictoryModalProps {
  engine: GameEngine;
  chapterId: number;
  stars: number;
  lang: Language;
  onNextChapter: () => void;
  onOpenMap: () => void;
  onReplay: () => void;
}

export const CampaignVictoryModal: React.FC<CampaignVictoryModalProps> = ({
  engine,
  chapterId,
  stars,
  lang,
  onNextChapter,
  onOpenMap,
  onReplay,
}) => {
  if (!engine.campaignVictory) return null;

  const chapter =
    CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId) || CAMPAIGN_CHAPTERS[0];
  const isFinalChapter = chapter.id >= 5;
  const score = engine.computeScore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 select-none">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#22131b] via-[#140a11] to-[#0a0508] border-2 border-[#d9ad3f] outline outline-1 outline-[#ffe08a]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(217,173,63,0.35)] text-center text-[#cdc3ac] overflow-hidden">
        {/* Animated Golden Trophy or Crown Icon */}
        <div className="relative mx-auto mb-3 w-20 h-20 bg-gradient-to-br from-[#d9ad3f] to-[#785419] rounded-2xl border-2 border-[#fff3b0] flex items-center justify-center text-black shadow-[0_0_24px_rgba(255,224,138,0.5)]">
          {isFinalChapter ? <Crown size={40} className="fill-current" /> : <Trophy size={38} />}
          <Sparkles
            size={18}
            className="absolute -top-2 -right-2 text-amber-300 animate-pulse"
          />
        </div>

        <div className="text-xs font-mono font-bold tracking-widest uppercase text-[#f2c95a] mb-1">
          {lang === "pt" ? "Missão Cumprida · Vitória da Coroa" : "Mission Complete · Crown Victory"}
        </div>

        <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#ffe399] tracking-wide mb-1 drop-shadow-md">
          {chapter.title[lang]}
        </h2>

        {/* Star Rating Presentation */}
        <div className="my-4 flex items-center justify-center gap-2">
          {[1, 2, 3].map((starIdx) => (
            <div
              key={starIdx}
              className={`p-2 rounded-xl border transition-transform ${
                starIdx <= stars
                  ? "bg-amber-500/25 border-amber-400 text-amber-400 scale-110 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                  : "bg-black/40 border-[#4a3826] text-neutral-600"
              }`}
            >
              <Star
                size={26}
                className={starIdx <= stars ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
              />
            </div>
          ))}
        </div>

        <div className="text-xs font-mono text-[#ffd56b] mb-4">
          {stars === 3
            ? lang === "pt"
              ? "⭐ ⭐ ⭐ Perfeito! Todos os objetivos cumpridos!"
              : "⭐ ⭐ ⭐ Flawless! All primary & bonus objectives cleared!"
            : stars === 2
            ? lang === "pt"
              ? "⭐ ⭐ Excelente! Vitória e bônus assegurados!"
              : "⭐ ⭐ Great! Victory and bonus secured!"
            : lang === "pt"
            ? "⭐ Vitória conquistada!"
            : "⭐ Mission Cleared!"}
        </div>

        {/* Story Epilogue Excerpt */}
        {chapter.epilogue && chapter.epilogue.length > 0 && (
          <div className="my-3 p-3.5 bg-black/50 border border-[#5c4323]/60 rounded-xl text-left flex items-start gap-3 shadow-inner">
            <div className="w-10 h-10 rounded-lg bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-xl flex-shrink-0">
              {chapter.epilogue[0].avatar}
            </div>
            <div className="flex-1">
              <div className="font-serif font-bold text-xs text-[#ffd56b]">
                {chapter.epilogue[0].speaker[lang]}
              </div>
              <p className="text-xs text-[#ece4d0] leading-snug mt-0.5">
                "{chapter.epilogue[0].text[lang]}"
              </p>
            </div>
          </div>
        )}

        {/* Score & Stats Summary */}
        <div className="my-3 p-3 bg-black/40 border border-[#5c4323]/40 rounded-xl flex items-center justify-around text-xs font-mono">
          <div>
            <div className="text-[#8a7a5c] text-[10px] uppercase">{lang === "pt" ? "Pontuação" : "Score"}</div>
            <div className="text-sm font-bold text-[#ffd56b]">{score.toLocaleString()}</div>
          </div>
          <div className="w-px h-6 bg-[#5c4323]/50" />
          <div>
            <div className="text-[#8a7a5c] text-[10px] uppercase">{lang === "pt" ? "Inimigos" : "Kills"}</div>
            <div className="text-sm font-bold text-red-400">{engine.stats.kills}</div>
          </div>
          <div className="w-px h-6 bg-[#5c4323]/50" />
          <div>
            <div className="text-[#8a7a5c] text-[10px] uppercase">{lang === "pt" ? "Ondas" : "Waves"}</div>
            <div className="text-sm font-bold text-cyan-300">{engine.wavesSurvived}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5">
          {!isFinalChapter && (
            <button
              onClick={() => {
                sound.playSfx("click");
                onNextChapter();
              }}
              className="w-full sm:flex-1 py-3 bg-gradient-to-r from-[#d9ad3f] via-[#f2c95a] to-[#8a6a1f] text-[#180a04] font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{lang === "pt" ? "Próximo Capítulo" : "Next Chapter"}</span>
              <ChevronRight size={16} />
            </button>
          )}

          <button
            onClick={() => {
              sound.playSfx("click");
              onOpenMap();
            }}
            className="w-full sm:flex-1 py-3 bg-[#1e1017] border border-[#5c4323] hover:border-[#d9ad3f] text-[#f4c97a] font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Map size={15} />
            <span>{lang === "pt" ? "Mapa da Campanha" : "Campaign Map"}</span>
          </button>

          <button
            onClick={() => {
              sound.playSfx("click");
              onReplay();
            }}
            className="w-full sm:w-auto p-3 bg-[#160c12] border border-[#5c4323]/60 hover:border-[#d9ad3f] text-[#a8926a] hover:text-[#f4c97a] rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
            title={lang === "pt" ? "Jogar Novamente" : "Play Again"}
          >
            <RotateCcw size={15} />
            <span className="sm:hidden text-xs">{lang === "pt" ? "Repetir" : "Replay"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
