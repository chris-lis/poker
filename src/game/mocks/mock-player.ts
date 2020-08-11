import { Player, PlayerAction } from '../abstracts/player';
import { Bet } from '../bet';

export class MockPlayer implements Player {
  constructor(public name: string, public bankroll: number) {}

  act = (): Bet => new Bet(this, PlayerAction.Fold);
}
