/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Deterministic Run Statistics for Score Calculation.
 */
export interface RunScoreStats {
  wavesSurvived: number;
  daysSurvived: number;
  kills: number;
  eliteKills: number;
  bossKills: number;
  resourcesCollected: number;
  crystalSpent: number;
  hallDamageTaken: number;
  timeElapsedSeconds: number;
  isVictory?: boolean;
}

/**
 * Detailed Score Breakdown for Results Screen and Analytics.
 */
export interface ScoreBreakdown {
  finalScore: number;
  waveScore: number;
  killScore: number;
  eliteScore: number;
  bossScore: number;
  resourceScore: number;
  timeBonus: number;
  victoryBonus: number;
  damagePenalty: number;
}

/**
 * Tunable Score Constants.
 * All constants are calibrated to produce single comparable integer scores
 * across practice, competitive tiers (Contender/Challenger/Champion), and tournaments.
 */
export const SCORE_TUNING = {
  // Core survival milestone points
  POINTS_PER_WAVE_SURVIVED: 1000,
  POINTS_PER_DAY_CYCLE: 500,

  // Swarm defense points
  POINTS_PER_ENEMY_KILL: 15,
  POINTS_PER_ELITE_KILL: 80,
  POINTS_PER_BOSS_KILL: 600,

  // Macro-economic efficiency points
  POINTS_PER_RESOURCE_GATHERED: 1,
  POINTS_PER_CRYSTAL_SPENT: 2,

  // Speed and time bonus (active play efficiency)
  TIME_BONUS_POINTS_PER_SECOND: 2,

  // Penalties (encourages active base repair and fortification defense)
  PENALTY_PER_HALL_DAMAGE: 3,

  // Outright victory / campaign clear bonus
  VICTORY_BONUS: 5000,
} as const;

/**
 * Computes a single, deterministic, integer score based on run performance.
 * Guaranteed to return an integer >= 0 with zero NaN or floating-point variance.
 */
export function computeRunScore(stats: RunScoreStats): ScoreBreakdown {
  const waveScore = Math.max(0, stats.wavesSurvived) * SCORE_TUNING.POINTS_PER_WAVE_SURVIVED;
  const dayScore = Math.max(0, stats.daysSurvived) * SCORE_TUNING.POINTS_PER_DAY_CYCLE;
  const killScore = Math.max(0, stats.kills) * SCORE_TUNING.POINTS_PER_ENEMY_KILL;
  const eliteScore = Math.max(0, stats.eliteKills) * SCORE_TUNING.POINTS_PER_ELITE_KILL;
  const bossScore = Math.max(0, stats.bossKills) * SCORE_TUNING.POINTS_PER_BOSS_KILL;
  const resourceScore =
    Math.max(0, stats.resourcesCollected) * SCORE_TUNING.POINTS_PER_RESOURCE_GATHERED +
    Math.max(0, stats.crystalSpent) * SCORE_TUNING.POINTS_PER_CRYSTAL_SPENT;

  // Time bonus is granted for efficient survival duration
  const timeBonus = Math.floor(Math.max(0, stats.timeElapsedSeconds) * SCORE_TUNING.TIME_BONUS_POINTS_PER_SECOND);

  // Victory bonus if the run concluded in victory
  const victoryBonus = stats.isVictory ? SCORE_TUNING.VICTORY_BONUS : 0;

  // Base damage penalty
  const damagePenalty = Math.floor(Math.max(0, stats.hallDamageTaken) * SCORE_TUNING.PENALTY_PER_HALL_DAMAGE);

  // Raw score sum
  const grossScore = waveScore + dayScore + killScore + eliteScore + bossScore + resourceScore + timeBonus + victoryBonus;
  const finalScore = Math.max(0, Math.round(grossScore - damagePenalty));

  return {
    finalScore,
    waveScore: waveScore + dayScore,
    killScore,
    eliteScore,
    bossScore,
    resourceScore,
    timeBonus,
    victoryBonus,
    damagePenalty,
  };
}
