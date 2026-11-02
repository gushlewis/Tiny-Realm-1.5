/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameEngine } from "./engine";
import { Language, Resources, RoleType, BuildingType, BiomeType } from "../types/game";

export interface DialogueBeat {
  speaker: { pt: string; en: string };
  roleTitle: { pt: string; en: string };
  avatar: string;
  avatarBg: string;
  text: { pt: string; en: string };
}

export interface ChapterObjective {
  id: string;
  label: { pt: string; en: string };
  isCompleted: (engine: GameEngine) => boolean;
  getProgress?: (engine: GameEngine) => { current: number; target: number; display?: string };
}

export interface CampaignChapter {
  id: number;
  biome: BiomeType;
  title: { pt: string; en: string };
  subtitle: { pt: string; en: string };
  location: { pt: string; en: string };
  icon: string;
  badge: { pt: string; en: string };
  targetWaves: number;
  startResources: Resources;
  initialUnits: RoleType[];
  initialBuildings?: { type: BuildingType; xOffset: number; yOffset: number }[];
  prologue: DialogueBeat[];
  epilogue: DialogueBeat[];
  primaryObjectives: ChapterObjective[];
  secondaryObjectives: ChapterObjective[];
}

export interface ChapterSaveData {
  completed: boolean;
  stars: number; // 1 to 3
  highScore: number;
  clearedAt?: string;
}

export interface CampaignProgress {
  unlockedChapter: number; // 1 to 5
  chapters: Record<number, ChapterSaveData>;
}

const CAMPAIGN_STORAGE_KEY = "tinyrealm_campaign_progress_v1";

export function loadCampaignProgress(): CampaignProgress {
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.unlockedChapter === "number") {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load campaign progress", e);
  }
  return {
    unlockedChapter: 1,
    chapters: {
      1: { completed: false, stars: 0, highScore: 0 },
      2: { completed: false, stars: 0, highScore: 0 },
      3: { completed: false, stars: 0, highScore: 0 },
      4: { completed: false, stars: 0, highScore: 0 },
      5: { completed: false, stars: 0, highScore: 0 },
    },
  };
}

export function saveCampaignProgress(progress: CampaignProgress): void {
  try {
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save campaign progress", e);
  }
}

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  // CHAPTER 1: THE LUSH WOODS (WARCRAFT HEARTHGLEN STYLE)
  {
    id: 1,
    biome: "forest",
    title: {
      pt: "Capítulo I · O Despertar do Enxame",
      en: "Chapter I · The Swarm Awakens",
    },
    subtitle: {
      pt: "Estabeleça o acampamento de Lordaeron, garanta comida, explore o bosque e derrote o primeiro ninho neutro.",
      en: "Establish the woodland base, secure food reserves, scout the forest, and clear the first creep nest.",
    },
    location: {
      pt: "Bosque dos Sussurros (Lordaeron)",
      en: "Whispering Woods (Lordaeron)",
    },
    icon: "🌲",
    badge: {
      pt: "Bosque Verdejante · Início",
      en: "Verdant Woodlands · Start",
    },
    targetWaves: 2,
    startResources: { wood: 280, stone: 160, gold: 80, food: 140, crystal: 15 },
    initialUnits: ["builder", "builder", "woodcutter", "scout"],
    prologue: [
      {
        speaker: { pt: "Lorde Aldric", en: "Lord Aldric" },
        roleTitle: { pt: "Conselheiro Real", en: "Royal Chancellor" },
        avatar: "👑",
        avatarBg: "from-amber-700 to-amber-950",
        text: {
          pt: "Meu Soberano! As vilas da fronteira foram dizimadas pela escuridão rastejante. Sobramos nós nesta clareira fértil. Precisamos levantar imediatamente uma Fazenda, armar nossos primeiros soldados e enviar o batedor para inspecionar os covis neutros no bosque!",
          en: "My Sovereign! Border villages have fallen to the creeping darkness. We alone stand in this fertile glade. We must immediately erect a Farm, equip our first soldiers, and send our scout to survey the neutral creep dens in the woods!",
        },
      },
      {
        speaker: { pt: "Mestre Bran", en: "Master Bran" },
        roleTitle: { pt: "Chefe dos Construtores", en: "Master Builder" },
        avatar: "🔨",
        avatarBg: "from-orange-700 to-orange-950",
        text: {
          pt: "As ferramentas reais estão prontas! Cortaremos madeira dos carvalhos e extrairemos pedra para as muralhas. Ao seu comando, meu senhor!",
          en: "The royal tools are ready! We shall fell oak timber and quarry stone for the walls. At your command, my lord!",
        },
      },
    ],
    epilogue: [
      {
        speaker: { pt: "Lorde Aldric", en: "Lord Aldric" },
        roleTitle: { pt: "Conselheiro Real", en: "Royal Chancellor" },
        avatar: "👑",
        avatarBg: "from-amber-700 to-amber-950",
        text: {
          pt: "Vitória na clareira! As investidas da vanguarda foram aniquiladas e encontramos a primeira relíquia arcana. Mas os batedores avisam: o enxame avançou para o árido Cânion dos Renegados!",
          en: "Victory in the glade! The vanguard probes were routed and we uncovered our first arcane relic. But scouts report the swarm has swept toward the arid Renegade Canyons!",
        },
      },
    ],
    primaryObjectives: [
      {
        id: "c1_farm",
        label: {
          pt: "Construir 1 Fazenda para sustento da tropa",
          en: "Construct 1 Farm to sustain supplies",
        },
        isCompleted: (engine) => engine.buildings.some((b) => b.type === "farm" && b.complete),
        getProgress: (engine) => ({
          current: engine.buildings.filter((b) => b.type === "farm" && b.complete).length,
          target: 1,
        }),
      },
      {
        id: "c1_barracks",
        label: {
          pt: "Construir 1 Quartel de Infantaria",
          en: "Construct 1 Infantry Barracks",
        },
        isCompleted: (engine) => engine.buildings.some((b) => b.type === "barracks" && b.complete),
        getProgress: (engine) => ({
          current: engine.buildings.filter((b) => b.type === "barracks" && b.complete).length,
          target: 1,
        }),
      },
      {
        id: "c1_waves",
        label: {
          pt: "Sobreviver a 2 Ondas Noturnas",
          en: "Survive 2 Night Waves",
        },
        isCompleted: (engine) => engine.wavesSurvived >= 2,
        getProgress: (engine) => ({
          current: Math.min(2, engine.wavesSurvived),
          target: 2,
        }),
      },
    ],
    secondaryObjectives: [
      {
        id: "c1_sec_creep",
        label: {
          pt: "Limpar 1 Acampamento Neutro e saquear a Relíquia",
          en: "Clear 1 Neutral Creep Camp and loot the Relic",
        },
        isCompleted: (engine) => engine.creepCamps.some((c) => c.cleared),
        getProgress: (engine) => ({
          current: engine.creepCamps.filter((c) => c.cleared).length >= 1 ? 1 : 0,
          target: 1,
        }),
      },
      {
        id: "c1_sec_warriors",
        label: {
          pt: "Treinar pelo menos 2 Guerreiros ou Lanceiros",
          en: "Train at least 2 Warriors or Javelin throwers",
        },
        isCompleted: (engine) =>
          engine.units.filter((u) => u.state !== "death" && (u.role === "warrior" || u.role === "javelin")).length >= 2,
        getProgress: (engine) => ({
          current: Math.min(
            2,
            engine.units.filter((u) => u.state !== "death" && (u.role === "warrior" || u.role === "javelin")).length
          ),
          target: 2,
        }),
      },
    ],
  },

  // CHAPTER 2: THE ARID BARRENS & GOLD EXPANSION (WARCRAFT BARRENS EXPANSION STYLE)
  {
    id: 2,
    biome: "barrens",
    title: {
      pt: "Capítulo II · Os Ermos e a Mina Perdida",
      en: "Chapter II · The Barrens & The Lost Mine",
    },
    subtitle: {
      pt: "A terra é árida e o ouro inicial é escasso. Avance pelo cânion, derrote os escorpiões e expanda a base!",
      en: "The red clay is dry and gold is sparse. Push through the gorge, defeat the scorpions, and expand your base!",
    },
    location: {
      pt: "Cânion dos Renegados (Os Ermos)",
      en: "Renegade Canyons (The Barrens)",
    },
    icon: "🏜️",
    badge: {
      pt: "Cânion Árido · Expansão",
      en: "Arid Canyons · Outpost Expansion",
    },
    targetWaves: 3,
    startResources: { wood: 320, stone: 200, gold: 90, food: 150, crystal: 25 },
    initialUnits: ["builder", "builder", "woodcutter", "stoneMiner", "warrior", "scout"],
    prologue: [
      {
        speaker: { pt: "Capitão Valen", en: "Captain Valen" },
        roleTitle: { pt: "Guarda do Bastião", en: "Bastion Guard" },
        avatar: "⚔️",
        avatarBg: "from-red-700 to-red-950",
        text: {
          pt: "A argila vermelha dos Ermos é impiedosa! O veio de ouro central é pequeno e acabará rápido. Batedores detectaram uma gigantesca Jazida de Ouro a nordeste do cânion, protegida por escaravelhos e escorpiões selvagens. Precisamos limpar a rota e fundar nosso posto avançado!",
          en: "The red clay of the Barrens is merciless! The central gold vein is meager and will quickly run dry. Scouts report a massive Gold Quarry to the northeast, guarded by wild scarabs and scorpions. We must secure the trail and expand our borders!",
        },
      },
      {
        speaker: { pt: "Mestre Bran", en: "Master Bran" },
        roleTitle: { pt: "Chefe dos Construtores", en: "Master Builder" },
        avatar: "🔨",
        avatarBg: "from-orange-700 to-orange-950",
        text: {
          pt: "As tempestades de poeira cobrirão a aproximação das feras. Erguerei Torres de Vigia e Paliçadas nos gargalos do desfiladeiro para proteger nossos mineradores de ouro!",
          en: "Dust storms will veil the beasts' approach. I shall fortify the gorge bottlenecks with Watchtowers and Palisades to shelter our gold miners!",
        },
      },
    ],
    epilogue: [
      {
        speaker: { pt: "Capitão Valen", en: "Captain Valen" },
        roleTitle: { pt: "Guarda do Bastião", en: "Bastion Guard" },
        avatar: "⚔️",
        avatarBg: "from-red-700 to-red-950",
        text: {
          pt: "O posto avançado prosperou e a grande mina é nossa! Os monstros dos Ermos recuaram para as montanhas geladas do norte. Nossos cofres estão transbordando de ouro, mas o inverno glacial se aproxima...",
          en: "The outpost flourished and the grand quarry is ours! The Barrens beasts retreated into the frozen northern peaks. Our vaults brim with gold, but the glacial frost descends...",
        },
      },
    ],
    primaryObjectives: [
      {
        id: "c2_tower",
        label: {
          pt: "Construir 1 Torre de Vigia com arqueiros",
          en: "Construct 1 Watchtower with garrisoned archers",
        },
        isCompleted: (engine) => engine.buildings.some((b) => b.type === "tower" && b.complete),
        getProgress: (engine) => ({
          current: engine.buildings.filter((b) => b.type === "tower" && b.complete).length,
          target: 1,
        }),
      },
      {
        id: "c2_gate",
        label: {
          pt: "Construir 1 Portão de Muralha funcional no gargalo",
          en: "Construct 1 functional Wall Gate at the choke",
        },
        isCompleted: (engine) => engine.buildings.some((b) => b.type === "gate" && b.complete),
        getProgress: (engine) => ({
          current: engine.buildings.filter((b) => b.type === "gate" && b.complete).length,
          target: 1,
        }),
      },
      {
        id: "c2_waves",
        label: {
          pt: "Sobreviver a 3 Ondas Noturnas no cânion árido",
          en: "Survive 3 Night Waves in the arid canyon",
        },
        isCompleted: (engine) => engine.wavesSurvived >= 3,
        getProgress: (engine) => ({
          current: Math.min(3, engine.wavesSurvived),
          target: 3,
        }),
      },
    ],
    secondaryObjectives: [
      {
        id: "c2_sec_expansion",
        label: {
          pt: "Acumular 160 de Ouro explorando os veios do cânion",
          en: "Stockpile 160 Gold by mining the canyon veins",
        },
        isCompleted: (engine) => engine.resources.gold >= 160,
        getProgress: (engine) => ({
          current: Math.min(160, Math.floor(engine.resources.gold)),
          target: 160,
        }),
      },
      {
        id: "c2_sec_palisades",
        label: {
          pt: "Erguer pelo menos 6 segmentos de Paliçada protetora",
          en: "Erect at least 6 protective Palisade segments",
        },
        isCompleted: (engine) => engine.buildings.filter((b) => b.type === "palisade" && b.complete).length >= 6,
        getProgress: (engine) => ({
          current: Math.min(6, engine.buildings.filter((b) => b.type === "palisade" && b.complete).length),
          target: 6,
        }),
      },
    ],
  },

  // CHAPTER 3: FROZEN TUNDRA & FOUNTAIN OF LIFE (WARCRAFT NORTHREND STYLE)
  {
    id: 3,
    biome: "tundra",
    title: {
      pt: "Capítulo III · A Tundra Glacial e a Fonte Sagrada",
      en: "Chapter III · The Frozen Tundra & Sacred Fountain",
    },
    subtitle: {
      pt: "Lute através da nevasca congelada, encontre a lendária Fonte da Vida e evolua para o Bastião de Ferro.",
      en: "Fight through the raging blizzard, discover the mythical Fountain of Life, and upgrade to Hold tier.",
    },
    location: {
      pt: "Passo Glacial de Northrend",
      en: "Glacial Pass of Northrend",
    },
    icon: "❄️",
    badge: {
      pt: "Tundra Nevada · Fonte da Vida",
      en: "Snow Tundra · Fountain of Life",
    },
    targetWaves: 3,
    startResources: { wood: 360, stone: 260, gold: 130, food: 190, crystal: 40 },
    initialUnits: ["builder", "builder", "stoneMiner", "goldMiner", "woodcutter", "warrior", "javelin", "scout"],
    prologue: [
      {
        speaker: { pt: "Maga Elena", en: "Mage Elena" },
        roleTitle: { pt: "Guardiã Arcana", en: "Arcane Keeper" },
        avatar: "🔮",
        avatarBg: "from-cyan-700 to-cyan-950",
        text: {
          pt: "O frio gélido congela o sopro de nossos soldados! Mas sinto uma pulsação sagrada ao sul: as águas celestiais da mítica Fonte da Vida fluem sob o gelo. Suas águas restaurarão a saúde de qualquer herói e guerreiro que descansar junto a ela!",
          en: "The biting frost freezes the very breath of our men! Yet I sense a celestial thrum to the south: the mythical Fountain of Life still flows beneath the ice. Its waters shall restore vitality to any warrior or champion resting beside it!",
        },
      },
      {
        speaker: { pt: "Lorde Aldric", en: "Lord Aldric" },
        roleTitle: { pt: "Conselheiro Real", en: "Royal Chancellor" },
        avatar: "👑",
        avatarBg: "from-amber-700 to-amber-950",
        text: {
          pt: "Para suportar o cerco dos monstros da nevasca, devemos evoluir a Câmara Municipal para Nível 2 (Bastião) e marchar nossas tropas até a Fonte!",
          en: "To withstand the siege of snow beasts, we must fortify our Town Hall to Tier 2 (Hold) and march our host to the Fountain!",
        },
      },
    ],
    epilogue: [
      {
        speaker: { pt: "Maga Elena", en: "Mage Elena" },
        roleTitle: { pt: "Guardiã Arcana", en: "Arcane Keeper" },
        avatar: "🔮",
        avatarBg: "from-cyan-700 to-cyan-950",
        text: {
          pt: "A Fonte da Vida cantou em vitória e a nevasca acalmou! O Bastião suportou as garras do gelo. Mas a peste das sombras agora se concentra no pântano infectado logo adiante...",
          en: "The Fountain of Life sang in triumph and the blizzard subsided! Our Hold endured the frost. Yet the creeping blight now festers in the corrupted swamps ahead...",
        },
      },
    ],
    primaryObjectives: [
      {
        id: "c3_townhall_tier2",
        label: {
          pt: "Evoluir a Câmara Municipal para Nível 2 (Bastião)",
          en: "Upgrade Town Hall to Tier 2 (Hold)",
        },
        isCompleted: (engine) => {
          const c = engine.castle();
          return !!c && c.tier >= 2;
        },
        getProgress: (engine) => {
          const c = engine.castle();
          return { current: c ? c.tier : 1, target: 2, display: `${c ? c.tier : 1}/2` };
        },
      },
      {
        id: "c3_army",
        label: {
          pt: "Treinar um exército de pelo menos 5 soldados militares",
          en: "Train an army of at least 5 military combat units",
        },
        isCompleted: (engine) =>
          engine.units.filter((u) => u.state !== "death" && ["warrior", "javelin", "scout"].includes(u.role)).length >= 5,
        getProgress: (engine) => ({
          current: Math.min(
            5,
            engine.units.filter((u) => u.state !== "death" && ["warrior", "javelin", "scout"].includes(u.role)).length
          ),
          target: 5,
        }),
      },
      {
        id: "c3_waves",
        label: {
          pt: "Sobreviver a 3 Ondas Noturnas congelantes",
          en: "Survive 3 freezing Night Waves",
        },
        isCompleted: (engine) => engine.wavesSurvived >= 3,
        getProgress: (engine) => ({
          current: Math.min(3, engine.wavesSurvived),
          target: 3,
        }),
      },
    ],
    secondaryObjectives: [
      {
        id: "c3_sec_fountain",
        label: {
          pt: "Descobrir a Fonte Sagrada da Vida explorando o sul",
          en: "Discover the Sacred Fountain of Life to the south",
        },
        isCompleted: (engine) => {
          if (!engine.fountainOfLife) return false;
          return engine.isExplored(Math.round(engine.fountainOfLife.x), Math.round(engine.fountainOfLife.y));
        },
        getProgress: (engine) => {
          const disc = engine.fountainOfLife && engine.isExplored(Math.round(engine.fountainOfLife.x), Math.round(engine.fountainOfLife.y));
          return { current: disc ? 1 : 0, target: 1 };
        },
      },
      {
        id: "c3_sec_relics",
        label: {
          pt: "Coletar pelo menos 2 Relíquias Arcanas nos acampamentos",
          en: "Collect at least 2 Arcane Relics from creep camps",
        },
        isCompleted: (engine) => engine.relics.length >= 2,
        getProgress: (engine) => ({
          current: Math.min(2, engine.relics.length),
          target: 2,
        }),
      },
    ],
  },

  // CHAPTER 4: FEL CORRUPTED SWAMP & DESTROYING HIVES (WARCRAFT FELWOOD / PLAGUELANDS STYLE)
  {
    id: 4,
    biome: "swamp",
    title: {
      pt: "Capítulo IV · O Pântano da Peste e a Necrópole",
      en: "Chapter IV · The Fel Swamp & The Hive Nests",
    },
    subtitle: {
      pt: "A terra está corrompida pela peste! Erga o Altar Sagrado, convoque o Herói e destrua os Ninhos do Enxame.",
      en: "The blighted earth festers with rot! Erect the Sacred Altar, summon the Hero, and crush the Swarm Hives.",
    },
    location: {
      pt: "Pântano Corrompido (Terras Pestilentas)",
      en: "Corrupted Fel Swamp (The Plaguelands)",
    },
    icon: "☣️",
    badge: {
      pt: "Pântano Pestilento · Ataque a Ninhos",
      en: "Blight Bog · Destroy Enemy Hives",
    },
    targetWaves: 4,
    startResources: { wood: 420, stone: 320, gold: 180, food: 220, crystal: 90 },
    initialUnits: ["builder", "builder", "builder", "woodcutter", "stoneMiner", "warrior", "warrior", "javelin"],
    prologue: [
      {
        speaker: { pt: "Maga Elena", en: "Mage Elena" },
        roleTitle: { pt: "Guardiã Arcana", en: "Arcane Keeper" },
        avatar: "🔮",
        avatarBg: "from-cyan-700 to-cyan-950",
        text: {
          pt: "O solo deste pântano apodrece sob a escuridão da peste! Piscinas de lodo ácido e ninhos do enxame geram monstruosidades continuamente. Se não erguermos o Altar e invocarmos o Herói Lendário para desferir Golpes Sagrados e Luz Divina, seremos engolidos pela maré tóxica!",
          en: "The marshland rots beneath foul blight! Toxic slime pools and brood ziggurats spawn abominations without cease. If we do not raise the Altar and summon the Legendary Champion to unleash Holy Smites and Divine Light, the toxic tide shall consume us!",
        },
      },
      {
        speaker: { pt: "Capitão Valen", en: "Captain Valen" },
        roleTitle: { pt: "Guarda do Bastião", en: "Bastion Guard" },
        avatar: "⚔️",
        avatarBg: "from-red-700 to-red-950",
        text: {
          pt: "Não ficaremos apenas esperando a noite cair! Durante o dia, marcharemos com o exército e o Herói para arrombar os Ninhos do Enxame e purificar os ziggurates com fogo!",
          en: "We shall not merely wait for nightfall! By daylight, our army and the Hero shall storm the Swarm Hives and scour the ziggurats with fire!",
        },
      },
    ],
    epilogue: [
      {
        speaker: { pt: "Lorde Aldric", en: "Lord Aldric" },
        roleTitle: { pt: "Conselheiro Real", en: "Royal Chancellor" },
        avatar: "👑",
        avatarBg: "from-amber-700 to-amber-950",
        text: {
          pt: "Os ninhos pestilentos foram demolidos e o solo purificado! A espada do Herói resplandeceu contra a escuridão. Agora, o caminho está livre para a fortaleza suprema: o Vulcão da Rainha Aranha!",
          en: "The blighted hives lie in ruin and the earth is cleansed! The Hero's blade shone bright against the dark. Now the passage lies open to the supreme lair: the Volcano of the Spider Queen!",
        },
      },
    ],
    primaryObjectives: [
      {
        id: "c4_altar",
        label: {
          pt: "Construir o Altar Sagrado de Invocação",
          en: "Construct the Sacred Summoning Altar",
        },
        isCompleted: (engine) => engine.buildings.some((b) => b.type === "altar" && b.complete),
        getProgress: (engine) => ({
          current: engine.buildings.filter((b) => b.type === "altar" && b.complete).length,
          target: 1,
        }),
      },
      {
        id: "c4_hero",
        label: {
          pt: "Invocar o Herói do Reino no Altar",
          en: "Summon the Hero of the Realm at the Altar",
        },
        isCompleted: (engine) =>
          !!engine.heroUnit ||
          Object.values(engine.altarHeroes).some((h) => h !== null && h.hp > 0),
        getProgress: (engine) => {
          const hasHero =
            !!engine.heroUnit ||
            Object.values(engine.altarHeroes).some((h) => h !== null && h.hp > 0);
          return { current: hasHero ? 1 : 0, target: 1 };
        },
      },
      {
        id: "c4_destroy_hive",
        label: {
          pt: "Destruir pelo menos 1 Ninho do Enxame no pântano",
          en: "Destroy at least 1 Swarm Hive in the swamp",
        },
        isCompleted: (engine) => engine.enemyHives.some((h) => h.destroyed),
        getProgress: (engine) => ({
          current: engine.enemyHives.filter((h) => h.destroyed).length,
          target: 1,
        }),
      },
      {
        id: "c4_waves",
        label: {
          pt: "Sobreviver a 3 Ondas Noturnas com monstros de elite",
          en: "Survive 3 Night Waves against elite swarms",
        },
        isCompleted: (engine) => engine.wavesSurvived >= 3,
        getProgress: (engine) => ({
          current: Math.min(3, engine.wavesSurvived),
          target: 3,
        }),
      },
    ],
    secondaryObjectives: [
      {
        id: "c4_sec_all_hives",
        label: {
          pt: "Demolir TODOS os Ninhos do Enxame (Purificação Total)",
          en: "Demolish ALL Swarm Hives (Total Purification)",
        },
        isCompleted: (engine) => engine.enemyHives.length > 0 && engine.enemyHives.every((h) => h.destroyed),
        getProgress: (engine) => ({
          current: engine.enemyHives.filter((h) => h.destroyed).length,
          target: Math.max(1, engine.enemyHives.length),
        }),
      },
      {
        id: "c4_sec_hero_spells",
        label: {
          pt: "Elevar o Herói do Reino ao Nível 2 ou superior (⭐)",
          en: "Raise the Hero of the Realm to Level 2 or higher (⭐)",
        },
        isCompleted: (engine) => engine.heroCommanderLevel >= 2,
        getProgress: (engine) => ({
          current: Math.min(2, engine.heroCommanderLevel),
          target: 2,
        }),
      },
    ],
  },

  // CHAPTER 5: VOLCANIC CALDERA & CITADEL SIEGE (WARCRAFT BLACKROCK SPIRE / FINAL ASSAULT)
  {
    id: 5,
    biome: "volcano",
    title: {
      pt: "Capítulo V · O Cerco à Cidadela Vulcânica",
      en: "Chapter V · The Siege of the Volcanic Citadel",
    },
    subtitle: {
      pt: "A batalha épica final sobre rios de lava ardente! Desperte o Golem Ancestral e aniquile a Rainha Aranha!",
      en: "The climactic battle across rivers of molten magma! Awaken the Ancient Golem and slay the Spider Queen!",
    },
    location: {
      pt: "Fortaleza Vulcânica de Blackrock",
      en: "Volcanic Citadel of Blackrock",
    },
    icon: "🌋",
    badge: {
      pt: "Cidadela Vulcânica · Batalha Final",
      en: "Volcanic Citadel · Final Boss Battle",
    },
    targetWaves: 4,
    startResources: { wood: 480, stone: 380, gold: 220, food: 260, crystal: 140 },
    initialUnits: [
      "builder",
      "builder",
      "builder",
      "woodcutter",
      "stoneMiner",
      "warrior",
      "warrior",
      "javelin",
      "javelin",
      "scout",
    ],
    prologue: [
      {
        speaker: { pt: "Lorde Aldric", en: "Lord Aldric" },
        roleTitle: { pt: "Conselheiro Real", en: "Royal Chancellor" },
        avatar: "👑",
        avatarBg: "from-amber-700 to-amber-950",
        text: {
          pt: "Eis a Garganta Vulcânica de Blackrock! Rios de lava borbulham sob as rochas de basalto. A colossal Rainha Aranha Soberana rege seu enxame deste poço de fogo. Hoje a espada do Reino decide o destino da história!",
          en: "Behold the Volcanic Gorge of Blackrock! Rivers of molten magma churn beneath the obsidian stone. The Sovereign Spider Queen commands her swarm from this pit of embers. Today the Realm's sword determines our history!",
        },
      },
      {
        speaker: { pt: "Herói do Reino", en: "Hero of the Realm" },
        roleTitle: { pt: "Campeão Sagrado", en: "Sacred Champion" },
        avatar: "⚡",
        avatarBg: "from-yellow-600 to-amber-900",
        text: {
          pt: "Ao meu lado, irmãos de armas! Que nosso Golem Titã quebre a terra e que nossos Golpes Divinos despedacem a rainha do abismo! Por Lordaeron e pela Coroa Imortal!",
          en: "At my side, brothers in arms! Let our Golem Titan shatter the earth, and let our Holy Smites cleave the abyssal queen! For Lordaeron and the Immortal Crown!",
        },
      },
    ],
    epilogue: [
      {
        speaker: { pt: "Lorde Aldric", en: "Lord Aldric" },
        roleTitle: { pt: "Conselheiro Real", en: "Royal Chancellor" },
        avatar: "👑",
        avatarBg: "from-amber-700 to-amber-950",
        text: {
          pt: "A RAINHA TOMBOU! O enxame se esvai em pânico e a lava se acalma! A aurora dourada ilumina a bandeira do nosso Reino soberano erguida na cidadela vulcânica. Você é uma lenda imortal!",
          en: "THE QUEEN HAS FALLEN! The swarm scatters in terror and the magma subsides! The golden dawn bathes our sovereign kingdom's standard raised over the volcanic citadel. You are an immortal legend!",
        },
      },
      {
        speaker: { pt: "Mestre Bran", en: "Master Bran" },
        roleTitle: { pt: "Chefe dos Construtores", en: "Master Builder" },
        avatar: "🔨",
        avatarBg: "from-orange-700 to-orange-950",
        text: {
          pt: "Erguemos a fortaleza suprema! Todas as terras estão livres e o Reino de Tiny Realm viverá por dez mil anos!",
          en: "We raised the ultimate citadel! All lands are free, and Tiny Realm shall endure for ten thousand years!",
        },
      },
    ],
    primaryObjectives: [
      {
        id: "c5_boss",
        label: {
          pt: "Derrotar a Rainha Aranha (Chefe Soberano do Enxame)",
          en: "Defeat the Spider Queen (Sovereign Swarm Boss)",
        },
        isCompleted: (engine) => engine.stats.bossKills >= 1,
        getProgress: (engine) => ({
          current: Math.min(1, engine.stats.bossKills),
          target: 1,
        }),
      },
      {
        id: "c5_survive",
        label: {
          pt: "Defender a Câmara Municipal contra a investida vulcânica",
          en: "Defend the Town Hall against the volcanic onslaught",
        },
        isCompleted: (engine) => {
          const c = engine.castle();
          return !!c && c.hp > 0 && engine.stats.bossKills >= 1;
        },
        getProgress: (engine) => ({
          current: engine.stats.bossKills >= 1 ? 1 : 0,
          target: 1,
        }),
      },
    ],
    secondaryObjectives: [
      {
        id: "c5_sec_fortify",
        label: {
          pt: "Evoluir a Câmara Municipal para Fortaleza Bastião Nível 3",
          en: "Upgrade Town Hall to Bastion Tier 3",
        },
        isCompleted: (engine) => {
          const c = engine.castle();
          return !!c && c.tier >= 3;
        },
        getProgress: (engine) => {
          const c = engine.castle();
          return { current: c ? c.tier : 1, target: 3, display: `${c ? c.tier : 1}/3` };
        },
      },
      {
        id: "c5_sec_golem",
        label: {
          pt: "Despertar o lendário Golem Ancestral ou Altar Heroico",
          en: "Awaken the legendary Ancient Golem or Heroic Altar",
        },
        isCompleted: (engine) =>
          (!!engine.golem && engine.golem.hp > 0) ||
          !!engine.heroUnit ||
          Object.values(engine.altarHeroes).some((h) => h !== null && h.hp > 0),
        getProgress: (engine) => ({
          current:
            (!!engine.golem && engine.golem.hp > 0) ||
            !!engine.heroUnit ||
            Object.values(engine.altarHeroes).some((h) => h !== null && h.hp > 0)
              ? 1
              : 0,
          target: 1,
        }),
      },
    ],
  },
];
