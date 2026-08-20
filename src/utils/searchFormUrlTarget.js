/**
 * Resolves which SearchForm instance on a page should consume/write shared URL
 * search params. Instances are identified by data-component-no.
 * `component=1,2` (or repeated component=) can target several instances at once.
 */

let sharedSearchFormUrlOwnerNo = null;

function normalizeMountedComponentNos(mountedComponentNos, fallbackNo = 1) {
  const mounted =
    Array.isArray(mountedComponentNos) && mountedComponentNos.length > 0
      ? mountedComponentNos.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [];
  return mounted.length > 0 ? mounted : [Number(fallbackNo) || 1];
}

export function getUrlParamCaseInsensitive(urlParams, name) {
  if (!urlParams || typeof urlParams.forEach !== "function") return "";
  const wanted = String(name || "").toLowerCase();
  let found = "";
  urlParams.forEach((value, key) => {
    if (String(key).replace(/^amp;/i, "").toLowerCase() === wanted) {
      found = String(value ?? "");
    }
  });
  return found;
}

export function parseComponentUrlParamList(urlParams) {
  if (!urlParams || typeof urlParams.forEach !== "function") return [];
  const wanted = "component";
  const chunks = [];
  urlParams.forEach((value, key) => {
    if (String(key).replace(/^amp;/i, "").toLowerCase() === wanted) {
      chunks.push(String(value ?? ""));
    }
  });
  const numbers = [];
  chunks
    .join(",")
    .split(/,|;;/)
    .map((token) => token.trim())
    .filter(Boolean)
    .forEach((token) => {
      const parsed = Number(token);
      if (Number.isFinite(parsed) && !numbers.includes(parsed)) {
        numbers.push(parsed);
      }
    });
  return numbers;
}

export function parseComponentUrlParam(urlParams) {
  const list = parseComponentUrlParamList(urlParams);
  return list.length > 0 ? list[0] : null;
}

export function readMountedSearchFormComponentNumbers(
  doc = typeof document !== "undefined" ? document : null
) {
  if (!doc || typeof doc.querySelectorAll !== "function") return [1];
  const nodes = doc.querySelectorAll(".mugin-searchform, .searchform");
  if (!nodes.length) return [1];
  const numbers = [];
  nodes.forEach((el, index) => {
    const raw = el.getAttribute("data-component-no");
    const parsed = raw != null && String(raw).trim() !== "" ? Number(raw) : NaN;
    numbers.push(Number.isFinite(parsed) ? parsed : index + 1);
  });
  return numbers;
}

export function resolveUrlTargetComponentNos(urlParams, mountedComponentNos) {
  const mounted = normalizeMountedComponentNos(mountedComponentNos);
  const requested = parseComponentUrlParamList(urlParams).filter((value) => mounted.includes(value));
  return requested.length > 0 ? requested : [Math.min(...mounted)];
}

export function resolveUrlTargetComponentNo(urlParams, mountedComponentNos) {
  return Math.min(...resolveUrlTargetComponentNos(urlParams, mountedComponentNos));
}

export function isUrlTargetedSearchFormComponent(componentNo, urlParams, mountedComponentNos) {
  return resolveUrlTargetComponentNos(urlParams, mountedComponentNos).includes(Number(componentNo));
}

export function resolveInstanceCurrentDomain({
  instanceDomain,
  componentNo = 1,
  urlDomainOverride = null,
  urlParams,
  mountedComponentNos,
  fallbackDomain = "",
} = {}) {
  const isUrlTarget = isUrlTargetedSearchFormComponent(
    componentNo,
    urlParams,
    mountedComponentNos
  );
  if (isUrlTarget && urlDomainOverride !== null) {
    return urlDomainOverride;
  }
  return instanceDomain !== null ? instanceDomain : fallbackDomain;
}

export function getComponentUrlParamValue(componentNo, urlParams, mountedComponentNos) {
  const mounted = normalizeMountedComponentNos(mountedComponentNos, componentNo);
  const lowest = Math.min(...mounted);
  const writer = Number(componentNo);
  const requestedMounted = parseComponentUrlParamList(urlParams).filter((value) =>
    mounted.includes(value)
  );
  const targets = requestedMounted.length > 0 && requestedMounted.includes(writer)
    ? requestedMounted
    : [writer];
  const uniqueSorted = [...new Set(targets)].sort((left, right) => left - right);
  if (uniqueSorted.length === 1 && uniqueSorted[0] === lowest) {
    return "";
  }
  return uniqueSorted.join(",");
}

export function shouldWriteComponentUrlParam(componentNo, mountedComponentNos, urlParams) {
  return getComponentUrlParamValue(componentNo, urlParams, mountedComponentNos) !== "";
}

export function claimSharedSearchFormUrl(componentNo) {
  sharedSearchFormUrlOwnerNo = Number(componentNo);
}

export function isSharedSearchFormUrlOwner(componentNo) {
  return sharedSearchFormUrlOwnerNo === Number(componentNo);
}
