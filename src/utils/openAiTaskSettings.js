import { config } from "@/config/config.js";

/**
 * Structural fallbacks only — no product model ids.
 * Models come exclusively from ThemeConfig → config.openAiTaskModels
 * (backend MUGIN_LLM_TASK_MODELS for the active LLM provider).
 */
const FALLBACKS = {
  summarizeArticle: {
    reasoningEffort: "none",
    verbosity: "medium",
  },
  summarizeAbstract: {
    reasoningEffort: "none",
    verbosity: "medium",
  },
  translate: {
    reasoningEffort: "none",
    verbosity: "medium",
  },
  semanticIntent: {
    reasoningEffort: "none",
    verbosity: "low",
  },
  mesh: {
    reasoningEffort: "none",
    verbosity: "medium",
  },
  // Verbosity omitted so prompt-level low/medium for check vs align is kept.
  searchflow: {
    reasoningEffort: "none",
  },
  finalRerank: {
    reasoningEffort: "none",
  },
};

/**
 * @param {string} taskKey
 * @returns {Record<string, any>}
 */
export function getOpenAiTaskSettings(taskKey) {
  const key = String(taskKey || "").trim();
  const fromBackend =
    config.openAiTaskModels && typeof config.openAiTaskModels === "object"
      ? config.openAiTaskModels[key]
      : null;
  const fallback = FALLBACKS[key] || {};
  const out = {};

  const model = String(fromBackend?.model || "").trim();
  if (model) out.model = model;

  const effortRaw = fromBackend?.reasoningEffort ?? fallback.reasoningEffort;
  if (effortRaw != null && String(effortRaw).trim() !== "") {
    out.reasoningEffort = String(effortRaw).trim();
  }

  const backendHasVerbosity =
    fromBackend &&
    typeof fromBackend === "object" &&
    Object.prototype.hasOwnProperty.call(fromBackend, "verbosity");
  const fallbackHasVerbosity = Object.prototype.hasOwnProperty.call(
    fallback,
    "verbosity"
  );
  if (backendHasVerbosity || fallbackHasVerbosity) {
    const verbosity = String(
      (backendHasVerbosity ? fromBackend.verbosity : fallback.verbosity) || ""
    )
      .trim()
      .toLowerCase();
    if (verbosity === "low" || verbosity === "medium" || verbosity === "high") {
      out.verbosity = verbosity;
    }
  }

  const summary = String(fromBackend?.reasoningSummary || "")
    .trim()
    .toLowerCase();
  if (summary === "auto" || summary === "concise" || summary === "detailed") {
    out.reasoningSummary = summary;
  }

  if (
    fromBackend?.maxOutputTokens != null &&
    fromBackend.maxOutputTokens !== "" &&
    Number.isFinite(Number(fromBackend.maxOutputTokens))
  ) {
    out.maxOutputTokens = Math.max(1, Math.floor(Number(fromBackend.maxOutputTokens)));
  }
  if (
    fromBackend?.temperature != null &&
    fromBackend.temperature !== "" &&
    Number.isFinite(Number(fromBackend.temperature))
  ) {
    const temperature = Number(fromBackend.temperature);
    if (temperature >= 0 && temperature <= 2) out.temperature = temperature;
  }
  if (
    fromBackend?.topP != null &&
    fromBackend.topP !== "" &&
    Number.isFinite(Number(fromBackend.topP))
  ) {
    const topP = Number(fromBackend.topP);
    if (topP >= 0 && topP <= 1) out.topP = topP;
  }
  if (typeof fromBackend?.parallelToolCalls === "boolean") {
    out.parallelToolCalls = fromBackend.parallelToolCalls;
  }
  if (typeof fromBackend?.store === "boolean") {
    out.store = fromBackend.store;
  }
  if (
    fromBackend?.truncation != null &&
    String(fromBackend.truncation).trim() !== ""
  ) {
    out.truncation = String(fromBackend.truncation).trim();
  }
  if (
    fromBackend?.instructions != null &&
    String(fromBackend.instructions).trim() !== ""
  ) {
    out.instructions = String(fromBackend.instructions).trim();
  }

  return out;
}

/**
 * Apply configured ResponsesRequest knobs onto a prompt object.
 * Preserves other prompt.text fields (e.g. json_schema format).
 * Strips any hardcoded prompt.model when config has no model for the task.
 *
 * @param {object} prompt
 * @param {string} taskKey
 * @returns {object}
 */
export function applyOpenAiTaskSettings(prompt, taskKey) {
  if (!prompt || typeof prompt !== "object") return prompt;
  const settings = getOpenAiTaskSettings(taskKey);
  const next = { ...prompt };

  if (settings.model) {
    next.model = settings.model;
  } else {
    delete next.model;
  }
  if (settings.reasoningEffort != null || settings.reasoningSummary != null) {
    next.reasoning = {
      ...(prompt.reasoning && typeof prompt.reasoning === "object"
        ? prompt.reasoning
        : {}),
    };
    if (settings.reasoningEffort != null) {
      next.reasoning.effort = settings.reasoningEffort;
    }
    if (settings.reasoningSummary != null) {
      next.reasoning.summary = settings.reasoningSummary;
    }
  }
  if (settings.verbosity != null) {
    next.text = {
      ...(prompt.text && typeof prompt.text === "object" ? prompt.text : {}),
      verbosity: settings.verbosity,
    };
  }
  if (settings.maxOutputTokens != null) {
    next.max_output_tokens = settings.maxOutputTokens;
  }
  if (settings.temperature != null) {
    next.temperature = settings.temperature;
  }
  if (settings.topP != null) {
    next.top_p = settings.topP;
  }
  if (settings.parallelToolCalls != null) {
    next.parallel_tool_calls = settings.parallelToolCalls;
  }
  if (settings.store != null) {
    next.store = settings.store;
  }
  if (settings.truncation != null) {
    next.truncation = settings.truncation;
  }
  if (settings.instructions != null) {
    next.instructions = settings.instructions;
  }

  return next;
}

/**
 * @param {object[]} prompts
 * @param {string} taskKey
 * @returns {object[]}
 */
export function applyOpenAiTaskSettingsToList(prompts, taskKey) {
  if (!Array.isArray(prompts)) return prompts;
  return prompts.map((prompt) => applyOpenAiTaskSettings({ ...prompt }, taskKey));
}

function fallbackModelForPrompt(prompt) {
  const current = String(prompt?.model || "").trim().toLowerCase();
  if (!current || !config.openAiTaskModels) return "";
  const tasks = Object.values(config.openAiTaskModels);
  for (const settings of tasks) {
    if (!settings || typeof settings !== "object") continue;
    if (String(settings.model || "").trim().toLowerCase() !== current) continue;
    const fallback = String(settings.fallbackModel || "").trim();
    if (fallback && fallback.toLowerCase() !== current) return fallback;
  }
  return "";
}

/**
 * POST JSON, then retry once with the Requesty fallback model from config
 * when the default model call fails.
 */
export async function postJsonWithModelFallback(url, body, init = {}) {
  const send = (payload) =>
    fetch(url, {
      method: "POST",
      ...init,
      body: JSON.stringify(payload),
    });
  const fallbackBody = () => {
    const fallback = fallbackModelForPrompt(body?.prompt);
    if (!fallback || !body?.prompt || typeof body.prompt !== "object") return null;
    return { ...body, prompt: { ...body.prompt, model: fallback } };
  };
  let response;
  try {
    response = await send(body);
  } catch (error) {
    const retryBody = fallbackBody();
    if (!retryBody) throw error;
    return send(retryBody);
  }
  if (response.ok) return response;
  const retryBody = fallbackBody();
  if (!retryBody) return response;
  try {
    await response.body?.cancel?.();
  } catch (_error) {
    /* The failed response is discarded before the fallback call. */
  }
  return send(retryBody);
}
