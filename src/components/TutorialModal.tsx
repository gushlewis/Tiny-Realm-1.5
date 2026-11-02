/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Language } from "../types/game";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Sun,
  Moon,
  Hammer,
  Users,
  Compass,
  Sparkles,
  Swords,
  Play,
  ZoomIn,
  MousePointer,
  Check,
} from "lucide-react";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, lang }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      id: "cycle",
      badge: lang === "pt" ? "FUNDAMENTAL" : "CORE CYCLE",
      title: lang === "pt" ? "1. O Ciclo do Reino: Dia vs Noite" : "1. The Realm Cycle: Day vs Night",
      subtitle:
        lang === "pt"
          ? "Sobreviva ao ataque eterno do enxame de insetos"
          : "Survive the eternal siege of the insect swarm",
      icon: <Sun className="text-amber-400 animate-spin-slow" size={32} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 my-auto">
          {/* Day Card */}
          <div className="bg-gradient-to-b from-[#2a1b12] to-[#170e0a] border-2 border-amber-500/40 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg text-lg">☀️</span>
                <div>
                  <h4 className="font-serif font-black text-amber-300 text-sm">
                    {lang === "pt" ? "Fase de Dia (90s)" : "Day Phase (90s)"}
                  </h4>
                  <span className="text-[10px] text-amber-200/60 font-mono uppercase">
                    {lang === "pt" ? "Expansão & Coleta" : "Expansion & Harvest"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#e7ddc4] leading-relaxed">
                {lang === "pt"
                  ? "Explore o mapa, corte madeira, minere pedras e ouro, construa fazendas e treine novos trabalhadores."
                  : "Explore the map, gather wood, mine stone & gold, build wheat farms, and recruit more villagers."}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-500/20 text-[11px] font-mono text-amber-300/80 flex items-center gap-1.5">
              <span>💡</span>
              <span>{lang === "pt" ? "Aproveite a luz do sol para se fortificar!" : "Use the daylight to fortify defenses!"}</span>
            </div>
          </div>

          {/* Night Card */}
          <div className="bg-gradient-to-b from-[#180a1c] to-[#0d0510] border-2 border-red-500/40 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-red-500/20 text-red-300 rounded-lg text-lg">🌙</span>
                <div>
                  <h4 className="font-serif font-black text-red-300 text-sm">
                    {lang === "pt" ? "Fase de Noite (30s)" : "Night Phase (30s)"}
                  </h4>
                  <span className="text-[10px] text-red-200/60 font-mono uppercase">
                    {lang === "pt" ? "Ataque do Enxame" : "Swarm Invasion"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#e7ddc4] leading-relaxed">
                {lang === "pt"
                  ? "Cigarra, besouros e formigas invadem pelo perímetro! A cada 10 ondas, surge um terrível Chefe Soberano com poderes destrutivos."
                  : "Cicadas, beetles and ants invade from the map borders! Every 10th wave summons a colossal Sovereign Boss."}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-red-500/20 text-[11px] font-mono text-red-300/80 flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{lang === "pt" ? "Proteja a Câmara Municipal a todo custo!" : "Protect the Town Hall at all costs!"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "townhall",
      badge: lang === "pt" ? "ECONOMIA & CASTELO" : "ECONOMY & CASTLE",
      title: lang === "pt" ? "2. A Câmara Municipal & Aldeões" : "2. Town Hall & Villagers",
      subtitle:
        lang === "pt"
          ? "O coração da sua colônia: recrute, evolua e alimente"
          : "The core of your colony: recruit, upgrade, and feed",
      icon: <Users className="text-emerald-400" size={32} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-auto">
          {/* Recruit */}
          <div className="bg-[#181116] border border-[#5c4a30] p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1.5">👨‍🌾</div>
              <h4 className="font-bold text-[#f2c95a] text-xs md:text-sm">
                {lang === "pt" ? "Recrutar Aldeões" : "Recruit Villagers"}
              </h4>
              <p className="text-[11px] text-[#cdc3ac] mt-1 leading-relaxed">
                {lang === "pt"
                  ? "Clique no Castelo no mapa para abrir o menu de recrutamento (custa 25 Madeira e 50 Comida)."
                  : "Click the Castle on the map to recruit new workers (costs 25 Wood and 50 Food)."}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#8fe39a] bg-black/40 px-2 py-1 rounded">
              25 🪵 · 50 🌾
            </div>
          </div>

          {/* Upgrade Castle */}
          <div className="bg-[#181116] border border-[#5c4a30] p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1.5">🏰</div>
              <h4 className="font-bold text-[#f2c95a] text-xs md:text-sm">
                {lang === "pt" ? "Fortificar Câmara" : "Fortify Castle"}
              </h4>
              <p className="text-[11px] text-[#cdc3ac] mt-1 leading-relaxed">
                {lang === "pt"
                  ? "Evolua a Câmara para Casarão e Fortaleza Real para aumentar a vida máxima e limite populacional."
                  : "Upgrade to Stronghold & Royal Bastion to drastically increase durability and population cap."}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#f2c95a] bg-black/40 px-2 py-1 rounded">
              Tier 1 ➔ 2 ➔ 3
            </div>
          </div>

          {/* Food & Farms */}
          <div className="bg-[#181116] border border-[#5c4a30] p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1.5">🌾</div>
              <h4 className="font-bold text-[#8fe39a] text-xs md:text-sm">
                {lang === "pt" ? "Fazendas & Comida" : "Farms & Food"}
              </h4>
              <p className="text-[11px] text-[#cdc3ac] mt-1 leading-relaxed">
                {lang === "pt"
                  ? "Construa Fazendas com o Martelo para gerar trigo contínuo e sustentar o crescimento dos seus guerreiros."
                  : "Build Wheat Farms using the Hammer to generate recurring food for your armies and workers."}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#73d9ff] bg-black/40 px-2 py-1 rounded">
              +2 🌾 {lang === "pt" ? "a cada 4s" : "every 4s"}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "defense",
      badge: lang === "pt" ? "DEFESA & MAGIA" : "DEFENSE & MAGIC",
      title: lang === "pt" ? "3. Soldados, Torres & O Grande Golem" : "3. Soldiers, Towers & Ancient Golem",
      subtitle:
        lang === "pt"
          ? "Monte uma linha impenetrável contra as hordas"
          : "Form an impenetrable defensive line against the bugs",
      icon: <Swords className="text-cyan-400" size={32} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-auto">
          {/* Barracks */}
          <div className="bg-[#181116] border border-[#5c4a30] p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 text-2xl mb-1.5">
                <span>⚔</span>
                <span>🏹</span>
              </div>
              <h4 className="font-bold text-[#f43f5e] text-xs md:text-sm">
                {lang === "pt" ? "Quartel Militar" : "Barracks Units"}
              </h4>
              <p className="text-[11px] text-[#cdc3ac] mt-1 leading-relaxed">
                {lang === "pt"
                  ? "Treine Guerreiros com espadas afiadas para segurar a linha de frente e Lanceiros com arremesso de longa distância."
                  : "Train heavy melee Warriors to hold chokepoints and ranged Javelin throwers to pierce flying swarms."}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-red-300 bg-black/40 px-2 py-1 rounded">
              ⚔ Guerreiro · 🏹 Lanceiro
            </div>
          </div>

          {/* Towers */}
          <div className="bg-[#181116] border border-[#5c4a30] p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1.5">🏹</div>
              <h4 className="font-bold text-[#73d9ff] text-xs md:text-sm">
                {lang === "pt" ? "Torres & Muralhas" : "Towers & Walls"}
              </h4>
              <p className="text-[11px] text-[#cdc3ac] mt-1 leading-relaxed">
                {lang === "pt"
                  ? "Torres de vigia disparam flechas automáticas e iluminam a noite com tochas. Use paliçadas para afunilar os insetos."
                  : "Watchtowers shoot automated arrows and cast bright torchlight. Use palisades to channel bugs into killzones."}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#73d9ff] bg-black/40 px-2 py-1 rounded">
              🔥 Tocha + Tiro Automático
            </div>
          </div>

          {/* Ancient Golem */}
          <div className="bg-[#181116] border border-[#5c4a30] p-3 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1.5">🗿</div>
              <h4 className="font-bold text-[#a855f7] text-xs md:text-sm">
                {lang === "pt" ? "Golem de Cristal" : "Crystal Golem"}
              </h4>
              <p className="text-[11px] text-[#cdc3ac] mt-1 leading-relaxed">
                {lang === "pt"
                  ? "Elimine insetos para colher Cristais 💎. Ao juntar 100 Cristais, clique no botão da Estátua para invocar o poderoso Colosso de Pedra!"
                  : "Kill bugs to harvest Crystals 💎. Collect 100 Crystals to awaken the colossal Stone Golem with massive AoE smash!"}
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-purple-300 bg-black/40 px-2 py-1 rounded">
              100 💎 ➔ Invocação Épica
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "controls",
      badge: lang === "pt" ? "CONTROLES & ATALHOS" : "CONTROLS & SHORTCUTS",
      title: lang === "pt" ? "4. Controles, Zoom & Navegação" : "4. Controls, Zoom & Navigation",
      subtitle:
        lang === "pt"
          ? "Como mover a câmera, dar zoom e dar ordens rápidas"
          : "How to pan camera, zoom, and issue rapid orders",
      icon: <Compass className="text-amber-400" size={32} />,
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-auto">
          {/* Pan */}
          <div className="bg-[#181116] border border-[#5c4a30] p-2.5 rounded-xl text-center">
            <div className="text-xl mb-1">🖐🖱</div>
            <h5 className="font-bold text-[#f2c95a] text-xs">
              {lang === "pt" ? "Arrastar Mapa" : "Pan Map"}
            </h5>
            <p className="text-[10px] text-[#cdc3ac] mt-1">
              {lang === "pt" ? "Arraste com o mouse ou toque para mover a câmera." : "Drag with mouse or finger to move camera."}
            </p>
          </div>

          {/* Zoom */}
          <div className="bg-[#181116] border border-[#5c4a30] p-2.5 rounded-xl text-center">
            <div className="text-xl mb-1">🔍</div>
            <h5 className="font-bold text-[#73d9ff] text-xs">
              {lang === "pt" ? "Zoom +/-" : "Zoom In/Out"}
            </h5>
            <p className="text-[10px] text-[#cdc3ac] mt-1">
              {lang === "pt" ? "Roda do mouse, pinça no celular ou botões +/- no HUD." : "Mouse wheel, pinch on mobile, or HUD buttons."}
            </p>
          </div>

          {/* Auto Assign */}
          <div className="bg-[#181116] border border-[#5c4a30] p-2.5 rounded-xl text-center">
            <div className="text-xl mb-1">⚡ (Q)</div>
            <h5 className="font-bold text-[#8fe39a] text-xs">
              {lang === "pt" ? "Auto-Atribuir" : "Auto-Assign"}
            </h5>
            <p className="text-[10px] text-[#cdc3ac] mt-1">
              {lang === "pt" ? "Coloca todos os aldeões ociosos para trabalhar imediatamente." : "Instantly assigns all idle villagers to needed jobs."}
            </p>
          </div>

          {/* Roles */}
          <div className="bg-[#181116] border border-[#5c4a30] p-2.5 rounded-xl text-center">
            <div className="text-xl mb-1">🔢 (1-5)</div>
            <h5 className="font-bold text-[#f43f5e] text-xs">
              {lang === "pt" ? "Trocar Profissão" : "Switch Job"}
            </h5>
            <p className="text-[10px] text-[#cdc3ac] mt-1">
              {lang === "pt" ? "Teclas 1 a 5 mudam a função do aldeão selecionado." : "Keys 1-5 change selected villager role instantly."}
            </p>
          </div>
        </div>
      ),
    },
  ];

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#1c0e14] via-[#10070c] to-[#080306] border-2 border-[#d9ad3f] rounded-3xl p-4 md:p-6 shadow-[0_0_50px_rgba(217,173,63,0.3)] text-[#cdc3ac] flex flex-col justify-between min-h-[460px] md:min-h-[520px]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#5c4a30]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#d9ad3f]/20 border border-[#d9ad3f]/40 rounded-xl text-amber-300">
              {slide.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#f2c95a] uppercase px-2 py-0.5 bg-[#d9ad3f]/15 rounded-full border border-[#d9ad3f]/30">
                {slide.badge}
              </span>
              <h3 className="font-serif font-black text-base md:text-xl text-[#f2c95a] mt-0.5">
                {slide.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-[#2a1419] hover:bg-[#3a1f22] border border-[#5c4a30] hover:border-[#d9ad3f] text-[#f4c97a] rounded-xl transition-all shadow"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Center Dynamic Slide Content */}
        <div className="my-4 flex-1 flex flex-col justify-center">
          <p className="text-xs md:text-sm text-[#cdc3ac]/80 mb-3 italic">
            {slide.subtitle}
          </p>
          {slide.content}
        </div>

        {/* Bottom Navigation & Controls */}
        <div className="pt-3 border-t border-[#5c4a30]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === i
                    ? "w-8 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    : "w-2.5 bg-[#5c4a30]/60 hover:bg-[#d9ad3f]/50"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                className="btn-rpg px-3 py-2 bg-[#201016] border border-[#5c4a30] hover:border-[#d9ad3f] text-[#cdc3ac] text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 shadow"
              >
                <ChevronLeft size={16} />
                <span>{lang === "pt" ? "Anterior" : "Previous"}</span>
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                className="btn-rpg px-4 py-2 bg-gradient-to-r from-[#d9ad3f] to-[#8a6a1f] hover:brightness-110 text-[#180a04] text-xs md:text-sm font-black rounded-xl flex items-center gap-1.5 active:scale-95 shadow-[0_0_12px_rgba(217,173,63,0.4)]"
              >
                <span>{lang === "pt" ? "Próximo" : "Next"}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="btn-rpg px-5 py-2 bg-gradient-to-r from-[#22c55e] to-[#15803d] hover:brightness-110 text-white text-xs md:text-sm font-black rounded-xl flex items-center gap-1.5 active:scale-95 shadow-[0_0_16px_rgba(34,197,94,0.6)]"
              >
                <Play size={14} className="fill-current" />
                <span>{lang === "pt" ? "Jogar Agora!" : "Play Now!"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
