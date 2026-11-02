/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GameEngine, BUILD_SPECS, ROLE_INFO, BALANCE, TS, COLS, ROWS } from "../game/engine";
import { t } from "../game/i18n";
import { sound, haptic } from "../game/audio";
import { Language, RoleType, BuildingType, AltarHeroRole } from "../types/game";
import { GuidedTutorialHUD } from "./GuidedTutorialHUD";
import { MinimapRadar } from "./MinimapRadar";
import { downloadOfflineGame } from "../game/offlineBundle";
import {
  Volume2,
  VolumeX,
  Music,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
  Crosshair,
  Users,
  Swords,
  Flame,
  Zap,
  Trees,
  Pickaxe,
  Coins,
  Wheat,
  Gem,
  Home,
  Hammer,
  BookOpen,
  Shield,
  ShieldAlert,
  Castle,
  Package,
  Hand,
  BoxSelect,
  X,
  Check,
  Crown,
  Trash2,
  Wrench,
  AlertTriangle,
  Bell,
  FastForward,
  Download,
} from "lucide-react";

interface GameHUDProps {
  engine: GameEngine;
  lang: Language;
  onSetLang: (lang: Language) => void;
  onOpenCodex: () => void;
  onOpenTutorial: () => void;
  onOpenRestartModal: () => void;
}

// Small, discreet animated pixel head for each worker profession
const WorkerHeadIcon: React.FC<{ role: RoleType; isIdle?: boolean }> = ({ role, isIdle }) => {
  const configs: Record<RoleType, { hat: string; plume?: string; trim: string; skin: string }> = {
    builder: { hat: "#eab308", trim: "#ca8a04", skin: "#fed7aa" },
    woodcutter: { hat: "#15803d", plume: "#dc2626", trim: "#166534", skin: "#fed7aa" },
    stoneMiner: { hat: "#64748b", trim: "#334155", skin: "#fed7aa" },
    goldMiner: { hat: "#f59e0b", trim: "#d97706", skin: "#fed7aa" },
    farmer: { hat: "#d97706", trim: "#92400e", skin: "#fed7aa" },
    warrior: { hat: "#475569", plume: "#e11d48", trim: "#1e293b", skin: "#fed7aa" },
    javelin: { hat: "#0284c7", plume: "#38bdf8", trim: "#0369a1", skin: "#fed7aa" },
    trainee: { hat: "#854d0e", trim: "#713f12", skin: "#fed7aa" },
    scout: { hat: "#047857", plume: "#10b981", trim: "#065f46", skin: "#fed7aa" },
  };

  const conf = configs[role] || configs.builder;

  return (
    <div className="relative w-6 h-6 flex items-center justify-center">
      <svg
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`w-6 h-6 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] transition-transform ${
          isIdle ? "animate-bounce" : "hover:scale-110"
        }`}
        style={{ animationDuration: "2.2s" }}
      >
        {/* Head / Face */}
        <rect x="4" y="5" width="8" height="8" rx="1" fill={conf.skin} />
        {/* Eyes */}
        <rect x="6" y="8" width="1.5" height="1.5" fill="#1e1b4b" />
        <rect x="9" y="8" width="1.5" height="1.5" fill="#1e1b4b" />
        {/* Hat / Helm */}
        <rect x="3" y="3" width="10" height="3.5" rx="1" fill={conf.hat} />
        <rect x="2.5" y="5" width="11" height="1.5" fill={conf.trim} />
        {/* Plume or Feather */}
        {conf.plume && <rect x="9" y="1" width="2" height="3" fill={conf.plume} />}
      </svg>
      {isIdle && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 border border-black animate-ping" />
      )}
    </div>
  );
};

const BUILDING_ORDER: BuildingType[] = [
  "house",
  "farm",
  "lumber",
  "quarry",
  "tower",
  "barracks",
  "palisade",
  "gate",
  "altar",
];

const BUILDING_METADATA: Record<
  BuildingType,
  {
    name: { pt: string; en: string };
    desc: { pt: string; en: string };
    category: { pt: string; en: string };
    gradient: string;
    border: string;
    icon: (s?: number) => React.ReactNode;
  }
> = {
  house: {
    name: { pt: "Casa", en: "House" },
    desc: { pt: "+2 Limite de População", en: "+2 Max population" },
    category: { pt: "Crescimento", en: "Growth" },
    gradient: "from-[#2f1b0a] to-[#1a0e05]",
    border: "border-amber-500/70",
    icon: (s = 22) => <Home size={s} className="text-amber-400" />,
  },
  farm: {
    name: { pt: "Fazenda", en: "Farm" },
    desc: { pt: "+Produz Comida contínua", en: "+Recurring food supply" },
    category: { pt: "Crescimento", en: "Growth" },
    gradient: "from-[#2b2408] to-[#161203]",
    border: "border-yellow-500/70",
    icon: (s = 22) => <Wheat size={s} className="text-yellow-400" />,
  },
  lumber: {
    name: { pt: "Serraria", en: "Lumber Camp" },
    desc: { pt: "+Acelera Coleta de Madeira", en: "+Boosts wood gathering" },
    category: { pt: "Recurso", en: "Resource" },
    gradient: "from-[#112a15] to-[#08170b]",
    border: "border-emerald-500/70",
    icon: (s = 22) => <Trees size={s} className="text-emerald-400" />,
  },
  quarry: {
    name: { pt: "Pedreira", en: "Quarry" },
    desc: { pt: "+Acelera Mineração de Pedra", en: "+Boosts stone mining" },
    category: { pt: "Recurso", en: "Resource" },
    gradient: "from-[#1e232b] to-[#0f1217]",
    border: "border-slate-400/70",
    icon: (s = 22) => <Pickaxe size={s} className="text-slate-300" />,
  },
  tower: {
    name: { pt: "Torre de Vigia", en: "Watchtower" },
    desc: { pt: "Dispara Flechas automáticas", en: "Fires arrows at invaders" },
    category: { pt: "Defesa", en: "Defense" },
    gradient: "from-[#0f2336] to-[#07131e]",
    border: "border-sky-500/70",
    icon: (s = 22) => <Crosshair size={s} className="text-sky-400" />,
  },
  barracks: {
    name: { pt: "Quartel", en: "Barracks" },
    desc: { pt: "Treina Tropas de combate", en: "Trains combat units" },
    category: { pt: "Militar", en: "Military" },
    gradient: "from-[#331116] to-[#1c080b]",
    border: "border-rose-500/70",
    icon: (s = 22) => <Swords size={s} className="text-rose-400" />,
  },
  palisade: {
    name: { pt: "Paliçada", en: "Palisade" },
    desc: { pt: "Muralha rápida de bloqueio", en: "Fast barrier wall" },
    category: { pt: "Muralha", en: "Wall" },
    gradient: "from-[#281810] to-[#140b07]",
    border: "border-amber-700/70",
    icon: (s = 22) => <Shield size={s} className="text-amber-500" />,
  },
  gate: {
    name: { pt: "Portão", en: "Wall Gate" },
    desc: { pt: "Portão com passagem de tropas", en: "Troop passable gate" },
    category: { pt: "Muralha", en: "Wall" },
    gradient: "from-[#271d14] to-[#140e0a]",
    border: "border-yellow-600/70",
    icon: (s = 22) => <ShieldAlert size={s} className="text-yellow-500" />,
  },
  altar: {
    name: { pt: "Altar Sagrado", en: "Hero Altar" },
    desc: { pt: "Invoca o Herói Lendário!", en: "Summons the Realm Hero!" },
    category: { pt: "Lendário", en: "Legendary" },
    gradient: "from-[#2a1038] to-[#15071d]",
    border: "border-purple-500/70",
    icon: (s = 22) => <Crown size={s} className="text-purple-400" />,
  },
  townhall: {
    name: { pt: "Centro da Cidade", en: "Town Hall" },
    desc: { pt: "Coração do seu reino", en: "Heart of your kingdom" },
    category: { pt: "Reino", en: "Kingdom" },
    gradient: "from-[#352309] to-[#1c1204]",
    border: "border-amber-400/70",
    icon: (s = 22) => <Castle size={s} className="text-amber-400" />,
  },
};

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  lang,
  onSetLang,
  onOpenCodex,
  onOpenTutorial,
  onOpenRestartModal,
}) => {
  const [, setTick] = useState(0);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [confirmDemolishId, setConfirmDemolishId] = useState<number | null>(null);

  // Sync state 6 times a second for snappy UI
  useEffect(() => {
    const interval = setInterval(() => setTick((prev) => prev + 1), 160);
    return () => clearInterval(interval);
  }, []);

  const p = engine.phaseInfo();
  const c = engine.castle();

  const selectedUnit =
    engine.selected?.kind === "unit"
      ? engine.units.find((u) => u.id === engine.selected!.id && u.state !== "death")
      : null;

  const selectedSquad =
    engine.selectedUnitIds.length > 1
      ? engine.units.filter(
          (u) => engine.selectedUnitIds.includes(u.id) && u.state !== "death"
        )
      : [];

  const selectedBuilding =
    engine.selected?.kind === "building"
      ? engine.buildings.find((b) => b.id === engine.selected!.id)
      : null;

  const selectedHeroRole = engine.selectedHeroRole;
  const selectedHero =
    selectedHeroRole && selectedHeroRole !== "golem"
      ? engine.altarHeroes[selectedHeroRole]
      : null;
  const isGolemSelected = selectedHeroRole === "golem" && engine.golem;
  const activeHero =
    engine.heroUnit ||
    (Object.values(engine.altarHeroes).find((h) => h && (h as any).hp > 0) as any);

  const formatSecs = (sec?: number | null) => {
    if (sec === undefined || sec === null || isNaN(sec) || !isFinite(sec)) return "00:00";
    const s = Math.max(0, Math.ceil(sec));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const isBossWave = p.isBossWave;
  const threatLabel =
    engine.waveNumber <= 3
      ? t("calm", lang)
      : engine.waveNumber <= 7
      ? t("rising", lang)
      : engine.waveNumber <= 12
      ? t("fierce", lang)
      : engine.waveNumber <= 18
      ? t("brutal", lang)
      : t("swarm", lang);

  const alivePop = engine.aliveUnits().length;
  const maxPop = engine.popCap();
  const popRatio = Math.min(1, alivePop / maxPop);

  // Day/Night Cycle Orb rotation
  const cycleTotal = BALANCE.cycle.total;
  const timeInCycle = ((engine.time % cycleTotal) + cycleTotal) % cycleTotal;
  const cycleRatio = timeInCycle / cycleTotal;
  const orbRotation = cycleRatio * 360;

  const readiness = engine.readiness();
  const roleCounts = engine.getRoleCounts();
  const idleVillagersCount = engine.getIdleVillagerCount();

  // Active builders count for multiplier display
  const activeBuilders = engine.units.filter(
    (u) => u.state !== "death" && u.role === "builder" && u.target?.kind === "build"
  ).length;

  const damagedBuildingsCount = engine.buildings.filter(
    (b) => b.complete && b.hp > 0 && b.hp < b.maxHp
  ).length;

  const shelteredUnitsCount = engine.units.filter(
    (u) => u.state !== "death" && u.sheltered
  ).length;

  const aliveEnemies = engine.enemies.filter((e) => e.state !== "death").length;

  // Critically low resource thresholds to help players prioritize gathering
  const isWoodLow = engine.resources.wood < 15;
  const isStoneLow = engine.resources.stone < 12;
  const isGoldLow = engine.resources.gold < 12;
  const isFoodLow = engine.resources.food < 15;

  const lowResourcesList: {
    key: "food" | "gold" | "wood" | "stone";
    label: string;
    color: string;
  }[] = [];
  if (isFoodLow) {
    lowResourcesList.push({
      key: "food",
      label: lang === "pt" ? "Comida" : "Food",
      color: "text-emerald-300 border-emerald-500/60 bg-emerald-950/80",
    });
  }
  if (isGoldLow) {
    lowResourcesList.push({
      key: "gold",
      label: lang === "pt" ? "Ouro" : "Gold",
      color: "text-yellow-300 border-yellow-500/60 bg-yellow-950/80",
    });
  }
  if (isWoodLow) {
    lowResourcesList.push({
      key: "wood",
      label: lang === "pt" ? "Madeira" : "Wood",
      color: "text-amber-300 border-amber-500/60 bg-amber-950/80",
    });
  }
  if (isStoneLow) {
    lowResourcesList.push({
      key: "stone",
      label: lang === "pt" ? "Pedra" : "Stone",
      color: "text-slate-200 border-slate-400/60 bg-slate-900/80",
    });
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-3 overflow-hidden font-sans select-none z-30">
      {/* 1. TOP OVERLAY RAIL: Discrete Horizontal Resources (Top-Left) + Centered Wave Pill with Day/Night Orb + Actions (Top-Right) */}
      <div className="w-full flex flex-wrap items-start justify-between relative pointer-events-none gap-2">
        {/* Top-Left Column: Horizontal Resource Rail (#trHud) + Subtle Low-Resource Notification */}
        <div className="flex flex-col items-start gap-1.5 pointer-events-none">
          <div id="trHud" className="flex flex-wrap items-center gap-1 md:gap-1.5 pointer-events-auto bg-[#060408]/95 border border-[#d9ad3f]/40 p-1 md:p-1.5 rounded-2xl shadow-2xl backdrop-blur-md">
            {/* Wood */}
            <button
              type="button"
              onClick={() => engine.prioritizeResourceGathering("wood")}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-inner ${
                isWoodLow
                  ? "bg-[#2b1114]/95 border border-rose-500/90 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.45)] animate-pulse"
                  : "bg-[#1c0f08]/90 border border-amber-900/60 hover:border-amber-400 text-[#fef3c7]"
              }`}
              title={
                isWoodLow
                  ? lang === "pt"
                    ? "⚠️ Madeira Crítica! Clique para priorizar coleta"
                    : "⚠️ Critical Wood! Click to prioritize gathering"
                  : `${t("wood", lang)} (${lang === "pt" ? "Clique para focar coleta" : "Click to focus gathering"})`
              }
            >
              <Trees size={18} className={`${isWoodLow ? "text-rose-400" : "text-amber-400"} shrink-0 filter drop-shadow`} />
              <b className={`text-xs md:text-sm font-black font-mono ${isWoodLow ? "text-rose-300" : "text-[#fcd34d]"}`}>
                {Math.floor(engine.resDisplay.wood)}
              </b>
              {isWoodLow && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              )}
            </button>

            {/* Stone */}
            <button
              type="button"
              onClick={() => engine.prioritizeResourceGathering("stone")}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-inner ${
                isStoneLow
                  ? "bg-[#2b1114]/95 border border-rose-500/90 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.45)] animate-pulse"
                  : "bg-[#141820]/90 border border-slate-700/60 hover:border-slate-300 text-[#f8fafc]"
              }`}
              title={
                isStoneLow
                  ? lang === "pt"
                    ? "⚠️ Pedra Crítica! Clique para priorizar mineração"
                    : "⚠️ Critical Stone! Click to prioritize mining"
                  : `${t("stone", lang)} (${lang === "pt" ? "Clique para focar coleta" : "Click to focus gathering"})`
              }
            >
              <Pickaxe size={18} className={`${isStoneLow ? "text-rose-400" : "text-slate-300"} shrink-0 filter drop-shadow`} />
              <b className={`text-xs md:text-sm font-black font-mono ${isStoneLow ? "text-rose-300" : "text-[#e2e8f0]"}`}>
                {Math.floor(engine.resDisplay.stone)}
              </b>
              {isStoneLow && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              )}
            </button>

            {/* Gold */}
            <button
              type="button"
              onClick={() => engine.prioritizeResourceGathering("gold")}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-inner ${
                isGoldLow
                  ? "bg-[#2d1215]/95 border border-amber-400/90 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.55)] animate-pulse"
                  : "bg-[#221a08]/90 border border-yellow-700/60 hover:border-yellow-400 text-[#fef08a]"
              }`}
              title={
                isGoldLow
                  ? lang === "pt"
                    ? "⚠️ Ouro Crítico! Clique para priorizar mineração de ouro"
                    : "⚠️ Critical Gold! Click to prioritize gold mining"
                  : `${t("gold", lang)} (${lang === "pt" ? "Clique para focar coleta" : "Click to focus gathering"})`
              }
            >
              <Coins size={18} className={`${isGoldLow ? "text-amber-300" : "text-yellow-400"} shrink-0 filter drop-shadow`} />
              <b className={`text-xs md:text-sm font-black font-mono ${isGoldLow ? "text-rose-300" : "text-[#fef08a]"}`}>
                {Math.floor(engine.resDisplay.gold)}
              </b>
              {isGoldLow && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Food */}
            <button
              type="button"
              onClick={() => engine.prioritizeResourceGathering("food")}
              className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-inner ${
                isFoodLow
                  ? "bg-[#2d1115]/95 border border-rose-500/90 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.55)] animate-pulse"
                  : "bg-[#0f2414]/90 border border-emerald-800/60 hover:border-emerald-400 text-[#bbf7d0]"
              }`}
              title={
                isFoodLow
                  ? lang === "pt"
                    ? "⚠️ Comida Crítica! Clique para priorizar fazendas e colheita"
                    : "⚠️ Critical Food! Click to prioritize farms and harvesting"
                  : `${t("food", lang)} (${lang === "pt" ? "Clique para focar coleta" : "Click to focus gathering"})`
              }
            >
              <Wheat size={18} className={`${isFoodLow ? "text-rose-400" : "text-emerald-400"} shrink-0 filter drop-shadow`} />
              <b className={`text-xs md:text-sm font-black font-mono ${isFoodLow ? "text-rose-300" : "text-[#86efac]"}`}>
                {Math.floor(engine.resDisplay.food)}
              </b>
              {isFoodLow && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              )}
            </button>

            {/* Crystal */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0f1d2e]/90 border border-sky-800/60 hover:border-cyan-400 rounded-xl text-[#bae6fd] transition-colors cursor-default shadow-inner"
              title={t("crystal", lang)}
            >
              <Gem size={18} className="text-cyan-400 shrink-0 animate-pulse filter drop-shadow" />
              <b className="text-xs md:text-sm font-black font-mono text-[#7dd3fc]">
                {Math.floor(engine.resDisplay.crystal)}
              </b>
            </div>

            {/* Pop Cap Chip */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a120b]/90 border border-amber-900/60 hover:border-amber-400 rounded-xl text-[#fef3c7] transition-colors cursor-default shadow-inner"
              title="Capacidade Populacional"
            >
              <Home size={18} className="text-amber-400 shrink-0 filter drop-shadow" />
              <b
                className={`text-xs md:text-sm font-black font-mono ${
                  alivePop >= maxPop ? "text-rose-400" : "text-[#fcd34d]"
                }`}
              >
                {alivePop}/{maxPop}
              </b>
            </div>
          </div>

          {/* Subtle Low-Resource Notification Pill */}
          {lowResourcesList.length > 0 && (
            <div
              id="trLowResAlert"
              className="pointer-events-auto flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#18090c]/90 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.28)] backdrop-blur-md text-[11px] text-rose-200 animate-in fade-in duration-200"
            >
              <AlertTriangle size={13} className="text-amber-400 animate-pulse shrink-0" />
              <span className="font-semibold text-rose-200/95">
                {lang === "pt" ? "Estoque baixo:" : "Low stock:"}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {lowResourcesList.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => engine.prioritizeResourceGathering(item.key)}
                    className={`px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-bold hover:brightness-125 active:scale-95 transition-all cursor-pointer ${item.color}`}
                    title={
                      lang === "pt"
                        ? `Clique para priorizar coleta de ${item.label}`
                        : `Click to prioritize ${item.label} gathering`
                    }
                  >
                    {item.label} ⚡
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Centered Wave & Threat Level Indicator with Day/Night Orb (#trWavePill) */}
        <div
          id="trWavePill"
          className="pointer-events-auto flex items-center gap-3 bg-[#060408]/95 border border-[#d9ad3f]/50 px-3.5 py-1.5 rounded-2xl shadow-2xl backdrop-blur-md cursor-default shrink-0"
        >
          {/* Day / Night Celestial Rotating Orb (#cycleOrb) */}
          <div
            id="cycleOrb"
            className={`cycleOrb relative cursor-pointer active:scale-95 transition-transform shrink-0 ${
              isBossWave ? "bot" : ""
            }`}
            style={{ transform: `rotate(${orbRotation}deg)` }}
            title={
              p.name === "Build"
                ? t("dayTooltip", lang)
                : isBossWave
                ? t("bossTooltip", lang)
                : t("nightTooltip", lang)
            }
          >
            <div className="moonSide" />
            <div className="sunSide" />
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-black font-serif uppercase tracking-widest text-[#d9ad3f]">
                {t("wave", lang)} {engine.waveNumber}
              </span>
              <div className="h-3 w-[1px] bg-[#5c4a30]" />
              <span
                className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full ${
                  isBossWave
                    ? "bg-purple-950/80 text-purple-300 border border-purple-500 animate-pulse"
                    : p.name === "Wave"
                    ? "bg-red-950/80 text-red-300 border border-red-500 animate-pulse"
                    : "bg-amber-950/80 text-amber-300 border border-amber-500/60"
                }`}
              >
                {isBossWave
                  ? t("bossPhase", lang)
                  : p.name === "Wave"
                  ? t("wavePhase", lang)
                  : t("buildPhase", lang)}
              </span>
              <div className="h-3 w-[1px] bg-[#5c4a30]" />
              <span className="text-sm font-black font-mono tabular-nums text-[#f2c95a]">
                {formatSecs(p.remain)}
              </span>
              {p.name === "Build" && p.remain > 10 && (
                <button
                  type="button"
                  onClick={() => engine.callWaveEarly()}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-700/90 to-red-800/90 hover:brightness-125 border border-amber-400/80 text-[10px] font-mono font-bold text-amber-100 shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  title={
                    lang === "pt"
                      ? "Chamar a onda agora e receber Bônus de Coragem (+Ouro e +Cristais)!"
                      : "Call the wave early for a Courage Bonus (+Gold & +Crystals)!"
                  }
                >
                  <Swords size={11} className="text-amber-300" />
                  <span>{lang === "pt" ? "Chamar Onda" : "Call Wave"}</span>
                </button>
              )}
            </div>

            <div className="text-[10px] text-[#a8926a] font-mono flex items-center gap-2">
              <span>
                {t("tierLabel", lang)} {c ? c.tier : 1}
              </span>
              <span>·</span>
              <span>
                {t("threat", lang)}: <b className="text-amber-300">{threatLabel}</b>
              </span>
              {activeBuilders > 1 && (
                <>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">
                    ⚡ {activeBuilders}x {lang === "pt" ? "Velocidade Obra" : "Build Speed"}
                  </span>
                </>
              )}
              {aliveEnemies > 0 && (p.name === "Wave" || isBossWave) && (
                <>
                  <span>·</span>
                  <span className="text-red-400 font-bold flex items-center gap-1 animate-pulse">
                    👾 {aliveEnemies} {lang === "pt" ? "restantes" : "left"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Castle Health Warning Alert & Quick Repair All */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-none">
          {c && c.hp < c.maxHp && (
            <button
              onClick={() => {
                engine.centerOnCastle();
                sound.playSfx("select");
                haptic("light");
              }}
              className={`pointer-events-auto px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
                c.hp < c.maxHp * 0.4
                  ? "bg-red-950/95 border-red-500 text-red-200 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                  : "bg-amber-950/90 border-amber-500/70 text-amber-200"
              }`}
              title={lang === "pt" ? "Centralizar no Castelo" : "Center Castle"}
            >
              <Castle size={13} className={c.hp < c.maxHp * 0.4 ? "text-red-400 animate-bounce" : "text-amber-400"} />
              <span>
                {lang === "pt" ? "Castelo: " : "Castle: "}
                <b>{Math.ceil(c.hp)}/{c.maxHp} HP</b>
              </span>
            </button>
          )}

          {damagedBuildingsCount > 0 && (
            <button
              type="button"
              onClick={() => engine.repairAllDamagedBuildings()}
              className="pointer-events-auto px-2.5 py-1 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400/70 text-emerald-200 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              title={
                lang === "pt"
                  ? `Enviar construtores para reparar ${damagedBuildingsCount} estrutura(s) danificada(s)`
                  : `Send builders to repair ${damagedBuildingsCount} damaged structure(s)`
              }
            >
              <Wrench size={12} className="text-emerald-300" />
              <span>
                {lang === "pt"
                  ? `Reparar Tudo (${damagedBuildingsCount})`
                  : `Repair All (${damagedBuildingsCount})`}
              </span>
            </button>
          )}
        </div>

        {/* Top-Right Control Toolbar (#trActions) */}
        <div id="trActions" className="pointer-events-auto flex items-center gap-1 bg-[#060408]/95 border border-[#d9ad3f]/40 p-1 md:p-1.5 rounded-2xl shadow-2xl backdrop-blur-md shrink-0">
          {/* Touch Mode Pan / Box Selection Toggle */}
          <button
            onClick={() => {
              engine.touchMode = engine.touchMode === "pan" ? "box" : "pan";
              sound.playSfx("click");
            }}
            className={`p-2 rounded-xl border transition-all active:scale-95 ${
              engine.touchMode === "box"
                ? "bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                : "bg-transparent border-transparent hover:bg-white/10 text-[#cdc3ac] hover:text-[#f2c95a]"
            }`}
            title={
              engine.touchMode === "pan"
                ? lang === "pt"
                  ? "Modo Toque: Navegar Tela (Toque para Seleção em Caixa)"
                  : "Touch: Pan Camera (Tap for Box Select)"
                : lang === "pt"
                ? "Modo Toque: Seleção em Caixa (Toque para Navegar)"
                : "Touch: Box Select (Tap for Pan Camera)"
            }
          >
            {engine.touchMode === "pan" ? <Hand size={18} /> : <BoxSelect size={18} />}
          </button>

          {/* Quick Tutorial Modal Trigger */}
          <button
            onClick={onOpenTutorial}
            className="p-2 hover:bg-white/10 text-amber-300 rounded-xl transition-all active:scale-95"
            title={lang === "pt" ? "Abrir Guia & Tutorial" : "Open Tutorial Slides"}
          >
            <BookOpen size={18} />
          </button>

          {/* Center on Castle */}
          <button
            onClick={() => {
              engine.centerOnCastle();
              sound.playSfx("select");
            }}
            className="p-2 hover:bg-white/10 text-cyan-300 rounded-xl transition-all active:scale-95"
            title={lang === "pt" ? "Centralizar no Castelo" : "Center Camera on Castle"}
          >
            <Crosshair size={18} />
          </button>

          {/* Zoom In */}
          <button
            onClick={() => {
              engine.camera.zoom = Math.min(2.5, engine.camera.zoom * 1.2);
            }}
            className="p-2 hover:bg-white/10 text-[#f2c95a] rounded-xl transition-all active:scale-95 hidden sm:flex"
            title="Zoom In (+)"
          >
            <Plus size={18} />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => {
              engine.camera.zoom = Math.max(0.4, engine.camera.zoom * 0.83);
            }}
            className="p-2 hover:bg-white/10 text-[#f2c95a] rounded-xl transition-all active:scale-95 hidden sm:flex"
            title="Zoom Out (-)"
          >
            <Minus size={18} />
          </button>

          {/* Game Speed Multiplier (1x / 1.5x / 2x) */}
          <button
            onClick={() => engine.cycleGameSpeed()}
            className={`px-2 py-1.5 rounded-xl border text-xs font-mono font-black transition-all active:scale-95 flex items-center gap-1 ${
              engine.speed > 1
                ? "bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                : "bg-transparent border-transparent hover:bg-white/10 text-[#f2c95a]"
            }`}
            title={
              lang === "pt"
                ? `Velocidade do Jogo: ${engine.speed}x (Clique ou tecle V para alternar 1x / 1.5x / 2x)`
                : `Game Speed: ${engine.speed}x (Click or press V to cycle 1x / 1.5x / 2x)`
            }
          >
            <FastForward size={15} />
            <span>{engine.speed}x</span>
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              engine.paused = !engine.paused;
              sound.playSfx("click");
            }}
            className="p-2 hover:bg-white/10 text-[#f2c95a] rounded-xl transition-all active:scale-95"
            title={engine.paused ? t("resume", lang) : t("pause", lang)}
          >
            {engine.paused ? (
              <Play size={18} className="text-emerald-400" />
            ) : (
              <Pause size={18} />
            )}
          </button>

          {/* Sound & Meditative Ambient Mute / Unmute */}
          <button
            onClick={() => sound.setMuted(!sound.muted)}
            className={`p-2 rounded-xl transition-all active:scale-95 flex items-center gap-1 ${
              sound.muted
                ? "hover:bg-red-950/40 text-red-400"
                : "hover:bg-amber-500/20 text-[#f2c95a]"
            }`}
            title={
              lang === "pt"
                ? sound.muted
                  ? "Ativar Ambiente Meditativo e Efeitos Sonoros"
                  : "Ambiente Meditativo: Ativo (Clique para silenciar)"
                : sound.muted
                ? "Unmute Meditative Ambient & Sound Effects"
                : "Meditative Ambient: Active (Click to mute)"
            }
          >
            {sound.muted ? (
              <VolumeX size={18} className="text-red-400" />
            ) : (
              <div className="flex items-center gap-0.5">
                <Music size={15} className="text-amber-300 animate-pulse" />
                <Volume2 size={16} />
              </div>
            )}
          </button>

          {/* Download Standalone Offline HTML */}
          <button
            onClick={() => downloadOfflineGame("tiny-realm.html")}
            className="p-2 hover:bg-emerald-500/20 text-emerald-300 rounded-xl transition-all active:scale-95"
            title={
              lang === "pt"
                ? "Baixar jogo completo em HTML Offline (tiny-realm.html)"
                : "Download standalone Offline HTML game (tiny-realm.html)"
            }
          >
            <Download size={18} />
          </button>

          {/* Restart */}
          <button
            onClick={onOpenRestartModal}
            className="p-2 hover:bg-white/10 text-[#f2c95a] rounded-xl transition-all active:scale-95"
            title={t("restart", lang)}
          >
            <RotateCcw size={18} />
          </button>

          {/* Language Toggle */}
          <div className="flex gap-0.5 bg-[#140b10] border border-[#d9ad3f]/40 rounded-xl p-0.5 ml-0.5">
            <button
              onClick={() => onSetLang("en")}
              className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                lang === "en"
                  ? "bg-[#d9ad3f]/40 text-[#f2c95a] font-black shadow"
                  : "text-[#cdc3ac] hover:text-[#f2c95a]"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onSetLang("pt")}
              className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                lang === "pt"
                  ? "bg-[#d9ad3f]/40 text-[#f2c95a] font-black shadow"
                  : "text-[#cdc3ac] hover:text-[#f2c95a]"
              }`}
            >
              PT
            </button>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE AREA: Selected Entity / Squad / Hero / Building Inspection Card */}
      <div className="w-full flex items-center justify-between pointer-events-none relative my-auto">
        {/* Left Space: Selected Entity Inspector Card (#trSel) */}
        <div className="pointer-events-auto max-w-[320px]">
          {/* SQUAD MULTI-SELECTION */}
          {selectedSquad.length > 0 ? (
            <div
              id="trSel"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#060408]/95 border-2 border-[#73d9ff]/60 p-3 rounded-2xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-[#5c4a30]/50 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-[#73d9ff]" />
                  <span className="font-serif font-black text-[#73d9ff] text-sm">
                    {lang === "pt" ? "Esquadrão Selecionado" : "Squad Selected"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#73d9ff]/20 border border-[#73d9ff]/40 rounded-full text-[10px] font-mono text-[#73d9ff] font-bold">
                    {selectedSquad.length} {lang === "pt" ? "unidades" : "units"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      engine.select(null);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[#18111f] hover:bg-[#341829] text-[#a090b0] hover:text-rose-300 transition-colors font-bold text-xs"
                    title={lang === "pt" ? "Desmarcar" : "Deselect"}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#cdc3ac]">
                {lang === "pt"
                  ? "Clique com botão direito ou selecione terreno/construções/inimigos para comandar."
                  : "Right-click or click terrain/buildings/enemies to command squad."}
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                {/* Rally Chorus in Unison! */}
                <button
                  onClick={() => engine.squadChant()}
                  className="btn-rpg w-full py-1.5 px-2 bg-gradient-to-r from-[#2c1f38] via-[#4a2472] to-[#2c1f38] hover:brightness-125 border border-[#c084fc] text-[#f3e8ff] rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow active:scale-95"
                >
                  <span className="text-sm">🗣️</span>
                  <span>{t("rallySquad", lang)}</span>
                </button>

                {/* Emergency Attack Button for Selected Units */}
                <button
                  onClick={() => engine.commandSquadAttackNearest()}
                  className="btn-rpg w-full py-1.5 px-2 bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] hover:brightness-125 border border-rose-500 text-rose-100 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs shadow active:scale-95"
                >
                  <Swords size={13} className="text-rose-300" />
                  <span>{lang === "pt" ? "Combate de Emergência!" : "Emergency Attack Nearest!"}</span>
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => engine.autoAssignIdle()}
                    className="btn-rpg flex-1 py-1.5 bg-gradient-to-r from-[#166534] to-[#14532d] hover:brightness-125 border border-emerald-500 text-emerald-100 rounded-xl font-bold text-[10px] shadow"
                  >
                    ⚡ {t("sendToWork", lang)}
                  </button>

                  <button
                    onClick={() => engine.unstickSelected()}
                    className="btn-rpg px-2.5 py-1.5 bg-[#102434] hover:bg-[#1a3850] border border-cyan-400 text-cyan-200 rounded-xl font-bold text-[10px] shadow flex items-center gap-1"
                    title={t("unstickTip", lang)}
                  >
                    <span>🌀</span>
                    <span>{t("unstickSquad", lang)}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedHero ? (
            /* HERO ACTIVE CARD */
            <div
              id="trSel"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#060408]/95 border-2 border-amber-400/80 p-3 rounded-2xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-[#5c4a30]/50 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">👑</span>
                  <span className="font-serif font-black text-amber-300 text-sm">
                    {lang === "pt" ? "Herói do Reino" : "Hero of the Realm"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 rounded-full text-[10px] font-mono text-amber-300 font-bold">
                    Lv.{selectedHero.level}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      engine.select(null);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[#18111f] hover:bg-[#341829] text-[#a090b0] hover:text-rose-300 transition-colors font-bold text-xs"
                    title={lang === "pt" ? "Desmarcar" : "Deselect"}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#cdc3ac] font-mono flex items-center justify-between">
                <span>
                  HP {Math.ceil(selectedHero.hp)}/{selectedHero.maxHp}
                </span>
                <span className="text-amber-200 capitalize">
                  {selectedHero.state === "walk"
                    ? (lang === "pt" ? "Em marcha" : "Marching")
                    : selectedHero.state === "attack"
                    ? (lang === "pt" ? "Em combate" : "Fighting")
                    : (lang === "pt" ? "Vigiando" : "Guarding")}
                </span>
              </div>

              {/* Special Ability Trigger */}
              <button
                onClick={() => engine.useHeroSpecialAttack()}
                disabled={selectedHero.specialCd > 0}
                className="btn-rpg py-2 px-3 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 hover:brightness-125 border border-amber-300 text-amber-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 disabled:opacity-50"
              >
                <Zap size={14} className="text-amber-200 animate-pulse" />
                <span>
                  {selectedHero.specialCd > 0
                    ? `${lang === "pt" ? "Golpe Sagrado" : "Holy Smite"} (${Math.ceil(selectedHero.specialCd)}s)`
                    : `⚡ ${lang === "pt" ? "Golpe Sagrado (Especial)" : "Holy Smite (Special)"}`}
                </span>
              </button>
            </div>
          ) : isGolemSelected ? (
            /* GOLEM ACTIVE CARD */
            <div
              id="trSel"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#060408]/95 border-2 border-cyan-400/70 p-3 rounded-2xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between border-b border-[#5c4a30]/50 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🗿</span>
                  <span className="font-serif font-black text-cyan-300 text-sm">
                    {lang === "pt" ? "Golem Ancestral" : "Ancient Golem"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 rounded-full text-[10px] font-mono text-cyan-300 font-bold">
                    {Math.ceil(engine.golem!.timer)}s
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      engine.select(null);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[#18111f] hover:bg-[#341829] text-[#a090b0] hover:text-rose-300 transition-colors font-bold text-xs"
                    title={lang === "pt" ? "Desmarcar" : "Deselect"}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#cdc3ac] font-mono">
                HP {Math.ceil(engine.golem!.hp)}/{engine.golem!.maxHp}
              </div>

              <button
                onClick={() => engine.useHeroAbility("golem")}
                className="btn-rpg py-2 px-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:brightness-125 border border-cyan-300 text-cyan-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95"
              >
                <Flame size={14} className="text-cyan-200" />
                <span>{t("earthSlam", lang)}</span>
              </button>
            </div>
          ) : selectedUnit ? (
            /* SINGLE UNIT INSPECTOR */
            <div
              id="trSel"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#060408]/95 border-2 border-[#d9ad3f]/50 p-3 rounded-2xl text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WorkerHeadIcon
                    role={selectedUnit.role}
                    isIdle={selectedUnit.state === "idle"}
                  />
                  <span className="font-serif font-black text-[#f2c95a] text-sm">
                    {selectedUnit.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedUnit.veteran && (
                    <span className="px-1.5 py-0.5 bg-amber-500/30 border border-amber-300 rounded-full text-[9px] font-mono text-amber-200 font-black">
                      ⭐ {lang === "pt" ? "Veterano (+25%)" : "Veteran (+25%)"}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-[#d9ad3f]/20 border border-[#d9ad3f]/40 rounded-full text-[10px] font-mono text-[#ffd56b] font-bold">
                    {ROLE_INFO[selectedUnit.role]?.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      engine.select(null);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[#18111f] hover:bg-[#341829] text-[#a090b0] hover:text-rose-300 transition-colors font-bold text-xs"
                    title={lang === "pt" ? "Desmarcar" : "Deselect"}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#cdc3ac] flex items-center flex-wrap gap-1.5">
                <span>HP {Math.ceil(selectedUnit.hp)}/{selectedUnit.maxHp}</span>
                <span>·</span>
                <span className="capitalize text-amber-200">{selectedUnit.state}</span>
                {(selectedUnit.kills || 0) > 0 && (
                  <span className="text-rose-300 font-mono text-[10px] font-bold">
                    · ⚔️ {selectedUnit.kills} {lang === "pt" ? "abates" : "kills"}
                  </span>
                )}
                {selectedUnit.carry && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <Package size={12} className="text-amber-400" />
                    <span>{selectedUnit.carry.amount} {selectedUnit.carry.type}</span>
                  </span>
                )}
              </div>

              {selectedUnit.role === "scout" && (
                <div className="bg-[#0c222e]/90 border border-[#38bdf8]/40 rounded-xl p-2 flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1.5 text-[#73d9ff] font-bold">
                    <span className="text-sm">🧭</span>
                    <span>{lang === "pt" ? "Passiva: Explorador Audaz" : "Passive: Fearless Scout"}</span>
                  </div>
                  <div className="text-[#a5c9db] text-[10px] leading-tight">
                    {lang === "pt"
                      ? "Explora autonomamente a névoa de guerra e revela o mapa gradualmente sem precisar de ordens manuais."
                      : "Passively surveys unexplored fog of war and gradually maps out new lands without requiring manual orders."}
                  </div>
                </div>
              )}

              {/* Action Buttons: Select All [Role] + Voice */}
              <div className="flex flex-col gap-1 mt-1">
                <button
                  onClick={() => engine.selectRoleGroup(selectedUnit.role)}
                  className="btn-rpg w-full py-1 px-2 bg-[#2d1e16] hover:bg-[#3d2a1f] border border-[#f2c95a]/50 text-[#ffd56b] rounded-lg font-bold flex items-center justify-center gap-1 text-[11px] shadow active:scale-95"
                >
                  <Users size={12} />
                  <span>
                    {t("selectAllRole", lang)} {ROLE_INFO[selectedUnit.role]?.label}s
                  </span>
                </button>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      sound.playSfx("squish");
                      selectedUnit.clickSquish = 1.0;
                      engine.sayLine(selectedUnit, "onClick", lang);
                    }}
                    className="btn-rpg flex-1 py-1 px-2 bg-[#2c1f38] hover:bg-[#3f2b52] border border-[#a87ffb]/50 text-[#e9d5ff] rounded-lg font-bold flex items-center justify-center gap-1.5 text-[10px] shadow active:scale-95"
                  >
                    <Volume2 size={12} className="text-purple-300" />
                    <span>{t("talkWithVillager", lang)}</span>
                  </button>

                  <button
                    onClick={() => engine.unstickSelected()}
                    className="btn-rpg px-2 py-1 bg-[#102434] hover:bg-[#1a3850] border border-cyan-400 text-cyan-200 rounded-lg font-bold text-[10px] shadow active:scale-95 flex items-center gap-1"
                    title={t("unstickTip", lang)}
                  >
                    <RotateCcw size={11} className="text-cyan-300" />
                    <span>{t("unstick", lang)}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : selectedBuilding ? (
            /* BUILDING INSPECTOR */
            <div
              id="trSel"
              onClick={(e) => e.stopPropagation()}
              className="bg-[#060408]/95 border-2 border-[#d9ad3f]/50 p-3 rounded-2xl text-xs shadow-2xl backdrop-blur-md flex flex-col gap-2 animate-in fade-in duration-150"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#5c4a30]/50 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded-lg bg-[#201018] border border-[#d9ad3f]/30">
                    {selectedBuilding.type === "townhall" ? (
                      <Castle size={15} className="text-amber-400" />
                    ) : selectedBuilding.type === "barracks" ? (
                      <Swords size={15} className="text-rose-400" />
                    ) : selectedBuilding.type === "altar" ? (
                      <Sparkles size={15} className="text-purple-400" />
                    ) : (
                      <Home size={15} className="text-amber-300" />
                    )}
                  </span>
                  <span className="font-serif font-black text-[#f2c95a] text-sm">
                    {BUILD_SPECS[selectedBuilding.type]?.label || selectedBuilding.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#78e58a] font-bold">
                    {Math.ceil(selectedBuilding.hp)}/{selectedBuilding.maxHp} HP
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      engine.select(null);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[#18111f] hover:bg-[#341829] text-[#a090b0] hover:text-rose-300 transition-colors font-bold text-xs"
                    title={lang === "pt" ? "Desmarcar" : "Deselect"}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Contextual Actions for Selected Building */}
              {selectedBuilding.type === "townhall" && (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold text-[#ffd56b] uppercase tracking-wide">
                    {t("recruitWorkers", lang)}
                  </div>

                  {/* Recruitment Grid for Civilian Roles */}
                  <div className="grid grid-cols-2 gap-1 max-h-[140px] overflow-y-auto pr-0.5">
                    {(
                      [
                        "builder",
                        "woodcutter",
                        "stoneMiner",
                        "goldMiner",
                        "farmer",
                        "scout",
                      ] as const
                    ).map((r) => {
                      const conf = BALANCE.roles[r];
                      const canAfford =
                        engine.resources.wood >= (conf.cost.wood || 0) &&
                        engine.resources.food >= (conf.cost.food || 0) &&
                        engine.aliveUnits().length < engine.popCap();
                      return (
                        <button
                          key={r}
                          disabled={!canAfford}
                          onClick={() => engine.recruitRole(r)}
                          className="btn-rpg p-1.5 bg-[#1e1511] hover:bg-[#2d1f19] border border-[#d9ad3f]/40 hover:border-[#ffd56b] disabled:opacity-40 text-left rounded-lg text-[10px] flex flex-col justify-between transition-all active:scale-95"
                        >
                          <div className="flex items-center gap-1 text-[#f2c95a] font-bold">
                            <span>{conf.icon}</span>
                            <span className="truncate">{conf.label}</span>
                          </div>
                          <div className="text-[9px] font-mono text-[#a8d4ff] mt-0.5">
                            {conf.cost.wood ? `${conf.cost.wood}🪵 ` : ""}
                            {conf.cost.food ? `${conf.cost.food}🌾` : ""}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Town Bell: Shelter / Return to Work */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => engine.hideAllVillagers()}
                      className="btn-rpg flex-1 py-1.5 px-2 bg-[#2a1810] hover:bg-[#3d2317] border border-amber-500/60 text-amber-200 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 shadow active:scale-95"
                      title={lang === "pt" ? "Tocar sino para abrigar aldeões na Câmara (Atalho: H)" : "Ring bell to shelter villagers in Town Hall (Hotkey: H)"}
                    >
                      <Bell size={12} className="text-amber-400" />
                      <span>{lang === "pt" ? "Abrigar (H)" : "Shelter (H)"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => engine.returnVillagersToWork()}
                      className={`btn-rpg flex-1 py-1.5 px-2 border rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 shadow active:scale-95 ${
                        shelteredUnitsCount > 0
                          ? "bg-emerald-900/90 hover:bg-emerald-800 border-emerald-400 text-emerald-100 animate-pulse"
                          : "bg-[#14261c] hover:bg-[#1d3829] border-emerald-500/50 text-emerald-200"
                      }`}
                      title={lang === "pt" ? "Enviar aldeões de volta ao trabalho (Atalho: J)" : "Send villagers back to work (Hotkey: J)"}
                    >
                      <Play size={11} className="text-emerald-300" />
                      <span>
                        {lang === "pt"
                          ? `Voltar (${shelteredUnitsCount > 0 ? shelteredUnitsCount : "J"})`
                          : `Work (${shelteredUnitsCount > 0 ? shelteredUnitsCount : "J"})`}
                      </span>
                    </button>
                  </div>

                  {/* Fortify Upgrade Button & Kingdom Tier Status */}
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#160f0c] border border-[#d9ad3f]/30 text-[10px] font-mono text-amber-200">
                    <span>
                      🏰 {lang === "pt" ? `Nível ${selectedBuilding.tier}/3` : `Tier ${selectedBuilding.tier}/3`} ({BALANCE.townHall[selectedBuilding.tier as 1 | 2 | 3]?.name})
                    </span>
                    <span className="text-emerald-300 font-bold">
                      {selectedBuilding.tier === 1
                        ? (lang === "pt" ? "Base" : "Base")
                        : selectedBuilding.tier === 2
                        ? (lang === "pt" ? "+15% Coleta/Dano" : "+15% Yield/Dmg")
                        : (lang === "pt" ? "+30% Coleta/Dano" : "+30% Yield/Dmg")}
                    </span>
                  </div>

                  {selectedBuilding.upgrading && (
                    <div className="w-full bg-black/70 border border-amber-400/50 rounded-xl p-1.5 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold">
                        <span>🔨 {lang === "pt" ? "Fortificando Castelo..." : "Fortifying Keep..."}</span>
                        <span>{Math.min(100, Math.round((selectedBuilding.progress / Math.max(1, selectedBuilding.buildTime)) * 100))}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all"
                          style={{ width: `${Math.min(100, (selectedBuilding.progress / Math.max(1, selectedBuilding.buildTime)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedBuilding.tier < 3 && !selectedBuilding.upgrading && (() => {
                    const nextTier = (selectedBuilding.tier + 1) as 2 | 3;
                    const upgCost = BALANCE.upgrades[nextTier].cost;
                    const canFortify =
                      engine.resources.wood >= (upgCost.wood || 0) &&
                      engine.resources.stone >= (upgCost.stone || 0) &&
                      engine.resources.gold >= (upgCost.gold || 0);
                    return (
                      <button
                        disabled={!canFortify}
                        onClick={() => engine.fortifyTownHall()}
                        className="btn-rpg px-2.5 py-1.5 bg-gradient-to-r from-[#d9ad3f] to-[#8a6a1f] border border-[#ffe08a] hover:brightness-125 disabled:opacity-40 text-[#180a04] text-xs font-black rounded-xl shadow flex items-center justify-between active:scale-95"
                      >
                        <span>
                          🏰 {t("fortify", lang)} Lv.{nextTier}
                        </span>
                        <span className="font-mono text-[10px]">
                          {upgCost.wood}🪵 {upgCost.stone}🪨 {upgCost.gold}💰
                        </span>
                      </button>
                    );
                  })()}
                </div>
              )}

              {selectedBuilding.type === "barracks" && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <button
                      disabled={
                        engine.resources.gold < 10 ||
                        engine.resources.food < 30 ||
                        engine.aliveUnits().length >= engine.popCap()
                      }
                      onClick={() => engine.trainFromBarracks(selectedBuilding, "warrior")}
                      className="btn-rpg flex-1 py-1.5 bg-[#451218] border border-[#f43f5e] hover:brightness-125 disabled:opacity-40 text-red-200 text-[11px] font-bold rounded-xl flex flex-col items-center"
                    >
                      <span>⚔ {t("trainWarrior", lang)}</span>
                      <span className="text-[9px] text-amber-300 font-mono">10💰 30🌾</span>
                    </button>
                    <button
                      disabled={
                        engine.resources.gold < 16 ||
                        engine.resources.food < 22 ||
                        engine.aliveUnits().length >= engine.popCap()
                      }
                      onClick={() => engine.trainFromBarracks(selectedBuilding, "javelin")}
                      className="btn-rpg flex-1 py-1.5 bg-[#172554] border border-[#60a5fa] hover:brightness-125 disabled:opacity-40 text-blue-200 text-[11px] font-bold rounded-xl flex flex-col items-center"
                    >
                      <span>🔱 {t("trainJavelin", lang)}</span>
                      <span className="text-[9px] text-amber-300 font-mono">16💰 22🌾</span>
                    </button>
                    <button
                      disabled={
                        engine.resources.wood < 20 ||
                        engine.resources.food < 25 ||
                        engine.aliveUnits().length >= engine.popCap()
                      }
                      onClick={() => engine.trainFromBarracks(selectedBuilding, "scout")}
                      className="btn-rpg flex-1 py-1.5 bg-[#0e2730] border border-[#38bdf8] hover:brightness-125 disabled:opacity-40 text-cyan-200 text-[11px] font-bold rounded-xl flex flex-col items-center"
                    >
                      <span>🗡️ {t("trainScout", lang)}</span>
                      <span className="text-[9px] text-amber-300 font-mono">20🪵 25🌾</span>
                    </button>
                  </div>

                  {/* Rally All Troops Button */}
                  <button
                    type="button"
                    onClick={() => engine.rallyArmy()}
                    className="btn-rpg w-full py-1.5 px-2.5 bg-gradient-to-r from-[#451a03] via-[#78350f] to-[#451a03] border border-amber-400/70 hover:brightness-125 text-amber-100 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 shadow"
                    title={lang === "pt" ? "Reunir todas as tropas militares para o combate ou formação (Atalho: G)" : "Rally all military troops for battle or formation (Hotkey: G)"}
                  >
                    <Swords size={12} className="text-amber-300" />
                    <span>{lang === "pt" ? "Reunir Exército (G)" : "Rally Army (G)"}</span>
                  </button>
                </div>
              )}

              {selectedBuilding.type === "altar" && (
                <div className="flex flex-col gap-2">
                  {(() => {
                    const hero = engine.heroUnit || (Object.values(engine.altarHeroes).find((h) => h && (h as any).hp > 0) as any);
                    const heroConf = BALANCE.altarHeroes.frontline;
                    const isAlive = !!(hero && hero.hp > 0);
                    const isMax = isAlive && hero.level >= BALANCE.altarHeroMaxLevel;
                    const upgradeGold = isAlive ? 35 + hero.level * 15 : heroConf.cost.gold;
                    const upgradeCrystal = isAlive ? 20 + hero.level * 10 : heroConf.cost.crystal;
                    const canAfford = engine.resources.gold >= upgradeGold && engine.resources.crystal >= upgradeCrystal;

                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="text-[11px] text-amber-200/90 leading-tight">
                          {isAlive
                            ? (lang === "pt"
                              ? `Herói ativo: Nível ${hero.level} · Golpe Sagrado pronto para liderar batalhas.`
                              : `Active Hero: Level ${hero.level} · Holy Smite ready to lead your armies.`)
                            : (lang === "pt"
                              ? "Evoque o lendário Herói do Reino para liderar suas forças e aniquilar invasores com ataques especiais!"
                              : "Summon the legendary Hero of the Realm to lead your forces with special attacks!")}
                        </div>

                        <button
                          onClick={() => engine.summonHero()}
                          disabled={isMax || !canAfford}
                          className="btn-rpg w-full py-2 px-2.5 flex items-center justify-between bg-gradient-to-r from-[#38200a] via-[#593814] to-[#38200a] border-2 border-amber-400/80 hover:brightness-125 disabled:opacity-40 text-amber-200 text-xs font-bold rounded-xl shadow-lg active:scale-95"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-base">👑</span>
                            <span>
                              {isMax
                                ? (lang === "pt" ? "Herói no Nível Máximo (Lv.5)" : "Hero at Max Level (Lv.5)")
                                : isAlive
                                ? (lang === "pt" ? `⭐ Empoderar Herói (Lv.${hero.level + 1})` : `⭐ Empower Hero (Lv.${hero.level + 1})`)
                                : (lang === "pt" ? "👑 Invocar Herói do Reino" : "👑 Summon Hero of the Realm")}
                            </span>
                          </span>
                          {!isMax && (
                            <span className="text-[#ffd56b] font-mono text-[11px] bg-black/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                              {upgradeGold}💰 {upgradeCrystal}💎
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Quick Repair Button for Damaged Building */}
              {selectedBuilding.hp < selectedBuilding.maxHp && (
                <button
                  onClick={() => {
                    engine.repairBuilding(selectedBuilding);
                  }}
                  className="btn-rpg w-full py-1.5 px-2.5 bg-gradient-to-r from-emerald-950 to-green-900 border border-emerald-400/80 hover:brightness-125 text-emerald-100 text-xs font-bold rounded-xl flex items-center justify-between active:scale-95 shadow"
                >
                  <span className="flex items-center gap-1.5">
                    <Wrench size={13} className="text-emerald-300" />
                    <span>{lang === "pt" ? "Reparar Estrutura" : "Repair Structure"}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">
                    {Math.ceil(selectedBuilding.hp)}/{selectedBuilding.maxHp} HP (1🪵)
                  </span>
                </button>
              )}

              {/* Demolish / Recycle Button with Safe In-UI Confirmation */}
              {selectedBuilding.type !== "townhall" && (
                <div className="pt-0.5">
                  {confirmDemolishId === selectedBuilding.id ? (
                    <div className="flex items-center gap-1 animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          engine.demolishBuilding(selectedBuilding);
                          setConfirmDemolishId(null);
                        }}
                        className="btn-rpg flex-1 py-1.5 px-2 bg-red-700 hover:bg-red-600 border border-red-400 text-white text-[11px] font-black rounded-xl active:scale-95 shadow animate-pulse flex items-center justify-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>{lang === "pt" ? "Confirmar Demolição (+50%)" : "Confirm Demolish (+50%)"}</span>
                      </button>
                      <button
                        onClick={() => setConfirmDemolishId(null)}
                        className="btn-rpg py-1.5 px-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl active:scale-95 border border-stone-600"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDemolishId(selectedBuilding.id)}
                      className="btn-rpg w-full py-1 px-2 bg-[#1c0a0e] hover:bg-rose-950/80 border border-rose-600/40 hover:border-rose-500 text-rose-300 hover:text-rose-100 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-colors"
                      title={lang === "pt" ? "Demolir e recuperar metade dos recursos" : "Demolish and recover 50% resources"}
                    >
                      <Trash2 size={12} className="text-rose-400" />
                      <span>{lang === "pt" ? "Demolir (Reciclar 50%)" : "Demolish (Recycle 50%)"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Center Screen: Banner Announcements & Combos */}
        <div className="flex flex-col items-center justify-center pointer-events-none mx-auto">
          {engine.banner.time > 0 && (
            <div
              className="px-4 py-2 rounded-xl bg-black/90 border-2 shadow-2xl backdrop-blur-md text-sm md:text-base font-bold font-serif text-center animate-in zoom-in duration-150"
              style={{ borderColor: engine.banner.color, color: engine.banner.color }}
            >
              {engine.banner.text}
            </div>
          )}

          {engine.combo.time > 0 && (
            <div
              className="mt-2 text-2xl md:text-3xl font-black italic drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] animate-bounce font-serif"
              style={{ color: engine.combo.color }}
            >
              {engine.combo.text}
            </div>
          )}
        </div>

        {/* Right Space */}
        <div className="w-[1px]" />
      </div>

      {/* 3. BOTTOM OVERLAY: Compact Golem Titan (Bottom-Left) + Worker Badges with Scout (Bottom-Center) + Golden Hammer (Bottom-Right) */}
      <div className="w-full flex items-end justify-between relative pointer-events-none gap-2">
        {/* Ancient Stone Golem Compact Hub (#crystalSummon) */}
        <div className="pointer-events-auto shrink-0">
          {engine.golem ? (
            /* Active Golem Status & Earthquake Button */
            <div className="bg-[#060408]/95 border-2 border-[#73d9ff]/70 p-2 md:p-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-1.5 min-w-[140px] md:min-w-[170px] animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">🗿</span>
                  <span className="font-serif font-black text-[#73d9ff] text-xs">
                    {lang === "pt" ? "Golem" : "Golem"}
                  </span>
                </div>
                <span className="text-amber-300 font-bold font-mono text-[11px]">
                  ⏳ {Math.ceil(engine.golem.timer)}s
                </span>
              </div>

              {/* Health Bar */}
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-[#73d9ff]/30">
                <div
                  className="h-full bg-gradient-to-r from-[#0284c7] to-[#38bdf8] transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, (engine.golem.hp / engine.golem.maxHp) * 100))}%` }}
                />
              </div>

              {/* Quick ability trigger */}
              <button
                onClick={() => engine.useHeroAbility("golem")}
                className="btn-rpg py-1 px-2 bg-gradient-to-r from-[#0369a1] to-[#0284c7] hover:brightness-125 border border-[#38bdf8] text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 shadow active:scale-95"
              >
                <Zap size={12} className="text-cyan-200 animate-pulse" />
                <span>{lang === "pt" ? "Terremoto (Q)" : "Earth Slam (Q)"}</span>
              </button>
            </div>
          ) : engine.resources.crystal >= BALANCE.golem.cost ? (
            /* Ready to Awaken Glowing Pulse Button */
            <button
              id="crystalSummon"
              onClick={() => engine.summonGolem()}
              className="btn-rpg flex items-center gap-2 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7] hover:brightness-125 border-2 border-cyan-300 px-3 py-2 md:py-2.5 rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.7)] text-white text-xs font-bold animate-pulse active:scale-95"
              title={lang === "pt" ? "Despertar o Golem Ancestral para esmagar as hordas!" : "Awaken Ancient Golem!"}
            >
              <span className="text-base leading-none">⚡</span>
              <span className="font-serif tracking-wide">
                {lang === "pt" ? "DESPERTAR GOLEM!" : "AWAKEN GOLEM!"}
              </span>
            </button>
          ) : (
            /* Inactive Compact Progress Pill */
            <div
              className="bg-[#060408]/92 border border-[#73d9ff]/40 px-2.5 py-1.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2"
              title={lang === "pt" ? "Colete 100 cristais para despertar o Golem Ancestral" : "Collect 100 crystals to awaken Ancient Golem"}
            >
              <span className="text-base leading-none">🗿</span>
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono leading-none">
                  <span className="font-bold text-[#73d9ff]">Golem</span>
                  <span className="text-[#bae6fd]">
                    {Math.floor(engine.resources.crystal)}/100 💎
                  </span>
                </div>
                <div className="w-16 md:w-20 h-1 bg-black/60 rounded-full overflow-hidden border border-[#73d9ff]/20 mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#0ea5e9] to-[#73d9ff] transition-all"
                    style={{ width: `${Math.min(100, (engine.resources.crystal / BALANCE.golem.cost) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Worker Information Displays & Auto-Assign (#trHotkeys) */}
        <div className="relative flex flex-col items-center max-w-[calc(100vw-180px)] md:max-w-none">
          {engine.isTouchDevice && (
            <div className="mb-1 pointer-events-auto flex items-center gap-1.5 bg-[#060408]/95 border border-[#d9ad3f]/50 px-2.5 py-1 rounded-full text-[10px] font-mono shadow-xl backdrop-blur-md">
              <button
                onClick={() => {
                  engine.touchMode = engine.touchMode === "pan" ? "box" : "pan";
                  sound.playSfx("click");
                }}
                className="flex items-center gap-1 text-[#f2c95a] font-bold active:scale-95"
              >
                {engine.touchMode === "pan" ? (
                  <>
                    <Hand size={13} className="text-amber-300" />
                    <span>{lang === "pt" ? "Toque: Mover/Arrastar" : "Touch: Pan / Move"}</span>
                  </>
                ) : (
                  <>
                    <BoxSelect size={13} className="text-cyan-300" />
                    <span>{lang === "pt" ? "Toque: Seleção em Caixa" : "Touch: Box Select"}</span>
                  </>
                )}
                <span className="text-[9px] text-[#a8926a] underline ml-1">
                  ({lang === "pt" ? "Mudar" : "Switch"})
                </span>
              </button>
            </div>
          )}
          {/* Warcraft Hero Commander Action Bar & Relics Belt */}
          {activeHero && activeHero.hp > 0 && (
            <div className="mb-1 pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 bg-[#060408]/95 border-2 border-amber-500/80 p-1 md:p-1.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
              {/* Hero Portrait & Level */}
              <button
                onClick={() => engine.focusHero()}
                className="btn-rpg flex items-center gap-1.5 px-2 py-1 rounded-xl bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border border-amber-400 text-amber-200 active:scale-95 shadow"
                title={lang === "pt" ? "Focar Câmera no Herói Comandante" : "Focus Camera on Hero Commander"}
              >
                <span className="text-base">👑</span>
                <div className="flex flex-col items-start leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-serif font-black text-amber-300">
                      {lang === "pt" ? "Herói" : "Hero"}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Lv.{engine.heroCommanderLevel}
                    </span>
                  </div>
                  <div className="w-16 h-1 bg-black/60 rounded-full overflow-hidden mt-0.5 border border-amber-500/30">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-300"
                      style={{
                        width: `${Math.min(100, (engine.heroCommanderXp / Math.max(1, engine.heroCommanderNextXp)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </button>

              <div className="w-[1px] h-6 bg-[#5c4a30]/50 mx-0.5" />

              {/* [Q] Golpe Sagrado (Holy Strike) */}
              <button
                onClick={() => engine.useHeroHolyStrike()}
                disabled={engine.abilityHolyStrikeCd > 0}
                className="btn-rpg relative flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-400 bg-gradient-to-r from-amber-700 to-yellow-600 text-amber-100 font-bold text-xs shadow active:scale-95 disabled:opacity-50"
                title={lang === "pt" ? "Golpe Sagrado (Q): Explosão de luz causando alto dano em área aos inimigos próximos" : "Holy Strike (Q): Burst of holy light dealing heavy AoE damage"}
              >
                <Zap size={13} className="text-yellow-200" />
                <span className="font-mono text-[11px]">
                  {engine.abilityHolyStrikeCd > 0
                    ? `${Math.ceil(engine.abilityHolyStrikeCd)}s`
                    : lang === "pt"
                    ? "Golpe (Q)"
                    : "Smite (Q)"}
                </span>
              </button>

              {/* [W] Grito de Guerra (War Cry) */}
              <button
                onClick={() => engine.useHeroWarCry()}
                disabled={engine.abilityWarCryCd > 0}
                className="btn-rpg relative flex items-center gap-1 px-2.5 py-1 rounded-xl border border-rose-400 bg-gradient-to-r from-rose-800 to-red-700 text-rose-100 font-bold text-xs shadow active:scale-95 disabled:opacity-50"
                title={lang === "pt" ? "Grito de Guerra (W): Aumenta velocidade (+40%) e ataque (+35%) de todas as tropas por 8s" : "War Cry (W): Boosts speed (+40%) and damage (+35%) for all units for 8s"}
              >
                <Swords size={13} className="text-rose-200" />
                <span className="font-mono text-[11px]">
                  {engine.abilityWarCryCd > 0
                    ? `${Math.ceil(engine.abilityWarCryCd)}s`
                    : lang === "pt"
                    ? "Grito (W)"
                    : "Roar (W)"}
                </span>
              </button>

              {/* [E] Luz Sagrada (Holy Light) */}
              <button
                onClick={() => engine.useHeroHolyLight()}
                disabled={engine.abilityHolyLightCd > 0}
                className="btn-rpg relative flex items-center gap-1 px-2.5 py-1 rounded-xl border border-emerald-400 bg-gradient-to-r from-emerald-800 to-green-700 text-emerald-100 font-bold text-xs shadow active:scale-95 disabled:opacity-50"
                title={lang === "pt" ? "Luz Sagrada (E): Cura em massa de 120 HP para tropas próximas e o Castelo" : "Holy Light (E): Mass heals nearby allies and Castle by 120 HP"}
              >
                <Sparkles size={13} className="text-emerald-200" />
                <span className="font-mono text-[11px]">
                  {engine.abilityHolyLightCd > 0
                    ? `${Math.ceil(engine.abilityHolyLightCd)}s`
                    : lang === "pt"
                    ? "Cura (E)"
                    : "Heal (E)"}
                </span>
              </button>

              {/* Relics belt if player collected relics */}
              {engine.relics.length > 0 && (
                <>
                  <div className="w-[1px] h-6 bg-[#5c4a30]/50 mx-0.5" />
                  <div className="flex items-center gap-1 px-1.5 bg-black/50 rounded-xl border border-purple-500/40 py-0.5 shadow-inner">
                    <span className="text-[10px] text-purple-300 font-mono font-bold">✨</span>
                    {engine.relics.map((relic) => (
                      <span
                        key={relic.id}
                        title={`${relic.name[lang]}: ${relic.desc[lang]}`}
                        className="text-sm cursor-help hover:scale-125 transition-transform"
                      >
                        {relic.icon}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div
            id="trHotkeys"
            className="pointer-events-auto flex items-center gap-1 md:gap-1.5 bg-[#060408]/95 border-2 border-[#d9ad3f]/40 p-1 md:p-1.5 rounded-2xl shadow-2xl backdrop-blur-md overflow-x-auto max-w-full"
          >
            {/* Worker Badges: includes Scout! */}
            {(
              [
                "builder",
                "woodcutter",
                "stoneMiner",
                "goldMiner",
                "farmer",
                "warrior",
                "javelin",
                "scout",
              ] as const
            ).map((role) => {
              const data = roleCounts[role] || { total: 0, working: 0, idle: 0 };
              const isSelected =
                engine.selected?.kind === "unit" &&
                selectedUnit?.role === role;

              return (
                <button
                  key={role}
                  onClick={() => engine.selectRoleGroup(role)}
                  className={`btn-rpg relative flex items-center gap-1.5 px-2 py-1 md:py-1.5 rounded-xl border-2 transition-all shadow select-none min-h-[40px] shrink-0 ${
                    isSelected
                      ? "bg-[#d9ad3f]/40 border-[#f2c95a] text-[#ffd56b]"
                      : data.total > 0
                      ? "bg-[#180e0c]/90 border-[#5c4a30]/60 text-[#cdc3ac] hover:border-[#d9ad3f]"
                      : "bg-[#10080a]/60 border-[#3a2818]/40 text-neutral-600 opacity-60 hover:opacity-90"
                  }`}
                  title={`${ROLE_INFO[role]?.label} · ${data.total} total (${data.working} ${t("working", lang)}, ${data.idle} ${t("idle", lang)}) — ${lang === "pt" ? "Toque para selecionar todos" : "Click to select all"}`}
                >
                  <WorkerHeadIcon role={role} isIdle={data.idle > 0} />
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-black font-mono text-[#f2c95a]">
                      {data.total}
                    </span>
                    {data.idle > 0 && (
                      <span className="text-[8px] font-mono text-amber-400 font-bold -mt-0.5">
                        {data.idle}z
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <div className="w-[1px] h-7 bg-[#5c4a30]/50 mx-0.5 shrink-0" />

            {/* Quick Cycle Next Idle Villager Button */}
            {idleVillagersCount > 0 && (
              <button
                onClick={() => engine.selectNextIdleWorker()}
                className="btn-rpg relative px-2.5 py-1 flex items-center gap-1.5 rounded-xl border-2 border-amber-400 bg-gradient-to-br from-[#78350f] via-[#b45309] to-[#78350f] text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:brightness-125 min-h-[40px] shrink-0 active:scale-95 animate-pulse"
                title={
                  lang === "pt"
                    ? `Focar próximo aldeão ocioso (${idleVillagersCount} ociosos) [Atalho: . ou Z]`
                    : `Focus next idle villager (${idleVillagersCount} idle) [Hotkey: . or Z]`
                }
              >
                <span className="text-sm">💤</span>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-black font-mono text-amber-200">
                    {idleVillagersCount} {lang === "pt" ? "Ocioso" : "Idle"}
                  </span>
                  <span className="text-[8px] font-mono text-amber-300/80 -mt-0.5">
                    {lang === "pt" ? "Focar ( . )" : "Cycle ( . )"}
                  </span>
                </div>
              </button>
            )}

            {/* Quick Auto-Assign All Idle Button */}
            <button
              onClick={() => engine.autoAssignIdle()}
              className="btn-rpg relative px-3 py-1.5 flex items-center gap-1.5 rounded-xl border-2 border-emerald-500/80 bg-gradient-to-br from-[#166534] to-[#14532d] text-emerald-100 shadow hover:brightness-125 min-h-[40px] shrink-0 active:scale-95"
              title={t("autoAssignTip", lang)}
            >
              <Sparkles size={14} className="text-emerald-300 animate-spin" style={{ animationDuration: "12s" }} />
              <span className="text-xs font-bold font-mono">
                {lang === "pt" ? "Atribuir" : "Auto"}
              </span>
            </button>
          </div>
        </div>

        {/* Golden Build Hammer Wrap (#trHammerWrap) */}
        <div id="trHammerWrap" className="pointer-events-auto relative shrink-0">
          <div className="absolute -inset-4 rounded-full bg-radial from-amber-400/50 via-amber-400/10 to-transparent animate-hammer-halo pointer-events-none" />
          <button
            id="trHammer"
            onClick={() => setBuildMenuOpen(!buildMenuOpen)}
            className={`trIco relative w-14 h-14 md:w-18 md:h-18 rounded-2xl md:rounded-3xl flex items-center justify-center cursor-pointer border-4 shadow-2xl transition-all active:scale-95 animate-hammer-pulse ${
              buildMenuOpen || engine.buildMode
                ? "bg-gradient-to-b from-amber-500/40 to-amber-700/40 border-amber-300 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                : "bg-gradient-to-b from-[#4a2c14] to-[#1c0f07] border-[#8a6a1f] text-[#f2c95a] hover:border-[#f2c95a]"
            }`}
            title={`${t("buildMenuBtn", lang)} (B)`}
          >
            <Hammer size={28} className="text-[#f2c95a] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </button>
        </div>
      </div>

      {/* 4. ORDERED BUILD PALETTE MODAL (#trBuildBubble) */}
      {buildMenuOpen && (
        <div className="fixed inset-x-3 bottom-20 md:inset-auto md:right-4 md:bottom-24 bg-[#0c0705]/98 border-2 border-amber-500/70 p-3 md:p-4 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl pointer-events-auto z-50 animate-in zoom-in-95 duration-150 max-w-md w-auto">
          <div className="flex items-center justify-between border-b border-[#5c4a30]/60 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <Hammer size={14} />
              </div>
              <span className="font-serif font-black text-sm md:text-base text-amber-300 uppercase tracking-wider">
                {lang === "pt" ? "Menu de Construções" : "Construction Palette"}
              </span>
            </div>
            <button
              onClick={() => setBuildMenuOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-900/60 text-amber-200 hover:text-white transition-colors text-sm font-bold active:scale-95"
              title="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Ordered Grid: House -> Farm -> Lumber -> Quarry -> Tower -> Barracks -> Palisade -> Gate -> Altar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[58vh] md:max-h-[64vh] overflow-y-auto pr-1">
            {BUILDING_ORDER.map((key) => {
              const spec = BUILD_SPECS[key];
              const meta = BUILDING_METADATA[key];
              const isSelected = engine.buildMode === key;
              const canAfford = Object.entries(spec.cost).every(
                ([res, cost]) => (engine.resources as any)[res] >= (cost || 0)
              );

              return (
                <button
                  key={key}
                  onClick={() => {
                    const nextMode = isSelected ? null : key;
                    engine.buildMode = nextMode;
                    if (nextMode) {
                      engine.select(null);
                      engine.hover = {
                        x: Math.max(2, Math.min(COLS - 5, Math.floor(engine.camera.x / TS))),
                        y: Math.max(2, Math.min(ROWS - 5, Math.floor(engine.camera.y / TS))),
                      };
                    }
                    sound.playSfx("select");
                    setBuildMenuOpen(false);
                  }}
                  disabled={!canAfford}
                  className={`btn-rpg p-2.5 rounded-2xl border-2 text-left transition-all active:scale-95 shadow flex flex-col justify-between gap-1.5 min-h-[78px] ${
                    isSelected
                      ? "bg-amber-500/30 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                      : canAfford
                      ? `bg-gradient-to-b ${meta.gradient} ${meta.border} hover:border-amber-300 text-[#f4e8d1]`
                      : "bg-[#140b0f]/80 border-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/15 shadow bg-black/40"
                    >
                      {meta.icon(18)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-amber-200 truncate">
                          {meta.name[lang]}
                        </span>
                        <span className="text-[8px] font-mono px-1 py-0.2 bg-black/40 rounded text-amber-400/80 uppercase font-bold shrink-0">
                          {meta.category[lang]}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-100/75 leading-tight line-clamp-1 mt-0.5">
                        {meta.desc[lang]}
                      </div>
                    </div>
                  </div>

                  {/* Resource Cost Chips with Icons */}
                  <div className="flex items-center flex-wrap gap-1.5 mt-auto pt-1 border-t border-white/10 text-[10px] font-mono font-bold">
                    {spec.cost.wood && (
                      <span className={engine.resources.wood >= spec.cost.wood ? "text-amber-400" : "text-rose-400"}>
                        🪵 {spec.cost.wood}
                      </span>
                    )}
                    {spec.cost.stone && (
                      <span className={engine.resources.stone >= spec.cost.stone ? "text-slate-300" : "text-rose-400"}>
                        🪨 {spec.cost.stone}
                      </span>
                    )}
                    {spec.cost.gold && (
                      <span className={engine.resources.gold >= spec.cost.gold ? "text-yellow-400" : "text-rose-400"}>
                        💰 {spec.cost.gold}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. ACTIVE BUILD PLACEMENT FLOATING BANNER */}
      {engine.buildMode && (() => {
        const hoverX = engine.hover ? engine.hover.x : Math.max(2, Math.min(COLS - 5, Math.floor(engine.camera.x / TS)));
        const hoverY = engine.hover ? engine.hover.y : Math.max(2, Math.min(ROWS - 5, Math.floor(engine.camera.y / TS)));
        const placeStatus = engine.canPlaceBuilding(engine.buildMode, hoverX, hoverY);

        return (
          <div className="fixed bottom-22 md:bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-center gap-2.5 bg-[#0c0705]/98 border-2 border-amber-400 py-2 px-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in slide-in-from-bottom duration-200 max-w-[calc(100vw-16px)]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
                <Hammer size={18} className="animate-bounce" />
              </div>
              <div className="min-w-0 pr-1">
                <div className="text-[10px] font-serif font-black text-amber-400 uppercase tracking-wider truncate">
                  {lang === "pt" ? "Modo Construção" : "Construction Mode"}
                </div>
                <div className="text-xs text-amber-100 font-bold truncate">
                  {BUILDING_METADATA[engine.buildMode]?.name[lang] || engine.buildMode}:{" "}
                  <span className="font-normal text-amber-200/90 hidden sm:inline">
                    {lang === "pt" ? "Toque no mapa ou confirme" : "Tap on map or confirm"}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Touch / Click Confirmation Button */}
            <button
              onClick={() => {
                if (engine.buildMode) {
                  engine.placeBuilding(engine.buildMode, hoverX, hoverY);
                }
              }}
              disabled={!placeStatus.valid}
              className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow active:scale-95 shrink-0 flex items-center gap-1.5 transition-all ${
                placeStatus.valid
                  ? "bg-emerald-600 hover:bg-emerald-500 border border-emerald-300 text-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.6)] cursor-pointer"
                  : "bg-stone-800/80 border border-stone-600/60 text-stone-400 cursor-not-allowed opacity-80"
              }`}
            >
              <Check size={14} className={placeStatus.valid ? "text-emerald-200" : "text-stone-500"} />
              <span>
                {placeStatus.valid
                  ? lang === "pt"
                    ? "Construir Aqui"
                    : "Build Here"
                  : placeStatus.reason || (lang === "pt" ? "Bloqueado" : "Blocked")}
              </span>
            </button>

            <button
              onClick={() => {
                engine.buildMode = null;
                sound.playSfx("click");
              }}
              className="btn-rpg px-2.5 py-1.5 bg-rose-900/90 hover:bg-rose-800 border border-rose-400 text-rose-100 font-bold text-xs rounded-xl shadow active:scale-95 shrink-0 flex items-center gap-1"
            >
              <X size={14} />
              <span className="hidden sm:inline">{lang === "pt" ? "Cancelar" : "Cancel"}</span>
            </button>
          </div>
        );
      })()}

      {/* 6. MOBILE QUICK DESELECT FLOATING PILL */}
      {(selectedUnit || selectedHero || selectedSquad.length > 0 || isGolemSelected || selectedBuilding) && (
        <button
          onClick={() => engine.select(null)}
          className="fixed bottom-22 left-4 z-30 pointer-events-auto md:hidden flex items-center gap-1.5 bg-[#060408]/92 border border-amber-500/50 px-3 py-1.5 rounded-full text-xs font-mono text-amber-200 shadow-xl backdrop-blur-md active:scale-95"
        >
          <X size={14} className="text-rose-400" />
          <span>{lang === "pt" ? "Desmarcar" : "Deselect"}</span>
        </button>
      )}

      {/* 7. REAL-TIME MINIMAP RADAR */}
      <div className="fixed right-3 bottom-20 md:bottom-24 z-30 pointer-events-none">
        <MinimapRadar engine={engine} lang={lang} />
      </div>

      {/* Guided Beginner & Quest Progression HUD */}
      <GuidedTutorialHUD engine={engine} lang={lang} />
    </div>
  );
};
