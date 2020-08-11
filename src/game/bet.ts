import { Player, PlayerAction } from './abstracts/player';

/** A message that contains details of player's action
 * @throws {RangeError} when the bet size is invalid (depending on the action)
 */
export class Bet {
  constructor(
    public player: Player,
    public action: PlayerAction,
    public size: number = 0,
    public allIn: boolean = false
  ) {
    // Validate the action
    if (this.size < 0) throw new RangeError('Bet size cannot be negative!');
    if (this.action == PlayerAction.Fold || this.action == PlayerAction.Check) {
      if (this.size !== 0)
        throw new RangeError(
          `${
            PlayerAction[this.action]
          } cannot have a bet size associated with it!`
        );
    } else if (this.size === 0)
      throw new RangeError(
        `${PlayerAction[this.action]} needs to have a bet size greater than 0!`
      );
  }

  toString(): string {
    switch (this.action) {
      case PlayerAction.Fold:
      case PlayerAction.Check:
        return `${this.player.name} ${PlayerAction[
          this.action
        ].toLowerCase()}s!`;
      case PlayerAction.Call:
      case PlayerAction.Bet:
        return `${this.player.name} ${PlayerAction[
          this.action
        ].toLowerCase()}s ${this.size}${this.allIn ? ' all-in' : ''}!`;
      case PlayerAction.Raise:
        return `${this.player.name} ${PlayerAction[
          this.action
        ].toLowerCase()}s to ${this.size}${this.allIn ? ' all-in' : ''}!`;
    }
  }
}
