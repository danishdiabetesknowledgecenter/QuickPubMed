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
    groupname: 'Cognition', id: 'S10',
    translations: {
      dk: 'Kognition',
      en: 'Cognition'
    },
    // use null to mean unordered or any positive number to order this 
    // element using the number as a priority with lower number being 
    // higher priority (being shown earlier in the list).
    //? Maybe use negative values to represent elements always sorted last
    ordering: {
      dk: 1,
      en: 1
    },
    groups: [
      {
        name: 'S10010',
        id: 'S10010',
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
            'xxx'
          ],
          normal: [
            '"Cognition disorders"[mh] OR cogniti*[ti]'
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
        name: "S10020",
        id: "S10020",
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
            'xxx'
          ],
          normal: [
            '"Cognitive Dysfunction"[mh] OR cognitive dysfunction[ti]'
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
        name: "S10030",
        id: "S10030",
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
            'xxx'
          ],
          normal: [
            '"Executive Function"[mh]'
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
        name: "S10040",
        id: "S10040",
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
            'xxx'
          ],
          normal: [
            '"Memory"[mh]'
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
        name: "S10050",
        id: "S10050",
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
            'xxx'
          ],
          normal: [
            '"Processing Speed"[mh]'
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
        name: "S10060",
        id: "S10060",
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
            'xxx'
          ],
          normal: [
            '"Appetite Regulation"[mh]'
          ],
          broad: [
            'xxx'
          ]
        },
        searchStringComment: {
          dk: "Comment",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: "S10070",
        id: "S10070",
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
            'xxx'
          ],
          normal: [
            '"Attention"[mh]'
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
  },
  {
    groupname: 'CNS disorders',
    id: 'S20',
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
        name: "S20010",
        id: "S20010",
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
            'xxx'
          ],
          normal: [
            '"Neurodegenerative diseases"[mh]'
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
        name: "S20020",
        id: "S20020",
        buttons: true,
        translations: {
          dk: "Alzheimer's sygdom",
          en: "Alzheimer's disease"
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
            '"Alzheimer Disease"[mh]'
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
        name: "S20030",
        id: "S20030",
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
            'xxx'
          ],
          normal: [
            '"Dementia"[mh] OR dementia*[ti]'
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
        name: "S20040",
        id: "S20040",
        buttons: true,
        translations: {
          dk: "Parkinson's sygdom",
          en: "Parkinson's disease"
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
            '"Parkinson Disease"[mh]'
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
        name: "S20050",
        id: "S20050",
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
            'xxx'
          ],
          normal: [
            '"Demyelinating Autoimmune Diseases, CNS"[mh]'
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
        name: "S20060",
        id: "S20060",
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
            'xxx'
          ],
          normal: [
            '"Neuroinflammatory Diseases"[mh]'
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
  },
  {
    groupname: 'Diabetic neuropathy', id: 'S30',
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
        name: "S30010",
        id: "S30010",
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
            'xxx'
          ],
          normal: [
            '(("Autonomic Nervous System"[mh] OR "Autonomic Nervous System Diseases"[mh]) AND ("Diabetic Neuropathies"[mh] OR neuropath*[ti])) OR autonomic neuropath*[ti]'
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
        name: "S30020",
        id: "S30020",
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
            'xxx'
          ],
          normal: [
            '("Peripheral Nervous System Diseases"[mh] AND ("Diabetic Neuropathies"[mh] OR neuropath*[ti])) OR peripheral neuropath*[ti]'
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
        name: "S30030",
        id: "S30030",
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
            'xxx'
          ],
          normal: [
            '("Diabetic Neuropathies"[mh] OR "Polyneuropathies"[mh]'
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
        name: "S30040",
        id: "S30040",
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
            'xxx'
          ],
          normal: [
            '"Diabetic Neuropathies"[mh] AND small fibre*[ti]'
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
        name: "S30050",
        id: "S30050",
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
            'xxx'
          ],
          normal: [
            '"Gastroparesis"[mh]'
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
        name: "S30060",
        id: "S30060",
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
            'xxx'
          ],
          normal: [
            '"Hyperhidrosis"[mh] OR "Hyperhidrosis"[mh] OR sudomotor* dysfunction*[ti]'
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
        name: "S30070",
        id: "S30070",
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
        name: "S30080",
        id: "S30080",
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
            'xxx'
          ],
          normal: [
            '"Diabetic Retinopathy"[mh] OR "Optic Neuropathy, Ischemic"[mh]'
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
  },
  {
    groupname: 'Circadian rhythm', id: 'S40',
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
        name: "S40010",
        id: "S40010",
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
            'xxx'
          ],
          normal: [
            '"Circadian Rhythm"[mh]'
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
        name: "S40020",
        id: "S40020",
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
            'xxx'
          ],
          normal: [
            '"Sleep Disorders, Circadian Rhythm"[mh] OR "Sleep Apnea Syndromes"[mh]'
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
  },
  {
    groupname: 'Metabolism',
    id: 'S50',
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
        name: "S50010",
        id: "S50010",
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
            'xxx'
          ],
          normal: [
            '"Brain/metabolism"[mh] OR "Neurodegenerative diseases/metabolism"[mh]'
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
        name: "S50020",
        id: "S50020",
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
            'xxx'
          ],
          normal: [
            '"Blood Glucose"[mh] OR "Hyperglycemia"[mh] OR "Hypoglycemia"[mh]'
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
        name: "S50030",
        id: "S50030",
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
            'xxx'
          ],
          normal: [
            '("Insulin"[mh]'
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
        name: "S50040",
        id: "S50040",
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
            'xxx'
          ],
          normal: [
            '"Ketone Bodies"[mh]'
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
        name: "S50050",
        id: "S50050",
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
            'xxx'
          ],
          normal: [
            '"Diet, Ketogenic"[mh]'
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
        name: "S50060",
        id: "S50060",
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
            'xxx'
          ],
          normal: [
            '("Insulin Resistance"[mh] OR insulin resistance[ti]) AND ("Brain"[mh] OR brain[ti])'
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
        name: "S50070",
        id: "S50070",
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
            'xxx'
          ],
          normal: [
            '"Insulin Resistance"[mh] AND peripheral*[ti] '
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
  },
  {
    groupname: 'Risk factors',
    id: 'S60',
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
        name: "S60010",
        id: "S60010",
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
            'xxx'
          ],
          normal: [
            '"Cognitive Aging"[mh] OR ("Aging"[mh] NOT 2016:3000[mhda])'
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
        name: "S60020",
        id: "S60020",
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
            'xxx'
          ],
          normal: [
            '"Autoimmune Diseases"[mh]'
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
        name: "S60030",
        id: "S60030",
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
            'xxx'
          ],
          normal: [
            '"Inflammation"[mh]'
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
        name: "S60040",
        id: "S60040",
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
            'xxx'
          ],
          normal: [
            '"Obesity"[mh]'
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
        name: "S60050",
        id: "S60050",
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
            'xxx'
          ],
          normal: [
            '"Stroke"[mh]'
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
        name: "S60060",
        id: "S60060",
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
        name: "S60070",
        id: "S60070",
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
        name: "S60080",
        id: "S60080",
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
            'xxx'
          ],
          normal: [
            '"Smoking"[mh]'
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
        name: "S60090",
        id: "S60090",
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
            'xxx'
          ],
          normal: [
            '"Hypertension"[mh]'
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
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    groupname: 'Methods',
    id: 'S80',
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
        name: "S80010",
        id: "S80010",
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
            'xxx'
          ],
          normal: [
            '"Magnetic Resonance Imaging"[mh]'
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
        name: "S80020",
        id: "S80020",
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
            'xxx'
          ],
          normal: [
            '"Glucose Tolerance Test"[mh]'
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
        name: "S80030",
        id: "S80030",
        buttons: true,
        translations: {
          dk: "Glukose clamp teknik",
          en: "Glucose clamp technique"
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
            '"Glucose Clamp Technique"[mh]'
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
        name: "S80040",
        id: "S80040",
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
            'xxx'
          ],
          normal: [
            '"Electroencephalography"[mh]'
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
        name: "S80050",
        id: "S80050",
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
            'xxx'
          ],
          normal: [
            '"Neuropsychological Tests"[mh]'
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
  },
  {
    groupname: 'Other topics',
    id: 'SXX',
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
        name: "SXX010",
        id: "SXX010",
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
        name: "SXX020",
        id: "SXX020",
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
        name: "SXX030",
        id: "SXX030",
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
