'use strict';

const crypto = require('node:crypto');

const PASSWORD = 'dkapqkzja12#$';
const SALT = Buffer.from('cf840359e081de4985896cdaf482a696', 'hex');
const PASSWORD_DERIVE_BYTES_ITERATIONS = 100;
const SHA1_BYTE_COUNT = 20;

function getUnixTimestamp(date = new Date()) {
  return date.getTime();
}

function unixTimeStampToDateTime(unixTimeStamp) {
  return new Date(unixTimeStamp * 1000);
}

function roundMidpointToEven(value) {
  const sign = Math.sign(value);
  const absoluteValue = Math.abs(value);
  const floor = Math.floor(absoluteValue);
  const difference = absoluteValue - floor;

  if (difference < 0.5) {
    return sign * floor;
  }

  if (difference > 0.5) {
    return sign * (floor + 1);
  }

  return sign * (floor % 2 === 0 ? floor : floor + 1);
}

function javaTimeStampToDateTime(javaTimeStamp) {
  return new Date(roundMidpointToEven(javaTimeStamp / 1000) * 1000);
}

function sha1(...buffers) {
  return crypto.createHash('sha1').update(Buffer.concat(buffers)).digest();
}

function computeLegacyBaseValue() {
  let baseValue = sha1(Buffer.from(PASSWORD, 'latin1'), SALT);

  for (let i = 1; i < PASSWORD_DERIVE_BYTES_ITERATIONS - 1; i++) {
    baseValue = sha1(baseValue);
  }

  return baseValue;
}

function getLegacyPrefix(prefix) {
  if (prefix > 999) {
    throw new Error('Too many bytes requested from PasswordDeriveBytes-compatible generator');
  }

  if (prefix === 0) {
    return Buffer.alloc(0);
  }

  return Buffer.from(String(prefix), 'ascii');
}

function createLegacyPasswordDeriveBytes() {
  let baseValue;
  let extra;
  let extraCount = 0;
  let prefix = 0;

  function computeBytes(byteCount) {
    const output = Buffer.alloc(Math.ceil(byteCount / SHA1_BYTE_COUNT) * SHA1_BYTE_COUNT);

    for (let offset = 0; byteCount > offset; offset += SHA1_BYTE_COUNT) {
      const hash = sha1(getLegacyPrefix(prefix), baseValue);
      prefix += 1;
      hash.copy(output, offset);
    }

    return output;
  }

  return {
    getBytes(byteCount) {
      let offset = 0;
      const output = Buffer.alloc(byteCount);

      if (!baseValue) {
        baseValue = computeLegacyBaseValue();
      } else if (extra) {
        const availableExtra = extra.length - extraCount;

        if (availableExtra >= byteCount) {
          extra.copy(output, 0, extraCount, extraCount + byteCount);
          if (availableExtra > byteCount) {
            extraCount += byteCount;
          } else {
            extra = undefined;
          }
          return output;
        }

        // PasswordDeriveBytes kept this offset bug for compatibility.
        extra.copy(output, 0, availableExtra, availableExtra * 2);
        offset = availableExtra;
        extra = undefined;
      }

      const computedBytes = computeBytes(byteCount - offset);
      computedBytes.copy(output, offset, 0, byteCount - offset);

      if (computedBytes.length + offset > byteCount) {
        extra = computedBytes;
        extraCount = byteCount - offset;
      }

      return output;
    },
  };
}

function deriveLegacyBytes(byteCount) {
  const passwordDeriveBytes = createLegacyPasswordDeriveBytes();

  if (byteCount === 48) {
    return Buffer.concat([
      passwordDeriveBytes.getBytes(32),
      passwordDeriveBytes.getBytes(16),
    ]);
  }

  return passwordDeriveBytes.getBytes(byteCount);
}

function encrypt(clearText, encoding = 'latin1') {
  const keyAndIv = deriveLegacyBytes(48);
  const key = keyAndIv.subarray(0, 32);
  const iv = keyAndIv.subarray(32, 48);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([
    cipher.update(Buffer.from(String(clearText), encoding)),
    cipher.final(),
  ]).toString('base64');
}

function decrypt(cipherText, encoding = 'latin1') {
  try {
    const cipherBytes = Buffer.from(String(cipherText), 'base64');
    if (cipherBytes.length === 0) {
      return cipherText;
    }

    const keyAndIv = deriveLegacyBytes(48);
    const key = keyAndIv.subarray(0, 32);
    const iv = keyAndIv.subarray(32, 48);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([
      decipher.update(cipherBytes),
      decipher.final(),
    ]).toString(encoding);
  } catch (_error) {
    return cipherText;
  }
}

module.exports = {
  decrypt,
  encrypt,
  getUnixTimestamp,
  javaTimeStampToDateTime,
  unixTimeStampToDateTime,
};
