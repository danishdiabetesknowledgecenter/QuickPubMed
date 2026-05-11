const DEFAULT_ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "EM",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HR",
  "I",
  "LI",
  "OL",
  "P",
  "PRE",
  "S",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "U",
  "UL",
]);

const DEFAULT_ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

export function sanitizeHtml(rawValue, options = {}) {
  const rawHtml = typeof rawValue === "string" ? rawValue : "";
  if (!rawHtml || typeof document === "undefined") return rawHtml;

  const allowedTags = options.allowedTags || DEFAULT_ALLOWED_TAGS;
  const container = document.createElement("div");
  container.innerHTML = rawHtml;

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return;

    if (node.nodeType !== Node.ELEMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    const tagName = node.tagName.toUpperCase();
    if (!allowedTags.has(tagName)) {
      const parent = node.parentNode;
      if (!parent) return;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      return;
    }

    Array.from(node.attributes || []).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (tagName === "A") {
        if (name === "href") {
          const hrefValue = String(attribute.value || "").trim();
          try {
            const parsed = new URL(hrefValue, window.location.origin);
            if (!DEFAULT_ALLOWED_SCHEMES.has(parsed.protocol)) {
              node.removeAttribute(attribute.name);
            }
          } catch (_) {
            node.removeAttribute(attribute.name);
          }
          return;
        }
        if (name === "title") return;
        if (name === "target" || name === "rel") return;
      }
      node.removeAttribute(attribute.name);
    });

    if (tagName === "A") {
      if (node.hasAttribute("href")) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      } else {
        node.removeAttribute("target");
        node.removeAttribute("rel");
      }
    }

    Array.from(node.childNodes).forEach(sanitizeNode);
  };

  Array.from(container.childNodes).forEach(sanitizeNode);
  return container.innerHTML;
}
