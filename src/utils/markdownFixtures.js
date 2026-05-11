export const markdownHardeningFixtures = [
  {
    id: "basic-formatting",
    markdown: [
      "Kort resume med **fed tekst**, *kursiv tekst* og ~~gennemstreget tekst~~.",
      "",
      "- Punkt et",
      "- Punkt to",
      "1. Første trin",
      "2. Andet trin",
    ].join("\n"),
  },
  {
    id: "tables-and-tasks",
    markdown: [
      "| Kilde | Resultat |",
      "|---|---|",
      "| PubMed | 42 |",
      "| OpenAlex | 17 |",
      "",
      "- [x] Valideret",
      "- [ ] Afventer bruger",
    ].join("\n"),
  },
  {
    id: "links-and-code",
    markdown: [
      "Se [PubMed](https://pubmed.ncbi.nlm.nih.gov/) eller kontakt [support](mailto:test@example.com).",
      "",
      "`inline code`",
      "",
      "```json",
      '{"ok": true}',
      "```",
    ].join("\n"),
  },
  {
    id: "xss-payloads",
    markdown: [
      "<script>alert('x')</script>",
      "<img src=x onerror=alert('x')>",
      "[bad](javascript:alert('x'))",
      "[good](https://example.com)",
    ].join("\n"),
  },
];
