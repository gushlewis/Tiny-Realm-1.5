/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GamePhase,
  RoleType,
  BuildingType,
  NodeType,
  ResourceType,
  Resources,
  Unit,
  Building,
  ResourceNode,
  Enemy,
  EnemySpecies,
  GolemUnit,
  AltarHero,
  AltarHeroRole,
  HeroUnit,
  Arrow,
  Particle,
  FloatingText,
  GameStats,
  Position,
  BossVariant,
  Language,
  BiomeType,
  CreepCamp,
  FountainOfLife,
  EnemyHive,
  RelicItem,
  ShockwaveEffect,
} from "../types/game";
import { sound, haptic } from "./audio";
import { getRandomDialogue } from "./dialogues";
import { CAMPAIGN_CHAPTERS, loadCampaignProgress, saveCampaignProgress } from "./campaign";
import { computeRunScore, RunScoreStats, ScoreBreakdown } from "./score";
import { funtico } from "../funtico";
import { lifecycle } from "../funtico/lifecycle";

export const TS = 32;
export const COLS = 64;
export const ROWS = 64;
export const CANVAS_SIZE = TS * COLS;
export const ART_TS = 28;
export const ART_R = TS / ART_TS;

export const BALANCE = {
  cycle: { build: 90, wave: 30, total: 120, bossEvery: 10 },
  firstHorde: { count: 3, hp: 16, damage: 1, attackRate: 1.35, speed: 0.95 },
  horde: {
    countPerWave: 1.2,
    hpPerWave: 4.5,
    damageStep: 0.35,
    eliteHpMultiplier: 1.6,
    eliteDamageBonus: 0.5,
    speedPerWave: 0.035,
    speedCap: 1.35,
    packetGap: 7,
    packetSize: 3,
    eliteEvery: 3,
  },
  boss: { hp: 300, damage: 4.5, attackRate: 1.1, speed: 0.85, hpPerWave: 90, damagePerWave: 0.5 },
  reward: { wood: 35, stone: 20, gold: 12, crystal: 30 },
  killCrystal: { base: 0.06, elite: 0.25, centipede: 0.1, ladybug: 0.04, stinkbug: 0.08, scarab: 0.09, mantis: 0.08 },
  bossCrystal: 25,
  altar: { arrowDamage: 10, arrowRate: 1.5, range: 5.2 },
  golem: { cost: 100, maxHp: 380, damage: 14, speed: 1.45, aoeRadius: 1.6, attackRate: 1.2, duration: 120 },
  altarHeroMaxLevel: 5,
  hero: {
    name: "Hero of the Realm",
    color: "#ffd56b",
    cost: { gold: 45, crystal: 30 },
    hp: 420,
    damage: 20,
    speed: 1.45,
    attackRate: 0.85,
    range: 1.6,
    specialCd: 8.5,
    specialDamage: 65,
  },
  altarHeroes: {
    hero: { name: "Hero of the Realm", color: "#ffd56b", cost: { gold: 45, crystal: 30 }, hp: 420, damage: 20, speed: 1.45, attackRate: 0.85, range: 1.6, duration: Infinity, specialCd: 8.5 },
    frontline: { name: "Hero of the Realm", color: "#ffd56b", cost: { gold: 45, crystal: 30 }, hp: 420, damage: 20, speed: 1.45, attackRate: 0.85, range: 1.6, duration: Infinity, specialCd: 8.5 },
    ranger: { name: "Hero of the Realm", color: "#ffd56b", cost: { gold: 45, crystal: 30 }, hp: 420, damage: 20, speed: 1.45, attackRate: 0.85, range: 1.6, duration: Infinity, specialCd: 8.5 },
    mage: { name: "Hero of the Realm", color: "#ffd56b", cost: { gold: 45, crystal: 30 }, hp: 420, damage: 20, speed: 1.45, attackRate: 0.85, range: 1.6, duration: Infinity, specialCd: 8.5 },
  },
  repair: { hpPerTick: 7, tick: 1, woodPerTick: 1, stoneEveryTicks: 3 },
  townHall: {
    1: { name: "Camp", hp: 350, arrowDamage: 8, arrowRate: 0.8, range: 7.0, pop: 6 },
    2: { name: "Hold", hp: 480, arrowDamage: 10, arrowRate: 0.8, range: 7.6, pop: 10 },
    3: { name: "Bastion", hp: 650, arrowDamage: 14, arrowRate: 0.75, range: 8.4, pop: 15 },
  },
  upgrades: {
    2: { waves: 1, towers: 1, barracks: 1, palisades: 0, cost: { wood: 160, stone: 90, gold: 30 }, boost: 0.12 },
    3: { waves: 3, towers: 2, barracks: 0, palisades: 6, cost: { wood: 280, stone: 170, gold: 80 }, boost: 0.18 },
  },
  recruit: { wood: 25, food: 50, cooldown: 8 },
  roles: {
    builder: { label: "Builder", icon: "👷", cost: { wood: 20, food: 30 }, cooldown: 5 },
    woodcutter: { label: "Woodcutter", icon: "🪓", cost: { wood: 15, food: 30 }, cooldown: 5 },
    stoneMiner: { label: "Stone Miner", icon: "⛏", cost: { wood: 15, food: 30 }, cooldown: 5 },
    goldMiner: { label: "Gold Miner", icon: "💰", cost: { wood: 25, food: 40 }, cooldown: 6 },
    farmer: { label: "Farmer", icon: "🌾", cost: { wood: 20, food: 35 }, cooldown: 5 },
    warrior: { label: "Warrior", icon: "⚔", cost: { gold: 10, food: 30 }, cooldown: 6 },
    javelin: { label: "Javelin", icon: "🔱", cost: { gold: 16, food: 22 }, cooldown: 7 },
    scout: { label: "Scout", icon: "🗡️", cost: { wood: 20, food: 25 }, cooldown: 5 },
  },
  warrior: { gold: 10, food: 30, cooldown: 6 },
  javelin: { gold: 16, food: 22, cooldown: 7, damage: 6.5, attackRate: 1.05, range: 4.8 },
  scout: { wood: 20, food: 25, cooldown: 5, damage: 5.2, attackRate: 0.42, critChance: 0.45 },
  heroes: {
    necromancer: { name: "Necromancer", color: "#9c6cc8", duration: 40, ability: "revive" as const, rate: 7, count: 3, hp: 130, damage: 0, speed: 1.6 },
    captain: { name: "Captain", color: "#e8a040", duration: 50, ability: "buff" as const, damageMul: 1.25, speedMul: 1.2, radius: 5.5, hp: 200, damage: 10, speed: 2.1 },
    cleric: { name: "Cleric", color: "#6ec8d4", duration: 40, ability: "healDebuff" as const, healRate: 4.5, healAmount: 22, debuff: 0.85, debuffRadius: 5.5, hp: 150, damage: 0, speed: 1.9 },
  },
};

export const BUILD_SPECS: Record<string, { label: string; w: number; h: number; hp: number; time: number; cost: Partial<Record<ResourceType, number>> }> = {
  house: { label: "House", w: 1, h: 1, hp: 90, time: 6, cost: { wood: 50, stone: 20 } },
  farm: { label: "Farm", w: 2, h: 2, hp: 110, time: 8, cost: { wood: 40, stone: 20 } },
  lumber: { label: "Lumber Camp", w: 2, h: 2, hp: 110, time: 7, cost: { wood: 30, stone: 10 } },
  quarry: { label: "Quarry", w: 2, h: 2, hp: 125, time: 7, cost: { wood: 30, stone: 15 } },
  tower: { label: "Watchtower", w: 1, h: 1, hp: 140, time: 10, cost: { wood: 60, stone: 40, gold: 10 } },
  barracks: { label: "Barracks", w: 2, h: 2, hp: 190, time: 12, cost: { wood: 90, stone: 45, gold: 20 } },
  palisade: { label: "Palisade", w: 1, h: 1, hp: 80, time: 5, cost: { wood: 15, stone: 5 } },
  gate: { label: "Wall Gate", w: 1, h: 1, hp: 130, time: 6, cost: { wood: 25, stone: 15 } },
  altar: { label: "Altar", w: 2, h: 2, hp: 160, time: 16, cost: { wood: 70, stone: 70, gold: 50 } },
};

export const ROLE_INFO: Record<RoleType, { label: string; hat: string }> = {
  trainee: { label: "Trainee", hat: "#9c9382" },
  builder: { label: "Builder", hat: "#a9803a" },
  woodcutter: { label: "Woodcutter", hat: "#2f6b45" },
  stoneMiner: { label: "Stone Miner", hat: "#787c82" },
  goldMiner: { label: "Gold Miner", hat: "#a9691f" },
  farmer: { label: "Farmer", hat: "#7a5a34" },
  warrior: { label: "Warrior", hat: "#7a828a" },
  javelin: { label: "Javelin", hat: "#3d5a8c" },
  scout: { label: "Scout", hat: "#2b4a58" },
};

export const NODE_ROLE: Record<NodeType, RoleType> = {
  tree: "woodcutter",
  rock: "stoneMiner",
  ore: "goldMiner",
  field: "farmer",
};

export const NODE_RES: Record<NodeType, ResourceType> = {
  tree: "wood",
  rock: "stone",
  ore: "gold",
  field: "food",
};

export const RES_COLORS: Record<ResourceType, string> = {
  wood: "#d8994b",
  stone: "#d2d7d7",
  gold: "#ffd56b",
  food: "#9bd76b",
  crystal: "#73d9ff",
};

const SPECIES_MODS = {
  ant: { hp: 1, dmg: 1, spd: 1 },
  ladybug: { hp: 0.7, dmg: 0.8, spd: 1.35 },
  stinkbug: { hp: 1.45, dmg: 1.1, spd: 0.8 },
  centipede: { hp: 1.25, dmg: 1.3, spd: 1.1 },
  scarab: { hp: 1.6, dmg: 1.05, spd: 0.75 },
  mantis: { hp: 0.8, dmg: 1.4, spd: 1.3 },
};

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameEngine {
  public rng: () => number = mulberry32(Date.now());
  public screen: "menu" | "play" | "defeat" = "menu";
  public onScreenChange?: (screen: "menu" | "play" | "defeat") => void;

  public gameMode: "survival" | "campaign" = "survival";
  public activeChapter: number = 1;
  public campaignVictory: boolean = false;
  public onCampaignVictory?: (chapterId: number, stars: number) => void;

  public setScreen(screen: "menu" | "play" | "defeat") {
    this.screen = screen;
    if (this.onScreenChange) {
      this.onScreenChange(screen);
    }
  }
  public paused: boolean = false;
  public speed: number = 1;
  public time: number = 0;
  public phase: GamePhase = "Build";
  public waveNumber: number = 1;
  public phaseRemain: number = 90;
  public prevPhase: GamePhase = "Build";

  public resources: Resources = { wood: 260, stone: 150, gold: 70, food: 120, crystal: 0 };
  public resDisplay: Resources = { wood: 260, stone: 150, gold: 70, food: 120, crystal: 0 };

  public terrain: string[][] = [];
  public explored: boolean[][] = [];
  public visible: boolean[][] = [];

  public nodes: ResourceNode[] = [];
  public buildings: Building[] = [];
  public units: Unit[] = [];
  public enemies: Enemy[] = [];
  public boss: Enemy | null = null;
  public chest: { id: number; x: number; y: number; anim: number } | null = null;
  public hero: HeroUnit | null = null;
  public golem: GolemUnit | null = null;
  public golemMound: Position | null = null;
  public heroUnit: AltarHero | null = null;
  public altarHeroes: Record<string, AltarHero | null> = { hero: null, frontline: null, ranger: null, mage: null };

  public biome: BiomeType = "forest";
  public creepCamps: CreepCamp[] = [];
  public fountainOfLife: FountainOfLife | null = null;
  public enemyHives: EnemyHive[] = [];
  public relics: RelicItem[] = [];

  public heroCommanderLevel: number = 1;
  public heroCommanderXp: number = 0;
  public heroCommanderNextXp: number = 100;
  public abilityHolyStrikeCd: number = 0;
  public abilityWarCryCd: number = 0;
  public abilityHolyLightCd: number = 0;
  public warCryBuffTimer: number = 0;

  public arrows: Arrow[] = [];
  public particles: Particle[] = [];
  public shockwaves: ShockwaveEffect[] = [];
  public floats: FloatingText[] = [];
  public fireflies: Array<{ x: number; y: number; p: number; s: number; r: number }> = [];

  public selected: { kind: "unit" | "building" | "hero" | "enemy"; id: number } | null = null;
  public selectedUnitIds: number[] = [];
  public selectedHeroRole: AltarHeroRole | "golem" | null = null;
  public buildMode: BuildingType | null = null;
  public hover: Position | null = null;

  public recruitCd: number = 0;
  public exploreCd: number = 0;
  public foodClock: number = 0;
  public visionClock: number = 0;

  public banner: { text: string; time: number; color: string } = { text: "", time: 0, color: "#f4c97a" };
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public combo: { text: string; time: number; color: string } = { text: "", time: 0, color: "#fff" };

  public horde: { wave: number; count: number; spawned: number; timer: number; edge: string; cleared: boolean; eliteSpawned: boolean } | null = null;
  public edge: "north" | "east" | "south" | "west" | null = null;
  public wavesSurvived: number = 0;
  public lastWaveCleared: number = 0;
  public lastWarnedWave: number = 0;
  public bestWave: number = 0;
  public bestScore: number = 0;

  public camera = { x: (COLS * TS) / 2, y: (ROWS * TS) / 2, zoom: 1 };
  public touchMode: "pan" | "box" = "pan";
  public isTouchDevice: boolean = false;
  public shake = { power: 0, time: 0, total: 0 };
  public hitstop: number = 0;
  public clickMarker: { x: number; y: number; color: string; time: number; max: number } | null = null;
  public lang: Language = "pt";

  public stats: GameStats = { kills: 0, eliteKills: 0, bossKills: 0, crystalSpent: 0, hallDamageTaken: 0 };
  public objectives = { farm: false, recruit: false, house: false, wave: false };
  public logs: string[] = [];

  private nextId = { node: 0, building: 0, unit: 0, enemy: 0, arrow: 0, hero: 0, golem: 0, altarHero: 0, float: 0 };

  constructor() {
    this.loadBestScores();
    this.initMap();
  }

  private loadBestScores() {
    try {
      this.bestWave = parseInt(localStorage.getItem("tinyRealmBestWave_v2") || "0", 10) || 0;
      this.bestScore = parseInt(localStorage.getItem("tinyRealmBestScore_v2") || "0", 10) || 0;
    } catch {
      this.bestWave = 0;
      this.bestScore = 0;
    }
  }

  public initMap(biome: BiomeType = this.biome || "forest") {
    this.biome = biome;
    this.rng = mulberry32(Date.now());
    this.terrain = Array.from({ length: ROWS }, () => Array(COLS).fill("grass"));
    this.explored = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    this.visible = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

    // Base ground style customized per biome
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const h = this.hash(x, y);
        if (biome === "forest") {
          this.terrain[y][x] = h % 47 === 0 ? "water" : h % 11 === 0 ? "grass2" : "grass";
        } else if (biome === "barrens") {
          this.terrain[y][x] = h % 53 === 0 ? "water" : h % 7 === 0 ? "dirt" : "grass";
        } else if (biome === "tundra") {
          this.terrain[y][x] = h % 41 === 0 ? "water" : h % 9 === 0 ? "grass2" : "grass";
        } else if (biome === "swamp") {
          this.terrain[y][x] = h % 37 === 0 ? "water" : h % 8 === 0 ? "dirt" : "grass";
        } else if (biome === "volcano") {
          this.terrain[y][x] = h % 39 === 0 ? "water" : h % 9 === 0 ? "dirt" : "grass";
        }
      }
    }

    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);

    // Center town area plaza
    for (let y = cy - 6; y <= cy + 7; y++) {
      for (let x = cx - 6; x <= cx + 7; x++) {
        if (Math.hypot(x - cx, y - cy) < 7.5 && this.inBounds(x, y)) {
          this.terrain[y][x] = "dirt";
        }
      }
    }

    this.buildings = [];
    this.nodes = [];
    this.units = [];
    this.enemies = [];
    this.boss = null;
    this.hero = null;
    this.golem = null;
    this.heroUnit = null;
    this.altarHeroes = { hero: null, frontline: null, ranger: null, mage: null };
    this.creepCamps = [];
    this.enemyHives = [];
    this.fountainOfLife = null;
    this.relics = [];

    // Town Hall in center
    this.addBuilding({
      type: "townhall",
      x: cx - 1,
      y: cy - 1,
      w: 2,
      h: 2,
      tier: 1,
      hp: 350,
      maxHp: 350,
      complete: true,
      progress: 0,
      buildTime: 0,
      builderId: null,
      repairerId: null,
      arrowCd: 0.2,
      trainCd: 0,
    });

    // Starting resource clusters around center
    this.placeCluster("tree", cx - 9, cy - 4, 7);
    this.placeCluster("rock", cx + 8, cy - 3, 5);
    this.placeCluster("ore", cx + 6, cy + 8, 4);
    this.placeCluster("field", cx - 5, cy + 8, 4);

    // Warcraft-style Secondary Expansion Sector (Gold Mine Outpost) at Northeast
    const expX = cx + 18;
    const expY = cy - 16;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (this.inBounds(expX + dx, expY + dy) && Math.hypot(dx, dy) < 3.2) {
          this.terrain[expY + dy][expX + dx] = "dirt";
        }
      }
    }
    this.placeCluster("ore", expX, expY - 1, 5); // Rich Gold Vein
    this.placeCluster("rock", expX + 4, expY + 2, 4);
    this.placeCluster("tree", expX - 4, expY - 3, 6);

    // Spread clusters across the full expanded 64x64 map
    for (let i = 0; i < 24; i++) this.randomCluster("tree", 4, 7);
    for (let i = 0; i < 16; i++) this.randomCluster("rock", 3, 5);
    for (let i = 0; i < 12; i++) this.randomCluster("ore", 2, 4);
    for (let i = 0; i < 10; i++) this.randomCluster("field", 2, 4);

    this.golemMound = this.findMoundSpot();

    // Sacred Fountain of Life at South glade
    const fX = cx;
    const fY = cy + 18;
    if (this.inBounds(fX, fY)) {
      this.fountainOfLife = {
        x: fX,
        y: fY,
        radius: 4.5,
        healingRate: 14,
      };
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (this.inBounds(fX + dx, fY + dy)) {
            this.terrain[fY + dy][fX + dx] = "grass2";
          }
        }
      }
    }

    // 3 Strategic Neutral Creep Camps across the broad map
    this.setupCreepCamps(cx, cy, biome);

    // Enemy Hives (Present in Chapter 4, 5, or hostile swamp/volcano areas)
    if (this.activeChapter >= 4 || biome === "swamp" || biome === "volcano") {
      this.setupEnemyHives(cx, cy, biome);
    }

    // Initial builders
    this.addUnit(cx - 2, cy + 2, "builder");
    this.addUnit(cx + 2, cy + 2, "builder");

    this.camera.x = cx * TS;
    this.camera.y = cy * TS;

    this.updateVision();
  }

  public setupCreepCamps(cx: number, cy: number, biome: BiomeType) {
    const campSpots = [
      {
        id: 1,
        x: cx - 18,
        y: cy - 16,
        name: {
          pt: biome === "barrens" ? "Covil dos Escorpiões das Areias" : biome === "tundra" ? "Ninho das Aranhas de Gelo" : "Ninho das Aranhas da Floresta",
          en: biome === "barrens" ? "Sand Scorpion Den" : biome === "tundra" ? "Frost Spider Den" : "Forest Spider Nest",
        },
        relic: {
          id: "crown_of_kings",
          name: { pt: "👑 Coroa de Lordaeron", en: "👑 Crown of Lordaeron" },
          desc: { pt: "+20% Dano de Ataque para todo o reino!", en: "+20% Attack Damage for all forces!" },
          icon: "👑",
          effect: "damage" as const,
        },
        species: (biome === "barrens" ? "scarab" : biome === "tundra" ? "centipede" : "ant") as EnemySpecies,
      },
      {
        id: 2,
        x: cx + 18,
        y: cy + 16,
        name: {
          pt: biome === "volcano" ? "Acampamento dos Renegados de Cinzas" : "Acampamento dos Insetos Renegados",
          en: biome === "volcano" ? "Ash Renegade Outpost" : "Renegade Insect Encampment",
        },
        relic: {
          id: "boots_of_wind",
          name: { pt: "🥾 Botas da Tempestade", en: "🥾 Boots of the Storm" },
          desc: { pt: "+25% Velocidade de Movimento para unidades!", en: "+25% Movement Speed for all units!" },
          icon: "🥾",
          effect: "speed" as const,
        },
        species: (biome === "volcano" ? "mantis" : "ladybug") as EnemySpecies,
      },
      {
        id: 3,
        x: cx - 17,
        y: cy + 17,
        name: {
          pt: biome === "swamp" ? "Covil das Larvas Putrefatas" : "Guardiões Ancestrais de Pedra",
          en: biome === "swamp" ? "Putrid Larva Lair" : "Ancient Stone Guardians",
        },
        relic: {
          id: "shield_of_kings",
          name: { pt: "🛡️ Escudo dos Reis", en: "🛡️ Shield of Kings" },
          desc: { pt: "+25% Vida Máxima para todas as unidades!", en: "+25% Max HP for all friendly forces!" },
          icon: "🛡️",
          effect: "health" as const,
        },
        species: "stinkbug" as EnemySpecies,
      },
    ];

    campSpots.forEach((spot) => {
      const camp: CreepCamp = {
        id: spot.id,
        name: spot.name,
        x: spot.x,
        y: spot.y,
        cleared: false,
        rewardClaimed: false,
        reward: {
          wood: 60,
          stone: 40,
          gold: 30,
          crystal: 25,
          relic: spot.relic,
        },
        creepCount: 3,
        totalCreeps: 3,
      };
      this.creepCamps.push(camp);

      // Spawn neutral creeps around the camp
      for (let i = 0; i < 3; i++) {
        const ox = Math.round(Math.cos((i * Math.PI * 2) / 3) * 1.6);
        const oy = Math.round(Math.sin((i * Math.PI * 2) / 3) * 1.6);
        const e: Enemy = {
          id: ++this.nextId.enemy,
          kind: i === 0 ? "elite" : "raider",
          species: spot.species,
          x: spot.x + ox,
          y: spot.y + oy,
          hp: i === 0 ? 55 : 30,
          maxHp: i === 0 ? 55 : 30,
          damage: i === 0 ? 3.5 : 2.0,
          attackRate: 1.2,
          speed: 0.9,
          state: "walk",
          path: [],
          target: null,
          pathClock: 0,
          attackCd: 0,
          contactCd: 0,
          anim: 0,
          flash: 0,
          death: 0,
        };
        (e as any).campId = camp.id;
        this.enemies.push(e);
      }
    });
  }

  public setupEnemyHives(cx: number, cy: number, _biome: BiomeType) {
    const hiveSpots = [
      {
        id: 1,
        x: cx + 22,
        y: cy - 20,
        name: { pt: "Ninho do Enxame do Norte", en: "North Swarm Hive" },
        species: "centipede" as EnemySpecies,
      },
      {
        id: 2,
        x: cx - 22,
        y: cy - 20,
        name: { pt: "Ziggurate das Sombras", en: "Shadow Ziggurat" },
        species: "mantis" as EnemySpecies,
      },
    ];

    hiveSpots.forEach((spot) => {
      this.enemyHives.push({
        id: spot.id,
        name: spot.name,
        x: spot.x,
        y: spot.y,
        hp: 350,
        maxHp: 350,
        destroyed: false,
        species: spot.species,
        flash: 0,
      });
    });
  }

  public newGame(play: boolean) {
    this.gameMode = "survival";
    this.biome = "forest";
    this.campaignVictory = false;
    this.setScreen(play ? "play" : "menu");
    this.paused = false;
    this.speed = 1;
    this.time = 0;
    this.phase = "Build";
    this.waveNumber = 1;
    this.phaseRemain = 90;
    this.prevPhase = "Build";
    this.resources = { wood: 260, stone: 150, gold: 70, food: 120, crystal: 0 };
    this.resDisplay = { ...this.resources };
    this.wavesSurvived = 0;
    this.lastWaveCleared = 0;
    this.lastWarnedWave = 0;
    this.stats = { kills: 0, eliteKills: 0, bossKills: 0, crystalSpent: 0, hallDamageTaken: 0 };
    this.objectives = { farm: false, recruit: false, house: false, wave: false };
    this.logs = [];

    this.initMap(this.biome);
    this.log("Build 90s. Survive 30s. Face a sovereign insect boss every 10th wave.");
    this.log("Select the Town Hall to recruit villagers. Build a Farm to sustain food.");
    this.setBanner("Build 90s · Survive 30s · Defend against the swarm!", 4, "#f4c97a");
  }

  public startCampaignMission(chapterId: number) {
    const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId) || CAMPAIGN_CHAPTERS[0];
    this.gameMode = "campaign";
    this.activeChapter = chapter.id;
    this.biome = chapter.biome || "forest";
    this.campaignVictory = false;
    this.setScreen("play");
    this.paused = false;
    this.speed = 1;
    this.time = 0;
    this.phase = "Build";
    this.waveNumber = 1;
    this.phaseRemain = 90;
    this.prevPhase = "Build";
    this.resources = { ...chapter.startResources };
    this.resDisplay = { ...chapter.startResources };
    this.wavesSurvived = 0;
    this.lastWaveCleared = 0;
    this.lastWarnedWave = 0;
    this.stats = { kills: 0, eliteKills: 0, bossKills: 0, crystalSpent: 0, hallDamageTaken: 0 };
    this.objectives = { farm: false, recruit: false, house: false, wave: false };
    this.logs = [];

    this.initMap(this.biome);

    // In campaign mode, configure starting units based on chapter definition
    if (chapter.initialUnits && chapter.initialUnits.length > 0) {
      this.units = [];
      const c = this.castle();
      const cx = c ? c.x + 1 : Math.floor(COLS / 2);
      const cy = c ? c.y + 1 : Math.floor(ROWS / 2);
      chapter.initialUnits.forEach((role, idx) => {
        const angle = (idx / chapter.initialUnits.length) * Math.PI * 2;
        const ox = Math.round(Math.cos(angle) * 2.2);
        const oy = Math.round(Math.sin(angle) * 2.2);
        this.addUnit(cx + ox, cy + oy, role);
      });
    }

    this.updateVision();
    const title = chapter.title[this.lang || "pt"];
    this.setBanner(`👑 ${title}`, 5, "#ffd56b");
    this.log(this.lang === "pt" ? `Missão iniciada: ${title}` : `Mission started: ${title}`);
  }

  public checkCampaignObjectives() {
    if (this.gameMode !== "campaign" || this.campaignVictory || this.screen !== "play") return;
    const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === this.activeChapter);
    if (!chapter) return;

    // In Chapter 5: trigger the Sovereign Spider Queen on wave 2 so players engage the climactic boss!
    if (chapter.id === 5 && this.waveNumber >= 2 && !this.boss && this.stats.bossKills === 0) {
      if (this.phase === "Wave" || this.phase === "Boss Wave") {
        this.beginBossWave();
      }
    }

    // Check all primary objectives
    const allPrimaryMet = chapter.primaryObjectives.every((obj) => obj.isCompleted(this));
    if (allPrimaryMet) {
      // Calculate stars: 1 star for primary + 1 star for each secondary completed
      let stars = 1;
      chapter.secondaryObjectives.forEach((sec) => {
        if (sec.isCompleted(this)) {
          stars++;
        }
      });
      stars = Math.min(3, Math.max(1, stars));
      this.triggerCampaignVictory(stars);
    }
  }

  public triggerCampaignVictory(stars: number) {
    if (this.campaignVictory) return;
    this.campaignVictory = true;
    sound.stopBossMusic();
    sound.playSfx("chest");
    sound.playSfx("upgrade");

    // Save campaign progress
    const progress = loadCampaignProgress();
    const existing = progress.chapters[this.activeChapter] || { completed: false, stars: 0, highScore: 0 };
    progress.chapters[this.activeChapter] = {
      completed: true,
      stars: Math.max(existing.stars || 0, stars),
      highScore: Math.max(existing.highScore || 0, this.computeScore()),
      clearedAt: new Date().toISOString(),
    };
    if (progress.unlockedChapter <= this.activeChapter && this.activeChapter < 5) {
      progress.unlockedChapter = this.activeChapter + 1;
    }
    saveCampaignProgress(progress);

    this.setBanner(
      this.lang === "pt"
        ? `🏆 VITÓRIA NA MISSÃO! ${stars} ESTRELAS CONQUISTADAS!`
        : `🏆 MISSION VICTORY! ${stars} STARS EARNED!`,
      6,
      "#ffd56b"
    );

    if (this.onCampaignVictory) {
      this.onCampaignVictory(this.activeChapter, stars);
    }
  }

  public hash(x: number, y: number): number {
    let n = ((x * 374761393 + y * 668265263) ^ (x * y * 1274126177)) >>> 0;
    n = (n ^ (n >>> 13)) * 1274126177;
    return (n ^ (n >>> 16)) >>> 0;
  }

  public inBounds(x: number, y: number): boolean {
    return x >= 0 && x < COLS && y >= 0 && y < ROWS;
  }

  public isExplored(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.explored[y][x];
  }

  public isVisible(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.visible[y][x];
  }

  public castle(): Building | undefined {
    return this.buildings.find((b) => b.type === "townhall");
  }

  public centerOnCastle() {
    const c = this.castle();
    if (c) {
      this.camera.x = (c.x + c.w / 2) * TS;
      this.camera.y = (c.y + c.h / 2) * TS;
    } else {
      this.camera.x = (COLS * TS) / 2;
      this.camera.y = (ROWS * TS) / 2;
    }
  }

  public centerOn(x: number, y: number) {
    this.camera.x = (x + 0.5) * TS;
    this.camera.y = (y + 0.5) * TS;
  }

  public getIdleVillagerCount(): number {
    return this.units.filter((u) => u.state === "idle" && u.hp > 0).length;
  }

  public selectNextIdleWorker() {
    const idles = this.units.filter((u) => u.state === "idle" && u.hp > 0);
    if (!idles.length) {
      this.setBanner(
        this.lang === "pt" ? "Nenhum aldeão ocioso no momento!" : "No idle villagers currently!",
        1.5,
        "#73d9ff"
      );
      sound.playSfx("click");
      return;
    }
    const currId = this.selected?.kind === "unit" ? this.selected.id : -1;
    const currIdx = idles.findIndex((u) => u.id === currId);
    const nextUnit = idles[(currIdx + 1) % idles.length];

    this.selected = { kind: "unit", id: nextUnit.id };
    this.selectedUnitIds = [nextUnit.id];
    this.selectedHeroRole = null;
    nextUnit.clickSquish = 1.0;

    this.centerOn(nextUnit.x, nextUnit.y);

    const roleName = this.getRoleName(nextUnit.role);
    const idxLabel = `${((currIdx + 1) % idles.length) + 1}/${idles.length}`;
    this.setBanner(
      this.lang === "pt"
        ? `💤 Aldeão Ocioso: ${roleName} (${idxLabel})`
        : `💤 Idle Villager: ${roleName} (${idxLabel})`,
      1.8,
      "#ffd56b"
    );
    sound.playSfx("select");
    this.sayLine(nextUnit, "onClick", this.lang);
  }

  public sayLine(u: Unit, type: "onClick" | "onCommand" | "onNight" = "onClick", lang: Language = "pt") {
    const line = getRandomDialogue(u.role, type, lang || this.lang || "pt");
    u.speech = {
      text: line,
      time: 2.8,
      maxTime: 2.8,
    };
    sound.playVoice(u.role, Math.min(5, Math.max(2, Math.floor(line.length / 8))));
  }

  public aliveUnits(): Unit[] {
    return this.units.filter((u) => u.state !== "death" && u.hp > 0);
  }

  public completed(type: BuildingType): Building[] {
    return this.buildings.filter((b) => b.type === type && b.complete && !b.upgrading && b.hp > 0);
  }

  public popCap(): number {
    const c = this.castle();
    return BALANCE.townHall[c ? (c.tier as 1 | 2 | 3) : 1].pop + this.completed("house").length * 2;
  }

  public phaseInfo() {
    const C = BALANCE.cycle;
    const t = ((this.time % C.total) + C.total) % C.total;
    const wave = Math.floor(Math.max(0, this.time) / C.total) + 1;
    const isBossWave = wave > 0 && wave % C.bossEvery === 0;
    const peak = isBossWave ? 0.72 : 0.60;

    // Gradual, silky-smooth transitions over 22 seconds using cosine ease
    const duskDuration = 22; // Begins 22s before wave
    const dawnDuration = 18; // Lasts 18s into dawn morning
    let dark = 0;
    let skyMood: "day" | "sunset" | "twilight" | "night" | "dawn" = "day";
    let moodRatio = 0;

    if (t < C.build) {
      const remain = Math.max(0, C.build - t);
      if (t < dawnDuration) {
        // Dawn transition from night darkness into bright morning
        const p = t / dawnDuration;
        const smooth = (1 - Math.cos(p * Math.PI)) / 2;
        dark = peak * (1 - smooth);
        skyMood = "dawn";
        moodRatio = 1 - p;
      } else if (t > C.build - duskDuration) {
        // Sunset / dusk transition from afternoon golden hour into night
        const elapsed = t - (C.build - duskDuration);
        const p = elapsed / duskDuration;
        const smooth = (1 - Math.cos(p * Math.PI)) / 2;
        dark = peak * smooth;
        if (p < 0.5) {
          skyMood = "sunset";
          moodRatio = p * 2;
        } else {
          skyMood = "twilight";
          moodRatio = (p - 0.5) * 2;
        }
      } else {
        dark = 0;
        skyMood = "day";
        moodRatio = 0;
      }
      return { name: "Build" as const, remain, dark, isBossWave, wave, skyMood, moodRatio };
    }

    const remain = Math.max(0, C.build + C.wave - t);
    dark = peak;
    skyMood = "night";
    moodRatio = 1;
    return { name: isBossWave ? ("Boss Wave" as const) : ("Wave" as const), remain, dark, isBossWave, wave, skyMood, moodRatio };
  }

  public addBuilding(data: Omit<Building, "id" | "flash" | "upgrading" | "repairTicks">): Building {
    const b: Building = {
      ...data,
      id: ++this.nextId.building,
      flash: 0,
      upgrading: false,
      repairTicks: 0,
    };
    this.buildings.push(b);
    return b;
  }

  public addUnit(x: number, y: number, role: RoleType): Unit {
    const war = role === "warrior", jav = role === "javelin";
    const baseHp = war ? 45 : jav ? 30 : 32;
    const u: Unit = {
      id: ++this.nextId.unit,
      name: "V" + this.nextId.unit,
      x,
      y,
      role,
      state: "idle",
      target: null,
      path: [],
      anim: 0,
      work: 0,
      carry: null,
      hp: baseHp,
      maxHp: baseHp,
      attackCd: 0,
      death: 0,
    };
    this.units.push(u);
    return u;
  }

  public addNode(type: NodeType, x: number, y: number): boolean {
    if (!this.inBounds(x, y) || this.terrain[y][x] === "water" || this.nodes.some((n) => n.x === x && n.y === y) || this.buildings.some((b) => this.inside(b, x, y))) {
      return false;
    }
    const max = type === "tree" ? 75 : type === "rock" ? 70 : type === "ore" ? 55 : 95;
    this.nodes.push({
      id: ++this.nextId.node,
      type,
      x,
      y,
      amount: max,
      max,
      flash: 0,
    });
    return true;
  }

  public placeCluster(type: NodeType, cx: number, cy: number, n: number) {
    const pts = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [0, 2], [2, 1], [-2, 1]];
    let k = 0;
    for (const p of pts) {
      if (k < n && this.addNode(type, cx + p[0], cy + p[1])) k++;
    }
  }

  public randomCluster(type: NodeType, a: number, b: number) {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    for (let t = 0; t < 100; t++) {
      const x = Math.floor(this.rng() * (COLS - 6)) + 3;
      const y = Math.floor(this.rng() * (ROWS - 6)) + 3;
      if (Math.hypot(x - cx, y - cy) < 8) continue;
      const countBefore = this.nodes.length;
      const clusterSize = Math.floor(this.rng() * (b - a + 1)) + a;
      this.placeCluster(type, x, y, clusterSize);
      if (this.nodes.length > countBefore) return;
    }
  }

  public findMoundSpot(): Position | null {
    const c = this.castle();
    if (!c) return null;
    const cx = Math.round(c.x + c.w / 2);
    const cy = Math.round(c.y + c.h / 2);
    const anchor = { x: cx, y: cy - 9 };

    for (let r = 0; r <= 12; r++) {
      for (let y = anchor.y - r; y <= anchor.y + r; y++) {
        for (let x = anchor.x - r; x <= anchor.x + r; x++) {
          if (this.inBounds(x, y) && this.walkable(x, y) && (this.terrain[y][x] === "grass" || this.terrain[y][x] === "grass2")) {
            return { x, y };
          }
        }
      }
    }
    return { x: cx + 3, y: cy - 6 };
  }

  public inside(b: Building, x: number, y: number): boolean {
    return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
  }

  public walkable(x: number, y: number, forEnemy = false): boolean {
    return (
      this.inBounds(x, y) &&
      this.terrain[y][x] !== "water" &&
      !this.nodes.some((n) => n.amount > 0 && n.x === x && n.y === y) &&
      !this.buildings.some(
        (b) =>
          b.hp > 0 &&
          (forEnemy || !(b.type === "gate" && b.complete)) &&
          this.inside(b, x, y)
      )
    );
  }

  public occupied(x: number, y: number): boolean {
    return (
      this.units.some((u) => u.state !== "death" && Math.round(u.x) === x && Math.round(u.y) === y) ||
      this.enemies.some((e) => e.state !== "death" && Math.round(e.x) === x && Math.round(e.y) === y) ||
      (this.golem !== null && this.golem.hp > 0 && Math.round(this.golem.x) === x && Math.round(this.golem.y) === y) ||
      Object.values(this.altarHeroes).some((h) => h !== null && Math.round(h.x) === x && Math.round(h.y) === y)
    );
  }

  public getBestSlotForUnit(u: { x: number; y: number; id: number }, slots: Position[], _contextId?: number): Position {
    if (!slots.length) return { x: Math.round(u.x), y: Math.round(u.y) };

    let best = slots[0];
    let bestScore = Infinity;

    for (const s of slots) {
      const dist = Math.hypot(u.x - s.x, u.y - s.y);
      let crowdingPenalty = 0;

      // Perspective preference: avoid standing behind (north of) tall structures when front/side slots exist
      for (const b of this.buildings) {
        if (b.hp <= 0) continue;
        if (s.y === b.y - 1 && s.x >= b.x - 1 && s.x <= b.x + b.w) {
          crowdingPenalty += 4.2;
        } else if (s.y === b.y + b.h && s.x >= b.x && s.x < b.x + b.w) {
          crowdingPenalty -= 0.6;
        }
      }

      for (const other of this.units) {
        if (other.id === u.id || other.state === "death") continue;
        const d = Math.hypot(other.x - s.x, other.y - s.y);
        if (d < 0.8) {
          crowdingPenalty += (0.8 - d) * 6;
        }
        if (other.path && other.path.length > 0) {
          const lastPoint = other.path[other.path.length - 1];
          if (lastPoint.x === s.x && lastPoint.y === s.y) {
            crowdingPenalty += 3.5;
          }
        }
      }

      const score = dist + crowdingPenalty;
      if (score < bestScore) {
        bestScore = score;
        best = s;
      }
    }

    return best;
  }

  public getFreeNeighborTile(targetX: number, targetY: number, excludeUnitId?: number): Position {
    targetX = Math.max(0, Math.min(COLS - 1, Math.round(targetX)));
    targetY = Math.max(0, Math.min(ROWS - 1, Math.round(targetY)));

    const isFree = (x: number, y: number) => {
      if (!this.walkable(x, y)) return false;
      const occupiedByOther = this.units.some(
        (u) => u.id !== excludeUnitId && u.state !== "death" && Math.hypot(u.x - x, u.y - y) < 0.65
      );
      return !occupiedByOther;
    };

    if (isFree(targetX, targetY)) {
      return { x: targetX, y: targetY };
    }

    for (let r = 1; r <= 4; r++) {
      const candidates: Position[] = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = targetX + dx;
          const ny = targetY + dy;
          if (this.inBounds(nx, ny) && isFree(nx, ny)) {
            candidates.push({ x: nx, y: ny });
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => Math.hypot(a.x - targetX, a.y - targetY) - Math.hypot(b.x - targetX, b.y - targetY));
        return candidates[0];
      }
    }

    return { x: targetX, y: targetY };
  }

  public getEntityPhysics(entity: any, kind: "unit" | "hero" | "altarHero" | "golem" | "enemy"): { radius: number; mass: number } {
    if (kind === "unit") {
      const u = entity as Unit;
      if (u.role === "warrior") return { radius: 0.42, mass: 2.6 };
      if (u.role === "scout") return { radius: 0.32, mass: 0.8 };
      if (u.role === "javelin") return { radius: 0.36, mass: 1.0 };
      return { radius: 0.36, mass: 1.0 };
    }
    if (kind === "altarHero") {
      const h = entity as AltarHero;
      if (h.role === "frontline") return { radius: 0.50, mass: 5.0 };
      if (h.role === "ranger") return { radius: 0.38, mass: 1.6 };
      if (h.role === "mage") return { radius: 0.36, mass: 1.3 };
      return { radius: 0.42, mass: 2.0 };
    }
    if (kind === "golem") {
      return { radius: 0.68, mass: 12.0 };
    }
    if (kind === "hero") {
      return { radius: 0.42, mass: 2.0 };
    }
    if (kind === "enemy") {
      const e = entity as Enemy;
      if (e.kind === "boss") return { radius: 0.88, mass: 25.0 };
      const isElite = e.kind === "elite";
      let baseR = 0.36;
      let baseM = 1.0;
      if (e.species === "scarab") {
        baseR = 0.48;
        baseM = 3.2;
      } else if (e.species === "ladybug") {
        baseR = 0.42;
        baseM = 2.0;
      } else if (e.species === "stinkbug") {
        baseR = 0.44;
        baseM = 1.8;
      } else if (e.species === "centipede") {
        baseR = 0.40;
        baseM = 1.5;
      } else if (e.species === "mantis") {
        baseR = 0.38;
        baseM = 1.3;
      } else {
        baseR = 0.35;
        baseM = 1.0;
      }

      if (isElite) {
        baseR = Math.min(0.60, baseR * 1.22);
        baseM *= 2.2;
      }
      return { radius: baseR, mass: baseM };
    }
    return { radius: 0.36, mass: 1.0 };
  }

  public resolveCollisions() {
    interface ActiveBody {
      entity: any;
      team: "ally" | "enemy";
      kind: "unit" | "hero" | "altarHero" | "golem" | "enemy";
      r: number;
      mass: number;
      x: number;
      y: number;
      isStationary: boolean;
      isWalking: boolean;
      vx: number;
      vy: number;
    }

    const bodies: ActiveBody[] = [];

    for (const u of this.units) {
      if (u.state !== "death" && u.hp > 0) {
        const phys = this.getEntityPhysics(u, "unit");
        const isWorking = u.state === "build" || u.state === "repair" || u.state === "chop" || u.state === "mine" || u.state === "farm";
        const isWalking = u.state === "walk" && (u.path?.length || 0) > 0;
        let vx = 0, vy = 0;
        if (isWalking && u.path[0]) {
          const dx = u.path[0].x - u.x;
          const dy = u.path[0].y - u.y;
          const d = Math.hypot(dx, dy) || 1;
          vx = dx / d;
          vy = dy / d;
        }
        bodies.push({
          entity: u,
          team: "ally",
          kind: "unit",
          r: phys.radius,
          mass: isWorking ? 1000 : phys.mass,
          x: u.x,
          y: u.y,
          isStationary: isWorking,
          isWalking,
          vx,
          vy,
        });
      }
    }

    const seenHeroIds = new Set<number>();
    const heroBodies = this.heroUnit ? [this.heroUnit] : Object.values(this.altarHeroes);
    for (const h of heroBodies) {
      if (h && h.hp > 0 && !seenHeroIds.has(h.id)) {
        seenHeroIds.add(h.id);
        const phys = this.getEntityPhysics(h, "altarHero");
        const isWalking = h.state === "walk" && (h.path?.length || 0) > 0;
        let vx = 0, vy = 0;
        if (isWalking && h.path[0]) {
          const dx = h.path[0].x - h.x;
          const dy = h.path[0].y - h.y;
          const d = Math.hypot(dx, dy) || 1;
          vx = dx / d;
          vy = dy / d;
        }
        bodies.push({
          entity: h,
          team: "ally",
          kind: "altarHero",
          r: phys.radius,
          mass: phys.mass,
          x: h.x,
          y: h.y,
          isStationary: h.state === "attack" || h.state === "idle",
          isWalking,
          vx,
          vy,
        });
      }
    }

    if (this.golem && this.golem.hp > 0) {
      const phys = this.getEntityPhysics(this.golem, "golem");
      const isWalking = this.golem.state === "walk" && (this.golem.path?.length || 0) > 0;
      let vx = 0, vy = 0;
      if (isWalking && this.golem.path[0]) {
        const dx = this.golem.path[0].x - this.golem.x;
        const dy = this.golem.path[0].y - this.golem.y;
        const d = Math.hypot(dx, dy) || 1;
        vx = dx / d;
        vy = dy / d;
      }
      bodies.push({
        entity: this.golem,
        team: "ally",
        kind: "golem",
        r: phys.radius,
        mass: phys.mass,
        x: this.golem.x,
        y: this.golem.y,
        isStationary: false,
        isWalking,
        vx,
        vy,
      });
    }

    if (this.hero && this.hero.hp > 0) {
      const phys = this.getEntityPhysics(this.hero, "hero");
      bodies.push({
        entity: this.hero,
        team: "ally",
        kind: "hero",
        r: phys.radius,
        mass: phys.mass,
        x: this.hero.x,
        y: this.hero.y,
        isStationary: false,
        isWalking: false,
        vx: 0,
        vy: 0,
      });
    }

    for (const e of this.enemies) {
      if (e.state !== "death" && e.hp > 0) {
        const phys = this.getEntityPhysics(e, "enemy");
        const isWalking = e.state === "walk" && (e.path?.length || 0) > 0;
        let vx = 0, vy = 0;
        if (isWalking && e.path[0]) {
          const dx = e.path[0].x - e.x;
          const dy = e.path[0].y - e.y;
          const d = Math.hypot(dx, dy) || 1;
          vx = dx / d;
          vy = dy / d;
        }
        bodies.push({
          entity: e,
          team: "enemy",
          kind: "enemy",
          r: phys.radius,
          mass: phys.mass,
          x: e.x,
          y: e.y,
          isStationary: e.state === "attack",
          isWalking,
          vx,
          vy,
        });
      }
    }

    if (this.boss && this.boss.state !== "death" && this.boss.hp > 0) {
      const phys = this.getEntityPhysics(this.boss, "enemy");
      bodies.push({
        entity: this.boss,
        team: "enemy",
        kind: "enemy",
        r: phys.radius,
        mass: phys.mass,
        x: this.boss.x,
        y: this.boss.y,
        isStationary: false,
        isWalking: this.boss.state === "walk",
        vx: 0,
        vy: 0,
      });
    }

    const n = bodies.length;
    if (n <= 1) return;

    // Spatial Hash Grid for high-performance localized queries
    const cellSize = 1.5;
    const grid = new Map<string, number[]>();

    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      const cx = Math.floor(b.x / cellSize);
      const cy = Math.floor(b.y / cellSize);
      const key = `${cx},${cy}`;
      let cell = grid.get(key);
      if (!cell) {
        cell = [];
        grid.set(key, cell);
      }
      cell.push(i);
    }

    // Two-pass gentle soft-separation + yielding steering
    const checkedPairs = new Set<string>();

    for (const [key, cellIndices] of grid.entries()) {
      const [cxStr, cyStr] = key.split(",");
      const cx = parseInt(cxStr, 10);
      const cy = parseInt(cyStr, 10);

      // Check current cell and adjacent 8 cells
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const neighborKey = `${cx + ox},${cy + oy}`;
          const neighborIndices = grid.get(neighborKey);
          if (!neighborIndices) continue;

          for (const i of cellIndices) {
            const a = bodies[i];
            for (const j of neighborIndices) {
              if (i >= j) continue;
              const b = bodies[j];
              if (a.entity === b.entity) continue;
              const pairKey = `${i}-${j}`;
              if (checkedPairs.has(pairKey)) continue;
              checkedPairs.add(pairKey);
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const distSq = dx * dx + dy * dy;
              const isAlliedPair = a.team === "ally" && b.team === "ally";
              const minDist = isAlliedPair ? (a.r + b.r) * 0.55 : (a.r + b.r) * 0.85; // Allow allies to soft-squeeze through narrow passages
              const minDistSq = minDist * minDist;

              if (distSq < minDistSq) {
                let dist = Math.sqrt(distSq);
                let nx = 1;
                let ny = 0;
                if (dist > 0.0001) {
                  nx = dx / dist;
                  ny = dy / dist;
                } else {
                  const ang = (((a.entity.id || 1) * 19 + (b.entity.id || 2) * 37) % 360) * (Math.PI / 180);
                  nx = Math.cos(ang);
                  ny = Math.sin(ang);
                  dist = 0.0001;
                }

                const overlap = minDist - dist;
                const totalMass = a.mass + b.mass;
                const ratioA = a.isStationary ? 0 : b.mass / totalMass;
                const ratioB = b.isStationary ? 0 : a.mass / totalMass;
                const pushFactor = isAlliedPair ? 0.18 : 0.32;

                // 1. Radial separation (gentle for friendly units so they never bounce back and forth)
                a.x -= nx * overlap * ratioA * pushFactor;
                a.y -= ny * overlap * ratioA * pushFactor;
                b.x += nx * overlap * ratioB * pushFactor;
                b.y += ny * overlap * ratioB * pushFactor;

                // 2. Lateral Tangential Steering: slide past each other smoothly in corridors
                const tx = -ny;
                const ty = nx;

                if (isAlliedPair && (a.isWalking || b.isWalking)) {
                  // Mutual side-step in corridors (deflect laterally rather than backward)
                  const lateralPush = overlap * 0.40;
                  if (!a.isStationary) {
                    a.x += tx * lateralPush;
                    a.y += ty * lateralPush;
                  }
                  if (!b.isStationary) {
                    b.x -= tx * lateralPush;
                    b.y -= ty * lateralPush;
                  }
                } else {
                  if (a.isWalking && !a.isStationary) {
                    const side = (a.vx * tx + a.vy * ty) >= 0 ? 1 : -1;
                    const lateralNudge = overlap * 0.22 * side;
                    a.x += tx * lateralNudge;
                    a.y += ty * lateralNudge;
                  }
                  if (b.isWalking && !b.isStationary) {
                    const side = (b.vx * tx + b.vy * ty) >= 0 ? 1 : -1;
                    const lateralNudge = overlap * 0.22 * side;
                    b.x += tx * lateralNudge;
                    b.y += ty * lateralNudge;
                  }
                }
              }
            }
          }
        }
      }
    }

    // World & obstacle boundary containment
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      b.x = Math.max(0.6, Math.min(COLS - 1.6, b.x));
      b.y = Math.max(0.6, Math.min(ROWS - 1.6, b.y));

      if (b.isStationary) continue;

      const tileMinX = Math.max(0, Math.floor(b.x - 0.5));
      const tileMaxX = Math.min(COLS - 1, Math.ceil(b.x + 0.5));
      const tileMinY = Math.max(0, Math.floor(b.y - 0.5));
      const tileMaxY = Math.min(ROWS - 1, Math.ceil(b.y + 0.5));

      for (let ty = tileMinY; ty <= tileMaxY; ty++) {
        for (let tx = tileMinX; tx <= tileMaxX; tx++) {
          if (this.terrain[ty][tx] === "water") {
            this.resolveCircleBox(b, tx - 0.5, ty - 0.5, tx + 0.5, ty + 0.5);
          }
        }
      }

      for (const building of this.buildings) {
        if (building.hp <= 0) continue;
        // Allied units, heroes, and golem pass freely through completed Wall Gates
        if (b.team === "ally" && building.type === "gate" && building.complete) continue;
        this.resolveCircleBox(
          b,
          building.x - 0.5,
          building.y - 0.5,
          building.x + building.w - 0.5,
          building.y + building.h - 0.5
        );
      }

      for (const node of this.nodes) {
        if (node.amount <= 0) continue;
        this.resolveCircleBox(b, node.x - 0.5, node.y - 0.5, node.x + 0.5, node.y + 0.5);
      }
    }

    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      b.entity.x = b.x;
      b.entity.y = b.y;
    }
  }

  private resolveCircleBox(circle: { x: number; y: number; r: number }, x1: number, y1: number, x2: number, y2: number) {
    const cx = circle.x;
    const cy = circle.y;
    // Sleek navigational radius against solid building/water/node walls so units fit smoothly through 1-tile gaps
    const navRadius = Math.min(0.24, (circle.r || 0.35) * 0.65);

    // 1. Center has penetrated inside the box: push out to nearest edge + minimal clearance
    if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
      const dLeft = cx - x1;
      const dRight = x2 - cx;
      const dTop = cy - y1;
      const dBottom = y2 - cy;

      const clearance = navRadius + 0.02;

      // Prefer push directions that lead to open walkable tiles
      const canLeft = this.walkable(Math.round(x1 - clearance), Math.round(cy));
      const canRight = this.walkable(Math.round(x2 + clearance), Math.round(cy));
      const canTop = this.walkable(Math.round(cx), Math.round(y1 - clearance));
      const canBottom = this.walkable(Math.round(cx), Math.round(y2 + clearance));

      const dirs = [
        { dir: "left", dist: dLeft, ok: canLeft },
        { dir: "right", dist: dRight, ok: canRight },
        { dir: "top", dist: dTop, ok: canTop },
        { dir: "bottom", dist: dBottom, ok: canBottom },
      ];

      dirs.sort((a, b) => {
        if (a.ok !== b.ok) return a.ok ? -1 : 1;
        return a.dist - b.dist;
      });

      const best = dirs[0].dir;
      if (best === "left") circle.x = x1 - clearance;
      else if (best === "right") circle.x = x2 + clearance;
      else if (best === "top") circle.y = y1 - clearance;
      else circle.y = y2 + clearance;
      return;
    }

    // 2. Center is outside, but the circle body overlaps the box or its rounded corners
    const clampX = Math.max(x1, Math.min(x2, cx));
    const clampY = Math.max(y1, Math.min(y2, cy));
    const dx = cx - clampX;
    const dy = cy - clampY;
    const distSq = dx * dx + dy * dy;

    if (distSq < navRadius * navRadius && distSq > 0.00001) {
      const dist = Math.sqrt(distSq);
      const overlap = navRadius - dist + 0.005;
      circle.x += (dx / dist) * overlap;
      circle.y += (dy / dist) * overlap;
    }
  }

  public around(b: { x: number; y: number; w: number; h: number }): Position[] {
    const out: Position[] = [];
    // 1. Front row (south of structure) first for clear frontal visibility
    for (let x = b.x - 1; x <= b.x + b.w; x++) {
      const y = b.y + b.h;
      if (this.walkable(x, y)) out.push({ x, y });
    }
    // 2. Side columns (west & east of structure)
    for (let y = b.y; y < b.y + b.h; y++) {
      for (const x of [b.x - 1, b.x + b.w]) {
        if (this.walkable(x, y)) out.push({ x, y });
      }
    }
    // 3. Back row (north of structure)
    for (let x = b.x - 1; x <= b.x + b.w; x++) {
      const y = b.y - 1;
      if (this.walkable(x, y)) out.push({ x, y });
    }
    return out;
  }

  public adjacent(o: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    const x = Math.round(o.x);
    const y = Math.round(o.y);
    return x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h && !(x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
  }

  /**
   * CRITICAL BUGFIX: Fog of war / Battle fog calculation
   * Now dynamically uses COLS and ROWS rather than hardcoded 31 boundaries.
   */
  public updateVision() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        this.visible[y][x] = false;
      }
    }

    const reveal = (cx: number, cy: number, r: number) => {
      const minX = Math.max(0, Math.floor(cx - r));
      const maxX = Math.min(COLS - 1, Math.ceil(cx + r));
      const minY = Math.max(0, Math.floor(cy - r));
      const maxY = Math.min(ROWS - 1, Math.ceil(cy + r));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) {
            this.visible[y][x] = true;
            this.explored[y][x] = true;
          }
        }
      }
    };

    const c = this.castle();
    if (c) reveal(c.x + 1, c.y + 1, 9);

    for (const b of this.completed("tower")) reveal(b.x + 0.5, b.y + 0.5, 6);
    for (const u of this.units) {
      if (u.state !== "death") {
        reveal(u.x + 0.5, u.y + 0.5, u.role === "scout" ? 8 : 3.5);
      }
    }
    if (this.golem && this.golem.hp > 0) reveal(this.golem.x + 0.5, this.golem.y + 0.5, 5);
    for (const h of Object.values(this.altarHeroes)) {
      if (h && h.hp > 0) reveal(h.x + 0.5, h.y + 0.5, 5.5);
    }
    if (this.hero) reveal(this.hero.x + 0.5, this.hero.y + 0.5, 6.5);
  }

  public getRoleName(role: RoleType): string {
    const ptNames: Record<RoleType, string> = {
      builder: "Construtor",
      woodcutter: "Lenhador",
      stoneMiner: "Minerador de Pedra",
      goldMiner: "Minerador de Ouro",
      farmer: "Fazendeiro",
      warrior: "Guerreiro",
      javelin: "Lanceiro",
      scout: "Batedor",
      trainee: "Aprendiz",
    };
    if (this.lang === "pt") return ptNames[role] || role;
    return ROLE_INFO[role]?.label || role;
  }

  public getBuildingName(type: BuildingType | string): string {
    const ptBuildings: Record<string, string> = {
      lumber: "Cabana Lenheira",
      quarry: "Pedreira",
      farm: "Fazenda",
      house: "Casa",
      barracks: "Quartel",
      tower: "Torre de Vigia",
      palisade: "Paliçada",
      gate: "Portão",
      altar: "Altar",
      townhall: "Câmara Municipal",
    };
    if (this.lang === "pt") return ptBuildings[type] || BUILD_SPECS[type]?.label || type;
    return BUILD_SPECS[type]?.label || type;
  }

  public survey() {
    if (this.exploreCd > 0 || this.resources.wood < 30) return;
    const c = this.castle();
    if (!c) return;
    this.resources.wood -= 30;
    this.exploreCd = 15;
    const r = 14 + Math.min(22, this.waveNumber * 3);

    const minX = Math.max(0, Math.floor(c.x + 1 - r));
    const maxX = Math.min(COLS - 1, Math.ceil(c.x + 1 + r));
    const minY = Math.max(0, Math.floor(c.y + 1 - r));
    const maxY = Math.min(ROWS - 1, Math.ceil(c.y + 1 + r));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (Math.hypot(x - (c.x + 1), y - (c.y + 1)) <= r) {
          this.explored[y][x] = true;
          this.visible[y][x] = true;
        }
      }
    }
    this.setBanner(
      this.lang === "pt" ? "Batedores exploraram novas terras!" : "Scouts surveyed new lands!",
      2,
      "#73d9ff"
    );
    this.log(this.lang === "pt" ? "Novas terras foram mapeadas." : "The realm survey expanded.");
    sound.playSfx("select");
  }

  public findPath(
    sx: number,
    sy: number,
    goals: Position[],
    options?: { avoidTiles?: Set<number>; allowDiagonal?: boolean; forEnemy?: boolean }
  ): Position[] {
    sx = Math.max(0, Math.min(COLS - 1, Math.round(sx)));
    sy = Math.max(0, Math.min(ROWS - 1, Math.round(sy)));

    const avoid = options?.avoidTiles;
    const allowDiag = options?.allowDiagonal !== false;
    const forEnemy = !!options?.forEnemy;

    // If starting inside an unwalkable obstacle or corner, find nearest walkable escape tile
    let escapeStep: Position | null = null;
    if (!this.walkable(sx, sy, forEnemy) || (avoid && avoid.has(sy * COLS + sx))) {
      let minD = 999;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const tx = sx + dx;
          const ty = sy + dy;
          const tk = ty * COLS + tx;
          if (this.inBounds(tx, ty) && this.walkable(tx, ty, forEnemy) && (!avoid || !avoid.has(tk))) {
            const d = Math.hypot(dx, dy);
            if (d < minD) {
              minD = d;
              escapeStep = { x: tx, y: ty };
            }
          }
        }
      }
      if (escapeStep) {
        sx = escapeStep.x;
        sy = escapeStep.y;
      }
    }

    const goalSet = new Set(goals.map((p) => Math.round(p.y) * COLS + Math.round(p.x)));
    const start = sy * COLS + sx;
    if (goalSet.has(start)) return escapeStep ? [{ x: escapeStep.x, y: escapeStep.y }] : [];

    const totalCells = COLS * ROWS;
    const prev = new Int32Array(totalCells).fill(-1);
    const q = new Int32Array(totalCells);
    let head = 0;
    let tail = 0;
    let found = -1;

    q[tail++] = start;
    prev[start] = start;

    while (head < tail) {
      const cur = q[head++];
      const x = cur % COLS;
      const y = Math.floor(cur / COLS);

      // 1. Cardinal directions (horizontal/vertical)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const nk = ny * COLS + nx;

        if (!this.inBounds(nx, ny) || prev[nk] !== -1) continue;
        if (avoid && avoid.has(nk) && !goalSet.has(nk)) continue;
        if (!this.walkable(nx, ny, forEnemy) && !goalSet.has(nk)) continue;

        prev[nk] = cur;
        if (goalSet.has(nk)) {
          found = nk;
          head = tail;
          break;
        }
        q[tail++] = nk;
      }

      if (found >= 0) break;

      // 2. Diagonal directions (smooth shortcuts, with strict corner-cutting protection)
      if (allowDiag) {
        for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          const nk = ny * COLS + nx;

          if (!this.inBounds(nx, ny) || prev[nk] !== -1) continue;
          if (avoid && avoid.has(nk) && !goalSet.has(nk)) continue;
          if (!this.walkable(nx, ny, forEnemy) && !goalSet.has(nk)) continue;

          // Corner safety: BOTH adjacent cardinal tiles must be walkable so units never clip building or terrain corners
          if (!this.walkable(x + dx, y, forEnemy) || !this.walkable(x, y + dy, forEnemy)) {
            continue;
          }

          prev[nk] = cur;
          if (goalSet.has(nk)) {
            found = nk;
            head = tail;
            break;
          }
          q[tail++] = nk;
        }
      }
    }

    if (found < 0) return escapeStep ? [{ x: escapeStep.x, y: escapeStep.y }] : [];

    const path: Position[] = [];
    for (let cur = found; cur !== start; cur = prev[cur]) {
      path.push({ x: cur % COLS, y: Math.floor(cur / COLS) });
    }
    const res = path.reverse();
    if (escapeStep && (res.length === 0 || Math.hypot(res[0].x - escapeStep.x, res[0].y - escapeStep.y) > 0.4)) {
      res.unshift({ x: escapeStep.x, y: escapeStep.y });
    }
    return res;
  }

  public isLineWalkable(x1: number, y1: number, x2: number, y2: number): boolean {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist <= 0.1) return true;
    const steps = Math.ceil(dist * 4);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      const tx = Math.round(px);
      const ty = Math.round(py);
      if (!this.inBounds(tx, ty) || !this.walkable(tx, ty)) return false;
    }
    return true;
  }

  public getUnitGoals(u: any): Position[] {
    if (u.target) {
      if (u.target.kind === "move") {
        return [{ x: Math.floor(u.target.x), y: Math.floor(u.target.y) }];
      }
      if (u.target.kind === "node") {
        const n = this.nodes.find((item) => item.id === u.target.id && item.amount > 0);
        if (n) return this.around({ x: n.x, y: n.y, w: 1, h: 1 });
      }
      if (u.target.kind === "deposit" || u.target.kind === "build" || u.target.kind === "repair" || u.target.kind === "farm_work") {
        const b = this.buildings.find((item) => item.id === u.target.id && item.hp > 0);
        if (b) return this.around(b);
      }
      if (u.target.kind === "enemy") {
        const e = this.enemies.find((item) => item.id === u.target.id && item.state !== "death");
        if (e) return this.around({ x: Math.round(e.x), y: Math.round(e.y), w: 1, h: 1 });
      }
    }
    if (u.path && u.path.length > 0) {
      const last = u.path[u.path.length - 1];
      return [{ x: Math.floor(last.x), y: Math.floor(last.y) }];
    }
    return [];
  }

  public askIdleUnitsToYield(mover: { x: number; y: number; id?: number }, targetX: number, targetY: number) {
    for (const other of this.units) {
      if (other.id === mover.id || other.state === "death") continue;
      const dToTarget = Math.hypot(other.x - targetX, other.y - targetY);
      const dToMover = Math.hypot(other.x - mover.x, other.y - mover.y);
      if (dToMover < 0.85 || dToTarget < 0.65) {
        if (other.state === "idle") {
          const stepAside = this.getFreeNeighborTile(other.x, other.y, other.id);
          if (stepAside && Math.hypot(stepAside.x + 0.5 - targetX, stepAside.y + 0.5 - targetY) > 0.8) {
            other.x = stepAside.x + 0.5;
            other.y = stepAside.y + 0.5;
          }
        }
      }
    }
  }

  public setBanner(text: string, time = 2.5, color = "#f4c97a") {
    this.banner = { text, time, color };
  }

  public log(msg: string) {
    this.logs.unshift(`Wave ${this.waveNumber} · ${msg}`);
    if (this.logs.length > 25) this.logs.pop();
  }

  public addParticle(
    x: number,
    y: number,
    color: string,
    n = 8,
    gravity = 35,
    kind: "spark" | "wood" | "stone" | "gold" | "leaf" | "rune" | "blood" | "ember" = "spark"
  ) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 55;
      this.particles.push({
        x: x * TS + (Math.random() - 0.5) * 12,
        y: y * TS + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed * (kind === "leaf" ? 0.6 : 1),
        vy: (Math.sin(angle) * speed - 25) * (kind === "ember" ? -0.8 : 1),
        life: 0.4 + Math.random() * 0.5,
        max: 0.9,
        size: kind === "gold" ? 2.5 + Math.random() * 2 : 1.8 + Math.random() * 2.8,
        color,
        gravity: kind === "ember" ? -15 : kind === "leaf" ? 12 : gravity,
        kind,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 12,
      });
    }
  }

  public float(text: string, x: number, y: number, color: string) {
    this.floats.push({
      id: ++this.nextId.float,
      text,
      x: x * TS,
      y: y * TS,
      life: 1.1,
      max: 1.1,
      color,
    });
  }

  public addClickMarker(x: number, y: number, color = "#5fef6f") {
    this.clickMarker = { x, y, color, time: 0, max: 0.45 };
  }

  public autoAssignIdle() {
    const idleUnits = this.units.filter((u) => u.state === "idle" && u.hp > 0 && !u.sheltered);
    if (!idleUnits.length) {
      this.setBanner(
        this.lang === "pt" ? "Nenhum aldeão ocioso para trabalhar" : "No idle villagers to assign",
        1.5,
        "#efb66f"
      );
      return;
    }

    let assigned = 0;
    for (const u of idleUnits) {
      this.autoWork(u);
      if (u.state !== "idle") assigned++;
    }

    const msg =
      this.lang === "pt"
        ? `${assigned} aldeão(ões) retornaram às suas tarefas!`
        : `${assigned} villager${assigned > 1 ? "s" : ""} put to work!`;
    this.setBanner(msg, 2, "#78e58a");
    this.log(`Assigned ${assigned} idle villagers to their fixed duties.`);
    sound.playSfx("select");
  }

  public assignRole(_u: Unit, _role: RoleType, tell = true) {
    if (tell) {
      this.setBanner(
        this.lang === "pt"
          ? "Profissões são permanentes! Contrate artesãos na Câmara Municipal."
          : "Professions are permanent! Recruit specialized workers at the Town Hall.",
        2.5,
        "#efb66f"
      );
      sound.playSfx("warn");
    }
  }

  public releaseUnit(u: Unit) {
    for (const b of this.buildings) {
      if (b.builderId === u.id) b.builderId = null;
      if (b.repairerId === u.id) b.repairerId = null;
    }
  }

  public autoWork(u: Unit) {
    if (u.state === "death" || u.sheltered) return;
    if (u.carry) {
      this.deposit(u);
      return;
    }

    if (u.role === "builder") {
      this.assignBestBuilderTask(u);
    } else if (u.role === "woodcutter") {
      this.gather(u, this.nearestNode(u, "tree"));
    } else if (u.role === "stoneMiner") {
      this.gather(u, this.nearestNode(u, "rock"));
    } else if (u.role === "goldMiner") {
      this.gather(u, this.nearestNode(u, "ore"));
    } else if (u.role === "farmer") {
      const farms = this.completed("farm");
      if (farms.length > 0) {
        farms.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
        this.commandWorkFarm(u, farms[0]);
      } else {
        this.gather(u, this.nearestNode(u, "field"));
      }
    } else if (u.role === "warrior" || u.role === "javelin") {
      const e = this.nearestEnemyForUnit(u, 12);
      if (e) this.commandAttack(u, e);
      else u.state = "idle";
    } else if (u.role === "scout") {
      this.autoScoutExplore(u);
    }
  }

  public findScoutExplorationTarget(u: Unit): Position | null {
    const ux = Math.round(u.x);
    const uy = Math.round(u.y);
    let bestScore = -Infinity;
    let bestPos: Position | null = null;

    // Scan the map grid for walkable areas adjacent to unexplored fog
    const candidates: { x: number; y: number; unexploredCount: number; dist: number }[] = [];

    for (let y = 3; y < ROWS - 3; y += 2) {
      for (let x = 3; x < COLS - 3; x += 2) {
        if (!this.walkable(x, y)) continue;

        let unexplored = 0;
        for (let dy = -6; dy <= 6; dy += 2) {
          for (let dx = -6; dx <= 6; dx += 2) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.inBounds(nx, ny) && !this.explored[ny][nx]) {
              unexplored++;
            }
          }
        }

        if (unexplored > 0) {
          const dist = Math.hypot(x - ux, y - uy);
          candidates.push({ x, y, unexploredCount: unexplored, dist });
        }
      }
    }

    if (candidates.length > 0) {
      for (const c of candidates) {
        // High weight on unexplored fog density; distance penalty prevents inefficient criss-crossing
        const score = c.unexploredCount * 3.8 - c.dist * 0.7 + (Math.random() - 0.5) * 6;
        if (score > bestScore) {
          bestScore = score;
          bestPos = { x: c.x, y: c.y };
        }
      }
      return bestPos;
    }

    // When map is mostly surveyed, patrol the outer defense perimeter to watch for incoming invaders
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4];
    const c = this.castle();
    const cx = c ? c.x + 1.5 : 32;
    const cy = c ? c.y + 1.5 : 32;
    const patDist = 18 + Math.floor(Math.random() * 8);
    const angle = angles[Math.floor(Math.random() * angles.length)];
    const px = Math.max(3, Math.min(COLS - 4, Math.round(cx + Math.cos(angle) * patDist)));
    const py = Math.max(3, Math.min(ROWS - 4, Math.round(cy + Math.sin(angle) * patDist)));
    if (this.walkable(px, py)) {
      return { x: px, y: py };
    }
    return null;
  }

  public autoScoutExplore(u: Unit) {
    if (u.state === "death" || u.sheltered) return;

    // Self defense: if enemies are dangerously close, engage
    const threat = this.nearestEnemyForUnit(u, 2.5);
    if (threat) {
      this.commandAttack(u, threat);
      return;
    }

    const target = this.findScoutExplorationTarget(u);
    if (target) {
      const path = this.findPath(u.x, u.y, [target]);
      if (path && path.length > 0) {
        u.target = { kind: "scout", x: target.x, y: target.y };
        u.path = path;
        u.state = "walk";
        u.scoutClock = 2.5;
        return;
      }
    }
    u.state = "idle";
  }

  public assignBestBuilderTask(u: Unit) {
    interface TaskCandidate {
      building: Building;
      type: "build" | "repair";
      priority: number;
      assigned: number;
      dist: number;
      score: number;
    }

    const candidates: TaskCandidate[] = [];

    // Collect all incomplete constructions & upgrades
    for (const b of this.buildings) {
      if (b.hp <= 0) continue;
      if (!b.complete || b.upgrading) {
        const assigned = this.units.filter(
          (o) => o.id !== u.id && o.state !== "death" && o.role === "builder" && o.target?.kind === "build" && o.target?.id === b.id
        ).length;
        const dist = Math.hypot(u.x - (b.x + b.w / 2), u.y - (b.y + b.h / 2));
        let priority = 60;
        if (b.type === "townhall") priority = 85;
        else if (b.type === "tower" || b.type === "altar") priority = 75;
        else if (b.type === "farm" || b.type === "barracks") priority = 70;
        else if (b.type === "house") priority = 65;

        candidates.push({ building: b, type: "build", priority, assigned, dist, score: 0 });
      }
    }

    // Collect all damaged buildings needing repair
    for (const b of this.buildings) {
      if (!b.complete || b.upgrading || b.hp <= 0 || b.hp >= b.maxHp - 0.1) continue;
      const assigned = this.units.filter(
        (o) => o.id !== u.id && o.state !== "death" && o.role === "builder" && o.target?.kind === "repair" && o.target?.id === b.id
      ).length;
      const dist = Math.hypot(u.x - (b.x + b.w / 2), u.y - (b.y + b.h / 2));
      const hpRatio = b.hp / b.maxHp;
      let priority = 70;
      if (hpRatio < 0.35) priority = 110; // Critical danger
      else if (hpRatio < 0.65) priority = 90;
      else if (b.type === "townhall" || b.type === "tower" || b.type === "gate") priority = 85;

      candidates.push({ building: b, type: "repair", priority, assigned, dist, score: 0 });
    }

    if (!candidates.length) {
      u.state = "idle";
      return;
    }

    // Check how many candidate tasks have 0 assigned builders
    const unstaffedTasks = candidates.filter((c) => c.assigned === 0).length;

    for (const c of candidates) {
      // Over-stacking penalty: if there are other unstaffed tasks, heavily penalize buildings that already have 2+ builders
      let stackPenalty = c.assigned * 32;
      if (unstaffedTasks > 0 && c.assigned >= 2) {
        stackPenalty += 80;
      }
      c.score = c.priority * 1.5 - stackPenalty - c.dist * 1.6;
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    if (best.type === "build") {
      this.commandBuild(u, best.building);
    } else {
      this.commandRepair(u, best.building);
    }
  }

  public nearestNode(u: { x: number; y: number }, type: NodeType): ResourceNode | null {
    let best: ResourceNode | null = null;
    let bd = 999;
    for (const n of this.nodes) {
      if (n.type !== type || n.amount <= 0 || !this.isExplored(n.x, n.y)) continue;
      const d = Math.hypot(u.x - n.x, u.y - n.y);
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  public nearestConstruction(u: Unit): Building | null {
    let best: Building | null = null;
    let bd = 999;
    for (const b of this.buildings) {
      if (b.complete && !b.upgrading) continue;
      if (b.hp <= 0) continue;
      const d = Math.hypot(u.x - b.x, u.y - b.y);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best;
  }

  public nearestRepair(u: Unit): Building | null {
    let best: Building | null = null;
    let bd = 999;
    for (const b of this.buildings) {
      if (!b.complete || b.upgrading || b.hp <= 0 || b.hp >= b.maxHp - 0.1) continue;
      if (b.repairerId && b.repairerId !== u.id) continue;
      const d = Math.hypot(u.x - b.x, u.y - b.y);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best;
  }

  public nearestEnemyForUnit(u: { x: number; y: number }, range = 999): Enemy | null {
    let best: Enemy | null = null;
    let bd = range;
    for (const e of this.enemies) {
      if (e.state === "death") continue;
      const d = Math.hypot(u.x - e.x, u.y - e.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (this.boss && this.boss.state !== "death") {
      const d = Math.hypot(u.x - this.boss.x, u.y - this.boss.y);
      if (d < bd) best = this.boss;
    }
    return best;
  }

  public gather(u: Unit, n: ResourceNode | null) {
    if (!n) {
      u.state = "idle";
      return;
    }
    u.target = { kind: "node", id: n.id };
    if (Math.hypot(u.x - n.x, u.y - n.y) <= 1.35) {
      u.path = [];
      u.state = n.type === "tree" ? "chop" : n.type === "field" ? "farm" : "mine";
      u.work = 0;
      return;
    }
    const slots = this.around({ x: n.x, y: n.y, w: 1, h: 1 });
    u.path = this.findPath(u.x, u.y, slots.length ? slots : [{ x: n.x, y: n.y }]);
    u.state = "walk";
    u.work = 0;
    if (!u.path.length) this.arrive(u);
  }

  public commandWorkFarm(u: Unit, b: Building) {
    if (u.role !== "farmer") return;
    u.target = { kind: "farm_work", id: b.id };
    const cx = Math.max(b.x, Math.min(b.x + b.w, u.x));
    const cy = Math.max(b.y, Math.min(b.y + b.h, u.y));
    if (Math.hypot(u.x - cx, u.y - cy) <= 1.35) {
      u.path = [];
      u.state = "farm";
      u.work = 0;
      return;
    }
    const slots = this.around(b);
    u.path = this.findPath(u.x, u.y, slots.length ? slots : [{ x: b.x, y: b.y }]);
    u.state = "walk";
    u.work = 0;
    if (!u.path.length) this.arrive(u);
  }

  public deposit(u: Unit) {
    const c = this.castle();
    const options: Building[] = c ? [c] : [];
    if (u.carry?.type === "wood") options.push(...this.completed("lumber"));
    if (u.carry?.type === "stone" || u.carry?.type === "gold") options.push(...this.completed("quarry"));
    if (u.carry?.type === "food") options.push(...this.completed("farm"));

    let best = options[0];
    let bd = 999;
    for (const opt of options) {
      const d = Math.hypot(u.x - opt.x, u.y - opt.y);
      if (d < bd) {
        bd = d;
        best = opt;
      }
    }

    if (!best) return;
    u.target = { kind: "deposit", id: best.id };
    const cx = Math.max(best.x, Math.min(best.x + best.w, u.x));
    const cy = Math.max(best.y, Math.min(best.y + best.h, u.y));
    if (Math.hypot(u.x - cx, u.y - cy) <= 1.35) {
      u.path = [];
      this.arrive(u);
      return;
    }
    const slots = this.around(best);
    u.path = this.findPath(u.x, u.y, slots.length ? slots : [{ x: best.x, y: best.y }]);
    u.state = "walk";
    if (!u.path.length) this.arrive(u);
  }

  public commandBuild(u: Unit, b: Building) {
    if (!b || b.hp <= 0) return;
    if (b.complete && !b.upgrading) return;
    b.builderId = u.id;
    u.target = { kind: "build", id: b.id };

    const cx = Math.max(b.x, Math.min(b.x + b.w, u.x));
    const cy = Math.max(b.y, Math.min(b.y + b.h, u.y));
    if (Math.hypot(u.x - cx, u.y - cy) <= 1.35) {
      u.path = [];
      u.state = "build";
      u.work = 0;
      return;
    }

    const slots = this.around(b);
    u.path = this.findPath(u.x, u.y, slots.length ? slots : [{ x: b.x, y: b.y }]);
    u.state = "walk";
    u.work = 0;
    if (!u.path.length) this.arrive(u);
  }

  public commandRepair(u: Unit, b: Building) {
    if (!b || !b.complete || b.upgrading || b.hp <= 0 || b.hp >= b.maxHp) return;
    this.releaseUnit(u);
    b.repairerId = u.id;
    u.target = { kind: "repair", id: b.id };

    const cx = Math.max(b.x, Math.min(b.x + b.w, u.x));
    const cy = Math.max(b.y, Math.min(b.y + b.h, u.y));
    if (Math.hypot(u.x - cx, u.y - cy) <= 1.35) {
      u.path = [];
      u.state = "repair";
      u.work = 0;
      return;
    }

    const slots = this.around(b);
    u.path = this.findPath(u.x, u.y, slots.length ? slots : [{ x: b.x, y: b.y }]);
    u.state = "walk";
    u.work = 0;
    if (!u.path.length) this.arrive(u);
    this.log(`${u.name} ordered to repair ${BUILD_SPECS[b.type]?.label || b.type}.`);
  }

  public commandAttack(u: Unit, e: Enemy) {
    if (!e || e.state === "death") return;
    this.releaseUnit(u);
    u.target = { kind: "enemy", id: e.id };
    const range = u.role === "javelin" ? BALANCE.javelin.range : 1.45;
    if (Math.hypot(u.x - e.x, u.y - e.y) <= range) {
      u.path = [];
      u.state = "attack";
      return;
    }
    const slots = this.around({ x: Math.round(e.x), y: Math.round(e.y), w: 1, h: 1 });
    u.path = this.findPath(u.x, u.y, slots.length ? slots : [{ x: Math.round(e.x), y: Math.round(e.y) }]);
    u.state = "walk";
    if (!u.path.length) this.arrive(u);
  }

  public commandMove(u: Unit, x: number, y: number) {
    this.releaseUnit(u);
    if (!this.walkable(x, y)) {
      this.setBanner("That tile is blocked", 1.2, "#ef8d78");
      return;
    }
    const dest = this.getFreeNeighborTile(x, y, u.id);
    u.target = { kind: "move", x: dest.x, y: dest.y };
    u.path = this.findPath(u.x, u.y, [dest]);
    u.state = "walk";
  }

  public arrive(u: Unit) {
    const t = u.target;
    if (!t) {
      u.state = "idle";
      return;
    }
    if (t.kind === "move") {
      u.state = "idle";
      return;
    }
    if (t.kind === "scout") {
      u.state = "idle";
      u.target = null;
      u.work = 0.2; // Quick reset to scan for next exploration vector
      return;
    }
    if (t.kind === "node") {
      const n = this.nodes.find((item) => item.id === t.id);
      if (!n || n.amount <= 0) {
        u.state = "idle";
        this.autoWork(u);
        return;
      }
      u.state = n.type === "tree" ? "chop" : n.type === "field" ? "farm" : "mine";
      u.work = 0;
      return;
    }
    if (t.kind === "farm_work") {
      const b = this.buildings.find((item) => item.id === t.id);
      if (!b || b.hp <= 0) {
        u.state = "idle";
        this.autoWork(u);
        return;
      }
      u.state = "farm";
      u.work = 0;
      return;
    }
    if (t.kind === "deposit") {
      if (u.carry) {
        this.resources[u.carry.type] += u.carry.amount;
        this.float(`+${u.carry.amount} ${u.carry.type}`, u.x, u.y, RES_COLORS[u.carry.type]);
        this.addParticle(u.x, u.y, RES_COLORS[u.carry.type], 8);
        u.carry = null;
      }
      u.state = "idle";
      this.autoWork(u);
      return;
    }
    if (t.kind === "build") {
      const b = this.buildings.find((item) => item.id === t.id);
      if (!b) {
        u.state = "idle";
        return;
      }
      u.state = "build";
      return;
    }
    if (t.kind === "repair") {
      const b = this.buildings.find((item) => item.id === t.id);
      if (!b) {
        u.state = "idle";
        return;
      }
      u.state = "repair";
      return;
    }
    if (t.kind === "enemy") {
      const e = this.enemies.find((item) => item.id === t.id && item.state !== "death");
      if (!e) {
        u.state = "idle";
        this.autoWork(u);
        return;
      }
      u.state = "attack";
    }
  }

  public hideAllVillagers() {
    const c = this.castle();
    if (!c) return;
    const targets = this.aliveUnits().filter((u) => u.role !== "warrior" && u.role !== "javelin" && u.role !== "scout" && !u.sheltered);
    if (!targets.length) {
      this.setBanner("No civilian villagers left to shelter", 1.5, "#efb66f");
      return;
    }
    const spots = this.around(c);
    for (const u of targets) {
      this.releaseUnit(u);
      u.sheltered = true;
      const dest = spots.length ? spots[Math.floor(this.rng() * spots.length)] : { x: c.x, y: c.y };
      u.path = this.findPath(u.x, u.y, [dest]);
      u.target = { kind: "move" };
      u.state = u.path.length ? "walk" : "idle";
      u.work = 0;
      u.carry = null;
    }
    this.setBanner(`${targets.length} villagers sheltered in Town Hall`, 2, "#9ce8ff");
    this.log(`Sheltered ${targets.length} villagers inside Town Hall.`);
    sound.playSfx("select");
  }

  public returnVillagersToWork() {
    const targets = this.aliveUnits().filter((u) => u.sheltered);
    if (!targets.length) return;
    for (const u of targets) {
      u.sheltered = false;
      u.state = "idle";
      this.autoWork(u);
    }
    this.setBanner(`${targets.length} villagers returned to work`, 2, "#78e58a");
    this.log(`Recalled ${targets.length} villagers to their jobs.`);
    sound.playSfx("select");
  }

  public canPlaceBuilding(type: BuildingType, x: number, y: number): { valid: boolean; reason?: string } {
    const d = BUILD_SPECS[type];
    if (!d) return { valid: false, reason: "invalid" };

    for (const [res, cost] of Object.entries(d.cost)) {
      if ((this.resources as any)[res] < (cost || 0)) {
        return {
          valid: false,
          reason: this.lang === "pt" ? `Sem ${res} suficiente` : `Not enough ${res}`,
        };
      }
    }

    if (x < 1 || y < 1 || x + d.w >= COLS - 1 || y + d.h >= ROWS - 1) {
      return {
        valid: false,
        reason: this.lang === "pt" ? "Fora dos limites" : "Outside boundaries",
      };
    }

    for (let yy = y; yy < y + d.h; yy++) {
      for (let xx = x; xx < x + d.w; xx++) {
        if (!this.isExplored(xx, yy)) {
          return {
            valid: false,
            reason: this.lang === "pt" ? "Área não explorada" : "Unexplored area",
          };
        }
        if (this.terrain[yy][xx] === "water") {
          return {
            valid: false,
            reason: this.lang === "pt" ? "Terreno com água" : "Water terrain",
          };
        }
        if (this.nodes.some((n) => n.amount > 0 && n.x === xx && n.y === yy)) {
          return {
            valid: false,
            reason: this.lang === "pt" ? "Recurso bloqueando" : "Resource blocking",
          };
        }
        if (this.buildings.some((b) => this.inside(b, xx, yy))) {
          return {
            valid: false,
            reason: this.lang === "pt" ? "Construção bloqueando" : "Building blocking",
          };
        }
      }
    }

    return { valid: true };
  }

  public placeBuilding(type: BuildingType, x: number, y: number) {
    const d = BUILD_SPECS[type];
    if (!d) return;

    for (const [res, cost] of Object.entries(d.cost)) {
      if ((this.resources as any)[res] < (cost || 0)) {
        this.setBanner(
          this.lang === "pt" ? `Recursos insuficientes de ${res}!` : `Not enough ${res}!`,
          1.5,
          "#ef8d78"
        );
        return;
      }
    }

    if (x < 1 || y < 1 || x + d.w >= COLS - 1 || y + d.h >= ROWS - 1) {
      this.setBanner(this.lang === "pt" ? "Fora dos limites do reino" : "Outside kingdom boundaries", 1.5, "#ef8d78");
      return;
    }

    for (let yy = y; yy < y + d.h; yy++) {
      for (let xx = x; xx < x + d.w; xx++) {
        if (!this.isExplored(xx, yy) || this.terrain[yy][xx] === "water" || this.nodes.some((n) => n.amount > 0 && n.x === xx && n.y === yy) || this.buildings.some((b) => this.inside(b, xx, yy))) {
          this.setBanner(this.lang === "pt" ? "Escolha um terreno livre e explorado" : "Choose clear explored ground", 1.6, "#ef8d78");
          return;
        }
      }
    }

    for (const [res, cost] of Object.entries(d.cost)) {
      (this.resources as any)[res] -= cost || 0;
    }

    const b = this.addBuilding({
      type,
      x,
      y,
      w: d.w,
      h: d.h,
      hp: Math.ceil(d.hp * 0.3),
      maxHp: d.hp,
      complete: false,
      progress: 0,
      buildTime: d.time,
      builderId: null,
      repairerId: null,
      arrowCd: 0.4,
      trainCd: 0,
      tier: 1,
    });

    this.buildMode = null;
    this.selected = { kind: "building", id: b.id };
    this.addParticle(x + d.w / 2, y + d.h / 2, "#f0c25a", 16);
    sound.playSfx("place");

    // Eject any units currently standing inside the new building footprint to the perimeter
    for (const u of this.units) {
      if (u.state !== "death" && u.x >= x - 0.35 && u.x <= x + d.w + 0.35 && u.y >= y - 0.35 && u.y <= y + d.h + 0.35) {
        const slots = this.around({ x, y, w: d.w, h: d.h });
        if (slots.length > 0) {
          slots.sort((p1, p2) => Math.hypot(p1.x - u.x, p1.y - u.y) - Math.hypot(p2.x - u.x, p2.y - u.y));
          u.x = slots[0].x;
          u.y = slots[0].y;
          u.path = [];
        } else {
          u.x = x - 0.5;
          u.y = y - 0.5;
        }
      }
    }

    // Look for available builders who are idle
    const idleBuilders = this.units.filter(
      (u) => u.state !== "death" && u.role === "builder" && u.state === "idle"
    );

    const bName = this.getBuildingName(type);
    if (idleBuilders.length > 0) {
      for (const builder of idleBuilders) {
        this.commandBuild(builder, b);
      }
      const count = idleBuilders.length;
      this.setBanner(
        this.lang === "pt"
          ? `🏗 Obras iniciadas: ${bName} (${count} ${count > 1 ? "construtores" : "construtor"})`
          : `🏗 Construction started: ${bName} (${count} ${count > 1 ? "builders" : "builder"})`,
        2,
        "#8fe39a"
      );
      this.log(this.lang === "pt" ? `Obras iniciadas: ${bName} (${count}x velocidade).` : `Construction started: ${bName} (${count}x speed).`);
    } else {
      this.setBanner(
        this.lang === "pt"
          ? `⏳ ${bName} na fila de obras (aguardando construtor)`
          : `⏳ ${bName} queued for construction (waiting for builder)`,
        2.5,
        "#ffd56b"
      );
      this.log(this.lang === "pt" ? `${bName} adicionado à fila de obras.` : `Queued ${bName} in construction queue.`);
    }
  }

  public demolishBuilding(b: Building) {
    if (!b || b.type === "townhall") {
      this.setBanner(
        this.lang === "pt" ? "O Centro da Cidade não pode ser demolido!" : "Town Hall cannot be demolished!",
        2,
        "#ef8d78"
      );
      return;
    }
    const spec = BUILD_SPECS[b.type];
    if (!spec) return;

    // Refund 50% of the invested resources
    const refundedParts: string[] = [];
    for (const [res, cost] of Object.entries(spec.cost)) {
      if (cost && cost > 0) {
        const refundAmt = Math.floor(cost * 0.5);
        if (refundAmt > 0) {
          (this.resources as any)[res] = ((this.resources as any)[res] || 0) + refundAmt;
          refundedParts.push(`+${refundAmt} ${res}`);
        }
      }
    }

    // Release workers attached to this building
    for (const u of this.units) {
      if (
        u.state !== "death" &&
        u.target &&
        (u.target.kind === "build" || u.target.kind === "repair" || u.target.kind === "farm_work") &&
        u.target.id === b.id
      ) {
        u.state = "idle";
        u.target = null;
        this.autoWork(u);
      }
    }

    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    this.addParticle(cx, cy, "#a8a29e", 20, -10, "stone");
    this.addParticle(cx, cy, "#fbbf24", 12, -15, "spark");
    const refundStr = refundedParts.join(" ") || "+Recursos";
    this.float(refundStr, cx, cy, "#fef08a");
    sound.playSfx("hit");
    haptic("medium");

    this.buildings = this.buildings.filter((item) => item.id !== b.id);
    if (this.selected?.kind === "building" && this.selected.id === b.id) {
      this.selected = null;
    }

    const bName = this.getBuildingName(b.type);
    this.setBanner(
      this.lang === "pt"
        ? `♻ ${bName} demolido! 50% dos recursos recuperados.`
        : `♻ ${bName} demolished! 50% of resources recovered.`,
      2.5,
      "#ffd56b"
    );
    this.log(`Demolished ${bName}. Recovered: ${refundStr}`);
  }

  public repairBuilding(b: Building) {
    if (!b || !b.complete || b.hp >= b.maxHp) return;
    const builders = this.aliveUnits().filter((u) => u.role === "builder");
    if (!builders.length) {
      this.setBanner(
        this.lang === "pt"
          ? "Nenhum Construtor disponível! Recrute um no Centro da Cidade."
          : "No Builder available! Recruit one in Town Hall.",
        2,
        "#ef8d78"
      );
      sound.playSfx("warn");
      return;
    }
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    builders.sort((u1, u2) => Math.hypot(u1.x - cx, u1.y - cy) - Math.hypot(u2.x - cx, u2.y - cy));
    const assignedBuilder = builders[0];
    this.commandRepair(assignedBuilder, b);
    this.float(this.lang === "pt" ? "Reparo Solicitado!" : "Repair Ordered!", cx, b.y, "#78e58a");
    sound.playSfx("hammer");
    haptic("light");
  }

  public recruitRole(role: RoleType): boolean {
    const c = this.castle();
    if (!c) {
      this.setBanner(this.lang === "pt" ? "Câmara Municipal destruída!" : "Town Hall destroyed!", 2, "#ef8d78");
      return false;
    }
    if (this.aliveUnits().length >= this.popCap()) {
      this.setBanner(
        this.lang === "pt" ? "Limite de população atingido! Construa Casas." : "Population limit reached! Build Houses.",
        2.5,
        "#ef8d78"
      );
      sound.playSfx("warn");
      return false;
    }

    const conf = (BALANCE.roles as any)[role] || {
      label: ROLE_INFO[role]?.label || role,
      cost: { wood: 20, food: 35 },
    };

    for (const [res, cost] of Object.entries(conf.cost as Record<string, number>)) {
      if ((this.resources as any)[res] < (cost || 0)) {
        const resLabel = this.lang === "pt"
          ? (res === "wood" ? "Madeira" : res === "stone" ? "Pedra" : res === "gold" ? "Ouro" : res === "food" ? "Comida" : "Cristal")
          : res;
        this.setBanner(
          this.lang === "pt" ? `Recursos insuficientes de ${resLabel}!` : `Not enough ${resLabel}!`,
          1.5,
          "#ef8d78"
        );
        sound.playSfx("warn");
        return false;
      }
    }

    for (const [res, cost] of Object.entries(conf.cost as Record<string, number>)) {
      (this.resources as any)[res] -= cost || 0;
    }

    const spots = this.around(c);
    const frontOrSideSpots = spots.filter((s) => s.y >= c.y);
    const candidateSpots = frontOrSideSpots.length > 0 ? frontOrSideSpots : spots;
    const freeSpot = candidateSpots.find((s) => !this.occupied(s.x, s.y));
    const spawnPos = freeSpot || (candidateSpots.length ? candidateSpots[0] : { x: c.x, y: c.y + 2 });

    const u = this.addUnit(spawnPos.x, spawnPos.y, role);
    this.objectives.recruit = true;

    this.addParticle(spawnPos.x + 0.5, spawnPos.y + 0.5, ROLE_INFO[role]?.hat || "#8fe39a", 16);
    sound.playSfx("recruit");

    const roleName = this.getRoleName(role);
    this.setBanner(
      this.lang === "pt" ? `Novo ${roleName} contratado!` : `New ${roleName} recruited!`,
      2,
      "#8fe39a"
    );
    this.log(this.lang === "pt" ? `Recrutado ${u.name} como ${roleName}.` : `Recruited ${u.name} as ${roleName}.`);
    this.sayLine(u, "onClick", this.lang);
    this.autoWork(u);
    return true;
  }

  public fortifyTownHall(): boolean {
    const c = this.castle();
    if (!c || c.tier >= 3 || c.upgrading) return false;
    const nextTier = (c.tier + 1) as 2 | 3;
    const upg = BALANCE.upgrades[nextTier];
    if (!upg) return false;

    const costW = upg.cost.wood || 0;
    const costS = upg.cost.stone || 0;
    const costG = upg.cost.gold || 0;

    if (this.resources.wood < costW || this.resources.stone < costS || this.resources.gold < costG) {
      this.setBanner(
        this.lang === "pt"
          ? `Necessário ${costW}🪵 ${costS}🪨 ${costG}💰 para Fortificar Nv.${nextTier}!`
          : `Need ${costW}W ${costS}S ${costG}G to Fortify Lv.${nextTier}!`,
        2.2,
        "#ef8d78"
      );
      sound.playSfx("warn");
      return false;
    }

    this.resources.wood -= costW;
    this.resources.stone -= costS;
    this.resources.gold -= costG;

    c.upgrading = true;
    c.progress = 0;
    c.buildTime = 12;

    const idleBuilders = this.units.filter((u) => u.state !== "death" && u.role === "builder" && u.state === "idle" && !u.sheltered);
    for (const builder of idleBuilders) {
      this.commandBuild(builder, c);
    }

    this.addParticle(c.x + c.w / 2, c.y + c.h / 2, "#ffd56b", 22);
    sound.playSfx("upgrade");
    this.setBanner(
      this.lang === "pt"
        ? `🏰 Fortificando Câmara Municipal para Nv.${nextTier}!`
        : `🏰 Fortifying Town Hall to Lv.${nextTier}!`,
      3,
      "#f2c95a"
    );
    this.log(this.lang === "pt" ? `Fortificação da Câmara Municipal Nv.${nextTier} iniciada.` : `Town Hall Lv.${nextTier} fortification started.`);
    return true;
  }

  public trainFromBarracks(b: Building, role: "warrior" | "javelin" | "scout"): boolean {
    if (!b || !b.complete) return false;
    if (this.aliveUnits().length >= this.popCap()) {
      this.setBanner(
        this.lang === "pt" ? "Limite de população atingido! Construa mais Casas." : "Population cap reached! Build more Houses.",
        2.2,
        "#ef8d78"
      );
      sound.playSfx("warn");
      return false;
    }

    const conf = BALANCE.roles[role];
    for (const [res, cost] of Object.entries(conf.cost as Record<string, number>)) {
      if ((this.resources as any)[res] < (cost || 0)) {
        this.setBanner(
          this.lang === "pt" ? `Recursos insuficientes para treinar ${this.getRoleName(role)}!` : `Not enough resources to train ${conf.label}!`,
          1.8,
          "#ef8d78"
        );
        sound.playSfx("warn");
        return false;
      }
    }

    for (const [res, cost] of Object.entries(conf.cost as Record<string, number>)) {
      (this.resources as any)[res] -= cost || 0;
    }

    const spots = this.around(b);
    const frontOrSide = spots.filter((s) => s.y >= b.y);
    const candidates = frontOrSide.length > 0 ? frontOrSide : spots;
    const freeSpot = candidates.find((s) => !this.occupied(s.x, s.y));
    const spawnPos = freeSpot || (candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : { x: b.x, y: b.y + b.h });

    const u = this.addUnit(spawnPos.x, spawnPos.y, role);
    const col = role === "warrior" ? "#ffd56b" : role === "javelin" ? "#a8d4ff" : "#73d9ff";
    this.addParticle(spawnPos.x + 0.5, spawnPos.y + 0.5, col, 18);
    sound.playSfx("recruit");

    const rName = this.getRoleName(role);
    this.setBanner(
      this.lang === "pt" ? `${conf.icon} ${rName} pronto para o combate!` : `${conf.icon} ${rName} ready for battle!`,
      2.2,
      col
    );
    this.log(this.lang === "pt" ? `${u.name} (${rName}) treinado no Quartel.` : `Trained ${u.name} (${rName}) at Barracks.`);
    this.sayLine(u, "onClick", this.lang);
    this.autoWork(u);
    return true;
  }

  public rallyArmy() {
    const troops = this.aliveUnits().filter((u) => u.role === "warrior" || u.role === "javelin" || u.role === "scout");
    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    const c = this.castle();

    const activeEnemy = this.nearestEnemyForUnit(
      hero ? { x: hero.x, y: hero.y } : c ? { x: c.x + 1, y: c.y + 1 } : { x: 32, y: 32 },
      64
    );

    if (activeEnemy) {
      for (const u of troops) {
        this.commandAttack(u, activeEnemy);
      }
      if (hero) {
        hero.targetEnemy = activeEnemy;
        hero.targetX = undefined;
        hero.targetY = undefined;
      }
      this.setBanner(
        this.lang === "pt" ? "⚔️ Exército convocado para atacar os invasores!" : "⚔️ Army rallied to strike the invaders!",
        2.2,
        "#ff9d4d"
      );
      sound.playSfx("select");
      return;
    }

    const rallyCenter = hero
      ? { x: Math.round(hero.x), y: Math.round(hero.y) }
      : c
      ? { x: c.x + 1, y: c.y + c.h + 1 }
      : { x: 32, y: 34 };

    for (let i = 0; i < troops.length; i++) {
      const u = troops[i];
      const offsetAngle = (i * Math.PI * 2) / Math.max(1, troops.length);
      const rx = Math.round(rallyCenter.x + Math.cos(offsetAngle) * 1.5);
      const ry = Math.round(rallyCenter.y + Math.sin(offsetAngle) * 1.5);
      const dest = this.getFreeNeighborTile(rx, ry, u.id);
      u.target = { kind: "move", x: dest.x, y: dest.y };
      u.path = this.findPath(u.x, u.y, [dest]);
      u.state = u.path.length ? "walk" : "idle";
    }

    this.addClickMarker(rallyCenter.x + 0.5, rallyCenter.y + 0.5, "#ffd56b");
    this.setBanner(
      this.lang === "pt" ? "🛡️ Tropas reunidas em formação defensiva!" : "🛡️ Troops rallied in defensive formation!",
      2.2,
      "#ffd56b"
    );
    sound.playSfx("select");
  }

  public summonGolem() {
    if (this.screen !== "play" || this.paused) return;
    if (this.golem && this.golem.hp > 0) {
      this.setBanner(this.lang === "pt" ? "Apenas um Golem pode estar ativo por vez!" : "Only one Golem may be active at a time", 2, "#9c6cc8");
      return;
    }
    if (this.resources.crystal < BALANCE.golem.cost) {
      this.setBanner(this.lang === "pt" ? `Necessário ${BALANCE.golem.cost} Cristais para invocar o Golem!` : `Need ${BALANCE.golem.cost} Crystals to summon Golem`, 2, "#9c6cc8");
      return;
    }

    const c = this.castle();
    const spawnPos = (this.golemMound && this.walkable(this.golemMound.x, this.golemMound.y)) ? this.golemMound : c ? { x: c.x + 3, y: c.y - 2 } : { x: 32, y: 32 };

    this.resources.crystal -= BALANCE.golem.cost;
    this.stats.crystalSpent += BALANCE.golem.cost;

    this.golem = {
      id: ++this.nextId.golem,
      kind: "golem",
      x: spawnPos.x,
      y: spawnPos.y,
      hp: BALANCE.golem.maxHp,
      maxHp: BALANCE.golem.maxHp,
      damage: BALANCE.golem.damage,
      speed: BALANCE.golem.speed,
      aoeRadius: BALANCE.golem.aoeRadius,
      attackRate: BALANCE.golem.attackRate,
      timer: BALANCE.golem.duration,
      duration: BALANCE.golem.duration,
      state: "idle",
      path: [],
      pathClock: 0,
      attackCd: 0.35,
      anim: 0,
      flash: 0,
      rise: 0.6,
      falling: 0,
    };

    this.setBanner(this.lang === "pt" ? "GOLEM DE PEDRA DESPERTOU!" : "SUMMONED GOLEM ARRIVED!", 3, "#73d9ff");
    this.log(this.lang === "pt" ? `Golem de Pedra invocado por ${BALANCE.golem.duration}s.` : `Summoned Stone Golem rises for ${BALANCE.golem.duration}s.`);
    this.addParticle(spawnPos.x + 0.5, spawnPos.y + 0.5, "#73d9ff", 28);
    this.addParticle(spawnPos.x + 0.5, spawnPos.y + 0.5, "#9c6cc8", 16);
    this.float(this.lang === "pt" ? "GOLEM CHEGOU" : "GOLEM ARRIVED", spawnPos.x + 0.5, spawnPos.y, "#73d9ff");
    sound.playSfx("build");
  }

  public summonHero() {
    const conf = (BALANCE as any).hero || (BALANCE.altarHeroes as any).hero || BALANCE.altarHeroes.frontline;
    const heroName = this.lang === "pt" ? "Herói do Reino" : "Hero of the Realm";

    const existing = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (existing && existing.hp > 0) {
      if (existing.level >= BALANCE.altarHeroMaxLevel) {
        this.setBanner(
          this.lang === "pt" ? `${heroName} já está no Nível Máximo (Lv.${existing.level})!` : `${heroName} is already at Max Level (Lv.${existing.level})!`,
          2.5,
          "#ffd56b"
        );
        return;
      }
      const upgradeGold = 35 + existing.level * 15;
      const upgradeCrystal = 20 + existing.level * 10;
      if (this.resources.gold < upgradeGold || this.resources.crystal < upgradeCrystal) {
        this.setBanner(
          this.lang === "pt"
            ? `Necessário ${upgradeGold}💰 ${upgradeCrystal}💎 para empoderar o Herói!`
            : `Need ${upgradeGold}G ${upgradeCrystal} Crystal to empower Hero!`,
          2.5,
          "#ffd56b"
        );
        return;
      }
      this.resources.gold -= upgradeGold;
      this.resources.crystal -= upgradeCrystal;
      this.stats.crystalSpent += upgradeCrystal;
      existing.level++;
      const mult = 1 + 0.28 * (existing.level - 1);
      existing.maxHp = Math.round(conf.hp * mult);
      existing.hp = existing.maxHp;
      existing.damage = Math.round(conf.damage * mult);
      this.setBanner(
        this.lang === "pt" ? `⭐ HERÓI EMPODERADO · NÍVEL ${existing.level}!` : `⭐ HERO EMPOWERED · LEVEL ${existing.level}!`,
        3,
        "#ffd56b"
      );
      this.log(
        this.lang === "pt"
          ? `O Herói do Reino atingiu o Nível ${existing.level} com mais vida e poder de ataque.`
          : `The Hero of the Realm reached Level ${existing.level} with boosted health and strength.`
      );
      this.addParticle(existing.x + 0.5, existing.y + 0.5, "#ffd56b", 30);
      this.float(`NV.${existing.level} ⭐`, existing.x + 0.5, existing.y - 0.5, "#ffd56b");
      sound.playSfx("upgrade");
      return;
    }

    // Summoning Hero for the first time or reviving
    if (this.resources.gold < conf.cost.gold || this.resources.crystal < conf.cost.crystal) {
      this.setBanner(
        this.lang === "pt"
          ? `Necessário ${conf.cost.gold}💰 ${conf.cost.crystal}💎 para invocar o Herói!`
          : `Need ${conf.cost.gold}G ${conf.cost.crystal} Crystal to summon Hero!`,
        2.5,
        "#ffd56b"
      );
      return;
    }

    const c = this.castle();
    const altar = this.buildings.find((b) => b.type === "altar" && b.complete);
    const aroundAltar = altar ? this.around(altar) : [];
    const aroundCastle = c ? this.around(c) : [];
    const spawnTile =
      aroundAltar.length > 0
        ? aroundAltar[0]
        : aroundCastle.length > 0
        ? aroundCastle[0]
        : altar
        ? { x: altar.x + 1, y: altar.y + altar.h }
        : c
        ? { x: c.x + 2, y: c.y + 3 }
        : { x: 32, y: 32 };
    const spawnPos = { x: spawnTile.x, y: spawnTile.y };

    this.resources.gold -= conf.cost.gold;
    this.resources.crystal -= conf.cost.crystal;
    this.stats.crystalSpent += conf.cost.crystal;

    const hero: AltarHero = {
      id: ++this.nextId.altarHero,
      name: heroName,
      role: "hero",
      level: 1,
      x: spawnPos.x,
      y: spawnPos.y,
      hp: conf.hp,
      maxHp: conf.hp,
      damage: conf.damage,
      speed: conf.speed,
      attackRate: conf.attackRate,
      range: conf.range || 1.6,
      timer: Infinity,
      duration: Infinity,
      state: "idle",
      path: [],
      pathClock: 0,
      attackCd: 0.3,
      specialCd: 0,
      maxSpecialCd: conf.specialCd || 8.5,
      anim: 0,
      flash: 0,
      summonTimer: 2.5,
    };

    this.heroUnit = hero;
    this.altarHeroes = { hero, frontline: hero, ranger: hero, mage: hero };

    this.setBanner(
      this.lang === "pt" ? "👑 HERÓI DO REINO INVOCADO!" : "👑 HERO OF THE REALM SUMMONED!",
      3.5,
      "#ffd56b"
    );
    this.log(
      this.lang === "pt"
        ? "O Herói do Reino surgiu do Altar Sagrado para liderar suas forças!"
        : "The Hero of the Realm emerges from the Sacred Altar to lead your kingdom!"
    );
    this.addParticle(spawnPos.x + 0.5, spawnPos.y + 0.5, "#ffd56b", 35);
    this.addParticle(spawnPos.x + 0.5, spawnPos.y + 0.5, "#73d9ff", 20);
    this.float(this.lang === "pt" ? "HERÓI CHEGOU 👑" : "HERO ARRIVED 👑", spawnPos.x + 0.5, spawnPos.y, "#ffd56b");
    sound.playSfx("heroArrive");
  }

  public summonAltarHero(role?: AltarHeroRole) {
    this.summonHero();
  }

  public beginWave() {
    const count = Math.round((BALANCE.firstHorde.count + (this.waveNumber - 1) * BALANCE.horde.countPerWave) * (1 + Math.floor((this.waveNumber - 1) / 5) * 0.1));
    this.edge = this.edge || (["north", "east", "south", "west"][Math.floor(this.rng() * 4)] as any);
    this.horde = {
      wave: this.waveNumber,
      count,
      spawned: 0,
      timer: 0,
      edge: this.edge!,
      cleared: false,
      eliteSpawned: false,
    };
    this.setBanner(`WAVE ${this.waveNumber} · THE SWARM ATTACKS FROM ${this.edge?.toUpperCase()}!`, 4, "#ff6b6b");
    this.log(`Wave ${this.waveNumber} began. ${count} bugs coming from the ${this.edge}.`);
    sound.setCombatMode(true);
    sound.playDuskHorn();
    setTimeout(() => sound.playCricketChirp(), 1800);
  }

  public beginBossWave() {
    const wave = this.waveNumber;
    const count = Math.round((BALANCE.firstHorde.count + (wave - 1) * BALANCE.horde.countPerWave) * 1.1);
    this.edge = this.edge || (["north", "east", "south", "west"][Math.floor(this.rng() * 4)] as any);
    this.horde = { wave, count, spawned: 0, timer: 0, edge: this.edge!, cleared: false, eliteSpawned: false };

    const p = this.spawnEdge(this.edge!);
    const bossIdx = Math.floor((wave - 1) / BALANCE.cycle.bossEvery);
    const variants: BossVariant[] = ["spider", "cicada", "moth"];
    const isCampaignFinal = this.gameMode === "campaign" && this.activeChapter === 5;
    const variant: BossVariant = isCampaignFinal ? "spider" : variants[bossIdx % variants.length];
    const names = { spider: "SPIDER QUEEN", cicada: "CICADA SOVEREIGN", moth: "MOTH EMPRESS" };
    const bossName = isCampaignFinal
      ? (this.lang === "pt" ? "RAINHA ARANHA SOBERANA" : "SOVEREIGN SPIDER QUEEN")
      : names[variant];
    const bossHp = Math.round(BALANCE.boss.hp + (isCampaignFinal ? 1 : bossIdx) * BALANCE.boss.hpPerWave);

    this.boss = {
      id: ++this.nextId.enemy,
      kind: "boss",
      variant,
      name: bossName,
      species: "ant",
      x: p.x,
      y: p.y,
      hp: bossHp,
      maxHp: bossHp,
      damage: BALANCE.boss.damage + bossIdx * BALANCE.boss.damagePerWave,
      attackRate: BALANCE.boss.attackRate,
      speed: BALANCE.boss.speed,
      state: "walk",
      path: [],
      target: null,
      pathClock: 0,
      attackCd: 0.5,
      contactCd: 0,
      anim: 0,
      flash: 0,
      death: 0,
    };

    this.setBanner(`★ BOSS WAVE ${wave} · ${bossName} APPROACHES! ★`, 5, "#ff4444");
    this.log(`Boss Wave! ${bossName} emerges from the ${this.edge}.`);
    sound.playBossMusic();
    sound.playSfx("bossRoar");
  }

  /**
   * CRITICAL BUGFIX: spawnEdge accurately calculates edge spawning
   * on the full COLS and ROWS map without clipping to 31.
   */
  public spawnEdge(edge: string): Position {
    for (let t = 0; t < 100; t++) {
      let x = 1, y = 1;
      if (edge === "north") {
        x = Math.floor(this.rng() * (COLS - 2)) + 1;
        y = 1;
      } else if (edge === "south") {
        x = Math.floor(this.rng() * (COLS - 2)) + 1;
        y = ROWS - 2;
      } else if (edge === "west") {
        x = 1;
        y = Math.floor(this.rng() * (ROWS - 2)) + 1;
      } else {
        x = COLS - 2;
        y = Math.floor(this.rng() * (ROWS - 2)) + 1;
      }

      if (this.terrain[y][x] !== "water") {
        return { x, y };
      }
    }
    return { x: 2, y: 2 };
  }

  public spawnEnemy(elite: boolean, wave: number, edge: string) {
    const p = this.spawnEdge(edge);
    const esc = 1 + Math.floor((wave - 1) / 5) * 0.1;
    const hp0 = (BALANCE.firstHorde.hp + (wave - 1) * BALANCE.horde.hpPerWave) * esc;
    const dmg0 = BALANCE.firstHorde.damage + (wave - 1) * BALANCE.horde.damageStep;

    const pool = [["ant", 5], ["ladybug", wave >= 2 ? 3 : 1], ["stinkbug", wave >= 4 ? 3 : 0], ["scarab", wave >= 6 ? 2 : 0], ["centipede", wave >= 7 ? 2 : 0], ["mantis", wave >= 9 ? 2 : 0]] as const;
    let total = 0;
    pool.forEach((pair) => (total += pair[1]));
    let r = this.rng() * total;
    let chosen: any = "ant";
    for (const pair of pool) {
      if (r < pair[1]) {
        chosen = pair[0];
        break;
      }
      r -= pair[1];
    }

    const sm = SPECIES_MODS[chosen as keyof typeof SPECIES_MODS] || SPECIES_MODS.ant;
    const hp = elite ? hp0 * sm.hp * BALANCE.horde.eliteHpMultiplier : hp0 * sm.hp;
    const damage = elite ? dmg0 * sm.dmg + BALANCE.horde.eliteDamageBonus : dmg0 * sm.dmg;
    const speed = elite ? 0.95 : Math.min(BALANCE.horde.speedCap, BALANCE.firstHorde.speed + (wave - 1) * BALANCE.horde.speedPerWave) * sm.spd;

    this.enemies.push({
      id: ++this.nextId.enemy,
      kind: elite ? "elite" : "raider",
      species: chosen,
      x: p.x,
      y: p.y,
      hp,
      maxHp: hp,
      damage,
      attackRate: BALANCE.firstHorde.attackRate,
      speed,
      state: "walk",
      path: [],
      target: null,
      pathClock: 0,
      attackCd: 0.5,
      contactCd: 0,
      anim: 0,
      flash: 0,
      death: 0,
    });
  }

  public update(rawDt: number) {
    if (this.screen !== "play" || this.paused) return;
    const dt = rawDt * (this.speed || 1);

    if (this.shake.time > 0) {
      this.shake.time = Math.max(0, this.shake.time - dt);
    }
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      return;
    }

    // Smooth resource interpolation
    for (const key of ["wood", "stone", "gold", "food", "crystal"] as ResourceType[]) {
      const diff = this.resources[key] - this.resDisplay[key];
      if (Math.abs(diff) < 0.05) {
        this.resDisplay[key] = this.resources[key];
      } else {
        this.resDisplay[key] += diff * Math.min(1, dt * 14);
      }
    }

    if (this.clickMarker) {
      this.clickMarker.time += dt;
      if (this.clickMarker.time >= this.clickMarker.max) this.clickMarker = null;
    }

    // Day/Night Cycle
    this.time += dt;
    this.waveNumber = Math.floor(Math.max(0, this.time) / BALANCE.cycle.total) + 1;
    const p = this.phaseInfo();
    this.phase = p.name;
    this.phaseRemain = p.remain;

    if (p.name === "Build" && p.remain <= 6 && p.remain > 0 && this.lastWarnedWave !== this.waveNumber) {
      this.lastWarnedWave = this.waveNumber;
      this.edge = (["north", "east", "south", "west"][Math.floor(this.rng() * 4)] as any);
      this.setBanner(`⚠ WAVE INCOMING FROM ${this.edge?.toUpperCase()}... PREPARE! ⚠`, 4.5, "#ff6b6b");
      sound.playSfx("warn");
    }

    if (p.name !== this.prevPhase) {
      const wasNight = this.prevPhase === "Wave" || this.prevPhase === "Boss Wave";
      if (p.name === "Build") {
        if (wasNight && this.horde) {
          this.grantWaveReward(this.horde.wave);
          this.horde.cleared = true;
        }
        if (wasNight) {
          sound.playDawnBell();
          setTimeout(() => sound.playBirdChirp(), 1500);
          // Dawn sunlight purifies lingering bugs so they never remain paralyzed on the map
          const lingering = this.enemies.filter((e) => e.state !== "death");
          if (lingering.length > 0) {
            this.setBanner(
              this.lang === "pt"
                ? "☀️ O sol do amanhecer purifica e dissolve os invasores restantes!"
                : "☀️ The morning sun burns away lingering swarm invaders!",
              3.5,
              "#ffd56b"
            );
            lingering.forEach((e) => {
              this.damageEnemy(e, 9999);
              this.addParticle(e.x + 0.5, e.y + 0.5, "#ffd56b", 16, -20, "ember");
            });
          }
        }
        this.edge = null;
        sound.stopBossMusic();
        sound.setCombatMode(false);
        this.boss = null;
        this.log("Build phase: expand town, repair structures, train defenders.");
      } else if (p.name === "Wave") {
        this.beginWave();
      } else if (p.name === "Boss Wave") {
        this.beginBossWave();
      }
      this.prevPhase = p.name;
    }

    this.recruitCd = Math.max(0, this.recruitCd - dt);
    this.exploreCd = Math.max(0, this.exploreCd - dt);
    if (this.banner.time > 0) this.banner.time -= dt;
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.combo.time > 0) this.combo.time -= dt;

    // Farm Food Clock
    this.foodClock += dt;
    while (this.foodClock >= 4) {
      this.foodClock -= 4;
      const farmCount = this.completed("farm").length;
      if (farmCount > 0) {
        this.resources.food += farmCount * 2;
      }
    }

    // Hero Commander Cooldowns & War Cry Buff
    this.abilityHolyStrikeCd = Math.max(0, this.abilityHolyStrikeCd - dt);
    this.abilityWarCryCd = Math.max(0, this.abilityWarCryCd - dt);
    this.abilityHolyLightCd = Math.max(0, this.abilityHolyLightCd - dt);
    this.warCryBuffTimer = Math.max(0, this.warCryBuffTimer - dt);

    // Enemy Hives Flash
    for (const h of this.enemyHives) {
      if (h.flash > 0) h.flash = Math.max(0, h.flash - dt);
    }

    // Sacred Fountain of Life Area Regeneration
    if (this.fountainOfLife) {
      const f = this.fountainOfLife;
      for (const u of this.units) {
        if (u.state !== "death" && u.hp < u.maxHp) {
          if (Math.hypot(u.x - f.x, u.y - f.y) <= f.radius) {
            u.hp = Math.min(u.maxHp, u.hp + f.healingRate * dt);
            if (Math.random() < 0.1) {
              this.addParticle(u.x + 0.5, u.y + 0.5, "#38bdf8", 1, 10, "spark");
            }
          }
        }
      }
      const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
      if (hero && hero.hp < hero.maxHp) {
        if (Math.hypot(hero.x - f.x, hero.y - f.y) <= f.radius) {
          hero.hp = Math.min(hero.maxHp, hero.hp + f.healingRate * dt);
          if (Math.random() < 0.15) {
            this.addParticle(hero.x + 0.5, hero.y + 0.5, "#38bdf8", 2, 10, "spark");
          }
        }
      }
    }

    // Passive Relic Regeneration
    if (this.relics.some((r) => r.effect === "regen")) {
      for (const u of this.units) {
        if (u.state !== "death" && u.hp < u.maxHp) {
          u.hp = Math.min(u.maxHp, u.hp + dt * 1.5);
        }
      }
    }

    this.updateNodes(dt);
    this.updateBuildings(dt);
    this.updateUnits(dt);
    if (this.hero) this.updateHero(dt);
    if (this.golem) this.updateGolem(dt);
    this.updateAltarHeroes(dt);

    if (this.phase !== "Build") {
      this.updateHorde(dt);
    }
    if (this.enemies.length > 0) {
      this.updateEnemies(dt);
    }
    if (this.boss && this.boss.state !== "death") {
      this.updateBoss(dt);
    }

    // Physical unit collision resolution and body blocking
    this.resolveCollisions();

    this.updateArrows(dt);
    this.updateParticles(dt);

    this.visionClock -= dt;
    if (this.visionClock <= 0) {
      this.visionClock = 0.3;
      this.updateVision();
    }

    if (this.gameMode === "campaign") {
      this.checkCampaignObjectives();
    }
  }

  private grantWaveReward(wave: number) {
    if (!wave || this.lastWaveCleared >= wave) return;
    this.lastWaveCleared = wave;
    this.wavesSurvived++;
    this.objectives.wave = true;

    const mult = 1 + Math.floor(this.wavesSurvived / 3) * 0.18;
    const gained = {
      wood: Math.round(BALANCE.reward.wood * mult),
      stone: Math.round(BALANCE.reward.stone * mult),
      gold: Math.round(BALANCE.reward.gold * mult),
      crystal: Math.round(BALANCE.reward.crystal * mult),
    };

    this.stats.resourcesCollected = (this.stats.resourcesCollected || 0) + gained.wood + gained.stone + gained.gold + gained.crystal;

    funtico.recordEvent("wave_cleared", {
      wave,
      wavesSurvived: this.wavesSurvived,
      kills: this.stats.kills,
      time: Math.floor(this.time),
    }, Math.floor(this.time));

    for (const [k, v] of Object.entries(gained)) {
      (this.resources as any)[k] += v;
    }

    const milestone = this.wavesSurvived % 5 === 0;
    if (milestone) {
      const bonus = Math.round(50 * mult);
      this.resources.crystal += bonus;
      this.setBanner(`MILESTONE! SURVIVED ${this.wavesSurvived} WAVES! +${bonus} Bonus Crystals`, 4.5, "#73d9ff");
      this.log(`Milestone reached: ${this.wavesSurvived} waves survived. +${bonus} Crystal bonus.`);
    } else {
      this.setBanner(`WAVE SURVIVED! +${gained.wood}W +${gained.stone}S +${gained.gold}G +${gained.crystal} Crystal`, 3.5, "#8fe39a");
      this.log(`Wave survived. Gained +${gained.wood}W, +${gained.stone}S, +${gained.gold}G, +${gained.crystal} Crystal.`);
    }

    sound.playSfx("upgrade");
    if (this.wavesSurvived > this.bestWave) {
      this.bestWave = this.wavesSurvived;
      try {
        localStorage.setItem("tinyRealmBestWave_v2", String(this.bestWave));
      } catch {}
    }
  }

  private updateHorde(dt: number) {
    if (!this.horde || this.horde.cleared) return;
    const h = this.horde;
    h.timer -= dt;

    if (h.spawned < h.count && h.timer <= 0) {
      const n = Math.min(BALANCE.horde.packetSize, h.count - h.spawned);
      const eliteNight = h.wave % BALANCE.horde.eliteEvery === 0;
      const packetElite = eliteNight && !h.eliteSpawned && h.spawned === 0;

      for (let i = 0; i < n; i++) {
        this.spawnEnemy(packetElite && i === 0, h.wave, h.edge);
      }
      if (packetElite) h.eliteSpawned = true;
      h.spawned += n;
      h.timer = Math.max(0.35, Math.min(BALANCE.horde.packetGap, 12 / Math.ceil(h.count / BALANCE.horde.packetSize)));
      this.log(`${n} insect invaders entered from the ${h.edge}.`);
    }

    const hasAliveEnemies = this.enemies.some((e) => e.state !== "death");
    if (h.spawned >= h.count && !hasAliveEnemies && !this.boss) {
      h.cleared = true;
      this.grantWaveReward(h.wave);
    }
  }

  private updateNodes(dt: number) {
    for (const n of this.nodes) {
      n.flash = Math.max(0, n.flash - dt);
      if (n.type === "field") {
        n.amount = Math.min(n.max, n.amount + dt * 0.6);
      }
      if (n.amount <= 0 && (n.type === "tree" || n.type === "rock")) {
        n.respawnTimer = (n.respawnTimer || 90) - dt;
        if (n.respawnTimer <= 0) {
          n.amount = n.max;
          n.respawnTimer = null;
          n.flash = 0.3;
          this.addParticle(n.x + 0.5, n.y + 0.5, n.type === "tree" ? "#3d7a44" : "#9c9690", 12);
        }
      }
    }
  }

  private updateBuildings(dt: number) {
    for (const b of this.buildings) {
      b.flash = Math.max(0, (b.flash || 0) - dt);
      b.trainCd = Math.max(0, (b.trainCd || 0) - dt);

      if (!b.complete || b.upgrading) {
        // Automatically dispatch any idle builders to unfinished or upgrading structures
        const activeBuilders = this.units.filter(
          (u) => u.state !== "death" && u.role === "builder" && u.target?.kind === "build" && u.target?.id === b.id
        );
        if (activeBuilders.length === 0) {
          const idleBuilder = this.units.find(
            (u) => u.state !== "death" && u.role === "builder" && u.state === "idle" && !u.sheltered
          );
          if (idleBuilder) {
            this.commandBuild(idleBuilder, b);
          }
        }
        // Baseline autonomous progress so Town Hall upgrades or constructions never stall permanently if builders are busy
        b.progress += dt * 0.35;
        if (b.progress >= b.buildTime) {
          b.builderId = null;
          b.progress = b.buildTime;
          if (b.type === "townhall" && b.upgrading) {
            b.tier++;
            b.upgrading = false;
            b.maxHp = BALANCE.townHall[b.tier as 1 | 2 | 3].hp;
            b.hp = b.maxHp;
            this.setBanner(
              this.lang === "pt"
                ? `🏰 Câmara Municipal Nv.${b.tier} (${BALANCE.townHall[b.tier as 1 | 2 | 3].name}) Concluída!`
                : `🏰 Town Hall Tier ${b.tier} (${BALANCE.townHall[b.tier as 1 | 2 | 3].name}) Complete!`,
              3.2,
              "#f3d27e"
            );
            this.log(`Town Hall fortified to Tier ${b.tier} ${BALANCE.townHall[b.tier as 1 | 2 | 3].name}.`);
          } else {
            b.complete = true;
            b.hp = b.maxHp;
            if (b.type === "farm") this.objectives.farm = true;
            if (b.type === "house") this.objectives.house = true;
            this.setBanner(`${this.getBuildingName(b.type)} ${this.lang === "pt" ? "construído!" : "constructed!"}`, 2, "#8fe39a");
            this.log(`${BUILD_SPECS[b.type]?.label || b.type} completed.`);
          }
          sound.playSfx("build");
          for (const worker of this.units) {
            if (worker.state !== "death" && worker.role === "builder" && worker.target?.kind === "build" && worker.target?.id === b.id) {
              worker.state = "idle";
              this.autoWork(worker);
            }
          }
        }
        continue;
      }

      if ((this.phase !== "Build" || this.enemies.some((e) => e.state !== "death")) && (b.type === "townhall" || b.type === "tower" || b.type === "altar")) {
        b.arrowCd -= dt;
        const conf = b.type === "townhall" ? BALANCE.townHall[b.tier as 1 | 2 | 3] : b.type === "altar" ? BALANCE.altar : { arrowDamage: 7, arrowRate: 1.0, range: 5.5 };
        const e = this.nearestEnemyForUnit({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, conf.range);
        if (e && b.arrowCd <= 0) {
          b.arrowCd = conf.arrowRate;
          this.fireArrow(b, e, conf.arrowDamage, b.type === "altar" ? "#c88eff" : "#ffde84", b.type === "altar" ? "arcane" : "arrow");
        }
      }
    }
  }

  public fireArrow(
    b: { x: number; y: number; w: number; h: number },
    e: Enemy,
    damage: number,
    color = "#ffde84",
    snd = "arrow",
    chain?: { chance: number; damage: number },
    shape?: string
  ) {
    this.arrows.push({
      id: ++this.nextId.arrow,
      sx: (b.x + b.w / 2) * TS,
      sy: (b.y + b.h / 2) * TS,
      tx: (e.x + 0.5) * TS,
      ty: (e.y + 0.5) * TS,
      t: 0,
      dur: shape === "javelin" ? 0.38 : 0.32,
      target: e.id,
      targetIsBoss: e.kind === "boss",
      damage,
      color,
      chain,
      shape,
    });
    sound.playSfx(snd as any);
  }

  private updateArrows(dt: number) {
    for (const a of this.arrows) {
      a.t += dt / a.dur;
      if (a.t >= 1) {
        let target: Enemy | null = null;
        if (this.boss && this.boss.id === a.target && this.boss.state !== "death") target = this.boss;
        else target = this.enemies.find((e) => e.id === a.target && e.state !== "death") || null;

        if (target) {
          this.damageEnemy(target, a.damage);
          if (a.chain && Math.random() < a.chain.chance) {
            this.chainLightning(target.x, target.y, target, a.chain);
          }
        }
      }
    }
    this.arrows = this.arrows.filter((a) => a.t < 1);
  }

  private chainLightning(fromX: number, fromY: number, exclude: Enemy, chain: { chance: number; damage: number }) {
    let secondTarget: Enemy | null = null;
    let minDist = 2.8;
    for (const e of this.enemies) {
      if (e.state === "death" || e === exclude) continue;
      const d = Math.hypot(fromX - e.x, fromY - e.y);
      if (d < minDist) {
        minDist = d;
        secondTarget = e;
      }
    }
    if (secondTarget) {
      this.damageEnemy(secondTarget, chain.damage);
      this.addParticle(secondTarget.x + 0.5, secondTarget.y + 0.5, "#8ef2ff", 12);
      this.float(`-${chain.damage}`, secondTarget.x, secondTarget.y, "#8ef2ff");
    }
  }

  private updateUnits(dt: number) {
    for (const u of this.units) {
      if (u.speech) {
        u.speech.time -= dt;
        if (u.speech.time <= 0) u.speech = null;
      }
      if (u.clickSquish && u.clickSquish > 0) {
        u.clickSquish = Math.max(0, u.clickSquish - dt * 4);
      }

      if (u.state === "death") {
        u.death -= dt;
        continue;
      }
      if (u.hp <= 0) {
        this.killUnit(u);
        continue;
      }

      u.anim += dt * 8;
      if (u.state === "walk") {
        const baseSpeed = u.role === "scout" ? 3.0 : u.role === "warrior" ? 2.3 : u.role === "javelin" ? 2.1 : 2.4;
        const warCrySpeed = this.warCryBuffTimer > 0 ? 1.45 : 1.0;
        const relicSpeed = this.relics.some((r) => r.id === "boots_of_wind") ? 1.25 : 1.0;
        const speed = baseSpeed * warCrySpeed * relicSpeed;
        this.moveUnitPath(u, dt, speed);

        // Early arrival and task execution when within interaction perimeter (prefer front/side over north roof edge)
        if (u.target) {
          if (u.target.kind === "build" || u.target.kind === "repair" || u.target.kind === "farm_work") {
            const b = this.buildings.find((item) => item.id === u.target!.id);
            if (b) {
              const cx = Math.max(b.x, Math.min(b.x + b.w - 1, u.x));
              const cy = Math.max(b.y, Math.min(b.y + b.h - 1, u.y));
              const notBehindRoof = u.y >= b.y - 0.1 || u.path.length <= 1;
              if (notBehindRoof && Math.hypot(u.x - cx, u.y - cy) <= 1.35) {
                u.path = [];
                this.arrive(u);
              }
            }
          } else if (u.target.kind === "deposit") {
            const b = this.buildings.find((item) => item.id === u.target!.id);
            if (b) {
              const cx = Math.max(b.x, Math.min(b.x + b.w - 1, u.x));
              const cy = Math.max(b.y, Math.min(b.y + b.h - 1, u.y));
              const notBehindRoof = u.y >= b.y - 0.1 || u.path.length <= 1;
              if (notBehindRoof && Math.hypot(u.x - cx, u.y - cy) <= 1.35) {
                u.path = [];
                this.arrive(u);
              }
            }
          } else if (u.target.kind === "node") {
            const n = this.nodes.find((item) => item.id === u.target!.id && item.amount > 0);
            if (n) {
              const notBehindTree = n.type !== "tree" || u.y >= n.y - 0.1 || u.path.length <= 1;
              if (notBehindTree && Math.hypot(u.x - n.x, u.y - n.y) <= 1.35) {
                u.path = [];
                this.arrive(u);
              }
            }
          } else if (u.target.kind === "enemy") {
            const te = this.enemies.find((en) => en.id === u.target!.id && en.state !== "death");
            const range = u.role === "javelin" ? BALANCE.javelin.range : 1.35;
            if (te && Math.hypot(u.x - te.x, u.y - te.y) <= range) {
              u.path = [];
              u.state = "attack";
            }
          }
        }

        if (u.role === "scout") {
          // Dynamic real-time map reveal as scout explores
          const r = 8.5;
          const cx = Math.round(u.x);
          const cy = Math.round(u.y);
          const minX = Math.max(0, cx - 9);
          const maxX = Math.min(COLS - 1, cx + 9);
          const minY = Math.max(0, cy - 9);
          const maxY = Math.min(ROWS - 1, cy + 9);
          for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
              if (Math.hypot(x + 0.5 - (u.x + 0.5), y + 0.5 - (u.y + 0.5)) <= r) {
                this.visible[y][x] = true;
                this.explored[y][x] = true;
              }
            }
          }
        }

        if (!u.path.length) this.arrive(u);
      } else if (u.state === "chop" || u.state === "mine" || u.state === "farm") {
        this.updateGather(u, dt);
      } else if (u.state === "build") {
        this.updateBuild(u, dt);
      } else if (u.state === "repair") {
        this.updateRepair(u, dt);
      } else if (u.state === "attack") {
        if (u.role === "javelin") this.updateJavelin(u, dt);
        else this.updateWarrior(u, dt);
      } else if (u.state === "idle" && !u.sheltered) {
        u.work += dt;
        const workInterval = u.role === "scout" ? 0.35 : 1.2;
        if (u.work > workInterval) {
          u.work = 0;
          this.autoWork(u);
        }
      }

      // Building collision watchdog: ensure unit is never trapped inside any building (except passable Gates)
      for (const b of this.buildings) {
        if (b.hp <= 0 || (b.type === "gate" && b.complete)) continue;
        if (u.x > b.x - 0.45 && u.x < b.x + b.w - 0.55 && u.y > b.y - 0.45 && u.y < b.y + b.h - 0.55) {
          const dLeft = u.x - (b.x - 0.5);
          const dRight = b.x + b.w - 0.5 - u.x;
          const dTop = u.y - (b.y - 0.5);
          const dBottom = b.y + b.h - 0.5 - u.y;
          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          if (minD === dLeft) u.x = b.x - 1;
          else if (minD === dRight) u.x = b.x + b.w;
          else if (minD === dTop) u.y = b.y - 1;
          else u.y = b.y + b.h;
          if (u.path.length) {
            u.path = [];
            this.autoWork(u);
          }
        }
      }
    }
    this.units = this.units.filter((u) => u.state !== "death" || u.death > 0);
  }

  private moveUnitPath(u: { x: number; y: number; path: Position[]; _faceDx?: number; _faceDy?: number; _facing?: "left" | "right"; stuckTimer?: number; target?: any; id?: number }, dt: number, speed: number) {
    if (!u.path.length) return;
    const p = u.path[0];
    const targetX = p.x;
    const targetY = p.y;
    const dx = targetX - u.x;
    const dy = targetY - u.y;
    const d = Math.hypot(dx, dy);
    const s = speed * dt;

    if (d > 0.02) {
      u._faceDx = dx / d;
      u._faceDy = dy / d;
      u._facing = dx < 0 ? "left" : "right";
    }

    // Waypoint progression & corner shortcutting:
    // If not final and next waypoint is in clear line-of-sight, advance early to round corners smoothly
    if (u.path.length > 1) {
      const nextP = u.path[1];
      const ntx = nextP.x;
      const nty = nextP.y;
      if (d < 0.55 && this.isLineWalkable(u.x, u.y, ntx, nty)) {
        u.path.shift();
        u.stuckTimer = 0;
        return;
      }
    }

    const isFinal = u.path.length === 1;
    const acceptDist = isFinal ? 0.22 : 0.42;

    if (d <= acceptDist || s >= d) {
      u.path.shift();
      u.stuckTimer = 0;
      if (isFinal) {
        u.x = targetX;
        u.y = targetY;
      }
    } else {
      const prevX = u.x;
      const prevY = u.y;
      const stepX = (dx / d) * s;
      const stepY = (dy / d) * s;
      u.x += stepX;
      u.y += stepY;

      // Stuck detection watchdog: if unit fails to make progress due to collision pushback or narrow chokepoint
      const actualMoved = Math.hypot(u.x - prevX, u.y - prevY);
      if (actualMoved < s * 0.35) {
        u.stuckTimer = (u.stuckTimer || 0) + dt;

        // 1. Sliding deflection: try lateral nudge along perpendicular normal to slide off obstacle edge
        const perpX = -dy / d;
        const perpY = dx / d;
        const slideSpd = s * 0.75;
        const side1X = u.x + perpX * slideSpd;
        const side1Y = u.y + perpY * slideSpd;
        const side2X = u.x - perpX * slideSpd;
        const side2Y = u.y - perpY * slideSpd;

        if (this.walkable(Math.round(side1X), Math.round(side1Y))) {
          u.x = side1X;
          u.y = side1Y;
        } else if (this.walkable(Math.round(side2X), Math.round(side2Y))) {
          u.x = side2X;
          u.y = side2Y;
        }

        // 2. Courtesy yielding: if idle villagers are blocking the narrow passage, ask them to step aside
        this.askIdleUnitsToYield(u, targetX, targetY);

        // 3. Dynamic detour ("Dar a volta"): after ~0.38s stuck, recalculate route to walk around obstacle
        if (u.stuckTimer > 0.38 && u.stuckTimer < 0.45) {
          const detourGoals = this.getUnitGoals(u);
          if (detourGoals.length > 0) {
            const blockedKey = Math.round(targetY) * COLS + Math.round(targetX);
            const detour = this.findPath(u.x, u.y, detourGoals, { avoidTiles: new Set<number>([blockedKey]) });
            if (detour.length > 0) {
              u.path = detour;
              u.stuckTimer = 0;
            }
          }
        }

        // 4. Final rescue if still jammed after 0.85s:
        if (u.stuckTimer > 0.85) {
          if (!isFinal) {
            u.path.shift();
            u.stuckTimer = 0;
          } else {
            const free = this.getFreeNeighborTile(u.x, u.y, (u as any).id);
            if (free) {
              u.x = free.x + 0.5;
              u.y = free.y + 0.5;
              u.path = [];
              u.stuckTimer = 0;
            }
          }
        }
      } else {
        u.stuckTimer = Math.max(0, (u.stuckTimer || 0) - dt * 2);
      }
    }
  }

  private updateGather(u: Unit, dt: number) {
    const th = this.castle();
    const tierBoost = th && th.tier === 2 ? 1.15 : th && th.tier >= 3 ? 1.3 : 1.0;

    if (u.target?.kind === "farm_work") {
      const b = this.buildings.find((item) => item.id === u.target!.id);
      if (!b || b.hp <= 0) {
        u.state = "idle";
        this.autoWork(u);
        return;
      }
      u.work += dt;
      if (Math.random() < dt * 4) this.addParticle(b.x + Math.random() * b.w, b.y + Math.random() * b.h, "#9bd76b", 2);
      if (u.work >= 2.4) {
        u.work = 0;
        const foodAmt = Math.round(8 * tierBoost);
        this.resources.food += foodAmt;
        this.float(`+${foodAmt} Food`, b.x + 1, b.y, "#9bd76b");
        this.addParticle(b.x + 1, b.y + 1, "#9bd76b", 10);
        sound.playSfx("harvest");
      }
      return;
    }

    const n = u.target && this.nodes.find((item) => item.id === u.target!.id);
    if (!n || n.amount <= 0) {
      u.state = "idle";
      this.autoWork(u);
      return;
    }

    u.work += dt;
    if (Math.random() < dt * 4) this.addParticle(n.x + 0.5, n.y + 0.5, RES_COLORS[NODE_RES[n.type]], 2);

    if (u.work >= 2.4) {
      u.work = 0;
      const res = NODE_RES[n.type];
      let amt = n.type === "ore" ? 6 : 8;
      if (n.type === "tree") {
        const camps = this.completed("lumber").length;
        amt = Math.round(amt * (1 + camps * 0.25) * tierBoost);
      } else if (n.type === "rock" || n.type === "ore") {
        const quarries = this.completed("quarry").length;
        amt = Math.round(amt * (1 + quarries * 0.25) * tierBoost);
      } else {
        amt = Math.round(amt * tierBoost);
      }
      const got = Math.min(amt, n.amount);
      n.amount -= got;
      n.flash = 0.2;
      u.carry = { type: res, amount: got };
      this.float(`+${got}`, n.x + 0.5, n.y, RES_COLORS[res]);
      this.addParticle(n.x + 0.5, n.y + 0.5, RES_COLORS[res], 12);
      sound.playSfx(n.type === "tree" ? "chop" : n.type === "field" ? "harvest" : "mine");
      this.deposit(u);
    }
  }

  private updateBuild(u: Unit, dt: number) {
    const b = u.target && this.buildings.find((item) => item.id === u.target!.id);
    if (!b || (b.complete && !b.upgrading)) {
      u.state = "idle";
      this.autoWork(u);
      return;
    }

    b.progress += dt;
    b.hammerClock = (b.hammerClock || 0) - dt;
    if (b.hammerClock <= 0) {
      b.hammerClock = 0.35;
      sound.playSfx("hammer");
      this.addParticle(b.x + b.w / 2, b.y + b.h / 2, "#f0c25a", 8);
    }

    if (b.progress >= b.buildTime) {
      b.builderId = null;
      b.progress = b.buildTime;
      if (b.type === "townhall" && b.upgrading) {
        b.tier++;
        b.upgrading = false;
        b.maxHp = BALANCE.townHall[b.tier as 1 | 2 | 3].hp;
        b.hp = b.maxHp;
        this.setBanner(`Town Hall Tier ${b.tier} Complete!`, 3, "#f3d27e");
        this.log(`Town Hall fortified to Tier ${b.tier} ${BALANCE.townHall[b.tier as 1 | 2 | 3].name}.`);
      } else {
        b.complete = true;
        b.hp = b.maxHp;
        if (b.type === "farm") this.objectives.farm = true;
        if (b.type === "house") this.objectives.house = true;
        this.setBanner(`${BUILD_SPECS[b.type]?.label || b.type} constructed!`, 2, "#8fe39a");
        this.log(`${BUILD_SPECS[b.type]?.label || b.type} completed.`);
      }
      sound.playSfx("build");
      
      // Free all builders on this project
      for (const worker of this.units) {
        if (worker.state !== "death" && worker.role === "builder" && worker.target?.kind === "build" && worker.target?.id === b.id) {
          worker.state = "idle";
          this.autoWork(worker);
        }
      }
      u.state = "idle";
      this.autoWork(u);
    }
  }

  private updateRepair(u: Unit, dt: number) {
    const b = u.target && this.buildings.find((item) => item.id === u.target!.id);
    if (!b || !b.complete || b.hp <= 0) {
      u.state = "idle";
      this.autoWork(u);
      return;
    }

    if (b.hp >= b.maxHp - 0.1) {
      b.hp = b.maxHp;
      b.repairerId = null;
      this.log(`${BUILD_SPECS[b.type]?.label || b.type} fully repaired.`);
      for (const worker of this.units) {
        if (worker.state !== "death" && worker.role === "builder" && worker.target?.kind === "repair" && worker.target?.id === b.id) {
          worker.state = "idle";
          this.autoWork(worker);
        }
      }
      u.state = "idle";
      this.autoWork(u);
      return;
    }

    u.work += dt;
    if (u.work >= BALANCE.repair.tick) {
      u.work -= BALANCE.repair.tick;
      if (this.resources.wood < 1) {
        this.setBanner("Need Wood to repair!", 2, "#ef8d78");
        u.state = "idle";
        return;
      }
      this.resources.wood -= 1;
      b.hp = Math.min(b.maxHp, b.hp + BALANCE.repair.hpPerTick);
      this.float(`+${BALANCE.repair.hpPerTick} HP`, b.x + b.w / 2, b.y, "#78e58a");
      this.addParticle(b.x + b.w / 2, b.y + b.h / 2, "#78e58a", 6);
    }
  }

  private updateWarrior(u: Unit, dt: number) {
    const e = u.target && (this.enemies.find((item) => item.id === u.target!.id && item.state !== "death") || (this.boss && this.boss.id === u.target!.id && this.boss.state !== "death" ? this.boss : null));
    if (!e) {
      u.state = "idle";
      this.autoWork(u);
      return;
    }
    const reach = 1.45;
    if (Math.hypot(u.x - e.x, u.y - e.y) > reach) {
      this.commandAttack(u, e);
      return;
    }
    u.attackCd -= dt;
    if (u.attackCd <= 0) {
      const boost = this.hero?.ability === "buff" && Math.hypot(u.x - this.hero.x, u.y - this.hero.y) <= 5 ? 1.25 : 1;

      let baseDmg = 8.5;
      let cd = 0.72;
      let sfx = "hit";
      let particleColor = "#ffe08a";
      let icon = "⚔️";
      let critChance = 0.22;

      if (u.role === "warrior") {
        baseDmg = 8.5;
        cd = 0.72;
        sfx = "hit";
        particleColor = "#ffe08a";
        icon = "⚔️";
        critChance = 0.22;
      } else if (u.role === "woodcutter") {
        baseDmg = 3.6;
        cd = 0.95;
        sfx = "chop";
        particleColor = "#d8994b";
        icon = "🪓";
        critChance = 0.15;
      } else if (u.role === "stoneMiner") {
        baseDmg = 3.8;
        cd = 1.0;
        sfx = "mine";
        particleColor = "#d2d7d7";
        icon = "⛏️";
        critChance = 0.16;
      } else if (u.role === "goldMiner") {
        baseDmg = 3.4;
        cd = 0.95;
        sfx = "mine";
        particleColor = "#ffd56b";
        icon = "⛏️";
        critChance = 0.18;
      } else if (u.role === "builder") {
        baseDmg = 3.5;
        cd = 0.95;
        sfx = "hammer";
        particleColor = "#f0c25a";
        icon = "🔨";
        critChance = 0.15;
      } else if (u.role === "farmer") {
        baseDmg = 3.0;
        cd = 0.85;
        sfx = "hit";
        particleColor = "#9bd76b";
        icon = "🌾";
        critChance = 0.12;
      } else if (u.role === "scout") {
        baseDmg = BALANCE.scout.damage;
        cd = BALANCE.scout.attackRate;
        sfx = "hit";
        particleColor = "#73d9ff";
        icon = "🗡️";
        critChance = BALANCE.scout.critChance;
      } else {
        baseDmg = 2.2;
        cd = 0.9;
        sfx = "hit";
        particleColor = "#ffffff";
        icon = "👊";
        critChance = 0.10;
      }

      const th = this.castle();
      const tierBoost = th && th.tier === 2 ? 1.15 : th && th.tier >= 3 ? 1.3 : 1.0;
      const vetBoost = u.veteran ? 1.25 : 1.0;
      const warCryDmgBoost = this.warCryBuffTimer > 0 ? 1.45 : 1.0;
      const crownDmgBoost = this.relics.some((r) => r.id === "crown_of_kings") ? 1.2 : 1.0;
      const fireOrbBoost = this.relics.some((r) => r.id === "orb_of_fire") ? 1.3 : 1.0;

      u.attackCd = cd;
      const isCrit = Math.random() < critChance;
      const finalDmg = Math.round(baseDmg * (isCrit ? 1.8 : 1.0) * boost * tierBoost * vetBoost * warCryDmgBoost * crownDmgBoost * fireOrbBoost * 10) / 10;

      const prevHp = e.hp;
      this.damageEnemy(e, finalDmg, isCrit, icon);
      if (prevHp > 0 && e.hp <= 0) {
        this.promoteUnitKill(u);
      }
      this.addParticle((u.x + e.x) / 2, (u.y + e.y) / 2, particleColor, isCrit ? 14 : 8);
      sound.playSfx(sfx as any);
    }
  }

  private promoteUnitKill(u: Unit) {
    u.kills = (u.kills || 0) + 1;
    if (!u.veteran && u.kills >= 3) {
      u.veteran = true;
      u.maxHp = Math.round(u.maxHp * 1.25);
      u.hp = u.maxHp;
      this.float(this.lang === "pt" ? "⭐ VETERANO!" : "⭐ VETERAN!", u.x, u.y - 0.5, "#ffd56b");
      this.addParticle(u.x + 0.5, u.y + 0.5, "#ffd56b", 18);
      sound.playSfx("upgrade");
    }
  }

  private updateJavelin(u: Unit, dt: number) {
    const e = u.target && (this.enemies.find((item) => item.id === u.target!.id && item.state !== "death") || (this.boss && this.boss.id === u.target!.id && this.boss.state !== "death" ? this.boss : null));
    if (!e) {
      u.state = "idle";
      this.autoWork(u);
      return;
    }
    if (Math.hypot(u.x - e.x, u.y - e.y) > BALANCE.javelin.range) {
      this.commandAttack(u, e);
      return;
    }
    u.attackCd -= dt;
    if (u.attackCd <= 0) {
      u.attackCd = BALANCE.javelin.attackRate;
      const th = this.castle();
      const tierBoost = th && th.tier === 2 ? 1.15 : th && th.tier >= 3 ? 1.3 : 1.0;
      const vetBoost = u.veteran ? 1.25 : 1.0;
      const dmg = Math.round(BALANCE.javelin.damage * tierBoost * vetBoost * 10) / 10;
      this.fireArrow({ x: u.x, y: u.y, w: 0, h: 0 }, e, dmg, "#e0b040", "swish", undefined, "javelin");
      this.float("🔱", u.x, u.y - 0.4, "#e0b040");
    }
  }

  private killUnit(u: Unit) {
    this.releaseUnit(u);
    u.state = "death";
    u.death = 1.2;
    this.addParticle(u.x, u.y, "#9e8770", 18);
    sound.playSfx("death");
    this.log(`${u.name} fell in battle.`);
  }

  public damageEnemy(e: Enemy, dmg: number, isCrit = false, icon?: string) {
    if (e.state === "death") return;
    if (this.hero?.ability === "healDebuff" && Math.hypot(e.x - this.hero.x, e.y - this.hero.y) <= 5) {
      dmg *= 1.15;
    }
    e.hp -= dmg;
    e.flash = isCrit ? 0.22 : 0.15;

    if (isCrit) {
      this.float(`${icon || "💥"} CRIT! -${Math.ceil(dmg)}`, e.x, e.y, "#ff9d4d");
      this.addParticle(e.x, e.y, "#ffd56b", 12);
      this.shakeScreen(3, 0.14);
      sound.playSfx("hit");
    } else {
      this.float(`${icon ? icon + " " : ""}-${Math.ceil(dmg)}`, e.x, e.y, "#ffe78a");
      this.addParticle(e.x, e.y, "#8f2630", 6);
    }

    if (e.hp <= 0) {
      e.state = "death";
      e.death = 120.0; // Decomposes gradually over 2 minutes as requested
      e.maxDeath = 120.0;
      this.addParticle(e.x, e.y, "#4d2930", 22);
      sound.playSfx("bugDeath");
      this.resources.gold += 1;

      const dropChance = BALANCE.killCrystal[e.species as keyof typeof BALANCE.killCrystal] || BALANCE.killCrystal.base;
      if (Math.random() < dropChance || e.kind === "elite") {
        const dropAmt = e.kind === "elite" ? 2 : 1;
        this.resources.crystal += dropAmt;
        this.float(`+${dropAmt} Crystal`, e.x, e.y - 0.5, "#73d9ff");
      }

      if (e.kind === "elite") this.stats.eliteKills++;
      else if (e.kind === "boss") this.onBossDefeated();
      else this.stats.kills++;

      this.gainHeroXp(e.kind === "boss" ? 180 : e.kind === "elite" ? 35 : 12);

      const campId = (e as any).campId;
      if (campId) {
        const camp = this.creepCamps.find((c) => c.id === campId);
        if (camp && !camp.cleared) {
          camp.creepCount = Math.max(0, camp.creepCount - 1);
          if (camp.creepCount === 0) {
            camp.cleared = true;
            camp.rewardClaimed = true;
            this.resources.wood += camp.reward.wood;
            this.resources.stone += camp.reward.stone;
            this.resources.gold += camp.reward.gold;
            this.resources.crystal += camp.reward.crystal;
            if (camp.reward.relic && !this.relics.some((r) => r.id === camp.reward.relic!.id)) {
              this.relics.push(camp.reward.relic);
            }
            this.gainHeroXp(120);
            sound.playSfx("upgrade");
            sound.playSfx("chest");
            const relicLabel = camp.reward.relic?.name[this.lang || "pt"] || "";
            this.setBanner(
              this.lang === "pt"
                ? `⚔️ ACAMPAMENTO NEUTRO LIMPO! ${relicLabel} Conquistada!`
                : `⚔️ CREEP CAMP CONQUERED! ${relicLabel} Unlocked!`,
              4.0,
              "#ffd56b"
            );
            this.log(
              this.lang === "pt"
                ? `Acampamento de ${camp.name.pt} conquistado! +${camp.reward.gold}💰 +${camp.reward.crystal}💎 e ${relicLabel}.`
                : `Camp ${camp.name.en} conquered! +${camp.reward.gold}G +${camp.reward.crystal} Crystal and ${relicLabel}.`
            );
          }
        }
      }

      this.registerKill(e.x, e.y);
    }
  }

  public useHeroHolyStrike() {
    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (!hero || hero.hp <= 0) {
      this.setBanner(this.lang === "pt" ? "Herói não disponível no momento!" : "Hero not available!", 1.5, "#ef8d78");
      return;
    }
    if (this.abilityHolyStrikeCd > 0) {
      this.setBanner(
        this.lang === "pt"
          ? `Golpe Divino em recarga (${Math.ceil(this.abilityHolyStrikeCd)}s)`
          : `Holy Strike on cooldown (${Math.ceil(this.abilityHolyStrikeCd)}s)`,
        1.5,
        "#f59e0b"
      );
      return;
    }
    this.abilityHolyStrikeCd = 8.5;
    const dmg = 85 + (this.heroCommanderLevel - 1) * 20;
    const radius = 3.8;

    hero.state = "attack";
    hero.flash = 0.35;
    if ("attackCd" in hero) (hero as any).attackCd = 0.4;
    this.addShockwave(hero.x + 0.5, hero.y + 0.5, "#ffd56b", radius + 0.5, 0.65, "holy");

    let hitCount = 0;
    for (const e of this.enemies) {
      if (e.state !== "death" && Math.hypot(e.x - hero.x, e.y - hero.y) <= radius) {
        this.damageEnemy(e, dmg, true, "⚡");
        hitCount++;
      }
    }
    for (const h of this.enemyHives) {
      if (!h.destroyed && Math.hypot(h.x - hero.x, h.y - hero.y) <= radius) {
        this.damageHive(h, dmg);
        hitCount++;
      }
    }

    this.shakeScreen(5, 0.25);
    this.addParticle(hero.x + 0.5, hero.y + 0.5, "#ffd56b", 35, 20, "spark");
    this.addParticle(hero.x + 0.5, hero.y + 0.5, "#73d9ff", 20, 20, "spark");
    this.float("⚡ GOLPE DIVINO!", hero.x, hero.y - 0.8, "#ffd56b");
    sound.playSfx("hit");
    sound.playSfx("upgrade");
    haptic("heavy");
    this.gainHeroXp(30 + hitCount * 10);
  }

  public useHeroWarCry() {
    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (!hero || hero.hp <= 0) {
      this.setBanner(this.lang === "pt" ? "Herói não disponível no momento!" : "Hero not available!", 1.5, "#ef8d78");
      return;
    }
    if (this.abilityWarCryCd > 0) {
      this.setBanner(
        this.lang === "pt"
          ? `Grito de Guerra em recarga (${Math.ceil(this.abilityWarCryCd)}s)`
          : `War Cry on cooldown (${Math.ceil(this.abilityWarCryCd)}s)`,
        1.5,
        "#f59e0b"
      );
      return;
    }
    this.abilityWarCryCd = 12.0;
    this.warCryBuffTimer = 10.0;
    hero.state = "attack";
    hero.flash = 0.35;
    if ("attackCd" in hero) (hero as any).attackCd = 0.4;
    this.addShockwave(hero.x + 0.5, hero.y + 0.5, "#f97316", 6.5, 0.75, "roar");

    let buffed = 0;
    for (const u of this.units) {
      if (u.state !== "death" && Math.hypot(u.x - hero.x, u.y - hero.y) <= 6.5) {
        buffed++;
        this.addParticle(u.x + 0.5, u.y + 0.5, "#f97316", 12, 15, "spark");
        this.float("🔥 RUGIDO!", u.x, u.y - 0.5, "#f97316");
      }
    }

    this.shakeScreen(3, 0.18);
    this.float("📢 GRITO DE GUERRA!", hero.x, hero.y - 0.8, "#f97316");
    sound.playSfx("shout");
    haptic("medium");
    this.setBanner(
      this.lang === "pt"
        ? `🔥 GRITO DE GUERRA ATIVADO! +45% Velocidade e Ataque para ${buffed} soldados!`
        : `🔥 WAR CRY ACTIVATED! +45% Speed and Attack for ${buffed} units!`,
      3.0,
      "#f97316"
    );
    this.gainHeroXp(25);
  }

  public useHeroHolyLight() {
    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (!hero || hero.hp <= 0) {
      this.setBanner(this.lang === "pt" ? "Herói não disponível no momento!" : "Hero not available!", 1.5, "#ef8d78");
      return;
    }
    if (this.abilityHolyLightCd > 0) {
      this.setBanner(
        this.lang === "pt"
          ? `Luz Sagrada em recarga (${Math.ceil(this.abilityHolyLightCd)}s)`
          : `Holy Light on cooldown (${Math.ceil(this.abilityHolyLightCd)}s)`,
        1.5,
        "#f59e0b"
      );
      return;
    }
    this.abilityHolyLightCd = 10.0;
    const healAmount = 75 + (this.heroCommanderLevel - 1) * 20;
    hero.state = "attack";
    hero.flash = 0.35;
    if ("attackCd" in hero) (hero as any).attackCd = 0.4;
    this.addShockwave(hero.x + 0.5, hero.y + 0.5, "#4ade80", 6.0, 0.7, "heal");

    let healed = 0;
    for (const u of this.units) {
      if (u.state !== "death" && Math.hypot(u.x - hero.x, u.y - hero.y) <= 6.0) {
        if (u.hp < u.maxHp) {
          u.hp = Math.min(u.maxHp, u.hp + healAmount);
          healed++;
          this.float(`+${healAmount} HP`, u.x, u.y - 0.5, "#86efac");
        }
        this.addParticle(u.x + 0.5, u.y + 0.5, "#86efac", 12, 10, "spark");
      }
    }
    if (hero.hp < hero.maxHp) {
      hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
      this.float(`+${healAmount} HP`, hero.x, hero.y - 0.5, "#86efac");
    }

    this.addParticle(hero.x + 0.5, hero.y + 0.5, "#4ade80", 25, 10, "spark");
    this.float("✨ LUZ SAGRADA!", hero.x, hero.y - 0.8, "#86efac");
    sound.playSfx("heal");
    haptic("light");
    this.setBanner(
      this.lang === "pt"
        ? `✨ LUZ SAGRADA RESTAUROU ${healAmount} HP!`
        : `✨ HOLY LIGHT RESTORED ${healAmount} HP!`,
      2.5,
      "#86efac"
    );
    this.gainHeroXp(25 + healed * 8);
  }

  public focusHero() {
    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && (h as any).hp > 0);
    if (hero) {
      this.camera.x = (hero.x + 0.5) * TS;
      this.camera.y = (hero.y + 0.5) * TS;
      this.select("hero", 1, "hero");
      this.addClickMarker(hero.x, hero.y, "#ffd56b");
      sound.playSfx("select");
    }
  }

  public damageHive(hive: EnemyHive, dmg: number) {
    if (hive.destroyed) return;
    hive.hp -= dmg;
    hive.flash = 0.22;
    this.float(`-${Math.ceil(dmg)}`, hive.x, hive.y, "#ff6b6b");
    this.addParticle(hive.x + 1, hive.y + 1, "#8f2630", 12);
    sound.playSfx("hit");

    if (hive.hp <= 0) {
      hive.destroyed = true;
      this.shakeScreen(6, 0.35);
      this.addParticle(hive.x + 1, hive.y + 1, "#ff6b6b", 45);
      this.addParticle(hive.x + 1, hive.y + 1, "#ffd56b", 30);
      sound.playSfx("bugDeath");
      sound.playSfx("upgrade");
      this.resources.gold += 80;
      this.resources.crystal += 45;
      this.gainHeroXp(180);
      this.setBanner(
        this.lang === "pt"
          ? "🔥 NINHO DO ENXAME DESTRUÍDO! +80💰 +45💎"
          : "🔥 ENEMY HIVE DESTROYED! +80G +45 Crystal",
        4.0,
        "#ff6b6b"
      );
      this.log(
        this.lang === "pt"
          ? `Ninho inimigo ${hive.name.pt} arrasado pelas tropas!`
          : `Enemy hive ${hive.name.en} demolished by forces!`
      );
    }
  }

  public gainHeroXp(amount: number) {
    this.heroCommanderXp += amount;
    if (this.heroCommanderXp >= this.heroCommanderNextXp) {
      this.heroCommanderLevel++;
      this.heroCommanderXp -= this.heroCommanderNextXp;
      this.heroCommanderNextXp = Math.round(this.heroCommanderNextXp * 1.55);

      const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
      if (hero) {
        hero.level = this.heroCommanderLevel;
        hero.maxHp += 80;
        hero.hp = hero.maxHp;
        hero.damage += 6;
        this.addParticle(hero.x + 0.5, hero.y + 0.5, "#ffd56b", 40, 20, "spark");
        this.float("⭐ LEVEL UP! ⭐", hero.x, hero.y - 1, "#ffd56b");
      }
      this.setBanner(
        this.lang === "pt"
          ? `⭐ NÍVEL DO HERÓI SUBIU! NÍVEL ${this.heroCommanderLevel} ⭐`
          : `⭐ HERO LEVEL UP! LEVEL ${this.heroCommanderLevel} ⭐`,
        3.5,
        "#ffd56b"
      );
      sound.playSfx("upgrade");
      haptic("heavy");
    }
  }

  private registerKill(x: number, y: number) {
    this.comboCount = this.comboTimer > 0 ? this.comboCount + 1 : 1;
    this.comboTimer = 2.2;
    const combos: Record<number, [string, string, number]> = {
      2: ["DOUBLE KILL!", "#ffd56b", 1],
      3: ["TRIPLE KILL!", "#ff9d4d", 2],
      5: ["RAMPAGE!", "#ff6b4d", 3],
      8: ["UNSTOPPABLE!", "#ff4d6b", 4],
      12: ["LEGENDARY!", "#c86bff", 6],
    };

    if (combos[this.comboCount]) {
      const [title, color, bonus] = combos[this.comboCount];
      this.combo = { text: title, time: 1.8, color };
      this.resources.crystal += bonus;
      this.float(`+${bonus} Crystal`, x, y, "#73d9ff");
      this.shakeScreen(3 + this.comboCount * 0.4, 0.2);
      sound.playSfx("upgrade");
    }
  }

  private onBossDefeated() {
    this.stats.bossKills++;
    funtico.recordEvent("boss_defeated", {
      bossKills: this.stats.bossKills,
      wave: this.waveNumber,
      time: Math.floor(this.time),
    }, Math.floor(this.time));

    const mult = 1 + Math.floor((this.waveNumber - 1) / 10) * 0.5;
    const crystalGain = Math.round(BALANCE.bossCrystal * mult);
    const goldGain = Math.round(20 * mult);

    this.resources.crystal += crystalGain;
    this.resources.gold += goldGain;
    this.shakeScreen(9, 0.5);
    sound.stopBossMusic();
    this.setBanner(`BOSS DEFEATED! +${crystalGain} CRYSTALS +${goldGain} GOLD!`, 4, "#f4c97a");
    this.log(`Boss defeated! Gained +${crystalGain} Crystals and +${goldGain} Gold.`);
    sound.playSfx("chest");

    const c = this.castle();
    if (c) {
      this.chest = { id: 1, x: c.x + 2, y: c.y + 3, anim: 0 };
    }
    this.boss = null;
  }

  public shakeScreen(power: number, duration: number) {
    if (power >= this.shake.power || this.shake.time <= 0) {
      this.shake.power = power;
      this.shake.time = duration;
      this.shake.total = duration;
    }
  }

  private updateEnemies(dt: number) {
    for (const e of this.enemies) {
      if (e.state === "death") {
        e.death -= dt;
        continue;
      }
      e.anim += dt * 7;
      e.flash = Math.max(0, e.flash - dt);
      e.contactCd -= dt;

      const target = this.enemyTarget(e);
      if (!target) continue;

      let dist = 0;
      if (target.kind === "building") {
        const b = target.ref as Building;
        const cx = Math.max(b.x, Math.min(b.x + b.w, e.x));
        const cy = Math.max(b.y, Math.min(b.y + b.h, e.y));
        dist = Math.hypot(e.x - cx, e.y - cy);
      } else {
        dist = Math.hypot(e.x - target.x, e.y - target.y);
      }

      if (dist <= 1.35) {
        e.state = "attack";
        e.path = [];
        e.attackCd -= dt;
        if (e.attackCd <= 0) {
          e.attackCd = e.attackRate;
          this.damageTarget(target, e.damage);
          sound.playSfx("bugAttack");
        }
      } else {
        e.state = "walk";
        e.pathClock -= dt;
        if (e.pathClock <= 0 || !e.path.length) {
          e.pathClock = 0.7;
          const goals = target.kind === "building" ? this.around(target.ref) : [{ x: Math.round(target.x), y: Math.round(target.y) }];
          e.path = this.findPath(
            e.x,
            e.y,
            goals.length ? goals : [{ x: Math.round(target.x), y: Math.round(target.y) }],
            { forEnemy: true }
          );
        }
        if (e.path.length) this.moveUnitPath(e, dt, e.speed);
      }
    }
    this.enemies = this.enemies.filter((e) => e.state !== "death" || e.death > 0);
  }

  private enemyTarget(e: Enemy): { kind: string; x: number; y: number; ref: any } | null {
    if (this.golem && this.golem.hp > 0) {
      return { kind: "golem", x: this.golem.x, y: this.golem.y, ref: this.golem };
    }
    for (const h of Object.values(this.altarHeroes)) {
      if (h && h.hp > 0) return { kind: "altarHero", x: h.x, y: h.y, ref: h };
    }
    for (const u of this.units) {
      if (u.state !== "death" && Math.hypot(e.x - u.x, e.y - u.y) < 4) {
        return { kind: "unit", x: u.x, y: u.y, ref: u };
      }
    }
    // If an enemy is right next to a defensive Palisade, Gate, or Watchtower blocking its advance, siege it!
    let nearestWall: Building | null = null;
    let minWallDist = 2.1;
    for (const b of this.buildings) {
      if (b.hp <= 0) continue;
      if (b.type === "palisade" || b.type === "gate" || b.type === "tower") {
        const d = Math.hypot(e.x - (b.x + b.w / 2), e.y - (b.y + b.h / 2));
        if (d < minWallDist) {
          minWallDist = d;
          nearestWall = b;
        }
      }
    }
    if (nearestWall) {
      return { kind: "building", x: nearestWall.x + nearestWall.w / 2, y: nearestWall.y + nearestWall.h / 2, ref: nearestWall };
    }
    const c = this.castle();
    if (c) return { kind: "building", x: c.x + c.w / 2, y: c.y + c.h / 2, ref: c };
    return null;
  }

  private damageTarget(target: { kind: string; ref: any }, dmg: number) {
    if (target.kind === "unit") {
      const u = target.ref as Unit;
      u.hp -= dmg;
      this.float(`-${Math.ceil(dmg)}`, u.x, u.y, "#ff7777");
      // Emergency retaliation: if unit is attacked and not sheltered, defend against nearby enemy
      if (u.state !== "attack" && !u.sheltered && u.hp > 0) {
        const attacker = this.enemies.find((en) => Math.hypot(en.x - u.x, en.y - u.y) <= 2.2 && en.state !== "death");
        if (attacker) {
          this.commandAttack(u, attacker);
        }
      }
      if (u.hp <= 0) this.killUnit(u);
    } else if (target.kind === "golem") {
      const g = target.ref as GolemUnit;
      g.hp -= dmg;
      this.float(`-${Math.ceil(dmg)}`, g.x, g.y, "#ff7777");
      if (g.hp <= 0) this.golem = null;
    } else if (target.kind === "altarHero") {
      const h = target.ref as AltarHero;
      h.hp -= dmg;
      h.flash = 0.15;
      this.float(`-${Math.ceil(dmg)}`, h.x, h.y, "#ff7777");
    } else if (target.kind === "building") {
      const b = target.ref as Building;
      if (b.type === "townhall") this.stats.hallDamageTaken += dmg;
      b.hp -= dmg;
      b.flash = 0.15;
      this.float(`-${Math.ceil(dmg)}`, b.x + b.w / 2, b.y, "#ff7777");
      if (b.type === "townhall") this.shakeScreen(4, 0.2);
      if (b.hp <= 0) {
        if (b.type === "townhall") this.defeat();
        else {
          this.buildings = this.buildings.filter((item) => item !== b);
        }
      }
    }
  }

  private updateBoss(dt: number) {
    if (!this.boss || this.boss.state === "death") return;
    const b = this.boss;
    b.anim += dt * 5;
    b.flash = Math.max(0, b.flash - dt);

    const target = this.enemyTarget(b);
    if (!target) return;

    let d = 0;
    if (target.kind === "building") {
      const bld = target.ref as Building;
      const cx = Math.max(bld.x, Math.min(bld.x + bld.w, b.x));
      const cy = Math.max(bld.y, Math.min(bld.y + bld.h, b.y));
      d = Math.hypot(b.x - cx, b.y - cy);
    } else {
      d = Math.hypot(b.x - target.x, b.y - target.y);
    }

    if (d <= 1.65) {
      b.state = "attack";
      b.path = [];
      b.attackCd -= dt;
      if (b.attackCd <= 0) {
        b.attackCd = b.attackRate;
        this.damageTarget(target, b.damage);
        this.shakeScreen(7, 0.35);
        sound.playSfx("bossRoar");
      }
    } else {
      b.state = "walk";
      b.pathClock -= dt;
      if (b.pathClock <= 0 || !b.path.length) {
        b.pathClock = 1.0;
        const goals = target.kind === "building" ? this.around(target.ref) : [{ x: Math.round(target.x), y: Math.round(target.y) }];
        b.path = this.findPath(b.x, b.y, goals.length ? goals : [{ x: Math.round(target.x), y: Math.round(target.y) }]);
      }
      if (b.path.length) this.moveUnitPath(b, dt, b.speed);
    }
  }

  private updateGolem(dt: number) {
    if (!this.golem) return;
    const g = this.golem;
    g.anim += dt * 5;
    g.flash = Math.max(0, g.flash - dt);
    g.timer -= dt;

    if (g.hp <= 0 || g.timer <= 0) {
      this.addParticle(g.x + 0.5, g.y + 0.5, "#73d9ff", 24);
      this.golem = null;
      this.log("The summoned Golem has expired.");
      return;
    }

    const target = this.nearestEnemyForUnit(g, 12);
    if (!target) {
      g.state = "idle";
      return;
    }

    const d = Math.hypot(g.x - target.x, g.y - target.y);
    if (d <= 1.5) {
      g.state = "attack";
      g.attackCd -= dt;
      if (g.attackCd <= 0) {
        g.attackCd = g.attackRate;
        this.damageEnemy(target, g.damage);
        this.addParticle(target.x, target.y, "#73d9ff", 14);
        sound.playSfx("hit");
      }
    } else {
      g.state = "walk";
      g.pathClock -= dt;
      if (g.pathClock <= 0 || !g.path.length) {
        g.pathClock = 0.6;
        g.path = this.findPath(g.x, g.y, [{ x: Math.round(target.x), y: Math.round(target.y) }]);
      }
      if (g.path.length) this.moveUnitPath(g, dt, g.speed);
    }
  }

  private updateAltarHeroes(dt: number) {
    const heroList = this.heroUnit ? [this.heroUnit] : (Object.values(this.altarHeroes).filter(Boolean) as AltarHero[]);
    const seenIds = new Set<number>();
    for (const h of heroList) {
      if (!h || seenIds.has(h.id)) continue;
      seenIds.add(h.id);
      h.anim += dt * 5;
      h.flash = Math.max(0, h.flash - dt);
      if (h.summonTimer && h.summonTimer > 0) {
        h.summonTimer = Math.max(0, h.summonTimer - dt);
      }
      h.attackCd = Math.max(0, h.attackCd - dt);
      h.specialCd = Math.max(0, h.specialCd - dt);

      if (h.hp <= 0) {
        this.addParticle(h.x + 0.5, h.y + 0.5, "#ffd56b", 25);
        this.addParticle(h.x + 0.5, h.y + 0.5, "#a8a8a8", 20);
        this.setBanner(
          this.lang === "pt" ? "☠️ O Herói do Reino caiu!" : "☠️ The Hero of the Realm has fallen!",
          3,
          "#ff6b6b"
        );
        this.log(
          this.lang === "pt"
            ? "O Herói do Reino caiu em combate. Ele pode ser invocado novamente no Altar."
            : "The Hero of the Realm fell in combat. He can be summoned anew at the Altar."
        );
        this.heroUnit = null;
        this.altarHeroes = { hero: null, frontline: null, ranger: null, mage: null };
        if (this.selected?.kind === "hero") {
          this.selected = null;
          this.selectedHeroRole = null;
        }
        continue;
      }

      // Building collision watchdog: ensure hero is never stuck inside any building footprint (except passable Gates)
      for (const b of this.buildings) {
        if (b.hp <= 0 || (b.type === "gate" && b.complete)) continue;
        if (h.x > b.x - 0.45 && h.x < b.x + b.w - 0.55 && h.y > b.y - 0.45 && h.y < b.y + b.h - 0.55) {
          const slots = this.around(b);
          if (slots.length > 0) {
            h.x = slots[0].x;
            h.y = slots[0].y;
          } else {
            h.y = b.y + b.h;
          }
          h.path = [];
        }
      }

      // 1. Player Command: Walk to Target Destination
      if (h.targetX !== undefined && h.targetY !== undefined) {
        const dist = Math.hypot(h.x - h.targetX, h.y - h.targetY);
        if (dist <= 0.45 || h.path.length === 0) {
          h.targetX = undefined;
          h.targetY = undefined;
          h.path = [];
          h.state = "idle";
        } else {
          h.state = "walk";
          this.moveUnitPath(h, dt, h.speed);
          continue;
        }
      }

      // 2. Player Command: Attack Target Enemy or Boss
      if (h.targetEnemy) {
        const te = h.targetEnemy;
        const isAlive = te.state !== "death" && te.hp > 0 && (this.enemies.includes(te) || (this.boss && this.boss.id === te.id));
        if (!isAlive) {
          h.targetEnemy = null;
          h.path = [];
          h.state = "idle";
        } else {
          const d = Math.hypot(h.x - te.x, h.y - te.y);
          if (d <= (h.range || 1.65)) {
            h.state = "attack";
            h.path = [];
            h._facing = te.x < h.x ? "left" : "right";
            if (h.attackCd <= 0) {
              h.attackCd = h.attackRate;
              this.damageEnemy(te, h.damage, false, "⚔️");
              this.addParticle(te.x, te.y, "#ffd56b", 12);
              sound.playSfx("hit");
            }
          } else {
            h.pathClock -= dt;
            if (h.pathClock <= 0 || !h.path.length) {
              h.pathClock = 0.5;
              const slots = this.around({ x: Math.round(te.x), y: Math.round(te.y), w: 1, h: 1 });
              h.path = this.findPath(h.x, h.y, slots.length ? slots : [{ x: Math.round(te.x), y: Math.round(te.y) }]);
            }
            if (h.path.length) {
              h.state = "walk";
              this.moveUnitPath(h, dt, h.speed);
            } else {
              h.state = "idle";
            }
          }
          continue;
        }
      }

      // 3. Autonomous Realm Guard: Stays idle until an enemy appears, then automatically engages!
      const nearby = this.nearestEnemyForUnit(h, 36);
      if (nearby && nearby.state !== "death" && nearby.hp > 0) {
        const d = Math.hypot(h.x - nearby.x, h.y - nearby.y);
        if (d <= (h.range || 1.65)) {
          h.state = "attack";
          h.path = [];
          h._facing = nearby.x < h.x ? "left" : "right";
          if (h.attackCd <= 0) {
            h.attackCd = h.attackRate;
            this.damageEnemy(nearby, h.damage, false, "⚔️");
            this.addParticle(nearby.x, nearby.y, "#ffd56b", 12);
            sound.playSfx("hit");
          }
        } else {
          h.pathClock -= dt;
          if (h.pathClock <= 0 || !h.path.length) {
            h.pathClock = 0.55;
            const slots = this.around({ x: Math.round(nearby.x), y: Math.round(nearby.y), w: 1, h: 1 });
            h.path = this.findPath(h.x, h.y, slots.length ? slots : [{ x: Math.round(nearby.x), y: Math.round(nearby.y) }]);
          }
          if (h.path.length) {
            h.state = "walk";
            this.moveUnitPath(h, dt, h.speed);
          } else {
            h.state = "idle";
          }
        }
      } else {
        // No enemies alive: stay calmly idle at current position!
        h.state = "idle";
        h.path = [];
      }
    }
  }

  public prioritizeResourceGathering(resType: "wood" | "stone" | "gold" | "food") {
    const roleMap: Record<"wood" | "stone" | "gold" | "food", RoleType> = {
      wood: "woodcutter",
      stone: "stoneMiner",
      gold: "goldMiner",
      food: "farmer",
    };
    const nodeTypeMap: Record<"wood" | "stone" | "gold" | "food", NodeType> = {
      wood: "tree",
      stone: "rock",
      gold: "ore",
      food: "field",
    };
    const targetRole = roleMap[resType];
    const targetNodeType = nodeTypeMap[resType];

    // 1. Find existing workers of this role or idle trainees
    const workers = this.aliveUnits().filter((u) => u.role === targetRole);
    const idleTrainee = this.aliveUnits().find((u) => u.role === "trainee");

    // 2. If we have an unassigned trainee and no active gatherer of this role, promote trainee!
    if (workers.length === 0 && idleTrainee) {
      this.assignRole(idleTrainee, targetRole);
      sound.playSfx("select");
      return;
    }

    // 3. Re-task idle or roaming workers of this role to gather immediately
    let assignedCount = 0;
    for (const w of workers) {
      if (w.state === "idle" || !w.target) {
        this.autoWork(w);
        assignedCount++;
      }
    }

    // 4. Locate nearest explored resource node (or farm for food) to highlight and pan camera
    const refPos = this.castle() || { x: COLS / 2, y: ROWS / 2 };
    if (resType === "food") {
      const farm = this.completed("farm")[0];
      if (farm) {
        this.camera.x = (farm.x + farm.w / 2) * TS;
        this.camera.y = (farm.y + farm.h / 2) * TS;
        this.addClickMarker(farm.x + farm.w / 2, farm.y + farm.h / 2, "#86efac");
        this.setBanner(
          this.lang === "pt"
            ? "🌾 Foco em Comida! Fazendeiros priorizando colheita!"
            : "🌾 Food Priority! Farmers focusing on harvest!",
          2.2,
          "#86efac"
        );
        sound.playSfx("select");
        return;
      }
    }

    const node = this.nearestNode({ x: refPos.x, y: refPos.y }, targetNodeType);
    if (node) {
      this.camera.x = (node.x + 0.5) * TS;
      this.camera.y = (node.y + 0.5) * TS;
      this.addClickMarker(node.x, node.y, RES_COLORS[resType]);
      if (workers.length > 0) {
        this.selectRoleGroup(targetRole);
      }
      const resLabel =
        this.lang === "pt"
          ? { wood: "Madeira", stone: "Pedra", gold: "Ouro", food: "Comida" }[resType]
          : { wood: "Wood", stone: "Stone", gold: "Gold", food: "Food" }[resType];
      this.setBanner(
        this.lang === "pt"
          ? `⚡ Priorizando coleta de ${resLabel}! (${workers.length} ${this.getRoleName(targetRole)}s)`
          : `⚡ Prioritizing ${resLabel} gathering! (${workers.length} ${this.getRoleName(targetRole)}s)`,
        2.2,
        RES_COLORS[resType]
      );
      sound.playSfx("select");
    } else {
      this.setBanner(
        this.lang === "pt"
          ? "Explore o mapa com seu Batedor para encontrar mais recursos!"
          : "Explore the map with your Scout to find more resources!",
        2.0,
        "#f59e0b"
      );
      sound.playSfx("click");
    }
  }

  private updateHero(dt: number) {
    if (!this.hero) return;
    const h = this.hero;
    h.anim += dt * 5;
    h.timer -= dt;

    if (h.timer <= 0) {
      this.hero = null;
      this.setBanner("Hero's time has ended", 2, "#efb66f");
      return;
    }

    if (h.ability === "revive") {
      h.abilityCd -= dt;
      if (h.abilityCd <= 0) {
        h.abilityCd = BALANCE.heroes.necromancer.rate;
        const fallen = this.units.find((u) => u.state === "death");
        if (fallen) {
          fallen.state = "idle";
          fallen.hp = fallen.maxHp * 0.6;
          fallen.death = 0;
          this.float("RISE", fallen.x, fallen.y, "#9c6cc8");
          this.addParticle(fallen.x, fallen.y, "#9c6cc8", 12);
        }
      }
    } else if (h.ability === "healDebuff") {
      h.abilityCd -= dt;
      if (h.abilityCd <= 0) {
        h.abilityCd = BALANCE.heroes.cleric.healRate;
        for (const u of this.units) {
          if (u.state !== "death" && u.hp < u.maxHp) {
            u.hp = Math.min(u.maxHp, u.hp + BALANCE.heroes.cleric.healAmount);
            this.float(`+${BALANCE.heroes.cleric.healAmount}`, u.x, u.y, "#6ec8d4");
            this.addParticle(u.x, u.y, "#6ec8d4", 6);
          }
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 35) * dt;
      p.vx *= Math.max(0, 1 - dt * 1.5);
      if (p.rot !== undefined && p.vRot !== undefined) {
        p.rot += p.vRot * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const f of this.floats) {
      f.life -= dt;
      f.y -= 22 * dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);

    for (const sw of this.shockwaves) {
      sw.time += dt;
    }
    this.shockwaves = this.shockwaves.filter((sw) => sw.time < sw.duration);
  }

  public addShockwave(
    x: number,
    y: number,
    color: string,
    maxRadius: number,
    duration = 0.55,
    type: "holy" | "roar" | "heal" = "holy"
  ) {
    this.shockwaves.push({
      x,
      y,
      color,
      maxRadius,
      duration,
      time: 0,
      type,
    });
  }

  public getRunStats(): RunScoreStats {
    const s = this.stats;
    const wave = this.wavesSurvived;
    const days = Math.floor(Math.max(0, this.time) / BALANCE.cycle.total);
    return {
      wavesSurvived: wave,
      daysSurvived: days,
      kills: s.kills,
      eliteKills: s.eliteKills,
      bossKills: s.bossKills,
      resourcesCollected: s.resourcesCollected || 0,
      crystalSpent: s.crystalSpent,
      hallDamageTaken: Math.round(s.hallDamageTaken),
      timeElapsedSeconds: Math.floor(this.time),
      isVictory: this.campaignVictory || false,
    };
  }

  public getScoreBreakdown(): ScoreBreakdown {
    return computeRunScore(this.getRunStats());
  }

  public defeat() {
    if (this.screen === "defeat") return;
    this.setScreen("defeat");
    sound.stopBossMusic();
    const stats = this.getRunStats();
    const breakdown = computeRunScore(stats);
    const score = breakdown.finalScore;
    if (score > this.bestScore) {
      this.bestScore = score;
      try {
        localStorage.setItem("tinyRealmBestScore_v2", String(this.bestScore));
      } catch {}
    }
    this.setBanner("THE SETTLEMENT HAS FALLEN", 5, "#ff6b6b");
    this.log(`Defeat! Final Score: ${score}.`);

    // Submit final score through Funtico lifecycle
    lifecycle.finishRun(stats, "defeat").catch((err) => {
      console.warn("Funtico run submission notice:", err?.message || err);
    });
  }

  public computeScore(): number {
    return computeRunScore(this.getRunStats()).finalScore;
  }

  public readiness(): { score: number; label: string } {
    let score = 0;
    const soldiers = this.aliveUnits().filter((u) => u.role === "warrior" || u.role === "javelin").length;
    const towers = this.buildings.filter((b) => b.type === "tower" && b.complete).length;
    const walls = this.buildings.filter((b) => (b.type === "palisade" || b.type === "gate") && b.complete).length;
    const hallTier = this.castle()?.tier || 1;

    score += soldiers * 16;
    score += towers * 26;
    score += walls * 4;
    score += (hallTier - 1) * 35;
    if (this.golem && this.golem.hp > 0) score += 40;
    const heroesCount = Object.values(this.altarHeroes).filter((h) => h !== null && h.hp > 0).length;
    score += heroesCount * 30;

    const expected = Math.max(30, this.waveNumber * 22);
    const ratio = Math.min(100, Math.round((score / expected) * 100));

    let label = "Vulnerable";
    if (ratio >= 90) label = "Fortified";
    else if (ratio >= 65) label = "Guarded";
    else if (ratio >= 40) label = "Moderate";
    else if (ratio >= 20) label = "Weak";

    return { score: ratio, label };
  }

  public unstickSelected() {
    const ids = new Set<number>();
    if (this.selected?.kind === "unit" && this.selected.id) ids.add(this.selected.id);
    if (this.selectedUnitIds && this.selectedUnitIds.length > 0) {
      this.selectedUnitIds.forEach((id) => ids.add(id));
    }
    const unitsToUnstick = this.units.filter((item) => ids.has(item.id) && item.state !== "death");
    if (!unitsToUnstick.length) return;

    for (const u of unitsToUnstick) {
      this.releaseUnit(u);
      u.path = [];
      u.target = null;
      u.state = "idle";
      u.work = 0;

      const cx = Math.round(u.x);
      const cy = Math.round(u.y);
      let found = false;

      for (let r = 0; r <= 6 && !found; r++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (this.inBounds(nx, ny) && this.walkable(nx, ny)) {
              u.x = nx;
              u.y = ny;
              found = true;
            }
          }
        }
      }

      this.addParticle(u.x + 0.5, u.y + 0.5, "#73d9ff", 12);
      this.float("UNSTUCK", u.x, u.y, "#73d9ff");
    }

    const msg =
      this.lang === "pt"
        ? `${unitsToUnstick.length > 1 ? `${unitsToUnstick.length} unidades desprendidas!` : `${unitsToUnstick[0].name} desprendido!`}`
        : `${unitsToUnstick.length > 1 ? `${unitsToUnstick.length} units unstuck!` : `${unitsToUnstick[0].name} unstuck!`}`;
    this.setBanner(msg, 1.5, "#73d9ff");
    sound.playSfx("select");
  }

  public squadChant(customLine?: string) {
    const ids = new Set<number>();
    if (this.selected?.kind === "unit" && this.selected.id) ids.add(this.selected.id);
    if (this.selectedUnitIds && this.selectedUnitIds.length > 0) {
      this.selectedUnitIds.forEach((id) => ids.add(id));
    }

    const squad = this.units.filter((u) => ids.has(u.id) && u.state !== "death");
    if (!squad.length) return;

    const ptPhrases = [
      "SIM SENHOR!",
      "ESTAMOS PRONTOS!",
      "AO SEU COMANDO!",
      "ÀS ORDENS, MEU LORDE!",
      "PELO REINO!",
      "EM MARCHA!",
      "UNIDOS VENCEREMOS!",
      "NÃO FALHAREMOS!",
      "PRONTOS PARA O TRABALHO!",
      "TODOS JUNTOS!",
      "AVANTE PELO REINO!",
    ];

    const enPhrases = [
      "YES SIR!",
      "WE ARE READY!",
      "AT YOUR COMMAND!",
      "AT YOUR SERVICE, SIRE!",
      "FOR THE REALM!",
      "ON THE MARCH!",
      "UNITED WE STAND!",
      "WE SHALL NOT FAIL!",
      "READY FOR DUTY!",
      "ALL TOGETHER!",
      "FORWARD FOR THE REALM!",
    ];

    const pool = this.lang === "pt" ? ptPhrases : enPhrases;
    const shoutLine = customLine || pool[Math.floor(Math.random() * pool.length)];

    let avgX = 0;
    let avgY = 0;

    squad.forEach((u) => {
      avgX += u.x;
      avgY += u.y;
      u.speech = {
        text: shoutLine,
        time: 2.8,
        maxTime: 2.8,
      };
      u.clickSquish = 1.0;
      this.addParticle(u.x + 0.5, u.y + 0.2, "#8fe39a", 4);
    });

    avgX /= squad.length;
    avgY /= squad.length;

    this.float(`🗣️ "${shoutLine}"`, avgX, avgY - 0.5, "#8fe39a");
    this.addClickMarker(avgX, avgY, "#4bce4f");
    sound.playSquadChorus();

    this.setBanner(
      this.lang === "pt"
        ? `Esquadrão (${squad.length}): "${shoutLine}"`
        : `Squad (${squad.length}): "${shoutLine}"`,
      2.0,
      "#8fe39a"
    );
  }

  public select(
    kind: "unit" | "building" | "hero" | "enemy" | null,
    id?: number,
    heroRole?: AltarHeroRole | "golem"
  ) {
    if (!kind || id === undefined) {
      this.selected = null;
      this.selectedUnitIds = [];
      this.selectedHeroRole = null;
      return;
    }
    this.selected = { kind, id };
    if (kind === "unit") {
      this.selectedUnitIds = [id];
      this.selectedHeroRole = null;
      const u = this.units.find((item) => item.id === id && item.state !== "death");
      if (u) {
        this.sayLine(u, "onClick", this.lang);
        u.clickSquish = 1.0;
        this.addClickMarker(u.x, u.y, "#8fe39a");
        sound.playSfx("select");
      }
    } else if (kind === "hero") {
      this.selectedUnitIds = [];
      this.selectedHeroRole = heroRole || null;
      sound.playSfx("select");
    } else {
      this.selectedUnitIds = [];
      this.selectedHeroRole = null;
      sound.playSfx("select");
    }
  }

  public selectMultipleUnits(ids: number[]) {
    const valid = this.units.filter((u) => ids.includes(u.id) && u.state !== "death");
    if (!valid.length) {
      this.selected = null;
      this.selectedUnitIds = [];
      return;
    }
    this.selected = { kind: "unit", id: valid[0].id };
    this.selectedUnitIds = valid.map((u) => u.id);
    this.selectedHeroRole = null;
    valid.forEach((u) => (u.clickSquish = 1.0));

    if (valid.length > 1) {
      this.squadChant();
    } else {
      this.sayLine(valid[0], "onClick", this.lang);
      sound.playSfx("select");
    }
  }

  public selectRoleGroup(role: RoleType) {
    const list = this.units.filter((u) => u.state !== "death" && u.role === role);
    if (!list.length) {
      const roleName = this.getRoleName(role);
      this.setBanner(
        this.lang === "pt"
          ? `Nenhum ${roleName} vivo no momento!`
          : `No ${roleName}s alive currently!`,
        1.5,
        "#ef9a7a"
      );
      return;
    }
    this.selected = { kind: "unit", id: list[0].id };
    this.selectedUnitIds = list.map((u) => u.id);
    this.selectedHeroRole = null;
    list.forEach((u) => (u.clickSquish = 1.0));

    if (list.length > 1) {
      this.squadChant();
    } else {
      this.sayLine(list[0], "onClick", this.lang);
    }

    const roleName = this.getRoleName(role);
    this.setBanner(
      this.lang === "pt"
        ? `Todos os ${list.length} ${roleName}s selecionados!`
        : `All ${list.length} ${roleName}s selected!`,
      1.8,
      "#73d9ff"
    );
    sound.playSfx("select");
  }

  public commandSquadAttackNearest() {
    const list = this.units.filter(
      (u) => this.selectedUnitIds.includes(u.id) && u.state !== "death"
    );
    if (!list.length) return;
    const target = this.nearestEnemyForUnit({ x: list[0].x, y: list[0].y }, 20) || this.boss;
    if (target && target.state !== "death") {
      this.commandSelectedUnits({
        kind: "enemy",
        id: target.id,
        x: Math.round(target.x),
        y: Math.round(target.y),
      });
      this.setBanner(
        this.lang === "pt"
          ? "⚔️ Esquadrão avançando para combater invasores!"
          : "⚔️ Squad charging to engage swarm invaders!",
        2,
        "#ff6b6b"
      );
    } else {
      this.setBanner(
        this.lang === "pt"
          ? "Nenhum invasor próximo avistado!"
          : "No nearby invaders sighted!",
        1.5,
        "#73d9ff"
      );
    }
  }

  public commandSelectedUnits(target: {
    kind: "node" | "building" | "enemy" | "ground";
    id?: number;
    x: number;
    y: number;
  }) {
    if (!this.selectedUnitIds.length) return;
    const selectedList = this.units.filter(
      (u) => this.selectedUnitIds.includes(u.id) && u.state !== "death"
    );
    if (!selectedList.length) return;

    if (selectedList.length > 1) {
      this.squadChant();
    }

    if (target.kind === "node" && target.id !== undefined) {
      const node = this.nodes.find((n) => n.id === target.id && n.amount > 0);
      if (node) {
        selectedList.forEach((u) => this.gather(u, node));
        this.addClickMarker(node.x, node.y, "#ffd56b");
        sound.playSfx("select");
        return;
      }
    }

    if (target.kind === "building" && target.id !== undefined) {
      const b = this.buildings.find((item) => item.id === target.id);
      if (b) {
        if (!b.complete || b.upgrading) {
          selectedList.forEach((u) => {
            if (u.role === "builder") this.commandBuild(u, b);
            else this.commandMove(u, b.x + b.w / 2, b.y + b.h / 2);
          });
          this.addClickMarker(b.x + b.w / 2, b.y + b.h / 2, "#8fe39a");
        } else if (b.hp < b.maxHp) {
          selectedList.forEach((u) => {
            if (u.role === "builder") this.commandRepair(u, b);
          });
          this.addClickMarker(b.x + b.w / 2, b.y + b.h / 2, "#8fe39a");
        } else if (b.type === "farm") {
          selectedList.forEach((u) => {
            if (u.role === "farmer") this.commandWorkFarm(u, b);
          });
        }
        sound.playSfx("select");
        return;
      }
    }

    if (target.kind === "enemy" && target.id !== undefined) {
      const enemy = this.enemies.find((en) => en.id === target.id && en.state !== "death") || (this.boss && this.boss.id === target.id && this.boss.state !== "death" ? this.boss : null);
      if (enemy) {
        const civilianAttackers = selectedList.filter((u) => u.role !== "warrior" && u.role !== "javelin");
        if (civilianAttackers.length > 0) {
          const ptCries = ["PELA VILA!", "DEFENDAM A CIDADE!", "SEGUREM AS FERAS!", "ÀS ARMAS!", "PELO REINO!"];
          const enCries = ["FOR THE VILLAGE!", "DEFEND OUR HOME!", "HOLD THE LINE!", "TO ARMS!", "FOR THE REALM!"];
          const pool = this.lang === "pt" ? ptCries : enCries;
          const cry = pool[Math.floor(this.rng() * pool.length)];
          civilianAttackers[0].speech = { text: cry, time: 2.2, maxTime: 2.2 };
          this.float(cry, civilianAttackers[0].x, civilianAttackers[0].y, "#ffd56b");
        }
        selectedList.forEach((u) => {
          this.commandAttack(u, enemy);
        });
        this.addClickMarker(enemy.x, enemy.y, "#ff6b6b");
        sound.playSfx("select");
        return;
      }
    }

    // Ground move with squad spacing
    const count = selectedList.length;
    const cols = Math.ceil(Math.sqrt(count));
    selectedList.forEach((u, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const tx = Math.max(0, Math.min(COLS - 1, target.x + (col - cols / 2) * 0.7));
      const ty = Math.max(0, Math.min(ROWS - 1, target.y + (row - cols / 2) * 0.7));
      this.commandMove(u, Math.round(tx), Math.round(ty));
    });
    this.addClickMarker(target.x, target.y, "#73d9ff");
    sound.playSfx("select");
  }

  public commandHeroMove(targetX: number, targetY: number) {
    if (this.selectedHeroRole === "golem") {
      if (!this.golem || this.golem.hp <= 0) return;
      this.golem.path = this.findPath(this.golem.x, this.golem.y, [
        { x: Math.round(targetX), y: Math.round(targetY) },
      ]);
      this.golem.state = "walk";
      this.addClickMarker(targetX, targetY, "#73d9ff");
      sound.playSfx("select");
      return;
    }

    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (!hero || hero.hp <= 0) return;
    hero.targetEnemy = null;
    hero.targetX = targetX;
    hero.targetY = targetY;
    hero.path = this.findPath(hero.x, hero.y, [
      { x: Math.round(targetX), y: Math.round(targetY) },
    ]);
    hero.state = "walk";
    hero.pathClock = 1.0;
    this.addClickMarker(targetX, targetY, "#ffd56b");
    sound.playSfx("select");
  }

  public commandHeroAttack(enemy: Enemy) {
    if (!enemy || enemy.state === "death") return;
    if (this.selectedHeroRole === "golem") {
      if (!this.golem || this.golem.hp <= 0) return;
      this.golem.path = this.findPath(this.golem.x, this.golem.y, [
        { x: Math.round(enemy.x), y: Math.round(enemy.y) },
      ]);
      this.golem.state = "walk";
      this.addClickMarker(enemy.x, enemy.y, "#ff6b6b");
      sound.playSfx("select");
      return;
    }

    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (!hero || hero.hp <= 0) return;
    hero.targetEnemy = enemy;
    hero.targetX = undefined;
    hero.targetY = undefined;
    hero.path = this.findPath(hero.x, hero.y, [
      { x: Math.round(enemy.x), y: Math.round(enemy.y) },
    ]);
    hero.state = "walk";
    hero.pathClock = 0.5;
    this.addClickMarker(enemy.x, enemy.y, "#ff6b6b");
    sound.playSfx("select");
  }

  public useHeroSpecialAttack() {
    const hero = this.heroUnit || Object.values(this.altarHeroes).find((h) => h && h.hp > 0);
    if (!hero || hero.hp <= 0) return;

    if (hero.specialCd > 0) {
      const s = Math.ceil(hero.specialCd);
      this.setBanner(
        this.lang === "pt" ? `Golpe Sagrado em recarga (${s}s)!` : `Holy Smite on cooldown (${s}s)!`,
        1.5,
        "#ffd56b"
      );
      return;
    }

    hero.specialCd = hero.maxSpecialCd || 8.5;
    const radius = 3.8;
    const dmg = 65 + (hero.level - 1) * 20;
    hero.state = "attack";
    hero.flash = 0.35;
    this.addShockwave(hero.x + 0.5, hero.y + 0.5, "#ffd56b", radius + 0.5, 0.65, "holy");
    let hits = 0;

    for (const e of this.enemies) {
      if (e.state === "death") continue;
      const d = Math.hypot(e.x - hero.x, e.y - hero.y);
      if (d <= radius) {
        this.damageEnemy(e, dmg);
        this.addParticle(e.x, e.y, "#ffe66d", 16);
        hits++;
      }
    }
    if (this.boss && this.boss.state !== "death") {
      const d = Math.hypot(this.boss.x - hero.x, this.boss.y - hero.y);
      if (d <= radius) {
        this.damageEnemy(this.boss, dmg);
        this.addParticle(this.boss.x, this.boss.y, "#ffe66d", 20);
        hits++;
      }
    }

    this.shakeScreen(7, 0.35);
    this.addParticle(hero.x + 0.5, hero.y + 0.5, "#fff275", 40);
    this.addParticle(hero.x + 0.5, hero.y + 0.5, "#ffae42", 25);
    this.float(this.lang === "pt" ? "⚡ GOLPE SAGRADO!" : "⚡ HOLY SMITE!", hero.x + 0.5, hero.y - 0.5, "#ffe66d");
    sound.playSfx("upgrade");
    this.setBanner(
      this.lang === "pt"
        ? `👑 Herói desferiu Golpe Sagrado (${hits} inimigos atingidos)!`
        : `👑 Hero unleashed Holy Smite (${hits} hits)!`,
      2.5,
      "#ffe66d"
    );
  }

  public useHeroAbility(role?: AltarHeroRole | "golem") {
    if (role === "golem") {
      if (!this.golem || this.golem.hp <= 0) return;
      const g = this.golem;
      g.state = "attack";
      g.flash = 0.4;
      this.addShockwave(g.x + 0.5, g.y + 0.5, "#73d9ff", 4.5, 0.7, "holy");
      let hits = 0;
      for (const e of this.enemies) {
        if (e.state === "death") continue;
        const d = Math.hypot(e.x - g.x, e.y - g.y);
        if (d <= 4.0) {
          this.damageEnemy(e, 45);
          this.addParticle(e.x, e.y, "#73d9ff", 14);
          hits++;
        }
      }
      this.shakeScreen(8, 0.4);
      this.addParticle(g.x + 0.5, g.y + 0.5, "#73d9ff", 35);
      this.float(this.lang === "pt" ? "TERREMOTO!" : "EARTH SLAM!", g.x + 0.5, g.y, "#73d9ff");
      sound.playSfx("hammer");
      this.setBanner(
        this.lang === "pt"
          ? `Golem desferiu Terremoto atingindo ${hits} inimigos!`
          : `Golem slammed ground hitting ${hits} enemies!`,
        2.5,
        "#73d9ff"
      );
      return;
    }

    this.useHeroSpecialAttack();
  }

  public getAltarHeroStatus(role?: AltarHeroRole): { unlocked: boolean; req: string } {
    return { unlocked: true, req: "" };
  }

  public cycleGameSpeed() {
    if (this.speed === 1) this.speed = 1.5;
    else if (this.speed === 1.5) this.speed = 2;
    else this.speed = 1;
    sound.playSfx("click");
    this.setBanner(
      this.lang === "pt"
        ? `⏩ Velocidade do Jogo: ${this.speed}x`
        : `⏩ Game Speed: ${this.speed}x`,
      1.6,
      "#ffd56b"
    );
  }

  public callWaveEarly() {
    if (this.screen !== "play" || this.paused) return;
    const p = this.phaseInfo();
    if (p.name !== "Build" || p.remain <= 5) return;

    const bonusGold = Math.max(5, Math.round(p.remain * 0.25));
    const bonusCrystal = Math.max(3, Math.round(p.remain * 0.1));
    this.resources.gold += bonusGold;
    this.resources.crystal += bonusCrystal;

    // Advance time to 4.5s before night wave starts for smooth twilight ramp
    const C = BALANCE.cycle;
    const cycleStart = Math.floor(Math.max(0, this.time) / C.total) * C.total;
    this.time = cycleStart + C.build - 4.5;

    const c = this.castle();
    if (c) {
      this.float(`+${bonusGold}💰 +${bonusCrystal}💎`, c.x + 1, c.y, "#ffd56b");
      this.addParticle(c.x + 1, c.y + 1, "#ffd56b", 22);
    }
    sound.playSfx("upgrade");
    this.setBanner(
      this.lang === "pt"
        ? `⚔️ Onda chamada cedo! Bônus de Coragem: +${bonusGold}💰 +${bonusCrystal}💎`
        : `⚔️ Wave called early! Courage Bonus: +${bonusGold}G +${bonusCrystal} Crystal`,
      3.0,
      "#ffd56b"
    );
  }

  public repairAllDamagedBuildings() {
    const damaged = this.buildings.filter((b) => b.complete && b.hp > 0 && b.hp < b.maxHp);
    if (!damaged.length) {
      this.setBanner(
        this.lang === "pt" ? "Todas as estruturas estão intactas!" : "All structures are at full health!",
        1.8,
        "#8fe39a"
      );
      return;
    }
    const builders = this.aliveUnits().filter((u) => u.role === "builder");
    if (!builders.length) {
      this.setBanner(
        this.lang === "pt"
          ? "Nenhum Construtor disponível! Recrute um na Câmara Municipal."
          : "No Builders available! Recruit one at the Town Hall.",
        2.2,
        "#ef8d78"
      );
      sound.playSfx("warn");
      return;
    }
    damaged.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    builders.forEach((u, i) => {
      const targetB = damaged[i % damaged.length];
      this.commandRepair(u, targetB);
    });
    sound.playSfx("hammer");
    this.setBanner(
      this.lang === "pt"
        ? `🔧 ${builders.length} construtor(es) enviado(s) para reparar ${damaged.length} estrutura(s)!`
        : `🔧 Dispatched ${builders.length} builder(s) to repair ${damaged.length} structure(s)!`,
      2.5,
      "#8fe39a"
    );
  }

  public getRoleCounts(): Record<RoleType, { total: number; working: number; idle: number }> {
    const roles: RoleType[] = [
      "builder",
      "woodcutter",
      "stoneMiner",
      "goldMiner",
      "farmer",
      "warrior",
      "javelin",
      "scout",
    ];
    const res: any = {};
    for (const r of roles) {
      const list = this.units.filter((u) => u.state !== "death" && u.role === r);
      const idle = list.filter((u) => u.state === "idle").length;
      res[r] = {
        total: list.length,
        working: list.length - idle,
        idle,
      };
    }
    return res;
  }
}
