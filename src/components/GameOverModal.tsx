/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GameEngine } from "../game/engine";
import { t } from "../game/i18n";
import { Language } from "../types/game";
import { Skull, Trophy, RotateCcw, Map, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { lifecycle, ActiveRunContext, RunLifecycleState } from "../funtico/lifecycle";

interface GameOverModalProps {
  engine: GameEngine;
  lang: Language;
  onRestart: () => void;
  onOpenMap?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  engine,
  lang,
  onRestart,
  onOpenMap,
}) => {
  if (engine.screen !== "defeat") return null;

  const [showBreakdown, setShowBreakdown] = useState(false);
  const [lifecycleState, setLifecycleState] = useState<RunLifecycleState>(lifecycle.getState());
  const [lifecycleContext, setLifecycleContext] = useState<ActiveRunContext | null>(lifecycle.getContext());

  useEffect(() => {
    return lifecycle.subscribe((state, ctx) => {
      setLifecycleState(state);
      setLifecycleContext(ctx);
    });
  }, []);

  const breakdown = engine.getScoreBreakdown();
  const score = breakdown.finalScore;
  const isNewRecord = score > engine.bestScore;
  const isCampaign = engine.gameMode === "campaign";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1e1014] to-[#0f070a] border-2 border-[#7a1421] outline outline-1 outline-[#d9ad3f]/40 rounded-2xl p-5 sm:p-6 shadow-2xl text-center text-[#cdc3ac] max-h-[92vh] overflow-y-auto">
        <div className="w-14 h-14 mx-auto mb-2 bg-red-950/80 border-2 border-red-500/50 rounded-full flex items-center justify-center text-red-400">
          <Skull size={28} />
        </div>

        <h2 className="font-serif font-black text-xl md:text-2xl text-red-300 tracking-wider mb-1">
          {isCampaign
            ? lang === "pt"
              ? "MISSÃO FRACASSADA"
              : "MISSION FAILED"
            : t("settlementFallen", lang)}
        </h2>
        {isCampaign && (
          <p className="text-xs text-[#a8926a] font-mono mb-2">
            {lang === "pt"
              ? "A Câmara Municipal não resistiu à investida da colmeia."
              : "The Town Hall succumbed to the swarm assault."}
          </p>
        )}

        {/* Funtico Run Status Banner */}
        {lifecycleContext && lifecycleContext.mode !== "practice" && (
          <div className="my-2 p-2 bg-[#191024] border border-[#8840e6]/40 rounded-xl text-xs font-mono flex items-center justify-center gap-2">
            {lifecycleState === "submitting" ? (
              <>
                <Loader2 size={14} className="animate-spin text-cyan-400" />
                <span className="text-cyan-200">
                  {lang === "pt" ? "Enviando pontuação à Funtico..." : "Submitting score to Funtico..."}
                </span>
              </>
            ) : lifecycleContext.submissionError ? (
              <>
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-amber-300 text-[11px]">
                  {lang === "pt" ? "Pontuação salva localmente (offline)" : "Score saved locally (offline)"}
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={14} className="text-[#38ff00]" />
                <span className="text-[#38ff00]">
                  {lang === "pt" ? "Pontuação Enviada para a Sala Funtico!" : "Score Submitted to Funtico Room!"}
                </span>
              </>
            )}
          </div>
        )}

        {/* Primary Score Display */}
        <div className="my-3 p-3.5 bg-black/60 border border-[#5c4a30] rounded-xl">
          <div className="text-[11px] font-mono tracking-widest text-[#8a7a5c] uppercase">
            {lang === "pt" ? "PONTUAÇÃO DETERMINÍSTICA" : "FINAL DETERMINISTIC SCORE"}
          </div>
          <div className="text-4xl font-black font-mono text-[#ffd56b] my-1 tracking-tight">
            {score.toLocaleString()}
          </div>
          {isNewRecord && (
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold rounded-full animate-pulse">
              <Trophy size={12} />
              <span>{t("newRecord", lang)}</span>
            </div>
          )}
        </div>

        {/* Score Breakdown Toggle */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full mb-3 text-xs font-mono text-[#f4c97a] hover:text-white flex items-center justify-center gap-1 transition-colors"
        >
          <span>{showBreakdown ? (lang === "pt" ? "Ocultar Detalhes da Pontuação" : "Hide Score Breakdown") : (lang === "pt" ? "Ver Detalhamento da Pontuação" : "View Score Breakdown")}</span>
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showBreakdown && (
          <div className="mb-4 p-3 bg-black/70 border border-[#5c4a30]/60 rounded-xl text-xs font-mono text-left space-y-1.5 animate-in fade-in duration-150">
            <div className="flex justify-between text-[#cdc3ac]">
              <span>{lang === "pt" ? "Sobrevivência (Ondas & Dias):" : "Survival (Waves & Days):"}</span>
              <b className="text-cyan-300">+{breakdown.waveScore}</b>
            </div>
            <div className="flex justify-between text-[#cdc3ac]">
              <span>{lang === "pt" ? "Inimigos Comuns:" : "Swarm Kills:"}</span>
              <b className="text-red-300">+{breakdown.killScore}</b>
            </div>
            <div className="flex justify-between text-[#cdc3ac]">
              <span>{lang === "pt" ? "Monstros Elites:" : "Elite Kills:"}</span>
              <b className="text-purple-300">+{breakdown.eliteScore}</b>
            </div>
            <div className="flex justify-between text-[#cdc3ac]">
              <span>{lang === "pt" ? "Chefes Soberanos:" : "Boss Kills:"}</span>
              <b className="text-amber-300">+{breakdown.bossScore}</b>
            </div>
            <div className="flex justify-between text-[#cdc3ac]">
              <span>{lang === "pt" ? "Recursos & Cristais:" : "Economy & Crystals:"}</span>
              <b className="text-emerald-300">+{breakdown.resourceScore}</b>
            </div>
            <div className="flex justify-between text-[#cdc3ac]">
              <span>{lang === "pt" ? "Bônus de Tempo:" : "Time Bonus:"}</span>
              <b className="text-sky-300">+{breakdown.timeBonus}</b>
            </div>
            {breakdown.damagePenalty > 0 && (
              <div className="flex justify-between text-red-400 border-t border-white/10 pt-1">
                <span>{lang === "pt" ? "Dano na Câmara Municipal:" : "Town Hall Damage Penalty:"}</span>
                <b>-{breakdown.damagePenalty}</b>
              </div>
            )}
            <div className="flex justify-between text-[#ffd56b] border-t border-amber-500/30 pt-1.5 font-bold">
              <span>{lang === "pt" ? "TOTAL FINAL:" : "TOTAL FINAL:"}</span>
              <span>{breakdown.finalScore.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-left mb-4">
          <div className="bg-[#180a0e] p-2 rounded-lg border border-[#5c4a30]/40 flex justify-between">
            <span className="text-[#8a7a5c]">{t("wavesSurvived", lang)}:</span>
            <b className="text-cyan-300">{engine.wavesSurvived}</b>
          </div>
          <div className="bg-[#180a0e] p-2 rounded-lg border border-[#5c4a30]/40 flex justify-between">
            <span className="text-[#8a7a5c]">{t("enemiesSlain", lang)}:</span>
            <b className="text-red-400">{engine.stats.kills}</b>
          </div>
          <div className="bg-[#180a0e] p-2 rounded-lg border border-[#5c4a30]/40 flex justify-between">
            <span className="text-[#8a7a5c]">{t("elitesSlain", lang)}:</span>
            <b className="text-purple-300">{engine.stats.eliteKills}</b>
          </div>
          <div className="bg-[#180a0e] p-2 rounded-lg border border-[#5c4a30]/40 flex justify-between">
            <span className="text-[#8a7a5c]">{t("bossesSlain", lang)}:</span>
            <b className="text-amber-300">{engine.stats.bossKills}</b>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={() => {
              lifecycle.resetToIdle();
              onRestart();
            }}
            className="flex-1 w-full py-3 bg-gradient-to-r from-[#d9ad3f] to-[#8a6a1f] border-2 border-[#ffe08a] hover:brightness-125 text-[#180a04] font-black text-xs sm:text-sm uppercase rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            <span>{isCampaign ? (lang === "pt" ? "Tentar Missão Novamente" : "Retry Mission") : t("playAgain", lang)}</span>
          </button>

          {isCampaign && onOpenMap && (
            <button
              onClick={() => {
                lifecycle.resetToIdle();
                onOpenMap();
              }}
              className="w-full sm:w-auto px-4 py-3 bg-[#1e1017] border border-[#5c4a30] hover:border-[#d9ad3f] text-[#f4c97a] font-bold text-xs uppercase rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Map size={15} />
              <span>{lang === "pt" ? "Mapa" : "Map"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
