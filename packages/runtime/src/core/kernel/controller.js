'use strict';

const {
  AttributeList,
  setAttributeWithPath,
  toAttributeList,
} = require('../attribute-list');

class DefaultXaController {
  constructor({ runtime = null, name = '', id = '' } = {}) {
    this.runtime = runtime;
    this.ID = id;
    this.Name = name;
    this.Hostname = 'tumblr';
    this.Root = null;
    this.Parent = null;
    this.Dict = null;
    this.Data = new AttributeList();
    this.FetchedData = [];
    this.Parameter = new AttributeList();
    this.Return = new AttributeList({ process: [] });
    this.Tag = null;
    this.action = null;
    this.lastError = null;
    this.processActionStartHandlers = [];
    this.processActionStopHandlers = [];
  }

  execute() {
    if (this.Root === this && this.runtime?.out) {
      this.runtime.out.writeLine('================================================================================');
      this.runtime.out.writeLine(` Start Tumblr : ${this.Name} - ${new Date().toISOString()}`);
      this.runtime.out.writeLine('================================================================================');
      this.runtime.out.writeLine('');
    }

    try {
      const result = this.action?.execute(this);
      if (result && typeof result.then === 'function') {
        return result.catch((error) => {
          this.recordError(error);
        }).finally(() => {
          this.writeEndBanner();
        });
      }
      this.writeEndBanner();
      return result;
    } catch (error) {
      this.recordError(error);
      this.writeEndBanner();
      return undefined;
    }
  }

  Execute() {
    return this.execute();
  }

  begin(effect) {
    return this.onProcessActionStart(effect, { ProcessId: effect?.ProcessID ?? '' });
  }

  Begin(effect) {
    return this.begin(effect);
  }

  end(effect) {
    return this.onProcessActionStop(effect, { ProcessId: effect?.ProcessID ?? '' });
  }

  End(effect) {
    return this.end(effect);
  }

  onProcessActionStart(sender, args) {
    for (const handler of this.processActionStartHandlers) {
      handler(sender, args);
    }
  }

  onProcessActionStop(sender, args) {
    for (const handler of this.processActionStopHandlers) {
      handler(sender, args);
    }
  }

  writeEndBanner() {
    if (this.Root === this && this.runtime?.out) {
      this.runtime.out.writeLine('');
      this.runtime.out.writeLine('================================================================================');
      this.runtime.out.writeLine(` End Tumblr : ${this.Name} - ${new Date().toISOString()}`);
      this.runtime.out.writeLine('================================================================================');
    }
  }

  recordError(error) {
    this.lastError = error;
    this.runtime?.out?.writeLine('');
    this.runtime?.out?.writeLine('Abort Tumblr');
    this.runtime?.out?.writeLine(` Reason -> ${error.message}`);
  }
}

class DiagnosticController extends DefaultXaController {
  execute() {
    const result = super.execute();
    if (result && typeof result.then === 'function') {
      return result.then((value) => {
        this.buildDiagnosticReturn();
        return value;
      });
    }
    this.buildDiagnosticReturn();
    return result;
  }

  buildDiagnosticReturn() {
    const diagnostic = new AttributeList();
    const processes = this.Root?.Return?.process ?? [];

    for (const process of processes) {
      const id = process.id;
      if (!id) {
        continue;
      }
      setAttributeWithPath(diagnostic, id, {
        Process: process.name,
        Result: process.result?._state_ ?? '',
        Message: process.result?.ResultMsg ?? '',
        Data: process.result?.ResultData ?? null,
      });
    }

    this.Root.Return.set('diagnostic', diagnostic);
  }
}

function createController(type, name, runtime) {
  switch (String(type || 'DEFAULT').toUpperCase()) {
    case 'DEFAULT':
      return new DefaultXaController({ runtime, name });
    case 'DIAGNOSTIC':
      return new DiagnosticController({ runtime, name });
    default:
      return null;
  }
}

function createInitialControllerData(beanData, parameter) {
  const data = new AttributeList();

  if (parameter != null) {
    data.set('parameter', parameter);
  }

  const normalizedBeanData = toAttributeList(beanData ?? {});
  for (const [key, value] of normalizedBeanData) {
    data.set(key, value);
  }

  return data;
}

module.exports = {
  DefaultXaController,
  DiagnosticController,
  createController,
  createInitialControllerData,
};
