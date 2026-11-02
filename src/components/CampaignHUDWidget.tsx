/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameEngine } from "../game/engine";
import { CAMPAIGN_CHAPTERS } from "../game/campaign";
import { Language } from "../types/game";
import {
  Crown,
  CheckCircle2,
  Circle,
  Star,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Shield,
  MapPin,
} from "lucide-react";
import { sound } from "../game/audio";

interface CampaignHUDWidgetProps {
  engine: GameEngine;
  lang: Language;
  onOpenStoryBriefing: () => void;
}

export const CampaignHUDWidget: React.FC<CampaignHUDWidgetProps> = ({
  engine,
  lang,
  onOpenStoryBriefing,
}) => {
  const [minimized, setMinimized] = useState(false);

  if (engine.gameMode !== "campaign") return null;

  const chapter =
    CAMPAIGN_CHAPTERS.find((c) => c.id === engine.activeChapter) ||
    CAMPAIGN_CHAPTERS[0];

  return (
    <div className="fixed top-14 left-2 sm:left-4 z-30 max-w-[280px] sm:max-w-[320px] select-none transition-all duration-200">
      <div className="bg-[#140b10]/92 border border-[#825e2d] outline outline-1 outline-[#d9ad3f]/40 rounded-xl shadow-xl overflow-hidden text-[#cdc3ac] backdrop-blur-md">
        {/* Header Bar */}
        <div
          onClick={() => {
            sound.playSfx("click");
            setMinimized(!minimized);
          }}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#24121c] to-[#12080e] cursor-pointer hover:brightness-110 border-b border-[#5c4323]/40"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-400 flex-shrink-0">
              <Crown size={15} />
            </span>
            <div className="truncate">
              <div className="font-serif font-black text-xs text-[#ffd56b] truncate">
                {chapter.title[lang]}
              </div>
              <div className="text-[10px] font-mono text-[#a8926a] flex items-center gap-1">
                <MapPin size={9} />
                <span className="truncate">{chapter.location[lang]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playSfx("click");
                onOpenStoryBriefing();
              }}
              title={lang === "pt" ? "Ver Prólogo e História" : "View Story Briefing"}
              className="p-1 text-[#ffd56b] hover:bg-white/10 rounded transition-colors"
            >
              <BookOpen size={13} />
            </button>
            <span className="text-[#a8926a]">
              {minimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </div>
        </div>

        {/* Expandable Objectives Checklist */}
        {!minimized && (
          <div className="p-2.5 space-y-2 text-xs">
            {/* Primary Objectives */}
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-[#f4c97a] tracking-wider mb-1 flex items-center gap-1">
                <Shield size={11} />
                <span>{lang === "pt" ? "Objetivos Principais:" : "Primary Objectives:"}</span>
              </div>
              <div className="space-y-1">
                {chapter.primaryObjectives.map((obj) => {
                  const done = obj.isCompleted(engine);
                  const prog = obj.getProgress ? obj.getProgress(engine) : null;

                  return (
                    <div
                      key={obj.id}
                      className={`flex items-start gap-1.5 p-1 rounded transition-colors ${
                        done ? "text-emerald-300 bg-emerald-950/20" : "text-[#ece4d0]"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2
                          size={13}
                          className="text-emerald-400 fill-emerald-950/60 flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <Circle size={13} className="text-[#8a7a5c] flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-[11px] leading-tight">
                        <span>{obj.label[lang]}</span>
                        {prog && !done && (
                          <span className="ml-1 font-mono font-bold text-amber-300 text-[10px]">
                            ({prog.display || `${prog.current}/${prog.target}`})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary Objectives (Bonus Stars) */}
            <div className="pt-1.5 border-t border-[#5c4323]/30">
              <div className="text-[10px] font-mono uppercase font-bold text-[#ffd56b] tracking-wider mb-1 flex items-center gap-1">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{lang === "pt" ? "Bônus (+Estrelas):" : "Bonus (+Stars):"}</span>
              </div>
              <div className="space-y-1">
                {chapter.secondaryObjectives.map((sec) => {
                  const done = sec.isCompleted(engine);
                  const prog = sec.getProgress ? sec.getProgress(engine) : null;

                  return (
                    <div
                      key={sec.id}
                      className={`flex items-start gap-1.5 p-1 rounded transition-colors ${
                        done ? "text-amber-300 bg-amber-950/20" : "text-[#cdc3ac]/75"
                      }`}
                    >
                      <Star
                        size={12}
                        className={`flex-shrink-0 mt-0.5 ${
                          done ? "fill-amber-400 text-amber-400" : "text-[#5c4a30]"
                        }`}
                      />
                      <div className="flex-1 text-[10px] leading-tight">
                        <span>{sec.label[lang]}</span>
                        {prog && !done && (
                          <span className="ml-1 font-mono text-amber-400">
                            ({prog.display || `${prog.current}/${prog.target}`})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Intel & Creep Camps / Relics Status */}
            {(engine.creepCamps.length > 0 || engine.relics.length > 0) && (
              <div className="pt-1.5 border-t border-[#5c4323]/30 flex flex-col gap-1 text-[10px] font-mono">
                <div className="flex items-center justify-between text-[#d9ad3f]">
                  <span>🏕️ {lang === "pt" ? "Acampamentos Neutros:" : "Neutral Camps:"}</span>
                  <span className="font-bold text-amber-300">
                    {engine.creepCamps.filter((c) => c.cleared).length}/{engine.creepCamps.length}
                  </span>
                </div>
                {engine.enemyHives.length > 0 && (
                  <div className="flex items-center justify-between text-rose-300">
                    <span>🔥 {lang === "pt" ? "Ninhos Inimigos:" : "Enemy Hives:"}</span>
                    <span className="font-bold text-rose-400">
                      {engine.enemyHives.filter((h) => h.destroyed).length}/{engine.enemyHives.length}
                    </span>
                  </div>
                )}
                {engine.relics.length > 0 && (
                  <div className="flex items-center gap-1 text-purple-300 pt-0.5">
                    <span>✨ {lang === "pt" ? "Relíquias:" : "Relics:"}</span>
                    <div className="flex gap-1">
                      {engine.relics.map((r) => (
                        <span key={r.id} title={r.name[lang] + " - " + r.desc[lang]} className="cursor-help">
                          {r.icon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
