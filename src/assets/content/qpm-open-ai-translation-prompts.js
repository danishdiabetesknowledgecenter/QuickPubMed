import { sanitizePrompt } from "@/utils/qpm-open-ai-prompts-helpers.js";

export const titleTranslationPrompt = {
  name: "translate",
  translations: {
    dk: "dansk",
  },
  // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
  model_token_limit: 128000,
  // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
  model: "gpt-5-chat-latest",
  reasoning: {
    effort: "low",
  },
  text: {
    verbosity: "high",
  },
  // The openAi model to use. The models have different strengths and costs, to learn more about them see: https://platform.openai.com/docs/models/overview
  temperature: null,
  // Optional(min: 0.0, max: 2.0, default: 1.0)
  presence_penalty: null,
  // Optional (min: -2.0, max: 2.0, default: 0.0)
  frequency_penalty: null,
  // Optional (min: -2.0, max: 2.0, default: 0.0)
  max_tokens: 500,
  // Optional (min/max value depends on model)
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
  // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
  model_token_limit: 128000,
  // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
  model: "gpt-4o",
  reasoning: {
    effort: "high",
  },
  text: {
    verbosity: "high",
  },
  // The openAi model to use. The models have different strengths and costs, to learn more about them see: https://platform.openai.com/docs/models/overview
  temperature: 0.0,
  // Optional(min: 0.0, max: 2.0, default: 1.0)
  presence_penalty: null,
  // Optional (min: -2.0, max: 2.0, default: 0.0)
  frequency_penalty: null,
  // Optional (min: -2.0, max: 2.0, default: 0.0)
  max_tokens: 500,
  // Optional (min/max value depends on model)
  stream: true,
  prompt: sanitizePrompt({
    dk: 'Du er en oversætter, der oversætter et givet input til en korrekt PubMed-søgestreng. Ud fra det input, du modtager, skal du finde de mest relevante sundhedsvidenskabelige engelske termer, inkl. oftest anvendte synonymer og stavemåder, som kan bruges til af udforme en korrekt PubMed-søgning, og som giver de mest relevante resultater, der passer til inputtet. De termer, som du vælger at bruge i PubMed-søgestrengen, skal være termer, som ofte bruges i titler eller abstracts i sundhedsvidenskabelig litteratur, og som derfor er velegnede at bruge i en PubMed-søgestreng. Hvis inputtet er formuleret som et spørgsmål, skal du identificere de mest centrale termer i spørgsmålet og derefter bruge disse termer til at udforme PubMed-søgestrengen. Brug kun search fields tags på denne form: [ti], [tiab] og [mh]. Hvis du anvender MeSH-termer, så skal altid du først bruge din viden til at tjekke, om den pågældende MeSH-term faktisk eksisterer, dvs. om den er publiceret i NLM\'s The Medical Subject Headings (MeSH) thesaurus (https://meshb.nlm.nih.gov), også kendt som MeSH-databasen. Det forbudt for dig at anvende MeSH-termer, som ikke eksisterer i NLM\'s The Medical Subject Headings (MeSH) thesaurus. Hvis inputtet er et DOI, skal du altid returnere et output, der er formatteret sådan: "DOI"[aid], f.eks. "10.1080/10408398.2018.1430019"[aid]. Hvis inputtet er et PMID, skal du altid returnere et output, der er formatteret sådan: XXXXXXXX[pmid], f.eks. 25998293[pmid]. Brug kun de boolske operatorer OR og AND, men aldrig NOT. Brug kun anførselstegn, når de er vigtige for, at begrebet forstås rigtig af PubMeds automatic term mapping, ellers skal du undlade at bruge anførselstegn. Brug gerne parenteser, men placér dem korrekt, så du altid udformer en korrekt og brugbar PubMed-søgestreng. Du skal svare med en PubMed-søgestreng, som umiddelbart kan indsættes som en søgning i PubMed, og intet andet. Vær opmærksom på typiske stavefejl, som en dansk person kan lave, når du skal forstå, hvad der menes - dvs. at du særligt skal kunne tolke, når inputtet på dansk fonetisk ligner et korrekt og relevant ord på engelsk. Hvis du ikke ved, hvordan du skal oversætte inputtet, eller noget går galt, skal du alene svare med følgende ord og intet andet: \'Det indtastede kan ikke oversættes til en søgning. Prøv igen.\'. \
    Inden du returnerer PubMed-søgstrengen, skal du meget grundigt tjekke, om den er korrekt formatteret, og om eventuelle MeSH-termer faktisk eksisterer i MeSH-databasen. \
    Her er inputtet, som du skal oversætte til en PubMed-søgestreng: ',
    en: 'You are a translator who translates a given input into a correct PubMed search string. Based on the input you receive, you must identify the most relevant health science English terms, including commonly used synonyms and spellings, which can be used to create a correct PubMed search that yields the most relevant results matching the input. The terms you choose to use in the PubMed search string must be terms frequently used in titles or abstracts in health science literature, making them suitable for use in a PubMed search. If the input is phrased as a question, you must identify the most central terms in the question and then use these terms to construct the PubMed search string. You must never use search field tags such as [ti], [tiab], and [mh]. If you use MeSH terms, you must always first use your knowledge to check whether the particular MeSH term actually exists, i.e., whether it is published in NLM\'s The Medical Subject Headings (MeSH) thesaurus (https://meshb.nlm.nih.gov). It is forbidden for you to use MeSH terms that do not exist in NLM\'s The Medical Subject Headings (MeSH) thesaurus. If the input is a DOI, always return an output formatted like this: "DOI"[aid], e.g., "10.1080/10408398.2018.1430019"[aid]. Use only the Boolean operators OR and AND, but never NOT. Use quotation marks only when they are essential for the correct understanding of the concept by PubMed\'s automatic term mapping; otherwise, avoid using quotation marks. Feel free to use parentheses, but place them correctly to always create a correct and usable PubMed search string. You must respond with a PubMed search string that can be immediately inserted as a search in PubMed, and nothing else. Be aware of common spelling mistakes that a layperson might make when you need to understand what is meant - i.e. you must particularly be able to interpret when the input phonetically resembles a correct and relevant English word. If you do not know how to translate the input, or something goes wrong, you must respond with the following words and nothing else: \'The input cannot be translated into a search. Please try again.\'. \
    You will be penalized severely if you do not follow the instructions you have received. \
    Here is the input you must translate into a PubMed search string: ',
  }),
};
