
// @ts-ignore
module.declare(['./src/neuralNet', './src/geneticAlg'], function(require, exports, modules) {
  const { NeuralNetwork, } = require('./src/neuralNet');
  const { GeneticAlgorithm, } = require('./src/geneticAlg');

  let canvas, context, neuralNet, geneticAlg, playerList;
  const width = 500;
  const height = 500;
  const crossRate = 0.8;
  const mutationRate = 0.05;
  const popSize = 100;
  const learningRate = 0.05;
  const endLocation = [width / 4, 50];
  const gameTicks = 200;
  const generations = 10;

  class Player {
    constructor(gameWidth, gameHeight, controller, index) {
      this.x = gameWidth / 2;
      this.y = gameHeight - 20;
      this.startX = this.x;
      this.startY = this.y;
      this.controller = controller;
      if (this.controller === "human") {
        this.keysPressed = [0, 0, 0, 0];
        document.onkeydown = this.checkPressedKey.bind(this);
        document.onkeyup = this.checkUpKey.bind(this);
      } else {
        this.updateAIWeights(geneticAlg.population[index]);
      }
    }

    updateAIWeights(weights) {
      this.w1Intermediate = weights.slice(0, neuralNet.inputSize * neuralNet.hiddenSize);
      this.w1 = new Array(neuralNet.inputSize).fill().map((undef1, index) => Array.from({ length: neuralNet.hiddenSize, }, (undef2, index2) => this.w1Intermediate[index * neuralNet.hiddenSize + index2]));
      this.w2 = new Array(neuralNet.hiddenSize).fill().map((undef1, index) => Array.from({ length: neuralNet.outputSize, }, (undef2, index2) => weights[index * neuralNet.outputSize + index2]));
    }

    checkPressedKey(ev) {
      const key = ev.keyCode - 37;
      if (key >= 0 && key <= 3) {
        this.keysPressed[key] = 1;
      }
    }

    checkUpKey(ev) {
      const key = ev.keyCode - 37;
      if (key >= 0 && key <= 3) {
        this.keysPressed[key] = 0;
      }
    }

    updatePosition() {
      if (this.controller === "human") {
        for (let i = 0; i < this.keysPressed.length; i++) {
          if (this.keysPressed[i]) {
            // left
            if (i === 0) {
              this.x -= 3;
            }
            // up
            if (i === 1) {
              this.y -= 3;
            }
            // right
            if (i === 2) {
              this.x += 3;
            }
            // down
            if (i === 3) {
              this.y += 3;
            }
          }
        }
      } else {
        const movement = neuralNet.forward(
          [this.x, this.y, endLocation[0], endLocation[1]],
          this.w1, this.w2
        );
        if (movement[0] >= 0.5) {
          this.x += 3;
        } else {
          this.x -= 3;
        }
        if (movement[1] >= 0.5) {
          this.y += 3;
        } else {
          this.y -= 3;
        }
      }
      if (this.x > 500) {
        this.x = 500;
      }
      if (this.x < 0) {
        this.x = 0;
      }
      if (this.y > 500) {
        this.y = 500;
      }
      if (this.y < 0) {
        this.y = 0;
      }
    }
  }

  function gameLoop() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'red';
    context.fillRect(endLocation[0] - 20, endLocation[1] - 20, 40, 40);
    context.fillStyle = 'black';
    for (const ai of playerList) {
      ai.updatePosition();
      context.fillRect(ai.x - 10, ai.y - 10, 20, 20);
    }
  }

  async function main() {
    canvas = document.getElementById('canvas');
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext('2d');
    // player = new Player(width, height, "human");
    neuralNet = new NeuralNetwork();
    const dnaSize = neuralNet.inputSize * neuralNet.hiddenSize + neuralNet.hiddenSize * neuralNet.outputSize;
    geneticAlg = new GeneticAlgorithm(dnaSize, crossRate, mutationRate, popSize, learningRate);
    playerList = [];
    for (let i = 0; i < popSize; i++) {
      const p = new Player(width, height, 'ai', i);
      playerList.push(p);
    }
    gameLoop.gameTicks = 0;
    // roundInterval = setInterval(gameLoop, 50);
    let generationsRun = 0;
    while (generationsRun < generations) {
      generationsRun++;
      for (let alive = 0; alive < gameTicks; alive++) {
        gameLoop();
        await new Promise(r => setTimeout(r, 10));
      }
      const fitness = [];
      for (const player of playerList) {
        const fitnessScore = geneticAlg.findFitness(player.x, player.y, endLocation[0], endLocation[1]);
        fitness.push(fitnessScore);
      }
      geneticAlg.evolve(fitness);
      for (const i in playerList) {
        playerList[i].updateAIWeights(geneticAlg.population[i]);
        playerList[i].x = playerList[i].startX;
        playerList[i].y = playerList[i].startY;
      }
    }
  }

  if (document.readyState === "complete"
   // @ts-ignore
   || document.readyState === "loaded"
   || document.readyState === "interactive") {
    main();
  } else {
    document.addEventListener('DOMContentLoaded', (ev) => {
      main();
    });
  }
});
