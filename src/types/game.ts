/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GamePhase = "Build" | "Wave" | "Boss Wave";
export type Language = "pt" | "en";
export type BiomeType = "forest" | "barrens" | "tundra" | "swamp" | "volcano";

export type RoleType =
  | "trainee"
  | "builder"
  | "woodcutter"
  | "stoneMiner"
  | "goldMiner"
  | "farmer"
  | "warrior"
  | "javelin"
  | "scout";

export type BuildingType =
  | "townhall"
  | "lumber"
  | "quarry"
  | "farm"
  | "house"
  | "barracks"
  | "tower"
  | "palisade"
  | "gate"
  | "altar";

export type NodeType = "tree" | "rock" | "ore" | "field";
export type ResourceType = "wood" | "stone" | "gold" | "food" | "crystal";

export type EnemySpecies = "ant" | "ladybug" | "stinkbug" | "centipede" | "scarab" | "mantis";
export type BossVariant = "spider" | "cicada" | "moth";
export type HeroAbility = "revive" | "buff" | "healDebuff";
export type AltarHeroRole = "hero" | "frontline" | "ranger" | "mage";

export interface Position {
  x: number;
  y: number;
}

export interface Resources {
  wood: number;
  stone: number;
  gold: number;
  food: number;
  crystal: number;
}

export interface Unit {
  id: number;
  name: string;
  x: number;
  y: number;
  role: RoleType;
  state: "idle" | "walk" | "chop" | "mine" | "farm" | "build" | "repair" | "attack" | "death";
  target: {
    kind: "node" | "building" | "repair" | "build" | "enemy" | "deposit" | "move" | "farm_work" | "scout";
    id?: number;
    x?: number;
    y?: number;
  } | null;
  path: Position[];
  anim: number;
  work: number;
  carry: { type: ResourceType; amount: number } | null;
  hp: number;
  maxHp: number;
  attackCd: number;
  death: number;
  sheltered?: boolean;
  scoutClock?: number;
  speech?: { text: string; time: number; maxTime: number } | null;
  clickSquish?: number;
  kills?: number;
  veteran?: boolean;
  _faceDx?: number;
  _faceDy?: number;
  _facing?: "left" | "right";
}

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  complete: boolean;
  progress: number;
  buildTime: number;
  builderId: number | null;
  repairerId: number | null;
  arrowCd: number;
  trainCd: number;
  tier: number;
  upgrading?: boolean;
  flash?: number;
  repairTicks?: number;
  hammerClock?: number;
}

export interface ResourceNode {
  id: number;
  type: NodeType;
  x: number;
  y: number;
  amount: number;
  max: number;
  flash: number;
  respawnTimer?: number | null;
  spawnAnim?: number;
}

export interface Enemy {
  id: number;
  kind: "raider" | "elite" | "boss";
  species: EnemySpecies;
  variant?: BossVariant;
  name?: string;
  stripe?: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackRate: number;
  speed: number;
  state: "walk" | "attack" | "death";
  path: Position[];
  target: any;
  pathClock: number;
  attackCd: number;
  contactCd: number;
  anim: number;
  flash: number;
  death: number;
  maxDeath?: number;
  retreat?: boolean;
  _faceDx?: number;
  _faceDy?: number;
  _facing?: "left" | "right";
}

export interface GolemUnit {
  id: number;
  kind: "golem";
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  aoeRadius: number;
  attackRate: number;
  timer: number;
  duration: number;
  state: "idle" | "walk" | "attack";
  path: Position[];
  pathClock: number;
  attackCd: number;
  anim: number;
  flash: number;
  rise: number;
  falling: number;
  fallReason?: "destroyed" | "expired";
  _faceDx?: number;
  _faceDy?: number;
  _facing?: "left" | "right";
}

export interface AltarHero {
  id: number;
  name?: string;
  role: AltarHeroRole;
  level: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRate: number;
  range?: number;
  aoeRadius?: number;
  lightning?: { chance: number; damage: number };
  timer: number;
  duration: number;
  state: "idle" | "walk" | "attack";
  path: Position[];
  pathClock: number;
  attackCd: number;
  specialCd: number;
  maxSpecialCd: number;
  targetEnemy?: Enemy | null;
  targetX?: number;
  targetY?: number;
  anim: number;
  flash: number;
  summonTimer?: number;
  _faceDx?: number;
  _faceDy?: number;
  _facing?: "left" | "right";
}

export interface HeroUnit {
  id: number;
  kind: "necromancer" | "captain" | "cleric";
  name: string;
  color: string;
  x: number;
  y: number;
  path: Position[];
  pathClock: number;
  attackCd: number;
  abilityCd: number;
  anim: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  ability: HeroAbility;
  timer: number;
  _faceDx?: number;
  _faceDy?: number;
  _facing?: "left" | "right";
}

export interface Arrow {
  id: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  target: number;
  targetIsBoss: boolean;
  damage: number;
  color?: string;
  chain?: { chance: number; damage: number };
  shape?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size?: number;
  color: string;
  gravity?: number;
  kind?: "spark" | "wood" | "stone" | "gold" | "leaf" | "rune" | "blood" | "ember";
  rot?: number;
  vRot?: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
  max: number;
  color: string;
}

export interface ShockwaveEffect {
  x: number;
  y: number;
  color: string;
  maxRadius: number;
  duration: number;
  time: number;
  type?: "holy" | "roar" | "heal";
}

export interface GameStats {
  kills: number;
  eliteKills: number;
  bossKills: number;
  crystalSpent: number;
  hallDamageTaken: number;
  resourcesCollected?: number;
}

export interface RelicItem {
  id: string;
  name: { pt: string; en: string };
  desc: { pt: string; en: string };
  icon: string;
  effect: "damage" | "health" | "speed" | "regen";
}

export interface CreepCamp {
  id: number;
  name: { pt: string; en: string };
  x: number;
  y: number;
  cleared: boolean;
  rewardClaimed: boolean;
  reward: { wood: number; stone: number; gold: number; crystal: number; relic?: RelicItem };
  creepCount: number;
  totalCreeps: number;
}

export interface FountainOfLife {
  x: number;
  y: number;
  radius: number;
  healingRate: number;
}

export interface EnemyHive {
  id: number;
  name: { pt: string; en: string };
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  species: EnemySpecies;
  flash: number;
}
