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
  /**
   * Find distance between 2 points
   * @param {number[]} p1 - point 1
   * @param {number[]} p2 - point 2
   * @returns Distance between points
   */
  function distance(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
  }

  class Player {
    constructor(gameWidth, gameHeight, controller, neuralNet, initialWeights, walls) {
      this.x = 0;
      this.y = 0;
      this.alive = true;
      this.gameWidth = gameWidth;
      this.gameHeight = gameHeight;
      this.controller = controller;
      this.neuralNet = neuralNet;
      this.walls = walls;
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
        ev.preventDefault();
        this.keysPressed[key] = 1;
      }
    }

    checkUpKey(ev) {
      const key = ev.keyCode - 37;
      if (key >= 0 && key <= 3) {
        ev.preventDefault();
        this.keysPressed[key] = 0;
      }
    }

    updatePosition(goalLocation, walls, training) {
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
        if (this.alive) {
          const sight = this.checkDistanceToWalls(walls);
          const movement = this.neuralNet.forward(
            [this.x, this.y, goalLocation[0], goalLocation[1], ...sight],
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
      }
      if (!training) {
        if (this.x > this.gameWidth / 2) {
          this.x = this.gameWidth / 2;
        }
        if (this.x < -this.gameWidth / 2) {
          this.x = -this.gameWidth / 2;
        }
        if (this.y > this.gameHeight / 2) {
          this.y = this.gameHeight / 2;
        }
        if (this.y < -this.gameHeight / 2) {
          this.y = -this.gameHeight / 2;
        }
      }
    }

    checkDistanceToWalls(walls) {
      /*
      0 - w
      1 - n
      2 - e
      3 - s
      4 - n/w
      5 - n/e
      6 - s/e
      7 - s/w
      */
      const distanceList = new Array(8).fill(400);
      for (const wall of walls) {
        const wallSmallX = Math.min(wall.startX, wall.endX);
        const wallSmallY = Math.min(wall.startY, wall.endY);
        const wallBigX = Math.max(wall.startX, wall.endX);
        const wallBigY = Math.max(wall.startY, wall.endY);
        if (wall.vertical) {
          if (Math.abs(wall.x - this.x) < 3) {
            if (wall.startY > this.y) {
              distanceList[3] = Math.min(distanceList[3], wallSmallY - this.y);
            } else {
              distanceList[1] = Math.min(distanceList[1], this.y - wallBigY);
            }
          } else {
            if (wall.startX > this.x) {
              const between = wall.startX - this.x;
              if (wallBigY >= this.y && wallSmallY <= this.y) {
                distanceList[2] = Math.min(distanceList[2], between);
              }
              if (wallBigY - this.y >= between && this.y - wallSmallY <= between) {
                distanceList[6] = Math.min(distanceList[6], Math.sqrt(2 * between ** 2));
              }
              if (this.y - wallSmallY >= between && wallBigY - this.y <= between) {
                distanceList[5] = Math.min(distanceList[5], Math.sqrt(2 * between ** 2));
              }
            } else {
              const between = this.x - wall.startX;
              if (wallBigY >= this.y && wallSmallY <= this.y) {
                distanceList[0] = Math.min(distanceList[0], between);
              }
              if (wallBigY - this.y >= between && this.y - wallSmallY <= between) {
                distanceList[7] = Math.min(distanceList[7], Math.sqrt(2 * between ** 2));
              }
              if (this.y - wallSmallY >= between && wallBigY - this.y <= between) {
                distanceList[4] = Math.min(distanceList[4], Math.sqrt(2 * between ** 2));
              }
            }
          }
        } else {
          let intersect;
          // Special Case is vertical direction
          intersect = { x: this.x, y: wall.line[0] * this.x + wall.line[1], };
          if (intersect.y > this.y) { // split above or below wall
            if (intersect.x <= wallBigX && intersect.x >= wallSmallX && intersect.y <= wallBigY && intersect.y >= wallSmallY) {
              distanceList[3] = Math.min(distanceList[3], intersect.y - this.y);
            }
          } else {
            if (intersect.x <= wallBigX && intersect.x >= wallSmallX && intersect.y <= wallBigY && intersect.y >= wallSmallY) {
              distanceList[1] = Math.min(distanceList[1], this.y - intersect.y);
            }
          }
          if (wall.line[0] !== 0) { // horizontal line
            intersect = {
              x: (wall.line[1] - this.y) / (0 - wall.line[0]),
              y: this.y,
            };
            if (intersect.x > this.x) { // split above or below wall
              if (intersect.y <= wallBigY && intersect.y >= wallSmallY && intersect.x <= wallBigX && intersect.x >= wallSmallX) {
                distanceList[2] = Math.min(distanceList[2], intersect.x - this.x);
              }
            } else {
              if (intersect.y <= wallBigY && intersect.y >= wallSmallY && intersect.x <= wallBigX && intersect.x >= wallSmallX) {
                distanceList[0] = Math.min(distanceList[0], this.x - intersect.x);
              }
            }
          }
          if (wall.line[0] !== 1) { // y = x
            intersect = {
              x: (wall.line[1] - (this.y - this.x)) / (1 - wall.line[0]),
              y: ((wall.line[1] - (this.y - this.x)) / (1 - wall.line[0])) + (this.y - this.x),
            };
            if (intersect.x > this.x) { // intersect above the point
              if (intersect.y <= wallBigY && intersect.y >= wallSmallY && intersect.x <= wallBigX && intersect.x >= wallSmallX) {
                distanceList[6] = Math.min(distanceList[6], distance([this.x, this.y], [intersect.x, intersect.y]));
              }
            } else {
              if (intersect.y <= wallBigY && intersect.y >= wallSmallY && intersect.x <= wallBigX && intersect.x >= wallSmallX) {
                distanceList[4] = Math.min(distanceList[4], distance([this.x, this.y], [intersect.x, intersect.y]));
              }
            }
          }
          if (wall.line[0] !== -1) { // y = -x
            intersect = {
              x: (wall.line[1] - (this.x + this.y)) / (-1 - wall.line[0]),
              y: -((wall.line[1] - (this.x + this.y)) / (-1 - wall.line[0])) + (this.x + this.y),
            };
            if (intersect.x > this.x) { // intersect above the point
              if (intersect.y <= wallBigY && intersect.y >= wallSmallY && intersect.x <= wallBigX && intersect.x >= wallSmallX) {
                distanceList[5] = Math.min(distanceList[5], distance([this.x, this.y], [intersect.x, intersect.y]));
              }
            } else {
              if (intersect.y <= wallBigY && intersect.y >= wallSmallY && intersect.x <= wallBigX && intersect.x >= wallSmallX) {
                distanceList[7] = Math.min(distanceList[7], distance([this.x, this.y], [intersect.x, intersect.y]));
              }
            }
          }
        }
      }
      return distanceList;
    }
  }
  exports.Player = Player;

  class Wall {
    /**
     * Wall
     * @param {number} startX - X coord of one side of wall
     * @param {number} startY - Y coord of one side of wall
     * @param {number} endX - X coord of other side of wall
     * @param {number} endY - Y coord of other side of wall
     */
    constructor(startX, startY, endX, endY) {
      this.startX = startX;
      this.startY = startY;
      this.endX = endX;
      this.endY = endY;
      if (startX === endX) {
        this.vertical = true;
      } else {
        const m = (endY - startY) / (endX - startX);
        const b = startY - (m * startX);
        this.line = [m, b];
      }
    }

   

    /**
     * See if a point is roughly intersecting with a line
     * @param {number} otherX -points x coord
     * @param {number} otherY -points y coord
     * @returns if the point is roughly intersecting the line
     */
    intersect(otherX, otherY) {
      const distanceFromLine = distance([otherX, otherY], [this.startX, this.startY])
        + distance([otherX, otherY], [this.endX, this.endY])
        - distance([this.endX, this.endY], [this.startX, this.startY]);
      if (distanceFromLine < 3) {
        return true;
      }
      return false;
    }
  }
  exports.Wall = Wall;
});
