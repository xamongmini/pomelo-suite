'use strict';

const {
  AttributeList,
  printAttributeList,
  toAttributeList,
} = require('../attribute-list');
const { calculator } = require('../../package-surfaces');
const { ProcessAction, XaAction } = require('./action');

const { evaluateExpression } = calculator;

function trimExpressionString(value) {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.substring(1, value.length - 1);
  }
  return value;
}

function getFormulaService(action) {
  return action.owner?.runtime?.formulaService;
}

function getPomeloService(action) {
  return action.owner?.runtime?.service;
}

function getOutput(action) {
  return action.owner?.runtime?.out;
}

function parseString(action, value) {
  return getFormulaService(action)?.parse(action.owner, value) ?? value;
}

function isPromise(value) {
  return value && typeof value.then === 'function';
}

function isObjectRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSeparator(action, value) {
  const parsed = parseString(action, value ?? '');
  const separator = String(parsed || '|').replace(/\\r/g, '\r').replace(/\\n/g, '\n');
  return separator === '' ? '|' : separator;
}

function splitWithSeparator(value, separator) {
  const text = String(value);
  if (separator === '\r\n' || separator === '\n') {
    return text.replace(/\r\n/g, '\n').split('\n');
  }
  return text.split(separator);
}

function makeRange(count) {
  return Array.from({ length: count }, (_item, index) => String(index + 1));
}

function coerceIteratorArray(action) {
  const formulaService = getFormulaService(action);
  const objectValue = formulaService?.parseObject(action.owner, action.iterator);
  const separator = normalizeSeparator(action, action.sep);
  let value = objectValue;

  if (value == null) {
    value = parseString(action, action.iterator);
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return makeRange(value);
  }

  const text = String(value ?? '');
  if (/^\d+$/.test(text)) {
    return makeRange(Number(text));
  }

  return splitWithSeparator(text, separator);
}

function coerceMergeArray(action, valueExpression) {
  const formulaService = getFormulaService(action);
  const objectValue = formulaService?.parseObject(action.owner, valueExpression);
  const separator = normalizeSeparator(action, action.sep);
  const value = objectValue == null ? parseString(action, valueExpression) : objectValue;

  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  return splitWithSeparator(value, separator);
}

function makeFetchedData(item, index) {
  const data = new AttributeList({ sequence: String(index) });
  if (isObjectRecord(item)) {
    const entries = item instanceof AttributeList ? item.entries() : Object.entries(item);
    for (const [key, value] of entries) {
      data.set(key, value);
    }
  } else {
    data.set('value', item);
  }
  return data;
}

function clearFetchedData(owner) {
  if (Array.isArray(owner?.FetchedData)) {
    owner.FetchedData.length = 0;
  }
}

function collectParsedParameters(action) {
  const parameters = new AttributeList();
  const rawParameters = getPomeloService(action)?.getAttributeWithPath(action.Dict, 'extra.parameter');
  const formulaService = getFormulaService(action);

  if (!rawParameters || !formulaService) {
    return parameters;
  }

  for (const [key, value] of toAttributeList(rawParameters)) {
    const parsed = formulaService.parse(action.owner, String(value));
    parameters.set(key, parsed === '(object)' ? formulaService.parseObject(action.owner, String(value)) : parsed);
  }

  return parameters;
}

function writeParametersToOwnerData(action) {
  const parameters = collectParsedParameters(action);
  for (const [key, value] of parameters) {
    action.owner.Data.set(key, value);
  }
  return parameters;
}

function formatPair(format, left, right) {
  return String(format ?? '')
    .replace(/\{0(?:,[^}]*)?\}/g, String(left))
    .replace(/\{1(?:,[^}]*)?\}/g, String(right));
}

function setProcessResult(result, state, code, message, data) {
  result.set('_state_', state);
  result.set('ResultCode', code);
  result.set('ResultMsg', message ?? '');
  if (data !== undefined) {
    result.set('ResultData', data);
  }
}

const ADAPTER_TYPES = Object.freeze({
  networkAdapter: ['ping', 'tracert'],
  dataAdapter: ['sql', 'sms', 'logprocess', 'getcustomerinfo', 'inquirycustomerinfo', 'inquirynetequipinfo'],
  terminalAdapter: ['sendcommand', 'sendmulticommand', 'sendcontrol', 'runshell', 'avsmsendcommand', 'hdssendcommand'],
  sshAdapter: ['ssh', 'executeshell', 'filetransfer'],
  templateAdapter: ['loadtemplate'],
  serviceAdapter: [
    'getservicedata',
    'getdevicedata',
    'userauthservice',
    'getdeviceonoffstatus',
    'getcommandservice',
    'setcommandservice',
    'addmoindexservice',
    'delmoindiexservice',
    'devicerebootservice',
    'devicefactoryinitservice',
    'setwifiqualityinfo',
    'getdevicequalitydata',
    'devbindingsearch',
    'getl2equipfromhomehub',
    'getresourceloginfo',
    'getipequipqualityinfo',
    'linkagesa',
    'getl2systemstatusservice',
    'getmib',
    'setmib',
    'getitehubmacaddr',
    'getcustomerhomeinfo',
    'topologyinfo',
    'checkmemberid',
    'requestsmscertification',
    'verifysmscertification',
    'registermember',
    'unregistermember',
    'getdeviceinfo',
    'setportforwarding',
    'setsecuritylevel',
  ],
});

const EXTERNAL_ACTION_TYPES = Object.freeze(Object.values(ADAPTER_TYPES).flat());

function getAdapterNames(type) {
  const names = [];
  for (const [adapterName, types] of Object.entries(ADAPTER_TYPES)) {
    if (types.includes(type)) {
      names.push(adapterName);
    }
  }
  if (type === 'runshell') {
    names.push('shellAdapter');
  }
  names.push(type);
  return names;
}

function parseAdapterFields(action) {
  const output = new AttributeList();
  const formulaService = getFormulaService(action);
  const ignored = new Set(['type', 'SUCCESS', 'FAILURE', 'extra', 'sequence', 'action']);

  for (const [key, rawValue] of toAttributeList(action.Dict ?? {})) {
    if (ignored.has(key)) {
      continue;
    }
    if (typeof rawValue === 'string') {
      const parsed = formulaService?.parse(action.owner, rawValue) ?? rawValue;
      output.set(key, parsed === '(object)' ? formulaService.parseObject(action.owner, rawValue) : parsed);
    } else {
      output.set(key, rawValue);
    }
  }

  return output;
}

function findAdapter(action, type) {
  const adapters = action.owner?.runtime?.adapters ?? {};
  for (const name of getAdapterNames(type)) {
    if (adapters[name]) {
      return adapters[name];
    }
  }
  return null;
}

function normalizeAdapterResult(value) {
  if (isObjectRecord(value)) {
    if (
      Object.prototype.hasOwnProperty.call(value, '_state_') ||
      Object.prototype.hasOwnProperty.call(value, 'ResultCode') ||
      Object.prototype.hasOwnProperty.call(value, 'ResultMsg') ||
      Object.prototype.hasOwnProperty.call(value, 'ResultData')
    ) {
      return {
        state: value._state_ ?? 'SUCCESS',
        code: value.ResultCode ?? (value._state_ === 'FAILURE' ? 'F' : 'T'),
        message: value.ResultMsg ?? '',
        data: value.ResultData,
      };
    }
    if (
      Object.prototype.hasOwnProperty.call(value, 'state') ||
      Object.prototype.hasOwnProperty.call(value, 'code') ||
      Object.prototype.hasOwnProperty.call(value, 'message') ||
      Object.prototype.hasOwnProperty.call(value, 'data')
    ) {
      return {
        state: value.state ?? 'SUCCESS',
        code: value.code ?? (value.state === 'FAILURE' ? 'F' : 'T'),
        message: value.message ?? '',
        data: value.data,
      };
    }
  }

  return {
    state: 'SUCCESS',
    code: 'T',
    message: '',
    data: value,
  };
}

function parseAgentInputValue(action, value) {
  const formulaService = getFormulaService(action);

  if (typeof value === 'string') {
    const parsed = formulaService?.parse(action.owner, value) ?? value;
    return parsed === '(object)' ? formulaService.parseObject(action.owner, value) : parsed;
  }
  if (Array.isArray(value)) {
    return value.map((item) => parseAgentInputValue(action, item));
  }
  if (isObjectRecord(value)) {
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = parseAgentInputValue(action, item);
    }
    return output;
  }
  return value;
}

function getAgentActionInput(action) {
  const rawInput = action.Dict?.input ?? {};
  return parseAgentInputValue(action, rawInput instanceof AttributeList ? rawInput.toJSON?.() ?? rawInput : rawInput);
}

class RegistryProcessAction extends ProcessAction {
  constructor(owner, { registryName, targetKey, processName }) {
    super(owner);
    this.registryName = registryName;
    this.targetKey = targetKey;
    this.processName = processName;
  }

  execute(sender) {
    this.executeSequence(sender);
    const registry = this.owner?.runtime?.[this.registryName];
    const targetName = parseString(this, this.Dict?.[this.targetKey] ?? this[this.targetKey] ?? '');
    const input = getAgentActionInput(this);

    if (!registry || typeof registry.execute !== 'function') {
      setProcessResult(this.result, 'FAILURE', 'F', `${this.registryName} is not configured`);
      return this.afterExecute(sender);
    }

    const finishSuccess = (value) => {
      setProcessResult(this.result, 'SUCCESS', 'T', `${this.processName} '${targetName}' executed`, value);
      return this.afterExecute(sender);
    };
    const finishFailure = (error) => {
      setProcessResult(this.result, 'FAILURE', 'F', error.message);
      return this.afterExecute(sender);
    };

    try {
      const output = registry.execute(targetName, input, {
        action: this,
        owner: this.owner,
        permissionPolicy: this.owner?.runtime?.permissionPolicy,
        runtime: this.owner?.runtime,
      });
      if (isPromise(output)) {
        return output.then(finishSuccess).catch(finishFailure);
      }
      return finishSuccess(output);
    } catch (error) {
      return finishFailure(error);
    }
  }

  getProcessName() {
    return this.processName;
  }
}

class ToolCallAction extends RegistryProcessAction {
  constructor(owner) {
    super(owner, {
      registryName: 'toolRegistry',
      targetKey: 'tool',
      processName: 'tool.call',
    });
    this.tool = '';
    this.input = {};
  }
}

class SkillRunAction extends RegistryProcessAction {
  constructor(owner) {
    super(owner, {
      registryName: 'skillRegistry',
      targetKey: 'skill',
      processName: 'skill.run',
    });
    this.skill = '';
    this.input = {};
  }
}

class AdapterProcessAction extends ProcessAction {
  constructor(owner, actionType = null) {
    super(owner);
    this.adapterActionType = actionType ?? this.constructor.actionType ?? 'action';
  }

  execute(sender) {
    this.executeSequence(sender);
    const type = this.getProcessName();
    const adapter = findAdapter(this, type);

    if (!adapter) {
      setProcessResult(this.result, 'FAILURE', 'F', `Unsupported action '${type}' requires an adapter`);
      return this.afterExecute(sender);
    }

    const fields = parseAdapterFields(this);
    const payload = {
      type,
      fields,
      processId: this.ProcessID,
      index: this.Index,
      owner: this.owner,
      data: this.owner?.Data,
      parameter: this.owner?.Parameter,
      dict: this.Dict,
    };

    const invoke = typeof adapter === 'function' ? adapter : adapter.invoke?.bind(adapter);
    if (typeof invoke !== 'function') {
      setProcessResult(this.result, 'FAILURE', 'F', `Adapter for '${type}' must be a function or expose invoke(payload)`);
      return this.afterExecute(sender);
    }

    try {
      const output = invoke(payload);
      if (isPromise(output)) {
        return output
          .then((value) => {
            this.applyAdapterResult(value);
            return this.afterExecute(sender);
          })
          .catch((error) => {
            setProcessResult(this.result, 'FAILURE', 'F', error.message);
            return this.afterExecute(sender);
          });
      }

      this.applyAdapterResult(output);
    } catch (error) {
      setProcessResult(this.result, 'FAILURE', 'F', error.message);
    }

    return this.afterExecute(sender);
  }

  applyAdapterResult(value) {
    const normalized = normalizeAdapterResult(value);
    setProcessResult(
      this.result,
      normalized.state,
      normalized.code,
      normalized.message,
      normalized.data
    );
  }

  getProcessName() {
    return this.adapterActionType;
  }
}

class UnsupportedAction extends AdapterProcessAction {
  constructor(owner, actionType = null) {
    super(owner, actionType);
  }
}

class NullAction extends XaAction {
  execute(sender) {
    this.executeSequence(sender);
  }
}

class BatchAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.mode = '';
    this.actions = [];
  }

  execute(sender) {
    this.executeSequence(sender);
    let chain = null;

    for (const action of this.actions) {
      if (chain) {
        chain = chain.then(() => action.execute(sender));
      } else {
        const result = action.execute(sender);
        if (result && typeof result.then === 'function') {
          chain = result;
        }
      }
    }

    return chain ?? undefined;
  }
}

class LoopAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.mode = '';
    this.sep = '';
    this.iterator = '';
    this.SUCCESS = null;
  }

  execute(sender) {
    this.executeSequence(sender);
    const pomeloService = getPomeloService(this);
    const values = coerceIteratorArray(this);
    clearFetchedData(this.owner);

    if (!this.SUCCESS || values.length === 0) {
      clearFetchedData(this.owner);
      return undefined;
    }

    let chain = null;
    const runItem = (item, index) => {
      this.owner.FetchedData.push(makeFetchedData(item, index));
      const action = pomeloService.evaluateAction(this.SUCCESS.Dict, this.owner, index);
      action.Index = index;
      return action.execute(this);
    };

    values.forEach((item, index) => {
      if (chain) {
        chain = chain.then(() => runItem(item, index));
      } else {
        const result = runItem(item, index);
        if (isPromise(result)) {
          chain = result;
        }
      }
    });

    if (chain) {
      return chain.finally(() => {
        clearFetchedData(this.owner);
      });
    }

    clearFetchedData(this.owner);
    return undefined;
  }
}

class ThinkTimeAction extends ProcessAction {
  constructor(owner) {
    super(owner);
    this.timeout = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const parsed = parseString(this, this.timeout);
    const seconds = Number(parsed);
    const milliseconds = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
    const sleep = this.owner?.runtime?.sleep ?? ((ms) => new Promise((resolve) => {
      setTimeout(resolve, ms);
    }));

    const finish = () => {
      getOutput(this)?.writeLine('OK.');
      getOutput(this)?.writeLine('');
      setProcessResult(this.result, 'SUCCESS', 'T', '');
      return this.afterExecute(sender);
    };

    try {
      const result = sleep(milliseconds);
      if (isPromise(result)) {
        return result.then(finish).catch((error) => {
          setProcessResult(this.result, 'FAILURE', 'F', error.message);
          return this.afterExecute(sender);
        });
      }
      return finish();
    } catch (error) {
      setProcessResult(this.result, 'FAILURE', 'F', error.message);
      return this.afterExecute(sender);
    }
  }
}

class ActivityAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.class = '';
    this.plist = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const pomeloService = getPomeloService(this);
    const beanName = parseString(this, this.plist);
    const parameters = collectParsedParameters(this);
    const bean = pomeloService.getBean(beanName);

    if (bean == null) {
      throw new Error(`Unknown activity bean '${beanName}'`);
    }

    const child = pomeloService.loadTumbler(beanName, bean, parameters, 'DEFAULT', this.Index);
    child.ID = this.class;
    child.Parent = this.owner;
    child.Root = this.owner.Root;
    return child.execute(sender);
  }
}

class LogAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.message = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const parsed = parseString(this, this.message);

    if (parsed === '(object)') {
      const objectValue = getFormulaService(this)?.parseObject(this.owner, this.message);
      getOutput(this)?.writeLine(objectValue instanceof AttributeList ? printAttributeList('', objectValue) : objectValue);
    } else {
      getOutput(this)?.writeLine(parsed);
    }
    getOutput(this)?.writeLine('');
  }
}

class ConditionAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.arg1 = '';
    this.arg2 = '';
    this.arg3 = '';
    this.SUCCESS = null;
    this.FAILURE = null;
  }

  execute(sender) {
    this.executeSequence(sender);
    const left = parseString(this, this.arg1);
    const operator = String(this.arg2 ?? '').trim();
    const right = parseString(this, this.arg3);
    const result = compareValues(left, operator, right, false);
    return (result ? this.SUCCESS : this.FAILURE)?.execute(sender);
  }
}

class SelectAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.selector = '';
    this.SUCCESS = null;
    this.FAILURE = null;
  }

  execute(sender) {
    this.executeSequence(sender);
    const pomeloService = getPomeloService(this);
    let selector = getFormulaService(this)?.parseSequence(this.owner, this.selector) ?? '';
    if (!selector) {
      selector = parseString(this, this.selector);
    }

    const selectedDict = this.Dict?.[selector] ?? this.Dict?.default;
    if (!selectedDict) {
      return undefined;
    }

    return pomeloService.evaluateAction(selectedDict, this.owner, this.Index)?.execute(sender);
  }
}

class CallActionAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.name = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const pomeloService = getPomeloService(this);
    const callObject = this.owner?.Dict?.[this.name];

    writeParametersToOwnerData(this);

    if (Array.isArray(callObject)) {
      const batch = new BatchAction(this.owner);
      batch.actions = callObject.map((item) => pomeloService.evaluateAction(item, this.owner, this.Index));
      return batch.execute(sender);
    }

    if (callObject) {
      return pomeloService.evaluateAction(callObject, this.owner, this.Index)?.execute(sender);
    }

    return undefined;
  }
}

class SaveParameterAsAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.key = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const pomeloService = getPomeloService(this);
    const formulaService = getFormulaService(this);
    const rootData = this.owner.Root.Data;

    if (!rootData.global) {
      rootData.set('global', new AttributeList());
    }
    if (!rootData.global[this.key]) {
      rootData.global.set(this.key, new AttributeList());
    }

    const target = rootData.global[this.key];
    const parameters = pomeloService.getAttributeWithPath(this.Dict, 'extra.parameter');
    if (parameters) {
      for (const [key, value] of parameters) {
        const parsed = formulaService.parse(this.owner, String(value));
        target.set(key, parsed === '(object)' ? formulaService.parseObject(this.owner, String(value)) : parsed);
      }
    }
  }
}

class EchoOffAction extends XaAction {
  execute(sender) {
    this.executeSequence(sender);
    if (this.owner?.runtime?.out) {
      this.owner.runtime.out.IsEcho = false;
    }
  }
}

class EchoOnAction extends XaAction {
  execute(sender) {
    this.executeSequence(sender);
    if (this.owner?.runtime?.out) {
      this.owner.runtime.out.IsEcho = true;
    }
  }
}

class MergeAction extends ProcessAction {
  constructor(owner) {
    super(owner);
    this.sep = '';
    this.format = '';
    this.array1 = '';
    this.array2 = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const left = coerceMergeArray(this, this.array1);
    const right = coerceMergeArray(this, this.array2);

    if (!left || !right) {
      setProcessResult(this.result, 'FAILURE', 'F', 'array1 or array2 is null');
      return this.afterExecute(sender);
    }

    if (left.length !== right.length) {
      setProcessResult(this.result, 'FAILURE', 'F', 'length is not equal');
      return this.afterExecute(sender);
    }

    const message = left
      .map((value, index) => formatPair(this.format, value, right[index]))
      .join('\t\n');
    setProcessResult(this.result, 'SUCCESS', 'T', message);
    return this.afterExecute(sender);
  }
}

class MessageAction extends ProcessAction {
  constructor(owner) {
    super(owner);
    this.msg = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const parsed = parseString(this, this.msg);
    this.msg = parsed === '(object)' ? this.msg : parsed;
    getOutput(this)?.writeLine(this.msg);
    getOutput(this)?.writeLine('');
    this.result.set('_state_', 'SUCCESS');
    this.result.set('ResultCode', 'T');
    this.result.set('ResultMsg', this.msg);
    return this.afterExecute(sender);
  }
}

class OperationAction extends ProcessAction {
  constructor(owner) {
    super(owner);
    this.arg1 = '';
    this.arg2 = '';
    this.arg3 = '';
    this.Row = null;
  }

  execute(sender) {
    this.executeSequence(sender);
    const left = parseString(this, this.arg1);
    const operator = String(this.arg2 ?? '').trim();
    const right = parseString(this, this.arg3);
    const result = compareValues(left, operator, right, true);
    const row = this.Row ?? {};

    if (result) {
      this.result.set('_state_', 'SUCCESS');
      this.result.set('ResultCode', 'T');
      this.result.set('ResultMsg', row.DECISION ?? '');
      this.result.set('ResultData', {
        AlarmCode: row.DISASTER_CD ?? '',
        AlarmType: row.DISASTER_TYPE ?? '',
        AlarmDesc: row.DIASTER_DESC ?? '',
        RepairCode: row.RECOVERY_CD ?? '',
        RepairMethod: row.RECOVERY_METHOD ?? '',
        RepairFunction: row.RECOVERY_FUNC ?? '',
        Remark: row.REMARK ?? '',
      });
    } else {
      this.result.set('_state_', 'FAILURE');
      this.result.set('ResultCode', 'F');
      this.result.set('ResultMsg', '');
    }

    return this.afterExecute(sender);
  }
}

class FormulaAction extends ProcessAction {
  constructor(owner) {
    super(owner);
    this.expr = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    try {
      const parsed = parseString(this, this.expr);
      let output;

      if (parsed === '(object)') {
        output = getFormulaService(this).parseObject(this.owner, this.expr);
      } else if (parsed.startsWith('=')) {
        output = trimExpressionString(evaluateExpression(parsed.substring(1), {
          resolveVariable: (name) => getFormulaService(this).parse(this.owner, `{@${name}}`),
        }));
      } else {
        output = parsed;
      }

      getOutput(this)?.writeLine(output);
      this.result.set('_state_', 'SUCCESS');
      this.result.set('ResultCode', 'T');
      this.result.set('ResultMsg', output);
    } catch (error) {
      this.result.set('_state_', 'FAILURE');
      this.result.set('ResultCode', 'F');
      this.result.set('ResultMsg', error.message);
    }

    getOutput(this)?.writeLine('');
    return this.afterExecute(sender);
  }
}

class ComputeAction extends XaAction {
  constructor(owner) {
    super(owner);
    this.expr = '';
  }

  execute(sender) {
    this.executeSequence(sender);
    const parsed = parseString(this, this.expr);
    const output = trimExpressionString(evaluateExpression(parsed, {
      resolveVariable: (name) => getFormulaService(this).parse(this.owner, `{@${name}}`),
    }));
    const selectedDict = this.Dict?.[output] ?? this.Dict?.default;
    if (!selectedDict) {
      return undefined;
    }
    return getPomeloService(this).evaluateAction(selectedDict, this.owner, this.Index)?.execute(sender);
  }
}

function compareValues(left, operator, right, numericComparison) {
  if (operator === 'strlen') {
    return String(left).length === Number(right);
  }
  if (operator === '=') {
    return String(left) === String(right);
  }
  if (operator === '!=') {
    return String(left) !== String(right);
  }

  if (numericComparison) {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) {
      return false;
    }
    switch (operator) {
      case '>':
        return leftNumber > rightNumber;
      case '<':
        return leftNumber < rightNumber;
      case '>=':
        return leftNumber >= rightNumber;
      case '<=':
        return leftNumber <= rightNumber;
      default:
        return false;
    }
  }

  const compared = String(left).localeCompare(String(right));
  switch (operator) {
    case '>':
      return compared > 0;
    case '<':
      return compared < 0;
    case '>=':
      return compared >= 0;
    case '<=':
      return compared <= 0;
    default:
      return false;
  }
}

function unsupportedActionClass(type) {
  return class TypedUnsupportedAction extends UnsupportedAction {
    static actionType = type;

    constructor(owner) {
      super(owner, type);
    }
  };
}

function registerBuiltInActions(factory) {
  factory
    .registerAction('null', NullAction)
    .registerAction('batch', BatchAction)
    .registerAction('loop', LoopAction)
    .registerAction('thinktime', ThinkTimeAction)
    .registerAction('log', LogAction)
    .registerAction('condition', ConditionAction)
    .registerAction('select', SelectAction)
    .registerAction('activity', ActivityAction)
    .registerAction('callAction', CallActionAction)
    .registerAction('saveParameterAs', SaveParameterAsAction)
    .registerAction('echooff', EchoOffAction)
    .registerAction('echoon', EchoOnAction)
    .registerAction('merge', MergeAction)
    .registerAction('message', MessageAction)
    .registerAction('operation', OperationAction)
    .registerAction('formula', FormulaAction)
    .registerAction('compute', ComputeAction)
    .registerAction('tool.call', ToolCallAction)
    .registerAction('toolCall', ToolCallAction)
    .registerAction('skill.run', SkillRunAction)
    .registerAction('skillRun', SkillRunAction);

  for (const type of EXTERNAL_ACTION_TYPES) {
    factory.registerAction(type, unsupportedActionClass(type));
  }
}

module.exports = {
  ActivityAction,
  AdapterProcessAction,
  BatchAction,
  CallActionAction,
  ComputeAction,
  ConditionAction,
  EchoOffAction,
  EchoOnAction,
  FormulaAction,
  LoopAction,
  LogAction,
  MergeAction,
  MessageAction,
  NullAction,
  OperationAction,
  SaveParameterAsAction,
  SelectAction,
  ThinkTimeAction,
  ToolCallAction,
  UnsupportedAction,
  SkillRunAction,
  EXTERNAL_ACTION_TYPES,
  registerBuiltInActions,
};
