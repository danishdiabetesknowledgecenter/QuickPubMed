// Run: node scripts/summary-citations-smoke-test.js

import {
  buildCitationMap,
  formatArticlesPromptBlock,
  lookupCitation,
  rewriteRenderedSummaryHtml,
  stripIncompleteCitationTail,
} from "../src/utils/summaryCitations.js";

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const articles = [
  {
    id: "doi:10.1000/foo",
    pmid: "39847211",
    doi: "10.1000/foo",
    title: "First study",
    authors: [{ name: "Liu W" }, { name: "Chen Y" }],
    pubdate: "2022 Mar 12",
    abstract: "Abstract one",
  },
  {
    id: "oa:W123",
    doi: "10.1038/s41591-023-02456-x",
    title: "Second study without pmid",
    authors: "Roy T, Lloyd C",
    pubdate: "2012",
    abstract: "Abstract two",
  },
  {
    id: "custom-3",
    title: "A very long title that should be shortened for the visible citation label",
    abstract: "Abstract three",
  },
];

const map = buildCitationMap(articles);
assertTrue(map.length === 3, "Map has one entry per article");
assertTrue(map[0].citeKey === "R1" && map[0].href === "39847211", "R1 uses PMID");
assertTrue(map[0].label === "Liu et al., 2022", "R1 uses APA label");
assertTrue(map[1].citeKey === "R2" && map[1].href === "10.1038/s41591-023-02456-x", "R2 uses DOI");
assertTrue(map[1].label === "Roy et al., 2012", "R2 parses string authors");
assertTrue(map[2].citeKey === "R3" && map[2].href === "custom-3", "R3 falls back to id");
assertTrue(map[2].label.endsWith("…"), "R3 falls back to shortened title");

assertTrue(lookupCitation(map, "R1") === map[0], "Lookup by cite key");
assertTrue(lookupCitation(map, "1") === map[0], "Lookup by article number");
assertTrue(lookupCitation(map, "39847211") === map[0], "Lookup by PMID");
assertTrue(lookupCitation(map, "10.1038/s41591-023-02456-x") === map[1], "Lookup by DOI");
assertTrue(lookupCitation(map, "R99") === null, "Unknown key is null");

assertTrue(
  stripIncompleteCitationTail("text [[R1") === "text ",
  "Incomplete token is stripped"
);
assertTrue(
  stripIncompleteCitationTail("text [Liu et al., 2022](#39847") === "text ",
  "Incomplete markdown link is stripped"
);
assertTrue(
  stripIncompleteCitationTail("text [[R1]] more") === "text [[R1]] more",
  "Complete token is kept"
);

const promptBlock = formatArticlesPromptBlock(articles, map);
assertTrue(promptBlock.includes("Cite key: R1"), "Prompt includes R1");
assertTrue(promptBlock.includes("Cite key: R2"), "Prompt includes R2");
assertTrue(!promptBlock.includes("Reference ID:"), "Prompt does not ask for Reference ID");
assertTrue(
  !formatArticlesPromptBlock(articles).includes("Cite key:"),
  "Single-article prompt omits cite keys"
);
assertTrue(
  rewriteRenderedSummaryHtml("<p>[[R1]]</p>", map, "Scroll") === "<p>[[R1]]</p>",
  "Rewrite is a no-op without a DOM"
);

console.log("summary-citations-smoke-test: ok");
