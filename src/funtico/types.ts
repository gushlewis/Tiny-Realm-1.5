/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export canonical SDK enums & interfaces
export {
  FunticoEnvironment,
  EntryFeeType,
  RoomTier,
  LeadersState,
  TournamentsFilterEnum,
  GameTypeEnum,
  UserGameStatus,
  HallOfFamePeriodMode,
  HallOfFameGameModeFilter,
  type UserData,
  type BalanceResponse,
  type VoucherData,
  type TierViewModel,
  type RoomViewModel,
  type PrizePoolDistributionViewModel,
  type RoomSessionData,
  type RoomLeaderboardViewModel,
  type LeaderboardItemViewModel,
  type TournamentViewModel,
  type TournamentEnterData,
  type TournamentLeaderboardViewModel,
  type HallOfFameResponse,
  type SavedSessionResponse,
} from "./sdk/FunticoSDK";

export type FunticoServiceState = "uninitialized" | "authenticating" | "ready" | "error";

export interface FunticoPlatformInfo {
  isMock: boolean;
  env: string;
  userToken?: string;
  publicGameKey?: string;
}

export interface FunticoActionLog {
  timestamp: number;
  event: string;
  gameTime: number;
  data?: Record<string, any>;
}

export interface FunticoError {
  code: "AUTH_FAILED" | "INSUFFICIENT_FUNDS" | "NETWORK_ERROR" | "SESSION_EXPIRED" | "ROOM_NOT_FOUND" | "SUBMIT_FAILED";
  message: string;
  details?: any;
}

export interface RoomTierConfig {
  tier: number;
  name: string;
  color: string;
  entryFee: number;
  feeType: number;
  description: string;
}

// Official Funtico Tier color standards from the Funtico Game Assets Checklist
export const FUNTICO_TIER_COLORS: Record<string, string> = {
  EXPLORER: "#38FF00",   // Free / no $TICO charged
  CONTENDER: "#00C8FF",  // Tier 0
  CHALLENGER: "#8840E6", // Tier 1
  CHAMPION: "#FFB800",   // Tier 2
};
