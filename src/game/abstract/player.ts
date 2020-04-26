export enum PlayerAction {
  Fold,
  Check,
  Call,
  Bet,
  Raise,
}

export interface Player {
  name: string;
  bankroll: number;
}
