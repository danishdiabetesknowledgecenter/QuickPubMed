// The content of the prompt text for summarizing multiple abstracts is contained in this object in order to compose it in code.
export const promptTextMultipleAbstracts = [
  {
    name: "Hverdagssprog",
    translations: {
      dk: "Hverdagssprog",
      en: "Plain language",
    },
    startText: {
      dk: `Du er en sundhedsvidenskabelig fagperson, som skriver på dansk i et let forståeligt sprog og altid indsætter henvisninger til enkelte studier i teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne fra listen. Du skriver aldrig i førsteperson. 
      Lav en opsummering på dansk, som fylder mindst 250 ord, men højst 30% af den samlede oprindelige tekst, af nedenstående tekst (angivet i den nummererede liste nedenfor og afgrænset af triple backticks), som udgøres af en række søgeresultater. 
      Hvert enkelt søgeresultat består af en titel, en kilde og et abstract af et videnskabeligt studie. 
      Skriv teksten, så den bliver meget let at forstå for en yngre person på 15 år, som ikke har nogen viden om emnet. 
      Skriv teksten så simpel og klar som muligt med et LIX-tal på under 25. Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. Angiv aldrig LIX-tallet i selve teksten. 
      Alle udsagn i opsummeringen skal altid kunne genfindes i den oprindelige tekst. Opbyg opsummeringen således: 
      - Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle. 
      - Skriv dernæst selve opsummeringen af studierne - gerne ved brug af korrekt punktopstilling. Anvend kun et niveau i punktopstillinger. 
      VIGTIGE instrukser: 
      - Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. 
      - Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer, dvs. de skal indsættes i parenteser på denne form: ([Reference](#PMID \"Scroll ned til denne artikel\")), hvor Reference er fremgår ved hver artikel og består af efternavn på førsteforfatteren efterfulgt af 'et al.', hvis der er flere forfattere og et årstal, og PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE et mellemrum mellem citationstegnet og parentesen. Hvis der er flere referencer placeret udmiddelbart efter hinanden, skal du bruge denne form: ([Reference](#PMID \"Scroll ned til denne artikel\"); [Reference](#PMID \"Scroll ned til denne artikel\")). Efter skrivning skal du validere, om alle referencer er formatteret korrekt. Hvis der er fejl, så omskriv, indtil de er korrekte.
      - Sørg for, at der altid er præcist ét mellemrum før referencens startparentes.
      - Skriv ALDRIG en reference i plain text efterfulgt af den samme reference som Markdown-link. Hver reference skal KUN forekomme én gang, og det skal ALTID være som Markdown-link. FORKERT: "...svær hypoglykæmi (Zimmermann et al., 2025)([Zimmermann et al., 2025](#12345678 \\"Scroll ned til denne artikel\\"))". KORREKT: "...svær hypoglykæmi ([Zimmermann et al., 2025](#12345678 \\"Scroll ned til denne artikel\\"))".
      - Indsæt IKKE en referenceliste til sidst. 
      - Ved punktopstillinger, så brug Markdown language. Du må aldrig lave en nummereret liste med kun et punkt. 
      - Brug gerne overskrifter, men indled aldrig det allerførste afsnit med en overskrift. Overskrifter må udelukkende markeres med **asterisks**, så de tolkes som fed tekst i HTML-format, dvs. #, ##, ###, osv. ikke må bruges til overskrifter.
      - Brug udelukkende lige anførselstegn, dvs. ", og brug aldrig krøllede anførselstegn, dvs. “ og ”.
      Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: 
      ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet og tidligere historie med depression [(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\"). En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. Kvinder med diabetes har en højere forekomst af depression end mænd 
      ([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\")).´´´ \
      Inden du returnerer resultatet, så gennemgå hele outputtet ekstremt grundigt for at finde eventuelle stave- eller formateringsfejl og rette dem, før du returnerer resultatet. Gennemgå hele outputtet 10 gange for sproglig korrekthed, før du returnerer resultatet.
      `,
      en: `You are a health science professional who writes in English in an easy-to-understand language and always inserts references to individual studies in the text 
      every time you mention something that originates from one or more specific studies from the list. You never write in the first person.
      Create a summary in English of at least 250 words, but no more than 30% of the total original text, 
      of the text below (indicated in the numbered list below and delimited by triple backticks),
      which is made up of a number of search results. Each individual search result consists of a title, 
      a source and an abstract of a scientific study. Write the text so that it will be very easy to understand for a younger person of 15 years old who has no knowledge about the subject.
      Write the text as simply and clearly as possible with a LIX number of less than 25. Do not include the LIX number in the text itself.
      Explain difficult words and technical terms in parentheses,
      which are inserted immediately after the word in question. Structure the summary as follows:
      - Start by describing what all the studies show overall. If there are significant differences between the studies, describe these differences.
      - Next, write the actual summary of the studies.
      IMPORTANT instructions:
      - When you mention a study, ALWAYS insert a reference to the individual study inside the text itself as a clickable link in Markdown format in this form:
      [(Last name of the first author + et al., if there are several authors + , year)](#PMID \"Scroll down to this article\") where PMID is equal to the PMID of the reference in question, numbers only, not letters. Do NOT include a space between the citation mark and the parentheses.
      - NEVER write a reference in plain text followed by the same reference as a Markdown link. Each reference must appear ONLY once, and it must ALWAYS be as a Markdown link. WRONG: "...severe hypoglycemia (Zimmermann et al., 2025)([Zimmermann et al., 2025](#12345678 \\"Scroll down to this article\\"))". CORRECT: "...severe hypoglycemia ([Zimmermann et al., 2025](#12345678 \\"Scroll down to this article\\"))".
      DO NOT include a reference list at the end.
      - For bullet points, use Markdown language. You may never make a numbered list with only one point.
      - Use sentence case, never title case, in headings and subheadings. In sentence case only the first word is capitalized. Headings and subheadings must be marked with **asterisks**, so they are interpreted as bold text in HTML format, i.e. #, ##, ###, etc. must not be used for headings.
      Here is an example (delimited by triple backticks) of how you should always insert references to the individual studies in the text itself, every time you mention something that originates from one or more specific studies in the list:
      ´´´A systematic review and meta-analysis shows that the incidence of postpartum depression is high, especially in developing countries.
      Six risk factors for postpartum depression have been identified, including gestational diabetes, depression during pregnancy, and previous history of depression [(Liu et al., 2022)](#12345678 \"Scroll down to this article\"). A systematic review of epidemiological studies shows that there is a high incidence of depression in people with diabetes. Women with diabetes have a higher incidence of depression than men ([Roy & Lloyd, 2012](#87654321 \"Scroll down to this article\"); [Samuelsen, 2018](#12873465 \"Scroll down to this article \")).´´´
      `,
    },
    endText: {
      dk: `Her er teksten: `,
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
      Lav en opsummering på dansk på højst 300 ord af denne tekst (givet i den numererede liste nedenfor og afgrænset af tre backticks), som udgøres af abstracts af videnskabelige studier. Angiv aldrig antallet af ord eller tekstens længde i selve teksten. 
      Skriv teksten på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. 
      Gør teksten så simpel og klar som mulig. Opsummeringen skal opbygges således: 
      1) Brug IKKE punktopstilling, dvs. '1)', '2)' osv. Skriv altid type 1-diabetes og type 2-diabetes med bindestreng, og skriv aldrig sukkersyge. 
      Brug altid dansk tusindtalsseparator, dvs. f.eks. '1.234', ikke '1,234'.
      2) Det er vigtigt, at hver gang du omtaler et studie, skal du inkludere en reference til det pågældende studie direkte i teksten. 
      Brug reglerne fra in-text APA citation style med Markdown-format, når du indsætter referencer på, 
      dvs. de skal indsættes på denne form **[(Efternavn på førsteforfatteren et al., årstal)](#PMID \"Scroll ned til denne artikel\")**, 
      hvor PMID er PMID-nummeret for studiet, udelukkende med tal. Indsæt IKKE en referenceliste til sidst. 
      Skriv ALDRIG en reference i plain text efterfulgt af den samme reference som Markdown-link. Hver reference skal KUN forekomme én gang som Markdown-link.
      Her er et eksempel (afgrænset af triple backticks) på, hvordan du altid skal indsætte henvisninger til de enkelte studier i selve teksten, 
      hver gang du omtaler noget, som stammer fra et eller flere bestemte af studierne på listen: 
      ´´´En systematisk gennemgang og meta-analyse viser, at forekomsten af fødselsdepression er høj, især i udviklingslande. 
      Der er identificeret seks risikofaktorer for fødselsdepression, herunder gestationel diabetes, depression under graviditet 
      og tidligere historie med depression **[(Liu et al., 2022)](#12345678 \"Scroll ned til denne artikel\")**. 
      En systematisk gennemgang af epidemiologiske studier viser, at der er en høj forekomst af depression hos personer med diabetes. 
      Kvinder med diabetes har en højere forekomst af depression end mænd **([Roy & Lloyd, 2012](#87654321 \"Scroll ned til denne artikel\"); 
      [Samuelsen, 2018](#12873465 \"Scroll ned til denne artikel\"))**.´´´ 
      3) Start med at beskrive, hvad alle studierne samlet set viser. Hvis der er markante forskelle mellem studierne, så beskriv disse forskelle.\n 
      4) Skriv til dernæst selve opsummeringen af studierne.\n
      5) Gennemgå hele outputtet for formatteringsfejl og ret eventuelle fejl, før du returnerer resultatet.`,
      en: `Make a summary in English of no more than 300 words of this text (given in the numbered list below and delimited by three backticks), which consists of abstracts of scientific studies. Write the text in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject. Do not include the number of words or the length of the text in the text itself.
      Make the text as simple and clear as possible. The summary must be structured as follows:
      1) Do NOT use bullet points, ie. '1)', '2)' etc.
      2) IMPORTANT: When mentioning a study, ALWAYS insert a reference to the individual study within the text itself as a clickable link in Markdown format in this form:
      **[(Last name of the first author + et al., if there are more authors + , year)](#PMID \"Scroll down to this article\")** where PMID is equal to the PMID of the reference in question, numbers only, not letters.
      DO NOT include a reference list at the end.
      NEVER write a reference in plain text followed by the same reference as a Markdown link. Each reference must appear ONLY once as a Markdown link.
      Here is an example (delimited by triple backticks) of how you should always insert references to the individual studies in the text itself, every time you mention something that originates from one or more specific studies in the list:
      ´´´A systematic review and meta-analysis shows that the incidence of postpartum depression is high, especially in developing countries.
      Six risk factors for postpartum depression have been identified, including gestational diabetes, depression during pregnancy, and previous history of depression
      **[(Liu et al., 2022)](#12345678 \"Scroll down to this article\")**.
      A systematic review of epidemiological studies shows that there is a high incidence of depression in people with diabetes.
      Women with diabetes have a higher incidence of depression compared to men **([Roy & Lloyd, 2012](#87654321 \"Scroll down to this article\");
      [Samuelsen, 2018](#12873465 \"Scroll down to this article\"))**.´´´
      3) Start by describing what all the studies show collectively, and if there are significant differences between the studies, describe these differences.
      4) Write the actual summary of the studies.
      5) Review the entire output for formatting errors and correct any errors before returning the result.`,
    },
    endText: {
      dk: `Her er teksten: `,
      en: `Here is the text: `,
    },
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
      dk: `Lav en opsummering på dansk på højst 150 ord af denne tekst, som udgøres af et abstract af en videnskabelig artikel. Angiv aldrig antallet af ord eller tekstens længde i selve teksten.
      Skriv teksten på 100% korrekt dansk, og således, at den bliver meget let at forstå for en yngre dansk person på 15 år, som ikke har nogen viden om emnet. 
      Gør teksten så simpel og klar som muligt med et LIX-tal på under 25. Angiv aldrig LIX-tallet i selve teksten. 
      Forklar svære ord og fagord i en parentes, som indsættes umiddelbart efter det pågældende ord. 
      Start med at angive, hvad studiet konkluderer.
      Inden du returnerer resultatet, så gennemgå hele outputtet ekstremt grundigt for at finde eventuelle stave- eller formateringsfejl og rette dem, før du returnerer resultatet. Gennemgå hele outputtet 10 gange for sproglig korrekthed, før du returnerer resultatet.`,
      en: `Make a summary in English of no more than 150 words of this text, which is made up of an abstract of a scientific article. Do not include the number of words or the length of the text in the text itself.
      Write the text in 100% correct English, and so that it will be very easy to understand for a younger person of 15 years old who has no knowledge about the subject, and explain difficult words and technical terms in parentheses, which are inserted immediately after the word in question.
      Make the text as simple and clear as possible with a LIX number of less than 25. Do not include the LIX number in the text itself.
      Explain difficult words and technical terms in parantheses, which are inserted immediately after the word in question.
      Start by stating what the study concludes.
      Before returning the result, review the entire output extremely thoroughly to find any spelling or formatting errors and correct them, before returning the result. Review the entire output 10 times for grammatical correctness, before returning the result.`,
    },
    endText: {
      dk: `Her er teksten: `,
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
      dk: `Lav en opsummering på dansk på højst 150 ord af denne tekst, som udgøres af et abstract af en videnskabelig artikel. Angiv aldrig antallet af ord eller tekstens længde i selve teksten.
      Skriv teksten på fagsprog, som let kan forstås af et sundhedsfagligt publikum eller personer med solid baggrund inden for emnet. 
      Start med at angive, hvad studiet konkluderer.`,
      en: `Make a summary in English of no more than 150 words of this text, which consists of an abstract of a scientific article. Do not include the number of words or the length of the text in the text itself.
      Write the text in professional language that can be easily understood by a healthcare audience or people with a solid background in the subject.
      Start by stating what all the studies conclude.`,
    },
    endText: {
      dk: `Her er teksten: `,
      en: `Here is the text: `,
    },
  },
];

// Base prompt object for summarizing multiple search result abstracts. Only the tooltip text is managed here
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
    model_token_limit: 128000,
    model: "gpt-5.2",
    reasoning: { effort: "none" },      // none, low, medium, high, xhigh
    text: { verbosity: "medium" },     // low, medium, high
    max_output_tokens: 4000,
    prompt: "",
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
    model_token_limit: 128000,
    model: "gpt-5.2",
    reasoning: { effort: "none" },      // none, low, medium, high, xhigh
    text: { verbosity: "medium" },     // low, medium, high
    max_output_tokens: 4000,
    prompt: "",
  },
];

// Base prompt object for summarizing single search result abstract. Only the tooltip text is managed here
export const summarizeSingleAbstractPrompt = [
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
    model_token_limit: 128000,
    model: "gpt-5.2",
    reasoning: { effort: "none" },      // none, low, medium, high, xhigh
    text: { verbosity: "medium" },     // low, medium, high
    max_output_tokens: 4000,
    prompt: "",
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
    model_token_limit: 128000,
    model: "gpt-5.2",
    reasoning: { effort: "none" },      // none, low, medium, high, xhigh
    text: { verbosity: "medium" },     // low, medium, high
    max_output_tokens: 4000,
    prompt: "",
  },
];