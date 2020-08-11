import { GameEntity } from './abstracts/game-entity';
import { GameLogger, GameLogLevel } from './abstracts/game-logger';
import { Player, PlayerAction } from './abstracts/player';

import { Bet } from './bet';

export enum PlayerStatus {
  Active,
  AllIn,
  Folded,
}

export enum LimitType {
  NoLimit = 0,
  FixedLimit,
}

/** Represents a subpot - a portion of a pot to which a subset of players is entitled */
class Sidepot {
  amountOwed: Map<Player, number>;

  constructor(players: Player[], amountOwed?: number[], public totalSize = 0) {
    this.amountOwed = new Map<Player, number>(
      players.map((player, i) => [player, amountOwed ? amountOwed[i] : 0])
    );
  }
}

export class Pot extends GameEntity {
  // Private fileds
  private _sidepots: Sidepot[];
  private _players: Map<Player, PlayerStatus>;
  private _minimumBet: number;
  private _raiseLimit: number;
  private _limitType: LimitType;
  private _raiseCount = 0;
  private _lastRaise = 0;
  private _currentBet = 0;
  private _betHistory: Bet[][] = [[]];

  // Simple properties
  /** Minimum size of a bet. Readonly. */
  get minimumBet(): number {
    return this._minimumBet;
  }
  /** Maximum number of raises (over initial bet) allowed. 0 if unlimited. Readolny. */
  get raiseLimit(): number {
    return this._raiseLimit;
  }
  get limitType(): LimitType {
    return this._limitType;
  }
  /** Number of raises (over initial bet) made so far in the round. Must be lower or equal raiseLimit (if > 0). Readonly. */
  get raiseCount(): number {
    return this._raiseCount;
  }
  /** The amount by which the last raise was made (difference between the size of that rasie & current bet). Readonly. */
  get lastRaise(): number {
    return this._lastRaise;
  }
  /** Size of the current highest bet (the bet all players have to match). Readonly. */
  get currentBet(): number {
    return this._currentBet;
  }
  /** List of all bets made to the pot, divided by round, in order from oldest to newest. Readonly. */
  get betHistory(): Bet[][] {
    return this._betHistory.map((bets) =>
      bets.map((bet) => new Bet(bet.player, bet.action, bet.size, bet.allIn))
    );
  }

  // Computed properties; can be spead-up by caching, but does it matter?
  /** Index of a current betting rounds, starts at 0 & is incremented each time nextRound() method is successfully called. Readonly. */
  get bettingRound(): number {
    return this._betHistory.length - 1;
  }
  /** Total size (value) of the pot. Readonly. */
  get totalSize(): number {
    return this._sidepots.reduce(
      (totalSize, sidePot) => (totalSize += sidePot.totalSize),
      0
    );
  }
  /** Sum of what all players still owe the pot. Readonly. */
  get totalOwed(): number {
    let out = 0;
    for (const sidepot of this._sidepots) {
      for (const amount of sidepot.amountOwed.values()) out += amount;
    }
    return out;
  }
  /** List of all players still in the pot (i.e. players who haven't folded). Readonly. */
  get players(): Player[] {
    const out = [];
    for (const [player, status] of this._players.entries()) {
      if (status !== PlayerStatus.Folded) out.push(player);
    }
    return out;
  }
  /** List of all active players still in the pot (i.e. players who haven't folded or went all-in). Readonly. */
  get activePlayers(): Player[] {
    const out = [];
    for (const [player, status] of this._players.entries()) {
      if (status === PlayerStatus.Active) out.push(player);
    }
    return out;
  }
  /** List of all bets made during the current round, in order form oldest to newest. Readonly. */
  get currentRoundBetHistory(): Bet[] {
    return this._betHistory[this.bettingRound].map(
      (bet) => new Bet(bet.player, bet.action, bet.size, bet.allIn)
    );
  }
  /** List of all bets made during the previous round, in order form oldest to newest. Defined only if at least one betting round was closed already (i.e. bettingRound > 0). Readonly. */
  get previousRoundBetHistory(): Bet[] {
    const prevRound = this.bettingRound - 1;
    if (prevRound >= 0)
      return this._betHistory[prevRound].map(
        (bet) => new Bet(bet.player, bet.action, bet.size, bet.allIn)
      );
    else return undefined;
  }

  /** Create a new Pot (defaults to no-limit rules) (TODO: add limits & rake mechanics)
   * @param players A list of players participating in the pot.
   * @param blindBets A list of bets posted before the game starts; examples include Small & Big Blind (bet.action === PlayerAction.Bet), straddles & other live bets (bet.action === PlayerAction.Raise) and Antes & sleeper bets (bet.action === PlayerAction.Call). Warning: blind bets are assumed to be correct & not verified by the Pot - just processed according to their order & action type!
   * @param minimumBet Minimum bet size, defaults to undefined; if undefined get's set to the highest of the blinds (or 0 if blinds are not posted).
   * @param raiseLimit Maximum number of raises over an initial bet allowed in a round; defaults to 0, meaning no limit to the number of raises.
   * @param logger Game logger.
   */
  constructor(
    players: Player[],
    blindBets: Bet[],
    minimumBet?: number,
    // TODO: add limits
    raiseLimit = 0,
    limitType = LimitType.NoLimit,
    // TODO: add rake
    logger?: GameLogger
  ) {
    super('Pot', logger);

    // this._minimumBet = minimumBet;
    if (minimumBet || minimumBet == 0) {
      this._minimumBet = minimumBet;
    }
    if (raiseLimit < 0) {
      throw new RangeError('Raise limit cannot be negative!');
    }
    this._raiseLimit = raiseLimit;
    this._limitType = limitType;

    this._sidepots = [new Sidepot(players)];
    this._players = new Map<Player, PlayerStatus>(
      players.map((player) => [player, PlayerStatus.Active])
    );

    this.log(
      `New pot got created! Players in the pot: ${players.reduce(
        (str, player, i) => (str += `${i > 1 ? ', ' : ''}${player.name}`),
        ''
      )}!`
    );

    for (const bet of blindBets) {
      switch (bet.action) {
        // Antes & sleepers
        case PlayerAction.Call:
          this.processCall(bet.player, bet.size, bet.allIn);
          break;
        // Blinds
        case PlayerAction.Bet:
          this.processBet(bet.player, bet.size, bet.allIn);
          break;
        // Straddles
        case PlayerAction.Raise:
          this.processRaise(bet.player, bet.size, bet.allIn);
          break;
        case PlayerAction.Check:
        case PlayerAction.Fold:
          this.log(
            `Attempting to post an invalid blind bet: ${
              PlayerAction[bet.action]
            }!`,
            GameLogLevel.Error
          );
          throw new Error(`Blind bet cannot be a ${PlayerAction[bet.action]}!`);
      }
      this.archiveBet(bet);
    }
  }

  playerStatus(player: Player): PlayerStatus {
    return this._players.get(player);
  }

  /** Returns the total amound the player owes the pot */
  amountOwed(player: Player): number {
    if (this.playerStatus(player) === PlayerStatus.Folded) {
      const errorMessage = `Player: ${player.name} doesn't belong to the pot!`;
      this.log(errorMessage, GameLogLevel.Error);
      throw new Error(errorMessage);
    }
    return this._sidepots.reduce((totalOwed, sidePot) => {
      const currentOwed = sidePot.amountOwed.get(player);
      return currentOwed ? (totalOwed += currentOwed) : totalOwed;
    }, 0);
  }

  /** Validates if bet or raise size is allowed by the game limit rules. Doesn't check for any other limits (e.g. raise limit)! */
  validateBetSize(size: number): boolean {
    switch (this.limitType) {
      case LimitType.NoLimit:
        if (size >= this.lastRaise && size >= this.minimumBet) return true;
        else return false;

      case LimitType.FixedLimit:
        if (size === this.minimumBet) return true;
        else return false;
    }
  }

  /** Add new bet (player action) to the pot
   * @returns Total size of the pot after the bet
   * @throws ???
   */
  addBet(bet: Bet): number {
    // ! Redo the validation
    if (this.playerStatus(bet.player) !== PlayerStatus.Active) {
      const errorMessage = `Player: ${bet.player.name} cannot act!`;
      this.log(errorMessage, GameLogLevel.Error);
      throw new Error(errorMessage);
    }

    switch (bet.action) {
      case PlayerAction.Fold:
        for (const sidepot of this._sidepots) {
          sidepot.amountOwed.delete(bet.player);
        }
        break;

      case PlayerAction.Check:
        if (this.amountOwed(bet.player) !== 0) {
          throw new Error(
            `Player ${
              bet.player.name
            } cannot check! They owe the pot ${this.amountOwed(bet.player)}!`
          );
        }
        break;

      case PlayerAction.Call: {
        const amountOwed = this.amountOwed(bet.player);
        if (bet.size >= amountOwed) {
          const sizeLeft = this.processCall(bet.player, bet.size);

          // Add the remainder of the call to the last pot
          if (sizeLeft > 0) {
            this._sidepots[this._sidepots.length - 1].totalSize += sizeLeft;
          }

          if (bet.allIn) {
            this._players.set(bet.player, PlayerStatus.AllIn);
            this._sidepots.push(new Sidepot(this.activePlayers));
          }
        } else if (bet.allIn) {
          this.processCall(bet.player, bet.size);
        } else {
          const errorMessage = `Player ${bet.player.name} cannot call ${bet.size}! They must call at least ${amountOwed} or go all-in!`;
          this.log(errorMessage, GameLogLevel.Error);
          throw new Error(errorMessage);
        }
        break;
      }

      case PlayerAction.Bet: {
        // ! Validation
        if (this.currentBet > 0) {
          // ! Throw
        }
        if (!this.validateBetSize(bet.size) && !bet.allIn) {
          // ! Throw
        }

        this.processBet(bet.player, bet.size);
        if (bet.allIn) {
          this._players.set(bet.player, PlayerStatus.AllIn);
          this._sidepots.push(new Sidepot(this.activePlayers));
        }
        this._lastRaise = bet.size;
        this._currentBet += bet.size;
        break;
      }

      case PlayerAction.Raise: {
        // ! Validation
        if (this.currentBet === 0) {
          // ! Throw
        }
        if (this.raiseLimit && this.raiseCount >= this.raiseLimit) {
          // ! Throw
        }
        const amountOwed = this.amountOwed(bet.player);
        if (!this.validateBetSize(bet.size - amountOwed)) {
          // ! Throw
        }

        const amountLeft = this.processCall(bet.player, bet.size);
        this.processBet(bet.player, amountLeft);

        if (bet.allIn) {
          this._players.set(bet.player, PlayerStatus.AllIn);
          this._sidepots.push(new Sidepot(this.activePlayers));
        }
        this._raiseCount++;
        this._lastRaise =
          amountLeft > this.lastRaise ? amountLeft : this.lastRaise;
        this._currentBet += amountLeft;
        break;
      }
    }
    this.archiveBet(bet);
    return this.totalSize;
  }

  /** Moves the pot into the next betting round
   * @param newMinimumBet Optional. Changes the minimum bet for all consequent rounds.
   * @param newRaiseLimit Optional. Changes the raise limit for all consequent rounds.
   * @returns Index of the next round.
   */
  nextRound(newMinimumBet?: number, newRaiseLimit?: number): number {
    if (this.currentBet !== 0) {
      this.log(
        `Attempting to advance to a next betting round with an outstanding bet of ${this.currentBet}!`,
        GameLogLevel.Error
      );
      throw new Error(
        'Cannot advance to the next betting round with an outstanding bet!'
      );
    }

    if (newMinimumBet || newMinimumBet === 0) {
      if (newMinimumBet < 0) {
        throw new RangeError('Minimum bet cannot be negative!');
      }
      this._minimumBet = newMinimumBet;
    }
    if (newRaiseLimit || newRaiseLimit === 0) {
      if (newRaiseLimit < 0) {
        throw new RangeError('Raise limit cannot be negative!');
      }
      this._raiseLimit = newRaiseLimit;
    }
    this._lastRaise = 0;
    this._raiseCount = 0;
    this._betHistory.push([]);

    this.log('Advanced to the next betting round!');

    return this.bettingRound;
  }

  /**
   * ? Rename it
   * @param player
   * @param size
   * @returns Leftover size after the call
   */
  private processCall(player: Player, size: number): number {
    let sizeLeft = size;
    for (let i = 0; i < this._sidepots.length; i++) {
      const sidepot = this._sidepots[i];
      const amountOwed = sidepot.amountOwed.get(player);
      sidepot.amountOwed.set(player, 0);

      if (sizeLeft >= amountOwed) {
        sidepot.totalSize += amountOwed;
        sizeLeft -= amountOwed;
      } else {
        sidepot.totalSize += sizeLeft;
        sidepot.amountOwed.set(player, 0);
        const spilloverAmount = amountOwed - sizeLeft;
        this._players.set(player, PlayerStatus.AllIn);
        // Split the pot
        let newPotSize = 0;
        const newPotPlayers: Player[] = [];
        const newPotAmountOwed: number[] = [];
        for (const [
          otherPlayer,
          otherAmountOwed,
        ] of sidepot.amountOwed.entries()) {
          if (otherPlayer !== player) {
            newPotPlayers.push(otherPlayer);
            if (otherAmountOwed >= spilloverAmount) {
              newPotAmountOwed.push(spilloverAmount);
              sidepot.amountOwed.set(
                otherPlayer,
                otherAmountOwed - spilloverAmount
              );
            } else {
              newPotAmountOwed.push(otherAmountOwed);
              sidepot.amountOwed.set(otherPlayer, 0);
              sidepot.totalSize -= spilloverAmount - otherAmountOwed;
              newPotSize += spilloverAmount - otherAmountOwed;
            }
          }
        }
        this._sidepots.splice(
          i + 1,
          0,
          new Sidepot(newPotPlayers, newPotAmountOwed, newPotSize)
        );
        return 0;
      }
    }
    return sizeLeft;
  }

  /**
   * ? Rename it
   * @param player
   * @param size
   * @param allIn
   */
  private processBet(player: Player, size: number): void {
    const sidepot = this._sidepots[this._sidepots.length - 1];
    sidepot.totalSize += size;
    for (const [otherPlayer, owed] of sidepot.amountOwed.entries()) {
      if (otherPlayer !== player) {
        sidepot.amountOwed.set(otherPlayer, owed + size);
      }
    }
  }

  private archiveBet(bet: Bet): void {
    this.log(bet.toString());
    this._betHistory[this.bettingRound].push(bet);
  }
}
