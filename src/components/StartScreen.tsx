/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { GameEngine } from "../game/engine";
import { t } from "../game/i18n";
import { Language } from "../types/game";
import {
  Shield,
  BookOpen,
  Download,
  Swords,
  Volume2,
  VolumeX,
  Coins,
  Trophy,
} from "lucide-react";
import { downloadOfflineGame } from "../game/offlineBundle";
import { funtico } from "../funtico";
import { sound } from "../game/audio";

interface StartScreenProps {
  engine: GameEngine;
  lang: Language;
  onStartEndless: () => void;
  onOpenCampaign?: () => void;
  onOpenCodex: () => void;
  onSetLang: (lang: Language) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  engine,
  lang,
  onStartEndless,
  onOpenCodex,
  onSetLang,
}) => {
  if (engine.screen !== "menu") return null;

  const [isMuted, setIsMuted] = useState(sound.muted);
  const [funticoUser, setFunticoUser] = useState(funtico.getCachedUserData());

  React.useEffect(() => {
    if (funtico.getState() === "ready") {
      setFunticoUser(funtico.getCachedUserData());
    }
  }, []);

  const handleToggleSound = () => {
    const nextMuted = !sound.muted;
    sound.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between p-4 md:p-8 bg-radial from-[#22101b] via-[#10070c] to-[#040205] select-none text-[#cdc3ac] overflow-y-auto">
      {/* Top Bar with Language Toggle & Funtico Badge */}
      <div className="w-full flex justify-between items-center max-w-2xl">
        <div className="flex items-center gap-2">
          {funticoUser ? (
            <div className="flex items-center gap-2 bg-[#1b1224]/80 border border-[#8840e6]/50 rounded-xl px-2.5 py-1 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#38ff00] animate-pulse" />
              <span className="font-bold text-[#e9d5ff] truncate max-w-[100px] sm:max-w-none">
                {funticoUser.Name || "Warrior"}
              </span>
              <div className="flex items-center gap-1 text-[#ffb800] pl-1 border-l border-white/10 font-bold">
                <Coins size={12} className="text-[#ffb800]" />
                <span>{funticoUser.Diamonds ?? 0}</span>
                <span className="text-[10px] text-amber-400/80">TICO</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#d9ad3f]/80 font-mono tracking-widest uppercase">
              <Shield size={14} />
              <span>{lang === "pt" ? "Estratégia & Sobrevivência" : "Survive the Swarm"}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Relaxing BGM Audio Toggle */}
          <button
            onClick={handleToggleSound}
            className={`px-3 py-1.5 border rounded-xl font-mono text-xs flex items-center gap-1.5 transition-all shadow active:scale-95 ${
              isMuted
                ? "bg-red-950/40 border-red-800/60 text-red-300 hover:border-red-500"
                : "bg-amber-950/40 border-amber-500/50 text-amber-300 hover:border-amber-400"
            }`}
            title={
              lang === "pt"
                ? isMuted
                  ? "Ativar Ambiente Meditativo & Sons"
                  : "Silenciar Ambiente Meditativo"
                : isMuted
                ? "Unmute Meditative Ambient & Sound"
                : "Mute Meditative Ambient"
            }
          >
            {isMuted ? (
              <>
                <VolumeX size={14} className="text-red-400" />
                <span className="hidden sm:inline">{lang === "pt" ? "Mudo" : "Muted"}</span>
              </>
            ) : (
              <>
                <Volume2 size={14} className="text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">{lang === "pt" ? "Ambiente Meditativo" : "Meditative Ambient"}</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSetLang(lang === "pt" ? "en" : "pt")}
            className="px-3 py-1.5 bg-[#1e1014]/90 border border-[#5c4a30] hover:border-[#d9ad3f] text-[#f4c97a] font-bold text-xs rounded-xl transition-all shadow"
          >
            {lang === "pt" ? "🇧🇷 Português" : "🇺🇸 English"}
          </button>
        </div>
      </div>

      {/* Center Branding & Title */}
      <div className="flex flex-col items-center text-center my-auto max-w-lg w-full py-4">
        <div className="text-4xl md:text-6xl font-serif font-black tracking-wider text-[#f2c95a] drop-shadow-[0_4px_16px_rgba(217,173,63,0.4)] mb-2">
          TINY REALM
        </div>
        <div className="text-xs md:text-sm font-bold tracking-widest text-[#a8926a] uppercase mb-3">
          {t("tagline", lang)}
        </div>

        <p className="text-xs md:text-sm text-[#cdc3ac]/80 leading-relaxed max-w-md mb-8">
          {t("subtitle", lang)}
        </p>

        {/* Central Survival Mode Launch Button */}
        <div className="w-full max-w-md flex flex-col items-center">
          <button
            onClick={onStartEndless}
            className="group relative w-full p-5 bg-gradient-to-r from-[#d9ad3f] via-[#f2c95a] to-[#8a6a1f] text-[#180a04] font-black text-base tracking-wider uppercase rounded-2xl shadow-[0_0_24px_rgba(217,173,63,0.5)] hover:shadow-[0_0_36px_rgba(217,173,63,0.8)] hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center text-center cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-lg">
              <Swords size={22} className="stroke-[2.5]" />
              <span>{lang === "pt" ? "JOGAR SOBREVIVÊNCIA" : "PLAY SURVIVAL"}</span>
            </div>
            <div className="text-xs font-mono font-bold text-[#3d2707] tracking-normal mt-1 flex items-center gap-2">
              <span>{lang === "pt" ? "Defesa de Base · Ondas & Chefes" : "Base Defense · Waves & Bosses"}</span>
              {engine.bestWave > 0 && (
                <span className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full text-amber-950 font-mono">
                  <Trophy size={11} />
                  <span>{lang === "pt" ? `Melhor: Onda ${engine.bestWave}` : `Best: Wave ${engine.bestWave}`}</span>
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <button
          onClick={onOpenCodex}
          className="px-4 py-2 bg-[#1a0f14]/80 border border-[#5c4a30] hover:border-[#d9ad3f] text-[#f4c97a] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow"
        >
          <BookOpen size={14} />
          <span>{t("quickGuide", lang)}</span>
        </button>

        <button
          onClick={() => downloadOfflineGame("tiny-realm.html")}
          title={t("downloadOfflineTip", lang)}
          className="px-4 py-2 bg-[#122319]/90 border border-[#2b6339] hover:border-[#4ade80] text-[#86efac] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow hover:shadow-[0_0_16px_rgba(74,222,128,0.25)]"
        >
          <Download size={14} />
          <span>{t("downloadOffline", lang)}</span>
        </button>
      </div>
    </div>
  );
};
