'use strict';

const { FormulaService } = require('./formula-service');
const { PomeloService } = require('./pomelo-service');
const { PermissionPolicy, SkillRegistry, ToolRegistry } = require('../agent/registries');
const { ActionFactory } = require('./kernel/action-factory');
const { registerBuiltInActions } = require('./kernel/actions');

class RuntimeConsole {
  constructor(output = null) {
    this.output = output;
    this.isEcho = true;
    this.lines = [];
  }

  get IsEcho() {
    return this.isEcho;
  }

  set IsEcho(value) {
    this.isEcho = Boolean(value);
  }

  write(value = '') {
    if (!this.isEcho) {
      return;
    }
    const text = value == null ? '' : String(value);
    this.lines.push(text);
    if (this.output && typeof this.output.write === 'function') {
      this.output.write(text);
    }
  }

  Write(value = '') {
    this.write(value);
  }

  writeLine(value = '') {
    this.write(`${value == null ? '' : String(value)}\n`);
  }

  WriteLine(value = '') {
    this.writeLine(value);
  }

  clear() {
    this.lines.length = 0;
  }

  toString() {
    return this.lines.join('');
  }
}

class TumblrRuntime {
  constructor(options = {}) {
    this.adapters = options.adapters ?? {};
    this.permissionPolicy = options.permissionPolicy ?? null;
    this.toolRegistry = options.toolRegistry ?? new ToolRegistry({ permissionPolicy: this.permissionPolicy });
    this.skillRegistry = options.skillRegistry ?? new SkillRegistry({ permissionPolicy: this.permissionPolicy });
    for (const descriptor of options.tools ?? []) {
      this.toolRegistry.register(descriptor);
    }
    for (const descriptor of options.skills ?? []) {
      this.skillRegistry.register(descriptor);
    }
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    }));
    this.out = options.out ?? new RuntimeConsole(options.output);
    this.actionFactory = new ActionFactory({ runtime: this });
    registerBuiltInActions(this.actionFactory);
    this.service = new PomeloService({
      runtime: this,
      actionFactory: this.actionFactory,
      beans: options.beans ?? {},
    });
    this.pomeloService = this.service;
    this.formulaService = new FormulaService({
      pomeloService: this.service,
      now: options.now,
      userName: options.userName,
    });
    this.service.formulaService = this.formulaService;
  }

  loadTumbler(...args) {
    return this.service.loadTumbler(...args);
  }

  LoadTumbler(...args) {
    return this.loadTumbler(...args);
  }
}

module.exports = {
  PermissionPolicy,
  RuntimeConsole,
  TumblrRuntime,
};
