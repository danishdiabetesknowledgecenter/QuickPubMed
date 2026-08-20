import {
  getComponentUrlParamValue,
  getUrlParamCaseInsensitive,
  isUrlTargetedSearchFormComponent,
  parseComponentUrlParam,
  parseComponentUrlParamList,
  resolveInstanceCurrentDomain,
  resolveUrlTargetComponentNo,
  shouldWriteComponentUrlParam,
} from "../src/utils/searchFormUrlTarget.js";

let failures = 0;
function assert(condition, message) {
  if (condition) {
    console.log(`OK  ${message}`);
    return;
  }
  failures += 1;
  console.log(`FAIL ${message}`);
}

assert(
  getUrlParamCaseInsensitive(new URLSearchParams("topic=x&Component=2"), "component") === "2",
  "component key is case-insensitive"
);
assert(parseComponentUrlParam(new URLSearchParams("qpubmed=ibuprofen")) === null, "missing component is null");
assert(parseComponentUrlParam(new URLSearchParams("component=foo")) === null, "non-numeric component is null");
assert(
  resolveUrlTargetComponentNo(new URLSearchParams("topic=x"), [1, 2]) === 1,
  "missing component targets the lowest number"
);
assert(
  resolveUrlTargetComponentNo(new URLSearchParams("component=2&qpubmed=ibuprofen"), [1, 2]) === 2,
  "component=2 targets instance 2"
);
assert(
  resolveUrlTargetComponentNo(new URLSearchParams("component=9"), [1, 2]) === 1,
  "unknown component number falls back to the lowest"
);
assert(shouldWriteComponentUrlParam(1, [1, 2]) === false, "lowest instance omits component from the URL");
assert(shouldWriteComponentUrlParam(2, [1, 2]) === true, "non-lowest instance writes component");
assert(shouldWriteComponentUrlParam(1, [1]) === false, "single instance omits component");

const sharedUrlWithDomain = new URLSearchParams("domain=template");
assert(
  resolveInstanceCurrentDomain({
    instanceDomain: "",
    componentNo: 2,
    urlDomainOverride: "template",
    urlParams: sharedUrlWithDomain,
    mountedComponentNos: [1, 2],
    fallbackDomain: "template",
  }) === "",
  "non-target instance keeps empty data-domain when URL has domain="
);
assert(
  resolveInstanceCurrentDomain({
    instanceDomain: "template",
    componentNo: 1,
    urlDomainOverride: "template",
    urlParams: sharedUrlWithDomain,
    mountedComponentNos: [1, 2],
    fallbackDomain: "template",
  }) === "template",
  "target instance applies URL domain="
);
assert(
  resolveInstanceCurrentDomain({
    instanceDomain: "",
    componentNo: 2,
    urlDomainOverride: "template",
    urlParams: new URLSearchParams("component=2&domain=template"),
    mountedComponentNos: [1, 2],
    fallbackDomain: "diabetes",
  }) === "template",
  "component=2 applies URL domain= to instance 2"
);
assert(
  isUrlTargetedSearchFormComponent(1, new URLSearchParams("ai=false&databases=pubmed"), [1, 2]) === true,
  "search params without component target the lowest instance"
);
assert(
  isUrlTargetedSearchFormComponent(2, new URLSearchParams("ai=false&databases=pubmed"), [1, 2]) === false,
  "search params without component do not target a higher instance"
);
assert(
  isUrlTargetedSearchFormComponent(2, new URLSearchParams("component=2&nocache=1"), [1, 2]) === true,
  "component=2 makes instance 2 the sole URL target"
);
assert(
  isUrlTargetedSearchFormComponent(1, new URLSearchParams("component=2&nocache=1"), [1, 2]) === false,
  "component=2 does not target instance 1"
);
assert(
  JSON.stringify(parseComponentUrlParamList(new URLSearchParams("component=1,2"))) === "[1,2]",
  "component=1,2 parses as a list"
);
assert(
  JSON.stringify(parseComponentUrlParamList(new URLSearchParams("component=1&component=2"))) ===
    "[1,2]",
  "repeated component= values are collected"
);
assert(
  isUrlTargetedSearchFormComponent(1, new URLSearchParams("component=1,2"), [1, 2]) === true &&
    isUrlTargetedSearchFormComponent(2, new URLSearchParams("component=1,2"), [1, 2]) === true,
  "component=1,2 targets both mounted instances"
);
assert(
  isUrlTargetedSearchFormComponent(3, new URLSearchParams("component=1,2"), [1, 2, 3]) === false,
  "component=1,2 does not target an unlisted instance"
);
assert(
  getComponentUrlParamValue(1, new URLSearchParams("component=1,2"), [1, 2]) === "1,2",
  "shared multi-target URL keeps component=1,2 when the lowest instance writes"
);
assert(
  getComponentUrlParamValue(2, new URLSearchParams("component=1,2"), [1, 2]) === "1,2",
  "shared multi-target URL keeps component=1,2 when instance 2 writes"
);
assert(
  resolveInstanceCurrentDomain({
    instanceDomain: "",
    componentNo: 2,
    urlDomainOverride: "template",
    urlParams: new URLSearchParams("component=1,2&domain=template"),
    mountedComponentNos: [1, 2],
    fallbackDomain: "diabetes",
  }) === "template",
  "component=1,2 applies URL domain= to instance 2"
);

if (failures > 0) {
  process.exit(1);
}
