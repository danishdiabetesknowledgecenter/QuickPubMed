import { sanitizePrompt } from "@/utils/qpm-prompts-helpers.js";

/**
 * Prompt for execution-time intent coverage check.
 * Variables:
 * - {intentText}
 * - {searchString}
 */
export const executionIntentCheckPrompt = {
  name: "executionIntentCheck",
  translations: {
    dk: "dansk",
    en: "English",
  },
  model_token_limit: 128000,
  model: "gpt-5.2",
  reasoning: { effort: "none" },
  text: { verbosity: "low" },
  max_output_tokens: 20,
  stream: true,
  prompt: sanitizePrompt({
    dk: `Vurder om PubMed-søgestrengen udtrykker brugerens søgeintention.
Brugerens intention:
"{intentText}"
Søgestreng:
{searchString}
Svar KUN med YES eller NO.`,
    en: `Assess whether this PubMed search string expresses the user's search intent.
User intent:
"{intentText}"
Search string:
{searchString}
Reply ONLY with YES or NO.`,
  }),
};

/**
 * Prompt for execution-time alignment when intent does not match.
 * Variables:
 * - {intentText}
 * - {searchString}
 */
export const executionIntentAlignPrompt = {
  name: "executionIntentAlign",
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
    dk: `Du skal justere en PubMed-søgestreng, så den matcher brugerens intention, uden at ødelægge syntaksen.
Brugerens intention:
"{intentText}"
Nuværende søgestreng:
{searchString}
Regler:
- Bevar boolske operatorer og parenteser så vidt muligt.
- Brug kun gyldig PubMed-syntaks.
- Svar KUN med den justerede søgestreng.`,
    en: `Adjust a PubMed search string so it matches the user's intent without breaking syntax.
User intent:
"{intentText}"
Current search string:
{searchString}
Rules:
- Preserve boolean operators and parentheses as much as possible.
- Use only valid PubMed syntax.
- Reply ONLY with the adjusted search string.`,
  }),
};

