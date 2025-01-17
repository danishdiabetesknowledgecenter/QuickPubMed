import { sanitizePrompt, sanitizeMessages } from "@/utils/qpm-open-ai-prompts-helpers.js";

// MULTIPLE ABSTRACT PROMPTS SECTION

// Prompt object for summarizing multiple search result abstracts
export const summarizeMultipleAbstractPrompt = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    tooltip: {
      dk: "Opsummering skrevet i et sprog, som er nemt at forstå, selvom man ikke har forhåndskendskab til emnet.",
      en: "Summary written in a language that is easy to understand, even without prior knowledge of the subject.",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "chatgpt-4o-latest",
    // The openAi model to use. The models have different strengths and costs, to learn more about them see: https://platform.openai.com/docs/models/overview
    top_p: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    temperature: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    presence_penalty: null,
    // Optional (min: -2.0, max: 2.0, default: 0.0)
    frequency_penalty: null,
    // Optional (min: -2.0, max: 2.0, default: 0.0)
    max_tokens: 4000,
    // Optional (min/max value depends on model)
    prompt: sanitizePrompt({
      // Required in at least one language, but it is recommended to have both languages to ensure the summary provided matches the user's language.
      dk: "Du er en sundhedsvidenskabelig fagperson, som skriver på dansk i et let forståeligt sprog og altid indsætter henvisninger til enkelte studier i teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne fra listen. Du skriver aldrig i førsteperson. \
      Lav en opsummering på dansk, som fylder mindst 250 ord, men højst 30% af den samlede oprindelige tekst, af nedenstående tekst (angivet i den nummererede liste nedenfor og afgrænset af triple backticks), som udgøres af en række søgeresultater. Hvert enkelt søgeresultat består en titel, en kilde og et abstracts af et videnskabeligt studie. Skriv teksten, så den bliver meget let at forstå for en yngre person på 18 år, som ikke har nogen viden om emnet. Skriv teksten så simpel og klar som muligt med et LIX-tal på under 25. Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. Alle udsagn i opsummeringen skal altid kunne genfindes i den oprindelige tekst. Opbyg opsummeringen således: \
      - Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. \
      - Skriv dernæst selve opsummeringen af studierne - gerne ved brug af korrekt punktopstilling. Anvend kun et niveau i punktopstillinger. \
      VIGTIGE instrukser: \
      - Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, dvs. de skal indsættes på denne form **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, hvor PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE en referenceliste til sidst. \
      - Ved punktopstillinger, så brug Markdown language. Du må aldrig lave en nummereret liste med kun et punkt. \
      - Brug gerne overskrifter, men indled aldrig det allerførste afsnit med en overskrift. \
      - Brug sentence case, aldrig title case, i overskrifter og underoverskrifter. I sentence case er kun det første ord med stort begyndelsesbogstav. \
      Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: \
      ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet og tidligere historie med depression **[(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\")**. En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. Kvinder med diabetes har en højere forekomst af depression end mænd **([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\"))**.´´´ \
      Følg altid disse skriveregler: \
      - Skriv altid 'type 1-diabetes', men skriv aldrig 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' e.l. \
      - Skriv altid 'type 2-diabetes', men skriv aldrig 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' e.l. \
      - Skriv altid 'person med diabetes', men skriv aldrig 'diabetiker', 'diabetespatient' e.l. \
      - Skriv altid 'diabetes', men skriv aldrig 'sukkersyge' \
      - Skriv altid 'prædiabetes', men skriv aldrig 'prediabetes' \
      - Brug dansk notation for tal, hvor tusindtalsseparator er et punktum (.) og decimaltegn er et komma (,). Skriv kun tal med korrekt format i din opsummering. \
      - I overskrifter skal du start med stort begyndelsesbogstav, men du må aldrig bruge title case. \
      Andre regler: \
      - Hvis der i et abstract kun står 'diabetes', og ikke hverken 'type 1-diabetes' eller 'type 2-diabetes', skal du blot skrive 'diabetes'. \
      Du vil blive straffet hårdt, hvis du ikke følger alle de instruktioner, som du har fået. \
      Her er teksten: ",
      en: "You are a health science professional who writes in English in an easy-to-understand language and always inserts references to individual studies in the text every time you mention something that originates from one or more specific studies from the list. You never write in the first person. \
		  Create a summary in English of at least 250 words, but no more than 30% of the total original text, of the text below (indicated in the numbered list below and delimited by triple backticks), which is made up of a number of search results. Each individual search result consists of a title, a source and an abstract of a scientific study. Write the text so that it will be very easy to understand for a younger person of 18 years who has no knowledge about the subject. Write the text as simply and clearly as possible with a LIX number of less than 25. Explain difficult words and technical terms in brackets, which are inserted immediately after the word in question. Structure the summary as follows: \
		  - Start by describing what all the studies show overall. If there are significant differences between the studies, describe these differences. \
		  - Next, write the actual summary of the studies. \
      IMPORTANT instructions: \
      - When you mention a study, ALWAYS insert a reference to the individual study inside the text itself as a clickable link in Markdown format in this form: **[(Last name of the first author + et al., if there are several authors + , year)](#PMID \"Scroll down to this article\")** where PMID is equal to the PMID of the reference in question, numbers only, not letters. DO NOT include a reference list at the end. \
      - For bullet points, use Markdown language. \
      - Use sentence case, never title case, in headings and subheadings. In sentence case only the first word is capitalized. \
      Here is an example (delimited by triple backticks) of how you should always insert references to the individual studies in the text itself, every time you mention something that originates from one or more specific studies in the list: \
      ´´´A systematic review and meta-analysis shows that the incidence of postpartum depression is high, especially in developing countries. Six risk factors for postpartum depression have been identified, including gestational diabetes, depression during pregnancy, and previous history of depression **[(Liu et al., 2022)](#12345678 \"Scroll down to this article\")**. A systematic review of epidemiological studies shows that there is a high incidence of depression in people with diabetes. Women with diabetes have a higher incidence of depression than men **([Roy & Lloyd, 2012](#87654321 \"Scroll down to this article\"); [Samuelsen, 2018](#12873465 \"Scroll down to this article \"))**.´´´ \
      If an abstract only mentions 'diabetes' and neither 'type 1 diabetes' nor 'type 2 diabetes', you should just write 'diabetes'. \
      You will be penalized severely if you do not follow the instructions you have received. \
      Here is the text: ",
    }),
    // Example messages style prompt. When possible messages will be used over prompt, so only include it if it is in use. Empty lists will be ignored if properly sanitized.
    messages: sanitizeMessages({
      dk: [
        // { role: "system", content: "Du er en sundhedsvidenskabelig fagperson, som skriver på dansk i et let forståeligt sprog og altid indsætter henvisninger til enkelte studier i teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne fra listen. Du skriver aldrig i førsteperson." },
        // {
        // 	role: "user",
        // 	content: "Lav en opsummering på dansk, som fylder mindst 250 ord, men højst 20% af den samlede oprindelige tekst, af denne tekst (angivet i den nummererede liste nedenfor og afgrænset af triple backticks), som udgøres af en række søgeresultater. Hvert enkelt søgeresultat består en titel, en kilde og et abstracts af et videnskabeligt studie. Skriv teksten, så den bliver meget let at forstå for en yngre person på 15 år, som ikke har nogen viden om emnet. Skriv teksten så simpel og klar som muligt med et LIX-tal på under 25. Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. Opbyg opsummeringen således: \
        // 		- Start med at angive, hvor mange studier der er blevet opsummeret. Hvis der er tale om systematiske reviews eller metaanalyser, så skriv det. \
        // 		- Beskriv umiddelbart derefter, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. \
        // 		- Skriv til sidst selve opsummeringen af studierne. \
        // 		VIGTIGE instrukser: \
        // 		- Når du omtaler et studie, så indsæt ALTID reference til det enkelte studie inde i selve teksten på denne form: [Efternavn på førsteforfatteren + et al., hvis der er flere forfattere + , årstal]. Indsæt IKKE en referenceliste til sidst. \
        // 		- Ved punktopstillinger, så brug Markdown language. Skriv altid 'type 1-diabetes' og 'type 2-diabetes' med bindestreng. \
        // 		Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: \
        // 		´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet og tidligere historie med depression [Liu et al., 2022]. En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. Kvinder med diabetes har en højere forekomst af depression end mænd [Roy & Lloyd, 2012].´´´ \
        // 		Her er teksten: "
        // }
      ],
      en: [],
    }),
  },
  {
    name: "Fagsprog",
    translations: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    tooltip: {
      dk: "Opsummering skrevet i et sprog, som er nemt forståeligt for fagpersoner med forhåndskendskab til emnet.",
      en: "Summary written in a language that is easily understood by professionals with prior knowledge of the subject.",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "chatgpt-4o-latest",
    top_p: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    temperature: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    presence_penalty: null,
    frequency_penalty: null,
    max_tokens: 4000,
    // Optional (min/max value depends on model)
    prompt: sanitizePrompt({
      dk: "Lav en opsummering på dansk på højst 300 ord af denne tekst (givet i den numererede liste nedenfor og afgrænset af tre backticks), som udgøres af abstracts af videnskabelige studier. Skriv teksten på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. Gør teksten så simpel og klar som mulig. Opsummeringen skal opbygges således: \
        1) Brug IKKE punktopstilling, dvs. '1)', '2)' osv. Skriv altid type 1-diabetes og type 2-diabetes med bindestreng, og skriv aldrig sukkersyge. Brug altid dansk tusindtalsseparator, dvs. f.eks. '1.234', ikke '1,234'.\
        2) Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, dvs. de skal indsættes på denne form **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, hvor PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE en referenceliste til sidst. \
        Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: \
        ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet og tidligere historie med depression **[(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\")**. En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. Kvinder med diabetes har en højere forekomst af depression end mænd **([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\"))**.´´´ \
        3) Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. \
        4) Skriv til dernæst selve opsummeringen af studierne. \
        Følg altid disse skriveregler: \
        - Skriv altid 'type 1-diabetes', men skriv aldrig 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' e.l. \
        - Skriv altid 'type 2-diabetes', men skriv aldrig 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' e.l. \
        - Skriv altid 'person med diabetes', men skriv aldrig 'diabetiker', 'diabetespatient' e.l. \
        - Skriv altid 'diabetes', men skriv aldrig 'sukkersyge' \
        - Skriv altid 'prædiabetes', men skriv aldrig 'prediabetes' \
        - Brug dansk notation for tal, hvor tusindtalsseparator er et punktum (.) og decimaltegn er et komma (,). Skriv kun tal med korrekt format i din opsummering. \
        Andre regler: \
        - Hvis der i et abstract kun står 'diabetes', og ikke hverken 'type 1-diabetes' eller 'type 2-diabetes', skal du blot skrive 'diabetes'. \
        Du vil blive straffet meget hårdt, hvis du ikke følger alle de instruktioner, som du har fået. \
        Her er teksten: ",
      en: "Make a summary in English of no more than 300 words of this text (given in the numbered list below and delimited by three backticks), which consists of abstracts of scientific studies. Write the text in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject. Make the text as simple and clear as possible. The summary must be structured as follows: \
		1) Do NOT use bullet points, ie. '1)', '2)' etc. \
	    2) IMPORTANT: When mentioning a study, ALWAYS insert a reference to the individual study within the text itself as a clickable link in Markdown format in this form: **[(Last name of the first author + et al., if there are more authors + , year)](#PMID \"Scroll down to this article\")** where PMID is equal to the PMID of the reference in question, only numbers are allowed, not letters. DO NOT include a reference list at the end. \
        3) Start by describing what all the studies show collectively, but only if they are actually about the same topic. \
        4) If there are significant differences between the studies, describe these differences. \
        If an abstract only mentions 'diabetes' and neither 'type 1 diabetes' nor 'type 2 diabetes', you should just write 'diabetes'. \
        You will be penalized severely if you do not follow the instructions you have received. \
        Here is the text: ",
    }),
  },
];
// The content of the prompt text for summarizing multiple abstracts is contained in this object in order to compose it in code.
export const promptTextMultipleAbstracts = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    startText: {
      dk: `Du er en sundhedsvidenskabelig fagperson, som skriver på dansk i et let forståeligt sprog og altid indsætter henvisninger til enkelte studier i teksten, 
      hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne fra listen. Du skriver aldrig i førsteperson. 
      Lav en opsummering på dansk, som fylder mindst 250 ord, men højst 30% af den samlede oprindelige tekst, 
      af nedenstående tekst (angivet i den nummererede liste nedenfor og afgrænset af triple backticks), som udgøres af en række søgeresultater. 
      Hvert enkelt søgeresultat består en titel, en kilde og et abstracts af et videnskabeligt studie. 
      Skriv teksten, så den bliver meget let at forstå for en yngre person på 18 år, som ikke har nogen viden om emnet. 
      Skriv teksten så simpel og klar som muligt med et LIX-tal på under 25. Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. 
      Alle udsagn i opsummeringen skal altid kunne genfindes i den oprindelige tekst. Opbyg opsummeringen således: 
      - Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. 
      - Skriv dernæst selve opsummeringen af studierne - gerne ved brug af korrekt punktopstilling. Anvend kun et niveau i punktopstillinger. 
      VIGTIGE instrukser: 
      - Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. 
      Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, dvs. de skal indsættes på denne form:
      **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, hvor PMID er PMID-nummeret for studiet, udelukkende med tal. 
      Indsæt IKKE en referenceliste til sidst. 
      - Ved punktopstillinger, så brug Markdown language. Du må aldrig lave en nummereret liste med kun et punkt. 
      - Brug gerne overskrifter, men indled aldrig det allerførste afsnit med en overskrift. 
      - Brug sentence case, aldrig title case, i overskrifter og underoverskrifter. I sentence case er kun det første ord med stort begyndelsesbogstav. 
      Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, hver gang du omtaler noget, 
      som stammer fra et eller flere bestemte af studierne på listen: 
      ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. 
      Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet og 
      tidligere historie med depression **[(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\")**. 
      En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. 
      Kvinder med diabetes har en højere forekomst af depression end mænd 
      **([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\"))**.´´´ \
      `,
      en: `You are a health science professional who writes in English in an easy-to-understand language and always inserts references to individual studies in the text 
      every time you mention something that originates from one or more specific studies from the list. You never write in the first person.
      Create a summary in English of at least 250 words, but no more than 30% of the total original text, 
      of the text below (indicated in the numbered list below and delimited by triple backticks),
      which is made up of a number of search results. Each individual search result consists of a title, 
      a source and an abstract of a scientific study. Write the text so that it will be very easy to understand for a younger person of 18 years who has no knowledge about the subject.
      Write the text as simply and clearly as possible with a LIX number of less than 25. Explain difficult words and technical terms in brackets,
      which are inserted immediately after the word in question. Structure the summary as follows:
      - Start by describing what all the studies show overall. If there are significant differences between the studies, describe these differences.
      - Next, write the actual summary of the studies.
      IMPORTANT instructions:
      - When you mention a study, ALWAYS insert a reference to the individual study inside the text itself as a clickable link in Markdown format in this form:
      **[(Last name of the first author + et al., if there are several authors + , year)](#PMID \"Scroll down to this article\")** where PMID is equal to the PMID of the reference in question, numbers only, not letters.
      DO NOT include a reference list at the end.
      - For bullet points, use Markdown language. You may never make a numbered list with only one point.
      - Use sentence case, never title case, in headings and subheadings. In sentence case only the first word is capitalized.
      Here is an example (delimited by triple backticks) of how you should always insert references to the individual studies in the text itself, every time you mention something that originates from one or more specific studies in the list:
      ´´´A systematic review and meta-analysis shows that the incidence of postpartum depression is high, especially in developing countries.
      Six risk factors for postpartum depression have been identified, including gestational diabetes, depression during pregnancy, and previous history of depression
      **[(Liu et al., 2022)](#12345678 \"Scroll down to this article\")**.
      A systematic review of epidemiological studies shows that there is a high incidence of depression in people with diabetes.
      Women with diabetes have a higher incidence of depression than men **([Roy & Lloyd, 2012](#87654321 \"Scroll down to this article\"); [Samuelsen, 2018](#12873465 \"Scroll down to this article \"))**.´´´
      `,
    },
    endText: {
      dk: `Her er tektsten: `,
      en: `Here is the text: `,
    },
  },
  {
    name: "Fagsprog",
    translations: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    startText: {
      dk: `Du er en sundhedsvidenskabelig fagperson, som skriver på dansk i et let forståeligt sprog og altid indsætter henvisninger til enkelte studier i teksten, 
      hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne fra listen. Du skriver aldrig i førsteperson. 
      Lav en opsummering på dansk, som fylder mind `,
      en: `Lav en opsummering på dansk på højst 300 ord af denne tekst (givet i den numererede liste nedenfor og afgrænset af tre backticks), som udgøres af abstracts af videnskabelige studier. 
      Skriv teksten på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. 
      Gør teksten så simpel og klar som mulig. Opsummeringen skal opbygges således: 
      1) Brug IKKE punktopstilling, dvs. '1)', '2)' osv. Skriv altid type 1-diabetes og type 2-diabetes med bindestreng, og skriv aldrig sukkersyge. 
      Brug altid dansk tusindtalsseparator, dvs. f.eks. '1.234', ikke '1,234'.
      2) Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. 
      Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, 
      dvs. de skal indsættes på denne form **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, 
      hvor PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE en referenceliste til sidst. 
      Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, 
      hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: 
      ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. 
      Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet 
      og tidligere historie med depression **[(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\")**. 
      En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. 
      Kvinder med diabetes har en højere forekomst af depression end mænd 
      **([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\"))**.´´´ \
      3) Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. 
      4) Skriv til dernæst selve opsummeringen af studierne.`,
    },
    endText: {
      dk: `Her er tektsten: `,
      en: `Here is the text: `,
    },
  },
];

// SINGLE ABSTRACT PROMPTS SECTION

// Prompt object for summarizing single search result abstract
export const summarizeAbstractPrompt = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    tooltip: {
      dk: "Opsummering skrevet i et sprog, som er nemt at forstå, selvom man ikke har forhåndskendskab til emnet.",
      en: "Summary written in a language that is easy to understand, even without prior knowledge of the subject.",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "chatgpt-4o-latest",
    // The openAi model to use. The models have different strengths and costs, to learn more about them see: https://platform.openai.com/docs/models/overview
    top_p: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    temperature: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    presence_penalty: null,
    // Optional (min: -2.0, max: 2.0, default: 0.0)
    frequency_penalty: null,
    // Optional (min: -2.0, max: 2.0, default: 0.0)
    max_tokens: 4000,
    // Optional (min/max value depends on model)
    prompt: sanitizePrompt({
      // Required in at least one language, but it is recommended to have both languages to ensure the summary provided matches the user's language.
      dk: "Lav en opsummering på dansk på højst 150 ord af denne tekst, som udgøres af et abstract af en videnskabelig artikel. Skriv teksten, så den bliver meget let at forstå for en yngre dansk person på 18 år, som ikke har nogen viden om emnet. Gør teksten så simpel og klar som muligt med et LIX-tal på under 25. Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. \
		  Start med at angive, hvad studiet konkluderer. \
		  Følg altid disse skriveregler: \
      - Skriv altid 'type 1-diabetes', men skriv aldrig 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' e.l. \
      - Skriv altid 'type 2-diabetes', men skriv aldrig 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' e.l. \
      - Skriv altid 'person med diabetes', men skriv aldrig 'diabetiker', 'diabetespatient' e.l. \
      - Skriv altid 'diabetes', men skriv aldrig 'sukkersyge' \
      - Skriv altid 'prædiabetes', men skriv aldrig 'prediabetes' \
		  - Brug dansk notation for tal, hvor tusindtalsseparator er et punktum (.) og decimaltegn er et komma (,). Skriv kun tal med korrekt format i din opsummering. \
		  Andre regler: \
		  - Hvis der i et abstract kun står 'diabetes', og ikke hverken 'type 1-diabetes' eller 'type 2-diabetes', skal du blot skrive 'diabetes'. \
      Du vil blive straffet hårdt, hvis du ikke følger alle de instruktioner, som du har fået. \
		  Her er teksten: ",
      en: "Make a summary in English of no more than 150 words of this text, which is made up of an abstract of a scientific article. Write the text so that it will be very easy to understand for a younger person of 18 years who has no knowledge about the subject. Make the text as simple and clear as possible with a LIX number of less than 25. Explain difficult words and technical terms in parantheses, which are inserted immediately after the word in question. Start by stating what the study concludes. \
      If an abstract only mentions 'diabetes' and neither 'type 1 diabetes' nor 'type 2 diabetes', you should just write 'diabetes'. \
      You will be penalized severely if you do not follow the instructions you have received. \
      Here is the text: ",
    }),
  },
  {
    name: "Fagsprog",
    translations: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    tooltip: {
      dk: "Opsummering skrevet i et sprog, som er nemt forståeligt for fagpersoner med forhåndskendskab til emnet.",
      en: "Summary written in a language that is easily understood by professionals with prior knowledge of the subject.",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "chatgpt-4o-latest",
    top_p: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    temperature: 0.1,
    // Optional(min: 0.0, max: 2.0, default: 1.0)
    presence_penalty: null,
    frequency_penalty: null,
    max_tokens: 4000,
    // Optional (min/max value depends on model)
    prompt: sanitizePrompt({
      dk: "Lav en opsummering på dansk på højst 150 ord af denne tekst, som udgøres af et abstract af en videnskabelig artikel. Skriv teksten på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. Start med at angive, hvad alle studiet konkluderer. \
		  Følg altid disse skriveregler: \
      - Skriv altid 'type 1-diabetes', men skriv aldrig 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' e.l. \
      - Skriv altid 'type 2-diabetes', men skriv aldrig 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' e.l. \
      - Skriv altid 'person med diabetes', men skriv aldrig 'diabetiker', 'diabetespatient' e.l. \
      - Skriv altid 'diabetes', men skriv aldrig 'sukkersyge' \
      - Skriv altid 'prædiabetes', men skriv aldrig 'prediabetes' \
		  - Brug dansk notation for tal, hvor tusindtalsseparator er et punktum (.) og decimaltegn er et komma (,). Skriv kun tal med korrekt format i din opsummering. \
		  Andre regler: \
		  - Hvis der i et abstract kun står 'diabetes', og ikke hverken 'type 1-diabetes' eller 'type 2-diabetes', skal du blot skrive 'diabetes'. \
      Du vil blive straffet meget hårdt, hvis du ikke følger alle de instruktioner, som du har fået. \
		  Her er teksten: ",
      en: "Make a summary in English of no more than 150 words of this text, which consists of an abstract of a scientific article. Write the text in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject. Start by stating what all the studies conclude. \
      If an abstract only mentions 'diabetes' and neither 'type 1 diabetes' nor 'type 2 diabetes', you should just write 'diabetes'. \
      You will be penalized severely if you do not follow the instructions you have received. \
      Here is the text: ",
    }),
  },
];
// The content of the prompt text for summarizing multiple abstracts is contained in this object in order to compose it in code.
export const promptTextSingleAbstract = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    startText: {
      dk: `Lav en opsummering på dansk på højst 150 ord af denne tekst, som udgøres af et abstract af en videnskabelig artikel. 
      Skriv teksten, så den bliver meget let at forstå for en yngre dansk person på 18 år, som ikke har nogen viden om emnet. 
      Gør teksten så simpel og klar som muligt med et LIX-tal på under 25. 
      Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. 
      Start med at angive, hvad studiet konkluderer.`,
      en: `Make a summary in English of no more than 150 words of this text, which is made up of an abstract of a scientific article.
      Write the text so that it will be very easy to understand for a younger person of 18 years who has no knowledge about the subject.
      Make the text as simple and clear as possible with a LIX number of less than 25.
      Explain difficult words and technical terms in parantheses, which are inserted immediately after the word in question.
      Start by stating what the study concludes.`,
    },
    endText: {
      dk: `Her er tektsten: `,
      en: `Here is the text: `,
    },
  },
  {
    name: "Fagsprog",
    translations: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    startText: {
      dk: `Lav en opsummering på dansk på højst 150 ord af denne tekst, som udgøres af et abstract af en videnskabelig artikel.
      Skriv teksten på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. 
      Start med at angive, hvad studiet konkluderer.`,
      en: `Make a summary in English of no more than 150 words of this text, which consists of an abstract of a scientific article.
      Write the text in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject.
      Start by stating what all the studies conclude.`,
    },
    endText: {
      dk: `Her er tektsten: `,
      en: `Here is the text: `,
    },
  },
];
