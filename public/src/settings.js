/**
 * @file settings.js
 * @author Ryan Saweczko, yarn.sawe@gmail.com
 * @date July 2021
 *
 * Default settings
 */

// @ts-ignore
module.declare([], function(require, exports, modules) {
  exports.settings = {
    width: 700,
    height: 700,
    crossRate: 0.8,
    mutationRate: 0.08,
    popSize: 1000,
    learningRate: 0.08,
    gameTicks: 300,
    generations: 50,
    gensPerSlice: 100,
    eventLoopTimeout: 10,
  };
});
