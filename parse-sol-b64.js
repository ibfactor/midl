/**
 * parse-sol-b64.js
 *
 * Parses Adobe Flash / Ruffle "Local Shared Object" (.sol) data from a
 * base64-encoded string. Body is AMF0 (Action Message Format 0).
 * No external dependencies.
 *
 * Usage:
 *   const { parseSOLFromBase64 } = require('./parse-sol-b64.js');
 *   const result = parseSOLFromBase64(base64String);
 *   // result = { name, fileLength, data, quirkPaddingUsed }
 */

// ---- AMF0 type markers ----
const AMF0 = {
  NUMBER: 0x00,
  BOOLEAN: 0x01,
  STRING: 0x02,
  OBJECT: 0x03,
  MOVIECLIP: 0x04, // reserved, unused
  NULL: 0x05,
  UNDEFINED: 0x06,
  REFERENCE: 0x07,
  ECMA_ARRAY: 0x08,
  OBJECT_END: 0x09,
  STRICT_ARRAY: 0x0a,
  DATE: 0x0b,
  LONG_STRING: 0x0c,
  UNSUPPORTED: 0x0d,
  XML_DOCUMENT: 0x0f,
  TYPED_OBJECT: 0x10,
};

class AMF0Reader {
  constructor(buf, offset = 0) {
    this.buf = buf;
    this.offset = offset;
  }

  readU8() {
    return this.buf.readUInt8(this.offset++);
  }

  readU16() {
    const v = this.buf.readUInt16BE(this.offset);
    this.offset += 2;
    return v;
  }

  readU32() {
    const v = this.buf.readUInt32BE(this.offset);
    this.offset += 4;
    return v;
  }

  readDouble() {
    const v = this.buf.readDoubleBE(this.offset);
    this.offset += 8;
    return v;
  }

  readUTF8(len) {
    const s = this.buf.toString('utf8', this.offset, this.offset + len);
    this.offset += len;
    return s;
  }

  readString() {
    const len = this.readU16();
    return this.readUTF8(len);
  }

  readLongString() {
    const len = this.readU32();
    return this.readUTF8(len);
  }

  // Reads name+value pairs until the OBJECT_END marker (00 00 09) is hit.
  // Used for nested OBJECT/ECMA_ARRAY bodies, where no padding quirk applies.
  readPropertyList() {
    const obj = {};
    while (true) {
      const nameLen = this.readU16();
      if (nameLen === 0) {
        const marker = this.readU8();
        if (marker !== AMF0.OBJECT_END) {
          throw new Error(
            `Expected object-end marker at offset ${this.offset - 1}, got 0x${marker.toString(16)}`
          );
        }
        break;
      }
      const name = this.readUTF8(nameLen);
      obj[name] = this.readValue();
    }
    return obj;
  }

  readValue() {
    const type = this.readU8();
    switch (type) {
      case AMF0.NUMBER:
        return this.readDouble();
      case AMF0.BOOLEAN:
        return this.readU8() !== 0;
      case AMF0.STRING:
        return this.readString();
      case AMF0.OBJECT:
        return this.readPropertyList();
      case AMF0.NULL:
        return null;
      case AMF0.UNDEFINED:
        return undefined;
      case AMF0.REFERENCE: {
        const idx = this.readU16();
        return { __amfReference: idx };
      }
      case AMF0.ECMA_ARRAY: {
        const count = this.readU32(); // informational only
        const obj = this.readPropertyList();
        obj.__ecmaArrayCount = count;
        return obj;
      }
      case AMF0.STRICT_ARRAY: {
        const count = this.readU32();
        const arr = [];
        for (let i = 0; i < count; i++) arr.push(this.readValue());
        return arr;
      }
      case AMF0.DATE: {
        const millis = this.readDouble();
        this.offset += 2; // timezone offset, unused
        return new Date(millis);
      }
      case AMF0.LONG_STRING:
        return this.readLongString();
      case AMF0.UNSUPPORTED:
        return undefined;
      case AMF0.XML_DOCUMENT:
        return this.readLongString();
      case AMF0.TYPED_OBJECT: {
        const className = this.readString();
        const obj = this.readPropertyList();
        return { __className: className, ...obj };
      }
      default:
        throw new Error(`Unknown AMF0 type marker 0x${type.toString(16)} at offset ${this.offset - 1}`);
    }
  }
}

/**
 * Parses the SOL header (magic/length/signature/object name) and returns
 * a reader positioned at the start of the top-level variable list, plus
 * the declared total body length (for validating a full, clean parse).
 */
function readHeader(buf) {
  const r = new AMF0Reader(buf);

  const magic = r.readU16(); // 0x00BF
  if (magic !== 0x00bf) {
    throw new Error(`Not a SOL file: bad magic 0x${magic.toString(16)}`);
  }

  const fileLength = r.readU32(); // bytes remaining after this field
  const signature = r.readUTF8(4); // "TCSO"
  if (signature !== 'TCSO') {
    throw new Error(`Not a SOL file: bad signature "${signature}"`);
  }

  r.offset += 6; // padding: 00 04 00 00 00 00

  const nameLen = r.readU16();
  const name = r.readUTF8(nameLen);

  r.offset += 4; // padding: 00 00 00 00

  return { r, name, fileLength };
}

/**
 * Reads the flat top-level variable list running to EOF.
 * @param {boolean} skipPadding - if true, swallow a stray 0x00 byte after
 *   every top-level value before reading the next entry (a quirk seen in
 *   some Ruffle/SharedObject-written SOL files; not part of the AMF0 spec).
 */
function readTopLevelList(r, buf, skipPadding) {
  const data = {};
  while (r.offset < buf.length) {
    const nameLen = r.readU16();
    if (nameLen === 0) {
      if (r.offset < buf.length && r.readU8() === AMF0.OBJECT_END) break;
      continue;
    }
    const key = r.readUTF8(nameLen);
    data[key] = r.readValue();
    if (skipPadding && r.offset < buf.length && buf[r.offset] === 0x00) {
      r.offset += 1;
    }
  }
  return data;
}

/**
 * Tries parsing the body both with and without the stray-padding-byte
 * quirk, and returns whichever run cleanly consumes the whole buffer.
 */
function parseBody(buf, startOffset) {
  const attempts = [];

  for (const skipPadding of [false, true]) {
    const r = new AMF0Reader(buf, startOffset);
    try {
      const data = readTopLevelList(r, buf, skipPadding);
      attempts.push({ ok: true, skipPadding, data, endOffset: r.offset });
    } catch (err) {
      attempts.push({ ok: false, skipPadding, error: err, endOffset: r.offset });
    }
  }

  // Prefer a run that both succeeded and landed exactly at EOF.
  const clean = attempts.find((a) => a.ok && a.endOffset === buf.length);
  if (clean) return clean;

  // Otherwise, prefer whichever succeeded at all.
  const anyOk = attempts.find((a) => a.ok);
  if (anyOk) return anyOk;

  // Both failed — surface the error from whichever got further.
  attempts.sort((a, b) => b.endOffset - a.endOffset);
  throw attempts[0].error;
}

/**
 * Parses a base64-encoded SOL file.
 * @param {string} base64 - base64-encoded raw bytes of a .sol file.
 * @returns {{ name: string, fileLength: number, data: object, quirkPaddingUsed: boolean }}
 */
function parseSOLFromBase64(base64) {
  const buf = Buffer.from(base64, 'base64');
  const { r, name, fileLength } = readHeader(buf);
  const result = parseBody(buf, r.offset);
  return {
    name,
    fileLength,
    data: result.data,
    quirkPaddingUsed: result.skipPadding,
  };
}

// ---- CLI (optional): node parse-sol-b64.js <base64-string-or-@file> ----
if (require.main === module) {
  const fs = require('fs');
  let input = process.argv[2];
  if (!input) {
    console.error('Usage: node parse-sol-b64.js <base64-string | @path-to-file-containing-base64>');
    process.exit(1);
  }
  if (input.startsWith('@')) {
    input = fs.readFileSync(input.slice(1), 'utf8').trim();
  }
  const result = parseSOLFromBase64(input);
  console.error(`SOL name: ${result.name} (padding quirk used: ${result.quirkPaddingUsed})`);
  console.log(JSON.stringify(result.data, null, 2));
}

module.exports = { parseSOLFromBase64, AMF0Reader, AMF0 };