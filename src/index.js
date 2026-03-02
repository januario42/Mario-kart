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
  const fill = "#".repeat(value);
  const empty = "-".repeat(max - value);
  return `[${fill}${empty}]`;
}

function printTitle() {
  console.clear();
  console.log(paint("============================================================", style.yellow));
  console.log(paint("                     MARIO KART TERMINAL                    ", style.bold));
  console.log(paint("============================================================", style.yellow));
  console.log(paint("Selecione dois personagens para a corrida de 5 rodadas.", style.dim));
  console.log();
}

function printCharacterCard(character, index) {
  const numberTag = paint(`[${index + 1}]`, style.cyan);
  const name = paint(character.NOME.padEnd(12), style.white);

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

function printScore(character1, character2) {
  const score = `${character1.NOME} ${character1.PONTOS} x ${character2.PONTOS} ${character2.NOME}`;
  console.log(paint(score, style.magenta));
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

    const firstIndex = await askCharacter(rl, "Escolha o Personagem 1");
    const secondIndex = await askCharacter(rl, "Escolha o Personagem 2", firstIndex);

    const player1 = cloneCharacter(baseCharacters[firstIndex]);
    const player2 = cloneCharacter(baseCharacters[secondIndex]);

    console.log();
    console.log(
      paint(
        `Duelo confirmado: ${player1.NOME} vs ${player2.NOME}`,
        style.green
      )
    );
    console.log();

    return [player1, player2];
  } finally {
    rl.close();
  }
}

function blockColor(block) {
  if (block === BLOCKS.RETA) return style.green;
  if (block === BLOCKS.CURVA) return style.blue;
  return style.red;
}

function logRollResult(characterName, skillLabel, diceResult, attribute) {
  console.log(
    `${characterName} rolou ${skillLabel}: ${diceResult} + ${attribute} = ${diceResult + attribute}`
  );
}

function logRoundOutcome(roundData, character1, character2) {
  if (roundData.block === BLOCKS.CONFRONTO) {
    console.log(paint(`${character1.NOME} confrontou com ${character2.NOME}!`, style.red));
    logRollResult(character1.NOME, "poder", roundData.diceResult1, character1.PODER);
    logRollResult(character2.NOME, "poder", roundData.diceResult2, character2.PODER);

    if (roundData.isTie) {
      console.log("Confronto empatado! Nenhum ponto foi perdido.");
      return;
    }

    if (roundData.winner === 1 && roundData.pointLostBy === 2) {
      console.log(`${character1.NOME} venceu o confronto! ${character2.NOME} perdeu 1 ponto.`);
      return;
    }

    if (roundData.winner === 2 && roundData.pointLostBy === 1) {
      console.log(`${character2.NOME} venceu o confronto! ${character1.NOME} perdeu 1 ponto.`);
      return;
    }

    if (roundData.winner === 1 && roundData.pointLossPreventedByZero) {
      console.log(`${character1.NOME} venceu o confronto, mas ${character2.NOME} estava com 0 ponto.`);
      return;
    }

    if (roundData.winner === 2 && roundData.pointLossPreventedByZero) {
      console.log(`${character2.NOME} venceu o confronto, mas ${character1.NOME} estava com 0 ponto.`);
    }
    return;
  }

  const attribute1 =
    roundData.block === BLOCKS.RETA ? character1.VELOCIDADE : character1.MANOBRABILIDADE;
  const attribute2 =
    roundData.block === BLOCKS.RETA ? character2.VELOCIDADE : character2.MANOBRABILIDADE;

  logRollResult(character1.NOME, roundData.skillLabel, roundData.diceResult1, attribute1);
  logRollResult(character2.NOME, roundData.skillLabel, roundData.diceResult2, attribute2);

  if (roundData.winner === 1) {
    console.log(paint(`${character1.NOME} marcou um ponto!`, style.green));
  } else if (roundData.winner === 2) {
    console.log(paint(`${character2.NOME} marcou um ponto!`, style.green));
  } else {
    console.log(paint("Empate na rodada. Sem pontuacao.", style.dim));
  }
}

async function playRaceEngine(character1, character2) {
  for (let round = 1; round <= 5; round++) {
    console.log(paint(`\n------------------- RODADA ${round} -------------------`, style.yellow));

    const block = getRandomBlock();
    console.log(paint(`Bloco sorteado: ${block}`, blockColor(block)));

    const diceResult1 = rollDice();
    const diceResult2 = rollDice();

    const roundData = resolveRound(character1, character2, block, diceResult1, diceResult2);
    logRoundOutcome(roundData, character1, character2);

    printScore(character1, character2);
  }
}

async function declareWinner(character1, character2) {
  console.log(paint("\n================= RESULTADO FINAL =================", style.yellow));
  console.log(`${character1.NOME}: ${character1.PONTOS} ponto(s)`);
  console.log(`${character2.NOME}: ${character2.PONTOS} ponto(s)`);

  if (character1.PONTOS > character2.PONTOS) {
    console.log(paint(`\n${character1.NOME} venceu a corrida! Parabens!`, style.green));
    return;
  }

  if (character2.PONTOS > character1.PONTOS) {
    console.log(paint(`\n${character2.NOME} venceu a corrida! Parabens!`, style.green));
    return;
  }

  console.log(paint("A corrida terminou em empate.", style.cyan));
}

(async function main() {
  const [player1, player2] = await selectPlayers();

  console.log(paint(`Corrida entre ${player1.NOME} e ${player2.NOME} comecando...`, style.bold));

  await playRaceEngine(player1, player2);
  await declareWinner(player1, player2);
})();
