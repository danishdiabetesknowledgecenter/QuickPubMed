// IT IS VERY IMPORTANT THAT GROUPNAME AND NAME ACROSS ALL GROUPS ARE UNIQUE!
const dateOptions = { year: "numeric", month: "long", day: "numeric" };

const languageFormat = {
  da: "da-DK",
  en: "en-GB",
  de: "de-DR",
};
//Vue.prototype.$dateFormat = "da-DK"; //or en-US for US, or en-GB for British or de-DR for German and so on. Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
Vue.prototype.$helpTextDelay = { show: 500, hide: 100 };
Vue.prototype.$alwaysShowFilter = true;

const customInputTagTooltip = {
  dk: "Klik for at redigere",
  en: "Click to edit",
};

const order = [
  {
    id: "O01",
    method: "relevance",
    translations: {
      dk: "Sorter efter relevans",
      en: "Sort by relevance",
    },
  },
  {
    id: "O02",
    method: "date_desc",
    translations: {
      dk: "Vis nyeste først",
      en: "Show newest first",
    },
  },
  {
    id: "O03",
    method: "date_asc",
    translations: {
      dk: "Vis ældste først",
      en: "Show oldest first",
    },
  },
];

const pageSizes = [10, 25, 50];

const scopeIds = {
  n: "narrow", //narrow
  s: "normal", //standard
  b: "broad", //broad
};
/**
 * Lille parameterforklaring til properties i denne liste:
 * simpleSearch: boolean - angiver om et givent filter skal kunne bruges ved en simpel søgning.
 * standardSimple: boolean - angiver om et givent filter skal være præ-markeret ved en simpel søgning.
 *                          OBS: simpleSearch SKAL også være true for at dette kan lade sig gøre.
 * stringSearchComment: string - en kommentar om hvad filteret gør.
 */
const filtrer = [
  {
    id: "L00",
    name: "Skabelonkategori",
    translations: {
      dk: "Skabelonkategori",
      en: "Template category",
    },
    // use null to mean unordered or any positive number to order this
    // element using the number as a priority with lower number being
    // higher priority (being shown earlier in the list).
    //? Maybe use negative values to represent elements always sorted last
    ordering: { dk: 0, en: 0 },
    choices: [
      {
        id: "L00010",
        name: "Afgrænsning 1",
        buttons: true,
        translations: {
          dk: "Afgrænsning 1",
          en: "Limit 1",
        },
        ordering: {
          dk: 1,
          en: 1,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L00020",
        name: "Afgrænsning 2",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        translations: {
          dk: "Afgrænsning 2",
          en: "Limit 2",
        },
        ordering: {
          dk: 2,
          en: 2,
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L00030",
        name: "Afgrænsning 2.1",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L00020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1",
          en: "Limit 2.1",
        },
        ordering: {
          dk: 3,
          en: 3,
        },
        tooltip: {
          dk: "Kommentar til denne afgrænsning.",
          en: "Comment about this topic.",
        },
      },
      {
        id: "L00040",
        name: "Afgrænsning 2.1.1",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "L00020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2.1)
        maintopicIdLevel2: "L00030", // Angiver at dette element har et grandparent med dette id (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1.1",
          en: "Limit 2.1.1",
        },
        ordering: {
          dk: 4,
          en: 4,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "Kommentar til denne afgrænsning.",
          en: "Comment about this limit.",
        },
      },
      {
        id: "L00050",
        name: "Afgrænsning 2.1.2",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "L00020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2.1)
        maintopicIdLevel2: "L00030", // Angiver at dette element har et grandparent med dette id (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1.2",
          en: "Limit 2.1.2",
        },
        ordering: {
          dk: 5,
          en: 5,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L00060",
        name: "Afgrænsning 2.1.3",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "L00020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2.1)
        maintopicIdLevel2: "L00030", // Angiver at dette element har et grandparent med dette id (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1.3",
          en: "Limit 2.1.3",
        },
        ordering: {
          dk: 6,
          en: 6,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L00070",
        name: "Afgrænsning 2.2",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 1. niveau (miderste niveau)
        maintopicIdLevel1: "L00020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.2",
          en: "Limit 2.2",
        },
        ordering: {
          dk: 7,
          en: 7,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L00080",
        name: "Afgrænsning 2.3",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "L00020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.3",
          en: "Limit 2.3",
        },
        ordering: {
          dk: 8,
          en: 8,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L00090",
        name: "Afgrænsning 3",
        buttons: true,
        translations: {
          dk: "Afgrænsning 3",
          en: "Limit 3",
        },
        ordering: {
          dk: 9,
          en: 9,
        },
        searchStrings: {
          narrow: ["xxx"],
          normal: ["xxx"],
          broad: ["xxx"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Reviewtype",
    id: "L10",
    translations: {
      dk: "Reviewtype",
      en: "Review type",
    },
    ordering: {
      dk: 1,
      en: 1,
    },
    allowCustomInput: true,
    choices: [
      {
        id: "L10010",
        name: "Systematiske reviews",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        translations: {
          dk: "Systematiske reviews",
          en: "Systematic reviews",
        },
        ordering: { dk: 1, en: 1 },
        simpleSearch: true,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler, hvor forskning systematisk er blevet indsamlet og gennemgået for at kunne vurdere, hvad man samlet set ved om et bestemt område.",
          en: "",
        },
        searchStrings: {
          narrow: [
            '(((((systematic*[tiab] AND review*[tiab] AND (medline[tiab] OR pubmed[tiab])) OR "systematic review"[tiab] OR "systematic literature"[tiab] OR "Meta-Analysis"[pt] OR meta-analy*[tiab] OR metaanaly*[tiab]) AND systematic[sb]) AND "Review"[pt]) OR "Cochrane Database Syst Rev"[ta]) NOT (protocol[ti] OR withdrawn[ti] OR "Retracted Publication"[pt])',
          ],
          normal: [
            '(systematic[sb] OR "Cochrane Database Syst Rev"[ta] OR ("Meta-Analysis"[pt] AND (search*[tiab] OR medline[tiab] OR pubmed[tiab] OR embase[tiab] OR cinahl[tiab]))) NOT (protocol[ti] OR withdrawn[ti] OR "Retracted Publication"[pt])',
          ],
          broad: [
            'systematic[sb] OR medline[tiab] OR pubmed[tiab] OR "Cochrane Database Syst Rev"[ta]',
          ],
        },
        searchStringComment: {
          dk: "Inkluderer udover systematiske reviews også metaanalyser, men ikke protokoller og artikler, som er trukket tilbage.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor forskning systematisk er blevet indsamlet og gennemgået for at kunne vurdere, hvad man samlet set ved om et bestemt område. Inkluderer udover systematiske reviews også metaanalyser, men ikke protokoller og artikler, som er trukket tilbage.",
          en: "",
        },
      },
      {
        id: "L10020",
        name: "Cochrane Reviews",
        buttons: false,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette punkt ligger på 1. niveau (miderste niveau)
        maintopicIdLevel1: "L10010", // Angiver at dette element har et parent med dette id. (Systematiske reviews)
        translations: {
          dk: "Cochrane Reviews",
          en: "Cochrane Reviews",
        },
        ordering: { dk: 2, en: 2 },
        simpleSearch: true,
        standardSimple: false,
        tooltip_simple: {
          dk: "En særlig type forsk&shy;nings&shy;over&shy;sigter, som er ud&shy;arbej&shy;det efter strin&shy;gente metoder. Udgives af Cochrane Collaboration.",
          en: "",
        },
        searchStrings: {
          normal: ['"Cochrane Database Syst Rev"[ta]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L10030",
        name: "L10030",
        buttons: false,
        subtopiclevel: 2,
        maintopicIdLevel1: "L10020", // Angiver at dette element har et parent med dette id. (Systematiske reviews)
        maintopicIdLevel2: "L10010", // Angiver at dette element har et grandparent med dette id (Reviewtype)
        translations: {
          dk: "Guidelines",
          en: "Guidelines",
        },
        ordering: { dk: 3, en: 3 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          normal: ['"Guideline"[pt]'],
        },
        searchStringComment: {
          dk: "Kun guidelines, der er udgivet i videnskabelige tidsskrifter, kan findes via PubMed. Guidelines, som er udgivet andre steder, vises ikke.",
          en: "",
        },
        tooltip: {
          dk: "Kun guidelines, der er udgivet i videnskabelige tidsskrifter. Guidelines, som er udgivet andre steder, vises ikke.",
          en: "",
        },
      },
      {
        id: "L10040",
        name: "Andre reviews",
        buttons: false,
        translations: {
          dk: "Andre reviews",
          en: "Other reviews",
        },
        ordering: { dk: 4, en: 4 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          normal: [
            '("Review"[pt] OR review[ti]) NOT (systematic[sb] OR "Cochrane Database Syst Rev"[ta]) NOT (protocol[ti] OR withdrawn[ti] OR "Retracted Publication"[pt] OR "Comment"[pt])',
          ],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "Indeholder kun sekundære studietyper. Primære studietyper er placeret under 'Studietype'.",
      en: "Contains only secondary study types. Primary study types are placed under 'Study type'",
    },
  },
  {
    name: "Studietype",
    id: "L20",
    translations: {
      dk: "Studietype",
      en: "Study type",
    },
    ordering: { dk: 2, en: 2 },
    allowCustomInput: true,
    choices: [
      {
        id: "L20010",
        name: "Case-kontrol-studier",
        buttons: true,
        translations: {
          dk: "Case-kontrol-studier",
          en: "Case-control studies",
        },
        ordering: { dk: null, en: 1 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: ['"Case-Control Studies"[majr]'],
          normal: ['"Case-Control Studies"[mh] OR case-control[ti]'],
          broad: ['"Case-Control Studies"[mh] OR case-control[tiab]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L20020",
        name: "Incidens- og prævalensstudier",
        buttons: true,
        translations: {
          dk: "Incidens- og prævalensstudier",
          en: "Incidence and prevalence studies",
        },
        ordering: { dk: null, en: 5 },
        simpleSearch: true,
        standardSimple: false,
        tooltip_simple: {
          dk: "Studier af antallet af personer, der diag&shy;nos&shy;ti&shy;ceres ud af en be&shy;folk&shy;nings&shy;gruppe inden for en bestemt tids&shy;periode (incidens) eller fore&shy;komsten af en sygdom eller anden faktor i en befolk&shy;nings&shy;gruppe (prævalens).",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Incidence"[majr] OR "Prevalence"[majr] OR prevalence[ti] OR incidence[ti]',
          ],
          normal: [
            '"Incidence"[mh] OR "Prevalence"[mh] OR prevalence[ti] OR incidence[ti]',
          ],
          broad: [
            '"Incidence"[mh] OR "Prevalence"[mh] OR prevalence[tiab] OR incidence[tiab]',
          ],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L20030",
        name: "Kohortestudier",
        buttons: true,
        translations: {
          dk: "Kohortestudier",
          en: "Cohortstudies",
        },
        ordering: { dk: null, en: 2 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: ['"Cohort Studies"[majr]'],
          normal: ['"Cohort Studies"[mh] OR cohort[ti]'],
          broad: ['"Cohort Studies"[mh] OR cohort[tiab]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L20040",
        name: "Kvalitative studier",
        buttons: true,
        translations: {
          dk: "Kvalitative studier",
          en: "Qualitative studies",
        },
        ordering: { dk: null, en: 6 },
        simpleSearch: true,
        standardSimple: false,
        tooltip_simple: {
          dk: "Studier baseret på kvali&shy;ta&shy;tiv metode, som er en fælles&shy;betegnelse for en række forskellige under&shy;søgelses&shy;metoder såsom semi&shy;struk&shy;turerede inter&shy;views, del&shy;tager&shy;obser&shy;va&shy;tioner og fokus&shy;gruppe&shy;inter&shy;views. Den kvali&shy;ta&shy;tive til&shy;gang giver mulighed for at opnå viden om forhold, der oftest er svære at måle og beskrive med tal.",
          en: "",
        },
        searchStrings: {
          narrow: ['"Qualitative Research"[majr]'],
          normal: ['"Qualitative Research"[mh] OR qualitative[ti]'],
          broad: [
            '"Qualitative Research"[mh] OR qualitative[tiab] OR themes[tiab] OR interview*[tiab] OR psychology[sh:noexp] OR "Health Services Administration"[mh]',
          ],
        },
        searchStringComment: {
          dk: "Den brede søgning er baseret på filter fra Wong SS, Wilczynski NL, Haynes RB; Hedges Team. Developing optimal search strategies for detecting clinically relevant qualitative studies in MEDLINE. Stud Health Technol Inform. 2004;107(Pt 1):311-6 (PubMed ID: 15360825).",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Randomiserede, kontrollerede forsøg",
        buttons: true,
        id: "L20050",
        translations: {
          dk: "Randomiserede, kontrollerede forsøg",
          en: "Randomized controlled trials",
        },
        ordering: { dk: null, en: 7 },
        simpleSearch: false,
        standardSimple: false,
        tooltip_simple: {
          dk: "",
          en: "",
        },
        searchStrings: {
          narrow: ['"Randomized Controlled Trial"[pt]'],
          normal: ['"Randomized Controlled Trial"[pt] OR randomi*[ti]'],
          broad: ['"Randomized Controlled Trial"[pt] OR randomi*[tiab]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Økonomiske studier",
        buttons: true,
        id: "L20060",
        translations: {
          dk: "Økonomiske studier",
          en: "Economics studies",
        },
        ordering: { dk: null, en: 3 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: ['"Costs and Cost Analysis"[majr]'],
          normal: [
            '"Costs and Cost Analysis"[mh] OR cost*[ti] OR ecomomic*[ti]',
          ],
          broad: [
            '"Costs and Cost Analysis"[mh] OR cost*[tiab] OR ecomomic*[tiab]',
          ],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "Indeholder kun primære studietyper. Sekundære studietyper er placeret under 'Reviewtype'.",
      en: "Contains only primary study types. Secondary study types are placed under 'Review type'.",
    },
  },
  {
    name: "Sprog",
    id: "L30",
    translations: {
      dk: "Sprog",
      en: "Language",
    },
    ordering: { dk: 3, en: 3 },
    allowCustomInput: true,
    choices: [
      {
        name: "Engelsk",
        buttons: false,
        id: "L30010",
        translations: {
          dk: "Engelsk",
          en: "English",
        },
        ordering: { dk: 1, en: 1 },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler skrevet på engelsk",
          en: "",
        },
        searchStrings: {
          normal: ['"English"[la]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Dansk",
        buttons: false,
        id: "L30020",
        translations: {
          dk: "Dansk",
          en: "Danish",
        },
        ordering: { dk: 2, en: 2 },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler skrevet på dansk",
          en: "",
        },
        searchStrings: {
          normal: ['"Danish"[la]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Svensk",
        buttons: false,
        id: "L30030",
        translations: {
          dk: "Svensk",
          en: "Swedish",
        },
        ordering: { dk: 3, en: 3 },
        searchStrings: {
          normal: ['"Swedish"[la]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Norsk",
        buttons: false,
        id: "L30040",
        translations: {
          dk: "Norsk",
          en: "Norwegian",
        },
        ordering: { dk: 4, en: 4 },
        searchStrings: {
          normal: ['"Norwegian"[la]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Geografi",
    id: "L40",
    translations: {
      dk: "Geografi",
      en: "Geography",
    },
    ordering: { dk: 4, en: 4 },
    allowCustomInput: true,
    choices: [
      {
        name: "Vestlige lande",
        buttons: true,
        id: "L40010",
        translations: {
          dk: "Vestlige lande",
          en: "Western countries",
        },
        ordering: { dk: 1, en: 1 },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Mindsker sand&shy;syn&shy;lig&shy;heden for, at artikler, som <strong>ikke</strong> omhandler lande i Europa, USA, Canada, Australien og New Zealand, indgår i resul&shy;ta&shy;tet",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Europe"[mh] OR "United States"[mh] OR "Canada"[mh] OR "Australia"[mh] OR "New Zealand"[mh]',
          ],
          normal: [
            'all[sb] NOT (("Geographic Locations"[mh] OR "Developing Countries"[mh]) NOT ("Europe"[mh] OR "United States"[mh] OR "Canada"[mh] OR "Australia"[mh] OR "New Zealand"[mh]))',
          ],
          broad: [
            'all[sb] NOT (("Geographic Locations"[mh] OR "Developing Countries"[mh]) NOT ("Europe"[mh] OR "United States"[mh] OR "Canada"[mh] OR "Australia"[mh] OR "New Zealand"[mh]))',
          ],
        },
        searchStringComment: {
          dk: "Vestlige lande er her defineret som lande i Europa, USA, Canada, Australien og New Zealand. Der er udelukkende brugt [mh], at det er ikke muligt er bruge [majr], når man søger efter lande. En stor del af referencerne i PubMed er ikke indekseret under et land, og man risikerer derfor er ekskludere referencer unødigt ved at afgrænse søgningen til referencer, som er indekseret under et land. Derfor er normal og bred søgning (som er ens) konstrueret, så referencer, der IKKE er indekseret under et land, også inkluderes i resultatet. Samtidig frasorteres referencer, som er indekseret under et land, der ikke er defineret som vestligt (dog kun, hvis referencen ikke samtidig er indekseret under et vestligt land).",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Europæiske lande",
        buttons: true,
        id: "L40020",
        translations: {
          dk: "Europæiske lande",
          en: "European countries",
        },
        ordering: { dk: 2, en: 2 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: ['"Europe"[mh] OR europe*[ti]'],
          normal: ['"Europe"[mh] OR europe*[ti]'],
          broad: ['"Europe"[mh] OR europe*[all]'],
        },
        searchStringComment: {
          dk: "[majr] findes ikke for geografi - derfor [ti] -> [tiab] -> [all], da der så også søges i affiliation.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Nordiske lande",
        buttons: true,
        id: "L40030",
        translations: {
          dk: "Nordiske lande",
          en: "Nordic countries",
        },
        ordering: { dk: 3, en: 3 },
        simpleSearch: false,
        standardSimple: false,
        tooltip_simple: {
          dk: "Artikler, som (blandt andet) omhandler Danmark, Norge, Sverige, Finland, Island og Grønland",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Scandinavian and Nordic Countries"[mh] OR scandinavia*[ti] OR nordic-countr*[ti] OR denmark*[ti] OR danish*[ti] OR (danes*[ti] NOT (("great danes"[ti] OR "Dogs"[mh]) NOT "Denmark"[mh])) OR norway*[ti] OR norwegian*[ti] OR swed*[ti] OR finnish*[ti] OR iceland*[ti] OR greenland*[ti]',
          ],
          normal: [
            '"Scandinavian and Nordic Countries"[mh] OR scandinavia*[tiab] OR nordic-countr*[tiab] OR denmark*[tiab] OR danish*[tiab] OR (danes*[tiab] NOT (("great danes"[tiab] OR "Dogs"[mh]) NOT "Denmark"[mh])) OR norway*[tiab] OR norwegian*[tiab] OR swed*[tiab] OR finnish*[tiab] OR iceland*[tiab] OR greenland*[tiab]',
          ],
          broad: [
            '"Scandinavian and Nordic Countries"[mh] OR scandinavia*[all] OR denmark*[all] OR danish*[all] OR (danes*[all] NOT (("great danes"[tiab] OR "Dogs"[mh]) NOT "Denmark"[mh])) OR norway*[all] OR norwegian*[all] OR swed*[all] OR finnish*[all] OR iceland*[all] OR greenland*[all]',
          ],
        },
        searchStringComment: {
          dk: "[majr] findes ikke for geografi - derfor [ti] -> [tiab] -> [all], da der så også søges i affiliation.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Danmark",
        buttons: true,
        id: "L40040",
        translations: {
          dk: "Danmark",
          en: "Denmark",
        },
        ordering: { dk: 4, en: 4 },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: ['"Denmark"[mh] OR denmark*[ti] OR danish*[ti] OR dane*[ti]'],
          normal: [
            '"Denmark"[mh] OR denmark*[tiab] OR danish*[tiab] OR dane*[tiab]',
          ],
          broad: ['"Denmark"[mh] OR denmark[all] OR danish[all] OR dane*[all]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Sverige",
        buttons: true,
        id: "L40050",
        translations: {
          dk: "Sverige",
          en: "Sweden",
        },
        ordering: { dk: 5, en: 5 },
        searchStrings: {
          narrow: ['"Sweden"[mh] OR sweden*[ti] OR swedish*[ti]'],
          normal: ['"Sweden"[mh] OR sweden*[tiab] OR swedish*[tiab]'],
          broad: ['"Sweden"[mh] OR sweden*[all] OR swedish*[all]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Norge",
        buttons: true,
        id: "L40060",
        translations: {
          dk: "Norge",
          en: "Norway",
        },
        ordering: { dk: 6, en: 6 },
        searchStrings: {
          narrow: ['"Norway"[mh] OR norway*[ti] OR norwegian*[ti]'],
          normal: ['"Norway"[mh] OR norway*[tiab] OR norwegian*[tiab]'],
          broad: ['"Norway"[mh] OR norway*[all] OR norwegian*[all]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Køn",
    id: "L50",
    translations: {
      dk: "Køn",
      en: "Sex",
    },
    ordering: { dk: 5, en: 5 },
    allowCustomInput: false,
    choices: [
      {
        name: "Kvinder",
        buttons: true,
        id: "L50010",
        translations: {
          dk: "Kvinder",
          en: "Female",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Female"[mh] OR "Women"[majr]'],
          normal: ['"Female"[mh] OR "Women"[mh]'],
          broad: [
            '"Female"[mh] OR "Women"[mh] OR female*[tiab] OR woman*[tiab] OR women*[tiab]',
          ],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Mænd",
        buttons: true,
        id: "L50020",
        translations: {
          dk: "Mænd",
          en: "Male",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Male"[mh] OR "Men"[majr]'],
          normal: ['"Male"[mh] OR "Men"[mh]'],
          broad: ['"Male"[mh] OR "Men"[mh] OR male*[tiab] OR men[tiab]'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Aldersgruppe",
    id: "L60",
    translations: {
      dk: "Aldersgruppe",
      en: "Age group",
    },
    ordering: { dk: 6, en: 6 },
    allowCustomInput: false,
    choices: [
      {
        name: "Spædbørn (0-23 måneder)",
        buttons: false,
        id: "L60010",
        translations: {
          dk: "Spædbørn (0-23 måneder)",
          en: "Infant (0-23 months old)",
        },
        ordering: { dk: 2, en: 2 },
        searchStrings: {
          normal: ['"Infant"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af spædbørn ("Infant"[mh]) er børn i alderen 0-23 måneder.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Mindre børn (2-5 år)",
        buttons: false,
        id: "L60020",
        translations: {
          dk: "Mindre børn (2-5 år)",
          en: "Preschool children (2-5 years old)",
        },
        ordering: { dk: 2, en: 2 },
        searchStrings: {
          normal: ['"Child, Preschool"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af mindre børn ("Child, Preschool"[mh]) er børn i alderen 2-5 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Større børn (6-12 år)",
        buttons: false,
        id: "L60030",
        translations: {
          dk: "Større børn (6-12 år)",
          en: "Child (6-12 years old)",
        },
        ordering: { dk: 3, en: 3 },
        searchStrings: {
          normal: ['"Child"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af børn ("Child"[mh]) er børn i alderen 6-12 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Unge (13-18 år)",
        buttons: false,
        id: "L60040",
        translations: {
          dk: "Unge (13-18 år)",
          en: "Adolescent (13-18 years old)",
        },
        ordering: { dk: 4, en: 4 },
        searchStrings: {
          normal: ['"Adolescent"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af unge ("Adolescent"[mh]) er personer i alderen 13-18 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Voksne (alle over 18 år)",
        buttons: false,
        id: "L60050",
        translations: {
          dk: "Voksne (alle over 18 år)",
          en: "Adult (over 18 years old)",
        },
        ordering: { dk: 5, en: 5 },
        searchStrings: {
          normal: ['"Adult"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af voksne ("Adult"[mh]) er alle personer over 18 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Unge voksne (19-24 år)",
        buttons: false,
        id: "L60060",
        translations: {
          dk: "Unge voksne (19-24 år)",
          en: "Young adult (19-24 years old)",
        },
        ordering: { dk: 6, en: 6 },
        searchStrings: {
          normal: ['"Young Adult"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af unge voksne ("Young Adult"[mh]) er personer i alderen 19-24 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Midaldrende (45-64 år)",
        buttons: false,
        id: "L60070",
        translations: {
          dk: "Midaldrende (45-64 år)",
          en: "Middle aged (45-64 years old)",
        },
        ordering: { dk: 7, en: 7 },
        searchStrings: {
          normal: ['"Middle Aged"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af midaldrende ("Middle Aged"[mh]) er personer i alderen 45-64 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Ældre (65-79 år)",
        buttons: false,
        id: "L60080",
        translations: {
          dk: "Ældre (65-79 år)",
          en: "Aged (65-79 years old)",
        },
        ordering: { dk: 8, en: 8 },
        searchStrings: {
          normal: ['"Aged"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af ældre ("Aged"[mh]) er personer i alderen 65-79 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Gamle (alle over 80 år)",
        buttons: false,
        id: "L60090",
        translations: {
          dk: "Gamle (alle over 80 år)",
          en: "Old (80 years old and over)",
        },
        ordering: { dk: 9, en: 9 },
        searchStrings: {
          normal: ['"Aged, 80 and over"[mh]'],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af gamle ("Aged, 80 and over"[mh]) er alle personer over 80 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Publiceringsdato",
    id: "L80",
    translations: {
      dk: "Publiceringsdato",
      en: "Publication date",
    },
    ordering: { dk: 7, en: 7 },
    allowCustomInput: false,
    choices: [
      {
        name: "Seneste 1 år",
        buttons: false,
        id: "L80010",
        translations: {
          dk: "Seneste 1 år",
          en: "Last 1 year",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          normal: ["y_1[Filter]"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Seneste 5 år",
        buttons: false,
        id: "L80020",
        translations: {
          dk: "Seneste 5 år",
          en: "Last 5 years",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          normal: ["y_5[Filter]"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Seneste 10 år",
        buttons: false,
        id: "L80030",
        translations: {
          dk: "Seneste 10 år",
          en: "Last 10 years",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          normal: ["y_10[Filter]"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    name: "Andre afgrænsninger",
    id: "L70",
    translations: {
      dk: "Andre afgrænsninger",
      en: "Other limits",
    },
    ordering: { dk: 8, en: 9 },
    allowCustomInput: false,
    choices: [
      {
        name: "Fjern dyrestudier",
        buttons: true,
        id: "L70010",
        translations: {
          dk: "Fjern dyrestudier",
          en: "Remove animal studies",
        },
        ordering: { dk: 1, en: 1 },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler, som kun handler om dyr og ikke mennesker, fjernes.",
          en: "",
        },
        searchStrings: {
          narrow: ['"Humans"[mh]'],
          normal: ['all[sb] NOT ("Animals"[mh] NOT "Humans"[mh])'],
          broad: ['all[sb] NOT ("Animals"[mh] NOT "Humans"[mh])'],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Kun dyrestudier",
        buttons: true,
        id: "L70020",
        translations: {
          dk: "Kun dyrestudier",
          en: "Only animal studies",
        },
        ordering: { dk: 2, en: 2 },
        searchStrings: {
          narrow: ['"Animals"[mh] NOT "Humans"[mh]'],
          normal: [
            '("Animals"[mh] NOT "Humans"[mh]) OR ("Animals"[mh:noexp] AND "Humans"[mh])',
          ],
          broad: [
            '(all[sb] NOT ("Humans"[mh] NOT "Animals"[mh:noexp])) OR ("Animals"[mh:noexp] AND "Humans"[mh])',
          ],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Kun resultater med abstracts",
        buttons: false,
        id: "L70030",
        translations: {
          dk: "Kun resultater med abstracts",
          en: "Only records with abstracts",
        },
        ordering: { dk: 3, en: 3 },
        searchStrings: {
          normal: ["fha[Filter]"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "Kun gratis tilgængelige artikler",
        buttons: false,
        id: "L70040",
        translations: {
          dk: "Kun gratis tilgængelige artikler",
          en: "Only records with abstracts",
        },
        ordering: { dk: 4, en: 4 },
        searchStrings: {
          normal: ["ffrft[Filter]"],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
];
