import { GameLogLevel, GameLogger } from './game-logger';

/** Represents an entity that contains game logic */
export abstract class GameEntity {
  constructor(private _entityName: string, protected _logger: GameLogger) {}

  protected log(message: string, logLevel?: GameLogLevel): void {
    this._logger?.log(this._entityName, message, logLevel);
  }
}
