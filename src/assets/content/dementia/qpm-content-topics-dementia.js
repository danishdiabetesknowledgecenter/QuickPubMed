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
    ordering: { 
      dk: 0, 
      en: 0 
    },
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
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nederste niveau)
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
        name: "S10020",
        buttons: true,
        id: "S10020",
        maintopic: true,
        translations: {
          dk: "Alzheimers sygdom",
          en: "Alzheimer disease",
        },
        ordering: {
          dk: 1,
          en: 1
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
        name: "S10180",
        buttons: true,
        id: "S10180",
        subtopiclevel: 1,
        maintopicIdLevel1: "S10020",
        translations: {
          dk: "Posterior kortikal atrofi",
          en: "Posterior cortical atrophy",
        },
        ordering: {
          dk: 2,
          en: 2
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
        name: "S10030",
        buttons: true,
        id: "S10030",
        translations: {
          dk: "Vaskulær demens/kredsløbsdemens",
          en: "Vascular dementia",
        },
        ordering: {
          dk: 3,
          en: 3
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
        maintopic: true,
        translations: {
          dk: "Frontotemporal demens",
          en: "Frontotemporal dementia",
        },
        ordering: {
          dk: 4,
          en: 4
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S10040",
        translations: {
          dk: "Progressiv ikke-flydende afasi",
          en: "Progressive non-fluent aphasia",
        },
        ordering: {
          dk: 5,
          en: 5
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S10040",
        translations: {
          dk: "Semantisk demens",
          en: "Semantic dementia",
        },
        ordering: {
          dk: 6,
          en: 6
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S10040",
        translations: {
          dk: "Logopenisk afasi",
          en: "Logopenic aphasia",
        },
        ordering: {
          dk: 7,
          en: 7
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
          dk: 8,
          en: 8
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
          dk: 9,
          en: 9
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
        maintopic: true,
        translations: {
          dk: "Atypisk Parkinson",
          en: "Atypical Parkinson's disease",
        },
        ordering: {
          dk: 10,
          en: 10
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S10100",
        translations: {
          dk: "Multipel systematrofi",
          en: "Multiple system atrophy",
        },
        ordering: {
          dk: 11,
          en: 11
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S10100",
        translations: {
          dk: "Progressiv supranukleær parese",
          en: "Progressive supranuclear palsy",
        },
        ordering: {
          dk: 12,
          en: 12
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S10100",
        translations: {
          dk: "Kortikobasal degeneration",
          en: "Corticobasal degeneration",
        },
        ordering: {
          dk: 13,
          en: 13
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
          dk: 14,
          en: 14
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
          dk: 15,
          en: 15
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
          dk: 16,
          en: 16
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
          dk: 17,
          en: 17
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
        name: "S10190",
        buttons: true,
        id: "S10190",
        translations: {
          dk: "Alkoholrelateret demens",
          en: "Alcohol-related dementia",
        },
        ordering: {
          dk: 18,
          en: 18
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
          dk: 19,
          en: 19
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
          dk: "Prionsygdomme",
          en: "Prion diseases",
        },
        ordering: {
          dk: 20,
          en: 20
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
          dk: 21,
          en: 21
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
          dk: 22,
          en: 22
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
        name: "S10250",
        buttons: true,
        id: "S10250",
        translations: {
          dk: "Demensgrad",
          en: "Severity of dementia",
        },
        ordering: {
          dk: 24,
          en: 24
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
      dk: 2,
      en: 2
    },
    groups: [
      {
        name: "S20300",
        buttons: true,
        id: "S20300",
        maintopic: true,
        translations: {
          dk: "Kognitive symptomer",
          en: "Cognitive symptoms",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S20010",
        buttons: true,
        id: "S20010",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Afasi",
          en: "Aphasia",
        },
        ordering: {
          dk: 2,
          en: 2
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Amnesi",
          en: "Amnesia",
        },
        ordering: {
          dk: 3,
          en: 3
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Apraksi",
          en: "Apraxia",
        },
        ordering: {
          dk: 4,
          en: 4
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Anosognosi",
          en: "Anosognosia",
        },
        ordering: {
          dk: 5,
          en: 5
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
        name: "S20310",
        buttons: true,
        id: "S20310",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Indsigt",
          en: "Insight",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Self Concept"[majr] OR "Awareness"[majr]'
          ],
          normal: [
            '"Self Concept"[mh] OR "Awareness"[mh] OR insight[ti] OR "self awareness"[ti]'
          ],
          broad: [
            '"Self Concept"[mh] OR "Awareness"[mh] OR insight[tiab] OR "self awareness"[tiab]'
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
        name: "S20320",
        buttons: true,
        id: "S20320",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Livskvalitet",
          en: "Quality of life",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Quality of Life"[majr]'
          ],
          normal: [
            '"Quality of Life"[mh] OR "quality of life"[ti] OR QoL[ti]'
          ],
          broad: [
            '"Quality of Life"[mh] OR "quality of life"[tiab] OR QoL[tiab]'
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
        name: "S20065",
        buttons: true,
        id: "S20065",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Agnosi",
          en: "Agnosia",
        },
        ordering: {
          dk: 8,
          en: 8
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
        name: "S20330",
        buttons: true,
        id: "S20330",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Hukommelse",
          en: "Memory",
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            '"Memory"[majr]'
          ],
          normal: [
            '"Memory"[mh] OR memory[ti] OR memories[ti]'
          ],
          broad: [
            '"Memory"[mh] OR memory[tiab] OR memories[tiab]'
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
        name: "S20220",
        buttons: true,
        id: "S20220",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Episodisk hukommelse",
          en: "Episodic memory",
        },
        ordering: {
          dk: 10,
          en: 10
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
        name: "S20340",
        buttons: true,
        id: "S20340",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Semantisk hukommelse",
          en: "Semantic memory",
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Memory"[majr] AND "semantic"[ti]'
          ],
          normal: [
            '"Memory"[mh] AND "semantic"[ti] OR "semantic memory"[ti]'
          ],
          broad: [
            '"Memory"[mh] AND "semantic"[tiab] OR "semantic memory"[tiab]'
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
        name: "S20350",
        buttons: true,
        id: "S20350",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Sprog",
          en: "Language",
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            '"Language"[majr]'
          ],
          normal: [
            '"Language"[mh] OR language[ti] OR linguistic[ti]'
          ],
          broad: [
            '"Language"[mh] OR language[tiab] OR linguistic[tiab]'
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
        name: "S20160",
        buttons: true,
        id: "S20160",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Opmærksomhed",
          en: "Attention",
        },
        ordering: {
          dk: 13,
          en: 13
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
        name: "S20360",
        buttons: true,
        id: "S20360",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Visuel",
          en: "Visual",
        },
        ordering: {
          dk: 14,
          en: 14
        },
        searchStrings: {
          narrow: [
            '"Vision"[majr] OR "Visual Perception"[majr]'
          ],
          normal: [
            '"Vision"[mh] OR "Visual Perception"[mh] OR visual[ti] OR vision[ti]'
          ],
          broad: [
            '"Vision"[mh] OR "Visual Perception"[mh] OR visual[tiab] OR vision[tiab]'
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
        name: "S20370",
        buttons: true,
        id: "S20370",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Rumlig",
          en: "Spatial",
        },
        ordering: {
          dk: 15,
          en: 15
        },
        searchStrings: {
          narrow: [
            '"Spatial Processing"[majr] OR "Space Perception"[majr]'
          ],
          normal: [
            '"Spatial Processing"[mh] OR "Space Perception"[mh] OR spatial[ti] OR "space perception"[ti]'
          ],
          broad: [
            '"Spatial Processing"[mh] OR "Space Perception"[mh] OR spatial[tiab] OR "space perception"[tiab]'
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
        name: "S20380",
        buttons: true,
        id: "S20380",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Sanser",
          en: "Senses",
        },
        ordering: {
          dk: 16,
          en: 16
        },
        searchStrings: {
          narrow: [
            '"Sensation"[majr] OR "Sensory Perception"[majr]'
          ],
          normal: [
            '"Sensation"[mh] OR "Sensory Perception"[mh] OR sensation[ti] OR sensory[ti] OR senses[ti]'
          ],
          broad: [
            '"Sensation"[mh] OR "Sensory Perception"[mh] OR sensation[tiab] OR sensory[tiab] OR senses[tiab]'
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
        name: "S20130",
        buttons: true,
        id: "S20130",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Problemløsning",
          en: "Problem solving",
        },
        ordering: {
          dk: 17,
          en: 17
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
        name: "S20390",
        buttons: true,
        id: "S20390",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Overblik",
          en: "Overview",
        },
        ordering: {
          dk: 18,
          en: 18
        },
        searchStrings: {
          narrow: [
            '"Cognition"[majr] AND ("overview"[ti] OR "orientation"[ti])'
          ],
          normal: [
            '"Cognition"[mh] AND ("overview"[ti] OR "orientation"[ti] OR "situational awareness"[ti])'
          ],
          broad: [
            '"Cognition"[mh] AND ("overview"[tiab] OR "orientation"[tiab] OR "situational awareness"[tiab])'
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
        name: "S20400",
        buttons: true,
        id: "S20400",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20300",
        translations: {
          dk: "Eksekutiv funktion",
          en: "Executive function",
        },
        ordering: {
          dk: 19,
          en: 19
        },
        searchStrings: {
          narrow: [
            '"Executive Function"[majr]'
          ],
          normal: [
            '"Executive Function"[mh] OR "executive function"[ti] OR "executive functions"[ti] OR "executive functioning"[ti]'
          ],
          broad: [
            '"Executive Function"[mh] OR "executive function"[tiab] OR "executive functions"[tiab] OR "executive functioning"[tiab]'
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
        name: "S20500",
        buttons: true,
        id: "S20500",
        maintopic: true,
        translations: {
          dk: "Psykiske og adfærdsmæssige symptomer",
          en: "Psychological and behavioral symptoms",
        },
        ordering: {
          dk: 20,
          en: 20
        },
        searchStrings: {
          narrow: [
            '"Behavioral Symptoms"[majr] OR "Mental Disorders"[majr:noexp]'
          ],
          normal: [
            '"Behavioral Symptoms"[mh] OR "Mental Disorders"[mh:noexp] OR "behavioral symptoms"[ti] OR "behavioural symptoms"[ti] OR "psychological symptoms"[ti] OR BPSD[ti]'
          ],
          broad: [
            '"Behavioral Symptoms"[mh] OR "Mental Disorders"[mh:noexp] OR "behavioral symptoms"[tiab] OR "behavioural symptoms"[tiab] OR "psychological symptoms"[tiab] OR BPSD[tiab]'
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
        name: "S20090",
        buttons: true,
        id: "S20090",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Depression",
          en: "Depression",
        },
        ordering: {
          dk: 21,
          en: 21
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
        name: "S20070",
        buttons: true,
        id: "S20070",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Angst",
          en: "Anxiety",
        },
        ordering: {
          dk: 22,
          en: 22
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Apati",
          en: "Apathy",
        },
        ordering: {
          dk: 23,
          en: 23
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
        name: "S20050",
        buttons: true,
        id: "S20050",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Aggression",
          en: "Aggression",
        },
        ordering: {
          dk: 24,
          en: 24
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Agitation",
          en: "Agitation",
        },
        ordering: {
          dk: 25,
          en: 25
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
        name: "S20510",
        buttons: true,
        id: "S20510",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Uro",
          en: "Restlessness",
        },
        ordering: {
          dk: 26,
          en: 26
        },
        searchStrings: {
          narrow: [
            '"Psychomotor Agitation"[majr] OR "Motor Restlessness"[majr]'
          ],
          normal: [
            '"Psychomotor Agitation"[mh] OR "Motor Restlessness"[mh] OR restless*[ti] OR "motor activity"[ti]'
          ],
          broad: [
            '"Psychomotor Agitation"[mh] OR "Motor Restlessness"[mh] OR restless*[tiab] OR "motor activity"[tiab]'
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
        name: "S20140",
        buttons: true,
        id: "S20140",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Vrangforestillinger",
          en: "Delusions",
        },
        ordering: {
          dk: 27,
          en: 27
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
        name: "S20100",
        buttons: true,
        id: "S20100",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Hallucinationer",
          en: "Hallucinations",
        },
        ordering: {
          dk: 28,
          en: 28
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
        name: "S20520",
        buttons: true,
        id: "S20520",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Hæmning",
          en: "Inhibition",
        },
        ordering: {
          dk: 29,
          en: 29
        },
        searchStrings: {
          narrow: [
            '"Inhibition, Psychological"[majr] OR "Behavioral Inhibition"[majr]'
          ],
          normal: [
            '"Inhibition, Psychological"[mh] OR "Behavioral Inhibition"[mh] OR inhibition[ti] OR inhibitory[ti]'
          ],
          broad: [
            '"Inhibition, Psychological"[mh] OR "Behavioral Inhibition"[mh] OR inhibition[tiab] OR inhibitory[tiab]'
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
        name: "S20530",
        buttons: true,
        id: "S20530",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Irritabilitet",
          en: "Irritability",
        },
        ordering: {
          dk: 30,
          en: 30
        },
        searchStrings: {
          narrow: [
            '"Irritable Mood"[majr]'
          ],
          normal: [
            '"Irritable Mood"[mh] OR irritab*[ti]'
          ],
          broad: [
            '"Irritable Mood"[mh] OR irritab*[tiab]'
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
        name: "S20180",
        buttons: true,
        id: "S20180",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Døgnrytme",
          en: "Circadian rhythm",
        },
        ordering: {
          dk: 31,
          en: 31
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
        name: "S20110",
        buttons: true,
        id: "S20110",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Søvnforstyrrelser",
          en: "Sleep disturbance",
        },
        ordering: {
          dk: 32,
          en: 32
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Adfærdsændring",
          en: "Behavioral change",
        },
        ordering: {
          dk: 34,
          en: 34
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
        name: "S20540",
        buttons: true,
        id: "S20540",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Udfordrende adfærd",
          en: "Challenging behavior",
        },
        ordering: {
          dk: 35,
          en: 35
        },
        searchStrings: {
          narrow: [
            '"Behavioral Symptoms"[majr] OR "Problem Behavior"[majr]'
          ],
          normal: [
            '"Behavioral Symptoms"[mh] OR "Problem Behavior"[mh] OR "challenging behavior"[ti] OR "challenging behaviour"[ti] OR "problem behavior"[ti] OR "problem behaviour"[ti]'
          ],
          broad: [
            '"Behavioral Symptoms"[mh] OR "Problem Behavior"[mh] OR "challenging behavior"[tiab] OR "challenging behaviour"[tiab] OR "problem behavior"[tiab] OR "problem behaviour"[tiab]'
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
        name: "S20200",
        buttons: true,
        id: "S20200",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Delirium",
          en: "Delirium",
        },
        ordering: {
          dk: 36,
          en: 36
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
        name: "S20550",
        buttons: true,
        id: "S20550",
        subtopiclevel: 1,
        maintopicIdLevel1: "S20500",
        translations: {
          dk: "Smerter",
          en: "Pain",
        },
        ordering: {
          dk: 37,
          en: 37
        },
        searchStrings: {
          narrow: [
            '"Pain"[majr] OR "Pain Management"[majr]'
          ],
          normal: [
            '"Pain"[mh] OR "Pain Management"[mh] OR pain[ti] OR painful[ti]'
          ],
          broad: [
            '"Pain"[mh] OR "Pain Management"[mh] OR pain[tiab] OR painful[tiab]'
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
      }
    ]
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
        name: "S30100",
        buttons: true,
        id: "S30100",
        maintopic: true,
        translations: {
          dk: "Fysisk helbred",
          en: "Physical health",
        },
        ordering: {
          dk: 1,
          en: 1
        }
      },
      {
        name: "S30110",
        buttons: true,
        id: "S30110",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Diabetes/Sukkersyge",
          en: "Diabetes",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus"[mh] OR diabetes[ti] OR diabetic[ti]'
          ],
          broad: [
            '"Diabetes Mellitus"[mh] OR diabetes[tiab] OR diabetic[tiab]'
          ]
        }
      },
      {
        name: "S30120",
        buttons: true,
        id: "S30120",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Blodtryk/Hypertension",
          en: "Blood pressure/Hypertension",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Hypertension"[majr] OR "Blood Pressure"[majr]'
          ],
          normal: [
            '"Hypertension"[mh] OR "Blood Pressure"[mh] OR hypertension[ti] OR "blood pressure"[ti]'
          ],
          broad: [
            '"Hypertension"[mh] OR "Blood Pressure"[mh] OR hypertension[tiab] OR "blood pressure"[tiab]'
          ]
        }
      },
      {
        name: "S30130",
        buttons: true,
        id: "S30130",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Kolesterol",
          en: "Cholesterol",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Cholesterol"[majr]'
          ],
          normal: [
            '"Cholesterol"[mh] OR cholesterol[ti]'
          ],
          broad: [
            '"Cholesterol"[mh] OR cholesterol[tiab]'
          ]
        }
      },
      {
        name: "S30140",
        buttons: true,
        id: "S30140",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Overvægt/Fedme",
          en: "Overweight/Obesity",
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Obesity"[majr] OR "Overweight"[majr]'
          ],
          normal: [
            '"Obesity"[mh] OR "Overweight"[mh] OR obesity[ti] OR overweight[ti]'
          ],
          broad: [
            '"Obesity"[mh] OR "Overweight"[mh] OR obesity[tiab] OR overweight[tiab]'
          ]
        }
      },
      {
        name: "S30150",
        buttons: true,
        id: "S30150",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Komorbiditet/Multisygdom",
          en: "Comorbidity/Multiple diseases",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Comorbidity"[majr] OR "Multimorbidity"[majr]'
          ],
          normal: [
            '"Comorbidity"[mh] OR "Multimorbidity"[mh] OR comorbidity[ti] OR multimorbidity[ti] OR "multiple diseases"[ti]'
          ],
          broad: [
            '"Comorbidity"[mh] OR "Multimorbidity"[mh] OR comorbidity[tiab] OR multimorbidity[tiab] OR "multiple diseases"[tiab]'
          ]
        }
      },
      {
        name: "S30160",
        buttons: true,
        id: "S30160",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Traumatisk hjerneskade/Hovedtraume",
          en: "Traumatic brain injury/Head trauma",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Brain Injuries, Traumatic"[majr] OR "Craniocerebral Trauma"[majr]'
          ],
          normal: [
            '"Brain Injuries, Traumatic"[mh] OR "Craniocerebral Trauma"[mh] OR "traumatic brain injury"[ti] OR "head trauma"[ti]'
          ],
          broad: [
            '"Brain Injuries, Traumatic"[mh] OR "Craniocerebral Trauma"[mh] OR "traumatic brain injury"[tiab] OR "head trauma"[tiab]'
          ]
        }
      },
      {
        name: "S30170",
        buttons: true,
        id: "S30170",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Høretab/Hørelse",
          en: "Hearing loss/Hearing",
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '"Hearing Loss"[majr] OR "Hearing"[majr]'
          ],
          normal: [
            '"Hearing Loss"[mh] OR "Hearing"[mh] OR "hearing loss"[ti] OR hearing[ti]'
          ],
          broad: [
            '"Hearing Loss"[mh] OR "Hearing"[mh] OR "hearing loss"[tiab] OR hearing[tiab]'
          ]
        }
      },
      {
        name: "S30180",
        buttons: true,
        id: "S30180",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30100",
        translations: {
          dk: "Infektion",
          en: "Infection",
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            '"Infection"[majr]'
          ],
          normal: [
            '"Infection"[mh] OR infection[ti] OR infections[ti]'
          ],
          broad: [
            '"Infection"[mh] OR infection[tiab] OR infections[tiab]'
          ]
        }
      },
      {
        name: "S30200",
        buttons: true,
        id: "S30200",
        maintopic: true,
        translations: {
          dk: "Mentalt helbred",
          en: "Mental health",
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            '"Mental Health"[majr]'
          ],
          normal: [
            '"Mental Health"[mh] OR "mental health"[ti]'
          ],
          broad: [
            '"Mental Health"[mh] OR "mental health"[tiab]'
          ]
        }
      },
      {
        name: "S30210",
        buttons: true,
        id: "S30210",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30200",
        translations: {
          dk: "Stress",
          en: "Stress",
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Stress, Psychological"[majr]'
          ],
          normal: [
            '"Stress, Psychological"[mh] OR stress[ti]'
          ],
          broad: [
            '"Stress, Psychological"[mh] OR stress[tiab]'
          ]
        }
      },
      {
        name: "S30220",
        buttons: true,
        id: "S30220",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30200",
        translations: {
          dk: "PTSD",
          en: "PTSD",
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            '"Stress Disorders, Post-Traumatic"[majr]'
          ],
          normal: [
            '"Stress Disorders, Post-Traumatic"[mh] OR PTSD[ti] OR "post traumatic stress"[ti]'
          ],
          broad: [
            '"Stress Disorders, Post-Traumatic"[mh] OR PTSD[tiab] OR "post traumatic stress"[tiab]'
          ]
        }
      },
      {
        name: "S30230",
        buttons: true,
        id: "S30230",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30200",
        translations: {
          dk: "Kognitiv reserve",
          en: "Cognitive reserve",
        },
        ordering: {
          dk: 13,
          en: 13
        },
        searchStrings: {
          narrow: [
            '"Cognitive Reserve"[majr]'
          ],
          normal: [
            '"Cognitive Reserve"[mh] OR "cognitive reserve"[ti]'
          ],
          broad: [
            '"Cognitive Reserve"[mh] OR "cognitive reserve"[tiab]'
          ]
        }
      },
      {
        name: "S30300",
        buttons: true,
        id: "S30300",
        maintopic: true,
        translations: {
          dk: "Lægemidler",
          en: "Medications",
        },
        ordering: {
          dk: 14,
          en: 14
        },
        searchStrings: {
          narrow: [
            '"Pharmaceutical Preparations"[majr]'
          ],
          normal: [
            '"Pharmaceutical Preparations"[mh] OR medication[ti] OR medications[ti] OR drug[ti] OR drugs[ti]'
          ],
          broad: [
            '"Pharmaceutical Preparations"[mh] OR medication[tiab] OR medications[tiab] OR drug[tiab] OR drugs[tiab]'
          ]
        }
      },
      {
        name: "S30310",
        buttons: true,
        id: "S30310",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30300",
        translations: {
          dk: "Hormontilskud/Hormonbehandling",
          en: "Hormone replacement/Hormone therapy",
        },
        ordering: {
          dk: 15,
          en: 15
        },
        searchStrings: {
          narrow: [
            '"Hormone Replacement Therapy"[majr]'
          ],
          normal: [
            '"Hormone Replacement Therapy"[mh] OR "hormone replacement"[ti] OR "hormone therapy"[ti]'
          ],
          broad: [
            '"Hormone Replacement Therapy"[mh] OR "hormone replacement"[tiab] OR "hormone therapy"[tiab]'
          ]
        }
      },
      {
        name: "S30320",
        buttons: true,
        id: "S30320",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30300",
        translations: {
          dk: "Benzodiazepin",
          en: "Benzodiazepine",
        },
        ordering: {
          dk: 16,
          en: 16
        },
        searchStrings: {
          narrow: [
            '"Benzodiazepines"[majr]'
          ],
          normal: [
            '"Benzodiazepines"[mh] OR benzodiazepine[ti] OR benzodiazepines[ti]'
          ],
          broad: [
            '"Benzodiazepines"[mh] OR benzodiazepine[tiab] OR benzodiazepines[tiab]'
          ]
        }
      },
      {
        name: "S30330",
        buttons: true,
        id: "S30330",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30300",
        translations: {
          dk: "Antikolinerg",
          en: "Anticholinergic",
        },
        ordering: {
          dk: 17,
          en: 17
        },
        searchStrings: {
          narrow: [
            '"Cholinergic Antagonists"[majr]'
          ],
          normal: [
            '"Cholinergic Antagonists"[mh] OR anticholinergic[ti] OR anticholinergics[ti]'
          ],
          broad: [
            '"Cholinergic Antagonists"[mh] OR anticholinergic[tiab] OR anticholinergics[tiab]'
          ]
        }
      },
      {
        name: "S30400",
        buttons: true,
        id: "S30400",
        maintopic: true,
        translations: {
          dk: "Lægemidler",
          en: "Medications",
        },
        ordering: {
          dk: 18,
          en: 18
        },
        searchStrings: {
          narrow: [
            '"Pharmaceutical Preparations"[majr]'
          ],
          normal: [
            '"Pharmaceutical Preparations"[mh] OR medication[ti] OR medications[ti] OR drug[ti] OR drugs[ti]'
          ],
          broad: [
            '"Pharmaceutical Preparations"[mh] OR medication[tiab] OR medications[tiab] OR drug[tiab] OR drugs[tiab]'
          ]
        }
      },
      {
        name: "S30410",
        buttons: true,
        id: "S30410",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Kost/Ernæring",
          en: "Diet/Nutrition",
        },
        ordering: {
          dk: 19,
          en: 19
        },
        searchStrings: {
          narrow: [
            '"Diet"[majr] OR "Nutrition Therapy"[majr]'
          ],
          normal: [
            '"Diet"[mh] OR "Nutrition Therapy"[mh] OR diet[ti] OR nutrition[ti] OR dietary[ti]'
          ],
          broad: [
            '"Diet"[mh] OR "Nutrition Therapy"[mh] OR diet[tiab] OR nutrition[tiab] OR dietary[tiab]'
          ]
        }
      },
      {
        name: "S30420",
        buttons: true,
        id: "S30420",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Middelhavskost",
          en: "Mediterranean diet",
        },
        ordering: {
          dk: 20,
          en: 20
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
          ]
        }
      },
      {
        name: "S30430",
        buttons: true,
        id: "S30430",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Fedtstof/Fedtsyre",
          en: "Fat/Fatty acid",
        },
        ordering: {
          dk: 21,
          en: 21
        },
        searchStrings: {
          narrow: [
            '"Fatty Acids"[majr] OR "Dietary Fats"[majr]'
          ],
          normal: [
            '"Fatty Acids"[mh] OR "Dietary Fats"[mh] OR "fatty acid"[ti] OR "fatty acids"[ti] OR fat[ti] OR fats[ti]'
          ],
          broad: [
            '"Fatty Acids"[mh] OR "Dietary Fats"[mh] OR "fatty acid"[tiab] OR "fatty acids"[tiab] OR fat[tiab] OR fats[tiab]'
          ]
        }
      },
      {
        name: "S30440",
        buttons: true,
        id: "S30440",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Antioxidant",
          en: "Antioxidant",
        },
        ordering: {
          dk: 22,
          en: 22
        },
        searchStrings: {
          narrow: [
            '"Antioxidants"[majr]'
          ],
          normal: [
            '"Antioxidants"[mh] OR antioxidant[ti] OR antioxidants[ti]'
          ],
          broad: [
            '"Antioxidants"[mh] OR antioxidant[tiab] OR antioxidants[tiab]'
          ]
        }
      },
      {
        name: "S30450",
        buttons: true,
        id: "S30450",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Vitamin",
          en: "Vitamin",
        },
        ordering: {
          dk: 23,
          en: 23
        },
        searchStrings: {
          narrow: [
            '"Vitamins"[majr]'
          ],
          normal: [
            '"Vitamins"[mh] OR vitamin[ti] OR vitamins[ti]'
          ],
          broad: [
            '"Vitamins"[mh] OR vitamin[tiab] OR vitamins[tiab]'
          ]
        }
      },
      {
        name: "S30460",
        buttons: true,
        id: "S30460",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Rygning/Tobak",
          en: "Smoking/Tobacco",
        },
        ordering: {
          dk: 24,
          en: 24
        },
        searchStrings: {
          narrow: [
            '"Smoking"[majr] OR "Tobacco"[majr]'
          ],
          normal: [
            '"Smoking"[mh] OR "Tobacco"[mh] OR smoking[ti] OR tobacco[ti]'
          ],
          broad: [
            '"Smoking"[mh] OR "Tobacco"[mh] OR smoking[tiab] OR tobacco[tiab]'
          ]
        }
      },
      {
        name: "S30470",
        buttons: true,
        id: "S30470",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Alkohol",
          en: "Alcohol",
        },
        ordering: {
          dk: 25,
          en: 25
        },
        searchStrings: {
          narrow: [
            '"Alcohol Drinking"[majr] OR "Alcoholic Beverages"[majr]'
          ],
          normal: [
            '"Alcohol Drinking"[mh] OR "Alcoholic Beverages"[mh] OR alcohol[ti] OR alcoholic[ti]'
          ],
          broad: [
            '"Alcohol Drinking"[mh] OR "Alcoholic Beverages"[mh] OR alcohol[tiab] OR alcoholic[tiab]'
          ]
        }
      },
      {
        name: "S30480",
        buttons: true,
        id: "S30480",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Fysisk aktivitet/Motion",
          en: "Physical activity/Exercise",
        },
        ordering: {
          dk: 26,
          en: 26
        },
        searchStrings: {
          narrow: [
            '"Exercise"[majr] OR "Physical Activity"[majr]'
          ],
          normal: [
            '"Exercise"[mh] OR "Physical Activity"[mh] OR exercise[ti] OR "physical activity"[ti]'
          ],
          broad: [
            '"Exercise"[mh] OR "Physical Activity"[mh] OR exercise[tiab] OR "physical activity"[tiab]'
          ]
        }
      },
      {
        name: "S30490",
        buttons: true,
        id: "S30490",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Fritidsaktivitet",
          en: "Leisure activity",
        },
        ordering: {
          dk: 27,
          en: 27
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
          ]
        }
      },
      {
        name: "S30495",
        buttons: true,
        id: "S30495",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30400",
        translations: {
          dk: "Søvn",
          en: "Sleep",
        },
        ordering: {
          dk: 28,
          en: 28
        },
        searchStrings: {
          narrow: [
            '"Sleep"[majr]'
          ],
          normal: [
            '"Sleep"[mh] OR sleep[ti]'
          ],
          broad: [
            '"Sleep"[mh] OR sleep[tiab]'
          ]
        }
      },
      {
        name: "S30500",
        buttons: true,
        id: "S30500",
        maintopic: true,
        translations: {
          dk: "Sociodemografiske faktorer",
          en: "Sociodemographic factors",
        },
        ordering: {
          dk: 29,
          en: 29
        },
        searchStrings: {
          narrow: [
            '"Socioeconomic Factors"[majr] OR "Social Class"[majr] OR "Educational Status"[majr]'
          ],
          normal: [
            '"Socioeconomic Factors"[mh] OR "Social Class"[mh] OR "Educational Status"[mh] OR sociodemographic[ti] OR "socio-demographic"[ti]'
          ],
          broad: [
            '"Socioeconomic Factors"[mh] OR "Social Class"[mh] OR "Educational Status"[mh] OR sociodemographic[tiab] OR "socio-demographic"[tiab]'
          ]
        }
      },
      {
        name: "S30510",
        buttons: true,
        id: "S30510",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30500",
        translations: {
          dk: "Uddannelse/Skolegang",
          en: "Education/Schooling",
        },
        ordering: {
          dk: 30,
          en: 30
        },
        searchStrings: {
          narrow: [
            '"Education"[majr] OR "Educational Status"[majr]'
          ],
          normal: [
            '"Education"[mh] OR "Educational Status"[mh] OR education[ti] OR schooling[ti] OR educational[ti]'
          ],
          broad: [
            '"Education"[mh] OR "Educational Status"[mh] OR education[tiab] OR schooling[tiab] OR educational[tiab]'
          ]
        }
      },
      {
        name: "S30520",
        buttons: true,
        id: "S30520",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30500",
        translations: {
          dk: "Erhverv",
          en: "Occupation",
        },
        ordering: {
          dk: 31,
          en: 31
        },
        searchStrings: {
          narrow: [
            '"Occupations"[majr] OR "Employment"[majr]'
          ],
          normal: [
            '"Occupations"[mh] OR "Employment"[mh] OR occupation[ti] OR occupational[ti] OR employment[ti]'
          ],
          broad: [
            '"Occupations"[mh] OR "Employment"[mh] OR occupation[tiab] OR occupational[tiab] OR employment[tiab]'
          ]
        }
      },
      {
        name: "S30600",
        buttons: true,
        id: "S30600",
        maintopic: true,
        translations: {
          dk: "Miljø",
          en: "Environment",
        },
        ordering: {
          dk: 32,
          en: 32
        },
        searchStrings: {
          narrow: [
            '"Environment"[majr]'
          ],
          normal: [
            '"Environment"[mh] OR environment[ti] OR environmental[ti]'
          ],
          broad: [
            '"Environment"[mh] OR environment[tiab] OR environmental[tiab]'
          ]
        }
      },
      {
        name: "S30610",
        buttons: true,
        id: "S30610",
        subtopiclevel: 1,
        maintopicIdLevel1: "S30600",
        translations: {
          dk: "Luftforurening",
          en: "Air pollution",
        },
        ordering: {
          dk: 33,
          en: 33
        },
        searchStrings: {
          narrow: [
            '"Air Pollution"[majr]'
          ],
          normal: [
            '"Air Pollution"[mh] OR "air pollution"[ti]'
          ],
          broad: [
            '"Air Pollution"[mh] OR "air pollution"[tiab]'
          ]
        }
      }
    ]
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
          dk: "Prævalens",
          en: "Prevalence",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Prevalence"[majr]'
          ],
          normal: [
            '"Prevalence"[mh] OR prevalence[ti]'
          ],
          broad: [
            '"Prevalence"[mh] OR prevalence[tiab]'
          ]
        }
      },
      {
        name: "S40020",
        buttons: true,
        id: "S40020",
        translations: {
          dk: "Incidens",
          en: "Incidence",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Incidence"[majr]'
          ],
          normal: [
            '"Incidence"[mh] OR incidence[ti]'
          ],
          broad: [
            '"Incidence"[mh] OR incidence[tiab]'
          ]
        }
      },
      {
        name: "S40030",
        buttons: true,
        id: "S40030",
        translations: {
          dk: "Statistik",
          en: "Statistics",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Statistics as Topic"[majr]'
          ],
          normal: [
            '"Statistics as Topic"[mh] OR statistics[ti] OR statistical[ti]'
          ],
          broad: [
            '"Statistics as Topic"[mh] OR statistics[tiab] OR statistical[tiab]'
          ]
        }
      },
      {
        name: "S40040",
        buttons: true,
        id: "S40040",
        translations: {
          dk: "Dødelighed",
          en: "Mortality",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Mortality"[majr]'
          ],
          normal: [
            '"Mortality"[mh] OR mortality[ti]'
          ],
          broad: [
            '"Mortality"[mh] OR mortality[tiab]'
          ]
        }
      },
      {
        name: "S40050",
        buttons: true,
        id: "S40050",
        translations: {
          dk: "Mortalitet",
          en: "Mortality rate",
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Death Rate"[majr] OR "Mortality"[majr:noexp]'
          ],
          normal: [
            '"Death Rate"[mh] OR "Mortality"[mh:noexp] OR "mortality rate"[ti] OR "death rate"[ti]'
          ],
          broad: [
            '"Death Rate"[mh] OR "Mortality"[mh:noexp] OR "mortality rate"[tiab] OR "death rate"[tiab]'
          ]
        }
      },
      {
        name: "S40060",
        buttons: true,
        id: "S40060",
        translations: {
          dk: "Dødsårsager",
          en: "Causes of death",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Cause of Death"[majr]'
          ],
          normal: [
            '"Cause of Death"[mh] OR "cause of death"[ti] OR "causes of death"[ti]'
          ],
          broad: [
            '"Cause of Death"[mh] OR "cause of death"[tiab] OR "causes of death"[tiab]'
          ]
        }
      },
      {
        name: "S40070",
        buttons: true,
        id: "S40070",
        translations: {
          dk: "Omkostninger",
          en: "Costs",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Costs and Cost Analysis"[majr]'
          ],
          normal: [
            '"Costs and Cost Analysis"[mh] OR cost[ti] OR costs[ti]'
          ],
          broad: [
            '"Costs and Cost Analysis"[mh] OR cost[tiab] OR costs[tiab]'
          ]
        }
      },
      {
        name: "S40080",
        buttons: true,
        id: "S40080",
        translations: {
          dk: "Sundhedsøkonomi",
          en: "Health economics",
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '"Economics, Medical"[majr] OR "Health Care Costs"[majr]'
          ],
          normal: [
            '"Economics, Medical"[mh] OR "Health Care Costs"[mh] OR "health economics"[ti] OR "healthcare costs"[ti]'
          ],
          broad: [
            '"Economics, Medical"[mh] OR "Health Care Costs"[mh] OR "health economics"[tiab] OR "healthcare costs"[tiab]'
          ]
        }
      }
    ]
  },
  {
    groupname: "Examination",
    id: "S50",
    translations: {
      dk: "Udredning",
      en: "Examination",
    },
    ordering: {
      dk: 5,
      en: 5
    },
    groups: [
      {
        name: "S50100", 
        buttons: true,
        id: "S50100",
        maintopic: true,
        translations: {
          dk: "Basisundersøgelser",
          en: "Basic examinations",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Diagnostic Tests, Routine"[majr]'
          ],
          normal: [
            '"Diagnostic Tests, Routine"[mh] OR "basic examination"[ti] OR "basic examinations"[ti]'
          ],
          broad: [
            '"Diagnostic Tests, Routine"[mh] OR "basic examination"[tiab] OR "basic examinations"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Diagnoser",
          en: "Diagnoses",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Diagnosis"[majr]'
          ],
          normal: [
            '"Diagnosis"[mh] OR diagnosis[ti] OR diagnoses[ti]'
          ],
          broad: [
            '"Diagnosis"[mh] OR diagnosis[tiab] OR diagnoses[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Diagnosekriterier",
          en: "Diagnostic criteria",
        },
        ordering: {
          dk: 3,
          en: 3
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
        name: "S50130",
        buttons: true,
        id: "S50130",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Diagnostik",
          en: "Diagnostics",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Diagnostics"[majr] OR "Diagnostic Techniques"[majr]'
          ],
          normal: [
            '"Diagnostics"[mh] OR "Diagnostic Techniques"[mh] OR diagnostic[ti] OR diagnostics[ti]'
          ],
          broad: [
            '"Diagnostics"[mh] OR "Diagnostic Techniques"[mh] OR diagnostic[tiab] OR diagnostics[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Sygehistorie",
          en: "Medical history",
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Medical History Taking"[majr]'
          ],
          normal: [
            '"Medical History Taking"[mh] OR "medical history"[ti] OR anamnesis[ti]'
          ],
          broad: [
            '"Medical History Taking"[mh] OR "medical history"[tiab] OR anamnesis[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Anamnese",
          en: "Anamnesis",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Medical History Taking"[majr]'
          ],
          normal: [
            '"Medical History Taking"[mh] OR anamnesis[ti]'
          ],
          broad: [
            '"Medical History Taking"[mh] OR anamnesis[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Laboratorieprøver",
          en: "Laboratory tests",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Clinical Laboratory Techniques"[majr]'
          ],
          normal: [
            '"Clinical Laboratory Techniques"[mh] OR "laboratory test"[ti] OR "laboratory tests"[ti] OR "lab test"[ti] OR "lab tests"[ti]'
          ],
          broad: [
            '"Clinical Laboratory Techniques"[mh] OR "laboratory test"[tiab] OR "laboratory tests"[tiab] OR "lab test"[tiab] OR "lab tests"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Blodprøver",
          en: "Blood tests",
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '"Blood Tests"[majr]'
          ],
          normal: [
            '"Blood Tests"[mh] OR "blood test"[ti] OR "blood tests"[ti]'
          ],
          broad: [
            '"Blood Tests"[mh] OR "blood test"[tiab] OR "blood tests"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Funktionsevne",
          en: "Functional ability",
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            '"Activities of Daily Living"[majr]'
          ],
          normal: [
            '"Activities of Daily Living"[mh] OR "functional ability"[ti] OR "functional status"[ti] OR "functional assessment"[ti]'
          ],
          broad: [
            '"Activities of Daily Living"[mh] OR "functional ability"[tiab] OR "functional status"[tiab] OR "functional assessment"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "ADL/IADL",
          en: "ADL/IADL",
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            '"Activities of Daily Living"[majr]'
          ],
          normal: [
            '"Activities of Daily Living"[mh] OR ADL[ti] OR IADL[ti] OR "activities of daily living"[ti] OR "instrumental activities of daily living"[ti]'
          ],
          broad: [
            '"Activities of Daily Living"[mh] OR ADL[tiab] OR IADL[tiab] OR "activities of daily living"[tiab] OR "instrumental activities of daily living"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Screening",
          en: "Screening",
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Mass Screening"[majr]'
          ],
          normal: [
            '"Mass Screening"[mh] OR screening[ti]'
          ],
          broad: [
            '"Mass Screening"[mh] OR screening[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Screeningsinstrument / screeningstest",
          en: "Screening instrument / screening test",
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            '"Neuropsychological Tests"[majr] OR "Psychiatric Status Rating Scales"[majr]'
          ],
          normal: [
            '"Neuropsychological Tests"[mh] OR "Psychiatric Status Rating Scales"[mh] OR "screening test"[ti] OR "screening tests"[ti] OR "screening instrument"[ti] OR "screening instruments"[ti]'
          ],
          broad: [
            '"Neuropsychological Tests"[mh] OR "Psychiatric Status Rating Scales"[mh] OR "screening test"[tiab] OR "screening tests"[tiab] OR "screening instrument"[tiab] OR "screening instruments"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Spørgeskema",
          en: "Questionnaire",
        },
        ordering: {
          dk: 13,
          en: 13
        },
        searchStrings: {
          narrow: [
            '"Surveys and Questionnaires"[majr]'
          ],
          normal: [
            '"Surveys and Questionnaires"[mh] OR questionnaire[ti] OR questionnaires[ti]'
          ],
          broad: [
            '"Surveys and Questionnaires"[mh] OR questionnaire[tiab] OR questionnaires[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Scanning",
          en: "Scanning",
        },
        ordering: {
          dk: 14,
          en: 14
        },
        searchStrings: {
          narrow: [
            '"Diagnostic Imaging"[majr]'
          ],
          normal: [
            '"Diagnostic Imaging"[mh] OR scanning[ti] OR scan[ti]'
          ],
          broad: [
            '"Diagnostic Imaging"[mh] OR scanning[tiab] OR scan[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Billeddiagnostik",
          en: "Diagnostic imaging",
        },
        ordering: {
          dk: 15,
          en: 15
        },
        searchStrings: {
          narrow: [
            '"Diagnostic Imaging"[majr]'
          ],
          normal: [
            '"Diagnostic Imaging"[mh] OR "diagnostic imaging"[ti] OR imaging[ti]'
          ],
          broad: [
            '"Diagnostic Imaging"[mh] OR "diagnostic imaging"[tiab] OR imaging[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "Hjernescanning",
          en: "Brain scanning",
        },
        ordering: {
          dk: 16,
          en: 16
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
        name: "S50260",
        buttons: true,
        id: "S50260",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "CT-scanning",
          en: "CT scanning",
        },
        ordering: {
          dk: 17,
          en: 17
        },
        searchStrings: {
          narrow: [
            '"Tomography, X-Ray Computed"[majr]'
          ],
          normal: [
            '"Tomography, X-Ray Computed"[mh] OR "CT scan"[ti] OR "CT scanning"[ti] OR "computed tomography"[ti]'
          ],
          broad: [
            '"Tomography, X-Ray Computed"[mh] OR "CT scan"[tiab] OR "CT scanning"[tiab] OR "computed tomography"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S50100",
        translations: {
          dk: "MR-scanning",
          en: "MRI scanning",
        },
        ordering: {
          dk: 18,
          en: 18
        },
        searchStrings: {
          narrow: [
            '"Magnetic Resonance Imaging"[majr]'
          ],
          normal: [
            '"Magnetic Resonance Imaging"[mh] OR "MRI scan"[ti] OR "MRI scanning"[ti] OR "magnetic resonance imaging"[ti]'
          ],
          broad: [
            '"Magnetic Resonance Imaging"[mh] OR "MRI scan"[tiab] OR "MRI scanning"[tiab] OR "magnetic resonance imaging"[tiab]'
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
        name: "S50300",
        buttons: true,
        id: "S50300",
        maintopic: true,
        translations: {
          dk: "Supplerende undersøgelser",
          en: "Supplementary examinations",
        },
        ordering: {
          dk: 19,
          en: 19
        },
        searchStrings: {
          narrow: [
            '"Diagnostic Tests, Routine"[majr]'
          ],
          normal: [
            '"Diagnostic Tests, Routine"[mh] OR "supplementary examination"[ti] OR "supplementary examinations"[ti]'
          ],
          broad: [
            '"Diagnostic Tests, Routine"[mh] OR "supplementary examination"[tiab] OR "supplementary examinations"[tiab]'
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
        name: "S50310",
        buttons: true,
        id: "S50310",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "Testnormer",
          en: "Test norms",
        },
        ordering: {
          dk: 20,
          en: 20
        },
        searchStrings: {
          narrow: [
            '"Reference Values"[majr]'
          ],
          normal: [
            '"Reference Values"[mh] OR "test norm"[ti] OR "test norms"[ti] OR "reference value"[ti] OR "reference values"[ti]'
          ],
          broad: [
            '"Reference Values"[mh] OR "test norm"[tiab] OR "test norms"[tiab] OR "reference value"[tiab] OR "reference values"[tiab]'
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
        name: "S50320",
        buttons: true,
        id: "S50320",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "Normer",
          en: "Norms",
        },
        ordering: {
          dk: 21,
          en: 21
        },
        searchStrings: {
          narrow: [
            '"Reference Values"[majr]'
          ],
          normal: [
            '"Reference Values"[mh] OR norm[ti] OR norms[ti] OR "reference value"[ti] OR "reference values"[ti]'
          ],
          broad: [
            '"Reference Values"[mh] OR norm[tiab] OR norms[tiab] OR "reference value"[tiab] OR "reference values"[tiab]'
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
        name: "S50330",
        buttons: true,
        id: "S50330",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "EEG",
          en: "EEG",
        },
        ordering: {
          dk: 22,
          en: 22
        },
        searchStrings: {
          narrow: [
            '"Electroencephalography"[majr]'
          ],
          normal: [
            '"Electroencephalography"[mh] OR EEG[ti] OR electroencephalography[ti] OR electroencephalogram[ti]'
          ],
          broad: [
            '"Electroencephalography"[mh] OR EEG[tiab] OR electroencephalography[tiab] OR electroencephalogram[tiab]'
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
        name: "S50340",
        buttons: true,
        id: "S50340",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "Rygmarvsvæske",
          en: "Cerebrospinal fluid",
        },
        ordering: {
          dk: 23,
          en: 23
        },
        searchStrings: {
          narrow: [
            '"Cerebrospinal Fluid"[majr]'
          ],
          normal: [
            '"Cerebrospinal Fluid"[mh] OR "cerebrospinal fluid"[ti] OR CSF[ti]'
          ],
          broad: [
            '"Cerebrospinal Fluid"[mh] OR "cerebrospinal fluid"[tiab] OR CSF[tiab]'
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
        name: "S50350",
        buttons: true,
        id: "S50350",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "Lumbalpunktur",
          en: "Lumbar puncture",
        },
        ordering: {
          dk: 24,
          en: 24
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
        name: "S50360",
        buttons: true,
        id: "S50360",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "Amyloid-scanning",
          en: "Amyloid scanning",
        },
        ordering: {
          dk: 25,
          en: 25
        },
        searchStrings: {
          narrow: [
            '"Amyloid beta-Peptides/diagnostic imaging"[majr]'
          ],
          normal: [
            '"Amyloid beta-Peptides/diagnostic imaging"[mh] OR "amyloid scan"[ti] OR "amyloid scanning"[ti] OR "amyloid imaging"[ti]'
          ],
          broad: [
            '"Amyloid beta-Peptides/diagnostic imaging"[mh] OR "amyloid scan"[tiab] OR "amyloid scanning"[tiab] OR "amyloid imaging"[tiab]'
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
        name: "S50370",
        buttons: true,
        id: "S50370",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "DAT-scanning",
          en: "DAT scanning",
        },
        ordering: {
          dk: 26,
          en: 26
        },
        searchStrings: {
          narrow: [
            '"Dopamine Plasma Membrane Transport Proteins/diagnostic imaging"[majr]'
          ],
          normal: [
            '"Dopamine Plasma Membrane Transport Proteins/diagnostic imaging"[mh] OR "DAT scan"[ti] OR "DAT scanning"[ti]'
          ],
          broad: [
            '"Dopamine Plasma Membrane Transport Proteins/diagnostic imaging"[mh] OR "DAT scan"[tiab] OR "DAT scanning"[tiab]'
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
        name: "S50380",
        buttons: true,
        id: "S50380",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "PET-scanning",
          en: "PET scanning",
        },
        ordering: {
          dk: 27,
          en: 27
        },
        searchStrings: {
          narrow: [
            '"Positron-Emission Tomography"[majr]'
          ],
          normal: [
            '"Positron-Emission Tomography"[mh] OR "PET scan"[ti] OR "PET scanning"[ti] OR "positron emission tomography"[ti]'
          ],
          broad: [
            '"Positron-Emission Tomography"[mh] OR "PET scan"[tiab] OR "PET scanning"[tiab] OR "positron emission tomography"[tiab]'
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
        name: "S50390",
        buttons: true,
        id: "S50390",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "SPECT-scanning",
          en: "SPECT scanning",
        },
        ordering: {
          dk: 28,
          en: 28
        },
        searchStrings: {
          narrow: [
            '"Tomography, Emission-Computed, Single-Photon"[majr]'
          ],
          normal: [
            '"Tomography, Emission-Computed, Single-Photon"[mh] OR "SPECT scan"[ti] OR "SPECT scanning"[ti] OR "single photon emission computed tomography"[ti]'
          ],
          broad: [
            '"Tomography, Emission-Computed, Single-Photon"[mh] OR "SPECT scan"[tiab] OR "SPECT scanning"[tiab] OR "single photon emission computed tomography"[tiab]'
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
        name: "S50400",
        buttons: true,
        id: "S50400",
        subtopiclevel: 1,
        maintopicIdLevel1: "S50300",
        translations: {
          dk: "Neuropsykologisk undersøgelse / neuropsykologisk testning / neuropsykologisk test",
          en: "Neuropsychological examination / neuropsychological testing / neuropsychological test",
        },
        ordering: {
          dk: 29,
          en: 29
        },
        searchStrings: {
          narrow: [
            '"Neuropsychological Tests"[majr]'
          ],
          normal: [
            '"Neuropsychological Tests"[mh] OR "neuropsychological test"[ti] OR "neuropsychological testing"[ti] OR "neuropsychological examination"[ti]'
          ],
          broad: [
            '"Neuropsychological Tests"[mh] OR "neuropsychological test"[tiab] OR "neuropsychological testing"[tiab] OR "neuropsychological examination"[tiab]'
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
      // ... resten af underemnerne kommer her ...
    ]
  },
  {
    groupname: "Treatment",
    id: "S60",
    translations: {
      dk: "Behandling",
      en: "Treatment",
    },
    ordering: {
      dk: 6,
      en: 6
    },
    groups: [
      {
        name: "S60100",
        buttons: true,
        id: "S60100",
        maintopic: true,
        translations: {
          dk: "Behandling af demens",
          en: "Treatment of dementia",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Therapeutics"[majr] OR "therapy"[sh]'
          ],
          normal: [
            '"Therapeutics"[mh] OR "therapy"[sh] OR treatment[ti] OR therapy[ti]'
          ],
          broad: [
            '"Therapeutics"[mh] OR "therapy"[sh] OR treatment[tiab] OR therapy[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Farmakologisk behandling",
          en: "Pharmacological treatment",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Drug Therapy"[majr]'
          ],
          normal: [
            '"Drug Therapy"[mh] OR "pharmacological treatment"[ti] OR "drug therapy"[ti] OR "drug treatment"[ti]'
          ],
          broad: [
            '"Drug Therapy"[mh] OR "pharmacological treatment"[tiab] OR "drug therapy"[tiab] OR "drug treatment"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Medicin",
          en: "Medicine",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Pharmaceutical Preparations"[majr]'
          ],
          normal: [
            '"Pharmaceutical Preparations"[mh] OR medicine[ti] OR medication[ti] OR medications[ti]'
          ],
          broad: [
            '"Pharmaceutical Preparations"[mh] OR medicine[tiab] OR medication[tiab] OR medications[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Demensmedicin",
          en: "Dementia medication",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Cholinesterase Inhibitors"[majr] OR "Memantine"[majr]'
          ],
          normal: [
            '"Cholinesterase Inhibitors"[mh] OR "Memantine"[mh] OR "dementia medication"[ti] OR "anti-dementia medication"[ti]'
          ],
          broad: [
            '"Cholinesterase Inhibitors"[mh] OR "Memantine"[mh] OR "dementia medication"[tiab] OR "anti-dementia medication"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Kolinesterasehæmmer",
          en: "Cholinesterase inhibitor",
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Cholinesterase Inhibitors"[majr]'
          ],
          normal: [
            '"Cholinesterase Inhibitors"[mh] OR "cholinesterase inhibitor"[ti] OR "cholinesterase inhibitors"[ti]'
          ],
          broad: [
            '"Cholinesterase Inhibitors"[mh] OR "cholinesterase inhibitor"[tiab] OR "cholinesterase inhibitors"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Memantin",
          en: "Memantine",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Memantine"[majr]'
          ],
          normal: [
            '"Memantine"[mh] OR memantine[ti]'
          ],
          broad: [
            '"Memantine"[mh] OR memantine[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Bivirkning",
          en: "Adverse effect",
        },
        ordering: {
          dk: 7,
          en: 7
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
        name: "S60170",
        buttons: true,
        id: "S60170",
        subtopiclevel: 1,
        maintopicIdLevel1: "S60100",
        translations: {
          dk: "Seponering",
          en: "Discontinuation",
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '"Withholding Treatment"[majr]'
          ],
          normal: [
            '"Withholding Treatment"[mh] OR discontinuation[ti] OR withdrawal[ti] OR "stopping medication"[ti]'
          ],
          broad: [
            '"Withholding Treatment"[mh] OR discontinuation[tiab] OR withdrawal[tiab] OR "stopping medication"[tiab]'
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
        maintopic: true,
        translations: {
          dk: "Behandling af komorbiditet",
          en: "Treatment of comorbidity",
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            '"Comorbidity/therapy"[majr]'
          ],
          normal: [
            '"Comorbidity/therapy"[mh] OR "treatment of comorbidity"[ti] OR "comorbidity treatment"[ti]'
          ],
          broad: [
            '"Comorbidity/therapy"[mh] OR "treatment of comorbidity"[tiab] OR "comorbidity treatment"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Smertestillende",
          en: "Pain relief",
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            '"Analgesics"[majr]'
          ],
          normal: [
            '"Analgesics"[mh] OR "pain relief"[ti] OR "pain medication"[ti] OR analgesic[ti] OR analgesics[ti]'
          ],
          broad: [
            '"Analgesics"[mh] OR "pain relief"[tiab] OR "pain medication"[tiab] OR analgesic[tiab] OR analgesics[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Analgetika",
          en: "Analgesics",
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Analgesics"[majr]'
          ],
          normal: [
            '"Analgesics"[mh] OR analgesic[ti] OR analgesics[ti]'
          ],
          broad: [
            '"Analgesics"[mh] OR analgesic[tiab] OR analgesics[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Antidepressiv",
          en: "Antidepressant",
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            '"Antidepressive Agents"[majr]'
          ],
          normal: [
            '"Antidepressive Agents"[mh] OR antidepressant[ti] OR antidepressants[ti] OR "antidepressive agent"[ti] OR "antidepressive agents"[ti]'
          ],
          broad: [
            '"Antidepressive Agents"[mh] OR antidepressant[tiab] OR antidepressants[tiab] OR "antidepressive agent"[tiab] OR "antidepressive agents"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Antipsykotisk",
          en: "Antipsychotic",
        },
        ordering: {
          dk: 13,
          en: 13
        },
        searchStrings: {
          narrow: [
            '"Antipsychotic Agents"[majr]'
          ],
          normal: [
            '"Antipsychotic Agents"[mh] OR antipsychotic[ti] OR antipsychotics[ti] OR "antipsychotic agent"[ti] OR "antipsychotic agents"[ti]'
          ],
          broad: [
            '"Antipsychotic Agents"[mh] OR antipsychotic[tiab] OR antipsychotics[tiab] OR "antipsychotic agent"[tiab] OR "antipsychotic agents"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Angstdæmpende",
          en: "Anti-anxiety",
        },
        ordering: {
          dk: 14,
          en: 14
        },
        searchStrings: {
          narrow: [
            '"Anti-Anxiety Agents"[majr]'
          ],
          normal: [
            '"Anti-Anxiety Agents"[mh] OR anxiolytic[ti] OR anxiolytics[ti] OR "anti-anxiety"[ti] OR "anti anxiety"[ti]'
          ],
          broad: [
            '"Anti-Anxiety Agents"[mh] OR anxiolytic[tiab] OR anxiolytics[tiab] OR "anti-anxiety"[tiab] OR "anti anxiety"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Tandpleje",
          en: "Dental care",
        },
        ordering: {
          dk: 15,
          en: 15
        },
        searchStrings: {
          narrow: [
            '"Dental Care"[majr]'
          ],
          normal: [
            '"Dental Care"[mh] OR "dental care"[ti] OR "oral care"[ti] OR "dental health"[ti]'
          ],
          broad: [
            '"Dental Care"[mh] OR "dental care"[tiab] OR "oral care"[tiab] OR "dental health"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Faldforebyggelse",
          en: "Fall prevention",
        },
        ordering: {
          dk: 16,
          en: 16
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
        name: "S60280",
        buttons: true,
        id: "S60280",
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Vandladning",
          en: "Urination",
        },
        ordering: {
          dk: 17,
          en: 17
        },
        searchStrings: {
          narrow: [
            '"Urination"[majr]'
          ],
          normal: [
            '"Urination"[mh] OR urination[ti] OR micturition[ti]'
          ],
          broad: [
            '"Urination"[mh] OR urination[tiab] OR micturition[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Inkontinens",
          en: "Incontinence",
        },
        ordering: {
          dk: 18,
          en: 18
        },
        searchStrings: {
          narrow: [
            '"Urinary Incontinence"[majr]'
          ],
          normal: [
            '"Urinary Incontinence"[mh] OR incontinence[ti]'
          ],
          broad: [
            '"Urinary Incontinence"[mh] OR incontinence[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Forstoppelse",
          en: "Constipation",
        },
        ordering: {
          dk: 19,
          en: 19
        },
        searchStrings: {
          narrow: [
            '"Constipation"[majr]'
          ],
          normal: [
            '"Constipation"[mh] OR constipation[ti]'
          ],
          broad: [
            '"Constipation"[mh] OR constipation[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60200",
        translations: {
          dk: "Tryksår / liggesår",
          en: "Pressure ulcer / bedsore",
        },
        ordering: {
          dk: 20,
          en: 20
        },
        searchStrings: {
          narrow: [
            '"Pressure Ulcer"[majr]'
          ],
          normal: [
            '"Pressure Ulcer"[mh] OR "pressure ulcer"[ti] OR "pressure ulcers"[ti] OR bedsore[ti] OR bedsores[ti]'
          ],
          broad: [
            '"Pressure Ulcer"[mh] OR "pressure ulcer"[tiab] OR "pressure ulcers"[tiab] OR bedsore[tiab] OR bedsores[tiab]'
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
        maintopic: true,
        translations: {
          dk: "Ikke-farmakologisk behandling",
          en: "Non-pharmacological treatment",
        },
        ordering: {
          dk: 21,
          en: 21
        },
        searchStrings: {
          narrow: [
            '"Complementary Therapies"[majr]'
          ],
          normal: [
            '"Complementary Therapies"[mh] OR "non-pharmacological treatment"[ti] OR "nonpharmacological treatment"[ti] OR "non pharmacological treatment"[ti]'
          ],
          broad: [
            '"Complementary Therapies"[mh] OR "non-pharmacological treatment"[tiab] OR "nonpharmacological treatment"[tiab] OR "non pharmacological treatment"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Kommunikation",
          en: "Communication",
        },
        ordering: {
          dk: 22,
          en: 22
        },
        searchStrings: {
          narrow: [
            '"Communication"[majr]'
          ],
          normal: [
            '"Communication"[mh] OR communication[ti]'
          ],
          broad: [
            '"Communication"[mh] OR communication[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Teknologi",
          en: "Technology",
        },
        ordering: {
          dk: 23,
          en: 23
        },
        searchStrings: {
          narrow: [
            '"Technology"[majr]'
          ],
          normal: [
            '"Technology"[mh] OR technology[ti] OR technological[ti]'
          ],
          broad: [
            '"Technology"[mh] OR technology[tiab] OR technological[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Demensvenlighed",
          en: "Dementia friendliness",
        },
        ordering: {
          dk: 24,
          en: 24
        },
        searchStrings: {
          narrow: [
            '"Environment Design"[majr]'
          ],
          normal: [
            '"Environment Design"[mh] OR "dementia friendly"[ti] OR "dementia friendliness"[ti]'
          ],
          broad: [
            '"Environment Design"[mh] OR "dementia friendly"[tiab] OR "dementia friendliness"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Livskvalitet",
          en: "Quality of life",
        },
        ordering: {
          dk: 25,
          en: 25
        },
        searchStrings: {
          narrow: [
            '"Quality of Life"[majr]'
          ],
          normal: [
            '"Quality of Life"[mh] OR "quality of life"[ti] OR QoL[ti]'
          ],
          broad: [
            '"Quality of Life"[mh] OR "quality of life"[tiab] OR QoL[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Psykosocial",
          en: "Psychosocial",
        },
        ordering: {
          dk: 26,
          en: 26
        },
        searchStrings: {
          narrow: [
            '"Psychosocial Support Systems"[majr]'
          ],
          normal: [
            '"Psychosocial Support Systems"[mh] OR psychosocial[ti]'
          ],
          broad: [
            '"Psychosocial Support Systems"[mh] OR psychosocial[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Rehabilitering",
          en: "Rehabilitation",
        },
        ordering: {
          dk: 27,
          en: 27
        },
        searchStrings: {
          narrow: [
            '"Rehabilitation"[majr]'
          ],
          normal: [
            '"Rehabilitation"[mh] OR rehabilitation[ti] OR rehabilitative[ti]'
          ],
          broad: [
            '"Rehabilitation"[mh] OR rehabilitation[tiab] OR rehabilitative[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Fysisk træning",
          en: "Physical training",
        },
        ordering: {
          dk: 28,
          en: 28
        },
        searchStrings: {
          narrow: [
            '"Exercise Therapy"[majr]'
          ],
          normal: [
            '"Exercise Therapy"[mh] OR "physical training"[ti] OR "exercise training"[ti]'
          ],
          broad: [
            '"Exercise Therapy"[mh] OR "physical training"[tiab] OR "exercise training"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Reminiscens",
          en: "Reminiscence",
        },
        ordering: {
          dk: 29,
          en: 29
        },
        searchStrings: {
          narrow: [
            '"Reminiscence Therapy"[majr]'
          ],
          normal: [
            '"Reminiscence Therapy"[mh] OR reminiscence[ti]'
          ],
          broad: [
            '"Reminiscence Therapy"[mh] OR reminiscence[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Sansestimulering",
          en: "Sensory stimulation",
        },
        ordering: {
          dk: 30,
          en: 30
        },
        searchStrings: {
          narrow: [
            '"Sensory Stimulation"[majr]'
          ],
          normal: [
            '"Sensory Stimulation"[mh] OR "sensory stimulation"[ti]'
          ],
          broad: [
            '"Sensory Stimulation"[mh] OR "sensory stimulation"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Personcentreret",
          en: "Person-centered",
        },
        ordering: {
          dk: 31,
          en: 31
        },
        searchStrings: {
          narrow: [
            '"Patient-Centered Care"[majr]'
          ],
          normal: [
            '"Patient-Centered Care"[mh] OR "person centered"[ti] OR "person-centered"[ti] OR "patient centered"[ti] OR "patient-centered"[ti]'
          ],
          broad: [
            '"Patient-Centered Care"[mh] OR "person centered"[tiab] OR "person-centered"[tiab] OR "patient centered"[tiab] OR "patient-centered"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Pleje og omsorg",
          en: "Care and nursing",
        },
        ordering: {
          dk: 32,
          en: 32
        },
        searchStrings: {
          narrow: [
            '"Nursing Care"[majr]'
          ],
          normal: [
            '"Nursing Care"[mh] OR "nursing care"[ti] OR "patient care"[ti]'
          ],
          broad: [
            '"Nursing Care"[mh] OR "nursing care"[tiab] OR "patient care"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Dementia care mapping",
          en: "Dementia care mapping",
        },
        ordering: {
          dk: 33,
          en: 33
        },
        searchStrings: {
          narrow: [
            '"Dementia/nursing"[majr]'
          ],
          normal: [
            '"Dementia/nursing"[mh] OR "dementia care mapping"[ti] OR DCM[ti]'
          ],
          broad: [
            '"Dementia/nursing"[mh] OR "dementia care mapping"[tiab] OR DCM[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Kognitiv træning",
          en: "Cognitive training",
        },
        ordering: {
          dk: 34,
          en: 34
        },
        searchStrings: {
          narrow: [
            '"Cognitive Therapy"[majr]'
          ],
          normal: [
            '"Cognitive Therapy"[mh] OR "cognitive training"[ti]'
          ],
          broad: [
            '"Cognitive Therapy"[mh] OR "cognitive training"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Kognitiv rehabilitering",
          en: "Cognitive rehabilitation",
        },
        ordering: {
          dk: 35,
          en: 35
        },
        searchStrings: {
          narrow: [
            '"Cognitive Remediation"[majr]'
          ],
          normal: [
            '"Cognitive Remediation"[mh] OR "cognitive rehabilitation"[ti]'
          ],
          broad: [
            '"Cognitive Remediation"[mh] OR "cognitive rehabilitation"[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Kognitiv stimulationsterapi/CST",
          en: "Cognitive stimulation therapy/CST",
        },
        ordering: {
          dk: 36,
          en: 36
        },
        searchStrings: {
          narrow: [
            '"Cognitive Therapy"[majr]'
          ],
          normal: [
            '"Cognitive Therapy"[mh] OR "cognitive stimulation therapy"[ti] OR CST[ti]'
          ],
          broad: [
            '"Cognitive Therapy"[mh] OR "cognitive stimulation therapy"[tiab] OR CST[tiab]'
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
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Musik",
          en: "Music",
        },
        ordering: {
          dk: 37,
          en: 37
        },
        searchStrings: {
          narrow: [
            '"Music Therapy"[majr]'
          ],
          normal: [
            '"Music Therapy"[mh] OR "music therapy"[ti] OR music[ti]'
          ],
          broad: [
            '"Music Therapy"[mh] OR "music therapy"[tiab] OR music[tiab]'
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
        name: "S60570",
        buttons: true,
        id: "S60570",
        subtopiclevel: 1,
        maintopicIdLevel1: "S60400",
        translations: {
          dk: "Marte Meo",
          en: "Marte Meo",
        },
        ordering: {
          dk: 38,
          en: 38
        },
        searchStrings: {
          narrow: [
            '"Video Recording/methods"[majr]'
          ],
          normal: [
            '"Video Recording/methods"[mh] OR "marte meo"[ti]'
          ],
          broad: [
            '"Video Recording/methods"[mh] OR "marte meo"[tiab]'
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
    ]
  },
  {
    groupname: "Specific groups",
    id: "S70",
    translations: {
      dk: "Specifikke grupper",
      en: "Specific groups",
    },
    ordering: {
      dk: 7,
      en: 7
    },
    groups: [
      {
        name: "S70100",
        buttons: true,
        id: "S70100",
        translations: {
          dk: "Pårørende / Omsorgsgiver",
          en: "Relatives / Caregiver",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Caregivers"[majr]'
          ],
          normal: [
            '"Caregivers"[mh] OR caregiver*[ti] OR "care giver"[ti] OR "care givers"[ti] OR relative*[ti]'
          ],
          broad: [
            '"Caregivers"[mh] OR caregiver*[tiab] OR "care giver"[tiab] OR "care givers"[tiab] OR relative*[tiab]'
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
        name: "S70200",
        buttons: true,
        id: "S70200",
        translations: {
          dk: "Udviklingshæmning",
          en: "Intellectual disability",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Intellectual Disability"[majr]'
          ],
          normal: [
            '"Intellectual Disability"[mh] OR "intellectual disability"[ti] OR "intellectual disabilities"[ti] OR "mentally disabled"[ti]'
          ],
          broad: [
            '"Intellectual Disability"[mh] OR "intellectual disability"[tiab] OR "intellectual disabilities"[tiab] OR "mentally disabled"[tiab]'
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
        name: "S70300",
        buttons: true,
        id: "S70300",
        translations: {
          dk: "Downs syndrom",
          en: "Down syndrome",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Down Syndrome"[majr]'
          ],
          normal: [
            '"Down Syndrome"[mh] OR "down syndrome"[ti] OR "downs syndrome"[ti] OR trisomy21[ti]'
          ],
          broad: [
            '"Down Syndrome"[mh] OR "down syndrome"[tiab] OR "downs syndrome"[tiab] OR trisomy21[tiab]'
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
        name: "S70400",
        buttons: true,
        id: "S70400",
        translations: {
          dk: "Etnisk minoritet",
          en: "Ethnic minority",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Minority Groups"[majr] OR "Ethnic Groups"[majr]'
          ],
          normal: [
            '"Minority Groups"[mh] OR "Ethnic Groups"[mh] OR "ethnic minority"[ti] OR "ethnic minorities"[ti]'
          ],
          broad: [
            '"Minority Groups"[mh] OR "Ethnic Groups"[mh] OR "ethnic minority"[tiab] OR "ethnic minorities"[tiab]'
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
        name: "S70500",
        buttons: true,
        id: "S70500",
        translations: {
          dk: "Tværkulturel / multikulturel",
          en: "Cross-cultural / multicultural",
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Cultural Diversity"[majr] OR "Cross-Cultural Comparison"[majr]'
          ],
          normal: [
            '"Cultural Diversity"[mh] OR "Cross-Cultural Comparison"[mh] OR "cross cultural"[ti] OR "cross-cultural"[ti] OR multicultural[ti] OR "multi cultural"[ti] OR "multi-cultural"[ti]'
          ],
          broad: [
            '"Cultural Diversity"[mh] OR "Cross-Cultural Comparison"[mh] OR "cross cultural"[tiab] OR "cross-cultural"[tiab] OR multicultural[tiab] OR "multi cultural"[tiab] OR "multi-cultural"[tiab]'
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
    ]
  }
];
