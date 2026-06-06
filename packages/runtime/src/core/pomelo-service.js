'use strict';

const path = require('node:path');
const {
  AttributeList,
  getAttributeWithPath,
  setAttributeWithPath,
  toAttributeList,
} = require('./attribute-list');
const {
  createController,
  createInitialControllerData,
} = require('./kernel/controller');

function hasKey(value, key) {
  return value && Object.prototype.hasOwnProperty.call(value, key);
}

function isObjectLike(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

class PomeloService {
  constructor({ runtime = null, actionFactory = null, formulaService = null, beans = {} } = {}) {
    this.runtime = runtime;
    this.actionFactory = actionFactory;
    this.formulaService = formulaService;
    this.beans = new Map(Object.entries(beans));
    this.customActions = new Map();
  }

  getAttributeWithPath(root, pathValue) {
    return getAttributeWithPath(root, pathValue);
  }

  setAttributeWithPath(root, pathValue, value) {
    return setAttributeWithPath(root, pathValue, value);
  }

  getFilterString(value, filter) {
    let output = value ?? '';

    if (filter.startsWith('default=')) {
      return output === '' ? filter.substring('default='.length) : output;
    }

    if (filter.startsWith('?')) {
      const [expected, truthy, falsy] = filter.substring(1).split('|');
      return output === expected ? truthy : falsy;
    }

    if (!filter || !filter.includes('=')) {
      return output;
    }

    const [name, option] = filter.split('=');
    if (name === 'format' && option === 'base64') {
      output = Buffer.from(output, 'utf8').toString('base64');
    }

    return output;
  }

  registerAction(type, actionClassOrFactory) {
    this.actionFactory.registerAction(type, actionClassOrFactory);
    return this;
  }

  registerCustomAction(type, actionClassOrFactory) {
    this.customActions.set(type, actionClassOrFactory);
    this.actionFactory.registerCustomAction(type, actionClassOrFactory);
    return this;
  }

  hasBean(name) {
    return this.beans.has(String(name));
  }

  getBean(name) {
    const key = String(name);
    if (this.beans.has(key)) {
      return this.beans.get(key);
    }

    const beanAdapter = this.runtime?.adapters?.beanAdapter;
    if (typeof beanAdapter === 'function') {
      return beanAdapter(key);
    }
    if (beanAdapter && typeof beanAdapter.getBean === 'function') {
      return beanAdapter.getBean(key);
    }
    return null;
  }

  parse(beanNameOrObject) {
    if (beanNameOrObject == null) {
      return new AttributeList();
    }

    if (typeof beanNameOrObject === 'string') {
      const bean = this.getBean(beanNameOrObject);
      if (bean != null) {
        return toAttributeList(bean);
      }
      return new AttributeList();
    }

    return toAttributeList(beanNameOrObject);
  }

  loadTumbler(name, bean, parameter = null, xtype = '', index = -1) {
    const alist = this.parse(bean);
    const type = xtype || alist.type || 'DEFAULT';
    const controllerName = name ? path.basename(String(name), path.extname(String(name))) : '';
    const controller = createController(type, controllerName, this.runtime);

    if (!controller) {
      throw new Error(`Unknown controller type '${type}'`);
    }

    const normalizedParameter = parameter == null ? null : toAttributeList(parameter);
    controller.Root = controller;
    controller.Parent = null;
    controller.Dict = alist;
    controller.Parameter = normalizedParameter == null
      ? new AttributeList()
      : toAttributeList({ extra: { parameter: normalizedParameter } });
    controller.Data = createInitialControllerData(alist.data, normalizedParameter);
    controller.FetchedData = [];
    controller.Return = new AttributeList({ process: [] });

    this.evaluateObject(alist, controller, controller, index);

    return controller;
  }

  LoadTumbler(...args) {
    return this.loadTumbler(...args);
  }

  evaluateAction(dict, owner, index = 0) {
    if (!dict) {
      return this.actionFactory.create('null', owner);
    }

    let actionDict = toAttributeList(dict);
    let type = 'none';

    if (hasKey(actionDict, 'action')) {
      actionDict = toAttributeList(actionDict.action);
    }

    if (hasKey(actionDict, 'Log')) {
      type = 'log';
      actionDict = toAttributeList(actionDict.Log);
    } else if (hasKey(actionDict, 'saveParameterAs')) {
      type = 'saveParameterAs';
    } else if (hasKey(actionDict, 'type')) {
      type = String(actionDict.type);
    } else if (hasKey(actionDict, 'sequence')) {
      type = 'batch';
    }

    if (type === 'none') {
      type = 'null';
    }

    const action = this.actionFactory.create(type, owner);
    action.Index = index;
    action.Dict = actionDict;

    if (!action.evaluate(actionDict)) {
      this.evaluateObject(actionDict, owner, action, index);
    }

    if (hasKey(actionDict, 'sequence') && Array.isArray(actionDict.sequence)) {
      action.sequence = Array.from(actionDict.sequence);
    }

    return action;
  }

  evaluateObject(dict, owner, target, index = 0) {
    if (!dict || !target) {
      return;
    }

    const normalized = toAttributeList(dict);
    for (const [key, rawValue] of normalized) {
      if (key === 'type' || key === 'data') {
        continue;
      }

      if (key === 'action') {
        target.action = this.evaluateAction(rawValue, owner, index);
        continue;
      }

      if ((key === 'SUCCESS' || key === 'FAILURE') && isObjectLike(rawValue)) {
        target[key] = this.evaluateAction(rawValue, owner, index);
        continue;
      }

      if (key === 'actions' && Array.isArray(rawValue)) {
        target[key] = rawValue.map((item) => this.evaluateAction(item, owner, index));
        continue;
      }

      if (!hasKey(target, key)) {
        continue;
      }

      target[key] = this.coerceValue(rawValue, target[key], owner, index);
    }
  }

  coerceValue(value, currentValue, owner, index) {
    if (typeof value === 'string') {
      const parsed = this.formulaService?.parseMacro(owner, value, index) ?? value;
      if (typeof currentValue === 'boolean') {
        return parsed === 'YES' || parsed === 'true';
      }
      if (typeof currentValue === 'number') {
        return Number(parsed);
      }
      return parsed;
    }

    return toAttributeList(value);
  }
}

module.exports = {
  PomeloService,
};
