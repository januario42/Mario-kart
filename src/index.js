const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

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

const characters = [
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

function paint(text, colorCode) {
  return `${colorCode}${text}${style.reset}`;
}

function statBar(value, max = 6) {
  const fill = "#".repeat(value);
  const empty = "-".repeat(max - value);
  return `[${fill}${empty}]`;
}

function cloneCharacter(character) {
  return {
    ...character,
    PONTOS: 0,
  };
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
  for (let i = 0; i < characters.length; i++) {
    printCharacterCard(characters[i], i);
  }
  console.log();
}

function printScore(character1, character2) {
  const score = `${character1.NOME} ${character1.PONTOS} x ${character2.PONTOS} ${character2.NOME}`;
  console.log(paint(score, style.magenta));
}

async function askCharacter(rl, label, blockedIndex = null) {
  while (true) {
    const answer = await rl.question(paint(`${label} (1-${characters.length}): `, style.bold));
    const selectedIndex = Number.parseInt(answer, 10) - 1;

    if (Number.isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= characters.length) {
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

    const player1 = cloneCharacter(characters[firstIndex]);
    const player2 = cloneCharacter(characters[secondIndex]);

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

async function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

async function getRandomBlock() {
  const random = Math.random();

  if (random < 0.33) return "RETA";
  if (random < 0.66) return "CURVA";
  return "CONFRONTO";
}

function blockColor(block) {
  if (block === "RETA") return style.green;
  if (block === "CURVA") return style.blue;
  return style.red;
}

async function logRollResult(characterName, block, diceResult, attribute) {
  console.log(
    `${characterName} rolou ${block}: ${diceResult} + ${attribute} = ${diceResult + attribute}`
  );
}

async function playRaceEngine(character1, character2) {
  for (let round = 1; round <= 5; round++) {
    console.log(paint(`\n------------------- RODADA ${round} -------------------`, style.yellow));

    const block = await getRandomBlock();
    console.log(paint(`Bloco sorteado: ${block}`, blockColor(block)));

    const diceResult1 = await rollDice();
    const diceResult2 = await rollDice();

    let totalTestSkill1 = 0;
    let totalTestSkill2 = 0;

    if (block === "RETA") {
      totalTestSkill1 = diceResult1 + character1.VELOCIDADE;
      totalTestSkill2 = diceResult2 + character2.VELOCIDADE;

      await logRollResult(character1.NOME, "velocidade", diceResult1, character1.VELOCIDADE);
      await logRollResult(character2.NOME, "velocidade", diceResult2, character2.VELOCIDADE);
    }

    if (block === "CURVA") {
      totalTestSkill1 = diceResult1 + character1.MANOBRABILIDADE;
      totalTestSkill2 = diceResult2 + character2.MANOBRABILIDADE;

      await logRollResult(
        character1.NOME,
        "manobrabilidade",
        diceResult1,
        character1.MANOBRABILIDADE
      );
      await logRollResult(
        character2.NOME,
        "manobrabilidade",
        diceResult2,
        character2.MANOBRABILIDADE
      );
    }

    if (block === "CONFRONTO") {
      const powerResult1 = diceResult1 + character1.PODER;
      const powerResult2 = diceResult2 + character2.PODER;

      console.log(paint(`${character1.NOME} confrontou com ${character2.NOME}!`, style.red));

      await logRollResult(character1.NOME, "poder", diceResult1, character1.PODER);
      await logRollResult(character2.NOME, "poder", diceResult2, character2.PODER);

      if (powerResult1 > powerResult2 && character2.PONTOS > 0) {
        console.log(`${character1.NOME} venceu o confronto! ${character2.NOME} perdeu 1 ponto.`);
        character2.PONTOS--;
      } else if (powerResult1 > powerResult2) {
        console.log(`${character1.NOME} venceu o confronto, mas ${character2.NOME} estava com 0 ponto.`);
      }

      if (powerResult2 > powerResult1 && character1.PONTOS > 0) {
        console.log(`${character2.NOME} venceu o confronto! ${character1.NOME} perdeu 1 ponto.`);
        character1.PONTOS--;
      } else if (powerResult2 > powerResult1) {
        console.log(`${character2.NOME} venceu o confronto, mas ${character1.NOME} estava com 0 ponto.`);
      }

      if (powerResult2 === powerResult1) {
        console.log("Confronto empatado! Nenhum ponto foi perdido.");
      }
    }

    if (block !== "CONFRONTO") {
      if (totalTestSkill1 > totalTestSkill2) {
        console.log(paint(`${character1.NOME} marcou um ponto!`, style.green));
        character1.PONTOS++;
      } else if (totalTestSkill2 > totalTestSkill1) {
        console.log(paint(`${character2.NOME} marcou um ponto!`, style.green));
        character2.PONTOS++;
      } else {
        console.log(paint("Empate na rodada. Sem pontuacao.", style.dim));
      }
    }

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
