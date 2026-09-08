/**
 * parse-sol-b64.js
 *
 * This file generated using Claude and modified by ChatGPT.
 * 
 * Standalone browser parser for Adobe Flash / Ruffle
 * Local Shared Object (.sol) files.
 *
 * Usage:
 *
 *   <script src="parse-sol-b64.js"></script>
 *
 *   const result = parseSOLFromBase64(base64);
 *   console.log(result);
 *
 * No dependencies.
 */

const AMF0 = {
  NUMBER: 0x00,
  BOOLEAN: 0x01,
  STRING: 0x02,
  OBJECT: 0x03,
  MOVIECLIP: 0x04,
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
    this.view = new DataView(
      buf.buffer,
      buf.byteOffset,
      buf.byteLength
    );
    this.offset = offset;
  }

  readU8() {
    if (this.offset + 1 > this.buf.length)
      throw new Error("Unexpected EOF while reading U8");

    return this.view.getUint8(this.offset++);
  }

  readU16() {
    if (this.offset + 2 > this.buf.length)
      throw new Error("Unexpected EOF while reading U16");

    const v = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return v;
  }

  readU32() {
    if (this.offset + 4 > this.buf.length)
      throw new Error("Unexpected EOF while reading U32");

    const v = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return v;
  }

  readDouble() {
    if (this.offset + 8 > this.buf.length)
      throw new Error("Unexpected EOF while reading double");

    const v = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return v;
  }

  readUTF8(len) {
    if (this.offset + len > this.buf.length)
      throw new Error("Unexpected EOF while reading UTF-8 string");

    const bytes = this.buf.subarray(
      this.offset,
      this.offset + len
    );

    this.offset += len;

    return new TextDecoder("utf-8").decode(bytes);
  }

  readString() {
    const len = this.readU16();
    return this.readUTF8(len);
  }

  readLongString() {
    const len = this.readU32();
    return this.readUTF8(len);
  }

  readPropertyList() {
    const obj = {};

    while (true) {
      const nameLen = this.readU16();

      if (nameLen === 0) {
        const marker = this.readU8();

        if (marker !== AMF0.OBJECT_END) {
          throw new Error(
            `Expected object-end marker at offset ${
              this.offset - 1
            }, got 0x${marker.toString(16)}`
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
        return {
          __amfReference: idx
        };
      }

      case AMF0.ECMA_ARRAY: {
        const count = this.readU32();

        const obj = this.readPropertyList();

        obj.__ecmaArrayCount = count;

        return obj;
      }

      case AMF0.STRICT_ARRAY: {
        const count = this.readU32();
        const arr = [];

        for (let i = 0; i < count; i++) {
          arr.push(this.readValue());
        }

        return arr;
      }

      case AMF0.DATE: {
        const millis = this.readDouble();

        // AMF0 timezone field
        this.offset += 2;

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

        return {
          __className: className,
          ...obj
        };
      }

      default:
        throw new Error(
          `Unknown AMF0 type marker 0x${type.toString(16)} ` +
          `at offset ${this.offset - 1}`
        );
    }
  }
}


/**
 * Reads the SOL header.
 */
function readHeader(buf) {
  const r = new AMF0Reader(buf);

  const magic = r.readU16();

  if (magic !== 0x00bf) {
    throw new Error(
      `Not a SOL file: bad magic 0x${magic.toString(16)}`
    );
  }

  const fileLength = r.readU32();

  const signature = r.readUTF8(4);

  if (signature !== "TCSO") {
    throw new Error(
      `Not a SOL file: bad signature "${signature}"`
    );
  }

  // 00 04 00 00 00 00
  r.offset += 6;

  const nameLen = r.readU16();
  const name = r.readUTF8(nameLen);

  // 00 00 00 00
  r.offset += 4;

  return {
    r,
    name,
    fileLength
  };
}


/**
 * Reads the top-level variable list.
 */
function readTopLevelList(r, buf, skipPadding) {
  const data = {};

  while (r.offset < buf.length) {
    const nameLen = r.readU16();

    if (nameLen === 0) {
      if (
        r.offset < buf.length &&
        r.readU8() === AMF0.OBJECT_END
      ) {
        break;
      }

      continue;
    }

    const key = r.readUTF8(nameLen);

    data[key] = r.readValue();

    // Ruffle / SharedObject quirk:
    // stray 00 after top-level values.
    if (
      skipPadding &&
      r.offset < buf.length &&
      buf[r.offset] === 0x00
    ) {
      r.offset += 1;
    }
  }

  return data;
}


/**
 * Attempts both normal AMF0 parsing and
 * the Ruffle padding quirk.
 */
function parseBody(buf, startOffset) {
  const attempts = [];

  for (const skipPadding of [false, true]) {
    const r = new AMF0Reader(buf, startOffset);

    try {
      const data = readTopLevelList(
        r,
        buf,
        skipPadding
      );

      attempts.push({
        ok: true,
        skipPadding,
        data,
        endOffset: r.offset
      });

    } catch (error) {
      attempts.push({
        ok: false,
        skipPadding,
        error,
        endOffset: r.offset
      });
    }
  }

  // Prefer a completely clean parse.
  const clean = attempts.find(
    a => a.ok && a.endOffset === buf.length
  );

  if (clean)
    return clean;

  // Otherwise use any successful parse.
  const anyOk = attempts.find(a => a.ok);

  if (anyOk)
    return anyOk;

  // Both failed. Return the attempt
  // that got furthest.
  attempts.sort(
    (a, b) => b.endOffset - a.endOffset
  );

  throw attempts[0].error;
}


/**
 * Converts a Base64 string to Uint8Array.
 *
 * Handles both:
 *
 *   "AAAA..."
 *
 * and:
 *
 *   "data:application/octet-stream;base64,AAAA..."
 */
function base64ToUint8Array(base64) {
  // Remove data URI prefix if present.
  const comma = base64.indexOf(",");

  if (
    base64.startsWith("data:") &&
    comma !== -1
  ) {
    base64 = base64.slice(comma + 1);
  }

  // Remove whitespace/newlines.
  base64 = base64.replace(/\s/g, "");

  const binary = atob(base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}


/**
 * Parses a Base64-encoded SOL file.
 *
 * @param {string} base64
 *
 * @returns {{
 *   name: string,
 *   fileLength: number,
 *   data: object,
 *   quirkPaddingUsed: boolean
 * }}
 */
function parseSOLFromBase64(base64) {
  const buf = base64ToUint8Array(base64);

  const {
    r,
    name,
    fileLength
  } = readHeader(buf);

  const result = parseBody(
    buf,
    r.offset
  );

  return {
    name,
    fileLength,
    data: result.data,
    quirkPaddingUsed: result.skipPadding
  };
}


/*
 * Expose globally.
 *
 * This makes:
 *
 *   parseSOLFromBase64(...)
 *
 * available directly from browser JavaScript.
 */

if (typeof window !== "undefined") {
  window.parseSOLFromBase64 = parseSOLFromBase64;
  window.AMF0Reader = AMF0Reader;
  window.AMF0 = AMF0;
}