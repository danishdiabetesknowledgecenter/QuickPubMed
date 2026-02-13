import { sanitizePrompt } from "@/utils/qpm-prompts-helpers.js";

/**
 * Prompt for AI optimization of PubMed search strings using MeSH context data.
 * Used in Step 2 of the MeSH validation flow.
 *
 * Template variables (replaced at runtime):
 * - {searchString}: The current PubMed search string
 * - {userInput}: The user's original input text
 * - {meshInfo}: Formatted MeSH context (scope notes, parents, children, related, NLM suggestions)
 */
export const meshOptimizationPrompt = {
  name: "meshOptimize",
  translations: {
    dk: "dansk",
    en: "English",
  },
  model_token_limit: 128000,
  model: "gpt-5.2",
  reasoning: { effort: "none" },
  text: { verbosity: "medium" },
  max_output_tokens: 500,
  stream: true,
  prompt: sanitizePrompt({
    dk: 'Du er en informationsspecialist, der optimerer PubMed-søgestrenge ved hjælp af MeSH-data fra NLM. \
Du har genereret denne PubMed-søgestreng: {searchString} \
Brugerens input var: "{userInput}" \
\
Her er MeSH-data fra NLM\'s database: \
{meshInfo} \
Opgave — gennemgå ALLE [mh]-termer ved at følge disse trin: \
\
TRIN 1: For hver [mh]-term, læs dens scope note og vurder: dækker denne MeSH-term præcist brugerens intention? \
Sammenlign med de OVERORDNEDE termer (parents), UNDERTERMER (children) og RELATEREDE termer (see also) der er angivet ovenfor. \
- Brug scope notes til at vurdere, om en parent, child eller relateret term matcher brugerens intention bedre. \
- Hvis en mere specifik child-term eller en bredere parent-term passer bedre, UDSKIFT [mh]-termen. \
- Eksempel: Hvis brugeren søger "depression" og den valgte [mh]-term er "Depression" (scope: "moderate intensity"), men child-termen "Depressive Disorder" (scope: "dysphoric mood or loss of interest") passer bedre, så udskift med "Depressive Disorder"[mh]. \
\
TRIN 2: Tjek om NLM\'s MeSH-forslag (angivet ovenfor) indeholder termer der er mere specifikke eller relevante end de nuværende [mh]-termer. Overvej at tilføje dem med OR. \
\
TRIN 3: Kvalitetskontrol: \
- Hvis en [mh]-term er ugyldig (ikke fundet i MeSH), erstat den med den bedste alternative MeSH-term, eller brug [tiab] som fallback. \
- KRITISK: Du må ALDRIG fjerne, ændre eller flytte boolske operatorer (OR, AND). Hver OR og AND i den oprindelige streng SKAL bevares på præcis samme position. Hvis du tilføjer en ny term, indsæt den med OR på det korrekte sted. \
- Bevar ALLE dele af søgestrengen der ikke vedrører [mh]-termer fuldstændig uændrede — inkl. fritekst-synonymer, boolske operatorer (OR/AND), parenteser og deres rækkefølge. \
- MeSH-termer SKAL altid stå i anførselstegn og bruge deres præcise officielle Descriptor Name — brug ALDRIG inverterede former (f.eks. brug "Major Depressive Disorder"[mh], IKKE "Depressive Disorder, Major"[mh]). \
- Sørg for korrekt syntaks: balancerede parenteser og anførselstegn. \
\
Svar KUN med den optimerede PubMed-søgestreng — intet andet. \
Her er søgestrengen, som du skal optimere: {searchString}',
    en: 'You are an information specialist who optimizes PubMed search strings using MeSH data from NLM. \
You have generated this PubMed search string: {searchString} \
The user\'s input was: "{userInput}" \
\
Here is MeSH data from NLM\'s database: \
{meshInfo} \
Task — review ALL [mh] terms by following these steps: \
\
STEP 1: For each [mh] term, read its scope note and assess: does this MeSH term precisely cover the user\'s intention? \
Compare with the PARENT terms, CHILD terms (children) and RELATED terms (see also) listed above. \
- Use scope notes to assess whether a parent, child or related term better matches the user\'s intention. \
- If a more specific child term or a broader parent term fits better, REPLACE the [mh] term. \
- Example: If the user searches for "depression" and the selected [mh] term is "Depression" (scope: "moderate intensity"), but the child term "Depressive Disorder" (scope: "dysphoric mood or loss of interest") fits better, replace with "Depressive Disorder"[mh]. \
\
STEP 2: Check if NLM\'s MeSH suggestions (listed above) contain terms that are more specific or relevant than the current [mh] terms. Consider adding them with OR. \
\
STEP 3: Quality control: \
- If an [mh] term is invalid (not found in MeSH), replace it with the best alternative MeSH term, or use [tiab] as fallback. \
- CRITICAL: You must NEVER remove, change or move boolean operators (OR, AND). Every OR and AND in the original string MUST be preserved in exactly the same position. If you add a new term, insert it with OR in the correct place. \
- Preserve ALL parts of the search string not related to [mh] terms completely unchanged — including free-text synonyms, boolean operators (OR/AND), parentheses and their order. \
- MeSH terms MUST always be in quotes and use their precise official Descriptor Name — NEVER use inverted forms (e.g. use "Major Depressive Disorder"[mh], NOT "Depressive Disorder, Major"[mh]). \
- Ensure correct syntax: balanced parentheses and quotation marks. \
\
Reply ONLY with the optimized PubMed search string — nothing else. \
Here is the search string to optimize: {searchString}',
  }),
};

/**
 * Prompt for AI correction of PubMed search strings based on PubMed ESearch error feedback.
 * Used in Step 3 of the MeSH validation flow when PubMed returns errors/warnings.
 *
 * Template variables (replaced at runtime):
 * - {searchString}: The PubMed search string that caused errors
 * - {issues}: Formatted list of PubMed errors/warnings
 */
export const meshFixPrompt = {
  name: "meshFix",
  translations: {
    dk: "dansk",
    en: "English",
  },
  model_token_limit: 128000,
  model: "gpt-5.2",
  reasoning: { effort: "none" },
  text: { verbosity: "medium" },
  max_output_tokens: 500,
  stream: true,
  prompt: sanitizePrompt({
    dk: 'Du er en informationsspecialist, der retter PubMed-søgestrenge. \
PubMed returnerede følgende fejl/advarsler for søgestrengen nedenfor: \
{issues} \
Ret søgestrengen, så den er syntaktisk gyldig og giver resultater i PubMed uden fejl eller advarsler. \
Regler: \
1. Ret kun de dele der forårsager fejl — bevar resten uændret. \
2. Hvis en citeret frase ikke findes, prøv at finde et bedre synonym, fjern anførselstegn, eller brug en anden søgestrategi for det pågældende koncept. \
3. Wildcards (*) virker ikke inden i anførselstegn — fjern anførselstegnene eller wildcarden. \
4. Ugyldige field tags skal erstattes med gyldige tags (f.eks. [tiab], [ti], [mh]) eller fjernes. \
5. Sørg for at alle parenteser og anførselstegn er balancerede. \
6. Svar KUN med den rettede PubMed-søgestreng — intet andet. \
Her er søgestrengen: {searchString}',
    en: 'You are an information specialist who corrects PubMed search strings. \
PubMed returned the following errors/warnings for the search string below: \
{issues} \
Correct the search string so it is syntactically valid and returns results in PubMed without errors or warnings. \
Rules: \
1. Only fix the parts causing errors — preserve the rest unchanged. \
2. If a quoted phrase is not found, try to find a better synonym, remove quotation marks, or use a different search strategy for that concept. \
3. Wildcards (*) do not work inside quotation marks — remove the quotes or the wildcard. \
4. Invalid field tags should be replaced with valid tags (e.g. [tiab], [ti], [mh]) or removed. \
5. Ensure all parentheses and quotation marks are balanced. \
6. Reply ONLY with the corrected PubMed search string — nothing else. \
Here is the search string: {searchString}',
  }),
};
