// Phaser import omitted for standalone React/Canvas 2D integration

/**
 * Environments supported by the Funtico SDK.
 */
export enum FunticoEnvironment {
  STAGING = 'staging',
  PROD = 'prod'
}

/**
 * Currency/Entry Fee Types matching Funtico platform definitions.
 */
export enum EntryFeeType {
  IC = 1,                 // In-game currency (Coins)
  Tico = 2,               // Premium platform currency (TICO/Diamonds)
  SemifinalsTickets = 3,  // Semi-final tickets
  FinalTickets = 4,       // Final tickets
  Free = 5,               // Free room
  InventoryItem = 6,      // Requires special inventory item
  PrivateTickets = 7      // Private room tickets
}

/**
 * Room Tier Enumeration.
 */
export enum RoomTier {
  Contender = 0,
  Challenger = 1,
  Champion = 2,
  Free = 3
}

/**
 * Lifecycle of a room's prize settlement, as reported by `state` on GET /Rooms/leaders.
 *
 * Values match the wire exactly: `placed = 0, distributed = 1, to_be_returned = 3, returned = 4`.
 * 2 is intentionally unused - it is NOT a transcription slip, so do not "fix" the gap.
 * The response carries the number, not the name.
 */
export enum LeadersState {
  /** Scores are in, prizes not settled yet. Drives IsPending. */
  placed = 0,
  distributed = 1,
  to_be_returned = 3,
  returned = 4
}

/**
 * The `type` of a room config's `ticket`. Wire-level.
 *
 * NOT the same enum as EntryFeeType, despite both having a `Free` member: this one is Free = 0,
 * EntryFeeType is Free = 5. Comparing a ticket type against EntryFeeType.Free would classify every
 * room as not-free.
 */
enum TicketType {
  Free = 0,
  Currency = 1,
  Item = 2
}

/**
 * Status filter for special tournaments.
 */
export enum TournamentsFilterEnum {
  OnGoing = 'OnGoing',
  Upcoming = 'Upcoming',
  Finished = 'Finished'
}

/**
 * Game Type Enumeration for Reconnection and Sessions.
 */
export enum GameTypeEnum {
  Indirect_PVP = 0,
  Direct_PVP = 1,
  Tournament = 3,
  Rooms = 4,
  Practice = 5,
  MultiplayerPvp = 6
}

/**
 * Player gameplay presence status on dedicated server.
 */
export enum UserGameStatus {
  Leave = 0,
  InGame = 1,
  Finished = 2
}

/**
 * Hall of Fame ranking period.
 */
export enum HallOfFamePeriodMode {
  Global = 0,
  Monthly = 1
}

/**
 * Game mode filter for Hall of Fame rankings. Use this in game code.
 */
export enum HallOfFameGameModeFilter {
  All = 0,                 // No filter - ranks across every mode
  SpecialTournament = 1,
  Rooms = 2,
  Practice = 3
}

/**
 * Wire `gameMode` query values for the /HallOfFame endpoints.
 * Deliberately offset by one from HallOfFameGameModeFilter, which has no `All` equivalent.
 * Wire-level detail - prefer HallOfFameGameModeFilter.
 */
export enum HallOfFameGameMode {
  SpecialTournament = 0,
  Rooms = 1,
  Practice = 2
}

/**
 * Prize types, as they appear in the `type` field of prize objects.
 */
export enum PrizeType {
  Item = 'Item',
  DepositStakePoolShare = 'DepositStakePoolShare',
  DepositStakePerPlayer = 'DepositStakePerPlayer',
  GppPoolShare = 'GppPoolShare',
  GppPerPlayer = 'GppPerPlayer',
  External = 'External',
  Placeholder = 'Placeholder',
  Reward = 'Reward',
  GameManagedReward = 'GameManagedReward'
}

/**
 * Platform Item Prize structure.
 */
export interface PlatformItemPrize {
  id: number;
  image: string;
  name: string;
}

/**
 * Base type for Funtico Prizes.
 */
export interface BasePrize {
  type: PrizeType;
}

/**
 * Manual Prize (External or Placeholder).
 */
export interface ManualPrize extends BasePrize {
  type: PrizeType.External | PrizeType.Placeholder;
  Id: number;
  ValueUsd?: number;
  ImageUrl: string;
  Name: string;
  Description: string;
  Chain: string;
  ContractAddress: string;
  ExplorerUrl: string;
  WalletAddress: string;
  TokenId?: number;
}

/**
 * Automated prize containing an item and amount.
 */
export interface PrizeWithAmountAndItem extends BasePrize {
  Amount: number;
  Item?: PlatformItemPrize;
}

/**
 * Automated Item Prize.
 */
export interface ItemAutomatedPrize extends PrizeWithAmountAndItem {
  type: PrizeType.Item;
  ItemId: number;
}

/**
 * Automated Reward Prize.
 */
export interface RewardAutomatedPrize extends PrizeWithAmountAndItem {
  type: PrizeType.Reward;
  PrizeId: number;
}

/**
 * Automated Stake Pool or Per-Player Deposit Prize.
 */
export interface DepositStakeAutomatedPrize extends BasePrize {
  type: PrizeType.DepositStakePoolShare | PrizeType.DepositStakePerPlayer;
  Currency: number;
  Value: number;
  Percentage?: number;
}

/**
 * GPP Pool Share or Per-Player Prize.
 */
export interface GppAutomatedPrize extends BasePrize {
  type: PrizeType.GppPoolShare | PrizeType.GppPerPlayer | PrizeType.GameManagedReward;
  Currency: number;
  Value: number;
  Percentage?: number;
}

/**
 * Discriminated union of all Funtico Prize variations.
 *
 * THE MIXED CASING IS CORRECT - DO NOT "FIX" IT.
 * Prize objects arrive with a lowercase `type` key and every other field in PascalCase: `Value`,
 * `Currency`, `PrizeId`, `Amount`, `ImageUrl` etc. The nested `Item` is the one exception and stays
 * lowercase (`PlatformItemPrize`: id/image/name).
 * Null-valued fields are omitted entirely, hence the optional markers.
 *
 * Example, from `room.prize_distribution[].prizes[]`:
 *   {"type":"DepositStakePerPlayer","Currency":1,"Value":750}
 *   {"type":"Reward","PrizeId":2521,"Amount":1,"Item":{"id":2521,"image":"...","name":"Gift Box"}}
 */
export type Prize =
  | ManualPrize
  | ItemAutomatedPrize
  | RewardAutomatedPrize
  | DepositStakeAutomatedPrize
  | GppAutomatedPrize;

/**
 * Helpers for computing the value of a prize list.
 */
export class PrizeUtils {
  /**
   * Calculates the calculated value of automated prizes based on the tournament deposit stake.
   */
  public static calculatePrize(prizes: Prize[], depositStake: number): number {
    if (!prizes) return 0;

    let prizeValue = 0;
    for (const prize of prizes) {
      switch (prize.type) {
        case PrizeType.GppPoolShare: {
          const gpp = prize as GppAutomatedPrize;
          if (gpp.Percentage !== undefined && gpp.Percentage !== null) {
            prizeValue += Math.floor((gpp.Percentage * depositStake) / 100);
          }
          break;
        }
        case PrizeType.DepositStakePoolShare: {
          const dsp = prize as DepositStakeAutomatedPrize;
          if (dsp.Percentage !== undefined && dsp.Percentage !== null) {
            prizeValue += Math.floor((dsp.Percentage * depositStake) / 100);
          }
          break;
        }
        case PrizeType.DepositStakePerPlayer: {
          const dsp = prize as DepositStakeAutomatedPrize;
          prizeValue += dsp.Value;
          break;
        }
        case PrizeType.GppPerPlayer: {
          const gpp = prize as GppAutomatedPrize;
          prizeValue += gpp.Value;
          break;
        }
        // GameManagedReward is deliberately absent and MUST stay absent - it contributes 0.
        // Such a prize is granted by the game itself, not paid out of the deposit stake, so
        // counting its Value here would inflate YourTicoEarnings (and Multiplier with it) by an
        // amount the platform never pays. Do not "restore" this case for symmetry with GppPerPlayer.
      }
    }

    return prizeValue;
  }
}

/**
 * SDK Configuration interface.
 */
export interface FunticoConfig {
  env: FunticoEnvironment;
  privateGameKey: string;     // Secret key (obtained from dashboard)
  publicGameKey: string;      // X-User-Key (public key)
  userToken?: string;          // Initial user platform token
  apiBaseUrl?: string;         // Custom URL for your game's API
  /**
   * Custom URL for the Funtico PLATFORM API (the host serving /api/v1/web/users).
   * This is a different host from apiBaseUrl: apiBaseUrl is the game's Rooms API and takes the
   * game JWT, while this one is the platform itself and takes the user's platform token.
   * Defaults from `env`.
   */
  funticoApiBaseUrl?: string;
  cacheTTL?: number;           // Cache lifetime in milliseconds (default: 30000ms)
}

/**
 * Detailed User Profile Data.
 */
export interface UserData {
  Name: string;
  UserId: number;
  PlatformId: number;
  Level: number;
  Rating: number;
  Experience: number;
  ExperienceToLevel: number;
  Coins: number;
  Diamonds: number;
  SemiFinalTickets: number;
  FinalTickets: number;
  PrivateTickets: number;
  KYCVerified: boolean;
  SoundsValue: number;
  MusicValue: number;
}

/**
 * User Balance Information.
 */
export interface BalanceResponse {
  Coins: number;
  Diamonds: number;
  SemiFinalTickets: number;
  FinalTickets: number;
  PrivateTickets: number;
  KYCVerified: boolean;
}

/**
 * Voucher Data representing free entries.
 */
export interface VoucherData {
  ItemId: number;
  ItemName: string;
  ItemImage: string;
  Tier: RoomTier;
  Count: number;
  PlayCount: number;
  PlaysRequiredToActivate: number;
}

/**
 * Tournament Tier Details.
 */
export interface TierViewModel {
  TierName: string;
  Tier: RoomTier;
  /**
   * Raw tier icon URL. The SDK does not load it; the URL is handed to the game as-is.
   */
  TierImage: string;
  EntryFeeLowerBound: number;
  EntryFeeUpperBound: number;
  Hidden: boolean;
}

/**
 * Tournament Room Details.
 */
export interface RoomViewModel {
  Guid: string;
  Name: string;
  Description?: string;
  HasPassword?: boolean;
  RoomSize?: number;
  Tier: RoomTier;
  EntryFee: number;
  EntryFeeUSDT: number;
  TotalPrize: number;
  IsFree: boolean;
  RequireKyc: boolean;
  UserCanJoinWithVoucher: boolean;
  Voucher?: VoucherData;
  IsPrePaid: boolean;
}

/**
 * One place in a room's prize table, as composed by GetPrizePoolDistribution.
 */
export interface PrizePlaceViewModel {
  Place: number;
  PlatformExp: number;
  PlatformExpKyc: number;
  /** ticoPrize / ticket.currency_amount; 0 when the room is free or the place wins no TICO. */
  RewardFeeRatio: number;
  Prizes: Prize[];
}

/**
 * A room's full prize pool breakdown.
 *
 * There is no endpoint behind this - the SDK composes it entirely client-side from the room config.
 * TicoPerPlayer and TotalTicoDistributedToPlayers are resolved at mapping time.
 */
export interface PrizePoolDistributionViewModel {
  PrizePlaces: PrizePlaceViewModel[];
  TotalTicoAccumulated: number;
  TicoSharedViaPlaces: number;
  TotalPlayers: number;
  TicoPerPlayer: number;
  PlatformFeePercentage: number;
  PlatformFee: number;
  TotalTicoDistributedToPlayers: number;
}

/**
 * One entry of GET /Rooms/pre-paid: a room the user has already paid the entry fee for.
 *
 * Snake_case, unlike the other public models, because this is a straight passthrough of the
 * response; GetRooms only ever reads `id` off it to set RoomViewModel.IsPrePaid.
 *
 * Example entry:
 *   {"id":"ca1ef3b9-...","attempts_left":1,"participation_id":"192da493-...",
 *    "game_session_id":"4be2ab2a-...","community_id":null,"voucher_used":false}
 */
export interface PrePaidRoomData {
  id: string;
  /** Remaining paid entries into this room. */
  attempts_left: number;
  participation_id: string;
  /** The already-started session, when there is one. */
  game_session_id: string | null;
  community_id: string | null;
  /** Whether the paid entry was covered by a voucher rather than currency. */
  voucher_used: boolean;
}

/**
 * Data returned when joining a room.
 */
export interface RoomSessionData {
  EventId: string;
  SessionOrMatchId: string;
}

/**
 * Leaderboard Item representation.
 */
export interface LeaderboardItemViewModel {
  Place: number;
  PlayerName: string;
  Score: number;
  UserId: number;
  AvatarUrl?: string;
}

/**
 * Room Leaderboard ViewModel.
 */
export interface RoomLeaderboardViewModel {
  /**
   * The room's settlement state as the numeric LeadersState value (the response sends the number).
   * Earlier SDK versions declared this as `string`, but it never held a value, so no working
   * consumer can depend on the old type. Compare with `State === LeadersState.placed`; for logging,
   * `LeadersState[view.State]` gives the member name.
   */
  State: LeadersState;
  IsPending: boolean;
  ClosedUnsuccessfully: boolean;
  RoomName: string;
  RoomTier: RoomTier;
  IsFree: boolean;
  YourTicoEarnings: number;
  Multiplier: number;
  UserPlace: string;
  LeaderboardItems: LeaderboardItemViewModel[];
}

/**
 * Special Tournament ViewModel.
 *
 * Unlike the Rooms models, this one needs no mapping layer: the tournament endpoints already
 * return PascalCase and the field names below match the wire as-is. The single exception is the
 * identifier - the wire calls it `Plaftorfm_Guid` (sic - that is the real field name) and also sends
 * an unrelated `Id` that is always 0. The SDK aliases the guid onto both `Id` and `Guid` so that
 * `Id` is the value every other tournament method actually accepts.
 *
 * Every wire field is preserved on the returned object, so anything the platform adds later is
 * still reachable even if it is not declared here.
 */
export interface TournamentViewModel {
  Id: string;                 // Aliased from Plaftorfm_Guid. Pass THIS to the other tournament methods.
  Guid: string;               // Same value as Id; alternative name.
  Plaftorfm_Guid: string;     // The raw wire field, kept as-is.
  Name: string;
  Description?: string;
  EntryFee?: number;
  EntryFeeType?: EntryFeeType;
  EntryFeeItemId?: number | null;
  EntryFeeItemName?: string | null;
  EntryFeeItemImage?: string | null;
  StartDate?: string;         // ISO-8601. The wire field; `StartsAt` does not exist.
  EndDate?: string | null;
  LeftSeconds?: number;
  PlayerLimit?: number | null;
  EntryLimit?: number;
  HavePassword?: boolean | null;
  PrizePoolLabel?: string;
  GuaranteedPrizePoolUsd?: number;
  Gpp?: number | null;
  GppLabel?: string | null;
  ScoreMode?: string;
  ScoreType?: string;
  IsKycRequired?: boolean;
  Settings?: string | null;
  PracticeStartTime?: string | null;
  PracticeEndTime?: string | null;
  MinPlayerLevel?: number;
  MaxPlayerLevel?: number;
  SpecialTournamentsType?: number;

  // --- Declared by earlier SDK versions but NOT sent by the API. Always undefined. ---
  // Kept optional so existing integrations still compile.
  // Use StartDate/EndDate instead of StartsAt/EndsAt, and EntryLimit instead of MaxEntries.
  GameId?: number;
  MapId?: number;
  StartsAt?: string;
  EndsAt?: string;
  MaxEntries?: number;
  EntriesCount?: number;
  IsJoined?: boolean;
}

/**
 * Special Tournament Leaderboard Player.
 *
 * The wire sends `Points`/`Name`/`user_avatar.url`; `Score`, `UserName` and `AvatarUrl` are aliases
 * the SDK adds so the names below are true. Both spellings are present on the returned object.
 */
export interface TournamentPlayerViewModel {
  Place: number;
  Points: number;
  Score: number;              // Alias of Points.
  Name: string;
  UserName: string;           // Alias of Name.
  FunticoId: number;          // Platform user id - the one to match against UserData.PlatformId.
  UserId: string;             // Wire sends a GUID string here, NOT a number. Prefer FunticoId.
  AvatarUrl?: string;         // Alias of user_avatar.url.
  user_avatar?: { url: string; type?: string | null; name?: string | null; description?: string | null };
  user_border?: { url: string; type?: string | null; name?: string | null; description?: string | null };
  TimesPlayed?: number;
  BestTime?: number;
  PlatformAvatar?: string | null;
  Community?: string | null;
}

/**
 * Special Tournament Leaderboard.
 */
export interface TournamentLeaderboardViewModel extends TournamentViewModel {
  Players: TournamentPlayerViewModel[];
  CurrentPlayer?: TournamentPlayerViewModel;
  TotalPlayers?: number;
}

/**
 * Community Group within a Tournament.
 */
export interface TournamentCommunityViewModel {
  Uuid: string;
  Name: string;
  Description: string;
  MembersCount: number;
}

/**
 * Special Tournament Enter Response.
 *
 * IMPORTANT: `TournamentScoreUuid` is the `saveScoreId` to pass to ResultTournament_Client /
 * ResultTournament_Server. `LocalTournamentUUID` is a different, internal identifier and NOT a
 * saveScoreId; the platform rejects it with 400 "The selected tournament score uuid is invalid."
 */
export interface TournamentEnterData {
  TournamentScoreUuid: string;   // The saveScoreId. This is the one you want.
  LocalTournamentUUID: string;   // Raw wire spelling (all caps).
  LocalTournamentUuid: string;   // Alias of LocalTournamentUUID. NOT a valid saveScoreId.
}

/**
 * Special Tournament Result confirmation.
 */
export interface TournamentResultViewModel {
  Score?: number;
  Time?: number;
  XpReceive?: number;
  IcReceive?: number;
}

/**
 * A single prize awarded at a tournament place range.
 */
export interface TournamentPrizeItemViewModel {
  Name: string;
  Description: string | null;  // Always null - not populated; do not rely on it
  ImageUrl: string;
  Amount: number;
  Value_usd: number | null;    // Underscore casing is the real wire field name
}

/**
 * One place, or range of places, in a tournament's prize table.
 */
export interface TournamentPrizePlaceViewModel {
  Uuid: string;
  Name: string;               // Human label for the range, e.g. "1st place"
  Type: string;
  From: number;               // First place covered by this entry (inclusive)
  To: number;                 // Last place covered by this entry (inclusive)
  Prizes: TournamentPrizeItemViewModel[];
}

/**
 * Tournament prize table. Note the root is an object wrapping the list, not a bare array.
 */
export interface TournamentPrizesViewModel {
  Prizes: TournamentPrizePlaceViewModel[];
}

/**
 * Historical Tournament entry data.
 *
 * The tournament-history endpoint is the one tournament response that is snake_case on the wire
 * (`tournament_name`, `best_score`, ...). The SDK aliases each field to the PascalCase name below.
 * The raw snake_case keys are preserved on the returned objects too.
 */
export interface TournamentHistoryPrize {
  Name: string;
  Amount: number;
  ImageUrl?: string;
  IsRedeemed: boolean;
}

export interface TournamentHistoryEntry {
  TournamentName: string;
  TournamentUuid: string;      // Aliased from tournament_uuid - the tournament's guid.
  StartsAt?: string;
  EndsAt?: string;
  ScoredAt?: string;
  IsFinished: boolean;
  BestScore?: number;
  LeaderboardPlace?: number;
  EntriesCount?: number;
  MaxEntries?: number;
  GameId?: number;
  MapId?: number;
  Prizes?: TournamentHistoryPrize[];
}

export interface TournamentHistoryViewModel {
  Entries: TournamentHistoryEntry[];   // Aliased from the wire's `data`.
  Meta?: {
    CurrentPage: number;
    LastPage: number;
    PerPage: number;
    Total: number;
    From?: number | null;              // null when the page is empty
    To?: number | null;
  };
}

/**
 * Unfinished session details.
 */
export interface SavedSessionResponse {
  Id: string;
  SessionId: string;      // Event/Room ID
  SaveSessionId: string;  // Match/Session ID
  GameType: number;
  ReconnectTime: number;
  Data: string;           // Encrypted JSON state
  Hash: string;           // HMAC signature
}

export interface UnfinishedSessionsResponse {
  SavedSessions: SavedSessionResponse[];
}

/**
 * Server User representation for Dedicated Server match registration.
 */
export interface ServerUserData {
  JoinKey: string;
  FunticoUserId: number;  // Platform user ID
  SdkUserId: number;      // Game API user ID
  UserStatus: UserGameStatus;
}

/**
 * Hall of Fame leaderboard entry.
 *
 * Fields are camelCase, unlike the rest of this SDK: that is how the /HallOfFame endpoints send them.
 * Do not "fix" these to PascalCase for consistency - every field would silently read undefined.
 * Nullable fields are sent as explicit null rather than omitted, hence `| null`.
 */
export interface HallOfFamePlayerEntry {
  userId: number;
  funticoId: number;
  displayName: string;
  avatarUrl?: string | null;
  avatarType?: string | null;
  avatarBorder?: string | null;
  country?: string | null;
  rank: number;
  totalPoints: number;      // The player's best single score, not a sum
  gamesPlayed: number;
  playedAt?: string | null; // ISO-8601 timestamp of the ranked run
  borderType?: string | null;
}

/**
 * Paginated Hall of Fame ranking response.
 */
export interface HallOfFameResponse {
  leaderboard: HallOfFamePlayerEntry[];
  currentPlayer?: HallOfFamePlayerEntry | null;  // null when the player has no ranked results
  totalPlayers: number;
  page: number;
  limit: number;
}

/**
 * A single place (1-10) or a grouped place range (11-20, 21-50) in the distribution.
 *
 * `prizes` uses the shared `Prize` union: /HallOfFame/distribution returns prizes in exactly the
 * same shape (and mixed casing) as the room configs.
 */
export interface HOFDistributionItem {
  place: number;
  endPlace?: number;  // Absent for individual places 1-10
  range?: string;     // Absent for individual places 1-10; e.g. "11-20"
  prizes: Prize[];
}

/**
 * Hall of Fame prize distribution table.
 */
export interface HOFDistributionResponse {
  items: HOFDistributionItem[];
}

/**
 * Campaign level lifecycle status. The wire sends it as an int.
 */
export enum CampaignLevelStatus {
  Locked = 0,
  Unlocked = 1,
  Completed = 2
}

/**
 * Machine-readable codes carried by CampaignError.Code.
 *
 * All but two match the error identifiers the API returns, byte for byte. NoActiveAttempt is
 * CLIENT-side only - CompleteCampaignLevel throws it before any I/O when there is no attempt to
 * submit against. Unknown covers any body the SDK cannot parse and any identifier it does not
 * recognise (e.g. one added by a newer API version).
 */
export enum CampaignErrorCode {
  CampaignNotAvailable = 'CampaignNotAvailable',
  LevelLocked = 'LevelLocked',
  LevelNotFound = 'LevelNotFound',
  NoActiveAttempt = 'NoActiveAttempt',
  AttemptNotFound = 'AttemptNotFound',
  InvalidSignature = 'InvalidSignature',
  InvalidMetrics = 'InvalidMetrics',
  CompletionTooFast = 'CompletionTooFast',
  Unknown = 'Unknown'
}

/**
 * Error thrown by the Campaign methods, carrying a machine-readable Code alongside the
 * human-readable message. Branch on `Code`, never on message text.
 *
 * `instanceof CampaignError` is reliable: the constructor restores the prototype chain
 * explicitly, which extending the built-in Error otherwise breaks under ES5-era targets.
 */
export class CampaignError extends Error {
  public readonly Code: CampaignErrorCode;

  constructor(code: CampaignErrorCode, message: string) {
    super(message);
    Object.setPrototypeOf(this, CampaignError.prototype);
    this.name = 'CampaignError';
    this.Code = code;
  }
}

/**
 * Headline campaign numbers, available without fetching the (heavier) level list.
 */
export interface CampaignAvailabilityViewModel {
  IsAvailable: boolean;
  LevelCount: number;
  MaxStars: number;
}

/**
 * One reward attached to a campaign level, granted on completing it with at least
 * `RequiredStars` stars.
 */
export interface CampaignRewardViewModel {
  Type: string;
  Amount: number;
  ItemId?: number | null;
  RequiredStars: number;
  Name?: string | null;
  ImageUrl?: string | null;
}

/**
 * One condition of a star rule: `Metric` compared via `Op` against `Value`.
 * FOR DISPLAY ONLY - stars are computed server-side. Render the thresholds; never re-evaluate
 * them client-side and never submit stars.
 */
export interface CampaignStarRuleCondition {
  Metric: string;
  Op: string;
  Value: number;
}

/** The conditions that must all hold for a run to earn `Star`. */
export interface CampaignStarTier {
  Star: number;
  Conditions: CampaignStarRuleCondition[];
}

/**
 * A level's parsed star rules: what counts as a win, and what earns each star.
 * Parsed client-side from the wire's StarRulesJson; null on the level while it is Locked, and
 * null again when that JSON does not parse.
 */
export interface CampaignStarRules {
  Win: CampaignStarRuleCondition[];
  Stars: CampaignStarTier[];
}

/**
 * One campaign level as the player sees it.
 *
 * `LevelConfigJson` is the wire's LevelJsonData under a clearer name: an opaque JSON string
 * whose schema belongs to YOUR game - parse it via GetCampaignLevelConfig<T>(). Both it and
 * `StarRules` are null while the level is Locked; the server withholds them until unlock.
 */
export interface CampaignLevelViewModel {
  Id: string;
  Order: number;
  Name: string;
  Description?: string | null;
  Status: CampaignLevelStatus;
  BestStars: number;
  BestMetrics: Record<string, number> | null;
  LevelConfigJson: string | null;
  StarRules: CampaignStarRules | null;
  MinDurationSeconds: number;
  ConfigVersion: number;
  Rewards: CampaignRewardViewModel[];
  CompletedAt?: string | null;
}

/**
 * The player's campaign-wide progress counters, shared by the level list and the completion
 * result so one progress HUD can bind to either.
 */
export interface CampaignProgressSummary {
  TotalLevels: number;
  CompletedLevels: number;
  TotalStarsEarned: number;
  MaxStars: number;
}

/** The full campaign as returned by GetCampaignLevels. */
export interface CampaignLevelsViewModel extends CampaignProgressSummary {
  IsAvailable: boolean;
  Levels: CampaignLevelViewModel[];
}

/**
 * A started level attempt. StartCampaignLevel returns and tracks one; CompleteCampaignLevel
 * consumes it.
 */
export interface CampaignAttemptData {
  AttemptId: string;
  LevelId: string;
  ConfigVersion: number;
  StartedAt: string;
}

/**
 * The metrics a finished run submits: a flat name -> value map.
 * Booleans are legal and are normalized to 1/0 before encryption. Numbers may be fractional -
 * unlike EndRoomSP's int Score, nothing is truncated.
 */
export type CampaignMetrics = Record<string, number | boolean>;

/**
 * The outcome of a submitted attempt. Losing is a NORMAL result - IsWin false, Stars 0 - not an
 * error, so a defeat screen renders from this same object.
 */
export interface CampaignCompletionResult extends CampaignProgressSummary {
  IsWin: boolean;
  Stars: number;
  BestStars: number;
  IsNewBest: boolean;
  LevelCompletedFirstTime: boolean;
  UnlockedLevelId: string | null;
  Rewards: CampaignRewardViewModel[];
  RewardsGranted: boolean;
}

/* ============================================================================================
 * WIRE-LEVEL PLUMBING - INTERNAL. NOT PART OF THE PUBLIC API.
 *
 * Everything below models exactly what the HTTP endpoints actually return, byte for byte.
 * These are NOT the models games consume: the public ViewModels above (RoomViewModel,
 * TierViewModel, VoucherData, ...) are client-side COMPOSED models that the mapping layer builds
 * from these wire shapes.
 *
 * Do not export these and do not hand them to game code. Do not "normalize" the casing - the
 * mixture of PascalCase envelopes and snake_case bodies is what the server really sends.
 * If you need to change a shape here, check a real response first; never guess it.
 * ============================================================================================ */

/** GET /Rooms/tiers -> one entry of the `data` array. */
interface WireTierData {
  name: string;
  image: string;
  tier: number;
  lowerBoundEntryFee: number;
  upperBoundEntryFee: number;
  hidden: boolean;
}

/** GET /Rooms/tiers - object envelope, lowercase `data`. */
interface WireTiersResponse {
  data: WireTierData[];
}

/**
 * GET /Rooms/get-rooms - PascalCase envelope wrapping snake_case room configs.
 * Note the envelope keys are `Data`/`Cursor` here while /Rooms/pre-paid uses lowercase `data`.
 */
interface WireRoomsResponse {
  Data: WireRoomConfig[];
  Cursor: string;
}

/**
 * One entry of `leaders` on GET /Rooms/leaders.
 * Example: {"id":1058,"score":1234,"place":1,"prizes":[],"finish_reason":0,"FinishReason":0}
 *
 * The wire carries the finish reason TWICE: `finish_reason` and `FinishReason`. They are always
 * the same value in a different case, so only the lowercase one is modelled here. Read
 * `finish_reason`; the twin is redundant and should not be relied on.
 */
interface WireLeader {
  /** The PLATFORM user id - matches UserData.PlatformId, not UserData.UserId. */
  id: number;
  score: number;
  place: number;
  prizes: Prize[];
  /** RoomFinishReason: 0 = Ok, 1 = AutomaticallyClosed, 2 = Kicked, 3 = Unfinished. */
  finish_reason: number;
}

/** An `items` entry on GET /Rooms/leaders. The array is normally empty. */
interface WireLeadersItem {
  id: number;
  image: string;
  name: string;
  amount: number;
}

/**
 * GET /Rooms/leaders - bare, no envelope.
 * Example: {"state":0,"leaders":[...],"items":[],"match_id":null}
 */
interface WireRoomLeadersResponse {
  /** A LeadersState number. Sent as an int. */
  state: number;
  leaders: WireLeader[];
  items: WireLeadersItem[];
  match_id: string | null;
}

/** An `avatar`/`border` on a platform user. Example: {"url":"https://...","type":"static"}. */
interface WirePlatformImage {
  url: string;
  type: string;
}

/** One `data` entry of the platform users endpoint. */
interface WirePlatformUser {
  id: number;
  name: string;
  avatar: WirePlatformImage | null;
  border: WirePlatformImage | null;
}

/**
 * GET {funticoApiUri}/api/v1/web/users?ids[]=... - the PLATFORM host, authorised with the user's
 * PLATFORM token (config.userToken), NOT the game JWT. Example:
 * {"data":[{"id":1058,"name":"player_49","avatar":{...},"border":{...}}]}
 */
interface WireUsersInfoResponse {
  data: WirePlatformUser[];
}

/**
 * `game_session` on GET /Rooms/get-history.
 *
 * The key is SINGULAR - `game_session`. There is no plural `game_sessions` / `GameSessions` key.
 */
interface WireGameSession {
  id: string;
  registered_at: string | null;
  started_at: string | null;
  match_id: string | null;
  score: number | null;
  scored_at: string | null;
  distributed_at: string | null;
  match_type: number | null;
  /** A numeric id sent as a string, e.g. "304". */
  game_id: string;
  /** The platform user id, sent as a string, e.g. "1058". */
  user_id: string;
  event_id: string;
  leader: unknown;
  opponent_name: string | null;
  return_requested_at: string | null;
  returned_at: string | null;
  /** Whether the seat was paid for with a voucher. Drives the fee substitution. */
  voucher_used: boolean;
}

/** GET /Rooms/get-history. `event` is present only when called with withEvent=true. */
interface WireSessionHistoryResponse {
  game_session: WireGameSession;
  event?: WireRoomConfig;
}

/** `ticket` on a room config. Example: {"type":1,"currency_amount":250,"item_id":null,"item":null}. */
interface WireTicket {
  /** TicketType: 0 = Free, 1 = Currency, 2 = Item. Not the same enum as EntryFeeType. */
  type: number | null;
  currency_amount: number | null;
  item_id: number | null;
  item: PlatformItemPrize | null;
}

/** `prize_pool.platform_fee`. Example: {"type":"platform_fee","value":20,"burn_percentage":0}. */
interface WirePlatformFee {
  type: string;
  /** The platform fee PERCENTAGE, not an absolute amount. The absolute is computed.platform_fee. */
  value: number | null;
  burn_percentage: number | null;
}

/**
 * `prize_pool` on a room config.
 * `gpp` and `game_managed` are usually null and their populated shapes are not modelled - left as
 * `unknown` rather than guessed. Check a real GPP room response before typing them.
 */
interface WirePrizePool {
  gpp: unknown;
  platform_fee: WirePlatformFee;
  game_managed: unknown;
}

/**
 * `leaderboard` on a room config.
 * Example: {"field":"points","placement_mode":"descending","type":"local","claim_limit":0,
 *            "attempts":null,"fn":null}
 */
interface WireLeaderboardConfig {
  field: string | null;
  placement_mode: string | null;
  type: string | null;
  claim_limit: number | null;
  attempts: number | null;
  fn: string | null;
}

/** `prize_distribution[].xp`. Example: {"base":10,"kyc":12}. */
interface WireXpPoints {
  base: number;
  kyc: number;
}

/** One entry of `prize_distribution`. */
interface WirePrizeDistribution {
  prizes: Prize[];
  place: number | null;
  xp: WireXpPoints | null;
}

/**
 * `computed` on a room config - server-side derived totals.
 * Example: {"deposit_stake":1250,"stake":1250,"platform_fee":250,"burn":0,
 *            "platform_fee_per_ticket":50}
 */
interface WireComputed {
  deposit_stake: number;
  stake: number;
  platform_fee: number;
  burn: number;
  platform_fee_per_ticket: number;
}

/** `details` on a room config - the display metadata. */
interface WireRoomDetails {
  name: string;
  description: string;
  tier: number | null;
  has_password: boolean | null;
  map_id: number | null;
  cover_image: string;
  terms_and_conditions: string;
  is_leaderboard_locked: boolean | null;
  is_play_button_visible: boolean | null;
  prize_pool_label: string;
}

/**
 * The room config. GET /Rooms/get-room returns one of these BARE (no envelope);
 * GET /Rooms/get-rooms returns them inside WireRoomsResponse.Data.
 */
interface WireRoomConfig {
  id: string;
  /** RoomType as a string: "singleplayer" | "multiplayer" | "external". */
  type: string | null;
  version: number | null;
  /** A numeric id sent as a string, e.g. "304". */
  game_id: string;
  size: number | null;
  ticket: WireTicket;
  prize_pool: WirePrizePool;
  leaderboard: WireLeaderboardConfig;
  prize_distribution: WirePrizeDistribution[];
  computed: WireComputed;
  details: WireRoomDetails;
  item_ids: string[];
  reward_ids: string[];
  matchmaking_configuration_name: string;
  /** Unix epoch milliseconds. */
  updated_at: number | null;
  /**
   * A PascalCase object whose fields are normally 0/false/null. It is deliberately left
   * unknown - nothing in the mapping layer reads it. Games that need it should call
   * GetRoomSettings(), which returns the game-defined settings blob.
   */
  settings: unknown;
}

/** One entry of GET /User/vouchers `Data`. This is the endpoint that carries the counts. */
interface WireVoucherData {
  item_id: number;
  item_name: string;
  item_image: string;
  tier: number;
  /** Progress toward earning the next voucher: play_count of plays_required_to_activate. */
  play_count: number;
  plays_required_to_activate: number;
  /** How many vouchers the user currently holds. */
  count: number;
}

/** GET /User/vouchers - PascalCase envelope. Not to be confused with /User/vouchers-data. */
interface WireVouchersResponse {
  Data: WireVoucherData[];
}

/** GET /Rooms/pre-paid - object envelope, lowercase `data`. */
interface WirePrePaidResponse {
  data: PrePaidRoomData[];
}

/** `lobby_quote` on a join-room response. `exp` is an ISO-8601 timestamp. */
interface WireLobbyQuote {
  id: string;
  exp: string;
}

/**
 * POST /Rooms/join-room and POST /Rooms/start-room-sp both return this shape.
 *
 * On a first join, `game_session_id_or_match_id` is null (NOT "") and `lobby_quote` is populated -
 * so any "has already joined" check must treat null and blank alike. On start-room-sp the reverse
 * holds: `id` carries the real session id and `lobby_quote` is null.
 */
interface WireJoinRoomResponse {
  id: string;
  game_session_id_or_match_id: string | null;
  lobby_quote: WireLobbyQuote | null;
}

/* ---- Campaign wire shapes ----
 * PascalCase field names, enums as ints. If a real response ever differs from these shapes, fix
 * THESE shapes to match the bytes and absorb the difference in the map* functions.
 */

/** GET /Campaign/availability - bare, no envelope. Always 200. */
interface WireCampaignAvailability {
  IsAvailable: boolean;
  LevelCount: number;
  MaxStars: number;
}

/** One `Rewards` entry on a campaign level or completion response. Nullables arrive as explicit null. */
interface WireCampaignReward {
  Type: string;
  Amount: number;
  ItemId: number | null;
  RequiredStars: number;
  Name: string | null;
  ImageUrl: string | null;
}

/** One `Levels` entry on GET /Campaign/levels. Guids are lowercase strings, dates ISO-8601. */
interface WireCampaignLevel {
  LevelId: string;
  Order: number;
  Name: string;
  Description: string | null;
  /** CampaignLevelStatus as an int: 0 Locked / 1 Unlocked / 2 Completed. */
  Status: number;
  BestStars: number;
  BestMetrics: { [k: string]: number } | null;
  /** Opaque game-defined config JSON string. NULL while the level is Locked. */
  LevelJsonData: string | null;
  /** Star rules JSON string. NULL while the level is Locked. */
  StarRulesJson: string | null;
  MinDurationSeconds: number;
  ConfigVersion: number;
  Rewards: WireCampaignReward[];
  CompletedAt: string | null;
}

/**
 * GET /Campaign/levels - bare, no envelope. Always 200: an empty/unconfigured campaign comes
 * back as IsAvailable false with Levels [], not as an error status.
 */
interface WireCampaignLevelsResponse {
  IsAvailable: boolean;
  TotalLevels: number;
  CompletedLevels: number;
  TotalStarsEarned: number;
  MaxStars: number;
  Levels: WireCampaignLevel[];
}

/** POST /Campaign/start-level - the 200 body. */
interface WireCampaignStartResponse {
  AttemptId: string;
  LevelId: string;
  ConfigVersion: number;
  StartedAt: string;
}

/**
 * POST /Campaign/complete-level - the 200 body. A LOSS is a normal 200 here (IsWin false,
 * Stars 0); only validation/state failures use the error body.
 */
interface WireCampaignCompletionResponse {
  IsWin: boolean;
  Stars: number;
  BestStars: number;
  IsNewBest: boolean;
  LevelCompletedFirstTime: boolean;
  UnlockedLevelId: string | null;
  Rewards: WireCampaignReward[];
  RewardsGranted: boolean;
  TotalLevels: number;
  CompletedLevels: number;
  TotalStarsEarned: number;
  MaxStars: number;
}

/**
 * The structured error body every /Campaign endpoint uses for non-2xx statuses.
 * `Error` is a CampaignErrorCode identifier; `Message` is human-readable.
 */
interface WireCampaignErrorBody {
  Error: string;
  Message: string;
}

/**
 * Cryptography helper class leveraging the browser Web Crypto API.
 * Produces the encrypted payloads and signatures the Funtico API expects.
 */
export class CryptoHelper {
  private static formatKey(key: string): string {
    if (key.length > 16) {
      return key.substring(0, 16);
    } else if (key.length < 16) {
      return key.padEnd(16, key[0] || '0');
    }
    return key;
  }

  /**
   * Encrypts plaintext using AES-128-CBC with PKCS7 padding and a static IV.
   */
  public static async encrypt(plainText: string, keyStr: string): Promise<string> {
    const formattedKey = this.formatKey(keyStr);
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(formattedKey);
    const ivBytes = encoder.encode("1234567890123456"); // Static 16-byte IV
    const plainBytes = encoder.encode(plainText);

    const cryptoProvider = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const cryptoKey = await cryptoProvider.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-CBC", length: 128 },
      false,
      ["encrypt"]
    );

    const encryptedBuffer = await cryptoProvider.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes },
      cryptoKey,
      plainBytes
    );

    // Convert array buffer to base64
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    let binary = "";
    for (let i = 0; i < encryptedBytes.byteLength; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Decrypts ciphertext using AES-128-CBC with PKCS7 padding and a static IV.
   */
  public static async decrypt(encryptedBase64: string, keyStr: string): Promise<string> {
    const formattedKey = this.formatKey(keyStr);
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(formattedKey);
    const ivBytes = encoder.encode("1234567890123456");
    
    // Decode base64 to binary string then to Uint8Array
    const binaryStr = atob(encryptedBase64);
    const cipherBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      cipherBytes[i] = binaryStr.charCodeAt(i);
    }

    const cryptoProvider = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const cryptoKey = await cryptoProvider.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-CBC", length: 128 },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await cryptoProvider.subtle.decrypt(
      { name: "AES-CBC", iv: ivBytes },
      cryptoKey,
      cipherBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  }

  /**
   * Computes HMAC-SHA256 signature represented as a hex string.
   */
  public static async hmacSha256(message: string, keyStr: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(keyStr);
    const messageBytes = encoder.encode(message);

    const cryptoProvider = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    const key = await cryptoProvider.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"]
    );

    const signature = await cryptoProvider.subtle.sign(
      "HMAC",
      key,
      messageBytes
    );

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

/**
 * Funtico SDK - Core Service Facade.
 */
export class FunticoSDK {
  private static _instance: FunticoSDK | null = null;

  private config!: FunticoConfig;
  private jwtToken: string | null = null;
  private apiUri: string = "";
  /** The Funtico PLATFORM host (user profiles), not the game's Rooms API. See FunticoConfig. */
  private funticoApiUri: string = "";

  // Caching mechanism
  private cachedUserData: UserData | null = null;
  private cachedBalance: BalanceResponse | null = null;
  private cachedVouchers: VoucherData[] | null = null;
  private cachedCampaignAvailability: CampaignAvailabilityViewModel | null = null;
  private cachedCampaignLevels: CampaignLevelsViewModel | null = null;
  private cacheExpiresAt: number = 0;

  // Raw room configs from the last GetRooms call, kept for GetTierByEventId.
  private lastRoomsResponse: WireRoomConfig[] | null = null;

  // Local client session storage (for reconnection and logging events)
  private activeClientSessionDbId: string | null = null;
  private activeClientSessionId: string | null = null; // Stored eventId
  private currentClientSessionId: string | null = null; // Stored saveSessionId
  private currentClientSessionEvents: string[] = [];

  // Campaign attempt tracking (client-side only; set by StartCampaignLevel)
  private activeCampaignAttempt: CampaignAttemptData | null = null;

  // Dedicated server session tracking
  private activeServerSessionId: string | null = null;
  private activeServerSessionEvents: Map<number, string[]> = new Map(); // platformUserId -> eventLogs[]

  private constructor() {}

  public static get Instance(): FunticoSDK {
    if (!this._instance) {
      this._instance = new FunticoSDK();
    }
    return this._instance;
  }

  /**
   * Fail-fast sanity check of the game keys, run before Initialize touches any state.
   *
   * A bad key does not fail where it is passed in: the public key only fails at the first request
   * (auth rejected), and a bad private key survives even that - it is only used to encrypt/sign
   * payloads. A secret for the wrong game/environment usually fails at the first encrypted call
   * (e.g. CreateSession_Client), but some wrong keys only surface as an opaque HTTP 500 ("Padding
   * is invalid and cannot be removed") on /Rooms/end-room-sp, after a whole match has been played.
   * Every rule below catches a mistake that can NEVER work, so it is reported up front with a
   * readable message instead.
   *
   * Deliberately NO format rules (GUID shape, charset, exact length): keys are issued in more than
   * one format. A rule here must never reject a key the platform legitimately issued.
   *
   * Messages never contain the key values themselves (they end up in logs and error trackers);
   * lengths are fine.
   *
   * @throws Error whose message starts with "Invalid FunticoConfig: ".
   */
  private static validateConfig(config: FunticoConfig): void {
    const fail = (reason: string): never => {
      throw new Error(`Invalid FunticoConfig: ${reason}`);
    };

    if (config === null || typeof config !== "object") {
      fail("config must be an object with at least publicGameKey and privateGameKey.");
    }

    const { publicGameKey, privateGameKey } = config;

    if (typeof publicGameKey !== "string" || publicGameKey.length === 0) {
      fail("publicGameKey is missing or empty. Pass the public key from the Developer Portal.");
    }
    if (typeof privateGameKey !== "string" || privateGameKey.length === 0) {
      fail("privateGameKey is missing or empty. Pass the secret key from the Developer Portal.");
    }

    // No issued key has surrounding whitespace; it is almost always a stray newline/CR (or a BOM)
    // from a .env file or a copy-paste. In privateGameKey it silently breaks every encrypted or
    // signed payload. In publicGameKey the effect is less uniform: fetch strips leading/trailing
    // space/tab/CR/LF from the X-User-Key header value, so ordinary requests would still work, but
    // the untrimmed key is also used for X-Server-Key (getServerHeaders), and a BOM or other
    // non-ASCII whitespace (which trim() also catches) makes fetch throw on the header. Both keys
    // are rejected so a broken .env fails fast and consistently.
    // Note: a publicGameKey with a trailing newline used to work for plain requests and is now
    // rejected here.
    if (publicGameKey !== publicGameKey.trim()) {
      fail("publicGameKey has leading or trailing whitespace (a stray newline/CR from a .env file or copy-paste?). Trim it.");
    }
    if (privateGameKey !== privateGameKey.trim()) {
      fail("privateGameKey has leading or trailing whitespace (a stray newline/CR from a .env file or copy-paste?). Trim it.");
    }

    // Every encrypted request needs at least 8 characters of privateGameKey; a shorter key is
    // rejected on every encrypted request, so it can never work.
    if (privateGameKey.length < 8) {
      fail(`privateGameKey is too short (${privateGameKey.length} characters, at least 8 required). Pass the full secret key from the Developer Portal.`);
    }

    if (privateGameKey === publicGameKey) {
      fail("privateGameKey is the same as publicGameKey. Pass the secret key from the Developer Portal in privateGameKey, not the public key.");
    }

    // Auth still works (it only uses the public key), but encrypted/signed payloads are built from
    // the wrong key material, so score submission fails (typically HTTP 500 "Padding is invalid" on
    // end-room-sp). Containment in either direction means the fields were mixed.
    if (privateGameKey.includes(publicGameKey) || publicGameKey.includes(privateGameKey)) {
      fail(`privateGameKey and publicGameKey overlap (privateGameKey is ${privateGameKey.length} characters, publicGameKey is ${publicGameKey.length}); the keys look concatenated or pasted into one field. Pass only the secret key from the Developer Portal in privateGameKey, and the public key alone in publicGameKey.`);
    }
  }

  /**
   * Initializes the Funtico SDK.
   * Automatically performs user authentication if token is provided.
   *
   * The config is validated first (see validateConfig); a rejected config throws before any state
   * is changed, so a previously initialized SDK keeps working with its old config.
   */
  public async Initialize(config: FunticoConfig): Promise<void> {
    FunticoSDK.validateConfig(config);
    this.config = config;
    
    if (config.apiBaseUrl) {
      this.apiUri = config.apiBaseUrl;
    } else {
      this.apiUri = config.env === FunticoEnvironment.STAGING
        ? "https://funtico-sdk-staging.azurewebsites.net"
        : "https://funtico-sdk.azurewebsites.net";
    }

    if (config.funticoApiBaseUrl) {
      this.funticoApiUri = config.funticoApiBaseUrl;
    } else {
      this.funticoApiUri = config.env === FunticoEnvironment.STAGING
        ? "https://staging.api.funtico.com"
        : "https://api.funtico.com";
    }

    if (config.userToken) {
      await this.Authentication(config.userToken);
      await Promise.allSettled([
        this.GetUserData(false),
        this.GetBalance(false),
        this.GetVouchers(false)
      ]);
    }
  }

  /**
   * Exchanges platform token for the game's JWT token.
   */
  public async Authentication(platformToken: string): Promise<any> {
    const response = await fetch(`${this.apiUri}/Auth/funtico-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Key": this.config.publicGameKey
      },
      body: JSON.stringify({ Token: platformToken })
    });

    if (!response.ok) {
      throw new Error(`Funtico Authentication failed: ${await response.text()}`);
    }

    const data = await response.json();
    this.jwtToken = data.Token;
    return data;
  }

  public getPlatformToken(): string {
    return this.config.userToken || "";
  }

  public getUserToken(): string {
    return this.jwtToken || "";
  }

  private getAuthHeaders(includeContentType = true): HeadersInit {
    if (!this.jwtToken) {
      throw new Error("SDK is not authenticated. Call Initialize() or Authentication() first.");
    }
    const headers: Record<string, string> = {
      "X-User-Key": this.config.publicGameKey,
      "Authorization": `Bearer ${this.jwtToken}`
    };
    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  /**
   * Headers for the dedicated-server endpoints.
   *
   * These endpoints require BOTH headers: X-User-Key (the public key) and X-Server-Key, which is
   * computed from the game keys. The private key itself is never sent.
   *
   * Async because Web Crypto's sign() is.
   */
  private async getServerHeaders(): Promise<HeadersInit> {
    const serverKey = await CryptoHelper.hmacSha256(this.config.privateGameKey, this.config.publicGameKey);
    return {
      "Content-Type": "application/json",
      "X-User-Key": this.config.publicGameKey,
      "X-Server-Key": serverKey
    };
  }

  /**
   * Derives the per-user key used to encrypt session payloads. Requires user data to be loaded.
   */
  private getSessionEncryptionKey(): string {
    const userId = this.cachedUserData?.UserId;
    if (userId === undefined) {
      throw new Error("User data is not loaded. Cannot derive session encryption key.");
    }
    const userGuidStr = userId.toString(16).padStart(8, '0');
    const privateKey = this.config.privateGameKey;
    const privateKeyPart = privateKey.substring(privateKey.length - 8);

    return userGuidStr + privateKeyPart;
  }

  /* ================= User Data Methods ================= */

  public async GetUserData(useCache = true): Promise<UserData> {
    if (useCache && this.cachedUserData && Date.now() < this.cacheExpiresAt) {
      return this.cachedUserData;
    }

    const response = await fetch(`${this.apiUri}/User/get-full-data`, {
      headers: this.getAuthHeaders(false)
    });

    if (!response.ok) throw new Error("Failed to fetch user data");

    this.cachedUserData = await response.json();
    this.updateCacheExpiration();
    return this.cachedUserData!;
  }

  public GetCachedUserData(): UserData | null {
    return this.cachedUserData;
  }

  public async GetBalance(useCache = true): Promise<BalanceResponse> {
    if (useCache && this.cachedBalance && Date.now() < this.cacheExpiresAt) {
      return this.cachedBalance;
    }

    const response = await fetch(`${this.apiUri}/User/get-balance`, {
      headers: this.getAuthHeaders(false)
    });

    if (!response.ok) throw new Error("Failed to fetch balance");

    this.cachedBalance = await response.json();
    this.updateCacheExpiration();
    return this.cachedBalance!;
  }

  public GetCachedBalance(): BalanceResponse | null {
    return this.cachedBalance;
  }

  /**
   * Fetches the user's entry vouchers, including how many they hold and their progress toward the
   * next one.
   *
   * Uses /User/vouchers, NOT /User/vouchers-data. The latter is a static catalogue of every voucher
   * that exists ({Name, Image, Id, tier}) and carries no counts at all, so Count, PlayCount and
   * PlaysRequiredToActivate could never be populated from it - which is what UserCanJoinWithVoucher
   * is decided on.
   *
   * Only vouchers the user actually holds come back here, so a tier the user has none of is absent
   * from the list rather than present with Count 0. Either way the result is the same: an absent
   * voucher and a Count-0 voucher both yield UserCanJoinWithVoucher === false.
   */
  public async GetVouchers(useCache = true): Promise<VoucherData[]> {
    if (useCache && this.cachedVouchers && Date.now() < this.cacheExpiresAt) {
      return this.cachedVouchers;
    }

    const response = await fetch(`${this.apiUri}/User/vouchers`, {
      headers: this.getAuthHeaders(false)
    });

    if (!response.ok) throw new Error("Failed to fetch vouchers");

    const payload: WireVouchersResponse = await response.json();
    this.cachedVouchers = (payload.Data ?? []).map(voucher => this.mapVoucher(voucher));
    this.updateCacheExpiration();
    return this.cachedVouchers;
  }

  public GetCachedVouchers(): VoucherData[] | null {
    return this.cachedVouchers;
  }

  public async CanAfford(type: EntryFeeType, amount: number): Promise<boolean> {
    const balance = await this.GetBalance(false);
    return this.evaluateAffordability(balance, type, amount);
  }

  public CanAffordFromCache(type: EntryFeeType, amount: number): boolean {
    if (!this.cachedBalance) return false;
    return this.evaluateAffordability(this.cachedBalance, type, amount);
  }

  private evaluateAffordability(balance: BalanceResponse, type: EntryFeeType, amount: number): boolean {
    switch (type) {
      case EntryFeeType.Free:
        return true;
      case EntryFeeType.IC:
        return balance.Coins >= amount;
      case EntryFeeType.Tico:
        return balance.Diamonds >= amount;
      case EntryFeeType.SemifinalsTickets:
        return balance.SemiFinalTickets >= amount;
      case EntryFeeType.FinalTickets:
        return balance.FinalTickets >= amount;
      case EntryFeeType.PrivateTickets:
        return balance.PrivateTickets >= amount;
      default:
        return false;
    }
  }

  private updateCacheExpiration(): void {
    const ttl = this.config.cacheTTL || 30000;
    this.cacheExpiresAt = Date.now() + ttl;
  }

  /* ================= Rooms Mapping Layer (wire -> ViewModel) =================
   *
   * The endpoints return raw wire shapes (snake_case configs inside PascalCase envelopes); the
   * public models are client-side COMPOSED ViewModels. These helpers are the bridge - without
   * them every field of every returned model reads undefined.
   */

  /**
   * A room is free when it has no ticket type, an explicitly Free one, or costs nothing.
   */
  private isTicketFree(ticket: WireTicket): boolean {
    return ticket.type === null || ticket.type === undefined || ticket.type === TicketType.Free ||
      ticket.currency_amount === null || ticket.currency_amount === undefined ||
      ticket.currency_amount === 0;
  }

  /**
   * The fee the user effectively paid for a seat.
   * A seat paid for with a voucher did not cost its ticket price, so the effective fee becomes the
   * voucher's item rather than the room's ticket. That flips IsFree and zeroes Multiplier (an Item
   * fee has no currency amount to divide by).
   */
  private getYourFee(config: WireRoomConfig, voucherUsed: boolean, vouchers: VoucherData[]): WireTicket {
    if (!voucherUsed) return config.ticket;

    const voucher = vouchers.find(v => v.Tier === config.details.tier);
    if (voucher === undefined) return config.ticket;

    return {
      type: TicketType.Item,
      currency_amount: 1,
      item_id: voucher.ItemId,
      item: { id: voucher.ItemId, image: voucher.ItemImage, name: voucher.ItemName }
    };
  }

  /**
   * Resolves display names/avatars/borders for a set of platform user ids.
   *
   * Hits the PLATFORM host with the user's PLATFORM token - the game JWT is not valid there.
   * Returns a lookup keyed by platform id, EMPTY on any failure: names are cosmetic, so a bad or
   * expired platform token degrades the leaderboard to blank names instead of throwing away a
   * perfectly good set of scores and places.
   */
  private async getUsersInfo(ids: number[]): Promise<Map<number, WirePlatformUser>> {
    const result = new Map<number, WirePlatformUser>();
    if (ids.length === 0) return result;

    const query = ids.map(id => `ids[]=${id}`).join('&');
    try {
      const response = await fetch(`${this.funticoApiUri}/api/v1/web/users?${query}`, {
        headers: { "Authorization": `Bearer ${this.getPlatformToken()}` }
      });
      if (!response.ok) return result;

      const payload: WireUsersInfoResponse = await response.json();
      for (const user of payload.data ?? []) result.set(user.id, user);
    } catch {
      // Network/parse failure - same graceful degrade as a non-ok response.
    }
    return result;
  }

  /**
   * RoomViewModel.EntryFeeUSDT for a room type and tier.
   * External rooms use a different scale from in-platform ones; unknown/Free tiers are worth 0.
   */
  private entryFeeUsdt(roomType: string | null, tier: RoomTier): number {
    if (roomType === 'external') {
      switch (tier) {
        case RoomTier.Contender: return 2;
        case RoomTier.Challenger: return 4;
        case RoomTier.Champion: return 8;
        default: return 0;
      }
    }
    switch (tier) {
      case RoomTier.Contender: return 2;
      case RoomTier.Challenger: return 10;
      case RoomTier.Champion: return 20;
      default: return 0;
    }
  }

  /**
   * Composes a RoomViewModel from a raw room config.
   *
   * `vouchers` must already be loaded - the voucher match drives UserCanJoinWithVoucher, which
   * JoinRoom uses to decide whether to spend a voucher. Pass [] only where there is no user to
   * hold vouchers (GetRoomPublic).
   */
  private mapRoomConfig(config: WireRoomConfig, vouchers: VoucherData[]): RoomViewModel {
    // A null details.tier leaves Tier at its default (0 = Contender). Deliberate.
    const tier: RoomTier = config.details.tier ?? RoomTier.Contender;

    // Matched against the RAW tier, not the defaulted one: a null-tier room matches no voucher.
    const voucher = vouchers.find(v => v.Tier === config.details.tier);

    const room: RoomViewModel = {
      Guid: config.id,
      Name: config.details.name,
      Tier: tier,
      EntryFee: config.ticket.currency_amount ?? 0,
      EntryFeeUSDT: this.entryFeeUsdt(config.type, tier),
      TotalPrize: config.computed.stake - config.computed.platform_fee,
      IsFree: this.isTicketFree(config.ticket),
      RequireKyc: false,
      UserCanJoinWithVoucher:
        voucher !== undefined && voucher.Count > 0 && voucher.PlayCount >= voucher.PlaysRequiredToActivate,
      // Set to true afterwards by GetRooms for any room listed in /Rooms/pre-paid.
      IsPrePaid: false
    };

    if (voucher !== undefined) room.Voucher = voucher;
    // Optional fields are assigned only when the wire actually carried them (non-null).
    if (config.details.description !== null) room.Description = config.details.description;
    if (config.details.has_password !== null) room.HasPassword = config.details.has_password;
    if (config.size !== null) room.RoomSize = config.size;

    return room;
  }

  /** Composes a TierViewModel from a /Rooms/tiers entry. */
  private mapTier(tier: WireTierData): TierViewModel {
    return {
      Tier: tier.tier,
      TierName: tier.name,
      TierImage: tier.image,
      EntryFeeLowerBound: tier.lowerBoundEntryFee,
      EntryFeeUpperBound: tier.upperBoundEntryFee,
      Hidden: tier.hidden
    };
  }

  /** Maps a /User/vouchers entry (snake_case) onto the public PascalCase VoucherData model. */
  private mapVoucher(voucher: WireVoucherData): VoucherData {
    return {
      ItemId: voucher.item_id,
      ItemName: voucher.item_name,
      ItemImage: voucher.item_image,
      Tier: voucher.tier,
      Count: voucher.count,
      PlayCount: voucher.play_count,
      PlaysRequiredToActivate: voucher.plays_required_to_activate
    };
  }

  /**
   * Fresh idempotency key per join attempt.
   *
   * crypto.randomUUID() is only exposed in secure contexts, so it is absent (or throws) on plain
   * HTTP - which games served over http:// do hit. Fall back to getRandomValues, and only then to
   * Math.random, keeping the RFC 4122 v4 layout in every case.
   */
  private newIdempotencyKey(): string {
    const cryptoProvider: Crypto | undefined =
      typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

    if (cryptoProvider && typeof cryptoProvider.randomUUID === 'function') {
      try {
        return cryptoProvider.randomUUID();
      } catch {
        // Not a secure context - fall through.
      }
    }

    const bytes = new Uint8Array(16);
    if (cryptoProvider && typeof cryptoProvider.getRandomValues === 'function') {
      cryptoProvider.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10x

    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-` +
      `${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }

  /** Fetches one bare room config. GET /Rooms/get-room returns it with no envelope. */
  private async getRoomConfig(roomId: string): Promise<WireRoomConfig> {
    const response = await fetch(`${this.apiUri}/Rooms/get-room?roomId=${roomId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch room details");
    return await response.json();
  }

  /* ================= Rooms & Tournament Methods ================= */

  public async GetTiers(): Promise<TierViewModel[]> {
    const response = await fetch(`${this.apiUri}/Rooms/tiers`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch tournament tiers");

    const payload: WireTiersResponse = await response.json();
    return (payload.data ?? []).map(tier => this.mapTier(tier));
  }

  /**
   * Lists rooms of the given type.
   * Vouchers are loaded first so each room's Voucher/UserCanJoinWithVoucher resolve, and the
   * pre-paid list is applied afterwards.
   *
   * The voucher fetch FORCE-REFRESHES (useCache=false). This is not incidental: joining a room
   * SPENDS a voucher, so a cached count goes stale the moment the player enters. Serving a stale
   * Count>0 would leave UserCanJoinWithVoucher true, JoinRoom would derive useVoucher=true, and the
   * server would reject the join - locking the player out of a room they can actually afford.
   */
  public async GetRooms(roomType: number = 0, limit: number = 10): Promise<RoomViewModel[]> {
    const vouchers = await this.GetVouchers(false);

    const response = await fetch(`${this.apiUri}/Rooms/get-rooms?roomType=${roomType}&limit=${limit}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch rooms list");

    const payload: WireRoomsResponse = await response.json();
    const configs = payload.Data ?? [];
    this.lastRoomsResponse = configs;

    const rooms = configs.map(config => this.mapRoomConfig(config, vouchers));
    if (rooms.length === 0) return rooms;

    const prePaid = await this.GetPrePaid();
    for (const prePaidRoom of prePaid) {
      for (const room of rooms) {
        if (room.Guid === prePaidRoom.id) room.IsPrePaid = true;
      }
    }

    return rooms;
  }

  /**
   * Fetches one room as the signed-in user sees it.
   * Force-refreshes vouchers for the same reason GetRooms does - and it matters more here,
   * because JoinRoom calls this to decide whether to spend one.
   */
  public async GetRoom(roomId: string): Promise<RoomViewModel> {
    const vouchers = await this.GetVouchers(false);
    const config = await this.getRoomConfig(roomId);
    return this.mapRoomConfig(config, vouchers);
  }

  /**
   * Fetches a room without a user token (dedicated servers, pre-login screens).
   *
   * Vouchers belong to a user, and this call is unauthenticated, so there are none to match:
   * Voucher stays undefined and UserCanJoinWithVoucher false. Use GetRoom when a user is signed in.
   */
  public async GetRoomPublic(id: string): Promise<RoomViewModel> {
    const response = await fetch(`${this.apiUri}/Rooms/get-room-public?id=${id}`, {
      headers: {
        "X-User-Key": this.config.publicGameKey
      }
    });
    if (!response.ok) throw new Error("Failed to fetch public room details");

    const config: WireRoomConfig = await response.json();
    return this.mapRoomConfig(config, []);
  }

  /**
   * Composes a room's prize table.
   *
   * There is NO endpoint for this - the SDK builds it client-side from the room config.
   */
  public async GetPrizePoolDistribution(roomGuid: string): Promise<PrizePoolDistributionViewModel> {
    const config = await this.getRoomConfig(roomGuid);

    const totalPlayers = config.size ?? 1;
    const totalTicoAccumulated = config.computed.stake;
    const platformFee = config.computed.platform_fee;

    const prizePlaces: PrizePlaceViewModel[] = [];
    let ticoSharedViaPlaces = 0;

    for (const distribution of config.prize_distribution ?? []) {
      const ticoPrize = PrizeUtils.calculatePrize(distribution.prizes, config.computed.deposit_stake);
      ticoSharedViaPlaces += ticoPrize;

      const entryFee = config.ticket.currency_amount;
      const rewardFeeRatio = entryFee !== null && entryFee !== 0 && ticoPrize > 0 ? ticoPrize / entryFee : 0;

      prizePlaces.push({
        Place: distribution.place ?? 0,
        PlatformExp: distribution.xp?.base ?? 0,
        PlatformExpKyc: distribution.xp?.kyc ?? 0,
        RewardFeeRatio: rewardFeeRatio,
        Prizes: distribution.prizes
      });
    }

    return {
      PrizePlaces: prizePlaces,
      TotalTicoAccumulated: totalTicoAccumulated,
      TicoSharedViaPlaces: ticoSharedViaPlaces,
      TotalPlayers: totalPlayers,
      // TicoPerPlayer is an integer division, hence the floor.
      TicoPerPlayer: Math.floor(totalTicoAccumulated / totalPlayers),
      PlatformFeePercentage: config.prize_pool.platform_fee.value ?? 0,
      PlatformFee: platformFee,
      TotalTicoDistributedToPlayers: totalTicoAccumulated - platformFee
    };
  }

  /**
   * Resolves a room's tier from its event id, using the rooms list cached by the last GetRooms
   * call and fetching it first if there is none. Returns null for an unknown event id.
   *
   * @param roomType Which list to populate on a cache miss, matching GetRooms' own parameter
   *                 (0 = singleplayer, 1 = multiplayer). Pass 1 for a multiplayer event id:
   *                 otherwise the miss path fetches singleplayer rooms and the id is never found.
   *                 Defaults to 0 to match GetRooms and keep existing callers working.
   */
  public async GetTierByEventId(eventId: string, roomType: number = 0): Promise<RoomTier | null> {
    if (this.lastRoomsResponse === null) {
      await this.GetRooms(roomType);
    }

    const config = this.lastRoomsResponse?.find(room => room.id === eventId);
    return config?.details.tier ?? null;
  }

  public async GetRoomSettings(eventId: string): Promise<any> {
    const response = await fetch(`${this.apiUri}/Rooms/game-settings?eventId=${eventId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch room settings");
    return await response.json();
  }

  /**
   * Lists the rooms the user has already paid to enter and may still play.
   * GetRooms uses this to set IsPrePaid; call it directly to read attempts_left.
   */
  public async GetPrePaid(): Promise<PrePaidRoomData[]> {
    const response = await fetch(`${this.apiUri}/Rooms/pre-paid`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch pre-paid list");

    const payload: WirePrePaidResponse = await response.json();
    return payload.data ?? [];
  }

  public async GetHistory(page: number, filters?: string, limit = 10, cursor?: string): Promise<any> {
    let url = `${this.apiUri}/Rooms/history?page=${page}&limit=${limit}`;
    if (filters) url += `&filters=${encodeURIComponent(filters)}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch rooms history");
    return await response.json();
  }

  public async GetRoomHistoryDetails(sessionId: string, withEvent = true): Promise<any> {
    const response = await fetch(`${this.apiUri}/Rooms/get-history?sessionId=${sessionId}&withEvent=${withEvent}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch detailed room history");
    return await response.json();
  }

  /** Fetches the raw leaders payload. GET /Rooms/leaders returns it with no envelope. */
  private async getRoomLeaders(eventId: string, sessionId: string, matchId?: string): Promise<WireRoomLeadersResponse> {
    let url = `${this.apiUri}/Rooms/leaders?eventId=${eventId}&session_or_match_id=${sessionId}`;
    if (matchId) url += `&matchId=${matchId}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch leaderboard");
    return await response.json();
  }

  /**
   * Composes the end-of-room leaderboard.
   *
   * /Rooms/leaders alone answers almost none of this model: it carries ids, scores and places, but
   * the room's name/tier/fee live on the room config, the players' names live on the PLATFORM host,
   * and whether you paid with a voucher lives on the session history. So this fans out to all four
   * and joins them. The three independent legs run concurrently; only the name lookup is
   * sequential, because it needs the ids that /Rooms/leaders returns.
   *
   * Behaviour worth knowing:
   *   - LeaderboardItems is always populated (possibly empty), even when you are not on the board
   *     (a spectator).
   *   - Your prizes always come from the room's prize_distribution for your place, not from the
   *     leader's own `prizes`: a placed (unsettled) room reports `prizes: []` on every leader, so
   *     the distribution is the only source that can answer "what did I win" before settlement.
   */
  public async GetLeaderboard(eventId: string, sessionId: string, matchId?: string): Promise<RoomLeaderboardViewModel> {
    const [leaders, history, config, user] = await Promise.all([
      this.getRoomLeaders(eventId, sessionId, matchId),
      this.GetRoomHistoryDetails(sessionId, false) as Promise<WireSessionHistoryResponse>,
      this.getRoomConfig(eventId),
      this.GetUserData()
    ]);

    const names = await this.getUsersInfo((leaders.leaders ?? []).map(leader => leader.id));

    // A voucher-paid seat only changes the fee if we can still find the voucher it was paid with,
    // so the lookup is skipped entirely when the seat was paid for in currency.
    const voucherUsed = history.game_session?.voucher_used === true;
    let vouchers: VoucherData[] = [];
    if (voucherUsed) {
      try {
        vouchers = await this.GetVouchers();
      } catch {
        // Fee falls back to the room's ticket, exactly as it does for an unmatched voucher.
      }
    }

    const state: LeadersState = leaders.state;
    const yourFee = this.getYourFee(config, voucherUsed, vouchers);

    const items: LeaderboardItemViewModel[] = (leaders.leaders ?? []).map(leader => {
      const item: LeaderboardItemViewModel = {
        Place: leader.place,
        PlayerName: names.get(leader.id)?.name ?? "",
        Score: leader.score,
        UserId: leader.id
      };
      const avatarUrl = names.get(leader.id)?.avatar?.url;
      if (avatarUrl !== undefined) item.AvatarUrl = avatarUrl;
      return item;
    });

    // `id` on a leader is the PLATFORM id, so it joins against PlatformId - matching it against
    // UserData.UserId would silently never find you and report every player as unplaced.
    const you = (leaders.leaders ?? []).find(leader => leader.id === user.PlatformId);
    const yourPrizes = you !== undefined
      ? (config.prize_distribution ?? []).find(dist => dist.place === you.place)?.prizes ?? []
      : [];
    const yourTicoEarnings = PrizeUtils.calculatePrize(yourPrizes, config.computed.deposit_stake);

    return {
      State: state,
      IsPending: state === LeadersState.placed,
      ClosedUnsuccessfully: state === LeadersState.returned || state === LeadersState.to_be_returned,
      RoomName: config.details.name,
      // A null tier defaults to Challenger here - note this is a DIFFERENT default from
      // mapRoomConfig's Contender. Both are deliberate; do not reconcile them.
      RoomTier: config.details.tier ?? RoomTier.Challenger,
      IsFree: this.isTicketFree(yourFee),
      YourTicoEarnings: yourTicoEarnings,
      Multiplier: yourFee.type === TicketType.Currency && yourFee.currency_amount
        ? yourTicoEarnings / yourFee.currency_amount
        : 0,
      UserPlace: you !== undefined ? String(you.place) : "0",
      LeaderboardItems: items
    };
  }

  /**
   * Joins a room and returns the session to play it under.
   *
   * Two legs:
   *   1. POST /Rooms/join-room reserves the seat and hands back a short-lived lobby quote.
   *   2. POST /Rooms/start-room-sp converts that quote into the real game session.
   * A player who had already joined skips leg 2 - the server returns their existing session on
   * leg 1 and there is no quote to convert.
   *
   * `idempotencyKey` is a REQUIRED query param: without it the request is rejected with a 400.
   * A fresh key per call is what makes the retry safe.
   *
   * @param useVoucher Spend a free-entry voucher instead of the entry fee. Omit to let the room
   *                   decide via UserCanJoinWithVoucher, which is what the platform UI does.
   */
  public async JoinRoom(roomGuid: string, useVoucher?: boolean): Promise<RoomSessionData> {
    let spendVoucher = useVoucher;
    if (spendVoucher === undefined) {
      const room = await this.GetRoom(roomGuid);
      spendVoucher = room.UserCanJoinWithVoucher;
    }

    const url = `${this.apiUri}/Rooms/join-room?idempotencyKey=${this.newIdempotencyKey()}&getLobbyQuote=true`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({
        tournamentId: roomGuid,
        communityId: null,
        password: '',
        UseVoucher: spendVoucher
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to join room: ${await response.text()}`);
    }

    const joinResponse: WireJoinRoomResponse = await response.json();

    // Comes back as null (not "") on a first join, so null and blank both mean "not yet joined".
    const existingSession = joinResponse.game_session_id_or_match_id;
    if (typeof existingSession === 'string' && existingSession.trim().length > 0) {
      return { EventId: roomGuid, SessionOrMatchId: existingSession };
    }

    const lobbyQuoteId = joinResponse.lobby_quote?.id;
    if (!lobbyQuoteId) {
      // A locally generated id would only be rejected by the server, so fail loudly instead.
      throw new Error("Failed to join room: the server returned neither an existing session nor a lobby quote");
    }

    // StartRoomSP already returns RoomSessionData keyed on the eventId it was passed (roomGuid),
    // so this is the value JoinRoom promises - no re-wrapping needed.
    return await this.StartRoomSP(roomGuid, lobbyQuoteId, true);
  }

  /**
   * Signals the server that gameplay has started, and resolves the session to play under.
   *
   * Returns the public RoomSessionData rather than the raw wire object: WireJoinRoomResponse is
   * internal and unexported, so a TypeScript game could not name this method's return type and
   * had to reach for the wire's `.id` itself. The wire block stays internal; `.id` is mapped onto
   * SessionOrMatchId here, which is the same value JoinRoom hands back.
   *
   * @param isLobby Declares that `sessionOrMatchId` is a lobby-quote id rather than an existing
   *                game-session id - it is not a mode switch. JoinRoom's second leg passes true;
   *                a caller resuming a session it already owns leaves it false.
   */
  public async StartRoomSP(eventId: string, sessionOrMatchId: string, isLobby = false): Promise<RoomSessionData> {
    const url = `${this.apiUri}/Rooms/start-room-sp?eventId=${eventId}&sessionOrMatchId=${sessionOrMatchId}&isLobby=${isLobby}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(false)
    });

    if (!response.ok) throw new Error("Failed to start gameplay session");

    const started: WireJoinRoomResponse = await response.json();
    return { EventId: eventId, SessionOrMatchId: started.id };
  }

  /**
   * Ends a room session and sends the player's encrypted score to the game API (Client-side).
   *
   * The score is encrypted and signed with privateGameKey. If this fails with HTTP 500 "Padding is
   * invalid and cannot be removed", the privateGameKey is wrong.
   */
  public async EndRoomSP(
    eventId: string,
    sessionOrMatchId: string,
    score: number,
    userId: number,
    ip = "127.0.0.1",
    gameEvents: string[] = []
  ): Promise<any> {
    const scorePayload = {
      // Score must be an integer: a fractional value fails with HTTP 500 rather than a validation
      // error. Truncate before it leaves the client.
      Score: Math.trunc(score),
      UserId: userId,
      Ip: ip,
      GameEvents: gameEvents.length > 0 ? gameEvents : this.currentClientSessionEvents
    };

    const plainText = JSON.stringify(scorePayload);
    const encryptionKey = sessionOrMatchId.substring(0, 8) + this.config.privateGameKey.substring(0, 8);
    const encryptedData = await CryptoHelper.encrypt(plainText, encryptionKey);

    const hashKey = this.config.privateGameKey.substring(8);
    const hash = await CryptoHelper.hmacSha256(encryptedData, hashKey);

    const response = await fetch(`${this.apiUri}/Rooms/end-room-sp?eventId=${eventId}&gameSessionIrOrMatchId=${sessionOrMatchId}`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({
        TournamentId: eventId,
        Hash: hash,
        EncryptedData: encryptedData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to end gameplay session: ${await response.text()}`);
    }

    // Auto-close client session locally
    this.CloseCurrentSession_Client();

    return await response.json();
  }

  /* ================= Special Tournaments Methods ================= */

  /**
   * Aliases the tournament identifier onto `Id`/`Guid`.
   *
   * The wire's own `Id` is always 0 and is not accepted by any endpoint; the usable identifier is
   * `Plaftorfm_Guid`. Spreading the wire object first means every field the platform sends survives
   * untouched - this only adds names, it never drops or renames anything.
   */
  private mapTournament<T extends TournamentViewModel>(wire: any): T {
    return { ...wire, Id: wire.Plaftorfm_Guid, Guid: wire.Plaftorfm_Guid } as T;
  }

  /**
   * Aliases Points -> Score, Name -> UserName and user_avatar.url -> AvatarUrl.
   * Same rule as mapTournament: additive only, the raw wire fields stay on the object.
   */
  private mapTournamentPlayer(wire: any): TournamentPlayerViewModel {
    return {
      ...wire,
      Score: wire.Points,
      UserName: wire.Name,
      AvatarUrl: wire.user_avatar?.url
    } as TournamentPlayerViewModel;
  }

  public async GetTournaments(page = 1, perPage = 100, filter?: TournamentsFilterEnum): Promise<TournamentViewModel[]> {
    let url = `${this.apiUri}/SpecialTournaments/all-tournaments?page=${page}&perPage=${perPage}`;
    if (filter) url += `&filterEnum=${filter}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch special tournaments");
    const wire: any[] = await response.json();
    return wire.map(t => this.mapTournament<TournamentViewModel>(t));
  }

  public async GetTournamentDetailsLight(tournamentId: string): Promise<TournamentViewModel> {
    const response = await fetch(`${this.apiUri}/SpecialTournaments/light-tournament-details?tournamentId=${tournamentId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch tournament metadata");
    return this.mapTournament<TournamentViewModel>(await response.json());
  }

  public async GetTournamentLeaderboard(tournamentId: string): Promise<TournamentLeaderboardViewModel> {
    const response = await fetch(`${this.apiUri}/SpecialTournaments/get-special-tournament-leaderboard?tournamentId=${tournamentId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch tournament leaderboard");
    const wire: any = await response.json();

    const view = this.mapTournament<TournamentLeaderboardViewModel>(wire);
    view.Players = (wire.Players ?? []).map((p: any) => this.mapTournamentPlayer(p));
    view.CurrentPlayer = wire.CurrentPlayer ? this.mapTournamentPlayer(wire.CurrentPlayer) : undefined;
    return view;
  }

  public async GetTournamentCommunities(tournamentId: string): Promise<TournamentCommunityViewModel[]> {
    const response = await fetch(`${this.apiUri}/SpecialTournaments/get-tournaments-communities?tournamentId=${tournamentId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch tournament communities");
    return await response.json();
  }

  /**
   * Joins a special tournament. Must be called before EnterTournament — the platform rejects an
   * enter with "Tournament score/session not found. Use join endpoint to join the tournament."
   * until a join has landed. A fresh join is also required after each scored enter.
   */
  public async JoinTournament(tournamentId: string, communityId?: string, password?: string): Promise<boolean> {
    let url = `${this.apiUri}/SpecialTournaments/join-tournament?tournamentId=${tournamentId}`;
    if (communityId) url += `&communityId=${communityId}`;
    if (password) url += `&password=${encodeURIComponent(password)}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to join special tournament");

    // A success is `200 text/plain: Success, now you can play` - NOT JSON, so it is read as text.
    await response.text();
    return response.ok;
  }

  public async EnterTournament(tournamentId: string): Promise<TournamentEnterData> {
    const response = await fetch(`${this.apiUri}/SpecialTournaments/enter-tournament?tournamentId=${tournamentId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to enter special tournament");
    const wire: any = await response.json();

    // The wire spells it LocalTournamentUUID (all caps); alias it onto the declared camel spelling.
    // Additive - the raw keys stay on the object.
    return { ...wire, LocalTournamentUuid: wire.LocalTournamentUUID };
  }

  /**
   * Fetches a tournament's prize table.
   * Returns an object wrapping the place list; `Prizes` is empty when the tournament has no prizes.
   */
  public async GetPrizes(tournamentId: string): Promise<TournamentPrizesViewModel> {
    const response = await fetch(`${this.apiUri}/SpecialTournaments/get-prizes?tournamentId=${tournamentId}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch tournament prizes");
    return await response.json();
  }

  public async GetTournamentsHistory(page = 1, perPage = 10): Promise<TournamentHistoryViewModel> {
    const response = await fetch(`${this.apiUri}/SpecialTournaments/history?page=${page}&per_page=${perPage}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch tournament history");
    const wire: any = await response.json();

    // Wire is {data, meta} with snake_case members throughout; alias to the declared names.
    // Spread-first so the raw keys survive alongside the aliases.
    const entries: TournamentHistoryEntry[] = (wire.data ?? []).map((e: any) => ({
      ...e,
      TournamentName: e.tournament_name,
      TournamentUuid: e.tournament_uuid,
      StartsAt: e.starts_at,
      EndsAt: e.ends_at,
      ScoredAt: e.scored_at,
      IsFinished: e.is_finished,
      BestScore: e.best_score,
      LeaderboardPlace: e.leaderboard_place,
      EntriesCount: e.entries_count,
      MaxEntries: e.max_entries,
      GameId: e.game_id,
      MapId: e.map_id,
      Prizes: (e.prizes ?? []).map((p: any) => ({
        ...p,
        Name: p.name,
        Amount: p.amount,
        ImageUrl: p.image_url,
        IsRedeemed: p.is_redeemed
      }))
    }));

    return {
      ...wire,
      Entries: entries,
      Meta: wire.meta
        ? {
            ...wire.meta,
            CurrentPage: wire.meta.current_page,
            LastPage: wire.meta.last_page,
            PerPage: wire.meta.per_page,
            Total: wire.meta.total,
            From: wire.meta.from,
            To: wire.meta.to
          }
        : undefined
    };
  }

  /**
   * Submits a special tournament game result from a trusted Dedicated Server.
   */
  public async ResultTournament_Server(
    tournamentId: string,
    saveScoreId: string,
    score: number,
    userId: number,
    isSuccess: boolean,
    ip = "0.0.0.0"
  ): Promise<TournamentResultViewModel> {
    const requestPayload = {
      UserId: userId,
      Score: score,
      IsSuccess: isSuccess,
      Ip: ip
    };

    const response = await fetch(`${this.apiUri}/SpecialTournaments/result-tournament?tournamentId=${tournamentId}&saveScoreId=${saveScoreId}`, {
      method: "POST",
      headers: await this.getServerHeaders(),
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to submit server tournament result: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Submits an encrypted special tournament game result from a Client build.
   */
  public async ResultTournament_Client(
    tournamentId: string,
    saveScoreId: string,
    score: number,
    isSuccess: boolean,
    customData = ""
  ): Promise<boolean> {
    const scorePayload = {
      // Truncated for the same reason as EndRoomSP: Score must be an integer.
      Score: Math.trunc(score),
      IsSuccess: isSuccess,
      CustomData: customData,
      GameEvents: this.currentClientSessionEvents
    };

    const plainText = JSON.stringify(scorePayload);
    // Encryption key derived from saveScoreId and privateGameKey
    const encryptionKey = saveScoreId.substring(0, 8) + this.config.privateGameKey.substring(0, 8);
    const encryptedData = await CryptoHelper.encrypt(plainText, encryptionKey);

    // Signature key derived from privateGameKey
    const hashKey = this.config.privateGameKey.substring(8);
    const hash = await CryptoHelper.hmacSha256(encryptedData, hashKey);

    const response = await fetch(`${this.apiUri}/SpecialTournaments/result-tournament-client?tournamentId=${tournamentId}&saveScoreId=${saveScoreId}`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({
        EncryptedData: encryptedData,
        Hash: hash
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to submit client tournament result: ${await response.text()}`);
    }

    this.CloseCurrentSession_Client();
    return await response.json(); // returns boolean success
  }

  /* ================= Hall of Fame Methods ================= */

  /**
   * Fetches a page of the Hall of Fame ranking.
   * @param mode     Global (all-time) or Monthly (current calendar month, UTC).
   * @param page     1-based page index.
   * @param limit    Entries per page.
   * @param gameMode Restricts the ranking to a single mode; All applies no filter.
   */
  public async GetHallOfFame(
    mode: HallOfFamePeriodMode,
    page = 1,
    limit = 10,
    gameMode: HallOfFameGameModeFilter = HallOfFameGameModeFilter.All
  ): Promise<HallOfFameResponse> {
    let path: string;
    switch (mode) {
      case HallOfFamePeriodMode.Global:
        path = "global";
        break;
      case HallOfFamePeriodMode.Monthly:
        path = "monthly";
        break;
      default:
        throw new Error(`Unsupported Hall of Fame period mode: ${mode}`);
    }

    let url = `${this.apiUri}/HallOfFame/${path}?page=${page}&limit=${limit}`;
    if (gameMode !== HallOfFameGameModeFilter.All) {
      url += `&gameMode=${this.mapHallOfFameGameMode(gameMode)}`;
    }

    const response = await fetch(url, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch Hall of Fame leaderboard");
    return await response.json();
  }

  /**
   * Fetches the Hall of Fame prize distribution table.
   */
  public async GetHallOfFameDistribution(): Promise<HOFDistributionResponse> {
    const response = await fetch(`${this.apiUri}/HallOfFame/distribution`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to fetch Hall of Fame distribution");
    return await response.json();
  }

  private mapHallOfFameGameMode(gameMode: HallOfFameGameModeFilter): HallOfFameGameMode {
    switch (gameMode) {
      case HallOfFameGameModeFilter.SpecialTournament:
        return HallOfFameGameMode.SpecialTournament;
      case HallOfFameGameModeFilter.Rooms:
        return HallOfFameGameMode.Rooms;
      case HallOfFameGameModeFilter.Practice:
        return HallOfFameGameMode.Practice;
      default:
        throw new Error(`Unsupported Hall of Fame game mode filter: ${gameMode}`);
    }
  }

  /* ================= Campaign Methods ================= */

  /**
   * Fetches whether this game has a campaign configured, plus its headline numbers.
   *
   * "No campaign" is DATA here, not an error: the endpoint always answers 200 and reports
   * IsAvailable false for a game without one. Gate the campaign menu button on the flag rather
   * than wrapping this call in try/catch for that case - a rejection means a real failure.
   *
   * Works BEFORE authentication: the endpoint does not require sign-in, so a pre-login menu can
   * gate its campaign button - only the game key is required. The JWT is attached when
   * one exists, but its absence does not throw, unlike every other Campaign method.
   *
   * Shares the SDK-wide cache window (FunticoConfig.cacheTTL) with the other cached getters.
   */
  public async GetCampaignAvailability(useCache = true): Promise<CampaignAvailabilityViewModel> {
    if (useCache && this.cachedCampaignAvailability && Date.now() < this.cacheExpiresAt) {
      return this.cachedCampaignAvailability;
    }

    // Deliberately NOT getAuthHeaders: that helper throws with no JWT, and no-JWT is exactly
    // the pre-login state this endpoint exists to serve.
    const headers: Record<string, string> = { "X-User-Key": this.config.publicGameKey };
    if (this.jwtToken) {
      headers["Authorization"] = `Bearer ${this.jwtToken}`;
    }

    const response = await fetch(`${this.apiUri}/Campaign/availability`, {
      headers
    });
    if (!response.ok) await this.throwCampaignError(response, "Failed to fetch campaign availability");

    const wire: WireCampaignAvailability = await response.json();
    const availability = this.mapCampaignAvailability(wire);
    this.cachedCampaignAvailability = availability;
    this.updateCacheExpiration();
    return availability;
  }

  /** Returns the availability already held in memory - no network call, no TTL check. */
  public GetCachedCampaignAvailability(): CampaignAvailabilityViewModel | null {
    return this.cachedCampaignAvailability;
  }

  /** Convenience shorthand for `(await GetCampaignAvailability(useCache)).IsAvailable`. */
  public async IsCampaignAvailable(useCache = true): Promise<boolean> {
    return (await this.GetCampaignAvailability(useCache)).IsAvailable;
  }

  /**
   * Fetches the campaign level list with the player's progress folded in.
   *
   * Always a 200 on the wire - an empty campaign comes back as IsAvailable false with Levels []
   * - so a rejection here is a real failure, not "no campaign". A Locked level arrives with its
   * LevelConfigJson and StarRules deliberately withheld (null); render it as a lock icon from
   * Status and BestStars alone.
   *
   * The cached copy is dropped automatically by a successful CompleteCampaignLevel, because a
   * completion can unlock the next level server-side - refetch after completing to render the
   * unlock cascade.
   */
  public async GetCampaignLevels(useCache = true): Promise<CampaignLevelsViewModel> {
    if (useCache && this.cachedCampaignLevels && Date.now() < this.cacheExpiresAt) {
      return this.cachedCampaignLevels;
    }

    const response = await fetch(`${this.apiUri}/Campaign/levels`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) await this.throwCampaignError(response, "Failed to fetch campaign levels");

    const wire: WireCampaignLevelsResponse = await response.json();
    const levels: CampaignLevelsViewModel = {
      IsAvailable: wire.IsAvailable,
      TotalLevels: wire.TotalLevels,
      CompletedLevels: wire.CompletedLevels,
      TotalStarsEarned: wire.TotalStarsEarned,
      MaxStars: wire.MaxStars,
      Levels: (wire.Levels ?? []).map(level => this.mapCampaignLevel(level))
    };
    this.cachedCampaignLevels = levels;
    this.updateCacheExpiration();
    return levels;
  }

  /** Returns the level list already held in memory - no network call, no TTL check. */
  public GetCachedCampaignLevels(): CampaignLevelsViewModel | null {
    return this.cachedCampaignLevels;
  }

  /**
   * Parses a level's opaque config JSON into your game's own type.
   *
   * The schema is YOUR game's - the platform stores the string untouched and the SDK never
   * inspects it, so define your own interface and pass it as T. Throws a plain Error when the
   * level is still Locked (the server withholds the config until unlock) or when the stored
   * string is not valid JSON.
   */
  public GetCampaignLevelConfig<T = unknown>(level: CampaignLevelViewModel): T {
    if (level.LevelConfigJson === null) {
      throw new Error(
        `Campaign level "${level.Name}" has no config to parse - it is still locked, so the server withheld LevelConfigJson.`
      );
    }
    try {
      return JSON.parse(level.LevelConfigJson) as T;
    } catch {
      throw new Error(`Campaign level "${level.Name}" carries a config that is not valid JSON.`);
    }
  }

  /**
   * Starts an attempt at a level and tracks it as THE active attempt.
   *
   * Re-starting - the same level or another - simply replaces the tracked attempt: the server
   * abandons the old one, so there is nothing to clean up client-side. Rejects with a
   * CampaignError (LevelLocked, LevelNotFound, CampaignNotAvailable) when the level cannot be
   * started.
   */
  public async StartCampaignLevel(levelId: string): Promise<CampaignAttemptData> {
    const response = await fetch(`${this.apiUri}/Campaign/start-level?levelId=${levelId}`, {
      method: "POST",
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) await this.throwCampaignError(response, "Failed to start campaign level");

    const wire: WireCampaignStartResponse = await response.json();
    const attempt: CampaignAttemptData = {
      AttemptId: wire.AttemptId,
      LevelId: wire.LevelId,
      ConfigVersion: wire.ConfigVersion,
      StartedAt: wire.StartedAt
    };
    this.activeCampaignAttempt = attempt;
    return attempt;
  }

  /** The attempt StartCampaignLevel is currently tracking, or null when none is in flight. */
  public GetActiveCampaignAttempt(): CampaignAttemptData | null {
    return this.activeCampaignAttempt;
  }

  /**
   * Clears the tracked attempt LOCALLY - no server call. There is no abandon endpoint; the
   * server-side attempt simply lapses, or is replaced by the next StartCampaignLevel.
   */
  public AbandonCampaignAttempt(): void {
    this.activeCampaignAttempt = null;
  }

  /**
   * Submits a finished run's metrics, encrypted and signed, and returns the graded outcome.
   *
   * Losing is a NORMAL resolution (IsWin false, Stars 0), not a rejection - render the defeat
   * screen from the returned result. Stars are computed SERVER-side from the level's star
   * rules; nothing the client sends can claim them directly.
   *
   * Metrics are validated and normalized BEFORE anything is encrypted (violations throw a
   * CampaignError with Code InvalidMetrics client-side): 1-32 entries, each name 1-64 chars,
   * each value a finite number or a boolean. Booleans become 1/0; numbers pass through
   * UNTRUNCATED - fractional values are legal, unlike EndRoomSP's int Score.
   *
   * Events recorded via RecordEvent_Client are folded into the encrypted payload, the same way
   * EndRoomSP folds them into a room score; the log is reset once a submission delivers them.
   *
   * On failure the tracked attempt survives only for retryable failures (network, Unknown).
   * AttemptNotFound and CompletionTooFast both leave the server-side attempt dead - unknown,
   * or abandoned by the too-fast rejection itself - so a retry can never succeed and tracking
   * is cleared before rethrowing. On success the attempt is consumed and the cached level list
   * is dropped: the unlock cascade is server business, so the next GetCampaignLevels refetches.
   *
   * @param attempt Submit against this attempt instead of the tracked one - e.g. one restored
   *                from your own storage after a reload. Omit it to use the attempt
   *                StartCampaignLevel tracked; with neither, throws CampaignError with Code
   *                NoActiveAttempt before any I/O. Completing a passed attempt never clobbers
   *                a DIFFERENT attempt the SDK is tracking.
   */
  public async CompleteCampaignLevel(metrics: CampaignMetrics, attempt?: CampaignAttemptData): Promise<CampaignCompletionResult> {
    const activeAttempt = attempt ?? this.activeCampaignAttempt;
    if (!activeAttempt) {
      throw new CampaignError(
        CampaignErrorCode.NoActiveAttempt,
        "No active campaign attempt to complete. Call StartCampaignLevel first, or pass the attempt explicitly."
      );
    }

    const normalizedMetrics = this.normalizeCampaignMetrics(metrics);

    // Same encrypt-and-sign scheme as EndRoomSP, with the attempt id standing in for
    // sessionOrMatchId.
    const plainText = JSON.stringify({
      AttemptId: activeAttempt.AttemptId,
      LevelId: activeAttempt.LevelId,
      Metrics: normalizedMetrics,
      GameEvents: this.currentClientSessionEvents
    });
    const encryptionKey = activeAttempt.AttemptId.substring(0, 8) + this.config.privateGameKey.substring(0, 8);
    const encryptedData = await CryptoHelper.encrypt(plainText, encryptionKey);

    const hashKey = this.config.privateGameKey.substring(8);
    const hash = await CryptoHelper.hmacSha256(encryptedData, hashKey);

    const response = await fetch(`${this.apiUri}/Campaign/complete-level`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({
        AttemptId: activeAttempt.AttemptId,
        EncryptedData: encryptedData,
        Hash: hash
      })
    });

    if (!response.ok) {
      try {
        await this.throwCampaignError(response, "Failed to complete campaign level");
      } catch (error) {
        // AttemptNotFound and CompletionTooFast both mean the server-side attempt is dead
        // (unknown, or abandoned by the too-fast rejection itself), so a retry can never
        // succeed - stop tracking it. Only OUR tracked attempt though: completing an
        // explicitly passed attempt must not clobber a different tracked one. Network and
        // Unknown failures keep the attempt so the game may retry.
        const attemptIsDead = error instanceof CampaignError &&
          (error.Code === CampaignErrorCode.AttemptNotFound ||
            error.Code === CampaignErrorCode.CompletionTooFast);
        if (attemptIsDead && this.activeCampaignAttempt?.AttemptId === activeAttempt.AttemptId) {
          this.activeCampaignAttempt = null;
        }
        throw error;
      }
    }

    const wire: WireCampaignCompletionResponse = await response.json();
    const result = this.mapCampaignCompletion(wire);

    // Clear tracking only when the completed attempt IS the tracked one - completing an
    // explicitly passed attempt must not clobber a different tracked attempt.
    if (this.activeCampaignAttempt?.AttemptId === activeAttempt.AttemptId) {
      this.activeCampaignAttempt = null;
    }
    // events were delivered in this submission; the client session itself is untouched
    this.currentClientSessionEvents = [];
    // The unlock cascade happened server-side; a stale list would keep the next level rendered
    // as Locked, so the cache is dropped rather than patched.
    this.cachedCampaignLevels = null;
    if (this.cachedCampaignAvailability) {
      this.cachedCampaignAvailability.LevelCount = result.TotalLevels;
      this.cachedCampaignAvailability.MaxStars = result.MaxStars;
    }
    this.updateCacheExpiration();

    return result;
  }

  /**
   * Validates the metrics contract and normalizes values for the wire.
   * Throws CLIENT-side with the same InvalidMetrics code the server would answer with, so a
   * game handles both origins through one branch.
   */
  private normalizeCampaignMetrics(metrics: CampaignMetrics): Record<string, number> {
    const entries = Object.entries(metrics ?? {});
    if (entries.length < 1 || entries.length > 32) {
      throw new CampaignError(
        CampaignErrorCode.InvalidMetrics,
        `Campaign metrics must carry 1-32 entries; got ${entries.length}`
      );
    }

    const normalized: Record<string, number> = {};
    for (const [name, value] of entries) {
      if (name.length < 1 || name.length > 64) {
        throw new CampaignError(
          CampaignErrorCode.InvalidMetrics,
          `Campaign metric name "${name}" must be 1-64 characters`
        );
      }
      if (typeof value === 'boolean') {
        normalized[name] = value ? 1 : 0;
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        // Deliberately NOT truncated: fractional metrics are legal - this is the one
        // score-like payload where Math.trunc would corrupt data.
        normalized[name] = value;
      } else {
        throw new CampaignError(
          CampaignErrorCode.InvalidMetrics,
          `Campaign metric "${name}" must be a finite number or a boolean`
        );
      }
    }
    return normalized;
  }

  /**
   * Reads a non-2xx Campaign response and throws the matching CampaignError.
   * The body contract is {Error, Message}; an unrecognised identifier or an unparsable body
   * maps to CampaignErrorCode.Unknown with whatever text was readable.
   */
  private async throwCampaignError(response: Response, fallback: string): Promise<never> {
    const text = await response.text();
    let code = CampaignErrorCode.Unknown;
    let message = text || `HTTP ${response.status}`;

    try {
      const parsed: WireCampaignErrorBody | null = JSON.parse(text);
      if (parsed && typeof parsed.Error === 'string' &&
        (Object.values(CampaignErrorCode) as string[]).includes(parsed.Error)) {
        code = parsed.Error as CampaignErrorCode;
      }
      if (parsed && typeof parsed.Message === 'string') {
        message = parsed.Message;
      }
    } catch {
      // Not a JSON body - keep the raw text under the Unknown code.
    }

    throw new CampaignError(code, `${fallback}: ${message}`);
  }

  private mapCampaignAvailability(wire: WireCampaignAvailability): CampaignAvailabilityViewModel {
    return {
      IsAvailable: wire.IsAvailable,
      LevelCount: wire.LevelCount,
      MaxStars: wire.MaxStars
    };
  }

  /**
   * Composes the public level model from the wire shape.
   * LevelJsonData is renamed onto LevelConfigJson, and StarRulesJson is PARSED into StarRules -
   * with a try/catch, so one level's garbage rules cannot kill the whole list.
   */
  private mapCampaignLevel(wire: WireCampaignLevel): CampaignLevelViewModel {
    return {
      Id: wire.LevelId,
      Order: wire.Order,
      Name: wire.Name,
      Description: wire.Description,
      Status: this.mapCampaignLevelStatus(wire.Status),
      BestStars: wire.BestStars,
      BestMetrics: wire.BestMetrics,
      LevelConfigJson: wire.LevelJsonData,
      StarRules: this.parseCampaignStarRules(wire.StarRulesJson),
      MinDurationSeconds: wire.MinDurationSeconds,
      ConfigVersion: wire.ConfigVersion,
      Rewards: (wire.Rewards ?? []).map(reward => this.mapCampaignReward(reward)),
      CompletedAt: wire.CompletedAt
    };
  }

  /** Strict on purpose: an unknown status int is a contract break, not something to default. */
  private mapCampaignLevelStatus(status: number): CampaignLevelStatus {
    switch (status) {
      case 0:
        return CampaignLevelStatus.Locked;
      case 1:
        return CampaignLevelStatus.Unlocked;
      case 2:
        return CampaignLevelStatus.Completed;
      default:
        throw new Error(`Unknown campaign level status: ${status}`);
    }
  }

  /** Null in, null out - and null on garbage too: locked levels and bad JSON both render ruleless. */
  private parseCampaignStarRules(json: string | null): CampaignStarRules | null {
    if (json === null) return null;
    try {
      const parsed = JSON.parse(json);
      if (parsed === null || typeof parsed !== 'object') return null;
      return {
        Win: Array.isArray(parsed.Win) ? parsed.Win : [],
        Stars: Array.isArray(parsed.Stars) ? parsed.Stars : []
      };
    } catch {
      return null;
    }
  }

  private mapCampaignReward(wire: WireCampaignReward): CampaignRewardViewModel {
    return {
      Type: wire.Type,
      Amount: wire.Amount,
      ItemId: wire.ItemId,
      RequiredStars: wire.RequiredStars,
      Name: wire.Name,
      ImageUrl: wire.ImageUrl
    };
  }

  private mapCampaignCompletion(wire: WireCampaignCompletionResponse): CampaignCompletionResult {
    return {
      IsWin: wire.IsWin,
      Stars: wire.Stars,
      BestStars: wire.BestStars,
      IsNewBest: wire.IsNewBest,
      LevelCompletedFirstTime: wire.LevelCompletedFirstTime,
      UnlockedLevelId: wire.UnlockedLevelId,
      Rewards: (wire.Rewards ?? []).map(reward => this.mapCampaignReward(reward)),
      RewardsGranted: wire.RewardsGranted,
      TotalLevels: wire.TotalLevels,
      CompletedLevels: wire.CompletedLevels,
      TotalStarsEarned: wire.TotalStarsEarned,
      MaxStars: wire.MaxStars
    };
  }

  /* ================= Client Session Methods (Reconnection) ================= */

  public async UserHasUnfinishedSession_Client(): Promise<UnfinishedSessionsResponse> {
    const response = await fetch(`${this.apiUri}/Session/any-unfinished-sessions`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to check unfinished sessions");
    return await response.json();
  }

  public async ReconnectToUnfinishedSession_Client(id: string): Promise<string> {
    const response = await fetch(`${this.apiUri}/Session/reconnect-to-session?id=${id}`, {
      headers: this.getAuthHeaders(false)
    });
    if (!response.ok) throw new Error("Failed to reconnect to session");
    
    const data: SavedSessionResponse = await response.json();
    
    // Decrypt the custom session state
    const decryptionKey = this.getSessionEncryptionKey();
    const decryptedState = await CryptoHelper.decrypt(data.Data, decryptionKey);

    // Restore session tracking
    this.activeClientSessionDbId = data.Id;
    this.activeClientSessionId = data.SessionId;
    this.currentClientSessionId = data.SaveSessionId;
    this.currentClientSessionEvents = []; // clean logs to record new events during resume
    
    return decryptedState;
  }

  public async CreateSession_Client(
    json: string,
    gameType: GameTypeEnum,
    eventId: string,
    saveSessionId: string
  ): Promise<SavedSessionResponse> {
    // Encrypt custom data before storing
    const encryptionKey = this.getSessionEncryptionKey();
    const encryptedData = await CryptoHelper.encrypt(json, encryptionKey);

    // Hash is calculated using eventId (SessionId) as key
    const hash = await CryptoHelper.hmacSha256(encryptedData, eventId);

    const response = await fetch(`${this.apiUri}/Session/create-session`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({
        SessionId: eventId,
        SaveSessionId: saveSessionId,
        GameType: gameType,
        Data: encryptedData,
        Hash: hash
      })
    });

    if (!response.ok) throw new Error("Failed to create client session");

    const savedSession: SavedSessionResponse = await response.json();
    this.activeClientSessionDbId = savedSession.Id;
    this.activeClientSessionId = eventId;
    this.currentClientSessionId = saveSessionId;
    this.currentClientSessionEvents = [];
    return savedSession;
  }

  public async UpdateSession_Client(json: string): Promise<boolean> {
    if (!this.activeClientSessionDbId || !this.activeClientSessionId) {
      throw new Error("No active client session found to update. Create or Reconnect first.");
    }

    const encryptionKey = this.getSessionEncryptionKey();
    const encryptedData = await CryptoHelper.encrypt(json, encryptionKey);

    // Hash is calculated using activeClientSessionId (eventId) as key
    const hash = await CryptoHelper.hmacSha256(encryptedData, this.activeClientSessionId);

    const response = await fetch(`${this.apiUri}/Session/update-session`, {
      method: "POST",
      headers: this.getAuthHeaders(true),
      body: JSON.stringify({
        Id: this.activeClientSessionDbId,
        Data: encryptedData,
        Hash: hash
      })
    });

    if (!response.ok) throw new Error("Failed to update client session progress");
    return await response.json(); // returns boolean
  }

  /**
   * Closes active local client session tracking.
   */
  public CloseCurrentSession_Client(): void {
    this.activeClientSessionDbId = null;
    this.activeClientSessionId = null;
    this.currentClientSessionId = null;
    this.currentClientSessionEvents = [];
  }

  public RecordEvent_Client(eventInfo: string): void {
    this.currentClientSessionEvents.push(eventInfo);
  }

  public GetCurrentSessionEvents_Client(): string[] {
    return [...this.currentClientSessionEvents];
  }

  /* ================= Dedicated Server Session Methods =================
   *
   * NOTE: The Dedicated Server methods are not supported at the moment; do not use them.
   */

  /**
   * Registers a new multiplayer session on the API from a Dedicated Game Server.
   */
  public async CreateSession_Server(
    serverUrl: string,
    sessionId: string,
    playersInfo: ServerUserData[]
  ): Promise<boolean> {
    const response = await fetch(`${this.apiUri}/Session/create-server-session`, {
      method: "POST",
      headers: await this.getServerHeaders(),
      body: JSON.stringify({
        ServerUrl: serverUrl,
        SessionId: sessionId,
        PlayersInfo: playersInfo
      })
    });

    if (!response.ok) throw new Error("Failed to create server session");
    
    this.activeServerSessionId = sessionId;
    this.activeServerSessionEvents.clear();
    playersInfo.forEach(p => {
      this.activeServerSessionEvents.set(p.FunticoUserId, []);
    });

    return await response.json(); // returns boolean
  }

  /**
   * Reports that a player has left the server match session.
   */
  public async UserLeaveSession_Server(platformUserId: number): Promise<boolean> {
    if (!this.activeServerSessionId) {
      throw new Error("No active server session tracked.");
    }

    const response = await fetch(`${this.apiUri}/Session/server-session-user-leave?id=${this.activeServerSessionId}&userId=${platformUserId}`, {
      headers: await this.getServerHeaders()
    });

    if (!response.ok) throw new Error("Failed to submit player leave status to server");
    return await response.json(); // returns boolean
  }

  /**
   * Closes active server match session on the API.
   */
  public async CloseCurrentSession_Server(): Promise<boolean> {
    if (!this.activeServerSessionId) {
      throw new Error("No active server session tracked.");
    }

    const response = await fetch(`${this.apiUri}/Session/close-server-session?id=${this.activeServerSessionId}`, {
      headers: await this.getServerHeaders()
    });

    if (!response.ok) throw new Error("Failed to close server session");
    
    this.activeServerSessionId = null;
    this.activeServerSessionEvents.clear();
    return await response.json(); // returns boolean
  }

  /**
   * Submits multiplayer results for all match participants in one payload from Dedicated Server.
   *
   * The request body is a root `scores` array with one entry per participant, each of which
   * carries its own session id. Every key is snake_case.
   *
   * Note `user_id` is the FUNTICO user id (FunticoUserId), not UserId; results (including Hall of
   * Fame) are recorded against it.
   *
   * AdditionalData and GameEvents are not transmitted; they stay on the parameter for source
   * compatibility.
   */
  public async FinishRoomSession_Server(
    eventId: string,
    sessionId: string,
    participants: Array<{
      Score: number;
      UserId: number;
      FunticoUserId: number;
      UserIp: string;
      AdditionalData?: string;
      GameEvents?: string[];
      GameManagedAward?: number;
    }>
  ): Promise<boolean> {
    const scores = participants.map(p => ({
      game_session_id_or_match_id: sessionId,
      // Must be an integer; truncate so a fractional score cannot fail the request.
      score: Math.trunc(p.Score),
      is_suspected_cheater: false,
      user_ip_end_session: p.UserIp,
      user_id: p.FunticoUserId,
      game_managed_award: p.GameManagedAward ?? null
    }));

    const response = await fetch(`${this.apiUri}/Rooms/end-room-all-users?eventId=${eventId}`, {
      method: "POST",
      headers: await this.getServerHeaders(),
      body: JSON.stringify({ scores })
    });

    if (!response.ok) throw new Error("Failed to finalize server match results");

    // Cleanup session tracking
    this.activeServerSessionId = null;
    this.activeServerSessionEvents.clear();

    return await response.json();
  }

  public RecordEvent_Server(platformUserId: number, eventInfo: string): void {
    const list = this.activeServerSessionEvents.get(platformUserId) || [];
    list.push(eventInfo);
    this.activeServerSessionEvents.set(platformUserId, list);
  }

  public GetCurrentSessionEvents_Server(platformUserId: number): string[] {
    return [...(this.activeServerSessionEvents.get(platformUserId) || [])];
  }
}

/**
 * Phaser 3 Plugin wrapper for FunticoSDK.
 * Emits Phaser Events for seamless integration with Phaser Scenes.
 */

// FunticoPhaserPlugin omitted (used only in Phaser 3 projects)
