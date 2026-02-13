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
            ]
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
        ]
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
    id: 'S010',
    groupname: 'S010', 
    translations: {
      dk: 'Kognition',
      en: 'Cognition'
    },
    ordering: {
      dk: 1,
      en: 1
    },
    groups: [
      {
        name: 'S010010',
        id: 'S010010',
        buttons: true,
        translations: {
          dk: 'Kognitive forstyrrelser',
          en: 'Cognition disorders'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Cognition disorders"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Cognition disorders"[mh] OR cogniti* disorder*[ti] OR cogniti* impairment*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Cognition disorders"[mh] OR cogniti* disorder*[tiab] OR cogniti* impairment*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S010020",
        id: "S010020",
        buttons: true,
        translations: {
          dk: "Kognitiv dysfunktion",
          en: "Cognitive dysfunction"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Cognitive Dysfunction"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Cognitive Dysfunction"[mh] OR cognitive dysfunction[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Cognitive Dysfunction"[mh] OR cognitive dysfunction[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S010030",
        id: "S010030",
        buttons: true,
        translations: {
          dk: "Appetitstyring",
          en: "Appetite regulation"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Appetite Regulation"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Appetite Regulation"[mh] OR appetite regulation*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Appetite Regulation"[mh] OR appetite regulation*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S010040",
        id: "S010040",
        buttons: true,
        translations: {
          dk: "Attention",
          en: "Attention"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Attention"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Attention"[mh] OR attention*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Attention"[mh] OR attention*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S010050",
        id: "S010050",
        buttons: true,
        translations: {
          dk: "Behandling af information",
          en: "Processing speed"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Processing Speed"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Processing Speed"[mh] OR processing speed*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Processing Speed"[mh] OR processing speed*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S010060",
        id: "S010060",
        buttons: true,
        translations: {
          dk: "Eksekutiv funktion",
          en: "Executive function"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Executive Function"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Executive Function"[mh] OR executive function[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Executive Function"[mh] OR executive function[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S010070",
        id: "S010070",
        buttons: true,
        translations: {
          dk: "Hukommelse",
          en: "Memory"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Memory"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Memory"[mh] OR memory*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Memory"[mh] OR memory*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
  {
    id: 'S020',
    groupname: 'S020',
    translations: {
      dk: 'Centralnervesystemsforstyrrelser',
      en: 'CNS disorders'
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
          dk: "Neurodegenerative sygdomme generelt",
          en: "Neurodegenerative diseases in general"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Neurodegenerative diseases"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Neurodegenerative diseases"[mh] OR neurodegenerative*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Neurodegenerative diseases"[mh] OR neurodegenerative*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S020020",
        id: "S020020",
        buttons: true,
        translations: {
          dk: "Alzheimers sygdom",
          en: "Alzheimer's disease"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Alzheimer Disease"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Alzheimer Disease"[mh] OR alzheimer*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Alzheimer Disease"[mh] OR alzheimer*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S020030",
        id: "S020030",
        buttons: true,
        translations: {
          dk: "Demens",
          en: "Dementia"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Dementia"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Dementia"[mh] OR dementia*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Dementia"[mh] OR dementia*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S020040",
        id: "S020040",
        buttons: true,
        translations: {
          dk: "Demyelinerende autoimmun sygdomme, CNS",
          en: "Demyelinating autoimmune diseases, CNS"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Demyelinating Autoimmune Diseases, CNS"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Demyelinating Autoimmune Diseases, CNS"[mh] OR demyelinating autoimmune*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Demyelinating Autoimmune Diseases, CNS"[mh] OR demyelinating autoimmune*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S020050",
        id: "S020050",
        buttons: true,
        translations: {
          dk: "Neuroinflammation",
          en: "Neuroinflammation"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Neuroinflammatory Diseases"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Neuroinflammatory Diseases"[mh] OR neuroinflammatory*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Neuroinflammatory Diseases"[mh] OR neuroinflammatory*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S020060",
        id: "S020060",
        buttons: true,
        translations: {
          dk: "Parkinsons sygdom",
          en: "Parkinson's disease"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Parkinson Disease"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Parkinson Disease"[mh] OR parkinson*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Parkinson Disease"[mh] OR parkinson*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
  {
    groupname: 'S030',
    id: 'S030',
    translations: {
      dk: 'Diabetisk neuropati',
      en: 'Diabetic neuropathy'
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
          dk: "Autonom neuropati",
          en: "Autonomic neuropathy"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Autonomic Nervous System"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '(("Autonomic Nervous System"[mh] OR "Autonomic Nervous System Diseases"[mh]) AND ("Diabetic Neuropathies"[mh] OR neuropath*[ti])) OR autonomic neuropath*[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '(("Autonomic Nervous System"[mh] OR "Autonomic Nervous System Diseases"[mh]) AND ("Diabetic Neuropathies"[mh] OR neuropath*[tiab])) OR autonomic neuropath*[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030020",
        id: "S030020",
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
            '"Gastroparesis"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Gastroparesis"[mh] OR gastroparesis*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Gastroparesis"[mh] OR gastroparesis*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030030",
        id: "S030030",
        buttons: true,
        translations: {
          dk: "Kardial autonom neuropati (CAN)",
          en: "Cardiac autonomic neuropathy (CAN)"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Autonomic Nervous System Diseases"[majr] AND cardi*[ti] AND ' + standardString['narrow']
          ],
          normal: [
            '"Autonomic Nervous System Diseases"[mh] AND cardi*[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Autonomic Nervous System Diseases"[mh] AND cardi*[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030040",
        id: "S030040",
        buttons: true,
        translations: {
          dk: "Perifer neuropati",
          en: "Peripheral neuropathy"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Peripheral Nervous System Diseases"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Peripheral Nervous System Diseases"[mh] AND ("Diabetic Neuropathies"[mh] OR neuropath*[ti])) OR peripheral neuropath*[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Peripheral Nervous System Diseases"[mh] AND ("Diabetic Neuropathies"[mh] OR neuropath*[tiab])) OR peripheral neuropath*[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030050",
        id: "S030050",
        buttons: true,
        translations: {
          dk: "Retinopati",
          en: "Retinopathy"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diabetic Retinopathy"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Diabetic Retinopathy"[mh] OR "Optic Neuropathy, Ischemic"[mh] OR retinopathy*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Diabetic Retinopathy"[mh] OR "Optic Neuropathy, Ischemic"[mh] OR retinopathy*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030060",
        id: "S030060",
        buttons: true,
        translations: {
          dk: "Smertefuld neuropati",
          en: "Painful neuropathy"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '("Diabetic Neuropathies"[majr] OR "Polyneuropathies"[majr]) AND ' + standardString['narrow']
          ],
          normal: [
            '("Diabetic Neuropathies"[mh] OR "Polyneuropathies"[mh] OR neuropath*[ti] OR polyneuropath*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Diabetic Neuropathies"[mh] OR "Polyneuropathies"[mh] OR neuropath*[tiab] OR polyneuropath*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030070",
        id: "S030070",
        buttons: true,
        translations: {
          dk: "Småfiberneuropati",
          en: "Small fibre neuropathy"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Small Fiber Neuropathy"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Small Fiber Neuropathy"[mh] OR small fibre*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Small Fiber Neuropathy"[mh] OR small fibre*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S030080",
        id: "S030080",
        buttons: true,
        translations: {
          dk: "Sudomotor dysfunktion",
          en: "Sudomotor dysfunction"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hyperhidrosis"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Hyperhidrosis"[mh] OR sudomotor* dysfunction*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Hyperhidrosis"[mh] OR sudomotor* dysfunction*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
  {
    groupname: 'S040',
    id: 'S040',
    translations: {
      dk: 'Døgnrytme',
      en: 'Circadian rhythm'
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
          dk: "Døgnrytme",
          en: "Circadian rhythm"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Circadian Rhythm"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Circadian Rhythm"[mh] OR circadian*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Circadian Rhythm"[mh] OR circadian*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
          dk: "Døgnrytmeforstyrrelse",
          en: "Circadian disruption"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Sleep Disorders, Circadian Rhythm"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Sleep Disorders, Circadian Rhythm"[mh] OR "Sleep Apnea Syndromes"[mh] OR circadian*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Sleep Disorders, Circadian Rhythm"[mh] OR "Sleep Apnea Syndromes"[mh] OR circadian*[tiab]) AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'S050',
    id: 'S050',
    translations: {
      dk: 'Metabolisme',
      en: 'Metabolism'
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
          dk: "Brain hypometabolism",
          en: "Brain hypometabolism"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Brain/metabolism"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Brain/metabolism"[mh] OR "Neurodegenerative diseases/metabolism"[mh] OR brain* hypometabolism*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Brain/metabolism"[mh] OR "Neurodegenerative diseases/metabolism"[mh] OR brain* hypometabolism*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
          dk: "Glukose",
          en: "Glucose"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Blood Glucose"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Blood Glucose"[mh] OR "Hyperglycemia"[mh] OR "Hypoglycemia"[mh] OR glucose*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Blood Glucose"[mh] OR "Hyperglycemia"[mh] OR "Hypoglycemia"[mh] OR glucose*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
          dk: "Hjerneinsulinresistens",
          en: "Brain insulin resistance"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Insulin Resistance"[majr] AND "Brain"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Insulin Resistance"[mh] OR insulin resistance[ti]) AND ("Brain"[mh] OR brain[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Insulin Resistance"[mh] OR insulin resistance[tiab]) AND ("Brain"[mh] OR brain[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S050040",
        id: "S050040",
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
          narrow: [
            '"Insulin"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Insulin"[mh] OR insulin*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Insulin"[mh] OR insulin*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S050050",
        id: "S050050",
        buttons: true,
        translations: {
          dk: "Ketogen diæt",
          en: "Ketogenic diet"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Diet, Ketogenic"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Diet, Ketogenic"[mh] OR ketogenic*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Diet, Ketogenic"[mh] OR ketogenic*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S050060",
        id: "S050060",
        buttons: true,
        translations: {
          dk: "Ketoner",
          en: "Ketone bodies"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Ketone Bodies"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Ketone Bodies"[mh] OR ketone*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Ketone Bodies"[mh] OR ketone*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S050070",
        id: "S050070",
        buttons: true,
        translations: {
          dk: "Perifer insulinresistens",
          en: "Peripheral insulin resistance"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Insulin Resistance"[majr] AND peripheral*[ti] AND ' + standardString['narrow']
          ],
          normal: [
            '"Insulin Resistance"[mh] AND peripheral*[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Insulin Resistance"[mh] AND peripheral*[tiab] AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'S060',
    id: 'S060',
    translations: {
      dk: 'Risikofaktorer',
      en: 'Risk factors'
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
          dk: "Type 1-diabetes",
          en: "Type 1 diabetes"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus, Type 1"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[ti] OR type-i[ti] OR dm1[ti] OR dmi[ti] OR t1d[ti] OR iddm[ti] OR insulin-dependent[ti] OR insulindependent[ti] OR juvenile-onset[ti] OR autoimmune[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))'
          ],
          broad: [
            '"Diabetes Mellitus, Type 1"[mh] OR ((type-1[tiab] OR type-i[tiab] OR dm1[tiab] OR dmi[tiab] OR t1d[tiab] OR iddm[tiab] OR insulin-dependent[tiab] OR insulindependent[tiab] OR juvenile-onset[tiab] OR autoimmune[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))'
          ]
        },
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
        name: "S060020",
        id: "S060020",
        buttons: true,
        translations: {
          dk: "Type 2-diabetes",
          en: "Type 2 diabetes"
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Diabetes Mellitus, Type 2"[majr]'
          ],
          normal: [
            '"Diabetes Mellitus, Type 2"[mh] OR ((type-2[ti] OR type-ii[ti] OR dm2[ti] OR t2d[ti] OR niddm[ti] OR noninsulin-dependent[ti] OR non-insulin-dependent[ti] OR noninsulindependent[ti] OR adult-onset[ti]) AND ("Diabetes Mellitus"[mh] OR diabet*[ti]))'
          ],
          broad: [
            '"Diabetes Mellitus, Type 2"[mh] OR ((type-2[tiab] OR type-ii[tiab] OR dm2[tiab] OR dmii[tiab] OR t2d[tiab] OR niddm[tiab] OR noninsulin-dependent[tiab] OR non-insulin-dependent[tiab] OR noninsulindependent[tiab] OR adult-onset[tiab]) AND ("Diabetes Mellitus"[mh] OR diabet*[tiab]))'
          ]
        },
        searchStringComment: {
          dk: "dmii[ti] er ikke medtaget i den normale version, da der ikke findes nogen referencer i PubMed, hvor 'dmii' indgår i titlen.",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: "S060030",
        id: "S060030",
        buttons: true,
        translations: {
          dk: "Aldring",
          en: "Aging"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '("Cognitive Aging"[majr] OR ("Aging"[majr] NOT 2016:3000[mhda])) AND ' + standardString['narrow']
          ],
          normal: [
            '("Cognitive Aging"[mh] OR ("Aging"[mh] NOT 2016:3000[mhda])) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Cognitive Aging"[mh] OR ("Aging"[mh] NOT 2016:3000[mhda])) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S060040",
        id: "S060040",
        buttons: true,
        translations: {
          dk: "Autoimmune sygdomme",
          en: "Autoimmune diseases"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Autoimmune Diseases"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Autoimmune Diseases"[mh] OR autoimmune*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Autoimmune Diseases"[mh] OR autoimmune*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S060050",
        id: "S060050",
        buttons: true,
        translations: {
          dk: "Hypertension",
          en: "Hypertension"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Hypertension"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Hypertension"[mh] OR hypertension*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Hypertension"[mh] OR hypertension*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S060060",
        id: "S060060",
        buttons: true,
        translations: {
          dk: "Inflammation",
          en: "Inflammation"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Inflammation"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Inflammation"[mh] OR inflammation*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Inflammation"[mh] OR inflammation*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S060070",
        id: "S060070",
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
            '"Smoking"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Smoking"[mh] OR smoking*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Smoking"[mh] OR smoking*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S060080",
        id: "S060080",
        buttons: true,
        translations: {
          dk: "Stroke",
          en: "Stroke"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Stroke"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Stroke"[mh] OR stroke*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Stroke"[mh] OR stroke*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S060090",
        id: "S060090",
        buttons: true,
        translations: {
          dk: "Svær overvægt",
          en: "Obesity"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Obesity"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Obesity"[mh] OR obesity*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Obesity"[mh] OR obesity*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
    groupname: 'S080',
    id: 'S080',
    translations: {
      dk: 'Metoder',
      en: 'Methods'
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
          dk: "Elektroencefalografi",
          en: "Electroencephalography"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Electroencephalography"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Electroencephalography"[mh] OR electroencephalography*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Electroencephalography"[mh] OR electroencephalography*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
          dk: "Glukose clamp-teknik",
          en: "Glucose clamp technique"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Glucose Clamp Technique"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Glucose Clamp Technique"[mh] OR glucose clamp technique*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Glucose Clamp Technique"[mh] OR glucose clamp technique*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
          dk: "Glukosetolerancetest",
          en: "Glucose tolerance test"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Glucose Tolerance Test"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Glucose Tolerance Test"[mh] OR glucose tolerance test*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Glucose Tolerance Test"[mh] OR glucose tolerance test*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
          dk: "Magnetresonanskanning",
          en: "Magnetic resonance imaging"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Magnetic Resonance Imaging"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Magnetic Resonance Imaging"[mh] OR magnetic resonance imaging*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Magnetic Resonance Imaging"[mh] OR magnetic resonance imaging*[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
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
        name: "S080050",
        id: "S080050",
        buttons: true,
        translations: {
          dk: "Neuropsykologiske tests",
          en: "Neuropsychological tests"
        },
        ordering: {
          dk: null,
          en: null
        },
        searchStrings: {
          narrow: [
            '"Neuropsychological Tests"[majr] AND ' + standardString['narrow']
          ],
          normal: [
            '("Neuropsychological Tests"[mh] OR neuropsychological tests*[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Neuropsychological Tests"[mh] OR neuropsychological tests*[tiab]) AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'SXXX',
    id: 'SXXX',
    translations: {
      dk: 'Andre emner',
      en: 'Other topics'
    },
    ordering: {
      dk: 100,
      en: 100
    },
    groups: [
      {
        name: "SXXX010",
        id: "SXXX010",
        buttons: true,
        translations: {
          dk: "Andet emne 1",
          en: "Other topic 1"
        },
        ordering: {
          dk: null,
          en: null
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
          ]
        },
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
        name: "SXXX020",
        id: "SXXX020",
        buttons: true,
        translations: {
          dk: "Andet emne 2",
          en: "Other topic 2"
        },
        ordering: {
          dk: null,
          en: null
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
          ]
        },
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
        name: "SXXX030",
        id: "SXXX030",
        buttons: true,
        translations: {
          dk: "Andet emne 3",
          en: "Other topic 3"
        },
        ordering: {
          dk: null,
          en: null
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
          ]
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