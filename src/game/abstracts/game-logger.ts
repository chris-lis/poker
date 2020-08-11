export enum GameLogLevel {
  Event,
  ImportantEvent,
  Warning,
  Error,
}

/** Logs normal game events */
export interface GameLogger {
  /** Logs normal game events */
  log(callingEntity: string, message: string, level?: GameLogLevel): void;
}
