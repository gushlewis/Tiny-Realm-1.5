/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleType, Language } from "../types/game";

export interface StorySlide {
  title: { pt: string; en: string };
  text: { pt: string; en: string };
  icon: string;
  badge: { pt: string; en: string };
}

export const STORY_SLIDES: StorySlide[] = [
  {
    icon: "🌲",
    badge: { pt: "Capítulo I · A Queda", en: "Chapter I · The Fall" },
    title: {
      pt: "Nas Profundezas da Floresta dos Sussurros",
      en: "Deep Within the Whispering Woods",
    },
    text: {
      pt: "Por séculos, o Reino prosperou em harmonia. Porém, uma escuridão rastejante despertou sob o solo antigo: enxames titânicos de insetos vorazes ergueram-se, devorando aldeias e fortificações numa única noite de terror.",
      en: "For centuries, the Realm flourished in peace. Yet, a creeping corruption awakened beneath ancient soils: titanic insect swarms emerged, devouring towns and forts in a single night of terror.",
    },
  },
  {
    icon: "🏰",
    badge: { pt: "Capítulo II · A Chama Restante", en: "Chapter II · The Last Ember" },
    title: {
      pt: "O Último Refúgio e Dois Construtores",
      en: "The Last Sanctuary and Two Builders",
    },
    text: {
      pt: "Apenas as fundações da Câmara Municipal e dois fiéis mestres construtores resistiram à catástrofe. Com determinação inabalável, eles juraram erguer uma nova fortaleza onde nenhuma criatura das trevas ousará pisar.",
      en: "Only the foundations of the Town Hall and two master builders survived the onslaught. With steadfast resolve, they vowed to construct a new bastion where no shadow creature dare tread.",
    },
  },
  {
    icon: "⚔",
    badge: { pt: "Capítulo III · O Seu Comando", en: "Chapter III · Your Command" },
    title: {
      pt: "Comande, Fortifique e Sobreviva",
      en: "Command, Fortify and Survive",
    },
    text: {
      pt: "Aproveite a luz do dia para contratar artesãos especializados na Câmara Municipal, enfileirar novas construções e extrair recursos preciosos. Quando a noite cair, as hordas marcharão. Defenda a coroa a todo custo!",
      en: "Seize daylight to recruit specialized artisans at the Town Hall, queue new constructions, and gather vital resources. When night falls, the swarm marches. Defend the crown at all costs!",
    },
  },
];

export const UNIT_VOICE_LINES: Record<
  RoleType,
  {
    onClick: { pt: string[]; en: string[] };
    onCommand: { pt: string[]; en: string[] };
    onNight: { pt: string[]; en: string[] };
  }
> = {
  builder: {
    onClick: {
      pt: [
        "Martelo e trena prontos!",
        "Um bom alicerce aguenta qualquer tempestade.",
        "Muralhas fortes salvam vidas!",
        "Às suas ordens, meu soberano!",
      ],
      en: [
        "Hammer and plumb ready!",
        "A sturdy foundation withstands any storm.",
        "Strong walls save lives!",
        "At your command, sire!",
      ],
    },
    onCommand: {
      pt: [
        "Obras iniciadas!",
        "Deixa comigo, vai ficar impecável!",
        "Construindo imediatamente!",
        "Pegando as ferramentas!",
      ],
      en: [
        "Construction underway!",
        "Leave it to me, will be solid!",
        "Building immediately!",
        "Grabbing my tools!",
      ],
    },
    onNight: {
      pt: [
        "Reforçando os portões!",
        "Trabalhando sob a luz da lua!",
      ],
      en: [
        "Reinforcing the gates!",
        "Working under the moonlight!",
      ],
    },
  },
  woodcutter: {
    onClick: {
      pt: [
        "Machado afiado e pronto pro corte!",
        "A floresta nos dá o melhor carvalho.",
        "Mais lenha para aquecer o reino.",
      ],
      en: [
        "Axe sharp and ready to chop!",
        "The forest yields the finest oak.",
        "More timber for the realm.",
      ],
    },
    onCommand: {
      pt: [
        "Madeira abaixo!",
        "Indo colher madeira!",
        "Árvore no chão em breve!",
      ],
      en: [
        "Timber!",
        "Harvesting wood now!",
        "Tree coming down soon!",
      ],
    },
    onNight: {
      pt: [
        "Cuidado com os galhos escuros!",
        "Voltando com a lenha pro refúgio.",
      ],
      en: [
        "Watch out in the dark woods!",
        "Hauling timber back to safety.",
      ],
    },
  },
  stoneMiner: {
    onClick: {
      pt: [
        "Pedra sólida para as nossas defesas!",
        "O som da rocha quebrando é música!",
        "Picareta firme e braço forte.",
      ],
      en: [
        "Solid stone for our fortifications!",
        "The strike of pickaxe is sweet music!",
        "Steady pick and strong arms.",
      ],
    },
    onCommand: {
      pt: [
        "Quebrando a rocha!",
        "Extraindo granito puro!",
        "Rumo à pedreira!",
      ],
      en: [
        "Smashing the rock!",
        "Extracting prime granite!",
        "Heading to the quarry!",
      ],
    },
    onNight: {
      pt: [
        "A pedra resiste à noite!",
        "Guardando blocos para reparos!",
      ],
      en: [
        "Stone endures the night!",
        "Storing blocks for repairs!",
      ],
    },
  },
  goldMiner: {
    onClick: {
      pt: [
        "Sinto cheiro de filão dourado!",
        "Ouro nos cofres, reino próspero!",
        "Pepitas puras à vista!",
      ],
      en: [
        "I smell a rich gold vein!",
        "Gold in coffers, realm in glory!",
        "Pure nuggets in sight!",
      ],
    },
    onCommand: {
      pt: [
        "Minerando ouro com cuidado!",
        "Enchendo o bornal de pepitas!",
        "Ouro a caminho!",
      ],
      en: [
        "Mining precious gold carefully!",
        "Filling pouches with gold!",
        "Gold on the way!",
      ],
    },
    onNight: {
      pt: [
        "Protegendo o tesouro do reino!",
        "O ouro precisa ser guardado!",
      ],
      en: [
        "Protecting the kingdom's wealth!",
        "Treasures must be secured!",
      ],
    },
  },
  farmer: {
    onClick: {
      pt: [
        "Terra fértil, colheita farta!",
        "Pão quente mantém as tropas de pé.",
        "O trigo está dourando no campo.",
      ],
      en: [
        "Fertile soil, bountiful harvest!",
        "Warm bread keeps soldiers standing.",
        "Wheat is turning golden in the field.",
      ],
    },
    onCommand: {
      pt: [
        "Cuidando da plantação!",
        "Colhendo espigas frescas!",
        "Alimentando nossa gente!",
      ],
      en: [
        "Tending to the fields!",
        "Harvesting fresh wheat!",
        "Feeding our people!",
      ],
    },
    onNight: {
      pt: [
        "Cobrindo a colheita do orvalho!",
        "Espero que os monstros fiquem longe dos silos.",
      ],
      en: [
        "Protecting crops from the damp night!",
        "Keep the monsters away from our silos.",
      ],
    },
  },
  warrior: {
    onClick: {
      pt: [
        "Espada empunhada pela honra do reino!",
        "Nenhum inseto romperá nossa linha!",
        "Em guarda constante!",
      ],
      en: [
        "Sword drawn for the crown's honor!",
        "No insect shall break our line!",
        "Standing vigilant on guard!",
      ],
    },
    onCommand: {
      pt: [
        "Pelo Reino!",
        "Ao ataque!",
        "Posicionando na vanguarda!",
      ],
      en: [
        "For the Realm!",
        "Charge!",
        "Holding the front line!",
      ],
    },
    onNight: {
      pt: [
        "Eles estão chegando... Preparem-se!",
        "Firmem os escudos!",
      ],
      en: [
        "They are approaching... Stand ready!",
        "Lock your shields!",
      ],
    },
  },
  javelin: {
    onClick: {
      pt: [
        "Flechas e dardos calibrados!",
        "Visão de águia nas sombras.",
        "Nenhum alvo escapa do meu alcance.",
      ],
      en: [
        "Javelins balanced and ready!",
        "Eagle eye in the shadows.",
        "No target escapes my range.",
      ],
    },
    onCommand: {
      pt: [
        "Mirando no alvo!",
        "Disparo a caminho!",
        "Cobrirei a retaguarda!",
      ],
      en: [
        "Target locked!",
        "Javelin loose!",
        "Covering the flanks!",
      ],
    },
    onNight: {
      pt: [
        "Enxame à vista na escuridão!",
        "Mantenham distância dos espinhos!",
      ],
      en: [
        "Swarm spotted in the dark!",
        "Keep your distance from the stingers!",
      ],
    },
  },
  scout: {
    onClick: {
      pt: [
        "Caminhos rápidos e passos leves!",
        "O mapa do vale está gravado em minha mente.",
      ],
      en: [
        "Swift paths and light footsteps!",
        "The valley's map is etched in my mind.",
      ],
    },
    onCommand: {
      pt: [
        "Explorando novas terras!",
        "Passo ligeiro!",
      ],
      en: [
        "Scouting uncharted land!",
        "Moving swiftly!",
      ],
    },
    onNight: {
      pt: [
        "Fumaça e movimento no horizonte!",
      ],
      en: [
        "Motion on the horizon!",
      ],
    },
  },
  trainee: {
    onClick: {
      pt: [
        "Pronto para aprender um ofício!",
        "Ao seu serviço, meu senhor!",
      ],
      en: [
        "Ready to learn a trade!",
        "At your service, my lord!",
      ],
    },
    onCommand: {
      pt: [
        "Aprendendo o caminho!",
      ],
      en: [
        "On my way!",
      ],
    },
    onNight: {
      pt: [
        "Vou para o refúgio seguro!",
      ],
      en: [
        "Heading to safety!",
      ],
    },
  },
};

export function getRandomDialogue(
  role: RoleType,
  type: "onClick" | "onCommand" | "onNight",
  lang: Language = "pt"
): string {
  const roleLines = UNIT_VOICE_LINES[role] || UNIT_VOICE_LINES.builder;
  const list = roleLines[type]?.[lang] || roleLines.onClick[lang] || ["..."];
  return list[Math.floor(Math.random() * list.length)];
}
