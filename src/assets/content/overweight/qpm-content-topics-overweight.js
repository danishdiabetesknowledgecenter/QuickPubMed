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
  narrow: '"Overweight"[majr]',
  normal: '"Overweight"[mh] OR overweight[ti] OR obes*[ti]',
  broad: '"Overweight"[mh] OR overweight[tiab] OR obes*[tiab]',
}

export const topics = [
  {
    id: "S00",
    groupname: "S00",
    translations: {
      dk: "Skabelonkategori",
      en: "Template category"
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
          en: "Subtopic 1"
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
          dk: "Dette er et eksempel på et underemne på niveau 1.",
          en: "This is an example of a subtopic at level 1."
        }
      },
      {
        id: "S00020",
        name: "S00020",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        translations: {
          dk: "Underemne 2",
          en: "Subtopic 2"
        },
        ordering: {
          dk: 2,
          en: 2
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 1, som har under&shy;liggende emner (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 1, that has subtopics underneath (indicated with an arrow). Click to see the subtopics."
        }
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
          en: "Subtopic 2.1"
        },
        ordering: {
          dk: 3,
          en: 3
        },
        tooltip: {
          dk: "Dette er et eksempel på et underemne på niveau 2, som også har et under&shy;liggende emne (indikeret med en pil). Klik for at se under&shy;liggende emner.",
          en: "This is an example of a subtopic at level 2, that also has a subtopic underneath (indicated with an arrow). Click to see the subtopics."
        }
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
          en: "Subtopic 2.1.1"
        },
        ordering: {
          dk: 4,
          en: 4
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
          dk: "Dette er et eksempel på et underemne på niveau 3, som er det dybteste niveau i denne rullemenu.",
          en: "This is an example of a subtopic at level 3, which is the deepest level in this dropdown menu."
        }
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
          en: "Subtopic 2.1.2"
        },
        ordering: {
          dk: 5,
          en: 5
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
        id: "S00060",
        name: "S00060",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        maintopicIdLevel2: "S00030", // Angiver at dette er punktet på 2. niveau til punktet med det angivne name.
        translations: {
          dk: "Underemne 2.1.3",
          en: "Subtopic 2.1.3"
        },
        ordering: {
          dk: 6,
          en: 6
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
        id: "S00070",
        name: "S00070",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        translations: {
          dk: "Underemne 2.2",
          en: "Subtopic 2.2"
        },
        ordering: {
          dk: 7,
          en: 7
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
        id: "S00080",
        name: "S00080",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S00020", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
        translations: {
          dk: "Underemne 2.3",
          en: "Subtopic 2.3"
        },
        ordering: {
          dk: 8,
          en: 8
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
        },
      },
      {
        id: "S00090",
        name: "S00090",
        buttons: true,
        translations: {
          dk: "Underemne 3",
          en: "Subtopic 3"
        },
        ordering: {
          dk: 9,
          en: 9
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
        },
      },
    ],
    tooltip: {
      dk: "Denne kategori er et eksempel, hvor man kan se brugen flere niveauer og kommentarer. Kategorien fjernes, når formularen er live. Bemærk, at det også er muligt at indsætte en kommentar som denne på de øvrige kategorier i dropdownen.",
      en: "This category is an example, where you can see the use of multiple levels and comments. The category is removed once the form is live. Note that it is also possible to insert a comment like this on the other categories in the dropdown."
    }
  },
  {
    groupname: 'Årsager til overvægt',
    id: 'S10',
    translations: {
      dk: 'Årsager til overvægt',
      en: 'Main topic 2'
    },
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
          dk: 'Genetiske/arvelige faktorer',
          en: 'Genetic/heriditary factors'
        }, 
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '"Genetic Predisposition to Disease"[majr] OR "Genetics"[majr] OR "Heredity"[majr] OR "Polymorphism, Genetic"[majr]) AND etiology[sh] (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Genetic Predisposition to Disease"[mh] OR "Genetics"[mh] OR "Heredity"[mh] OR "Obesity/genetics"[mh] OR "Polymorphism, Genetic"[mh] OR genetic*[ti] OR heredity[ti] OR polymorphism*[ti]) AND etiology[sh] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Genetic Predisposition to Disease"[mh] OR "Genetics"[mh] OR "Heredity"[mh] OR "Obesity/genetics"[mh] OR "Polymorphism, Genetic"[mh] OR genetic*[tiab] OR heredity[tiab] OR polymorphism*[tiab] OR genetics[sh]) AND etiology[sh] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S10020', 
        id: 'S10020',
        buttons: true, 
        translations: {
          dk: 'Hormonelle faktorer',
          en: 'Hormonelle faktorer'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          narrow: [
            '("Hormones"[majr] OR "Hypothalamic Diseases"[majr] OR "Thyroid Diseases"[majr]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Hormones"[mh] OR "Hypothalamic Diseases"[mh] OR "Thyroid Diseases"[mh] OR hormones*[ti] OR hypothalamic*[ti] OR thyroid*[ti]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Hormones"[mh] OR "Hypothalamic Diseases"[mh] OR "Thyroid Diseases"[mh] OR hormones*[tiab] OR hypothalamic*[tiab] OR thyroid*[tiab]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S10030', 
        id: 'S10030',
        buttons: true, 
        translations: {
          dk: 'Samfundsmæssige faktorer',
          en: 'Samfundsmæssige faktorer'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
        },
        searchStrings: {
          narrow: [
            '("Social determinants of health"[majr] OR "Social Environment"[majr]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Social determinants of health"[mh] OR "Social Environment"[mh] OR social*[ti]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Social determinants of health"[mh] OR "Social Environment"[mh] OR social*[tiab]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['broad'] + ')'
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
        name: 'S10040', 
        id: 'S10040',
        buttons: true, 
        translations: {
          dk: 'Socioøkonomiske faktorer',
          en: 'Socioøkonomiske faktorer'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
        },
        searchStrings: {
          narrow: [
            '("Socioeconomic Factors"[majr] OR "Poverty"[majr]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['narrow'] + ')'
          ],
          normal: ['("Socioeconomic Factors"[mh] OR "Poverty"[mh]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['normal'] + ')'],
          broad: [
            '("Socioeconomic Factors"[mh] OR "Poverty"[mh]) AND ("Causality"[mh] OR etiology[sh:noexp]) AND (' + standardString['broad'] + ')'
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
        name: 'S10050', 
        id: 'S10050',
        buttons: true, 
        translations: {
          dk: 'Medicinske faktorer',
          en: 'Medicinske faktorer'
          }, 
        ordering: { 
          dk: 5, 
          en: 5 
        },
        searchStrings: {
          narrow: [
            'xxx' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx' + standardString['normal'] + ')'
          ],
          broad: [
            'xxx' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S10060', 
        id: 'S10060',
        buttons: true, 
        translations: {
          dk: 'Psykologiske faktorer',
          en: 'Psykologiske faktorer'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            '("Eating Disorders"[mh] OR "Psychology"[mh]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            'xxx'
          ]
        },
        searchStringComment: {
          dk: "F.eks. spiseforstyrrelser",
          en: ""
        },
        tooltip: {
          dk: "F.eks. spiseforstyrrelser",
          en: ""
        }
      },
      {
        name: 'S10070', 
        id: 'S10070',
        buttons: true, 
        translations: {
          dk: 'Fysiske faktorer',
          en: 'Fysiske faktorer'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
        },
        searchStrings: {
          narrow: [
            'xxx'
          ],
          normal: [
            '("Physical Fitness"[mh] OR "Physical Conditioning, Human"[mh]) AND (' + standardString['normal'] + ')'
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
        name: 'S10080', 
        id: 'S10080',
        buttons: true, 
        translations: {
          dk: 'Motion/bevægelse',
          en: 'Motion/bevægelse'
        }, 
        ordering: { 
          dk: 8, 
          en: 8 
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
        name: 'S10090', 
        id: 'S10090',
        buttons: true, 
        translations: {
          dk: 'Kost',
          en: 'Kost'
        }, ordering: { dk: 9, en: 9 },
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
        name: 'S10100', 
        id: 'S10100',
        buttons: true, 
        translations: {
          dk: 'Stigmatisering/mistrivsel',
          en: 'Stigmatisering/mistrivsel'
        }, ordering: { dk: 10, en: 10 },
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
        name: 'S10110', 
        id: 'S10110',
        buttons: true, 
        translations: {
          dk: 'Andet (rygestop, søvn, overgangsalder)',
          en: 'Andet (rygestop, søvn, overgangsalder)'
        }, ordering: { dk: 11, en: 11 },
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
    ]
  },
  {
    groupname: 'S20', 
    id: 'S20',
    translations: {
      dk: 'Definitioner og kliniske målinger',
      en: 'Main topic 2'
    }, 
    ordering: { 
      dk: 2, 
      en: 2 
    },
    groups: [
      {
        name: 'S20010', 
        id: 'S20010',
        buttons: true, 
        translations: {
          dk: 'BMI',
          en: 'BMI'
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
        name: 'S20020', 
        id: 'S20020',
        buttons: true, 
        translations: {
          dk: 'BMI Z-score / ISO-BMI / IOTF (BMI for børn og unge)',
          en: 'BMI Z-score / ISO-BMI / IOTF (BMI for børn og unge)'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
        name: 'S20030', 
        id: 'S20030',
        buttons: true, 
        translations: {
          dk: 'Antropometri',
          en: 'Antropometri'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
          dk: "F.eks. kropssammensætning, fedtfordeling og talje-hofteratio.",
          en: ""
        },
        tooltip: {
          dk: "F.eks. kropssammensætning, fedtfordeling og talje-hofteratio",
          en: ""
        }
      },
      {
        name: 'S20040', 
        id: 'S20040',
        buttons: true, 
        translations: {
          dk: 'Metabolisme',
          en: 'Metabolisme'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S20050', 
        id: 'S20050',
        buttons: true, 
        translations: {
          dk: 'Lipidstatus',
          en: 'Lipidstatus'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
          dk: "F.eks. kolesterol, LDL, HDL, triglycerid og kolesterol/&#8203;HDL-ratio.",
          en: ""
        },
        tooltip: {
          dk: "F.eks. kolesterol, LDL, HDL, triglycerid og kolesterol/&#8203;HDL-ratio",
          en: ""
        }
      },
      {
        name: 'S20060', 
        id: 'S20060',
        buttons: true, 
        translations: {
          dk: 'Dyslipidemi',
          en: 'Dyslipidemi'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
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
        name: 'S20070', 
        id: 'S20070',
        buttons: true, 
        translations: {
          dk: 'Blodtryk',
          en: 'Blodtryk'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
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
        name: 'S20080', 
        id: 'S20080',
        buttons: true, 
        translations: {
          dk: 'Selvvurderet helbred og sygehistorik',
          en: 'Selvvurderet helbred og sygehistorik'
        }, 
        ordering: { 
          dk: 8, 
          en: 8 
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
        name: 'S20090', 
        id: 'S20090',
        buttons: true, 
        translations: {
          dk: 'QoL (IWQoL)/mental sundhed',
          en: 'QoL (IWQoL)/mental sundhed'
        }, 
        ordering: { 
          dk: 9, 
          en: 9 
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
        name: 'S20100', 
        id: 'S20100',
        buttons: true, 
        translations: {
          dk: 'Andet',
          en: 'Andet'
        }, 
        ordering: { 
          dk: 10, 
          en: 10 
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
    ]
  },
  {
    groupname: 'S30', 
    id: 'S30',
    translations: {
      dk: 'Følgetilstande og -sygdomme',
      en: 'Main topic 3'
    }, 
    ordering: { 
      dk: 3, 
      en: 3 
    },
    groups: [
      {
        name: 'S30010', 
        id: 'S30010',
        buttons: true, 
        translations: {
          dk: 'Type 2-diabetes',
          en: 'Type 2-diabetes'
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
        name: 'S30020', 
        id: 'S30020',
        buttons: true, 
        translations: {
          dk: 'Graviditetsdiabetes',
          en: 'Graviditetsdiabetes'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S30030', 
        id: 'S30030',
        buttons: true, 
        translations: {
          dk: 'Kræft',
          en: 'Kræft'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S30040', 
        id: 'S30040',
        buttons: true, 
        translations: {
          dk: 'Hjerte-kar-sygdomme',
          en: 'Hjerte-kar-sygdomme'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S30050', 
        id: 'S30050',
        buttons: true, 
        translations: {
          dk: 'Søvnapnø',
          en: 'Søvnapnø'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
        name: 'S30060', 
        id: 'S30060',
        buttons: true, 
        translations: {
          dk: 'Polycystisk ovariesyndrom (PCOS)',
          en: 'Polycystisk ovariesyndrom (PCOS)'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
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
        name: 'S30070', 
        id: 'S30070',
        buttons: true, 
        translations: {
          dk: 'Barnløshed',
          en: 'Barnløshed'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S30080', 
        id: 'S30080',
        buttons: true, 
        translations: {
          dk: 'Gigt',
          en: 'Gigt'
        }, 
        ordering: { 
          dk: 8, 
          en: 8 
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
        name: 'S30090', 
        id: 'S30090',
        buttons: true, 
        translations: {
          dk: 'Smerter i muskler/led/knogler',
          en: 'Smerter i muskler/led/knogler'
        }, 
        ordering: { 
          dk: 9, 
          en: 9 
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
        name: 'S30100', 
        id: 'S30100',
        buttons: true, 
        translations: {
          dk: 'Psykiske tilstande/mental sundhed',
          en: 'Psykiske tilstande/mental sundhed'
        }, 
        ordering: { 
          dk: 10, 
          en: 10 
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
        name: 'S30110', 
        id: 'S30110',
        buttons: true, 
        translations: {
          dk: 'Monogenetiske sygdomme',
          en: 'Monogenetiske sygdomme'
        }, 
        ordering: { 
          dk: 11, 
          en: 11 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S30120', 
        id: 'S30120',
        buttons: true, 
        translations: {
          dk: 'Livskvalitet/depression',
          en: 'Livskvalitet/depression'
        }, 
        ordering: { 
          dk: 12, 
          en: 12 
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
        name: 'S30130', 
        id: 'S30130',
        buttons: true, 
        translations: {
          dk: 'Andet',
          en: 'Andet'
        }, 
        ordering: { 
          dk: 13, 
          en: 13 
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
          dk: "F.eks. galdesten og urinsyregigt.",
          en: ""
        },
        tooltip: {
          dk: "F.eks. galdesten og urinsyregigt",
          en: ""
        }
      },
    ]
  },
  {
    groupname: 'S40', 
    id: 'S40',
    translations: {
      dk: 'Kirurgisk behandling',
      en: 'Main topic 4'
    }, 
    ordering: { 
      dk: 4, 
      en: 4 
    },
    groups: [
      {
        name: 'S40010', 
        id: 'S40010',
        buttons: true, 
        translations: {
          dk: 'Typer',
          en: 'Typer'
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
            'xxx'
          ],
          broad: [
            'xxx'
          ]
        },
        searchStringComment: {
          dk: "F.eks. sleeve, gastric bypass og banding.",
          en: ""
        },
        tooltip: {
          dk: "F.eks. sleeve, gastric bypass og banding",
          en: ""
        }
      },
      {
        name: 'S40020', 
        id: 'S40020',
        buttons: true, 
        translations: {
          dk: 'Effekt',
          en: 'Effekt'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
          dk: "F.eks. vægtreduktion, vægtøgning, vægtvedligehold, trivsel og mental sundhed.",
          en: ""
        },
        tooltip: {
          dk: "F.eks. vægtreduktion, vægtøgning, vægtvedligehold, trivsel og mental sundhed",
          en: ""
        }
      },
      {
        name: 'S40030', 
        id: 'S40030',
        buttons: true, 
        translations: {
          dk: 'Behandlingsforløb',
          en: 'Behandlingsforløb'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
        name: 'S40040', 
        id: 'S40040',
        buttons: true, 
        translations: {
          dk: 'Opfølgning',
          en: 'Opfølgning'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S40050', 
        id: 'S40050',
        buttons: true, 
        translations: {
          dk: 'Andet',
          en: 'Andet'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
    ]
  },
  {
    groupname: 'S50', 
    id: 'S50',
    translations: {
      dk: 'Medicinsk behandling',
      en: 'Main topic 5'
    }, 
    ordering: { 
      dk: 5, 
      en: 5 
    },
    groups: [
      {
        name: 'S50010', 
        id: 'S50010',
        buttons: true, 
        translations: {
          dk: 'Medicintyper',
          en: 'Medicintyper'
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
            'xxx'
          ],
          broad: [
            'xxx'
          ]
        },
        searchStringComment: {
          dk: "GLP-1RE, GIP, semaglutid, liraglutid, orlistat m.v.",
          en: ""
        },
        tooltip: {
          dk: "GLP-1RE, GIP, semaglutid, liraglutid, orlistat m.v.",
          en: ""
        }
      },
      {
        name: 'S50020', 
        id: 'S50020',
        buttons: true, 
        translations: {
          dk: 'Effekt',
          en: 'Effekt'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
          dk: "F.eks. vægtreduktion, vægtøgning, vægtvedligehold, trivsel og mental sundhed.",
          en: ""
        },
        tooltip: {
          dk: "F.eks. vægtreduktion, vægtøgning, vægtvedligehold, trivsel og mental sundhed",
          en: ""
        }
      },
      {
        name: 'S50030', 
        id: 'S50030',
        buttons: true, 
        translations: {
          dk: 'Behandlingsforløb',
          en: 'Behandlingsforløb'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
        name: 'S50040', 
        id: 'S50040',
        buttons: true, 
        translations: {
          dk: 'Opfølgning',
          en: 'Opfølgning'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S50050', 
        id: 'S50050',
        buttons: true, 
        translations: {
          dk: 'Andet',
          en: 'Andet'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
    ]
  },
  {
    groupname: 'S60', 
    id: 'S60',
    translations: {
      dk: 'Livsstilsintervention og sundhedstilbud',
      en: 'Main topic 6'
    }, 
    ordering: { 
      dk: 6, 
      en: 6 
    },
    groups: [
      {
        name: 'S60010', 
        id: 'S60010',
        buttons: true, 
        translations: {
          dk: 'Behandlingsforløb',
          en: 'Behandlingsforløb'
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
            'xxx'
          ],
          broad: [
            'xxx'
          ]
        },
        searchStringComment: {
          dk: "Indhold, længde, målgruppe, opfølgning",
          en: ""
        },
        tooltip: {
          dk: "Indhold, længde, målgruppe, opfølgning",
          en: ""
        }
      },
      {
        name: 'S60020', 
        id: 'S60020',
        buttons: true, 
        translations: {
          dk: 'Effekt',
          en: 'Effekt'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
          dk: "Vægtreduktukion, vægtøgning, vægtvedligehold, trivsel, mental sundhed",
          en: ""
        },
        tooltip: {
          dk: "Vægtreduktukion, vægtøgning, vægtvedligehold, trivsel, mental sundhed",
          en: ""
        }
      },
      {
        name: 'S60030', 
        id: 'S60030',
        buttons: true, 
        translations: {
          dk: 'Vægtneutral sundhed/ligevægt',
          en: 'Vægtneutral sundhed/ligevægt'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
        name: 'S60040', 
        id: 'S60040',
        buttons: true, 
        translations: {
          dk: 'Digital-/onlineforløb',
          en: 'Digital-/onlineforløb'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S60050', 
        id: 'S60050',
        buttons: true, 
        translations: {
          dk: 'Kost',
          en: 'Kost'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
        name: 'S60060', 
        id: 'S60060',
        buttons: true, 
        translations: {
          dk: 'Motion',
          en: 'Motion'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
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
        name: 'S60070', 
        id: 'S60070',
        buttons: true, 
        translations: {
          dk: 'Andet',
          en: 'Andet'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
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
    ]
  },
  {
    groupname: 'S70', 
    id: 'S70',
    translations: {
      dk: 'Forebyggelse',
      en: 'Main topic 7'
    }, 
    ordering: { 
      dk: 7, 
      en: 7 
    },
    groups: [
      {
        name: 'S70010', 
        id: 'S70010',
        buttons: true, 
        translations: {
          dk: 'Strukturel forebyggelse/lovgivning',
          en: 'Strukturel forebyggelse/lovgivning'
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
        name: 'S70020', 
        id: 'S70020',
        buttons: true, 
        translations: {
          dk: 'Oplysningskampagner',
          en: 'Oplysningskampagner'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
        name: 'S70030', 
        id: 'S70030',
        buttons: true, 
        translations: {
          dk: 'Lokalsamfundsinitiativer',
          en: 'Lokalsamfundsinitiativer'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
        name: 'S70040', 
        id: 'S70040',
        buttons: true, 
        translations: {
          dk: 'Individuel forebyggelse',
          en: 'Individuel forebyggelse'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S70050', 
        id: 'S70050',
        buttons: true, 
        translations: {
          dk: 'Sundhedsfremme',
          en: 'Sundhedsfremme'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
        name: 'S70060', 
        id: 'S70060',
        buttons: true, 
        translations: {
          dk: 'Mental sundhed',
          en: 'Mental sundhed'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
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
        name: 'S70070', 
        id: 'S70070',
        buttons: true, 
        translations: {
          dk: 'Ulighed i sundhed',
          en: 'Ulighed i sundhed'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S70080', 
        id: 'S70080',
        buttons: true, 
        translations: {
          dk: 'Motion/bevægelse',
          en: 'Motion/bevægelse'
        }, 
        ordering: { 
          dk: 8, 
          en: 8 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S70090', 
        id: 'S70090',
        buttons: true, 
        translations: {
          dk: 'Kost',
          en: 'Kost'
        }, 
        ordering: { 
          dk: 9, 
          en: 9 
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
        name: 'S70100', 
        id: 'S70100',
        buttons: true, 
        translations: {
          dk: 'Mental sundhed/trivsel',
          en: 'Mental sundhed/trivsel'
        }, 
        ordering: { 
          dk: 10, 
          en: 10 
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
        name: 'S70110', 
        id: 'S70110',
        buttons: true, 
        translations: {
          dk: 'Andet',
          en: 'Andet'
        }, 
        ordering: { 
          dk: 11, 
          en: 11 
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
    groupname: 'S80 ', 
    id: 'S80',
    translations: {
      dk: 'Vægtstigmatisering',
      en: 'Main topic 8'
    }, 
    ordering: { 
      dk: 8, 
      en: 8 
    },
    groups: [
      {
        name: 'S80010', 
        id: 'S80010',
        buttons: true, 
        translations: {
          dk: 'Stereotyper/fordomme',
          en: 'Stereotyper/fordomme'
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
        name: 'S80020', 
        id: 'S80020',
        buttons: true, 
        translations: {
          dk: 'Forekomst',
          en: 'Forekomst'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
        name: 'S80030', 
        id: 'S80030',
        buttons: true, 
        translations: {
          dk: 'Konsekvenser',
          en: 'Konsekvenser'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S80040', 
        id: 'S80040',
        buttons: true, 
        translations: {
          dk: 'Diskrimination',
          en: 'Diskrimination'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S80050', 
        id: 'S80050',
        buttons: true, 
        translations: {
          dk: 'Selvstigmatisering/internaliseret stigmatisering',
          en: 'Selvstigmatisering/internaliseret stigmatisering'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
        name: 'S80060', 
        id: 'S80060',
        buttons: true, 
        translations: {
          dk: 'Associeret stigma',
          en: 'Associeret stigma'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
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
        name: 'S80070', 
        id: 'S80070',
        buttons: true, 
        translations: {
          dk: 'Aktivisme og kropspositivisme',
          en: 'Aktivisme og kropspositivisme'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
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
        name: 'S80080', 
        id: 'S80080',
        buttons: true, 
        translations: {
          dk: 'Forebyggelse, lovgivning og kommunikation',
          en: 'Forebyggelse, lovgivning og kommunikation'
        }, 
        ordering: { 
          dk: 8, 
          en: 8 
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
    ]
  },
  {
    groupname: 'S90', 
    id: 'S90',
    translations: {
      dk: 'Forskellige grupper',
      en: 'Main topic 9'
    }, 
    ordering: { 
      dk: 9, 
      en: 9 
    },
    groups: [
      {
        name: 'S90010', 
        id: 'S90010',
        buttons: true, 
        translations: {
          dk: 'Forekomst/demografi',
          en: 'Forekomst/demografi'
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
        name: 'S90020', 
        id: 'S90020',
        buttons: true, 
        translations: {
          dk: 'Gravide',
          en: 'Gravide'
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
        name: 'S90030', 
        id: 'S90030',
        buttons: true, 
        translations: {
          dk: 'Børn',
          en: 'Børn'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
        name: 'S90040', 
        id: 'S90040',
        buttons: true, 
        translations: {
          dk: 'Unge',
          en: 'Unge'
        }, 
        ordering: { 
          dk: 4, 
          en: 4 
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
        name: 'S90040', 
        id: 'S90040',
        buttons: true, 
        translations: {
          dk: 'Voksne',
          en: 'Voksne'
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
        name: 'S90050', 
        id: 'S90050',
        buttons: true, 
        translations: {
          dk: 'Børn',
          en: 'Børn'
        }, 
        ordering: { 
          dk: 5, 
          en: 5 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S90060', 
        id: 'S90060',
        buttons: true, 
        translations: {
          dk: 'Ældre',
          en: 'Ældre'
        }, 
        ordering: { 
          dk: 6, 
          en: 6 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S90070', 
        id: 'S90070',
        buttons: true, 
        translations: {
          dk: 'Kvinder',
          en: 'Kvinder'
        }, 
        ordering: { 
          dk: 7, 
          en: 7 
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'S90080', 
        id: 'S90080',
        buttons: true, 
        translations: {
          dk: 'Mænd',
          en: 'Mænd'
        }, 
        ordering: { 
          dk: 8, 
          en: 8 
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
        name: 'S90090', 
        id: 'S90090',
        buttons: true, 
        translations: {
          dk: 'Sårbare/socialt udsatte personer',
          en: 'Sårbare/socialt udsatte personer'
        }, 
        ordering: { 
          dk: 9, 
          en: 9 
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
        name: 'S90100', 
        id: 'S90100',
        buttons: true, 
        translations: {
          dk: 'Personer med psykisk sygdom',
          en: 'Personer med psykisk sygdom'
        }, 
        ordering: { 
          dk: 10, 
          en: 10 
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
        name: 'S90110', 
        id: 'S90110',
        buttons: true, 
        translations: {
          dk: 'Personer med spiseforstyrrelse',
          en: 'Personer med spiseforstyrrelse'
        }, 
        ordering: { 
          dk: 11, 
          en: 11 
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
        name: 'S90120', 
        id: 'S90120',
        buttons: true, 
        translations: {
          dk: 'Minoritetsgrupper',
          en: 'Minoritetsgrupper'
        }, 
        ordering: { 
          dk: 12, 
          en: 12 
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
    ]
  },
  {
    groupname: 'SXX', 
    id: 'SXX',
    translations: {
      dk: 'Andre emner',
      en: 'Main topic XX'
    }, 
    ordering: { 
      dk: 100, 
      en: 100 
    },
    groups: [
      {
        name: 'SXX010', 
        id: 'SXX010',
        buttons: true, 
        translations: {
          dk: 'COVID-19',
          en: 'COVID-19'
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
        name: 'SXX020', 
        id: 'SXX020',
        buttons: true, 
        translations: {
          dk: 'Uddannelse af fagpersoner',
          en: 'Uddannelse af fagpersoner'
        }, 
        ordering: { 
          dk: 2, 
          en: 2 
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
        name: 'SXX030', 
        id: 'SXX030',
        buttons: true, 
        translations: {
          dk: 'Sundhedskompetencer',
          en: 'Sundhedskompetencer'
        }, 
        ordering: { 
          dk: 3, 
          en: 3 
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
    ]
  },
];
