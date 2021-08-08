/**
 *  @file       index.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       Aug 2021
 *
 * Main module for my genetic alg/NN learning program
 */

// @ts-ignore
module.declare(['./src/neuralNet', './src/geneticAlg', './src/player', './src/settings'], function(require, exports, modules) {
  const { NeuralNetwork, } = require('./src/neuralNet');
  const { GeneticAlgorithm, } = require('./src/geneticAlg');
  const { Player, } = require('./src/player');
  const { settings, } = require('./src/settings');

  let canvas, context, neuralNet, geneticAlg, playerList;
  let endLocation = settings.endLocation;

  /**
   * Runs one iteration of the game loop. Update all locations and redraw the screen.
   */
  function eventLoop() {
    if (settings.eventLoopTimeout >= 0) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'red';
      context.fillRect(endLocation[0] - 20, endLocation[1] - 20, 40, 40);
      context.fillStyle = 'black';
    }
    for (const ai of playerList) {
      ai.updatePosition(endLocation);
      if (settings.eventLoopTimeout >= 0) {
        context.fillRect(ai.x - 10, ai.y - 10, 20, 20);
      }
    }
  }

  /**
   * Entire loop with all generations for the AI to learn.
   */
  async function gameLoop() {
    let generationsRun = 0;
    while (generationsRun < settings.generations) {
      generationsRun++;
      for (let alive = 0; alive < settings.gameTicks; alive++) {
        eventLoop();
        // Function will by sync if eventLoopTimeout is < 0.
        if (settings.eventLoopTimeout >= 0) {
          await new Promise(r => setTimeout(r, settings.eventLoopTimeout));
        }
      }
      const fitness = [];
      for (const player of playerList) {
        const fitnessScore = geneticAlg.findFitness(player.x, player.y, endLocation[0], endLocation[1]);
        fitness.push(fitnessScore);
      }
      geneticAlg.evolve(fitness);
      endLocation = [Math.floor(Math.random() * settings.width), Math.floor(Math.random() * settings.height)];
      const playerStartLoc = [Math.floor(Math.random() * settings.width), Math.floor(Math.random() * settings.height)];
      for (const i in playerList) {
        playerList[i].updateAIWeights(geneticAlg.population[i]);
        playerList[i].x = playerStartLoc[0];
        playerList[i].y = playerStartLoc[1];
      }
    }
  }

  /**
   * Main function
   */
  function main() {
    canvas = document.getElementById('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;
    context = canvas.getContext('2d');

    neuralNet = new NeuralNetwork();
    const dnaSize = neuralNet.inputSize * neuralNet.hiddenSize + neuralNet.hiddenSize * neuralNet.outputSize;
    geneticAlg = new GeneticAlgorithm(dnaSize, settings.crossRate, settings.mutationRate, settings.popSize, settings.learningRate);
    playerList = [];
    for (let i = 0; i < settings.popSize; i++) {
      const p = new Player(settings.width, settings.height, 'ai', neuralNet, geneticAlg.population[i]);
      playerList.push(p);
    }
    gameLoop();
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
