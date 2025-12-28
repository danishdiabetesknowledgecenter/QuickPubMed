/**
 * Setup text for the prompt to start the summarization of an article
 */
export const promptStartText = {
  dk: `Du skal svare i JSON-format. Du skal først kontrollere, om teksten stammer far en videnskabelig artikel. Hvis teksten ikke stammer fra en videnskabelig artikel, skal stoppe og svare med "Jeg kan desværre alligevel ikke opsummere denne artikel". Du vil blive givet en række spørgsmål med hver deres shortTitle.
  Dit svar SKAL altid følge denne givne struktur: 
  [
    {
      "shortTitle": "Resumé",
      "question": "Lav et kort resumé baseret på hele teksten i artiklen. Sørg for at inkludere både indledningen og konklusionen.",
      "answer": "Artiklen giver et overblik over..."
    },
  ].
  Det er vigtigt, at du bevarer forholdet mellem shortTitle og question, og at du svarer på alle spørgsmål. Alle svar skal formuleres i den sproglige tone, som du er blevet bedt om at anvende. 
 `,
  en: `You must answer in JSON format. First, you must check if the text is from a scientific article. If it is not, you must stop and respond with "I can unfortunately not summarize this article". You will be given a series of questions, each with their own shortTitle.
  Your answer MUST always follow this given structure:
  [
    {
      "shortTitle": "Summary",
      "question": "Make a brief summary based on the overall text of the article. Make sure to include the introduction and the conclusion.",
      "answer": "The article provides an overview of..."
    },
  ].
  It is important that you maintain the relationship between shortTitle and question, and that you answer all questions.
  `,
};

const promptStartTextuserQuestions = {
  dk: `Du skal svare i JSON-format. Du skal aldrig annotere dit svar med \`\`\`json i starten af svaret samt \`\`\` i slutningen af svaret. 
  Der vil blive stillet et spørgsmål i kontekst af en videnskabelig artikel, som du skal besvare. Der skal være 2 key-value pairs i dit svar. 
  Den første key skal hedde questions, og value skal være et array. 
  Den anden key skal hedde answers, og value skal være et array med svarene på spørgsmålene. 
  Strukturen for dit svar skal være som følger:
  {
    "questions": [
      "her er et eksempel på et spørgsmål"
    ],
    "answers": [
      "her er et eksempel på et svar"
    ]
  }
  Det er ekstremt vigtigt, at du vurderer, om det stillede spørgsmål rent faktisk er et spørgsmål. 
  Hvis det ikke er et spørgsmål, skal du svare med "Jeg kan ikke genkende et spørgsmål i det, du har skrevet. Prøv at omformulere dit spørgsmål.". Her er spørgsmålet:  `,
  en: `You must respond in JSON format. You can never annotate your answer with \`\`\json at the beginning of your response, nor with  \`\`\` at the end of your response. 
  You will be asked one question in the context of a scientific article, that you must answer. There must be 2 key-value pairs in your response. 
  The first key must be called questions, and the value must be an array. 
  The second key must be called answers, and the value must be an array with the answers to the questions.
  The structure of your response must be as follows:
  {
    "questions": [
      "here is an example question"
    ],
    "answers": [
      "here is an example answer"
    ]
  }
  You must not come up with questions yourself or change the question that is asked. 
  It is extremly important that you assess whether the question is actually a question. 
  If it is not a question, you must respond with "I cannot recognize a question in this text". Here is the question:  `,
};

/**
 * @typedef {Object} QuestionItem
 * @property {string} question - The question text.
 * @property {string} shortTitle - A short title for the question.
 */

/**
 * Collection of prompt questions categorized by language.
 *
 * @type {Object.<string, QuestionItem[]>}
 * @property {QuestionItem[]} dk - Questions in Danish.
 * @property {QuestionItem[]} en - Questions in English.
 */
export const promptQuestionsMap = {
  dk: [
    {
      question: `Lav en kort opsummering baseret på artiklens samlede tekst, hvor du inkluderer indledning og konklusion. Du skal også inkludere de vigtigste resultater og konklusioner. `,
      shortTitle: `Resumé`,
    },
    {
      question: `Hvad er formålet med denne artikel?`,
      shortTitle: `Formål`,
    },
    {
      question: `Hvilke metoder blev anvendt?`,
      shortTitle: `Metoder`,
    },
    {
      question: `Hvad er resultaterne?`,
      shortTitle: `Resultater`,
    },
    {
      question: `Hvilke konklusioner drages i artiklen?`,
      shortTitle: `Konklusioner`,
    },
    {
      question: `Hvilke styrker og svagheder er der i studiet?`,
      shortTitle: `Styrker og svagheder`,
    },
    {
      question: `Hvilke mulige interessekonflikter har forfatterne til studiet? Mulige interessekonflikter inkluderer også, at man forholder sig til, hvem erhar finansieret studiet. Angiv kort, hvorfor det er vigtigt at være opmærksom på interessekonflikter i videnskabelige studier. `,
      shortTitle: `Interessekonflikter`,
    },
  ],
  en: [
    {
      question: `Make a brief summary based on the overall text of the article.`,
      shortTitle: `Summary`,
    },
    {
      question: `What is the purpose of this article?`,
      shortTitle: `Purpose`,
    },
    {
      question: `What methods were used?`,
      shortTitle: `Methods`,
    },
    {
      question: `What are the results?`,
      shortTitle: `Results`,
    },
    {
      question: `What conclusions are drawn in the article?`,
      shortTitle: `Conclusions`,
    },
    {
      question: `What are the strengths and weaknesses of the study?`,
      shortTitle: `Strengths and weaknesses`,
    },
    {
      question: `What possible conflicts of interest do the authors of the study have?`,
      shortTitle: `Conflicts of interest`,
    },
  ],
};

export const promptQuestionsExtra = {
  dk: `Du skal herefter tilføje 2 eller 3 ekstra spørgsmål, der har relevans for denne artikel, og som du mener, at læseren vil have gavn af at få svar på.`,
  en: `You must then add 2 or 3 additional questions that are relevant to this article.`,
};

/**
 * Prompt text for only allowing answers that are specific to the content of the article
 */
export const promptArticleSpecificAnswersOnly = {
  dk: `Det er ekstremt vigtigt, at du kun besvarer spørgsmål, hvis det er relevant for tekstens indhold. 
  Hvis spørgsmålet omhandler andet end tekstens indhold, så svar altid med "Ikke relevant for denne artikel".  `,
  en: `It is very important that you only answer the questions asked if they are relevant to this article, 
  and that you do not answer questions that are not relevant to this article. `,
};

/**
 * This object contains all the prompt texts for the different languages/ language types
 * This is not the prompt object that is sent to the OpenAI API
 * @typedef {Object} Prompt
 * @property {Object} name - The display names for the prompt in different languages types.
 * @property {string} name.dk - Danish name for the language type.
 * @property {string} name.en - English name for the language type.
 * @property {string} startText - Generic text for the start of the prompt.
 * @property {Array<string>} questions - An array of questions related to the prompt.
 * @property {string} promptRules - Rules or guidelines for generating responses.
 * @property {Object} endText - The concluding text for the prompt in different languages.
 * @property {string} endText.dk - Danish concluding text.
 * @property {string} endText.en - English concluding text.
 */
export const promptText = [
  // Plain langugaes prompt end text
  {
    name: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    languageType: {
      dk: "Du skal generere svar til disse spørgsmål, og disse svar skal bestå af maksimum 200 ord og skal skrives i et sprog, som nemt kan læses og forstås af en 15-årig uden forhåndskendskab til emnet. Forklar altid svære ord i parentes. Du skal altid svare på korrekt dansk. Gennemgå dit svar 10 gange for sproglig korrekthed, før du returnerer sit svar. \
      Du skal ikke svare med andet end JSON-formatet. Du skal derfor ikke bruge tegnet ` eller skrive json i starten eller slutningen af svaret. Her er teksten: ",
      en: "You must then generate answers to these questions, and these answers must consist of at least 100 words and must be written in a language that can be easily read and understood by a 15-year-old without prior knowledge of the subject, and add corresponding to the array that is the value for the answers key. \
      You must not respond with anything other than JSON format. You must therefore not use the character ` or write JSON at the beginning or end of the response. Here is the text: ",
    },
    startText: promptStartText,
    startTextuserQuestions: promptStartTextuserQuestions,
    questions: promptQuestionsMap,
    questionsExtra: promptQuestionsExtra,
    promptRules: promptArticleSpecificAnswersOnly,
    endText: {
      dk: "Du skal generere svar til disse spørgsmål, og disse svar skal bestå af maksimum 200 ord og skal skrives i et sprog, som nemt kan læses og forstås af en 15-årig uden forhåndskendskab til emnet. Forklar altid svære ord i parentes. Du skal altid svare på korrekt dansk. Gennemgå dit svar 10 gange for sproglig korrekthed, før du returnerer sit svar. \
      Du skal ikke svare med andet end JSON-formatet. Du skal derfor ikke bruge tegnet ` eller skrive json i starten eller slutningen af svaret. Her er teksten: ",
      en: "You must then generate answers to these questions, and these answers must consist of at least 100 words and must be written in a language that can be easily read and understood by a 15-year-old without prior knowledge of the subject, and add corresponding to the array that is the value for the answers key. \
      You must not respond with anything other than JSON format. You must therefore not use the character ` or write JSON at the beginning or end of the response. Here is the text: ",
    },
  },
  // Professional language prompt end text
  {
    name: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    languageType: {
      dk: "Du skal generere svar til disse spørgsmål, og disse svar skal bestå af maksimum 200 ord og skal skrives i et sprog, som nemt kan læses og forstås af en 15-årig uden forhåndskendskab til emnet. Forklar altid svære ord i parentes. Du skal altid svare på korrekt dansk. Gennemgå dit svar 10 gange for sproglig korrekthed, før du returnerer sit svar. \
      Du skal ikke svare med andet end JSON-formatet. Du skal derfor ikke bruge tegnet ` eller skrive json i starten eller slutningen af svaret. Her er teksten: ",
      en: "You must then generate answers to these questions, and these answers must consist of at least 100 words and must be written in a language that can be easily read and understood by a 15-year-old without prior knowledge of the subject, and add corresponding to the array that is the value for the answers key. \
      You must not respond with anything other than JSON format. You must therefore not use the character ` or write JSON at the beginning or end of the response. Here is the text: ",
    },
    startText: promptStartText,
    startTextuserQuestions: promptStartTextuserQuestions,
    questions: promptQuestionsMap,
    questionsExtra: promptQuestionsExtra,
    promptRules: promptArticleSpecificAnswersOnly,
    endText: {
      dk: "Du skal generere svar til alle spørgsmål, og disse svar skal bestå af maksimum 200 ord og skal skrives på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. Du skal altid svare på korrekt dansk. Gennemgå dit svar 10 gange for sproglig korrekthed, før du returnerer sit svar. \
      Du må ikke svare med andet end JSON-formatet. Du skal aldrig bruge tegnet ` eller medgive 'json' i starten eller slutningen af dit svar. Her er teksten: ",
      en: "You must then generate answers to these questions, and these answers must consist of atleast 200 words and must be written in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject, and add corresponding to the array that is the value for the answers key. \
      You must not respond with anything other than JSON format. You must therefore not use the character ` or write JSON at the beginning or end of the response. Here is the text: ",
    },
  },
];

/**
 * This is the object being sent to the OpenAI API
 * The prompt fields are composed in the code using the promptText object
 */
export const summarizeArticlePrompt = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    model_token_limit: 128000,
    model: "gpt-5.2",
    reasoning: { effort: "medium" },  // none, low, medium, high, xhigh
    max_output_tokens: 4000,
    stream: true,
    type: "json_object",
    prompt: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Fagsprog",
    translations: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    model_token_limit: 128000,
    model: "gpt-5.2",
    reasoning: { effort: "medium" },  // none, low, medium, high, xhigh
    max_output_tokens: 4000,
    stream: true,
    type: "json_object",
    prompt: {
      dk: "",
      en: "",
    },
  },
];
