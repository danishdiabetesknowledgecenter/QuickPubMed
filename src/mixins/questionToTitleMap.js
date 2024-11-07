/**
 * Mixin for the default question-to-title mappings in Danish and English.
 *
 * @mixin
 */
const questionsToTitleMap = {
  data() {
    return {
      /**
       * Map of Danish questions to their shortened titles.
       * @type {Object.<string, string>}
       */
      questionShortenMapDanish: {
        "Lav en kort opsummering baseret på artiklens samlede tekst.": "Resumé",
        "Hvad er formålet med denne artikel?": "Formål",
        "Hvilke metoder blev anvendt?": "Metoder",
        "Hvad er resultaterne?": "Resultater",
        "Hvilke konklusioner drages i artiklen?": "Konklusioner",
        "Hvilke styrker og svagheder er der i studiet?": "Styrker og svagheder",
        "Hvilke mulige interessekonflikter har forfatterne til studiet?":
          "Interessekonflikter",
      },
      /**
       * Map of English questions to their shortened titles.
       * @type {Object.<string, string>}
       */
      questionShortenMapEnglish: {
        "Make a short summary based on the article's overall text.": "Summary",
        "What is the purpose of this article?": "Purpose",
        "What methods were used?": "Methods",
        "What are the results?": "Results",
        "What conclusions are drawn in the article?": "Conclusions",
        "What are the strengths and weaknesses of the study?":
          "Strengths and weaknesses",
        "What possible conflicts of interest do the authors of the study have?":
          "Conflicts of interest",
      },
    };
  },
};
