import { sanitizePrompt } from "@/utils/promptsHelpers.js";

const semanticIntentResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "semanticIntent",
    "hardFilterHints",
    "softFilterHints",
    "sourceSpecificHints",
    "sourceQueryPlan",
  ],
  properties: {
    semanticIntent: {
      type: "string",
    },
    hardFilterHints: {
      type: "object",
      additionalProperties: false,
      required: ["publicationType", "studyDesign", "ageGroup", "language", "sourceFormat"],
      properties: {
        publicationType: { type: "array", items: { type: "string" } },
        studyDesign: { type: "array", items: { type: "string" } },
        ageGroup: { type: "array", items: { type: "string" } },
        language: { type: "array", items: { type: "string" } },
        sourceFormat: { type: "array", items: { type: "string" } },
      },
    },
    softFilterHints: {
      type: "array",
      items: { type: "string" },
    },
    sourceSpecificHints: {
      type: "object",
      additionalProperties: false,
      required: ["semanticScholar", "openAlex", "elicit"],
      properties: {
        semanticScholar: { type: "array", items: { type: "string" } },
        openAlex: { type: "array", items: { type: "string" } },
        elicit: { type: "array", items: { type: "string" } },
      },
    },
    sourceQueryPlan: {
      type: "object",
      additionalProperties: false,
      required: ["semanticScholar", "openAlex", "elicit"],
      properties: {
        semanticScholar: {
          type: "object",
          additionalProperties: false,
          required: ["query", "filters"],
          properties: {
            query: { type: "string" },
            filters: {
              type: "object",
              additionalProperties: false,
              required: [],
              properties: {},
            },
          },
        },
        openAlex: {
          type: "object",
          additionalProperties: false,
          required: ["query", "filters"],
          properties: {
            query: { type: "string" },
            filters: {
              type: "object",
              additionalProperties: false,
              required: ["language", "sourceType", "workType"],
              properties: {
                language: { type: "array", items: { type: "string" } },
                sourceType: { type: "array", items: { type: "string" } },
                workType: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
        elicit: {
          type: "object",
          additionalProperties: false,
          required: ["query", "filters"],
          properties: {
            query: { type: "string" },
            filters: {
              type: "object",
              additionalProperties: false,
              required: ["typeTags", "includeKeywords", "excludeKeywords"],
              properties: {
                typeTags: { type: "array", items: { type: "string" } },
                includeKeywords: { type: "array", items: { type: "string" } },
                excludeKeywords: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
};

export const titleTranslationPrompt = {
  name: "translate",
  translations: {
    dk: "dansk",
  },
  model_token_limit: 128000,
  model: "gpt-5.4",
  reasoning: { effort: "none" },        // none, low, medium, high, xhigh
  text: { verbosity: "medium" },       // low, medium, high
  max_output_tokens: 500,
  stream: true,
  prompt: sanitizePrompt({
    dk: "Oversæt denne titel til dansk, hvor du bruger ord, som er nemme at forstå for en person uden kendskab til emnet. Angiv den oversatte titel med fed ved brug af Markdown (dvs. **Oversat titel**). \
		På en ny linje skal du skrive en meget kort og nøgtern version af titlen på denne form ved brug af Markdown: *Kort version: [Den korte version.]* \
		Start den korte version med stort begyndelsesbogstav. \
		Skriv aldrig betydningsfulde ord med stort begyndelsesbogstav som på engelsk. Dvs. du må ikke bruge title case. \
		Skriv altid type 1-diabetes og type 2-diabetes med bindestreng. \
		Skriv aldrig 'sukkersyge', men kun 'diabetes'. \
		'Systematic review' skal altid oversættes til 'systematisk review'. \
    Du vil blive straffet meget hårdt, hvis du ikke følger alle de instruktioner, som du har fået. \
		Her er titlen: ",
  }),
};

export const searchTranslationPrompt = {
  name: "translate",
  translations: {
    dk: "dansk",
    en: "English",
  },
  model_token_limit: 128000,
  model: "gpt-5.4",
  reasoning: { effort: "none" },        // none, low, medium, high, xhigh
  text: { verbosity: "medium" },       // low, medium, high
  max_output_tokens: 500,
  stream: true,
  prompt: sanitizePrompt({
    dk: 'Du er en informationsspecialist, der så vidt muligt oversætter alle input til en korrekt PubMed-søgestreng. Ud fra det input, du modtager, skal du finde de mest relevante sundhedsvidenskabelige engelske termer, inkl. ofte anvendte synonymer og stavemåder, som kan bruges til at udforme en præcis PubMed-søgning, der giver de mest relevante resultater. Du gør dig umage med at finde termer, som passer til inputtet, også selvom inputtet ikke er helt korrekt eller præcist. \
    Strenge regler (skal overholdes): \
    0. Hvis inputtet allerede er i PubMed-søgestrengsformat, dvs. at det allerede indeholder et søgetag (ethvert søgetag er tilladt, dvs. også andre end [ti], [tiab], [mh] og [au]), eller der er brugt AND, OR eller NOT, skal du kun ændre det, hvis det er nødvendigt, og så returnere det uændrede inputtet.\
    1. Brug kun følgende search field tags: [ti], [tiab], [mh], [sh], [sb], [la], [dp], [ad], [ta], [nm] og [au]. Ingen andre tags er tilladt. \
    2. MeSH-validering (ufravigelig): Du må KUN bruge en MeSH-term med [mh], hvis du entydigt kan bekræfte, at den eksisterer som officiel Descriptor Name i NLM’s Medical Subject Headings (MeSH)-thesaurus (https://meshb.nlm.nih.gov). \
    - Brug aldrig en opfundet eller ikke-eksisterende MeSH. \
    - Brug aldrig en Entry Term eller en Supplementary Concept Record (SCR) direkte med [mh]. Hvis input matcher en Entry Term, skal du først mappe den til den officielle Descriptor Name; kun denne må tagges med [mh]. Hvis der kun findes en SCR, må du ikke bruge [mh] for den — brug i stedet [tiab]. \
    - Hvis du er det mindste i tvivl, så undlad [mh], og brug kun [tiab]/[ti]. \
    3. Når en gyldig MeSH-term findes, skal du altid kombinere den med relevante fritekstsynonymer i [tiab] (og evt. centrale ord i [ti]) med OR inde i samme konceptblok. Husk, at MeSH-termer altid skrives med stort begyndelsesbogstav, men brug aldrig store bogstaver i  [ti], [tiab] og [sb]. \
    4. Brug kun de boolske operatorer OR og AND, aldrig NOT. \
    4b. Brug ALDRIG wildcards (*) inden i citationstegn — PubMed ignorerer wildcards i citerede fraser. Dvs. "carbohydrate count*"[tiab] er FORKERT, mens carbohydrate count*[tiab] er KORREKT. \
    5. Brug kun anførselstegn, når de er nødvendige for at fastholde en meningsbærende frase; ellers undlades anførselstegn for at udnytte PubMed’s automatic term mapping. \
    6. Brug gerne parenteser, og placer dem korrekt, så strengen altid er syntaktisk gyldig. \
    7. Hvis input er et DOI, returnér udelukkende "DOI"[aid], fx "10.1080/10408398.2018.1430019"[aid]. \
    Hvis input er et PMID, returnér udelukkende XXXXXXXX[pmid], fx 25998293[pmid]. \
    8. Hvis inputtet er et sprog, så anfør det med [la]. \
    9. Hvis input er formuleret som et spørgsmål, identificér de centrale begreber og byg søgningen ud fra disse. \
    10. Hvis inputtet er en author name, skal du kun bruge [au] og returnere det i PubMed-søgestrengsformat. \
    12. Vær opmærksom på typiske danske stave-/lydfejl og map til korrekte engelske termer (inkl. britiske/amerikanske stavemåder). \
    13. Du skal kun svare med den endelige PubMed-søgestreng, som kan indsættes direkte i PubMed—intet andet. \
    14. Hvis noget går galt, skal du alene svare: Det indtastede kan ikke oversættes til en søgning. Prøv igen. \
    Kvalitetskontrol før output: \
    Inden du returnerer strengen, skal du meget grundigt tjekke, at den er korrekt formatteret, at alle parenteser/anførselstegn er balancerede, og at alle eventuelle [mh]-termer faktisk eksisterer i MeSH-databasen (ellers må de ikke medtages). \
    Opgave: \
    Her er inputtet, som du skal oversætte til en PubMed-søgestreng: ',
    en: 'You are a translator who translates a given input into a correct PubMed search string. Based on the input you receive, you must identify the most relevant health science English terms, including commonly used synonyms and spellings, which can be used to create a correct PubMed search that yields the most relevant results matching the input. The terms you choose to use in the PubMed search string must be terms frequently used in titles or abstracts in health science literature, making them suitable for use in a PubMed search. If the input is phrased as a question, you must identify the most central terms in the question and then use these terms to construct the PubMed search string. You must never use search field tags such as [ti], [tiab], and [mh]. If you use MeSH terms, you must always first use your knowledge to check whether the particular MeSH term actually exists, i.e., whether it is published in NLM\'s The Medical Subject Headings (MeSH) thesaurus (https://meshb.nlm.nih.gov). It is forbidden for you to use MeSH terms that do not exist in NLM\'s The Medical Subject Headings (MeSH) thesaurus. If the input is a DOI, always return an output formatted like this: "DOI"[aid], e.g., "10.1080/10408398.2018.1430019"[aid]. Use only the Boolean operators OR and AND, but never NOT. Use quotation marks only when they are essential for the correct understanding of the concept by PubMed\'s automatic term mapping; otherwise, avoid using quotation marks. Feel free to use parentheses, but place them correctly to always create a correct and usable PubMed search string. You must respond with a PubMed search string that can be immediately inserted as a search in PubMed, and nothing else. Be aware of common spelling mistakes that a layperson might make when you need to understand what is meant - i.e. you must particularly be able to interpret when the input phonetically resembles a correct and relevant English word. If you do not know how to translate the input, or something goes wrong, you must respond with the following words and nothing else: \'The input cannot be translated into a search. Please try again.\'. \
    You will be penalized severely if you do not follow the instructions you have received. \
    Here is the input you must translate into a PubMed search string: ',
    en: 'You are a translator who translates a given input into a correct PubMed search string. Based on the input you receive, you must identify the most relevant health science English terms, including commonly used synonyms and spellings, which can be used to create a correct PubMed search that yields the most relevant results matching the input. The terms you choose to use in the PubMed search string must be terms frequently used in titles or abstracts in health science literature, making them suitable for use in a PubMed search. If the input is phrased as a question, you must identify the most central terms in the question and then use these terms to construct the PubMed search string. You must never use search field tags such as [ti], [tiab], and [mh]. If you use MeSH terms, you must always first use your knowledge to check whether the particular MeSH term actually exists, i.e., whether it is published in NLM\'s The Medical Subject Headings (MeSH) thesaurus (https://meshb.nlm.nih.gov). It is forbidden for you to use MeSH terms that do not exist in NLM\'s The Medical Subject Headings (MeSH) thesaurus. If the input is a DOI, always return an output formatted like this: "DOI"[aid], e.g., "10.1080/10408398.2018.1430019"[aid]. Use only the Boolean operators OR and AND, but never NOT. Use quotation marks only when they are essential for the correct understanding of the concept by PubMed\'s automatic term mapping; otherwise, avoid using quotation marks. Feel free to use parentheses, but place them correctly to always create a correct and usable PubMed search string. You must respond with a PubMed search string that can be immediately inserted as a search in PubMed, and nothing else. Be aware of common spelling mistakes that a layperson might make when you need to understand what is meant - i.e. you must particularly be able to interpret when the input phonetically resembles a correct and relevant English word. If you do not know how to translate the input, or something goes wrong, you must respond with the following words and nothing else: \'The input cannot be translated into a search. Please try again.\'. \
    You will be penalized severely if you do not follow the instructions you have received. \
    Here is the input you must translate into a PubMed search string: ',
  }),
};

export const semanticScholarSearchPrompt = {
  name: "translate",
  translations: {
    dk: "dansk",
    en: "English",
  },
  model_token_limit: 128000,
  model: "gpt-5.4",
  reasoning: { effort: "none" },
  text: { verbosity: "medium" },
  max_output_tokens: 120,
  stream: true,
  prompt: sanitizePrompt({
    dk: "Du er en informationsspecialist. Oversæt brugerens input til en kort, præcis engelsk søgesætning, der er egnet som plain-text query i Semantic Scholar. \
    Strenge regler (skal overholdes): \
    1. Returnér kun engelsk tekst. \
    2. Brug aldrig PubMed-tags som [ti], [tiab], [mh] eller lignende. \
    3. Brug aldrig boolske operatorer (AND, OR, NOT), parenteser eller citationstegn, medmindre det er absolut nødvendigt i almindeligt engelsk. \
    4. Hold output kort og fokuseret på de vigtigste fagtermer. \
    5. Hvis input allerede er på godt engelsk, kan du returnere det i let normaliseret form. \
    6. Hvis noget går galt, returnér inputtet så neutralt som muligt på engelsk. \
    Her er inputtet, som du skal omskrive til en engelsk plain-text søgesætning: ",
    en: "You are an information specialist. Rewrite the user input into a short, precise English plain-text search query suitable for Semantic Scholar. \
    Strict rules: \
    1. Return only English text. \
    2. Never use PubMed field tags like [ti], [tiab], [mh], etc. \
    3. Do not use Boolean operators (AND, OR, NOT), parentheses, or query syntax unless absolutely necessary in normal English. \
    4. Keep output short and focused on the core scientific terms. \
    5. If the input is already good English, return a lightly normalized version. \
    6. If something fails, return a neutral English version of the input. \
    Here is the input you must rewrite as an English plain-text search query: ",
  }),
};

export const semanticIntentPrompt = {
  name: "translate",
  translations: {
    dk: "dansk",
    en: "English",
  },
  model_token_limit: 128000,
  model: "gpt-5.4",
  reasoning: { effort: "none" },
  text: {
    verbosity: "low",
    format: {
      type: "json_schema",
      name: "semantic_intent_response",
      strict: true,
      schema: semanticIntentResponseSchema,
    },
  },
  max_output_tokens: 520,
  stream: true,
  prompt: sanitizePrompt({
    dk: 'Du er en informationsspecialist. Du modtager et JSON-input med brugerens fritekst, valgte emner, valgte afgrænsninger, strukturerede semantiske blokke og hårde filtre. Hvis felterne `semanticWordedIntent`, `semanticCoreText` eller `sourceSpecificContext` findes, skal de bruges som den foretrukne engelske opsummering af søgeintentionen. Returnér KUN gyldig JSON med præcis disse topfelter: "semanticIntent", "hardFilterHints", "softFilterHints", "sourceSpecificHints", "sourceQueryPlan". Regler: 1) "semanticIntent" er en kort engelsk fallback-query uden PubMed-tags og uden boolske operatorer. 2) "hardFilterHints" er et objekt med arrays for publicationType, studyDesign, ageGroup, language og sourceFormat, når input tydeligt understøtter det; ellers tomme arrays. 3) "softFilterHints" er korte arrays af synonymer eller tematiske signaler. 4) "sourceSpecificHints" er et objekt med nøglerne semanticScholar, openAlex og elicit, hvor hver værdi er et kort array af hints. 5) "sourceQueryPlan" er et objekt med nøglerne semanticScholar, openAlex og elicit. Hver værdi skal være et objekt med felterne "query" og "filters". 6) "sourceQueryPlan.semanticScholar.query" skal være en kort begrebsnær engelsksproget query. 7) "sourceQueryPlan.openAlex.query" skal være en kort konceptuel engelsksproget query egnet til `search.semantic`. 8) "sourceQueryPlan.elicit.query" skal være et kort engelsksproget forskningsspørgsmål i naturligt sprog. 9) "sourceQueryPlan.openAlex.filters" må kun bruge felterne language, sourceType og workType. 10) "sourceQueryPlan.elicit.filters" må kun bruge felterne typeTags, includeKeywords og excludeKeywords. Tilladte typeTags er kun "Review", "Meta-Analysis", "Systematic Review", "RCT" og "Longitudinal". 11) Hvis et sprogfilter er kendt, skal det kun placeres i hardFilterHints.language og eventuelt sourceQueryPlan.openAlex.filters.language, ikke skrives direkte ind i semanticIntent. 12) Hvis input er uklart, vær konservativ og brug tomme felter frem for gæt. 13) Svar med JSON alene uden markdown, forklaring eller ekstra tekst. Her er input-JSON:',
    en: 'You are an information specialist. You receive a JSON input with user free text, selected topics, selected limits, structured semantic blocks, and hard filters. If the fields `semanticWordedIntent`, `semanticCoreText`, or `sourceSpecificContext` are present, use them as the preferred English summary of the search intent. Return ONLY valid JSON with exactly these top-level fields: "semanticIntent", "hardFilterHints", "softFilterHints", "sourceSpecificHints", "sourceQueryPlan". Rules: 1) "semanticIntent" is a short English fallback query without PubMed tags and without Boolean operators. 2) "hardFilterHints" is an object with arrays for publicationType, studyDesign, ageGroup, language, and sourceFormat when clearly supported by the input; otherwise use empty arrays. 3) "softFilterHints" contains short arrays of synonyms or thematic signals. 4) "sourceSpecificHints" is an object with keys semanticScholar, openAlex, and elicit, where each value is a short hint array. 5) "sourceQueryPlan" is an object with keys semanticScholar, openAlex, and elicit. Each value must be an object with fields "query" and "filters". 6) "sourceQueryPlan.semanticScholar.query" must be a short concept-focused English query. 7) "sourceQueryPlan.openAlex.query" must be a short conceptual English query suitable for `search.semantic`. 8) "sourceQueryPlan.elicit.query" must be a short English research question in natural language. 9) "sourceQueryPlan.openAlex.filters" may only use the fields language, sourceType, and workType. 10) "sourceQueryPlan.elicit.filters" may only use the fields typeTags, includeKeywords, and excludeKeywords. Allowed typeTags are only "Review", "Meta-Analysis", "Systematic Review", "RCT", and "Longitudinal". 11) If a language filter is known, place it only in hardFilterHints.language and optionally sourceQueryPlan.openAlex.filters.language, and do not write it directly into semanticIntent. 12) If the input is ambiguous, be conservative and prefer empty fields over guessing. 13) Respond with JSON only, no markdown, no explanation, no extra text. Input JSON:',
  }),
};
