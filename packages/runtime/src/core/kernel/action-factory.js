'use strict';

const { XaAction } = require('./action');

class ActionFactory {
  constructor({ runtime = null } = {}) {
    this.runtime = runtime;
    this.registry = new Map();
  }

  registerAction(type, actionClassOrFactory) {
    if (!type) {
      throw new TypeError('type is required');
    }
    if (typeof actionClassOrFactory !== 'function') {
      throw new TypeError('actionClassOrFactory must be a function');
    }
    this.registry.set(String(type), actionClassOrFactory);
    return this;
  }

  registerCustomAction(type, actionClassOrFactory) {
    return this.registerAction(type, actionClassOrFactory);
  }

  create(type, owner) {
    const normalizedType = String(type || 'null');
    const actionClassOrFactory = this.registry.get(normalizedType);

    if (!actionClassOrFactory) {
      const action = new XaAction(owner);
      action.CustomType = normalizedType;
      return action;
    }

    const action = new actionClassOrFactory(owner);
    if (action) {
      action.Owner = owner;
    }
    return action;
  }

  Create(type, owner) {
    return this.create(type, owner);
  }

  getTypeString(actionType, action = null) {
    for (const [type, registered] of this.registry.entries()) {
      if (registered === actionType || (action && action instanceof registered)) {
        return type;
      }
    }

    if (action?.CustomType) {
      return action.CustomType;
    }

    return 'action';
  }

  static getTypeString(actionType, action = null) {
    if (action?.owner?.runtime?.actionFactory) {
      return action.owner.runtime.actionFactory.getTypeString(actionType, action);
    }
    return action?.CustomType || 'action';
  }
}

module.exports = {
  ActionFactory,
};
