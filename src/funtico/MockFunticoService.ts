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
  LeadersState,
} from "./types";

/**
 * High-fidelity Mock Funtico Service for standalone local testing and development.
 * Emulates the real server responses, balances, entry fees, and room match lifecycles.
 */
export class MockFunticoService implements IFunticoService {
  private state: FunticoServiceState = "uninitialized";
  private errorMessage: string | null = null;
  private actionLogs: FunticoActionLog[] = [];

  private mockUser: UserData = {
    Name: "PixelCommander",
    UserId: 1042,
    PlatformId: 1042,
    Level: 12,
    Rating: 1450,
    Experience: 2400,
    ExperienceToLevel: 3000,
    Coins: 5000,
    Diamonds: 150, // 150 $TICO
    SemiFinalTickets: 2,
    FinalTickets: 1,
    PrivateTickets: 3,
    KYCVerified: true,
    SoundsValue: 100,
    MusicValue: 100,
  };

  private mockSavedSession: SavedSessionResponse | null = null;

  public async init(): Promise<boolean> {
    this.state = "authenticating";
    await new Promise((res) => setTimeout(res, 250));
    this.state = "ready";
    return true;
  }

  public getState(): FunticoServiceState {
    return this.state;
  }

  public getErrorMessage(): string | null {
    return this.errorMessage;
  }

  public getPlatformInfo(): FunticoPlatformInfo {
    return {
      isMock: true,
      env: "mock-local",
    };
  }

  public async getUserData(): Promise<UserData | null> {
    return { ...this.mockUser };
  }

  public getCachedUserData(): UserData | null {
    return { ...this.mockUser };
  }

  public async refreshBalance(): Promise<BalanceResponse | null> {
    return {
      Coins: this.mockUser.Coins,
      Diamonds: this.mockUser.Diamonds,
      SemiFinalTickets: this.mockUser.SemiFinalTickets,
      FinalTickets: this.mockUser.FinalTickets,
      PrivateTickets: this.mockUser.PrivateTickets,
      KYCVerified: this.mockUser.KYCVerified,
    };
  }

  public canAfford(amount: number, feeType: EntryFeeType = EntryFeeType.Tico): boolean {
    if (feeType === EntryFeeType.Free) return true;
    if (feeType === EntryFeeType.IC) return this.mockUser.Coins >= amount;
    if (feeType === EntryFeeType.Tico) return this.mockUser.Diamonds >= amount;
    if (feeType === EntryFeeType.SemifinalsTickets) return this.mockUser.SemiFinalTickets >= amount;
    if (feeType === EntryFeeType.FinalTickets) return this.mockUser.FinalTickets >= amount;
    if (feeType === EntryFeeType.PrivateTickets) return this.mockUser.PrivateTickets >= amount;
    return this.mockUser.Diamonds >= amount;
  }

  public async getTiers(): Promise<TierViewModel[]> {
    return [
      {
        TierName: "Explorer (Free)",
        Tier: RoomTier.Free,
        TierImage: "",
        EntryFeeLowerBound: 0,
        EntryFeeUpperBound: 0,
        Hidden: false,
      },
      {
        TierName: "Contender",
        Tier: RoomTier.Contender,
        TierImage: "",
        EntryFeeLowerBound: 5,
        EntryFeeUpperBound: 25,
        Hidden: false,
      },
      {
        TierName: "Challenger",
        Tier: RoomTier.Challenger,
        TierImage: "",
        EntryFeeLowerBound: 25,
        EntryFeeUpperBound: 100,
        Hidden: false,
      },
      {
        TierName: "Champion",
        Tier: RoomTier.Champion,
        TierImage: "",
        EntryFeeLowerBound: 100,
        EntryFeeUpperBound: 500,
        Hidden: false,
      },
    ];
  }

  public async getRooms(tier?: RoomTier): Promise<RoomViewModel[]> {
    const allRooms: RoomViewModel[] = [
      {
        Guid: "mock-room-explorer-1",
        Name: "Explorer Training Ground (Free)",
        Description: "Practice wave defense against swarms. No entry fee.",
        RoomSize: 1,
        Tier: RoomTier.Free,
        EntryFee: 0,
        EntryFeeUSDT: 0,
        TotalPrize: 0,
        IsFree: true,
        RequireKyc: false,
        UserCanJoinWithVoucher: false,
        IsPrePaid: false,
      },
      {
        Guid: "mock-room-contender-1",
        Name: "Contender Arena (1v1)",
        Description: "Quick 1v1 Swarm Duel. Highest score takes the pot.",
        RoomSize: 2,
        Tier: RoomTier.Contender,
        EntryFee: 10,
        EntryFeeUSDT: 1.0,
        TotalPrize: 18,
        IsFree: false,
        RequireKyc: false,
        UserCanJoinWithVoucher: true,
        IsPrePaid: false,
      },
      {
        Guid: "mock-room-contender-5p",
        Name: "Contender Skirmish (5 Players)",
        Description: "5-Player Survival. Top 2 split the $TICO pool.",
        RoomSize: 5,
        Tier: RoomTier.Contender,
        EntryFee: 15,
        EntryFeeUSDT: 1.5,
        TotalPrize: 65,
        IsFree: false,
        RequireKyc: false,
        UserCanJoinWithVoucher: true,
        IsPrePaid: false,
      },
      {
        Guid: "mock-room-challenger-1",
        Name: "Challenger Gauntlet (1v1)",
        Description: "High-stakes 1v1 combat. Hardened monsters and aggressive bosses.",
        RoomSize: 2,
        Tier: RoomTier.Challenger,
        EntryFee: 50,
        EntryFeeUSDT: 5.0,
        TotalPrize: 90,
        IsFree: false,
        RequireKyc: false,
        UserCanJoinWithVoucher: false,
        IsPrePaid: false,
      },
      {
        Guid: "mock-room-challenger-15p",
        Name: "Challenger Siege (15 Players)",
        Description: "15-Player Royale. Top 3 claim the prize pool.",
        RoomSize: 15,
        Tier: RoomTier.Challenger,
        EntryFee: 50,
        EntryFeeUSDT: 5.0,
        TotalPrize: 650,
        IsFree: false,
        RequireKyc: false,
        UserCanJoinWithVoucher: false,
        IsPrePaid: false,
      },
      {
        Guid: "mock-room-champion-1",
        Name: "Champion Throne (1v1)",
        Description: "Elite competitive room for the master tacticians.",
        RoomSize: 2,
        Tier: RoomTier.Champion,
        EntryFee: 100,
        EntryFeeUSDT: 10.0,
        TotalPrize: 185,
        IsFree: false,
        RequireKyc: true,
        UserCanJoinWithVoucher: false,
        IsPrePaid: false,
      },
    ];

    if (tier !== undefined) {
      return allRooms.filter((r) => r.Tier === tier);
    }
    return allRooms;
  }

  public async getPrizePoolDistribution(roomGuid: string): Promise<PrizePoolDistributionViewModel | null> {
    return {
      PrizePlaces: [
        { Place: 1, PlatformExp: 100, PlatformExpKyc: 120, RewardFeeRatio: 1.8, Prizes: [] },
        { Place: 2, PlatformExp: 50, PlatformExpKyc: 60, RewardFeeRatio: 0.8, Prizes: [] },
      ],
      TotalTicoAccumulated: 200,
      TicoSharedViaPlaces: 180,
      TotalPlayers: 5,
      TicoPerPlayer: 40,
      PlatformFeePercentage: 10,
      PlatformFee: 20,
      TotalTicoDistributedToPlayers: 180,
    };
  }

  public async joinRoom(roomGuid: string): Promise<RoomSessionData> {
    const rooms = await this.getRooms();
    const room = rooms.find((r) => r.Guid === roomGuid) || rooms[0];

    if (!room.IsFree && room.EntryFee > 0) {
      if (this.mockUser.Diamonds < room.EntryFee) {
        throw new Error(`Insufficient $TICO balance! Required: ${room.EntryFee}, current: ${this.mockUser.Diamonds}`);
      }
      this.mockUser.Diamonds -= room.EntryFee;
    }

    const session: RoomSessionData = {
      EventId: room.Guid,
      SessionOrMatchId: `mock-sess-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };

    this.recordEvent("mock_join_room", { roomGuid: room.Guid, entryFee: room.EntryFee });
    return session;
  }

  public async endRoomSP(
    session: RoomSessionData,
    score: number,
    actionLogs?: FunticoActionLog[]
  ): Promise<boolean> {
    this.recordEvent("mock_end_room", {
      session: session.SessionOrMatchId,
      score,
      logsCount: (actionLogs || this.actionLogs).length,
    });
    return true;
  }

  public async getRoomLeaderboard(roomGuid: string): Promise<RoomLeaderboardViewModel | null> {
    return {
      State: LeadersState.distributed,
      IsPending: false,
      ClosedUnsuccessfully: false,
      RoomName: "Contender Arena (1v1)",
      RoomTier: RoomTier.Contender,
      IsFree: false,
      YourTicoEarnings: 18,
      Multiplier: 1.8,
      UserPlace: "1",
      LeaderboardItems: [
        { Place: 1, PlayerName: this.mockUser.Name, Score: 14850, UserId: this.mockUser.UserId },
        { Place: 2, PlayerName: "GarrisonGuard", Score: 12200, UserId: 991 },
      ],
    };
  }

  public async getTournaments(filter?: TournamentsFilterEnum): Promise<TournamentViewModel[]> {
    const guid = "mock-tournament-weekly-1";
    return [
      {
        Id: guid,
        Guid: guid,
        Plaftorfm_Guid: guid,
        Name: "Weekly Swarm Tournament #4",
        Description: "Official weekly survival challenge. Everyone plays on Seed #48291. Top 50 get $TICO rewards.",
        StartDate: new Date(Date.now() - 86400000).toISOString(),
        EndDate: new Date(Date.now() + 86400000 * 6).toISOString(),
        PrizePoolLabel: "10,000 $TICO",
      },
    ];
  }

  public async joinTournament(tournamentGuid: string): Promise<boolean> {
    return true;
  }

  public async enterTournament(tournamentGuid: string): Promise<TournamentEnterData> {
    return {
      TournamentScoreUuid: `mock-tscore-${Date.now()}`,
      LocalTournamentUUID: tournamentGuid,
      LocalTournamentUuid: tournamentGuid,
    };
  }

  public async submitTournamentScore(
    scoreUuid: string,
    score: number,
    actionLogs?: FunticoActionLog[]
  ): Promise<boolean> {
    this.recordEvent("mock_tournament_score_submitted", { scoreUuid, score });
    return true;
  }

  public async getTournamentLeaderboard(tournamentGuid: string): Promise<TournamentLeaderboardViewModel | null> {
    return {
      Id: tournamentGuid,
      Guid: tournamentGuid,
      Plaftorfm_Guid: tournamentGuid,
      Name: "Weekly Swarm Tournament #4",
      Players: [
        { Place: 1, Points: 38200, Score: 38200, Name: "ValkyrieKing", UserName: "ValkyrieKing", FunticoId: 101, UserId: "u1" },
        { Place: 2, Points: 31500, Score: 31500, Name: this.mockUser.Name, UserName: this.mockUser.Name, FunticoId: this.mockUser.UserId, UserId: "u2" },
        { Place: 3, Points: 29800, Score: 29800, Name: "PaladinLord", UserName: "PaladinLord", FunticoId: 202, UserId: "u3" },
      ],
      CurrentPlayer: {
        Place: 2,
        Points: 31500,
        Score: 31500,
        Name: this.mockUser.Name,
        UserName: this.mockUser.Name,
        FunticoId: this.mockUser.UserId,
        UserId: "u2",
      },
      TotalPlayers: 142,
    };
  }

  public async getHallOfFame(
    period: HallOfFamePeriodMode = HallOfFamePeriodMode.Global,
    mode: HallOfFameGameModeFilter = HallOfFameGameModeFilter.All
  ): Promise<HallOfFameResponse | null> {
    return {
      leaderboard: [
        { userId: 1, funticoId: 1, displayName: "ShadowBlade", rank: 1, totalPoints: 52000, gamesPlayed: 45 },
        { userId: 2, funticoId: 2, displayName: "RoyalCommander", rank: 2, totalPoints: 49800, gamesPlayed: 38 },
        { userId: 1042, funticoId: 1042, displayName: this.mockUser.Name, rank: 3, totalPoints: 44200, gamesPlayed: 25 },
      ],
      currentPlayer: {
        userId: 1042,
        funticoId: 1042,
        displayName: this.mockUser.Name,
        rank: 3,
        totalPoints: 44200,
        gamesPlayed: 25,
      },
      totalPlayers: 1250,
      page: 1,
      limit: 10,
    };
  }

  public async checkUnfinishedSession(): Promise<SavedSessionResponse | null> {
    return this.mockSavedSession;
  }

  public async reconnectSession(sessionId: string): Promise<boolean> {
    return true;
  }

  public async saveSessionSnapshot(sessionId: string, snapshot: any): Promise<boolean> {
    this.mockSavedSession = {
      Id: "mock-session-db-1",
      SessionId: sessionId,
      SaveSessionId: sessionId,
      GameType: 4,
      ReconnectTime: Date.now(),
      Data: JSON.stringify(snapshot),
      Hash: "mock-hash",
    };
    return true;
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
  }

  public getPendingActionLogs(): FunticoActionLog[] {
    return [...this.actionLogs];
  }

  public clearActionLogs(): void {
    this.actionLogs = [];
  }

  public isMock(): boolean {
    return true;
  }
}
