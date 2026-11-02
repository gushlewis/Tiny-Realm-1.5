/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Language } from "../types/game";
import { X, Shield, Users, Hammer, Sparkles, AlertTriangle, BookOpen, Download } from "lucide-react";
import { downloadOfflineGame } from "../game/offlineBundle";

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#140a10] border-2 border-[#d9ad3f] rounded-2xl p-4 md:p-6 shadow-2xl text-[#cdc3ac]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-[#2a1419] hover:bg-[#3a1f22] border border-[#5c4a30] text-[#f4c97a] rounded-lg transition-all"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4 border-b border-[#5c4a30] pb-2">
          <BookOpen className="text-[#f4c97a]" size={24} />
          <h2 className="font-serif font-black text-lg md:text-xl text-[#f2c95a]">
            {lang === "pt" ? "Códex & Guia do Regente" : "Steward's Codex & Strategy Guide"}
          </h2>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 text-xs md:text-sm leading-relaxed">
          {/* Objective */}
          <div className="bg-[#1f1016] border border-[#5c4a30]/70 p-3 rounded-xl">
            <h3 className="font-bold text-[#ffd56b] mb-1 flex items-center gap-1.5">
              <Shield size={16} />
              {lang === "pt" ? "1. Objetivo Principal" : "1. Core Objective"}
            </h3>
            <p>
              {lang === "pt"
                ? "Sua missão é proteger a Câmara Municipal (Town Hall) a todo custo. O jogo alterna entre a Fase de Construção (90s de dia) e a Fase de Onda (30s de noite com ataques de insetos). A cada 10 ondas, surge um Chefe Soberano gigante."
                : "Your goal is to protect the Town Hall at all costs. The game alternates between Day Build Phase (90s) and Night Attack Waves (30s). Every 10th wave brings a devastating Sovereign Insect Boss."}
            </p>
          </div>

          {/* How to Play & Mobile Controls */}
          <div className="bg-[#1f1016] border border-[#5c4a30]/70 p-3 rounded-xl">
            <h3 className="font-bold text-[#8fe39a] mb-1 flex items-center gap-1.5">
              <Users size={16} />
              {lang === "pt" ? "2. Controles Fáceis e Dicas de Toque" : "2. Easy Controls & Touch Gestures"}
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-[#e7ddc4]">
              <li>
                <b>{lang === "pt" ? "Selecionar Unidade/Construção:" : "Select Unit / Building:"}</b>{" "}
                {lang === "pt" ? "Toque direto na unidade ou edifício no mapa." : "Tap directly on any unit or building on the map."}
              </li>
              <li>
                <b>{lang === "pt" ? "Trabalho Direto Contextual:" : "Contextual Orders:"}</b>{" "}
                {lang === "pt"
                  ? "Com um aldeão selecionado, toque numa árvore para cortar madeira, numa rocha para pedra, num minério para ouro, ou numa fazenda para produzir comida."
                  : "With a villager selected, tap trees for wood, rocks for stone, gold ore for gold, or farms for food."}
              </li>
              <li>
                <b>{lang === "pt" ? "Construir e Reparar:" : "Build & Repair:"}</b>{" "}
                {lang === "pt"
                  ? "Selecione um Construtor e toque numa estrutura em obras ou danificada para repará-la."
                  : "Select a Builder and tap on an unfinished or damaged building to build/repair it."}
              </li>
              <li>
                <b>{lang === "pt" ? "Botão Auto-Atribuir:" : "Auto-Assign Button:"}</b>{" "}
                {lang === "pt"
                  ? "Toque em 'Auto' para colocar imediatamente todos os aldeões ociosos para trabalhar nas tarefas mais necessárias!"
                  : "Tap 'Auto' to instantly assign all idle villagers to the most needed jobs!"}
              </li>
              <li>
                <b>{lang === "pt" ? "Abrigar na Câmara:" : "Shelter in Hall:"}</b>{" "}
                {lang === "pt"
                  ? "Durante ataques intensos, toque em 'Abrigar' para salvar seus aldeões civis dentro da Câmara."
                  : "During dangerous night attacks, tap 'Shelter' to protect civilian villagers inside the Town Hall."}
              </li>
              <li>
                <b>{lang === "pt" ? "Navegação da Câmera:" : "Camera Navigation:"}</b>{" "}
                {lang === "pt"
                  ? "Arraste com o dedo para mover a visão e faça pinça com dois dedos para dar zoom."
                  : "Drag to pan the camera and pinch with two fingers to zoom in/out."}
              </li>
            </ul>
          </div>

          {/* Buildings */}
          <div className="bg-[#1f1016] border border-[#5c4a30]/70 p-3 rounded-xl">
            <h3 className="font-bold text-[#73d9ff] mb-1 flex items-center gap-1.5">
              <Hammer size={16} />
              {lang === "pt" ? "3. Estruturas Essenciais" : "3. Essential Structures"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div className="bg-black/40 p-2 rounded-lg border border-[#5c4a30]/40">
                <span className="font-bold text-[#f4c97a]">🏰 {lang === "pt" ? "Câmara Municipal" : "Town Hall"}</span>
                <p className="text-[11px] text-[#cdc3ac] mt-0.5">
                  {lang === "pt" ? "Recruta novos aldeões e fortifica até Tier 3 para tiros mais fortes." : "Recruits new villagers and fortifies up to Tier 3."}
                </p>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-[#5c4a30]/40">
                <span className="font-bold text-[#f4c97a]">🌾 {lang === "pt" ? "Fazenda" : "Farm"}</span>
                <p className="text-[11px] text-[#cdc3ac] mt-0.5">
                  {lang === "pt" ? "Gera comida contínua para alimentar e recrutar mais trabalhadores." : "Produces steady food supply to sustain your population."}
                </p>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-[#5c4a30]/40">
                <span className="font-bold text-[#f4c97a]">⚔ {lang === "pt" ? "Quartel" : "Barracks"}</span>
                <p className="text-[11px] text-[#cdc3ac] mt-0.5">
                  {lang === "pt" ? "Treina Guerreiros corpo a corpo e Lanceiros com ataque à distância." : "Trains melee Warriors and ranged Javelin fighters."}
                </p>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-[#5c4a30]/40">
                <span className="font-bold text-[#f4c97a]">🗼 {lang === "pt" ? "Torre de Vigia" : "Watchtower"}</span>
                <p className="text-[11px] text-[#cdc3ac] mt-0.5">
                  {lang === "pt" ? "Dispara flechas automáticas contra invasores e expande a visão." : "Automatically fires arrows at approaching enemies."}
                </p>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-[#5c4a30]/40">
                <span className="font-bold text-[#f4c97a]">🔮 {lang === "pt" ? "Altar" : "Altar"}</span>
                <p className="text-[11px] text-[#cdc3ac] mt-0.5">
                  {lang === "pt" ? "Invoca e aprimora heróis lendários (Campeão, Arqueira e Mago)." : "Summons and levels up powerful heroes (Champion, Ranger, Mage)."}
                </p>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-[#5c4a30]/40">
                <span className="font-bold text-[#f4c97a]">🏠 {lang === "pt" ? "Casa" : "House"}</span>
                <p className="text-[11px] text-[#cdc3ac] mt-0.5">
                  {lang === "pt" ? "Aumenta o limite máximo de população em +2 por casa." : "Increases maximum population capacity by +2."}
                </p>
              </div>
            </div>
          </div>

          {/* Golem & Crystals */}
          <div className="bg-[#1f1016] border border-[#5c4a30]/70 p-3 rounded-xl">
            <h3 className="font-bold text-[#c084fc] mb-1 flex items-center gap-1.5">
              <Sparkles size={16} />
              {lang === "pt" ? "4. Cristais & Golem Ancestral" : "4. Crystals & Ancient Stone Golem"}
            </h3>
            <p className="mb-2">
              {lang === "pt"
                ? "Derrotar inimigos e ondas recompensa você com Cristais Celestiais (💎). Ao juntar 100 cristais, o painel do Golem brilha no canto inferior esquerdo. Clique em '⚡ DESPERTAR GOLEM!' para acordar o colosso de pedra por 45 segundos. Ele esmaga insetos com socos devastadores e possui o botão 'Terremoto (Q)' para causar dano massivo em área!"
                : "Defeating enemies awards Celestial Crystals (💎). Upon gathering 100 crystals, the Golem hub in the lower left will glow. Click '⚡ AWAKEN GOLEM!' to awaken the stone titan for 45 seconds. It crushes swarms with colossal punches and possesses the 'Earth Slam (Q)' ability for massive area damage!"}
            </p>
          </div>

          {/* Emergency Defense & Retaliation */}
          <div className="bg-[#241116] border border-[#8f2d3a]/70 p-3 rounded-xl">
            <h3 className="font-bold text-[#ff8f8f] mb-1 flex items-center gap-1.5">
              <Shield size={16} />
              {lang === "pt" ? "5. Defesa de Emergência dos Trabalhadores" : "5. Worker Emergency Defense & Retaliation"}
            </h3>
            <p>
              {lang === "pt"
                ? "Em momentos críticos, todos os seus aldeões (lenhadores, mineradores, construtores, fazendeiros) agora podem lutar! Se forem atacados por insetos, eles revidam com seus próprios machados, picaretas e martelos. Você também pode selecionar qualquer grupo de aldeões e clicar com o botão direito nos inimigos ou usar 'Combate de Emergência' no menu do esquadrão para fazê-los defender a vila!"
                : "In critical moments, all your villagers (woodcutters, miners, builders, farmers) can now fight! If attacked by swarms, they immediately strike back with their axes, pickaxes, and hammers. You can also select any squad and right-click enemies or press 'Emergency Attack' in the squad panel to order them to defend the realm!"}
            </p>
          </div>

          {/* Offline Play */}
          <div className="bg-[#101f16] border border-[#3e6848]/70 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#7ee39b] mb-0.5 flex items-center gap-1.5">
                <Download size={16} />
                {lang === "pt" ? "5. Jogo Offline (Arquivo Único .html)" : "5. Standalone Offline Play (.html)"}
              </h3>
              <p className="text-xs text-[#a9dfb8]">
                {lang === "pt"
                  ? "Baixe a versão completa do jogo em um único arquivo HTML para jogar em qualquer lugar sem precisar de internet."
                  : "Download the complete game in a single self-contained HTML file to play anywhere offline without internet."}
              </p>
            </div>
            <button
              onClick={() => downloadOfflineGame("tiny-realm.html")}
              className="px-3.5 py-1.5 shrink-0 bg-[#1b3d24] hover:bg-[#255732] border border-[#52c270] text-[#7ee39b] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer"
            >
              <Download size={14} />
              <span>{lang === "pt" ? "Baixar .html" : "Download .html"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
