import { Card, Deck } from './deck';

it('Throws when attepmting to deal from an empty deck', () => {
  const deck = new Deck();

  for (let i = 0; i < 52; i++) deck.deal();

  expect(deck.deal).toThrow();
});

it('Prints all cards in the correct order', () => {
  const deck = new Deck();
  const deckString = deck.toString();

  for (const cardString of deckString.split('\n')) {
    expect(deck.deal().toString()).toBe(cardString);
  }
});

// Not really a unit test, but a good sanity check for a shuffling algorithm. Slow.
// it.only('Creates a sufficiently shuffled (random) deck', () => {
//   const epsilon = 0.001; // 0.1% relative error
//   const maxIter = 1000000;

//   let counter = 0;
//   for (let i = 0; i < maxIter; i++) {
//     const deck = new Deck();
//     const card = new Card(
//       Math.floor(Math.random() * 11) + 2,
//       Math.floor(Math.random() * 4)
//     );
//     const dealtCard = deck.deal();
//     if (card.suit === dealtCard.suit && card.value === dealtCard.value) {
//       counter++;
//     }
//   }
//   const statFrac = counter / maxIter;
//   const trueProb = 1 / 52;

//   expect(Math.abs(statFrac - trueProb) / trueProb).toBeLessThanOrEqual(epsilon);
// });
