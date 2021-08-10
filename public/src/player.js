/**
 *  @file       player.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       Aug 2021
 *
 * Simple player class. Players can be either human or ai controlled.
 * There will probably be a bug if you try to make 2 human controlled players
 */

// @ts-ignore
module.declare([], function(require, exports, modules) {
  class Player {
    constructor(gameWidth, gameHeight, controller, neuralNet, initialWeights) {
      this.x = gameWidth / 2;
      this.y = gameHeight - 20;
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.controller = controller;
      this.neuralNet = neuralNet;
      if (this.controller === "human") {
        this.keysPressed = [0, 0, 0, 0];
        document.onkeydown = this.checkPressedKey.bind(this);
        document.onkeyup = this.checkUpKey.bind(this);
      } else {
        this.updateAIWeights(initialWeights);
      }
    }

    updateAIWeights(weights) {
      this.w1Intermediate = weights.slice(0, this.neuralNet.inputSize * this.neuralNet.hiddenSize);
      this.w1 = new Array(this.neuralNet.inputSize).fill().map((undef1, index) => Array.from({ length: this.neuralNet.hiddenSize, }, (undef2, index2) => this.w1Intermediate[index * this.neuralNet.hiddenSize + index2]));
      this.w2Intermediate = weights.slice(this.neuralNet.inputSize * this.neuralNet.hiddenSize, weights.length);
      this.w2 = new Array(this.neuralNet.hiddenSize).fill().map((undef1, index) => Array.from({ length: this.neuralNet.outputSize, }, (undef2, index2) => this.w2Intermediate[index * this.neuralNet.outputSize + index2]));
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

    updatePosition(goalLocation) {
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
        const movement = this.neuralNet.forward(
          [this.x, this.y, goalLocation[0], goalLocation[1]],
          this.w1, this.w2
        );
        if (movement[0] >= 0.66) {
          this.x += 3;
        } else if (movement[0] <= 0.33) {
          this.x -= 3;
        }
        if (movement[1] >= 0.5) {
          this.y += 3;
        } else if (movement[1] <= 0.33) {
          this.y -= 3;
        }
      }
      if (this.x > this.gameWidth) {
        this.x = this.gameWidth;
      }
      if (this.x < 0) {
        this.x = 0;
      }
      if (this.y > this.gameHeight) {
        this.y = this.gameHeight;
      }
      if (this.y < 0) {
        this.y = 0;
      }
    }
  }
  exports.Player = Player;
});
