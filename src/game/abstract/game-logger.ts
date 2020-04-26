export enum LogType {
  GameEvent,
  GameError,
}

/** Logs normal game events */
export interface GameLogger {
  /** Logs normal game events */
  log(callerName: string, message: string, logType?: LogType): void;
}
