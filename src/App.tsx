/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { GameEngine } from "./game/engine";
import { sound } from "./game/audio";
import { Language } from "./types/game";
import { CAMPAIGN_CHAPTERS, DialogueBeat } from "./game/campaign";
import { GameCanvas } from "./components/GameCanvas";
import { GameHUD } from "./components/GameHUD";
import { StartScreen } from "./components/StartScreen";
import { CodexModal } from "./components/CodexModal";
import { TutorialModal } from "./components/TutorialModal";
import { RestartModal } from "./components/RestartModal";
import { GameOverModal } from "./components/GameOverModal";
import { CampaignMapModal } from "./components/CampaignMapModal";
import { CampaignHUDWidget } from "./components/CampaignHUDWidget";
import { CampaignVictoryModal } from "./components/CampaignVictoryModal";
import { StoryDialogueModal } from "./components/StoryDialogueModal";
import { funtico, FunticoServiceState } from "./funtico";
import { lifecycle } from "./funtico/lifecycle";
import { FunticoAuthOverlay } from "./components/FunticoAuthOverlay";

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem("tinyrealm_lang") as Language) || "pt";
    } catch {
      return "pt";
    }
  });

  const [funticoState, setFunticoState] = useState<FunticoServiceState>("uninitialized");
  const [funticoError, setFunticoError] = useState<string | null>(null);

  const initFuntico = useCallback(async () => {
    setFunticoState("authenticating");
    const ok = await funtico.init();
    setFunticoState(funtico.getState());
    setFunticoError(funtico.getErrorMessage());
  }, []);

  useEffect(() => {
    initFuntico();
  }, [initFuntico]);

  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);
  const [isCampaignMapOpen, setIsCampaignMapOpen] = useState(false);

  // Story & Campaign dialogue and victory states
  const [storyDialogue, setStoryDialogue] = useState<{
    beats: DialogueBeat[];
    titleBadge: string;
  } | null>(null);

  const [campaignVictoryData, setCampaignVictoryData] = useState<{
    chapterId: number;
    stars: number;
  } | null>(null);

  // Maintain stable GameEngine instance
  const engine = useMemo(() => {
    const inst = new GameEngine();
    inst.lang = lang;
    return inst;
  }, []);

  const [screen, setScreen] = useState(engine.screen);

  useEffect(() => {
    engine.onScreenChange = (newScreen: any) => {
      setScreen(newScreen);
    };

    engine.onCampaignVictory = (chapterId: number, stars: number) => {
      setCampaignVictoryData({ chapterId, stars });
    };
  }, [engine]);

  // Sync language setting
  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    engine.lang = newLang;
    try {
      localStorage.setItem("tinyrealm_lang", newLang);
    } catch {}
  };

  useEffect(() => {
    engine.lang = lang;
  }, [lang, engine]);

  // Unlock relaxing medieval audio on first user gesture
  useEffect(() => {
    const handleFirstGesture = () => {
      sound.init();
    };
    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    try {
      localStorage.setItem("tinyrealm_seen_tutorial", "true");
    } catch {}
  };

  // Launch Endless / Skirmish Survival
  const handleStartEndless = useCallback(() => {
    sound.init();
    lifecycle.startPracticeRun(Date.now(), () => {
      engine.newGame(true);
    });
    setScreen("play");
  }, [engine]);

  // Launch specific Campaign Mission
  const handleStartCampaignMission = useCallback(
    (chapterId: number) => {
      sound.init();
      engine.startCampaignMission(chapterId);
      setIsCampaignMapOpen(false);
      setCampaignVictoryData(null);
      setScreen("play");

      // Show Chapter story prologue
      const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === chapterId);
      if (chapter && chapter.prologue && chapter.prologue.length > 0) {
        setStoryDialogue({
          beats: chapter.prologue,
          titleBadge: chapter.title[lang],
        });
      }
    },
    [engine, lang]
  );

  // Re-open Chapter Briefing Story
  const handleOpenStoryBriefing = useCallback(() => {
    const chapter = CAMPAIGN_CHAPTERS.find((c) => c.id === engine.activeChapter);
    if (chapter && chapter.prologue && chapter.prologue.length > 0) {
      setStoryDialogue({
        beats: chapter.prologue,
        titleBadge: chapter.title[lang],
      });
    }
  }, [engine, lang]);

  // Advance to next chapter
  const handleNextChapter = useCallback(() => {
    if (campaignVictoryData) {
      const nextId = Math.min(5, campaignVictoryData.chapterId + 1);
      setCampaignVictoryData(null);
      handleStartCampaignMission(nextId);
    }
  }, [campaignVictoryData, handleStartCampaignMission]);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        document.activeElement &&
        ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);
      if (isInput) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (engine.screen === "play" && !storyDialogue && !campaignVictoryData) {
          engine.paused = !engine.paused;
          sound.playSfx("click");
        }
      } else if (e.code === "KeyR") {
        if (engine.screen === "play") {
          setIsRestartOpen(true);
        }
      } else if (e.code === "Escape") {
        engine.buildMode = null;
        engine.selected = null;
        setIsCodexOpen(false);
        setIsTutorialOpen(false);
        setIsRestartOpen(false);
        setIsCampaignMapOpen(false);
        setStoryDialogue(null);
      } else if (e.code === "KeyQ") {
        if (engine.screen === "play" && !engine.paused) {
          const hasHero = engine.heroUnit || Object.values(engine.altarHeroes).some((h) => h && (h as any).hp > 0);
          if (hasHero) {
            engine.useHeroHolyStrike();
          } else {
            engine.autoAssignIdle();
          }
        }
      } else if (e.code === "KeyW") {
        if (engine.screen === "play" && !engine.paused) {
          engine.useHeroWarCry();
        }
      } else if (e.code === "KeyE") {
        if (engine.screen === "play" && !engine.paused) {
          engine.useHeroHolyLight();
        }
      } else if (e.code === "Period" || e.code === "Comma" || e.code === "KeyZ") {
        if (engine.screen === "play" && !engine.paused) {
          engine.selectNextIdleWorker();
        }
      } else if (e.code === "KeyF") {
        if (engine.screen === "play" && !engine.paused) {
          engine.useHeroSpecialAttack();
        }
      } else if (e.code === "KeyH") {
        if (engine.screen === "play" && !engine.paused) {
          engine.hideAllVillagers();
        }
      } else if (e.code === "KeyJ") {
        if (engine.screen === "play" && !engine.paused) {
          engine.returnVillagersToWork();
        }
      } else if (e.code === "KeyV") {
        if (engine.screen === "play") {
          engine.cycleGameSpeed();
        }
      } else if (e.code === "KeyN") {
        if (engine.screen === "play" && !engine.paused) {
          engine.callWaveEarly();
        }
      } else if (e.code === "KeyG") {
        if (engine.screen === "play" && !engine.paused) {
          engine.rallyArmy();
        }
      } else if (["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].includes(e.code)) {
        if (engine.screen === "play" && !engine.paused) {
          const roleMap: Record<string, any> = {
            Digit1: "builder",
            Digit2: "woodcutter",
            Digit3: "stoneMiner",
            Digit4: "goldMiner",
            Digit5: "farmer",
          };
          if (engine.selected?.kind === "building") {
            const b = engine.buildings.find((item) => item.id === engine.selected!.id);
            if (b && b.type === "townhall") {
              engine.recruitRole(roleMap[e.code]);
            }
          } else if (engine.selected?.kind === "unit") {
            const u = engine.units.find(
              (item) => item.id === engine.selected!.id && item.state !== "death"
            );
            if (u) {
              engine.assignRole(u, roleMap[e.code], true);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [engine, storyDialogue, campaignVictoryData]);

  return (
    <div className="relative w-screen h-screen h-[100dvh] bg-black text-[#cdc3ac] select-none overflow-hidden touch-none font-sans">
      {/* 1. Core Interactive Game Canvas */}
      <GameCanvas engine={engine} onSelectEntity={() => {}} lang={lang} />

      {/* 2. Responsive In-Game HUD (Shown during Play & Defeat) */}
      {screen !== "menu" && (
        <GameHUD
          engine={engine}
          lang={lang}
          onSetLang={handleSetLang}
          onOpenCodex={() => setIsCodexOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenRestartModal={() => setIsRestartOpen(true)}
        />
      )}

      {/* 3. Campaign In-Game Quest / Objective Tracker HUD */}
      {screen === "play" && engine.gameMode === "campaign" && (
        <CampaignHUDWidget
          engine={engine}
          lang={lang}
          onOpenStoryBriefing={handleOpenStoryBriefing}
        />
      )}

      {/* 4. Atmospheric Start Screen (Dual Game Modes: Campaign & Endless) */}
      {screen === "menu" && (
        <StartScreen
          engine={engine}
          lang={lang}
          onStartEndless={handleStartEndless}
          onOpenCampaign={() => setIsCampaignMapOpen(true)}
          onOpenCodex={() => setIsTutorialOpen(true)}
          onSetLang={handleSetLang}
        />
      )}

      {/* 5. Campaign Map & Chapter Selection Modal */}
      <CampaignMapModal
        isOpen={isCampaignMapOpen}
        lang={lang}
        onClose={() => setIsCampaignMapOpen(false)}
        onSelectChapter={handleStartCampaignMission}
      />

      {/* 6. Narrative Story / Lore Dialogue Cutscene Modal */}
      {storyDialogue && (
        <StoryDialogueModal
          beats={storyDialogue.beats}
          titleBadge={storyDialogue.titleBadge}
          lang={lang}
          onFinish={() => setStoryDialogue(null)}
        />
      )}

      {/* 7. Campaign Chapter Victory Fanfare Modal */}
      {campaignVictoryData && (
        <CampaignVictoryModal
          engine={engine}
          chapterId={campaignVictoryData.chapterId}
          stars={campaignVictoryData.stars}
          lang={lang}
          onNextChapter={handleNextChapter}
          onOpenMap={() => {
            setCampaignVictoryData(null);
            setIsCampaignMapOpen(true);
          }}
          onReplay={() => {
            setCampaignVictoryData(null);
            handleStartCampaignMission(campaignVictoryData.chapterId);
          }}
        />
      )}

      {/* 8. Gameplay Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        lang={lang}
      />

      {/* 9. Strategy Codex Modal */}
      <CodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        lang={lang}
      />

      {/* 10. Restart Confirmation Modal */}
      <RestartModal
        isOpen={isRestartOpen}
        onCancel={() => setIsRestartOpen(false)}
        onConfirm={() => {
          setIsRestartOpen(false);
          if (engine.gameMode === "campaign") {
            handleStartCampaignMission(engine.activeChapter);
          } else {
            engine.newGame(true);
          }
        }}
        lang={lang}
      />

      {/* 11. Game Over / Defeat Summary Modal */}
      <GameOverModal
        engine={engine}
        lang={lang}
        onRestart={() => {
          if (engine.gameMode === "campaign") {
            handleStartCampaignMission(engine.activeChapter);
          } else {
            engine.newGame(true);
          }
        }}
        onOpenMap={() => {
          engine.setScreen("menu");
          setIsCampaignMapOpen(true);
        }}
      />

      {/* 12. Funtico Platform Auth & Network Overlay */}
      <FunticoAuthOverlay
        state={funticoState}
        errorMessage={funticoError}
        isMock={funtico.isMock()}
        onRetry={initFuntico}
        onContinueOffline={() => setFunticoState("ready")}
      />
    </div>
  );
}
