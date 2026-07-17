const CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8
};

const RANKS = "23456789TJQKA";
const SUITS = "cdhs";

export function createDeck() {
  return [...RANKS].flatMap((rank) => [...SUITS].map((suit) => `${rank}${suit}`));
}

export function compareScores(a, b) {
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  return 0;
}

export function evaluateHand(cards) {
  if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7) {
    throw new Error("手牌必须包含五到七张牌");
  }

  validateCards(cards);
  let bestScore = null;
  for (const hand of combinations(cards, 5)) {
    const score = scoreFiveCards(hand);
    if (bestScore === null || compareScores(score, bestScore) > 0) bestScore = score;
  }
  return bestScore;
}

export function simulateEquity(options) {
  const { hero, board = [], opponents, iterations, rng = Math.random } = options ?? {};
  if (!Array.isArray(hero) || hero.length !== 2) throw new Error("hero 必须包含两张牌");
  if (!Array.isArray(board) || board.length > 5) throw new Error("board 最多包含五张牌");
  if (!Number.isInteger(opponents) || opponents < 1) throw new Error("opponents 必须是正整数");
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error("iterations 必须是正整数");
  if (typeof rng !== "function") throw new Error("rng 必须是函数");

  const knownCards = [...hero, ...board];
  validateCards(knownCards);

  const neededCards = 5 - board.length + opponents * 2;
  if (createDeck().length - knownCards.length < neededCards) {
    throw new Error("剩余牌不足以完成模拟");
  }

  let equity = 0;
  let wins = 0;
  let ties = 0;
  let losses = 0;

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const deck = shuffle(createDeck().filter((card) => !knownCards.includes(card)), rng);
    const completedBoard = [...board, ...deck.splice(0, 5 - board.length)];
    const opponentHands = Array.from({ length: opponents }, () => deck.splice(0, 2));
    const scores = [evaluateHand([...hero, ...completedBoard])];
    scores.push(...opponentHands.map((hand) => evaluateHand([...hand, ...completedBoard])));

    let bestScore = scores[0];
    for (const score of scores.slice(1)) {
      if (compareScores(score, bestScore) > 0) bestScore = score;
    }

    const tiedPlayers = scores.filter((score) => compareScores(score, bestScore) === 0).length;
    if (compareScores(scores[0], bestScore) !== 0) {
      losses += 1;
    } else if (tiedPlayers === 1) {
      wins += 1;
      equity += 1;
    } else {
      ties += 1;
      equity += 1 / tiedPlayers;
    }
  }

  return { equity: equity / iterations, wins, ties, losses, iterations };
}

function scoreFiveCards(cards) {
  const ranks = cards.map((card) => RANKS.indexOf(card[0]) + 2).sort((a, b) => b - a);
  const counts = new Map();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const straightHigh = findStraightHigh(ranks);
  const isFlush = cards.every((card) => card[1] === cards[0][1]);

  if (isFlush && straightHigh !== null) return [CATEGORY.STRAIGHT_FLUSH, straightHigh];
  if (groups[0][1] === 4) return [CATEGORY.FOUR_OF_A_KIND, groups[0][0], groups[1][0]];
  if (groups[0][1] === 3 && groups[1][1] === 2) return [CATEGORY.FULL_HOUSE, groups[0][0], groups[1][0]];
  if (isFlush) return [CATEGORY.FLUSH, ...ranks];
  if (straightHigh !== null) return [CATEGORY.STRAIGHT, straightHigh];
  if (groups[0][1] === 3) return [CATEGORY.THREE_OF_A_KIND, groups[0][0], ...groups.slice(1).map(([rank]) => rank)];
  if (groups[0][1] === 2 && groups[1][1] === 2) return [CATEGORY.TWO_PAIR, groups[0][0], groups[1][0], groups[2][0]];
  if (groups[0][1] === 2) return [CATEGORY.PAIR, groups[0][0], ...groups.slice(1).map(([rank]) => rank)];
  return [CATEGORY.HIGH_CARD, ...ranks];
}

function findStraightHigh(ranks) {
  const uniqueRanks = [...new Set(ranks)];
  if (uniqueRanks.length !== 5) return null;
  if (uniqueRanks[0] === 14 && uniqueRanks[1] === 5 && uniqueRanks[4] === 2) return 5;
  return uniqueRanks[0] - uniqueRanks[4] === 4 ? uniqueRanks[0] : null;
}

function combinations(cards, size, start = 0, selected = []) {
  if (selected.length === size) return [selected];
  const result = [];
  for (let index = start; index <= cards.length - (size - selected.length); index += 1) {
    result.push(...combinations(cards, size, index + 1, [...selected, cards[index]]));
  }
  return result;
}

function shuffle(cards, rng) {
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(rng() * (index + 1));
    [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
  }
  return cards;
}

function validateCards(cards) {
  const deck = new Set(createDeck());
  if (new Set(cards).size !== cards.length) throw new Error("存在重复牌");
  if (!cards.every((card) => typeof card === "string" && deck.has(card))) {
    throw new Error("存在无效牌");
  }
}
