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
 * @property {string} [maintopicIdLevel2] - The ID of the grandparent topic.
 * @property {Object} translations - The translations for different languages.
 * @property {Object} ordering - The ascending sorting order, starting at 0.
 * @property {Object} [searchStrings] - Search strings for different scopes.
 * @property {Object} [searchStringComment] - Comments about the search strings.
 */
/** @type {Array<Topic>} */

export const standardString = {
  narrow: '"Diabetes Mellitus"[majr]',
  normal: '"Diabetes Mellitus"[mh] OR diabet*[ti]',
  broad: '"Diabetes Mellitus"[mh] OR diabet*[tiab]',
}

export const topics = [
  {
    id: "S000",
    groupname: "S000",
    translations: {
      dk: "Skabelonkategori",
      en: "Template category",
    },
    ordering: { dk: 0, en: 0 },
    groups: [
      {
        id: "S000010",
        name: "S000010",
        buttons: true,
        translations: {
          dk: "Underemne 1",
          en: "Subtopic 1",
        },
        ordering: {
          dk: 1,
          en: 1,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
          ],
        },
        searchStringComment: {
          dk: "Dette er et eksempel på et underemne på niveau 1.",
          en: "This is an example of a subtopic at level 1.",
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 1.",
          en: "This is an example of a subtopic at level 1.",
        },
      },
      {
        id: "S000020",
        name: "S000020",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        translations: {
          dk: "Underemne 2",
          en: "Subtopic 2",
        },

        ordering: {
          dk: 2,
          en: 2,
        },
        searchStringComment: {
          dk: "Dette er et eksempel på et underemne på niveau 1, som har under&shy;liggende emner (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 1, that has subtopics underneath (indicated with an arrow). Click to see the subtopics.",
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 1, som har under&shy;liggende emner (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 1, that has subtopics underneath (indicated with an arrow). Click to see the subtopics.",
        },
      },
      {
        id: "S000020010",
        name: "S000020010",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "S000020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Underemne 2.1",
          en: "Subtopic 2.1",
        },
        ordering: {
          dk: 3,
          en: 3,
        },
        searchStringComment: {
          dk: "Dette er et eksempel på et underemne på niveau 2, som også har et under&shy;liggende emne (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 2, that also has a subtopic underneath (indicated with an arrow). Click to see the subtopics.",
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 2, som også har et under&shy;liggende emne (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 2, that also has a subtopic underneath (indicated with an arrow). Click to see the subtopics.",
        },
      },
      {
        id: "S000020010010",
        name: "S000020010010",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "S000020010", // Angiver at dette element har et parent med dette id. (Emne 2.1)
        maintopicIdLevel2: "S000020", // Angiver at dette element har et grandparent med dette id (Emne 2)
        translations: {
          dk: "Underemne 2.1.1",
          en: "Subtopic 2.1.1",
        },
        ordering: {
          dk: 4,
          en: 4,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
          ],
        },
        searchStringComment: {
          dk: "Dette er et eksempel på et underemne på niveau 3, som er det dybteste niveau i denne rullemenu.",
          en: "This is an example of a subtopic at level 3, which is the deepest level in this dropdown menu.",
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 3, som er det dybteste niveau i denne rullemenu.",
          en: "This is an example of a subtopic at level 3, which is the deepest level in this dropdown menu.",
        },

      },
      {
        id: "S000020010020",
        name: "S000020010020",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S000020010", // Angiver at dette element har et parent med dette id. (Emne 2.1)
        maintopicIdLevel2: "S000020", // Angiver at dette element har et grandparent med dette id (Emne 2)
        translations: {
          dk: "Underemne 2.1.2",
          en: "Subtopic 2.1.2",
        },
        ordering: {
          dk: 5,
          en: 5,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
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
        id: "S000020010030",
        name: "S000020010030",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S000020010", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        maintopicIdLevel2: "S000020", // Angiver at dette er punktet på 2. niveau til punktet med det angivne name.
        translations: {
          dk: "Underemne 2.1.3",
          en: "Subtopic 2.1.3",
        },
        ordering: {
          dk: 6,
          en: 6,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
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
        id: "S000020020",
        name: "S000020020",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S000020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        translations: {
          dk: "Underemne 2.2",
          en: "Subtopic 2.2",
        },
        ordering: {
          dk: 7,
          en: 7,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
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
        id: "S000020030",
        name: "S000020030",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S000020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        translations: {
          dk: "Underemne 2.3",
          en: "Subtopic 2.3",
        },
        ordering: {
          dk: 8,
          en: 8,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
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
        id: "S000030",
        name: "S000030",
        buttons: false,
        translations: {
          dk: "Underemne 3",
          en: "Subtopic 3",
        },
        ordering: {
          dk: 9,
          en: 9,
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            'xxx'
          ],
          broad: [
            'xxx'
          ],
        },
        searchStringComment: {
          dk: "Dette er et eksempel på, at de tre valgmuligheder 'Smal', 'Normal' og 'Bred' ikke vises i avanceret søgning.",
          en: "This is an example of, that the three options 'Narrow', 'Standard' and 'Broad' are not shown in advanced search.",
        },
        tooltip: {
          dk: "Dette er et eksempel på, at de tre valgmuligheder 'Smal', 'Normal' og 'Bred' ikke vises i avanceret søgning.",
          en: "This is an example of, that the three options 'Narrow', 'Standard' and 'Broad' are not shown in advanced search.",
        },
      },
    ],
    tooltip: {
      dk: "Denne kategori er et eksempel, hvor man kan se brugen flere niveauer og kommentarer. Kategorien fjernes, når formularen er live. Bemærk, at det også er muligt at indsætte en kommentar som denne på de øvrige kategorier i dropdownen.",
      en: "This category is an example, where you can see the use of multiple levels and comments. The category is removed once the form is live. Note that it is also possible to insert a comment like this on the other categories in the dropdown.",
    },
  },
  {
    id: "S010",
    groupname: "S010",
    translations: {
      dk: "Diabetestype",
      en: "Diabetes type",
    },
    ordering: { 
      dk: 1, 
      en: 1 
    },
    groups: [
      {
        id: "S010010",
        name: "S010010",
        buttons: true,
        translations: {
          dk: "Alle typer diabetes",
          en: "All diabetes types",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            standardString['narrow']
          ],
          normal: [
            standardString['normal'] + ' OR pre-diabet*[ti] OR prediabet*[ti]'
          ],
          broad: [
            standardString['broad'] + ' OR pre-diabet*[tiab] OR prediabet*[tiab]',
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
        id: "S010020",
        name: "S010020",
        buttons: true,
        translations: {
          dk: "Type 1-diabetes",
          en: "Type 1 diabetes",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus, Type 1"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[ti] OR type-i[ti] OR dm1[ti] OR dmi[ti] OR t1d[ti] OR iddm[ti] OR insulin-dependent[ti] OR insulindependent[ti] OR juvenile-onset[ti] OR autoimmune[ti]) AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[tiab] OR type-i[tiab] OR dm1[tiab] OR dmi[tiab] OR t1d[tiab] OR iddm[tiab] OR insulin-dependent[tiab] OR insulindependent[tiab] OR juvenile-onset[tiab] OR autoimmune[tiab]) AND (' + standardString['broad'] + '))',
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
        id: "S010030",
        name: "S010030",
        buttons: true,
        translations: {
          dk: "Type 2-diabetes",
          en: "Type 2 diabetes",
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus, Type 2"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus, Type 2"[mh] OR ((type-2[ti] OR type-ii[ti] OR dm2[ti] OR t2d[ti] OR niddm[ti] OR noninsulin-dependent[ti] OR non-insulin-dependent[ti] OR noninsulindependent[ti] OR adult-onset[ti]) AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '"Diabetes Mellitus, Type 2"[mh] OR ((type-2[tiab] OR type-ii[tiab] OR dm2[tiab] OR dmii[tiab] OR t2d[tiab] OR niddm[tiab] OR noninsulin-dependent[tiab] OR non-insulin-dependent[tiab] OR noninsulindependent[tiab] OR adult-onset[tiab]) AND (' + standardString['broad'] + '))',
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
        id: "S010040",
        name: "S010040",
        buttons: true,
        translations: {
          dk: "Graviditetsdiabetes",
          en: "Gestastional diabetes",
        },
        ordering: { 
          dk: 4, 
          en: 4 
        },
        searchStrings: {
          narrow: [
            '"Diabetes, Gestational"[majr]'
          ],
          normal: [
            '"Diabetes, Gestational"[mh] OR ((gestational*[ti] OR gdm[ti]) AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '"Diabetes, Gestational"[mh] OR ((gestational*[tiab] OR gdm[tiab]) AND (' + standardString['broad'] + '))',
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
        id: "S010050",
        name: "S010050",
        buttons: true,
        translations: {
          dk: "Prædiabetes",
          en: "Pre-diabetes",
        },
        ordering: { 
          dk: 5, 
          en: 5 
        },
        searchStrings: {
          narrow: [
            '"Prediabetic State"[majr]'
          ],
          normal: [
            '"Prediabetic State"[mh] OR pre-diabet*[ti] OR prediabet*[ti]'
          ],
          broad: [
            '"Prediabetic State"[mh] OR pre-diabet*[tiab] OR prediabet*[tiab]'
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
        id: "S010060",
        name: "S010060",
        buttons: true,
        translations: {
          dk: "LADA",
          en: "LADA",
        },
        ordering: { 
          dk: 6, 
          en: 6 
        },
        searchStrings: {
          narrow: [
            '"Latent Autoimmune Diabetes in Adults"[majr]'
          ],
          normal: [
            '"Latent Autoimmune Diabetes in Adults"[mh] OR (("latent autoimmune"[ti] OR lada[ti]) AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '"Latent Autoimmune Diabetes in Adults"[mh] OR (("latent autoimmune"[tiab] OR lada[tiab]) AND (' + standardString['broad'] + '))',
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
        id: "S010070",
        name: "S010070",
        buttons: true,
        translations: {
          dk: "MODY",
          en: "MODY",
        },
        ordering: { 
          dk: 7, 
          en: 7 
        },
        searchStrings: {
          narrow: [
            '("Mason-Type Diabetes"[nm] OR "Maturity-Onset Diabetes of the Young, Type 1"[nm] OR "Maturity-Onset Diabetes of the Young, Type 2"[nm] OR "Maturity-Onset Diabetes of the Young, Type 3"[nm] OR "Maturity-Onset Diabetes of the Young, Type 4"[nm] OR "Renal cysts and diabetes syndrome"[nm] OR "MODY, Type 6"[nm] OR "Maturity-Onset Diabetes of the Young, Type 8, with Exocrine Dysfunction"[nm] OR "Maturity-Onset Diabetes Of The Young, Type 9"[nm]) AND (maturity-onset[ti] OR maturityonset[ti] OR mody[ti])',
          ],
          normal: [
            '("Mason-Type Diabetes"[nm] OR "Maturity-Onset Diabetes of the Young, Type 1"[nm] OR "Maturity-Onset Diabetes of the Young, Type 2"[nm] OR "Maturity-Onset Diabetes of the Young, Type 3"[nm] OR "Maturity-Onset Diabetes of the Young, Type 4"[nm] OR "Renal cysts and diabetes syndrome"[nm] OR "MODY, Type 6"[nm] OR "Maturity-Onset Diabetes of the Young, Type 8, with Exocrine Dysfunction"[nm] OR "Maturity-Onset Diabetes Of The Young, Type 9"[nm]) OR ((maturity-onset[ti] OR maturityonset[ti] OR mody[ti]) AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '("Mason-Type Diabetes"[nm] OR "Maturity-Onset Diabetes of the Young, Type 1"[nm] OR "Maturity-Onset Diabetes of the Young, Type 2"[nm] OR "Maturity-Onset Diabetes of the Young, Type 3"[nm] OR "Maturity-Onset Diabetes of the Young, Type 4"[nm] OR "Renal cysts and diabetes syndrome"[nm] OR "MODY, Type 6"[nm] OR "Maturity-Onset Diabetes of the Young, Type 8, with Exocrine Dysfunction"[nm] OR "Maturity-Onset Diabetes Of The Young, Type 9"[nm]) OR ((maturity-onset[tiab] OR maturityonset[tiab] OR mody*[tiab] OR monogenic*[tiab]) AND (' + standardString['broad'] + '))',
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
        id: "S010080",
        name: "S010080",
        buttons: true,
        translations: {
          dk: "Neonatal diabetes",
          en: "Neonatal diabetes",
        },
        ordering: { 
          dk: 8, 
          en: 8 
        },
        searchStrings: {
          narrow: [
            '("Diabetes Mellitus, Transient Neonatal, 1"[nm] OR "Diabetes Mellitus, Transient Neonatal, 2"[nm] OR "Diabetes Mellitus, Transient Neonatal, 3"[nm] OR "6q24-Related Transient Neonatal Diabetes Mellitus"[nm] OR "Diabetes Mellitus, Permanent Neonatal"[nm] OR "Diabetes Mellitus, Permanent Neonatal, with Cerebellar Agenesis"[nm] OR "Diabetes Mellitus, Permanent Neonatal, With Neurologic Features"[nm] OR "Diabetes Mellitus, Neonatal, with Congenital Hypothyroidism"[nm]) AND ("neonatal diabetes"[ti] OR ("Infant"[mh] AND "Mutation"[mh] AND ' + standardString['narrow'] + '))',
          ],
          normal: [
            '("Diabetes Mellitus, Transient Neonatal, 1"[nm] OR "Diabetes Mellitus, Transient Neonatal, 2"[nm] OR "Diabetes Mellitus, Transient Neonatal, 3"[nm] OR "6q24-Related Transient Neonatal Diabetes Mellitus"[nm] OR "Diabetes Mellitus, Permanent Neonatal"[nm] OR "Diabetes Mellitus, Permanent Neonatal, with Cerebellar Agenesis"[nm] OR "Diabetes Mellitus, Permanent Neonatal, With Neurologic Features"[nm] OR "Diabetes Mellitus, Neonatal, with Congenital Hypothyroidism"[nm]) OR "neonatal diabetes"[ti] OR ("Infant"[mh] AND "Mutation"[mh] AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '("Diabetes Mellitus, Transient Neonatal, 1"[nm] OR "Diabetes Mellitus, Transient Neonatal, 2"[nm] OR "Diabetes Mellitus, Transient Neonatal, 3"[nm] OR "6q24-Related Transient Neonatal Diabetes Mellitus"[nm] OR "Diabetes Mellitus, Permanent Neonatal"[nm] OR "Diabetes Mellitus, Permanent Neonatal, with Cerebellar Agenesis"[nm] OR "Diabetes Mellitus, Permanent Neonatal, With Neurologic Features"[nm] OR "Diabetes Mellitus, Neonatal, with Congenital Hypothyroidism"[nm]) OR "neonatal diabetes"[tiab] OR ("Infant"[mh] AND "Mutation"[mh] AND (' + standardString['broad'] + '))',
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
    id: "S020",
    groupname: "S020",
    translations: {
      dk: "Komplikationer",
      en: "Complications",
    },
    ordering: { 
      dk: 2, 
      en: 2 
    },
    groups: [
      {
        id: "S020010",
        name: "S020010",
        buttons: true,
        translations: {
          dk: "Komplikationer generelt",
          en: "Complications in general"
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '"Diabetes Complications"[majr]'
          ],
          normal: [
            '"Diabetes Complications"[mh] OR (complication*[ti] AND (' + standardString['normal'] + '))',
          ],
          broad: [
            '"Diabetes Complications"[mh] OR (complication*[tiab] AND (' + standardString['broad'] + '))',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020020",
        name: "S020020",
        buttons: true,
        translations: {
          dk: "Diabetisk nefropati",
          en: "Diabetic nephropathy"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Diabetic Nephropathies"[majr]'
          ],
          normal: [
            '"Diabetic Nephropathies"[mh] OR ((nephropath*[ti] OR kidney*[ti] OR glomeruloscleros*[ti] OR renal*[ti]) AND ("Diabetes Mellitus"[mh] AND diabet*[ti]))'
          ],
          broad: [
            '"Diabetic Nephropathies"[mh] OR ((nephropath*[tiab] OR kidney*[tiab] OR glomeruloscleros*[tiab] OR renal*[ti]) AND (' + standardString['broad'] + '))'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020030",
        name: "S020030",
        buttons: true,
        translations: {
          dk: "Diabetisk neuropati",
          en: "Diabetic neuropathy"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Diabetic Neuropathies"[majr:noexp]'
          ],
          normal: [
            '"Diabetic Neuropathies"[mh:noexp] OR ((neuropath*[ti] OR neuralgi*[ti] OR mononeuropath*[ti] OR polyneuropath*[ti]) AND (' + standardString['normal'] + '))'
          ],
          broad: [
            '"Diabetic Neuropathies"[mh:noexp] OR ((neuropath*[tiab] OR neuralgi*[tiab] OR mononeuropath*[tiab] OR polyneuropath*[tiab]) AND (' + standardString['broad'] + '))'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020040",
        name: "S020040",
        buttons: true,
        translations: {
          dk: "Diabetisk retinopati",
          en: "Diabetic retinopathy"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Diabetic Retinopathy"[majr:noexp]'
          ],
          normal: [
            '"Diabetic Retinopathy"[mh:noexp] OR (retinopath*[ti] AND (' + standardString['normal'] + '))'
          ],
          broad: [
            '"Diabetic Retinopathy"[mh:noexp] OR (retinopath*[tiab] AND (' + standardString['broad'] + '))'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020050",
        name: "S020050",
        buttons: true,
        translations: {
          dk: "Fodsår og andre fodsygdomme",
          en: "Diabetic foot complications"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Diabetic Foot"[majr]'
          ],
          normal: [
            '"Diabetic Foot"[mh] OR ((foot[ti] OR feet[ti] OR podiatri*[ti]) AND (' + standardString['normal'] + '))'
          ],
          broad: [
            '"Diabetic Foot"[mh] OR ((foot[tiab] OR feet[tiab] OR podiatri*[tiab]) AND (' + standardString['broad'] + '))'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020060",
        name: "S020060",
        buttons: true,
        translations: {
          dk: "Gastroparese",
          en: "Gastroparesis"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Gastroparesis"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Gastroparesis"[mh] OR gastropares*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Gastroparesis"[mh] OR gastropares*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020070",
        name: "S020070",
        buttons: true,
        translations: {
          dk: "Hjerte-kar-sygdomme",
          en: "Cardiovascular diseases"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Cardiovascular Diseases"[majr] AND ' + standardString['narrow'] + ') NOT "Diabetic Angiopathies"[mh]'
          ],
          normal: [
            '(("Cardiovascular Diseases"[mh] OR cardio*[ti] OR heart[ti]) AND (' + standardString['normal'] + ')) NOT "Diabetic Angiopathies"[mh]'
          ],
          broad: [
            '(("Cardiovascular Diseases"[mh] OR cardio*[tiab] OR heart[tiab]) AND (' + standardString['broad'] + ')) NOT "Diabetic Angiopathies"[mh]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020080",
        name: "S020080",
        buttons: true,
        translations: {
          dk: "Hudforandringer",
          en: "Skin conditions"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '(("Skin Manifestations"[majr] OR "Skin Diseases"[majr]) AND ' + standardString['narrow'] + ') NOT ("Diabetic Foot"[mh] OR (("Dermatitis, Contact"[majr] OR "Eczema"[majr]) AND ("Insulin Infusion Systems"[mh] OR "Blood Glucose Self-Monitoring"[mh])))'
          ],
          normal: [
            '(("Skin Manifestations"[mh] OR "Skin Diseases"[mh] OR "skin"[ti]) AND (' + standardString['normal'] + ')) NOT ("Diabetic Foot"[mh] OR (("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[ti] OR dermatitis*[ti] OR eczema*[ti] OR skin-problem*[ti] OR skin-reaction*[ti]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[ti] OR insulin-pump*[ti]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[ti] OR blood-sugar*[ti] OR hba1c[ti]) AND (cgm[ti] OR bgm[ti] OR flash[ti] OR libre[ti] OR measur*[ti] OR monitor*[ti] OR iscgm[ti]))))))'
          ],
          broad: [
            '(("Skin Manifestations"[mh] OR "Skin Diseases"[mh] OR "skin"[tiab]) AND (' + standardString['broad'] + ')) NOT ("Diabetic Foot"[mh] OR (("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[tiab] OR dermatitis*[tiab] OR eczema*[tiab] OR skin-problem*[tiab] OR skin-reaction*[tiab]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[tiab] OR insulin-pump*[tiab]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[tiab] OR blood-sugar*[tiab] OR hba1c[tiab]) AND (cgm[tiab] OR bgm[tiab] OR flash[tiab] OR libre[tiab] OR measur*[tiab] OR monitor*[tiab] OR iscgm[tiab]))))))'
          ]
        },
        searchStringComment: {
          dk: "Flere hudproblemer vil blive tilføjet.",
          en: ""
        },
        tooltip: {
          dk: "Hudforandringer som følge af diabetes",
          en: ""
        }
      },
      {
        id: "S020090",
        name: "S020090",
        buttons: true,
        translations: {
          dk: "Hudreaktioner",
          en: "Skin reactions"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Dermatitis, Contact"[majr] OR "Eczema"[majr]) AND ("Insulin Infusion Systems"[mh] OR "Blood Glucose Self-Monitoring"[mh]) AND ' + standardString['narrow']
          ],
          normal: [
            '("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[ti] OR dermatitis*[ti] OR eczema*[ti] OR skin-problem*[ti] OR skin-reaction*[ti]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[ti] OR insulin-pump*[ti]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[ti] OR blood-sugar*[ti] OR hba1c[ti]) AND (cgm[ti] OR bgm[ti] OR flash[ti] OR libre[ti] OR measur*[ti] OR monitor*[ti] OR iscgm[ti])))) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Dermatitis, Contact"[mh] OR "Eczema"[mh] OR allerg*[tiab] OR dermatitis*[tiab] OR eczema*[tiab] OR skin-problem*[tiab] OR skin-reaction*[tiab]) AND (("Insulin Infusion Systems"[mh] OR insulin-infusion*[tiab] OR insulin-pump*[tiab]) OR ("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[tiab] OR blood-sugar*[tiab] OR hba1c[tiab]) AND (cgm[tiab] OR bgm[tiab] OR flash[tiab] OR libre[tiab] OR measur*[tiab] OR monitor*[tiab] OR iscgm[tiab])))) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Hudproblemer, der kan opstå som følge af diabetesteknologi såsom sensorer og pumper.",
          en: ""
        }
      },
      {
        id: "S020100",
        name: "S020100",
        buttons: true,
        translations: {
          dk: "Hyperglykæmi",
          en: "Hyperglycemia"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Hyperglycemia"[majr]'
          ],
          normal: [
            '"Hyperglycemia"[mh] OR hyperglycaemi*[ti] OR hyper-glycaemi*[ti] OR hyperglycemi*[ti] OR hyper-glycemi*[ti]'
          ],
          broad: [
            '"Hyperglycemia"[mh] OR hyperglycaemi*[tiab] OR hyper-glycaemi*[tiab] OR hyperglycemi*[tiab] OR hyper-glycemi*[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020110",
        name: "S020110",
        buttons: true,
        translations: {
          dk: "Hypoglykæmi",
          en: "Hypoglycemia"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Hypoglycemia"[majr]'
          ],
          normal: [
            '"Hypoglycemia"[mh] OR hypoglycaemi*[ti] OR hypo-glycaemi*[ti] OR hypoglycemi*[ti] OR hypo-glycemi*[ti]'
          ],
          broad: [
            '"Hypoglycemia"[mh] OR hypoglycaemi*[tiab] OR hypo-glycaemi*[tiab] OR hypoglycemi*[tiab] OR hypo-glycemi*[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020120",
        name: "S020120",
        buttons: true,
        translations: {
          dk: "Ketoacidose",
          en: "Ketoacidosis"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Diabetic Ketoacidosis"[majr]'
          ],
          normal: [
            '"Diabetic Ketoacidosis"[mh] OR ketoacidos*[ti]'
          ],
          broad: [
            '"Diabetic Ketoacidosis"[mh] OR ketoacidos*[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020130",
        name: "S020130",
        buttons: true,
        translations: {
          dk: "Led, muskler og bindevæv",
          en: "Joints, muscles and connective tissue"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Connective Tissue Diseases"[majr] OR "Trigger Finger Disorder"[majr]) AND ' + standardString['narrow']
          ],
          normal: [
            '("Connective Tissue Diseases"[mh] OR "Trigger Finger Disorder"[mh] OR connective-tissue*[ti] OR trigger-finger*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Connective Tissue Diseases"[mh] OR "Trigger Finger Disorder"[mh] OR connective-tissue*[tiab] OR trigger-finger*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020140",
        name: "S020140",
        buttons: true,
        translations: {
          dk: "Parodontitis",
          en: "Periodontitis"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Oral Health"[majr] OR "Periodontal Diseases"[majr]) AND ' + standardString['narrow']
          ],
          normal: [
            '("Oral Health"[mh] OR "Periodontal Diseases"[mh] OR oral-health[ti] OR parodont*[ti] OR periodont*[ti] OR teeth*[ti] OR tooth[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Oral Health"[mh] OR "Periodontal Diseases"[mh] OR oral-health[tiab] OR parodont*[tiab] OR periodont*[tiab] OR teeth*[tiab] OR tooth[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020150",
        name: "S020150",
        buttons: true,
        translations: {
          dk: "Seksuel dysfunktion",
          en: "Sexual dysfunction"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Sexual Dysfunctions, Psychological"[majr] OR "Sexual Dysfunction, Physiological"[majr]) AND ' + standardString['narrow']
          ],
          normal: [
            '("Sexual Dysfunctions, Psychological"[mh] OR "Sexual Dysfunction, Physiological"[mh] OR ((sexual*[ti] OR erectil*[ti]) AND (dysfunction*[ti] OR problem*[ti]))) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Sexual Dysfunctions, Psychological"[mh] OR "Sexual Dysfunction, Physiological"[mh] OR ((sexual*[tiab] OR erectil*[tiab]) AND (dysfunction*[tiab] OR problem*[tiab]))) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S020160",
        name: "S020160",
        buttons: true,
        translations: {
          dk: "Søvnproblemer",
          en: "Sleep disorders"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Sleep"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Sleep"[mh] OR sleep*[ti] OR apnea*[ti] OR apnoea*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Sleep"[mh] OR sleep*[tiab] OR apnea*[tiab] OR apnoea*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
    ],
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    id: "S030",
    groupname: "S030",
    translations: {
      dk: "Medicinsk behandling",
      en: "Medical treatment",
    },
    ordering: { 
      dk: 3, 
      en: 3 
    },
    groups: [
      {
        id: "S030010",
        name: "S030010",
        buttons: true,
        translations: {
          dk: "Medicinsk behandling generelt",
          en: "Medical treatment in general"
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus/drug therapy"[majr] OR "Hypoglycemic Agents"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus/drug therapy"[mh] OR "Hypoglycemic Agents"[mh]'
          ],
          broad: [
            '"Diabetes Mellitus/drug therapy"[mh] OR "Hypoglycemic Agents"[mh] OR "Hypoglycemic Agents"[pa]'
          ]
        },
        searchStringComment: {
          dk: "Flere lægemidler m.m. vil blive tilføjet.",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S030020",
        name: "S030020",
        buttons: true,
        translations: {
          dk: "DPP-4-hæmmere",
          en: "DPP-4 inhibitors"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Dipeptidyl-Peptidase IV Inhibitors"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Dipeptidyl-Peptidase IV Inhibitors"[mh] OR dpp[ti] OR dipeptyl*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Dipeptidyl-Peptidase IV Inhibitors"[mh] OR "Dipeptidyl-Peptidase IV Inhibitors"[pa] OR dpp[tiab] OR dipeptyl*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        id: "S030030",
        name: "S030030",
        buttons: true,
        translations: {
          dk: "Glitazoner (tiazolidindioner)",
          en: "Glitazones (thiazolidinediones)"
        },
        ordering: {
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Thiazolidinediones"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Thiazolidinediones"[mh] OR thiazolidinedione*[ti] OR glitazone*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Thiazolidinediones"[mh] OR thiazolidinedione*[tiab] OR glitazone*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S030040",
        name: "S030040",
        buttons: true,
        translations: {
          dk: "GLP-1-receptoragonister",
          en: "GLP-1 receptor agonists"
        },
        ordering: {
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Glucagon-Like Peptide 1"[majr] OR "Glucagon-Like Peptide-1 Receptor Agonists"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Glucagon-Like Peptide 1"[mh] OR "Glucagon-Like Peptide-1 Receptor Agonists"[mh] OR glp[ti] OR glucagon-like*[ti] OR glucagonlike*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Glucagon-Like Peptide 1"[mh] OR "Glucagon-Like Peptide-1 Receptor Agonists"[mh] OR glp[tiab] OR glucagon-like*[tiab] OR glucagonlike*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S030050",
        name: "S030050",
        buttons: true,
        translations: {
          dk: "Insulin",
          en: "Insulin"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: ['"Insulins"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: ['("Insulins"[mh] OR insulin*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Insulins"[mh] OR insulin*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S030060",
        name: "S030060",
        buttons: true,
        translations: {
          dk: "Metformin",
          en: "Metformin"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: ['"Metformin"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Metformin"[mh] OR metformin*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Metformin"[mh] OR metformin*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S030070",
        name: "S030070",
        buttons: true,
        translations: {
          dk: "SGLT-2-hæmmere",
          en: "SGLT-2 inhibitors"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Sodium-Glucose Transporter 2 Inhibitors"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Sodium-Glucose Transporter 2 Inhibitors"[mh] OR sglt*[ti] OR sodium-glucose*[ti] OR sodiumglucose*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Sodium-Glucose Transporter 2 Inhibitors"[mh] OR "Sodium-Glucose Transporter 2 Inhibitors"[pa] OR sglt*[tiab] OR sodium-glucose*[tiab] OR sodiumglucose*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S030080",
        name: "S030080",
        buttons: true,
        translations: {
          dk: "Sulfonylurinstoffer",
          en: "Sulfonylureas"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Sulfonylurea Compounds"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Sulfonylurea Compounds"[mh] OR sulfonyl*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Sulfonylurea Compounds"[mh] OR sulfonyl*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    },
  },
  {
    id: "S040",
    groupname: "S040",
    translations: {
      dk: "Ernæring",
      en: "Nutrition"
    },
    ordering: { 
      dk: 4, 
      en: 4 
    },
    groups: [
      {
        id: "S040010",
        name: "S040010",
        buttons: true,
        translations: {
          dk: "Ernæring generelt",
          en: "Nutrition in general"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '("Diet, Food, and Nutrition"[majr] OR "Diet Therapy"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Diet, Food, and Nutrition"[mh] OR "Diet Therapy"[mh] OR "diet therapy"[sh] OR diet*[ti] OR eat[ti] OR eating[ti] OR food*[ti] OR nutrition*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Diet, Food, and Nutrition"[mh] OR "Diet Therapy"[mh] OR "diet therapy"[sh] OR diet*[tiab] OR eat[tiab] OR eating[tiab] OR food*[tiab] OR nutrition*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S040020",
        name: "S040020",
        buttons: true,
        maintopic: true,
        translations: {
          dk: "Diæter og kure",
          en: "Diets",
        },
        ordering: {
          dk: 2,
          en: 2,
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        id: "S040020010",
        name: "S040020010",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S040020",
        translations: {
          dk: "DASH-diæt",
          en: "DASH diet"
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Dietary Approaches to Stop Hypertension"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Dietary Approaches to Stop Hypertension"[mh] OR DASH[ti] OR "Dietary Approaches to Stop Hypertension"[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Dietary Approaches to Stop Hypertension"[mh] OR DASH[tiab] OR "Dietary Approaches to Stop Hypertension"[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "DASH (Dietary Approaches to Stop Hypertension) er udviklet til at sænke blodtrykket. Fokus på lavt saltindtag, frugt, grøntsager og magre proteinkilder.",
          en: "DASH (Dietary Approaches to Stop Hypertension)"
        }
      },
      {
        id: "S040020020",
        name: "S040020020",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S040020",
        translations: {
          dk: "Low carb high fat (LCHF)",
          en: "Low carb high fat (LCHF)"
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Diet, Carbohydrate-Restricted"[majr] AND "Diet, High-Fat"[majr] AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Diet, Carbohydrate-Restricted"[mh] AND "Diet, High-Fat"[mh]) OR (low-carb*[ti] AND high-fat[ti]) OR lchf[ti] OR vlchf[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '(("Diet, Carbohydrate-Restricted"[mh] AND "Diet, High-Fat"[mh]) OR (low-carb*[tiab] AND high-fat[tiab]) OR lchf[tiab] OR vlchf[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Fokus på at reducere kulhydrater og øge fedtindtaget.",
          en: ""
        }
      },
      {
        id: "S040020030",
        name: "S040020030",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S040020",
        translations: {
          dk: "Middelhavskost",
          en: "Mediterranean diet"
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Diet, Mediterranean"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Diet, Mediterranean"[mh] OR (mediterranean[ti] AND diet*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Diet, Mediterranean"[mh] OR (mediterranean[tiab] AND diet*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "En kost baseret på grøntsager, frugt, fuldkorn, fisk, olivenolie og nødder.",
          en: ""
        }
      },
      {
        id: "S040020040",
        name: "S040020040",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S040020",
        translations: {
          dk: "Paleo-diæt",
          en: "Paleolithic diet"
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Diet, Paleolithic"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Diet, Paleolithic"[mh] OR (paleo*[ti] AND diet*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Diet, Paleolithic"[mh] OR (paleo*[tiab] AND diet*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: 'Fokus på "oprindelige fødevarer" som magert kød, grøntsager, nødder og frugt, mens forarbejdede fødevarer og kornprodukter undgås.',
          en: ""
        }
      },
      {
        id: "S040020050",
        name: "S040020050",
        buttons: true,
        maintopic: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S040020",
        translations: {
          dk: "Plantebaseret kost",
          en: "Plant-based diet"
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Kost der primært eller udelukkende består af planter som grøntsager, frugt, bælgfrugter, nødder og fuldkorn.",
          en: ""
        }
      },
      {
        id: "S040020050010",
        name: "S040020050010",
        buttons: true,
        subtopiclevel: 2,
        maintopicIdLevel1: "S040020050",
        maintopicIdLevel2: "S040020",
        translations: {
          dk: "Plantebaseret kost generelt",
          en: "Plant-based diet in general"
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '("Diet, Plant-Based"[majr:noexp] OR "Diet, Vegetarian"[majr:noexp] OR "Diet, Vegan"[majr:noexp]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Diet, Plant-Based"[mh:noexp] OR "Diet, Vegetarian"[mh:noexp] OR "Diet, Vegan"[mh:noexp] OR ((plant-based[ti] OR vegetarian*[ti] OR vegan*[ti]) AND diet*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Diet, Plant-Based"[mh:noexp] OR "Diet, Vegetarian"[mh:noexp] OR "Diet, Vegan"[mh:noexp] OR ((plant-based[tiab] OR vegetarian*[tiab] OR vegan*[tiab]) AND diet*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Kost der primært består af planter som grøntsager, frugt, bælgfrugter, nødder og fuldkorn. Nogle diæter tillader også små mængder animalske produkter.",
          en: ""
        }
      },
      {
        id: "S040020050020",
        name: "S040020050020",
        buttons: true,
        subtopiclevel: 2,
        maintopicIdLevel1: "S040020050",
        maintopicIdLevel2: "S040020",
        translations: {
          dk: "Vegetarisk kost",
          en: "Vegetarian diet"
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            '"Diet, Vegetarian"[majr:noexp] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Diet, Vegetarian"[mh:noexp] OR (vegetarian*[ti] AND diet*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Diet, Vegetarian"[mh:noexp] OR (vegetarian*[tiab] AND diet*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Kost der primært består af planter som grøntsager, frugt, bælgfrugter, nødder og fuldkorn, men tillader også små mængder animalske produkter.",
          en: ""
        }
      },
      {
        id: "S040020050030",
        name: "S040020050030",
        buttons: true,
        subtopiclevel: 2,
        maintopicIdLevel1: "S040020050",
        maintopicIdLevel2: "S040020",
        translations: {
          dk: "Vegansk kost",
          en: "Vegan diet"
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            '"Diet, Vegan"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Diet, Vegan"[majr] OR (vegan*[ti] AND diet*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Diet, Vegan"[majr] OR (vegan*[tiab] AND diet*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Kost der primært består af planter som grøntsager, frugt, bælgfrugter, nødder og fuldkorn, men ikke tillader animalske produkter.",
          en: ""
        }
      },
      {
        id: "S040020060",
        name: "S040020060",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S040020",
        translations: {
          dk: "Tidsbegrænset spisning",
          en: "Time-restricted eating"
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Intermittent Fasting"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Intermittent Fasting"[mh] OR ((intermittent[ti] OR time-restrict*[ti]) AND (diet*[ti] OR eating[ti] OR fasting[ti]))) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Intermittent Fasting"[mh] OR ((intermittent[tiab] OR time-restrict*[tiab]) AND (diet*[tiab] OR eating[tiab] OR fasting[tiab]))) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Spisemønster, hvor der skiftevis er fasteperioder og spiseperioder.",
          en: ""
        },
      },
      {
        id: "S040030",
        name: "S040030",
        buttons: true,
        translations: {
          dk: "Drikke",
          en: "Beverages"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Beverages"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Beverages"[mh] OR beverage*[ti] OR drink*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Beverages"[mh] OR beverage*[tiab] OR drink*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S040040",
        name: "S040040",
        buttons: true,
        translations: {
          dk: "Fedt",
          en: "Fats"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Fatty Acids"[majr] OR "Fats"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Fatty Acids"[mh] OR "Fats"[mh] OR fat[ti] OR fats[ti] OR fatty[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Fatty Acids"[mh] OR "Fats"[mh] OR fat[tiab] OR fats[tiab] OR fatty[tiab]) AND (' + standardString['normal'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S040050",
        name: "S040050",
        buttons: true,
        translations: {
          dk: "Fibre",
          en: "Dietary fiber"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Dietary Fiber"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Dietary Fiber"[mh] OR ((fiber*[ti] OR fibre*[ti]) AND diet*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Dietary Fiber"[mh] OR ((fiber*[tiab] OR fibre*[tiab]) AND diet*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040060',
        name: 'S040060',
        buttons: true,
        translations: {
          dk: 'Glykæmisk indeks',
          en: 'Glycemic Index'
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Glycemic Index"[majr]',
          ],
          normal: [
            '"Glycemic Index"[mh] OR glycaemic index[ti] OR glycemic index[ti]',
          ],
          broad: [
            '"Glycemic Index"[mh] OR glycaemic index[tiab] OR glycemic index[tiab]',
          ],
        },
        searchStringComment: {
            dk: "Denne søgning er ikke kombineret med diabetesrelevante søgeord på forhånd.",
            en: ""
        },
        tooltip: {
            dk: "Denne søgning er ikke kombineret med diabetes&shy;relevante søgeord på forhånd.",
            en: ""
        }
      },
      {
        id: "S040070",
        name: "S040070",
        buttons: true,
        translations: {
          dk: "Kulhydrater",
          en: "Carbohydrates",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Dietary Carbohydrates"[majr] OR "Diet, Carbohydrate Loading"[majr] OR "Diet, Carbohydrate-Restricted"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Dietary Carbohydrates"[mh] OR "Diet, Carbohydrate Loading"[mh] OR "Diet, Carbohydrate-Restricted"[mh] OR carb*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Dietary Carbohydrates"[mh] OR "Diet, Carbohydrate Loading"[mh] OR "Diet, Carbohydrate-Restricted"[mh] OR carb*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S040080",
        name: "S040080",
        buttons: true,
        translations: {
          dk: "Kunstige sødestoffer",
          en: "Artificial sweeteners"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Artificially Sweetened Beverages"[majr] OR "Non-Nutritive Sweeteners"[majr] OR "Sweetening Agents"[majr:noexp] OR "Sweetening Agents"[nm]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Artificially Sweetened Beverages"[mh] OR "Non-Nutritive Sweeteners"[mh] OR "Sweetening Agents"[mh:noexp] OR "Sweetening Agents"[nm] OR artificial* sweet*[ti] OR non-nutritive sweet*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Artificially Sweetened Beverages"[mh] OR "Non-Nutritive Sweeteners"[mh] OR "Sweetening Agents"[mh:noexp] OR "Sweetening Agents"[nm] OR artificial* sweet*[tiab] OR non-nutritive sweet*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    },
  },
  {
    id: "S050",
    groupname: "S050",
    translations: {
      dk: "Fysisk aktivitet",
      en: "Physical activity"
    },
    ordering: { 
      dk: 5, 
      en: 5 
    },
    groups: [
      {
        id: "S050010",
        name: "S050010",
        buttons: true,
        translations: {
          dk: "Fysisk aktivitet generelt",
          en: "Physical activity in general"
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '"Exercise"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Exercise"[mh] OR exercise*[ti] OR physical activit*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Exercise"[mh] OR exercise*[tiab] OR physical activit*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050020",
        name: "S050020",
        buttons: true,
        maintopic: true,
        translations: {
          dk: "Konditionstræning",
          en: "Cardiorespiratory fitness"
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050020010",
        name: "S050020010",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050020",
        translations: {
          dk: "Konditionstræning generelt",
          en: "Cardiorespiratory fitness in general"
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          narrow: [
            '("Activities of Daily Living"[majr] OR "Bicycling"[majr] OR "Physical Conditioning, Human"[majr] OR "Physical Endurance"[majr] OR "Physical Fitness"[majr] OR "Walking"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Activities of Daily Living"[mh] OR "Bicycling"[mh] OR "Physical Conditioning, Human"[mh] OR "Physical Endurance"[mh] OR "Physical Fitness"[mh] OR "Walking"[mh] OR aerobic*[ti] OR cardiorespiratory*[ti] OR daily-activ*[ti] OR bicycling*[ti] OR bicycle*[ti] OR cycling*[ti] OR endurance*[ti] OR fitness*[ti] OR "low-intensity training"[ti:~3] OR "moderate-intensity training"[ti:~3] OR walking[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Activities of Daily Living"[mh] OR "Bicycling"[mh] OR "Physical Conditioning, Human"[mh] OR "Physical Endurance"[mh] OR "Physical Fitness"[mh] OR "Walking"[mh] OR aerobic*[tiab] OR cardiorespiratory*[tiab] OR daily-activ*[tiab] OR bicycling*[tiab] OR bicycle*[tiab] OR cycling*[tiab] OR endurance*[tiab] OR fitness*[tiab] OR "low-intensity training"[tiab:~3] OR "moderate-intensity training"[tiab:~3] OR walking[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050020020",
        name: "S050020020",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050020",
        translations: {
          dk: "Hverdagsaktiviteter (lav til moderat intensitet)",
          en: "Daily activities (low to moderate intensity)"
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        searchStrings: {
          narrow: [
            '("Activities of Daily Living"[majr] OR "Bicycling"[majr] OR "Walking"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Activities of Daily Living"[mh] OR "Bicycling"[mh] OR "Walking"[mh] OR bicycling*[ti] OR bicycle*[ti] OR cycling*[ti] OR daily-activ*[ti] OR "low-intensity training"[ti:~3] OR "moderate-intensity training"[ti:~3] OR walking[ti]) AND (' + standardString['normal'] + ')',

          ],
          broad: [
            '("Activities of Daily Living"[mh] OR "Bicycling"[mh] OR "Walking"[mh] OR bicycling*[tiab] OR bicycle*[tiab] OR cycling*[tiab] OR daily-activ*[tiab] OR "low-intensity training"[tiab:~3] OR "moderate-intensity training"[tiab:~3] OR walking[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050020030",
        name: "S050020030",
        subtopiclevel: 1,
        maintopicIdLevel1: "S050020",
        buttons: true,
        translations: {
          dk: "Udholdenhedstræning (moderat intensitet)",
          en: "Endurance training (moderate intensity)"
        },
        ordering: { 
          dk: 4, 
          en: 4 
        },
        searchStrings: {
          narrow: [
            '("Endurance Training"[majr] OR "Physical Endurance"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Endurance Training"[mh] OR "Physical Endurance"[mh] OR endurance*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Endurance Training"[mh] OR "Physical Endurance"[mh] OR endurance*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050020040",
        name: "S050020040",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050020",
        translations: {
          dk: "Højintensiv intervaltræning (HIIT)",
          en: "High-intensity interval training (HIIT)"
        },
        ordering: { 
          dk: 5, 
          en: 5 
        },
        searchStrings: {
          narrow: [
            '"High-Intensity Interval Training"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("High-Intensity Interval Training"[mh] OR "high-intensity training"[ti:~3]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("High-Intensity Interval Training"[mh] OR "high-intensity training"[tiab:~3]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050030",
        name: "S050030",
        buttons: true,
        translations: {
          dk: "Styrketræning",
          en: "Strength training"
        },
        ordering: { 
          dk: 6, 
          en: 6 
        },
        searchStrings: {
          narrow: [
            '"Resistance Training"[majr] OR "Weight Lifting"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Resistance Training"[mh] OR "Weight Lifting"[mh] OR resistance training[ti] OR strength training[ti] OR weight-lifting*[ti] OR weightlifting*[ti] OR weight training[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Resistance Training"[mh] OR "Weight Lifting"[mh] OR resistance training[tiab] OR strength training[tiab] OR weight-lifting*[tiab] OR weightlifting*[tiab] OR weight training[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "F.eks. med vægte, elastikker eller egen kropsvægt.",
          en: "E.g. with weights, elastic bands or body weight."
        }
      },
      {
        id: "S050040",
        name: "S050040",
        buttons: true,
        translations: {
          dk: "Balance- og bevægelighedstræning",
          en: "Balance and flexibility training"
        },
        ordering: { 
          dk: 7, 
          en: 7 
        },
        searchStrings: {
          narrow: [
            '("Muscle Stretching Exercises"[majr] OR "Postural Balance"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Muscle Stretching Exercises"[mh] OR "Postural Balance"[mh] OR flexibilit*[ti] OR balance*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Muscle Stretching Exercises"[mh] OR "Postural Balance"[mh] OR flexibilit*[tiab] OR balance*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "Anbefales hvis man er over 65 år.",
          en: "Recommended if you are over 65 years old."
        }
      },
      {
        id: "S050050",
        name: "S050050",
        buttons: true,
        maintopic: true,
        translations: {
          dk: "Sport",
          en: "Sports"
        },
        ordering: { 
          dk: 8, 
          en: 8 
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050010",
        name: "S050050010",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Sport generelt",
          en: "Sports in general"
        },
        ordering: { 
          dk: 9, 
          en: 9 
        },
        searchStrings: {
          narrow: [
            '("Sports"[majr] OR "Yoga"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Sports"[mh] OR "Yoga"[mh] OR bicycling*[ti] OR bicycle*[ti] OR cycling*[ti] OR football*[ti] OR gymnastics*[ti] OR jogging*[ti] OR marathon*[ti] OR running*[ti] OR skiing*[ti] OR soccer*[ti] OR swimming*[ti] OR walking*[ti] OR weightlifting*[ti] OR weight-lifting*[ti] OR yoga*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Sports"[mh] OR "Yoga"[mh] OR bicycling*[tiab] OR bicycle*[tiab] OR cycling*[tiab] OR football*[tiab] OR gymnastics*[tiab] OR jogging*[tiab] OR marathon*[tiab] OR running*[tiab] OR skiing*[tiab] OR soccer*[tiab] OR swimming*[tiab] OR walking*[tiab] OR weightlifting*[tiab] OR weight-lifting*[tiab] OR yoga*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050020",
        name: "S050050020",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Cykling",
          en: "Cycling"
        },
        ordering: { 
          dk: 10, 
          en: 10 
        },
        searchStrings: {
          narrow: [
            '("Bicycling"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Bicycling"[mh] OR bicycling*[ti] OR bicycle*[ti] OR cycling*[ti]) AND (' + standardString['normal'] + ')',

          ],
          broad: [
            '("Bicycling"[mh] OR bicycling*[tiab] OR bicycle*[tiab] OR cycling*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050030",
        name: "S050050030",
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        buttons: true,
        translations: {
          dk: "Fodbold",
          en: "Football (soccer)"
        },
        ordering: { 
          dk: 11, 
          en: 11 
        },
        searchStrings: {
          narrow: [
            '("Soccer"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Soccer"[mh] OR football*[ti] OR soccer*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Soccer"[mh] OR football*[tiab] OR soccer*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050040",
        name: "S050050040",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Gang",
          en: "Walking"
        },
        ordering: { 
          dk: 12, 
          en: 12 
        },
        searchStrings: {
          narrow: [
            '"Walking"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Walking"[mh] OR walking*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Walking"[mh] OR walking*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050050",
        name: "S050050050",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Gymnastik",
          en: "Gymnastics"
        },
        ordering: { 
          dk: 13, 
          en: 13 
        },
        searchStrings: {
          narrow: [
            '"Gymnastics"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Gymnastics"[mh] OR gymnastics*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Gymnastics"[mh] OR gymnastics*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050060",
        name: "S050050060",
        buttons: true,
        maintopic: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Løb",
          en: "Running"
        },
        ordering: { 
          dk: 14, 
          en: 14 
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050060010",
        name: "S050050060010",
        buttons: true,
        subtopiclevel: 2,
        maintopicIdLevel1: "S050050",
        maintopicIdLevel2: "S050050060",
        translations: {
          dk: "Løb generelt",
          en: "Running in general"
        },
        ordering: { 
          dk: 15, 
          en: 15 
        },
        searchStrings: {
          narrow: [
            '"Running"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Running"[mh] OR running*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Running"[mh] OR running*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050060020",
        name: "S050050060020",
        buttons: true,
        subtopiclevel: 2,
        maintopicIdLevel1: "S050050",
        maintopicIdLevel2: "S050050060",
        translations: {
          dk: "Jogging",
          en: "Jogging"
        },
        ordering: { 
          dk: 16, 
          en: 16 
        },
        searchStrings: {
          narrow: [
            '"Jogging"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Jogging"[mh] OR jogging*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Jogging"[mh] OR jogging*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050060030",
        name: "S050050060030",
        buttons: true,
        subtopiclevel: 2,
        maintopicIdLevel1: "S050050",
        maintopicIdLevel2: "S050050060",
        translations: {
          dk: "Maratonløb",
          en: "Marathon"
        },
        ordering: { 
          dk: 17, 
          en: 17 
        },
        searchStrings: {
          narrow: [
            '"Marathon Running"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Marathon Running"[mh] OR marathon*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Marathon Running"[mh] OR marathon*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050060",
        name: "S050050060",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        maintopicIdLevel2: "S050050060",
        translations: {
          dk: "Skisport",
          en: "Skiing"
        },
        ordering: { 
          dk: 17, 
          en: 17 
        },
        searchStrings: {
          narrow: [
            '"Skiing"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Skiing"[mh] OR skiing*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Skiing"[mh] OR skiing*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050070",
        name: "S050050070",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Svømning",
          en: "Swimming"
        },
        ordering: { 
          dk: 18, 
          en: 18 
        },
        searchStrings: {
          narrow: [
            '"Swimming"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Swimming"[mh] OR swimming*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Swimming"[mh] OR swimming*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050080",
        name: "S050050080",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Vægtløftning",
          en: "Weightlifting"
        },
        ordering: { 
          dk: 19, 
          en: 19 
        },
        searchStrings: {
          narrow: [
            '"Weight Lifting"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Weight Lifting"[mh] OR weight-lifting*[ti] OR weightlifting*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Weight Lifting"[mh] OR weight-lifting*[tiab] OR weightlifting*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050050090",
        name: "S050050090",
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: "S050050",
        translations: {
          dk: "Yoga",
          en: "Yoga"
        },
        ordering: { 
          dk: 20, 
          en: 20 
        },
        searchStrings: {
          narrow: [
            '"Yoga"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Yoga"[mh] OR yoga*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Yoga"[mh] OR yoga*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S050060",
        name: "S050060",
        buttons: true,
        translations: {
          dk: "Stillesiddende adfærd",
          en: "Sedentary behavior"
        },
        ordering: { 
          dk: 21, 
          en: 21 
        },
        searchStrings: {
          narrow: [
            '"Sedentary Behavior"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Sedentary Behavior"[mh] OR physical inactivit*[ti] OR sedentar*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Sedentary Behavior"[mh] OR physical inactivit*[tiab] OR sedentar*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: "",
    }
  },
  {
    id: "S060",
    groupname: "S060",
    translations: {
      dk: "Teknologi",
      en: "Technology"
    },
    ordering: { 
      dk: 6, 
      en: 6 
    },
    groups: [
      {
        id: "S060010",
        name: "S060010",
        buttons: true,
        translations: {
          dk: "Glukosesensorer",
          en: "Blood glucose self-monitoring"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Blood Glucose Self-Monitoring"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[ti] OR blood-sugar*[ti] OR hba1c[ti]) AND (cgm[ti] OR bgm[ti] OR flash[ti] OR libre[ti] OR measur*[ti] OR monitor*[ti] OR iscgm[ti]))) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Blood Glucose Self-Monitoring"[mh] OR ((blood-glucose*[tiab] OR blood-sugar*[tiab] OR hba1c[tiab]) AND (cgm[tiab] OR bgm[tiab] OR flash[tiab] OR libre[tiab] OR measur*[tiab] OR monitor*[tiab] OR iscgm[tiab]))) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S060020",
        name: "S060020",
        buttons: true,
        translations: {
          dk: "Insulinpumper",
          en: "Insulin infusion systems"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Insulin Infusion Systems"[majr]'
          ],
          normal: [
            '"Insulin Infusion Systems"[mh] OR insulin-infusion*[ti] OR insulin-pump*[ti]',
          ],
          broad: [
            '"Insulin Infusion Systems"[mh] OR insulin-infusion*[tiab] OR insulin-pump*[tiab]',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S060030",
        name: "S060030",
        buttons: true,
        translations: {
          dk: "Kunstig intelligens",
          en: "Artificial intelligence"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Artificial Intelligence"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Artificial Intelligence"[mh] OR artificial-intelligence*[ti] OR chatgpt*[ti] OR machine-learn*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Artificial Intelligence"[mh] OR artificial-intelligence*[tiab] OR chatgpt*[tiab] OR machine-learn*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S060040",
        name: "S060040",
        buttons: true,
        translations: {
          dk: "Mobiltelefoner og apps",
          en: "Mobile phones and apps"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Mobile Applications"[majr] OR "Cell Phone"[majr] OR "Cell Phone Use"[majr] OR "Computers, Handheld"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Mobile Applications"[mh] OR "Cell Phone"[mh] OR "Cell Phone Use"[mh] OR "Computers, Handheld"[mh] OR m-health[ti] OR m-health[ti] OR smart-phone*[ti] OR smartphone*[ti] OR ((cell[ti] OR mobile*[ti] OR tablet*[ti]) AND (app[ti] OR application*[ti] OR apps[ti] OR phone*[ti]))) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Mobile Applications"[mh] OR "Cell Phone"[mh] OR "Cell Phone Use"[mh] OR "Computers, Handheld"[mh] OR m-health[tiab] OR m-health[tiab] OR smart-phone*[tiab] OR smartphone*[tiab] OR ((cell[tiab] OR mobile*[tiab] OR tablet*[tiab]) AND (app[tiab] OR application*[tiab] OR apps[tiab] OR phone*[tiab]))) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S060050",
        name: "S060050",
        buttons: true,
        translations: {
          dk: "Telemedicin og e-sundhed",
          en: "Telemedicine og e-health"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Telemedicine"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Telemedicine"[mh] OR e-health[ti] OR ehealth[ti] OR tele*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Telemedicine"[mh] OR e-health[tiab] OR ehealth[tiab] OR tele*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: "",
    }
  },
  {
    id: "S070",
    groupname: "S070",
    translations: {
      dk: "Kliniske målinger",
      en: "Clinical measures"
    },
    ordering: { 
      dk: 7, 
      en: 7 
    },
    groups: [
      {
        id: "S070010",
        name: "S070010",
        buttons: true,
        translations: {
          dk: "Albuminuri",
          en: "Albuminuria"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Albuminuria"[majr]'
          ],
          normal: [
            '("Albuminuria"[mh] OR albuminuria*[ti])',
          ],
          broad: [
            '("Albuminuria"[mh] OR albuminuria*[tiab])',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S070020",
        name: "S070020",
        buttons: true,
        translations: {
          dk: "Blodglukose",
          en: "Blood glucose"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Blood Glucose"[majr]'
          ],
          normal: [
            '("Blood Glucose"[mh] OR blood-glucose[ti])',
          ],
          broad: [
            '("Blood Glucose"[mh] OR blood-glucose[tiab])',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S070030",
        name: "S070030",
        buttons: true,
        translations: {
          dk: "Blodtryk",
          en: "Blood pressure"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Blood Pressure"[majr] OR "Blood Pressure Determination"[majr] OR "Hypertension"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Blood Pressure"[mh] OR "Blood Pressure Determination"[mh] OR "Hypertension"[mh] OR blood-pressure*[ti] OR hypertensi*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Blood Pressure"[mh] OR "Blood Pressure Determination"[mh] OR "Hypertension"[mh] OR blood-pressure*[tiab] OR hypertensi*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        },
      },
      {
        id: "S070040",
        name: "S070040",
        translations: {
          dk: "eGFR",
          en: "eGFR"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '"Glomerular Filtration Rate"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Glomerular Filtration Rate"[mh] OR glomerular-filtration[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Glomerular Filtration Rate"[mh] OR glomerular-filtration[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S070050",
        name: "S070050",
        translations: {
          dk: "Glukosebelastning",
          en: "Oral glucose tolerance test"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '"Glucose Tolerance Test"[majr]'
          ],
          normal: [
            '("Glucose Tolerance Test"[mh] OR glucose-tolerance[ti] OR ogtt[ti])',
          ],
          broad: [
            '("Glucose Tolerance Test"[mh] OR glucose-tolerance[tiab] OR ogtt[tiab])',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S070060",
        name: "S070060",
        translations: {
          dk: "HbA1c",
          en: "HbA1c"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '"Glycated Hemoglobin"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Glycated Hemoglobin"[mh] OR "Glycated Hemoglobin"[nm] OR a1c[ti] OR glycated-hemoglobin[ti] OR hba1c[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Glycated Hemoglobin"[mh] OR "Glycated Hemoglobin"[mh] OR a1c[ti] OR glycated-hemoglobin[tiab] OR hba1c[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S070070",
        name: "S070070",
        translations: {
          dk: "Ketoner",
          en: "Ketones"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '"Ketones"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Ketones"[mh] OR keton*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Ketones"[mh] OR keton*[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S070080",
        name: "S070080",
        translations: {
          dk: "Kolesterol",
          en: "Cholesterol"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '"Cholesterol"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Cholesterol"[mh] OR cholesterol*[ti] OR hdl[ti] OR ldl[ti] OR vldl[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Cholesterol"[mh] OR cholesterol*[tiab] OR hdl[tiab] OR ldl[tiab] OR vldl[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    id: "S080",
    groupname: "S080",
    translations: {
      dk: "Mental sundhed",
      en: "Mental health"
    },
    ordering: { 
      dk: 8, 
      en: 8 
    },
    groups: [
      {
        id: "S080010",
        name: "S080010",
        buttons: true,
        translations: {
          dk: "Angst",
          en: "Anxiety"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Anxiety"[majr:noexp] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Anxiety"[mh:noexp] OR anxiet*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Anxiety"[mh:noexp] OR anxiet*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S080020",
        name: "S080020",
        buttons: true,
        translations: {
          dk: "Bulimi og diabulimi",
          en: "Bulimia og diabulimia"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Bulimia"[majr] OR "Diabulimia"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Bulimia"[mh] OR "Diabulimia"[mh] OR bulimi*[ti] OR diabulim*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Bulimia"[mh] OR "Diabulimia"[mh] OR bulimi*[tiab] OR diabulim*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        },
      },
      {
        id: "S080030",
        name: "S080030",
        buttons: true,
        translations: {
          dk: "Depression",
          en: "Depression"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Depression"[majr] OR "Depressive Disorder"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Depression"[mh] OR "Depressive Disorder"[mh] OR depres*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Depression"[mh] OR "Depressive Disorder"[mh] OR depres*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S080040",
        name: "S080040",
        buttons: true,
        translations: {
          dk: "Diabetes distress",
          en: "Diabetes distress"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '(("Psychological Distress"[majr:noexp] OR ("distress"[ti] AND diabet*[ti])) NOT "Respiratory Distress Syndrome"[mh]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Psychological Distress"[mh:noexp] OR "distress"[ti]) NOT "Respiratory Distress Syndrome"[mh]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '(("Psychological Distress"[mh:noexp] OR "distress"[tiab]) NOT "Respiratory Distress Syndrome"[mh]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S080050",
        name: "S080050",
        buttons: true,
        translations: {
          dk: "Spiseforstyrrelser",
          en: "Eating disorders"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Feeding and Eating Disorders"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Feeding and Eating Disorders"[mh] OR bulimi*[ti] OR diabulimi*[ti] OR binge-eating*[ti] OR bingeeat*[ti] OR eating-disorder*[ti] OR hyperphagi*[ti] OR overeat*[ti] OR polyphagi*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Feeding and Eating Disorders"[mh] OR bulimi*[tiab] OR diabulimi*[tiab] OR binge-eating*[tiab] OR bingeeat*[tiab] OR eating-disorder*[tiab] OR hyperphagi*[tiab] OR overeat*[tiab] OR polyphagi*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S080060",
        name: "S080060",
        buttons: true,
        translations: {
          dk: "Tvangsoverspisning",
          en: "Binge eating disorder"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Binge-Eating Disorder"[majr] OR "Hyperphagia"[majr:noexp]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Binge-Eating Disorder"[mh] OR "Hyperphagia"[mh:noexp] OR binge-eating*[ti] OR bingeeat*[ti] OR hyperphagi*[ti] OR overeat*[ti] OR polyphagi*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Binge-Eating Disorder"[mh] OR "Hyperphagia"[mh:noexp] OR binge-eating*[tiab] OR bingeeat*[tiab] OR hyperphagi*[tiab] OR overeat*[tiab] OR polyphagi*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    id: "S090",
    groupname: "S090",
    translations: {
      dk: "Forebyggelse og risikofaktorer",
      en: "Prevention and resk factors"
    },
    ordering: { 
      dk: 9, 
      en: 9 
    },
    groups: [
      {
        id: "S090010",
        name: "S090010",
        buttons: true,
        translations: {
          dk: "Forebyggelse generelt",
          en: "Prevention in general"
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '(("Public Health"[majr] AND "prevention and control"[sh]) OR "Public Health Practice"[majr] OR "Community Health Services"[majr] OR "Preventive Health Services"[majr] OR "Health Knowledge, Attitudes, Practice"[majr] OR "Health Communication"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Public Health"[mh] AND "prevention and control"[sh]) OR "Public Health Practice"[mh] OR "Community Health Services"[mh] OR "Preventive Health Services"[mh] OR "Health Knowledge, Attitudes, Practice"[mh] OR "Health Communication"[mh]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("prevention and control"[sh] OR "Public Health Practice"[mh] OR "Community Health Services"[mh] OR "Preventive Health Services"[mh] OR "Health Knowledge, Attitudes, Practice"[mh] OR "Health Communication"[mh]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S090020",
        name: "S090020",
        buttons: true,
        translations: {
          dk: "Arvelighed",
          en: "Heridity"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Heredity"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Heredity"[mh] OR heridity*[ti] OR heritability*[ti]) AND ' + standardString['narrow'] + '',
          ],
          broad: [
            '("Heredity"[mh] OR heridity*[tiab] OR heritability*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S090030",
        name: "S090030",
        buttons: true,
        translations: {
          dk: "Motion",
          en: "Physical activity"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Exercise"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Exercise"[mh] OR exercise*[ti] OR physical-activ*[ti] OR physically-activ*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Exercise"[mh] OR exercise*[tiab] OR physical-activ*[tiab] OR physically-activ*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S090040",
        name: "S090040",
        buttons: true,
        translations: {
          dk: "Overvægt",
          en: "Overwieght"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Overweight"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Overweight"[mh] OR obese*[ti] OR obesity*[ti] OR overweight*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Overweight"[mh] OR obese*[tiab] OR obesity*[tiab] OR overweight*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S090050",
        name: "S090050",
        buttons: true,
        translations: {
          dk: "Rygning",
          en: "Smoking"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Smoking"[majr] OR "Smoking Cessation"[majr] OR "Tobacco"[majr] OR "Tobacco Use Cessation"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Smoking"[mh] OR "Smoking Cessation"[mh] OR "Tobacco"[mh] OR "Tobacco Use Cessation"[mh] OR smoke*[ti] OR smoking*[ti] OR tobacco*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Smoking"[mh] OR "Smoking Cessation"[mh] OR "Tobacco"[mh] OR "Tobacco Use Cessation"[mh] OR smoke*[tiab] OR smoking*[tiab] OR tobacco*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    id: 'S100',
    groupname: 'S100',
    translations: {
        dk: 'Køn og diabetes',
        en: 'Gender and diabetes'
    }, 
    ordering: { 
      dk: 10, 
      en: 10 
    },
    groups: [
      {
        id: 'S100010',
        name: 'S100010',
        buttons: true,
        translations: {
          dk: 'Fertilitet',
          en: 'Fertility'
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '("Fertility"[majr] OR "Infertility"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Fertility"[mh] OR "Infertility"[mh] OR fertility[ti] OR infertility[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Fertility"[mh] OR "Infertility"[mh] OR fertility[tiab] OR infertility[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "Fritekstord vil blive tilføjet.",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S100020',
        name: 'S100020',
        buttons: true,
        translations: {
          dk: 'Menstruationscyklus',
          en: 'Menstrual cycle'
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Menstrual Cycle"[majr] OR "Menstruation Disturbances"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Menstrual Cycle"[mh] OR "Menstruation Disturbances"[mh] OR menstrua*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Menstrual Cycle"[mh] OR "Menstruation Disturbances"[mh] OR menstrua*[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S100030',
        name: 'S100030',
        buttons: true,
        translations: {
          dk: 'Overgangsalder',
          en: 'Climacteric'
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Climacteric"[majr] AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Climacteric"[mh] OR andropaus*[ti] OR climacteric[ti] OR menopaus*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Climacteric"[mh] OR andropaus*[tiab] OR climacteric[tiab] OR menopaus*[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S100040',
        name: 'S100040',
        buttons: true,
        translations: {
          dk: 'Polycystisk ovariesyndrom (PCOS)',
          en: 'Polycystic Ovary Syndrome (PCOS)'
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true, 
        searchStrings: {
          narrow: [
            '"Polycystic Ovary Syndrome"[majr] AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Polycystic Ovary Syndrome"[mh] OR polycystic ovary syndrome[ti] OR pcos[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Polycystic Ovary Syndrome"[mh] OR polycystic ovary syndrome[tiab] OR pcos[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S100050',
        name: 'S100050',
        buttons: true,
        translations: {
          dk: 'Pubertet',
          en: 'Puberty'
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Puberty"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Puberty"[mh] OR adrenarche[ti] OR menarche[ti] OR puberty[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Puberty"[mh] OR adrenarche[tiab] OR menarche[tiab] OR puberty[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S100060',
        name: 'S100060',
        buttons: true,
        translations: {
          dk: 'Testosteron',
          en: 'Testosterone'
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Testosterone"[majr] OR "Hypogonadism"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Testosterone"[mh] OR "Hypogonadism"[mh] OR testosteron*[ti] OR hypogonadis*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Testosterone"[mh] OR "Hypogonadism"[mh] OR testosteron*[tiab] OR hypogonadis*[tiab]) AND (' + standardString['broad'] + ')',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
    ],
    tooltip: {
        dk: "",
        en: ""
    }
  },
  {
    id: "S110",
    groupname: "S110",
    translations: {
      dk: "Særlige grupper",
      en: "Special groups"
    },
    ordering: { 
      dk: 11, 
      en: 11 
    },
    groups: [
      {
        id: "S110010",
        name: "S110010",
        buttons: true,
        translations: {
          dk: "Alkohol- og stofmisbrugere",
          en: "Alcohol and drug abuse"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Designer Drugs"[majr] OR "Drug Users"[majr] OR "Substance-Related Disorders"[majr] OR "Illicit Drugs"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Designer Drugs"[mh] OR "Drug Users"[mh] OR "Substance-Related Disorders"[mh] OR "Illicit Drugs"[mh] OR ("drug user*"[ti] OR (alkohol[ti] OR amphetamine[ti] OR cocaine[ti] OR drug[ti] OR marijuana[ti] OR narcotic[ti] OR substance[ti]) AND (abuse[ti] OR addict*[ti] OR disorder[ti]))) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Designer Drugs"[mh] OR "Drug Users"[mh] OR "Substance-Related Disorders"[mh] OR "Illicit Drugs"[mh] OR ("drug user*"[tiab] OR (alkohol[tiab] OR amphetamine[tiab] OR cocaine[tiab] OR drug[tiab] OR marijuana[tiab] OR narcotic[tiab] OR substance[tiab]) AND (abuse[tiab] OR addict*[tiab] OR disorder[tiab]))) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110020",
        name: "S110020",
        buttons: true,
        translations: {
          dk: "Børn",
          en: "Children"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '(("Child"[mh] NOT "Adult"[mh]) OR "Child, Hospitalized"[majr] OR "Child, Institutionalized"[majr] OR "Child Care"[majr] OR "Child Development"[majr] OR "Child Health"[majr] OR "Child Health Services"[majr] OR "Disabled Children"[majr] OR "Pediatrics"[majr] OR "Pediatric Nursing"[majr] OR "Pediatric Obesity"[majr] OR "Psychology, Child"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Child"[mh] NOT "Adult"[mh]) OR "Child, Hospitalized"[mh] OR "Child, Institutionalized"[mh] OR "Child Care"[mh] OR "Child Development"[mh] OR "Child Health"[mh] OR "Child Health Services"[mh] OR "Disabled Children"[mh] OR "Pediatrics"[mh] OR "Pediatric Nursing"[mh] OR "Pediatric Obesity"[mh] OR "Psychology, Child"[mh] OR child*[ti] OR paediatric*[ti] OR pediatric*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Child"[mh] OR "Child, Hospitalized"[mh] OR "Child, Institutionalized"[mh] OR "Child Care"[mh] OR "Child Development"[mh] OR "Child Health"[mh] OR "Child Health Services"[mh] OR "Disabled Children"[mh] OR "Pediatrics"[mh] OR "Pediatric Nursing"[mh] OR "Pediatric Obesity"[mh] OR "Psychology, Child"[mh] OR child*[tiab] OR paediatric*[tiab] OR pediatric*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110030",
        name: "S110030",
        translations: {
          dk: "Gravide med eksisterende diabetes",
          en: "Pregnant women with pre-existing diabetes"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '(("Preconception Care"[majr] OR "Pregnancy in Diabetics"[majr] OR "Prenatal Care"[majr]) NOT ("Diabetes, Gestational"[mh] OR gestational*[tiab] OR gdm[tiab])) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Preconception Care"[mh] OR "Pregnancy in Diabetics"[mh] OR "Prenatal Care"[mh] OR antenatal*[ti] OR pre-exist*[ti] OR preexist*[ti] OR pregnan*[ti] OR prenatal*[ti]) NOT ("Diabetes, Gestational"[mh] OR gestational*[tiab] OR gdm[tiab)) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '(("Preconception Care"[mh] OR "Pregnancy in Diabetics"[mh] OR "Prenatal Care"[mh] OR antenatal*[tiab] OR pre-exist*[tiab] OR preexist*[tiab] OR pregnan*[tiab] OR prenatal*[tiab]) NOT ("Diabetes, Gestational"[mh] OR gestational*[tiab] OR gdm[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110040",
        name: "S110040",
        buttons: true,
        translations: {
          dk: "Minoritetsgrupper",
          en: "Minority groups"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Minority Groups"[majr] OR "Minority Health"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Minority Groups"[mh] OR "Minority Health"[mh] OR (minorit*[ti] AND (group*[ti] OR population*[ti]))) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Minority Groups"[mh] OR "Minority Health"[mh] OR (minorit*[tiab] AND (group*[tiab] OR population*[tiab]))) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110050",
        name: "S110050",
        buttons: true,
        translations: {
          dk: "Pårørende",
          en: "Relatives"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Family"[majr] OR "Family Health"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Family"[mh] OR "Family Health"[mh] OR family-based*[ti] OR familybased*[ti] OR family-orient*[ti] OR familyorient*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Family"[mh] OR "Family Health"[mh] OR "Caregivers"[mh] OR family-based*[tiab] OR familybased*[tiab] OR family-orient*[tiab] OR familyorient*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: '"Caregivers"[mh] er kun medtaget i den brede søgning, da denne også inkluderer hospitalspersonale.',
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110060",
        name: "S110060",
        buttons: true,
        translations: {
          dk: "Socialt udsatte",
          en: "Vulnerable populations"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Health Equity"[majr] OR "Health Status Disparities"[majr] OR Poverty[majr] OR "Social Marginalization"[majr] OR "Vulnerable Populations"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Health Equity"[mh] OR "Health Status Disparities"[mh] OR Poverty[mh] OR "Social Marginalization"[mh] OR "Vulnerable Populations"[mh] OR disadvantage*[ti] OR disparit*[ti] OR hard-to-reach*[ti] OR inequalit*[ti] OR inequit*[ti] OR marginali*[ti] OR most-in-need*[ti] OR poverty*[ti] OR vulnerabl*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Health Equity"[mh] OR "Health Status Disparities"[mh] OR Poverty[mh] OR "Social Marginalization"[mh] OR "Vulnerable Populations"[mh] OR disadvantage*[tiab] OR disparit*[tiab] OR hard-to-reach*[tiab] OR inequalit*[tiab] OR inequit*[tiab] OR marginali*[tiab] OR most-in-need*[tiab] OR poverty*[tiab] OR vulnerabl*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110070",
        name: "S110070",
        translations: {
          dk: "Udviklingshæmmede",
          en: "People with developmental disabilities"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '("Developmental Disabilities"[majr] OR "Intellectual Disability"[majr] OR "Persons with Intellectual Disabilities"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Developmental Disabilities"[mh] OR "Intellectual Disability"[mh] OR "Persons with Intellectual Disabilities"[mh] OR ((developmental*[ti] OR intellectual*[ti] OR mental*[ti]) AND disabilit*[ti])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Developmental Disabilities"[mh] OR "Intellectual Disability"[mh] OR "Persons with Intellectual Disabilities"[mh] OR ((developmental*[tiab] OR intellectual*[tiab] OR mental*[tiab]) AND disabilit*[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110080",
        name: "S110080",
        translations: {
          dk: "Unge",
          en: "Young people"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '(("Adolescent"[mh] NOT "Adult"[mh]) OR "Adolescent, Hospitalized "[majr] OR "Adolescent, Institutionalized"[majr] OR "Adolescent Development"[majr] OR "Adolescent Behavior"[majr] OR "Adolescent Health"[majr] OR "Adolescent Health Services"[majr] OR "Adolescent Medicine"[majr] OR "Psychology, Adolescent"[majr] OR "Youth Sports"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Adolescent"[mh] NOT "Adult"[mh]) OR "Adolescent, Hospitalized "[mh] OR "Adolescent, Institutionalized"[mh] OR "Adolescent Development"[mh] OR "Adolescent Behavior"[mh] OR "Adolescent Health"[mh] OR "Adolescent Health Services"[mh] OR "Adolescent Medicine"[mh] OR "Psychology, Adolescent"[mh] OR "Youth Sports"[mh] OR adolescen*[ti] OR "young people*"[ti] OR youth*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Adolescent"[mh] OR "Adolescent, Hospitalized "[mh] OR "Adolescent, Institutionalized"[mh] OR "Adolescent Development"[mh] OR "Adolescent Behavior"[mh] OR "Adolescent Health"[mh] OR "Adolescent Health Services"[mh] OR "Adolescent Medicine"[mh] OR "Psychology, Adolescent"[mh] OR "Youth Sports"[mh] OR adolescen*[tiab] OR "young people*"[tiab] OR youth*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S110090",
        name: "S110090",
        translations: {
          dk: "Ældre",
          en: "Elderly people"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        buttons: true,
        searchStrings: {
          narrow: [
            '((("Aged"[mh] NOT "Adult"[mh:noexp]) NOT ("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh])) OR "Health Services for the Aged"[majr] OR "Homes for the Aged"[majr] OR "Retirement"[majr] OR "Senior Centers"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(((("Aged"[mh] NOT "Adult"[mh:noexp]) NOT ("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh])) OR "Health Services for the Aged"[mh] OR "Homes for the Aged"[mh] OR "Retirement"[mh] OR "Senior Centers"[mh] OR elderly[ti]) OR (older*[ti] AND (people*[ti] OR person*[ti]))) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '(("Aged"[mh] OR "Health Services for the Aged"[mh] OR "Homes for the Aged"[mh] OR "Retirement"[mh] OR "Senior Centers"[mh] OR elderly[tiab]) OR (older*[tiab] AND (people*[tiab] OR person*[tiab]))) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    id: "SXXX",
    groupname: "SXXX",
    translations: {
      dk: "Andre emner",
      en: "Other topics"
    },
    ordering: { 
      dk: 100, 
      en: 100 
    },
    groups: [
      {
        id: "SXXX010",
        name: "SXXX010",
        buttons: true,
        translations: {
          dk: "Amputationer",
          en: "Amputations"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Amputation, Surgical"[majr] OR "Amputation Stumps"[majr]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Amputation, Surgical"[mh] OR "Amputation Stumps"[mh] OR amputat*[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Amputation, Surgical"[mh] OR "Amputation Stumps"[mh] OR amputat*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX020",
        name: "SXXX020",
        buttons: true,
        translations: {
          dk: "COVID-19",
          en: "COVID-19"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("COVID-19"[majr] OR "SARS-CoV-2"[majr]) AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("COVID-19"[mh] OR "SARS-CoV-2"[mh]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '(("COVID-19"[mh] OR "COVID-19 Testing"[mh] OR "COVID-19 Vaccines"[mh] OR "SARS-CoV-2"[mh] OR 2019-ncov*[tiab] OR 2019ncov*[tiab] OR 2019-novel-cov*[tiab] OR coronavirus[ti] OR coronavirus-2*[tiab] OR coronavirus-disease-19*[tiab] OR corona-virus-disease-19*[tiab] OR coronavirus-disease-20*[tiab] OR corona-virus-disease-20*[tiab] OR covid-19*[tiab] OR covid19*[tiab] OR covid-20*[tiab] OR covid20*[tiab] OR ncov-2019*[tiab] OR ncov2019*[tiab] OR new-coronavirus[tiab] OR new-corona-virus[tiab] OR novel-coronavirus[tiab] OR novel-corona-virus[tiab] OR sars-2*[tiab] OR sars2*[tiab] OR sars-cov-19*[tiab] OR sars-cov19*[tiab] OR sarscov19*[tiab] OR sarscov-19*[tiab] OR sars-cov-2*[tiab] OR sars-cov2*[tiab] OR sarscov2*[tiab] OR sarscov-2*[tiab] OR (("Coronavirus"[mh] OR "Coronavirus Infections"[mh] OR betacoronavirus[tiab] OR beta-coronavirus[tiab] OR beta-corona-virus[tiab] OR corona-virus[tiab] OR coronavirus[tiab] OR sars*[tiab] OR severe-acute-respiratory*[tiab]) AND (2019[tiab] OR 2020[tiab] OR wuhan*[tiab] OR hubei*[tiab] OR china*[tiab] OR chinese*[tiab] OR outbreak*[tiab] OR epidemic*[tiab] OR pandemic*[tiab]))) AND 2019/12:3000[dp]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX030",
        name: "SXXX030",
        buttons: true,
        translations: {
          dk: "Egenomsorg",
          en: "Self care"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Self Care"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Self Care"[mh] OR self-care[ti] OR self-management[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Self Care"[mh] OR self-care[tiab] OR self-management[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX040",
        name: "SXXX040",
        buttons: true,
        translations: {
          dk: "Kræft",
          en: "Cancer"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Neoplasms"[majr] NOT "Polycystic Ovary Syndrome"[mh]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '(("Neoplasms"[mh] OR cancer*[ti] OR carcinoma*[ti] OR neoplasm*[ti]) NOT ("Polycystic Ovary Syndrome"[mh] OR pcos[tiab])) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '(("Neoplasms"[mh] OR cancer*[tiab] OR carcinoma*[tiab] OR neoplasm*[tiab]) NOT ("Polycystic Ovary Syndrome"[mh] OR pcos[tiab])) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX050",
        name: "SXXX050",
        buttons: true,
        translations: {
          dk: "Patientuddannelse",
          en: "Patient education"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Patient Education as Topic"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Patient Education as Topic"[mh] OR patient-education[ti]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Patient Education as Topic"[mh] OR patient-education[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX060",
        name: "SXXX060",
        buttons: true,
        translations: {
          dk: "PFAS",
          en: "PFAS"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Fluorocarbons"[majr] OR "Alkanesulfonic Acids"[majr]) AND ("Environmental Pollutants"[mh] OR exposure*[ti]) AND ' + standardString['narrow'] + '',
          ],
          normal: [
            '("Fluorocarbons"[mh] OR "Alkanesulfonic Acids"[mh] OR perfluoro*[ti] OR polyfluoro*[ti] OR perfluoro*[nm] OR polyfluoro*[nm]) AND ("Environmental Pollutants"[mh] OR Environmental Pollutants [Pharmacological Action] OR exposure*[tiab]) AND (' + standardString['normal'] + ')',
          ],
          broad: [
            '("Fluorocarbons"[mh] OR "Alkanesulfonic Acids"[mh] OR perfluoro*[tiab] OR polyfluoro*[tiab] OR perfluoro*[nm] OR polyfluoro*[nm]) AND ("Environmental Pollutants"[mh] OR Environmental Pollutants [Pharmacological Action] OR exposure*[tiab]) AND (' + standardString['broad'] + ')',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX070",
        name: "SXXX070",
        buttons: true,
        translations: {
          dk: "Ramadan",
          en: "Ramadan"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            'ramadan[ti] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            'ramadan[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            'ramadan[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX080",
        name: "SXXX080",
        buttons: true,
        translations: {
          dk: "Remission",
          en: "Remission"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Remission Induction"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '("Remission Induction"[mh] OR remission*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Remission Induction"[mh] OR remission*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "SXXX090",
        name: "SXXX090",
        buttons: true,
        translations: {
          dk: "Uddannelse af fagpersoner",
          en: "Education of health professionals"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Education, Professional"[majr] AND ' + standardString['narrow'] + ''
          ],
          normal: [
            '"Education, Professional"[mh] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Education, Professional"[mh] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      }
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    id: "C010",
    groupname: "C010",
    translations: {
      dk: "COVID-19",
      en: "COVID-19"
    },
    ordering: { 
      dk: 1000, 
      en: 1000 
    },
    groups: [
      {
        id: "C010010",
        name: "C010010",
        buttons: true,
        translations: {
          dk: "Diabetes",
          en: "Diabetes"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          normal: [
            standardString['broad'] + ' OR blood-glucose*[tiab] OR glycaemi*[tiab] OR glycemi*[tiab] OR hba1c*[tiab] OR a1c[tiab] OR hyperglyc*[tiab] OR hypoglyc*[tiab] OR insulin*[tiab] OR metabolic*[tiab]',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        },
      },
      {
        id: "C010020",
        name: "C010020",
        buttons: true,
        translations: {
          dk: "Hjerte-kar-sygdom",
          en: "Cardiovascular diseases"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          normal: [
            '"Cardiovascular Diseases"[mh] OR "Cardiovascular System"[mh]  OR cardiopulmonary*[tiab] OR cardio-pulmonary*[tiab] OR cardiorespiratory*[tiab] OR cardio-respiratory*[tiab] OR cardiovascular*[tiab] OR cardio-vascular*[tiab] OR cvd[tiab] OR heart*[tiab] OR hypertens*[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "C010030",
        name: "C010030",
        buttons: true,
        translations: {
          dk: "Mental sundhed",
          en: "Mental health"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          normal: [
            '"Depression"[mh] OR "Emotions"[mh] OR "Mental Disorders"[mh] OR "Mental Health"[mh] OR "Stress, Psychological"[mh] OR psychology[sh] OR anxiety[tiab] OR depression[tiab] OR depressive[tiab] OR emotion*[tiab] OR insomnia*[tiab] OR life-stress*[tiab] OR mental*[tiab] OR psychiatr*[tiab] OR psycholog*[tiab] OR psychosocial*[tiab] OR psycho-social*[tiab] OR sleep*[tiab] OR stressful*[tiab]',
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "C010040",
        name: "C010040",
        buttons: true,
        translations: {
          dk: "Nyresygdom",
          en: "Kidney diseases"
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          normal: [
            '"Kidney Diseases"[mh] OR "Kidney"[mh] OR nephro*[tiab] OR kidney*[tiab] OR renal*[tiab]',
          ],
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  }
];