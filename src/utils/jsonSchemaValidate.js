/**
 * Minimal JSON Schema validator for QuickPubMed observability.
 *
 * Not a full JSON Schema implementation. Supports a deliberate subset:
 *   - "type": "object" | "string" | "number" | "boolean" | "array" | ["string","null"] | "null"
 *   - "required": ["field", ...]
 *   - "properties": { field: <schema> }
 *   - "enum": ["a","b",...]
 *   - "items": <schema>   (for arrays; single schema only)
 *   - "minItems", "maxItems"
 *   - "minimum", "maximum"
 *   - nested objects and arrays
 *
 * Returns a structured result {schemaValid, violations, checkedSchemaVersion}
 * and NEVER throws on malformed input (that is itself a violation).
 *
 * Purpose: observe whether the LLM drifts from the declared semanticIntentResponseSchema
 * contract. Violations are logged as telemetry; nothing is retried or blocked.
 */

const DEFAULT_VERSION = "v1";

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesType(value, expected) {
  if (!expected) return true;
  const actual = typeOf(value);
  if (Array.isArray(expected)) {
    return expected.some((t) => matchesType(value, t));
  }
  if (expected === "integer") {
    return actual === "number" && Number.isInteger(value);
  }
  return actual === expected;
}

function validateNode(value, schema, path, violations) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type && !matchesType(value, schema.type)) {
    violations.push({
      path: path || "(root)",
      rule: "type",
      expected: schema.type,
      actual: typeOf(value),
    });
    return;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    if (!schema.enum.includes(value)) {
      violations.push({ path: path || "(root)", rule: "enum", expected: schema.enum, actual: value });
    }
  }

  if (typeof value === "number") {
    if (typeof schema.minimum === "number" && value < schema.minimum) {
      violations.push({ path: path || "(root)", rule: "minimum", expected: schema.minimum, actual: value });
    }
    if (typeof schema.maximum === "number" && value > schema.maximum) {
      violations.push({ path: path || "(root)", rule: "maximum", expected: schema.maximum, actual: value });
    }
  }

  if (schema.type === "object" || (schema.properties && typeOf(value) === "object")) {
    if (typeOf(value) !== "object") return;
    if (Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in value)) {
          violations.push({ path: joinPath(path, field), rule: "required" });
        }
      }
    }
    if (schema.properties && typeof schema.properties === "object") {
      for (const [field, subschema] of Object.entries(schema.properties)) {
        if (!(field in value)) continue;
        validateNode(value[field], subschema, joinPath(path, field), violations);
      }
    }
  }

  if (schema.type === "array" || (schema.items && Array.isArray(value))) {
    if (!Array.isArray(value)) return;
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      violations.push({ path: path || "(root)", rule: "minItems", expected: schema.minItems, actual: value.length });
    }
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) {
      violations.push({ path: path || "(root)", rule: "maxItems", expected: schema.maxItems, actual: value.length });
    }
    if (schema.items && typeof schema.items === "object") {
      for (let i = 0; i < value.length; i += 1) {
        validateNode(value[i], schema.items, joinPath(path, String(i)), violations);
      }
    }
  }
}

function joinPath(base, segment) {
  if (!base) return String(segment);
  return base + "." + segment;
}

/**
 * @param {*} candidate - the object to validate
 * @param {object} schema - the minimal-subset schema
 * @param {object} [options]
 * @param {string} [options.schemaVersion="v1"]
 * @returns {{schemaValid: boolean, violations: Array, checkedSchemaVersion: string}}
 */
export function validateAgainstSchema(candidate, schema, options = {}) {
  const violations = [];
  try {
    if (!schema || typeof schema !== "object") {
      return {
        schemaValid: false,
        violations: [{ path: "(schema)", rule: "missing-schema" }],
        checkedSchemaVersion: options.schemaVersion || DEFAULT_VERSION,
      };
    }
    validateNode(candidate, schema, "", violations);
  } catch (err) {
    violations.push({ path: "(validator)", rule: "internal-error", message: String(err && err.message) });
  }
  return {
    schemaValid: violations.length === 0,
    violations,
    checkedSchemaVersion: options.schemaVersion || DEFAULT_VERSION,
  };
}

export default validateAgainstSchema;
