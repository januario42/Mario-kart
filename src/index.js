const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const {
  baseCharacters,
  BLOCKS,
  cloneCharacter,
  rollDice,
  getRandomBlock,
  resolveRound,
} = require("./game");

const TOTAL_ROUNDS = 5;

const style = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function paint(text, colorCode) {
  return `${colorCode}${text}${style.reset}`;
}

function statBar(value, max = 6) {
  const fill = "=".repeat(value);
  const empty = "-".repeat(max - value);
  return `[${fill}${empty}]`;
}

function progressBar(value, max) {
  const fill = "#".repeat(value);
  const empty = "-".repeat(max - value);
  return `[${fill}${empty}]`;
}

function titleLine(text) {
  const total = 62;
  const inner = ` ${text} `;
  const side = Math.max(0, Math.floor((total - inner.length) / 2));
  return `${"=".repeat(side)}${inner}${"=".repeat(total - inner.length - side)}`;
}

function printTitle() {
  console.clear();
  console.log(paint(titleLine("MARIO KART TERMINAL"), style.yellow));
  console.log(paint("Escolha dois pilotos e veja o HUD da corrida em 5 rodadas.", style.dim));
  console.log();
}

function printCharacterCard(character, index) {
  const numberTag = paint(`[${index + 1}]`, style.cyan);
  const name = paint(character.NOME.padEnd(14), style.white);
  const vel = paint(statBar(character.VELOCIDADE), style.green);
  const man = paint(statBar(character.MANOBRABILIDADE), style.blue);
  const pod = paint(statBar(character.PODER), style.red);

  console.log(`${numberTag} ${name} VEL ${vel} MAN ${man} POD ${pod}`);
}

function showCharacterMenu() {
  printTitle();
  for (let i = 0; i < baseCharacters.length; i++) {
    printCharacterCard(baseCharacters[i], i);
  }
  console.log();
}

function printDuelBanner(character1, character2) {
  console.log(paint(titleLine(`DUEL: ${character1.NOME} VS ${character2.NOME}`), style.magenta));
}

function printScore(character1, character2) {
  const p1Line = `${character1.NOME.padEnd(14)} ${progressBar(character1.PONTOS, TOTAL_ROUNDS)} ${character1.PONTOS}`;
  const p2Line = `${character2.NOME.padEnd(14)} ${progressBar(character2.PONTOS, TOTAL_ROUNDS)} ${character2.PONTOS}`;

  console.log(paint("SCORE", style.cyan));
  console.log(paint(p1Line, style.white));
  console.log(paint(p2Line, style.white));
}

function blockColor(block) {
  if (block === BLOCKS.RETA) return style.green;
  if (block === BLOCKS.CURVA) return style.blue;
  return style.red;
}

function getAttributeFromBlock(block) {
  if (block === BLOCKS.RETA) return "VELOCIDADE";
  if (block === BLOCKS.CURVA) return "MANOBRABILIDADE";
  return "PODER";
}

function printRollLine(characterName, diceResult, attributeLabel, attributeValue, totalValue) {
  const text = `${characterName.padEnd(14)} D${diceResult} + ${attributeLabel.slice(0, 3)} ${attributeValue} = ${totalValue}`;
  console.log(text);
}

function logRoundOutcome(roundData, character1, character2) {
  const attributeLabel = getAttributeFromBlock(roundData.block);
  const attr1 = character1[attributeLabel];
  const attr2 = character2[attributeLabel];

  printRollLine(character1.NOME, roundData.diceResult1, attributeLabel, attr1, roundData.total1);
  printRollLine(character2.NOME, roundData.diceResult2, attributeLabel, attr2, roundData.total2);

  if (roundData.block === BLOCKS.CONFRONTO) {
    if (roundData.isTie) {
      console.log(paint("Resultado: confronto empatado, nenhum ponto perdido.", style.dim));
      return;
    }

    if (roundData.winner === 1 && roundData.pointLostBy === 2) {
      console.log(paint(`Resultado: ${character1.NOME} venceu e ${character2.NOME} perdeu 1 ponto.`, style.red));
      return;
    }

    if (roundData.winner === 2 && roundData.pointLostBy === 1) {
      console.log(paint(`Resultado: ${character2.NOME} venceu e ${character1.NOME} perdeu 1 ponto.`, style.red));
      return;
    }

    if (roundData.winner === 1 && roundData.pointLossPreventedByZero) {
      console.log(paint(`Resultado: ${character1.NOME} venceu, mas ${character2.NOME} ja estava com 0 ponto.`, style.dim));
      return;
    }

    if (roundData.winner === 2 && roundData.pointLossPreventedByZero) {
      console.log(paint(`Resultado: ${character2.NOME} venceu, mas ${character1.NOME} ja estava com 0 ponto.`, style.dim));
    }
    return;
  }

  if (roundData.winner === 1) {
    console.log(paint(`Resultado: ${character1.NOME} ganhou +1 ponto.`, style.green));
  } else if (roundData.winner === 2) {
    console.log(paint(`Resultado: ${character2.NOME} ganhou +1 ponto.`, style.green));
  } else {
    console.log(paint("Resultado: empate, sem pontuacao.", style.dim));
  }
}

async function askCharacter(rl, label, blockedIndex = null) {
  while (true) {
    const answer = await rl.question(paint(`${label} (1-${baseCharacters.length}): `, style.bold));
    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= baseCharacters.length) {
      console.log(paint("Entrada invalida. Digite um numero da lista.", style.yellow));
      continue;
    }

    if (blockedIndex !== null && selectedIndex === blockedIndex) {
      console.log(paint("Escolha personagens diferentes.", style.yellow));
      continue;
    }

    return selectedIndex;
  }
}

async function selectPlayers() {
  const rl = readline.createInterface({ input, output });

  try {
    showCharacterMenu();

    const firstIndex = await askCharacter(rl, "Escolha o Piloto 1");
    const secondIndex = await askCharacter(rl, "Escolha o Piloto 2", firstIndex);

    const player1 = cloneCharacter(baseCharacters[firstIndex]);
    const player2 = cloneCharacter(baseCharacters[secondIndex]);

    console.log();
    console.log(paint(`Selecao confirmada: ${player1.NOME} vs ${player2.NOME}`, style.green));
    console.log();

    return [player1, player2];
  } finally {
    rl.close();
  }
}

async function playRaceEngine(character1, character2) {
  printDuelBanner(character1, character2);

  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    console.log();
    console.log(paint(titleLine(`RODADA ${round}/${TOTAL_ROUNDS}`), style.yellow));

    const block = getRandomBlock();
    console.log(`Pista: ${paint(block, blockColor(block))}`);

    const diceResult1 = rollDice();
    const diceResult2 = rollDice();

    const roundData = resolveRound(character1, character2, block, diceResult1, diceResult2);
    logRoundOutcome(roundData, character1, character2);
    console.log();
    printScore(character1, character2);
  }
}

async function declareWinner(character1, character2) {
  console.log();
  console.log(paint(titleLine("RESULTADO FINAL"), style.yellow));
  printScore(character1, character2);

  if (character1.PONTOS > character2.PONTOS) {
    console.log(paint(`Vencedor: ${character1.NOME}`, style.green));
    return;
  }

  if (character2.PONTOS > character1.PONTOS) {
    console.log(paint(`Vencedor: ${character2.NOME}`, style.green));
    return;
  }

  console.log(paint("Vencedor: empate", style.cyan));
}

(async function main() {
  const [player1, player2] = await selectPlayers();
  await playRaceEngine(player1, player2);
  await declareWinner(player1, player2);
})();
