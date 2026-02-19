import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

const root = document.getElementById("qpm-editor");
if (!root) {
  throw new Error("Missing #qpm-editor root");
}

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
const configuredTopicDomains = parseConfiguredTopicDomains();
const filtersEnabled = root.dataset.filtersEnabled !== "false";

const loginSection = document.getElementById("qpm-editor-login");
const appSection = document.getElementById("qpm-editor-app");
const statusEl = document.getElementById("qpm-editor-status");
const apiBaseEl = document.getElementById("qpm-editor-api-base");
const activeTopicEl = document.getElementById("qpm-editor-active-topic");

const userInput = document.getElementById("qpm-editor-user");
const passwordInput = document.getElementById("qpm-editor-password");
const typeInput = document.getElementById("qpm-editor-type");
const domainInput = document.getElementById("qpm-editor-domain");
const jsonInput = document.getElementById("qpm-editor-json");
const topicTools = document.getElementById("qpm-editor-topic-tools");
const topicTreeInput = document.getElementById("qpm-editor-topic-tree");
const treeSearchInput = document.getElementById("qpm-editor-tree-search");
const sortModeInput = document.getElementById("qpm-editor-sort-mode");
const expandAllBtn = document.getElementById("qpm-editor-expand-all-btn");
const collapseAllBtn = document.getElementById("qpm-editor-collapse-all-btn");

const loginBtn = document.getElementById("qpm-editor-login-btn");
const loadBtn = document.getElementById("qpm-editor-load-btn");
const saveBtn = document.getElementById("qpm-editor-save-btn");
const toggleJsonBtn = document.getElementById("qpm-editor-toggle-json-btn");
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
const isLocalUi = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const AUTO_LOGOUT_HIDDEN_MS = 60 * 60 * 1000;
let isEditorAuthenticated = false;
let hiddenSinceTs = null;
let hiddenLogoutTimerId = 0;
let unloadLogoutSent = false;

if (apiBaseEl) {
  apiBaseEl.textContent = apiBase;
}
if (toggleJsonBtn && jsonInput) {
  toggleJsonBtn.textContent = jsonInput.classList.contains("qpm-editor-hidden")
    ? "Vis rå JSON"
    : "Skjul rå JSON";
}

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

function syncDomainOptions() {
  if (!(domainInput instanceof HTMLSelectElement)) return;
  domainInput.innerHTML = "";
  configuredTopicDomains.forEach((domain) => {
    const opt = document.createElement("option");
    opt.value = domain;
    opt.textContent = domain;
    domainInput.appendChild(opt);
  });

  const initialDomain = configuredTopicDomains[0] || "";
  domainInput.value = initialDomain;
  if (configuredTopicDomains.length <= 1) {
    domainInput.classList.add("qpm-editor-hidden");
  } else {
    domainInput.classList.remove("qpm-editor-hidden");
  }
}

function syncTypeOptionsVisibility() {
  if (!(typeInput instanceof HTMLSelectElement)) return;
  typeInput.classList.toggle("qpm-editor-hidden", typeInput.options.length <= 1);
}

function setActiveTopicLabel(topicValue) {
  if (!activeTopicEl) return;
  activeTopicEl.textContent = topicValue || "-";
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
    expandAllBtn,
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
  setStatus("Automatisk logget ud, fordi siden har været skjult i 1 time.");
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
    throw new Error(
      "Sikkerhedsblokering: localhost-editor må kun bruge lokal API (localhost/127.0.0.1)."
    );
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
      throw new Error(
        "API svarer med PHP-kildekode. Brug en PHP-server og sæt data-content-api-base-url til den rigtige API-URL."
      );
    }
    throw new Error("Ugyldigt JSON svar fra serveren.");
  }

  if (!response.ok) {
    throw new Error(data.error || `Request fejlede (${response.status})`);
  }

  return data;
}

async function checkSession() {
  try {
    const data = await requestJson(`${apiBase}/EditorSession.php`);
    if (data.authenticated) {
      csrfToken = data.csrfToken || "";
      setAuthenticated(true);
      setStatus("Session aktiv.");
      await loadContent();
      return;
    }
  } catch {
    // ignore and show login
  }

  setAuthenticated(false);
  setStatus("Log ind for at fortsætte.");
}

async function login() {
  const user = userInput.value.trim();
  const password = passwordInput.value;
  if (!user || !password) {
    setStatus("Udfyld brugernavn og password.", true);
    return;
  }

  try {
    const data = await requestJson(`${apiBase}/EditorLogin.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });
    csrfToken = data.csrfToken || "";
    unloadLogoutSent = false;
    setAuthenticated(true);
    setStatus("Login lykkedes.");
    await loadContent();
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
    setAuthenticated(false);
    setStatus("Du er logget ud.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadContent() {
  const type = getSelectedType();
  const domain = domainInput.value.trim();
  if (type === "topics" && !domain) {
    setStatus("Domain er påkrævet for topics.", true);
    return;
  }

  try {
    const data = await fetchContentFromServer(type, domain);
    jsonInput.value = JSON.stringify(data.data || {}, null, 2);
    collapseAllInTree(parseCurrentJson() || {});
    refreshTopicTree();
    setActiveTopicLabel(type === "topics" ? domain : "Filters");
    setStatus(
      type === "topics" ? `Topics hentet for domain "${domain}".` : "Filters hentet."
    );
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function fetchContentFromServer(type, domain) {
  const query = new URLSearchParams({ type });
  if (type === "topics" && domain) query.set("domain", domain);
  return requestJson(`${apiBase}/EditorContent.php?${query.toString()}`);
}

async function saveContent() {
  const type = getSelectedType();
  const domain = domainInput.value.trim();
  if (type === "topics" && !domain) {
    setStatus("Domain er påkrævet for topics.", true);
    return;
  }

  let parsed;
  try {
    parsed = jsonInput.value ? JSON.parse(jsonInput.value) : {};
  } catch {
    setStatus("JSON er ugyldig.", true);
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

    // Verify persistence by immediately reloading from server source of truth.
    const serverData = await fetchContentFromServer(type, domain);
    jsonInput.value = JSON.stringify(serverData?.data || {}, null, 2);
    refreshTopicTree();

    const saveStamp = saveResult?.savedAt ? ` (${saveResult.savedAt})` : "";
    setStatus(
      type === "topics"
        ? `Topics gemt og verificeret via API for domain "${domain}"${saveStamp}.`
        : `Filters gemt og verificeret via API${saveStamp}.`
    );
  } catch (error) {
    setStatus(error.message, true);
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

function createCategoryInlineEditor(topic) {
  const wrapper = document.createElement("div");
  wrapper.className = "qpm-editor-inline-editor";
  wrapper.dataset.categoryId = topic?.id || "";

  const mkLabel = (text) => {
    const p = document.createElement("p");
    p.className = "qpm-editor-field-label";
    p.textContent = text;
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
  hiddenLabel.append(hiddenInput, document.createTextNode("Skjul i formular som standard"));

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "qpm-editor-btn qpm-editor-btn-secondary qpm-editor-tree-apply-category-inline";
  applyBtn.dataset.categoryId = topic?.id || "";
  applyBtn.textContent = "Gem hovedkategori";
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "qpm-editor-btn qpm-editor-btn-danger qpm-editor-tree-delete-category-inline";
  deleteBtn.dataset.categoryId = topic?.id || "";
  deleteBtn.textContent = "Slet hovedkategori";

  wrapper.append(
    mkLabel("Kategori ID/prefix"),
    idInput,
    mkLabel("Kategorinavn (dk)"),
    dkInput,
    mkLabel("Kategorinavn (en)"),
    enInput,
    mkLabel("Tooltip (dk)"),
    tooltipDk,
    mkLabel("Tooltip (en)"),
    tooltipEn,
    hiddenLabel,
    applyBtn,
    deleteBtn
  );
  return wrapper;
}

function createInlineEditor(item, categoryId, currentPosition = null, maxPosition = null) {
  const wrapper = document.createElement("div");
  wrapper.className = "qpm-editor-inline-editor";
  wrapper.dataset.id = item?.id || "";
  wrapper.dataset.categoryId = categoryId;

  const mkLabel = (text) => {
    const p = document.createElement("p");
    p.className = "qpm-editor-field-label";
    p.textContent = text;
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
  idInput.placeholder = "Emne-id";
  const lockIdInput = document.createElement("input");
  lockIdInput.type = "checkbox";
  lockIdInput.dataset.inlineField = "lockIdOnSort";
  lockIdInput.checked = item?.lockIdOnSort !== false;
  const lockIdLabel = document.createElement("label");
  lockIdLabel.className = "qpm-editor-checkbox-label";
  lockIdLabel.style.width = "100%";
  lockIdLabel.append(lockIdInput, document.createTextNode("Lås ID ved sortering"));
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "checkbox";
  hiddenInput.dataset.inlineField = "hiddenByDefault";
  hiddenInput.checked = item?.hiddenByDefault === true;
  const hiddenLabel = document.createElement("label");
  hiddenLabel.className = "qpm-editor-checkbox-label";
  hiddenLabel.style.width = "100%";
  hiddenLabel.append(hiddenInput, document.createTextNode("Skjul i formular som standard"));
  const alphabeticalInput = document.createElement("input");
  alphabeticalInput.type = "checkbox";
  alphabeticalInput.dataset.inlineField = "ordering.alphabetical";
  alphabeticalInput.checked = item?.ordering?.dk === null || item?.ordering?.en === null;
  const alphabeticalLabel = document.createElement("label");
  alphabeticalLabel.className = "qpm-editor-checkbox-label";
  alphabeticalLabel.style.width = "100%";
  alphabeticalLabel.append(
    alphabeticalInput,
    document.createTextNode("Vis alfabetisk (ordering = null)")
  );
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
  positionHint.textContent = `Aktuel placering i listen: ${currentPosition || "-"}`;
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
  applyBtn.textContent = "Gem emnefelter";
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "qpm-editor-btn qpm-editor-btn-danger qpm-editor-tree-delete-inline";
  deleteBtn.dataset.id = item?.id || "";
  deleteBtn.dataset.categoryId = categoryId;
  deleteBtn.textContent = "Slet underemne";

  wrapper.append(
    mkLabel("ID"),
    idInput,
    lockIdLabel,
    hiddenLabel,
    alphabeticalLabel,
    positionHint,
    mkLabel("Fast placering (ordering-tal)"),
    orderingInput,
    mkLabel("Navn (dk)"),
    dkInput,
    mkLabel("Navn (en)"),
    enInput,
    mkLabel("Narrow (én linje pr. søgestreng)"),
    narrow,
    mkLabel("Normal (én linje pr. søgestreng)"),
    normal,
    mkLabel("Broad (én linje pr. søgestreng)"),
    broad,
    mkLabel("Kommentar (dk)"),
    commentDk,
    mkLabel("Kommentar (en)"),
    commentEn,
    mkLabel("Tooltip (dk)"),
    tooltipDk,
    mkLabel("Tooltip (en)"),
    tooltipEn,
    applyBtn,
    deleteBtn
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
    const label =
      item?.translations?.dk ||
      item?.translations?.en ||
      item?.id ||
      "Ukendt";
    btn.textContent = `${item?.id || ""} - ${label}`;

    row.append(toggle, btn);
    li.appendChild(row);

    if (sortModeEnabled) {
      const dropzones = document.createElement("div");
      dropzones.className = "qpm-editor-dropzones";
      [
        ["before", "Slip før"],
        ["inside", "Slip som underemne"],
        ["after", "Slip efter"],
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
      li.appendChild(createInlineEditor(item, categoryId, index + 1, items.length));
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
  addBtn.textContent = "+ Tilføj underemne";
  addLi.appendChild(addBtn);
  ul.appendChild(addLi);

  container.appendChild(ul);
}

function refreshTopicTree() {
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

    const categoryLabel = topic?.translations?.dk || topic?.translations?.en || topic?.id || "Kategori";
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
        ["before", "Slip kategori før"],
        ["after", "Slip kategori efter"],
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
      topicTreeInput.appendChild(createCategoryInlineEditor(topic));
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
  addCategoryBtn.textContent = "+ Tilføj hovedkategori";
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
  if (!data || !Array.isArray(data.topics)) return { ok: false, error: "Ugyldig topics JSON." };

  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    return { ok: false, error: "Kategori ikke fundet." };
  }

  if (!sourceId || !targetId || sourceId === targetId) {
    return { ok: false, error: "Ugyldig flytning." };
  }

  const source = findItemById(category.groups, sourceId);
  if (!source) return { ok: false, error: "Kildeemne blev ikke fundet." };
  if (treeContainsItemId(source, targetId)) {
    return { ok: false, error: "Kan ikke flytte et emne ind i sig selv/underemne." };
  }

  const extracted = extractItemById(category.groups, sourceId);
  if (!extracted) return { ok: false, error: "Kunne ikke udtrække emnet." };

  let newParentId = category.id;
  let newSiblingIndex = 0;

  if (position === "inside") {
    const target = findItemById(category.groups, targetId);
    if (!target) return { ok: false, error: "Mål-emne blev ikke fundet." };
    target.children = Array.isArray(target.children) ? target.children : [];
    target.children.push(extracted);
    newParentId = target.id || category.id;
    newSiblingIndex = target.children.length - 1;
  } else {
    const targetLocation = findArrayAndIndexByItemId(category.groups, targetId);
    if (!targetLocation) return { ok: false, error: "Målplacering blev ikke fundet." };
    const insertAt = position === "before" ? targetLocation.index : targetLocation.index + 1;
    targetLocation.array.splice(insertAt, 0, extracted);
    newParentId = targetLocation.parentId || category.id;
    newSiblingIndex = insertAt;
  }

  const idLocked = extracted?.lockIdOnSort !== false;
  if (!idLocked) {
    const confirmIdChange = window.confirm(
      `Emnet "${sourceId}" har ulåst ID. Vil du opdatere ID automatisk ud fra den nye placering?`
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
    return { ok: false, error: "Ugyldig topics JSON." };
  }
  if (!sourceCategoryId || !targetCategoryId || sourceCategoryId === targetCategoryId) {
    return { ok: false, error: "Ugyldig kategori-flytning." };
  }

  const sourceIndex = data.topics.findIndex((t) => t?.id === sourceCategoryId);
  if (sourceIndex < 0) return { ok: false, error: "Kilde-kategori blev ikke fundet." };
  const [movedCategory] = data.topics.splice(sourceIndex, 1);

  const targetIndex = data.topics.findIndex((t) => t?.id === targetCategoryId);
  if (targetIndex < 0) return { ok: false, error: "Mål-kategori blev ikke fundet." };

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
    return { ok: false, error: "Ugyldig topics JSON." };
  }
  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    return { ok: false, error: "Kategori findes ikke." };
  }
  const removed = extractItemById(category.groups, itemId);
  if (!removed) {
    return { ok: false, error: "Underemne blev ikke fundet." };
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
    return { ok: false, error: "Ugyldig topics JSON." };
  }
  const idx = data.topics.findIndex((t) => t?.id === categoryId);
  if (idx < 0) {
    return { ok: false, error: "Hovedkategori blev ikke fundet." };
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
    return { ok: false, error: "Ugyldig topics JSON." };
  }

  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    return { ok: false, error: "Kategori findes ikke." };
  }

  let targetArray = category.groups;
  let parentId = category.id;
  if (parentItemId) {
    const parentItem = findItemById(category.groups, parentItemId);
    if (!parentItem) {
      return { ok: false, error: "Forældre-emne blev ikke fundet." };
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
    return { ok: false, error: "Ugyldig topics JSON." };
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
    setStatus("Kan ikke opdatere: JSON for topics er ugyldig.", true);
    return;
  }
  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category || !Array.isArray(category.groups)) {
    setStatus("Kategori findes ikke i den aktuelle JSON.", true);
    return;
  }
  const item = findItemById(category.groups, itemId);
  if (!item) {
    setStatus("Valgt emne blev ikke fundet.", true);
    return;
  }

  const get = (field) => container.querySelector(`[data-inline-field="${field}"]`);
  const requestedId = (get("id")?.value || "").trim();
  if (!requestedId) {
    setStatus("ID må ikke være tom.", true);
    return;
  }
  if (requestedId !== itemId && idExistsInCategory(category, requestedId, itemId)) {
    setStatus(`ID "${requestedId}" findes allerede i kategorien.`, true);
    return;
  }
  if (requestedId !== itemId) {
    const oldId = item.id;
    item.id = requestedId;
    updateChildIdsByPrefix(item, oldId, requestedId);
  }
  const lockIdCheckbox = get("lockIdOnSort");
  item.lockIdOnSort = lockIdCheckbox ? Boolean(lockIdCheckbox.checked) : true;
  const hiddenCheckbox = get("hiddenByDefault");
  item.hiddenByDefault = hiddenCheckbox ? Boolean(hiddenCheckbox.checked) : false;
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
    item.ordering = {
      ...(item.ordering || {}),
      dk: fixedOrdering,
      en: fixedOrdering,
    };
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

  updateJson(data);
  selectedTopicCategoryId = categoryId;
  selectedTopicItemId = item.id || itemId;
  setStatus(`Ændringer gemt lokalt i editor for emne "${selectedTopicItemId}". Klik "Gem" for at skrive til fil.`);
}

function applyCategoryInlineEdits(categoryId, container) {
  const data = parseCurrentJson();
  if (!data || !Array.isArray(data.topics)) {
    setStatus("Kan ikke opdatere: JSON for topics er ugyldig.", true);
    return;
  }
  const category = data.topics.find((t) => t?.id === categoryId);
  if (!category) {
    setStatus("Hovedkategori blev ikke fundet.", true);
    return;
  }
  const get = (field) => container.querySelector(`[data-inline-field="${field}"]`);
  const nextId = (get("category.id")?.value || "").trim();
  if (!nextId) {
    setStatus("Hovedkategori-ID må ikke være tom.", true);
    return;
  }
  const idTaken = data.topics.some((t) => t?.id === nextId && t?.id !== categoryId);
  if (idTaken) {
    setStatus(`Kategori-ID "${nextId}" findes allerede.`, true);
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
  }

  updateJson(data);
  selectedTopicCategoryId = category.id;
  selectedTopicItemId = "";
  setStatus(`Hovedkategori "${category.id}" opdateret. Klik "Gem" for at skrive til fil.`);
}

if (typeInput instanceof HTMLSelectElement && !filtersEnabled) {
  const filtersOption = typeInput.querySelector('option[value="filters"]');
  if (filtersOption) filtersOption.remove();
  typeInput.value = "topics";
}

domainInput.value = defaultDomain;
syncDomainOptions();
syncTypeOptionsVisibility();
syncFormByType();
setActiveTopicLabel(configuredTopicDomains[0] || defaultDomain || "");

if (isRemoteApiBlockedInLocal) {
  lockEditorForSafety(
    `Sikkerhedsblokering aktiv: apiBase "${apiBase}" er ikke lokal. Brug lokal PHP API for at undgå gem på eksternt miljø.`
  );
}

loginBtn?.addEventListener("click", login);
typeInput?.addEventListener("change", async () => {
  syncFormByType();
  selectedTopicCategoryId = "";
  selectedTopicItemId = "";
  await loadContent();
});
domainInput?.addEventListener("change", async () => {
  if (getSelectedType() !== "topics") return;
  selectedTopicCategoryId = "";
  selectedTopicItemId = "";
  await loadContent();
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
saveBtn?.addEventListener("click", saveContent);
logoutBtn?.addEventListener("click", logout);
toggleJsonBtn?.addEventListener("click", () => {
  if (!jsonInput) return;
  const isHidden = jsonInput.classList.toggle("qpm-editor-hidden");
  if (toggleJsonBtn) {
    toggleJsonBtn.textContent = isHidden ? "Vis rå JSON" : "Skjul rå JSON";
  }
});
treeSearchInput?.addEventListener("input", () => {
  treeSearchText = (treeSearchInput.value || "").trim().toLowerCase();
  refreshTopicTree();
});
sortModeInput?.addEventListener("change", () => {
  sortModeEnabled = Boolean(sortModeInput.checked);
  refreshTopicTree();
});
expandAllBtn?.addEventListener("click", () => {
  collapsedCategoryIds.clear();
  collapsedTopicIds.clear();
  refreshTopicTree();
});
collapseAllBtn?.addEventListener("click", () => {
  const data = parseCurrentJson();
  collapsedCategoryIds.clear();
  collapsedTopicIds.clear();
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
      setStatus(result.error || "Kunne ikke tilføje hovedkategori.", true);
      return;
    }
    setStatus(
      `Ny hovedkategori "${result.categoryId}" oprettet nederst. Klik "Gem" for at skrive til fil.`
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
      setStatus(result.error || "Kunne ikke tilføje emne.", true);
      return;
    }
    const typeLabel = parentItemId ? "underemne" : "emne";
    setStatus(`Nyt ${typeLabel} "${result.itemId}" oprettet nederst. Klik "Gem" for at skrive til fil.`);
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
    const ok = window.confirm(`Vil du slette underemnet "${itemId}"?`);
    if (!ok) return;
    const result = deleteTopicItem(categoryId, itemId);
    if (!result.ok) {
      setStatus(result.error || "Sletning mislykkedes.", true);
      return;
    }
    setStatus(`Underemne "${itemId}" er slettet. Klik "Gem" for at skrive til fil.`);
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
    const ok = window.confirm(`Vil du slette hovedkategorien "${categoryId}"?`);
    if (!ok) return;
    const result = deleteCategory(categoryId);
    if (!result.ok) {
      setStatus(result.error || "Sletning mislykkedes.", true);
      return;
    }
    setStatus(`Hovedkategori "${categoryId}" er slettet. Klik "Gem" for at skrive til fil.`);
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

  let result = { ok: false, error: "Flytning mislykkedes." };
  if (scope === "category") {
    const sourceCategoryId = draggedCategoryId || event.dataTransfer?.getData("text/plain") || "";
    const targetCategoryId = (target.dataset.targetCategoryId || "").trim();
    if (!sourceCategoryId || !targetCategoryId) return;
    result = moveCategoryByDrop(sourceCategoryId, targetCategoryId, position);
    if (result.ok) {
      setStatus(`Hovedkategori "${sourceCategoryId}" flyttet (${position}).`);
      refreshTopicTree();
    }
  } else {
    const sourceId = draggedTopicItemId || event.dataTransfer?.getData("text/plain") || "";
    const targetId = (target.dataset.targetId || "").trim();
    const categoryId = (target.dataset.categoryId || "").trim();
    if (!sourceId || !targetId || !categoryId) return;
    result = moveTopicItemByDrop(categoryId, sourceId, targetId, position);
    if (result.ok) {
      setStatus(`Emne "${sourceId}" flyttet (${position}).`);
      refreshTopicTree();
    }
  }
  if (!result.ok) {
    setStatus(result.error || "Flytning mislykkedes.", true);
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
