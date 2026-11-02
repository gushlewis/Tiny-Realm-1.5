/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { funtico } from "./index";
import { RoomSessionData } from "./types";
import { computeRunScore, RunScoreStats, ScoreBreakdown } from "../game/score";

export type RunLifecycleState =
  | "idle"
  | "loading"
  | "joining"
  | "playing"
  | "ended"
  | "submitting"
  | "results";

export type RunMode = "practice" | "room" | "tournament";

export interface ActiveRunContext {
  mode: RunMode;
  roomGuid?: string;
  roomSession?: RoomSessionData;
  tournamentGuid?: string;
  tournamentScoreUuid?: string;
  startTime: number;
  endTime?: number;
  seed: number;
  stats?: RunScoreStats;
  breakdown?: ScoreBreakdown;
  submissionError?: string;
  submitted: boolean;
  reason?: "defeat" | "victory" | "abandon";
}

export type LifecycleListener = (state: RunLifecycleState, context: ActiveRunContext | null) => void;

/**
 * Manages the Funtico match lifecycle:
 * idle -> loading -> joining -> playing -> ended -> submitting -> results
 */
export class RunLifecycleManager {
  private static _instance: RunLifecycleManager | null = null;

  private state: RunLifecycleState = "idle";
  private context: ActiveRunContext | null = null;
  private listeners: Set<LifecycleListener> = new Set();

  private constructor() {
    // Setup window unload hook to handle abandon gracefully
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        if (this.state === "playing" && this.context && !this.context.submitted) {
          // Send abandon event if run is active
          funtico.recordEvent("run_abandoned", {
            mode: this.context.mode,
            time: Date.now() - this.context.startTime,
          });
        }
      });
    }
  }

  public static get instance(): RunLifecycleManager {
    if (!this._instance) {
      this._instance = new RunLifecycleManager();
    }
    return this._instance;
  }

  public getState(): RunLifecycleState {
    return this.state;
  }

  public getContext(): ActiveRunContext | null {
    return this.context;
  }

  public subscribe(listener: LifecycleListener): () => void {
    this.listeners.add(listener);
    listener(this.state, this.context);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: RunLifecycleState) {
    this.state = newState;
    this.notify();
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state, this.context);
      } catch (err) {
        console.error("Lifecycle listener error:", err);
      }
    }
  }

  /**
   * Starts a casual practice run (Free / Offline / Non-Funtico paid).
   */
  public async startPracticeRun(seed = Date.now(), preLoadFn: () => void): Promise<void> {
    this.setState("loading");
    preLoadFn();

    this.context = {
      mode: "practice",
      startTime: Date.now(),
      seed,
      submitted: false,
    };

    funtico.clearActionLogs();
    funtico.recordEvent("start_game", { mode: "practice", seed });

    this.setState("playing");
  }

  /**
   * Starts a competitive Paid Room run.
   * CRITICAL: Pre-loads the level and assets BEFORE calling JoinRoom,
   * because server-side timers start the instant JoinRoom resolves.
   */
  public async startRoomRun(roomGuid: string, seed: number, preLoadFn: () => void): Promise<void> {
    this.setState("loading");
    // 1. Fully prepare level geometry, entities, and RNG before touching platform timers
    preLoadFn();

    this.setState("joining");
    try {
      // 2. Charge entry fee and initiate server match timers
      const session = await funtico.joinRoom(roomGuid);

      this.context = {
        mode: "room",
        roomGuid,
        roomSession: session,
        startTime: Date.now(),
        seed,
        submitted: false,
      };

      funtico.clearActionLogs();
      funtico.recordEvent("start_game", {
        mode: "room",
        roomGuid,
        sessionId: session.SessionOrMatchId,
        seed,
      });

      this.setState("playing");
    } catch (err: any) {
      this.context = null;
      this.setState("idle");
      throw err;
    }
  }

  /**
   * Starts an official Tournament run.
   */
  public async startTournamentRun(tournamentGuid: string, seed: number, preLoadFn: () => void): Promise<void> {
    this.setState("loading");
    preLoadFn();

    this.setState("joining");
    try {
      const enterData = await funtico.enterTournament(tournamentGuid);

      this.context = {
        mode: "tournament",
        tournamentGuid,
        tournamentScoreUuid: enterData.TournamentScoreUuid,
        startTime: Date.now(),
        seed,
        submitted: false,
      };

      funtico.clearActionLogs();
      funtico.recordEvent("start_game", {
        mode: "tournament",
        tournamentGuid,
        scoreUuid: enterData.TournamentScoreUuid,
        seed,
      });

      this.setState("playing");
    } catch (err: any) {
      this.context = null;
      this.setState("idle");
      throw err;
    }
  }

  /**
   * Concludes the run and submits the final score to Funtico.
   */
  public async finishRun(stats: RunScoreStats, reason: "defeat" | "victory" | "abandon"): Promise<ScoreBreakdown> {
    if (!this.context) {
      const breakdown = computeRunScore(stats);
      return breakdown;
    }

    if (this.context.submitted || this.state === "submitting" || this.state === "results") {
      return this.context.breakdown || computeRunScore(stats);
    }

    this.setState("ended");
    this.context.endTime = Date.now();
    this.context.stats = stats;
    this.context.reason = reason;

    const breakdown = computeRunScore(stats);
    this.context.breakdown = breakdown;

    funtico.recordEvent("run_concluded", {
      reason,
      finalScore: breakdown.finalScore,
      wavesSurvived: stats.wavesSurvived,
      kills: stats.kills,
      timeElapsedSeconds: stats.timeElapsedSeconds,
    });

    this.setState("submitting");

    try {
      if (this.context.mode === "room" && this.context.roomSession) {
        await funtico.endRoomSP(
          this.context.roomSession,
          breakdown.finalScore,
          funtico.getPendingActionLogs()
        );
      } else if (this.context.mode === "tournament" && this.context.tournamentScoreUuid) {
        await funtico.submitTournamentScore(
          this.context.tournamentScoreUuid,
          breakdown.finalScore,
          funtico.getPendingActionLogs()
        );
      }

      this.context.submitted = true;
      this.setState("results");
    } catch (err: any) {
      console.error("Score submission error:", err);
      this.context.submissionError = err?.message || "Failed to submit final score to platform";
      // Still show results screen with error banner so player sees their score
      this.setState("results");
    }

    return breakdown;
  }

  /**
   * Resets lifecycle to idle state (e.g. from results screen returning to main menu).
   */
  public resetToIdle(): void {
    this.context = null;
    this.setState("idle");
  }
}

export const lifecycle = RunLifecycleManager.instance;
