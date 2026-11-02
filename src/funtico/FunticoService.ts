/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFunticoService } from "./IFunticoService";
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
  FunticoEnvironment,
} from "./types";
import { FunticoSDK } from "./sdk/FunticoSDK";

/**
 * Production implementation of IFunticoService wrapping canonical Funtico SDK.
 */
export class FunticoService implements IFunticoService {
  private sdk: FunticoSDK;
  private state: FunticoServiceState = "uninitialized";
  private errorMessage: string | null = null;
  private actionLogs: FunticoActionLog[] = [];
  private platformInfo: FunticoPlatformInfo = {
    isMock: false,
    env: "staging",
  };

  constructor() {
    this.sdk = FunticoSDK.Instance;
  }

  public async init(): Promise<boolean> {
    this.state = "authenticating";
    this.errorMessage = null;

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token") || params.get("userToken") || "";
      const envParam = params.get("env")?.toLowerCase();
      const env = envParam === "prod" ? FunticoEnvironment.PROD : FunticoEnvironment.STAGING;

      // TODO(funtico): confirm secure private key flow (see Phase 6). Never ship plain private key in production builds.
      const publicKey = (import.meta as any).env?.VITE_FUNTICO_PUBLIC_KEY || "tiny-realm-public-key";
      const privateKey = (import.meta as any).env?.VITE_FUNTICO_PRIVATE_KEY || "tiny-realm-private-key-secret";

      this.platformInfo = {
        isMock: false,
        env,
        userToken: token || undefined,
        publicGameKey: publicKey,
      };

      await this.sdk.Initialize({
        env,
        publicGameKey: publicKey,
        privateGameKey: privateKey,
        userToken: token || undefined,
      });

      this.state = "ready";
      return true;
    } catch (err: any) {
      this.state = "error";
      this.errorMessage = err?.message || "Failed to initialize Funtico SDK connection";
      return false;
    }
  }

  public getState(): FunticoServiceState {
    return this.state;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getPlatformInfo(): FunticoPlatformInfo {
    return this.platformInfo;
  }

  public async getUserData(): Promise<UserData | null> {
    try {
      return await this.sdk.GetUserData(true);
    } catch {
      return this.sdk.GetCachedUserData();
    }
  }

  public getCachedUserData(): UserData | null {
    return this.sdk.GetCachedUserData();
  }

  public async refreshBalance(): Promise<BalanceResponse | null> {
    try {
      return await this.sdk.GetBalance(true);
    } catch {
      return null;
    }
  }

  public canAfford(amount: number, feeType: EntryFeeType = EntryFeeType.Tico): boolean {
    return this.sdk.CanAffordFromCache(feeType, amount);
  }

  public async getTiers(): Promise<TierViewModel[]> {
    return await this.sdk.GetTiers();
  }

  public async getRooms(tier?: RoomTier): Promise<RoomViewModel[]> {
    return await this.sdk.GetRooms(tier !== undefined ? tier : 0);
  }

  public async getPrizePoolDistribution(roomGuid: string): Promise<PrizePoolDistributionViewModel | null> {
    return await this.sdk.GetPrizePoolDistribution(roomGuid);
  }

  public async joinRoom(roomGuid: string): Promise<RoomSessionData> {
    this.recordEvent("room_join_requested", { roomGuid });
    const session = await this.sdk.JoinRoom(roomGuid);
    this.recordEvent("room_joined", { roomGuid, session: session.SessionOrMatchId });
    return session;
  }

  public async endRoomSP(
    session: RoomSessionData,
    score: number,
    actionLogs?: FunticoActionLog[]
  ): Promise<boolean> {
    try {
      const logs = (actionLogs || this.actionLogs).map((l) => JSON.stringify(l));
      const user = this.sdk.GetCachedUserData();
      const userId = user?.UserId ?? 0;

      await this.sdk.EndRoomSP(
        session.EventId,
        session.SessionOrMatchId,
        Math.round(score),
        userId,
        "127.0.0.1",
        logs
      );
      this.recordEvent("room_ended_success", { score });
      return true;
    } catch (err: any) {
      this.recordEvent("room_ended_error", { error: err?.message, score });
      throw err;
    }
  }

  public async getRoomLeaderboard(roomGuid: string, sessionId?: string): Promise<RoomLeaderboardViewModel | null> {
    return await this.sdk.GetLeaderboard(roomGuid, sessionId || "");
  }

  public async getTournaments(filter?: TournamentsFilterEnum): Promise<TournamentViewModel[]> {
    const filterNum = filter === TournamentsFilterEnum.Finished ? 2 : filter === TournamentsFilterEnum.Upcoming ? 1 : 0;
    return await this.sdk.GetTournaments(filterNum);
  }

  public async joinTournament(tournamentGuid: string): Promise<boolean> {
    return await this.sdk.JoinTournament(tournamentGuid);
  }

  public async enterTournament(tournamentGuid: string): Promise<TournamentEnterData> {
    return await this.sdk.EnterTournament(tournamentGuid);
  }

  public async submitTournamentScore(
    scoreUuid: string,
    score: number,
    actionLogs?: FunticoActionLog[]
  ): Promise<boolean> {
    const logs = (actionLogs || this.actionLogs).map((l) => JSON.stringify(l));
    return await this.sdk.ResultTournament_Client(
      "",
      scoreUuid,
      Math.round(score),
      true,
      JSON.stringify(logs)
    );
  }

  public async getTournamentLeaderboard(tournamentGuid: string): Promise<TournamentLeaderboardViewModel | null> {
    return await this.sdk.GetTournamentLeaderboard(tournamentGuid);
  }

  public async getHallOfFame(
    period: HallOfFamePeriodMode = HallOfFamePeriodMode.Global,
    mode: HallOfFameGameModeFilter = HallOfFameGameModeFilter.All
  ): Promise<HallOfFameResponse | null> {
    return await this.sdk.GetHallOfFame(period, 1, 10, mode);
  }

  public async checkUnfinishedSession(): Promise<SavedSessionResponse | null> {
    const res = await this.sdk.UserHasUnfinishedSession_Client();
    return res.SavedSessions && res.SavedSessions.length > 0 ? res.SavedSessions[0] : null;
  }

  public async reconnectSession(sessionId: string): Promise<boolean> {
    const data = await this.sdk.ReconnectToUnfinishedSession_Client(sessionId);
    return typeof data === "string" && data.length > 0;
  }

  public async saveSessionSnapshot(sessionId: string, snapshot: any): Promise<boolean> {
    try {
      await this.sdk.UpdateSession_Client(JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  }

  public recordEvent(event: string, payload?: Record<string, any>, gameTime = 0): void {
    const log: FunticoActionLog = {
      timestamp: Date.now(),
      event,
      gameTime,
      data: payload,
    };
    this.actionLogs.push(log);
    if (this.actionLogs.length > 500) {
      this.actionLogs.splice(0, this.actionLogs.length - 500);
    }
    // Also feed SDK anti-cheat client event recording
    try {
      this.sdk.RecordEvent_Client(`${event}:${JSON.stringify(payload || {})}`);
    } catch {}
  }

  public getPendingActionLogs(): FunticoActionLog[] {
    return [...this.actionLogs];
  }

  public clearActionLogs(): void {
    this.actionLogs = [];
  }

  public isMock(): boolean {
    return false;
  }
}
