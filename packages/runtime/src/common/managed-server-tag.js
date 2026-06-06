'use strict';

const FIELDS = [
  'Seq',
  'Group',
  'Category',
  'Division',
  'ServerId',
  'ServerName',
  'OS',
  'Method',
  'Encoding',
  'IpAddress',
  'Port',
  'Root',
  'RootPW',
  'User',
  'UserPW',
  'ServiceMethod',
  'ServiceIp',
  'ServicePort',
  'ServiceUrl',
  'Remark',
  'UseYN',
  'Tag',
];

class ManagedServerTag {
  constructor(values = {}) {
    for (const field of FIELDS) {
      this[field] = values[field] ?? '';
    }
  }

  toString() {
    return `${this.Group}.${this.Category}.${this.Division}.${this.ServerId}(${this.IpAddress})`;
  }
}

module.exports = {
  ManagedServerTag,
};
