/**
 * Read a JSON string that starts at an opening quote.
 * Incomplete escapes at the end of a stream are left out of the value.
 *
 * @param {string} source
 * @param {number} openQuoteIndex
 * @returns {{ value: string, complete: boolean, endIndex: number }}
 */
function readJsonString(source, openQuoteIndex) {
  let value = "";
  let i = openQuoteIndex + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      if (i + 1 >= source.length) {
        return { value, complete: false, endIndex: -1 };
      }
      const next = source[i + 1];
      if (next === "u") {
        if (i + 5 >= source.length) {
          return { value, complete: false, endIndex: -1 };
        }
        const hex = source.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          return { value, complete: false, endIndex: -1 };
        }
        value += String.fromCharCode(parseInt(hex, 16));
        i += 6;
        continue;
      }
      const escaped = {
        n: "\n",
        r: "\r",
        t: "\t",
        b: "\b",
        f: "\f",
        '"': '"',
        "\\": "\\",
        "/": "/",
      };
      value += Object.prototype.hasOwnProperty.call(escaped, next) ? escaped[next] : next;
      i += 2;
      continue;
    }
    if (ch === '"') {
      return { value, complete: true, endIndex: i + 1 };
    }
    value += ch;
    i += 1;
  }
  return { value, complete: false, endIndex: -1 };
}

/**
 * Pull top-level string fields out of a partial JSON object.
 * `long` is read before `short`, so a short value is only exposed once the
 * long value's closing quote has been seen.
 *
 * @param {string} buffer
 * @returns {{
 *   long: { value: string, started: boolean, complete: boolean },
 *   short: { value: string, started: boolean, complete: boolean }
 * }}
 */
export function extractTitleTranslationFields(buffer) {
  const empty = { value: "", started: false, complete: false };
  const fields = { long: { ...empty }, short: { ...empty } };
  const source = String(buffer || "");
  const start = source.indexOf("{");
  if (start < 0) return fields;

  let i = start + 1;
  while (i < source.length) {
    while (i < source.length && /[\s,]/.test(source[i])) i += 1;
    if (i >= source.length || source[i] === "}") break;
    if (source[i] !== '"') break;

    const keyRead = readJsonString(source, i);
    if (!keyRead.complete) break;
    const key = keyRead.value;
    i = keyRead.endIndex;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    if (i >= source.length || source[i] !== ":") break;
    i += 1;
    while (i < source.length && /\s/.test(source[i])) i += 1;
    if (i >= source.length) break;
    if (source[i] !== '"') break;

    const valueRead = readJsonString(source, i);
    if (key === "long" || key === "short") {
      fields[key] = {
        value: valueRead.value,
        started: true,
        complete: valueRead.complete,
      };
    }
    if (!valueRead.complete) break;
    i = valueRead.endIndex;
  }

  if (!fields.long.complete) {
    fields.short = { ...empty };
  }

  return fields;
}
