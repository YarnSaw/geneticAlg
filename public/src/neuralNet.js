// @ts-ignore
module.declare([], function(require, exports, modules) {
  function dot1DWith2D(arr1, arr2) {
    /**
     * Ex: arr1 has 5 ele and arr2 is a 5x8 array. Return 8 values,
     * those 8 values being:
     * returnVal[i] = sum(arr1[k]*arr2[k][i], k = 0,1,...,arr1.length)
     */
    const returnList = [];
    for (let i = 0; i < arr2[0].length; i++) {
      returnList.push(arr1.map((value, index) => value * arr2[index][i]).reduce((m, n) => m + n));
    }
    return returnList;
  }

  class NN {
    constructor() {
      // Input is x, y, goalX, goalY
      this.inputSize = 4;
      // Output is movement in x and movement in y
      this.outputSize = 2;
      // Hidden layer size
      this.hiddenSize = 8;
    }

    forward(inputValues, weight1, weight2) {
      const z1 = dot1DWith2D(inputValues, weight1);
      const z2 = this.sigmoid(z1);
      const z3 = dot1DWith2D(z2, weight2);
      const output = this.sigmoid(z3);
      return output;
    }

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
