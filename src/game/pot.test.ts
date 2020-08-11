import { Pot, PlayerStatus } from './pot';
import { Player, PlayerAction } from './abstracts/player';
import { Bet } from './bet';
import { MockPlayer } from './mocks/mock-player';

const players = [
  new MockPlayer('Player A', 1000),
  new MockPlayer('Player B', 1000),
  new MockPlayer('Player C', 1000),
  new MockPlayer('Player D', 1000),
];

describe('Test basic functionality of the Pot class', () => {
  // Unrealistic scenario, but a good check for most basic mistakes
  it('Initializes an empty pot with correct properties', () => {
    const pot = new Pot(players, [], 1);

    expect(pot.bettingRound).toBe(0);
    expect(pot.minimumBet).toBe(1);
    expect(pot.raiseCount).toBe(0);
    expect(pot.lastRaise).toBe(0);
    expect(pot.currentBet).toBe(0);

    expect(pot.betHistory).toEqual<Bet[][]>([[]]);
    expect(pot.currentRoundBetHistory).toEqual<Bet[]>([]);
    expect(pot.previousRoundBetHistory).toBeUndefined();

    pot.betHistory.push([]);
    pot.currentRoundBetHistory.push(new Bet(players[0], PlayerAction.Fold));

    expect(pot.betHistory).toEqual<Bet[][]>([[]]);
    expect(pot.currentRoundBetHistory).toEqual<Bet[]>([]);

    expect(pot.totalSize).toBe(0);
    expect(pot.totalOwed).toBe(0);
    expect(pot.players).not.toBe(players);
    expect(pot.players).toEqual(players);
    expect(pot.activePlayers).toEqual(players);

    for (const player of players) {
      expect(pot.playerStatus(player)).toEqual(PlayerStatus.Active);
      expect(pot.amountOwed(player)).toBe(0);
    }
  });

  it('Initializes a pot with standard blinds', () => {
    const blindBets = [
      new Bet(players[0], PlayerAction.Bet, 1),
      new Bet(players[1], PlayerAction.Bet, 2),
    ];
    const pot = new Pot(players, blindBets, 2);

    expect(pot.bettingRound).toBe(0);
    expect(pot.minimumBet).toBe(2);
    expect(pot.raiseCount).toBe(0);
    expect(pot.lastRaise).toBe(2);
    expect(pot.currentBet).toBe(2);

    expect(pot.betHistory).toEqual<Bet[][]>([blindBets]);
    expect(pot.currentRoundBetHistory).toEqual<Bet[]>(blindBets);
    expect(pot.previousRoundBetHistory).toBeUndefined();

    expect(pot.totalSize).toBe(3);
    expect(pot.totalOwed).toBe(5);
    expect(pot.players).toEqual(players);
    expect(pot.activePlayers).toEqual(players);

    for (let i = 0; i < players.length; i++) {
      expect(pot.playerStatus(players[i])).toEqual(PlayerStatus.Active);
      expect(pot.amountOwed(players[i])).toBe(i === 0 ? 1 : i === 1 ? 0 : 2);
    }
  });

  it('Initializes a pot with antes & standard blinds', () => {
    const antes = players.map(
      (player) => new Bet(player, PlayerAction.Call, 1)
    );
    const blindBets = [
      new Bet(players[0], PlayerAction.Bet, 1),
      new Bet(players[1], PlayerAction.Bet, 2),
    ];
    const pot = new Pot(players, [...antes, ...blindBets], 2);

    expect(pot.bettingRound).toBe(0);
    expect(pot.minimumBet).toBe(2);
    expect(pot.raiseCount).toBe(0);
    expect(pot.lastRaise).toBe(2);
    expect(pot.currentBet).toBe(2);

    expect(pot.betHistory).toEqual<Bet[][]>([[...antes, ...blindBets]]);
    expect(pot.currentRoundBetHistory).toEqual<Bet[]>([...antes, ...blindBets]);
    expect(pot.previousRoundBetHistory).toBeUndefined();

    expect(pot.totalSize).toBe(7);
    expect(pot.totalOwed).toBe(5);
    expect(pot.players).toEqual(players);
    expect(pot.activePlayers).toEqual(players);

    for (let i = 0; i < players.length; i++) {
      expect(pot.playerStatus(players[i])).toEqual(PlayerStatus.Active);
      expect(pot.amountOwed(players[i])).toBe(i === 0 ? 1 : i === 1 ? 0 : 2);
    }
  });

  it('Initializes a pot with standard blinds & a straddle', () => {
    const blindBets = [
      new Bet(players[0], PlayerAction.Bet, 1),
      new Bet(players[1], PlayerAction.Bet, 2),
      new Bet(players[2], PlayerAction.Raise, 4),
    ];
    const pot = new Pot(players, blindBets, 2);

    expect(pot.bettingRound).toBe(0);
    expect(pot.minimumBet).toBe(2);
    expect(pot.raiseCount).toBe(1);
    expect(pot.lastRaise).toBe(2);
    expect(pot.currentBet).toBe(4);

    expect(pot.betHistory).toEqual<Bet[][]>([blindBets]);
    expect(pot.currentRoundBetHistory).toEqual<Bet[]>(blindBets);
    expect(pot.previousRoundBetHistory).toBeUndefined();

    expect(pot.totalSize).toBe(7);
    expect(pot.totalOwed).toBe(9);
    expect(pot.players).toEqual(players);
    expect(pot.activePlayers).toEqual(players);

    const expectedOwed = [3, 2, 0, 4];

    for (let i = 0; i < players.length; i++) {
      expect(pot.playerStatus(players[i])).toEqual(PlayerStatus.Active);
      expect(pot.amountOwed(players[i])).toBe(expectedOwed[i]);
    }
  });

  // Unrealistic scenarios, but will help analyze things in isolation
  it.todo('Correctly processes a Fold to an empty pot');

  it.todo('Correctly processes a Check to an empty pot');

  it.todo('Correctly processes a Bet to an empty pot');

  it.todo('Correctly processes a Call to a pot with only standard blinds.');

  it.todo('Correctly processes a Raise to a pot with only standard blinds.');

  it.todo('Correctly advances to a next round');
});

it.todo('Correctly advances to the next round');
it.todo('Throws when trying to advance to the next round too early');
