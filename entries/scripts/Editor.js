import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";
import "@/assets/styles/qpm-editor.css";
import { messages } from "@/assets/content/qpm-translations.js";

const root = document.getElementById("qpm-editor");
if (!root) {
  throw new Error("Missing #qpm-editor root");
}

function ensureEditorMarkup() {
  root.classList.add("qpm-editor-wrap");
  if (document.getElementById("qpm-editor-login")) return;

  root.innerHTML = `
    <section id="qpm-editor-login">
      <div class="qpm-editor-row">
        <input id="qpm-editor-user" class="qpm-editor-input" type="text" placeholder="Brugernavn" />
        <input id="qpm-editor-password" class="qpm-editor-input" type="password" placeholder="Password" />
      </div>
      <div class="qpm-editor-row">
        <button id="qpm-editor-login-btn" class="qpm-editor-btn" type="button">Log ind</button>
      </div>
    </section>

    <section id="qpm-editor-app" class="qpm-editor-hidden">
      <div class="qpm-editor-row">
        <select id="qpm-editor-type" class="qpm-editor-select">
          <option value="topics">Topics</option>
          <option value="filters">Filters</option>
        </select>
        <select id="qpm-editor-domain" class="qpm-editor-select"></select>
      </div>

      <div id="qpm-editor-topic-tools" class="qpm-editor-row">
        <input id="qpm-editor-tree-search" class="qpm-editor-input" type="text" placeholder="Søg i emner (id eller navn)" />
        <button id="qpm-editor-collapse-all-btn" class="qpm-editor-btn qpm-editor-btn-secondary" type="button">Fold ud / Fold sammen</button>
        <label class="qpm-editor-sort-mode-label">
          <input id="qpm-editor-sort-mode" class="qpm-editor-sort-mode-checkbox" type="checkbox" />
          <span id="qpm-editor-sort-mode-text">Sorteringstilstand</span>
        </label>
        <div id="qpm-editor-topic-tree" class="qpm-editor-tree"></div>
      </div>

      <details id="qpm-editor-extra-tools" class="qpm-editor-accordion">
        <summary id="qpm-editor-extra-tools-summary" class="qpm-editor-accordion-summary">Andre funktioner</summary>
        <div class="qpm-editor-row">
          <button id="qpm-editor-toggle-json-btn" class="qpm-editor-btn qpm-editor-btn-secondary qpm-editor-json-toggle-btn" type="button">Rediger i JSON</button>
        </div>
        <textarea id="qpm-editor-json" class="qpm-editor-textarea qpm-editor-textarea-json qpm-editor-hidden" spellcheck="false"></textarea>
        <div id="qpm-editor-json-actions" class="qpm-editor-row qpm-editor-hidden">
          <button id="qpm-editor-save-json-btn" class="qpm-editor-btn" type="button">Gem</button>
        </div>
        <div id="qpm-editor-revisions" class="qpm-editor-row qpm-editor-hidden">
          <p id="qpm-editor-current-version-note" class="qpm-editor-note qpm-editor-revision-note-line"></p>
          <select id="qpm-editor-revision-list" class="qpm-editor-select"></select>
          <button id="qpm-editor-revision-refresh-btn" class="qpm-editor-btn qpm-editor-btn-secondary" type="button">Opdater historik</button>
          <button id="qpm-editor-revision-preview-btn" class="qpm-editor-btn qpm-editor-btn-secondary" type="button">Vis version</button>
          <button id="qpm-editor-revert-btn" class="qpm-editor-btn qpm-editor-btn-secondary" type="button">Gendan valgt version</button>
          <label class="qpm-editor-sort-mode-label qpm-editor-revision-only-diff-label qpm-editor-hidden">
            <input id="qpm-editor-revision-only-diff" class="qpm-editor-sort-mode-checkbox" type="checkbox" />
            <span id="qpm-editor-revision-only-diff-text">Vis kun forskelle</span>
          </label>
        </div>
        <p id="qpm-editor-revision-status" class="qpm-editor-note qpm-editor-hidden"></p>
        <textarea id="qpm-editor-revision-preview-json" class="qpm-editor-textarea qpm-editor-textarea-json qpm-editor-hidden" spellcheck="false" readonly></textarea>
        <div id="qpm-editor-revision-diff" class="qpm-editor-revision-diff qpm-editor-hidden"></div>
        <p class="qpm-editor-note qpm-editor-api-note"><span id="qpm-editor-api-base-label">Aktiv API</span>: <span id="qpm-editor-api-base"></span></p>
      </details>
      <div class="qpm-editor-row">
        <button id="qpm-editor-load-btn" class="qpm-editor-btn qpm-editor-btn-secondary qpm-editor-hidden" type="button">Hent</button>
        <button id="qpm-editor-save-btn" class="qpm-editor-btn" type="button">Gem alle ændringer</button>
        <button id="qpm-editor-logout-btn" class="qpm-editor-btn qpm-editor-btn-secondary" type="button">Log ud</button>
      </div>
      <p id="qpm-editor-save-hint" class="qpm-editor-note">Ingen ændringer gennemføres, før du klikker "Gem alle ændringer".</p>
      <p id="qpm-editor-save-status" class="qpm-editor-save-status"></p>
    </section>

    <div id="qpm-editor-status" class="qpm-editor-status"></div>
  `;
}

ensureEditorMarkup();

function getDefaultApiBaseFromScriptUrl() {
  const scriptUrl = import.meta.url || "";

  if (scriptUrl.includes("/assets/")) {
    return scriptUrl.replace(/\/assets\/[^/]+$/, "/backend/api");
  }

  if (scriptUrl.includes("/entries/scripts/")) {
    return scriptUrl.replace(/\/entries\/scripts\/[^/]+$/, "/backend/api");
  }

  try {
    return new URL("/backend/api", scriptUrl).toString();
  } catch {
    return "/backend/api";
  }
}

const urlParams = new URLSearchParams(window.location.search);
const apiBaseOverride = urlParams.get("apiBase");
const apiBase = (
  apiBaseOverride ||
  root.dataset.contentApiBaseUrl ||
  getDefaultApiBaseFromScriptUrl()
).replace(/\/+$/, "");
const defaultDomain = root.dataset.domain || "";
const baseConfiguredTopicDomains = parseConfiguredTopicDomains();
let configuredTopicDomains = [...baseConfiguredTopicDomains];
const filtersEnabled = root.dataset.filtersEnabled !== "false";

const loginSection = document.getElementById("qpm-editor-login");
const appSection = document.getElementById("qpm-editor-app");
const statusEl = document.getElementById("qpm-editor-status");
const apiBaseEl = document.getElementById("qpm-editor-api-base");
const apiBaseLabelEl = document.getElementById("qpm-editor-api-base-label");

const userInput = document.getElementById("qpm-editor-user");
const passwordInput = document.getElementById("qpm-editor-password");
const typeInput = document.getElementById("qpm-editor-type");
const domainInput = document.getElementById("qpm-editor-domain");
const jsonInput = document.getElementById("qpm-editor-json");
const sortModeTextEl = document.getElementById("qpm-editor-sort-mode-text");
const extraToolsSummaryEl = document.getElementById("qpm-editor-extra-tools-summary");
const topicTools = document.getElementById("qpm-editor-topic-tools");
const topicTreeInput = document.getElementById("qpm-editor-topic-tree");
const treeSearchInput = document.getElementById("qpm-editor-tree-search");
const sortModeInput = document.getElementById("qpm-editor-sort-mode");
const collapseAllBtn = document.getElementById("qpm-editor-collapse-all-btn");

const loginBtn = document.getElementById("qpm-editor-login-btn");
const loadBtn = document.getElementById("qpm-editor-load-btn");
const saveBtn = document.getElementById("qpm-editor-save-btn");
const revisionsWrap = document.getElementById("qpm-editor-revisions");
const revisionCurrentNoteEl = document.getElementById("qpm-editor-current-version-note");
const revisionListInput = document.getElementById("qpm-editor-revision-list");
const revisionRefreshBtn = document.getElementById("qpm-editor-revision-refresh-btn");
const revisionPreviewBtn = document.getElementById("qpm-editor-revision-preview-btn");
const revertBtn = document.getElementById("qpm-editor-revert-btn");
const revisionOnlyDiffInput = document.getElementById("qpm-editor-revision-only-diff");
const revisionOnlyDiffTextEl = document.getElementById("qpm-editor-revision-only-diff-text");
const revisionOnlyDiffLabel = revisionOnlyDiffInput?.closest("label") || null;
const revisionStatusEl = document.getElementById("qpm-editor-revision-status");
const revisionPreviewJson = document.getElementById("qpm-editor-revision-preview-json");
const revisionDiffEl = document.getElementById("qpm-editor-revision-diff");
const toggleJsonBtn = document.getElementById("qpm-editor-toggle-json-btn");
const jsonActionsWrap = document.getElementById("qpm-editor-json-actions");
const saveJsonBtn = document.getElementById("qpm-editor-save-json-btn");
const logoutBtn = document.getElementById("qpm-editor-logout-btn");

let csrfToken = "";
let selectedTopicItemId = "";
let selectedTopicCategoryId = "";
let treeSearchText = "";
let sortModeEnabled = false;
let draggedTopicItemId = "";
let draggedCategoryId = "";
const collapsedTopicIds = new Set();
const collapsedCategoryIds = new Set();
let pendingCategoryInlineStatus = null;
let pendingItemInlineStatus = null;
const isLocalUi = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const AUTO_LOGOUT_HIDDEN_MS = 60 * 60 * 1000;
let isEditorAuthenticated = false;
let hiddenSinceTs = null;
let hiddenLogoutTimerId = 0;
let unloadLogoutSent = false;
let editorCapabilities = { canEditFilters: filtersEnabled, allowedDomains: [] };
const editorLanguage = String(root?.dataset?.language || "dk").toLowerCase() === "en" ? "en" : "dk";
function t(key) {
  const msg = messages?.[`editor_${key}`];
  if (!msg || typeof msg !== "object") return key;
  return msg[editorLanguage] || msg.dk || msg.en || key;
}
function getTypeLabel(type) {
  return type === "filters" ? t("typeFilters") : t("typeTopics");
}

function getLocalizedText(translations, fallback = "") {
  const preferredLang = editorLanguage === "en" ? "en" : "dk";
  const secondaryLang = preferredLang === "en" ? "dk" : "en";
  const preferred = translations?.[preferredLang];
  const secondary = translations?.[secondaryLang];
  return preferred || secondary || fallback;
}
const editorHelpTextDelay = { show: 500, hide: 100 };
let editorTooltipEl = null;
let activeTooltipTrigger = null;
let showTooltipTimerId = 0;
let hideTooltipTimerId = 0;
let revisionDiffRowsCache = [];
let revisionSelectedPreviewDate = "";
let revisionCurrentPreviewDate = "";
let revisionCurrentRestoredFromDate = "";
let lastSaveUsedJsonButton = false;
const editorHelpTextKeyMap = {
  "category.id": "helpCategoryId",
  "category.translations.dk": "helpCategoryTranslationsDk",
  "category.translations.en": "helpCategoryTranslationsEn",
  "category.tooltip.dk": "helpCategoryTooltipDk",
  "category.tooltip.en": "helpCategoryTooltipEn",
  "category.hiddenByDefault": "helpCategoryHiddenByDefault",
  "item.id": "helpItemId",
  "item.lockIdOnSort": "helpItemLockIdOnSort",
  "item.hiddenByDefault": "helpItemHiddenByDefault",
  "item.buttons": "helpItemButtons",
  "item.ordering.alphabetical": "helpItemOrderingAlphabetical",
  "item.ordering.fixed": "helpItemOrderingFixed",
  "item.translations.dk": "helpItemTranslationsDk",
  "item.translations.en": "helpItemTranslationsEn",
  "item.searchStrings.narrow": "helpItemSearchStringsNarrow",
  "item.searchStrings.normal": "helpItemSearchStringsNormal",
  "item.searchStrings.broad": "helpItemSearchStringsBroad",
  "item.searchStringComment.dk": "helpItemSearchStringCommentDk",
  "item.searchStringComment.en": "helpItemSearchStringCommentEn",
  "item.tooltip.dk": "helpItemTooltipDk",
  "item.tooltip.en": "helpItemTooltipEn",
};

function updateJsonToggleButtonLabel() {
  if (!(toggleJsonBtn instanceof HTMLElement) || !(jsonInput instanceof HTMLElement)) return;
  toggleJsonBtn.textContent = jsonInput.classList.contains("qpm-editor-hidden") ? t("editJson") : t("hideJson");
}

function applyEditorLanguageTexts() {
  if (loginBtn instanceof HTMLElement) loginBtn.textContent = t("login");
  if (logoutBtn instanceof HTMLElement) logoutBtn.textContent = t("logout");
  if (saveBtn instanceof HTMLElement) saveBtn.textContent = t("saveAll");
  if (saveJsonBtn instanceof HTMLElement) saveJsonBtn.textContent = t("save");
  if (loadBtn instanceof HTMLElement) loadBtn.textContent = t("load");
  if (userInput instanceof HTMLInputElement) userInput.placeholder = t("usernamePlaceholder");
  if (passwordInput instanceof HTMLInputElement) passwordInput.placeholder = t("passwordPlaceholder");
  if (apiBaseLabelEl instanceof HTMLElement) apiBaseLabelEl.textContent = t("activeApiLabel");
  if (extraToolsSummaryEl instanceof HTMLElement) extraToolsSummaryEl.textContent = t("otherFunctions");
  if (sortModeTextEl instanceof HTMLElement) sortModeTextEl.textContent = t("sortMode");
  if (treeSearchInput instanceof HTMLInputElement) treeSearchInput.placeholder = t("searchPlaceholder");
  if (revisionRefreshBtn instanceof HTMLElement) revisionRefreshBtn.textContent = t("refreshHistory");
  if (revertBtn instanceof HTMLElement) revertBtn.textContent = t("revertVersion");
  if (revisionOnlyDiffTextEl instanceof HTMLElement) revisionOnlyDiffTextEl.textContent = t("onlyDiff");
  const saveHintEl = document.getElementById("qpm-editor-save-hint");
  if (saveHintEl instanceof HTMLElement) saveHintEl.textContent = t("saveHint");
  if (typeInput instanceof HTMLSelectElement) {
    const topicsOption = typeInput.querySelector('option[value="topics"]');
    if (topicsOption) topicsOption.textContent = getTypeLabel("topics");
    const filtersOption = typeInput.querySelector('option[value="filters"]');
    if (filtersOption) filtersOption.textContent = getTypeLabel("filters");
  }
  setRevisionPreviewButtonLabel(Boolean(revisionPreviewJson && !revisionPreviewJson.classList.contains("qpm-editor-hidden")));
  updateJsonToggleButtonLabel();
  updateCollapseToggleButtonLabel();
}

function ensureBoxiconsStylesheet() {
  if (document.querySelector('link[data-qpm-boxicons="1"]')) return;
  const existing = document.querySelector('link[href*="boxicons.min.css"]');
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css";
  link.dataset.qpmBoxicons = "1";
  document.head.appendChild(link);
}

if (apiBaseEl) {
  apiBaseEl.textContent = apiBase;
}
if (appSection && !document.getElementById("qpm-editor-save-hint")) {
  const hint = document.createElement("p");
  hint.id = "qpm-editor-save-hint";
  hint.className = "qpm-editor-note";
  hint.textContent = t("saveHint");
  const saveRow = saveBtn?.closest(".qpm-editor-row");
  if (saveRow?.parentElement) {
    saveRow.parentElement.insertBefore(hint, saveRow.nextSibling);
  } else {
    appSection.prepend(hint);
  }
}
if (appSection && !document.getElementById("qpm-editor-save-status")) {
  const saveStatus = document.createElement("p");
  saveStatus.id = "qpm-editor-save-status";
  saveStatus.className = "qpm-editor-save-status";
  const saveHint = document.getElementById("qpm-editor-save-hint");
  if (saveHint?.parentElement) {
    saveHint.parentElement.insertBefore(saveStatus, saveHint.nextSibling);
  } else {
    appSection.prepend(saveStatus);
  }
}
ensureBoxiconsStylesheet();
normalizeSortModeLayout();
applyEditorLanguageTexts();

function parseConfiguredTopicDomains() {
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const fromDataset = root.dataset.topicDomains || "";
  const list = [];
  if (fromDataset) {
    let parsedList = [];
    try {
      const parsed = JSON.parse(fromDataset);
      if (Array.isArray(parsed)) parsedList = parsed;
    } catch {
      parsedList = fromDataset.split(",");
    }
    parsedList.forEach((entry) => {
      const n = normalize(entry);
      if (n) list.push(n);
    });
  }
  const fallback = normalize(defaultDomain);
  if (fallback) list.push(fallback);
  return Array.from(new Set(list));
}

function normalizeDomainList(input) {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((d) => String(d || "").trim().toLowerCase())
        .filter((d) => /^[a-z0-9_-]+$/.test(d))
    )
  );
}

function syncDomainOptions() {
  if (!(domainInput instanceof HTMLSelectElement)) return;
  const previousValue = (domainInput.value || "").trim().toLowerCase();
  domainInput.innerHTML = "";
  configuredTopicDomains.forEach((domain) => {
    const opt = document.createElement("option");
    opt.value = domain;
    opt.textContent = domain;
    domainInput.appendChild(opt);
  });

  const nextValue = configuredTopicDomains.includes(previousValue)
    ? previousValue
    : configuredTopicDomains[0] || "";
  domainInput.value = nextValue;
  if (configuredTopicDomains.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = t("noDomains");
    domainInput.appendChild(opt);
    domainInput.value = "";
    domainInput.disabled = true;
    domainInput.classList.remove("qpm-editor-hidden");
    return;
  }
  if (configuredTopicDomains.length <= 1) {
    domainInput.classList.add("qpm-editor-hidden");
  } else {
    domainInput.classList.remove("qpm-editor-hidden");
  }
  domainInput.disabled = getSelectedType() === "filters";
}

function syncTypeOptionsVisibility() {
  if (!(typeInput instanceof HTMLSelectElement)) return;
  const filtersOption = typeInput.querySelector('option[value="filters"]');
  if (filtersOption && !editorCapabilities.canEditFilters) {
    filtersOption.remove();
  } else if (!filtersOption && editorCapabilities.canEditFilters && filtersEnabled) {
    const opt = document.createElement("option");
    opt.value = "filters";
    opt.textContent = getTypeLabel("filters");
    typeInput.appendChild(opt);
  }
  if (!editorCapabilities.canEditFilters && typeInput.value === "filters") {
    typeInput.value = "topics";
  }
  typeInput.classList.toggle("qpm-editor-hidden", typeInput.options.length <= 1);
}

function setActiveTopicLabel(topicValue) {
  void topicValue;
}

function isApiHostLocal(base) {
  try {
    const url = new URL(base, window.location.origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

const isRemoteApiBlockedInLocal = isLocalUi && !isApiHostLocal(apiBase);

function lockEditorForSafety(reason) {
  const controls = [
    loginBtn,
    loadBtn,
    saveBtn,
    logoutBtn,
    userInput,
    passwordInput,
    typeInput,
    domainInput,
    jsonInput,
    treeSearchInput,
    sortModeInput,
    collapseAllBtn,
  ];

  controls.forEach((el) => {
    if (!el) return;
    el.disabled = true;
  });
  setStatus(reason, true);
}

function getSelectedType() {
  return typeInput.value === "filters" ? "filters" : "topics";
}

function syncFormByType() {
  const type = getSelectedType();
  const isFilters = type === "filters";
  domainInput.disabled = isFilters;
  if (isFilters) {
    domainInput.classList.add("qpm-editor-hidden");
  } else if (configuredTopicDomains.length > 1) {
    domainInput.classList.remove("qpm-editor-hidden");
  } else {
    domainInput.classList.add("qpm-editor-hidden");
  }
  topicTools?.classList.remove("qpm-editor-hidden");
}

function setStatus(message, isError = false) {
  statusEl.textContent = message || "";
  statusEl.classList.remove("qpm-editor-status-ok", "qpm-editor-status-error");
  statusEl.classList.add(isError ? "qpm-editor-status-error" : "qpm-editor-status-ok");
}

function normalizeSortModeLayout() {
  if (!(sortModeInput instanceof HTMLInputElement)) return;
  sortModeInput.classList.add("qpm-editor-sort-mode-checkbox");

  const sortLabel = sortModeInput.closest("label");
  if (!(sortLabel instanceof HTMLLabelElement)) return;
  sortLabel.classList.add("qpm-editor-sort-mode-label");

  const collapseBtn = document.getElementById("qpm-editor-collapse-all-btn");
  if (collapseBtn?.parentElement === sortLabel.parentElement) {
    collapseBtn.insertAdjacentElement("afterend", sortLabel);
  }
}

function updateCollapseToggleButtonLabel() {
  if (!(collapseAllBtn instanceof HTMLElement)) return;
  const hasCollapsedNodes = collapsedCategoryIds.size > 0 || collapsedTopicIds.size > 0;
  collapseAllBtn.textContent = hasCollapsedNodes ? t("showAllTopics") : t("hideAllTopics");
}

function getEditorHelpText(key) {
  const translationKey = editorHelpTextKeyMap[key];
  if (!translationKey) return "";
  return t(translationKey);
}

function formatRevisionDate(value) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return String(value || "");
  const locale = editorLanguage === "en" ? "en-GB" : "da-DK";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatJsonForDiff(value) {
  try {
    const parsed = JSON.parse(String(value || ""));
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value || "");
  }
}

function buildRevisionDiffRows(currentText, selectedText) {
  const leftLines = String(currentText || "").split("\n");
  const rightLines = String(selectedText || "").split("\n");
  const rows = [];
  const lookAhead = 30;
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;

  const pushRow = (type, leftText, rightText, leftLineNo, rightLineNo) => {
    rows.push({
      type,
      leftText: leftText == null ? "" : leftText,
      rightText: rightText == null ? "" : rightText,
      leftLineNo: leftLineNo ?? "",
      rightLineNo: rightLineNo ?? "",
    });
  };

  while (i < leftLines.length || j < rightLines.length) {
    const leftLine = i < leftLines.length ? leftLines[i] : null;
    const rightLine = j < rightLines.length ? rightLines[j] : null;

    if (leftLine !== null && rightLine !== null && leftLine === rightLine) {
      pushRow("same", leftLine, rightLine, leftNo, rightNo);
      i += 1;
      j += 1;
      leftNo += 1;
      rightNo += 1;
      continue;
    }

    let rightMatchOffset = -1;
    let leftMatchOffset = -1;
    if (leftLine !== null) {
      for (let k = 1; k <= lookAhead; k += 1) {
        if (j + k >= rightLines.length) break;
        if (rightLines[j + k] === leftLine) {
          rightMatchOffset = k;
          break;
        }
      }
    }
    if (rightLine !== null) {
      for (let k = 1; k <= lookAhead; k += 1) {
        if (i + k >= leftLines.length) break;
        if (leftLines[i + k] === rightLine) {
          leftMatchOffset = k;
          break;
        }
      }
    }

    if (rightMatchOffset > 0 && (leftMatchOffset < 0 || rightMatchOffset <= leftMatchOffset)) {
      for (let k = 0; k < rightMatchOffset; k += 1) {
        pushRow("added", "", rightLines[j + k], "", rightNo);
        rightNo += 1;
      }
      j += rightMatchOffset;
      continue;
    }

    if (leftMatchOffset > 0) {
      for (let k = 0; k < leftMatchOffset; k += 1) {
        pushRow("removed", leftLines[i + k], "", leftNo, "");
        leftNo += 1;
      }
      i += leftMatchOffset;
      continue;
    }

    if (leftLine !== null && rightLine !== null) {
      pushRow("changed", leftLine, rightLine, leftNo, rightNo);
      i += 1;
      j += 1;
      leftNo += 1;
      rightNo += 1;
      continue;
    }

    if (leftLine !== null) {
      pushRow("removed", leftLine, "", leftNo, "");
      i += 1;
      leftNo += 1;
      continue;
    }

    pushRow("added", "", rightLine, "", rightNo);
    j += 1;
    rightNo += 1;
  }

  return rows;
}

function renderRevisionDiffRows(rows) {
  if (!(revisionDiffEl instanceof HTMLElement)) return;
  const onlyChanges = Boolean(revisionOnlyDiffInput?.checked);
  const visibleRows = onlyChanges ? rows.filter((row) => row.type !== "same") : rows;
  const hasChanges = rows.some((row) => row.type !== "same");
  const currentLabelBase = t("currentVersionLabel");
  const currentLabel = revisionCurrentPreviewDate
    ? `${currentLabelBase} · ${formatRevisionDate(revisionCurrentPreviewDate)}`
    : currentLabelBase;
  const selectedLabelBase = t("selectedVersionLabel");
  const selectedLabel = revisionSelectedPreviewDate
    ? `${selectedLabelBase} · ${formatRevisionDate(revisionSelectedPreviewDate)}`
    : selectedLabelBase;
  const noDiffLabel = t("noDifferencesFound");
  const noVisibleRowsLabel = t("allDifferencesHiddenByFilter");

  let html = `
    <div class="qpm-editor-revision-diff-head">
      <div class="qpm-editor-revision-diff-col-head">${currentLabel}</div>
      <div class="qpm-editor-revision-diff-col-head">${selectedLabel}</div>
    </div>
    <div class="qpm-editor-revision-diff-body">
  `;

  visibleRows.forEach((row) => {
    html += `
      <div class="qpm-editor-revision-diff-row is-${row.type}">
        <div class="qpm-editor-revision-diff-cell">
          <span class="qpm-editor-revision-diff-ln">${row.leftLineNo}</span>
          <pre class="qpm-editor-revision-diff-text">${escapeHtml(row.leftText)}</pre>
        </div>
        <div class="qpm-editor-revision-diff-cell">
          <span class="qpm-editor-revision-diff-ln">${row.rightLineNo}</span>
          <pre class="qpm-editor-revision-diff-text">${escapeHtml(row.rightText)}</pre>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  if (!hasChanges) {
    html += `<p class="qpm-editor-note">${noDiffLabel}</p>`;
  } else if (visibleRows.length === 0) {
    html += `<p class="qpm-editor-note">${noVisibleRowsLabel}</p>`;
  }
  revisionDiffEl.innerHTML = html;
  revisionDiffEl.classList.remove("qpm-editor-hidden");
}

function renderRevisionDiff(currentJsonText, selectedJsonText) {
  revisionDiffRowsCache = buildRevisionDiffRows(currentJsonText, selectedJsonText);
  renderRevisionDiffRows(revisionDiffRowsCache);
}

function createInfoIcon(helpText) {
  if (!helpText) return null;
  const icon = document.createElement("button");
  icon.type = "button";
  icon.className = "bx bx-info-circle";
  icon.setAttribute("aria-label", t("infoAriaLabel"));
  icon.dataset.helpText = helpText;
  wireTooltipIcon(icon);
  return icon;
}

function ensureEditorTooltipEl() {
  if (editorTooltipEl) return editorTooltipEl;
  const tooltip = document.createElement("div");
  tooltip.className = "v-popper--theme-tooltip qpm-editor-v-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.style.position = "fixed";
  tooltip.style.zIndex = "9999";
  tooltip.style.display = "none";

  const inner = document.createElement("div");
  inner.className = "v-popper__inner";
  tooltip.appendChild(inner);

  document.body.appendChild(tooltip);
  editorTooltipEl = tooltip;
  return tooltip;
}

function clearTooltipTimers() {
  if (showTooltipTimerId) {
    window.clearTimeout(showTooltipTimerId);
    showTooltipTimerId = 0;
  }
  if (hideTooltipTimerId) {
    window.clearTimeout(hideTooltipTimerId);
    hideTooltipTimerId = 0;
  }
}

function hideEditorTooltip() {
  clearTooltipTimers();
  if (!editorTooltipEl) return;
  editorTooltipEl.style.display = "none";
  activeTooltipTrigger = null;
}

function positionEditorTooltip(triggerEl) {
  if (!editorTooltipEl || !(triggerEl instanceof HTMLElement)) return;
  const rect = triggerEl.getBoundingClientRect();
  const tooltipRect = editorTooltipEl.getBoundingClientRect();
  const margin = 8;
  let top = rect.bottom + margin;
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

  if (left < margin) left = margin;
  const maxLeft = window.innerWidth - tooltipRect.width - margin;
  if (left > maxLeft) left = Math.max(margin, maxLeft);

  if (top + tooltipRect.height > window.innerHeight - margin) {
    top = Math.max(margin, rect.top - tooltipRect.height - margin);
  }

  editorTooltipEl.style.top = `${Math.round(top)}px`;
  editorTooltipEl.style.left = `${Math.round(left)}px`;
}

function showEditorTooltip(triggerEl, content) {
  if (!(triggerEl instanceof HTMLElement) || !content) return;
  const tooltip = ensureEditorTooltipEl();
  const inner = tooltip.querySelector(".v-popper__inner");
  if (!(inner instanceof HTMLElement)) return;
  inner.textContent = content;
  tooltip.style.display = "block";
  activeTooltipTrigger = triggerEl;
  positionEditorTooltip(triggerEl);
}

function scheduleShowEditorTooltip(triggerEl) {
  const content = triggerEl?.dataset?.helpText || "";
  if (!content) return;
  clearTooltipTimers();
  showTooltipTimerId = window.setTimeout(() => {
    showEditorTooltip(triggerEl, content);
  }, editorHelpTextDelay.show);
}

function scheduleHideEditorTooltip() {
  clearTooltipTimers();
  hideTooltipTimerId = window.setTimeout(() => {
    hideEditorTooltip();
  }, editorHelpTextDelay.hide);
}

function wireTooltipIcon(icon) {
  if (!(icon instanceof HTMLElement)) return;
  icon.addEventListener("mouseenter", () => scheduleShowEditorTooltip(icon));
  icon.addEventListener("focusin", () => scheduleShowEditorTooltip(icon));
  icon.addEventListener("mouseleave", () => {
    if (activeTooltipTrigger === icon) scheduleHideEditorTooltip();
    else clearTooltipTimers();
  });
  icon.addEventListener("focusout", () => {
    if (activeTooltipTrigger === icon) scheduleHideEditorTooltip();
    else clearTooltipTimers();
  });
  icon.addEventListener("click", (event) => {
    event.preventDefault();
    const content = icon.dataset.helpText || "";
    if (!content) return;
    if (activeTooltipTrigger === icon && editorTooltipEl?.style.display === "block") {
      hideEditorTooltip();
      return;
    }
    clearTooltipTimers();
    showEditorTooltip(icon, content);
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (editorTooltipEl?.contains(target)) return;
  if (target instanceof HTMLElement && target.classList.contains("bx-info-circle")) return;
  hideEditorTooltip();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideEditorTooltip();
  }
});

window.addEventListener("resize", () => {
  if (editorTooltipEl?.style.display === "block" && activeTooltipTrigger) {
    positionEditorTooltip(activeTooltipTrigger);
  }
});

window.addEventListener("scroll", () => {
  if (editorTooltipEl?.style.display === "block" && activeTooltipTrigger) {
    positionEditorTooltip(activeTooltipTrigger);
  }
}, true);

function setSaveStatus(message, isError = false) {
  const el = document.getElementById("qpm-editor-save-status");
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message || "";
  el.classList.remove("qpm-editor-save-status-ok", "qpm-editor-save-status-error");
  if (!message) return;
  el.classList.add(isError ? "qpm-editor-save-status-error" : "qpm-editor-save-status-ok");
}

function setRevisionStatus(message, isError = false) {
  if (!(revisionStatusEl instanceof HTMLElement)) return;
  revisionStatusEl.textContent = message || "";
  revisionStatusEl.classList.remove("qpm-editor-status-ok", "qpm-editor-status-error", "qpm-editor-hidden");
  if (!message) {
    revisionStatusEl.classList.add("qpm-editor-hidden");
    return;
  }
  revisionStatusEl.classList.add(isError ? "qpm-editor-status-error" : "qpm-editor-status-ok");
}

function applyCapabilities(capabilities) {
  const normalized = capabilities && typeof capabilities === "object" ? capabilities : {};
  const allowedDomains = normalizeDomainList(normalized.allowedDomains || []);
  editorCapabilities = {
    canEditFilters: filtersEnabled && normalized.canEditFilters !== false,
    allowedDomains,
  };

  if (allowedDomains.length > 0) {
    configuredTopicDomains =
      baseConfiguredTopicDomains.length > 0
        ? baseConfiguredTopicDomains.filter((d) => allowedDomains.includes(d))
        : allowedDomains;
  } else {
    configuredTopicDomains = [...baseConfiguredTopicDomains];
  }

  syncTypeOptionsVisibility();
  syncDomainOptions();
}

async function fetchDomainsForEditor() {
  const data = await requestJson(`${apiBase}/EditorContent.php?action=domains&type=domains`);
  return normalizeDomainList(data?.domains || []);
}

async function refreshDomainAccess() {
  if (!isEditorAuthenticated) return;
  try {
    const serverDomains = await fetchDomainsForEditor();
    if (serverDomains.length > 0) {
      configuredTopicDomains =
        baseConfiguredTopicDomains.length > 0
          ? baseConfiguredTopicDomains.filter((d) => serverDomains.includes(d))
          : serverDomains;
      if (editorCapabilities.allowedDomains.length > 0) {
        configuredTopicDomains = configuredTopicDomains.filter((d) =>
          editorCapabilities.allowedDomains.includes(d)
        );
      }
    } else if (editorCapabilities.allowedDomains.length > 0) {
      configuredTopicDomains = [...editorCapabilities.allowedDomains];
    }
  } catch {
    if (editorCapabilities.allowedDomains.length > 0) {
      configuredTopicDomains = [...editorCapabilities.allowedDomains];
    }
  }
  syncDomainOptions();
}

function getRevisionContext() {
  const type = getSelectedType();
  const domain = type === "topics" ? (domainInput?.value || "").trim().toLowerCase() : "";
  return { type, domain };
}

function refreshRevisionNotes() {
  if (revisionCurrentNoteEl instanceof HTMLElement) {
    const currentLabel = t("currentVersionLabel");
    const restoredSuffix = revisionCurrentRestoredFromDate
      ? ` (${t("restoredFromLabel")} ${formatRevisionDate(revisionCurrentRestoredFromDate)})`
      : "";
    revisionCurrentNoteEl.textContent = revisionCurrentPreviewDate
      ? `${currentLabel}: ${formatRevisionDate(revisionCurrentPreviewDate)}${restoredSuffix}`
      : `${currentLabel}: -`;
  }
}

function syncRevisionActionButtonsVisibility() {
  const hasHistoricalSelection =
    revisionListInput instanceof HTMLSelectElement && String(revisionListInput.value || "").trim() !== "";
  if (revisionPreviewBtn instanceof HTMLElement) {
    revisionPreviewBtn.classList.toggle("qpm-editor-hidden", !hasHistoricalSelection);
  }
  if (revertBtn instanceof HTMLElement) {
    revertBtn.classList.toggle("qpm-editor-hidden", !hasHistoricalSelection);
  }
}

function setRevisionPreviewButtonLabel(isOpen) {
  if (!(revisionPreviewBtn instanceof HTMLElement)) return;
  revisionPreviewBtn.textContent = isOpen ? t("hideVersion") : t("previewVersion");
}

function setRevisionControlsVisible(visible) {
  if (revisionsWrap instanceof HTMLElement) {
    revisionsWrap.classList.toggle("qpm-editor-hidden", !visible);
  }
  if (!visible && revisionListInput instanceof HTMLSelectElement) {
    revisionListInput.value = "";
  }
  if (!visible) {
    setRevisionPreviewButtonLabel(false);
  }
  syncRevisionActionButtonsVisibility();
  if (!visible) {
    setRevisionStatus("");
    if (revisionPreviewJson instanceof HTMLTextAreaElement) {
      revisionPreviewJson.classList.add("qpm-editor-hidden");
      revisionPreviewJson.value = "";
    }
    if (revisionDiffEl instanceof HTMLElement) {
      revisionDiffEl.classList.add("qpm-editor-hidden");
      revisionDiffEl.innerHTML = "";
    }
    revisionSelectedPreviewDate = "";
    revisionCurrentPreviewDate = "";
    revisionCurrentRestoredFromDate = "";
    if (revisionOnlyDiffInput instanceof HTMLInputElement) {
      revisionOnlyDiffInput.checked = false;
    }
    if (revisionOnlyDiffLabel instanceof HTMLElement) {
      revisionOnlyDiffLabel.classList.add("qpm-editor-hidden");
    }
    revisionDiffRowsCache = [];
  }
}

async function refreshRevisionList() {
  if (!(revisionListInput instanceof HTMLSelectElement)) return;
  setRevisionPreviewButtonLabel(false);
  if (revisionPreviewJson instanceof HTMLTextAreaElement) {
    revisionPreviewJson.classList.add("qpm-editor-hidden");
    revisionPreviewJson.value = "";
  }
  if (revisionDiffEl instanceof HTMLElement) {
    revisionDiffEl.classList.add("qpm-editor-hidden");
    revisionDiffEl.innerHTML = "";
  }
  revisionSelectedPreviewDate = "";
  if (revisionOnlyDiffInput instanceof HTMLInputElement) {
    revisionOnlyDiffInput.checked = false;
  }
  if (revisionOnlyDiffLabel instanceof HTMLElement) {
    revisionOnlyDiffLabel.classList.add("qpm-editor-hidden");
  }
  revisionDiffRowsCache = [];
  syncRevisionActionButtonsVisibility();
  const { type, domain } = getRevisionContext();
  if (!isEditorAuthenticated || (type === "topics" && !domain)) {
    revisionListInput.innerHTML = "";
    setRevisionControlsVisible(false);
    return;
  }

  setRevisionControlsVisible(true);
  revisionListInput.innerHTML = "";
  refreshRevisionNotes();
  try {
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = t("selectPreviousVersion");
    revisionListInput.appendChild(placeholderOpt);

    const params = new URLSearchParams({ action: "revisions", type });
    if (type === "topics") {
      params.set("domain", domain);
    }
    const data = await requestJson(`${apiBase}/EditorContent.php?${params.toString()}`);
    const revisions = Array.isArray(data?.revisions) ? data.revisions : [];
    if (revisions.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = t("noHistoryFound");
      revisionListInput.appendChild(opt);
      revisionListInput.value = "";
      syncRevisionActionButtonsVisibility();
      setRevisionStatus("");
      return;
    }
    revisions.forEach((rev) => {
      const id = String(rev?.revisionId || "").trim();
      if (!id) return;
      const createdAt = formatRevisionDate(rev?.createdAt || "");
      const user = String(rev?.user || "");
      const restoredFromCreatedAt = String(rev?.restoredFromCreatedAt || "").trim();
      const restoredSuffix = restoredFromCreatedAt
        ? ` (${t("restoredFromLabel")} ${formatRevisionDate(restoredFromCreatedAt)})`
        : "";
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = user
        ? `${createdAt} · ${t("savedByLabel")} ${user}${restoredSuffix}`
        : editorLanguage === "en"
          ? `${createdAt}${restoredSuffix}`
          : `${createdAt}${restoredSuffix}`;
      revisionListInput.appendChild(opt);
    });
    revisionListInput.value = "";
    syncRevisionActionButtonsVisibility();
    setRevisionStatus("");
  } catch (error) {
    setRevisionStatus(error?.message || t("couldNotFetchHistory"), true);
  }
}

async function revertSelectedRevision() {
  if (!(revisionListInput instanceof HTMLSelectElement)) return;
  const revisionId = (revisionListInput.value || "").trim();
  if (!revisionId) {
    setRevisionStatus(t("selectRevisionFirst"), true);
    return;
  }
  const ok = window.confirm(t("confirmRestoreSelectedVersion"));
  if (!ok) return;

  const { type, domain } = getRevisionContext();
  try {
    const result = await requestJson(`${apiBase}/EditorContent.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({
        action: "revert",
        type,
        domain: type === "topics" ? domain : undefined,
        revisionId,
        csrfToken,
      }),
    });
    if (result?.unchanged) {
      setRevisionStatus(t("selectedVersionMatchesCurrent"));
    } else {
      setRevisionStatus(`${t("versionRestored")} (${result?.savedAt || t("nowLabel")}).`);
    }
    await loadContent();
    await refreshRevisionList();
  } catch (error) {
    setRevisionStatus(error?.message || t("restoreFailed"), true);
  }
}

async function previewSelectedRevision() {
  if (!(revisionListInput instanceof HTMLSelectElement)) return;
  if (!(revisionDiffEl instanceof HTMLElement)) return;
  if (!revisionDiffEl.classList.contains("qpm-editor-hidden")) {
    revisionDiffEl.classList.add("qpm-editor-hidden");
    revisionDiffEl.innerHTML = "";
    revisionSelectedPreviewDate = "";
    if (revisionOnlyDiffInput instanceof HTMLInputElement) {
      revisionOnlyDiffInput.checked = false;
    }
    if (revisionOnlyDiffLabel instanceof HTMLElement) {
      revisionOnlyDiffLabel.classList.add("qpm-editor-hidden");
    }
    setRevisionPreviewButtonLabel(false);
    setRevisionStatus("");
    return;
  }
  const revisionId = (revisionListInput.value || "").trim();
  if (!revisionId) {
    setRevisionStatus(t("selectRevisionFirst"), true);
    return;
  }
  const { type, domain } = getRevisionContext();
  try {
    const params = new URLSearchParams({ action: "revision", type, revisionId });
    if (type === "topics") {
      params.set("domain", domain);
    }
    const data = await requestJson(`${apiBase}/EditorContent.php?${params.toString()}`);
    const revision = data?.revision?.data || {};
    revisionSelectedPreviewDate = String(data?.revision?.meta?.createdAt || "");
    const selectedText = formatJsonForDiff(JSON.stringify(revision || {}));
    const currentText = formatJsonForDiff(jsonInput?.value || "");
    renderRevisionDiff(currentText, selectedText);
    if (revisionOnlyDiffLabel instanceof HTMLElement) {
      revisionOnlyDiffLabel.classList.remove("qpm-editor-hidden");
    }
    setRevisionPreviewButtonLabel(true);
    setRevisionStatus(t("diffPreviewLoaded"));
  } catch (error) {
    setRevisionStatus(error?.message || t("couldNotLoadPreview"), true);
  }
}

function setInlineEditorStatus(container, statusKey, message, isError = false) {
  if (!(container instanceof HTMLElement)) return;
  const el = container.querySelector(`[data-inline-status="${statusKey}"]`);
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message || "";
  el.classList.remove("qpm-editor-inline-status-ok", "qpm-editor-inline-status-error");
  el.classList.add(isError ? "qpm-editor-inline-status-error" : "qpm-editor-inline-status-ok");
}

function createInlineActions(applyBtn, deleteBtn, statusKey) {
  const actionsRow = document.createElement("div");
  actionsRow.className = "qpm-editor-inline-actions";
  actionsRow.append(applyBtn, deleteBtn);

  const inlineStatus = document.createElement("p");
  inlineStatus.className = "qpm-editor-inline-status";
  inlineStatus.dataset.inlineStatus = statusKey;
  inlineStatus.textContent = "";

  return { actionsRow, inlineStatus };
}

function setAuthenticated(authenticated) {
  loginSection.classList.toggle("qpm-editor-hidden", authenticated);
  appSection.classList.toggle("qpm-editor-hidden", !authenticated);
  isEditorAuthenticated = Boolean(authenticated);
  if (!isEditorAuthenticated) {
    hiddenSinceTs = null;
  }
  scheduleHiddenAutoLogout();
}

function clearHiddenLogoutTimer() {
  if (hiddenLogoutTimerId) {
    window.clearTimeout(hiddenLogoutTimerId);
    hiddenLogoutTimerId = 0;
  }
}

function scheduleHiddenAutoLogout() {
  clearHiddenLogoutTimer();
  if (!isEditorAuthenticated) return;

  if (!document.hidden) {
    hiddenSinceTs = null;
    return;
  }

  if (!hiddenSinceTs) hiddenSinceTs = Date.now();
  const elapsed = Date.now() - hiddenSinceTs;
  const remaining = AUTO_LOGOUT_HIDDEN_MS - elapsed;
  if (remaining <= 0) {
    forceAutoLogoutAfterHiddenTimeout();
    return;
  }

  hiddenLogoutTimerId = window.setTimeout(() => {
    forceAutoLogoutAfterHiddenTimeout();
  }, remaining);
}

async function forceAutoLogoutAfterHiddenTimeout() {
  clearHiddenLogoutTimer();
  if (!isEditorAuthenticated || !document.hidden) {
    scheduleHiddenAutoLogout();
    return;
  }
  try {
    await requestJson(`${apiBase}/EditorLogout.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ csrfToken }),
    });
  } catch {
    // ignore network errors during auto logout attempts
  }
  csrfToken = "";
  setAuthenticated(false);
  setStatus(t("autoLoggedOutAfterHidden"));
}

function sendUnloadLogout() {
  if (!isEditorAuthenticated || !csrfToken || unloadLogoutSent) return;
  unloadLogoutSent = true;
  try {
    void fetch(`${apiBase}/EditorLogout.php`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ csrfToken }),
    });
  } catch {
    // ignore unload-time failures
  }
}

async function requestJson(url, options = {}) {
  if (isRemoteApiBlockedInLocal) {
    throw new Error(t("securityBlockLocalApiOnly"));
  }
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const looksLikePhpSource = typeof text === "string" && text.includes("<?php");
    if (looksLikePhpSource) {
      throw new Error(t("apiReturnedPhpSource"));
    }
    throw new Error(t("invalidJsonResponse"));
  }

  if (!response.ok) {
    throw new Error(data.error || `${t("requestFailed")} (${response.status})`);
  }

  return data;
}

async function checkSession() {
  try {
    const data = await requestJson(`${apiBase}/EditorSession.php`);
    if (data.authenticated) {
      csrfToken = data.csrfToken || "";
      applyCapabilities(data.capabilities || {});
      await refreshDomainAccess();
      setAuthenticated(true);
      setStatus(t("sessionActive"));
      await loadContent();
      await refreshRevisionList();
      return;
    }
  } catch {
    // ignore and show login
  }

  applyCapabilities({ canEditFilters: filtersEnabled, allowedDomains: [] });
  setAuthenticated(false);
  setStatus(t("loginToContinue"));
}

async function login() {
  const user = userInput.value.trim();
  const password = passwordInput.value;
  if (!user || !password) {
    setStatus(t("enterUsernameAndPassword"), true);
    return;
  }

  try {
    const data = await requestJson(`${apiBase}/EditorLogin.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });
    csrfToken = data.csrfToken || "";
    applyCapabilities(data.capabilities || {});
    await refreshDomainAccess();
    unloadLogoutSent = false;
    setAuthenticated(true);
    setStatus(t("loginSuccessful"));
    await loadContent();
    await refreshRevisionList();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function logout() {
  clearHiddenLogoutTimer();
  try {
    await requestJson(`${apiBase}/EditorLogout.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      body: JSON.stringify({ csrfToken }),
    });
    csrfToken = "";
    applyCapabilities({ canEditFilters: filtersEnabled, allowedDomains: [] });
    setAuthenticated(false);
    setRevisionControlsVisible(false);
    setStatus(t("loggedOut"));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadContent() {
  lastSaveUsedJsonButton = false;
  const type = getSelectedType();
  const domain = domainInput.value.trim();
  if (type === "topics" && !domain) {
    setStatus(t("domainRequiredForTopics"), true);
    return;
  }

  try {
    const data = await fetchContentFromServer(type, domain);
    jsonInput.value = JSON.stringify(data.data || {}, null, 2);
    revisionCurrentPreviewDate = String(data?.currentModifiedAt || "");
    revisionCurrentRestoredFromDate = String(data?.currentRestoredFromCreatedAt || "");
    refreshRevisionNotes();
    collapseAllInTree(parseCurrentJson() || {});
    refreshTopicTree();
    setActiveTopicLabel(type === "topics" ? domain : getTypeLabel("filters"));
    setStatus(
      type === "topics"
        ? `${getTypeLabel("topics")} ${t("loadedForDomain")} "${domain}".`
        : `${getTypeLabel("filters")} ${t("loadedShort")}.`
    );
    await refreshRevisionList();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function fetchContentFromServer(type, domain) {
  const query = new URLSearchParams({ type });
  if (type === "topics" && domain) query.set("domain", domain);
  return requestJson(`${apiBase}/EditorContent.php?${query.toString()}`);
}

async function saveContent(source = "main") {
  setSaveStatus("");
  const type = getSelectedType();
  const domain = domainInput.value.trim();
  if (type === "topics" && !domain) {
    setStatus(t("domainRequiredForTopics"), true);
    setSaveStatus(t("domainRequiredForTopics"), true);
    return;
  }

  let parsed;
  try {
    parsed = jsonInput.value ? JSON.parse(jsonInput.value) : {};
  } catch {
    setStatus(t("invalidJson"), true);
    setSaveStatus(t("invalidJson"), true);
    return;
  }

  try {
    const saveResult = await requestJson(`${apiBase}/EditorContent.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({
        type,
        domain: type === "topics" ? (domain || undefined) : undefined,
        data: parsed,
        csrfToken,
      }),
    });
    if (saveResult?.unchanged) {
      setStatus(t("noChangesToSave"));
      setSaveStatus(
        source === "main" && lastSaveUsedJsonButton
          ? t("alreadySavedViaJsonButton")
          : t("noNewVersionCreatedUnchanged")
      );
      await refreshRevisionList();
      return;
    }

    // Verify persistence by immediately reloading from server source of truth.
    const serverData = await fetchContentFromServer(type, domain);
    jsonInput.value = JSON.stringify(serverData?.data || {}, null, 2);
    revisionCurrentPreviewDate = String(serverData?.currentModifiedAt || "");
    revisionCurrentRestoredFromDate = String(serverData?.currentRestoredFromCreatedAt || "");
    refreshRevisionNotes();
    refreshTopicTree();

    const saveStamp = saveResult?.savedAt ? ` (${saveResult.savedAt})` : "";
    setStatus(
      type === "topics"
        ? `${getTypeLabel("topics")} ${t("savedAndVerifiedForDomain")} "${domain}"${saveStamp}.`
        : `${getTypeLabel("filters")} ${t("savedAndVerified")}${saveStamp}.`
    );
    setSaveStatus(
      type === "topics"
        ? `${getTypeLabel("topics")} ${t("savedFor")} "${domain}"${saveStamp}.`
        : `${getTypeLabel("filters")} ${t("savedShort")}${saveStamp}.`
    );
    lastSaveUsedJsonButton = source === "json";
    await refreshRevisionList();
  } catch (error) {
    setStatus(error.message, true);
    setSaveStatus(error.message, true);
  }
}

function collapseAllInTree(data) {
  collapsedCategoryIds.clear();
  collapsedTopicIds.clear();
  if (!data || !Array.isArray(data.topics)) return;

  const collect = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item?.id) return;
      if (Array.isArray(item.children) && item.children.length > 0) {
        collapsedTopicIds.add(item.id);
        collect(item.children);
      }
    });
  };

  data.topics.forEach((topic) => {
    if (topic?.id) collapsedCategoryIds.add(topic.id);
    collect(topic?.groups || []);
  });
}

function mapFilterChoicesToTopicChildren(choices) {
  if (!Array.isArray(choices)) return [];
  return choices.map((choice) => {
    const { name: _name, groupname: _groupname, choices: _choices, ...rest } = choice || {};
    const nestedChildren = Array.isArray(choice?.children) ? choice.children : choice?.choices;
    return {
      ...rest,
      children: mapFilterChoicesToTopicChildren(nestedChildren),
    };
  });
}

function mapTopicChildrenToFilterChoices(children) {
  if (!Array.isArray(children)) return [];
  return children.map((child) => {
    const { name: _name, groupname: _groupname, children: _children, ...rest } = child || {};
    return {
      ...rest,
      choices: mapTopicChildrenToFilterChoices(child?.children),
    };
  });
}

function normalizePayloadForEditor(type, rawData) {
  if (type !== "filters") {
    const topics = Array.isArray(rawData?.topics) ? rawData.topics : [];
    return {
      ...(rawData || {}),
      topics: topics.map((topic) => {
        const { name: _name, groupname: _groupname, ...rest } = topic || {};
        return {
          ...rest,
          groups: mapFilterChoicesToTopicChildren(topic?.groups),
        };
      }),
    };
  }
  const filters = Array.isArray(rawData?.filters) ? rawData.filters : [];
  return {
    topics: filters.map((filterItem) => ({
      ...(() => {
        const { name: _name, groupname: _groupname, ...rest } = filterItem || {};
        return rest;
      })(),
      groups: mapFilterChoicesToTopicChildren(filterItem?.choices),
    })),
  };
}

function denormalizePayloadFromEditor(type, editorData, currentRawData) {
  if (type !== "filters") return editorData || {};
  const currentRaw = currentRawData && typeof currentRawData === "object" ? currentRawData : {};
  const topics = Array.isArray(editorData?.topics) ? editorData.topics : [];
  return {
    ...currentRaw,
    filters: topics.map((topicLike) => ({
      ...topicLike,
      choices: mapTopicChildrenToFilterChoices(topicLike?.groups),
    })),
  };
}

function parseCurrentJson() {
  try {
    const raw = jsonInput.value ? JSON.parse(jsonInput.value) : {};
    return normalizePayloadForEditor(getSelectedType(), raw);
  } catch {
    return null;
  }
}

function updateJson(data, refreshTree = true) {
  let currentRaw = {};
  try {
    currentRaw = jsonInput.value ? JSON.parse(jsonInput.value) : {};
  } catch {
    currentRaw = {};
  }
  const rawToStore = denormalizePayloadFromEditor(getSelectedType(), data, currentRaw);
  jsonInput.value = JSON.stringify(rawToStore, null, 2);
  if (refreshTree) refreshTopicTree();
}

function itemMatchesSearch(item, searchText) {
  if (!searchText) return true;
  const haystack = [
    item?.id,
    item?.translations?.dk,
    item?.translations?.en,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(searchText);
}

function hasMatchInTree(item, searchText) {
  if (!item) return false;
  if (itemMatchesSearch(item, searchText)) return true;
  if (!Array.isArray(item.children)) return false;
  return item.children.some((child) => hasMatchInTree(child, searchText));
}

function collectAllItemIds(items, out = []) {
  if (!Array.isArray(items)) return out;
  items.forEach((item) => {
    if (item?.id) out.push(item.id);
    if (Array.isArray(item?.children)) collectAllItemIds(item.children, out);
  });
  return out;
}

function idExistsInCategory(category, candidateId, excludeId = "") {
  const allIds = collectAllItemIds(category?.groups || []);
  return allIds.some((id) => id === candidateId && id !== excludeId);
}

function renumberCategoryIds(category) {
  if (!category || !Array.isArray(category.groups) || !category.id) return;

  const assign = (items, parentId) => {
    if (!Array.isArray(items)) return;
    items.forEach((item, index) => {
      const seg = String((index + 1) * 10).padStart(3, "0");
      const newId = `${parentId}${seg}`;
      item.id = newId;
      setItemOrdering(item, index + 1);
      assign(item.children, newId);
    });
  };

  assign(category.groups, category.id);
}

function updateChildIdsByPrefix(item, oldPrefix, newPrefix) {
  if (!item || !Array.isArray(item.children)) return;
  item.children.forEach((child) => {
    const prevId = child?.id || "";
    if (prevId.startsWith(oldPrefix)) {
      const nextId = `${newPrefix}${prevId.slice(oldPrefix.length)}`;
      child.id = nextId;
    }
    updateChildIdsByPrefix(child, prevId, child.id || prevId);
  });
}

function remapCollapsedIdsAfterCategoryRename(oldCategoryId, newCategoryId) {
  if (!oldCategoryId || !newCategoryId || oldCategoryId === newCategoryId) return;

  const nextCollapsedCategoryIds = new Set();
  collapsedCategoryIds.forEach((id) => {
    nextCollapsedCategoryIds.add(id === oldCategoryId ? newCategoryId : id);
  });
  collapsedCategoryIds.clear();
  nextCollapsedCategoryIds.forEach((id) => collapsedCategoryIds.add(id));

  remapCollapsedTopicIdsByPrefix(oldCategoryId, newCategoryId);
}

function remapCollapsedTopicIdsByPrefix(oldPrefix, newPrefix) {
  if (!oldPrefix || !newPrefix || oldPrefix === newPrefix) return;
  const nextCollapsedTopicIds = new Set();
  collapsedTopicIds.forEach((id) => {
    if (typeof id === "string" && id.startsWith(oldPrefix)) {
      nextCollapsedTopicIds.add(`${newPrefix}${id.slice(oldPrefix.length)}`);
      return;
    }
    nextCollapsedTopicIds.add(id);
  });
  collapsedTopicIds.clear();
  nextCollapsedTopicIds.forEach((id) => collapsedTopicIds.add(id));
}

function createCategoryInlineEditor(topic) {
  const wrapper = document.createElement("div");
  wrapper.className = "qpm-editor-inline-editor";
  wrapper.dataset.categoryId = topic?.id || "";

  const mkLabel = (text, helpKey = "") => {
    const p = document.createElement("p");
    p.className = "qpm-editor-field-label";
    p.textContent = text;
    const infoIcon = createInfoIcon(getEditorHelpText(helpKey));
    if (infoIcon) p.append(" ", infoIcon);
    return p;
  };
  const mkInput = (value = "") => {
    const input = document.createElement("input");
    input.className = "qpm-editor-input";
    input.type = "text";
    input.value = value;
    return input;
  };
  const mkTextarea = (value = "") => {
    const ta = document.createElement("textarea");
    ta.className = "qpm-editor-textarea";
    ta.value = value;
    return ta;
  };

  const idInput = mkInput(topic?.id || "");
  idInput.dataset.inlineField = "category.id";
  const dkInput = mkInput(topic?.translations?.dk || "");
  dkInput.dataset.inlineField = "category.translations.dk";
  const enInput = mkInput(topic?.translations?.en || "");
  enInput.dataset.inlineField = "category.translations.en";
  const tooltipDk = mkTextarea(topic?.tooltip?.dk || "");
  tooltipDk.dataset.inlineField = "category.tooltip.dk";
  const tooltipEn = mkTextarea(topic?.tooltip?.en || "");
  tooltipEn.dataset.inlineField = "category.tooltip.en";
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "checkbox";
  hiddenInput.dataset.inlineField = "category.hiddenByDefault";
  hiddenInput.checked = topic?.hiddenByDefault === true;
  const hiddenLabel = document.createElement("label");
  hiddenLabel.className = "qpm-editor-checkbox-label";
  hiddenLabel.style.width = "100%";
  hiddenLabel.append(hiddenInput, document.createTextNode(t("hideInFormByDefault")));
  const hiddenInfoIcon = createInfoIcon(getEditorHelpText("category.hiddenByDefault"));
  if (hiddenInfoIcon) hiddenLabel.append(" ", hiddenInfoIcon);

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "qpm-editor-btn qpm-editor-btn-secondary qpm-editor-tree-apply-category-inline";
  applyBtn.dataset.categoryId = topic?.id || "";
  applyBtn.textContent = t("saveMainCategory");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "qpm-editor-btn qpm-editor-btn-danger qpm-editor-tree-delete-category-inline";
  deleteBtn.dataset.categoryId = topic?.id || "";
  deleteBtn.textContent = t("deleteMainCategory");
  const { actionsRow, inlineStatus } = createInlineActions(applyBtn, deleteBtn, "category");

  const categoryPrimaryLang = editorLanguage === "en" ? "en" : "dk";
  const categorySecondaryLang = categoryPrimaryLang === "en" ? "dk" : "en";
  const categoryNamePrimaryLabel =
    categoryPrimaryLang === "en" ? t("categoryNameEnLabel") : t("categoryNameDkLabel");
  const categoryNameSecondaryLabel =
    categorySecondaryLang === "en" ? t("categoryNameEnLabel") : t("categoryNameDkLabel");
  const categoryNamePrimaryInput = categoryPrimaryLang === "en" ? enInput : dkInput;
  const categoryNameSecondaryInput = categorySecondaryLang === "en" ? enInput : dkInput;
  const categoryNamePrimaryKey =
    categoryPrimaryLang === "en" ? "category.translations.en" : "category.translations.dk";
  const categoryNameSecondaryKey =
    categorySecondaryLang === "en" ? "category.translations.en" : "category.translations.dk";

  const categoryTooltipPrimaryLabel =
    categoryPrimaryLang === "en" ? t("itemTooltipEnLabel") : t("itemTooltipDkLabel");
  const categoryTooltipSecondaryLabel =
    categorySecondaryLang === "en" ? t("itemTooltipEnLabel") : t("itemTooltipDkLabel");
  const categoryTooltipPrimaryInput = categoryPrimaryLang === "en" ? tooltipEn : tooltipDk;
  const categoryTooltipSecondaryInput = categorySecondaryLang === "en" ? tooltipEn : tooltipDk;
  const categoryTooltipPrimaryKey =
    categoryPrimaryLang === "en" ? "category.tooltip.en" : "category.tooltip.dk";
  const categoryTooltipSecondaryKey =
    categorySecondaryLang === "en" ? "category.tooltip.en" : "category.tooltip.dk";

  wrapper.append(
    mkLabel(t("categoryIdPrefixLabel"), "category.id"),
    idInput,
    mkLabel(categoryNamePrimaryLabel, categoryNamePrimaryKey),
    categoryNamePrimaryInput,
    mkLabel(categoryNameSecondaryLabel, categoryNameSecondaryKey),
    categoryNameSecondaryInput,
    mkLabel(categoryTooltipPrimaryLabel, categoryTooltipPrimaryKey),
    categoryTooltipPrimaryInput,
    mkLabel(categoryTooltipSecondaryLabel, categoryTooltipSecondaryKey),
    categoryTooltipSecondaryInput,
    hiddenLabel,
    actionsRow,
    inlineStatus
  );
  return wrapper;
}

function createInlineEditor(item, categoryId, currentPosition = null, maxPosition = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "qpm-editor-inline-editor";
  wrapper.dataset.id = item?.id || "";
  wrapper.dataset.categoryId = categoryId;

  const mkLabel = (text, helpKey = "") => {
    const p = document.createElement("p");
    p.className = "qpm-editor-field-label";
    p.textContent = text;
    const infoIcon = createInfoIcon(getEditorHelpText(helpKey));
    if (infoIcon) p.append(" ", infoIcon);
    return p;
  };
  const mkInput = (value = "") => {
    const input = document.createElement("input");
    input.className = "qpm-editor-input";
    input.type = "text";
    input.value = value;
    return input;
  };
  const mkTextarea = (value = "") => {
    const ta = document.createElement("textarea");
    ta.className = "qpm-editor-textarea";
    ta.value = value;
    return ta;
  };

  const dkInput = mkInput(item?.translations?.dk || "");
  const idInput = mkInput(item?.id || "");
  idInput.dataset.inlineField = "id";
  idInput.placeholder = t("topicIdPlaceholder");
  const lockIdInput = document.createElement("input");
  lockIdInput.type = "checkbox";
  lockIdInput.dataset.inlineField = "lockIdOnSort";
  lockIdInput.checked = item?.lockIdOnSort !== false;
  const lockIdLabel = document.createElement("label");
  lockIdLabel.className = "qpm-editor-checkbox-label";
  lockIdLabel.style.width = "100%";
  lockIdLabel.append(lockIdInput, document.createTextNode(t("lockIdOnSortLabel")));
  const lockIdInfoIcon = createInfoIcon(getEditorHelpText("item.lockIdOnSort"));
  if (lockIdInfoIcon) lockIdLabel.append(" ", lockIdInfoIcon);
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "checkbox";
  hiddenInput.dataset.inlineField = "hiddenByDefault";
  hiddenInput.checked = item?.hiddenByDefault === true;
  const hiddenLabel = document.createElement("label");
  hiddenLabel.className = "qpm-editor-checkbox-label";
  hiddenLabel.style.width = "100%";
  hiddenLabel.append(hiddenInput, document.createTextNode(t("hideInFormByDefault")));
  const hiddenInfoIcon = createInfoIcon(getEditorHelpText("item.hiddenByDefault"));
  if (hiddenInfoIcon) hiddenLabel.append(" ", hiddenInfoIcon);
  const buttonsInput = document.createElement("input");
  buttonsInput.type = "checkbox";
  buttonsInput.dataset.inlineField = "buttons";
  buttonsInput.checked = item?.buttons !== false;
  const buttonsLabel = document.createElement("label");
  buttonsLabel.className = "qpm-editor-checkbox-label";
  buttonsLabel.style.width = "100%";
  buttonsLabel.append(buttonsInput, document.createTextNode(t("showScopeButtonsLabel")));
  const buttonsInfoIcon = createInfoIcon(getEditorHelpText("item.buttons"));
  if (buttonsInfoIcon) buttonsLabel.append(" ", buttonsInfoIcon);
  const alphabeticalInput = document.createElement("input");
  alphabeticalInput.type = "checkbox";
  alphabeticalInput.dataset.inlineField = "ordering.alphabetical";
  alphabeticalInput.checked = item?.ordering?.dk === null || item?.ordering?.en === null;
  const alphabeticalLabel = document.createElement("label");
  alphabeticalLabel.className = "qpm-editor-checkbox-label";
  alphabeticalLabel.style.width = "100%";
  alphabeticalLabel.append(
    alphabeticalInput,
    document.createTextNode(t("showAlphabeticalOrderingLabel"))
  );
  const alphabeticalInfoIcon = createInfoIcon(getEditorHelpText("item.ordering.alphabetical"));
  if (alphabeticalInfoIcon) alphabeticalLabel.append(" ", alphabeticalInfoIcon);
  const orderingInput = document.createElement("select");
  orderingInput.className = "qpm-editor-input";
  orderingInput.dataset.inlineField = "ordering.fixed";
  const maxSelectable =
    Number.isInteger(Number(maxPosition)) && Number(maxPosition) > 0 ? Number(maxPosition) : 1;
  for (let i = 1; i <= maxSelectable; i += 1) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = String(i);
    orderingInput.appendChild(opt);
  }
  const fixedOrdering =
    Number.isInteger(Number(item?.ordering?.dk)) && Number(item?.ordering?.dk) > 0
      ? Number(item.ordering.dk)
      : Number.isInteger(Number(item?.ordering?.en)) && Number(item?.ordering?.en) > 0
        ? Number(item.ordering.en)
        : "";
  let selectedOrdering = fixedOrdering === "" ? null : fixedOrdering;
  if (!selectedOrdering || selectedOrdering > maxSelectable) {
    selectedOrdering =
      Number.isInteger(Number(currentPosition)) && Number(currentPosition) > 0
        ? Math.min(Number(currentPosition), maxSelectable)
        : 1;
  }
  orderingInput.value = String(selectedOrdering);
  orderingInput.disabled = alphabeticalInput.checked;
  alphabeticalInput.addEventListener("change", () => {
    orderingInput.disabled = alphabeticalInput.checked;
  });
  const positionHint = document.createElement("p");
  positionHint.className = "qpm-editor-field-label";
  positionHint.textContent = `${t("currentListPositionLabel")}: ${currentPosition || "-"}`;
  dkInput.dataset.inlineField = "translations.dk";
  const enInput = mkInput(item?.translations?.en || "");
  enInput.dataset.inlineField = "translations.en";
  const narrow = mkTextarea(normalizeToLines(item?.searchStrings?.narrow));
  narrow.dataset.inlineField = "searchStrings.narrow";
  const normal = mkTextarea(normalizeToLines(item?.searchStrings?.normal));
  normal.dataset.inlineField = "searchStrings.normal";
  const broad = mkTextarea(normalizeToLines(item?.searchStrings?.broad));
  broad.dataset.inlineField = "searchStrings.broad";
  const commentDk = mkTextarea(item?.searchStringComment?.dk || "");
  commentDk.dataset.inlineField = "searchStringComment.dk";
  const commentEn = mkTextarea(item?.searchStringComment?.en || "");
  commentEn.dataset.inlineField = "searchStringComment.en";
  const tooltipDk = mkTextarea(item?.tooltip?.dk || "");
  tooltipDk.dataset.inlineField = "tooltip.dk";
  const tooltipEn = mkTextarea(item?.tooltip?.en || "");
  tooltipEn.dataset.inlineField = "tooltip.en";

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "qpm-editor-btn qpm-editor-btn-secondary qpm-editor-tree-apply-inline";
  applyBtn.dataset.id = item?.id || "";
  applyBtn.dataset.categoryId = categoryId;
  applyBtn.textContent = t("saveTopicFields");
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "qpm-editor-btn qpm-editor-btn-danger qpm-editor-tree-delete-inline";
  deleteBtn.dataset.id = item?.id || "";
  deleteBtn.dataset.categoryId = categoryId;
  deleteBtn.textContent = t("deleteSubtopic");
  const { actionsRow, inlineStatus } = createInlineActions(applyBtn, deleteBtn, "item");

  const itemPrimaryLang = editorLanguage === "en" ? "en" : "dk";
  const itemSecondaryLang = itemPrimaryLang === "en" ? "dk" : "en";
  const itemNamePrimaryLabel = itemPrimaryLang === "en" ? t("itemNameEnLabel") : t("itemNameDkLabel");
  const itemNameSecondaryLabel = itemSecondaryLang === "en" ? t("itemNameEnLabel") : t("itemNameDkLabel");
  const itemNamePrimaryInput = itemPrimaryLang === "en" ? enInput : dkInput;
  const itemNameSecondaryInput = itemSecondaryLang === "en" ? enInput : dkInput;
  const itemNamePrimaryKey = itemPrimaryLang === "en" ? "item.translations.en" : "item.translations.dk";
  const itemNameSecondaryKey = itemSecondaryLang === "en" ? "item.translations.en" : "item.translations.dk";

  const itemCommentPrimaryLabel =
    itemPrimaryLang === "en" ? t("itemCommentEnLabel") : t("itemCommentDkLabel");
  const itemCommentSecondaryLabel =
    itemSecondaryLang === "en" ? t("itemCommentEnLabel") : t("itemCommentDkLabel");
  const itemCommentPrimaryInput = itemPrimaryLang === "en" ? commentEn : commentDk;
  const itemCommentSecondaryInput = itemSecondaryLang === "en" ? commentEn : commentDk;
  const itemCommentPrimaryKey =
    itemPrimaryLang === "en" ? "item.searchStringComment.en" : "item.searchStringComment.dk";
  const itemCommentSecondaryKey =
    itemSecondaryLang === "en" ? "item.searchStringComment.en" : "item.searchStringComment.dk";

  const itemTooltipPrimaryLabel =
    itemPrimaryLang === "en" ? t("itemTooltipEnLabel") : t("itemTooltipDkLabel");
  const itemTooltipSecondaryLabel =
    itemSecondaryLang === "en" ? t("itemTooltipEnLabel") : t("itemTooltipDkLabel");
  const itemTooltipPrimaryInput = itemPrimaryLang === "en" ? tooltipEn : tooltipDk;
  const itemTooltipSecondaryInput = itemSecondaryLang === "en" ? tooltipEn : tooltipDk;
  const itemTooltipPrimaryKey = itemPrimaryLang === "en" ? "item.tooltip.en" : "item.tooltip.dk";
  const itemTooltipSecondaryKey = itemSecondaryLang === "en" ? "item.tooltip.en" : "item.tooltip.dk";

  wrapper.append(
    mkLabel(t("itemIdLabel"), "item.id"),
    idInput,
    lockIdLabel,
    hiddenLabel,
    buttonsLabel,
    alphabeticalLabel,
    positionHint,
    mkLabel(t("itemOrderingFixedLabel"), "item.ordering.fixed"),
    orderingInput,
    mkLabel(itemNamePrimaryLabel, itemNamePrimaryKey),
    itemNamePrimaryInput,
    mkLabel(itemNameSecondaryLabel, itemNameSecondaryKey),
    itemNameSecondaryInput,
    mkLabel(t("itemNarrowLabel"), "item.searchStrings.narrow"),
    narrow,
    mkLabel(t("itemNormalLabel"), "item.searchStrings.normal"),
    normal,
    mkLabel(t("itemBroadLabel"), "item.searchStrings.broad"),
    broad,
    mkLabel(itemCommentPrimaryLabel, itemCommentPrimaryKey),
    itemCommentPrimaryInput,
    mkLabel(itemCommentSecondaryLabel, itemCommentSecondaryKey),
    itemCommentSecondaryInput,
    mkLabel(itemTooltipPrimaryLabel, itemTooltipPrimaryKey),
    itemTooltipPrimaryInput,
    mkLabel(itemTooltipSecondaryLabel, itemTooltipSecondaryKey),
    itemTooltipSecondaryInput,
    actionsRow,
    inlineStatus
  );

  return wrapper;
}

function renderTreeItems(items, categoryId, container, searchText, parentItemId = "") {
  if (!Array.isArray(items) || !container) return;
  const ul = document.createElement("ul");

  items.forEach((item, index) => {
    if (!hasMatchInTree(item, searchText)) return;

    const li = document.createElement("li");
    const row = document.createElement("div");
    row.className = "qpm-editor-tree-item-row";

    const hasChildren = Array.isArray(item?.children) && item.children.length > 0;
    const isCollapsed = collapsedTopicIds.has(item?.id);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "qpm-editor-tree-toggle";
    toggle.dataset.id = item?.id || "";
    toggle.dataset.action = "toggle";
    toggle.textContent = hasChildren ? (isCollapsed ? "+" : "-") : "•";
    toggle.disabled = !hasChildren;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qpm-editor-tree-item";
    btn.dataset.id = item?.id || "";
    btn.dataset.categoryId = categoryId;
    btn.draggable = sortModeEnabled;
    if (selectedTopicItemId && selectedTopicItemId === item?.id) {
      btn.classList.add("is-selected");
    }
    const label = getLocalizedText(item?.translations, item?.id || t("unknownItemLabel"));
    btn.textContent = `${item?.id || ""} - ${label}`;

    row.append(toggle, btn);
    li.appendChild(row);

    if (sortModeEnabled) {
      const dropzones = document.createElement("div");
      dropzones.className = "qpm-editor-dropzones";
      [
        ["before", t("dropBefore")],
        ["inside", t("dropAsSubtopic")],
        ["after", t("dropAfter")],
      ].forEach(([position, labelText]) => {
        const z = document.createElement("div");
        z.className = "qpm-editor-dropzone";
        z.dataset.position = position;
        z.dataset.targetId = item?.id || "";
        z.dataset.categoryId = categoryId;
        z.textContent = labelText;
        dropzones.appendChild(z);
      });
      li.appendChild(dropzones);
    }

    if (selectedTopicItemId && selectedTopicItemId === item?.id) {
      const itemEditor = createInlineEditor(item, categoryId, index + 1, items.length);
      li.appendChild(itemEditor);
      if (
        pendingItemInlineStatus &&
        pendingItemInlineStatus.categoryId === categoryId &&
        pendingItemInlineStatus.itemId === item?.id
      ) {
        setInlineEditorStatus(
          itemEditor,
          "item",
          pendingItemInlineStatus.message,
          pendingItemInlineStatus.isError
        );
        pendingItemInlineStatus = null;
      }
    }

    if (hasChildren && !isCollapsed) {
      renderTreeItems(item.children, categoryId, li, searchText, item?.id || "");
    }

    ul.appendChild(li);
  });

  const addLi = document.createElement("li");
  addLi.className = "qpm-editor-tree-add-row";
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "qpm-editor-tree-add-end-btn";
  addBtn.dataset.categoryId = categoryId;
  addBtn.dataset.parentItemId = parentItemId;
  addBtn.textContent = `+ ${t("addSubtopic")}`;
  addLi.appendChild(addBtn);
  ul.appendChild(addLi);

  container.appendChild(ul);
}

function refreshTopicTree() {
  updateCollapseToggleButtonLabel();
  if (!topicTreeInput) return;
  topicTreeInput.innerHTML = "";

  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) return;
  const searchText = (treeSearchText || "").trim().toLowerCase();

  data.topics.forEach((topic) => {
    const categoryGroups = Array.isArray(topic?.groups) ? topic.groups : [];
    const categoryId = topic?.id || "";
    const hasMatch = searchText
      ? categoryGroups.some((item) => hasMatchInTree(item, searchText))
      : true;
    if (!hasMatch) return;

    const categoryRow = document.createElement("div");
    categoryRow.className = "qpm-editor-tree-item-row";
    const hasChildren = categoryGroups.length > 0;
    const isCollapsed = collapsedCategoryIds.has(categoryId);
    const categoryToggle = document.createElement("button");
    categoryToggle.type = "button";
    categoryToggle.className = "qpm-editor-tree-toggle";
    categoryToggle.dataset.categoryId = categoryId;
    categoryToggle.dataset.action = "toggle-category";
    categoryToggle.textContent = hasChildren ? (isCollapsed ? "+" : "-") : "•";
    categoryToggle.disabled = !hasChildren;

    const categoryLabel = getLocalizedText(topic?.translations, topic?.id || t("categoryFallbackLabel"));
    const categoryBtn = document.createElement("button");
    categoryBtn.type = "button";
    categoryBtn.className = "qpm-editor-tree-category-btn";
    categoryBtn.dataset.categoryId = categoryId;
    categoryBtn.draggable = sortModeEnabled;
    if (selectedTopicCategoryId === categoryId) {
      categoryBtn.classList.add("is-selected");
    }
    categoryBtn.textContent = `${categoryId} - ${categoryLabel}`;
    categoryRow.append(categoryToggle, categoryBtn);

    const categoryDiv = document.createElement("div");
    categoryDiv.className = "qpm-editor-tree-category";
    categoryDiv.appendChild(categoryRow);
    topicTreeInput.appendChild(categoryDiv);
    if (sortModeEnabled) {
      const categoryDropzones = document.createElement("div");
      categoryDropzones.className = "qpm-editor-dropzones";
      [
        ["before", t("dropCategoryBefore")],
        ["after", t("dropCategoryAfter")],
      ].forEach(([position, labelText]) => {
        const z = document.createElement("div");
        z.className = "qpm-editor-dropzone";
        z.dataset.scope = "category";
        z.dataset.position = position;
        z.dataset.targetCategoryId = topic?.id || "";
        z.textContent = labelText;
        categoryDropzones.appendChild(z);
      });
      topicTreeInput.appendChild(categoryDropzones);
    }
    if (selectedTopicCategoryId === categoryId && !selectedTopicItemId) {
      const categoryEditor = createCategoryInlineEditor(topic);
      topicTreeInput.appendChild(categoryEditor);
      if (
        pendingCategoryInlineStatus &&
        pendingCategoryInlineStatus.categoryId === categoryId
      ) {
        setInlineEditorStatus(
          categoryEditor,
          "category",
          pendingCategoryInlineStatus.message,
          pendingCategoryInlineStatus.isError
        );
        pendingCategoryInlineStatus = null;
      }
    }
    if (!isCollapsed) {
      renderTreeItems(categoryGroups, categoryId, topicTreeInput, searchText, "");
    }
  });

  const addCategoryWrap = document.createElement("div");
  addCategoryWrap.className = "qpm-editor-tree-add-row";
  const addCategoryBtn = document.createElement("button");
  addCategoryBtn.type = "button";
  addCategoryBtn.className = "qpm-editor-tree-add-end-btn qpm-editor-tree-add-root-category-btn";
  addCategoryBtn.textContent = `+ ${t("addMainCategory")}`;
  addCategoryWrap.appendChild(addCategoryBtn);
  topicTreeInput.appendChild(addCategoryWrap);
}

function findItemById(items, id) {
  if (!Array.isArray(items)) return null;
  for (const item of items) {
    if (item?.id === id) return item;
    const nested = findItemById(item?.children, id);
    if (nested) return nested;
  }
  return null;
}

function normalizeToLines(value) {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string").join("\n");
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function linesToArray(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

function selectTopicItem(categoryId, itemId) {
  if (!categoryId || !itemId) return;
  selectedTopicCategoryId = categoryId;
  selectedTopicItemId = itemId;
  refreshTopicTree();
}

function selectCategory(categoryId) {
  selectedTopicCategoryId = categoryId || "";
  selectedTopicItemId = "";
  refreshTopicTree();
}

function deselectTopicItem() {
  selectedTopicCategoryId = "";
  selectedTopicItemId = "";
  refreshTopicTree();
}

function renumberOrdering(items = []) {
  items.forEach((item, index) => {
    const next = index + 1;
    setItemOrdering(item, next);
  });
}

function setItemOrdering(item, nextValue) {
  const preserveAlphabetical = item?.ordering?.dk === null || item?.ordering?.en === null;
  item.ordering = {
    ...(item.ordering || {}),
    dk: preserveAlphabetical ? null : nextValue,
    en: preserveAlphabetical ? null : nextValue,
  };
}

function extractItemById(items, idToExtract) {
  if (!Array.isArray(items)) return null;
  const idx = items.findIndex((item) => item?.id === idToExtract);
  if (idx >= 0) {
    const [removed] = items.splice(idx, 1);
    return removed;
  }
  for (const item of items) {
    if (Array.isArray(item?.children)) {
      const nested = extractItemById(item.children, idToExtract);
      if (nested) return nested;
    }
  }
  return null;
}

function findArrayAndIndexByItemId(items, targetId) {
  if (!Array.isArray(items)) return null;
  const index = items.findIndex((item) => item?.id === targetId);
  if (index >= 0) {
    return { array: items, index, parentId: null };
  }
  for (const item of items) {
    const nested = findArrayAndIndexByItemId(item?.children, targetId);
    if (nested) {
      if (nested.parentId == null) {
        nested.parentId = item?.id || null;
      }
      return nested;
    }
  }
  return null;
}

function buildAutoId(parentId, siblingIndex) {
  const seg = String((siblingIndex + 1) * 10).padStart(3, "0");
  return `${parentId}${seg}`;
}

function buildUniqueAutoId(category, parentId, siblingIndex, excludeId) {
  let probeIndex = siblingIndex;
  let candidate = buildAutoId(parentId, probeIndex);
  while (idExistsInCategory(category, candidate, excludeId)) {
    probeIndex += 1;
    candidate = buildAutoId(parentId, probeIndex);
  }
  return candidate;
}

function renumberTopicCategoryOrdering(topics = []) {
  topics.forEach((topic, index) => {
    topic.ordering = {
      ...(topic.ordering || {}),
      dk: index + 1,
      en: index + 1,
    };
  });
}

function treeContainsItemId(item, idToFind) {
  if (!item) return false;
  if (item?.id === idToFind) return true;
  if (!Array.isArray(item?.children)) return false;
  return item.children.some((child) => treeContainsItemId(child, idToFind));
}

function moveTopicItemByDrop(categoryId, sourceId, targetId, position) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) return { ok: false, error: t("invalidTopicsJson") };

  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    return { ok: false, error: t("categoryNotFound") };
  }

  if (!sourceId || !targetId || sourceId === targetId) {
    return { ok: false, error: t("invalidMove") };
  }

  const source = findItemById(category.groups, sourceId);
  if (!source) return { ok: false, error: t("sourceTopicNotFound") };
  if (treeContainsItemId(source, targetId)) {
    return { ok: false, error: t("cannotMoveTopicIntoItself") };
  }

  const extracted = extractItemById(category.groups, sourceId);
  if (!extracted) return { ok: false, error: t("couldNotExtractTopic") };

  let newParentId = category.id;
  let newSiblingIndex = 0;

  if (position === "inside") {
    const target = findItemById(category.groups, targetId);
    if (!target) return { ok: false, error: t("targetTopicNotFound") };
    target.children = Array.isArray(target.children) ? target.children : [];
    target.children.push(extracted);
    newParentId = target.id || category.id;
    newSiblingIndex = target.children.length - 1;
  } else {
    const targetLocation = findArrayAndIndexByItemId(category.groups, targetId);
    if (!targetLocation) return { ok: false, error: t("targetPositionNotFound") };
    const insertAt = position === "before" ? targetLocation.index : targetLocation.index + 1;
    targetLocation.array.splice(insertAt, 0, extracted);
    newParentId = targetLocation.parentId || category.id;
    newSiblingIndex = insertAt;
  }

  const idLocked = extracted?.lockIdOnSort !== false;
  if (!idLocked) {
    const confirmIdChange = window.confirm(
      `${t("topicUnlockedIdConfirmPrefix")} "${sourceId}" ${t("topicUnlockedIdConfirmSuffix")}`
    );
    if (confirmIdChange) {
      const previousId = extracted.id || sourceId;
      const nextId = buildUniqueAutoId(category, newParentId, newSiblingIndex, previousId);
      extracted.id = nextId;
      updateChildIdsByPrefix(extracted, previousId, nextId);
    }
  }

  renumberOrdering(category.groups);
  updateJson(data);
  selectedTopicCategoryId = categoryId;
  selectedTopicItemId = extracted.id || sourceId;
  return { ok: true };
}

function moveCategoryByDrop(sourceCategoryId, targetCategoryId, position) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    return { ok: false, error: t("invalidTopicsJson") };
  }
  if (!sourceCategoryId || !targetCategoryId || sourceCategoryId === targetCategoryId) {
    return { ok: false, error: t("invalidCategoryMove") };
  }

  const sourceIndex = data.topics.findIndex((t) => t?.id === sourceCategoryId);
  if (sourceIndex < 0) return { ok: false, error: t("sourceCategoryNotFound") };
  const [movedCategory] = data.topics.splice(sourceIndex, 1);

  const targetIndex = data.topics.findIndex((t) => t?.id === targetCategoryId);
  if (targetIndex < 0) return { ok: false, error: t("targetCategoryNotFound") };

  const insertAt = position === "before" ? targetIndex : targetIndex + 1;
  data.topics.splice(insertAt, 0, movedCategory);

  renumberTopicCategoryOrdering(data.topics);
  updateJson(data);
  selectedTopicCategoryId = movedCategory?.id || sourceCategoryId;
  selectedTopicItemId = "";
  return { ok: true };
}

function deleteTopicItem(categoryId, itemId) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    return { ok: false, error: t("invalidTopicsJson") };
  }
  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    return { ok: false, error: t("categoryDoesNotExist") };
  }
  const removed = extractItemById(category.groups, itemId);
  if (!removed) {
    return { ok: false, error: t("subtopicNotFound") };
  }
  renumberOrdering(category.groups);
  updateJson(data);
  selectedTopicCategoryId = categoryId;
  selectedTopicItemId = "";
  return { ok: true };
}

function deleteCategory(categoryId) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    return { ok: false, error: t("invalidTopicsJson") };
  }
  const idx = data.topics.findIndex((t) => t?.id === categoryId);
  if (idx < 0) {
    return { ok: false, error: t("mainCategoryNotFound") };
  }
  data.topics.splice(idx, 1);
  renumberTopicCategoryOrdering(data.topics);
  collapsedCategoryIds.delete(categoryId);
  updateJson(data);
  selectedTopicCategoryId = "";
  selectedTopicItemId = "";
  return { ok: true };
}

function createNewTopicItem(newId, orderingValue) {
  return {
    id: newId,
    translations: { dk: "", en: "" },
    searchStrings: { narrow: [], normal: [], broad: [] },
    searchStringComment: { dk: "", en: "" },
    tooltip: { dk: "", en: "" },
    ordering: { dk: orderingValue, en: orderingValue },
    lockIdOnSort: true,
    hiddenByDefault: false,
    children: [],
  };
}

function buildNextCategoryId(topics = []) {
  let maxNumber = 0;
  let preferredPrefix = "S";
  topics.forEach((topic) => {
    const id = String(topic?.id || "");
    const match = id.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return;
    const prefix = match[1];
    const numeric = Number.parseInt(match[2], 10);
    if (!Number.isInteger(numeric)) return;
    if (numeric >= maxNumber) {
      maxNumber = numeric;
      preferredPrefix = prefix;
    }
  });

  let nextNumber = maxNumber > 0 ? maxNumber + 10 : 10;
  let candidate = `${preferredPrefix}${String(nextNumber).padStart(3, "0")}`;
  while (topics.some((t) => t?.id === candidate)) {
    nextNumber += 10;
    candidate = `${preferredPrefix}${String(nextNumber).padStart(3, "0")}`;
  }
  return candidate;
}

function createNewTopicCategory(categoryId, orderingValue) {
  return {
    id: categoryId,
    translations: { dk: "", en: "" },
    tooltip: { dk: "", en: "" },
    ordering: { dk: orderingValue, en: orderingValue },
    hiddenByDefault: false,
    groups: [],
  };
}

function addTopicItemAtEnd(categoryId, parentItemId = "") {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    return { ok: false, error: t("invalidTopicsJson") };
  }

  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    return { ok: false, error: t("categoryDoesNotExist") };
  }

  let targetArray = category.groups;
  let parentId = category.id;
  if (parentItemId) {
    const parentItem = findItemById(category.groups, parentItemId);
    if (!parentItem) {
      return { ok: false, error: t("parentTopicNotFound") };
    }
    parentItem.children = Array.isArray(parentItem.children) ? parentItem.children : [];
    targetArray = parentItem.children;
    parentId = parentItem.id || category.id;
    collapsedTopicIds.delete(parentItemId);
  }

  const siblingIndex = targetArray.length;
  const nextId = buildUniqueAutoId(category, parentId, siblingIndex, "");
  const nextItem = createNewTopicItem(nextId, siblingIndex + 1);
  targetArray.push(nextItem);
  renumberOrdering(targetArray);

  updateJson(data);
  selectedTopicCategoryId = categoryId;
  selectedTopicItemId = nextId;
  return { ok: true, itemId: nextId };
}

function addCategoryAtEnd() {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    return { ok: false, error: t("invalidTopicsJson") };
  }
  const nextId = buildNextCategoryId(data.topics);
  const nextCategory = createNewTopicCategory(nextId, data.topics.length + 1);
  data.topics.push(nextCategory);
  renumberTopicCategoryOrdering(data.topics);
  updateJson(data);
  selectedTopicCategoryId = nextId;
  selectedTopicItemId = "";
  collapsedCategoryIds.delete(nextId);
  return { ok: true, categoryId: nextId };
}

function applyInlineEditorEdits(categoryId, itemId, container) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    setInlineEditorStatus(container, "item", t("cannotUpdateInvalidTopicsJson"), true);
    return;
  }
  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    setInlineEditorStatus(container, "item", t("categoryNotInCurrentJson"), true);
    return;
  }
  const item = findItemById(category.groups, itemId);
  if (!item) {
    setInlineEditorStatus(container, "item", t("selectedTopicNotFound"), true);
    return;
  }

  const get = (field) => container.querySelector(`[data-inline-field="${field}"]`);
  const requestedId = (get("id")?.value || "").trim();
  if (!requestedId) {
    setInlineEditorStatus(container, "item", t("idMustNotBeEmpty"), true);
    return;
  }
  if (requestedId !== itemId && idExistsInCategory(category, requestedId, itemId)) {
    setInlineEditorStatus(
      container,
      "item",
      `${t("idExistsInCategoryPrefix")} "${requestedId}" ${t("idExistsInCategorySuffix")}`,
      true
    );
    return;
  }
  if (requestedId !== itemId) {
    const oldId = item.id;
    item.id = requestedId;
    updateChildIdsByPrefix(item, oldId, requestedId);
    remapCollapsedTopicIdsByPrefix(oldId, requestedId);
  }
  const lockIdCheckbox = get("lockIdOnSort");
  item.lockIdOnSort = lockIdCheckbox ? Boolean(lockIdCheckbox.checked) : true;
  const hiddenCheckbox = get("hiddenByDefault");
  item.hiddenByDefault = hiddenCheckbox ? Boolean(hiddenCheckbox.checked) : false;
  const buttonsCheckbox = get("buttons");
  item.buttons = buttonsCheckbox ? Boolean(buttonsCheckbox.checked) : item?.buttons !== false;
  const alphabeticalCheckbox = get("ordering.alphabetical");
  const orderingInput = get("ordering.fixed");
  const itemLocation = findArrayAndIndexByItemId(category.groups, item.id || itemId);
  const currentPosition = itemLocation ? itemLocation.index + 1 : 1;
  const alphabetical = alphabeticalCheckbox ? Boolean(alphabeticalCheckbox.checked) : false;
  if (alphabetical) {
    item.ordering = {
      ...(item.ordering || {}),
      dk: null,
      en: null,
    };
  } else {
    let fixedOrdering = Number.parseInt((orderingInput?.value || "").trim(), 10);
    if (!Number.isInteger(fixedOrdering) || fixedOrdering < 1) {
      fixedOrdering = currentPosition;
    }
    const siblings = itemLocation?.array;
    if (Array.isArray(siblings) && siblings.length > 0) {
      const fromIndex = itemLocation.index;
      const toIndex = Math.min(Math.max(fixedOrdering - 1, 0), siblings.length - 1);
      if (toIndex !== fromIndex) {
        const [movedItem] = siblings.splice(fromIndex, 1);
        siblings.splice(toIndex, 0, movedItem);
      }
      renumberOrdering(siblings);
    } else {
      item.ordering = {
        ...(item.ordering || {}),
        dk: fixedOrdering,
        en: fixedOrdering,
      };
    }
  }
  item.translations = {
    ...(item.translations || {}),
    dk: (get("translations.dk")?.value || "").trim(),
    en: (get("translations.en")?.value || "").trim(),
  };
  item.searchStrings = {
    ...(item.searchStrings || {}),
    narrow: linesToArray(get("searchStrings.narrow")?.value),
    normal: linesToArray(get("searchStrings.normal")?.value),
    broad: linesToArray(get("searchStrings.broad")?.value),
  };
  item.searchStringComment = {
    ...(item.searchStringComment || {}),
    dk: (get("searchStringComment.dk")?.value || "").trim(),
    en: (get("searchStringComment.en")?.value || "").trim(),
  };
  item.tooltip = {
    ...(item.tooltip || {}),
    dk: (get("tooltip.dk")?.value || "").trim(),
    en: (get("tooltip.en")?.value || "").trim(),
  };

  selectedTopicCategoryId = categoryId;
  selectedTopicItemId = item.id || itemId;
  pendingItemInlineStatus = {
    categoryId,
    itemId: selectedTopicItemId,
    message: `${t("changesSavedLocallyForTopic")} "${selectedTopicItemId}". ${t("clickSaveAllToWriteFile")}`,
    isError: false,
  };
  updateJson(data);
}

function applyCategoryInlineEdits(categoryId, container) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    setInlineEditorStatus(container, "category", t("cannotUpdateInvalidTopicsJson"), true);
    return;
  }
  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category) {
    setInlineEditorStatus(container, "category", t("mainCategoryNotFound"), true);
    return;
  }
  const get = (field) => container.querySelector(`[data-inline-field="${field}"]`);
  const nextId = (get("category.id")?.value || "").trim();
  if (!nextId) {
    setInlineEditorStatus(container, "category", t("mainCategoryIdRequired"), true);
    return;
  }
  const idTaken = data.topics.some((t) => t?.id === nextId && t?.id !== categoryId);
  if (idTaken) {
    setInlineEditorStatus(
      container,
      "category",
      `${t("categoryIdExistsPrefix")} "${nextId}" ${t("categoryIdExistsSuffix")}`,
      true
    );
    return;
  }

  const oldId = category.id;
  category.id = nextId;
  category.translations = {
    ...(category.translations || {}),
    dk: (get("category.translations.dk")?.value || "").trim(),
    en: (get("category.translations.en")?.value || "").trim(),
  };
  category.tooltip = {
    ...(category.tooltip || {}),
    dk: (get("category.tooltip.dk")?.value || "").trim(),
    en: (get("category.tooltip.en")?.value || "").trim(),
  };
  const hiddenCheckbox = get("category.hiddenByDefault");
  category.hiddenByDefault = hiddenCheckbox ? Boolean(hiddenCheckbox.checked) : false;
  if (oldId !== nextId) {
    renumberCategoryIds(category);
    remapCollapsedIdsAfterCategoryRename(oldId, nextId);
  }

  selectedTopicCategoryId = category.id;
  selectedTopicItemId = "";
  pendingCategoryInlineStatus = {
    categoryId: category.id,
    message: `${t("mainCategoryUpdatedLocallyPrefix")} "${category.id}". ${t("clickSaveAllAboveToWriteFile")}`,
    isError: false,
  };
  updateJson(data);
}

applyCapabilities({ canEditFilters: filtersEnabled, allowedDomains: [] });
domainInput.value = defaultDomain;
syncDomainOptions();
syncTypeOptionsVisibility();
syncFormByType();
setActiveTopicLabel(configuredTopicDomains[0] || defaultDomain || "");

if (isRemoteApiBlockedInLocal) {
  lockEditorForSafety(
    `${t("securityBlockActivePrefix")} "${apiBase}" ${t("securityBlockActiveSuffix")}`
  );
}

loginBtn?.addEventListener("click", login);
typeInput?.addEventListener("change", async () => {
  syncFormByType();
  selectedTopicCategoryId = "";
  selectedTopicItemId = "";
  await loadContent();
  await refreshRevisionList();
});
domainInput?.addEventListener("change", async () => {
  if (getSelectedType() !== "topics") return;
  selectedTopicCategoryId = "";
  selectedTopicItemId = "";
  await loadContent();
  await refreshRevisionList();
});
document.addEventListener("visibilitychange", () => {
  if (!isEditorAuthenticated) return;
  if (document.hidden) {
    hiddenSinceTs = Date.now();
  } else if (hiddenSinceTs && Date.now() - hiddenSinceTs >= AUTO_LOGOUT_HIDDEN_MS) {
    void forceAutoLogoutAfterHiddenTimeout();
    return;
  }
  scheduleHiddenAutoLogout();
});
window.addEventListener("beforeunload", () => {
  sendUnloadLogout();
});
window.addEventListener("pagehide", () => {
  sendUnloadLogout();
});
loadBtn?.addEventListener("click", loadContent);
saveBtn?.addEventListener("click", () => saveContent("main"));
saveJsonBtn?.addEventListener("click", () => saveContent("json"));
logoutBtn?.addEventListener("click", logout);
revisionRefreshBtn?.addEventListener("click", refreshRevisionList);
revisionListInput?.addEventListener("change", syncRevisionActionButtonsVisibility);
revisionPreviewBtn?.addEventListener("click", previewSelectedRevision);
revertBtn?.addEventListener("click", revertSelectedRevision);
revisionOnlyDiffInput?.addEventListener("change", () => {
  if (!(revisionDiffEl instanceof HTMLElement)) return;
  if (revisionDiffEl.classList.contains("qpm-editor-hidden")) return;
  if (!Array.isArray(revisionDiffRowsCache) || revisionDiffRowsCache.length === 0) return;
  renderRevisionDiffRows(revisionDiffRowsCache);
});
toggleJsonBtn?.addEventListener("click", () => {
  if (!jsonInput) return;
  const isHidden = jsonInput.classList.toggle("qpm-editor-hidden");
  if (jsonActionsWrap instanceof HTMLElement) {
    jsonActionsWrap.classList.toggle("qpm-editor-hidden", isHidden);
  }
  updateJsonToggleButtonLabel();
});
treeSearchInput?.addEventListener("input", () => {
  treeSearchText = (treeSearchInput.value || "").trim().toLowerCase();
  refreshTopicTree();
});
sortModeInput?.addEventListener("change", () => {
  sortModeEnabled = Boolean(sortModeInput.checked);
  refreshTopicTree();
});
collapseAllBtn?.addEventListener("click", () => {
  const shouldExpandAll = collapsedCategoryIds.size > 0 || collapsedTopicIds.size > 0;
  if (shouldExpandAll) {
    collapsedCategoryIds.clear();
    collapsedTopicIds.clear();
    refreshTopicTree();
    return;
  }

  const data = parseCurrentJson();
  const collect = (items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (Array.isArray(item?.children) && item.children.length > 0) {
        collapsedTopicIds.add(item.id);
        collect(item.children);
      }
    });
  };
  data?.topics?.forEach((topic) => {
    if (topic?.id) collapsedCategoryIds.add(topic.id);
    collect(topic?.groups || []);
  });
  refreshTopicTree();
});
topicTreeInput?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const addRootCategoryBtn = target.closest(".qpm-editor-tree-add-root-category-btn");
  if (addRootCategoryBtn instanceof HTMLElement) {
    const result = addCategoryAtEnd();
    if (!result.ok) {
      setStatus(result.error || t("couldNotAddMainCategory"), true);
      return;
    }
    setStatus(
      `${t("newMainCategoryCreatedPrefix")} "${result.categoryId}" ${t("createdAtBottomSuffix")} ${t("clickSaveAllToWriteFile")}`
    );
    refreshTopicTree();
    return;
  }
  const addEndBtn = target.closest(".qpm-editor-tree-add-end-btn");
  if (addEndBtn instanceof HTMLElement) {
    const categoryId = (addEndBtn.dataset.categoryId || "").trim();
    const parentItemId = (addEndBtn.dataset.parentItemId || "").trim();
    if (!categoryId) return;
    const result = addTopicItemAtEnd(categoryId, parentItemId);
    if (!result.ok) {
      setStatus(result.error || t("couldNotAddTopic"), true);
      return;
    }
    const typeLabel = parentItemId ? t("subtopicLabel") : t("topicLabel");
    setStatus(`${t("newLabelPrefix")} ${typeLabel} "${result.itemId}" ${t("createdAtBottomSuffix")} ${t("clickSaveAllToWriteFile")}`);
    refreshTopicTree();
    return;
  }
  const itemBtn = target.closest(".qpm-editor-tree-item");
  if (itemBtn instanceof HTMLElement) {
    const itemId = (itemBtn.dataset.id || "").trim();
    const categoryId = (itemBtn.dataset.categoryId || "").trim();
    if (!itemId || !categoryId) return;
    if (selectedTopicCategoryId === categoryId && selectedTopicItemId === itemId) {
      deselectTopicItem();
      return;
    }
    selectTopicItem(categoryId, itemId);
    return;
  }
  const categoryBtn = target.closest(".qpm-editor-tree-category-btn");
  if (categoryBtn instanceof HTMLElement) {
    const categoryId = (categoryBtn.dataset.categoryId || "").trim();
    if (!categoryId) return;
    if (selectedTopicCategoryId === categoryId && !selectedTopicItemId) {
      deselectTopicItem();
      return;
    }
    selectCategory(categoryId);
    return;
  }
  const toggleBtn = target.closest(".qpm-editor-tree-toggle");
  if (toggleBtn instanceof HTMLElement) {
    const categoryToggleId = (toggleBtn.dataset.categoryId || "").trim();
    if (categoryToggleId) {
      if (collapsedCategoryIds.has(categoryToggleId)) collapsedCategoryIds.delete(categoryToggleId);
      else collapsedCategoryIds.add(categoryToggleId);
      refreshTopicTree();
      return;
    }
    const toggleId = (toggleBtn.dataset.id || "").trim();
    if (!toggleId) return;
    if (collapsedTopicIds.has(toggleId)) collapsedTopicIds.delete(toggleId);
    else collapsedTopicIds.add(toggleId);
    refreshTopicTree();
    return;
  }
  if (target.classList.contains("qpm-editor-tree-apply-inline")) {
    const itemId = (target.dataset.id || "").trim();
    const categoryId = (target.dataset.categoryId || "").trim();
    const container = target.closest(".qpm-editor-inline-editor");
    if (!itemId || !categoryId || !container) return;
    applyInlineEditorEdits(categoryId, itemId, container);
    return;
  }
  if (target.classList.contains("qpm-editor-tree-delete-inline")) {
    const itemId = (target.dataset.id || "").trim();
    const categoryId = (target.dataset.categoryId || "").trim();
    if (!itemId || !categoryId) return;
    const ok = window.confirm(`${t("confirmDeleteSubtopicPrefix")} "${itemId}"?`);
    if (!ok) return;
    const result = deleteTopicItem(categoryId, itemId);
    if (!result.ok) {
      setStatus(result.error || t("deleteFailed"), true);
      return;
    }
    setStatus(`${t("subtopicDeletedPrefix")} "${itemId}" ${t("clickSaveAllToWriteFile")}`);
    refreshTopicTree();
    return;
  }
  if (target.classList.contains("qpm-editor-tree-apply-category-inline")) {
    const categoryId = (target.dataset.categoryId || "").trim();
    const container = target.closest(".qpm-editor-inline-editor");
    if (!categoryId || !container) return;
    applyCategoryInlineEdits(categoryId, container);
    return;
  }
  if (target.classList.contains("qpm-editor-tree-delete-category-inline")) {
    const categoryId = (target.dataset.categoryId || "").trim();
    if (!categoryId) return;
    const ok = window.confirm(`${t("confirmDeleteMainCategoryPrefix")} "${categoryId}"?`);
    if (!ok) return;
    const result = deleteCategory(categoryId);
    if (!result.ok) {
      setStatus(result.error || t("deleteFailed"), true);
      return;
    }
    setStatus(`${t("mainCategoryDeletedPrefix")} "${categoryId}" ${t("clickSaveAllToWriteFile")}`);
    refreshTopicTree();
  }
});
topicTreeInput?.addEventListener("dragstart", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.classList.contains("qpm-editor-tree-item")) {
    draggedTopicItemId = (target.dataset.id || "").trim();
    draggedCategoryId = "";
    if (!draggedTopicItemId) return;
    event.dataTransfer?.setData("text/plain", draggedTopicItemId);
  } else if (target.classList.contains("qpm-editor-tree-category-btn")) {
    draggedCategoryId = (target.dataset.categoryId || "").trim();
    draggedTopicItemId = "";
    if (!draggedCategoryId) return;
    event.dataTransfer?.setData("text/plain", draggedCategoryId);
  } else {
    return;
  }
  event.dataTransfer.effectAllowed = "move";
});
topicTreeInput?.addEventListener("dragover", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("qpm-editor-dropzone")) return;
  event.preventDefault();
  target.classList.add("is-over");
  event.dataTransfer.dropEffect = "move";
});
topicTreeInput?.addEventListener("dragleave", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("qpm-editor-dropzone")) return;
  target.classList.remove("is-over");
});
topicTreeInput?.addEventListener("drop", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("qpm-editor-dropzone")) return;
  event.preventDefault();
  target.classList.remove("is-over");

  const scope = (target.dataset.scope || "item").trim();
  const position = (target.dataset.position || "").trim();
  if (!position) return;

  let result = { ok: false, error: t("moveFailed") };
  if (scope === "category") {
    const sourceCategoryId = draggedCategoryId || event.dataTransfer?.getData("text/plain") || "";
    const targetCategoryId = (target.dataset.targetCategoryId || "").trim();
    if (!sourceCategoryId || !targetCategoryId) return;
    result = moveCategoryByDrop(sourceCategoryId, targetCategoryId, position);
    if (result.ok) {
      setStatus(`${t("mainCategoryMovedPrefix")} "${sourceCategoryId}" ${t("movedWithPositionPrefix")} (${position}).`);
      refreshTopicTree();
    }
  } else {
    const sourceId = draggedTopicItemId || event.dataTransfer?.getData("text/plain") || "";
    const targetId = (target.dataset.targetId || "").trim();
    const categoryId = (target.dataset.categoryId || "").trim();
    if (!sourceId || !targetId || !categoryId) return;
    result = moveTopicItemByDrop(categoryId, sourceId, targetId, position);
    if (result.ok) {
      setStatus(`${t("topicMovedPrefix")} "${sourceId}" ${t("movedWithPositionPrefix")} (${position}).`);
      refreshTopicTree();
    }
  }
  if (!result.ok) {
    setStatus(result.error || t("moveFailed"), true);
    return;
  }
});
topicTreeInput?.addEventListener("dragend", () => {
  draggedTopicItemId = "";
  draggedCategoryId = "";
  topicTreeInput.querySelectorAll(".qpm-editor-dropzone.is-over").forEach((el) => {
    el.classList.remove("is-over");
  });
});

if (!isRemoteApiBlockedInLocal) {
  checkSession();
}
