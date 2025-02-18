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
        name: "S00010",
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
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 1.",
          en: "This is an example of a subtopic at level 1.",
        },

      },
      {
        id: "S00020",
        name: "S00020",
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
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 1, som har under&shy;liggende emner (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 1, that has subtopics underneath (indicated with an arrow). Click to see the subtopics.",
        },
      },
      {
        id: "S00030",
        name: "S00030",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "S00020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Underemne 2.1",
          en: "Subtopic 2.1",
        },

        ordering: {
          dk: 3,
          en: 3,
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 2, som også har et under&shy;liggende emne (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 2, that also has a subtopic underneath (indicated with an arrow). Click to see the subtopics.",
        },
      },
      {
        id: "S00040",
        name: "S00040",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "S00030", // Angiver at dette element har et parent med dette id. (Emne 2.1)
        maintopicIdLevel2: "S00020", // Angiver at dette element har et grandparent med dette id (Emne 2)
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
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 3, som er det dybteste niveau i denne rullemenu.",
          en: "This is an example of a subtopic at level 3, which is the deepest level in this dropdown menu.",
        },

      },
      {
        id: "S00050",
        name: "S00050",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S00030", // Angiver at dette element har et parent med dette id. (Emne 2.1)
        maintopicIdLevel2: "S00020", // Angiver at dette element har et grandparent med dette id (Emne 2)
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
        id: "S00060",
        name: "S00060",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        maintopicIdLevel2: "S00030", // Angiver at dette er punktet på 2. niveau til punktet med det angivne name.
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
        id: "S00070",
        name: "S00070",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
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
        id: "S00080",
        name: "S00080",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
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
        id: "S00090",
        name: "S00090",
        buttons: true,
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
      dk: "Denne kategori er et eksempel, hvor man kan se brugen flere niveauer og kommentarer. Kategorien fjernes, når formularen er live. Bemærk, at det også er muligt at indsætte en kommentar som denne på de øvrige kategorier i dropdownen.",
      en: "This category is an example, where you can see the use of multiple levels and comments. The category is removed once the form is live. Note that it is also possible to insert a comment like this on the other categories in the dropdown.",
    },
  },
  {
    groupname: "Dementia disorders",
    id: "S10",
    translations: {
      dk: "Demenssygdomme",
      en: "Dementia disorders",
    },
    ordering: {
      dk: 1,
      en: 1,
    },
    groups: [
      {
        name: "S10010",
        buttons: true,
        id: "S10010",
        translations: {
          dk: "Demenssygdomme generelt",
          en: "Dementia disorders in general",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Dementia"[majr]'
          ],
          normal: [
            '"Dementia"[mh] OR dementia*[ti]'
          ],
          broad: [
            '"Dementia"[mh] OR dementia*[tiab]'
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
        name: "S10020",
        buttons: true,
        id: "S10020",
        translations: {
          dk: "Alzheimers sygdom",
          en: "Alzheimer disease",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Alzheimer Disease"[majr]'
          ],
          normal: [
            '"Alzheimer Disease"[mh] OR "alzheimer disease"[ti] OR "alzheimers disease"[ti]'
          ],
          broad: [
            '"Alzheimer Disease"[mh] OR "alzheimer disease"[tiab] OR "alzheimers disease"[tiab]'
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
        name: "S10030",
        buttons: true,
        id: "S10030",
        translations: {
          dk: "Vaskulær demens",
          en: "Vascular dementia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dementia, Vascular"[majr]'
          ],
          normal: [
            '"Dementia, Vascular"[mh] OR "vascular dementia"[ti]'
          ],
          broad: [
            '"Dementia, Vascular"[mh] OR "vascular dementia"[tiab]'
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
        name: "S10040",
        buttons: true,
        id: "S10040",
        translations: {
          dk: "Frontotemporal demens",
          en: "Frontotemporal dementia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Frontotemporal Dementia"[majr]'
          ],
          normal: [
            '"Frontotemporal Dementia"[mh] OR "frontotemporal dementia"[ti]'
          ],
          broad: [
            '"Frontotemporal Dementia"[mh] OR "frontotemporal dementia"[tiab]'
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
        name: "S10050",
        buttons: true,
        id: "S10050",
        translations: {
          dk: "Progressiv ikke-flydende afasi",
          en: "Progressive non-fluent aphasia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Primary Progressive Nonfluent Aphasia"[majr]'
          ],
          normal: [
            '"Primary Progressive Nonfluent Aphasia"[mh] OR "primary progressive nonfluent aphasia"[ti]'
          ],
          broad: [
            '"Primary Progressive Nonfluent Aphasia"[mh] OR "primary progressive nonfluent aphasia"[tiab]'
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
        name: "S10060",
        buttons: true,
        id: "S10060",
        translations: {
          dk: "Semantisk demens",
          en: "Semantic dementia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Frontotemporal Lobar Degeneration"[majr]'
          ],
          normal: [
            '"Frontotemporal Lobar Degeneration"[mh] OR "frontotemporal lobar degeneration"[ti]'
          ],
          broad: [
            '"Frontotemporal Lobar Degeneration"[mh] OR "frontotemporal lobar degeneration"[tiab]'
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
        name: "S10070",
        buttons: true,
        id: "S10070",
        translations: {
          dk: "Logopenisk afasi",
          en: "Logopenic aphasia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Aphasia, Primary Progressive"[majr]'
          ],
          normal: [
            '"Aphasia, Primary Progressive"[mh] OR "logopenic aphasia"[ti] OR "logopenic variant"[ti]'
          ],
          broad: [
            '"Aphasia, Primary Progressive"[mh] OR "logopenic aphasia"[tiab] OR "logopenic variant"[tiab]'
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
        name: "S10080",
        buttons: true,
        id: "S10080",
        translations: {
          dk: "Lewy body demens",
          en: "Lewy body dementia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Lewy Body Disease"[majr]'
          ],
          normal: [
            '"Lewy Body Disease"[mh] OR "lewy body dementia"[ti] OR "lewy body disease"[ti]'
          ],
          broad: [
            '"Lewy Body Disease"[mh] OR "lewy body dementia"[tiab] OR "lewy body disease"[tiab]'
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
        name: "S10090",
        buttons: true,
        id: "S10090",
        translations: {
          dk: "Parkinsons sygdom",
          en: "Parkinson's disease",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Parkinson Disease"[majr] AND "Dementia"[mh]'
          ],
          normal: [
            '("Parkinson Disease"[mh] AND "Dementia"[mh]) OR "parkinsons disease dementia"[ti]'
          ],
          broad: [
            '("Parkinson Disease"[mh] AND "Dementia"[mh]) OR "parkinsons disease dementia"[tiab]'
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
        name: "S10100",
        buttons: true,
        id: "S10100",
        translations: {
          dk: "Atypiske Parkinsonsyndromer",
          en: "Atypical Parkinson's disease",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Parkinson Disease"[majr] AND "atypical*[ti]'
          ],
          normal: [
            '"Parkinson Disease"[mh] AND ("atypical"[ti] OR "parkinsonian syndrome"[ti])'
          ],
          broad: [
            '"Parkinson Disease"[mh] AND ("atypical"[tiab] OR "parkinsonian syndrome"[tiab])'
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
        name: "S10110",
        buttons: true,
        id: "S10110",
        translations: {
          dk: "Multipel systematrofi",
          en: "Multiple system atrophy",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Multiple System Atrophy"[majr]'
          ],
          normal: [
            '"Multiple System Atrophy"[mh] OR "multiple system atrophy"[ti]'
          ],
          broad: [
            '"Multiple System Atrophy"[mh] OR "multiple system atrophy"[tiab]'
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
        name: "S10120",
        buttons: true,
        id: "S10120",
        translations: {
          dk: "Progressiv supranukleær parese",
          en: "Progressive supranuclear palsy",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Supranuclear Palsy, Progressive"[majr]'
          ],
          normal: [
            '"Supranuclear Palsy, Progressive"[mh] OR "progressive supranuclear palsy"[ti]'
          ],
          broad: [
            '"Supranuclear Palsy, Progressive"[mh] OR "progressive supranuclear palsy"[tiab]'
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
        name: "S10130",
        buttons: true,
        id: "S10130",
        translations: {
          dk: "Kortikobasal degeneration",
          en: "Corticobasal degeneration",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Corticobasal Degeneration"[majr]'
          ],
          normal: [
            '"Corticobasal Degeneration"[mh] OR "corticobasal degeneration"[ti] OR "corticobasal syndrome"[ti]'
          ],
          broad: [
            '"Corticobasal Degeneration"[mh] OR "corticobasal degeneration"[tiab] OR "corticobasal syndrome"[tiab]'
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
        name: "S10140",
        buttons: true,
        id: "S10140",
        translations: {
          dk: "Spinocerebellar ataksi",
          en: "Spinocerebellar ataxia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Spinocerebellar Ataxias"[majr]'
          ],
          normal: [
            '"Spinocerebellar Ataxias"[mh] OR "spinocerebellar ataxia"[ti]'
          ],
          broad: [
            '"Spinocerebellar Ataxias"[mh] OR "spinocerebellar ataxia"[tiab]'
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
        name: "S10150",
        buttons: true,
        id: "S10150",
        translations: {
          dk: "CADASIL",
          en: "CADASIL",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"CADASIL"[majr]'
          ],
          normal: [
            '"CADASIL"[mh] OR "cadasil"[ti]'
          ],
          broad: [
            '"CADASIL"[mh] OR "cadasil"[tiab]'
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
        name: "S10160",
        buttons: true,
        id: "S10160",
        translations: {
          dk: "Downs syndrom",
          en: "Down syndrome",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Down Syndrome"[majr] AND "Dementia"[mh]'
          ],
          normal: [
            '("Down Syndrome"[mh] AND "Dementia"[mh]) OR "down syndrome dementia"[ti]'
          ],
          broad: [
            '("Down Syndrome"[mh] AND "Dementia"[mh]) OR "down syndrome dementia"[tiab]'
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
        name: "S10170",
        buttons: true,
        id: "S10170",
        translations: {
          dk: "Udviklingshæmning",
          en: "Developmental disabilities",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Developmental Disabilities"[majr] AND "Dementia"[mh]'
          ],
          normal: [
            '("Developmental Disabilities"[mh] AND "Dementia"[mh]) OR "developmental disabilities dementia"[ti]'
          ],
          broad: [
            '("Developmental Disabilities"[mh] AND "Dementia"[mh]) OR "developmental disabilities dementia"[tiab]'
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
        name: "S10180",
        buttons: true,
        id: "S10180",
        translations: {
          dk: "Posterior kortikal atrofi",
          en: "Posterior cortical atrophy",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"posterior cortical atrophy"[ti]'
          ],
          normal: [
            '"posterior cortical atrophy"[ti]'
          ],
          broad: [
            '"posterior cortical atrophy"[tiab]'
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
        name: "S10190",
        buttons: true,
        id: "S10190",
        translations: {
          dk: "Alkoholrelateret demens",
          en: "Alcohol-related dementia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Alcohol-Related Disorders"[majr] AND "Dementia"[mh]'
          ],
          normal: [
            '("Alcohol-Related Disorders"[mh] AND "Dementia"[mh]) OR "alcohol related dementia"[ti]'
          ],
          broad: [
            '("Alcohol-Related Disorders"[mh] AND "Dementia"[mh]) OR "alcohol related dementia"[tiab]'
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
        name: "S10200",
        buttons: true,
        id: "S10200",
        translations: {
          dk: "Mild kognitiv svækkelse",
          en: "Mild cognitive impairment",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cognitive Dysfunction"[majr]'
          ],
          normal: [
            '"Cognitive Dysfunction"[mh] OR "mild cognitive impairment"[ti] OR MCI[ti]'
          ],
          broad: [
            '"Cognitive Dysfunction"[mh] OR "mild cognitive impairment"[tiab] OR MCI[tiab]'
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
        name: "S10210",
        buttons: true,
        id: "S10210",
        translations: {
          dk: "Prionsygdom",
          en: "Prion disease",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Prion Diseases"[majr]'
          ],
          normal: [
            '"Prion Diseases"[mh] OR "prion disease"[ti] OR "prion diseases"[ti] OR "creutzfeldt jakob"[ti]'
          ],
          broad: [
            '"Prion Diseases"[mh] OR "prion disease"[tiab] OR "prion diseases"[tiab] OR "creutzfeldt jakob"[tiab]'
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
        name: "S10220",
        buttons: true,
        id: "S10220",
        translations: {
          dk: "Huntingtons sygdom",
          en: "Huntington's disease",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Huntington Disease"[majr]'
          ],
          normal: [
            '"Huntington Disease"[mh] OR "huntington disease"[ti] OR "huntingtons disease"[ti] OR "huntington\'s disease"[ti]'
          ],
          broad: [
            '"Huntington Disease"[mh] OR "huntington disease"[tiab] OR "huntingtons disease"[tiab] OR "huntington\'s disease"[tiab]'
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
        name: "S10230",
        buttons: true,
        id: "S10230",
        translations: {
          dk: "Sygdomsforløb",
          en: "Disease course",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Disease Progression"[majr]'
          ],
          normal: [
            '"Disease Progression"[mh] OR "disease progression"[ti] OR "disease course"[ti]'
          ],
          broad: [
            '"Disease Progression"[mh] OR "disease progression"[tiab] OR "disease course"[tiab]'
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
        name: "S10240",
        buttons: true,
        id: "S10240",
        translations: {
          dk: "Sygdomsudvikling",
          en: "Disease progress",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Disease Progression"[majr]'
          ],
          normal: [
            '"Disease Progression"[mh] OR "disease progress"[ti] OR "disease progression"[ti]'
          ],
          broad: [
            '"Disease Progression"[mh] OR "disease progress"[tiab] OR "disease progression"[tiab]'
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
        name: "S10250",
        buttons: true,
        id: "S10250",
        translations: {
          dk: "Demensstadie",
          en: "Stage of dementia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Severity of Illness Index"[majr] AND "Dementia"[majr]'
          ],
          normal: [
            '("Severity of Illness Index"[mh] AND "Dementia"[mh]) OR "stage of dementia"[ti] OR "dementia stage"[ti]'
          ],
          broad: [
            '("Severity of Illness Index"[mh] AND "Dementia"[mh]) OR "stage of dementia"[tiab] OR "dementia stage"[tiab]'
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
      }
    ],
  },
  {
    groupname: "Symptoms",
    id: "S20",
    translations: {
      dk: "Symptomer",
      en: "Symptoms",
    },
    ordering: {
      dk: 1,
      en: 1
    },
    groups: [
      {
        name: "S20010",
        buttons: true,
        id: "S20010",
        translations: {
          dk: "Afasi",
          en: "Aphasia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Aphasia"[majr]'
          ],
          normal: [
            '"Aphasia"[mh] OR "aphasia"[ti] OR "aphasic"[ti]'
          ],
          broad: [
            '"Aphasia"[mh] OR "aphasia"[tiab] OR "aphasic"[tiab]'
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
        name: "S20020",
        buttons: true,
        id: "S20020",
        translations: {
          dk: "Amnesi",
          en: "Amnesia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Amnesia"[majr]'
          ],
          normal: [
            '"Amnesia"[mh] OR "amnesia"[ti] OR "amnesic"[ti]'
          ],
          broad: [
            '"Amnesia"[mh] OR "amnesia"[tiab] OR "amnesic"[tiab]'
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
        name: "S20030",
        buttons: true,
        id: "S20030",
        translations: {
          dk: "Apraksi",
          en: "Apraxia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Apraxias"[majr]'
          ],
          normal: [
            '"Apraxias"[mh] OR "apraxia"[ti] OR "apraxic"[ti]'
          ],
          broad: [
            '"Apraxias"[mh] OR "apraxia"[tiab] OR "apraxic"[tiab]'
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
        name: "S20040",
        buttons: true,
        id: "S20040",
        translations: {
          dk: "Anosognosi",
          en: "Anosognosia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Awareness"[majr]'
          ],
          normal: [
            '"Awareness"[mh] OR "anosognosia"[ti]'
          ],
          broad: [
            '"Awareness"[mh] OR "anosognosia"[tiab]'
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
        name: "S20050",
        buttons: true,
        id: "S20050",
        translations: {
          dk: "Aggression",
          en: "Aggression",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Aggression"[majr]'
          ],
          normal: [
            '"Aggression"[mh] OR "aggression"[ti] OR "aggressive"[ti]'
          ],
          broad: [
            '"Aggression"[mh] OR "aggression"[tiab] OR "aggressive"[tiab]'
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
        name: "S20060",
        buttons: true,
        id: "S20060",
        translations: {
          dk: "Agitation",
          en: "Agitation",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Psychomotor Agitation"[majr]'
          ],
          normal: [
            '"Psychomotor Agitation"[mh] OR "agitation"[ti] OR "agitated"[ti]'
          ],
          broad: [
            '"Psychomotor Agitation"[mh] OR "agitation"[tiab] OR "agitated"[tiab]'
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
        name: "S20065",
        buttons: true,
        id: "S20065",
        translations: {
          dk: "Agnosi",
          en: "Agnosia",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Agnosia"[majr]'
          ],
          normal: [
            '"Agnosia"[mh] OR "agnosia"[ti] OR "agnosic"[ti]'
          ],
          broad: [
            '"Agnosia"[mh] OR "agnosia"[tiab] OR "agnosic"[tiab]'
          ]
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
        name: "S20070",
        buttons: true,
        id: "S20070",
        translations: {
          dk: "Angst",
          en: "Anxiety",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Anxiety"[majr]'
          ],
          normal: [
            '"Anxiety"[mh] OR "anxiety"[ti] OR "anxious"[ti]'
          ],
          broad: [
            '"Anxiety"[mh] OR "anxiety"[tiab] OR "anxious"[tiab]'
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
        name: "S20080",
        buttons: true,
        id: "S20080",
        translations: {
          dk: "Apati",
          en: "Apathy",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Apathy"[majr]'
          ],
          normal: [
            '"Apathy"[mh] OR "apathy"[ti] OR "apathetic"[ti]'
          ],
          broad: [
            '"Apathy"[mh] OR "apathy"[tiab] OR "apathetic"[tiab]'
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
        name: "S20090",
        buttons: true,
        id: "S20090",
        translations: {
          dk: "Depression",
          en: "Depression",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Depression"[majr]'
          ],
          normal: [
            '"Depression"[mh] OR "depression"[ti] OR "depressive"[ti]'
          ],
          broad: [
            '"Depression"[mh] OR "depression"[tiab] OR "depressive"[tiab]'
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
        name: "S20100",
        buttons: true,
        id: "S20100",
        translations: {
          dk: "Hallucinationer",
          en: "Hallucinations",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hallucinations"[majr]'
          ],
          normal: [
            '"Hallucinations"[mh] OR "hallucination"[ti] OR "hallucinations"[ti]'
          ],
          broad: [
            '"Hallucinations"[mh] OR "hallucination"[tiab] OR "hallucinations"[tiab]'
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
        name: "S20110",
        buttons: true,
        id: "S20110",
        translations: {
          dk: "Søvnforstyrrelser",
          en: "Sleep disturbance",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Sleep Wake Disorders"[majr]'
          ],
          normal: [
            '"Sleep Wake Disorders"[mh] OR "sleep disorder"[ti] OR "sleep disorders"[ti] OR "sleep disturbance"[ti]'
          ],
          broad: [
            '"Sleep Wake Disorders"[mh] OR "sleep disorder"[tiab] OR "sleep disorders"[tiab] OR "sleep disturbance"[tiab]'
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
        name: "S20120",
        buttons: true,
        id: "S20120",
        translations: {
          dk: "Adfærdsændring",
          en: "Behavioral change",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Behavioral Symptoms"[majr] OR "Behavior"[majr:noexp]'
          ],
          normal: [
            '"Behavioral Symptoms"[mh] OR "Behavior"[mh:noexp] OR "behavioral change"[ti] OR "behavioural change"[ti] OR "behavior change"[ti] OR "behaviour change"[ti]'
          ],
          broad: [
            '"Behavioral Symptoms"[mh] OR "Behavior"[mh:noexp] OR "behavioral change"[tiab] OR "behavioural change"[tiab] OR "behavior change"[tiab] OR "behaviour change"[tiab]'
          ]
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
        name: "S20130",
        buttons: true,
        id: "S20130",
        translations: {
          dk: "Problemløsning",
          en: "Problem solving",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Problem Solving"[majr]'
          ],
          normal: [
            '"Problem Solving"[mh] OR "problem solving"[ti] OR "problem-solving"[ti]'
          ],
          broad: [
            '"Problem Solving"[mh] OR "problem solving"[tiab] OR "problem-solving"[tiab]'
          ]
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
        name: "S20140",
        buttons: true,
        id: "S20140",
        translations: {
          dk: "Vrangforestillinger",
          en: "Delusions",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Delusions"[majr]'
          ],
          normal: [
            '"Delusions"[mh] OR "delusion"[ti] OR "delusions"[ti] OR "delusional"[ti]'
          ],
          broad: [
            '"Delusions"[mh] OR "delusion"[tiab] OR "delusions"[tiab] OR "delusional"[tiab]'
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
        name: "S20160",
        buttons: true,
        id: "S20160",
        translations: {
          dk: "Opmærksomhed",
          en: "Attention",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Attention"[majr]'
          ],
          normal: [
            '"Attention"[mh] OR "attention"[ti] OR "attentional"[ti]'
          ],
          broad: [
            '"Attention"[mh] OR "attention"[tiab] OR "attentional"[tiab]'
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
        name: "S20170",
        buttons: true,
        id: "S20170",
        translations: {
          dk: "BPSD",
          en: "BPSD",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Behavioral Symptoms"[majr] AND "Dementia"[majr]'
          ],
          normal: [
            '"Behavioral Symptoms"[mh] AND "Dementia"[mh] OR "BPSD"[ti] OR "behavioral and psychological symptoms of dementia"[ti]'
          ],
          broad: [
            '"Behavioral Symptoms"[mh] AND "Dementia"[mh] OR "BPSD"[tiab] OR "behavioral and psychological symptoms of dementia"[tiab]'
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
        name: "S20180",
        buttons: true,
        id: "S20180",
        translations: {
          dk: "Døgnrytme",
          en: "Circadian rhythm",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Circadian Rhythm"[majr]'
          ],
          normal: [
            '"Circadian Rhythm"[mh] OR "circadian rhythm"[ti] OR "circadian rhythms"[ti]'
          ],
          broad: [
            '"Circadian Rhythm"[mh] OR "circadian rhythm"[tiab] OR "circadian rhythms"[tiab]'
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
        name: "S20190",
        buttons: true,
        id: "S20190",
        translations: {
          dk: "Kognition",
          en: "Cognition",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cognition"[majr]'
          ],
          normal: [
            '"Cognition"[mh] OR "cognition"[ti] OR "cognitive"[ti]'
          ],
          broad: [
            '"Cognition"[mh] OR "cognition"[tiab] OR "cognitive"[tiab]'
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
        name: "S20200",
        buttons: true,
        id: "S20200",
        translations: {
          dk: "Delirium",
          en: "Delirium",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Delirium"[majr]'
          ],
          normal: [
            '"Delirium"[mh] OR "delirium"[ti]'
          ],
          broad: [
            '"Delirium"[mh] OR "delirium"[tiab]'
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
        name: "S20220",
        buttons: true,
        id: "S20220",
        translations: {
          dk: "Episodisk hukommelse",
          en: "Episodic memory",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Memory, Episodic"[majr]'
          ],
          normal: [
            '"Memory, Episodic"[mh] OR "episodic memory"[ti]'
          ],
          broad: [
            '"Memory, Episodic"[mh] OR "episodic memory"[tiab]'
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
        name: "S20230",
        buttons: true,
        id: "S20230",
        translations: {
          dk: "Eksekutive funktioner",
          en: "Executive function",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Executive Function"[majr]'
          ],
          normal: [
            '"Executive Function"[mh] OR "executive function"[ti] OR "executive functions"[ti]'
          ],
          broad: [
            '"Executive Function"[mh] OR "executive function"[tiab] OR "executive functions"[tiab]'
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
        name: "S20240",
        buttons: true,
        id: "S20240",
        translations: {
          dk: "Hæmning",
          en: "Inhibition",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Inhibition (Psychology)"[majr]'
          ],
          normal: [
            '"Inhibition (Psychology)"[mh] OR "inhibition"[ti] OR "inhibitory"[ti]'
          ],
          broad: [
            '"Inhibition (Psychology)"[mh] OR "inhibition"[tiab] OR "inhibitory"[tiab]'
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
        name: "S20250",
        buttons: true,
        id: "S20250",
        translations: {
          dk: "Irritabilitet",
          en: "Irritability",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Irritable Mood"[majr]'
          ],
          normal: [
            '"Irritable Mood"[mh] OR "irritability"[ti] OR "irritable"[ti]'
          ],
          broad: [
            '"Irritable Mood"[mh] OR "irritability"[tiab] OR "irritable"[tiab]'
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
        name: "S20260",
        buttons: true,
        id: "S20260",
        translations: {
          dk: "Sprog",
          en: "Language",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Language"[majr] OR "Language Disorders"[majr]'
          ],
          normal: [
            '"Language"[mh] OR "Language Disorders"[mh] OR "language impairment"[ti] OR "language deficit"[ti] OR "language dysfunction"[ti] OR "language disorder"[ti]'
          ],
          broad: [
            '"Language"[mh] OR "Language Disorders"[mh] OR "language impairment"[tiab] OR "language deficit"[tiab] OR "language dysfunction"[tiab] OR "language disorder"[tiab]'
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
        name: "S20270",
        buttons: true,
        id: "S20270",
        translations: {
          dk: "Hukommelse",
          en: "Memory",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Memory"[majr]'
          ],
          normal: [
            '"Memory"[mh] OR "memory"[ti] OR "memories"[ti]'
          ],
          broad: [
            '"Memory"[mh] OR "memory"[tiab] OR "memories"[tiab]'
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
        name: "S20280",
        buttons: true,
        id: "S20280",
        translations: {
          dk: "Smerte",
          en: "Pain",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Pain"[majr]'
          ],
          normal: [
            '"Pain"[mh] OR "pain"[ti] OR "painful"[ti]'
          ],
          broad: [
            '"Pain"[mh] OR "pain"[tiab] OR "painful"[tiab]'
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
        name: "S20290",
        buttons: true,
        id: "S20290",
        translations: {
          dk: "Udfordrende adfærd",
          en: "Challenging behavior",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Problem Behavior"[majr] OR "Behavioral Symptoms"[majr]'
          ],
          normal: [
            '"Problem Behavior"[mh] OR "Behavioral Symptoms"[mh] OR "challenging behavior"[ti] OR "challenging behaviour"[ti] OR "behavioral challenges"[ti] OR "behavioural challenges"[ti]'
          ],
          broad: [
            '"Problem Behavior"[mh] OR "Behavioral Symptoms"[mh] OR "challenging behavior"[tiab] OR "challenging behaviour"[tiab] OR "behavioral challenges"[tiab] OR "behavioural challenges"[tiab]'
          ]
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
        name: "S20300",
        buttons: true,
        id: "S20300",
        translations: {
          dk: "Livskvalitet",
          en: "Quality of life",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Quality of Life"[majr]'
          ],
          normal: [
            '"Quality of Life"[mh] OR "quality of life"[ti] OR "life quality"[ti]'
          ],
          broad: [
            '"Quality of Life"[mh] OR "quality of life"[tiab] OR "life quality"[tiab]'
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
        name: "S20310",
        buttons: true,
        id: "S20310",
        translations: {
          dk: "Rastløshed",
          en: "Restlessness",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Psychomotor Agitation"[majr]'
          ],
          normal: [
            '"Psychomotor Agitation"[mh] OR "restlessness"[ti] OR "restless"[ti]'
          ],
          broad: [
            '"Psychomotor Agitation"[mh] OR "restlessness"[tiab] OR "restless"[tiab]'
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
        name: "S20320",
        buttons: true,
        id: "S20320",
        translations: {
          dk: "Semantisk hukommelse",
          en: "Semantic memory",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Semantics"[majr]'
          ],
          normal: [
            '"Semantics"[mh] OR "semantic memory"[ti]'
          ],
          broad: [
            '"Semantics"[mh] OR "semantic memory"[tiab]'
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
        name: "S20330",
        buttons: true,
        id: "S20330",
        translations: {
          dk: "Sanser",
          en: "Senses",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Sensation"[majr]'
          ],
          normal: [
            '"Sensation"[mh] OR "senses"[ti] OR "sensory"[ti]'
          ],
          broad: [
            '"Sensation"[mh] OR "senses"[tiab] OR "sensory"[tiab]'
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
        name: "S20340",
        buttons: true,
        id: "S20340",
        translations: {
          dk: "Rumlig orientering",
          en: "Spatial orientation",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Spatial Navigation"[majr] OR "Spatial Processing"[majr]'
          ],
          normal: [
            '"Spatial Navigation"[mh] OR "Spatial Processing"[mh] OR "spatial orientation"[ti] OR "spatial navigation"[ti]'
          ],
          broad: [
            '"Spatial Navigation"[mh] OR "Spatial Processing"[mh] OR "spatial orientation"[tiab] OR "spatial navigation"[tiab]'
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
        name: "S20350",
        buttons: true,
        id: "S20350",
        translations: {
          dk: "Solnedgangsyndrom",
          en: "Sundowning",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Sundowning Syndrome"[majr]'
          ],
          normal: [
            '"Sundowning Syndrome"[mh] OR "sundowning"[ti] OR "sundown syndrome"[ti]'
          ],
          broad: [
            '"Sundowning Syndrome"[mh] OR "sundowning"[tiab] OR "sundown syndrome"[tiab]'
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
        name: "S20360",
        buttons: true,
        id: "S20360",
        translations: {
          dk: "Synsforstyrrelser",
          en: "Visual disturbances",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Vision Disorders"[majr]'
          ],
          normal: [
            '"Vision Disorders"[mh] OR "visual disturbance"[ti] OR "visual disturbances"[ti] OR "vision disorder"[ti]'
          ],
          broad: [
            '"Vision Disorders"[mh] OR "visual disturbance"[tiab] OR "visual disturbances"[tiab] OR "vision disorder"[tiab]'
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
        name: "S20370",
        buttons: true,
        id: "S20370",
        translations: {
          dk: "Advarselstegn",
          en: "Warning signs",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Early Diagnosis"[majr]'
          ],
          normal: [
            '"Early Diagnosis"[mh] OR "warning sign"[ti] OR "warning signs"[ti] OR "early sign"[ti] OR "early signs"[ti]'
          ],
          broad: [
            '"Early Diagnosis"[mh] OR "warning sign"[tiab] OR "warning signs"[tiab] OR "early sign"[tiab] OR "early signs"[tiab]'
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
      }
    ],
  },
  {
    groupname: "Risk factors and prevention",
    id: "S30",
    translations: {
      dk: "Risikofaktorer og forebyggelse",
      en: "Risk factors and prevention",
    },
    ordering: {
      dk: 3,
      en: 3
    },
    groups: [
      {
        name: "S30010",
        buttons: true,
        id: "S30010",
        translations: {
          dk: "Genetik",
          en: "Genetics",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Genetics"[majr] OR "Genetic Predisposition to Disease"[majr]'
          ],
          normal: [
            '"Genetics"[mh] OR "Genetic Predisposition to Disease"[mh] OR "genetic"[ti] OR "genetics"[ti] OR "hereditary"[ti]'
          ],
          broad: [
            '"Genetics"[mh] OR "Genetic Predisposition to Disease"[mh] OR "genetic"[tiab] OR "genetics"[tiab] OR "hereditary"[tiab]'
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
        name: "S30020",
        buttons: true,
        id: "S30020",
        translations: {
          dk: "Diabetes",
          en: "Diabetes",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus"[mh] OR "diabetes"[ti] OR "diabetic"[ti]'
          ],
          broad: [
            '"Diabetes Mellitus"[mh] OR "diabetes"[tiab] OR "diabetic"[tiab]'
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
        name: "S30030",
        buttons: true,
        id: "S30030",
        translations: {
          dk: "Antioxidanter",
          en: "Antioxidants",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Antioxidants"[majr]'
          ],
          normal: [
            '"Antioxidants"[mh] OR "antioxidant"[ti] OR "antioxidants"[ti]'
          ],
          broad: [
            '"Antioxidants"[mh] OR "antioxidant"[tiab] OR "antioxidants"[tiab]'
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
        name: "S30040",
        buttons: true,
        id: "S30040",
        translations: {
          dk: "Benzodiazepiner",
          en: "Benzodiazepines",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Benzodiazepines"[majr]'
          ],
          normal: [
            '"Benzodiazepines"[mh] OR "benzodiazepine"[ti] OR "benzodiazepines"[ti]'
          ],
          broad: [
            '"Benzodiazepines"[mh] OR "benzodiazepine"[tiab] OR "benzodiazepines"[tiab]'
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
        name: "S30050",
        buttons: true,
        id: "S30050",
        translations: {
          dk: "Antikolinergika",
          en: "Anticholinergics",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cholinergic Antagonists"[majr]'
          ],
          normal: [
            '"Cholinergic Antagonists"[mh] OR "anticholinergic*"[ti] OR "anti-cholinergic*"[ti]'
          ],
          broad: [
            '"Cholinergic Antagonists"[mh] OR "anticholinergic*"[tiab] OR "anti-cholinergic*"[tiab]'
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
        name: "S30060",
        buttons: true,
        id: "S30060",
        translations: {
          dk: "Kolesterol",
          en: "Cholesterol",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cholesterol"[majr]'
          ],
          normal: [
            '"Cholesterol"[mh] OR "cholesterol"[ti] OR "hypercholesterolemia"[ti]'
          ],
          broad: [
            '"Cholesterol"[mh] OR "cholesterol"[tiab] OR "hypercholesterolemia"[tiab]'
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
        name: "S30070",
        buttons: true,
        id: "S30070",
        translations: {
          dk: "Komorbiditet",
          en: "Comorbidity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Comorbidity"[majr]'
          ],
          normal: [
            '"Comorbidity"[mh] OR "comorbidity"[ti] OR "comorbidities"[ti] OR "co-morbidity"[ti]'
          ],
          broad: [
            '"Comorbidity"[mh] OR "comorbidity"[tiab] OR "comorbidities"[tiab] OR "co-morbidity"[tiab]'
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
        name: "S30080",
        buttons: true,
        id: "S30080",
        translations: {
          dk: "Motion",
          en: "Exercise",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Exercise"[majr] OR "Physical Activity"[majr]'
          ],
          normal: [
            '"Exercise"[mh] OR "Physical Activity"[mh] OR "exercise"[ti] OR "physical activity"[ti] OR "physical activities"[ti]'
          ],
          broad: [
            '"Exercise"[mh] OR "Physical Activity"[mh] OR "exercise"[tiab] OR "physical activity"[tiab] OR "physical activities"[tiab]'
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
        name: "S30090",
        buttons: true,
        id: "S30090",
        translations: {
          dk: "Uddannelse",
          en: "Education",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Education"[majr]'
          ],
          normal: [
            '"Education"[mh] OR "education"[ti] OR "educational"[ti]'
          ],
          broad: [
            '"Education"[mh] OR "education"[tiab] OR "educational"[tiab]'
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
        name: "S30100",
        buttons: true,
        id: "S30100",
        translations: {
          dk: "Fedt",
          en: "Fats",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dietary Fats"[majr]'
          ],
          normal: [
            '"Dietary Fats"[mh] OR "fat"[ti] OR "fats"[ti] OR "fatty"[ti]'
          ],
          broad: [
            '"Dietary Fats"[mh] OR "fat"[tiab] OR "fats"[tiab] OR "fatty"[tiab]'
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
        name: "S30110",
        buttons: true,
        id: "S30110",
        translations: {
          dk: "Fedtsyrer",
          en: "Fatty acids",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Fatty Acids"[majr]'
          ],
          normal: [
            '"Fatty Acids"[mh] OR "fatty acid"[ti] OR "fatty acids"[ti]'
          ],
          broad: [
            '"Fatty Acids"[mh] OR "fatty acid"[tiab] OR "fatty acids"[tiab]'
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
        name: "S30120",
        buttons: true,
        id: "S30120",
        translations: {
          dk: "Hovedtraume",
          en: "Head trauma",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Craniocerebral Trauma"[majr]'
          ],
          normal: [
            '"Craniocerebral Trauma"[mh] OR "head trauma"[ti] OR "head injury"[ti] OR "head injuries"[ti]'
          ],
          broad: [
            '"Craniocerebral Trauma"[mh] OR "head trauma"[tiab] OR "head injury"[tiab] OR "head injuries"[tiab]'
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
        name: "S30130",
        buttons: true,
        id: "S30130",
        translations: {
          dk: "Hørelse",
          en: "Hearing",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hearing"[majr]'
          ],
          normal: [
            '"Hearing"[mh] OR "hearing"[ti] OR "auditory"[ti]'
          ],
          broad: [
            '"Hearing"[mh] OR "hearing"[tiab] OR "auditory"[tiab]'
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
        name: "S30140",
        buttons: true,
        id: "S30140",
        translations: {
          dk: "Alkohol",
          en: "Alcohol",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Alcohol Drinking"[majr] OR "Alcoholism"[majr]'
          ],
          normal: [
            '"Alcohol Drinking"[mh] OR "Alcoholism"[mh] OR "alcohol"[ti] OR "alcoholic"[ti]'
          ],
          broad: [
            '"Alcohol Drinking"[mh] OR "Alcoholism"[mh] OR "alcohol"[tiab] OR "alcoholic"[tiab]'
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
        name: "S30150",
        buttons: true,
        id: "S30150",
        translations: {
          dk: "Svær overvægt",
          en: "Obesity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Obesity"[majr]'
          ],
          normal: [
            '"Obesity"[mh] OR "obesity"[ti] OR "overweight"[ti] OR "body mass index"[ti]'
          ],
          broad: [
            '"Obesity"[mh] OR "obesity"[tiab] OR "overweight"[tiab] OR "body mass index"[tiab]'
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
        name: "S30160",
        buttons: true,
        id: "S30160",
        translations: {
          dk: "Social aktivitet",
          en: "Social activity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Social Participation"[majr] OR "Social Behavior"[majr]'
          ],
          normal: [
            '"Social Participation"[mh] OR "Social Behavior"[mh] OR "social activity"[ti] OR "social activities"[ti] OR "social participation"[ti]'
          ],
          broad: [
            '"Social Participation"[mh] OR "Social Behavior"[mh] OR "social activity"[tiab] OR "social activities"[tiab] OR "social participation"[tiab]'
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
        name: "S30170",
        buttons: true,
        id: "S30170",
        translations: {
          dk: "Kost",
          en: "Diet",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diet"[majr] OR "Diet Therapy"[majr]'
          ],
          normal: [
            '"Diet"[mh] OR "Diet Therapy"[mh] OR "diet"[ti] OR "dietary"[ti]'
          ],
          broad: [
            '"Diet"[mh] OR "Diet Therapy"[mh] OR "diet"[tiab] OR "dietary"[tiab]'
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
        name: "S30180",
        buttons: true,
        id: "S30180",
        translations: {
          dk: "Stress",
          en: "Stress",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Stress, Psychological"[majr]'
          ],
          normal: [
            '"Stress, Psychological"[mh] OR "stress"[ti] OR "stressful"[ti]'
          ],
          broad: [
            '"Stress, Psychological"[mh] OR "stress"[tiab] OR "stressful"[tiab]'
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
        name: "S30190",
        buttons: true,
        id: "S30190",
        translations: {
          dk: "Vitaminer",
          en: "Vitamins",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Vitamins"[majr]'
          ],
          normal: [
            '"Vitamins"[mh] OR "vitamin"[ti] OR "vitamins"[ti]'
          ],
          broad: [
            '"Vitamins"[mh] OR "vitamin"[tiab] OR "vitamins"[tiab]'
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
        name: "S30200",
        buttons: true,
        id: "S30200",
        translations: {
          dk: "Livsstil",
          en: "Lifestyle",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Life Style"[majr]'
          ],
          normal: [
            '"Life Style"[mh] OR "lifestyle"[ti] OR "life style"[ti]'
          ],
          broad: [
            '"Life Style"[mh] OR "lifestyle"[tiab] OR "life style"[tiab]'
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
        name: "S30210",
        buttons: true,
        id: "S30210",
        translations: {
          dk: "Rygning",
          en: "Smoking",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Smoking"[majr] OR "Tobacco Smoking"[majr]'
          ],
          normal: [
            '"Smoking"[mh] OR "Tobacco Smoking"[mh] OR "smoking"[ti] OR "smoker"[ti] OR "smokers"[ti]'
          ],
          broad: [
            '"Smoking"[mh] OR "Tobacco Smoking"[mh] OR "smoking"[tiab] OR "smoker"[tiab] OR "smokers"[tiab]'
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
        name: "S30220",
        buttons: true,
        id: "S30220",
        translations: {
          dk: "Kognitiv reserve",
          en: "Cognitive reserve",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cognitive Reserve"[majr]'
          ],
          normal: [
            '"Cognitive Reserve"[mh] OR "cognitive reserve"[ti] OR "brain reserve"[ti]'
          ],
          broad: [
            '"Cognitive Reserve"[mh] OR "cognitive reserve"[tiab] OR "brain reserve"[tiab]'
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
        name: "S30230",
        buttons: true,
        id: "S30230",
        translations: {
          dk: "Miljø",
          en: "Environment",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Environment"[majr] OR "Environmental Exposure"[majr]'
          ],
          normal: [
            '"Environment"[mh] OR "Environmental Exposure"[mh] OR "environment"[ti] OR "environmental"[ti]'
          ],
          broad: [
            '"Environment"[mh] OR "Environmental Exposure"[mh] OR "environment"[tiab] OR "environmental"[tiab]'
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
        name: "S30240",
        buttons: true,
        id: "S30240",
        translations: {
          dk: "Luftforurening",
          en: "Air pollution",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Air Pollution"[majr]'
          ],
          normal: [
            '"Air Pollution"[mh] OR "air pollution"[ti] OR "air pollutant"[ti] OR "air pollutants"[ti]'
          ],
          broad: [
            '"Air Pollution"[mh] OR "air pollution"[tiab] OR "air pollutant"[tiab] OR "air pollutants"[tiab]'
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
        name: "S30250",
        buttons: true,
        id: "S30250",
        translations: {
          dk: "Hypertension",
          en: "Hypertension",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hypertension"[majr]'
          ],
          normal: [
            '"Hypertension"[mh] OR "hypertension"[ti] OR "high blood pressure"[ti]'
          ],
          broad: [
            '"Hypertension"[mh] OR "hypertension"[tiab] OR "high blood pressure"[tiab]'
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
        name: "S30290",
        buttons: true,
        id: "S30290",
        translations: {
          dk: "Høretab",
          en: "Hearing loss",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hearing Loss"[majr]'
          ],
          normal: [
            '"Hearing Loss"[mh] OR "hearing loss"[ti] OR "hearing impairment"[ti]'
          ],
          broad: [
            '"Hearing Loss"[mh] OR "hearing loss"[tiab] OR "hearing impairment"[tiab]'
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
        name: "S30300",
        buttons: true,
        id: "S30300",
        translations: {
          dk: "Hormonbehandling",
          en: "Hormone therapy",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hormone Replacement Therapy"[majr]'
          ],
          normal: [
            '"Hormone Replacement Therapy"[mh] OR "hormone therapy"[ti] OR "hormone replacement"[ti]'
          ],
          broad: [
            '"Hormone Replacement Therapy"[mh] OR "hormone therapy"[tiab] OR "hormone replacement"[tiab]'
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
        name: "S30310",
        buttons: true,
        id: "S30310",
        translations: {
          dk: "Infektion",
          en: "Infection",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Infection"[majr]'
          ],
          normal: [
            '"Infection"[mh] OR "infection"[ti] OR "infections"[ti]'
          ],
          broad: [
            '"Infection"[mh] OR "infection"[tiab] OR "infections"[tiab]'
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
        name: "S30320",
        buttons: true,
        id: "S30320",
        translations: {
          dk: "Fritidsaktivitet",
          en: "Leisure activity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Leisure Activities"[majr]'
          ],
          normal: [
            '"Leisure Activities"[mh] OR "leisure activity"[ti] OR "leisure activities"[ti]'
          ],
          broad: [
            '"Leisure Activities"[mh] OR "leisure activity"[tiab] OR "leisure activities"[tiab]'
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
        name: "S30330",
        buttons: true,
        id: "S30330",
        translations: {
          dk: "Middelhavsdiæt",
          en: "Mediterranean diet",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diet, Mediterranean"[majr]'
          ],
          normal: [
            '"Diet, Mediterranean"[mh] OR "mediterranean diet"[ti]'
          ],
          broad: [
            '"Diet, Mediterranean"[mh] OR "mediterranean diet"[tiab]'
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
        name: "S30340",
        buttons: true,
        id: "S30340",
        translations: {
          dk: "Multimorbiditet",
          en: "Multimorbidity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Multimorbidity"[majr]'
          ],
          normal: [
            '"Multimorbidity"[mh] OR "multimorbidity"[ti] OR "multi-morbidity"[ti]'
          ],
          broad: [
            '"Multimorbidity"[mh] OR "multimorbidity"[tiab] OR "multi-morbidity"[tiab]'
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
        name: "S30350",
        buttons: true,
        id: "S30350",
        translations: {
          dk: "Ernæring",
          en: "Nutrition",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Nutrition Therapy"[majr] OR "Nutritional Status"[majr]'
          ],
          normal: [
            '"Nutrition Therapy"[mh] OR "Nutritional Status"[mh] OR "nutrition"[ti] OR "nutritional"[ti]'
          ],
          broad: [
            '"Nutrition Therapy"[mh] OR "Nutritional Status"[mh] OR "nutrition"[tiab] OR "nutritional"[tiab]'
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
        name: "S30360",
        buttons: true,
        id: "S30360",
        translations: {
          dk: "Overvægt",
          en: "Overweight",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Overweight"[majr]'
          ],
          normal: [
            '"Overweight"[mh] OR "overweight"[ti] OR "over weight"[ti]'
          ],
          broad: [
            '"Overweight"[mh] OR "overweight"[tiab] OR "over weight"[tiab]'
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
        name: "S30370",
        buttons: true,
        id: "S30370",
        translations: {
          dk: "Fysisk aktivitet",
          en: "Physical activity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Physical Activity"[majr]'
          ],
          normal: [
            '"Physical Activity"[mh] OR "physical activity"[ti] OR "physical activities"[ti]'
          ],
          broad: [
            '"Physical Activity"[mh] OR "physical activity"[tiab] OR "physical activities"[tiab]'
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
        name: "S30380",
        buttons: true,
        id: "S30380",
        translations: {
          dk: "Profession",
          en: "Profession",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Occupations"[majr]'
          ],
          normal: [
            '"Occupations"[mh] OR "profession"[ti] OR "professions"[ti] OR "occupation"[ti] OR "occupations"[ti]'
          ],
          broad: [
            '"Occupations"[mh] OR "profession"[tiab] OR "professions"[tiab] OR "occupation"[tiab] OR "occupations"[tiab]'
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
        name: "S30390",
        buttons: true,
        id: "S30390",
        translations: {
          dk: "PTSD",
          en: "PTSD",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Stress Disorders, Post-Traumatic"[majr]'
          ],
          normal: [
            '"Stress Disorders, Post-Traumatic"[mh] OR "PTSD"[ti] OR "post-traumatic stress disorder"[ti]'
          ],
          broad: [
            '"Stress Disorders, Post-Traumatic"[mh] OR "PTSD"[tiab] OR "post-traumatic stress disorder"[tiab]'
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
        name: "S30400",
        buttons: true,
        id: "S30400",
        translations: {
          dk: "Skolegang",
          en: "Schooling",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Schools"[majr] OR "Educational Status"[majr]'
          ],
          normal: [
            '"Schools"[mh] OR "Educational Status"[mh] OR "schooling"[ti] OR "school education"[ti]'
          ],
          broad: [
            '"Schools"[mh] OR "Educational Status"[mh] OR "schooling"[tiab] OR "school education"[tiab]'
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
        name: "S30410",
        buttons: true,
        id: "S30410",
        translations: {
          dk: "Søvn",
          en: "Sleep",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Sleep"[majr] OR "Sleep Wake Disorders"[majr]'
          ],
          normal: [
            '"Sleep"[mh] OR "Sleep Wake Disorders"[mh] OR "sleep"[ti] OR "sleeping"[ti]'
          ],
          broad: [
            '"Sleep"[mh] OR "Sleep Wake Disorders"[mh] OR "sleep"[tiab] OR "sleeping"[tiab]'
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
        name: "S30420",
        buttons: true,
        id: "S30420",
        translations: {
          dk: "Tobak",
          en: "Tobacco",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Tobacco"[majr] OR "Tobacco Use"[majr]'
          ],
          normal: [
            '"Tobacco"[mh] OR "Tobacco Use"[mh] OR "tobacco"[ti] OR "smoking"[ti]'
          ],
          broad: [
            '"Tobacco"[mh] OR "Tobacco Use"[mh] OR "tobacco"[tiab] OR "smoking"[tiab]'
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
        name: "S30430",
        buttons: true,
        id: "S30430",
        translations: {
          dk: "Traumatisk hjerneskade",
          en: "Traumatic brain injury",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Brain Injuries, Traumatic"[majr]'
          ],
          normal: [
            '"Brain Injuries, Traumatic"[mh] OR "traumatic brain injury"[ti] OR "TBI"[ti]'
          ],
          broad: [
            '"Brain Injuries, Traumatic"[mh] OR "traumatic brain injury"[tiab] OR "TBI"[tiab]'
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
  },
  {
    groupname: "Epidemiology",
    id: "S40",
    translations: {
      dk: "Epidemiologi",
      en: "Epidemiology",
    },
    ordering: {
      dk: 4,
      en: 4
    },
    groups: [
      {
        name: "S40010",
        buttons: true,
        id: "S40010",
        translations: {
          dk: "Dødsårsag",
          en: "Cause of death",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cause of Death"[majr]'
          ],
          normal: [
            '"Cause of Death"[mh] OR "cause of death"[ti] OR "death cause"[ti] OR "mortality cause"[ti]'
          ],
          broad: [
            '"Cause of Death"[mh] OR "cause of death"[tiab] OR "death cause"[tiab] OR "mortality cause"[tiab]'
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
        name: "S40020",
        buttons: true,
        id: "S40020",
        translations: {
          dk: "Sygdomsomkostninger",
          en: "Cost of illness",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cost of Illness"[majr]'
          ],
          normal: [
            '"Cost of Illness"[mh] OR "cost of illness"[ti] OR "illness cost"[ti] OR "disease burden"[ti] OR "economic burden"[ti]'
          ],
          broad: [
            '"Cost of Illness"[mh] OR "cost of illness"[tiab] OR "illness cost"[tiab] OR "disease burden"[tiab] OR "economic burden"[tiab]'
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
        name: "S40030",
        buttons: true,
        id: "S40030",
        translations: {
          dk: "Sundhedsøkonomi",
          en: "Health economics",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Economics, Medical"[majr] OR "Health Care Costs"[majr]'
          ],
          normal: [
            '"Economics, Medical"[mh] OR "Health Care Costs"[mh] OR "health economics"[ti] OR "healthcare costs"[ti] OR "medical costs"[ti]'
          ],
          broad: [
            '"Economics, Medical"[mh] OR "Health Care Costs"[mh] OR "health economics"[tiab] OR "healthcare costs"[tiab] OR "medical costs"[tiab]'
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
        name: "S40040",
        buttons: true,
        id: "S40040",
        translations: {
          dk: "Incidens",
          en: "Incidence",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Incidence"[majr]'
          ],
          normal: [
            '"Incidence"[mh] OR "incidence"[ti] OR "new cases"[ti] OR "incident cases"[ti]'
          ],
          broad: [
            '"Incidence"[mh] OR "incidence"[tiab] OR "new cases"[tiab] OR "incident cases"[tiab]'
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
        name: "S40050",
        buttons: true,
        id: "S40050",
        translations: {
          dk: "Morbiditet",
          en: "Morbidity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Morbidity"[majr]'
          ],
          normal: [
            '"Morbidity"[mh] OR "morbidity"[ti] OR "disease rate"[ti] OR "illness rate"[ti]'
          ],
          broad: [
            '"Morbidity"[mh] OR "morbidity"[tiab] OR "disease rate"[tiab] OR "illness rate"[tiab]'
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
        name: "S40060",
        buttons: true,
        id: "S40060",
        translations: {
          dk: "Mortalitet",
          en: "Mortality",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Mortality"[majr]'
          ],
          normal: [
            '"Mortality"[mh] OR "mortality"[ti] OR "death rate"[ti] OR "death rates"[ti]'
          ],
          broad: [
            '"Mortality"[mh] OR "mortality"[tiab] OR "death rate"[tiab] OR "death rates"[tiab]'
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
        name: "S40070",
        buttons: true,
        id: "S40070",
        translations: {
          dk: "Prævalens",
          en: "Prevalence",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Prevalence"[majr]'
          ],
          normal: [
            '"Prevalence"[mh] OR "prevalence"[ti] OR "occurrence"[ti]'
          ],
          broad: [
            '"Prevalence"[mh] OR "prevalence"[tiab] OR "occurrence"[tiab]'
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
        name: "S40130",
        buttons: true,
        id: "S40130",
        translations: {
          dk: "Statistik",
          en: "Statistics",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Statistics as Topic"[majr] OR "Biostatistics"[majr]'
          ],
          normal: [
            '"Statistics as Topic"[mh] OR "Biostatistics"[mh] OR "statistics"[ti] OR "statistical"[ti]'
          ],
          broad: [
            '"Statistics as Topic"[mh] OR "Biostatistics"[mh] OR "statistics"[tiab] OR "statistical"[tiab]'
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
  },
  {
    groupname: "Diagnosis",
    id: "S50",
    translations: {
      dk: "Diagnostik",
      en: "Diagnosis",
    },
    ordering: {
      dk: 5,
      en: 5
    },
    groups: [
      {
        name: "S50020",
        buttons: true,
        id: "S50020",
        translations: {
          dk: "Blodprøver",
          en: "Blood tests",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Blood Chemical Analysis"[majr] OR "Clinical Laboratory Techniques"[majr]'
          ],
          normal: [
            '"Blood Chemical Analysis"[mh] OR "Clinical Laboratory Techniques"[mh] OR "blood test"[ti] OR "blood tests"[ti]'
          ],
          broad: [
            '"Blood Chemical Analysis"[mh] OR "Clinical Laboratory Techniques"[mh] OR "blood test"[tiab] OR "blood tests"[tiab]'
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
        name: "S50030",
        buttons: true,
        id: "S50030",
        translations: {
          dk: "CT-scanning / CAT-scanning",
          en: "CT scan / CAT scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Tomography, X-Ray Computed"[majr]'
          ],
          normal: [
            '"Tomography, X-Ray Computed"[mh] OR "CT scan"[ti] OR "computed tomography"[ti]'
          ],
          broad: [
            '"Tomography, X-Ray Computed"[mh] OR "CT scan"[tiab] OR "computed tomography"[tiab]'
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
        name: "S50040",
        buttons: true,
        id: "S50040",
        translations: {
          dk: "Diagnostiske kriterier",
          en: "Diagnostic criteria",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diagnostic Criteria"[majr]'
          ],
          normal: [
            '"Diagnostic Criteria"[mh] OR "diagnostic criteria"[ti] OR "diagnosis criteria"[ti]'
          ],
          broad: [
            '"Diagnostic Criteria"[mh] OR "diagnostic criteria"[tiab] OR "diagnosis criteria"[tiab]'
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
        name: "S50060",
        buttons: true,
        id: "S50060",
        translations: {
          dk: "EEG",
          en: "EEG",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Electroencephalography"[majr]'
          ],
          normal: [
            '"Electroencephalography"[mh] OR "EEG"[ti] OR "electroencephalogram"[ti] OR "electroencephalography"[ti]'
          ],
          broad: [
            '"Electroencephalography"[mh] OR "EEG"[tiab] OR "electroencephalogram"[tiab] OR "electroencephalography"[tiab]'
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
        name: "S50090",
        buttons: true,
        id: "S50090",
        translations: {
          dk: "Lumbalpunktur",
          en: "Lumbar puncture",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Spinal Puncture"[majr]'
          ],
          normal: [
            '"Spinal Puncture"[mh] OR "lumbar puncture"[ti] OR "spinal tap"[ti]'
          ],
          broad: [
            '"Spinal Puncture"[mh] OR "lumbar puncture"[tiab] OR "spinal tap"[tiab]'
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
        name: "S50100",
        buttons: true,
        id: "S50100",
        translations: {
          dk: "MRI-scanning",
          en: "MRI scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Magnetic Resonance Imaging"[majr]'
          ],
          normal: [
            '"Magnetic Resonance Imaging"[mh] OR "MRI"[ti] OR "magnetic resonance imaging"[ti]'
          ],
          broad: [
            '"Magnetic Resonance Imaging"[mh] OR "MRI"[tiab] OR "magnetic resonance imaging"[tiab]'
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
        name: "S50110",
        buttons: true,
        id: "S50110",
        translations: {
          dk: "Neuropsykologisk vurdering / neuropsykologisk test",
          en: "Neuropsychological assessment / neuropsychological testing",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Neuropsychological Tests"[majr]'
          ],
          normal: [
            '"Neuropsychological Tests"[mh] OR "neuropsychological test"[ti] OR "neuropsychological tests"[ti] OR "neuropsychological testing"[ti]'
          ],
          broad: [
            '"Neuropsychological Tests"[mh] OR "neuropsychological test"[tiab] OR "neuropsychological tests"[tiab] OR "neuropsychological testing"[tiab]'
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
        name: "S50120",
        buttons: true,
        id: "S50120",
        translations: {
          dk: "PET-scanning",
          en: "PET scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Positron-Emission Tomography"[majr]'
          ],
          normal: [
            '"Positron-Emission Tomography"[mh] OR "PET"[ti] OR "positron emission tomography"[ti]'
          ],
          broad: [
            '"Positron-Emission Tomography"[mh] OR "PET"[tiab] OR "positron emission tomography"[tiab]'
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
        name: "S50130",
        buttons: true,
        id: "S50130",
        translations: {
          dk: "Screening",
          en: "Screening",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Mass Screening"[majr]'
          ],
          normal: [
            '"Mass Screening"[mh] OR "screening"[ti] OR "screen"[ti]'
          ],
          broad: [
            '"Mass Screening"[mh] OR "screening"[tiab] OR "screen"[tiab]'
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
        name: "S50140",
        buttons: true,
        id: "S50140",
        translations: {
          dk: "SPECT-scanning",
          en: "SPECT scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Tomography, Emission-Computed, Single-Photon"[majr]'
          ],
          normal: [
            '"Tomography, Emission-Computed, Single-Photon"[mh] OR "SPECT"[ti] OR "single photon emission computed tomography"[ti]'
          ],
          broad: [
            '"Tomography, Emission-Computed, Single-Photon"[mh] OR "SPECT"[tiab] OR "single photon emission computed tomography"[tiab]'
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
        name: "S50150",
        buttons: true,
        id: "S50150",
        translations: {
          dk: "Dagligdagsaktiviteter / ADL / IADL",
          en: "Activities of daily living / ADL / IADL",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Activities of Daily Living"[majr]'
          ],
          normal: [
            '"Activities of Daily Living"[mh] OR "activities of daily living"[ti] OR "ADL"[ti] OR "IADL"[ti] OR "instrumental activities of daily living"[ti]'
          ],
          broad: [
            '"Activities of Daily Living"[mh] OR "activities of daily living"[tiab] OR "ADL"[tiab] OR "IADL"[tiab] OR "instrumental activities of daily living"[tiab]'
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
        name: "S50160",
        buttons: true,
        id: "S50160",
        translations: {
          dk: "Amyloid scanning",
          en: "Amyloid scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Amyloid beta-Peptides/diagnostic imaging"[majr] OR "Positron-Emission Tomography"[majr:noexp]'
          ],
          normal: [
            '"Amyloid beta-Peptides/diagnostic imaging"[mh] OR "Positron-Emission Tomography"[mh:noexp] OR "amyloid scan"[ti] OR "amyloid imaging"[ti] OR "amyloid PET"[ti]'
          ],
          broad: [
            '"Amyloid beta-Peptides/diagnostic imaging"[mh] OR "Positron-Emission Tomography"[mh:noexp] OR "amyloid scan"[tiab] OR "amyloid imaging"[tiab] OR "amyloid PET"[tiab]'
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
        name: "S50170",
        buttons: true,
        id: "S50170",
        translations: {
          dk: "Anamnese",
          en: "Anamnesis",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Medical History Taking"[majr]'
          ],
          normal: [
            '"Medical History Taking"[mh] OR "anamnesis"[ti] OR "patient history"[ti] OR "medical history taking"[ti]'
          ],
          broad: [
            '"Medical History Taking"[mh] OR "anamnesis"[tiab] OR "patient history"[tiab] OR "medical history taking"[tiab]'
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
        name: "S50180",
        buttons: true,
        id: "S50180",
        translations: {
          dk: "Hjernebilleddannelse",
          en: "Brain imaging",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Neuroimaging"[majr] OR "Brain/diagnostic imaging"[majr]'
          ],
          normal: [
            '"Neuroimaging"[mh] OR "Brain/diagnostic imaging"[mh] OR "brain imaging"[ti] OR "neuroimaging"[ti] OR "brain scan"[ti]'
          ],
          broad: [
            '"Neuroimaging"[mh] OR "Brain/diagnostic imaging"[mh] OR "brain imaging"[tiab] OR "neuroimaging"[tiab] OR "brain scan"[tiab]'
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
        name: "S50190",
        buttons: true,
        id: "S50190",
        translations: {
          dk: "Hjernescanning",
          en: "Brain scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Brain/diagnostic imaging"[majr]'
          ],
          normal: [
            '"Brain/diagnostic imaging"[mh] OR "brain scan"[ti] OR "brain scanning"[ti] OR "brain scans"[ti]'
          ],
          broad: [
            '"Brain/diagnostic imaging"[mh] OR "brain scan"[tiab] OR "brain scanning"[tiab] OR "brain scans"[tiab]'
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
        name: "S50200",
        buttons: true,
        id: "S50200",
        translations: {
          dk: "DAT-scanning",
          en: "DAT scan",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dopamine Plasma Membrane Transport Proteins/diagnostic imaging"[majr] OR "Tomography, Emission-Computed, Single-Photon"[majr]'
          ],
          normal: [
            '"Dopamine Plasma Membrane Transport Proteins/diagnostic imaging"[mh] OR "Tomography, Emission-Computed, Single-Photon"[mh] OR "DAT scan"[ti] OR "dopamine transporter imaging"[ti]'
          ],
          broad: [
            '"Dopamine Plasma Membrane Transport Proteins/diagnostic imaging"[mh] OR "Tomography, Emission-Computed, Single-Photon"[mh] OR "DAT scan"[tiab] OR "dopamine transporter imaging"[tiab]'
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
        name: "S50210",
        buttons: true,
        id: "S50210",
        translations: {
          dk: "Diagnostisk udredning",
          en: "Diagnostic work-up",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diagnosis"[majr:noexp] OR "Diagnostic Techniques and Procedures"[majr]'
          ],
          normal: [
            '"Diagnosis"[mh:noexp] OR "Diagnostic Techniques and Procedures"[mh] OR "diagnostic work-up"[ti] OR "diagnostic workup"[ti] OR "diagnostic evaluation"[ti]'
          ],
          broad: [
            '"Diagnosis"[mh:noexp] OR "Diagnostic Techniques and Procedures"[mh] OR "diagnostic work-up"[tiab] OR "diagnostic workup"[tiab] OR "diagnostic evaluation"[tiab]'
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
        name: "S50220",
        buttons: true,
        id: "S50220",
        translations: {
          dk: "Geriatrisk",
          en: "Geriatric",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Geriatric Assessment"[majr] OR "Geriatrics"[majr]'
          ],
          normal: [
            '"Geriatric Assessment"[mh] OR "Geriatrics"[mh] OR "geriatric"[ti] OR "geriatrics"[ti] OR "geriatric assessment"[ti]'
          ],
          broad: [
            '"Geriatric Assessment"[mh] OR "Geriatrics"[mh] OR "geriatric"[tiab] OR "geriatrics"[tiab] OR "geriatric assessment"[tiab]'
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
        name: "S50230",
        buttons: true,
        id: "S50230",
        translations: {
          dk: "Laboratorietest",
          en: "Laboratory tests",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Clinical Laboratory Techniques"[majr] OR "Diagnostic Tests, Routine"[majr]'
          ],
          normal: [
            '"Clinical Laboratory Techniques"[mh] OR "Diagnostic Tests, Routine"[mh] OR "laboratory test"[ti] OR "laboratory tests"[ti] OR "laboratory testing"[ti]'
          ],
          broad: [
            '"Clinical Laboratory Techniques"[mh] OR "Diagnostic Tests, Routine"[mh] OR "laboratory test"[tiab] OR "laboratory tests"[tiab] OR "laboratory testing"[tiab]'
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
        name: "S50240",
        buttons: true,
        id: "S50240",
        translations: {
          dk: "Sygehistorie",
          en: "Medical history",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Medical History Taking"[majr]'
          ],
          normal: [
            '"Medical History Taking"[mh] OR "medical history"[ti] OR "patient history"[ti] OR "case history"[ti]'
          ],
          broad: [
            '"Medical History Taking"[mh] OR "medical history"[tiab] OR "patient history"[tiab] OR "case history"[tiab]'
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
        name: "S50250",
        buttons: true,
        id: "S50250",
        translations: {
          dk: "Screeningsinstrument",
          en: "Screening instrument",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Psychometrics"[majr] OR "Psychiatric Status Rating Scales"[majr] OR "Psychological Tests"[majr]'
          ],
          normal: [
            '"Psychometrics"[mh] OR "Psychiatric Status Rating Scales"[mh] OR "Psychological Tests"[mh] OR "screening tool"[ti] OR "screening instrument"[ti] OR "screening tools"[ti] OR "screening instruments"[ti]'
          ],
          broad: [
            '"Psychometrics"[mh] OR "Psychiatric Status Rating Scales"[mh] OR "Psychological Tests"[mh] OR "screening tool"[tiab] OR "screening instrument"[tiab] OR "screening tools"[tiab] OR "screening instruments"[tiab]'
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
        name: "S50260",
        buttons: true,
        id: "S50260",
        translations: {
          dk: "Spinalvæske",
          en: "Spinal fluid",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cerebrospinal Fluid"[majr]'
          ],
          normal: [
            '"Cerebrospinal Fluid"[mh] OR "spinal fluid"[ti] OR "cerebrospinal fluid"[ti] OR "CSF"[ti]'
          ],
          broad: [
            '"Cerebrospinal Fluid"[mh] OR "spinal fluid"[tiab] OR "cerebrospinal fluid"[tiab] OR "CSF"[tiab]'
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
        name: "S50270",
        buttons: true,
        id: "S50270",
        translations: {
          dk: "Testnormer",
          en: "Test norms",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Reference Values"[majr] OR "Psychometrics/standards"[majr]'
          ],
          normal: [
            '"Reference Values"[mh] OR "Psychometrics/standards"[mh] OR "test norms"[ti] OR "normative data"[ti] OR "reference values"[ti]'
          ],
          broad: [
            '"Reference Values"[mh] OR "Psychometrics/standards"[mh] OR "test norms"[tiab] OR "normative data"[tiab] OR "reference values"[tiab]'
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
  },
  {
    groupname: "Intervention",
    id: "S60",
    translations: {
      dk: "Intervention",
      en: "Intervention",
    },
    ordering: {
      dk: 6,
      en: 6
    },
    groups: [
      {
        name: "S60010",
        buttons: true,
        id: "S60010",
        translations: {
          dk: "Bivirkninger",
          en: "Adverse effects",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Adverse Effects"[majr] OR "Drug-Related Side Effects and Adverse Reactions"[majr]'
          ],
          normal: [
            '"Adverse Effects"[mh] OR "Drug-Related Side Effects and Adverse Reactions"[mh] OR "adverse effect"[ti] OR "adverse effects"[ti] OR "side effect"[ti] OR "side effects"[ti]'
          ],
          broad: [
            '"Adverse Effects"[mh] OR "Drug-Related Side Effects and Adverse Reactions"[mh] OR "adverse effect"[tiab] OR "adverse effects"[tiab] OR "side effect"[tiab] OR "side effects"[tiab]'
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
        name: "S60020",
        buttons: true,
        id: "S60020",
        translations: {
          dk: "Smertestillende medicin",
          en: "Analgesics",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Analgesics"[majr]'
          ],
          normal: [
            '"Analgesics"[mh] OR "analgesic"[ti] OR "analgesics"[ti] OR "pain medication"[ti] OR "pain killer"[ti] OR "pain killers"[ti]'
          ],
          broad: [
            '"Analgesics"[mh] OR "analgesic"[tiab] OR "analgesics"[tiab] OR "pain medication"[tiab] OR "pain killer"[tiab] OR "pain killers"[tiab]'
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
        name: "S60030",
        buttons: true,
        id: "S60030",
        translations: {
          dk: "Antidepressiv medicin",
          en: "Antidepressant",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Antidepressive Agents"[majr]'
          ],
          normal: [
            '"Antidepressive Agents"[mh] OR "antidepressant"[ti] OR "antidepressants"[ti] OR "antidepressive"[ti] OR "antidepressives"[ti]'
          ],
          broad: [
            '"Antidepressive Agents"[mh] OR "antidepressant"[tiab] OR "antidepressants"[tiab] OR "antidepressive"[tiab] OR "antidepressives"[tiab]'
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
        name: "S60040",
        buttons: true,
        id: "S60040",
        translations: {
          dk: "Antipsykotisk medicin",
          en: "Antipsychotic",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Antipsychotic Agents"[majr]'
          ],
          normal: [
            '"Antipsychotic Agents"[mh] OR "antipsychotic"[ti] OR "antipsychotics"[ti] OR "neuroleptic"[ti] OR "neuroleptics"[ti]'
          ],
          broad: [
            '"Antipsychotic Agents"[mh] OR "antipsychotic"[tiab] OR "antipsychotics"[tiab] OR "neuroleptic"[tiab] OR "neuroleptics"[tiab]'
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
        name: "S60050",
        buttons: true,
        id: "S60050",
        translations: {
          dk: "Angstdæmpende medicin",
          en: "Anxiolytic",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Anti-Anxiety Agents"[majr]'
          ],
          normal: [
            '"Anti-Anxiety Agents"[mh] OR "anxiolytic"[ti] OR "anxiolytics"[ti] OR "anti-anxiety"[ti]'
          ],
          broad: [
            '"Anti-Anxiety Agents"[mh] OR "anxiolytic"[tiab] OR "anxiolytics"[tiab] OR "anti-anxiety"[tiab]'
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
        name: "S60060",
        buttons: true,
        id: "S60060",
        translations: {
          dk: "Liggesår",
          en: "Bedsore",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Pressure Ulcer"[majr]'
          ],
          normal: [
            '"Pressure Ulcer"[mh] OR "bedsore"[ti] OR "bedsores"[ti] OR "pressure ulcer"[ti] OR "pressure ulcers"[ti] OR "pressure sore"[ti] OR "pressure sores"[ti]'
          ],
          broad: [
            '"Pressure Ulcer"[mh] OR "bedsore"[tiab] OR "bedsores"[tiab] OR "pressure ulcer"[tiab] OR "pressure ulcers"[tiab] OR "pressure sore"[tiab] OR "pressure sores"[tiab]'
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
        name: "S60070",
        buttons: true,
        id: "S60070",
        translations: {
          dk: "Pleje",
          en: "Care",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Patient Care"[majr] OR "Nursing Care"[majr]'
          ],
          normal: [
            '"Patient Care"[mh] OR "Nursing Care"[mh] OR "care"[ti] OR "caring"[ti]'
          ],
          broad: [
            '"Patient Care"[mh] OR "Nursing Care"[mh] OR "care"[tiab] OR "caring"[tiab]'
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
        name: "S60080",
        buttons: true,
        id: "S60080",
        translations: {
          dk: "Omsorgsgiver",
          en: "Caregiver",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Caregivers"[majr]'
          ],
          normal: [
            '"Caregivers"[mh] OR "caregiver"[ti] OR "caregivers"[ti] OR "carer"[ti] OR "carers"[ti]'
          ],
          broad: [
            '"Caregivers"[mh] OR "caregiver"[tiab] OR "caregivers"[tiab] OR "carer"[tiab] OR "carers"[tiab]'
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
        name: "S60090",
        buttons: true,
        id: "S60090",
        translations: {
          dk: "Omsorgsgiverbyrde",
          en: "Caregiver burden",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Caregiver Burden"[majr] OR "Stress, Psychological"[majr]'
          ],
          normal: [
            '"Caregiver Burden"[mh] OR "Stress, Psychological"[mh] OR "caregiver burden"[ti] OR "carer burden"[ti] OR "caregiver stress"[ti]'
          ],
          broad: [
            '"Caregiver Burden"[mh] OR "Stress, Psychological"[mh] OR "caregiver burden"[tiab] OR "carer burden"[tiab] OR "caregiver stress"[tiab]'
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
        name: "S60100",
        buttons: true,
        id: "S60100",
        translations: {
          dk: "Støtte til omsorgsgiver",
          en: "Caregiver support",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Caregivers/psychology"[majr] OR "Social Support"[majr]'
          ],
          normal: [
            '"Caregivers/psychology"[mh] OR "Social Support"[mh] OR "caregiver support"[ti] OR "carer support"[ti]'
          ],
          broad: [
            '"Caregivers/psychology"[mh] OR "Social Support"[mh] OR "caregiver support"[tiab] OR "carer support"[tiab]'
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
        name: "S60110",
        buttons: true,
        id: "S60110",
        translations: {
          dk: "Kolinesterasehæmmer",
          en: "Cholinesterase inhibitor",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cholinesterase Inhibitors"[majr]'
          ],
          normal: [
            '"Cholinesterase Inhibitors"[mh] OR "cholinesterase inhibitor"[ti] OR "cholinesterase inhibitors"[ti] OR "acetylcholinesterase inhibitor"[ti]'
          ],
          broad: [
            '"Cholinesterase Inhibitors"[mh] OR "cholinesterase inhibitor"[tiab] OR "cholinesterase inhibitors"[tiab] OR "acetylcholinesterase inhibitor"[tiab]'
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
        name: "S60120",
        buttons: true,
        id: "S60120",
        translations: {
          dk: "Kognitiv rehabilitering",
          en: "Cognitive rehabilitation",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cognitive Remediation"[majr] OR "Rehabilitation"[majr]'
          ],
          normal: [
            '"Cognitive Remediation"[mh] OR "Rehabilitation"[mh] OR "cognitive rehabilitation"[ti] OR "cognitive remediation"[ti]'
          ],
          broad: [
            '"Cognitive Remediation"[mh] OR "Rehabilitation"[mh] OR "cognitive rehabilitation"[tiab] OR "cognitive remediation"[tiab]'
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
        name: "S60130",
        buttons: true,
        id: "S60130",
        translations: {
          dk: "Kognitiv stimulationsterapi / CST",
          en: "Cognitive stimulation therapy / CST",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cognitive Therapy"[majr] OR "Cognitive Remediation"[majr]'
          ],
          normal: [
            '"Cognitive Therapy"[mh] OR "Cognitive Remediation"[mh] OR "cognitive stimulation therapy"[ti] OR "CST"[ti]'
          ],
          broad: [
            '"Cognitive Therapy"[mh] OR "Cognitive Remediation"[mh] OR "cognitive stimulation therapy"[tiab] OR "CST"[tiab]'
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
        name: "S60140",
        buttons: true,
        id: "S60140",
        translations: {
          dk: "Kognitiv træning",
          en: "Cognitive training",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cognitive Therapy"[majr] OR "Mental Processes"[majr]'
          ],
          normal: [
            '"Cognitive Therapy"[mh] OR "Mental Processes"[mh] OR "cognitive training"[ti] OR "cognitive exercise"[ti]'
          ],
          broad: [
            '"Cognitive Therapy"[mh] OR "Mental Processes"[mh] OR "cognitive training"[tiab] OR "cognitive exercise"[tiab]'
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
        name: "S60150",
        buttons: true,
        id: "S60150",
        translations: {
          dk: "Kommunikation",
          en: "Communication",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Communication"[majr] OR "Communication Barriers"[majr]'
          ],
          normal: [
            '"Communication"[mh] OR "Communication Barriers"[mh] OR "communication"[ti] OR "communicating"[ti]'
          ],
          broad: [
            '"Communication"[mh] OR "Communication Barriers"[mh] OR "communication"[tiab] OR "communicating"[tiab]'
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
        name: "S60160",
        buttons: true,
        id: "S60160",
        translations: {
          dk: "Komorbiditet",
          en: "Comorbidity",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Comorbidity"[majr]'
          ],
          normal: [
            '"Comorbidity"[mh] OR "comorbidity"[ti] OR "co-morbidity"[ti] OR "comorbidities"[ti] OR "co-morbidities"[ti]'
          ],
          broad: [
            '"Comorbidity"[mh] OR "comorbidity"[tiab] OR "co-morbidity"[tiab] OR "comorbidities"[tiab] OR "co-morbidities"[tiab]'
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
        name: "S60170",
        buttons: true,
        id: "S60170",
        translations: {
          dk: "Forstoppelse",
          en: "Constipation",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Constipation"[majr]'
          ],
          normal: [
            '"Constipation"[mh] OR "constipation"[ti] OR "constipated"[ti]'
          ],
          broad: [
            '"Constipation"[mh] OR "constipation"[tiab] OR "constipated"[tiab]'
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
        name: "S60180",
        buttons: true,
        id: "S60180",
        translations: {
          dk: "Tværkulturel",
          en: "Cross-cultural",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cross-Cultural Comparison"[majr] OR "Cultural Competency"[majr]'
          ],
          normal: [
            '"Cross-Cultural Comparison"[mh] OR "Cultural Competency"[mh] OR "cross-cultural"[ti] OR "cross cultural"[ti] OR "transcultural"[ti]'
          ],
          broad: [
            '"Cross-Cultural Comparison"[mh] OR "Cultural Competency"[mh] OR "cross-cultural"[tiab] OR "cross cultural"[tiab] OR "transcultural"[tiab]'
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
        name: "S60190",
        buttons: true,
        id: "S60190",
        translations: {
          dk: "Demens care mapping",
          en: "Dementia care mapping",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Quality Assurance, Health Care/methods"[majr] AND "Dementia/nursing"[majr]'
          ],
          normal: [
            '"Quality Assurance, Health Care/methods"[mh] AND "Dementia/nursing"[mh] OR "dementia care mapping"[ti] OR "DCM"[ti]'
          ],
          broad: [
            '"Quality Assurance, Health Care/methods"[mh] AND "Dementia/nursing"[mh] OR "dementia care mapping"[tiab] OR "DCM"[tiab]'
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
        name: "S60200",
        buttons: true,
        id: "S60200",
        translations: {
          dk: "Demenspræparater",
          en: "Dementia drugs",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dementia/drug therapy"[majr] OR "Anti-Dementia Agents"[majr]'
          ],
          normal: [
            '"Dementia/drug therapy"[mh] OR "Anti-Dementia Agents"[mh] OR "dementia drug"[ti] OR "dementia drugs"[ti] OR "anti-dementia drug"[ti] OR "anti-dementia drugs"[ti]'
          ],
          broad: [
            '"Dementia/drug therapy"[mh] OR "Anti-Dementia Agents"[mh] OR "dementia drug"[tiab] OR "dementia drugs"[tiab] OR "anti-dementia drug"[tiab] OR "anti-dementia drugs"[tiab]'
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
        name: "S60210",
        buttons: true,
        id: "S60210",
        translations: {
          dk: "Demensvenlig",
          en: "Dementia friendly",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Environment Design"[majr] AND "Dementia"[majr]'
          ],
          normal: [
            '"Environment Design"[mh] AND "Dementia"[mh] OR "dementia friendly"[ti] OR "dementia-friendly"[ti]'
          ],
          broad: [
            '"Environment Design"[mh] AND "Dementia"[mh] OR "dementia friendly"[tiab] OR "dementia-friendly"[tiab]'
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
        name: "S60220",
        buttons: true,
        id: "S60220",
        translations: {
          dk: "Demensmedicin",
          en: "Dementia medication",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dementia/drug therapy"[majr] OR "Anti-Dementia Agents"[majr]'
          ],
          normal: [
            '"Dementia/drug therapy"[mh] OR "Anti-Dementia Agents"[mh] OR "dementia medication"[ti] OR "anti-dementia medication"[ti] OR "dementia medicine"[ti]'
          ],
          broad: [
            '"Dementia/drug therapy"[mh] OR "Anti-Dementia Agents"[mh] OR "dementia medication"[tiab] OR "anti-dementia medication"[tiab] OR "dementia medicine"[tiab]'
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
        name: "S60230",
        buttons: true,
        id: "S60230",
        translations: {
          dk: "Tandpleje",
          en: "Dental care",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dental Care"[majr] OR "Oral Health"[majr]'
          ],
          normal: [
            '"Dental Care"[mh] OR "Oral Health"[mh] OR "dental care"[ti] OR "oral care"[ti] OR "dental health"[ti]'
          ],
          broad: [
            '"Dental Care"[mh] OR "Oral Health"[mh] OR "dental care"[tiab] OR "oral care"[tiab] OR "dental health"[tiab]'
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
        name: "S60240",
        buttons: true,
        id: "S60240",
        translations: {
          dk: "Seponering af medicin",
          en: "Discontinuation of medication",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Withholding Treatment"[majr] OR "Drug Therapy/methods"[majr:noexp]'
          ],
          normal: [
            '"Withholding Treatment"[mh] OR "Drug Therapy/methods"[mh:noexp] OR "medication discontinuation"[ti] OR "drug discontinuation"[ti] OR "stopping medication"[ti]'
          ],
          broad: [
            '"Withholding Treatment"[mh] OR "Drug Therapy/methods"[mh:noexp] OR "medication discontinuation"[tiab] OR "drug discontinuation"[tiab] OR "stopping medication"[tiab]'
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
        name: "S60250",
        buttons: true,
        id: "S60250",
        translations: {
          dk: "Lægemidler",
          en: "Drugs",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Drug Therapy"[majr] OR "Pharmaceutical Preparations"[majr]'
          ],
          normal: [
            '"Drug Therapy"[mh] OR "Pharmaceutical Preparations"[mh] OR "drug"[ti] OR "drugs"[ti] OR "medication"[ti] OR "medications"[ti]'
          ],
          broad: [
            '"Drug Therapy"[mh] OR "Pharmaceutical Preparations"[mh] OR "drug"[tiab] OR "drugs"[tiab] OR "medication"[tiab] OR "medications"[tiab]'
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
        name: "S60260",
        buttons: true,
        id: "S60260",
        translations: {
          dk: "Etnisk minoritet",
          en: "Ethnic minority",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Minority Groups"[majr] OR "Ethnic Groups"[majr]'
          ],
          normal: [
            '"Minority Groups"[mh] OR "Ethnic Groups"[mh] OR "ethnic minority"[ti] OR "ethnic minorities"[ti] OR "minority group"[ti] OR "minority groups"[ti]'
          ],
          broad: [
            '"Minority Groups"[mh] OR "Ethnic Groups"[mh] OR "ethnic minority"[tiab] OR "ethnic minorities"[tiab] OR "minority group"[tiab] OR "minority groups"[tiab]'
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
        name: "S60270",
        buttons: true,
        id: "S60270",
        translations: {
          dk: "Fald",
          en: "Fall",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Accidental Falls"[majr]'
          ],
          normal: [
            '"Accidental Falls"[mh] OR "fall"[ti] OR "falls"[ti] OR "falling"[ti]'
          ],
          broad: [
            '"Accidental Falls"[mh] OR "fall"[tiab] OR "falls"[tiab] OR "falling"[tiab]'
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
        name: "S60280",
        buttons: true,
        id: "S60280",
        translations: {
          dk: "Faldforebyggelse",
          en: "Fall prevention",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Accidental Falls/prevention and control"[majr]'
          ],
          normal: [
            '"Accidental Falls/prevention and control"[mh] OR "fall prevention"[ti] OR "falls prevention"[ti] OR "preventing falls"[ti]'
          ],
          broad: [
            '"Accidental Falls/prevention and control"[mh] OR "fall prevention"[tiab] OR "falls prevention"[tiab] OR "preventing falls"[tiab]'
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
        name: "S60290",
        buttons: true,
        id: "S60290",
        translations: {
          dk: "Arvelig",
          en: "Hereditary",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Heredity"[majr] OR "Genetic Predisposition to Disease"[majr]'
          ],
          normal: [
            '"Heredity"[mh] OR "Genetic Predisposition to Disease"[mh] OR "hereditary"[ti] OR "inherited"[ti] OR "genetic"[ti]'
          ],
          broad: [
            '"Heredity"[mh] OR "Genetic Predisposition to Disease"[mh] OR "hereditary"[tiab] OR "inherited"[tiab] OR "genetic"[tiab]'
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
        name: "S60300",
        buttons: true,
        id: "S60300",
        translations: {
          dk: "Inkontinens",
          en: "Incontinence",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Urinary Incontinence"[majr] OR "Fecal Incontinence"[majr]'
          ],
          normal: [
            '"Urinary Incontinence"[mh] OR "Fecal Incontinence"[mh] OR "incontinence"[ti] OR "incontinent"[ti]'
          ],
          broad: [
            '"Urinary Incontinence"[mh] OR "Fecal Incontinence"[mh] OR "incontinence"[tiab] OR "incontinent"[tiab]'
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
        name: "S60310",
        buttons: true,
        id: "S60310",
        translations: {
          dk: "Uformel omsorgsgiver",
          en: "Informal caregiver",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Caregivers"[majr] OR "Family"[majr]'
          ],
          normal: [
            '"Caregivers"[mh] OR "Family"[mh] OR "informal caregiver"[ti] OR "informal caregivers"[ti] OR "family caregiver"[ti] OR "family caregivers"[ti]'
          ],
          broad: [
            '"Caregivers"[mh] OR "Family"[mh] OR "informal caregiver"[tiab] OR "informal caregivers"[tiab] OR "family caregiver"[tiab] OR "family caregivers"[tiab]'
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
        name: "S60320",
        buttons: true,
        id: "S60320",
        translations: {
          dk: "Marte Meo",
          en: "Marte Meo",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Communication"[majr] AND "Professional-Patient Relations"[majr]'
          ],
          normal: [
            '"Communication"[mh] AND "Professional-Patient Relations"[mh] OR "marte meo"[ti]'
          ],
          broad: [
            '"Communication"[mh] AND "Professional-Patient Relations"[mh] OR "marte meo"[tiab]'
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
        name: "S60330",
        buttons: true,
        id: "S60330",
        translations: {
          dk: "Medicin",
          en: "Medication",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Drug Therapy"[majr] OR "Pharmaceutical Preparations"[majr]'
          ],
          normal: [
            '"Drug Therapy"[mh] OR "Pharmaceutical Preparations"[mh] OR "medication"[ti] OR "medications"[ti] OR "medicine"[ti] OR "medicines"[ti]'
          ],
          broad: [
            '"Drug Therapy"[mh] OR "Pharmaceutical Preparations"[mh] OR "medication"[tiab] OR "medications"[tiab] OR "medicine"[tiab] OR "medicines"[tiab]'
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
        name: "S60340",
        buttons: true,
        id: "S60340",
        translations: {
          dk: "Memantin",
          en: "Memantine",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Memantine"[majr]'
          ],
          normal: [
            '"Memantine"[mh] OR "memantine"[ti] OR "namenda"[ti]'
          ],
          broad: [
            '"Memantine"[mh] OR "memantine"[tiab] OR "namenda"[tiab]'
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
        name: "S60350",
        buttons: true,
        id: "S60350",
        translations: {
          dk: "Multikulturel",
          en: "Multicultural",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Cultural Diversity"[majr] OR "Cultural Competency"[majr]'
          ],
          normal: [
            '"Cultural Diversity"[mh] OR "Cultural Competency"[mh] OR "multicultural"[ti] OR "multi-cultural"[ti] OR "culturally diverse"[ti]'
          ],
          broad: [
            '"Cultural Diversity"[mh] OR "Cultural Competency"[mh] OR "multicultural"[tiab] OR "multi-cultural"[tiab] OR "culturally diverse"[tiab]'
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
        name: "S60360",
        buttons: true,
        id: "S60360",
        translations: {
          dk: "Musikterapi",
          en: "Music therapy",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Music Therapy"[majr]'
          ],
          normal: [
            '"Music Therapy"[mh] OR "music therapy"[ti] OR "music intervention"[ti] OR "musical therapy"[ti]'
          ],
          broad: [
            '"Music Therapy"[mh] OR "music therapy"[tiab] OR "music intervention"[tiab] OR "musical therapy"[tiab]'
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
        name: "S60370",
        buttons: true,
        id: "S60370",
        translations: {
          dk: "Neuropsykiatri",
          en: "Neuropsychiatry",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Neuropsychiatry"[majr] OR "Behavioral Neurology"[majr]'
          ],
          normal: [
            '"Neuropsychiatry"[mh] OR "Behavioral Neurology"[mh] OR "neuropsychiatry"[ti] OR "neuropsychiatric"[ti] OR "behavioral neurology"[ti]'
          ],
          broad: [
            '"Neuropsychiatry"[mh] OR "Behavioral Neurology"[mh] OR "neuropsychiatry"[tiab] OR "neuropsychiatric"[tiab] OR "behavioral neurology"[tiab]'
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
        name: "S60380",
        buttons: true,
        id: "S60380",
        translations: {
          dk: "Ikke-farmakologisk intervention",
          en: "Non-pharmacological intervention",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Therapeutics"[majr] NOT "Drug Therapy"[majr]'
          ],
          normal: [
            '"Therapeutics"[mh] NOT "Drug Therapy"[mh] OR "non-pharmacological"[ti] OR "nonpharmacological"[ti] OR "non pharmacological"[ti]'
          ],
          broad: [
            '"Therapeutics"[mh] NOT "Drug Therapy"[mh] OR "non-pharmacological"[tiab] OR "nonpharmacological"[tiab] OR "non pharmacological"[tiab]'
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
        name: "S60390",
        buttons: true,
        id: "S60390",
        translations: {
          dk: "Palliation / palliativ",
          en: "Palliation / palliative",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Palliative Care"[majr] OR "Terminal Care"[majr]'
          ],
          normal: [
            '"Palliative Care"[mh] OR "Terminal Care"[mh] OR "palliation"[ti] OR "palliative"[ti] OR "end of life care"[ti]'
          ],
          broad: [
            '"Palliative Care"[mh] OR "Terminal Care"[mh] OR "palliation"[tiab] OR "palliative"[tiab] OR "end of life care"[tiab]'
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
        name: "S60400",
        buttons: true,
        id: "S60400",
        translations: {
          dk: "Personcentreret",
          en: "Person-centered",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Patient-Centered Care"[majr]'
          ],
          normal: [
            '"Patient-Centered Care"[mh] OR "person-centered"[ti] OR "person centered"[ti] OR "patient-centered"[ti] OR "patient centered"[ti]'
          ],
          broad: [
            '"Patient-Centered Care"[mh] OR "person-centered"[tiab] OR "person centered"[tiab] OR "patient-centered"[tiab] OR "patient centered"[tiab]'
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
        name: "S60410",
        buttons: true,
        id: "S60410",
        translations: {
          dk: "Farmakologisk intervention",
          en: "Pharmacological intervention",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Drug Therapy"[majr] OR "Pharmaceutical Preparations/therapeutic use"[majr]'
          ],
          normal: [
            '"Drug Therapy"[mh] OR "Pharmaceutical Preparations/therapeutic use"[mh] OR "pharmacological"[ti] OR "drug therapy"[ti] OR "medication therapy"[ti]'
          ],
          broad: [
            '"Drug Therapy"[mh] OR "Pharmaceutical Preparations/therapeutic use"[mh] OR "pharmacological"[tiab] OR "drug therapy"[tiab] OR "medication therapy"[tiab]'
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
        name: "S60420",
        buttons: true,
        id: "S60420",
        translations: {
          dk: "Fysisk træning",
          en: "Physical exercise",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Exercise"[majr] OR "Physical Therapy Modalities"[majr]'
          ],
          normal: [
            '"Exercise"[mh] OR "Physical Therapy Modalities"[mh] OR "physical exercise"[ti] OR "physical activity"[ti] OR "exercise"[ti] OR "physical training"[ti]'
          ],
          broad: [
            '"Exercise"[mh] OR "Physical Therapy Modalities"[mh] OR "physical exercise"[tiab] OR "physical activity"[tiab] OR "exercise"[tiab] OR "physical training"[tiab]'
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
        name: "S60430",
        buttons: true,
        id: "S60430",
        translations: {
          dk: "Tryksår",
          en: "Pressure sores",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Pressure Ulcer"[majr]'
          ],
          normal: [
            '"Pressure Ulcer"[mh] OR "pressure sore"[ti] OR "pressure sores"[ti] OR "pressure ulcer"[ti] OR "pressure ulcers"[ti] OR "bedsore"[ti] OR "bedsores"[ti]'
          ],
          broad: [
            '"Pressure Ulcer"[mh] OR "pressure sore"[tiab] OR "pressure sores"[tiab] OR "pressure ulcer"[tiab] OR "pressure ulcers"[tiab] OR "bedsore"[tiab] OR "bedsores"[tiab]'
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
        name: "S60440",
        buttons: true,
        id: "S60440",
        translations: {
          dk: "Psykiatri",
          en: "Psychiatry",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Psychiatry"[majr] OR "Mental Disorders"[majr]'
          ],
          normal: [
            '"Psychiatry"[mh] OR "Mental Disorders"[mh] OR "psychiatry"[ti] OR "psychiatric"[ti] OR "mental health"[ti]'
          ],
          broad: [
            '"Psychiatry"[mh] OR "Mental Disorders"[mh] OR "psychiatry"[tiab] OR "psychiatric"[tiab] OR "mental health"[tiab]'
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
        name: "S60450",
        buttons: true,
        id: "S60450",
        translations: {
          dk: "Psykosocial",
          en: "Psychosocial",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Psychology, Social"[majr] OR "Psychosocial Support Systems"[majr]'
          ],
          normal: [
            '"Psychology, Social"[mh] OR "Psychosocial Support Systems"[mh] OR "psychosocial"[ti] OR "psycho-social"[ti]'
          ],
          broad: [
            '"Psychology, Social"[mh] OR "Psychosocial Support Systems"[mh] OR "psychosocial"[tiab] OR "psycho-social"[tiab]'
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
        name: "S60460",
        buttons: true,
        id: "S60460",
        translations: {
          dk: "Livskvalitet",
          en: "Quality of life",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Quality of Life"[majr]'
          ],
          normal: [
            '"Quality of Life"[mh] OR "quality of life"[ti] OR "life quality"[ti] OR "QoL"[ti]'
          ],
          broad: [
            '"Quality of Life"[mh] OR "quality of life"[tiab] OR "life quality"[tiab] OR "QoL"[tiab]'
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
        name: "S60470",
        buttons: true,
        id: "S60470",
        translations: {
          dk: "Rehabilitering",
          en: "Rehabilitation",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Rehabilitation"[majr] OR "Cognitive Remediation"[majr]'
          ],
          normal: [
            '"Rehabilitation"[mh] OR "Cognitive Remediation"[mh] OR "rehabilitation"[ti] OR "rehabilitative"[ti] OR "rehab"[ti]'
          ],
          broad: [
            '"Rehabilitation"[mh] OR "Cognitive Remediation"[mh] OR "rehabilitation"[tiab] OR "rehabilitative"[tiab] OR "rehab"[tiab]'
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
        name: "S60480",
        buttons: true,
        id: "S60480",
        translations: {
          dk: "Reminiscens",
          en: "Reminiscence",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Reminiscence Therapy"[majr] OR "Memory"[majr]'
          ],
          normal: [
            '"Reminiscence Therapy"[mh] OR "Memory"[mh] OR "reminiscence"[ti] OR "reminiscence therapy"[ti] OR "life review"[ti]'
          ],
          broad: [
            '"Reminiscence Therapy"[mh] OR "Memory"[mh] OR "reminiscence"[tiab] OR "reminiscence therapy"[tiab] OR "life review"[tiab]'
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
        name: "S60490",
        buttons: true,
        id: "S60490",
        translations: {
          dk: "Aflastning",
          en: "Respite care",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Respite Care"[majr]'
          ],
          normal: [
            '"Respite Care"[mh] OR "respite care"[ti] OR "respite service"[ti] OR "respite services"[ti] OR "relief care"[ti]'
          ],
          broad: [
            '"Respite Care"[mh] OR "respite care"[tiab] OR "respite service"[tiab] OR "respite services"[tiab] OR "relief care"[tiab]'
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
        name: "S60500",
        buttons: true,
        id: "S60500",
        translations: {
          dk: "Sansestimulation",
          en: "Sensory stimulation",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Sensation"[majr] OR "Sensory Stimulation"[majr]'
          ],
          normal: [
            '"Sensation"[mh] OR "Sensory Stimulation"[mh] OR "sensory stimulation"[ti] OR "sensory therapy"[ti] OR "snoezelen"[ti]'
          ],
          broad: [
            '"Sensation"[mh] OR "Sensory Stimulation"[mh] OR "sensory stimulation"[tiab] OR "sensory therapy"[tiab] OR "snoezelen"[tiab]'
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
        name: "S60510",
        buttons: true,
        id: "S60510",
        translations: {
          dk: "Bivirkninger",
          en: "Side effects",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Adverse Effects"[majr] OR "Drug-Related Side Effects and Adverse Reactions"[majr]'
          ],
          normal: [
            '"Adverse Effects"[mh] OR "Drug-Related Side Effects and Adverse Reactions"[mh] OR "side effect"[ti] OR "side effects"[ti] OR "adverse effect"[ti] OR "adverse effects"[ti]'
          ],
          broad: [
            '"Adverse Effects"[mh] OR "Drug-Related Side Effects and Adverse Reactions"[mh] OR "side effect"[tiab] OR "side effects"[tiab] OR "adverse effect"[tiab] OR "adverse effects"[tiab]'
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
        name: "S60520",
        buttons: true,
        id: "S60520",
        translations: {
          dk: "Socialt netværk",
          en: "Social network",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Social Support"[majr] OR "Social Networks"[majr]'
          ],
          normal: [
            '"Social Support"[mh] OR "Social Networks"[mh] OR "social network"[ti] OR "social networks"[ti] OR "social relations"[ti]'
          ],
          broad: [
            '"Social Support"[mh] OR "Social Networks"[mh] OR "social network"[tiab] OR "social networks"[tiab] OR "social relations"[tiab]'
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
        name: "S60530",
        buttons: true,
        id: "S60530",
        translations: {
          dk: "Social støtte",
          en: "Social support",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Social Support"[majr]'
          ],
          normal: [
            '"Social Support"[mh] OR "social support"[ti] OR "social care"[ti] OR "community support"[ti]'
          ],
          broad: [
            '"Social Support"[mh] OR "social support"[tiab] OR "social care"[tiab] OR "community support"[tiab]'
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
        name: "S60540",
        buttons: true,
        id: "S60540",
        translations: {
          dk: "Teknologi",
          en: "Technology",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Technology"[majr] OR "Biomedical Technology"[majr]'
          ],
          normal: [
            '"Technology"[mh] OR "Biomedical Technology"[mh] OR "technology"[ti] OR "technological"[ti] OR "digital"[ti]'
          ],
          broad: [
            '"Technology"[mh] OR "Biomedical Technology"[mh] OR "technology"[tiab] OR "technological"[tiab] OR "digital"[tiab]'
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
        name: "S60550",
        buttons: true,
        id: "S60550",
        translations: {
          dk: "Forflytning",
          en: "Transfer",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Moving and Lifting Patients"[majr] OR "Patient Transfer"[majr]'
          ],
          normal: [
            '"Moving and Lifting Patients"[mh] OR "Patient Transfer"[mh] OR "patient transfer"[ti] OR "patient transfers"[ti] OR "moving patients"[ti]'
          ],
          broad: [
            '"Moving and Lifting Patients"[mh] OR "Patient Transfer"[mh] OR "patient transfer"[tiab] OR "patient transfers"[tiab] OR "moving patients"[tiab]'
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
        name: "S60560",
        buttons: true,
        id: "S60560",
        translations: {
          dk: "Vandladning",
          en: "Urination",
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Urination"[majr] OR "Urination Disorders"[majr]'
          ],
          normal: [
            '"Urination"[mh] OR "Urination Disorders"[mh] OR "urination"[ti] OR "micturition"[ti] OR "urinary"[ti]'
          ],
          broad: [
            '"Urination"[mh] OR "Urination Disorders"[mh] OR "urination"[tiab] OR "micturition"[tiab] OR "urinary"[tiab]'
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
    ]
  },
];
