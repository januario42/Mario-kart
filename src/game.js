const baseCharacters = [
  {
    NOME: "Mario",
    VELOCIDADE: 4,
    MANOBRABILIDADE: 3,
    PODER: 3,
  },
  {
    NOME: "Peach",
    VELOCIDADE: 3,
    MANOBRABILIDADE: 4,
    PODER: 2,
  },
  {
    NOME: "Yoshi",
    VELOCIDADE: 2,
    MANOBRABILIDADE: 4,
    PODER: 3,
  },
  {
    NOME: "Bowser",
    VELOCIDADE: 5,
    MANOBRABILIDADE: 2,
    PODER: 5,
  },
  {
    NOME: "Luigi",
    VELOCIDADE: 3,
    MANOBRABILIDADE: 4,
    PODER: 4,
  },
  {
    NOME: "Donkey Kong",
    VELOCIDADE: 2,
    MANOBRABILIDADE: 2,
    PODER: 5,
  },
];

const BLOCKS = {
  RETA: "RETA",
  CURVA: "CURVA",
  CONFRONTO: "CONFRONTO",
};

function cloneCharacter(character) {
  return {
    ...character,
    PONTOS: 0,
  };
}

function rollDice(randomFn = Math.random) {
  return Math.floor(randomFn() * 6) + 1;
}

function getRandomBlock(randomFn = Math.random) {
  const random = randomFn();
  if (random < 0.33) return BLOCKS.RETA;
  if (random < 0.66) return BLOCKS.CURVA;
  return BLOCKS.CONFRONTO;
}

function resolveSkillRound(character1, character2, block, diceResult1, diceResult2) {
  const attribute =
    block === BLOCKS.RETA ? "VELOCIDADE" : "MANOBRABILIDADE";
  const skillLabel =
    block === BLOCKS.RETA ? "velocidade" : "manobrabilidade";

  const total1 = diceResult1 + character1[attribute];
  const total2 = diceResult2 + character2[attribute];

  let winner = null;
  if (total1 > total2) {
    character1.PONTOS++;
    winner = 1;
  } else if (total2 > total1) {
    character2.PONTOS++;
    winner = 2;
  }

  return {
    block,
    skillLabel,
    diceResult1,
    diceResult2,
    total1,
    total2,
    winner,
    pointAwardedTo: winner,
    pointLostBy: null,
    pointLossPreventedByZero: false,
    isTie: winner === null,
  };
}

function resolveConfrontationRound(character1, character2, diceResult1, diceResult2) {
  const total1 = diceResult1 + character1.PODER;
  const total2 = diceResult2 + character2.PODER;

  if (total1 === total2) {
    return {
      block: BLOCKS.CONFRONTO,
      skillLabel: "poder",
      diceResult1,
      diceResult2,
      total1,
      total2,
      winner: null,
      pointAwardedTo: null,
      pointLostBy: null,
      pointLossPreventedByZero: false,
      isTie: true,
    };
  }

  const winner = total1 > total2 ? 1 : 2;
  const loser = winner === 1 ? character2 : character1;
  const loserIndex = winner === 1 ? 2 : 1;

  if (loser.PONTOS > 0) {
    loser.PONTOS--;
    return {
      block: BLOCKS.CONFRONTO,
      skillLabel: "poder",
      diceResult1,
      diceResult2,
      total1,
      total2,
      winner,
      pointAwardedTo: null,
      pointLostBy: loserIndex,
      pointLossPreventedByZero: false,
      isTie: false,
    };
  }

  return {
    block: BLOCKS.CONFRONTO,
    skillLabel: "poder",
    diceResult1,
    diceResult2,
    total1,
    total2,
    winner,
    pointAwardedTo: null,
    pointLostBy: null,
    pointLossPreventedByZero: true,
    isTie: false,
  };
}

function resolveRound(character1, character2, block, diceResult1, diceResult2) {
  if (block === BLOCKS.RETA || block === BLOCKS.CURVA) {
    return resolveSkillRound(character1, character2, block, diceResult1, diceResult2);
  }

  return resolveConfrontationRound(character1, character2, diceResult1, diceResult2);
}

module.exports = {
  baseCharacters,
  BLOCKS,
  cloneCharacter,
  rollDice,
  getRandomBlock,
  resolveRound,
};
