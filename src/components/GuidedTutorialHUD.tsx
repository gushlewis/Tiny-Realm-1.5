/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GameEngine } from "../game/engine";
import { Language } from "../types/game";
import { sound } from "../game/audio";
import {
  Hammer,
  Home,
  Wheat,
  ShieldAlert,
  Swords,
  Moon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Award,
  HelpCircle,
  Crown,
  Castle,
} from "lucide-react";

interface GuidedTutorialHUDProps {
  engine: GameEngine;
  lang: Language;
}

export const GuidedTutorialHUD: React.FC<GuidedTutorialHUDProps> = ({ engine, lang }) => {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("tinyrealm_tutorial_finished") === "true";
    } catch {
      return false;
    }
  });
  const [completedStep, setCompletedStep] = useState<number>(-1);

  const phase = engine.phaseInfo();
  const hasHouse = engine.buildings.some((b) => b.type === "house" && (b.complete || b.progress > 0));
  const hasFarm = engine.buildings.some((b) => b.type === "farm" && (b.complete || b.progress > 0));
  const hasTower = engine.buildings.some((b) => b.type === "tower" && (b.complete || b.progress > 0));
  const hasMilitary = engine.units.some(
    (u) => u.state !== "death" && (u.role === "warrior" || u.role === "javelin" || u.role === "scout")
  );
  const survivedFirstNight = phase.wave >= 2 || (phase.wave === 1 && phase.name === "Build" && engine.time > 100);

  // Compute current quest step (0 to 5)
  let currentStep = 0;
  if (hasHouse && hasFarm && hasTower && hasMilitary && survivedFirstNight) {
    currentStep = 6; // All complete
  } else if (hasHouse && hasFarm && hasTower && hasMilitary) {
    currentStep = 5; // Defend during night
  } else if (hasHouse && hasFarm && hasTower) {
    currentStep = 4; // Train military unit
  } else if (hasHouse && hasFarm) {
    currentStep = 3; // Build tower
  } else if (hasHouse) {
    currentStep = 2; // Build farm
  } else if (engine.buildMode !== null || engine.buildings.length > 1) {
    currentStep = 1; // Build house
  } else {
    currentStep = 0; // Click hammer
  }

  const allFinished = currentStep >= 6;

  // Auto-dismiss and celebrate when all tasks are completed
  useEffect(() => {
    if (allFinished && !dismissed) {
      try {
        localStorage.setItem("tinyrealm_tutorial_finished", "true");
      } catch {}
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [allFinished, dismissed]);

  // Play celebration when a quest step advances
  useEffect(() => {
    if (currentStep > completedStep && completedStep >= 0 && currentStep <= 6) {
      sound.playSfx("upgrade");
      engine.float(
        lang === "pt" ? "✨ Missão Concluída!" : "✨ Quest Complete!",
        engine.castle() ? engine.castle()!.x + 1 : 25,
        engine.castle() ? engine.castle()!.y - 1 : 25,
        "#8fe39a"
      );
    }
    setCompletedStep(currentStep);
  }, [currentStep, completedStep, lang, engine]);

  // When dismissed or tasks completed, completely clear from screen
  if (dismissed) {
    return null;
  }

  const stepsData = [
    {
      id: "hammer",
      icon: <Hammer className="text-amber-400" size={18} />,
      badge: lang === "pt" ? "PASSO 1 DE 6" : "STEP 1 OF 6",
      title: lang === "pt" ? "Abrir Modo de Construção" : "Open Construction Mode",
      desc:
        lang === "pt"
          ? "Clique no botão do Martelo 🔨 no canto da tela (ou tecle 'B') para ver as estruturas disponíveis."
          : "Click the Hammer button 🔨 on your HUD (or press 'B') to view available structures.",
      done: engine.buildMode !== null || engine.buildings.length > 1,
    },
    {
      id: "house",
      icon: <Home className="text-emerald-400" size={18} />,
      badge: lang === "pt" ? "PASSO 2 DE 6" : "STEP 2 OF 6",
      title: lang === "pt" ? "Construir uma Casa (+2 População)" : "Build a House (+2 Population)",
      desc:
        lang === "pt"
          ? "Selecione a Casa e posicione no gramado. Aldeões construtores erguerão o abrigo automaticamente!"
          : "Select House and place it on grass. Builder villagers will automatically construct it!",
      done: hasHouse,
    },
    {
      id: "farm",
      icon: <Wheat className="text-yellow-400" size={18} />,
      badge: lang === "pt" ? "PASSO 3 DE 6" : "STEP 3 OF 6",
      title: lang === "pt" ? "Construir uma Fazenda (+Trigo)" : "Build a Wheat Farm (+Food)",
      desc:
        lang === "pt"
          ? "Construa uma Fazenda para produzir colheita contínua de trigo para alimentar novas tropas e trabalhadores."
          : "Construct a Wheat Farm to produce recurring grain to sustain incoming recruits.",
      done: hasFarm,
    },
    {
      id: "tower",
      icon: <ShieldAlert className="text-rose-400" size={18} />,
      badge: lang === "pt" ? "PASSO 4 DE 6" : "STEP 4 OF 6",
      title: lang === "pt" ? "Alerta de Ataque: Construa uma Torre!" : "Under Threat: Build a Defense Tower!",
      desc:
        lang === "pt"
          ? "O enxame de insetos ataca durante a noite! Construa uma Torre para iluminar e disparar flechas."
          : "Hostile insect swarms invade at dusk! Construct a Watchtower to cast light and fire arrows.",
      done: hasTower,
    },
    {
      id: "military",
      icon: <Swords className="text-cyan-400" size={18} />,
      badge: lang === "pt" ? "PASSO 5 DE 6" : "STEP 5 OF 6",
      title: lang === "pt" ? "Treinar Defensores de Elite" : "Train Combat Defenders",
      desc:
        lang === "pt"
          ? "Clique na Câmara Municipal ou Quartel e treine um Guerreiro ⚔️, Lanceiro 🔱 ou Batedor 🗡️!"
          : "Click Town Hall or Barracks and train a Warrior ⚔️, Javelin 🔱, or Scout 🗡️!",
      done: hasMilitary,
    },
    {
      id: "survive",
      icon: <Moon className="text-purple-400" size={18} />,
      badge: lang === "pt" ? "PASSO 6 DE 6" : "STEP 6 OF 6",
      title: lang === "pt" ? "Sobreviva à Primeira Noite" : "Survive the First Night",
      desc:
        lang === "pt"
          ? "Posicione suas tropas perto da Câmara Municipal e derrote todas as criaturas invasoras até o amanhecer!"
          : "Rally your defenders near the Town Hall and vanquish the invaders until morning dawn arrives!",
      done: survivedFirstNight,
    },
  ];

  const activeStep = allFinished ? stepsData[5] : stepsData[currentStep];

  return (
    <div className="fixed top-14 md:top-16 left-2 md:left-4 z-20 max-w-[calc(100vw-16px)] md:max-w-xs select-none transition-all duration-300 pointer-events-auto">
      <div className="bg-[#0c0705]/85 hover:bg-[#0c0705]/95 border border-amber-500/40 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-md overflow-hidden transition-all">
        {/* Header Bar */}
        <div 
          onClick={() => setMinimized(!minimized)}
          className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-amber-500/20 cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 shrink-0">
              {allFinished ? <Award size={18} className="text-emerald-400" /> : activeStep.icon}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-mono font-black tracking-wider text-amber-400/90 uppercase block truncate">
                {allFinished
                  ? lang === "pt"
                    ? "TUTORIAL CONCLUÍDO"
                    : "TUTORIAL COMPLETED"
                  : activeStep.badge}
              </span>
              <h4 className="text-xs font-serif font-black text-amber-200 leading-tight truncate">
                {allFinished
                  ? lang === "pt"
                    ? "Reino Pronto para a Guerra!"
                    : "Realm Ready for War!"
                  : lang === "pt"
                  ? "Guia de Sobrevivência"
                  : "Survival Quest Guide"}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMinimized(!minimized);
              }}
              className="p-1.5 text-amber-300/80 hover:text-amber-200 hover:bg-white/10 rounded-lg transition-colors"
              title={minimized ? "Expand" : "Minimize"}
            >
              {minimized ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
              className="p-1.5 text-amber-300/80 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
              title="Close Guide"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!minimized && (
          <div className="p-2.5 text-[#e6dcc8]">
            {allFinished ? (
              <div className="flex flex-col items-center text-center py-2">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Crown size={22} className="text-amber-400 animate-bounce" style={{ animationDuration: "2s" }} />
                  <Castle size={22} className="text-amber-300" />
                  <Sparkles size={22} className="text-purple-400 animate-pulse" />
                </div>
                <h5 className="font-bold text-amber-300 text-sm">
                  {lang === "pt" ? "Você Dominou os Fundamentos!" : "You've Mastered the Basics!"}
                </h5>
                <p className="text-[11px] text-[#c9bfa8] mt-1 leading-relaxed">
                  {lang === "pt"
                    ? "Excelente trabalho, Soberano! Continue expandindo suas muralhas, coletando Cristais para despertar o Golem e fortificando seu reino."
                    : "Splendid leadership, Sire! Keep expanding walls, gathering Crystals to awaken the Ancient Golem, and fortifying your realm."}
                </p>
                <button
                  onClick={() => setDismissed(true)}
                  className="mt-2.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>{lang === "pt" ? "Dispensar Guia" : "Dismiss Guide"}</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Step Title */}
                <div className="flex items-start gap-2">
                  <span className="font-bold text-amber-300 text-xs mt-0.5">
                    {activeStep.title}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#d6cdb8] mt-1.5 leading-relaxed bg-black/35 p-2 rounded-lg border border-amber-500/15">
                  {activeStep.desc}
                </p>

                {/* Steps Checklist Pills */}
                <div className="grid grid-cols-6 gap-1 mt-2.5">
                  {stepsData.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div
                        key={step.id}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isDone
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                            : isCurrent
                            ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                            : "bg-amber-950/80"
                        }`}
                        title={step.title}
                      />
                    );
                  })}
                </div>

                {/* Quick Hint / Action Bar */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-500/20 text-[10px] text-amber-300/80 font-mono">
                  <span>
                    {lang === "pt" ? "Progresso: " : "Progress: "}
                    <b className="text-amber-300">{currentStep}/6</b>
                  </span>
                  {currentStep === 0 && !engine.buildMode && (
                    <button
                      onClick={() => {
                        engine.buildMode = "house";
                        sound.playSfx("select");
                      }}
                      className="px-2 py-0.5 bg-amber-600/40 hover:bg-amber-500/60 border border-amber-400 text-amber-200 rounded font-bold transition-all active:scale-95"
                    >
                      {lang === "pt" ? "Abrir Obras" : "Open Build"}
                    </button>
                  )}
                  {currentStep === 1 && (
                    <button
                      onClick={() => {
                        engine.buildMode = "house";
                        sound.playSfx("select");
                      }}
                      className="px-2 py-0.5 bg-emerald-600/40 hover:bg-emerald-500/60 border border-emerald-400 text-emerald-200 rounded font-bold transition-all active:scale-95"
                    >
                      {lang === "pt" ? "Colocar Casa" : "Place House"}
                    </button>
                  )}
                  {currentStep === 2 && (
                    <button
                      onClick={() => {
                        engine.buildMode = "farm";
                        sound.playSfx("select");
                      }}
                      className="px-2 py-0.5 bg-amber-600/40 hover:bg-amber-500/60 border border-amber-400 text-amber-200 rounded font-bold transition-all active:scale-95"
                    >
                      {lang === "pt" ? "Colocar Fazenda" : "Place Farm"}
                    </button>
                  )}
                  {currentStep === 3 && (
                    <button
                      onClick={() => {
                        engine.buildMode = "tower";
                        sound.playSfx("select");
                      }}
                      className="px-2 py-0.5 bg-rose-600/40 hover:bg-rose-500/60 border border-rose-400 text-rose-200 rounded font-bold transition-all active:scale-95"
                    >
                      {lang === "pt" ? "Colocar Torre" : "Place Tower"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
