/**
 *  @file       index.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       Aug 2021
 *
 * Main module for my genetic alg/NN learning program
 */

// @ts-ignore
module.declare(['./src/neuralNet', './src/geneticAlg', './src/player', './src/settings'], function(require, exports, modules) {
  const { settings, } = require('./src/settings');

  let canvas, context;
  let keystore, keystoreLoader, localExec, usingDCP; // DCP specific global scope

  /**
   * Runs one iteration of the game loop. Update all locations and redraw the screen.
   */
  function eventLoop(playerList, wallList, inDCP, endLocation, learning, soloPlayer) {
    if (settings.eventLoopTimeout >= 0) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'red';
      context.fillRect(endLocation[0] - 20 + (canvas.width / 2), endLocation[1] - 20 + (canvas.height / 2), 40, 40);
      context.beginPath();
      for (const wall of wallList) {
        context.moveTo(wall.startX + canvas.width / 2, wall.startY + (canvas.height / 2));
        context.lineTo(wall.endX + canvas.width / 2, wall.endY + (canvas.height / 2));
      }
      context.strokeStyle = '#0000ff';
      context.stroke();
      context.fillStyle = 'black';
    }
    for (const ai of playerList) {
      ai.updatePosition(endLocation, wallList, learning);
      for (const wall of wallList) {
        // You hit a wall, you die
        if (wall.intersect(ai.x, ai.y)) {
          ai.alive = false;
          ai.x = ai.gameWidth;
          ai.y = ai.gameWidth;
        }
      }
      if (settings.eventLoopTimeout >= 0) {
        context.fillRect(ai.x - 10 + (canvas.width / 2), ai.y - 10 + (canvas.height / 2), 20, 20);
      }
    }
    if (soloPlayer) {
      soloPlayer.updatePosition(null, wallList, learning);
      for (const wall of wallList) {
        // You hit a wall, player get's tped but doesn't die
        if (wall.intersect(soloPlayer.x, soloPlayer.y)) {
          soloPlayer.x = soloPlayer.gameWidth / 2;
          soloPlayer.y = soloPlayer.gameWidth / 2;
        }
      }
      context.fillRect(soloPlayer.x - 10 + (canvas.width / 2), soloPlayer.y - 10 + (canvas.height / 2), 20, 20);  
    }
  }

  /**
   * Run a full loop of multiple generations of learning
   * @param {*} _undef - used for slice count in dcp. Not used, but needs to be the first input
   * @param {object} settings - settings for system
   * @param {boolean} inDCP - is this running in a DCP environment?
   * @param {Array<number[]>} fillPop - pre-trained population to use instead of a randomly generated one
   * @param {boolean} learn - should the GA learn or just repeat the same population over generations
   * @returns List of newly trained population after all generations
   */
  async function gameLoop(_undef, settings, inDCP, fillPop, learn) {
    let GeneticAlgorithm, Player, NeuralNetwork, Wall;
    if (inDCP) {
      Player = require('player.js').Player;
      Wall = require('player.js').Wall;
      NeuralNetwork = require('neuralNet.js').NeuralNetwork;
      GeneticAlgorithm = require('geneticAlg.js').GeneticAlgorithm;
    } else {
      Player = require('./src/player').Player;
      Wall = require('./src/player').Wall;
      NeuralNetwork = require('./src/neuralNet').NeuralNetwork;
      GeneticAlgorithm = require('./src/geneticAlg').GeneticAlgorithm;
    }

    const neuralNet = new NeuralNetwork();
    const dnaSize = neuralNet.inputSize * neuralNet.hiddenSize + neuralNet.hiddenSize * neuralNet.outputSize;
    const geneticAlg = new GeneticAlgorithm(dnaSize, settings.crossRate, settings.mutationRate, settings.popSize, settings.learningRate);
    if (fillPop) {
      geneticAlg.population = fillPop;
    }
    const playerList = [];
    let wallList = [];
    for (let i = 0; i < settings.popSize; i++) {
      const p = new Player(settings.width, settings.height, 'ai', neuralNet, geneticAlg.population[i]);
      playerList.push(p);
    }
    wallList.push(new Wall(-100, -100, -100, 100));

    let playerStartLoc;
    let endLocation = [Math.floor(Math.random() * settings.width - (settings.width / 2)), Math.floor(Math.random() * settings.height - (settings.height / 2))];
    let generationsRun = 0;
    while (generationsRun < settings.generations) {
      if (inDCP) {
        // @ts-ignore
        progress(); // eslint-disable-line no-undef
      }
      if (!inDCP) {
        const gen = document.getElementById('genCount');
        gen.innerHTML = generationsRun.toString();
      }
      generationsRun++;
      for (let alive = 0; alive < settings.gameTicks; alive++) {
        if (inDCP) {
          for (const ai of playerList) {
            ai.updatePosition(endLocation, wallList, learn);
          }
        } else {
          eventLoop(playerList, wallList, inDCP, endLocation, learn);
          if (settings.eventLoopTimeout >= 0) {
            await new Promise(r => setTimeout(r, settings.eventLoopTimeout));
          }
        }
      }
      let nextEndLocation;
      while (true) {
        nextEndLocation = [Math.floor(Math.random() * settings.width - (settings.width / 2)), Math.floor(Math.random() * settings.height - (settings.height / 2))];
        playerStartLoc = [Math.floor(Math.random() * settings.width) - (settings.width / 2), Math.floor(Math.random() * settings.height - (settings.height / 2))];
        if (Math.sqrt((nextEndLocation[0] - playerStartLoc[0]) ** 2 + (nextEndLocation[1] - playerStartLoc[1]) ** 2) > settings.width / 2) {
          break;
        }
      }
      const smallX = Math.min(playerStartLoc[0], nextEndLocation[0]);
      const smallY = Math.min(playerStartLoc[1], nextEndLocation[1]);
      const largeX = Math.max(playerStartLoc[0], nextEndLocation[0]);
      const largeY = Math.max(playerStartLoc[1], nextEndLocation[1]);
      wallList = [];
      while (true) {
        const wallStartX = Math.floor(Math.random() * (largeX - smallX)) + smallX;
        const wallStartY = Math.floor(Math.random() * (largeY - smallY)) + smallY;
        const wallEndX = Math.floor(Math.random() * (largeX - smallX)) + smallX;
        const wallEndY = Math.floor(Math.random() * (largeY - smallY)) + smallY;
        const wallSize = Math.sqrt((wallStartX - wallEndX) ** 2 + (wallStartY - wallEndY) ** 2);
        if (wallSize > 75) {
          wallList.push(new Wall(wallStartX, wallStartY, wallEndX, wallEndY));
          break;
        }
      }
      if (learn) {
        const fitness = [];
        for (const player of playerList) {
          player.alive = true; // Revive dead people. Even dead people deserve to live.
          const fitnessScore = geneticAlg.findFitness(player.x, player.y, endLocation[0], endLocation[1]);
          fitness.push(fitnessScore);
        }
        geneticAlg.evolve(fitness);
        // Guarantee the starting location and ending location are fairly separate.
        endLocation = nextEndLocation;
        for (const i in playerList) {
          playerList[i].updateAIWeights(geneticAlg.population[i]);
          playerList[i].x = playerStartLoc[0];
          playerList[i].y = playerStartLoc[1];
        }
      } else {
        // Guarantee the starting location and ending location are fairly separate.
        endLocation = nextEndLocation;
        for (const i in playerList) {
          playerList[i].x = playerStartLoc[0];
          playerList[i].y = playerStartLoc[1];
        }
      }
    }
    return geneticAlg.population;
  }

  /**
   * Entire loop with all generations for the AI to learn.
   */
  async function runGame() {
    if (usingDCP.checked) {
      const compute = dcp.compute;

      const dcpSettings = JSON.parse(JSON.stringify(settings));
      dcpSettings.popSize = settings.popPerSlice;
      dcpSettings.generations = dcpSettings.gensPerSlice;
      settings.popSize = settings.popPerSlice * settings.numSlices;

      const numSlices = settings.numSlices;
      const job = compute.for(
        1, numSlices, gameLoop, [dcpSettings, true, undefined, true]
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
        const slice = document.getElementById('slices');
        slice.innerHTML = (parseFloat(slice.innerHTML) + 1).toString();
      });

      job.on(('error'), (ev) => {
        console.log(ev);
      });

      job.requires(['square_game/geneticAlg.js', 'square_game/player.js', 'square_game/neuralNet.js']);
      job.public.name = "GA and NN";
      job.setPaymentAccountKeystore(keystore);

      let results;
      // @ts-ignore
      if (document.getElementById("localExec").checked) {
        results = await job.localExec();
      } else {
        results = await job.exec(compute.marketValue);
      }
      results = Array.from(results);
      results = results.flat();
      settings.generations = 40;
      // Make sure new pop isn't massively big
      for (let i = 0; i < (results.length / 2); i++) {
        const selected = Math.floor(Math.random() * results.length);
        results.splice(selected, 1);
      }
      settings.popSize /= 2;
      gameLoop(null, settings, null, results, true);
    } else {
      gameLoop(null, settings, null, null, true);
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
      runGame();
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
