/**
 * Represents a topic category (e.g. "Skabelonkategori", "Diabetestype").
 *
 * @typedef {Object} Topic
 * @property {string} id - Unique identifier for the category.
 * @property {string} groupname - Internal group name (used as CSS class).
 * @property {Object} translations - Display names per language ({ dk, en }).
 * @property {Object} ordering - Sort order per language ({ dk: number, en: number }).
 * @property {Array<SubGroup>} groups - Items in this category (nested tree structure).
 */

/**
 * Represents an item within a topic category.
 *
 * Items use a nested tree structure via the `children` property (unlimited depth).
 * At runtime, `flattenTopicGroups()` (in topicLoaderMixin.js) converts the tree
 * into a flat array and auto-generates all hierarchy metadata needed by the UI.
 *
 * @typedef {Object} SubGroup
 * @property {string} id - Unique identifier for the item.
 * @property {string} name - Internal name (used as CSS class for search-string toggle).
 * @property {boolean} buttons - Whether scope buttons are used.
 * @property {Object} translations - Display names per language ({ dk, en }).
 * @property {Object} [ordering] - Optional manual sort order. If omitted, auto-generated.
 * @property {Array<SubGroup>} [children] - Nested child items (unlimited depth).
 * @property {Object} [searchStrings] - Search strings per scope ({ narrow, normal, broad }).
 *     Each scope is a string or array of strings.
 * @property {Object} [searchStringComment] - Comments per language ({ dk, en }).
 * @property {Object} [tooltip] - Tooltip text per language ({ dk, en }).
 */
/** @type {Array<Topic>} */

export const standardString = {
  narrow: '"Dementia"[majr]',
  normal: '"Dementia"[mh] OR alzheimer*[ti] OR cadasil[ti] OR creutzfeldt-jakob*[ti] OR dementia[ti] OR huntington*[ti] OR lewy body[ti] OR "mild cognitive impairment"[ti] OR parkinson*[ti] OR "primary progressive aphasia"[ti:~3] OR prion disease*[ti]',
  broad: '"Dementia"[mh] OR alzheimer*[tiab] OR cadasil[tiab] OR creutzfeldt-jakob*[tiab] OR dementia[tiab] OR huntington*[tiab] OR lewy body[tiab] OR "mild cognitive impairment"[tiab] OR parkinson*[tiab] OR "primary progressive aphasia"[tiab:~3] OR prion disease*[tiab]',
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
        children: [
          {
            id: "S000020010",
            name: "S000020010",
            buttons: true,
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
            children: [
              {
                id: "S000020010010",
                name: "S000020010010",
                buttons: true,
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
            ],
          },
          {
            id: "S000020020",
            name: "S000020020",
            buttons: true,
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
        ],
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
    groupname: "S010",
    id: "S010",
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
        name: "S010010",
        id: "S010010",
        buttons: true,
        translations: {
          dk: "Alle demenssygdomme",
          en: "All dementia disorders",
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
            standardString['normal']
          ],
          broad: [
            standardString['broad']
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
        name: "S010020",
        id: "S010020",
        buttons: true,
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
            '"Alzheimer Disease"[mh] OR alzheimer*[ti]'
          ],
          broad: [
            '"Alzheimer Disease"[mh] OR alzheimer*[tiab]'
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
        name: "S010030",
        id: "S010030",
        buttons: true,
        translations: {
          dk: "Creutzfeldt-Jakob sygdom",
          en: "Creutzfeldt-Jakob syndrome",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Creutzfeldt-Jakob Syndrome"[majr]'
          ],
          normal: [
            '"Creutzfeldt-Jakob Syndrome"[mh] OR creutzfeldt-jakob*[ti]'
          ],
          broad: [
            '"Creutzfeldt-Jakob Syndrome"[mh] OR creutzfeldt-jakob*[tiab]'
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
        name: "S010040",
        id: "S010040",
        buttons: true,
        translations: {
          dk: "Vaskulær demens",
          en: "Vascular dementia",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        tooltip: {
          dk: "",
          en: "",
        },
        children: [
          {
            name: "S010040010",
            id: "S010040010",
            buttons: true,
            translations: {
              dk: "Vaskulær demens (alle typer)",
              en: "Vascular dementia (all types)",
            },
            ordering: {
              dk: 4,
              en: 4
            },
            searchStrings: {
              narrow: [
                '"Dementia, Vascular"[majr]'
              ],
              normal: [
                '"Dementia, Vascular"[mh] OR vascular dementia[ti]'
              ],
              broad: [
                '"Dementia, Vascular"[mh] OR vascular dementia[tiab]'
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
            name: "S010040020",
            id: "S010040020",
            buttons: true,
            translations: {
              dk: "CADASIL",
              en: "CADASIL",
            },
            ordering: {
              dk: 5,
              en: 5
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
            name: "S010040030",
            id: "S010040030",
            buttons: true,
            translations: {
              dk: "Multiinfarkt demens",
              en: "Multiinfarct dementia",
            },
            ordering: {
              dk: 6,
              en: 6
            },
            searchStrings: {
              narrow: [
                '"Dementia, Multi-infarct"[majr]'
              ],
              normal: [
                '"Dementia, Multi-infarct"[mh] OR multiinfarct dementia[ti] OR multi-infarct dementia[ti]'
              ],
              broad: [
                '"Dementia, Multi-infarct"[mh] OR multiinfarct dementia[tiab] OR multi-infarct dementia[tiab]'
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
        name: "S010050",
        id: "S010050",
        buttons: true,
        translations: {
          dk: "Frontotemporal demens",
          en: "Frontotemporal dementia",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStringComment: {
          dk: "",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
        children: [
          {
            name: "S010050010",
            id: "S010050010",
            buttons: true,
            translations: {
              dk: "Frontotemporal demens (alle typer)",
              en: "Frontotemporal dementia (all types)",
            },
            ordering: {
              dk: 8,
              en: 8
            },
            searchStrings: {
              narrow: [
                '"Frontotemporal Dementia"[majr]'
              ],
              normal: [
                '"Frontotemporal Dementia"[mh] OR frontotemporal dementia[ti] OR fronto-temporal dementia[ti] '
              ],
              broad: [
                '"Frontotemporal Dementia"[mh] OR frontotemporal dementia[tiab] OR fronto-temporal dementia[tiab]'
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
            name: "S010050020",
            id: "S010050020",
            buttons: true,
            translations: {
              dk: "Primær progressiv afasi",
              en: "Primary progressive aphasia",
            },
            ordering: {
              dk: 9,
              en: 9
            },
            searchStrings: {
              narrow: [
                '("Aphasia, Primary Progressive"[majr] NOT "Primary Progressive Nonfluent Aphasia"[mh])'
              ],
              normal: [
                '("Aphasia, Primary Progressive"[mh] NOT "Primary Progressive Nonfluent Aphasia"[mh]) OR primary progressive aphasia[ti]'
              ],
              broad: [
                '("Aphasia, Primary Progressive"[mh] NOT "Primary Progressive Nonfluent Aphasia"[mh]) OR primary progressive aphasia[tiab]'
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
            name: "S010050030",
            id: "S010050030",
            buttons: true,
            translations: {
              dk: "Primær progressiv ikke-flydende afasi",
              en: "Primary progressive nonfluent aphasia",
            },
            ordering: {
              dk: 10,
              en: 10
            },
            searchStrings: {
              narrow: [
                '"Primary Progressive Nonfluent Aphasia"[majr]'
              ],
              normal: [
                '"Primary Progressive Nonfluent Aphasia"[mh] OR primary progressive nonfluent aphasia[ti]'
              ],
              broad: [
                '"Primary Progressive Nonfluent Aphasia"[mh] OR primary progressive nonfluent aphasia[tiab]'
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
        name: "S010060",
        id: "S010060",
        buttons: true,
        translations: {
          dk: "Huntingtons sygdom",
          en: "Huntington's disease",
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Huntington Disease"[majr]'
          ],
          normal: [
            '"Huntington Disease"[mh] OR huntington*[ti]'
          ],
          broad: [
            '"Huntington Disease"[mh] OR huntington*[tiab]'
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
        name: "S010070",
        id: "S010070",
        buttons: true,
        translations: {
          dk: "Lewy body-demens",
          en: "Lewy body dementia",
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            '"Lewy Body Disease"[majr]'
          ],
          normal: [
            '"Lewy Body Disease"[mh] OR lewy body*[ti]'
          ],
          broad: [
            '"Lewy Body Disease"[mh] OR lewy body*[tiab]'
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
        name: "S010080",
        id: "S010080",
        buttons: true,
        translations: {
          dk: "Mixed demens",
          en: "Mixed dementia",
        },
        ordering: {
          dk: 13,
          en: 13
        },
        searchStrings: {
          narrow: [
            '"Mixed Dementias"[majr]'
          ],
          normal: [
            '"Mixed Dementias"[mh] OR mixed dementia*[ti]'
          ],
          broad: [
            '"Mixed Dementias"[mh] OR mixed dementia*[tiab]'
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
    groupname: "S020",
    id: "S020",
    translations: {
      dk: "Kognitive symptomer og domæner",
      en: "Cognitive symptoms and domains",
    },
    ordering: {
      dk: 2,
      en: 2
    },
    groups: [
      {
        name: "S020010",
        id: "S020010",
        buttons: true,
        translations: {
          dk: "Alle kognitive symptomer og domæner",
          en: "All cognitive symptoms and domains",
        },
        ordering: {
          dk: 0,
          en: 0
        },
        searchStrings: {
          narrow: [
            '"Cognition"[majr] OR "Language"[majr] OR "Attention"[majr] OR visual[ti] OR "Spatial memory"[majr] OR cognitive[ti]'
          ],
          normal: [
            '"Cognition"[mh] OR "Language"[mh] OR "Attention"[mh] OR visual[ti] OR "Spatial memory"[mh] OR cognitive[ti]'
          ],
          broad: [
            '"Cognition"[mh] OR "Language"[mh] OR "Attention"[mh] OR visual[tiab] OR "Spatial memory"[mh] OR cognitive[tiab]'
          ],
        },
        searchStringComment: {
          dk: "Ole: Har endnu ikke tilføjet søgeord for resten af de underliggende emner, da jeg ikke er sikker på relevansen af alle de angivne MeSH-termer.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S020020",
        id: "S020020",
        buttons: true,
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
            '"Aphasia"[mh] OR aphasia*[ti]'
          ],
          broad: [
            '"Aphasia"[mh] OR aphasia*[tiab]'
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
        name: "S020030",
        id: "S020030",
        buttons: true,
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
            '"Agnosia"[mh] OR agnosia*[ti]'
          ],
          broad: [
            '"Agnosia"[mh] OR agnosia*[tiab]'
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
        name: "S020040",
        id: "S020040",
        buttons: true,
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
            '"Amnesia"[mh] OR amnesia*[ti]'
          ],
          broad: [
            '"Amnesia"[mh] OR amnesia*[tiab]'
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
        name: "S020050",
        id: "S020050",
        buttons: true,
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
            '"Agnosia"[mh] AND anosognosia*[ti]'
          ],
          normal: [
            'anosognosia*[ti]'
          ],
          broad: [
            'anosognosia*[tiab]'
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
        name: "S020060",
        id: "S020060",
        buttons: true,
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
            '"Apraxias"[mh] OR apraxi*[ti]'
          ],
          broad: [
            '"Apraxias"[mh] OR apraxi*[tiab]'
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
        name: "S020070",
        id: "S020070",
        buttons: true,
        translations: {
          dk: "Eksekutiv funktion",
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
            '"Executive Function"[mh] OR executive function*[ti]'
          ],
          broad: [
            '"Executive Function"[mh] OR executive function*[tiab]'
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
        name: "S020080",
        id: "S020080",
        buttons: true,
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
            '"Memory, Episodic"[mh] OR episodic memory[ti]'
          ],
          broad: [
            '"Memory, Episodic"[mh] OR episodic memory[tiab]'
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
        name: "S020090",
        id: "S020090",
        buttons: true,
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
            '"Memory"[majr] AND "Semantics"[majr] AND semantic[ti]'
          ],
          normal: [
            '"Memory"[mh] AND ("Semantics"[mh] OR semantic[ti])'
          ],
          broad: [
            '"Memory"[mh] AND ("Semantics"[mh] OR semantic[tiab])'
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
    ]
  },
  {
    groupname: "S030",
    id: "S030",
    translations: {
    dk: "Psykiske og adfærdsmæssige symptomer",
    en: "Psychological and behavioral symptoms",
    },
    ordering: {
      dk: 3,
      en: 3
    },
    groups: [
      {
        name: "S030010",
        id: "S030010",
        buttons: true,
        translations: {
          dk: "Alle psykiske og adfærdsmæssige symptomer",
          en: "All psychological and behavioral symptoms",
        },
        ordering: {
          dk: 0,
          en: 0
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "Ole: Har endnu ikke tilføjet søgeord for resten af de underliggende emner, da jeg ikke er sikker på relevansen af alle de angivne MeSH-termer.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S030020",
        id: "S030020",
        buttons: true,
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
            '"Aggression"[mh] OR aggression[ti]'
          ],
          broad: [
            '"Aggression"[mh] OR aggression[tiab]'
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
        name: "S030030",
        id: "S030030",
        buttons: true,
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
            '"Psychomotor Agitation"[mh] OR agitation[ti]'
          ],
          broad: [
            '"Psychomotor Agitation"[mh] OR agitation[tiab]'
          ],
        },
        searchStringComment: {
          dk: "Ole: I stedet for 'agitation[ti]/[tiab]' har jeg valgt MeSH-termen \"Psychomotor agitation\"[mh]. Er det mon korrekt?",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S030040",
        id: "S030040",
        buttons: true,
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
            '"Anxiety"[mh] OR anxiety[ti]'
          ],
          broad: [
            '"Anxiety"[mh] OR anxiety[tiab]'
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
        name: "S030050",
        id: "S030050",
        buttons: true,
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
            '"Apathy"[mh] OR apathy[ti]'
          ],
          broad: [
            '"Apathy"[mh] OR apathy[tiab]'
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
        name: "S030060",
        id: "S030060",
        buttons: true,
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
            '"Delirium"[mh] OR delirium[ti]'
          ],
          broad: [
            '"Delirium"[mh] OR delirium[tiab]'
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
        name: "S030070",
        id: "S030070",
        buttons: true,
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
            '"Depression"[mh] OR depressi*[ti]'
          ],
          broad: [
            '"Depression"[mh] OR depressi*[tiab]'
          ],
        },
        searchStringComment: {
          dk: "Ole: Bemærk forskellen mellem MeSH-termerne <a href=\"https://www.ncbi.nlm.nih.gov/mesh/68003863\" target=\"_blank\">\"Depression\"[mh]</a> og <a href=\"https://www.ncbi.nlm.nih.gov/mesh/68003866\" target=\"_blank\">\"Depressive Disorder\"[mh]</a>. Er den korrekt MeSH-term valgt?",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "S030080",
        id: "S030080",
        buttons: true,
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
            '"Hallucinations"[mh] OR hallucination*[ti]'
          ],
          broad: [
            '"Hallucinations"[mh] OR hallucination*[tiab]'
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
        name: "S030090",
        id: "S030090",
        buttons: true,
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
            '"Sleep Wake Disorders"[mh] OR sleep disorder*[ti] OR sleep disturbance*[ti]'
          ],
          broad: [
            '"Sleep Wake Disorders"[mh] OR sleep disorder*[tiab] OR sleep disturbance*[tiab]'
          ],
        },
        searchStringComment: {
          dk: "Ole: Bør andre søgeord som dyssomnia og parasomnia også være inkluderes?",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        name: "S030100",
        id: "S030100",
        buttons: true,
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
            '"Delusions"[mh] OR delusion*[ti]'
          ],
          broad: [
            '"Delusions"[mh] OR delusion*[tiab]'
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
    ]
  },
  {
    groupname: "S040",
    id: "S040",
    translations: {
      dk: "Udredning",
      en: "Diagnosis",
    },
    ordering: {
      dk: 4,
      en: 4
    },
    groups: [
      {
        name: "S040010", 
        id: "S040010",
        buttons: true,
        translations: {
          dk: "Udredning generelt",
          en: "Diagnosis in general",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Diagnosis"[majr]'
          ],
          normal: [
            '"Diagnosis"[mh] OR diagnos*[ti] OR medical history taking*[ti] OR anamnesis*[ti]'
          ],
          broad: [
            '"Diagnosis"[mh] OR diagnos*[tiab] OR medical history taking*[tiab] OR anamnesis*[tiab]'
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
        name: "S040020",
        id: "S040020",
        buttons: true,
        translations: {
          dk: "Diagnosekriterier",
          en: "Diagnostic criteria",
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Diagnosis"[mh] AND diagnostic criteri*[ti]'
          ],
          normal: [
            'diagnostic criteri*[ti]'
          ],
          broad: [
            'diagnostic criteri*[tiab]'
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
        name: "S040030",
        id: "S040030",
        buttons: true,
        translations: {
          dk: "Amyloid-scanning",
          en: "Amyloid scan",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '(("Amyloid"[majr] OR "Amyloid beta-Peptides"[majr]) AND scan*[ti]) OR "amyloid scanning"[ti:~3]'
          ],
          normal: [
            '(("Amyloid"[mh] OR "Amyloid beta-Peptides"[mh]) AND scan*[ti]) OR "amyloid scanning"[ti:~3]'  
          ],
          broad: [
            '(("Amyloid"[mh] OR "Amyloid beta-Peptides"[mh]) AND scan*[tiab]) OR "amyloid scanning"[tiab:~3]'
          ]
        },
        searchStringComment: {
          dk: "Ole: Søgningen skal tjekkes. Er \"amyloid scanning\"[ti:~3] mon tilstrækkeligt?",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: "S040040",
        id: "S040040",
        buttons: true,
        translations: {
          dk: "DAT-scanning",
          en: "DAT scan",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            'dopamine transporter scan*[ti] OR DAT scan*[ti]'
          ],
          normal: [
            'dopamine transporter scan*[ti] OR DAT scan*[ti]'
          ],
          broad: [
            'dopamine transporter scan*[tiab] OR DAT scan*[tiab]'
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
        name: "S040050",
        id: "S040050",
        buttons: true,
        translations: {
          dk: "PET-scanning",
          en: "PET scanning",
        },
        ordering: {
          dk: 5,
          en: 5
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
        name: "S040060",
        id: "S040060",
        buttons: true,
        translations: {
          dk: "SPECT-scanning",
          en: "SPECT scan",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Tomography, Emission-Computed, Single-Photon"[majr]'
          ],
          normal: [
            '"Tomography, Emission-Computed, Single-Photon"[mh] OR "single photon emission computed tomography"[ti] OR SPECT scan*[ti]'
          ],
          broad: [
            '"Tomography, Emission-Computed, Single-Photon"[mh] OR "single photon emission computed tomography"[tiab] OR SPECT scan*[tiab]'
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
        name: "S040070",
        id: "S040070",
        buttons: true,
        translations: {
          dk: "Billeddiagnostik",
          en: "Diagnostic imaging",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Diagnostic Imaging"[majr]'
          ],
          normal: [
            '"Diagnostic Imaging"[mh] OR diagnostic imag*[ti]'
          ],
          broad: [
            '"Diagnostic Imaging"[mh] OR diagnostic imag*[tiab]'
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
        name: "S040080",
        id: "S040080",
        buttons: true,
        translations: {
          dk: "EEG",
          en: "EEG",
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '"Electroencephalography"[majr]'
          ],
          normal: [
            '"Electroencephalography"[mh] OR eeg[ti] OR electroencephalogra*[ti]'
          ],
          broad: [
            '"Electroencephalography"[mh] OR eeg[tiab] OR electroencephalogra*[tiab]'
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
        name: "S040090",
        id: "S040090",
        buttons: true,
        translations: {
          dk: "ADL-vurdering",
          en: "ADL assessment",
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
            '"Activities of Daily Living"[mh] OR adl[ti] OR "activities of daily living"[ti]'
          ],
          broad: [
            '"Activities of Daily Living"[mh] OR adl[tiab] OR "activities of daily living"[tiab]'
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
        name: "S040100",
        id: "S040100",
        buttons: true,
        translations: {
          dk: "IADL-vurdering",
          en: "IADL assessment",
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            'instrumental activities of daily living[ti] OR iadl[ti]'
          ],
          normal: [
            'instrumental activities of daily living[ti] OR iadl[ti]'
          ],
          broad: [
            'instrumental activities of daily living[tiab] OR iadl[tiab]'
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
        name: "S040110",
        id: "S040110",
        buttons: true,
        translations: {
          dk: "Kognitive test",
          en: "Cognitive tests",
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"Mental Status and Dementia Tests"[majr] OR brief assessment of impaired cognition[ti] OR clock test*[ti] OR cognitive test*[ti] OR mini mental state examination[ti]'
          ],
          normal: [
            '"Mental Status and Dementia Tests"[mh] OR brief assessment of impaired cognition[ti] OR clock test*[ti] OR cognitive test*[ti] OR mini mental state examination[ti]'
          ],
          broad: [
            '"Mental Status and Dementia Tests"[mh] OR brief assessment of impaired cognition[tiab] OR clock test*[tiab] OR cognitive test*[tiab] OR mini mental state examination[tiab]'
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
        name: "S040120",
        id: "S040120",
        buttons: true,
        translations: {
          dk: "Lumbalpunktur",
          en: "Lumbar puncture",
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            '"Spinal Puncture"[majr]'
          ],
          normal: [
            '"Spinal Puncture"[mh] OR "spinal puncture"[ti] OR "lumbar puncture"[ti]'
          ],
          broad: [
            '"Spinal Puncture"[mh] OR "spinal puncture"[tiab] OR "lumbar puncture"[tiab]'
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
        name: "S040130",
        id: "S040130",
        buttons: true,
        translations: {
          dk: "Neuropsykologisk undersøgelse",
          en: "Neuropsychological examination",
        },
        ordering: {
          dk: 13,
          en: 13
        },
        searchStrings: {
          narrow: [
            '"Neuropsychological Tests"[majr]'
          ],
          normal: [
            '"Neuropsychological Tests"[mh] OR neuropsychological test*[ti]'
          ],
          broad: [
            '"Neuropsychological Tests"[mh] OR neuropsychological test*[tiab]'
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
    groupname: "S050",
    id: "S050",
    translations: {
      dk: "Behandling",
      en: "Treatment",
    },
    ordering: {
      dk: 5,
      en: 5
    },
    groups: [
      {
        name: "S050010",
        id: "S050010",
        buttons: true,
        translations: {
          dk: "Behandling generelt",
          en: "Treatment in general",
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
        name: "S050020",
        id: "S050020",
        buttons: true,
        translations: {
          dk: "Non-farmakologisk behandling",
          en: "Non-pharmacological treatment",
        },
        ordering: {
          dk: 2,
          en: 2
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
        name: "S050030",
        id: "S050030",
        buttons: true,
        translations: {
          dk: "Medicinsk behandling",
          en: "Medical treatment",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        },
        children: [
          {
            name: "S050030010",
            id: "S050030010",
            buttons: true,
            translations: {
              dk: "Medicinsk behandling generelt",
              en: "Medical treatment in general",
            },
            ordering: {
              dk: 4,
              en: 4
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
            name: "S050030020",
            id: "S050030020",
            buttons: false,
            translations: {
              dk: "Demensmedicin",
              en: "Dementia medication",
            },
            ordering: {
              dk: 5,
              en: 5
            },
            searchStringComment: {
              dk: "",
              en: ""
            },
            tooltip: {
              dk: "",
              en: ""
            },
            children: [
              {
                name: "S050030020010",
                id: "S050030020010",
                buttons: true,
                translations: {
                  dk: "Demensmedicin generelt",
                  en: "Dementia medication in general",
                },
                ordering: {
                  dk: 6,
                  en: 6
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
                name: "S050030020020",
                id: "S050030020020",
                buttons: true,
                translations: {
                  dk: "Kolinesterasehæmmer",
                  en: "Cholinesterase inhibitor",
                },
                ordering: {
                  dk: 7,
                  en: 7
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
                name: "S050030020030",
                id: "S050030020030",
                buttons: true,
                translations: {
                  dk: "Memantin",
                  en: "Memantine",
                },
                ordering: {
                  dk: 8,
                  en: 8
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
            ],
          },
          {
            name: "S050030030",
            id: "S050030030",
            buttons: true,
            translations: {
              dk: "Psykofarmaka",
              en: "Psychopharmaca",
            },
            ordering: {
              dk: 9,
              en: 9
            },
            searchStringComment: {
              dk: "",
              en: ""
            },
            tooltip: {
              dk: "",
              en: ""
            },
            children: [
              {
                name: "S050030030010",
                id: "S050030030010",
                buttons: true,
                translations: {
                  dk: "Psykofarmaka generelt",
                  en: "Psychopharmaca in general",
                },
                ordering: {
                  dk: 10,
                  en: 10
                },
                searchStrings: {
                  narrow: [
                    '"Psychotropic Drugs"[majr]'
                  ],
                  normal: [
                    '"Psychotropic Drugs"[mh] OR "psychotropic drug"[ti] OR "psychotropic drugs"[ti]'
                  ],
                  broad: [
                    '"Psychotropic Drugs"[mh] OR "psychotropic drug"[tiab] OR "psychotropic drugs"[tiab]'
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
                name: "S050030030020",
                id: "S050030030020",
                buttons: true,
                translations: {
                  dk: "Antidepressiv medicin",
                  en: "Antidepressant medication",
                },
                ordering: {
                  dk: 11,
                  en: 11
                },
                searchStrings: {
                  narrow: [
                    '"Antidepressants"[majr]'
                  ],
                  normal: [
                    '"Antidepressants"[mh] OR "antidepressant"[ti] OR "antidepressants"[ti]'
                  ],
                  broad: [
                    '"Antidepressants"[mh] OR "antidepressant"[tiab] OR "antidepressants"[tiab]'
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
                name: "S050030030030",
                id: "S050030030030",
                buttons: true,
                translations: {
                  dk: "Antipsykotisk medicin",
                  en: "Antipsychotic medication",
                },
                ordering: {
                  dk: 12,
                  en: 12
                },
                searchStrings: {
                  narrow: [
                    '"Antipsychotics"[majr]'
                  ],
                  normal: [
                    '"Antipsychotics"[mh] OR "antipsychotic"[ti] OR "antipsychotics"[ti]'
                  ],
                  broad: [
                    '"Antipsychotics"[mh] OR "antipsychotic"[tiab] OR "antipsychotics"[tiab]'
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
                name: "S050030030040",
                id: "S050030030040",
                buttons: true,
                translations: {
                  dk: "Angstdæmpende medicin",
                  en: "Anxiolytic medication",
                },
                ordering: {
                  dk: 13,
                  en: 13
                },
                searchStrings: {
                  narrow: [
                    '"Anxiolytics"[majr]'
                  ],
                  normal: [
                    '"Anxiolytics"[mh] OR "anxiolytic"[ti] OR "anxiolytics"[ti]'
                  ],
                  broad: [
                    '"Anxiolytics"[mh] OR "anxiolytic"[tiab] OR "anxiolytics"[tiab]'
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
          }
        ],
      }
    ]
  },
  {
    groupname: "S060",
    id: "S060",
    translations: {
      dk: "Epidemiologi",
      en: "Epidemiology",
    },
    ordering: {
      dk: 6,
      en: 6
    },
    groups: [
      {
        name: "S060010",
        id: "S060010",
        buttons: true,
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
        name: "S060020",
        id: "S060020",
        buttons: true,
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
        name: "S060030",
        id: "S060030",
        buttons: true,
        translations: {
          dk: "Mortalitet",
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
        name: "S060040",
        id: "S060040",
        buttons: true,
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
        name: "S060050",
        id: "S060050",
        buttons: true,
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
        name: "S060060",
        id: "S060060",
        buttons: true,
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
    groupname: "S070",
    id: "S070",
    translations: {
      dk: "Risikofaktorer og forebyggelse",
      en: "Risk factors and prevention",
    },
    ordering: {
      dk: 7,
      en: 7
    },
    groups: [
      {
        name: "S070010",
        id: "S070010",
        buttons: true,
        translations: {
          dk: "Risikofaktorer og forebyggelse generelt",
          en: "Risk factors and prevention in general",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Risk Factors"[majr]'
          ],
          normal: [
            '"Risk Factors"[mh] OR risk factor[ti] OR risk factors[ti]'
          ],
          broad: [
            '"Risk Factors"[mh] OR risk factor[tiab] OR risk factors[tiab]'
          ]
        }
      },
      {
        name: "S070020",
        id: "S070020",
        buttons: true,
        translations: {
          dk: "Fysisk helbred",
          en: "Physical health",
        },
        ordering: {
          dk: 1,
          en: 1
        },
        children: [
          {
            name: "S070020010",
            id: "S070020010",
            buttons: true,
            translations: {
              dk: "Fysisk helbred generelt",
              en: "Physical health in general",
            },
            ordering: {
              dk: 2,
              en: 2
            },
            searchStrings: {
              narrow: [
                '"Physical Health"[majr]'
              ],
              normal: [
                '"Physical Health"[mh] OR physical health[ti]'
              ],
              broad: [
                '"Physical Health"[mh] OR physical health[tiab]'
              ]
            }
          },
          {
            name: "S070020020",
            id: "S070020020",
            buttons: true,
            translations: {
              dk: "Diabetes",
              en: "Diabetes",
            },
            ordering: {
              dk: 3,
              en: 3
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
            name: "S070020030",
            id: "S070020030",
            buttons: true,
            translations: {
              dk: "Blodtryk/hypertension",
              en: "Blood pressure/hypertension",
            },
            ordering: {
              dk: 4,
              en: 4
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
            name: "S070020040",
            id: "S070020040",
            buttons: true,
            translations: {
              dk: "Kolesterol",
              en: "Cholesterol",
            },
            ordering: {
              dk: 5,
              en: 5
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
            name: "S070020050",
            id: "S070020050",
            buttons: true,
            translations: {
              dk: "Overvægt/fedme",
              en: "Overweight/obesity",
            },
            ordering: {
              dk: 6,
              en: 6
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
            name: "S070020060",
            id: "S070020060",
            buttons: true,
            translations: {
              dk: "Komorbiditet/multisygdom",
              en: "Comorbidity/multiple diseases",
            },
            ordering: {
              dk: 7,
              en: 7
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
            name: "S070020070",
            id: "S070020070",
            buttons: true,
            translations: {
              dk: "Traumatisk hjerneskade/hovedtraume",
              en: "Traumatic brain injury/head trauma",
            },
            ordering: {
              dk: 8,
              en: 8
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
            name: "S070020080",
            id: "S070020080",
            buttons: true,
            translations: {
              dk: "Høretab/hørelse",
              en: "Hearing loss/hearing",
            },
            ordering: {
              dk: 9,
              en: 9
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
            name: "S070020090",
            id: "S070020090",
            buttons: true,
            translations: {
              dk: "Infektion",
              en: "Infection",
            },
            ordering: {
              dk: 10,
              en: 10
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
        ],
      },
      {
        name: "S070030",
        id: "S070030",
        buttons: true,
        translations: {
          dk: "Mentalt helbred",
          en: "Mental health",
        },
        ordering: {
          dk: 11,
          en: 11
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
        },
        children: [
          {
            name: "S070030010",
            id: "S070030010",
            buttons: true,
            translations: {
              dk: "Mentalt helbred generelt",
              en: "Mental health in general",
            },
            ordering: {
              dk: 12,
              en: 12
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
            name: "S070030020",
            id: "S070030020",
            buttons: true,
            translations: {
              dk: "Stress",
              en: "Stress",
            },
            ordering: {
              dk: 13,
              en: 13
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
            name: "S070030030",
            id: "S070030030",
            buttons: true,
            translations: {
              dk: "PTSD",
              en: "PTSD",
            },
            ordering: {
              dk: 14,
              en: 14
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
            name: "S070030040",
            buttons: true,
            id: "S070030040",
            translations: {
              dk: "Kognitiv reserve",
              en: "Cognitive reserve",
            },
            ordering: {
              dk: 15,
              en: 15
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
        ],
      },
      {
        name: "S070040",
        id: "S070040",
        buttons: true,
        translations: {
          dk: "Livsstil",
          en: "Lifestyle",
        },
        ordering: {
          dk: 16,
          en: 16
        },
        children: [
          {
            name: "S070040010",
            id: "S070040010",
            buttons: true,
            translations: {
              dk: "Livsstil generelt",
              en: "Lifestyle in general",
            },
            ordering: {
              dk: 17,
              en: 17
            },
            searchStrings: {
              narrow: [
                '"Lifestyle"[majr]'
              ],
              normal: [
                '"Lifestyle"[mh] OR lifestyle[ti]'
              ],
              broad: [
                '"Lifestyle"[mh] OR lifestyle[tiab]'
              ]
            }
          },
          {
            name: "S070040020",
            id: "S070040020",
            buttons: true,
            translations: {
              dk: "Rygning/tobak",
              en: "Smoking/tobacco",
            },
            ordering: {
              dk: 18,
              en: 18
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
            name: "S070040030",
            buttons: true,
            id: "S070040030",
            translations: {
              dk: "Alkohol",
              en: "Alcohol",
            },
            ordering: {
              dk: 19,
              en: 19
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
            name: "S070040040",
            buttons: true,
            id: "S070040040",
            translations: {
              dk: "Fysisk aktivitet/motion",
              en: "Physical activity/exercise",
            },
            ordering: {
              dk: 20,
              en: 20
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
        ],
      },
      {
        name: "S070050",
        id: "S070050",
        buttons: true,
        translations: {
          dk: "Kost",
          en: "Diet",
        },
        ordering: {
          dk: 21,
          en: 21
        },
        children: [
          {
            name: "S070050010",
            id: "S070050010",
            buttons: true,
            translations: {
              dk: "Kost generelt",
              en: "Diet in general",
            },
            ordering: {
              dk: 22,
              en: 22
            },
            searchStrings: {
              narrow: [
                '"Diet"[majr]'
              ],
              normal: [
                '"Diet"[mh] OR diet[ti]'
              ],
              broad: [
                '"Diet"[mh] OR diet[tiab]'
              ]
            }
          },
          {
            name: "S070050020",
            id: "S070050020",
            buttons: true,
            translations: {
              dk: "Middelhavskost",
              en: "Mediterranean diet",
            },
            ordering: {
              dk: 23,
              en: 23
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
            name: "S070050030",
            id: "S070050030",
            buttons: true,
            translations: {
              dk: "Fedtstof/fedtsyre",
              en: "Fat/fatty acid",
            },
            ordering: {
              dk: 24,
              en: 24
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
            name: "S070050040",
            id: "S070050040",
            buttons: true,
            translations: {
              dk: "Antioxidant",
              en: "Antioxidant",
            },
            ordering: {
              dk: 25,
              en: 25
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
            name: "S070050050",
            id: "S070050050",
            buttons: true,
            translations: {
              dk: "Vitamin",
              en: "Vitamin",
            },
            ordering: {
              dk: 26,
              en: 26
            },
            searchStrings: {
              narrow: [
                '"Vitamins"[majr]'
              ],
              normal: [
                '"Vitamins"[mh] OR vitamin*[ti]'
              ],
              broad: [
                '"Vitamins"[mh] OR vitamin*[tiab]'
              ]
            }
          },
        ],
      },
      {
        name: "S070060",
        id: "S070060",
        buttons: true,
        translations: {
          dk: "Sociodemografiske faktorer",
          en: "Sociodemographic factors",
        },
        ordering: {
          dk: 27,
          en: 27
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
        },
        children: [
          {
            name: "S070060010",
            id: "S070060010",
            buttons: true,
            translations: {
              dk: "Socioøkonomiske faktorer generelt",
              en: "Socioeconomic factors in general",
            },
            ordering: {
              dk: 28,
              en: 28
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
            name: "S070060020",
            id: "S070060020",
            buttons: true,
            translations: {
              dk: "Uddannelse/skolegang",
              en: "Education/schooling",
            },
            ordering: {
              dk: 29,
              en: 29
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
            name: "S070060030",
            id: "S070060030",
            buttons: true,
            translations: {
              dk: "Erhverv",
              en: "Occupation",
            },
            ordering: {
              dk: 30,
              en: 30
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
        ],
      },
      {
        name: "S070070",
        id: "S070070",
        buttons: true,
        translations: {
          dk: "Miljø",
          en: "Environment",
        },
        ordering: {
          dk: 31,
          en: 31
        },
        children: [
          {
            name: "S070070010",
            id: "S070070010",
            buttons: true,
            translations: {
              dk: "Miljø generelt",
              en: "Environment in general",
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
            name: "S070070020",
            id: "S070070020",
            buttons: true,
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
        ],
      }
    ]
  },
  {
    groupname: "S080",
    id: "S080",
    translations: {
      dk: "Specifikke grupper",
      en: "Specific groups",
    },
    ordering: {
      dk: 8,
      en: 8
    },
    groups: [
      {
        name: "S080010",
        id: "S080010",
        buttons: true,
        translations: {
          dk: "Pårørende",
          en: "Relatives",
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
        name: "S080020",
        id: "S080020",
        buttons: true,
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
        name: "S080030",
        id: "S080030",
        buttons: true,
        translations: {
          dk: "Etnisk minoritet",
          en: "Ethnic minority",
        },
        ordering: {
          dk: 3,
          en: 3
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
        name: "S080040",
        id: "S080040",
        buttons: true,
        translations: {
          dk: "Yngre under 65 år",
          en: "People younger than 65 years",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Middle Aged"[majr]'
          ],
          normal: [
            '"Middle Aged"[mh] OR middle-aged[ti] OR middle aged[ti]'
          ],
          broad: [
            '"Middle Aged"[mh] OR middle-aged[tiab] OR middle aged[tiab]'
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
