function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function normalizeTranslations(translations = {}) {
  return {
    dk: normalizeText(translations?.dk),
    en: normalizeText(translations?.en),
  };
}

function normalizeTopicNode(node = {}) {
  const normalized = {
    ...node,
    id: normalizeText(node?.id),
    translations: normalizeTranslations(node?.translations),
  };
  delete normalized.name;
  delete normalized.groupname;

  const children = Array.isArray(node?.children) ? node.children : [];
  if (children.length > 0) {
    normalized.children = children.map(normalizeTopicNode);
  } else {
    delete normalized.children;
  }
  return normalized;
}

function normalizeFilterChoiceNode(node = {}) {
  const normalized = {
    ...node,
    id: normalizeText(node?.id),
    translations: normalizeTranslations(node?.translations),
  };
  delete normalized.name;
  delete normalized.groupname;

  const children = Array.isArray(node?.children)
    ? node.children
    : Array.isArray(node?.choices)
      ? node.choices
      : [];
  if (children.length > 0) {
    normalized.children = children.map(normalizeFilterChoiceNode);
  } else {
    delete normalized.children;
  }
  delete normalized.choices;
  return normalized;
}

export function normalizeTopicsList(topics = []) {
  if (!Array.isArray(topics)) return [];
  return topics.map((topic) => {
    const normalized = {
      ...topic,
      id: normalizeText(topic?.id),
      translations: normalizeTranslations(topic?.translations),
    };
    delete normalized.groupname;
    delete normalized.name;

    const groups = Array.isArray(topic?.groups) ? topic.groups : [];
    normalized.groups = groups.map(normalizeTopicNode);
    return normalized;
  });
}

export function normalizeFiltersList(filters = []) {
  if (!Array.isArray(filters)) return [];
  return filters.map((filter) => {
    const normalized = {
      ...filter,
      id: normalizeText(filter?.id),
      translations: normalizeTranslations(filter?.translations),
    };
    delete normalized.name;
    delete normalized.groupname;

    const choices = Array.isArray(filter?.choices) ? filter.choices : [];
    normalized.choices = choices.map(normalizeFilterChoiceNode);
    return normalized;
  });
}

