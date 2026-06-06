'use strict';

const assert = require('node:assert/strict');

const {
  decrypt,
  encrypt,
  getUnixTimestamp,
  javaTimeStampToDateTime,
  ManagedServerTag,
  unixTimeStampToDateTime,
} = require('../../../packages/runtime/src');

const timestampDate = new Date('2026-05-01T00:00:00.000Z');
assert.equal(getUnixTimestamp(timestampDate), 1777593600000);
assert.equal(unixTimeStampToDateTime(1777593600).toISOString(), '2026-05-01T00:00:00.000Z');
assert.equal(javaTimeStampToDateTime(1777593601500).toISOString(), '2026-05-01T00:00:02.000Z');

const legacyCipherText = 'jElHw/rkpjbDPFdwdktJNz0vqD/xKQ1zgXTODm6Nrto=';
assert.equal(encrypt('server-password-123'), legacyCipherText);
assert.equal(decrypt(legacyCipherText), 'server-password-123');
assert.equal(decrypt('not encrypted'), 'not encrypted');

const tag = new ManagedServerTag({
  Group: 'G',
  Category: 'C',
  Division: 'D',
  ServerId: 'S01',
  IpAddress: '10.0.0.5',
});

assert.equal(tag.toString(), 'G.C.D.S01(10.0.0.5)');

console.log('COMMON_EXAMPLE_OK');
console.log(`timestampMs=${getUnixTimestamp(timestampDate)}`);
console.log(`legacyCipherText=${legacyCipherText}`);
console.log(`tag=${tag.toString()}`);
