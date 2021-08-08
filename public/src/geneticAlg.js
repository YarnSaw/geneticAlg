
// @ts-ignore
module.declare([], function(require, exports, modules) {
  function randomChoice(p) {
    let rnd = p.reduce( (a, b) => a + b ) * Math.random();
    return p.findIndex( a => (rnd -= a) < 0 );
  }

  class GA {
    constructor(dnaSize, crossRate, mutationRate, popSize, learningRate) {
      this.dnaSize = dnaSize;
      this.crossRate = crossRate;
      this.mutationRate = mutationRate;
      this.popSize = popSize;
      this.learningRate = learningRate;
      this.population = new Array(popSize).fill().map(() => Array.from({ length: dnaSize, }, () => 2 * (Math.random() - 0.5)));
    }

    findFitness(x, y, goalX, goalY) {
      const distFromEnd = Math.sqrt((goalX - x) ** 2 + (goalY - y) ** 2);
      const fitness = Math.pow(1 / (distFromEnd + 1), 2);
      return fitness;
    }

    selectFromFitness(fitnessList) {
      const newPop = [];
      for (let i = 0; i < this.popSize; i++) {
        newPop.push(this.population[randomChoice(fitnessList)]);
      }
      this.population = newPop;
    }

    crossover(parent, population) {
      let child = parent;
      if (Math.random() < this.crossRate) {
        const secondParent = population[Math.floor(Math.random() * population.length)];
        const crossPoints = Array.from({ length: secondParent.length, }, () => Math.random() > 0.5);
        child = parent.map((value, index) => crossPoints[index] ? secondParent[index] : value);
      }
      return child;
    }

    mutate(child) {
      for (let i = 0; i < this.dnaSize; i++) {
        if (Math.random() < this.mutationRate) {
          child[i] += (Math.random() - 0.5) * (this.learningRate / 2);
        }
      }
      return child;
    }

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
