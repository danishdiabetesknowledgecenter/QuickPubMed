/**
 * Represents a topic in the application.
 * @typedef {Object} Topic
 * @property {string} id - The unique identifier of the topic.
 * @property {string} groupname - The name of the topic group.
 * @property {Object} translations - The translations for different languages.
 * @property {Object} ordering - The ascending sorting order, starting at 0.
 * @property {Array<SubGroup>} groups - The subgroups associated with the topic.
 */

/**
 * Represents a subject group within a topic.
 * @typedef {Object} SubGroup
 * @property {string} id - The unique identifier of the subject group.
 * @property {string} name - The name of the subject group.
 * @property {boolean} buttons - Indicates if buttons are used.
 * @property {boolean} [maintopic] - Indicates if this is branch topic with children.
 * @property {number} [subtopiclevel] - The level of nesting for the child topic.
 * @property {string} [maintopicIdLevel1] - The ID of the parent topic.
 * @property {string} [maintopicIdLevel2] - The ID of the grand parent topic.
 * @property {Object} translations - The translations for different languages.
 * @property {Object} ordering - The ascending sorting order, starting at 0.
 * @property {Object} [searchStrings] - Search strings for different scopes.
 * @property {Object} [searchStringComment] - Comments about the search strings.
 */
/** @type {Array<Topic>} */
export const topics = [
  {
    id: "S00",
    groupname: "Skabelonkategori",
    translations: {
      dk: "Skabelonkategori",
      en: "Template category",
    },
    ordering: { dk: 0, en: 0 },
    groups: [
      {
        id: "S00010",
        name: "Emne 1",
        buttons: true,
        translations: {
          dk: "Emne 1",
          en: "Topic 1",
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
        id: "S00020",
        name: "Emne 2",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        translations: {
          dk: "Emne 2",
          en: "Topic 2",
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
        id: "S00030",
        name: "Emne 2.1",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "S00020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Emne 2.1",
          en: "Topic 2.1",
        },
        ordering: {
          dk: 3,
          en: 3,
        },
        tooltip: {
          dk: "Kommentar til dette emne",
          en: "Comment about this topic",
        },
      },
      {
        id: "S00040",
        name: "Emne 2.1.1",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "S00030", // Angiver at dette element har et parent med dette id. (Emne 2.1)
        maintopicIdLevel2: "S00020", // Angiver at dette element har et grandparent med dette id (Emne 2)
        translations: {
          dk: "Emne 2.1.1",
          en: "Topic 2.1.1",
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
          dk: "Kommentar til dette emne",
          en: "Comment about this topic",
        },
      },
      {
        id: "S00050",
        name: "Emne 2.1.2",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S00030", // Angiver at dette element har et parent med dette id. (Emne 2.1)
        maintopicIdLevel2: "S00020", // Angiver at dette element har et grandparent med dette id (Emne 2)
        translations: {
          dk: "Emne 2.1.2",
          en: "Topic 2.1.2",
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
        id: "S00060",
        name: "Emne 2.1.3",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        maintopicIdLevel2: "S00030", // Angiver at dette er punktet på 2. niveau til punktet med det angivne name.
        translations: {
          dk: "Emne 2.1.3",
          en: "Topic 2.1.3",
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
        id: "S00070",
        name: "Emne 2.2",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        translations: {
          dk: "Emne 2.2",
          en: "Topic 2.2",
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
        id: "S00080",
        name: "Emne 2.3",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        translations: {
          dk: "Emne 2.3",
          en: "Topic 2.3",
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
        id: "S00090",
        name: "Emne 3",
        buttons: true,
        translations: {
          dk: "Emne 3",
          en: "Topic 3",
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
    id: "S10",
    groupname: "Diabetestype",
    translations: {
      dk: "Diabetestype",
      en: "Diabetes type",
    },
    ordering: { dk: 1, en: 1 },
    groups: [
      {
        id: "S10010",
        name: "S10010",
        buttons: true,
        translations: {
          dk: "Alle typer diabetes",
          en: "All diabetes types",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          narrow: ['"Diabetes Mellitus, Type 1"[majr]'],
          normal: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[ti] OR type-i[ti] OR dm1[ti] OR dmi[ti] OR t1d[ti] OR iddm[ti] OR insulin-dependent[ti] OR insulindependent[ti] OR juvenile-onset[ti] OR autoimmune[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[tiab] OR type-i[tiab] OR dm1[tiab] OR dmi[tiab] OR t1d[tiab] OR iddm[tiab] OR insulin-dependent[tiab] OR insulindependent[tiab] OR juvenile-onset[tiab] OR autoimmune[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S10020",
        name: "S10020",
        buttons: true,
        translations: {
          dk: "Type 1-diabetes",
          en: "Type 1 diabetes",
        },
        ordering: { dk: 2, en: 2 },
        searchStrings: {
          narrow: ['"Diabetes Mellitus, Type 1"[majr]'],
          normal: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[ti] OR type-i[ti] OR dm1[ti] OR dmi[ti] OR t1d[ti] OR iddm[ti] OR insulin-dependent[ti] OR insulindependent[ti] OR juvenile-onset[ti] OR autoimmune[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[tiab] OR type-i[tiab] OR dm1[tiab] OR dmi[tiab] OR t1d[tiab] OR iddm[tiab] OR insulin-dependent[tiab] OR insulindependent[tiab] OR juvenile-onset[tiab] OR autoimmune[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S10030",
        name: "S10030",
        buttons: true,
        translations: {
          dk: "Type 2-diabetes",
          en: "Type 2 diabetes",
        },
        ordering: { dk: 3, en: 3 },
        searchStrings: {
          narrow: ['"Diabetes Mellitus, Type 2"[majr]'],
          normal: [
            '"Diabetes Mellitus, Type 2"[mh] OR ((type-2[ti] OR type-ii[ti] OR dm2[ti] OR t2d[ti] OR niddm[ti] OR noninsulin-dependent[ti] OR non-insulin-dependent[ti] OR noninsulindependent[ti] OR adult-onset[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetes Mellitus, Type 2"[mh] OR ((type-2[tiab] OR type-ii[tiab] OR dm2[tiab] OR dmii[tiab] OR t2d[tiab] OR niddm[tiab] OR noninsulin-dependent[tiab] OR non-insulin-dependent[tiab] OR noninsulindependent[tiab] OR adult-onset[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
          ],
        },
        searchStringComment: {
          dk: "dmii[ti] er ikke medtaget i den normale version, da der ikke findes nogen referencer i PubMed, hvor 'dmii' indgår i titlen.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "S10040",
        name: "S10040",
        buttons: true,
        translations: {
          dk: "Graviditetsdiabetes",
          en: "Gestastional diabetes",
        },
        ordering: { dk: 4, en: 4 },
        searchStrings: {
          narrow: ['"Diabetes, Gestational"[majr]'],
          normal: [
            '"Diabetes, Gestational"[mh] OR ((gestational*[ti] OR gdm[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetes, Gestational"[mh] OR ((gestational*[tiab] OR gdm[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S10050",
        name: "S10050",
        buttons: true,
        translations: {
          dk: "Prædiabetes",
          en: "Pre-diabetes",
        },
        ordering: { dk: 5, en: 5 },
        searchStrings: {
          narrow: ['"Prediabetic State"[majr]'],
          normal: ['"Prediabetic State"[mh] OR pre-diabet*[ti] OR prediabet*[ti]'],
          broad: ['"Prediabetic State"[mh] OR pre-diabet*[tiab] OR prediabet*[tiab]'],
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
        id: "S10060",
        name: "LADA",
        buttons: true,
        translations: {
          dk: "LADA",
          en: "LADA",
        },
        ordering: { dk: 6, en: 6 },
        searchStrings: {
          narrow: ['"Latent Autoimmune Diabetes in Adults"[majr]'],
          normal: [
            '"Latent Autoimmune Diabetes in Adults"[mh] OR (("latent autoimmune"[ti] OR lada[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Latent Autoimmune Diabetes in Adults"[mh] OR (("latent autoimmune"[tiab] OR lada[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S10070",
        name: "MODY",
        buttons: true,
        translations: {
          dk: "MODY",
          en: "MODY",
        },
        ordering: { dk: 7, en: 7 },
        searchStrings: {
          narrow: [
            '("Mason-Type Diabetes"[nm] OR "Maturity-Onset Diabetes of the Young, Type 1"[nm] OR "Maturity-Onset Diabetes of the Young, Type 2"[nm] OR "Maturity-Onset Diabetes of the Young, Type 3"[nm] OR "Maturity-Onset Diabetes of the Young, Type 4"[nm] OR "Renal cysts and diabetes syndrome"[nm] OR "MODY, Type 6"[nm] OR "Maturity-Onset Diabetes of the Young, Type 8, with Exocrine Dysfunction"[nm] OR "Maturity-Onset Diabetes Of The Young, Type 9"[nm]) AND (maturity-onset[ti] OR maturityonset[ti] OR mody[ti])',
          ],
          normal: [
            '("Mason-Type Diabetes"[nm] OR "Maturity-Onset Diabetes of the Young, Type 1"[nm] OR "Maturity-Onset Diabetes of the Young, Type 2"[nm] OR "Maturity-Onset Diabetes of the Young, Type 3"[nm] OR "Maturity-Onset Diabetes of the Young, Type 4"[nm] OR "Renal cysts and diabetes syndrome"[nm] OR "MODY, Type 6"[nm] OR "Maturity-Onset Diabetes of the Young, Type 8, with Exocrine Dysfunction"[nm] OR "Maturity-Onset Diabetes Of The Young, Type 9"[nm]) OR ((maturity-onset[ti] OR maturityonset[ti] OR mody[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '("Mason-Type Diabetes"[nm] OR "Maturity-Onset Diabetes of the Young, Type 1"[nm] OR "Maturity-Onset Diabetes of the Young, Type 2"[nm] OR "Maturity-Onset Diabetes of the Young, Type 3"[nm] OR "Maturity-Onset Diabetes of the Young, Type 4"[nm] OR "Renal cysts and diabetes syndrome"[nm] OR "MODY, Type 6"[nm] OR "Maturity-Onset Diabetes of the Young, Type 8, with Exocrine Dysfunction"[nm] OR "Maturity-Onset Diabetes Of The Young, Type 9"[nm]) OR ((maturity-onset[tiab] OR maturityonset[tiab] OR mody*[tiab] OR monogenic*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S10080",
        name: "Neonatal diabetes",
        buttons: true,
        translations: {
          dk: "Neonatal diabetes",
          en: "Neonatal diabetes",
        },
        ordering: { dk: 8, en: 8 },
        searchStrings: {
          narrow: [
            '("Diabetes Mellitus, Transient Neonatal, 1"[nm] OR "Diabetes Mellitus, Transient Neonatal, 2"[nm] OR "Diabetes Mellitus, Transient Neonatal, 3"[nm] OR "6q24-Related Transient Neonatal Diabetes Mellitus"[nm] OR "Diabetes Mellitus, Permanent Neonatal"[nm] OR "Diabetes Mellitus, Permanent Neonatal, with Cerebellar Agenesis"[nm] OR "Diabetes Mellitus, Permanent Neonatal, With Neurologic Features"[nm] OR "Diabetes Mellitus, Neonatal, with Congenital Hypothyroidism"[nm]) AND ("neonatal diabetes"[ti] OR ("Infant"[mh] AND "Mutation"[mh] AND "Diabetes Mellitus"[majr]))',
          ],
          normal: [
            '("Diabetes Mellitus, Transient Neonatal, 1"[nm] OR "Diabetes Mellitus, Transient Neonatal, 2"[nm] OR "Diabetes Mellitus, Transient Neonatal, 3"[nm] OR "6q24-Related Transient Neonatal Diabetes Mellitus"[nm] OR "Diabetes Mellitus, Permanent Neonatal"[nm] OR "Diabetes Mellitus, Permanent Neonatal, with Cerebellar Agenesis"[nm] OR "Diabetes Mellitus, Permanent Neonatal, With Neurologic Features"[nm] OR "Diabetes Mellitus, Neonatal, with Congenital Hypothyroidism"[nm]) OR "neonatal diabetes"[ti] OR ("Infant"[mh] AND "Mutation"[mh] AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '("Diabetes Mellitus, Transient Neonatal, 1"[nm] OR "Diabetes Mellitus, Transient Neonatal, 2"[nm] OR "Diabetes Mellitus, Transient Neonatal, 3"[nm] OR "6q24-Related Transient Neonatal Diabetes Mellitus"[nm] OR "Diabetes Mellitus, Permanent Neonatal"[nm] OR "Diabetes Mellitus, Permanent Neonatal, with Cerebellar Agenesis"[nm] OR "Diabetes Mellitus, Permanent Neonatal, With Neurologic Features"[nm] OR "Diabetes Mellitus, Neonatal, with Congenital Hypothyroidism"[nm]) OR "neonatal diabetes"[tiab] OR ("Infant"[mh] AND "Mutation"[mh] AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S20",
    groupname: "Komplikationer",
    translations: {
      dk: "Komplikationer",
      en: "Complications",
    },
    ordering: { dk: 2, en: 2 },
    groups: [
      {
        id: "S20010",
        name: "Komplikationer generelt",
        buttons: true,
        translations: {
          dk: "Komplikationer generelt",
          en: "Complications in general",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          narrow: ['"Diabetes Complications"[majr]'],
          normal: [
            '"Diabetes Complications"[mh] OR (complication*[ti] AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetes Complications"[mh] OR (complication*[tiab] AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S20020",
        name: "Diabetisk neuropati",
        buttons: true,
        translations: {
          dk: "Diabetisk neuropati",
          en: "Diabetic neuropathy",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Diabetic Neuropathies"[majr:noexp]'],
          normal: [
            '"Diabetic Neuropathies"[mh:noexp] OR ((neuropath*[ti] OR neuralgi*[ti] OR mononeuropath*[ti] OR polyneuropath*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetic Neuropathies"[mh:noexp] OR ((neuropath*[tiab] OR neuralgi*[tiab] OR mononeuropath*[tiab] OR polyneuropath*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S20030",
        name: "Diabetisk nefropati",
        buttons: true,
        translations: {
          dk: "Diabetisk nefropati",
          en: "Diabetic nephropathy",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Diabetic Nephropathies"[majr]'],
          normal: [
            '"Diabetic Nephropathies"[mh] OR ((nephropath*[ti] OR kidney*[ti] OR glomeruloscleros*[ti] OR renal*[ti]) AND ("Diabetes Mellitus"[mh] AND diabet*[ti]))',
          ],
          broad: [
            '"Diabetic Nephropathies"[mh] OR ((nephropath*[tiab] OR kidney*[tiab] OR glomeruloscleros*[tiab] OR renal*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S20040",
        name: "Diabetisk retinopati",
        buttons: true,
        translations: {
          dk: "Diabetisk retinopati",
          en: "Diabetic retionopathy",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Diabetic Retinopathy"[majr:noexp]'],
          normal: [
            '"Diabetic Retinopathy"[mh:noexp] OR (retinopath*[ti] AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetic Retinopathy"[mh:noexp] OR (retinopath*[tiab] AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S20050",
        name: "Fodsår og andre fodsygdomme",
        buttons: true,
        translations: {
          dk: "Fodsår og andre fodsygdomme",
          en: "Diabetic foot complications",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Diabetic Foot"[majr]'],
          normal: [
            '"Diabetic Foot"[mh] OR ((foot[ti] OR feet[ti] OR podiatri*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))',
          ],
          broad: [
            '"Diabetic Foot"[mh] OR ((foot[tiab] OR feet[tiab] OR podiatri*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))',
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
        id: "S20060",
        name: "Gastroparese",
        buttons: true,
        translations: {
          dk: "Gastroparese",
          en: "Gastroparesis",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Gastroparesis"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Gastroparesis"[mh] OR gastropares*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Gastroparesis"[mh] OR gastropares*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S20070",
        name: "Hjerte-kar-sygdomme",
        buttons: true,
        translations: {
          dk: "Hjerte-kar-sygdomme",
          en: "Cardiovascular diseases",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Cardiovascular Diseases"[majr] AND "Diabetes Mellitus"[majr]) NOT "Diabetic Angiopathies"[mh]',
          ],
          normal: [
            '(("Cardiovascular Diseases"[mh] OR cardio*[ti] OR heart[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])) NOT "Diabetic Angiopathies"[mh]',
          ],
          broad: [
            '(("Cardiovascular Diseases"[mh] OR cardio*[tiab] OR heart[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])) NOT "Diabetic Angiopathies"[mh]',
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
        id: "S20080",
        name: "Hudforandringer",
        buttons: true,
        translations: {
          dk: "Hudforandringer",
          en: "Skin conditions",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '(("Skin Manifestations"[majr] OR "Skin Diseases"[majr]) AND "Diabetes Mellitus"[majr]) NOT ("Diabetic Foot"[mh] OR (("Dermatitis, Contact"[majr] OR "Eczema"[majr]) AND ("Insulin Infusion Systems"[mh] OR "Blood Glucose Self-Monitoring"[mh])))',
          ],
          normal: [
            '(("Skin Manifestations"[mh] OR "Skin Diseases"[mh] OR "skin"[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])) NOT ("Diabetic Foot"[mh] OR (("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[ti] OR dermatitis*[ti] OR eczema*[ti] OR skin-problem*[ti] OR skin-reaction*[ti]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[ti] OR insulin-pump*[ti]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[ti] OR blood-sugar*[ti] OR hba1c[ti]) AND (cgm[ti] OR bgm[ti] OR flash[ti] OR libre[ti] OR measur*[ti] OR monitor*[ti] OR iscgm[ti]))))))',
          ],
          broad: [
            '(("Skin Manifestations"[mh] OR "Skin Diseases"[mh] OR "skin"[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])) NOT ("Diabetic Foot"[mh] OR (("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[tiab] OR dermatitis*[tiab] OR eczema*[tiab] OR skin-problem*[tiab] OR skin-reaction*[tiab]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[tiab] OR insulin-pump*[tiab]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[tiab] OR blood-sugar*[tiab] OR hba1c[tiab]) AND (cgm[tiab] OR bgm[tiab] OR flash[tiab] OR libre[tiab] OR measur*[tiab] OR monitor*[tiab] OR iscgm[tiab]))))))',
          ],
        },
        searchStringComment: {
          dk: "Flere hudproblemer vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "Hudforandringer som følge af diabetes",
          en: "",
        },
      },
      {
        id: "S20090",
        name: "Hudreaktioner",
        buttons: true,
        translations: {
          dk: "Hudreaktioner",
          en: "Skin reactions",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Dermatitis, Contact"[majr] OR "Eczema"[majr]) AND ("Insulin Infusion Systems"[mh] OR "Blood Glucose Self-Monitoring"[mh]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[ti] OR dermatitis*[ti] OR eczema*[ti] OR skin-problem*[ti] OR skin-reaction*[ti]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[ti] OR insulin-pump*[ti]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[ti] OR blood-sugar*[ti] OR hba1c[ti]) AND (cgm[ti] OR bgm[ti] OR flash[ti] OR libre[ti] OR measur*[ti] OR monitor*[ti] OR iscgm[ti])))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[tiab] OR dermatitis*[tiab] OR eczema*[tiab] OR skin-problem*[tiab] OR skin-reaction*[tiab]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[tiab] OR insulin-pump*[tiab]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[tiab] OR blood-sugar*[tiab] OR hba1c[tiab]) AND (cgm[tiab] OR bgm[tiab] OR flash[tiab] OR libre[tiab] OR measur*[tiab] OR monitor*[tiab] OR iscgm[tiab])))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
          ],
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "Hudproblemer, der kan opstå som følge af diabetesteknologi såsom sensorer og pumper.",
          en: "",
        },
      },
      {
        id: "S20140",
        name: "Hyperglykæmi",
        translations: {
          dk: "Hyperglykæmi",
          en: "Hyperglycemia",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Hyperglycemia"[majr]'],
          normal: [
            '"Hyperglycemia"[mh] OR hyperglycaemi*[ti] OR hyper-glycaemi*[ti] OR hyperglycemi*[ti] OR hyper-glycemi*[ti]',
          ],
          broad: [
            '"Hyperglycemia"[mh] OR hyperglycaemi*[tiab] OR hyper-glycaemi*[tiab] OR hyperglycemi*[tiab] OR hyper-glycemi*[tiab]',
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
        id: "S20150",
        name: "Hypoglykæmi",
        translations: {
          dk: "Hypoglykæmi",
          en: "Hypoglycemia",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Hypoglycemia"[majr]'],
          normal: [
            '"Hypoglycemia"[mh] OR hypoglycaemi*[ti] OR hypo-glycaemi*[ti] OR hypoglycemi*[ti] OR hypo-glycemi*[ti]',
          ],
          broad: [
            '"Hypoglycemia"[mh] OR hypoglycaemi*[tiab] OR hypo-glycaemi*[tiab] OR hypoglycemi*[tiab] OR hypo-glycemi*[tiab]',
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
        id: "S20160",
        name: "Ketoacidose",
        translations: {
          dk: "Ketoacidose",
          en: "Ketoacidosis",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Diabetic Ketoacidosis"[majr]'],
          normal: ['"Diabetic Ketoacidosis"[mh] OR ketoacidos*[ti]'],
          broad: ['"Diabetic Ketoacidosis"[mh] OR ketoacidos*[tiab]'],
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
        id: "S20100",
        name: "Led, muskler og bindevæv",
        buttons: true,
        translations: {
          dk: "Led, muskler og bindevæv",
          en: "Joints, muscles and connective tissue",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Connective Tissue Diseases"[majr] OR "Trigger Finger Disorder"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Connective Tissue Diseases"[mh] OR "Trigger Finger Disorder"[mh] OR connective-tissue*[ti] OR trigger-finger*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Connective Tissue Diseases"[mh] OR "Trigger Finger Disorder"[mh] OR connective-tissue*[tiab] OR trigger-finger*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S20110",
        name: "Parodontitis",
        buttons: true,
        translations: {
          dk: "Parodontitis",
          en: "Periodontitis",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Oral Health"[majr] OR "Periodontal Diseases"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Oral Health"[mh] OR "Periodontal Diseases"[mh] OR oral-health[ti] OR parodont*[ti] OR periodont*[ti] OR teeth*[ti] OR tooth[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Oral Health"[mh] OR "Periodontal Diseases"[mh] OR oral-health[tiab] OR parodont*[tiab] OR periodont*[tiab] OR teeth*[tiab] OR tooth[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S20120",
        name: "Seksuel dysfunktion",
        buttons: true,
        translations: {
          dk: "Seksuel dysfunktion",
          en: "Sexual dysfunction",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Sexual Dysfunctions, Psychological"[majr] OR "Sexual Dysfunction, Physiological"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Sexual Dysfunctions, Psychological"[mh] OR "Sexual Dysfunction, Physiological"[mh] OR ((sexual*[ti] OR erectil*[ti]) AND (dysfunction*[ti] OR problem*[ti]))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Sexual Dysfunctions, Psychological"[mh] OR "Sexual Dysfunction, Physiological"[mh] OR ((sexual*[tiab] OR erectil*[tiab]) AND (dysfunction*[tiab] OR problem*[tiab]))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S20130",
        name: "Søvnproblemer",
        buttons: true,
        translations: {
          dk: "Søvnproblemer",
          en: "Sleep disorders",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Sleep"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Sleep"[mh] OR sleep*[ti] OR apnea*[ti] OR apnoea*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Sleep"[mh] OR sleep*[tiab] OR apnea*[tiab] OR apnoea*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S30",
    groupname: "Medicinsk behandling",
    translations: {
      dk: "Medicinsk behandling",
      en: "Medical treatment",
    },
    ordering: { dk: 3, en: 3 },
    groups: [
      {
        id: "S30010",
        name: "Medicinsk behandling generelt",
        buttons: true,
        translations: {
          dk: "Medicinsk behandling generelt",
          en: "Medical treatment in general",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          narrow: ['"Diabetes Mellitus/drug therapy"[majr] OR "Hypoglycemic Agents"[majr]'],
          normal: ['"Diabetes Mellitus/drug therapy"[mh] OR "Hypoglycemic Agents"[mh]'],
          broad: [
            '"Diabetes Mellitus/drug therapy"[mh] OR "Hypoglycemic Agents"[mh] OR "Hypoglycemic Agents"[pa]',
          ],
        },
        searchStringComment: {
          dk: "Flere lægemidler m.m. vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "S30020",
        name: "DPP-4-hæmmere",
        buttons: true,
        translations: {
          dk: "DPP-4-hæmmere",
          en: "DPP-4 inhibitors",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Dipeptidyl-Peptidase IV Inhibitors"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Dipeptidyl-Peptidase IV Inhibitors"[mh] OR dpp[ti] OR dipeptyl*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Dipeptidyl-Peptidase IV Inhibitors"[mh] OR "Dipeptidyl-Peptidase IV Inhibitors"[pa] OR dpp[tiab] OR dipeptyl*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S30030",
        name: "Glitazoner (tiazolidindioner)",
        buttons: true,
        translations: {
          dk: "Glitazoner (tiazolidindioner)",
          en: "Glitazones (thiazolidinediones)",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Thiazolidinediones"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Thiazolidinediones"[mh] OR thiazolidinedione*[ti] OR glitazone*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Thiazolidinediones"[mh] OR thiazolidinedione*[tiab] OR glitazone*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S30040",
        name: "GLP-1-receptoragonister",
        buttons: true,
        translations: {
          dk: "GLP-1-receptoragonister",
          en: "GLP-1 receptor agonists",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '"Glucagon-Like Peptide 1"[majr] OR "Glucagon-Like Peptide-1 Receptor Agonists"[majr] AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Glucagon-Like Peptide 1"[mh] OR "Glucagon-Like Peptide-1 Receptor Agonists"[mh] OR glp[ti] OR glucagon-like*[ti] OR glucagonlike*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Glucagon-Like Peptide 1"[mh] OR "Glucagon-Like Peptide-1 Receptor Agonists"[mh] OR glp[tiab] OR glucagon-like*[tiab] OR glucagonlike*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S30050",
        name: "Insulin",
        buttons: true,
        translations: {
          dk: "Insulin",
          en: "Insulin",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Insulins"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: ['("Insulins"[mh] OR insulin*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])'],
          broad: [
            '("Insulins"[mh] OR insulin*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S30060",
        name: "Metformin",
        buttons: true,
        translations: {
          dk: "Metformin",
          en: "Metformin",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Metformin"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Metformin"[mh] OR metformin*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Metformin"[mh] OR metformin*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S30070",
        name: "SGLT-2-hæmmere",
        buttons: true,
        translations: {
          dk: "SGLT-2-hæmmere",
          en: "SGLT-2 inhibitors",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Sodium-Glucose Transporter 2 Inhibitors"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Sodium-Glucose Transporter 2 Inhibitors"[mh] OR sglt*[ti] OR sodium-glucose*[ti] OR sodiumglucose*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Sodium-Glucose Transporter 2 Inhibitors"[mh] OR "Sodium-Glucose Transporter 2 Inhibitors"[pa] OR sglt*[tiab] OR sodium-glucose*[tiab] OR sodiumglucose*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S30080",
        name: "Sulfonylurinstoffer",
        buttons: true,
        translations: {
          dk: "Sulfonylurinstoffer",
          en: "Sulfonylureas",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Sulfonylurea Compounds"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Sulfonylurea Compounds"[mh] OR sulfonyl*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Sulfonylurea Compounds"[mh] OR sulfonyl*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S40",
    groupname: "Kost",
    translations: {
      dk: "Kost",
      en: "Diet",
    },
    ordering: { dk: 4, en: 4 },
    groups: [
      {
        id: "S40010",
        name: "Kost generelt",
        buttons: true,
        translations: {
          dk: "Kost generelt",
          en: "Diet in general",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          narrow: [
            '("Diet, Food, and Nutrition"[majr] OR "Diet Therapy"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Diet, Food, and Nutrition"[mh] OR "Diet Therapy"[mh] OR "diet therapy"[sh] OR diet*[ti] OR eat[ti] OR eating[ti] OR food*[ti] OR nutrition*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Diet, Food, and Nutrition"[mh] OR "Diet Therapy"[mh] OR "diet therapy"[sh] OR diet*[tiab] OR eat[tiab] OR eating[tiab] OR food*[tiab] OR nutrition*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S40020",
        name: "Drikke",
        buttons: true,
        translations: {
          dk: "Drikke",
          en: "Beverages",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Beverages"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Beverages"[mh] OR beverage*[ti] OR drink*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Beverages"[mh] OR beverage*[tiab] OR drink*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S40030",
        name: "Fedt",
        buttons: true,
        translations: {
          dk: "Fedt",
          en: "Fats",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['("Fatty Acids"[majr] OR "Fats"[majr]) AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Fatty Acids"[mh] OR "Fats"[mh] OR fat[ti] OR fats[ti] OR fatty[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Fatty Acids"[mh] OR "Fats"[mh] OR fat[tiab] OR fats[tiab] OR fatty[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
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
        id: "S40040",
        name: "Fibre",
        buttons: true,
        translations: {
          dk: "Fibre",
          en: "Dietary fiber",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Dietary Fiber"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Dietary Fiber"[mh] OR ((fiber*[ti] OR fibre*[ti]) AND diet*[ti])) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Dietary Fiber"[mh] OR ((fiber*[tiab] OR fibre*[tiab]) AND diet*[tiab])) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S40050",
        name: "Kulhydrater",
        buttons: true,
        translations: {
          dk: "Kulhydrater",
          en: "Carbohydrates",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Dietary Carbohydrates"[majr] OR "Diet, Carbohydrate Loading"[majr] OR "Diet, Carbohydrate-Restricted"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Dietary Carbohydrates"[mh] OR "Diet, Carbohydrate Loading"[mh] OR "Diet, Carbohydrate-Restricted"[mh] OR carb*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Dietary Carbohydrates"[mh] OR "Diet, Carbohydrate Loading"[mh] OR "Diet, Carbohydrate-Restricted"[mh] OR carb*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S40060",
        name: "Kunstige sødestoffer",
        buttons: true,
        translations: {
          dk: "Kunstige sødestoffer",
          en: "Artificial sweeteners",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Artificially Sweetened Beverages"[majr] OR "Non-Nutritive Sweeteners"[majr] OR "Sweetening Agents"[majr:noexp] OR "Sweetening Agents"[nm]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Artificially Sweetened Beverages"[mh] OR "Non-Nutritive Sweeteners"[mh] OR "Sweetening Agents"[mh:noexp] OR "Sweetening Agents"[nm] OR artificial* sweet*[ti] OR non-nutritive sweet*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Artificially Sweetened Beverages"[mh] OR "Non-Nutritive Sweeteners"[mh] OR "Sweetening Agents"[mh:noexp] OR "Sweetening Agents"[nm] OR artificial* sweet*[tiab] OR non-nutritive sweet*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S50",
    groupname: "Teknologi",
    translations: {
      dk: "Teknologi",
      en: "Technology",
    },
    ordering: { dk: 5, en: 5 },
    groups: [
      {
        id: "S50010",
        name: "Blodsukkermåling",
        buttons: true,
        translations: {
          dk: "Glukosesensorer",
          en: "Blood glucose self-monitoring",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Blood Glucose Self-Monitoring"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[ti] OR blood-sugar*[ti] OR hba1c[ti]) AND (cgm[ti] OR bgm[ti] OR flash[ti] OR libre[ti] OR measur*[ti] OR monitor*[ti] OR iscgm[ti]))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[tiab] OR blood-sugar*[tiab] OR hba1c[tiab]) AND (cgm[tiab] OR bgm[tiab] OR flash[tiab] OR libre[tiab] OR measur*[tiab] OR monitor*[tiab] OR iscgm[tiab]))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S50020",
        name: "Insulinpumper",
        buttons: true,
        translations: {
          dk: "Insulinpumper",
          en: "Insulin infusion systems",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Insulin Infusion Systems"[majr]'],
          normal: ['"Insulin Infusion Systems"[mh] OR insulin-infusion*[ti] OR insulin-pump*[ti]'],
          broad: [
            '"Insulin Infusion Systems"[mh] OR insulin-infusion*[tiab] OR insulin-pump*[tiab]',
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
        id: "S50030",
        name: "Kunstig intelligens",
        buttons: true,
        translations: {
          dk: "Kunstig intelligens",
          en: "Artificial intelligence",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Artificial Intelligence"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Artificial Intelligence"[mh] OR artificial-intelligence*[ti] OR chatgpt*[ti] OR machine-learn*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Artificial Intelligence"[mh] OR artificial-intelligence*[tiab] OR chatgpt*[tiab] OR machine-learn*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S50040",
        name: "Mobiltelefoner og apps",
        buttons: true,
        translations: {
          dk: "Mobiltelefoner og apps",
          en: "Mobile phones and apps",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Mobile Applications"[majr] OR "Cell Phone"[majr] OR "Cell Phone Use"[majr] OR "Computers, Handheld"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Mobile Applications"[mh] OR "Cell Phone"[mh] OR "Cell Phone Use"[mh] OR "Computers, Handheld"[mh] OR m-health[ti] OR m-health[ti] OR smart-phone*[ti] OR smartphone*[ti] OR ((cell[ti] OR mobile*[ti] OR tablet*[ti]) AND (app[ti] OR application*[ti] OR apps[ti] OR phone*[ti]))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Mobile Applications"[mh] OR "Cell Phone"[mh] OR "Cell Phone Use"[mh] OR "Computers, Handheld"[mh] OR m-health[tiab] OR m-health[tiab] OR smart-phone*[tiab] OR smartphone*[tiab] OR ((cell[tiab] OR mobile*[tiab] OR tablet*[tiab]) AND (app[tiab] OR application*[tiab] OR apps[tiab] OR phone*[tiab]))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S50050",
        name: "Telemedicin og e-sundhed",
        buttons: true,
        translations: {
          dk: "Telemedicin og e-sundhed",
          en: "Telemedicine og e-health",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Telemedicine"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Telemedicine"[mh] OR e-health[ti] OR ehealth[ti] OR tele*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Telemedicine"[mh] OR e-health[tiab] OR ehealth[tiab] OR tele*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S60",
    groupname: "Kliniske målinger",
    translations: {
      dk: "Kliniske målinger",
      en: "Clinical measures",
    },
    ordering: { dk: 6, en: 6 },
    groups: [
      {
        id: "S60080",
        name: "Albuminuri",
        buttons: true,
        translations: {
          dk: "Albuminuri",
          en: "Albuminuria",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Albuminuria"[majr]'],
          normal: ['("Albuminuria"[mh] OR albuminuria*[ti])'],
          broad: ['("Albuminuria"[mh] OR albuminuria*[tiab])'],
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
        id: "S60010",
        name: "Blodsukker",
        buttons: true,
        translations: {
          dk: "Blodsukker",
          en: "Blood sugar",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Blood Glucose"[majr]'],
          normal: ['("Blood Glucose"[mh] OR blood-glucose[ti])'],
          broad: ['("Blood Glucose"[mh] OR blood-glucose[tiab])'],
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
        id: "S60020",
        name: "Blodtryk",
        buttons: true,
        translations: {
          dk: "Blodtryk",
          en: "Blood pressure",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Blood Pressure"[majr] OR "Blood Pressure Determination"[majr] OR "Hypertension"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Blood Pressure"[mh] OR "Blood Pressure Determination"[mh] OR "Hypertension"[mh] OR blood-pressure*[ti] OR hypertensi*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Blood Pressure"[mh] OR "Blood Pressure Determination"[mh] OR "Hypertension"[mh] OR blood-pressure*[tiab] OR hypertensi*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S60030",
        name: "eGFR",
        translations: {
          dk: "eGFR",
          en: "eGFR",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Glomerular Filtration Rate"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Glomerular Filtration Rate"[mh] OR glomerular-filtration[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Glomerular Filtration Rate"[mh] OR glomerular-filtration[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S60040",
        name: "Glukosebelastning",
        translations: {
          dk: "Glukosebelastning",
          en: "Oral glucose tolerance test",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Glucose Tolerance Test"[majr]'],
          normal: ['"Glucose Tolerance Test"[mh] OR glucose-tolerance[ti] OR ogtt[ti]'],
          broad: ['"Glucose Tolerance Test"[mh] OR glucose-tolerance[tiab] OR ogtt[tiab]'],
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
        id: "S60050",
        name: "HbA1c",
        translations: {
          dk: "Hb1Ac",
          en: "Hb1Ac",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Glycated Hemoglobin"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Glycated Hemoglobin"[mh] OR "Glycated Hemoglobin"[nm] OR a1c[ti] OR glycated-hemoglobin[ti] OR hba1c[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Glycated Hemoglobin"[mh] OR "Glycated Hemoglobin"[mh] OR a1c[ti] OR glycated-hemoglobin[tiab] OR hba1c[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S60060",
        name: "Ketoner",
        translations: {
          dk: "Ketoner",
          en: "Ketones",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Ketones"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: ['("Ketones"[mh] OR keton*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])'],
          broad: ['("Ketones"[mh] OR keton*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])'],
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
        id: "S60070",
        name: "Kolesterol",
        translations: {
          dk: "Kolesterol",
          en: "Cholesterol",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Cholesterol"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Cholesterol"[mh] OR cholesterol*[ti] OR hdl[ti] OR ldl[ti] OR vldl[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Cholesterol"[mh] OR cholesterol*[tiab] OR hdl[tiab] OR ldl[tiab] OR vldl[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S70",
    groupname: "Mental sundhed",
    translations: {
      dk: "Mental sundhed",
      en: "Mental health",
    },
    ordering: { dk: 7, en: 7 },
    groups: [
      {
        name: "Angst",
        buttons: true,
        id: "S70010",
        translations: {
          dk: "Angst",
          en: "Anxiety",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Anxiety"[majr:noexp] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Anxiety"[mh:noexp] OR anxiet*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Anxiety"[mh:noexp] OR anxiet*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S70020",
        name: "Bulimi og diabulimi",
        translations: {
          dk: "Bulimi og diabulimi",
          en: "Bulimia og diabulimia",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['("Bulimia"[majr] OR "Diabulimia"[majr]) AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Bulimia"[mh] OR "Diabulimia"[mh] OR bulimi*[ti] OR diabulim*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Bulimia"[mh] OR "Diabulimia"[mh] OR bulimi*[tiab] OR diabulim*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S70030",
        name: "Depression",
        translations: {
          dk: "Depression",
          en: "Depression",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Depression"[majr] OR "Depressive Disorder"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Depression"[mh] OR "Depressive Disorder"[mh] OR depres*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Depression"[mh] OR "Depressive Disorder"[mh] OR depres*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S70040",
        name: "Diabetes distress",
        translations: {
          dk: "Diabetes distress",
          en: "Diabetes distress",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '(("Psychological Distress"[majr:noexp] OR ("distress"[ti] AND diabet*[ti])) NOT "Respiratory Distress Syndrome"[mh]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '(("Psychological Distress"[mh:noexp] OR "distress"[ti]) NOT "Respiratory Distress Syndrome"[mh]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '(("Psychological Distress"[mh:noexp] OR "distress"[tiab]) NOT "Respiratory Distress Syndrome"[mh]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S70050",
        name: "Spiseforstyrrelser",
        translations: {
          dk: "Spiseforstyrrelser",
          en: "Eating disorders",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Feeding and Eating Disorders"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Feeding and Eating Disorders"[mh] OR bulimi*[ti] OR diabulimi*[ti] OR binge-eating*[ti] OR bingeeat*[ti] OR eating-disorder*[ti] OR hyperphagi*[ti] OR overeat*[ti] OR polyphagi*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Feeding and Eating Disorders"[mh] OR bulimi*[tiab] OR diabulimi*[tiab] OR binge-eating*[tiab] OR bingeeat*[tiab] OR eating-disorder*[tiab] OR hyperphagi*[tiab] OR overeat*[tiab] OR polyphagi*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S70060",
        name: "Tvangsoverspisning",
        translations: {
          dk: "Tvangsoverspisning",
          en: "Binge eating disorder",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Binge-Eating Disorder"[majr] OR "Hyperphagia"[majr:noexp]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Binge-Eating Disorder"[mh] OR "Hyperphagia"[mh:noexp] OR binge-eating*[ti] OR bingeeat*[ti] OR hyperphagi*[ti] OR overeat*[ti] OR polyphagi*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Binge-Eating Disorder"[mh] OR "Hyperphagia"[mh:noexp] OR binge-eating*[tiab] OR bingeeat*[tiab] OR hyperphagi*[tiab] OR overeat*[tiab] OR polyphagi*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S80",
    groupname: "Forebyggelse og risikofaktorer",
    translations: {
      dk: "Forebyggelse og risikofaktorer",
      en: "Prevention and resk factors",
    },
    ordering: { dk: 8, en: 8 },
    groups: [
      {
        id: "S80010",
        name: "Forebyggelse generelt",
        buttons: true,
        translations: {
          dk: "Forebyggelse generelt",
          en: "Prevention in general",
        },
        ordering: { dk: 1, en: 1 },
        searchStrings: {
          narrow: [
            '(("Public Health"[majr] AND "prevention and control"[sh]) OR "Public Health Practice"[majr] OR "Community Health Services"[majr] OR "Preventive Health Services"[majr] OR "Health Knowledge, Attitudes, Practice"[majr] OR "Health Communication"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '(("Public Health"[mh] AND "prevention and control"[sh]) OR "Public Health Practice"[mh] OR "Community Health Services"[mh] OR "Preventive Health Services"[mh] OR "Health Knowledge, Attitudes, Practice"[mh] OR "Health Communication"[mh]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("prevention and control"[sh] OR "Public Health Practice"[mh] OR "Community Health Services"[mh] OR "Preventive Health Services"[mh] OR "Health Knowledge, Attitudes, Practice"[mh] OR "Health Communication"[mh]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
          ],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "S80050",
        name: "Arvelighed",
        translations: {
          dk: "Arvelighed",
          en: "Heridity",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Heredity"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Heredity"[mh] OR heridity*[ti] OR heritability*[ti]) AND "Diabetes Mellitus"[majr]',
          ],
          broad: [
            '("Heredity"[mh] OR heridity*[tiab] OR heritability*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S80020",
        name: "Motion",
        buttons: true,
        translations: {
          dk: "Motion",
          en: "Physical activity",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Exercise"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Exercise"[mh] OR exercise*[ti] OR physical-activ*[ti] OR physically-activ*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Exercise"[mh] OR exercise*[tiab] OR physical-activ*[tiab] OR physically-activ*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S80040",
        name: "Overvægt",
        buttons: true,
        translations: {
          dk: "Overvægt",
          en: "Overwieght",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['"Overweight"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Overweight"[mh] OR obese*[ti] OR obesity*[ti] OR overweight*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Overweight"[mh] OR obese*[tiab] OR obesity*[tiab] OR overweight*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S80030",
        name: "Rygning",
        buttons: true,
        translations: {
          dk: "Rygning",
          en: "Smoking",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Smoking"[majr] OR "Smoking Cessation"[majr] OR "Tobacco"[majr] OR "Tobacco Use Cessation"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Smoking"[mh] OR "Smoking Cessation"[mh] OR "Tobacco"[mh] OR "Tobacco Use Cessation"[mh] OR smoke*[ti] OR smoking*[ti] OR tobacco*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Smoking"[mh] OR "Smoking Cessation"[mh] OR "Tobacco"[mh] OR "Tobacco Use Cessation"[mh] OR smoke*[tiab] OR smoking*[tiab] OR tobacco*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "S90",
    groupname: "Særlige grupper",
    translations: {
      dk: "Særlige grupper",
      en: "Special groups",
    },
    ordering: { dk: 9, en: 9 },
    groups: [
      {
        id: "S90010",
        name: "Alkohol- og stofmisbrugere",
        buttons: true,
        translations: {
          dk: "Alkohol- og stofmisbrugere",
          en: "Alcohol and drug abuse",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Designer Drugs"[majr] OR "Drug Users"[majr] OR "Substance-Related Disorders"[majr] OR "Illicit Drugs"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Designer Drugs"[mh] OR "Drug Users"[mh] OR "Substance-Related Disorders"[mh] OR "Illicit Drugs"[mh] OR ("drug user*"[ti] OR (alkohol[ti] OR amphetamine[ti] OR cocaine[ti] OR drug[ti] OR marijuana[ti] OR narcotic[ti] OR substance[ti]) AND (abuse[ti] OR addict*[ti] OR disorder[ti]))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Designer Drugs"[mh] OR "Drug Users"[mh] OR "Substance-Related Disorders"[mh] OR "Illicit Drugs"[mh] OR ("drug user*"[tiab] OR (alkohol[tiab] OR amphetamine[tiab] OR cocaine[tiab] OR drug[tiab] OR marijuana[tiab] OR narcotic[tiab] OR substance[tiab]) AND (abuse[tiab] OR addict*[tiab] OR disorder[tiab]))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90020",
        name: "Børn",
        buttons: true,
        translations: {
          dk: "Børn",
          en: "Children",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Disabled Children"[majr] OR ("Child"[mh] NOT "Adult"[mh]) OR "Child, Hospitalized"[majr] OR "Child, Institutionalized"[majr] OR "Child Care"[majr] OR "Child Development"[majr] OR "Child Health"[majr] OR "Child Health Services"[majr] OR "Pediatrics"[majr] OR "Pediatric Nursing"[majr] OR "Pediatric Obesity"[majr] OR "Psychology, Child"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Disabled Children"[mh] OR ("Child"[mh] NOT "Adult"[mh]) OR "Child, Hospitalized"[mh] OR "Child, Institutionalized"[mh] OR "Child Care"[mh] OR "Child Development"[mh] OR "Child Health"[mh] OR "Child Health Services"[mh] OR "Pediatrics"[mh] OR "Pediatric Nursing"[mh] OR "Pediatric Obesity"[mh] OR "Psychology, Child"[mh] OR child*[ti] OR paediatric*[ti] OR pediatric*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Disabled Children"[mh] OR "Child"[mh] OR "Child, Hospitalized"[mh] OR "Child, Institutionalized"[mh] OR "Child Care"[mh] OR "Child Development"[mh] OR "Child Health"[mh] OR "Child Health Services"[mh] OR "Pediatrics"[mh] OR "Pediatric Nursing"[mh] OR "Pediatric Obesity"[mh] OR "Psychology, Child"[mh] OR child*[tiab] OR paediatric*[tiab] OR pediatric*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90030",
        name: "Gravide med eksisterende diabetes",
        translations: {
          dk: "Gravide med eksisterende diabetes",
          en: "Pregnant women with pre-existing diabetes",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '(("Preconception Care"[majr] OR "Pregnancy in Diabetics"[majr] OR "Prenatal Care"[majr]) NOT ("Diabetes, Gestational"[mh] OR gestational*[tiab] OR gdm[tiab])) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '(("Preconception Care"[mh] OR "Pregnancy in Diabetics"[mh] OR "Prenatal Care"[mh] OR antenatal*[ti] OR pre-exist*[ti] OR preexist*[ti] OR pregnan*[ti] OR prenatal*[ti]) NOT ("Diabetes, Gestational"[mh] OR gestational*[tiab] OR gdm[tiab)) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '(("Preconception Care"[mh] OR "Pregnancy in Diabetics"[mh] OR "Prenatal Care"[mh] OR antenatal*[tiab] OR pre-exist*[tiab] OR preexist*[tiab] OR pregnan*[tiab] OR prenatal*[tiab]) NOT ("Diabetes, Gestational"[mh] OR gestational*[tiab] OR gdm[tiab])) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90040",
        name: "Minoritetsgrupper",
        buttons: true,
        translations: {
          dk: "Minoritetsgrupper",
          en: "Minority groups",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Minority Groups"[majr] OR "Minority Health"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Minority Groups"[mh] OR "Minority Health"[mh] OR (minorit*[ti] AND (group*[ti] OR population*[ti]))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Minority Groups"[mh] OR "Minority Health"[mh] OR (minorit*[tiab] AND (group*[tiab] OR population*[tiab]))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90050",
        name: "Pårørende",
        buttons: true,
        translations: {
          dk: "Pårørende",
          en: "Relatives",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: ['("Family"[majr] OR "Family Health"[majr]) AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Family"[mh] OR "Family Health"[mh] OR family-based*[ti] OR familybased*[ti] OR family-orient*[ti] OR familyorient*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Family"[mh] OR "Family Health"[mh] OR "Caregivers"[mh] OR family-based*[tiab] OR familybased*[tiab] OR family-orient*[tiab] OR familyorient*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
          ],
        },
        searchStringComment: {
          dk: '"Caregivers"[mh] er kun medtaget i den brede søgning, da denne også inkluderer hospitalspersonale.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "S90060",
        name: "Socialt udsatte",
        buttons: true,
        translations: {
          dk: "Socialt udsatte",
          en: "Vulnerable populations",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          narrow: [
            '("Health Equity"[majr] OR "Health Status Disparities"[majr] OR Poverty[majr] OR "Social Marginalization"[majr] OR "Vulnerable Populations"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Health Equity"[mh] OR "Health Status Disparities"[mh] OR Poverty[mh] OR "Social Marginalization"[mh] OR "Vulnerable Populations"[mh] OR disadvantage*[ti] OR disparit*[ti] OR hard-to-reach*[ti] OR inequalit*[ti] OR inequit*[ti] OR marginali*[ti] OR most-in-need*[ti] OR poverty*[ti] OR vulnerabl*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Health Equity"[mh] OR "Health Status Disparities"[mh] OR Poverty[mh] OR "Social Marginalization"[mh] OR "Vulnerable Populations"[mh] OR disadvantage*[tiab] OR disparit*[tiab] OR hard-to-reach*[tiab] OR inequalit*[tiab] OR inequit*[tiab] OR marginali*[tiab] OR most-in-need*[tiab] OR poverty*[tiab] OR vulnerabl*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90070",
        name: "Udviklingshæmmede",
        translations: {
          dk: "Udviklingshæmmede",
          en: "People with developmental disabilities",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Developmental Disabilities"[majr] OR "Intellectual Disability"[majr] OR "Persons with Mental Disabilities"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Developmental Disabilities"[mh] OR "Intellectual Disability"[mh] OR "Persons with Mental Disabilities"[mh] OR ((developmental*[ti] OR intellectual*[ti] OR mental*[ti]) AND disabilit*[ti])) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Developmental Disabilities"[mh] OR "Intellectual Disability"[mh] OR "Persons with Mental Disabilities"[mh] OR ((developmental*[tiab] OR intellectual*[tiab] OR mental*[tiab]) AND disabilit*[tiab])) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90080",
        name: "Unge",
        translations: {
          dk: "Unge",
          en: "Young people",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '(("Adolescent"[mh] NOT "Adult"[mh]) OR "Adolescent, Hospitalized "[majr] OR "Adolescent, Institutionalized"[majr] OR "Adolescent Development"[majr] OR "Adolescent Behavior"[majr] OR "Adolescent Health"[majr] OR "Adolescent Health Services"[majr] OR "Adolescent Medicine"[majr] OR "Psychology, Adolescent"[majr] OR "Youth Sports"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '(("Adolescent"[mh] NOT "Adult"[mh]) OR "Adolescent, Hospitalized "[mh] OR "Adolescent, Institutionalized"[mh] OR "Adolescent Development"[mh] OR "Adolescent Behavior"[mh] OR "Adolescent Health"[mh] OR "Adolescent Health Services"[mh] OR "Adolescent Medicine"[mh] OR "Psychology, Adolescent"[mh] OR "Youth Sports"[mh] OR adolescen*[ti] OR "young people*"[ti] OR youth*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Adolescent"[mh] OR "Adolescent, Hospitalized "[mh] OR "Adolescent, Institutionalized"[mh] OR "Adolescent Development"[mh] OR "Adolescent Behavior"[mh] OR "Adolescent Health"[mh] OR "Adolescent Health Services"[mh] OR "Adolescent Medicine"[mh] OR "Psychology, Adolescent"[mh] OR "Youth Sports"[mh] OR adolescen*[tiab] OR "young people*"[tiab] OR youth*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "S90090",
        name: "Ældre",
        translations: {
          dk: "Ældre",
          en: "Elderly people",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '((("Aged"[mh] NOT "Adult"[mh:noexp]) NOT ("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh])) OR "Health Services for the Aged"[majr] OR "Homes for the Aged"[majr] OR "Retirement"[majr] OR "Senior Centers"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '(((("Aged"[mh] NOT "Adult"[mh:noexp]) NOT ("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh])) OR "Health Services for the Aged"[mh] OR "Homes for the Aged"[mh] OR "Retirement"[mh] OR "Senior Centers"[mh] OR elderly[ti]) OR (older*[ti] AND (people*[ti] OR person*[ti]))) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '(("Aged"[mh] OR "Health Services for the Aged"[mh] OR "Homes for the Aged"[mh] OR "Retirement"[mh] OR "Senior Centers"[mh] OR elderly[tiab]) OR (older*[tiab] AND (people*[tiab] OR person*[tiab]))) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
      dk: "",
      en: "",
    },
  },
  {
    id: "SXX",
    groupname: "Andre emner",
    translations: {
      dk: "Andre emner",
      en: "Other topics",
    },
    ordering: { dk: 9, en: 9 },
    groups: [
      {
        id: "SXX110",
        name: "Amputationer",
        translations: {
          dk: "Amputationer",
          en: "Amputations",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Amputation, Surgical"[majr] OR "Amputation Stumps"[majr]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Amputation, Surgical"[mh] OR "Amputation Stumps"[mh] OR amputat*[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Amputation, Surgical"[mh] OR "Amputation Stumps"[mh] OR amputat*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "SXX010",
        name: "COVID-19",
        translations: {
          dk: "COVID-19",
          en: "COVID-19",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['("COVID-19"[majr] OR "SARS-CoV-2"[majr]) AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("COVID-19"[mh] OR "SARS-CoV-2"[mh]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '(("COVID-19"[mh] OR "COVID-19 Testing"[mh] OR "COVID-19 Vaccines"[mh] OR "SARS-CoV-2"[mh] OR 2019-ncov*[tiab] OR 2019ncov*[tiab] OR 2019-novel-cov*[tiab] OR coronavirus[ti] OR coronavirus-2*[tiab] OR coronavirus-disease-19*[tiab] OR corona-virus-disease-19*[tiab] OR coronavirus-disease-20*[tiab] OR corona-virus-disease-20*[tiab] OR covid-19*[tiab] OR covid19*[tiab] OR covid-20*[tiab] OR covid20*[tiab] OR ncov-2019*[tiab] OR ncov2019*[tiab] OR new-coronavirus[tiab] OR new-corona-virus[tiab] OR novel-coronavirus[tiab] OR novel-corona-virus[tiab] OR sars-2*[tiab] OR sars2*[tiab] OR sars-cov-19*[tiab] OR sars-cov19*[tiab] OR sarscov19*[tiab] OR sarscov-19*[tiab] OR sars-cov-2*[tiab] OR sars-cov2*[tiab] OR sarscov2*[tiab] OR sarscov-2*[tiab] OR (("Coronavirus"[mh] OR "Coronavirus Infections"[mh] OR betacoronavirus[tiab] OR beta-coronavirus[tiab] OR beta-corona-virus[tiab] OR corona-virus[tiab] OR coronavirus[tiab] OR sars*[tiab] OR severe-acute-respiratory*[tiab]) AND (2019[tiab] OR 2020[tiab] OR wuhan*[tiab] OR hubei*[tiab] OR china*[tiab] OR chinese*[tiab] OR outbreak*[tiab] OR epidemic*[tiab] OR pandemic*[tiab]))) AND 2019/12:3000[dp]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "SXX020",
        name: "Egenomsorg",
        translations: {
          dk: "Egenomsorg",
          en: "Self care",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Self Care"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Self Care"[mh] OR self-care[ti] OR self-management[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Self Care"[mh] OR self-care[tiab] OR self-management[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
          ],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "SXX060",
        name: "Kræft",
        translations: {
          dk: "Kræft",
          en: "Cancer",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Neoplasms"[majr] NOT "Polycystic Ovary Syndrome"[mh]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '(("Neoplasms"[mh] OR cancer*[ti] OR carcinoma*[ti] OR neoplasm*[ti]) NOT ("Polycystic Ovary Syndrome"[mh] OR pcos[tiab])) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '(("Neoplasms"[mh] OR cancer*[tiab] OR carcinoma*[tiab] OR neoplasm*[tiab]) NOT ("Polycystic Ovary Syndrome"[mh] OR pcos[tiab])) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
          ],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "SXX070",
        name: "Patientuddannelse",
        translations: {
          dk: "Patientuddannelse",
          en: "Patient education",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Patient Education as Topic"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: [
            '("Patient Education as Topic"[mh] OR patient-education[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Patient Education as Topic"[mh] OR patient-education[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
          ],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "SXX080",
        name: "PFAS",
        translations: {
          dk: "PFAS",
          en: "PFAS",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Fluorocarbons"[majr] OR "Alkanesulfonic Acids"[majr]) AND ("Environmental Pollutants"[mh] OR exposure*[ti]) AND "Diabetes Mellitus"[majr]',
          ],
          normal: [
            '("Fluorocarbons"[mh] OR "Alkanesulfonic Acids"[mh] OR perfluoro*[ti] OR polyfluoro*[ti] OR perfluoro*[nm] OR polyfluoro*[nm]) AND ("Environmental Pollutants"[mh] OR Environmental Pollutants [Pharmacological Action] OR exposure*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti])',
          ],
          broad: [
            '("Fluorocarbons"[mh] OR "Alkanesulfonic Acids"[mh] OR perfluoro*[tiab] OR polyfluoro*[tiab] OR perfluoro*[nm] OR polyfluoro*[nm]) AND ("Environmental Pollutants"[mh] OR Environmental Pollutants [Pharmacological Action] OR exposure*[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])',
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
        id: "SXX090",
        name: "Ramadan",
        translations: {
          dk: "Ramadan",
          en: "Ramadan",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"ramadan"[ti] AND "Diabetes Mellitus"[majr]'],
          normal: ['ramadan[ti] AND ("Diabetes Mellitus"[mh] OR diabet*[ti])'],
          broad: ['ramadan[tiab] AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])'],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "SXX100",
        name: "Uddannelse af fagpersoner",
        translations: {
          dk: "Uddannelse af fagpersoner",
          en: "Education of health professionals",
        },
        ordering: { dk: null, en: null },
        buttons: true,
        searchStrings: {
          narrow: ['"Education, Professional"[majr] AND "Diabetes Mellitus"[majr]'],
          normal: ['"Education, Professional"[mh] AND ("Diabetes Mellitus"[mh] OR diabet*[ti])'],
          broad: ['"Education, Professional"[mh] AND ("Diabetes Mellitus"[mh] OR diabet*[tiab])'],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
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
    id: "C10",
    groupname: "COVID-19",
    translations: {
      dk: "COVID-19",
      en: "COVID-19",
    },
    ordering: { dk: 10, en: 10 },
    groups: [
      {
        id: "C10020",
        name: "Diabetes",
        buttons: true,
        translations: {
          dk: "Diabetes",
          en: "Diabetes",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          normal: [
            '"Diabetes Mellitus"[mh] OR diabet*[tiab] OR blood-glucose*[tiab] OR glycaemi*[tiab] OR glycemi*[tiab] OR hba1c*[tiab] OR a1c[tiab] OR hyperglyc*[tiab] OR hypoglyc*[tiab] OR insulin*[tiab] OR metabolic*[tiab]',
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
        id: "C10030",
        name: "Hjerte-kar-sygdom",
        buttons: true,
        translations: {
          dk: "Hjerte-kar-sygdom",
          en: "Cardiovascular diseases",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          normal: [
            '"Cardiovascular Diseases"[mh] OR "Cardiovascular System"[mh]  OR cardiopulmonary*[tiab] OR cardio-pulmonary*[tiab] OR cardiorespiratory*[tiab] OR cardio-respiratory*[tiab] OR cardiovascular*[tiab] OR cardio-vascular*[tiab] OR cvd[tiab] OR heart*[tiab] OR hypertens*[tiab]',
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
        id: "C10040",
        name: "Nyresygdom",
        buttons: true,
        translations: {
          dk: "Nyresygdom",
          en: "Kidney diseases",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          normal: [
            '"Kidney Diseases"[mh] OR "Kidney"[mh] OR nephro*[tiab] OR kidney*[tiab] OR renal*[tiab]',
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
        id: "C10050",
        name: "Mental sundhed",
        buttons: true,
        translations: {
          dk: "Mental sundhed",
          en: "Mental health",
        },
        ordering: { dk: null, en: null },
        searchStrings: {
          normal: [
            '"Depression"[mh] OR "Emotions"[mh] OR "Mental Disorders"[mh] OR "Mental Health"[mh] OR "Stress, Psychological"[mh] OR psychology[sh] OR anxiety[tiab] OR depression[tiab] OR depressive[tiab] OR emotion*[tiab] OR insomnia*[tiab] OR life-stress*[tiab] OR mental*[tiab] OR psychiatr*[tiab] OR psycholog*[tiab] OR psychosocial*[tiab] OR psycho-social*[tiab] OR sleep*[tiab] OR stressful*[tiab]',
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
      dk: "",
      en: "",
    },
  },
];
