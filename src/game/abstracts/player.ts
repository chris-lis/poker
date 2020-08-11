import { Bet } from '../bet';

export enum PlayerAction {
  Fold,
  Check,
  Call, // Can also mean any 'dead' bet
  Bet,
  Raise,
}

export interface Player {
  name: string;
  bankroll: number;
  act(...args: any[]): Bet;
}
