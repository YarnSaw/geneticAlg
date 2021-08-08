/**
 *  @file       neuralNet.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       Aug 2021
 *
 * Very simple neural network with only forward propogation and the sigmoid activation function, no back-prop learning.
 */

// @ts-ignore
module.declare([], function(require, exports, modules) {
  /**
   * Dot product a 1d array with a 2d array.
   * Ex: arr1 has 5 ele and arr2 is a 5x8 array. Return 8 values,
   * those 8 values being:
   * returnVal[i] = sum(arr1[k]*arr2[k][i], k = 0,1,...,arr1.length)
   * @param {number[]} arr1 1d array for dot product
   * @param {Array<number[]>} arr2 2d array for dot product
   * @returns 1d array from the dot product
   */
  function dot1DWith2D(arr1, arr2) {
    const returnList = [];
    for (let i = 0; i < arr2[0].length; i++) {
      returnList.push(arr1.map((value, index) => value * arr2[index][i]).reduce((m, n) => m + n));
    }
    return returnList;
  }

  /**
   * Class For a simple neural network with sigmoid activation
   * and only forward propogation
   * @property inputSize - input for network
   * @property outputSize - output for network
   * @property hiddenSize - size for hidden layer
   */
  class NN {
    constructor() {
      // Input is x, y, goalX, goalY
      this.inputSize = 4;
      // Output is movement in x and movement in y
      this.outputSize = 2;
      // Hidden layer size
      this.hiddenSize = 8;
    }

    /**
     * Forward propogation for neural network through 1 hidden layer
     * @param {number[]} inputValues - inputs for network
     * @param {Array<number[]>} weight1 - weights between input and hidden layer
     * @param {Array<number[]>} weight2 - weights between hidden layer and output
     * @returns Prediction for what should be done
     */
    forward(inputValues, weight1, weight2) {
      const z1 = dot1DWith2D(inputValues, weight1);
      const z2 = this.sigmoid(z1);
      // @ts-ignore
      const z3 = dot1DWith2D(z2, weight2);
      const output = this.sigmoid(z3);
      return output;
    }

    /**
     * Sigmoid activation function
     * @param {number | number[]} s - number or array of numbers to be passed through the sigmoid function
     * @returns {number[] | number} List of numbers after activation
     */
    sigmoid(s) {
      if (Array.isArray(s)) {
        for (let i = 0; i < s.length; i++) {
          s[i] = Math.min(s[i], 200);
          s[i] = Math.max(s[i], -200);
          s[i] = 1 / (1 + Math.exp(-s[i]));
        }
        return s;
      } else {
        s = Math.min(s, 200);
        s = Math.max(s, -200);
        return 1 / (1 + Math.exp(-s));
      }
    }
  }
  exports.NeuralNetwork = NN;
});
