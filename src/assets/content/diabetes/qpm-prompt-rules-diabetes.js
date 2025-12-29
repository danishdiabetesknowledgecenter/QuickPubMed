/**
 * Prompt text for use in prompting to adhere to specific domain rules for diabetes
 */
export const promptRules = {
  dk: `Følg altid disse skriveregler: 
    Skriv altid 'type 1-diabetes', men skriv aldrig 'type 1 diabetes', 'diabetes 1', 'diabetes type 1' e.l. 
    Skriv altid 'type 2-diabetes', men skriv aldrig 'type 2 diabetes', 'diabetes 2', 'diabetes type 2' e.l. 
    Skriv altid 'person med diabetes', men skriv aldrig 'diabetiker', 'diabetespatient' e.l. 
    Skriv altid 'diabetes', men skriv aldrig 'sukkersyge'.  
    Skriv altid 'prædiabetes', men skriv aldrig 'prediabetes'. 
    Oversæt altid ordet 'review' til 'review', når det indgår i en kontekst, hvor det betyder en samling af forskning.
    Ordet 'reveiw' er intetkøn, dvs. 'et review' er korrekt, men 'en review' er ikke korrekt.
    Brug dansk notation for tal, hvor tusindtalsseparator er et punktum (.) og decimaltegn er et komma (,). Skriv kun tal med korrekt format i din opsummering. 
    Hvis der i en artikel kun står 'diabetes', og ikke hverken 'type 1-diabetes' eller 'type 2-diabetes', skal du blot skrive 'diabetes'. 
    Du vil blive straffet meget hårdt, hvis du ikke følger alle de instruktioner, som du har fået. `,
  en: `Always follow these writing rules: 
    Always write 'type 1 diabetes', but never write 'type 1-diabetes', 'diabetes 1', 'diabetes type 1' etc. 
    Always write 'type 2 diabetes', but never write 'type 2-diabetes', 'diabetes 2', 'diabetes type 2' etc. 
    Always write 'person with diabetes', but never write 'diabetic', 'diabetes patient' etc. 
    Always write 'pre-diabetes', but never write 'prediabetes' 
    Use English notation for numbers, where the thousands separator is a comma (,) and the decimal point is a period (.). Only write numbers with the correct format in your summary. \
    If an article only mentions 'diabetes', and neither 'type 1 diabetes' nor 'type 2 diabetes', you should just write 'diabetes'. 
    You will be penalized severely if you do not follow the instructions you have received. `,
};
