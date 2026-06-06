'use strict';

const {
  AttributeList,
  setAttributeWithPath,
  toAttributeList,
} = require('../attribute-list');

const ActionType = Object.freeze({
  none: 'none',
  null: 'null',
  external: 'external',
  log: 'log',
  batch: 'batch',
  condition: 'condition',
  select: 'select',
  activity: 'activity',
  loop: 'loop',
  thinktime: 'thinktime',
  callAction: 'callAction',
  saveParameterAs: 'saveParameterAs',
  echooff: 'echooff',
  echoon: 'echoon',
  merge: 'merge',
  operation: 'operation',
  message: 'message',
  formula: 'formula',
  compute: 'compute',
  toolCall: 'tool.call',
  skillRun: 'skill.run',
  sendcommand: 'sendcommand',
  sendmulticommand: 'sendmulticommand',
  sendcontrol: 'sendcontrol',
  runshell: 'runshell',
  executeshell: 'executeshell',
  filetransfer: 'filetransfer',
  loadtemplate: 'loadtemplate',
  getservicedata: 'getservicedata',
  getdevicedata: 'getdevicedata',
  userauthservice: 'userauthservice',
  getdeviceonoffstatus: 'getdeviceonoffstatus',
  getcommandservice: 'getcommandservice',
  setcommandservice: 'setcommandservice',
  addmoindexservice: 'addmoindexservice',
  delmoindiexservice: 'delmoindiexservice',
  devicerebootservice: 'devicerebootservice',
  devicefactoryinitservice: 'devicefactoryinitservice',
  setwifiqualityinfo: 'setwifiqualityinfo',
  getdevicequalitydata: 'getdevicequalitydata',
  devbindingsearch: 'devbindingsearch',
  getl2equipfromhomehub: 'getl2equipfromhomehub',
  getresourceloginfo: 'getresourceloginfo',
  getipequipqualityinfo: 'getipequipqualityinfo',
  linkagesa: 'linkagesa',
  getl2systemstatusservice: 'getl2systemstatusservice',
  getmib: 'getmib',
  setmib: 'setmib',
  ping: 'ping',
  tracert: 'tracert',
  sql: 'sql',
  logprocess: 'logprocess',
  sms: 'sms',
  getcustomerinfo: 'getcustomerinfo',
  inquirycustomerinfo: 'inquirycustomerinfo',
  inquirynetequipinfo: 'inquirynetequipinfo',
  getitehubmacaddr: 'getitehubmacaddr',
  getcustomerhomeinfo: 'getcustomerhomeinfo',
  topologyinfo: 'topologyinfo',
  checkmemberid: 'checkmemberid',
  requestsmscertification: 'requestsmscertification',
  verifysmscertification: 'verifysmscertification',
  registermember: 'registermember',
  unregistermember: 'unregistermember',
  getdeviceinfo: 'getdeviceinfo',
  setportforwarding: 'setportforwarding',
  setsecuritylevel: 'setsecuritylevel',
  ssh: 'ssh',
  avsmsendcommand: 'avsmsendcommand',
  hdssendcommand: 'hdssendcommand',
});

class XaAction {
  constructor(owner = null) {
    this.owner = owner;
    this.ID = '';
    this.Dict = null;
    this.validTest = null;
    this.sequence = [];
    this._index = 0;
  }

  get Owner() {
    return this.owner;
  }

  set Owner(value) {
    this.owner = value;
  }

  get Index() {
    return this._index;
  }

  set Index(value) {
    this._index = value;
  }

  get Hostname() {
    return this.owner?.Root?.Hostname ?? this.owner?.Hostname ?? 'tumblr';
  }

  evaluate(_dict) {
    return false;
  }

  execute(sender) {
    this.executeSequence(sender);
  }

  executeSequence(_sender) {
    const formulaService = this.owner?.runtime?.formulaService;
    if (!formulaService) {
      return;
    }

    for (const sequence of this.sequence) {
      formulaService.parseSequence(this.owner, sequence);
    }
  }

  parseObject(input) {
    return this.owner?.runtime?.formulaService?.parseObject(this.owner, input) ?? null;
  }
}

class ProcessActionStartEventArgs {
  constructor(processId) {
    this.ProcessId = processId;
  }
}

class ProcessActionStopEventArgs {
  constructor(processId, processResult = null) {
    this.ProcessId = processId;
    this.ProcessResult = processResult;
  }
}

class ProcessAction extends XaAction {
  constructor(owner = null) {
    super(owner);
    this.ProcessID = '';
    this.SUCCESS = null;
    this.FAILURE = null;
    this.result = new AttributeList();
    this.customType = '';
  }

  get Result() {
    return this.result;
  }

  get CustomType() {
    return this.customType;
  }

  set CustomType(value) {
    this.customType = value ?? '';
  }

  execute(sender) {
    this.executeSequence(sender);
  }

  executeSequence(sender) {
    if (this.owner && typeof this.owner.onProcessActionStart === 'function') {
      this.owner.onProcessActionStart(this, new ProcessActionStartEventArgs(this.ProcessID));
    }
    super.executeSequence(sender);
  }

  afterExecute(sender) {
    const owner = this.owner;
    if (!owner) {
      return undefined;
    }

    if (!owner.Data) {
      owner.Data = new AttributeList();
    }
    if (!owner.Root) {
      owner.Root = owner;
    }
    if (!owner.Root.Data) {
      owner.Root.Data = owner.Data;
    }
    if (!owner.Root.Return) {
      owner.Root.Return = new AttributeList({ process: [] });
    }
    if (!owner.Root.Return.process) {
      owner.Root.Return.process = [];
    }

    setAttributeWithPath(owner.Data, 'record.responseData', this.result);

    if (this.ProcessID) {
      setAttributeWithPath(owner.Root.Data, `${this.ProcessID}.responseData`, this.result);
    }

    const processResult = toAttributeList({
      id: this.getProcessId(),
      name: this.getProcessName(),
      result: this.result,
    });
    owner.Root.Return.process.push(processResult);

    if (typeof owner.onProcessActionStop === 'function') {
      owner.onProcessActionStop(this, new ProcessActionStopEventArgs(this.ProcessID, processResult));
    }

    const state = this.result.get('_state_');
    const nextAction = state === 'SUCCESS' ? this.SUCCESS : this.FAILURE;
    if (nextAction && typeof nextAction.execute === 'function') {
      return nextAction.execute(sender);
    }

    return undefined;
  }

  getProcessId() {
    if (!this.ProcessID) {
      return '';
    }

    const ownerId = this.owner?.ID ? `${this.owner.ID}.` : '';
    const fetchedData = this.owner?.Root?.FetchedData ?? [];
    const fetched = fetchedData[this.Index];
    const sequence = fetched && fetched.sequence != null ? `_items(${fetched.sequence}).` : '';

    return `${ownerId}${sequence}${this.ProcessID}`;
  }

  getProcessName() {
    if (this.Dict && this.Dict.type) {
      return this.Dict.type;
    }
    if (this.CustomType) {
      return this.CustomType;
    }
    const factory = this.owner?.runtime?.actionFactory;
    return factory?.getTypeString(this.constructor, this) ?? this.constructor.name;
  }
}

module.exports = {
  ActionType,
  ProcessAction,
  ProcessActionStartEventArgs,
  ProcessActionStopEventArgs,
  XaAction,
};
