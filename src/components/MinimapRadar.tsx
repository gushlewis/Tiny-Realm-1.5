/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { GameEngine, COLS, ROWS, TS } from "../game/engine";
import { sound, haptic } from "../game/audio";
import { Language } from "../types/game";
import {
  Compass,
  Crosshair,
  Bell,
  Crown,
  ChevronDown,
  ChevronUp,
  Skull,
} from "lucide-react";

interface MinimapRadarProps {
  engine: GameEngine;
  lang: Language;
}

export const MinimapRadar: React.FC<MinimapRadarProps> = ({ engine, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem("tinyrealm_minimap_open") !== "false";
    } catch {
      return true;
    }
  });

  const isDraggingRef = useRef(false);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    sound.playSfx("click");
    haptic("light");
    try {
      localStorage.setItem("tinyrealm_minimap_open", String(next));
    } catch {}
  };

  const handleMinimapInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const clickY = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const tileX = (clickX / rect.width) * COLS;
      const tileY = (clickY / rect.height) * ROWS;

      engine.camera.x = Math.max(0, Math.min(COLS * TS, tileX * TS));
      engine.camera.y = Math.max(0, Math.min(ROWS * TS, tileY * TS));
    },
    [engine]
  );

  // Render loop for minimap at ~12-15 FPS (efficient, buttery smooth for radar)
  useEffect(() => {
    let animId: number;
    let lastRender = 0;

    const render = (time: number) => {
      animId = requestAnimationFrame(render);
      if (!isOpen) return;
      if (time - lastRender < 70) return; // ~14 FPS is plenty for minimap
      lastRender = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const scaleX = w / COLS;
      const scaleY = h / ROWS;

      // 1. Clear base background
      ctx.fillStyle = "#07040a";
      ctx.fillRect(0, 0, w, h);

      // 2. Terrain & Fog
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const explored = engine.isExplored(x, y);
          if (!explored) {
            // Unexplored / Fog
            ctx.fillStyle = "#0c0710";
            ctx.fillRect(x * scaleX, y * scaleY, scaleX + 0.3, scaleY + 0.3);
            continue;
          }

          const t = engine.terrain[y]?.[x];
          const biome = engine.biome || "forest";
          if (t === "water") {
            ctx.fillStyle = biome === "volcano" ? "#ea580c" : biome === "swamp" ? "#16a34a" : biome === "tundra" ? "#38bdf8" : "#1e3a5f";
          } else if (t === "dirt") {
            ctx.fillStyle = biome === "barrens" ? "#7c2d12" : biome === "volcano" ? "#262626" : biome === "tundra" ? "#334155" : "#3f2e22";
          } else {
            ctx.fillStyle = biome === "barrens" ? "#9a3412" : biome === "tundra" ? "#cbd5e1" : biome === "swamp" ? "#3b0764" : biome === "volcano" ? "#1c1917" : "#263520";
          }
          ctx.fillRect(x * scaleX, y * scaleY, scaleX + 0.3, scaleY + 0.3);
        }
      }

      // 3. Resource Nodes
      for (const node of engine.nodes) {
        if (node.amount <= 0 || !engine.isExplored(node.x, node.y)) continue;
        if (node.type === "tree") ctx.fillStyle = "#166534";
        else if (node.type === "rock") ctx.fillStyle = "#64748b";
        else if (node.type === "ore") ctx.fillStyle = "#eab308";
        else ctx.fillStyle = "#84cc16";
        ctx.fillRect(node.x * scaleX, node.y * scaleY, scaleX + 0.5, scaleY + 0.5);
      }

      // 4. Buildings
      for (const b of engine.buildings) {
        if (b.hp <= 0) continue;
        if (b.type === "townhall") {
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
          // Red core indicator for Townhall
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(
            (b.x + b.w / 2 - 0.5) * scaleX,
            (b.y + b.h / 2 - 0.5) * scaleY,
            scaleX,
            scaleY
          );
        } else if (b.type === "palisade" || b.type === "gate") {
          ctx.fillStyle = "#92400e";
          ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
        } else if (b.type === "tower") {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
        } else {
          ctx.fillStyle = "#d97706";
          ctx.fillRect(b.x * scaleX, b.y * scaleY, b.w * scaleX, b.h * scaleY);
        }
      }

      // 5. Friendly Units
      for (const u of engine.units) {
        if (u.state === "death" || u.hp <= 0) continue;
        const isMilitary = u.role === "warrior" || u.role === "javelin" || u.role === "scout";
        ctx.fillStyle = isMilitary ? "#60a5fa" : "#4ade80";
        ctx.fillRect(u.x * scaleX - 0.5, u.y * scaleY - 0.5, scaleX + 1, scaleY + 1);
      }

      // 6. Altar Hero & Golem
      const hero = engine.heroUnit || Object.values(engine.altarHeroes).find((h) => h && (h as any).hp > 0);
      if (hero && hero.hp > 0) {
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc((hero.x + 0.5) * scaleX, (hero.y + 0.5) * scaleY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (engine.golem && engine.golem.hp > 0) {
        ctx.fillStyle = "#06b6d4";
        ctx.beginPath();
        ctx.arc((engine.golem.x + 0.5) * scaleX, (engine.golem.y + 0.5) * scaleY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (
        engine.golemMound &&
        engine.isExplored(engine.golemMound.x, engine.golemMound.y)
      ) {
        // Dormant Ancient Golem Mound (Pulsing Cyan diamond)
        const moundPulse = 0.6 + 0.4 * Math.sin(time * 0.006);
        ctx.fillStyle = `rgba(34, 211, 238, ${moundPulse})`;
        const mx = (engine.golemMound.x + 0.5) * scaleX;
        const my = (engine.golemMound.y + 0.5) * scaleY;
        ctx.beginPath();
        ctx.moveTo(mx, my - 3);
        ctx.lineTo(mx + 3, my);
        ctx.lineTo(mx, my + 3);
        ctx.lineTo(mx - 3, my);
        ctx.closePath();
        ctx.fill();
      }

      // 7. Enemies & Swarm Hordes (Pulsing Red)
      const pulseAlpha = 0.75 + Math.sin(time * 0.008) * 0.25;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
      for (const e of engine.enemies) {
        if (e.state === "death" || e.hp <= 0) continue;
        ctx.fillRect(e.x * scaleX - 0.5, e.y * scaleY - 0.5, scaleX + 1, scaleY + 1);
      }

      // 8. Sovereign Boss (Large Magenta indicator)
      if (engine.boss && engine.boss.hp > 0) {
        ctx.fillStyle = "#f43f5e";
        const bx = (engine.boss.x + engine.boss.w / 2) * scaleX;
        const by = (engine.boss.y + engine.boss.h / 2) * scaleY;
        ctx.beginPath();
        ctx.arc(bx, by, 4 + Math.sin(time * 0.01) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 8b. Sacred Fountain of Life (Pulsing Azure Circle)
      if (engine.fountainOfLife && engine.isExplored(Math.round(engine.fountainOfLife.x), Math.round(engine.fountainOfLife.y))) {
        const fx = (engine.fountainOfLife.x + 0.5) * scaleX;
        const fy = (engine.fountainOfLife.y + 0.5) * scaleY;
        const fPulse = 0.6 + 0.4 * Math.sin(time * 0.007);
        ctx.fillStyle = `rgba(56, 189, 248, ${fPulse})`;
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e0f2fe";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 8c. Neutral Creep Camps (Crossed Danger Markers)
      for (const camp of engine.creepCamps) {
        if (!engine.isExplored(camp.x, camp.y)) continue;
        const cx = (camp.x + 0.5) * scaleX;
        const cy = (camp.y + 0.5) * scaleY;
        ctx.fillStyle = camp.cleared ? "#22c55e" : "#f97316";
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 8d. Enemy Hives (Crimson Fortresses)
      for (const hive of engine.enemyHives) {
        if (hive.destroyed || !engine.isExplored(hive.x, hive.y)) continue;
        const hx = (hive.x + 0.5) * scaleX;
        const hy = (hive.y + 0.5) * scaleY;
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(hx - 2.5, hy - 2.5, 5, 5);
        ctx.strokeStyle = "#fecaca";
        ctx.lineWidth = 1;
        ctx.strokeRect(hx - 2.5, hy - 2.5, 5, 5);
      }

      // 9. Camera Viewport Box
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const zoom = engine.camera.zoom;
      const viewWorldW = screenW / zoom;
      const viewWorldH = screenH / zoom;
      const viewTileLeft = (engine.camera.x - viewWorldW / 2) / TS;
      const viewTileTop = (engine.camera.y - viewWorldH / 2) / TS;
      const viewTileW = viewWorldW / TS;
      const viewTileH = viewWorldH / TS;

      ctx.strokeStyle = "rgba(253, 224, 71, 0.9)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(
        viewTileLeft * scaleX,
        viewTileTop * scaleY,
        viewTileW * scaleX,
        viewTileH * scaleY
      );
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, engine]);

  // Pointer drag events for canvas navigation
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handleMinimapInteraction(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      e.stopPropagation();
      handleMinimapInteraction(e.clientX, e.clientY);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const c = engine.castle();
  const hero = engine.heroUnit || Object.values(engine.altarHeroes).find((h) => h && (h as any).hp > 0);
  const shelteredCount = engine.aliveUnits().filter((u) => u.sheltered).length;
  const aliveEnemies = engine.enemies.filter((e) => e.state !== "death").length;
  const edge = engine.edge;

  const edgeLabel =
    edge === "north"
      ? { pt: "Norte ⬆", en: "North ⬆" }
      : edge === "east"
      ? { pt: "Leste ➡", en: "East ➡" }
      : edge === "south"
      ? { pt: "Sul ⬇", en: "South ⬇" }
      : edge === "west"
      ? { pt: "Oeste ⬅", en: "West ⬅" }
      : null;

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5 z-30 select-none">
      {/* Wave Edge Threat Compass Banner when invasion is active */}
      {edgeLabel && (engine.phase === "Wave" || engine.phase === "Boss Wave" || engine.phaseRemain <= 6) && (
        <div className="px-2.5 py-1 bg-red-950/95 border border-red-500 text-red-200 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
          <Compass size={12} className="text-red-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span>
            {lang === "pt" ? "Ataque: " : "Invasion: "}
            <span className="text-yellow-300 font-black">{edgeLabel[lang]}</span>
          </span>
          {aliveEnemies > 0 && (
            <span className="bg-red-900/80 px-1.5 py-0.5 rounded text-[9px] border border-red-400">
              {aliveEnemies} 👾
            </span>
          )}
        </div>
      )}

      {/* Main Radar Frame */}
      <div className="bg-[#080509]/95 border-2 border-[#d9ad3f]/50 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col p-1.5 transition-all">
        {/* Radar Header with Title and Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-[#5c4a30]/40">
          <div className="flex items-center gap-1 text-[10px] font-serif font-black text-[#f2c95a] uppercase tracking-wider">
            <Compass size={13} className="text-[#d9ad3f]" />
            <span>{lang === "pt" ? "Radar do Reino" : "Realm Radar"}</span>
          </div>

          <div className="flex items-center gap-1">
            {aliveEnemies > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-950/80 border border-red-600/70 text-[9px] font-mono text-red-300 font-bold flex items-center gap-0.5">
                <Skull size={10} className="text-red-400" />
                <span>{aliveEnemies}</span>
              </span>
            )}
            <button
              onClick={toggleOpen}
              className="p-1 rounded-lg hover:bg-white/10 text-amber-300 transition-colors active:scale-95"
              title={isOpen ? (lang === "pt" ? "Minimizar Radar" : "Collapse Radar") : (lang === "pt" ? "Expandir Radar" : "Expand Radar")}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Collapsible Canvas Map Area */}
        {isOpen && (
          <div className="flex flex-col gap-1.5 pt-1.5">
            <div className="relative border border-[#d9ad3f]/30 rounded-xl overflow-hidden cursor-crosshair shadow-inner bg-black">
              <canvas
                ref={canvasRef}
                width={128}
                height={128}
                className="w-[116px] h-[116px] md:w-[128px] md:h-[128px] block touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              />
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="grid grid-cols-3 gap-1">
              {/* Center on Castle */}
              <button
                onClick={() => {
                  engine.centerOnCastle();
                  sound.playSfx("select");
                  haptic("light");
                }}
                className="btn-rpg py-1 px-1 bg-[#1a120c] hover:bg-[#2b1f14] border border-[#d9ad3f]/40 hover:border-amber-400 text-amber-300 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 shadow active:scale-95"
                title={lang === "pt" ? "Centralizar no Castelo" : "Center Castle"}
              >
                <Crosshair size={12} className="text-amber-400" />
                <span className="truncate">{lang === "pt" ? "Castelo" : "Castle"}</span>
              </button>

              {/* Center on Hero */}
              <button
                disabled={!hero || hero.hp <= 0}
                onClick={() => {
                  if (hero && hero.hp > 0) {
                    engine.camera.x = hero.x * TS;
                    engine.camera.y = hero.y * TS;
                    sound.playSfx("select");
                    haptic("light");
                  }
                }}
                className="btn-rpg py-1 px-1 bg-[#1a120c] hover:bg-[#2b1f14] border border-[#d9ad3f]/40 hover:border-amber-400 text-amber-300 disabled:opacity-40 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 shadow active:scale-95"
                title={lang === "pt" ? "Centralizar no Herói" : "Center Hero"}
              >
                <Crown size={12} className="text-yellow-400" />
                <span className="truncate">{lang === "pt" ? "Herói" : "Hero"}</span>
              </button>

              {/* Town Bell: Shelter / Return Villagers */}
              <button
                onClick={() => {
                  if (shelteredCount > 0) {
                    engine.returnVillagersToWork();
                    haptic("success");
                  } else {
                    engine.hideAllVillagers();
                    haptic("warning");
                  }
                }}
                className={`btn-rpg py-1 px-1 border rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 shadow active:scale-95 transition-all ${
                  shelteredCount > 0
                    ? "bg-emerald-950/90 border-emerald-400 text-emerald-200"
                    : "bg-[#1f1013] hover:bg-[#341820] border-rose-500/60 text-rose-300"
                }`}
                title={
                  shelteredCount > 0
                    ? (lang === "pt" ? "Fazer aldeões voltarem ao trabalho (J)" : "Return villagers to work (J)")
                    : (lang === "pt" ? "Tocar o sino e abrigar aldeões no Castelo (H)" : "Ring bell and shelter villagers in Castle (H)")
                }
              >
                <Bell size={12} className={shelteredCount > 0 ? "text-emerald-300 animate-bounce" : "text-rose-400"} />
                <span className="truncate">
                  {shelteredCount > 0
                    ? lang === "pt"
                      ? `Voltar (${shelteredCount})`
                      : `Return (${shelteredCount})`
                    : lang === "pt"
                    ? "Abrigar"
                    : "Shelter"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
