import { GameLogger, LogType } from './abstract/game-logger';

export enum CardValue {
  Deuce = 2,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
  Ace,
}

export enum CardSuit {
  Clubs,
  Diamonds,
  Hearts,
  Spades,
}

/** Represents a standard playing card. */
export class Card {
  value: CardValue;
  suit: CardSuit;

  constructor(value: CardValue, suit: CardSuit) {
    if (value < 2 || value > 14)
      throw new RangeError('Card value is out of range!');
    if (suit < 0 || suit > 3)
      throw new RangeError('Card suit is out of range!');

    this.value = value;
    this.suit = suit;
  }

  toString(): string {
    let cardString = '';
    if (this.value < 11) {
      cardString += this.value;
    } else {
      switch (this.value) {
        case CardValue.Jack:
          cardString += 'J';
          break;
        case CardValue.Queen:
          cardString += 'Q';
          break;
        case CardValue.King:
          cardString += 'K';
          break;
        case CardValue.Ace:
          cardString += 'A';
          break;
      }
    }
    switch (this.suit) {
      case CardSuit.Clubs:
        cardString += '♣';
        break;
      case CardSuit.Diamonds:
        cardString += '♢';
        break;
      case CardSuit.Hearts:
        cardString += '♡';
        break;
      case CardSuit.Spades:
        cardString += '♠';
        break;
    }
    return cardString;
  }
}

/** Represents a standard 52-card deck. */
export class Deck {
  private _deck: Card[];

  get length(): number {
    return this._deck.length;
  }

  /** Create a shuffled deck of cards */
  constructor(private _logger?: GameLogger) {
    const deck: Card[] = [];
    for (let value = 2; value < 15; value++) {
      for (let suit = 0; suit < 4; suit++) {
        deck.push(new Card(value, suit));
      }
    }
    for (let i = 0; i < deck.length; i++) {
      const card = deck[i];
      const shuffledIndex = Math.floor(Math.random() * (deck.length - i)) + i;
      deck[i] = deck[shuffledIndex];
      deck[shuffledIndex] = card;
    }

    this._deck = deck;
    this.log('New deck created!');
  }

  /** Deal the top card from the deck. */
  deal(): Card {
    const card = this._deck.pop();
    if (!card) {
      const errorMessage = 'Attempting to deal from an empty deck!';
      this.log(errorMessage, LogType.GameError);
      throw new Error(errorMessage);
    }
    this.log(`${card.toString()} was dealt!`);
    return card;
  }

  toString(): string {
    return this._deck.reduceRight(
      (str, card, i) =>
        i === this._deck.length - 1
          ? card.toString()
          : (str += `\n${card.toString()}`),
      ''
    );
  }

  private log(message: string, logType?: LogType): void {
    this._logger?.log('Deck', message, logType);
  }
}
