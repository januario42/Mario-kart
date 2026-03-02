const test = require("node:test");
const assert = require("node:assert/strict");
const {
  baseCharacters,
  BLOCKS,
  cloneCharacter,
  rollDice,
  getRandomBlock,
  resolveRound,
} = require("../src/game");

function makePlayers(index1 = 0, index2 = 1) {
  return [
    cloneCharacter(baseCharacters[index1]),
    cloneCharacter(baseCharacters[index2]),
  ];
}

test("cloneCharacter reseta PONTOS para 0", () => {
  const clone = cloneCharacter({ ...baseCharacters[0], PONTOS: 99 });
  assert.equal(clone.PONTOS, 0);
});

test("rollDice retorna valor entre 1 e 6", () => {
  assert.equal(rollDice(() => 0), 1);
  assert.equal(rollDice(() => 0.999999), 6);
});

test("getRandomBlock retorna RETA, CURVA e CONFRONTO conforme faixa", () => {
  assert.equal(getRandomBlock(() => 0.1), BLOCKS.RETA);
  assert.equal(getRandomBlock(() => 0.5), BLOCKS.CURVA);
  assert.equal(getRandomBlock(() => 0.9), BLOCKS.CONFRONTO);
});

test("RETA: vencedor ganha 1 ponto", () => {
  const [p1, p2] = makePlayers(0, 1);
  const result = resolveRound(p1, p2, BLOCKS.RETA, 6, 1);

  assert.equal(result.winner, 1);
  assert.equal(result.pointAwardedTo, 1);
  assert.equal(p1.PONTOS, 1);
  assert.equal(p2.PONTOS, 0);
});

test("CURVA: empate nao altera pontuacao", () => {
  const [p1, p2] = makePlayers(1, 4);
  const result = resolveRound(p1, p2, BLOCKS.CURVA, 2, 2);

  assert.equal(result.winner, null);
  assert.equal(result.isTie, true);
  assert.equal(p1.PONTOS, 0);
  assert.equal(p2.PONTOS, 0);
});

test("CONFRONTO: perdedor perde 1 ponto quando possui pontos", () => {
  const [p1, p2] = makePlayers(3, 0);
  p2.PONTOS = 2;

  const result = resolveRound(p1, p2, BLOCKS.CONFRONTO, 6, 1);

  assert.equal(result.winner, 1);
  assert.equal(result.pointLostBy, 2);
  assert.equal(result.pointLossPreventedByZero, false);
  assert.equal(p2.PONTOS, 1);
});

test("CONFRONTO: nao permite pontuacao negativa", () => {
  const [p1, p2] = makePlayers(3, 0);
  p2.PONTOS = 0;

  const result = resolveRound(p1, p2, BLOCKS.CONFRONTO, 6, 1);

  assert.equal(result.winner, 1);
  assert.equal(result.pointLostBy, null);
  assert.equal(result.pointLossPreventedByZero, true);
  assert.equal(p2.PONTOS, 0);
});

test("CONFRONTO: empate nao altera pontos", () => {
  const [p1, p2] = makePlayers(3, 5);
  p1.PONTOS = 1;
  p2.PONTOS = 1;

  const result = resolveRound(p1, p2, BLOCKS.CONFRONTO, 4, 4);

  assert.equal(result.winner, null);
  assert.equal(result.isTie, true);
  assert.equal(result.pointLostBy, null);
  assert.equal(p1.PONTOS, 1);
  assert.equal(p2.PONTOS, 1);
});
