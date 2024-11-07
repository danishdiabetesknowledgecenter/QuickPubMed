export function getPromptForLocale(prompt, locale) {
  var localePrompt = {
    ...prompt,
    translations: null,
    name: null,
    prompt: prompt.prompt && prompt.prompt[locale],
    messages: prompt.messages && prompt.messages[locale],
  };
  Object.keys(localePrompt).forEach(function (key) {
    if (localePrompt[key] == null) delete localePrompt[key];
  });

  return localePrompt;
}

/**
 *
 * @param {*} prompt an object containing the prompt for different languages
 * @returns the same object with prompts treated to make them more token friendly
 */
export function sanitizePrompt(prompt) {
  var langs = Object.keys(prompt);
  for (k = 0; k < langs.length; k++) {
    var lg = langs[k];
    // Remove suplurflous whitespace to reduce token count
    var sanitizedPrompt = prompt[lg]
      .split(" ")
      .filter(function (e) {
        return e;
      })
      .join(" ")
      .split("\n")
      .filter(function (e) {
        return e;
      })
      .join("\n");
    prompt[lg] = sanitizedPrompt;
  }

  return prompt;
}

/**
 *
 * @param {*} messages an object containing the message history for different languages
 * @returns the same object with messages treated to make them more token friendly
 */
export function sanitizeMessages(messages) {
  const langs = Object.keys(messages);
  for (k = 0; k < langs.length; k++) {
    var lg = langs[k];
    var sanitizedMessages = messages[lg]
      .map((message) => {
        const sanitizedContent = message.content
          .split(" ")
          .filter(function (e) {
            return e;
          })
          .join(" ")
          .split("\n")
          .filter(function (e) {
            return e;
          })
          .join("\n");

        if (sanitizedContent.trim() == "") {
          return null;
        }

        const sanitizedMessage = Object.assign({}, message, {
          content: sanitizedContent,
        });
        return sanitizedMessage;
      })
      .filter((message) => message != null);

    // Explicitly let the messages be missing so it can be filtered out before sending to backend
    if (sanitizedMessages.length == 0) {
      sanitizedMessages = null;
    }

    messages[lg] = sanitizedMessages;
  }
  return messages;
}

export const searchSummaryPrompts = [
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
    model: "gpt-4o",
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
    model: "gpt-4o",
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

// Used to summarize from a list of summaries. Used when the abstracts themselves are too long.
export const summarizeSummaryPrompts = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "gpt-4o",
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
        Lav en opsummering på dansk, som fylder mindst 250 ord, men højst 30% af den samlede oprindelige tekst, af denne tekst (angivet i den nummererede liste nedenfor og afgrænset af triple backticks), som udgøres af en række søgeresultater. Hvert enkelt søgeresultat består en titel, en kilde og et abstracts af et videnskabeligt studie. Skriv teksten, så den bliver meget let at forstå for en yngre person på 15 år, som ikke har nogen viden om emnet. Skriv teksten så simpel og klar som muligt med et LIX-tal på under 25. Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. Opbyg opsummeringen således: \
        - Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. \
        - Skriv dernæst selve opsummeringen af studierne. \
        VIGTIGE instrukser: \
        - Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, dvs. de skal indsættes på denne form **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, hvor PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE en referenceliste til sidst. \
        - Ved punktopstillinger, så brug Markdown language. \
        Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: \
        ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet og tidligere historie med depression **[(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\")**. En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. Kvinder med diabetes har en højere forekomst af depression end mænd **([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\")**.´´´ \
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
      en: "You are a health science professional who writes in English in an easy-to-understand language and always inserts references to individual studies in the text every time you mention something that originates from one or more specific studies from the list. You never write in the first person. \
		Create a summary in English of at least 250 words, but no more than 30% of the total original text, of the text below (indicated in the numbered list below and delimited by triple backticks), which is made up of a number of search results. Each individual search result consists of a title, a source and an abstract of a scientific study. Write the text so that it will be very easy to understand for a younger person of 18 years who has no knowledge about the subject. Write the text as simply and clearly as possible with a LIX number of less than 25. Explain difficult words and technical terms in brackets, which are inserted immediately after the word in question. Structure the summary as follows: \
		- Start by describing what all the studies show overall. If there are significant differences between the studies, describe these differences. \
		- Next, write the actual summary of the studies. \
        IMPORTANT instructions: \
        - When you mention a study, ALWAYS insert a reference to the individual study inside the text itself as a clickable link in Markdown format in this form: **[(Last name of the first author + et al., if there are several authors + , year)](#PMID \"Scroll down to this article\")** where PMID is equal to the PMID of the reference in question, numbers only, not letters. DO NOT include a reference list at the end. \
        - For bullet points, use Markdown language. \
        Here is an example (delimited by triple backticks) of how you should always insert references to the individual studies in the text itself, every time you mention something that originates from one or more specific studies in the list: \
        ´´´A systematic review and meta-analysis shows that the incidence of postpartum depression is high, especially in developing countries. Six risk factors for postpartum depression have been identified, including gestational diabetes, depression during pregnancy, and previous history of depression **[(Liu et al., 2022)](#12345678 \"Scroll down to this article\")**. A systematic review of epidemiological studies shows that there is a high incidence of depression in people with diabetes. Women with diabetes have a higher incidence of depression than men **([Roy & Lloyd, 2012](#87654321 \"Scroll down to this article\"); [Samuelsen, 2018](#12873465 \"Scroll down to this article \"))**.´´´ \
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
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "gpt-4o",
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
		1) Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, dvs. de skal indsættes på denne form **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, hvor PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE en referenceliste til sidst. \
        2) Start med at beskrive, hvad alle studierne samlet set viser, men kun, hvis de faktisk handler om det samme emne. \
        3) Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. \
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

export const shortenAbstractPrompts = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "gpt-4o",
    // The openAi model to use. The models have different strengths and costs, to learn more about them see: https://platform.openai.com/docs/models/overview
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
      dk: "Summarize this scientific abstract (delimited by three backticks) in maximum 200 words: ",
      en: "Summarize this scientific abstract (delimited by three backticks) in maximum 200 words: ",
    }),
  },
  {
    name: "Fagsprog",
    translations: {
      dk: "Fagsprog",
      en: "Professional language",
    },
    // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
    model_token_limit: 128000,
    // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
    model: "gpt-4o",
    temperature: 0.1,
    presence_penalty: null,
    frequency_penalty: null,
    max_tokens: 4000,
    // Optional (min/max value depends on model)
    prompt: sanitizePrompt({
      dk: "Summarize this scientific abstract (delimited by three backticks) in maximum 200 words: ",
      en: "Summarize this scientific abstract (delimited by three backticks) in maximum 200 words: ",
    }),
  },
];

export const abstractSummaryPrompts = [
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
    model: "gpt-4o",
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
    model: "gpt-4o",
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

export const titleTranslationPrompt = {
  name: "translate",
  translations: {
    dk: "dansk",
  },
  // Each model has its own limit for the number of tokens it can handle. However, it is difficult to determine the limit dynamically. Please adjust this number to match the one given here: https://platform.openai.com/docs/models
  model_token_limit: 128000,
  // Below are a series of openAi parameters. To learn more about them see: https://platform.openai.com/docs/api-reference/completions/create
  model: "gpt-4o",
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
		På en ny linje skal du skrive en meget kort og nøgtern version af titlen på denne form ved brug af Markdown: *Kort version:* Den korte version. \
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
    dk: 'Du er en oversætter, der oversætter et givet input til en korrekt PubMed-søgestreng. Ud fra det input, du modtager, skal du finde de mest relevante sundhedsvidenskabelige engelske termer, inkl. oftest anvendte synonymer og stavemåder, som kan bruges til af udforme en korrekt PubMed-søgning, og som giver de mest relevante resultater, der passer til inputtet. De termer, som du vælger at bruge i PubMed-søgestrengen, skal være termer, som ofte bruges i titler eller abstracts i sundhedsvidenskabelig litteratur, og som derfor er velegnede at bruge i en PubMed-søgestreng. Hvis inputtet er formuleret som et spørgsmål, skal du identificere de mest centrale termer i spørgsmålet og derefter bruge disse termer til at udforme PubMed-søgestrengen. Du må aldrig bruge search fields tags såsom [ti], [tiab] og [mh]. Eneste undtagelse er, hvis inputtet er et DOI, hvor du altid returnere et output, der er formatteret sådan: "DOI"[aid], f.eks. "10.1080/10408398.2018.1430019"[aid]. Brug kun de boolske operatorer OR og AND, men aldrig NOT. Brug kun anførselstegn, når de er vigtige for, at begrebet forstås rigtig af PubMeds automatic term mapping, ellers skal du undlade at bruge anførselstegn. Brug gerne parenteser, men placér dem korrekt, så du altid udformer en korrekt og brugbar PubMed-søgestreng. Du skal svare med en PubMed-søgestreng, som umiddelbart kan indsættes som en søgning i PubMed, og intet andet. Vær opmærksom på typiske stavefejl, som en dansk person kan lave, når du skal forstå, hvad der menes - dvs. at du særligt skal kunne tolke, når inputtet på dansk fonetisk ligner et korrekt og relevant ord på engelsk. Hvis du ikke ved, hvordan du skal oversætte inputtet, eller noget går galt, skal du alene svare med følgende ord og intet andet: \'Det indtastede kan ikke oversættes til en søgning. Prøv igen.\'. \
        Du vil blive straffet meget hårdt, hvis du ikke følger de instruktioner, som du har fået. \
        Her er inputtet, som du skal oversætte til en PubMed-søgestreng: ',
    en: 'You are a translator who translates a given input into a correct PubMed search string. Based on the input you receive, you must identify the most relevant health science English terms, including commonly used synonyms and spellings, which can be used to create a correct PubMed search that yields the most relevant results matching the input. The terms you choose to use in the PubMed search string must be terms frequently used in titles or abstracts in health science literature, making them suitable for use in a PubMed search. If the input is phrased as a question, you must identify the most central terms in the question and then use these terms to construct the PubMed search string. You must never use search field tags such as [ti], [tiab], and [mh]. The only exception is if the input is a DOI, where you always return an output formatted like this: "DOI"[aid], e.g., "10.1080/10408398.2018.1430019"[aid]. Use only the Boolean operators OR and AND, but never NOT. Use quotation marks only when they are essential for the correct understanding of the concept by PubMed\'s automatic term mapping; otherwise, avoid using quotation marks. Feel free to use parentheses, but place them correctly to always create a correct and usable PubMed search string. You must respond with a PubMed search string that can be immediately inserted as a search in PubMed, and nothing else. Be aware of common spelling mistakes that a layperson might make when you need to understand what is meant - i.e. you must particularly be able to interpret when the input phonetically resembles a correct and relevant English word. If you do not know how to translate the input, or something goes wrong, you must respond with the following words and nothing else: \'The input cannot be translated into a search. Please try again.\'. \
        You will be penalized severely if you do not follow the instructions you have received. \
        Here is the input you must translate into a PubMed search string: ',
  }),
};

/**
 * Setup text for the prompt to start the summarization of an article
 */
export const promptStartText = {
  dk: `Du skal svare i JSON-format. Der skal være 3 key-value pairs i dit svar. 
  Den første key skal hedde isArticle og kan enten være true eller false. 
  Den anden key skal hedde questions, og value skal være et array. 
  Den tredje key skal hedde answers, og value skal være et array med svarene på spørgsmålene. 
  Du skal undersøge, om den givne tekst er en videnskabelig artikel. 
  Hvis det er en videnskabelig artikel, skal du sætte value IsArticle til true ellers til false. 
  Hvis det er en videnskabelig artikel, skal du derefter tilføje følgende spørgsmål til array'et, der er value for questions key'en:`,
  en: `You must respond in JSON format. There must be 3 key-value pairs in your response. 
  The first key must be called isArticle and can be either true or false. 
  The second key must be called questions, and the value must be an array. 
  The third key must be called answers, and the value must be an array with the answers to the questions. 
  You must investigate whether the given text is a scientific article. 
  If it is a scientific article, you must set the value IsArticle to true, otherwise to false. 
  If it is a scientific article, you must then add the following questions to the array that is the value for the questions key: `,
};

/**
 * The default questions to ask the model for summarizing of an article
 * Includes standard questions that are mapped to short titles,
 * and one to three article specific generated questions that use the question as the title
 */
export const promptQuestions = {
  dk: `Lav en kort opsummering baseret på artiklens samlede tekst. 
  Hvad er formålet med denne artikel? 
  Hvilke metoder blev anvendt? 
  Hvad er resultaterne? 
  Hvilke konklusioner drages i artiklen? 
  Hvilke styrker og svagheder er der i studiet? 
  Hvilke mulige interessekonflikter har forfatterne til studiet? 
  Du skal herefter tilføje 2 eller 3 ekstra spørgsmål der har relevance for denne artikel. `,
  en: `Make a brief summary based on the overall text of the article. 
  What is the purpose of this article? 
  What methods were used? 
  What are the results? 
  What conclusions are drawn in the article? 
  What are the strengths and weaknesses of the study? 
  What possible conflicts of interest do the authors of the study have? 
  You must then add 2 or 3 extra questions that are relevant for this article.`,
};

/**
 * Plain language text for use in prompting targeting a general audience
 */
export const promptEndTextPlainLanguage = {
  dk: "Du skal generere svar til disse spørgsmål, og disse svar skal bestå af maksimalt 100 ord og skal skrives i et sprog, som nemt kan læses og forstås af en 15-årig uden forhåndskendskab til emnet, og tilføje svarende til array'et, der er value for answers key'en. \
      Du skal ikke svare med andent end json formatet. Du skal derfor ikke bruge tegnet ` eller skrive json i starten eller slutningen af svaret. Her er teksten:",
  en: "You must then generate answers to these questions, and these answers must consist of 100 words and must be written in a language that can be easily read and understood by a 15-year-old without prior knowledge of the subject, and add corresponding to the array that is the value for answers key'en. \
      You must not respond with anything other than JSON format. You must therefore not use the character ` or write json at the beginning or end of the response. Here is the text:",
};

/**
 * Professional language text for use in prompting targeting a professional audience
 */
export const promptEndTextProfessionelLanguage = {
  dk: "Du skal generere svar til alle spørgsmål, og disse svar skal bestå af maksimalt 100 ord og skal skrives på fagsprog som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet, og tilføje svarende til array'et, der er value for answers key'en.\
      Du må ikke svare med andent end json formatet. Du skal derfor ikke bruge tegnet ` eller skrive json i starten eller slutningen af svaret. Her er teksten:",
  en: "You must then generate answers to these questions, and these answers must consist of 100 words and must be written in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject, and add corresponding to the array that is the value for answers key'en. \
      You must not respond with anything other than JSON format. You must therefore not use the character ` or write json at the beginning or end of the response. Here is the text:",
};

/**
 * Prompt text for only allowing answers that are specific to the content of the article
 */
export const promptArticleSpecificAnswersOnly = {
  dk: `Det er ekstremt vigtigt at du kun besvarer spørgsmål, hvis det er relevant for tekstens indhold. Hvis spørgsmålet omhandler andet end tekstens indhold, svar altid med "Ikke relevant for denne artikel". `,
  en: `It is very important that you only answer the questions asked if they are relevant to this article, and that you do not answer questions that are not relevant to this article. `,
};

/**
 * Prompt text for use in prompting to adhere to specific domain rules for diabetes
 */
export const diabetesSpecificPromptRules = {
  dk: `Følg altid disse skriveregler: \
  Skriv altid 'type 1-diabetes', men skriv aldrig 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' e.l. 
  Skriv altid 'type 2-diabetes', men skriv aldrig 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' e.l. 
  Skriv altid 'person med diabetes', men skriv aldrig 'diabetiker', 'diabetespatient' e.l. 
  Skriv altid 'diabetes', men skriv aldrig 'sukkersyge' 
  Skriv altid 'prædiabetes', men skriv aldrig 'prediabetes' 
  Brug dansk notation for tal, hvor tusindtalsseparator er et punktum (.) og decimaltegn er et komma (,). Skriv kun tal med korrekt format i din opsummering. 
  Hvis der i en artikel kun står 'diabetes', og ikke hverken 'type 1-diabetes' eller 'type 2-diabetes', skal du blot skrive 'diabetes'. 
  Du vil blive straffet meget hårdt, hvis du ikke følger alle de instruktioner, som du har fået.`,
  en: `Always follow these writing rules: 
  Always write 'type 1-diabetes', but never write 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' etc. 
  Always write 'type 2-diabetes', but never write 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' etc. 
  Always write 'person with diabetes', but never write 'diabetic', 'diabetes patient' etc. 
  Always write 'diabetes', but never write 'sugar disease' 
  Always write 'prediabetes', but never write 'prediabetes' 
  Use Danish notation for numbers, where the thousands separator is a period (.) and the decimal point is a comma (,). Only write numbers with the correct format in your summary. \
  If an article only mentions 'diabetes', and neither 'type 1 diabetes' nor 'type 2 diabetes', you should just write 'diabetes'. 
  You will be penalized severely if you do not follow the instructions you have received.`,
};

/**
 * EXAMPLE (Add more similair to this for other domains)
 * Use it in the domainSpecificPromptingRules object
 * Prompt text for use in prompting to adhere to specific domain rules for dementia
 */
export const dementiaSpecificPromptRules = {
  dk: `Følg altid disse skriveregler: 
  Skriv domæne specifikke regler her
  Du vil blive straffet meget hårdt, hvis du ikke følger alle de instruktioner, som du har fået.`,
  en: `Always follow these writing rules: 
  Write domain specific rules here
  You will be penalized severely if you do not follow the instructions you have received.`,
};

/**
 * Contains different writting rules specific for a domain, to be used when prompting the ai model.
 * Will be found based on the string set in appSettings.openAi.domain (eg "diabetes" or "dementia")
 */
export const domainSpecificPromptingRules = {
  diabetes: diabetesSpecificPromptRules,
  dementia: dementiaSpecificPromptRules,
};

/**
 * Basic Prompt for summarizing an article in plain language and professional language.
 * The prompt field should be composed in the code for better maintaning, scalling and readability.
 */
export const summarizeArticlePrompt = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    model_token_limit: 128000,
    model: "gpt-4o",
    temperature: null,
    presence_penalty: null,
    frequency_penalty: null,
    max_tokens: 3000,
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
    model: "gpt-4o",
    temperature: null,
    presence_penalty: null,
    frequency_penalty: null,
    max_tokens: 3000,
    stream: true,
    type: "json_object",
    prompt: {
      dk: "",
      en: "",
    },
  },
];
