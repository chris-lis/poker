import { GameEntity } from './abstracts/game-entity';
import { GameLogger } from './abstracts/game-logger';
import { Player } from './abstracts/player';
import { Pot } from './pot';

// Represents game state at any given point
class Table extends GameEntity {
  private _pot?: Pot;
  private _history: [];

  constructor(logger: GameLogger) {
    super('Table', logger);
  }
}
