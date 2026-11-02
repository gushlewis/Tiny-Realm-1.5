/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { DialogueBeat } from "../game/campaign";
import { Language } from "../types/game";
import { sound } from "../game/audio";
import { ChevronRight, FastForward, Sparkles } from "lucide-react";

interface StoryDialogueModalProps {
  beats: DialogueBeat[];
  lang: Language;
  onFinish: () => void;
  titleBadge?: string;
}

export const StoryDialogueModal: React.FC<StoryDialogueModalProps> = ({
  beats,
  lang,
  onFinish,
  titleBadge,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [beats]);

  // Keyboard navigation (Space, Enter)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "Escape") {
        onFinish();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index, beats]);

  if (!beats || beats.length === 0) return null;

  const currentBeat = beats[index] || beats[0];

  const handleNext = () => {
    sound.playSfx("select");
    if (index + 1 < beats.length) {
      setIndex(index + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c1218] via-[#120a10] to-[#090508] border-2 border-[#825e2d] outline outline-1 outline-[#e0b040]/40 rounded-2xl p-5 md:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-[#cdc3ac]">
        {/* Top Header Row with Badge & Skip */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#5c4323]/50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#d9ad3f]/20 border border-[#d9ad3f]/50 text-[#ffd56b] text-[11px] font-mono font-bold tracking-widest uppercase rounded-full flex items-center gap-1.5 shadow">
              <Sparkles size={11} className="text-amber-300" />
              <span>{titleBadge || (lang === "pt" ? "Crônicas do Reino" : "Chronicles of the Realm")}</span>
            </span>
            <span className="text-[11px] font-mono text-[#8a7a5c]">
              {index + 1} / {beats.length}
            </span>
          </div>

          <button
            onClick={() => {
              sound.playSfx("click");
              onFinish();
            }}
            className="flex items-center gap-1 text-[11px] font-mono text-[#a8926a] hover:text-[#f2c95a] transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            <FastForward size={12} />
            <span>{lang === "pt" ? "Pular História" : "Skip Story"}</span>
          </button>
        </div>

        {/* Character Portrait & Speech Box */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 my-2">
          {/* Avatar Portrait */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className={`w-18 h-18 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${currentBeat.avatarBg} border-2 border-[#d9ad3f] shadow-lg flex items-center justify-center text-3xl md:text-4xl shadow-[0_0_16px_rgba(217,173,63,0.3)] animate-in zoom-in-90 duration-150`}
            >
              {currentBeat.avatar}
            </div>
            <div className="mt-2 text-center">
              <div className="font-serif font-bold text-xs md:text-sm text-[#ffd56b] tracking-wide">
                {currentBeat.speaker[lang]}
              </div>
              <div className="text-[10px] font-mono text-[#a8926a] uppercase tracking-wider">
                {currentBeat.roleTitle[lang]}
              </div>
            </div>
          </div>

          {/* Dialogue Body */}
          <div className="flex-1 w-full bg-black/40 border border-[#5c4323]/60 rounded-xl p-4 md:p-5 relative shadow-inner">
            <p className="text-sm md:text-base leading-relaxed text-[#ece4d0] font-sans antialiased min-h-[70px]">
              {currentBeat.text[lang]}
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#8a7a5c]">
              <span className="hidden sm:inline">
                {lang === "pt" ? "Pressione [Espaço] ou clique para avançar" : "Press [Space] or click to continue"}
              </span>
              <span className="sm:hidden">{lang === "pt" ? "Toque para avançar" : "Tap to continue"}</span>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5 ml-auto">
                {beats.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === index ? "bg-[#ffd56b] scale-125" : i < index ? "bg-[#8a7a5c]" : "bg-[#3d2f21]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#d9ad3f] via-[#f2c95a] to-[#a67c22] text-[#1a0c02] font-black text-xs md:text-sm uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>
              {index + 1 < beats.length
                ? lang === "pt"
                  ? "Continuar"
                  : "Continue"
                : lang === "pt"
                ? "À Batalha!"
                : "To Battle!"}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
