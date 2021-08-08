/**
 *  @file       geneticAlg.js
 *  @author     Ryan Saweczko, yarn.sawe@gmail.com
 *  @date       Aug 2021
 *
 * Simple genetic algorithm with fitness based off distance to a goal location
 */

// @ts-ignore
module.declare([], function(require, exports, modules) {
  /**
   * Randomly select element from list based on probabilities. Found on
   * stackoverflow, https://stackoverflow.com/a/41654367
   * @param {number[]} p - list of probabilities (don't need to add to 1)
   * @returns index of randomly chosen element based on probabilities
   */
  function randomChoice(p) {
    let rnd = p.reduce( (a, b) => a + b ) * Math.random();
    return p.findIndex( a => (rnd -= a) < 0 );
  }

  /**
   * Class for genetic algorithm with fitness based off distance
   * To a specific goal location
   * @property dnaSize - size for dna in the GA
   * @property corssRate - rate at which parents genes should be crossed
   * @property mutationRate - rate for random mutations in children genes
   * @property popSize - total population size
   * @property learningRate - amount mutations will affect children
   */
  class GA {
    constructor(dnaSize, crossRate, mutationRate, popSize, learningRate) {
      this.dnaSize = dnaSize;
      this.crossRate = crossRate;
      this.mutationRate = mutationRate;
      this.popSize = popSize;
      this.learningRate = learningRate;
      this.population = new Array(popSize).fill().map(() => Array.from({ length: dnaSize, }, () => 2 * (Math.random() - 0.5)));
    }

    /**
     * Find fitness of a specific member of the population
     * @param {number} x - persons x coordinate
     * @param {number} y - persons y coordinate
     * @param {number} goalX - goal X coordinate
     * @param {number} goalY - goal Y coordinate
     * @returns Fitness of the member
     */
    findFitness(x, y, goalX, goalY) {
      const distFromEnd = Math.sqrt((goalX - x) ** 2 + (goalY - y) ** 2);
      const fitness = Math.pow(1 / (distFromEnd + 1), 2);
      return fitness;
    }

    /**
     * Randomly select new population based off fitnesses of current population
     * @param {number[]} fitnessList - list of fitnesses
     */
    selectFromFitness(fitnessList) {
      const newPop = [];
      const selectedIndexes = {};
      for (let i = 0; i < this.popSize; i++) {
        const selectedIndex = randomChoice(fitnessList);
        // Ensure no more than 5% of the new generation can be based on the same creature
        if (selectedIndexes[selectedIndex]) {
          if (selectedIndexes[selectedIndex] === Math.floor(this.popSize / 20)) {
            fitnessList[selectedIndex] = 0;
          }
          selectedIndexes[selectedIndex]++;
        } else {
          selectedIndexes[selectedIndex] = 1;
        }
        newPop.push(this.population[selectedIndex]);
      }
      this.population = newPop;
    }

    /**
     * Cross genes between two parents
     * @param {number[]} parent - first parent to cross genes
     * @param {Array<number[]>} population - population where one element may be the second parent
     * @returns child with genes crossed between parents randomly
     */
    crossover(parent, population) {
      let child = parent;
      if (Math.random() < this.crossRate) {
        const secondParent = population[Math.floor(Math.random() * population.length)];
        const crossPoints = Array.from({ length: secondParent.length, }, () => Math.random() > 0.5);
        child = parent.map((value, index) => crossPoints[index] ? secondParent[index] : value);
      }
      return child;
    }

    /**
     * Mutate the genes of one member of the population slightly
     * @param {number[]} child - member of the population
     * @returns Mutated child
     */
    mutate(child) {
      for (let i = 0; i < this.dnaSize; i++) {
        if (Math.random() < this.mutationRate) {
          child[i] += (Math.random() - 0.5) * (this.learningRate / 2);
        }
      }
      return child;
    }

    /**
     * evolve the population
     * @param {number[]} fitnesses - list of fitnesses of population
     */
    evolve(fitnesses) {
      this.selectFromFitness(fitnesses);
      const popDeepCopy = JSON.parse(JSON.stringify(this.population));
      for (let i = 0; i < this.popSize; i++) {
        let child = this.crossover(this.population[i], popDeepCopy);
        child = this.mutate(child);
        this.population[i] = child;
      }
    }
  }

  exports.GeneticAlgorithm = GA;
});
