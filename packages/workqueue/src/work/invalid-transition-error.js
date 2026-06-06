'use strict';

class InvalidTransitionError extends Error {
  constructor(workItem, currentState, nextState) {
    super(`Invalid work item transition from ${currentState} to ${nextState} for ${workItem}`);
    this.name = 'InvalidTransitionError';
    this.workItem = workItem;
    this.currentState = currentState;
    this.nextState = nextState;
  }
}

module.exports = {
  InvalidTransitionError,
};
