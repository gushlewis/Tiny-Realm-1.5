/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FunticoServiceState,
  FunticoPlatformInfo,
  FunticoActionLog,
  UserData,
  BalanceResponse,
  TierViewModel,
  RoomViewModel,
  PrizePoolDistributionViewModel,
  RoomSessionData,
  RoomLeaderboardViewModel,
  TournamentViewModel,
  TournamentEnterData,
  TournamentLeaderboardViewModel,
  HallOfFameResponse,
  SavedSessionResponse,
  EntryFeeType,
  RoomTier,
  TournamentsFilterEnum,
  HallOfFamePeriodMode,
  HallOfFameGameModeFilter,
} from "./types";

export interface IFunticoService {
  /** Initialize the SDK with environment, game keys and user token */
  init(): Promise<boolean>;

  /** Get current service status */
  getState(): FunticoServiceState;

  /** Get error message if in error state */
  getErrorMessage(): string | null;

  /** Platform and runtime info */
  getPlatformInfo(): FunticoPlatformInfo;

  /** User profile and balances */
  getUserData(): Promise<UserData | null>;
  getCachedUserData(): UserData | null;
  refreshBalance(): Promise<BalanceResponse | null>;
  canAfford(amount: number, feeType?: EntryFeeType): boolean;

  /** Rooms & match lifecycle */
  getTiers(): Promise<TierViewModel[]>;
  getRooms(tier?: RoomTier): Promise<RoomViewModel[]>;
  getPrizePoolDistribution(roomGuid: string): Promise<PrizePoolDistributionViewModel | null>;
  joinRoom(roomGuid: string): Promise<RoomSessionData>;
  endRoomSP(session: RoomSessionData, score: number, actionLogs?: FunticoActionLog[]): Promise<boolean>;
  getRoomLeaderboard(roomGuid: string): Promise<RoomLeaderboardViewModel | null>;

  /** Special Tournaments */
  getTournaments(filter?: TournamentsFilterEnum): Promise<TournamentViewModel[]>;
  joinTournament(tournamentGuid: string): Promise<boolean>;
  enterTournament(tournamentGuid: string): Promise<TournamentEnterData>;
  submitTournamentScore(scoreUuid: string, score: number, actionLogs?: FunticoActionLog[]): Promise<boolean>;
  getTournamentLeaderboard(tournamentGuid: string): Promise<TournamentLeaderboardViewModel | null>;

  /** Hall of Fame */
  getHallOfFame(period?: HallOfFamePeriodMode, mode?: HallOfFameGameModeFilter): Promise<HallOfFameResponse | null>;

  /** Session reconnection and anti-cheat event recording */
  checkUnfinishedSession(): Promise<SavedSessionResponse | null>;
  reconnectSession(sessionId: string): Promise<boolean>;
  saveSessionSnapshot(sessionId: string, snapshot: any): Promise<boolean>;
  recordEvent(event: string, payload?: Record<string, any>, gameTime?: number): void;
  getPendingActionLogs(): FunticoActionLog[];
  clearActionLogs(): void;

  /** Helper check */
  isMock(): boolean;
}
