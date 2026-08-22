import { normalizeDoiValue, normalizePmidValue } from "./resultAdapters.js";

const TOKEN_RE = /\[\[([^\]]+)\]\]/g;

function asText(value) {
  return String(value ?? "").trim();
}

function getAuthorParts(article) {
  const authorsRaw =
    article?.authors ||
    article?.Authors ||
    article?.AuthorList ||
    article?.authorList ||
    "";
  if (Array.isArray(authorsRaw) && authorsRaw.length > 0) {
    return authorsRaw.map((author) => asText(author?.name || author)).filter(Boolean);
  }
  if (typeof authorsRaw === "string" && authorsRaw.trim()) {
    return authorsRaw.split(",").map((author) => author.trim()).filter(Boolean);
  }
  return [];
}

function getYear(article) {
  const raw =
    article?.pubdate ||
    article?.PubDate ||
    article?.pubDate ||
    article?.PublicationDate ||
    article?.publicationDate ||
    "";
  const match = String(raw).match(/^\d{4}/);
  return match ? match[0] : "";
}

function getLastName(authorPart) {
  return asText(authorPart).replace(/\s+[A-Z]{1,3}\.?$/, "").trim();
}

function getPmid(article) {
  return (
    normalizePmidValue(article?.PMID || article?.pmid || "") ||
    normalizePmidValue(article?.uid || "")
  );
}

function getDoi(article) {
  return normalizeDoiValue(article?.DOI || article?.doi || "");
}

export function getArticleCiteHref(article) {
  const pmid = getPmid(article);
  if (pmid) return pmid;
  const doi = getDoi(article);
  if (doi) return doi;
  const explicit = asText(article?.ReferenceId || article?.referenceId);
  if (explicit) {
    return normalizePmidValue(explicit) || normalizeDoiValue(explicit) || explicit;
  }
  return asText(article?.id || article?.uid);
}

export function getArticleCiteLabel(article, index = 0, citeKey = "") {
  const parts = getAuthorParts(article);
  const year = getYear(article);
  const lastName = parts.length ? getLastName(parts[0]) : "";
  if (lastName && year) {
    return parts.length > 1 ? `${lastName} et al., ${year}` : `${lastName}, ${year}`;
  }
  const title = asText(article?.Title || article?.title);
  if (title) {
    return title.length > 40 ? `${title.slice(0, 37).trim()}…` : title;
  }
  return citeKey || `R${index + 1}`;
}

export function getArticlePromptFields(article) {
  const parts = getAuthorParts(article);
  return {
    title: asText(article?.Title || article?.title),
    authorsStr: parts.join(", "),
    source: asText(article?.Source || article?.source || article?.fulljournalname),
    pmid: getPmid(article),
    doi: getDoi(article),
    abstract: asText(article?.Abstract || article?.abstract),
  };
}

export function buildCitationMap(articles) {
  const list = Array.isArray(articles) ? articles : [];
  return list.map((article, index) => {
    const citeKey = `R${index + 1}`;
    return {
      citeKey,
      href: getArticleCiteHref(article),
      label: getArticleCiteLabel(article, index, citeKey),
      pmid: getPmid(article),
      doi: getDoi(article),
      id: asText(article?.id || article?.uid),
    };
  });
}

function normalizeLookupKey(value) {
  return asText(value).toLowerCase();
}

export function indexCitationMap(entries) {
  const index = new Map();
  const add = (key, entry) => {
    const normalized = normalizeLookupKey(key);
    if (!normalized || index.has(normalized)) return;
    index.set(normalized, entry);
  };
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    add(entry.citeKey, entry);
    if (/^R\d+$/i.test(String(entry.citeKey || ""))) {
      add(String(entry.citeKey).slice(1), entry);
    }
    add(entry.pmid, entry);
    add(entry.doi, entry);
    add(entry.href, entry);
    add(entry.id, entry);
  });
  return index;
}

export function lookupCitation(entriesOrIndex, rawKey) {
  const index =
    entriesOrIndex instanceof Map ? entriesOrIndex : indexCitationMap(entriesOrIndex);
  return index.get(normalizeLookupKey(rawKey)) || null;
}

export function stripIncompleteCitationTail(text) {
  return String(text || "")
    .replace(/\[\[[^\]]*$/, "")
    .replace(/\[[^\]]*\]\([^)]*$/, "");
}

export function formatArticlesPromptBlock(articles, citationMap) {
  const list = Array.isArray(articles) ? articles : [];
  const map = Array.isArray(citationMap) && citationMap.length > 0 ? citationMap : [];
  const includeCiteKeys = map.length > 0;
  let out = `\n\n## ARTICLES TO SUMMARIZE (${list.length}) ##\n`;
  list.forEach((article, index) => {
    const entry = (includeCiteKeys ? map[index] : null) || buildCitationMap([article])[0];
    const fields = getArticlePromptFields(article);
    const num = index + 1;
    out += `\n--- Article ${num} ---\n`;
    if (includeCiteKeys) {
      out += `Cite key: ${entry.citeKey}\n`;
    }
    out += `Title: ${fields.title}\n`;
    out += `Authors: ${fields.authorsStr}\n`;
    out += `Source: ${fields.source}\n`;
    out += `Reference: ${entry.label}\n`;
    out += `PMID: ${fields.pmid}\n`;
    out += `DOI: ${fields.doi}\n`;
    out += `Abstract:\n${fields.abstract}\n`;
  });
  return out;
}

function createCitationAnchor(entry, title) {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", `#${encodeURIComponent(entry.href)}`);
  if (title) {
    anchor.setAttribute("title", title);
  }
  anchor.textContent = entry.label;
  return anchor;
}

function replaceTokensInTextNode(node, index, title) {
  const text = node.nodeValue || "";
  if (!text.includes("[[") && !/\[.*\]\([^)]*$/.test(text)) {
    const stripped = stripIncompleteCitationTail(text);
    if (stripped !== text) {
      node.nodeValue = stripped;
    }
    return;
  }

  TOKEN_RE.lastIndex = 0;
  const parts = [];
  let lastIndex = 0;
  let match = TOKEN_RE.exec(text);
  while (match) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const entry = lookupCitation(index, match[1]);
    if (entry?.href) {
      parts.push({ type: "cite", entry });
    } else {
      parts.push({ type: "text", value: asText(match[1]) });
    }
    lastIndex = match.index + match[0].length;
    match = TOKEN_RE.exec(text);
  }
  const tail = stripIncompleteCitationTail(text.slice(lastIndex));
  if (tail) {
    parts.push({ type: "text", value: tail });
  }

  if (parts.length === 1 && parts[0].type === "text" && parts[0].value === text) {
    return;
  }

  const fragment = document.createDocumentFragment();
  parts.forEach((part) => {
    if (part.type === "cite") {
      fragment.appendChild(createCitationAnchor(part.entry, title));
    } else {
      fragment.appendChild(document.createTextNode(part.value));
    }
  });
  node.parentNode?.replaceChild(fragment, node);
}

function walkTextNodes(root, index, title) {
  const nodes = [];
  const iterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
  let current = iterator.nextNode();
  while (current) {
    nodes.push(current);
    current = iterator.nextNode();
  }
  nodes.forEach((node) => replaceTokensInTextNode(node, index, title));
}

function normalizeHashLinks(root, index, title) {
  Array.from(root.querySelectorAll('a[href^="#"]')).forEach((anchor) => {
    let key = asText(anchor.getAttribute("href")).slice(1);
    try {
      key = decodeURIComponent(key);
    } catch {
      // Keep raw key if decoding fails.
    }
    const entry = lookupCitation(index, key);
    if (!entry?.href) {
      const text = document.createTextNode(anchor.textContent || "");
      anchor.parentNode?.replaceChild(text, anchor);
      return;
    }
    anchor.setAttribute("href", `#${encodeURIComponent(entry.href)}`);
    if (title) {
      anchor.setAttribute("title", title);
    }
  });
}

export function rewriteRenderedSummaryHtml(html, entries, title = "") {
  const source = String(html || "");
  const list = Array.isArray(entries) ? entries : [];
  if (!source || typeof document === "undefined") {
    return source;
  }
  if (list.length === 0) {
    return source;
  }

  const index = indexCitationMap(list);
  const container = document.createElement("div");
  container.innerHTML = source;
  walkTextNodes(container, index, title);
  normalizeHashLinks(container, index, title);
  return container.innerHTML;
}
