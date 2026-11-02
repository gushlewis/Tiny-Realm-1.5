/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from "react";
import {
  GameEngine,
  TS,
  COLS,
  ROWS,
  CANVAS_SIZE,
  BUILD_SPECS,
  ROLE_INFO,
  RES_COLORS,
  BALANCE,
} from "../game/engine";
import {
  ResourceNode,
  Building,
  Unit,
  Enemy,
  GolemUnit,
  AltarHero,
  HeroUnit,
  RoleType,
  CreepCamp,
  EnemyHive,
} from "../types/game";

interface GameCanvasProps {
  engine: GameEngine;
  onSelectEntity: (selected: any) => void;
  lang: "pt" | "en";
}

const ART_TS = 28;
const ART_R = TS / ART_TS;

function art(c: CanvasRenderingContext2D, wx: number, wy: number, fn: () => void) {
  c.save();
  c.translate(wx, wy);
  c.scale(ART_R, ART_R);
  fn();
  c.restore();
}

function bevel(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  c.save();
  c.globalCompositeOperation = "overlay";
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, "rgba(255,255,255,.24)");
  g.addColorStop(0.42, "rgba(255,255,255,0)");
  g.addColorStop(0.68, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.32)");
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.restore();
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function bricks(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
  mortar: string,
  hi?: string | null
) {
  c.fillStyle = base;
  c.fillRect(x, y, w, h);
  c.fillStyle = mortar;
  const rh = 4;
  for (let ry = 0, r = 0; ry < h; ry += rh, r++) {
    c.fillRect(x, y + ry, w, 1);
    const off = (r % 2) * 4;
    for (let bx = off; bx < w; bx += 8) {
      c.fillRect(x + bx, y + ry, 1, Math.min(rh, h - ry));
    }
  }
  if (hi) {
    c.fillStyle = hi;
    c.globalAlpha = 0.35;
    c.fillRect(x, y, w, 1);
    c.globalAlpha = 1;
  }
}

function crack(c: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, seed: number) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.strokeStyle = "rgba(0,0,0,.5)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  let cx = 0,
    cy = 0;
  const steps = Math.max(2, Math.round(len / 3));
  for (let i = 0; i < steps; i++) {
    const h = (seed + i * 374761393) ^ (seed * 7 + i * 668265263);
    cx += len / steps;
    cy += ((h % 5) - 2) * 0.7;
    c.lineTo(cx, cy);
  }
  c.stroke();
  c.restore();
}

function moss(c: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number) {
  const cols = ["#2d4226", "#3c5a31", "#527243"];
  for (let i = 0; i < w; i++) {
    const h = ((x + i + seed * 13) % 3) + 1;
    c.fillStyle = cols[(x + i + seed) % 3];
    c.fillRect(x + i, y - h + 1, 1, h);
  }
  c.fillStyle = "rgba(120,190,110,.4)";
  for (let i = 0; i < w; i += 2) {
    c.fillRect(x + i, y - 1, 1, 1);
  }
}

function torch(c: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const f = Math.sin(time * 10 + x) * 1;
  c.fillStyle = "#130b08";
  c.fillRect(x - 2, y + 7, 6, 7);
  c.fillStyle = "#2a1b16";
  c.fillRect(x - 1, y + 8, 4, 5);
  c.fillStyle = "#432e23";
  c.fillRect(x - 1, y + 8, 4, 1);
  c.fillStyle = "#130b08";
  c.fillRect(x, y + 1, 3, 8);
  c.fillStyle = "#2b1c17";
  c.fillRect(x + 1, y + 1, 1, 8);
  c.fillStyle = "rgba(232,98,44,.35)";
  c.fillRect(x - 4, y - 4 + f, 10, 9);
  c.fillStyle = "#601615";
  c.fillRect(x - 3, y - 3 + f, 8, 7);
  c.fillStyle = "#8e342c";
  c.fillRect(x - 2, y - 3 + f, 6, 7);
  c.fillStyle = "#ae452f";
  c.fillRect(x - 1, y - 4 + f, 4, 7);
  c.fillStyle = "#dc7f29";
  c.fillRect(x, y - 4 + f, 2, 5);
  c.fillStyle = "#e6c766";
  c.fillRect(x, y - 3 + f, 1, 3);
}

function bar(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, col: string) {
  c.fillStyle = "#09090c";
  c.fillRect(x, y, w, h);
  c.fillStyle = col;
  c.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * Math.max(0, Math.min(1, p))), Math.max(0, h - 2));
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terrainCacheRef = useRef<HTMLCanvasElement | null>(null);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const grainPatternRef = useRef<CanvasPattern | null>(null);

  const lastBiomeRef = useRef<string>("");
  const lastActiveChapterRef = useRef<number>(-1);

  // Cached static terrain texture with authentic pixel-art grass, water ripples, paths and wildflowers
  const getTerrainCache = useCallback(() => {
    if (
      lastBiomeRef.current !== engine.biome ||
      lastActiveChapterRef.current !== engine.activeChapter
    ) {
      lastBiomeRef.current = engine.biome;
      lastActiveChapterRef.current = engine.activeChapter;
      terrainCacheRef.current = null;
    }
    if (terrainCacheRef.current) return terrainCacheRef.current;
    const c = document.createElement("canvas");
    c.width = CANVAS_SIZE;
    c.height = CANVAS_SIZE;
    const ctx = c.getContext("2d");
    if (!ctx) return c;

    ctx.imageSmoothingEnabled = false;
    const biome = engine.biome || "forest";

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * TS;
        const py = y * TS;
        const t = engine.terrain[y][x];
        const h = engine.hash(x, y);

        if (t === "water") {
          if (biome === "volcano") {
            // Incandescent Molten Magma Lava Fissure
            ctx.fillStyle = "#260606";
            ctx.fillRect(px, py, TS, TS);
            const g = ctx.createLinearGradient(px, py, px, py + TS);
            g.addColorStop(0, "#7f1d1d");
            g.addColorStop(0.4, "#ea580c");
            g.addColorStop(0.7, "#f97316");
            g.addColorStop(1, "#c2410c");
            ctx.fillStyle = g;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
            ctx.fillRect(px, py + 5 + ((h % 4) * 6), TS - 2, 2);
            if (h % 3 === 0) {
              ctx.fillStyle = "#facc15";
              ctx.fillRect(px + 4 + (h % 14), py + 8, 3, 2);
            }
          } else if (biome === "swamp") {
            // Bubbling Toxic Slime Pools
            ctx.fillStyle = "#05140b";
            ctx.fillRect(px, py, TS, TS);
            const g = ctx.createLinearGradient(px, py, px, py + TS);
            g.addColorStop(0, "#064e3b");
            g.addColorStop(0.5, "#047857");
            g.addColorStop(1, "#022c22");
            ctx.fillStyle = g;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "rgba(134, 239, 172, 0.3)";
            ctx.fillRect(px, py + 6 + ((h % 3) * 8), TS - 2, 1);
            if (h % 4 === 0) {
              ctx.fillStyle = "#4ade80";
              ctx.fillRect(px + 6 + (h % 12), py + 12, 3, 2);
            }
          } else if (biome === "tundra") {
            // Frozen Glacial Pale Cyan Ice
            ctx.fillStyle = "#0c1a24";
            ctx.fillRect(px, py, TS, TS);
            const g = ctx.createLinearGradient(px, py, px, py + TS);
            g.addColorStop(0, "#164e63");
            g.addColorStop(0.55, "#0e7490");
            g.addColorStop(1, "#083344");
            ctx.fillStyle = g;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "rgba(224, 242, 254, 0.5)";
            ctx.fillRect(px, py + 4 + ((h % 4) * 6), TS - 2, 1.5);
            if (h % 5 === 0) {
              ctx.fillStyle = "#67e8f9";
              ctx.fillRect(px + 8, py + 14, 4, 1.5);
            }
          } else if (biome === "barrens") {
            // Muddy Desert Oasis
            ctx.fillStyle = "#1c140d";
            ctx.fillRect(px, py, TS, TS);
            const g = ctx.createLinearGradient(px, py, px, py + TS);
            g.addColorStop(0, "#451a03");
            g.addColorStop(0.5, "#78350f");
            g.addColorStop(1, "#291307");
            ctx.fillStyle = g;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "rgba(254, 243, 199, 0.3)";
            ctx.fillRect(px, py + 7, TS - 4, 1.5);
          } else {
            // Forest Clean Sapphire River
            ctx.fillStyle = "#0b161a";
            ctx.fillRect(px, py, TS, TS);
            const g = ctx.createLinearGradient(px, py, px, py + TS);
            g.addColorStop(0, "#1f3c44");
            g.addColorStop(0.55, "#172e35");
            g.addColorStop(1, "#0b171b");
            ctx.fillStyle = g;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "rgba(140,200,220,.18)";
            ctx.fillRect(px, py, TS, 1);
            ctx.fillStyle = "#1e3940";
            ctx.fillRect(px, py + 6 + ((h % 3) * 8), TS - 2, 1);
            if (h % 5 === 0) {
              ctx.fillStyle = "rgba(210,235,245,.4)";
              ctx.fillRect(px + 3 + (h % 12), py + 18, 7, 1);
            }
          }
        } else if (t === "dirt") {
          if (biome === "volcano") {
            ctx.fillStyle = "#141117";
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "#221d26";
            ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
            ctx.fillStyle = "#3b2d3d";
            if (h % 3 === 0) ctx.fillRect(px + 6, py + 9, 3, 2);
          } else if (biome === "barrens") {
            ctx.fillStyle = "#431407";
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "#5c1d09";
            ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
            ctx.fillStyle = "#7c2d12";
            if (h % 3 === 0) ctx.fillRect(px + 6, py + 9, 4, 2);
          } else if (biome === "tundra") {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "#334155";
            ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
            ctx.fillStyle = "#475569";
            if (h % 3 === 0) ctx.fillRect(px + 6, py + 9, 4, 2);
          } else if (biome === "swamp") {
            ctx.fillStyle = "#1e1329";
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "#2c1b3d";
            ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
          } else {
            ctx.fillStyle = "#2b201a";
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = "#372921";
            ctx.fillRect(px + 2, py + 2, TS - 4, TS - 4);
          }
        } else {
          // Base landscape tile per biome
          const isDark = t === "grass2";
          if (biome === "barrens") {
            const base = isDark ? "#451a03" : "#78350f";
            const light = isDark ? "#78350f" : "#9a3412";
            ctx.fillStyle = base;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = light;
            ctx.fillRect(px + ((h * 3) % (TS - 8)), py + ((h * 5) % (TS - 6)), 8, 6);
            if (h % 11 === 0) {
              ctx.fillStyle = "#f8fafc";
              ctx.fillRect(px + 8, py + 12, 3, 2);
              ctx.fillStyle = "#e2e8f0";
              ctx.fillRect(px + 10, py + 14, 2, 1);
            }
          } else if (biome === "tundra") {
            const base = isDark ? "#64748b" : "#94a3b8";
            const light = isDark ? "#94a3b8" : "#cbd5e1";
            const hi = "#f8fafc";
            ctx.fillStyle = base;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = light;
            ctx.fillRect(px + ((h * 3) % (TS - 8)), py + ((h * 5) % (TS - 6)), 8, 6);
            if (h % 9 === 0) {
              ctx.fillStyle = hi;
              ctx.fillRect(px + 10, py + 10, 2, 2);
              ctx.fillStyle = "#38bdf8";
              ctx.fillRect(px + 11, py + 11, 1, 1);
            }
          } else if (biome === "swamp") {
            const base = isDark ? "#170e20" : "#241633";
            const light = isDark ? "#241633" : "#382250";
            ctx.fillStyle = base;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = light;
            ctx.fillRect(px + ((h * 3) % (TS - 8)), py + ((h * 5) % (TS - 6)), 8, 6);
            if (h % 13 === 0) {
              ctx.fillStyle = "#4ade80";
              ctx.fillRect(px + 8, py + 12, 2, 2);
              ctx.fillStyle = "#a855f7";
              ctx.fillRect(px + 7, py + 11, 3, 1);
            }
          } else if (biome === "volcano") {
            const base = isDark ? "#110e14" : "#1a1620";
            const light = isDark ? "#1a1620" : "#262030";
            ctx.fillStyle = base;
            ctx.fillRect(px, py, TS, TS);
            ctx.fillStyle = light;
            ctx.fillRect(px + ((h * 3) % (TS - 8)), py + ((h * 5) % (TS - 6)), 8, 6);
            if (h % 11 === 0) {
              ctx.fillStyle = "#dc2626";
              ctx.fillRect(px + 6, py + 14, 5, 1);
              ctx.fillStyle = "#f97316";
              ctx.fillRect(px + 8, py + 14, 2, 1);
            }
          } else {
            // Forest Lush Grass
            const base = isDark ? "#202b1b" : "#283622";
            const light = isDark ? "#304328" : "#394f30";
            ctx.fillStyle = base;
            ctx.fillRect(px, py, TS, TS);
            const pw = 6 + (h % 6);
            const ph = 4 + ((h >> 3) % 5);
            ctx.fillStyle = light;
            ctx.fillRect(px + ((h * 3) % (TS - pw)), py + ((h * 5) % (TS - ph)), pw, ph);

            if (h % 14 === 0) {
              ctx.fillStyle = "#e6c766";
              ctx.fillRect(px + 9, py + 18, 1, 1);
            }
            if ((h * 3) % 19 === 0) {
              ctx.fillStyle = "#d474b2";
              ctx.fillRect(px + 19, py + 10, 1, 1);
            }
          }
        }
      }
    }
    terrainCacheRef.current = c;
    return c;
  }, [engine]);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      engine.update(dt * engine.speed);

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = container.clientWidth;
        const h = container.clientHeight;

        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
        }

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.imageSmoothingEnabled = false;

          renderFrame(ctx, w, h, engine);
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [engine, getTerrainCache]);

  const renderFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, g: GameEngine) => {
    ctx.clearRect(0, 0, width, height);

    // Camera Transform & Screen Shake
    let shX = 0,
      shY = 0;
    if (g.shake.time > 0) {
      const p = g.shake.power * (g.shake.time / g.shake.total);
      shX = (Math.random() - 0.5) * p * 2;
      shY = (Math.random() - 0.5) * p * 2;
    }

    const zoom = g.camera.zoom;
    const viewX = width / 2 - g.camera.x * zoom + shX;
    const viewY = height / 2 - g.camera.y * zoom + shY;

    ctx.save();
    ctx.translate(viewX, viewY);
    ctx.scale(zoom, zoom);

    // 1. Terrain, Animated Water, Shoreline Foam & Living Nature
    drawDynamicTerrainAndWater(ctx, g);

    // 2. Ground Heroic Auras & Ground Selection Rings (rendered on terrain below structures & characters)
    drawEntityAura(ctx, g);
    drawShockwaves(ctx, g);
    drawSelection(ctx, g);

    // 3. Unified 2.5D Depth-Sorted Render Queue
    interface RenderItem {
      kind: string;
      y: number;
      draw: () => void;
    }

    const renderList: RenderItem[] = [];

    // Resource Nodes (Trees, Rocks, Gold Ore, Fields)
    for (const n of g.nodes) {
      if (!g.isExplored(n.x, n.y) || n.amount <= 0) continue;
      renderList.push({
        kind: "node",
        y: n.type === "field" ? (n.y + 0.15) * TS : (n.y + 0.88) * TS,
        draw: () => drawNode(ctx, n, g.time),
      });
    }

    // Ancient Golem Mound
    if (g.golemMound && !g.golem && g.isExplored(g.golemMound.x, g.golemMound.y)) {
      const wx = g.golemMound.x * TS;
      const wy = g.golemMound.y * TS;
      renderList.push({
        kind: "mound",
        y: (g.golemMound.y + 0.90) * TS,
        draw: () => {
          art(ctx, wx - 10, wy - 18, () => drawGolemMoundSprite(ctx, 0, 0, g.time));
          bevel(ctx, wx - 10, wy - 18, 46 * ART_R, 50 * ART_R);
        },
      });
    }

    // Buildings (Sorted by their south footprint baseline so units behind structures are occluded by roofs/towers)
    for (const b of g.buildings) {
      if (!g.isExplored(b.x, b.y)) continue;
      renderList.push({
        kind: "building",
        y: b.type === "farm" ? (b.y + 0.15) * TS : (b.y + b.h - 0.08) * TS,
        draw: () => drawBuilding(ctx, b, g),
      });
    }

    // Villager Units
    for (const u of g.units) {
      if (u.state === "death" || !g.isExplored(Math.round(u.x), Math.round(u.y))) continue;
      renderList.push({
        kind: "unit",
        y: (u.y + 0.95) * TS,
        draw: () => drawUnit(ctx, u, g),
      });
    }

    // Golem Titan
    if (g.golem && g.isExplored(Math.round(g.golem.x), Math.round(g.golem.y))) {
      renderList.push({
        kind: "golem",
        y: (g.golem.y + 1.05) * TS,
        draw: () => drawGolem(ctx, g.golem!, g),
      });
    }

    // Altar Heroes / Champion of the Realm
    const renderedHeroIds = new Set<number>();
    const allHeroes = [g.heroUnit, ...Object.values(g.altarHeroes)].filter(
      (h): h is AltarHero => Boolean(h && h.hp > 0)
    );
    for (const h of allHeroes) {
      if (renderedHeroIds.has(h.id)) continue;
      renderedHeroIds.add(h.id);
      if (g.isExplored(Math.round(h.x), Math.round(h.y))) {
        renderList.push({
          kind: "altarHero",
          y: (h.y + 0.95) * TS,
          draw: () => drawAltarHero(ctx, h, g),
        });
      }
    }

    // Legacy Hero
    if (g.hero && !renderedHeroIds.has(g.hero.id) && g.isExplored(Math.round(g.hero.x), Math.round(g.hero.y))) {
      renderList.push({
        kind: "hero",
        y: (g.hero.y + 0.95) * TS,
        draw: () => drawHero(ctx, g.hero!, g),
      });
    }

    // Enemies & Decomposing Bug Corpses
    for (const e of g.enemies) {
      const isVis = g.isVisible(Math.round(e.x), Math.round(e.y));
      const isExp = g.isExplored(Math.round(e.x), Math.round(e.y));
      if (!isVis && !isExp) continue;

      if (e.state === "death" && e.death > 0) {
        renderList.push({
          kind: "enemy",
          y: (e.y + 0.1) * TS, // Render at ground level below structures & live units
          draw: () => drawDecomposingCorpse(ctx, e, g),
        });
      } else if (e.state !== "death" && isVis) {
        renderList.push({
          kind: "enemy",
          y: (e.y + 0.95) * TS,
          draw: () => drawEnemy(ctx, e),
        });
      }
    }

    // Boss & Decomposing Boss Corpse
    if (g.boss) {
      if (g.boss.state === "death" && g.boss.death > 0) {
        renderList.push({
          kind: "boss",
          y: (g.boss.y + 0.15) * TS,
          draw: () => drawDecomposingCorpse(ctx, g.boss!, g),
        });
      } else if (g.boss.state !== "death") {
        renderList.push({
          kind: "boss",
          y: (g.boss.y + 1.15) * TS,
          draw: () => drawBoss(ctx, g.boss!, g),
        });
      }
    }

    // Treasure Chest
    if (g.chest && g.isExplored(g.chest.x, g.chest.y)) {
      const cx = g.chest.x * TS;
      const cy = g.chest.y * TS;
      renderList.push({
        kind: "chest",
        y: (g.chest.y + 0.9) * TS,
        draw: () => {
          art(ctx, cx, cy, () => drawChestSprite(ctx, 0, 0, g.chest!));
          bevel(ctx, cx + 1 * ART_R, cy + 9 * ART_R, 24 * ART_R, 18 * ART_R);
        },
      });
    }

    // Sacred Fountain of Life
    if (g.fountainOfLife && g.isExplored(Math.round(g.fountainOfLife.x), Math.round(g.fountainOfLife.y))) {
      const fx = g.fountainOfLife.x * TS;
      const fy = g.fountainOfLife.y * TS;
      renderList.push({
        kind: "fountain",
        y: (g.fountainOfLife.y + 0.8) * TS,
        draw: () => drawFountainOfLifeSprite(ctx, fx, fy, g.time),
      });
    }

    // Neutral Creep Camps
    for (const camp of g.creepCamps) {
      if (g.isExplored(camp.x, camp.y)) {
        const cx = camp.x * TS;
        const cy = camp.y * TS;
        renderList.push({
          kind: "creepCamp",
          y: (camp.y + 0.8) * TS,
          draw: () => drawCreepCampSprite(ctx, cx, cy, camp, g),
        });
      }
    }

    // Enemy Hives
    for (const hive of g.enemyHives) {
      if (!hive.destroyed && g.isExplored(hive.x, hive.y)) {
        const hx = hive.x * TS;
        const hy = hive.y * TS;
        renderList.push({
          kind: "enemyHive",
          y: (hive.y + 0.85) * TS,
          draw: () => drawEnemyHiveSprite(ctx, hx, hy, hive, g),
        });
      }
    }

    // Sort strictly by vertical bottom position (Y-axis depth sorting)
    renderList.sort((a, b) => a.y - b.y);

    // Draw all entities in correct front-to-back perspective
    for (const item of renderList) {
      item.draw();
    }

    // 8. Soft 2.5D X-Ray Silhouette for units/enemies standing behind tall structures or trees + Building Status Bars
    drawOccludedSilhouettes(ctx, g);
    drawBuildingBars(ctx, g);

    // 9. Fog of War & Lighting
    drawFog(ctx, g);
    drawLighting(ctx, g);

    // 11. Projectiles, Fireflies & Atmospheric Weather
    drawArrows(ctx, g);
    drawFireflies(ctx, g);
    drawWeather(ctx, g);

    // 12. Particles & Combat Float Text
    drawParticles(ctx, g);
    drawFloats(ctx, g);

    // 13. Build Ghost & Click Marker
    drawGhost(ctx, g);
    drawClickMarker(ctx, g);

    // 14. Grain & Mood Overlay
    drawMood(ctx);
    drawGrain(ctx);

    ctx.restore();

    // 15. Drag-to-Select Marquee Box (Screen Coordinates)
    if (selectionBoxRef.current?.active) {
      const b = selectionBoxRef.current;
      const bx = Math.min(b.startX, b.currentX);
      const by = Math.min(b.startY, b.currentY);
      const bw = Math.abs(b.currentX - b.startX);
      const bh = Math.abs(b.currentY - b.startY);

      if (bw > 3 || bh > 3) {
        ctx.save();
        // Translucent emerald fill
        ctx.fillStyle = "rgba(34, 197, 94, 0.16)";
        ctx.fillRect(bx, by, bw, bh);

        // Solid emerald border
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);

        // Tactical corner accents
        ctx.strokeStyle = "#86efac";
        ctx.lineWidth = 2.5;
        const corner = Math.min(10, bw / 3, bh / 3);
        if (corner > 2) {
          ctx.beginPath();
          // Top-left
          ctx.moveTo(bx, by + corner); ctx.lineTo(bx, by); ctx.lineTo(bx + corner, by);
          // Top-right
          ctx.moveTo(bx + bw - corner, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + corner);
          // Bottom-left
          ctx.moveTo(bx, by + bh - corner); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + corner, by + bh);
          // Bottom-right
          ctx.moveTo(bx + bw - corner, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - corner);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  // ==========================================
  // PROCEDURAL PIXEL-ART RENDER FUNCTIONS
  // ==========================================

  // 1. Dynamic Living Terrain: Multi-layered Flowing Water, Shoreline Foam & Wild Grass
  const drawDynamicTerrainAndWater = (ctx: CanvasRenderingContext2D, g: GameEngine) => {
    // A. Draw cached static base terrain
    const terrainImg = getTerrainCache();
    ctx.drawImage(terrainImg, 0, 0);

    const time = g.time;

    // B. Animated Living Water, Fluid Currents, Shoreline Foam & Lilypads
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (g.terrain[y][x] !== "water") continue;
        const px = x * TS;
        const py = y * TS;
        const h = g.hash(x, y);

        // Sinusoidal flowing water wave bands
        const wave1 = Math.sin(time * 2.0 + x * 0.7 + y * 0.5);
        const wave2 = Math.cos(time * 1.6 - x * 0.4 + y * 0.8);
        const flowAlpha = 0.09 + (wave1 * 0.05 + wave2 * 0.04);

        // Deep water translucent flow ribbon
        ctx.fillStyle = `rgba(56, 189, 248, ${flowAlpha})`;
        const waveY = py + 8 + Math.round(wave1 * 2);
        ctx.fillRect(px + 2, waveY, TS - 4, 3);

        // Sparkling caustic glints
        const glintWave = Math.sin(time * 3.2 + (x * 7 + y * 11));
        if (glintWave > 0.7) {
          ctx.fillStyle = "rgba(240, 249, 255, 0.45)";
          const gx = px + 4 + ((h * 5) % 18);
          const gy = py + 5 + ((h * 7) % 18);
          ctx.fillRect(gx, gy, 2, 1);
        }

        // Shoreline detection & foam ripples
        const isTopShore = y > 0 && g.terrain[y - 1][x] !== "water";
        const isBottomShore = y < ROWS - 1 && g.terrain[y + 1][x] !== "water";
        const isLeftShore = x > 0 && g.terrain[y][x - 1] !== "water";
        const isRightShore = x < COLS - 1 && g.terrain[y][x + 1] !== "water";

        const foamPulse = 0.3 + 0.25 * Math.sin(time * 3.0 + x * 1.2 + y * 1.5);

        if (isTopShore) {
          // Wet embankment shadow
          ctx.fillStyle = "rgba(8, 20, 26, 0.45)";
          ctx.fillRect(px, py, TS, 2);
          // Lapping white shoreline foam
          ctx.fillStyle = `rgba(224, 242, 254, ${foamPulse})`;
          ctx.fillRect(px, py + 2, TS, 1.5);
        }
        if (isBottomShore) {
          ctx.fillStyle = `rgba(224, 242, 254, ${foamPulse})`;
          ctx.fillRect(px, py + TS - 2.5, TS, 1.5);
        }
        if (isLeftShore) {
          ctx.fillStyle = `rgba(224, 242, 254, ${foamPulse})`;
          ctx.fillRect(px, py, 1.5, TS);
        }
        if (isRightShore) {
          ctx.fillStyle = `rgba(224, 242, 254, ${foamPulse})`;
          ctx.fillRect(px + TS - 1.5, py, 1.5, TS);
        }

        // Floating green lilypad with pink lotus flower on calm water spots
        if (h % 13 === 0 && !isTopShore && !isBottomShore) {
          const bob = Math.sin(time * 1.8 + h) * 1.2;
          const lx = px + 10;
          const ly = py + 12 + bob;
          // Green pad
          ctx.fillStyle = "#166534";
          ctx.beginPath();
          ctx.ellipse(lx, ly, 4, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#22c55e";
          ctx.fillRect(lx - 2, ly - 1, 3, 2);
          // Pink lotus flower
          ctx.fillStyle = "#f472b6";
          ctx.fillRect(lx + 1, ly - 2, 2, 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(lx + 1, ly - 2, 1, 1);
        }
      }
    }

    // C. Living Nature: Wind-swayed wild grass tufts & wildflowers
    for (let y = 0; y < ROWS; y += 3) {
      for (let x = 0; x < COLS; x += 3) {
        if (g.terrain[y][x] === "water" || g.terrain[y][x] === "dirt") continue;
        const h = g.hash(x, y);
        if (h % 5 !== 0) continue;
        const px = x * TS + (h % 14);
        const py = y * TS + ((h >> 2) % 14);
        const sway = Math.round(Math.sin(time * 2.2 + x * 0.5 + y * 0.4) * 1.2);

        // Wild grass blade
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(px + sway, py - 2, 1, 3);
        ctx.fillStyle = "#15803d";
        ctx.fillRect(px, py, 1, 2);

        // Wildflower petal
        if (h % 15 === 0) {
          ctx.fillStyle = (h % 2 === 0) ? "#facc15" : "#f472b6";
          ctx.fillRect(px + sway, py - 3, 2, 2);
        }
      }
    }
  };

  const drawFountainOfLifeSprite = (ctx: CanvasRenderingContext2D, fx: number, fy: number, time: number) => {
    ctx.save();
    // Soft ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(fx + 16, fy + 24, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Circular stone rim
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.ellipse(fx + 16, fy + 16, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#475569";
    ctx.beginPath();
    ctx.ellipse(fx + 16, fy + 15, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Celestial Turquoise Healing Water
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);
    const grad = ctx.createRadialGradient(fx + 16, fy + 15, 2, fx + 16, fy + 15, 16);
    grad.addColorStop(0, `rgba(186, 230, 253, ${pulse})`);
    grad.addColorStop(0.5, `rgba(56, 189, 248, ${pulse * 0.85})`);
    grad.addColorStop(1, "rgba(14, 116, 144, 0.9)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(fx + 16, fy + 15, 16, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Center fountain spouting stone
    ctx.fillStyle = "#64748b";
    ctx.fillRect(fx + 14, fy + 6, 4, 10);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(fx + 15, fy + 4, 2, 4);

    // Floating ascending healing runes / sparkles
    for (let i = 0; i < 4; i++) {
      const offset = (time * 1.5 + i * 1.6) % 3;
      const rx = fx + 10 + i * 5 + Math.sin(time * 2 + i) * 3;
      const ry = fy + 10 - offset * 8;
      const alpha = Math.max(0, 1 - offset / 3);
      ctx.fillStyle = `rgba(125, 211, 252, ${alpha})`;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Overhead Banner
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⛲ FONTE DA VIDA", fx + 16, fy - 6);
    ctx.restore();
  };

  const drawCreepCampSprite = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    camp: CreepCamp,
    g: GameEngine
  ) => {
    ctx.save();
    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(cx + 16, cy + 22, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!camp.cleared) {
      // Crude wooden barricades
      ctx.fillStyle = "#451a03";
      ctx.fillRect(cx + 2, cy + 12, 4, 12);
      ctx.fillRect(cx + 26, cy + 12, 4, 12);
      ctx.fillStyle = "#78350f";
      ctx.fillRect(cx + 1, cy + 8, 3, 5);
      ctx.fillRect(cx + 27, cy + 8, 3, 5);

      // Flickering Campfire in center
      ctx.fillStyle = "#292524";
      ctx.beginPath();
      ctx.arc(cx + 16, cy + 18, 5, 0, Math.PI * 2);
      ctx.fill();

      // Flame
      const flameH = 6 + Math.sin(g.time * 8) * 2;
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.moveTo(cx + 13, cy + 18);
      ctx.lineTo(cx + 16, cy + 18 - flameH);
      ctx.lineTo(cx + 19, cy + 18);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy + 18);
      ctx.lineTo(cx + 16, cy + 18 - flameH * 0.7);
      ctx.lineTo(cx + 18, cy + 18);
      ctx.fill();

      // Beast Totem / Skull on Pole
      ctx.fillStyle = "#78350f";
      ctx.fillRect(cx + 7, cy + 2, 2, 14);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(cx + 6, cy + 2, 4, 4); // Skull
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(cx + 8, cy + 5, 7, 5); // Red war banner

      // Name & Remaining Creeps Label
      ctx.fillStyle = "#f97316";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`⚔️ ${camp.name[g.lang || "pt"]}`, cx + 16, cy - 8);
      ctx.fillStyle = "#fed7aa";
      ctx.font = "bold 8px monospace";
      ctx.fillText(`${camp.creepCount}/${camp.totalCreeps} Monstros`, cx + 16, cy - 1);
    } else {
      // Cleared: Open Ancient Gilded Chest with Gold Sparkles
      ctx.fillStyle = "#78350f";
      ctx.fillRect(cx + 10, cy + 14, 12, 9);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(cx + 9, cy + 10, 14, 5);
      // Gold trim & coins
      ctx.fillStyle = "#facc15";
      ctx.fillRect(cx + 11, cy + 13, 10, 3);
      ctx.fillRect(cx + 15, cy + 12, 2, 5);

      const sparkle = Math.sin(g.time * 4) * 2;
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(cx + 12 + sparkle, cy + 6, 2, 2);
      ctx.fillRect(cx + 18 - sparkle, cy + 8, 2, 2);

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`✓ ${g.lang === "pt" ? "CONQUISTADO" : "CONQUERED"} 👑`, cx + 16, cy - 6);
    }
    ctx.restore();
  };

  const drawEnemyHiveSprite = (
    ctx: CanvasRenderingContext2D,
    hx: number,
    hy: number,
    hive: EnemyHive,
    g: GameEngine
  ) => {
    ctx.save();
    const fl = hive.flash > 0;
    const pulse = 1.0 + Math.sin(g.time * 4) * 0.04;

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(hx + 16, hy + 26, 22 * pulse, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chitinous Organic Mound
    ctx.fillStyle = fl ? "#ffffff" : "#4c0519";
    ctx.beginPath();
    ctx.ellipse(hx + 16, hy + 18, 18 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fl ? "#ffffff" : "#881337";
    ctx.beginPath();
    ctx.ellipse(hx + 16, hy + 16, 14 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Venom Vents / Slime mouths
    ctx.fillStyle = "#84cc16";
    ctx.fillRect(hx + 10, hy + 12, 3, 3);
    ctx.fillRect(hx + 19, hy + 12, 3, 3);
    ctx.fillRect(hx + 15, hy + 8, 3, 3);

    // Glowing Spider Eyes
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(hx + 13, hy + 16, 2, 2);
    ctx.fillRect(hx + 17, hy + 16, 2, 2);
    ctx.fillRect(hx + 15, hy + 19, 2, 2);

    // Health bar above hive
    const barW = 32;
    const barH = 4;
    const pct = Math.max(0, Math.min(1, hive.hp / hive.maxHp));
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(hx + 16 - barW / 2, hy - 8, barW, barH);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(hx + 16 - barW / 2 + 1, hy - 7, (barW - 2) * pct, barH - 2);
    ctx.strokeStyle = "#fecaca";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(hx + 16 - barW / 2, hy - 8, barW, barH);

    // Text label
    ctx.fillStyle = "#fca5a5";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`💀 ${Math.ceil(hive.hp)}/${hive.maxHp}`, hx + 16, hy - 11);
    ctx.restore();
  };

  const drawNode = (c: CanvasRenderingContext2D, n: ResourceNode, time: number) => {
    const nx = n.x * TS;
    const ny = n.y * TS;
    const s = n.spawnAnim !== undefined && n.spawnAnim < 1 ? 0.15 + 0.85 * n.spawnAnim : 1;
    art(c, nx, ny, () => {
      if (s < 1) {
        c.translate(14, 27);
        c.scale(s, s);
        c.translate(-14, -27);
      }
      drawNodeSprite(c, 0, 0, n, time);
    });
    bevel(c, nx + 2 * ART_R, ny + 2 * ART_R, 24 * ART_R, 22 * ART_R);
  };

  const drawNodeSprite = (c: CanvasRenderingContext2D, x: number, y: number, n: ResourceNode, time: number) => {
    const fl = n.flash > 0;
    if (n.type === "tree") {
      // Wind sway on canopy
      const wind = Math.sin(time * 2.2 + n.x * 1.3 + n.y * 0.9) * 1.4;
      c.fillStyle = "rgba(0,0,0,.35)";
      c.beginPath();
      c.ellipse(x + 14, y + 26, 10, 3, 0, 0, Math.PI * 2);
      c.fill();

      // Trunk with root flares
      c.fillStyle = "#1e110c";
      c.fillRect(x + 11, y + 15, 7, 10);
      c.fillStyle = "#2c1b13";
      c.fillRect(x + 12, y + 15, 5, 10);
      c.fillStyle = "#120a06";
      c.fillRect(x + 11, y + 15, 1, 10);
      c.fillRect(x + 17, y + 15, 1, 10);
      c.fillStyle = "rgba(255,220,150,.15)";
      c.fillRect(x + 13, y + 16, 1, 7);

      // Swaying Foliage Canopy (extended upward into y < 0 for true 2.5D occlusion of units behind tree)
      c.save();
      c.translate(x + 14, y + 25);
      c.rotate(wind * 0.022);
      c.translate(-(x + 14), -(y + 25));

      c.fillStyle = fl ? "#fff" : "#0d1712";
      c.fillRect(x + 2, y - 4, 24, 22);
      c.fillRect(x + 4, y - 10, 20, 24);
      c.fillStyle = fl ? "#fff" : "#16221a";
      c.fillRect(x + 4, y - 6, 20, 18);
      c.fillRect(x + 6, y - 12, 16, 20);
      c.fillStyle = fl ? "#fff" : "#233327";
      c.fillRect(x + 6, y - 8, 16, 14);
      c.fillStyle = fl ? "#fff" : "#324536";
      c.fillRect(x + 8, y - 13, 12, 14);
      c.fillStyle = fl ? "#fff" : "#455a45";
      c.fillRect(x + 10, y - 12, 7, 5);

      // Lush Apple / Blossom Dots
      c.fillStyle = "#903e46";
      c.fillRect(x + 8, y + 4, 1.5, 1.5);
      c.fillRect(x + 19, y + 1, 1.5, 1.5);
      c.fillRect(x + 14, y - 5, 1.5, 1.5);
      c.fillStyle = "#e35565";
      c.fillRect(x + 8, y + 4, 1, 1);
      c.restore();
    } else if (n.type === "field") {
      c.fillStyle = "rgba(0,0,0,.3)";
      c.fillRect(x + 3, y + 24, 22, 3);
      c.fillStyle = "#443026";
      c.fillRect(x + 3, y + 16, 22, 10);
      c.fillStyle = "#2b1e17";
      c.fillRect(x + 3, y + 16, 22, 1);
      c.fillStyle = "#36271e";
      for (let r = 0; r < 2; r++) c.fillRect(x + 3, y + 19 + r * 4, 22, 1);
      for (let i = 0; i < 5; i++) {
        const sx = x + 4 + i * 4;
        const stalkSway = Math.sin(time * 3 + sx * 0.5) * 1.5;
        c.fillStyle = fl ? "#fff" : "#584429";
        c.fillRect(sx + stalkSway * 0.3, y + 8, 1, 10);
        c.fillStyle = fl ? "#fff" : "#92753d";
        c.fillRect(sx - 1 + stalkSway * 0.7, y + 6, 3, 3);
        c.fillStyle = fl ? "#fff" : "#ce9f3f";
        c.fillRect(sx + stalkSway, y + 6, 1, 2);
        c.fillStyle = "#b97e33";
        c.fillRect(sx - 1 + stalkSway * 0.7, y + 8, 1, 1);
        c.fillRect(sx + 1 + stalkSway * 0.7, y + 8, 1, 1);
      }
    } else {
      const isOre = n.type === "ore";
      c.fillStyle = "rgba(0,0,0,.4)";
      c.beginPath();
      c.ellipse(x + 14, y + 25, 10, 3, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = fl ? "#fff" : "#303235";
      c.fillRect(x + 4, y + 13, 20, 12);
      c.fillStyle = fl ? "#fff" : "#494d50";
      c.fillRect(x + 5, y + 12, 18, 12);
      c.fillStyle = fl ? "#fff" : "#606467";
      c.fillRect(x + 6, y + 12, 16, 3);
      c.fillStyle = fl ? "#fff" : "#3c4043";
      c.fillRect(x + 9, y + 7, 10, 8);
      c.fillStyle = fl ? "#fff" : "#63676b";
      c.fillRect(x + 10, y + 7, 8, 3);
      c.fillStyle = "rgba(255,255,255,.18)";
      c.fillRect(x + 10, y + 7, 6, 1);
      c.fillRect(x + 6, y + 12, 15, 1);
      c.fillStyle = "rgba(0,0,0,.4)";
      c.fillRect(x + 13, y + 15, 1, 6);
      c.fillRect(x + 16, y + 18, 3, 1);
      c.fillRect(x + 8, y + 22, 10, 1);

      // Specular Gleam Pulse
      const gleamPhase = (time * 0.9 + (n.x * 3.7 + n.y * 1.9)) % 3.5;
      const isGleaming = gleamPhase < 0.35;

      if (isOre) {
        c.fillStyle = "#8f5e33";
        c.fillRect(x + 8, y + 17, 3, 2);
        c.fillRect(x + 17, y + 13, 2, 2);
        c.fillRect(x + 13, y + 20, 2, 1);
        c.fillStyle = "#d39f42";
        c.fillRect(x + 8, y + 17, 1, 1);
        c.fillRect(x + 17, y + 13, 1, 1);
        c.fillStyle = "#e6c766";
        c.fillRect(x + 8, y + 17, 1, 1);

        if (isGleaming) {
          c.fillStyle = "#ffffff";
          c.fillRect(x + 17, y + 12, 2, 2);
          c.fillStyle = "rgba(255, 235, 130, 0.85)";
          c.fillRect(x + 16, y + 11, 4, 1);
          c.fillRect(x + 17, y + 10, 2, 3);
        }
      } else {
        c.fillStyle = "#858c90";
        c.fillRect(x + 13, y + 9, 2, 1);
        c.fillRect(x + 8, y + 19, 2, 1);
        if (isGleaming) {
          c.fillStyle = "rgba(255,255,255,0.7)";
          c.fillRect(x + 13, y + 9, 2, 1);
        }
      }
    }
  };

  const drawBuilding = (c: CanvasRenderingContext2D, b: Building, g: GameEngine) => {
    const x = b.x * TS;
    const y = b.y * TS;
    if (b.flash && b.flash > 0) {
      c.fillStyle = "#fff";
      c.fillRect(x, y, b.w * TS, b.h * TS);
    }
    if (b.type === "townhall") art(c, x, y, () => drawHall(c, 0, 0, b, g.time));
    else if (b.type === "tower") art(c, x, y, () => drawTower(c, 0, 0, g.time));
    else if (b.type === "gate") art(c, x, y, () => drawGate(c, 0, 0, b, g));
    else if (b.type === "palisade") art(c, x, y, () => drawWall(c, 0, 0, g.time));
    else if (b.type === "house") art(c, x, y, () => drawHouse(c, 0, 0, g.time));
    else if (b.type === "farm") art(c, x, y, () => drawFarm(c, 0, 0, g.time));
    else if (b.type === "lumber") art(c, x, y, () => drawLumber(c, 0, 0));
    else if (b.type === "quarry") art(c, x, y, () => drawQuarry(c, 0, 0, g.time));
    else if (b.type === "altar")
      art(c, x, y, () => {
        c.save();
        c.translate(28, 54);
        c.scale(1.32, 1.32);
        c.translate(-28, -54);
        drawAltar(c, 0, 0, g.time);
        c.restore();
      });
    else art(c, x, y, () => drawLarge(c, 0, 0, b, g.time));

    bevel(c, x, y, b.w * TS, b.h * TS);

    if (!b.complete || b.upgrading) {
      c.fillStyle = "rgba(75,45,25,.45)";
      c.fillRect(x, y, b.w * TS, b.h * TS);
      c.strokeStyle = "#b07d44";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x + 3, y + 3);
      c.lineTo(x + b.w * TS - 3, y + b.h * TS - 3);
      c.moveTo(x + b.w * TS - 3, y + 3);
      c.lineTo(x + 3, y + b.h * TS - 3);
      c.stroke();
      c.lineWidth = 1;
    }
    if (["townhall", "tower", "house"].includes(b.type) && b.complete) {
      art(c, x + b.w * TS - 8, y + b.h * TS - 16, () => torch(c, 0, 0, g.time));
    }
  };

  const drawBuildingBars = (c: CanvasRenderingContext2D, g: GameEngine) => {
    for (const b of g.buildings) {
      if (!g.isExplored(b.x, b.y)) continue;
      const x = b.x * TS;
      const y = b.y * TS;
      if (!b.complete || b.upgrading) {
        bar(c, x, y + b.h * TS - 6, b.w * TS, 5, b.progress / b.buildTime, "#be873a");
      }
      if (b.hp < b.maxHp || b.type === "townhall") {
        bar(c, x, y + b.h * TS - 1, b.w * TS, 4, b.hp / b.maxHp, "#52a650");
      }
    }
  };

  const drawOccludedSilhouettes = (c: CanvasRenderingContext2D, g: GameEngine) => {
    // Check if any unit, hero, or enemy is standing behind a tall building or tree canopy
    const isBehindTallObject = (ex: number, ey: number): boolean => {
      for (const b of g.buildings) {
        if (b.hp <= 0 || b.type === "farm") continue;
        const topReach = b.type === "townhall" || b.type === "tower" || b.type === "altar" ? 1.25 : 0.95;
        if (
          ex >= b.x - 0.35 &&
          ex <= b.x + b.w - 0.65 &&
          ey >= b.y - topReach &&
          ey < b.y + b.h - 0.25
        ) {
          return true;
        }
      }
      for (const n of g.nodes) {
        if (n.amount <= 0 || n.type !== "tree") continue;
        if (Math.abs(ex - n.x) <= 0.45 && ey >= n.y - 0.95 && ey < n.y - 0.05) {
          return true;
        }
      }
      return false;
    };

    c.save();
    // Friendly Units Silhouette
    for (const u of g.units) {
      if (u.state === "death" || !g.isExplored(Math.round(u.x), Math.round(u.y))) continue;
      if (isBehindTallObject(u.x, u.y)) {
        const ux = (u.x + 0.5) * TS;
        const uy = (u.y + 0.52) * TS;
        c.strokeStyle = "rgba(115, 217, 255, 0.55)";
        c.fillStyle = "rgba(56, 189, 248, 0.18)";
        c.lineWidth = 1.4;
        c.beginPath();
        c.ellipse(ux, uy, 6 * ART_R, 10 * ART_R, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }

    // Hero Silhouette
    const hero = g.heroUnit || Object.values(g.altarHeroes).find((h) => h && h.hp > 0);
    if (hero && hero.hp > 0 && isBehindTallObject(hero.x, hero.y)) {
      const hx = (hero.x + 0.5) * TS;
      const hy = (hero.y + 0.48) * TS;
      c.strokeStyle = "rgba(251, 191, 36, 0.65)";
      c.fillStyle = "rgba(251, 191, 36, 0.22)";
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(hx, hy, 7.5 * ART_R, 12 * ART_R, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }

    // Enemy Silhouette
    for (const e of g.enemies) {
      if (e.state === "death" || !g.isVisible(Math.round(e.x), Math.round(e.y))) continue;
      if (isBehindTallObject(e.x, e.y)) {
        const ex = (e.x + 0.5) * TS;
        const ey = (e.y + 0.6) * TS;
        c.strokeStyle = "rgba(244, 63, 94, 0.6)";
        c.fillStyle = "rgba(244, 63, 94, 0.2)";
        c.lineWidth = 1.3;
        c.beginPath();
        c.ellipse(ex, ey, 6 * ART_R, 6 * ART_R, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }
    c.restore();
  };

  const drawHall = (c: CanvasRenderingContext2D, x: number, y: number, b: Building, time: number) => {
    const roofCol = b.tier === 1 ? "#421c25" : b.tier === 2 ? "#624025" : "#561b29";
    c.fillStyle = "rgba(0,0,0,.5)";
    c.fillRect(x + 4, y + 50, 48, 4);

    // 2.5D Rear Castle Keep & High Pitched Roof (extends into y < 0 to occlude units behind Town Hall)
    c.fillStyle = "#0d0c0f";
    c.fillRect(x + 3, y - 10, 50, 62);
    bricks(c, x + 4, y - 6, 48, 57, "#211f25", "#121116", "rgba(255,255,255,.12)");

    // Rear Roof Gable & Ridge spanning across the keep
    c.fillStyle = shade(roofCol, 0.55);
    c.fillRect(x + 5, y - 14, 46, 10);
    c.fillStyle = shade(roofCol, 0.85);
    c.fillRect(x + 8, y - 17, 40, 6);

    // Flanking Turrets projecting upward
    c.fillStyle = "#16151a";
    c.fillRect(x + 3, y - 12, 14, 64);
    c.fillRect(x + 39, y - 12, 14, 64);
    bricks(c, x + 4, y - 11, 12, 63, "#2e2d34", "#19181d", "rgba(255,255,255,.12)");
    bricks(c, x + 40, y - 11, 12, 63, "#2e2d34", "#19181d", "rgba(255,255,255,.12)");
    c.fillStyle = "#151319";
    c.fillRect(x + 4, y - 11, 2, 63);
    c.fillRect(x + 50, y - 11, 2, 63);
    c.fillStyle = "rgba(255,255,255,.1)";
    c.fillRect(x + 15, y - 11, 1, 63);
    c.fillRect(x + 51, y - 11, 1, 63);
    c.fillStyle = "#211f25";
    c.fillRect(x + 3, y - 14, 14, 4);
    c.fillRect(x + 39, y - 14, 14, 4);
    c.fillStyle = "#2e2d34";
    c.fillRect(x + 3, y - 17, 3, 4);
    c.fillRect(x + 8, y - 17, 3, 4);
    c.fillRect(x + 13, y - 17, 3, 4);
    c.fillRect(x + 39, y - 17, 3, 4);
    c.fillRect(x + 44, y - 17, 3, 4);
    c.fillRect(x + 49, y - 17, 3, 4);

    // Central Grand Keep Tower
    c.fillStyle = "#16151a";
    c.fillRect(x + 17, y - 14, 22, 65);
    c.fillStyle = "#2e2d34";
    c.fillRect(x + 18, y - 13, 20, 63);

    c.fillStyle = shade(roofCol, 0.65);
    c.fillRect(x + 15, y - 16, 26, 7);
    c.fillStyle = roofCol;
    c.fillRect(x + 18, y - 19, 20, 5);
    c.fillStyle = shade(roofCol, 1.2);
    c.fillRect(x + 22, y - 21, 12, 3);
    c.fillStyle = "#2b1c17";
    c.fillRect(x + 27, y - 26, 2, 6);

    // Spire Flag Pole & Waving Royal Swallowtail Silk Banner
    const flagWave = Math.sin(time * 3.8) * 3;
    c.fillStyle = "#1e1b18";
    c.fillRect(x + 27, y - 32, 2, 12);
    c.fillStyle = "#f59e0b"; // Golden finial sphere
    c.fillRect(x + 26, y - 33, 4, 2);

    // Dynamic Royal Banner
    c.fillStyle = b.tier >= 2 ? "#b91c1c" : "#1d4ed8";
    c.beginPath();
    c.moveTo(x + 29, y - 32);
    c.lineTo(x + 42 + flagWave * 0.8, y - 28);
    c.lineTo(x + 37 + flagWave * 0.4, y - 24);
    c.lineTo(x + 29, y - 24);
    c.closePath();
    c.fill();
    // Royal heraldic gold crest
    c.fillStyle = "#fbbf24";
    c.fillRect(x + 31 + flagWave * 0.25, y - 29, 3, 2);

    // Chimney Smoke Puffs drifting upwards
    const smokePhase = (time * 16) % 36;
    const smokeWobble = Math.sin(time * 2.5) * 2.5;
    c.fillStyle = "rgba(226, 232, 240, 0.25)";
    c.beginPath();
    c.arc(x + 12 + smokeWobble, y - 4 - smokePhase * 0.4, 2.5 + smokePhase * 0.08, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#0a0608";
    c.fillRect(x + 24, y + 32, 9, 19);
    c.fillStyle = "#2b1c17";
    c.fillRect(x + 25, y + 33, 7, 17);
    c.fillStyle = "#432e23";
    c.fillRect(x + 25, y + 33, 7, 1);
    c.fillStyle = "rgba(0,0,0,.5)";
    c.fillRect(x + 28, y + 33, 1, 17);
    c.fillStyle = "#94753f";
    c.fillRect(x + 30, y + 42, 1, 2);
    c.fillStyle = "#0a0608";
    c.fillRect(x + 8, y + 14, 4, 5);
    c.fillRect(x + 44, y + 14, 4, 5);
    c.fillRect(x + 24, y + 10, 9, 6);

    // Warm Candlelight glowing in arched castle windows with flicker
    const candleFlicker = 0.65 + 0.35 * Math.sin(time * 7 + x * 0.3);
    c.fillStyle = `rgba(251, 191, 36, ${candleFlicker})`;
    c.fillRect(x + 9, y + 15, 2, 3);
    c.fillRect(x + 45, y + 15, 2, 3);
    c.fillRect(x + 25, y + 11, 7, 4);

    moss(c, x + 5, y + 52, 9, 4);
    moss(c, x + 42, y + 52, 9, 11);
    crack(c, x + 9, y + 21, 13, 1.35, x + 5);
  };

  const drawTower = (c: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    c.fillStyle = "rgba(0,0,0,.45)";
    c.beginPath();
    c.ellipse(x + 14, y + 29, 11, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#0d0c0f";
    c.fillRect(x + 3, y + 23, 22, 7);
    bricks(c, x + 4, y + 24, 20, 5, "#3b3940", "#1e1d22", "rgba(255,255,255,.15)");
    c.fillStyle = "#0b0a0e";
    c.fillRect(x + 6, y + 2, 16, 22);
    bricks(c, x + 7, y + 11, 14, 13, "#2e2d34", "#16161a", "rgba(255,255,255,.12)");
    bricks(c, x + 7, y - 2, 14, 13, "#37363e", "#1b1a1f", "rgba(255,255,255,.16)");
    c.fillStyle = "#4a555e";
    c.fillRect(x + 5, y + 9, 18, 3);
    c.fillStyle = "#64727b";
    c.fillRect(x + 5, y + 9, 18, 1);
    c.fillStyle = "#0a0608";
    c.fillRect(x + 12, y + 16, 4, 7);
    c.fillStyle = "#d59850";
    c.globalAlpha = 0.55;
    c.fillRect(x + 13, y + 17, 2, 5);
    c.globalAlpha = 1;
    c.fillStyle = "#1a1a1f";
    c.fillRect(x + 4, y - 4, 20, 5);
    for (let i = 0; i < 5; i++) c.fillRect(x + 5 + i * 4, y - 9, 3, 5);
    c.fillStyle = "#2e2d34";
    for (let i = 0; i < 5; i++) c.fillRect(x + 5 + i * 4, y - 9, 3, 4);

    // Watchman archer silhouette scanning on parapet
    const archerLook = Math.sin(time * 1.5) > 0 ? 1 : 0;
    c.fillStyle = "#0f172a";
    c.fillRect(x + 8, y - 13, 3, 4); // Head & cap
    c.fillRect(x + 7, y - 9, 5, 4);  // Cloak body
    c.fillStyle = "#b45309"; // Wooden Bow
    c.fillRect(x + 12 + archerLook, y - 13, 1, 6);

    // Rooftop Iron Brazier with Glowing Embers
    c.fillStyle = "#1e293b";
    c.fillRect(x + 16, y - 11, 4, 3);
    const emberPulse = 0.7 + 0.3 * Math.sin(time * 8);
    c.fillStyle = `rgba(249, 115, 22, ${emberPulse})`;
    c.fillRect(x + 17, y - 12, 2, 2);
    c.fillStyle = "#fef08a";
    c.fillRect(x + 17.5, y - 12.5, 1, 1);

    c.fillStyle = "#2b1c17";
    c.fillRect(x + 22, y - 16, 2, 10);
    const wf = Math.sin(time * 4 + x) * 2;
    c.fillStyle = "#561b29";
    c.beginPath();
    c.moveTo(x + 24, y - 15);
    c.lineTo(x + 24 + 7 + wf, y - 12);
    c.lineTo(x + 24, y - 9);
    c.closePath();
    c.fill();
    moss(c, x + 5, y + 4, 17, 7);
    moss(c, x + 5, y + 29, 18, 3);
  };

  const drawWall = (c: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    c.fillStyle = "rgba(0,0,0,.45)";
    c.fillRect(x + 3, y + 25, 22, 3);
    // 4 Heavy Sharpened Defensive Log Stakes
    for (let i = 0; i < 4; i++) {
      const bx = x + 4 + i * 5;
      c.fillStyle = "#130b08";
      c.fillRect(bx, y + 3, 5, 22);
      c.fillStyle = "#36251e";
      c.fillRect(bx + 1, y + 3, 3, 22);
      c.fillStyle = "#5c3d2e";
      c.fillRect(bx + 1, y + 4, 1, 21);
      c.fillStyle = "#1f1310";
      c.fillRect(bx + 3, y + 3, 1, 22);
      // Sharpened Spearhead Tip
      c.fillStyle = "#130b08";
      c.fillRect(bx + 1, y + 1, 3, 2);
      c.fillStyle = "#2b1c17";
      c.fillRect(bx + 2, y, 1, 3);
      c.fillStyle = "#78350f";
      c.fillRect(bx + 2, y + 1, 1, 2);
    }
    // Heavy Iron Reinforcing Crossbeam with Steel Rivets
    c.fillStyle = "#1e293b";
    c.fillRect(x + 3, y + 12, 22, 3);
    c.fillStyle = "#475569";
    c.fillRect(x + 4, y + 13, 20, 1);
    // Rivets
    c.fillStyle = "#94a3b8";
    for (let r = 0; r < 4; r++) {
      c.fillRect(x + 5 + r * 5, y + 13, 1, 1);
    }
    // Mounted Iron Torch Sconce on the wall
    c.fillStyle = "#0f172a";
    c.fillRect(x + 13, y + 8, 3, 5); // Bracket
    c.fillStyle = "#451a03";
    c.fillRect(x + 14, y + 6, 2, 4); // Torch stick
    // Flickering Defensive Flame & Embers
    const flick = Math.sin(time * 14 + x) * 0.8;
    c.fillStyle = "#ea580c";
    c.fillRect(x + 13 + flick * 0.3, y + 3, 4, 4);
    c.fillStyle = "#facc15";
    c.fillRect(x + 14 + flick * 0.4, y + 2, 2, 3);
    c.fillStyle = "#ffffff";
    c.fillRect(x + 14, y + 3, 1, 1);

    // Weathered Moss at the base
    moss(c, x + 4, y + 19, 6, 4);
    moss(c, x + 16, y + 20, 5, 4);
  };

  const drawGate = (c: CanvasRenderingContext2D, x: number, y: number, b: Building, g: GameEngine) => {
    const time = g.time;
    c.fillStyle = "rgba(0,0,0,.45)";
    c.fillRect(x + 2, y + 25, 24, 3);

    // Check if any allied unit, hero, or golem is passing through or near the gate
    const hero = g.heroUnit || Object.values(g.altarHeroes).find((h) => h && h.hp > 0);
    const isAllyNear =
      g.units.some((u) => u.state !== "death" && Math.hypot(u.x - b.x, u.y - b.y) <= 1.25) ||
      (hero && Math.hypot(hero.x - b.x, hero.y - b.y) <= 1.35) ||
      (g.golem && g.golem.hp > 0 && Math.hypot(g.golem.x - b.x, g.golem.y - b.y) <= 1.45);

    const openLift = isAllyNear && b.complete ? 11 : 0;

    // Paved Stone Cobble Roadway through the gatehouse
    c.fillStyle = "#27272a";
    c.fillRect(x + 7, y + 14, 14, 13);
    c.fillStyle = "#3f3f46";
    c.fillRect(x + 9, y + 16, 4, 4);
    c.fillRect(x + 15, y + 16, 4, 4);
    c.fillRect(x + 11, y + 21, 6, 4);

    // Left & Right Fortified Stone Gatehouse Pillars
    c.fillStyle = "#18181b";
    c.fillRect(x + 2, y - 4, 7, 30);
    c.fillRect(x + 19, y - 4, 7, 30);
    bricks(c, x + 3, y - 3, 5, 28, "#3f3f46", "#27272a", "rgba(255,255,255,.15)");
    bricks(c, x + 20, y - 3, 5, 28, "#3f3f46", "#27272a", "rgba(255,255,255,.15)");

    // Iron Portcullis Grate & Oak Doors (raises up into archway when allies pass!)
    const grateH = Math.max(4, 18 - openLift);
    c.fillStyle = "#451a03";
    c.fillRect(x + 8, y + 6, 12, grateH);
    c.fillStyle = "#1e293b";
    // Vertical Iron Bars
    c.fillRect(x + 9, y + 6, 1.5, grateH);
    c.fillRect(x + 13.2, y + 6, 1.5, grateH);
    c.fillRect(x + 17.5, y + 6, 1.5, grateH);
    // Horizontal Iron Crossbars
    c.fillRect(x + 8, y + 6 + Math.min(4, grateH - 2), 12, 1.5);
    if (grateH > 9) {
      c.fillRect(x + 8, y + 6 + grateH - 4, 12, 1.5);
    }
    // Iron spikes at bottom of portcullis
    c.fillStyle = "#94a3b8";
    c.fillRect(x + 9, y + 6 + grateH, 1.5, 2);
    c.fillRect(x + 13.2, y + 6 + grateH, 1.5, 2);
    c.fillRect(x + 17.5, y + 6 + grateH, 1.5, 2);

    // 2.5D Overhead Stone Gatehouse Archway & Battlements (projects to y = -9)
    c.fillStyle = "#18181b";
    c.fillRect(x + 1, y - 7, 26, 14);
    bricks(c, x + 2, y - 6, 24, 11, "#52525b", "#27272a", "rgba(255,255,255,.18)");
    // Stone Crenellations on top
    c.fillStyle = "#3f3f46";
    for (let i = 0; i < 4; i++) {
      c.fillRect(x + 2 + i * 7, y - 9, 4, 3);
    }
    // Golden keystone crest on arch center
    c.fillStyle = "#eab308";
    c.fillRect(x + 12, y - 2, 4, 5);
    c.fillStyle = "#fef08a";
    c.fillRect(x + 13, y - 1, 2, 3);

    // Twin Flickering Gatehouse Torches
    const flick = Math.sin(time * 14 + x) * 0.6;
    for (const tx of [x + 4, x + 21]) {
      c.fillStyle = "#0f172a";
      c.fillRect(tx, y + 8, 2, 4);
      c.fillStyle = "#ea580c";
      c.fillRect(tx - 0.5 + flick * 0.3, y + 5, 3, 3);
      c.fillStyle = "#facc15";
      c.fillRect(tx + flick * 0.3, y + 4, 2, 2);
    }
  };

  const drawHouse = (c: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    c.fillStyle = "rgba(0,0,0,.45)";
    c.fillRect(x + 4, y + 25, 20, 3);

    // Stone Foundation
    c.fillStyle = "#27272a";
    c.fillRect(x + 5, y + 23, 18, 4);
    c.fillStyle = "#52525b";
    c.fillRect(x + 6, y + 23, 16, 1);

    // Half-Timbered Cottage Wall Body (Plaster + Dark Timber Framing)
    c.fillStyle = "#1c1917";
    c.fillRect(x + 5, y + 12, 18, 12);
    // Warm Stucco Plaster
    c.fillStyle = "#fef3c7";
    c.fillRect(x + 6, y + 13, 16, 10);
    // Timber Corner Posts & Crossbeams
    c.fillStyle = "#451a03";
    c.fillRect(x + 5, y + 12, 2, 12);
    c.fillRect(x + 21, y + 12, 2, 12);
    c.fillRect(x + 6, y + 12, 16, 2);
    c.fillRect(x + 6, y + 21, 16, 2);
    // Tudor X-bracing timbers
    c.fillStyle = "#78350f";
    c.fillRect(x + 7, y + 15, 2, 2);
    c.fillRect(x + 8, y + 17, 2, 2);

    // Clay Shingled Pitched Roof (projected upward into y < 0 for 2.5D occlusion of units behind House)
    c.fillStyle = "#1f1310";
    c.fillRect(x + 2, y - 2, 24, 15);
    c.fillStyle = "#7c2d12";
    c.fillRect(x + 3, y - 5, 22, 16);
    c.fillStyle = "#9a3412";
    c.fillRect(x + 4, y - 8, 20, 12);
    c.fillStyle = "#c2410c";
    c.fillRect(x + 5, y - 10, 18, 8);
    c.fillStyle = "#ea580c";
    c.fillRect(x + 7, y - 11, 14, 3);

    // Stone Brick Chimney with Rising Smoke Puffs
    c.fillStyle = "#18181b";
    c.fillRect(x + 18, y - 14, 4, 10);
    c.fillStyle = "#52525b";
    c.fillRect(x + 19, y - 13, 2, 8);
    c.fillStyle = "#27272a";
    c.fillRect(x + 17, y - 15, 6, 2); // Chimney cap
    // Animated Smoke Wisps
    const sm1 = (time * 1.8) % 3;
    const sm2 = (time * 1.8 + 1.5) % 3;
    c.fillStyle = `rgba(226, 232, 240, ${0.45 * (1 - sm1 / 3)})`;
    c.beginPath();
    c.arc(x + 20 + Math.sin(time * 2 + sm1) * 2, y - 2 - sm1 * 6, 1.5 + sm1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = `rgba(226, 232, 240, ${0.45 * (1 - sm2 / 3)})`;
    c.beginPath();
    c.arc(x + 19 + Math.sin(time * 2 + sm2 + 1) * 2, y - 2 - sm2 * 6, 1.5 + sm2, 0, Math.PI * 2);
    c.fill();

    // Wooden Cottage Door with Iron Ring
    c.fillStyle = "#130b08";
    c.fillRect(x + 8, y + 16, 5, 8);
    c.fillStyle = "#78350f";
    c.fillRect(x + 9, y + 17, 3, 7);
    c.fillStyle = "#ca8a04";
    c.fillRect(x + 11, y + 20, 1, 1); // Iron latch ring

    // Window with Flower Planter Box
    c.fillStyle = "#0a0608";
    c.fillRect(x + 15, y + 15, 5, 5);
    c.fillStyle = "#fed7aa"; // Warm interior window light
    c.fillRect(x + 16, y + 16, 3, 3);
    c.fillStyle = "#78350f";
    c.fillRect(x + 17, y + 16, 1, 3); // Crossbar
    c.fillRect(x + 16, y + 17, 3, 1);
    // Planter Box
    c.fillStyle = "#451a03";
    c.fillRect(x + 14, y + 20, 6, 2);
    // Blossoming Flowers in Planter (Red, Yellow, Blue)
    c.fillStyle = "#ef4444";
    c.fillRect(x + 15, y + 19, 1.5, 1.5);
    c.fillStyle = "#facc15";
    c.fillRect(x + 17, y + 19, 1.5, 1.5);
    c.fillStyle = "#38bdf8";
    c.fillRect(x + 19, y + 19, 1.5, 1.5);

    // Hanging Brass Porch Lantern
    c.fillStyle = "#0f172a";
    c.fillRect(x + 6, y + 15, 2, 1); // Hook
    c.fillStyle = "#ca8a04";
    c.fillRect(x + 6, y + 16, 2, 3); // Lantern casing
    c.fillStyle = "#fef08a";
    c.fillRect(x + 6.5, y + 16.5, 1, 1.5); // Warm candle core
  };

  const drawFarm = (c: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    c.fillStyle = "rgba(0,0,0,.4)";
    c.fillRect(x + 2, y + 54, 52, 3);
    // Dark fertile tilled earth bed
    c.fillStyle = "#241611";
    c.fillRect(x, y + 6, 56, 50);
    c.fillStyle = "#36261e";
    for (let row = 0; row < 5; row++) c.fillRect(x + 2, y + 8 + row * 9, 52, 7);

    // Fence border
    c.fillStyle = "#451a03";
    c.fillRect(x + 1, y + 6, 54, 2);
    c.fillRect(x + 1, y + 54, 54, 2);
    c.fillRect(x + 1, y + 6, 2, 50);
    c.fillRect(x + 53, y + 6, 2, 50);
    // Fence posts
    c.fillStyle = "#78350f";
    for (let fp = 0; fp < 5; fp++) {
      c.fillRect(x + 2 + fp * 12, y + 4, 3, 5);
      c.fillRect(x + 2 + fp * 12, y + 53, 3, 5);
    }

    // Lush golden wheat crop rows with breeze sway
    const sway = Math.sin(time * 2.2) * 1.1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 9; col++) {
        // Leave top-right corner free for scarecrow
        if (row <= 1 && col >= 7) continue;
        const px = x + 4 + col * 5.4 + ((row % 2) * 2.5);
        const py = y + 8 + row * 9;
        c.fillStyle = "#3f6212";
        c.fillRect(px + sway * 0.4, py + 2, 1, 5);
        c.fillStyle = "#65a30d";
        c.fillRect(px + sway * 0.6, py + 1, 1, 3);
        c.fillStyle = "#d97706";
        c.fillRect(px + sway - 1, py - 1, 3, 3);
        c.fillStyle = "#fde047";
        c.fillRect(px + sway, py - 1, 1, 2);
      }
    }

    // Rustic Animated Scarecrow in corner
    const scX = x + 44;
    const scY = y + 8;
    const scWobble = Math.sin(time * 2.5) * 0.8;
    // Wooden post
    c.fillStyle = "#451a03";
    c.fillRect(scX + 4, scY + 3, 2, 14);
    // Crossbar arms
    c.fillRect(scX, scY + 6, 10, 2);
    // Burlap coat
    c.fillStyle = "#92400e";
    c.fillRect(scX + 2, scY + 5, 6, 7);
    c.fillStyle = "#b45309";
    c.fillRect(scX + 3, scY + 5, 4, 6);
    // Straw hands
    c.fillStyle = "#fde047";
    c.fillRect(scX - 1, scY + 6, 2, 2);
    c.fillRect(scX + 9, scY + 6, 2, 2);
    // Pumpkin / Straw head with hat tipping in the wind
    c.fillStyle = "#fef08a";
    c.fillRect(scX + 3 + scWobble * 0.5, scY + 1, 4, 4);
    c.fillStyle = "#78350f";
    c.fillRect(scX + 1 + scWobble, scY, 8, 2);
    c.fillRect(scX + 3 + scWobble, scY - 2, 4, 2);
  };

  const drawLumber = (c: CanvasRenderingContext2D, x: number, y: number) => {
    c.fillStyle = "rgba(0,0,0,.4)";
    c.fillRect(x + 3, y + 50, 50, 4);
    // Sawmill wooden deck & ground with sawdust
    c.fillStyle = "#1c120c";
    c.fillRect(x + 2, y + 24, 52, 28);
    // Sawdust piles
    c.fillStyle = "#b45309";
    c.fillRect(x + 26, y + 36, 14, 8);
    c.fillStyle = "#fde047";
    c.fillRect(x + 28, y + 38, 10, 4);
    c.fillRect(x + 30, y + 37, 6, 2);

    // Neatly stacked timber ricks with bark and tree rings
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 4; i++) {
        const lx = x + 5 + i * 5 + r * 2.5;
        const ly = y + 42 - r * 5;
        c.fillStyle = "#451a03";
        c.beginPath();
        c.arc(lx + 2.5, ly + 2.5, 3.2, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#92400e";
        c.beginPath();
        c.arc(lx + 2.5, ly + 2.5, 2.3, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = "#d97706";
        c.fillRect(lx + 2, ly + 2, 1, 1);
      }
    }

    // Heavy wooden sawhorse with crosscut saw
    c.fillStyle = "#78350f";
    c.fillRect(x + 30, y + 30, 2, 10);
    c.fillRect(x + 36, y + 30, 2, 10);
    c.fillRect(x + 28, y + 32, 12, 2);
    // Cut log resting on sawhorse
    c.fillStyle = "#451a03";
    c.fillRect(x + 29, y + 29, 10, 4);
    c.fillStyle = "#d97706";
    c.fillRect(x + 38, y + 29, 1, 4);
    // Steel crosscut saw blade with teeth
    c.fillStyle = "#cbd5e1";
    c.fillRect(x + 27, y + 28, 14, 1.5);
    c.fillStyle = "#64748b";
    c.fillRect(x + 26, y + 27, 2, 3);
    c.fillRect(x + 40, y + 27, 2, 3);

    // Chopping stump with embedded steel woodsman axe
    c.fillStyle = "#78350f";
    c.fillRect(x + 44, y + 38, 7, 7);
    c.fillStyle = "#92400e";
    c.fillRect(x + 45, y + 37, 5, 2);
    // Axe handle & blade
    c.fillStyle = "#ca8a04";
    c.fillRect(x + 46, y + 32, 2, 6);
    c.fillStyle = "#94a3b8";
    c.fillRect(x + 47, y + 36, 4, 3);
    c.fillStyle = "#f8fafc";
    c.fillRect(x + 50, y + 36, 1, 3);

    // Shelter Timber Roof & Beams (projected upward into y < 0 for 2.5D perspective occlusion)
    c.fillStyle = "#1f1310";
    c.fillRect(x, y - 8, 56, 20);
    c.fillStyle = "#4c2c1f";
    c.fillRect(x + 2, y - 10, 52, 20);
    c.fillStyle = "#78350f";
    c.fillRect(x + 4, y - 12, 48, 12);
    c.fillStyle = "#92400e";
    c.fillRect(x + 6, y - 14, 44, 6);
    // Support posts
    c.fillStyle = "#451a03";
    c.fillRect(x + 4, y + 8, 3, 18);
    c.fillRect(x + 49, y + 8, 3, 18);
    c.fillRect(x + 26, y + 8, 3, 18);
  };

  const drawQuarry = (c: CanvasRenderingContext2D, x: number, y: number, time = 0) => {
    c.fillStyle = "rgba(0,0,0,.4)";
    c.fillRect(x + 3, y + 50, 50, 4);

    // 2.5D Rear Granite Cliff Face & Timber Overhang (extends into y < 0 to occlude units behind Quarry)
    c.fillStyle = "#18181b";
    c.fillRect(x + 2, y - 10, 52, 60);
    c.fillStyle = "#27272a";
    c.fillRect(x + 4, y - 8, 48, 56);
    bricks(c, x + 5, y - 7, 46, 26, "#3f3f46", "#27272a", "rgba(255,255,255,.12)");
    // Upper Timber Shoring Beams along the cliff edge
    c.fillStyle = "#451a03";
    c.fillRect(x + 3, y - 11, 50, 4);
    c.fillStyle = "#78350f";
    c.fillRect(x + 5, y - 10, 46, 2);

    // Chiselled Granite blocks stacked
    c.fillStyle = "#3f3f46";
    c.fillRect(x + 6, y + 32, 14, 13);
    c.fillStyle = "#52525b";
    c.fillRect(x + 7, y + 33, 12, 11);
    c.fillStyle = "#71717a";
    c.fillRect(x + 7, y + 33, 12, 2);

    // Second stack of stone blocks
    c.fillStyle = "#3f3f46";
    c.fillRect(x + 38, y + 28, 12, 16);
    c.fillStyle = "#52525b";
    c.fillRect(x + 39, y + 29, 10, 14);
    c.fillStyle = "#71717a";
    c.fillRect(x + 39, y + 29, 10, 2);

    // Tall 2.5D Timber Hoisting Derrick / Crane in center
    const hoistBob = Math.sin(time * 2.2) * 2.2;
    c.fillStyle = "#451a03";
    c.fillRect(x + 23, y - 14, 4, 50); // Tall Mast
    c.fillRect(x + 20, y + 34, 10, 3); // Heavy Base
    c.fillStyle = "#78350f";
    // Diagonal boom arm projecting high
    c.beginPath();
    c.moveTo(x + 25, y - 4);
    c.lineTo(x + 38, y - 13);
    c.lineTo(x + 39, y - 10);
    c.lineTo(x + 26, y - 1);
    c.closePath();
    c.fill();
    // Iron Pulley Wheel
    c.fillStyle = "#1e293b";
    c.beginPath();
    c.arc(x + 37, y - 11, 2.8, 0, Math.PI * 2);
    c.fill();
    // Hoist Rope & Hook lifting stone block with gentle bobbing
    c.strokeStyle = "#ca8a04";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x + 37, y - 11);
    c.lineTo(x + 37, y + 12 + hoistBob);
    c.stroke();
    // Suspended Granite Block on hook
    c.fillStyle = "#64748b";
    c.fillRect(x + 33, y + 12 + hoistBob, 8, 6);
    c.fillStyle = "#94a3b8";
    c.fillRect(x + 33, y + 12 + hoistBob, 8, 1.5);
    c.fillStyle = "#334155";
    c.fillRect(x + 36, y + 10 + hoistBob, 2, 2); // Iron hook

    // Lean-to Tools: Sledgehammer and Pickaxe
    c.fillStyle = "#78350f";
    c.fillRect(x + 8, y + 24, 1.5, 8); // Pick handle
    c.fillStyle = "#94a3b8";
    c.fillRect(x + 6, y + 24, 6, 2);   // Pick head
    c.fillStyle = "#451a03";
    c.fillRect(x + 12, y + 26, 1.5, 8); // Sledge handle
    c.fillStyle = "#64748b";
    c.fillRect(x + 11, y + 25, 4, 3);  // Sledge iron head
  };

  const drawAltar = (c: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    c.fillStyle = "rgba(0,0,0,.4)";
    c.fillRect(x + 3, y + 50, 50, 4);
    c.fillStyle = "#1c1816";
    c.fillRect(x + 4, y + 38, 48, 14);
    bricks(c, x + 5, y + 38, 46, 12, "#2e2a29", "#1b1915", "rgba(255,255,255,.1)");

    // Ancient glowing runic glyph circle on the stone floor
    const runeGlow = 0.45 + 0.35 * Math.sin(time * 3.0);
    c.save();
    c.strokeStyle = `rgba(168, 85, 247, ${runeGlow})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(x + 28, y + 43, 16, 6, 0, 0, Math.PI * 2);
    c.stroke();
    // Mystic rune tick marks
    c.fillStyle = `rgba(192, 132, 252, ${runeGlow * 1.2})`;
    for (let r = 0; r < 6; r++) {
      const a = (r * Math.PI) / 3 + time * 0.4;
      c.fillRect(x + 28 + Math.cos(a) * 15 - 1, y + 43 + Math.sin(a) * 5.5 - 1, 2, 2);
    }
    c.restore();

    c.fillStyle = "#252220";
    c.fillRect(x + 8, y + 8, 6, 24);
    c.fillRect(x + 42, y + 8, 6, 24);
    c.fillStyle = "#403b37";
    c.fillRect(x + 9, y + 8, 4, 22);
    c.fillRect(x + 43, y + 8, 4, 22);

    const glow = 0.55 + 0.35 * Math.sin(time * 2.4);
    const hover = Math.sin(time * 1.6) * 3;
    c.globalAlpha = 0.22 + glow * 0.15;
    c.fillStyle = "#73489c";
    c.beginPath();
    c.ellipse(x + 28, y + 16 + hover, 12, 12, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = "#0a0608";
    c.beginPath();
    c.moveTo(x + 28, y + 4 + hover);
    c.lineTo(x + 34, y + 14 + hover);
    c.lineTo(x + 28, y + 24 + hover);
    c.lineTo(x + 22, y + 14 + hover);
    c.closePath();
    c.fill();
    c.fillStyle = "#593b75";
    c.beginPath();
    c.moveTo(x + 28, y + 6 + hover);
    c.lineTo(x + 32, y + 14 + hover);
    c.lineTo(x + 28, y + 22 + hover);
    c.lineTo(x + 24, y + 14 + hover);
    c.closePath();
    c.fill();
    c.globalAlpha = glow;
    c.fillStyle = "#b57dea";
    c.beginPath();
    c.moveTo(x + 28, y + 8 + hover);
    c.lineTo(x + 30, y + 14 + hover);
    c.lineTo(x + 28, y + 18 + hover);
    c.lineTo(x + 26, y + 14 + hover);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;

    // 3 Orbiting Runic Crystal Shards circling in 3D perspective ellipse
    for (let i = 0; i < 3; i++) {
      const angle = time * 2.2 + (i * Math.PI * 2) / 3;
      const ox = x + 28 + Math.cos(angle) * 16;
      const oy = y + 15 + hover + Math.sin(angle) * 6;
      const shardScale = 0.8 + Math.sin(angle) * 0.3; // depth scale

      c.fillStyle = "#7e22ce";
      c.fillRect(ox - 1.5 * shardScale, oy - 2 * shardScale, 3 * shardScale, 4 * shardScale);
      c.fillStyle = "#c084fc";
      c.fillRect(ox - 1 * shardScale, oy - 1 * shardScale, 2 * shardScale, 2 * shardScale);
      c.fillStyle = "#ffffff";
      c.fillRect(ox, oy - 1 * shardScale, 1, 1);
    }
  };

  const drawLarge = (c: CanvasRenderingContext2D, x: number, y: number, b: Building, time = 0) => {
    const isB = b.type === "barracks";
    c.fillStyle = "rgba(0,0,0,.45)";
    c.fillRect(x + 5, y + 50, 46, 4);
    c.fillStyle = "#14110f";
    c.fillRect(x + 4, y - 10, 48, 62);
    bricks(c, x + 5, y - 2, 46, 53, isB ? "#2b181d" : "#2e2a29", isB ? "#180e11" : "#1b1915", "rgba(255,255,255,.1)");
    c.fillStyle = isB ? "#4b1a26" : "#4c2c1f";
    c.fillRect(x + 3, y - 12, 50, 18);
    c.fillStyle = isB ? "#632535" : "#633c2b";
    c.fillRect(x + 5, y - 15, 46, 10);
    c.fillStyle = isB ? "#7f2d42" : "#784936";
    c.fillRect(x + 8, y - 17, 40, 4);

    if (isB) {
      // Rooftop War Pennant Flag waving in the wind
      const wave = Math.sin(time * 4.2 + x) * 2.5;
      c.fillStyle = "#1e1b18";
      c.fillRect(x + 27, y - 26, 2, 10);
      c.fillStyle = "#dc2626";
      c.beginPath();
      c.moveTo(x + 29, y - 25);
      c.lineTo(x + 40 + wave, y - 22);
      c.lineTo(x + 29, y - 18);
      c.closePath();
      c.fill();

      // Arched Garrison Double Doors
      c.fillStyle = "#0a0608";
      c.fillRect(x + 22, y + 32, 12, 19);
      c.fillStyle = "#3e2723";
      c.fillRect(x + 23, y + 33, 10, 17);
      c.fillStyle = "#94a3b8";
      c.fillRect(x + 23, y + 36, 10, 1);
      c.fillRect(x + 23, y + 44, 10, 1);

      // Crimson heraldry banner over entrance
      c.fillStyle = "#903e46";
      c.fillRect(x + 22, y + 2, 12, 8);
      c.fillStyle = "#94753f";
      c.fillRect(x + 26, y + 4, 4, 3);

      // Crossed Steel Swords over door
      c.fillStyle = "#cbd5e1";
      c.fillRect(x + 24, y + 14, 8, 1);
      c.fillRect(x + 27, y + 11, 2, 7);
      c.fillStyle = "#f59e0b";
      c.fillRect(x + 27, y + 17, 2, 2);

      // Wooden Training Combat Dummy in the yard (left)
      const dummyShake = Math.sin(time * 6) > 0.85 ? 0.8 : 0;
      c.fillStyle = "#78350f";
      c.fillRect(x + 7, y + 36, 3, 10); // Post
      c.fillStyle = "#b45309";
      c.fillRect(x + 6 + dummyShake, y + 32, 5, 6);  // Straw torso
      c.fillStyle = "#eab308";
      c.fillRect(x + 4 + dummyShake, y + 34, 9, 2);  // Horizontal striking arms
      c.fillStyle = "#991b1b";
      c.fillRect(x + 7 + dummyShake, y + 30, 3, 3);  // Helmet / target head

      // Steel Weapon Rack with Spears & Shield (right)
      c.fillStyle = "#451a03";
      c.fillRect(x + 39, y + 36, 10, 8);
      c.fillStyle = "#cbd5e1";
      c.fillRect(x + 41, y + 29, 1, 14);
      c.fillRect(x + 44, y + 29, 1, 14);
      c.fillRect(x + 47, y + 29, 1, 14);
    }
  };

  // ==========================================
  // CHARACTER AND UNIT PROCEDURAL SPRITES
  // ==========================================

  const drawSpeechBubble = (
    c: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    text: string,
    alpha = 1
  ) => {
    c.save();
    c.font = "bold 11px system-ui, -apple-system, sans-serif";
    const textWidth = c.measureText(text).width;
    const paddingX = 8;
    const boxW = Math.min(240, textWidth + paddingX * 2);
    const boxH = 20;
    const bx = Math.round(anchorX - boxW / 2);
    const by = Math.round(anchorY - boxH - 6);

    const fade = Math.min(1, Math.max(0, alpha * 2.5));
    c.globalAlpha = fade;

    // Bubble Background (clean dark rounded box with high contrast border)
    c.fillStyle = "rgba(15, 17, 23, 0.95)";
    c.strokeStyle = "rgba(255, 213, 107, 0.85)";
    c.lineWidth = 1.5;

    c.beginPath();
    c.roundRect(bx, by, boxW, boxH, 4);
    c.fill();
    c.stroke();

    // Little pointer triangle
    c.fillStyle = "rgba(15, 17, 23, 0.95)";
    c.beginPath();
    c.moveTo(anchorX - 4, by + boxH);
    c.lineTo(anchorX, by + boxH + 5);
    c.lineTo(anchorX + 4, by + boxH);
    c.closePath();
    c.fill();

    c.fillStyle = "#ffffff";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, anchorX, by + boxH / 2, boxW - 10);

    c.restore();
  };

  const drawUnit = (c: CanvasRenderingContext2D, u: Unit, g: GameEngine) => {
    const ux = Math.round(u.x * TS);
    const uy = Math.round(u.y * TS);
    const phase = u.anim * 3.14159;
    const bob = u.state === "walk" ? Math.abs(Math.sin(phase)) * 1.6 : 0;
    const walkVel = u.state === "walk" ? Math.cos(phase) : 0;
    const workPulse = ["chop", "mine", "farm", "build", "repair", "attack"].includes(u.state)
      ? Math.abs(Math.sin(u.anim * 6)) * 0.5
      : 0;

    const squishY = u.clickSquish ? 1 - u.clickSquish * 0.28 : 1;
    const squishX = u.clickSquish ? 1 + u.clickSquish * 0.28 : 1;

    const sy = (1 + walkVel * 0.08 + workPulse * 0.05) * squishY;
    const sx = (1 - walkVel * 0.05 - workPulse * 0.05) * squishX;
    const facing = u._facing || "right";

    art(c, ux, uy - bob, () => {
      c.save();
      c.translate(14, 27);
      if (facing === "left") c.scale(-1, 1);
      c.scale(sx, sy);
      c.translate(-14, -27);
      drawPerson(c, 0, 0, u, g.time);
      c.restore();
    });

    bevel(c, ux + 3 * ART_R, uy - bob + 1 * ART_R, 20 * ART_R, 26 * ART_R);

    if (u.carry) {
      const type = u.carry.type;
      const cy = uy - 14 - bob;
      const cx = ux + 7;
      c.fillStyle = "rgba(0,0,0,0.75)";
      c.fillRect(cx - 1, cy - 1, 16, 10);
      c.strokeStyle = "#475569";
      c.strokeRect(cx - 1, cy - 1, 16, 10);

      if (type === "wood") {
        // Tied logs bundle
        c.fillStyle = "#854d0e";
        c.fillRect(cx + 2, cy + 2, 10, 4);
        c.fillStyle = "#a16207";
        c.fillRect(cx + 3, cy + 3, 8, 2);
        c.fillStyle = "#fef08a"; // golden rope tie
        c.fillRect(cx + 6, cy + 1, 2, 6);
      } else if (type === "stone") {
        // Chiseled stone cubes
        c.fillStyle = "#475569";
        c.fillRect(cx + 2, cy + 2, 9, 5);
        c.fillStyle = "#94a3b8";
        c.fillRect(cx + 3, cy + 3, 7, 2);
      } else if (type === "gold") {
        // Gleaming gold ingots
        c.fillStyle = "#ca8a04";
        c.fillRect(cx + 2, cy + 3, 10, 4);
        c.fillStyle = "#fde047";
        c.fillRect(cx + 3, cy + 2, 8, 2);
      } else if (type === "food") {
        // Golden wheat sheaf
        c.fillStyle = "#ca8a04";
        c.fillRect(cx + 4, cy + 4, 6, 4);
        c.fillStyle = "#facc15";
        c.fillRect(cx + 3, cy + 1, 8, 3);
      } else {
        // Arcane crystal
        c.fillStyle = "#9333ea";
        c.fillRect(cx + 4, cy + 2, 6, 6);
        c.fillStyle = "#c084fc";
        c.fillRect(cx + 5, cy + 3, 4, 3);
      }
    }
    if (u.hp < u.maxHp) {
      bar(c, ux + 5, uy - 5 - bob, 20, 3, u.hp / u.maxHp, "#50b04e");
    }

    if (u.veteran) {
      c.save();
      c.font = "bold 9px sans-serif";
      c.fillText("⭐", ux + 19, uy - 5 - bob);
      c.restore();
    }

    if (u.role === "scout" && u.target?.kind === "scout") {
      c.save();
      const a = 0.65 + 0.35 * Math.sin(g.time * 5);
      c.fillStyle = `rgba(115, 217, 255, ${a})`;
      c.font = "bold 9px monospace";
      c.fillText("🧭", ux + 7, uy - 7 - bob);
      c.restore();
    }

    if (u.speech) {
      drawSpeechBubble(c, ux + 14, uy - 10 - bob, u.speech.text, u.speech.time / u.speech.maxTime);
    }
  };

  const drawPerson = (c: CanvasRenderingContext2D, x: number, y: number, u: Unit, time: number) => {
    const walk = u.state === "walk";
    const work = ["chop", "mine", "farm", "build", "repair", "attack"].includes(u.state);
    const idle = u.state === "idle";
    const f = Math.floor((u.anim || 0) * 4) % 4;
    const leg = walk ? [0, 2, 0, -2][f] : 0;
    const arm = work ? [-3, 0, 3, 0][f] : walk ? [2, 0, -2, 0][f] : 0;
    const role = u.role;

    // Lifelike Idle Chest Breathing & Natural Eye Blinking
    const breathe = idle ? Math.sin(time * 3 + u.id * 1.6) * 0.75 : 0;
    const blink = (time + u.id * 0.7) % 3.6 < 0.14;

    // Shadow
    c.fillStyle = "rgba(0,0,0,.45)";
    c.beginPath();
    c.ellipse(x + 14, y + 27, 9, 3.4, 0, 0, Math.PI * 2);
    c.fill();

    // Legs & Boots
    c.fillStyle = "#1b140f";
    c.fillRect(x + 10, y + 20 + leg, 3, 7);
    c.fillRect(x + 15, y + 20 - leg, 3, 7);
    c.fillStyle = "#3d2b1f";
    c.fillRect(x + 10, y + 24 + leg, 4, 3);
    c.fillRect(x + 15, y + 24 - leg, 4, 3);

    // Tunic / Armor Base Color Scheme
    const roleColors: Record<string, { body: string; dark: string; trim: string; skin: string }> = {
      builder: { body: "#8c5e2d", dark: "#523414", trim: "#d4a359", skin: "#f3c79c" },
      woodcutter: { body: "#a83838", dark: "#631c1c", trim: "#2b1c1c", skin: "#e5b078" },
      stoneMiner: { body: "#596066", dark: "#363a3d", trim: "#878f96", skin: "#f3c79c" },
      goldMiner: { body: "#9c722a", dark: "#5e4213", trim: "#f5c542", skin: "#f3c79c" },
      farmer: { body: "#4b6e3b", dark: "#2c4222", trim: "#96a66d", skin: "#f3c79c" },
      warrior: { body: "#636d7a", dark: "#3a414a", trim: "#a8b5c4", skin: "#f3c79c" },
      javelin: { body: "#2d5248", dark: "#18302a", trim: "#739985", skin: "#f3c79c" },
      scout: { body: "#294652", dark: "#15262e", trim: "#5ca3b8", skin: "#f3c79c" },
      trainee: { body: "#615243", dark: "#3b3024", trim: "#a8947e", skin: "#f3c79c" },
    };

    const pal = roleColors[role] || roleColors.trainee;

    // Body / Tunic (with subtle chest expansion)
    c.fillStyle = "#0c0806";
    c.fillRect(x + 8, y + 12 - breathe * 0.5, 12, 10);
    c.fillStyle = pal.body;
    c.fillRect(x + 9, y + 13 - breathe * 0.5, 10, 8);
    c.fillStyle = pal.dark;
    c.fillRect(x + 9, y + 17, 10, 4);

    // Belt & Buckle
    c.fillStyle = "#26170d";
    c.fillRect(x + 8, y + 17, 12, 2);
    c.fillStyle = pal.trim;
    c.fillRect(x + 13, y + 17, 2, 2);

    // Arms
    c.fillStyle = "#0c0806";
    c.fillRect(x + 6, y + 13 - arm / 2 - breathe * 0.5, 3, 7);
    c.fillRect(x + 19, y + 13 + arm / 2 - breathe * 0.5, 3, 7);
    c.fillStyle = pal.body;
    c.fillRect(x + 6, y + 13 - arm / 2 - breathe * 0.5, 2, 5);
    c.fillRect(x + 19, y + 13 + arm / 2 - breathe * 0.5, 2, 5);
    c.fillStyle = pal.skin;
    c.fillRect(x + 6, y + 17 - arm / 2 - breathe * 0.5, 2, 2);
    c.fillRect(x + 19, y + 17 + arm / 2 - breathe * 0.5, 2, 2);

    // Head / Face
    c.fillStyle = "#0c0806";
    c.fillRect(x + 9, y + 4 - breathe, 10, 9);
    c.fillStyle = pal.skin;
    c.fillRect(x + 10, y + 5 - breathe, 8, 7);

    // Eyes (with natural blinking)
    if (blink) {
      c.fillStyle = "#1a0d07";
      c.fillRect(x + 13, y + 8 - breathe, 3, 1);
    } else {
      c.fillStyle = "#1a0d07";
      c.fillRect(x + 14, y + 7 - breathe, 2, 2);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 14, y + 7 - breathe, 1, 1);
    }

    // Role-specific Tool & Weapon
    drawTool(c, x, y, role, arm, u, time);

    // Role-specific Headgear / Hats / Helmets (follows breathing)
    drawHeadgear(c, x, y - breathe, role, work);
  };

  const drawHeadgear = (c: CanvasRenderingContext2D, x: number, y: number, role: string, active: boolean) => {
    if (role === "warrior") {
      // Steel Knight Sallet / Helmet with Golden Crest
      c.fillStyle = "#1c2229";
      c.fillRect(x + 9, y + 2, 10, 6);
      c.fillStyle = "#8a96a3";
      c.fillRect(x + 10, y + 3, 8, 4);
      c.fillStyle = "#f5c542";
      c.fillRect(x + 12, y + 1, 4, 2);
      c.fillStyle = "#0a0d12";
      c.fillRect(x + 13, y + 6, 5, 1); // Visor slit
      return;
    }

    if (role === "javelin") {
      // Skirmisher Warrior Bronze Helmet with crest (similar to Warrior, but agile)
      c.fillStyle = "#1e2824";
      c.fillRect(x + 9, y + 2, 10, 6);
      c.fillStyle = "#4a6b5d";
      c.fillRect(x + 10, y + 3, 8, 4);
      c.fillStyle = "#d97706"; // Bronze brow rim
      c.fillRect(x + 10, y + 5, 8, 1.5);
      // Warrior Red/Gold Crest Plume
      c.fillStyle = "#dc2626";
      c.fillRect(x + 11, y, 6, 2);
      c.fillStyle = "#f59e0b";
      c.fillRect(x + 12, y - 1, 4, 1);
      return;
    }

    if (role === "scout") {
      // Scout Agile Leather Cowl / Hood
      c.fillStyle = "#0f172a";
      c.fillRect(x + 8, y + 2, 12, 6);
      c.fillStyle = "#1e293b";
      c.fillRect(x + 9, y + 3, 10, 4);
      c.fillStyle = "#38bdf8"; // Cyan forehead headband
      c.fillRect(x + 9, y + 5, 10, 1.5);
      return;
    }

    if (role === "farmer") {
      // Wide Brim Straw Sunhat
      c.fillStyle = "#665022";
      c.fillRect(x + 6, y + 4, 16, 3);
      c.fillStyle = "#d4ab48";
      c.fillRect(x + 7, y + 4, 14, 2);
      c.fillStyle = "#e0c169";
      c.fillRect(x + 10, y + 1, 8, 3);
      c.fillStyle = "#942525";
      c.fillRect(x + 10, y + 3, 8, 1); // Red ribbon
      return;
    }

    if (role === "woodcutter") {
      // Lumberjack Beanie & Bushy Beard
      c.fillStyle = "#1e2e1e";
      c.fillRect(x + 9, y + 2, 10, 4);
      c.fillStyle = "#3d5c3d";
      c.fillRect(x + 10, y + 3, 8, 2);
      // Bushy brown beard
      c.fillStyle = "#4a2d18";
      c.fillRect(x + 12, y + 9, 6, 4);
      c.fillRect(x + 13, y + 12, 4, 2);
      return;
    }

    if (role === "stoneMiner" || role === "goldMiner") {
      // Mining Hardhat with Lantern
      const hatCol = role === "goldMiner" ? "#c9952a" : "#4a5359";
      c.fillStyle = "#1a1a1a";
      c.fillRect(x + 8, y + 2, 12, 4);
      c.fillStyle = hatCol;
      c.fillRect(x + 9, y + 3, 10, 3);
      // Front Lantern
      c.fillStyle = "#fff394";
      c.fillRect(x + 16, y + 3, 2, 2);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 17, y + 3, 1, 1);
      return;
    }

    if (role === "builder") {
      // Builder Leather Cap
      c.fillStyle = "#472811";
      c.fillRect(x + 9, y + 2, 10, 4);
      c.fillStyle = "#784b29";
      c.fillRect(x + 10, y + 3, 8, 2);
      return;
    }

    // Default Hair
    c.fillStyle = "#382315";
    c.fillRect(x + 9, y + 2, 10, 4);
  };

  const drawTool = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    role: string,
    a: number,
    u: Unit,
    time: number
  ) => {
    if (role === "builder") {
      // Sturdy Builder Hammer
      c.fillStyle = "#4a2b13";
      c.fillRect(x + 20, y + 10 + a, 2, 11);
      c.fillStyle = "#1f2224";
      c.fillRect(x + 17, y + 8 + a, 8, 4);
      c.fillStyle = "#788187";
      c.fillRect(x + 18, y + 9 + a, 6, 2);
    } else if (role === "woodcutter") {
      // Heavy Felling Axe
      c.fillStyle = "#4a2b13";
      c.fillRect(x + 20, y + 8 + a, 2, 14);
      c.fillStyle = "#1f2224";
      c.fillRect(x + 17, y + 7 + a, 8, 6);
      c.fillStyle = "#a1abb3";
      c.fillRect(x + 18, y + 8 + a, 6, 4);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 23, y + 8 + a, 1, 4); // Sharp edge

      if (u.state === "chop") {
        // Flying wood chips
        const chip = (time * 8 + u.id) % 3;
        c.fillStyle = "#d97706";
        c.fillRect(x + 24 + chip * 2, y + 12 - chip * 2.5, 2, 2);
      }
    } else if (role === "stoneMiner" || role === "goldMiner") {
      // Heavy Pickaxe
      const isGold = role === "goldMiner";
      c.fillStyle = "#4a2b13";
      c.fillRect(x + 20, y + 8 + a, 2, 14);
      c.fillStyle = isGold ? "#f5c542" : "#9ca5ad";
      c.fillRect(x + 15, y + 7 + a, 12, 3);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 25, y + 7 + a, 2, 2);

      if (u.state === "mine") {
        // Flying stone/gold chisel sparks
        const spark = (time * 8 + u.id) % 3;
        c.fillStyle = isGold ? "#fde047" : "#cbd5e1";
        c.fillRect(x + 25 + spark * 2, y + 11 - spark * 2.5, 2, 2);
      }
    } else if (role === "farmer") {
      // Curved Steel Scythe
      c.fillStyle = "#4a2b13";
      c.fillRect(x + 20, y + 7 + a, 2, 15);
      c.fillStyle = "#8a96a3";
      c.fillRect(x + 18, y + 5 + a, 7, 2);
      c.fillRect(x + 23, y + 7 + a, 2, 4);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 19, y + 5 + a, 5, 1);
    } else if (role === "warrior") {
      // Knight Shield & Shining Broadsword
      // Shield (Left hand)
      c.fillStyle = "#1a222c";
      c.fillRect(x + 3, y + 12 - a / 2, 5, 8);
      c.fillStyle = "#3e5269";
      c.fillRect(x + 4, y + 13 - a / 2, 3, 6);
      c.fillStyle = "#f5c542";
      c.fillRect(x + 5, y + 14 - a / 2, 1, 4); // Gold heraldry

      // Sword (Right hand)
      c.fillStyle = "#291d12";
      c.fillRect(x + 21, y + 13 + a, 2, 5); // Hilt
      c.fillStyle = "#f5c542";
      c.fillRect(x + 19, y + 12 + a, 6, 2); // Guard
      c.fillStyle = "#d4dde6";
      c.fillRect(x + 21, y + 2 + a, 2, 10); // Blade
      c.fillStyle = "#ffffff";
      c.fillRect(x + 21, y + 2 + a, 1, 10); // Edge gleam

      if (u.state === "attack") {
        // Dynamic Steel Blade Slash Arc
        c.save();
        c.strokeStyle = "rgba(224, 242, 254, 0.85)";
        c.lineWidth = 1.8;
        c.beginPath();
        c.arc(x + 23, y + 10, 11, -0.7, 1.1);
        c.stroke();
        c.restore();
      }
    } else if (role === "javelin") {
      // Skirmisher Warrior: Small Round Shield in left hand + Throwing Spear in right hand
      // 1. Bronze & Wood Round Shield (Left Hand)
      c.fillStyle = "#3f2314";
      c.beginPath();
      c.ellipse(x + 5, y + 15 - a / 2, 4.5, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#d97706"; // Bronze rim
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = "#f59e0b"; // Center bronze boss
      c.fillRect(x + 4, y + 14 - a / 2, 2, 2);

      // 2. Spare Javelins Quiver across back
      c.fillStyle = "#78350f";
      c.fillRect(x + 7, y + 7, 2.5, 8);
      c.fillStyle = "#cbd5e1"; // Spare spear heads
      c.fillRect(x + 6, y + 4, 1.5, 3);
      c.fillRect(x + 8.5, y + 3, 1.5, 4);

      // 3. Main Throwing Javelin held ready in Right Hand
      // Wooden shaft
      c.fillStyle = "#8a5229";
      c.fillRect(x + 20, y + 4 + a, 2, 16);
      // Bronze grip
      c.fillStyle = "#d97706";
      c.fillRect(x + 19.5, y + 11 + a, 3, 3);
      // Steel spear tip
      c.fillStyle = "#cbd5e1";
      c.beginPath();
      c.moveTo(x + 21, y + 0 + a);
      c.lineTo(x + 19, y + 4 + a);
      c.lineTo(x + 23, y + 4 + a);
      c.closePath();
      c.fill();
      // Gleaming edge
      c.fillStyle = "#ffffff";
      c.fillRect(x + 20.5, y + 1 + a, 1, 2);

      if (u.state === "attack") {
        // Dynamic thrust trail
        c.fillStyle = "rgba(253, 224, 71, 0.6)";
        c.fillRect(x + 19, y - 3 + a, 4, 3);
      }
    } else if (role === "scout") {
      // Scout: Dual Fast Daggers with Cyan/Steel Blades
      // Left Dagger
      c.fillStyle = "#0f172a";
      c.fillRect(x + 5, y + 15 - a, 2, 4);
      c.fillStyle = "#38bdf8";
      c.fillRect(x + 4, y + 14 - a, 4, 1.5);
      c.fillStyle = "#e2e8f0";
      c.fillRect(x + 5, y + 9 - a, 2, 5);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 5.5, y + 9 - a, 1, 4);

      // Right Dagger
      c.fillStyle = "#0f172a";
      c.fillRect(x + 21, y + 15 + a, 2, 4);
      c.fillStyle = "#38bdf8";
      c.fillRect(x + 20, y + 14 + a, 4, 1.5);
      c.fillStyle = "#e2e8f0";
      c.fillRect(x + 21, y + 8 + a, 2, 6);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 21.5, y + 8 + a, 1, 5);

      if (u.state === "attack") {
        // Rapid Dagger Cross-Slash
        c.save();
        c.strokeStyle = "rgba(56, 189, 248, 0.85)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x + 18, y + 5);
        c.lineTo(x + 27, y + 15);
        c.moveTo(x + 27, y + 5);
        c.lineTo(x + 18, y + 15);
        c.stroke();
        c.restore();
      }
    }
  };

  // ==========================================
  // ENEMIES AND BOSSES
  // ==========================================

  const drawDecomposingCorpse = (c: CanvasRenderingContext2D, e: Enemy, g: GameEngine) => {
    const x = Math.round(e.x * TS);
    const y = Math.round(e.y * TS);
    const totalDeath = e.maxDeath || 120;
    const progress = Math.max(0, Math.min(1, e.death / totalDeath)); // 1.0 (fresh) down to 0.0 (gone)

    // Fade out smoothly in the last 15 seconds
    const fade = progress < 0.12 ? progress / 0.12 : 1.0;

    c.save();
    c.globalAlpha = fade * 0.85;

    // Ground stain / bug ichor pooling into soil
    const stainAlpha = 0.45 * progress;
    c.fillStyle = e.kind === "elite" ? `rgba(90, 20, 35, ${stainAlpha})` : `rgba(40, 58, 25, ${stainAlpha})`;
    c.beginPath();
    c.ellipse(x + 15, y + 24, 14 * (1.1 - progress * 0.2), 6 * (1.1 - progress * 0.2), 0, 0, Math.PI * 2);
    c.fill();

    // Flattened & curled bug corpse
    c.translate(x + 15, y + 22);
    c.scale(1.0, 0.42); // squashed onto terrain

    // Weathered chitin colors (turns to grayish ash/soil husk as time passes)
    const grayOut = 1 - progress;
    if (e.kind === "boss") {
      c.fillStyle = `rgba(${Math.round(140 * progress + 80 * grayOut)}, ${Math.round(40 * progress + 70 * grayOut)}, ${Math.round(180 * progress + 70 * grayOut)}, 0.9)`;
    } else if (e.kind === "elite") {
      c.fillStyle = `rgba(${Math.round(180 * progress + 90 * grayOut)}, ${Math.round(50 * progress + 80 * grayOut)}, ${Math.round(60 * progress + 75 * grayOut)}, 0.9)`;
    } else {
      c.fillStyle = `rgba(${Math.round(65 * progress + 75 * grayOut)}, ${Math.round(75 * progress + 70 * grayOut)}, ${Math.round(50 * progress + 65 * grayOut)}, 0.9)`;
    }

    // Curled body ellipse
    c.beginPath();
    c.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
    c.fill();

    // Curled limp legs on the side
    c.strokeStyle = "rgba(40,35,30,0.7)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(-9, -2); c.lineTo(-14, -6); c.lineTo(-11, -9);
    c.moveTo(9, -2); c.lineTo(14, -6); c.lineTo(11, -9);
    c.moveTo(-8, 3); c.lineTo(-13, 7); c.lineTo(-10, 10);
    c.moveTo(8, 3); c.lineTo(13, 7); c.lineTo(10, 10);
    c.stroke();

    // Decomposing spore particles rising gently
    if (progress > 0.05 && progress < 0.85) {
      const sporeTime = g.time * 2 + e.id;
      const sx = Math.sin(sporeTime) * 8;
      const sy = -Math.abs(Math.cos(sporeTime)) * 12 * (1 - progress);
      c.fillStyle = "rgba(163, 230, 53, 0.4)";
      c.fillRect(sx, sy, 2, 2);
    }

    c.restore();
  };

  const drawEnemy = (c: CanvasRenderingContext2D, e: Enemy) => {
    const x = Math.round(e.x * TS);
    const y = Math.round(e.y * TS);
    const phase = e.anim * 2.5;
    const bob = e.state === "walk" ? Math.abs(Math.sin(phase)) * 1.4 : 0;
    const walkVel = e.state === "walk" ? Math.cos(phase) : 0;
    const sy = 1 + walkVel * 0.08;
    const sx = 1 - walkVel * 0.06;
    const dir = e._facing || "left";

    c.fillStyle = "rgba(0,0,0,.42)";
    c.beginPath();
    c.ellipse(x + 15, y + 25, 10, 3, 0, 0, Math.PI * 2);
    c.fill();

    art(c, x, y - bob, () => {
      c.save();
      c.translate(15, 15);
      if (dir === "right") c.scale(-1, 1);
      c.scale(sx, sy);
      c.translate(-15, -15);
      drawRaiderSprite(c, 0, 0, e, phase);
      c.restore();
    });

    bevel(c, x + 4 * ART_R, y - bob + 2 * ART_R, 19 * ART_R, 25 * ART_R);
    bar(c, x + 4, y - 5 - bob, 21, 4, e.hp / e.maxHp, e.kind === "elite" ? "#a83244" : "#802222");
  };

  const drawRaiderSprite = (c: CanvasRenderingContext2D, x: number, y: number, e: Enemy, phase: number) => {
    if (e.flash && e.flash > 0) {
      c.fillStyle = "#fff";
      c.fillRect(x + 2, y + 4, 24, 20);
      return;
    }
    const species = e.kind === "elite" ? "scarab" : e.species || "ant";
    const walking = e.state === "walk";
    const attacking = e.state === "attack";
    const atk = attacking ? Math.max(0, 1 - e.attackCd / e.attackRate) : 0;
    const bite = attacking ? Math.max(0, Math.sin(atk * Math.PI)) : 0;
    const lunge = Math.round(bite * 4);

    const s = walking ? Math.sin(phase) : 0;
    const s2 = walking ? Math.sin(phase + Math.PI) : 0;
    const legA = Math.round(s * 3);
    const legB = Math.round(s2 * 3);

    if (species === "ladybug") {
      // Heavy Armored Ladybug Beetle
      // 6 Legs
      c.fillStyle = "#120808";
      c.fillRect(x + 4 + legA, y + 20, 2, 4);
      c.fillRect(x + 12 + legB, y + 21, 2, 4);
      c.fillRect(x + 20 + legA, y + 20, 2, 4);

      // Body (Red with Black Dots)
      c.fillStyle = "#0a0404";
      c.beginPath();
      c.ellipse(x + 15, y + 14, 10, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#c72626";
      c.beginPath();
      c.ellipse(x + 15, y + 14, 9, 7, 0, 0, Math.PI * 2);
      c.fill();

      // Black Dots
      c.fillStyle = "#120404";
      c.fillRect(x + 11, y + 11, 2, 2);
      c.fillRect(x + 17, y + 10, 2, 2);
      c.fillRect(x + 14, y + 16, 2, 2);
      c.fillRect(x + 20, y + 15, 2, 2);

      // Head & Eyes
      c.fillStyle = "#120808";
      c.fillRect(x + 4 - lunge, y + 11, 6, 6);
      c.fillStyle = "#ffd24d";
      c.fillRect(x + 5 - lunge, y + 12, 2, 2);
      return;
    }

    if (species === "mantis") {
      // Praying Mantis with Scythe Forearms
      // Back Legs
      c.strokeStyle = "#1b3318";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x + 16, y + 16);
      c.lineTo(x + 20 + legA, y + 23);
      c.moveTo(x + 22, y + 16);
      c.lineTo(x + 26 + legB, y + 24);
      c.stroke();

      // Thorax / Abdomen
      c.fillStyle = "#2d5427";
      c.fillRect(x + 14, y + 13, 10, 5);
      c.fillStyle = "#44783b";
      c.fillRect(x + 16, y + 14, 8, 3);

      // Head
      c.fillStyle = "#22421d";
      c.fillRect(x + 8 - lunge, y + 8, 6, 6);
      c.fillStyle = "#c2ff85";
      c.fillRect(x + 8 - lunge, y + 9, 2, 2);

      // Scythe Arms
      c.fillStyle = "#1b3318";
      c.fillRect(x + 4 - lunge, y + 6 - bite * 4, 3, 8);
      c.fillStyle = "#8ae06c";
      c.fillRect(x + 4 - lunge, y + 6 - bite * 4, 2, 6);
      return;
    }

    if (species === "centipede") {
      // Segmented Centipede
      for (let i = 0; i < 4; i++) {
        const segX = x + 6 + i * 5;
        const wave = Math.sin(phase + i * 0.8) * 2;
        c.fillStyle = "#4a1c12";
        c.fillRect(segX, y + 14 + wave, 5, 6);
        c.fillStyle = "#d46b3f";
        c.fillRect(segX + 1, y + 15 + wave, 3, 4);

        // Skittering legs
        c.fillStyle = "#170805";
        c.fillRect(segX + 1, y + 20 + wave, 2, 4);
      }
      // Head
      c.fillStyle = "#240a05";
      c.fillRect(x + 2 - lunge, y + 13, 6, 7);
      c.fillStyle = "#ffd043";
      c.fillRect(x + 3 - lunge, y + 14, 2, 2);
      return;
    }

    if (species === "stinkbug") {
      // Spiky Shield Bug
      c.fillStyle = "#1a1f0a";
      c.fillRect(x + 5 + legA, y + 20, 2, 4);
      c.fillRect(x + 18 + legB, y + 20, 2, 4);

      c.fillStyle = "#0f1406";
      c.beginPath();
      c.moveTo(x + 14, y + 7);
      c.lineTo(x + 24, y + 13);
      c.lineTo(x + 20, y + 21);
      c.lineTo(x + 8, y + 21);
      c.lineTo(x + 4, y + 13);
      c.closePath();
      c.fill();

      c.fillStyle = "#5c6e26";
      c.beginPath();
      c.moveTo(x + 14, y + 9);
      c.lineTo(x + 22, y + 13);
      c.lineTo(x + 18, y + 19);
      c.lineTo(x + 10, y + 19);
      c.lineTo(x + 6, y + 13);
      c.closePath();
      c.fill();

      c.fillStyle = "#b5cf44";
      c.fillRect(x + 12, y + 12, 4, 4);

      c.fillStyle = "#1a1f0a";
      c.fillRect(x + 4 - lunge, y + 11, 5, 5);
      c.fillStyle = "#ff5533";
      c.fillRect(x + 5 - lunge, y + 12, 2, 2);
      return;
    }

    // Default: Scavenger Ant / Scarab (Classic Ant Raider)
    // 6 Legs
    c.strokeStyle = "#12080a";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x + 8, y + 14);
    c.lineTo(x + 4 + legA, y + 21);
    c.moveTo(x + 14, y + 15);
    c.lineTo(x + 14 + legB, y + 22);
    c.moveTo(x + 20, y + 14);
    c.lineTo(x + 24 + legA, y + 21);
    c.stroke();

    // Abdomen
    c.fillStyle = "#120608";
    c.beginPath();
    c.ellipse(x + 21, y + 15, 6, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = e.kind === "elite" ? "#611c27" : "#3d141b";
    c.beginPath();
    c.ellipse(x + 21, y + 15, 5, 4, 0, 0, Math.PI * 2);
    c.fill();
    // Chitin specular highlight
    c.fillStyle = e.kind === "elite" ? "#f43f5e" : "#9f1239";
    c.fillRect(x + 20, y + 13, 2, 2);

    // Thorax
    c.fillStyle = "#120608";
    c.fillRect(x + 12, y + 12, 6, 6);
    c.fillStyle = e.kind === "elite" ? "#8c2e3d" : "#541e26";
    c.fillRect(x + 13, y + 13, 4, 4);

    // Head & Mandibles
    c.fillStyle = "#120608";
    c.fillRect(x + 4 - lunge, y + 10, 8, 8);
    c.fillStyle = e.kind === "elite" ? "#b03c4f" : "#6e242f";
    c.fillRect(x + 5 - lunge, y + 11, 6, 6);

    // Twitching Antennae
    const antWiggle = Math.sin(phase * 3.5) * 2;
    c.strokeStyle = "#120608";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + 5 - lunge, y + 10);
    c.lineTo(x + 1 - lunge, y + 5 + antWiggle);
    c.moveTo(x + 8 - lunge, y + 10);
    c.lineTo(x + 5 - lunge, y + 4 - antWiggle);
    c.stroke();

    // Glowing Eyes
    c.fillStyle = e.kind === "elite" ? "#ff2a55" : "#ffc83b";
    c.fillRect(x + 6 - lunge, y + 12, 2, 2);
    c.fillRect(x + 10 - lunge, y + 12, 2, 2);
    c.fillStyle = "#ffffff";
    c.fillRect(x + 6 - lunge, y + 12, 1, 1);

    // Dynamic Snapping Pincers / Horn
    const pincerSnap = attacking ? Math.sin(atk * Math.PI) * 2 : 0;
    c.fillStyle = "#120608";
    c.fillRect(x + 2 - lunge, y + 9 + pincerSnap, 3, 2);
    c.fillRect(x + 2 - lunge, y + 15 - pincerSnap, 3, 2);
    c.fillStyle = "#f43f5e";
    c.fillRect(x + 1 - lunge, y + 10 + pincerSnap, 1, 1);
    c.fillRect(x + 1 - lunge, y + 14 - pincerSnap, 1, 1);
  };

  const drawBoss = (c: CanvasRenderingContext2D, b: Enemy, g: GameEngine) => {
    const sw = TS * 2.2;
    const sh = TS * 2.2;
    const sx = Math.round(b.x * TS) - sw / 2 + TS / 2;
    const sy = Math.round(b.y * TS) - sh / 2 + TS / 2;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const f = Math.floor(b.anim * 4) % 4;
    const leg = b.state === "walk" ? [0, 3, 0, -3][f] : 0;

    c.fillStyle = "rgba(0,0,0,.6)";
    c.beginPath();
    c.ellipse(cx, cy + 22, 24, 8, 0, 0, Math.PI * 2);
    c.fill();

    const variant = b.variant || "spider";
    if (variant === "cicada") drawCicadaBossSprite(c, cx, cy, leg, g.time);
    else if (variant === "moth") drawMothBossSprite(c, cx, cy, leg, g.time);
    else drawSpiderBossSprite(c, cx, cy, leg, g.time);

    // Boss Name & Health Bar
    c.font = "bold 11px Cinzel, serif";
    c.textAlign = "center";
    c.fillStyle = "#000";
    c.fillText(b.name || "NIGHTMARE TITAN", cx + 1, sy - 17);
    c.fillStyle = variant === "cicada" ? "#8aff8a" : variant === "moth" ? "#ffd773" : "#ff8080";
    c.fillText(b.name || "NIGHTMARE TITAN", cx, sy - 18);
    c.textAlign = "left";

    bar(c, sx - 8, sy - 14, sw + 16, 6, b.hp / b.maxHp, "#a82035");
  };

  const drawSpiderBossSprite = (c: CanvasRenderingContext2D, cx: number, cy: number, leg: number, time: number) => {
    // Dread Broodmother Spider
    c.strokeStyle = "#0d0407";
    c.lineWidth = 3;

    // 8 Articulated Spider Legs
    const legs = [
      { x1: -8, y1: -6, x2: -24, y2: -16, x3: -32, y3: -4 },
      { x1: -10, y1: -1, x2: -28, y2: -4, x3: -36, y3: 10 },
      { x1: -10, y1: 5, x2: -26, y2: 12, x3: -34, y3: 24 },
      { x1: -8, y1: 10, x2: -20, y2: 20, x3: -26, y3: 30 },
      { x1: 8, y1: -6, x2: 24, y2: -16, x3: 32, y3: -4 },
      { x1: 10, y1: -1, x2: 28, y2: -4, x3: 36, y3: 10 },
      { x1: 10, y1: 5, x2: 26, y2: 12, x3: 34, y3: 24 },
      { x1: 8, y1: 10, x2: 20, y2: 20, x3: 26, y3: 30 },
    ];

    legs.forEach((L, idx) => {
      const step = idx % 2 === 0 ? leg : -leg;
      c.beginPath();
      c.moveTo(cx + L.x1, cy + L.y1);
      c.lineTo(cx + L.x2, cy + L.y2 + step);
      c.lineTo(cx + L.x3, cy + L.y3 + step * 1.5);
      c.stroke();
    });

    // Swollen Abdomen with Skull Pattern
    c.fillStyle = "#120508";
    c.beginPath();
    c.ellipse(cx, cy + 12, 16, 18, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#3d0e19";
    c.beginPath();
    c.ellipse(cx, cy + 12, 14, 16, 0, 0, Math.PI * 2);
    c.fill();

    // Red Skull / Rune on Abdomen
    c.fillStyle = "#a81930";
    c.fillRect(cx - 5, cy + 6, 10, 6);
    c.fillRect(cx - 3, cy + 13, 6, 5);
    c.fillStyle = "#ff4d66";
    c.fillRect(cx - 3, cy + 8, 2, 2);
    c.fillRect(cx + 1, cy + 8, 2, 2);

    // Cephalothorax (Head/Chest)
    c.fillStyle = "#120508";
    c.fillRect(cx - 10, cy - 14, 20, 16);
    c.fillStyle = "#290c13";
    c.fillRect(cx - 8, cy - 12, 16, 12);

    // 8 Glowing Crimson Eyes
    c.fillStyle = "#ff2640";
    const eyes = [
      [-5, -10], [-2, -11], [2, -11], [5, -10],
      [-4, -7], [-1, -8], [1, -8], [4, -7],
    ];
    eyes.forEach(([ex, ey]) => {
      c.fillRect(cx + ex, cy + ey, 2, 2);
    });

    // Dripping Venom Fangs
    c.fillStyle = "#0a0204";
    c.fillRect(cx - 7, cy + 1, 4, 7);
    c.fillRect(cx + 3, cy + 1, 4, 7);
    c.fillStyle = "#6be342"; // Acid venom drip
    c.fillRect(cx - 6, cy + 6, 2, 3);
    c.fillRect(cx + 4, cy + 6, 2, 3);
  };

  const drawCicadaBossSprite = (c: CanvasRenderingContext2D, cx: number, cy: number, leg: number, time: number) => {
    // Hive Titan / Armored Cicada
    // Giant Translucent Wings (Flapping rapidly)
    const flap = Math.sin(time * 35) * 12;

    c.save();
    c.fillStyle = "rgba(160, 240, 210, 0.4)";
    c.strokeStyle = "rgba(100, 200, 170, 0.8)";
    c.lineWidth = 1.5;

    // Left Wing
    c.beginPath();
    c.moveTo(cx - 6, cy - 10);
    c.lineTo(cx - 38, cy - 26 + flap);
    c.lineTo(cx - 32, cy + 18 + flap / 2);
    c.closePath();
    c.fill();
    c.stroke();

    // Right Wing
    c.beginPath();
    c.moveTo(cx + 6, cy - 10);
    c.lineTo(cx + 38, cy - 26 - flap);
    c.lineTo(cx + 32, cy + 18 - flap / 2);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();

    // Spiked Legs
    c.strokeStyle = "#101f14";
    c.lineWidth = 2.5;
    [-1, 1].forEach((dir) => {
      c.beginPath();
      c.moveTo(cx + dir * 8, cy - 4);
      c.lineTo(cx + dir * 22, cy - 12 + leg);
      c.lineTo(cx + dir * 28, cy + 10 + leg);
      c.stroke();

      c.beginPath();
      c.moveTo(cx + dir * 8, cy + 6);
      c.lineTo(cx + dir * 24, cy + 16 - leg);
      c.lineTo(cx + dir * 26, cy + 28 - leg);
      c.stroke();
    });

    // Abdomen (Segmented Bronze/Emerald)
    c.fillStyle = "#0c1a10";
    c.fillRect(cx - 10, cy - 2, 20, 24);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i % 2 === 0 ? "#25472e" : "#57431e";
      c.fillRect(cx - 9, cy + i * 6, 18, 5);
    }

    // Heavy Plated Thorax
    c.fillStyle = "#0c1a10";
    c.fillRect(cx - 13, cy - 18, 26, 18);
    c.fillStyle = "#36633f";
    c.fillRect(cx - 11, cy - 16, 22, 14);

    // Glowing Compound Amber Eyes
    c.fillStyle = "#ff9d26";
    c.fillRect(cx - 14, cy - 16, 5, 8);
    c.fillRect(cx + 9, cy - 16, 5, 8);
    c.fillStyle = "#ffffff";
    c.fillRect(cx - 13, cy - 14, 2, 3);
    c.fillRect(cx + 10, cy - 14, 2, 3);
  };

  const drawMothBossSprite = (c: CanvasRenderingContext2D, cx: number, cy: number, leg: number, time: number) => {
    // Lunar Archon / Eclipse Moth
    const wave = Math.sin(time * 6) * 6;

    // Colossal Velvet Wings with Eye Patterns
    c.fillStyle = "#1e102e";
    c.strokeStyle = "#9c60d4";
    c.lineWidth = 2;

    // Upper Wings
    c.beginPath();
    c.ellipse(cx - 24, cy - 12 + wave, 22, 16, -0.3, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.beginPath();
    c.ellipse(cx + 24, cy - 12 + wave, 22, 16, 0.3, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Lower Wings
    c.beginPath();
    c.ellipse(cx - 18, cy + 14 - wave / 2, 16, 12, 0.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.beginPath();
    c.ellipse(cx + 18, cy + 14 - wave / 2, 16, 12, -0.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Glowing Lunar Eye-Spots
    c.fillStyle = "#ffd55e";
    c.beginPath();
    c.arc(cx - 24, cy - 12 + wave, 6, 0, Math.PI * 2);
    c.arc(cx + 24, cy - 12 + wave, 6, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#5c2a8c";
    c.beginPath();
    c.arc(cx - 24, cy - 12 + wave, 3, 0, Math.PI * 2);
    c.arc(cx + 24, cy - 12 + wave, 3, 0, Math.PI * 2);
    c.fill();

    // Fluffy Body
    c.fillStyle = "#dcd6eb";
    c.fillRect(cx - 6, cy - 14, 12, 28);
    c.fillStyle = "#ffffff";
    c.fillRect(cx - 4, cy - 12, 8, 24);

    // Feathery Plumose Antennae
    c.strokeStyle = "#ffd55e";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 3, cy - 14);
    c.lineTo(cx - 14, cy - 26);
    c.moveTo(cx + 3, cy - 14);
    c.lineTo(cx + 14, cy - 26);
    c.stroke();
  };

  // ==========================================
  // GOLEM, ALTAR HEROES & REWARD CHEST
  // ==========================================

  const drawGolem = (c: CanvasRenderingContext2D, g: GolemUnit, engine: GameEngine) => {
    const wx = Math.round(g.x * TS);
    const wy = Math.round(g.y * TS);
    const attack = g.state === "attack";
    const walk = g.state === "walk";
    const bob = Math.sin(g.anim * 1.6) * (walk ? 2 : 0);
    const slam = attack ? Math.max(0, 1 - g.attackCd / g.attackRate) * 6 : 0;
    const wy2 = wy + bob;

    art(c, wx - 12, wy2 - 20, () => {
      drawGolemSprite(c, 0, 0, g, walk, slam, engine.time);
    });

    bevel(c, wx - 10, wy2 - 18, 46 * ART_R, 50 * ART_R);
    bar(c, wx - 8, wy2 - 26, 46, 4, g.hp / g.maxHp, "#5ab255");
    bar(c, wx - 8, wy2 - 21, 46, 3, g.timer / g.duration, "#47c8e1");
  };

  const drawGolemSprite = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    g: GolemUnit,
    walk: boolean,
    slam: number,
    time: number
  ) => {
    // Monumental Stone Titan
    c.fillStyle = "rgba(0,0,0,.5)";
    c.beginPath();
    c.ellipse(x + 24, y + 50, 20, 6, 0, 0, Math.PI * 2);
    c.fill();

    // Stone Pillar Legs
    c.fillStyle = "#1e2226";
    c.fillRect(x + 10, y + 36, 10, 14);
    c.fillRect(x + 28, y + 36, 10, 14);
    c.fillStyle = "#474e54";
    c.fillRect(x + 11, y + 37, 8, 12);
    c.fillRect(x + 29, y + 37, 8, 12);

    // Boulder Torso with Runic Inscriptions
    c.fillStyle = "#1e2226";
    c.fillRect(x + 8, y + 16, 32, 22);
    c.fillStyle = "#555d63";
    c.fillRect(x + 10, y + 18, 28, 18);
    // Moss on shoulders
    c.fillStyle = "#365314";
    c.fillRect(x + 7, y + 15, 6, 4);
    c.fillRect(x + 35, y + 15, 6, 4);
    c.fillStyle = "#4d7c0f";
    c.fillRect(x + 8, y + 16, 4, 2);
    c.fillRect(x + 36, y + 16, 4, 2);

    // Glowing Runic Core in Chest
    const corePulse = 0.6 + 0.4 * Math.sin(time * 5);
    c.fillStyle = "#123b47";
    c.fillRect(x + 20, y + 23, 8, 8);
    c.fillStyle = `rgba(102, 237, 255, ${corePulse})`;
    c.fillRect(x + 22, y + 25, 4, 4);
    // Cyan Runic Fissures branching across torso
    c.fillStyle = `rgba(56, 189, 248, ${0.5 + 0.3 * Math.sin(time * 4)})`;
    c.fillRect(x + 16, y + 26, 4, 1.5);
    c.fillRect(x + 14, y + 27, 2, 3);
    c.fillRect(x + 28, y + 26, 4, 1.5);
    c.fillRect(x + 32, y + 27, 2, 3);

    // Stone Fists (Massive Boulders that Slam Down)
    c.fillStyle = "#1e2226";
    c.fillRect(x + 2, y + 20 + slam, 10, 16);
    c.fillRect(x + 36, y + 20 + slam, 10, 16);
    c.fillStyle = "#474e54";
    c.fillRect(x + 3, y + 21 + slam, 8, 14);
    c.fillRect(x + 37, y + 21 + slam, 8, 14);
    // Runic energy along fists
    c.fillStyle = "#38bdf8";
    c.fillRect(x + 5, y + 24 + slam, 4, 2);
    c.fillRect(x + 39, y + 24 + slam, 4, 2);

    // Impact Ground Shockwave Cracks when slamming
    if (slam > 2) {
      c.strokeStyle = "rgba(103, 232, 249, 0.75)";
      c.lineWidth = 1.5;
      c.beginPath();
      // Left fist ground crack
      c.moveTo(x + 7, y + 40 + slam);
      c.lineTo(x + 2, y + 45 + slam);
      c.lineTo(x - 4, y + 44 + slam);
      // Right fist ground crack
      c.moveTo(x + 41, y + 40 + slam);
      c.lineTo(x + 46, y + 45 + slam);
      c.lineTo(x + 52, y + 44 + slam);
      c.stroke();
    }

    // Head & Glowing Eyes with Specular Sparkle
    c.fillStyle = "#1e2226";
    c.fillRect(x + 16, y + 6, 16, 12);
    c.fillStyle = "#555d63";
    c.fillRect(x + 18, y + 8, 12, 9);
    // Glowing cyan optic slits
    c.fillStyle = "#67e8f9";
    c.fillRect(x + 19, y + 11, 3, 2);
    c.fillRect(x + 26, y + 11, 3, 2);
    c.fillStyle = "#ffffff";
    c.fillRect(x + 20, y + 11, 1, 1);
    c.fillRect(x + 27, y + 11, 1, 1);
  };

  const drawGolemMoundSprite = (c: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    c.fillStyle = "rgba(0,0,0,.45)";
    c.beginPath();
    c.ellipse(x + 24, y + 48, 20, 6, 0, 0, Math.PI * 2);
    c.fill();

    // Ancient Mossy Boulder Mound (Submerged Titan Visage)
    c.fillStyle = "#202428";
    c.fillRect(x + 8, y + 24, 32, 24);
    c.fillStyle = "#4a5359";
    c.fillRect(x + 10, y + 26, 28, 20);

    // Titan Face Crags (Carved Brow, Nose Bridge & Resting Cheeks)
    c.fillStyle = "#333b42";
    c.fillRect(x + 14, y + 27, 20, 3); // Brow
    c.fillRect(x + 22, y + 30, 4, 8);  // Nose ridge
    c.fillRect(x + 16, y + 34, 5, 2);  // Closed left eye groove
    c.fillRect(x + 27, y + 34, 5, 2);  // Closed right eye groove

    // Ancient Forest Moss & Overgrowth
    c.fillStyle = "#1e3a17";
    c.fillRect(x + 10, y + 25, 8, 5);
    c.fillRect(x + 26, y + 37, 10, 5);
    c.fillStyle = "#4d7c0f";
    c.fillRect(x + 11, y + 26, 6, 2);
    c.fillRect(x + 28, y + 38, 7, 2);

    // Pulsing Ancient Runic Inscriptions
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    c.fillStyle = "#0e3a47";
    c.fillRect(x + 20, y + 39, 8, 6);
    c.fillStyle = `rgba(34, 211, 238, ${pulse})`;
    c.fillRect(x + 22, y + 40, 4, 3);
    c.fillRect(x + 13, y + 30, 2, 4);
    c.fillRect(x + 33, y + 30, 2, 4);

    // Ethereal Arcane Wisps floating gently around the mound
    for (let w = 0; w < 3; w++) {
      const wAngle = time * 1.6 + (w * Math.PI * 2) / 3;
      const wx = x + 24 + Math.cos(wAngle) * 18;
      const wy = y + 34 + Math.sin(wAngle) * 9;
      c.fillStyle = "rgba(103, 232, 249, 0.7)";
      c.beginPath();
      c.arc(wx, wy, 1.4, 0, Math.PI * 2);
      c.fill();
    }
  };

  const drawAltarHero = (c: CanvasRenderingContext2D, h: AltarHero, engine: GameEngine) => {
    const attack = h.state === "attack";
    const walk = h.state === "walk";
    const bob = walk ? Math.sin(h.anim * 1.8) * 2 : 0;
    const wx = Math.round(h.x * TS);
    const wy = Math.round(h.y * TS) + bob;

    // Celestial Summoning Ritual Animation Effect when newly spawned
    if (h.summonTimer && h.summonTimer > 0) {
      const sProgress = h.summonTimer / 2.5; // 1 down to 0
      const pulse = Math.sin(sProgress * Math.PI);
      const sealAngle = engine.time * 2.8;

      // 1. Rotating Sacred Gold Runic Summoning Circle on ground
      c.save();
      c.translate(wx + 14, wy + 26);
      c.scale(1, 0.45); // isometric oval
      c.rotate(sealAngle);
      c.strokeStyle = `rgba(253, 224, 71, ${0.9 * pulse})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 24, 0, Math.PI * 2);
      c.stroke();

      // Inner Runic Geometric Star
      c.strokeStyle = `rgba(245, 158, 11, ${0.8 * pulse})`;
      c.lineWidth = 1.5;
      c.beginPath();
      for (let pt = 0; pt < 6; pt++) {
        const rad = (pt * Math.PI) / 3;
        const rx = Math.cos(rad) * 19;
        const ry = Math.sin(rad) * 19;
        if (pt === 0) c.moveTo(rx, ry);
        else c.lineTo(rx, ry);
      }
      c.closePath();
      c.stroke();
      c.restore();

      // 2. Descending Pillar of Celestial Sunlight from Heavens
      c.save();
      c.globalCompositeOperation = "lighter";
      const beamGrad = c.createLinearGradient(0, wy - 90, 0, wy + 28);
      beamGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
      beamGrad.addColorStop(0.3, `rgba(254, 240, 138, ${0.45 * pulse})`);
      beamGrad.addColorStop(0.7, `rgba(245, 158, 11, ${0.65 * pulse})`);
      beamGrad.addColorStop(1, `rgba(253, 224, 71, ${0.9 * pulse})`);

      c.fillStyle = beamGrad;
      c.beginPath();
      c.moveTo(wx + 2, wy - 90);
      c.lineTo(wx + 26, wy - 90);
      c.lineTo(wx + 34, wy + 26);
      c.lineTo(wx - 6, wy + 26);
      c.closePath();
      c.fill();

      // Central core brilliant beam
      c.fillStyle = `rgba(255, 255, 255, ${0.55 * pulse})`;
      c.fillRect(wx + 10, wy - 90, 8, 116);

      // Expanding Shockwave Ring during initial arrival
      if (sProgress > 0.4) {
        const waveProgress = (1 - sProgress) * 1.66; // 0 to 1
        const waveRadius = 8 + waveProgress * 48;
        const waveAlpha = Math.max(0, (1 - waveProgress) * 0.85);
        c.save();
        c.translate(wx + 14, wy + 26);
        c.scale(1, 0.45);
        c.strokeStyle = `rgba(255, 250, 200, ${waveAlpha})`;
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(0, 0, waveRadius, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      c.restore();
    }

    // Render Hero with majestic presence (1.28x) to stand out prominently as the champion of the kingdom
    art(c, wx - 3, wy - 9, () => {
      c.save();
      c.translate(14, 27);
      if (h._facing === "left") c.scale(-1, 1);
      c.scale(1.28, 1.28);
      c.translate(-14, -27);
      drawAltarHeroSprite(c, 0, 0, h, walk, attack, engine.time);
      c.restore();
    });

    bevel(c, wx - 2, wy - 4, 30 * ART_R, 38 * ART_R);
    bar(c, wx - 2, wy - 10, 28, 3.5, h.hp / h.maxHp, "#5ab255");

    // Special attack cooldown indicator or Ready glow
    if (h.specialCd > 0) {
      bar(c, wx - 2, wy - 6, 28, 2, 1 - (h.specialCd / (h.maxSpecialCd || 7)), "#f59e0b");
    } else {
      c.save();
      c.fillStyle = "rgba(255, 215, 0, 0.85)";
      c.font = "bold 8px monospace";
      c.fillText("⚡READY", wx + 1, wy - 4);
      c.restore();
    }

    // Hero Crown & Level tag
    c.save();
    c.fillStyle = "#fde047";
    c.font = "bold 9px monospace";
    c.fillText(`👑Lv.${h.level}`, wx + 4, wy - 12);
    c.restore();
  };

  const drawRoyalHeroSprite = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    level: number,
    walk: boolean,
    attack: boolean,
    time: number,
    anim: number,
    attackCd: number,
    attackRate: number
  ) => {
    const atkProgress = attack ? Math.max(0, 1 - attackCd / (attackRate || 0.85)) : 0;
    const slashSwing = attack ? Math.sin(atkProgress * Math.PI) : 0;
    const walkCycle = walk ? Math.sin(anim * 4.2) : 0;
    const legL = walk ? Math.round(walkCycle * 4) : 0;
    const legR = walk ? Math.round(-walkCycle * 4) : 0;
    const breathe = walk ? 0 : Math.sin(time * 3) * 0.75;
    const capeFlap = Math.sin(time * 6 + (walk ? anim * 3 : 0)) * (walk ? 5 : 2.5);

    // 1. Dynamic Soft Ground Shadow
    c.fillStyle = "rgba(0,0,0,.45)";
    c.beginPath();
    c.ellipse(x + 14, y + 28, 12, 4.5, 0, 0, Math.PI * 2);
    c.fill();

    // 2. Royal Flowing Crimson Velvet Cape (flapping with wind and stride physics)
    c.save();
    c.fillStyle = "#630b17"; // Dark cape fold
    c.beginPath();
    c.moveTo(x + 5, y + 10 - breathe);
    c.lineTo(x + 1, y + 25 + capeFlap);
    c.lineTo(x + 7 + capeFlap * 0.5, y + 27);
    c.lineTo(x + 11, y + 26);
    c.lineTo(x + 10, y + 10 - breathe);
    c.closePath();
    c.fill();

    // Cape Main Body & Gold Trim
    c.fillStyle = "#991b2c";
    c.beginPath();
    c.moveTo(x + 6, y + 11 - breathe);
    c.lineTo(x + 2, y + 24 + capeFlap);
    c.lineTo(x + 8 + capeFlap * 0.5, y + 26);
    c.lineTo(x + 11, y + 25);
    c.lineTo(x + 9, y + 11 - breathe);
    c.closePath();
    c.fill();

    // Cape Embroidered Golden Fringe
    c.fillStyle = "#f5c542";
    c.fillRect(x + 2, y + 24 + capeFlap, 6, 2);
    c.fillRect(x + 7 + capeFlap * 0.5, y + 25, 4, 1.5);
    c.restore();

    // 3. Heavy Armored Legs with Greaves & Gilded Sabatons
    // Left Leg
    c.fillStyle = "#1e242b";
    c.fillRect(x + 8, y + 19 + legL, 4, 9);
    c.fillStyle = "#64748b";
    c.fillRect(x + 9, y + 20 + legL, 3, 6);
    c.fillStyle = "#f5c542";
    c.fillRect(x + 8, y + 22 + legL, 4, 2); // Golden Knee-Cop
    c.fillStyle = "#cbd5e1";
    c.fillRect(x + 8, y + 26 + legL, 5, 2); // Sabaton toe

    // Right Leg
    c.fillStyle = "#1e242b";
    c.fillRect(x + 15, y + 19 + legR, 4, 9);
    c.fillStyle = "#94a3b8";
    c.fillRect(x + 16, y + 20 + legR, 3, 6);
    c.fillStyle = "#f5c542";
    c.fillRect(x + 15, y + 22 + legR, 4, 2); // Golden Knee-Cop
    c.fillStyle = "#e2e8f0";
    c.fillRect(x + 15, y + 26 + legR, 5, 2); // Sabaton toe

    // 4. Sunforged Mithril Cuirass & Faulds (Torso with Golden Lion Crest)
    c.fillStyle = "#182026";
    c.fillRect(x + 7, y + 9 - breathe, 14, 12);
    c.fillStyle = "#94a3b8";
    c.fillRect(x + 8, y + 10 - breathe, 12, 10);
    c.fillStyle = "#cbd5e1";
    c.fillRect(x + 9, y + 10 - breathe, 10, 8);

    // Gilded Lionheart Emblem in High Relief
    c.fillStyle = "#f59e0b";
    c.fillRect(x + 11, y + 11 - breathe, 6, 6);
    c.fillStyle = "#fde047";
    c.fillRect(x + 12, y + 12 - breathe, 4, 4);
    c.fillStyle = "#b45309";
    c.fillRect(x + 13, y + 14 - breathe, 2, 2); // Lion muzzle

    // Armored Gilded Belt & Tassets
    c.fillStyle = "#78350f";
    c.fillRect(x + 7, y + 18 - breathe, 14, 2);
    c.fillStyle = "#f5c542";
    c.fillRect(x + 12, y + 17 - breathe, 4, 4); // Lion Buckle
    c.fillRect(x + 9, y + 20 - breathe, 3, 2);  // Left Tasset
    c.fillRect(x + 16, y + 20 - breathe, 3, 2); // Right Tasset

    // 5. Left Arm & Aegis Royal Heraldic Shield (Kite Shield with Royal Coat of Arms)
    const shieldGuard = attack ? 3 : 0;
    c.fillStyle = "#0f172a";
    c.fillRect(x + 1, y + 9 - breathe + shieldGuard, 7, 14);
    // Deep Cobalt Blue Field
    c.fillStyle = "#1e3a8a";
    c.fillRect(x + 2, y + 10 - breathe + shieldGuard, 5, 12);
    // Golden Heraldic Border
    c.fillStyle = "#f5c542";
    c.fillRect(x + 2, y + 10 - breathe + shieldGuard, 5, 2);
    c.fillRect(x + 2, y + 20 - breathe + shieldGuard, 5, 2);
    c.fillRect(x + 2, y + 10 - breathe + shieldGuard, 1, 12);
    c.fillRect(x + 6, y + 10 - breathe + shieldGuard, 1, 12);
    // Shield Boss / Golden Star
    c.fillStyle = "#ffffff";
    c.fillRect(x + 3, y + 14 - breathe + shieldGuard, 3, 3);
    c.fillStyle = "#38bdf8";
    c.fillRect(x + 4, y + 15 - breathe + shieldGuard, 1, 1);

    // 6. Knight Winged Sallet Helmet with Royal Crown & Plume
    // Neck Gorget
    c.fillStyle = "#182026";
    c.fillRect(x + 10, y + 7 - breathe, 8, 3);
    c.fillStyle = "#64748b";
    c.fillRect(x + 11, y + 7 - breathe, 6, 2);

    // Helmet Base
    c.fillStyle = "#1e293b";
    c.fillRect(x + 9, y + 1 - breathe, 11, 8);
    c.fillStyle = "#cbd5e1";
    c.fillRect(x + 10, y + 2 - breathe, 9, 6);

    // Glowing Azure Visor Slit
    c.fillStyle = "#0f172a";
    c.fillRect(x + 13, y + 5 - breathe, 6, 2);
    c.fillStyle = "#38bdf8";
    c.fillRect(x + 14, y + 5 - breathe, 4, 1);
    c.fillStyle = "#ffffff";
    c.fillRect(x + 15, y + 5 - breathe, 2, 1); // Optic spark

    // Royal Gilded Crown encircling Helm (With Inlaid Jewels)
    c.fillStyle = "#f59e0b";
    c.fillRect(x + 9, y - breathe, 12, 3);
    c.fillStyle = "#fde047";
    c.fillRect(x + 10, y - 2 - breathe, 2, 2); // Crown Spire 1
    c.fillRect(x + 14, y - 3 - breathe, 3, 3); // Central Crown Spire
    c.fillRect(x + 18, y - 2 - breathe, 2, 2); // Crown Spire 3
    // Inlaid Crown Jewels (Ruby & Sapphire)
    c.fillStyle = "#ef4444";
    c.fillRect(x + 15, y - 1 - breathe, 1, 1); // Heart Ruby
    c.fillStyle = "#38bdf8";
    c.fillRect(x + 11, y - breathe, 1, 1); // Left Sapphire
    c.fillRect(x + 18, y - breathe, 1, 1); // Right Sapphire

    // Majestic White & Gold Heroic Plume flowing behind
    c.fillStyle = "#f8fafc";
    c.fillRect(x + 6, y - 1 - breathe + capeFlap * 0.3, 4, 3);
    c.fillRect(x + 4, y + 1 - breathe + capeFlap * 0.4, 3, 3);
    c.fillStyle = "#fde047";
    c.fillRect(x + 7, y - breathe, 2, 2);

    // Massive Golden Lion Shoulder Pauldron (Left & Right)
    c.fillStyle = "#b45309";
    c.fillRect(x + 5, y + 8 - breathe, 4, 5);
    c.fillRect(x + 18, y + 8 - breathe, 5, 5);
    c.fillStyle = "#f59e0b";
    c.fillRect(x + 5, y + 8 - breathe, 4, 4);
    c.fillRect(x + 19, y + 8 - breathe, 4, 4);
    c.fillStyle = "#fef08a";
    c.fillRect(x + 6, y + 9 - breathe, 2, 2);
    c.fillRect(x + 20, y + 9 - breathe, 2, 2);

    // 7. Right Arm & Holy Sunblade (Excalibur) with Dynamic Attack Slash Animation
    if (attack) {
      c.save();
      // Dynamic Slashing Attack Sequence
      const slashAngle = -Math.PI * 0.35 + slashSwing * Math.PI * 0.9;
      const pivotX = x + 21;
      const pivotY = y + 14 - breathe;

      c.translate(pivotX, pivotY);
      c.rotate(slashAngle);

      // Arm
      c.fillStyle = "#cbd5e1";
      c.fillRect(-2, -3, 5, 5);

      // Sword Hilt & Crossguard
      c.fillStyle = "#78350f"; // Grip
      c.fillRect(-1, 0, 3, 5);
      c.fillStyle = "#f59e0b"; // Golden Lion Crossguard
      c.fillRect(-5, -2, 11, 3);
      c.fillStyle = "#38bdf8"; // Sapphire Pommel
      c.fillRect(-1, 5, 3, 3);

      // Gleaming Celestial Holy Blade
      c.fillStyle = "#e2e8f0";
      c.fillRect(-2, -18, 5, 17);
      c.fillStyle = "#ffffff";
      c.fillRect(-1, -19, 3, 18);
      // Runic Core
      c.fillStyle = "#38bdf8";
      c.fillRect(0, -15, 1, 10);

      c.restore();

      // Radiant Golden Crescent Slash Effect on Impact!
      if (slashSwing > 0.25) {
        c.save();
        c.globalCompositeOperation = "lighter";
        const arcGrad = c.createRadialGradient(x + 24, y + 14, 8, x + 24, y + 14, 28);
        arcGrad.addColorStop(0, "rgba(255, 245, 160, 0.9)");
        arcGrad.addColorStop(0.5, "rgba(250, 204, 21, 0.65)");
        arcGrad.addColorStop(1, "rgba(245, 158, 11, 0)");

        c.fillStyle = arcGrad;
        c.beginPath();
        c.arc(x + 24, y + 14, 26, -Math.PI * 0.45, Math.PI * 0.45);
        c.lineTo(x + 24, y + 14);
        c.closePath();
        c.fill();

        // Sharp Slash Crescent Arc Line
        c.strokeStyle = "rgba(255, 255, 255, 0.95)";
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(x + 24, y + 14, 24, -Math.PI * 0.4, Math.PI * 0.35);
        c.stroke();

        // Divine Holy Sparks flying from strike
        for (let sp = 0; sp < 4; sp++) {
          const spAngle = -0.6 + sp * 0.4;
          const spDist = 20 + sp * 3;
          c.fillStyle = "#fef08a";
          c.fillRect(x + 24 + Math.cos(spAngle) * spDist, y + 14 + Math.sin(spAngle) * spDist, 2, 2);
        }
        c.restore();
      }
    } else {
      // Idle / Walking Stance: Poised Sword at the Ready with Subtle Gleam
      const armSway = walk ? Math.sin(anim * 4) * 2.5 : 0;
      const swordY = y + 12 - breathe + armSway;

      // Arm
      c.fillStyle = "#cbd5e1";
      c.fillRect(x + 19, swordY, 4, 5);

      // Sword Crossguard & Hilt
      c.fillStyle = "#78350f";
      c.fillRect(x + 22, swordY + 4, 3, 5);
      c.fillStyle = "#38bdf8"; // Pommel sapphire
      c.fillRect(x + 22, swordY + 9, 3, 2);
      c.fillStyle = "#f59e0b"; // Lion crossguard
      c.fillRect(x + 18, swordY + 2, 10, 3);
      c.fillStyle = "#fde047";
      c.fillRect(x + 21, swordY + 3, 4, 2);

      // Holy Blade pointing proudly upward
      c.fillStyle = "#cbd5e1";
      c.fillRect(x + 21, swordY - 14, 4, 16);
      c.fillStyle = "#ffffff";
      c.fillRect(x + 22, swordY - 15, 2, 17);
      // Holy Runic Line in Blade
      c.fillStyle = "#38bdf8";
      c.fillRect(x + 22, swordY - 11, 1, 9);

      // Traveling Divine Shimmer Spark along Blade Edge
      const shimmerPos = (time * 1.8) % 1;
      const shimY = swordY - 14 + shimmerPos * 14;
      c.save();
      c.globalCompositeOperation = "lighter";
      c.fillStyle = "rgba(255, 255, 255, 0.9)";
      c.fillRect(x + 22, shimY, 2, 2);
      c.restore();
    }

    // 8. Level-Based Ascendant Divine Particles & Empowered Holy Aura
    if (level >= 2) {
      c.save();
      c.globalCompositeOperation = "lighter";
      // Golden motes rising from boots
      for (let p = 0; p < level; p++) {
        const px = x + 6 + ((time * 7 + p * 8) % 18);
        const py = y + 26 - ((time * 14 + p * 9) % 24);
        const pa = 0.7 - ((time * 14 + p * 9) % 24) / 24;
        c.fillStyle = `rgba(253, 224, 71, ${Math.max(0, pa)})`;
        c.fillRect(px, py, 1.5, 1.5);
      }
      // Lv.5 Sunburst Crown Radiance
      if (level >= 5) {
        const sunPulse = 0.5 + 0.4 * Math.sin(time * 5);
        c.fillStyle = `rgba(254, 240, 138, ${sunPulse})`;
        c.beginPath();
        c.arc(x + 15, y - 1 - breathe, 5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  };

  const drawAltarHeroSprite = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    h: AltarHero,
    walk: boolean,
    attack: boolean,
    time: number
  ) => {
    const role = h.role;
    const slash = attack ? Math.sin(Math.max(0, 1 - h.attackCd / h.attackRate) * Math.PI) * 8 : 0;

    if (role === "ranger") {
      // Base Shadow
      c.fillStyle = "rgba(0,0,0,.45)";
      c.beginPath();
      c.ellipse(x + 14, y + 28, 11, 4, 0, 0, Math.PI * 2);
      c.fill();

      // Sylph Huntress Sharpshooter
      // Emerald Cloak
      c.fillStyle = "#12301e";
      c.fillRect(x + 7, y + 12, 14, 14);
      c.fillStyle = "#2d5e3f";
      c.fillRect(x + 8, y + 13, 12, 12);

      // Leather Boots
      c.fillStyle = "#26180e";
      c.fillRect(x + 9, y + 20, 3, 8);
      c.fillRect(x + 15, y + 20, 3, 8);

      // Tunic & Golden Quiver Strap
      c.fillStyle = "#12301e";
      c.fillRect(x + 8, y + 10, 12, 10);
      c.fillStyle = "#3e7d56";
      c.fillRect(x + 9, y + 11, 10, 8);
      c.fillStyle = "#f5c542";
      c.fillRect(x + 9, y + 11, 10, 2);

      // Ranger Feathered Hood
      c.fillStyle = "#12301e";
      c.fillRect(x + 9, y + 3, 10, 8);
      c.fillStyle = "#2d5e3f";
      c.fillRect(x + 10, y + 4, 8, 6);
      c.fillStyle = "#f3c79c";
      c.fillRect(x + 11, y + 6, 6, 4); // Face
      c.fillStyle = "#4de0ff";
      c.fillRect(x + 14, y + 7, 2, 1); // Blue eyes
      c.fillStyle = "#57e389";
      c.fillRect(x + 6, y + 1, 4, 3); // Feather

      // Massive Celestial Recurve Bow
      c.strokeStyle = "#f5c542";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x + 22, y + 14 - slash, 10, -Math.PI / 2, Math.PI / 2);
      c.stroke();
      c.strokeStyle = "#4de0ff";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 22, y + 4 - slash);
      c.lineTo(x + 22 - (attack ? 5 : 0), y + 14 - slash);
      c.lineTo(x + 22, y + 24 - slash);
      c.stroke();
      return;
    }

    if (role === "mage") {
      // Base Shadow
      c.fillStyle = "rgba(0,0,0,.45)";
      c.beginPath();
      c.ellipse(x + 14, y + 28, 11, 4, 0, 0, Math.PI * 2);
      c.fill();

      // High Archmage (Astral Sorcerer)
      // Floating hover bob
      const hover = Math.sin(time * 3) * 2;

      // Midnight Violet Star Robe
      c.fillStyle = "#170e26";
      c.fillRect(x + 7, y + 11 + hover, 14, 16);
      c.fillStyle = "#37225c";
      c.fillRect(x + 8, y + 12 + hover, 12, 14);
      c.fillStyle = "#f5c542";
      c.fillRect(x + 13, y + 12 + hover, 2, 14); // Gold trim

      // Archmage Pointed Hat
      c.fillStyle = "#170e26";
      c.beginPath();
      c.moveTo(x + 14, y - 4 + hover);
      c.lineTo(x + 21, y + 5 + hover);
      c.lineTo(x + 7, y + 5 + hover);
      c.closePath();
      c.fill();
      c.fillStyle = "#f5c542";
      c.fillRect(x + 8, y + 4 + hover, 12, 2);

      // Face & Glowing Eyes
      c.fillStyle = "#f3c79c";
      c.fillRect(x + 10, y + 6 + hover, 8, 5);
      c.fillStyle = "#b566ff";
      c.fillRect(x + 14, y + 7 + hover, 2, 2);

      // Grand Arcane Staff with Rotating Crystal
      c.fillStyle = "#4a2d18";
      c.fillRect(x + 22, y + 5 + hover, 2, 18);
      c.fillStyle = "#f5c542";
      c.fillRect(x + 20, y + 3 + hover, 6, 3);

      // Floating Crystal Prism & Aura
      c.save();
      c.globalCompositeOperation = "lighter";
      const aura = 0.5 + 0.4 * Math.sin(time * 6);
      c.fillStyle = `rgba(180, 100, 255, ${aura})`;
      c.beginPath();
      c.arc(x + 23, y - 1 + hover, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#ffffff";
      c.fillRect(x + 22, y - 2 + hover, 2, 2);
      c.restore();
      return;
    }

    // Default & "hero" & "frontline": The Sovereign Royal Hero of the Realm!
    drawRoyalHeroSprite(
      c,
      x,
      y,
      h.level || 1,
      walk,
      attack,
      time,
      h.anim || 0,
      h.attackCd || 0,
      h.attackRate || 0.85
    );
  };

  const drawHero = (c: CanvasRenderingContext2D, h: HeroUnit, engine: GameEngine) => {
    const attack = (h as any).state === "attack";
    const walk = (h as any).state === "walk";
    const bob = walk ? Math.sin(((h as any).anim || 0) * 1.8) * 2 : 0;
    const wx = Math.round(h.x * TS);
    const wy = Math.round(h.y * TS) + bob;
    art(c, wx - 3, wy - 9, () => {
      c.save();
      c.translate(14, 27);
      if ((h as any)._facing === "left") c.scale(-1, 1);
      c.scale(1.28, 1.28);
      c.translate(-14, -27);
      drawRoyalHeroSprite(
        c,
        0,
        0,
        (h as any).level || 1,
        walk,
        attack,
        engine.time,
        (h as any).anim || 0,
        (h as any).attackCd || 0,
        (h as any).attackRate || 0.85
      );
      c.restore();
    });
    bar(c, wx + 2, wy - 12, 24, 3, h.hp / h.maxHp, "#50b04e");
  };

  const drawHeroSprite = (c: CanvasRenderingContext2D, x: number, y: number, h: HeroUnit) => {
    drawRoyalHeroSprite(c, x, y, (h as any).level || 1, false, false, 0, 0, 0, 0.85);
  };

  const drawChestSprite = (c: CanvasRenderingContext2D, x: number, y: number, ch: any) => {
    const bounce = Math.sin(ch.anim * 4) * 2;
    c.fillStyle = "rgba(0,0,0,.4)";
    c.fillRect(x + 2, y + 22, 24, 5);

    // Heavy Gilded Medieval Chest
    c.fillStyle = "#24130b";
    c.fillRect(x + 4, y + 10 + bounce, 20, 14);
    c.fillStyle = "#5c331a";
    c.fillRect(x + 5, y + 11 + bounce, 18, 12);

    // Gold Straps and Lock
    c.fillStyle = "#f5c542";
    c.fillRect(x + 7, y + 10 + bounce, 3, 14);
    c.fillRect(x + 18, y + 10 + bounce, 3, 14);
    c.fillRect(x + 12, y + 15 + bounce, 4, 4);
    c.fillStyle = "#ffffff";
    c.fillRect(x + 13, y + 16 + bounce, 2, 2);
  };

  // ==========================================
  // ATMOSPHERE, LIGHTING, GRAIN AND SHADERS
  // ==========================================

  const drawFog = (c: CanvasRenderingContext2D, g: GameEngine) => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!g.isExplored(x, y)) {
          c.fillStyle = "#020204";
          c.fillRect(x * TS, y * TS, TS, TS);
        } else if (!g.isVisible(x, y)) {
          c.fillStyle = "rgba(4,7,10,.55)";
          c.fillRect(x * TS, y * TS, TS, TS);
        }
      }
    }
  };

  const drawLighting = (c: CanvasRenderingContext2D, g: GameEngine) => {
    const p = g.phaseInfo();
    const alpha = p.dark;
    if (alpha <= 0.02) return;

    if (!lightCanvasRef.current) {
      const lc = document.createElement("canvas");
      lc.width = CANVAS_SIZE;
      lc.height = CANVAS_SIZE;
      lightCanvasRef.current = lc;
    }
    const lc = lightCanvasRef.current;
    const l = lc.getContext("2d");
    if (!l) return;

    l.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    l.globalCompositeOperation = "source-over";

    // Atmospheric dynamic sky mood grading:
    // Uses deep celestial indigo, twilight violet, and moonlight tones rather than flat dark ink
    const mood = p.skyMood || "day";
    let nightColor = `rgba(10, 14, 28, ${alpha * 0.78})`;
    if (p.isBossWave) {
      nightColor = `rgba(28, 8, 16, ${alpha * 0.82})`;
    } else if (mood === "sunset") {
      nightColor = `rgba(36, 16, 22, ${alpha * 0.72})`;
    } else if (mood === "twilight") {
      nightColor = `rgba(18, 12, 30, ${alpha * 0.76})`;
    } else if (mood === "dawn") {
      nightColor = `rgba(20, 16, 26, ${alpha * 0.65})`;
    }

    l.fillStyle = nightColor;
    l.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Smooth, progressive light intensity curve:
    // Lanterns and torches ignite smoothly and organically as dusk deepens, preventing abrupt pops
    const lightPower = Math.min(1, Math.max(0, (alpha - 0.05) / 0.38));
    const easeLight = lightPower * lightPower * (3 - 2 * lightPower); // smoothstep
    if (easeLight <= 0.01) {
      c.drawImage(lc, 0, 0);
      return;
    }

    l.globalCompositeOperation = "destination-out";

    const lights: { x: number; y: number; r: number; type: string }[] = [];

    // 1. Core Realm Buildings (Warm campfires, brazier beacons & sacred fires)
    for (const b of g.buildings) {
      if (!b.complete) continue;
      if (b.type === "townhall") {
        lights.push({ x: (b.x + b.w / 2) * TS, y: (b.y + b.h / 2) * TS, r: 85 * ART_R, type: "townhall" });
      } else if (b.type === "tower") {
        lights.push({ x: (b.x + 0.5) * TS, y: (b.y + 0.5) * TS, r: 62 * ART_R, type: "tower" });
      } else if (b.type === "house") {
        lights.push({ x: (b.x + 0.5) * TS, y: (b.y + 0.5) * TS, r: 42 * ART_R, type: "house" });
      } else if (b.type === "palisade" || b.type === "gate") {
        lights.push({ x: (b.x + 0.5) * TS, y: (b.y + 0.5) * TS, r: 28 * ART_R, type: "palisade" });
      } else if (b.type === "altar") {
        lights.push({ x: (b.x + 1) * TS, y: (b.y + 1) * TS, r: 68 * ART_R, type: "altar" });
      } else if (b.type === "barracks") {
        lights.push({ x: (b.x + 1) * TS, y: (b.y + 1) * TS, r: 52 * ART_R, type: "barracks" });
      }
    }

    if (g.golemMound && !g.golem && g.isExplored(g.golemMound.x, g.golemMound.y)) {
      lights.push({ x: (g.golemMound.x + 0.5) * TS, y: (g.golemMound.y + 0.5) * TS, r: 38 * ART_R, type: "mound" });
    }

    if (g.golem && g.golem.hp > 0) {
      lights.push({ x: (g.golem.x + 0.5) * TS, y: (g.golem.y + 0.5) * TS, r: 48 * ART_R, type: "golem" });
    }

    // 2. Legendary Hero Commander (Radiant golden aura)
    const litHeroIds = new Set<number>();
    for (const h of Object.values(g.altarHeroes)) {
      if (h && h.hp > 0 && !litHeroIds.has(h.id)) {
        litHeroIds.add(h.id);
        lights.push({ x: (h.x + 0.5) * TS, y: (h.y + 0.5) * TS, r: 36 * ART_R, type: "hero" });
      }
    }
    if (g.heroUnit && g.heroUnit.hp > 0 && !litHeroIds.has(g.heroUnit.id)) {
      lights.push({ x: (g.heroUnit.x + 0.5) * TS, y: (g.heroUnit.y + 0.5) * TS, r: 36 * ART_R, type: "hero" });
    }

    // 3. Units & Troops: Refined, elegant light radii (no exaggerated 80px circles!)
    for (const u of g.units) {
      if (u.state === "death") continue;
      const ux = (u.x + 0.5) * TS;
      const uy = (u.y + 0.6) * TS;
      if (u.role === "scout") {
        // Scout carries focused nocturnal pathfinder lantern
        lights.push({ x: ux, y: uy, r: 28 * ART_R, type: "scout" });
      } else if (u.role === "goldMiner" || u.role === "stoneMiner") {
        // Miners have subtle carbide headlamp
        lights.push({ x: ux, y: uy, r: 20 * ART_R, type: "miner" });
      } else {
        // Regular workers and soldiers have subtle, cozy personal presence
        lights.push({ x: ux, y: uy, r: 15 * ART_R, type: "unit" });
      }
    }

    // A. Feathered, smooth visibility cutouts (destination-out):
    // Preserves gentle ambient night tone inside the circle, eliminating harsh cookie-cutter borders
    for (const q of lights) {
      const flick = 1 + Math.sin(g.time * 4.5 + q.x * 0.08) * 0.025;
      const r = q.r * flick;
      const cutGrad = l.createRadialGradient(q.x, q.y, 1, q.x, q.y, r);
      cutGrad.addColorStop(0, `rgba(0,0,0,${0.55 * easeLight})`);
      cutGrad.addColorStop(0.35, `rgba(0,0,0,${0.38 * easeLight})`);
      cutGrad.addColorStop(0.75, `rgba(0,0,0,${0.12 * easeLight})`);
      cutGrad.addColorStop(1, "rgba(0,0,0,0)");
      l.fillStyle = cutGrad;
      l.fillRect(q.x - r, q.y - r, r * 2, r * 2);
    }

    l.globalCompositeOperation = "source-over";
    c.drawImage(lc, 0, 0);

    // B. Warm Candlelit & Magic Atmosphere Pass:
    // Soft, non-blinding opacities that layer harmoniously without whiteout glare
    c.save();
    c.globalCompositeOperation = "screen";
    for (const q of lights) {
      const flick = 1 + Math.sin(g.time * 4.8 + q.x * 0.1) * 0.03;
      const r = q.r * 0.95 * flick;
      const glowGrad = c.createRadialGradient(q.x, q.y, 1, q.x, q.y, r);

      if (q.type === "altar" || q.type === "golem" || q.type === "mound") {
        // Mystical celestial starlight glow
        glowGrad.addColorStop(0, `rgba(147, 197, 253, ${0.22 * easeLight})`);
        glowGrad.addColorStop(0.35, `rgba(168, 85, 247, ${0.09 * easeLight})`);
        glowGrad.addColorStop(0.75, `rgba(126, 34, 206, ${0.02 * easeLight})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      } else if (q.type === "hero") {
        // Radiant divine golden presence
        glowGrad.addColorStop(0, `rgba(254, 240, 138, ${0.24 * easeLight})`);
        glowGrad.addColorStop(0.35, `rgba(245, 158, 11, ${0.10 * easeLight})`);
        glowGrad.addColorStop(0.75, `rgba(217, 119, 6, ${0.02 * easeLight})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      } else if (q.type === "scout") {
        // Soft cyan pathfinder lantern
        glowGrad.addColorStop(0, `rgba(125, 211, 252, ${0.20 * easeLight})`);
        glowGrad.addColorStop(0.4, `rgba(14, 165, 233, ${0.08 * easeLight})`);
        glowGrad.addColorStop(0.8, `rgba(3, 105, 161, ${0.02 * easeLight})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      } else if (q.type === "townhall" || q.type === "tower") {
        // Warm hearth brazier flame
        glowGrad.addColorStop(0, `rgba(254, 215, 170, ${0.24 * easeLight})`);
        glowGrad.addColorStop(0.35, `rgba(249, 115, 22, ${0.10 * easeLight})`);
        glowGrad.addColorStop(0.75, `rgba(194, 65, 12, ${0.02 * easeLight})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      } else {
        // Subtle, cozy candlelit amber glow for workers and troops
        glowGrad.addColorStop(0, `rgba(253, 224, 71, ${0.12 * easeLight})`);
        glowGrad.addColorStop(0.35, `rgba(245, 158, 11, ${0.05 * easeLight})`);
        glowGrad.addColorStop(0.75, `rgba(217, 119, 6, ${0.015 * easeLight})`);
        glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      }

      c.fillStyle = glowGrad;
      c.beginPath();
      c.arc(q.x, q.y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  };

  const drawFireflies = (c: CanvasRenderingContext2D, g: GameEngine) => {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (const f of g.fireflies) {
      const drift = (g.time * f.s * 0.18) % 3;
      const x = (f.x + Math.sin(g.time * f.s + f.p) * 1.1) * TS;
      const y = (f.y - drift + Math.cos(g.time * f.s * 0.7 + f.p) * 0.5) * TS;
      const a = (0.3 + 0.35 * Math.sin(g.time * 3 + f.p)) * (1 - drift / 3);
      c.fillStyle = `rgba(232,98,44,${a})`;
      c.fillRect(x, y, f.r, f.r);
    }
    c.restore();
  };

  const drawGrain = (c: CanvasRenderingContext2D) => {
    if (!grainPatternRef.current) {
      const tc = document.createElement("canvas");
      tc.width = 96;
      tc.height = 96;
      const ctx = tc.getContext("2d");
      if (ctx) {
        const id = ctx.createImageData(96, 96);
        for (let i = 0; i < id.data.length; i += 4) {
          const n = Math.random();
          const v = n < 0.5 ? 0 : 255;
          const a = n < 0.5 ? Math.random() * 22 : Math.random() * 10;
          id.data[i] = v;
          id.data[i + 1] = v;
          id.data[i + 2] = v;
          id.data[i + 3] = a;
        }
        ctx.putImageData(id, 0, 0);
        grainPatternRef.current = c.createPattern(tc, "repeat");
      }
    }
    if (grainPatternRef.current) {
      c.save();
      c.globalAlpha = 0.45;
      c.globalCompositeOperation = "overlay";
      c.fillStyle = grainPatternRef.current;
      c.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      c.restore();
    }
  };

  const drawMood = (c: CanvasRenderingContext2D) => {
    c.save();
    c.globalCompositeOperation = "soft-light";
    c.globalAlpha = 0.35;
    c.fillStyle = "#4a3868";
    c.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    c.restore();
  };

  const drawEntityAura = (c: CanvasRenderingContext2D, g: GameEngine) => {
    // 1. Hero Golden Celestial Aura
    const hero = g.heroUnit || Object.values(g.altarHeroes).find((h) => h && h.hp > 0);
    if (hero && hero.hp > 0) {
      const hx = (hero.x + 0.5) * TS;
      const hy = (hero.y + 0.72) * TS;
      const pulse = 0.35 + 0.2 * Math.sin(g.time * 4);
      c.save();
      c.globalAlpha = pulse;

      // Outer golden sun glow
      const grad = c.createRadialGradient(hx, hy, 4, hx, hy, 36);
      grad.addColorStop(0, "rgba(255, 225, 120, 0.85)");
      grad.addColorStop(0.45, "rgba(245, 180, 50, 0.4)");
      grad.addColorStop(1, "rgba(245, 180, 50, 0)");
      c.fillStyle = grad;
      c.beginPath();
      c.arc(hx, hy, 36, 0, Math.PI * 2);
      c.fill();

      // Rotating celestial runic ring
      c.strokeStyle = "rgba(255, 235, 150, 0.7)";
      c.lineWidth = 1.6;
      c.setLineDash([5, 4]);
      c.beginPath();
      c.arc(hx, hy, 20, g.time * 1.6, g.time * 1.6 + Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }

    // 1b. War Cry Battle Rally Aura on all active troops
    if (g.warCryBuffTimer > 0) {
      c.save();
      const warAlpha = Math.min(0.65, 0.35 + 0.25 * Math.sin(g.time * 6));
      c.globalAlpha = warAlpha;
      for (const u of g.units) {
        if (u.state === "death" || !g.isExplored(Math.round(u.x), Math.round(u.y))) continue;
        const ux = (u.x + 0.5) * TS;
        const uy = (u.y + 0.72) * TS;
        const wGrad = c.createRadialGradient(ux, uy, 2, ux, uy, 18);
        wGrad.addColorStop(0, "rgba(249, 115, 22, 0.75)");
        wGrad.addColorStop(0.5, "rgba(234, 88, 12, 0.35)");
        wGrad.addColorStop(1, "rgba(194, 65, 12, 0)");
        c.fillStyle = wGrad;
        c.beginPath();
        c.arc(ux, uy, 18, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // 2. Golem Earth Aura
    if (g.golem) {
      const wx = g.golem.x * TS;
      const wy = g.golem.y * TS;
      const a = 0.18 + 0.12 * Math.sin(g.time * 3);
      c.save();
      c.globalAlpha = a;
      const grad = c.createRadialGradient(wx + 22, wy + 30, 4, wx + 22, wy + 30, 38);
      grad.addColorStop(0, "rgba(115,217,255,.85)");
      grad.addColorStop(1, "rgba(115,217,255,0)");
      c.fillStyle = grad;
      c.beginPath();
      c.arc(wx + 22, wy + 30, 38, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // 3. Sovereign Boss Nightmare Abyssal Aura
    if (g.boss && g.boss.hp > 0) {
      const bx = (g.boss.x + 0.5) * TS;
      const by = (g.boss.y + 0.5) * TS;
      const bPulse = 0.45 + 0.25 * Math.sin(g.time * 3);

      c.save();
      c.globalAlpha = bPulse;

      // Dark abyssal void puddle
      const bGrad = c.createRadialGradient(bx, by, 6, bx, by, 52);
      bGrad.addColorStop(0, "rgba(136, 19, 55, 0.75)");
      bGrad.addColorStop(0.5, "rgba(76, 5, 25, 0.4)");
      bGrad.addColorStop(1, "rgba(2, 6, 23, 0)");
      c.fillStyle = bGrad;
      c.beginPath();
      c.arc(bx, by, 52, 0, Math.PI * 2);
      c.fill();

      // Jagged barbed nightmare ring rotating counter-clockwise
      c.strokeStyle = "rgba(244, 63, 94, 0.65)";
      c.lineWidth = 1.8;
      c.beginPath();
      const spikes = 8;
      const baseR = 34;
      for (let s = 0; s < spikes * 2; s++) {
        const theta = -g.time * 1.2 + (s * Math.PI) / spikes;
        const rad = s % 2 === 0 ? baseR + 7 : baseR - 3;
        const sx = bx + Math.cos(theta) * rad;
        const sy = by + Math.sin(theta) * (rad * 0.7); // Perspective flatten
        if (s === 0) c.moveTo(sx, sy);
        else c.lineTo(sx, sy);
      }
      c.closePath();
      c.stroke();
      c.restore();
    }
  };

  const drawShockwaves = (c: CanvasRenderingContext2D, g: GameEngine) => {
    if (!g.shockwaves || g.shockwaves.length === 0) return;

    for (const sw of g.shockwaves) {
      const progress = Math.max(0, Math.min(1, sw.time / sw.duration));
      if (progress >= 1) continue;

      const ease = 1 - Math.pow(1 - progress, 2.5);
      const r = sw.maxRadius * TS * ease;
      const alpha = (1 - progress) * 0.85;
      const cx = sw.x * TS;
      const cy = sw.y * TS;

      c.save();
      c.globalAlpha = alpha;

      if (sw.type === "holy") {
        // Divine Golden Nova Shockwave (Holy Strike / Smite)
        const flare = c.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
        flare.addColorStop(0, "rgba(254, 240, 138, 0.45)");
        flare.addColorStop(0.65, "rgba(245, 158, 11, 0.25)");
        flare.addColorStop(1, "rgba(245, 158, 11, 0)");
        c.fillStyle = flare;
        c.beginPath();
        c.ellipse(cx, cy, r, r * 0.72, 0, 0, Math.PI * 2);
        c.fill();

        // High-energy primary shock ring
        c.strokeStyle = "#fef08a";
        c.lineWidth = 3.5 * (1 - progress * 0.5);
        c.beginPath();
        c.ellipse(cx, cy, r, r * 0.72, 0, 0, Math.PI * 2);
        c.stroke();

        // Inner golden secondary resonance ring
        c.strokeStyle = "#f59e0b";
        c.lineWidth = 2.0;
        c.beginPath();
        c.ellipse(cx, cy, r * 0.65, r * 0.65 * 0.72, 0, 0, Math.PI * 2);
        c.stroke();

        // Radiating 8 Divine Light Spokes
        c.strokeStyle = "rgba(255, 255, 255, 0.75)";
        c.lineWidth = 1.8;
        const spokes = 8;
        for (let i = 0; i < spokes; i++) {
          const ang = (i * Math.PI * 2) / spokes + progress * 0.8;
          const innerR = r * 0.35;
          const outerR = r * 1.05;
          c.beginPath();
          c.moveTo(cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR * 0.72);
          c.lineTo(cx + Math.cos(ang) * outerR, cy + Math.sin(ang) * outerR * 0.72);
          c.stroke();
        }

        // Diamond runic crests on primary circumference
        c.fillStyle = "#ffffff";
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI * 2) / 4 + progress * 0.4;
          const rx = cx + Math.cos(ang) * r;
          const ry = cy + Math.sin(ang) * r * 0.72;
          c.fillRect(rx - 2.5, ry - 2.5, 5, 5);
        }
      } else if (sw.type === "roar") {
        // Fiery War Cry Shockwave (Roaring Battle Tremor)
        const flare = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        flare.addColorStop(0, "rgba(249, 115, 22, 0.45)");
        flare.addColorStop(0.5, "rgba(220, 38, 38, 0.25)");
        flare.addColorStop(1, "rgba(185, 28, 28, 0)");
        c.fillStyle = flare;
        c.beginPath();
        c.ellipse(cx, cy, r, r * 0.68, 0, 0, Math.PI * 2);
        c.fill();

        // Jagged flame ring
        c.strokeStyle = "#fdba74";
        c.lineWidth = 3.0 * (1 - progress * 0.4);
        c.beginPath();
        const pts = 16;
        for (let i = 0; i < pts * 2; i++) {
          const theta = (i * Math.PI) / pts + progress * 1.2;
          const rad = i % 2 === 0 ? r : r * 0.86;
          const px = cx + Math.cos(theta) * rad;
          const py = cy + Math.sin(theta) * (rad * 0.68);
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        c.stroke();

        // Expanding flame core
        c.strokeStyle = "#ea580c";
        c.lineWidth = 2.2;
        c.beginPath();
        c.ellipse(cx, cy, r * 0.5, r * 0.5 * 0.68, 0, 0, Math.PI * 2);
        c.stroke();
      } else {
        // Celestial Holy Light Bloom (Healing Wave)
        const flare = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        flare.addColorStop(0, "rgba(74, 222, 128, 0.45)");
        flare.addColorStop(0.6, "rgba(34, 197, 94, 0.2)");
        flare.addColorStop(1, "rgba(22, 101, 52, 0)");
        c.fillStyle = flare;
        c.beginPath();
        c.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
        c.fill();

        // Soft Emerald Ring
        c.strokeStyle = "#86efac";
        c.lineWidth = 2.8 * (1 - progress * 0.4);
        c.beginPath();
        c.ellipse(cx, cy, r, r * 0.75, 0, 0, Math.PI * 2);
        c.stroke();

        // Floating holy cross sparkle motes around perimeter
        c.fillStyle = "#ffffff";
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6 + progress * 0.6;
          const px = cx + Math.cos(ang) * (r * 0.85);
          const py = cy + Math.sin(ang) * (r * 0.85 * 0.75);
          c.fillRect(px - 1, py - 4, 2, 8);
          c.fillRect(px - 4, py - 1, 8, 2);
        }
      }

      c.restore();
    }
  };

  const drawArrows = (c: CanvasRenderingContext2D, g: GameEngine) => {
    for (const a of g.arrows) {
      const t = Math.max(0, Math.min(1, a.t));
      const x = a.sx + (a.tx - a.sx) * t;
      const arcHeight = a.shape === "javelin" ? 18 : 24;
      const y = a.sy + (a.ty - a.sy) * t - Math.sin(t * Math.PI) * arcHeight;

      if (a.shape === "javelin") {
        const nextT = Math.min(1, t + 0.05);
        const nextX = a.sx + (a.tx - a.sx) * nextT;
        const nextY = a.sy + (a.ty - a.sy) * nextT - Math.sin(nextT * Math.PI) * arcHeight;
        const angle = Math.atan2(nextY - y, nextX - x);

        c.save();
        c.translate(x, y);
        c.rotate(angle);

        // Wooden spear shaft
        c.fillStyle = "#8a5229";
        c.fillRect(-9, -1, 18, 2);

        // Bronze grip
        c.fillStyle = "#d97706";
        c.fillRect(-1, -1.5, 3, 3);

        // Steel spearhead
        c.fillStyle = "#cbd5e1";
        c.beginPath();
        c.moveTo(9, -2.5);
        c.lineTo(16, 0);
        c.lineTo(9, 2.5);
        c.closePath();
        c.fill();

        // Gleaming tip
        c.fillStyle = "#ffffff";
        c.fillRect(11, -0.5, 4, 1);

        // Rear bronze counterweight cap
        c.fillStyle = "#b45309";
        c.fillRect(-10, -1.5, 2, 3);

        c.restore();
      } else {
        c.fillStyle = a.color || "#ffde84";
        c.fillRect(x - 2, y - 1, 5, 2);
      }
    }
  };

  const drawParticles = (c: CanvasRenderingContext2D, g: GameEngine) => {
    for (const p of g.particles) {
      const alpha = Math.max(0, p.life / p.max);
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = p.color;
      c.fillRect(p.x, p.y, p.size || 2.5, p.size || 2.5);
      c.restore();
    }
  };

  const drawFloats = (c: CanvasRenderingContext2D, g: GameEngine) => {
    if (g.floats.length === 0) return;
    c.save();
    c.font = "bold 12px Cinzel, monospace";
    c.textAlign = "center";
    for (const f of g.floats) {
      c.globalAlpha = Math.max(0, Math.min(1, f.life / f.max));
      c.fillStyle = "#000";
      c.fillText(f.text, f.x + 1, f.y + 1);
      c.fillStyle = f.color;
      c.fillText(f.text, f.x, f.y);
    }
    c.restore();
  };

  const drawSelection = (c: CanvasRenderingContext2D, g: GameEngine) => {
    // 1. Multi-unit and single-unit selection rings
    const selectedIds = new Set<number>();
    if (g.selected?.kind === "unit" && g.selected.id) selectedIds.add(g.selected.id);
    if (g.selectedUnitIds && g.selectedUnitIds.length > 0) {
      g.selectedUnitIds.forEach((id) => selectedIds.add(id));
    }

    if (selectedIds.size > 0) {
      const pulse = 0.78 + 0.22 * Math.sin(g.time * 5.5);
      c.save();
      for (const unitId of selectedIds) {
        const u = g.units.find((item) => item.id === unitId && item.state !== "death");
        if (!u) continue;
        const cx = (u.x + 0.5) * TS;
        const cy = (u.y + 0.82) * TS;

        // Outer glow halo (matching RTS selection)
        c.globalAlpha = pulse * 0.35;
        c.strokeStyle = "#32ad39";
        c.lineWidth = 4.5;
        c.beginPath();
        c.ellipse(cx, cy, 14.5, 7.5, 0, 0, Math.PI * 2);
        c.stroke();

        // Core bright green selection ring
        c.globalAlpha = pulse;
        c.strokeStyle = "#4bce4f";
        c.lineWidth = 2.2;
        c.beginPath();
        c.ellipse(cx, cy, 14, 7, 0, 0, Math.PI * 2);
        c.stroke();

        // Tactical selection tick markers
        c.strokeStyle = "#92ff96";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(cx - 14, cy); c.lineTo(cx - 17, cy);
        c.moveTo(cx + 14, cy); c.lineTo(cx + 17, cy);
        c.moveTo(cx, cy - 7); c.lineTo(cx, cy - 9.5);
        c.moveTo(cx, cy + 7); c.lineTo(cx, cy + 9.5);
        c.stroke();
      }
      c.restore();
    }

    // 2. Building selection frame
    const b = g.selected?.kind === "building" ? g.buildings.find((item) => item.id === g.selected!.id) : null;
    if (b) {
      c.strokeStyle = "#44c2e1";
      c.lineWidth = 2;
      c.strokeRect(b.x * TS + 1, b.y * TS + 1, b.w * TS - 2, b.h * TS - 2);
      c.lineWidth = 1;
    }
  };

  const drawGhost = (c: CanvasRenderingContext2D, g: GameEngine) => {
    if (!g.buildMode) return;
    const d = BUILD_SPECS[g.buildMode];
    if (!d) return;

    const hx = g.hover ? g.hover.x : Math.max(1, Math.min(COLS - 4, Math.floor(g.camera.x / TS)));
    const hy = g.hover ? g.hover.y : Math.max(1, Math.min(ROWS - 4, Math.floor(g.camera.y / TS)));
    const x = hx * TS;
    const y = hy * TS;
    const status = g.canPlaceBuilding(g.buildMode, hx, hy);

    c.save();
    if (status.valid) {
      c.fillStyle = "rgba(34, 197, 94, 0.35)";
      c.strokeStyle = "#22c55e";
    } else {
      c.fillStyle = "rgba(239, 68, 68, 0.4)";
      c.strokeStyle = "#ef4444";
    }

    c.lineWidth = 2.5;
    c.fillRect(x, y, d.w * TS, d.h * TS);
    c.strokeRect(x + 1, y + 1, d.w * TS - 2, d.h * TS - 2);

    // Draw grid subdivisions for multi-tile buildings
    c.strokeStyle = status.valid ? "rgba(74, 222, 128, 0.4)" : "rgba(248, 113, 113, 0.4)";
    c.lineWidth = 1;
    for (let gx = 1; gx < d.w; gx++) {
      c.beginPath();
      c.moveTo(x + gx * TS, y);
      c.lineTo(x + gx * TS, y + d.h * TS);
      c.stroke();
    }
    for (let gy = 1; gy < d.h; gy++) {
      c.beginPath();
      c.moveTo(x, y + gy * TS);
      c.lineTo(x + d.w * TS, y + gy * TS);
      c.stroke();
    }

    // Centered placement icon
    const cx = x + (d.w * TS) / 2;
    const cy = y + (d.h * TS) / 2;
    c.fillStyle = status.valid ? "#22c55e" : "#ef4444";
    c.beginPath();
    c.arc(cx, cy, 12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ffffff";
    c.font = "bold 13px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(status.valid ? "✓" : "✕", cx, cy);

    // Floating text label with reason when blocked
    if (!status.valid && status.reason) {
      c.font = "bold 11px sans-serif";
      const txt = status.reason;
      const tw = c.measureText(txt).width + 12;
      c.fillStyle = "rgba(15, 23, 42, 0.9)";
      c.fillRect(cx - tw / 2, y - 22, tw, 18);
      c.strokeStyle = "#ef4444";
      c.strokeRect(cx - tw / 2, y - 22, tw, 18);
      c.fillStyle = "#fca5a5";
      c.fillText(txt, cx, y - 13);
    }

    c.restore();
  };

  const drawWeather = (c: CanvasRenderingContext2D, g: GameEngine) => {
    const phase = g.phaseInfo();
    const isBossWave = phase.isBossWave || (g.boss !== null && g.boss !== undefined && g.boss.hp > 0);
    const isStormNight = (phase.skyMood === "night" || phase.dark > 0.4) && phase.wave >= 3;

    // 1. STORM WEATHER (Boss Waves or Late-Game Blood Moon / Threat Nights)
    if (isBossWave || isStormNight) {
      c.save();
      // Diagonal driving rain streaks
      c.strokeStyle = "rgba(186, 230, 253, 0.45)";
      c.lineWidth = 1.2;
      const rainCount = 50;
      const slant = 5;
      for (let i = 0; i < rainCount; i++) {
        const seed = (i * 997 + Math.floor(g.time * 60)) % 10000;
        const rx = ((seed * 17) % (COLS * TS));
        const ry = (((seed * 31) + g.time * 700) % (ROWS * TS));
        c.beginPath();
        c.moveTo(rx, ry);
        c.lineTo(rx - slant, ry + 12);
        c.stroke();

        // Occasional ground splash ripple
        if (i % 4 === 0) {
          const splashProgress = (g.time * 8 + i) % 1;
          c.strokeStyle = `rgba(186, 230, 253, ${0.4 * (1 - splashProgress)})`;
          c.beginPath();
          c.ellipse(rx - slant, ry + 12, 3 * splashProgress, 1.2 * splashProgress, 0, 0, Math.PI * 2);
          c.stroke();
        }
      }

      // Lightning strike flash during boss waves
      if (isBossWave) {
        const flashCycle = (g.time % 9.0);
        if (flashCycle < 0.08) {
          const flashAlpha = (1 - flashCycle / 0.08) * 0.42;
          c.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          c.fillRect(0, 0, COLS * TS, ROWS * TS);
        }
      }
      c.restore();
    } else if (phase.skyMood === "day" || phase.skyMood === "dawn") {
      // 2. DAYTIME AMBIENCE: Gentle floating dandelion tufts / pollen
      c.save();
      c.fillStyle = "rgba(254, 249, 195, 0.6)";
      for (let i = 0; i < 18; i++) {
        const speed = 12 + (i % 6) * 3;
        const x = ((i * 137 + g.time * speed) % (COLS * TS));
        const y = ((i * 89 + Math.sin(g.time * 1.2 + i) * 25 + (i * 43)) % (ROWS * TS));
        c.beginPath();
        c.arc(x, y, 1.2, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    } else {
      // 3. CALM NIGHT / TWILIGHT: Rolling ground mist / low fog patches
      c.save();
      c.globalCompositeOperation = "screen";
      c.fillStyle = "rgba(147, 197, 253, 0.035)";
      for (let i = 0; i < 8; i++) {
        const mx = ((i * 240 + g.time * 15) % (COLS * TS + 200)) - 100;
        const my = (i * 110 + Math.sin(g.time * 0.4 + i) * 30) % (ROWS * TS);
        c.beginPath();
        c.ellipse(mx, my, 120, 24, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  };

  const drawClickMarker = (c: CanvasRenderingContext2D, g: GameEngine) => {
    if (!g.clickMarker) return;
    const m = g.clickMarker;
    const t = Math.max(0, Math.min(1, m.time / m.max));
    const a = Math.pow(1 - t, 0.7);
    const cx = (m.x + 0.5) * TS;
    const cy = (m.y + 0.5) * TS;
    const r = 8 + t * 16;
    const angle = t * 0.8;

    c.save();
    c.globalAlpha = a;

    // Soft radial ground tint
    const grad = c.createRadialGradient(cx, cy, 2, cx, cy, r + 4);
    grad.addColorStop(0, m.color);
    grad.addColorStop(0.6, "transparent");
    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, r + 4, 0, Math.PI * 2);
    c.fill();

    // Outer tactical ring
    c.strokeStyle = m.color;
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();

    // 4 Corner tactical chevron brackets
    const bLen = Math.max(3, 8 * (1 - t * 0.5));
    c.lineWidth = 2.2;
    c.beginPath();
    // North
    c.moveTo(cx - bLen, cy - r - 2); c.lineTo(cx, cy - r - 4); c.lineTo(cx + bLen, cy - r - 2);
    // South
    c.moveTo(cx - bLen, cy + r + 2); c.lineTo(cx, cy + r + 4); c.lineTo(cx + bLen, cy + r + 2);
    // West
    c.moveTo(cx - r - 2, cy - bLen); c.lineTo(cx - r - 4, cy); c.lineTo(cx - r - 2, cy + bLen);
    // East
    c.moveTo(cx + r + 2, cy - bLen); c.lineTo(cx + r + 4, cy); c.lineTo(cx + r + 2, cy + bLen);
    c.stroke();

    // Center rotating diamond pip
    c.fillStyle = "#ffffff";
    c.save();
    c.translate(cx, cy);
    c.rotate(angle);
    c.fillRect(-2, -2, 4, 4);
    c.restore();

    c.restore();
  };

  // State refs for Multi-Touch Panning, Pinch-to-Zoom & Marquee Selection
  const pointerStartRef = useRef<{ x: number; y: number; time: number; button: number; pointerType: string } | null>(null);
  const cameraStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef<boolean>(false);
  const selectionBoxRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number; active: boolean } | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(1);
  const lastTapRef = useRef<{ time: number; x: number; y: number; unitRole?: RoleType } | null>(null);

  // Mouse & Touch Controls
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.pointerType === "touch") {
      engine.isTouchDevice = true;
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Multi-touch Pinch Gesture Detection
    if (activePointersRef.current.size >= 2) {
      selectionBoxRef.current = null;
      isDraggingRef.current = true;
      const pts: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchZoomRef.current = engine.camera.zoom;
      cameraStartRef.current = { x: engine.camera.x, y: engine.camera.y };
      return;
    }

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const zoom = engine.camera.zoom;
    const worldX = (screenX - rect.width / 2) / zoom + engine.camera.x;
    const worldY = (screenY - rect.height / 2) / zoom + engine.camera.y;

    if (engine.buildMode) {
      engine.hover = { x: Math.floor(worldX / TS), y: Math.floor(worldY / TS) };
    }

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
      button: e.button,
      pointerType: e.pointerType,
    };
    cameraStartRef.current = { x: engine.camera.x, y: engine.camera.y };
    isDraggingRef.current = false;

    // Determine if we should prepare box marquee selection or camera pan:
    // On Touch: by default pan mode is active unless user explicitly switched to "box" mode
    const isTouch = e.pointerType === "touch";
    const allowBoxMarquee = isTouch ? engine.touchMode === "box" : e.button === 0;

    if (allowBoxMarquee && !engine.buildMode) {
      selectionBoxRef.current = { startX: screenX, startY: screenY, currentX: screenX, currentY: screenY, active: false };
    } else {
      selectionBoxRef.current = null;
    }

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // 1. Two-finger Pinch to Zoom & Pan
    if (activePointersRef.current.size >= 2) {
      const pts: { x: number; y: number }[] = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (initialPinchDistRef.current && initialPinchDistRef.current > 10) {
        const factor = currentDist / initialPinchDistRef.current;
        const newZoom = Math.max(0.4, Math.min(2.5, initialPinchZoomRef.current * factor));
        engine.camera.zoom = newZoom;
      }
      return;
    }

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const zoom = engine.camera.zoom;
    const worldX = (screenX - rect.width / 2) / zoom + engine.camera.x;
    const worldY = (screenY - rect.height / 2) / zoom + engine.camera.y;

    engine.hover = { x: Math.floor(worldX / TS), y: Math.floor(worldY / TS) };

    // 2. Single Finger / Mouse Dragging
    if (pointerStartRef.current) {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      const dist = Math.hypot(dx, dy);
      const isTouch = pointerStartRef.current.pointerType === "touch";

      // If in marquee box selection mode:
      if (selectionBoxRef.current && (isTouch ? engine.touchMode === "box" : pointerStartRef.current.button === 0) && !engine.buildMode) {
        if (dist > 8) {
          selectionBoxRef.current.active = true;
          selectionBoxRef.current.currentX = screenX;
          selectionBoxRef.current.currentY = screenY;
        }
      } else {
        // Otherwise: Camera Panning (Default on touch, or middle/right mouse drag)
        // On touch: allow micro-movements up to 22px (or 28px in build mode) without turning into camera drag!
        const dragThreshold = isTouch ? (engine.buildMode ? 28 : 20) : 6;
        if (!isDraggingRef.current && dist > dragThreshold) {
          isDraggingRef.current = true;
        }

        if (isDraggingRef.current) {
          const newX = cameraStartRef.current.x - dx / zoom;
          const newY = cameraStartRef.current.y - dy / zoom;
          engine.camera.x = Math.max(0, Math.min(COLS * TS, newX));
          engine.camera.y = Math.max(0, Math.min(ROWS * TS, newY));
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    const start = pointerStartRef.current;
    pointerStartRef.current = null;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (!rect || !start) return;

    const zoom = engine.camera.zoom;

    // Check if marquee box selection was actively dragged
    if (selectionBoxRef.current?.active) {
      const b = selectionBoxRef.current;
      selectionBoxRef.current = null;

      const minSX = Math.min(b.startX, b.currentX);
      const maxSX = Math.max(b.startX, b.currentX);
      const minSY = Math.min(b.startY, b.currentY);
      const maxSY = Math.max(b.startY, b.currentY);

      // Convert selection bounds to world space
      const minWX = (minSX - rect.width / 2) / zoom + engine.camera.x;
      const maxWX = (maxSX - rect.width / 2) / zoom + engine.camera.x;
      const minWY = (minSY - rect.height / 2) / zoom + engine.camera.y;
      const maxWY = (maxSY - rect.height / 2) / zoom + engine.camera.y;

      const enclosedUnits = engine.units.filter((u) => {
        if (u.state === "death") return false;
        const ux = (u.x + 0.5) * TS;
        const uy = (u.y + 0.5) * TS;
        return ux >= minWX && ux <= maxWX && uy >= minWY && uy <= maxWY;
      });

      if (enclosedUnits.length > 0) {
        engine.selectMultipleUnits(enclosedUnits.map((u) => u.id));
      }
      return;
    }
    selectionBoxRef.current = null;

    // If camera was dragged, ignore click/tap triggers
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = (screenX - rect.width / 2) / zoom + engine.camera.x;
    const worldY = (screenY - rect.height / 2) / zoom + engine.camera.y;

    const tileX = Math.floor(worldX / TS);
    const tileY = Math.floor(worldY / TS);
    const clickWorldTileX = worldX / TS;
    const clickWorldTileY = worldY / TS;

    // -------------------------------------------------------------
    // PRIORITY 1: BUILD MODE PLACEMENT (Must ALWAYS take precedence over unit commands!)
    // -------------------------------------------------------------
    if (engine.buildMode) {
      engine.hover = { x: tileX, y: tileY };
      engine.placeBuilding(engine.buildMode, tileX, tileY);
      return;
    }

    const isTouch = start.pointerType === "touch";
    const hasUnitsSelected = engine.selectedUnitIds.length > 0;
    const hasHeroSelected = engine.selected?.kind === "hero" && !!engine.selectedHeroRole;

    // Check Boss or Enemy with generous hit radius
    let hitEnemy: any = null;
    if (engine.boss && engine.boss.state !== "death") {
      if (Math.hypot(engine.boss.x - clickWorldTileX, engine.boss.y - clickWorldTileY) <= 1.8) {
        hitEnemy = engine.boss;
      }
    }
    if (!hitEnemy) {
      hitEnemy = engine.enemies.find(
        (en) => en.state !== "death" && Math.hypot(en.x - clickWorldTileX, en.y - clickWorldTileY) <= 1.3
      );
    }

    const hitNode = engine.nodes.find((n) => n.x === tileX && n.y === tileY && n.amount > 0);
    const hitB = engine.buildings.find((b) => tileX >= b.x && tileX < b.x + b.w && tileY >= b.y && tileY < b.y + b.h);

    // -------------------------------------------------------------
    // CONTEXTUAL ORDERS: Right Click (Desktop) OR Tap with Units Selected (Mobile)
    // -------------------------------------------------------------
    const isRightClick = e.button === 2;
    const isMobileCommandTap = isTouch && (hasUnitsSelected || hasHeroSelected);

    if (isRightClick || isMobileCommandTap) {
      // 1. Attack Enemy or Boss
      if (hitEnemy) {
        if (hasUnitsSelected) {
          engine.commandSelectedUnits({ kind: "enemy", id: hitEnemy.id, x: Math.round(hitEnemy.x), y: Math.round(hitEnemy.y) });
          return;
        } else if (hasHeroSelected) {
          engine.commandHeroAttack(hitEnemy);
          return;
        }
      }

      // 2. Interact with Building (Construct / Repair)
      if (hitB) {
        if (hasUnitsSelected) {
          engine.commandSelectedUnits({ kind: "building", id: hitB.id, x: tileX, y: tileY });
          return;
        }
      }

      // 3. Harvest Resource Node
      if (hitNode) {
        if (hasUnitsSelected) {
          engine.commandSelectedUnits({ kind: "node", id: hitNode.id, x: tileX, y: tileY });
          return;
        }
      }

      // 4. Move to Ground Position
      if (engine.inBounds(tileX, tileY)) {
        if (hasUnitsSelected) {
          engine.commandSelectedUnits({ kind: "ground", x: tileX, y: tileY });
          return;
        } else if (hasHeroSelected) {
          engine.commandHeroMove(tileX, tileY);
          return;
        }
      }
      return;
    }

    // -------------------------------------------------------------
    // LEFT CLICK / DIRECT SELECTION & INTERACTION (Desktop & Mobile)
    // -------------------------------------------------------------

    // 1. Check Click on Hero or Golem (Direct Selection)
    for (const [role, rawHero] of Object.entries(engine.altarHeroes)) {
      const hero = rawHero as any;
      if (hero && hero.hp > 0 && Math.hypot((hero.x + 0.5) * TS - worldX, (hero.y + 0.5) * TS - worldY) < 26) {
        engine.select("hero", 1, role as any);
        return;
      }
    }
    if (engine.golem && engine.golem.hp > 0 && Math.hypot((engine.golem.x + 0.5) * TS - worldX, (engine.golem.y + 0.5) * TS - worldY) < 30) {
      engine.select("hero", -1, "golem");
      return;
    }

    // 2. Check Click on Unit (Direct Selection / Double Tap for Whole Group)
    const hitUnit = engine.units.find(
      (u) => u.state !== "death" && Math.hypot((u.x + 0.5) * TS - worldX, (u.y + 0.5) * TS - worldY) < 24
    );
    if (hitUnit) {
      const now = Date.now();
      const isDoubleTap =
        lastTapRef.current &&
        now - lastTapRef.current.time < 380 &&
        lastTapRef.current.unitRole === hitUnit.role;

      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY, unitRole: hitUnit.role };

      if (isDoubleTap) {
        // Double-tap selects all units of the same role across the screen!
        engine.selectRoleGroup(hitUnit.role);
        return;
      }

      if (e.shiftKey) {
        if (engine.selectedUnitIds.includes(hitUnit.id)) {
          engine.selectedUnitIds = engine.selectedUnitIds.filter((id) => id !== hitUnit.id);
          if (engine.selected?.id === hitUnit.id) {
            engine.selected = engine.selectedUnitIds.length > 0 ? { kind: "unit", id: engine.selectedUnitIds[0] } : null;
          }
        } else {
          engine.selectedUnitIds.push(hitUnit.id);
          engine.selected = { kind: "unit", id: hitUnit.id };
          hitUnit.clickSquish = 1.0;
        }

        if (engine.selectedUnitIds.length > 1) {
          engine.squadChant();
        } else if (engine.selectedUnitIds.length === 1) {
          engine.sayLine(hitUnit, "onClick", engine.lang);
        }
      } else {
        engine.select("unit", hitUnit.id);
      }
      return;
    }

    // 3. Check Click on Building (Select Town Hall, Farm, Barracks, Altar, etc.)
    if (hitB) {
      engine.select("building", hitB.id);
      return;
    }

    // 4. Click on Enemy / Node (Highlight / Inspect)
    if (hitEnemy) {
      engine.addClickMarker(hitEnemy.x, hitEnemy.y, "#ef5350");
      return;
    }
    if (hitNode) {
      engine.addClickMarker(hitNode.x, hitNode.y, "#ffd56b");
      return;
    }

    // 5. Click on Empty Ground / Terrain -> Deselect
    engine.select(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    engine.camera.zoom = Math.max(0.4, Math.min(2.5, engine.camera.zoom * zoomFactor));
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-[#020103] overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
        isDraggingRef.current = false;
      }}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
