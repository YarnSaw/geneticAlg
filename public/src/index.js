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

  let canvas, context, neuralNet, geneticAlg, playerList; // Generic global scope elements
  let keystore, keystoreLoader, localExec, usingDCP; // DCP specific global scope
  let endLocation = settings.endLocation; // Global because I haven't refactored it to not be yet.

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
    if (usingDCP.checked) {
      const compute = dcp.compute;
      const workFunction = function work(undef, settings) {
        progress();
        const { GeneticAlgorithm, } = require('./geneticAlg');
        const { Player, } = require('./player');
        const { NeuralNetwork, } = require('./neuralNet');

        const neuralNet = new NeuralNetwork();
        const dnaSize = neuralNet.inputSize * neuralNet.hiddenSize + neuralNet.hiddenSize * neuralNet.outputSize;
        const geneticAlg = new GeneticAlgorithm(dnaSize, settings.crossRate, settings.mutationRate, 50, settings.learningRate);
        const playerList = [];
        for (let i = 0; i < 50; i++) {
          const p = new Player(settings.width, settings.height, 'ai', neuralNet, geneticAlg.population[i]);
          playerList.push(p);
        }
        let endLocation = [Math.floor(Math.random() * settings.width), Math.floor(Math.random() * settings.height)];
        let generationsRun = 0;
        while (generationsRun < settings.generations) {
          progress();
          generationsRun++;
          for (let alive = 0; alive < settings.gameTicks; alive++) {
            for (const ai of playerList) {
              ai.updatePosition(endLocation);
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
        return geneticAlg.population;
      };

      const job = compute.for(
        1, Math.floor(settings.popSize / 50), workFunction, [settings]
      );

      job.on('accepted', () => {
        console.log(` - Job accepted by scheduler, waiting for results`);
        console.log(` - Job has id ${job.id}`);
      });

      job.on('readystatechange', (arg) => {
        console.log(`new ready state: ${arg}`);
      });

      job.on('result', (ev) => {
        console.log("Got a result", ev.sliceNumber);
      });

      job.on(('error'), (ev) => {
        console.log(ev);
      });

      job.requires('./geneticAlg');
      job.requires('./player');
      job.requires('./neuralNet');
      job.public.name = "GA and NN";
      job.setPaymentAccountKeystore(keystore);

      let results;
      if (document.getElementById("localExec").checked) {
        results = await job.localExec();
      } else {
        results = await job.exec(compute.marketValue);
      }
      results = Array.from(results);
      debugger;
      const neuralNet = new NeuralNetwork();
      const dnaSize = neuralNet.inputSize * neuralNet.hiddenSize + neuralNet.hiddenSize * neuralNet.outputSize;
      const geneticAlg = new GeneticAlgorithm(dnaSize, settings.crossRate, settings.mutationRate, 50, settings.learningRate);
      geneticAlg.population = results.flat();
      const playerList = [];
      for (let i = 0; i < 50; i++) {
        const p = new Player(settings.width, settings.height, 'ai', neuralNet, geneticAlg.population[i]);
        playerList.push(p);
      }
      let endLocation = [Math.floor(Math.random() * settings.width), Math.floor(Math.random() * settings.height)];

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
        endLocation = [Math.floor(Math.random() * settings.width), Math.floor(Math.random() * settings.height)];
        const playerStartLoc = [Math.floor(Math.random() * settings.width), Math.floor(Math.random() * settings.height)];
        for (const i in playerList) {
          playerList[i].updateAIWeights(geneticAlg.population[i]);
          playerList[i].x = playerStartLoc[0];
          playerList[i].y = playerStartLoc[1];
        }
      }
    } else {
      neuralNet = new NeuralNetwork();
      const dnaSize = neuralNet.inputSize * neuralNet.hiddenSize + neuralNet.hiddenSize * neuralNet.outputSize;
      geneticAlg = new GeneticAlgorithm(dnaSize, settings.crossRate, settings.mutationRate, settings.popSize, settings.learningRate);
      playerList = [];
      for (let i = 0; i < settings.popSize; i++) {
        const p = new Player(settings.width, settings.height, 'ai', neuralNet, geneticAlg.population[i]);
        playerList.push(p);
      }
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
  }

  /**
   * Main function
   */
  function main() {
    canvas = document.getElementById('canvas');
    canvas.width = settings.width;
    canvas.height = settings.height;
    context = canvas.getContext('2d');

    usingDCP = document.getElementById("useDCP");

    const DCPSettings = [];
    const keystoreLoaderLabel = document.getElementById("keystoreLabel");
    keystoreLoader = document.getElementById("keystoreFile");
    DCPSettings.push(keystoreLoader);
    localExec = document.getElementById('localExec');
    DCPSettings.push(localExec);

    usingDCP.addEventListener('change', (ev) => {
      if (usingDCP.checked) {
        for (const setting of DCPSettings) {
          setting.disabled = false;
        }
      } else {
        for (const setting of DCPSettings) {
          setting.disabled = true;
        }
      }
    });

    const wallet = dcp.wallet;
    keystoreLoader.addEventListener('click', async(ev) => {
      ev.preventDefault();
      keystore = await wallet.get();
      keystoreLoader.style.display = 'none';
      keystoreLoaderLabel.style.display = 'none';
    });

    document.getElementById('form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      console.log(ev);
      gameLoop();
    });
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
