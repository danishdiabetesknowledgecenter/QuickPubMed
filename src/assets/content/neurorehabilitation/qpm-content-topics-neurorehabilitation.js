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
  narrow: ['"Stroke"[majr] OR "brain injuries, traumatic"[majr] OR "Brain Neoplasms"[majr] OR "Spinal Cord Injuries"[majr] OR "Brain Concussion"[majr] OR "Cerebral Palsy"[majr]'],
  normal: ['"Stroke"[mh] OR "stroke"[ti] OR "apoplex*"[ti] OR "cerebrovascular accident*"[ti] OR "brain injuries, traumatic"[mh] OR "traumatic brain injury"[ti:~1] OR "traumatic brain injuries"[ti:~1] OR "Brain Neoplasms"[mh] OR "brain neoplasm*"[ti] OR "brain tumor*"[ti] OR "brain cancer"[ti:~2] OR "Spinal Cord Injuries"[mh] OR "spinal cord injury"[ti:~2] OR "spinal cord injuries"[ti:~2] OR "Brain Concussion"[mh] OR "concussion*"[ti] OR "Cerebral Palsy"[mh] OR "cerebral palsy"[ti]'],
  broad: ['"Stroke"[mh] OR "stroke"[tiab] OR "apoplex*"[tiab] OR "cerebrovascular accident*"[tiab] OR "brain injuries, traumatic"[mh] OR "traumatic brain injury"[tiab:~1] OR "traumatic brain injuries"[tiab:~1] OR "Brain Neoplasms"[mh] OR "brain neoplasm*"[tiab] OR "brain tumor*"[tiab] OR "brain cancer"[tiab:~2] OR "Spinal Cord Injuries"[mh] OR "spinal cord injury"[tiab:~2] OR "spinal cord injuries"[tiab:~2] OR "Brain Concussion"[mh] OR "concussion*"[tiab] OR "Cerebral Palsy"[mh] OR "cerebral palsy"[tiab]'],
}

export const topics = [
  {
    id: "S00",
    groupname: "S00",
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
        maintopicIdLevel1: "S00020", // Angiver at dette element har et parent med dette id. (Underemne 2)
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
        maintopicIdLevel1: "S00030", // Angiver at dette element har et parent med dette id. (Underemne 2.1)
        maintopicIdLevel2: "S00020", // Angiver at dette element har et grandparent med dette id (Underemne 2)
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
        maintopicIdLevel1: "S00030", // Angiver at dette element har et parent med dette id. (Underemne 2.1)
        maintopicIdLevel2: "S00020", // Angiver at dette element har et grandparent med dette id (Underemne 2)
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
        }
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
        }
      },
    ],
    tooltip: {
      dk: "Denne kategori er et eksempel, hvor man kan se brugen flere niveauer og kommentarer. Kategorien fjernes, når formularen er live. Bemærk, at det også er muligt at indsætte en kommentar som denne på de øvrige kategorier i dropdownen.",
      en: "This category is an example, where you can see the use of multiple levels and comments. The category is removed once the form is live. Note that it is also possible to insert a comment like this on the other categories in the dropdown."
    }
  },
  {
    groupname: 'Diagnose',
    id: 'S10',
    translations: {
      dk: 'Diagnose',
      en: 'Diagnosis'
    },
    ordering: {
      dk: 1,
      en: 1
    },
    groups: [
      {
        name: 'S10010',
        buttons: true,
        id: 'S10010',
        translations: {
          dk: 'Stroke',
          en: 'Stroke'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Stroke"[majr]'
          ],
          normal: [
            '"Stroke"[mh] OR stroke[ti] OR "apoplex*"[ti] OR "cerebrovascular accident*"[ti]'
          ],
          broad: [
            '"Stroke"[mh] OR stroke[tiab] OR "apoplex*"[tiab] OR "cerebrovascular accident*"[tiab]'
          ]
        },
        searchStringComment: {
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
        buttons: true,
        id: 'S10020',
        translations: {
          dk: 'Traumatisk hjerneskade (TBI)',
          en: 'Traumatic brain injury (TBI)',
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Brain Injuries, Traumatic"[majr]'
          ],
          normal: [
            '"brain injuries, traumatic"[mh] OR "traumatic brain injury"[ti:~1] OR "traumatic brain injuries"[ti:~1]'
          ],
          broad: [
            '"brain injuries, traumatic"[mh] OR "traumatic brain injury"[tiab:~1] OR "traumatic brain injuries"[tiab:~1]'
          ]
        },
        searchStringComment: {
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
        buttons: true,
        id: "S10030",
        translations: {
          dk: "Hjernetumorer",
          en: "Brain tumours",
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Brain Neoplasms"[majr]'
          ],
          normal: [
            '"Brain Neoplasms"[mh] OR "brain neoplasm*"[ti] OR "brain tumor*"[ti] OR "brain tumour*"[ti] OR "brain cancer"[ti:~2]'
          ],
          broad: [
            '"Brain Neoplasms"[mh] OR "brain neoplasm*"[tiab] OR "brain tumor*"[tiab] OR "brain tumour*"[tiab] OR "brain cancer"[tiab:~2]'
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
        name: "S10040",
        buttons: true,
        id: "S10040",
        translations: {
          dk: "Encefalopati (herunder anoksi)",
          en: "Encephalopathy (including anoxia)",
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Acute Febrile Encephalopathy"[majr] OR "Hypoxia, Brain"[majr] OR "Chronic Traumatic Encephalopathy"[majr] OR "Encephalopathy, Bovine Spongiform"[majr] OR "Hepatic Encephalopathy"[majr] OR "Hypertensive Encephalopathy"[majr] OR "Sepsis-Associated Encephalopathy"[majr] OR "Wernicke Encephalopathy"[majr]'
          ],
          normal: [
            '("Acute Febrile Encephalopathy"[mh] OR "Hypoxia, Brain"[mh] OR "Chronic Traumatic Encephalopathy"[mh] OR "Encephalopathy, Bovine Spongiform"[mh] OR "Hepatic Encephalopathy"[mh] OR "Hypertensive Encephalopathy"[mh] OR "Sepsis-Associated Encephalopathy"[mh] OR "Wernicke Encephalopathy"[mh]) OR encephalopath*[ti]'
          ],
          broad: [
            '("Acute Febrile Encephalopathy"[mh] OR "Hypoxia, Brain"[mh] OR "Chronic Traumatic Encephalopathy"[mh] OR "Encephalopathy, Bovine Spongiform"[mh] OR "Hepatic Encephalopathy"[mh] OR "Hypertensive Encephalopathy"[mh] OR "Sepsis-Associated Encephalopathy"[mh] OR "Wernicke Encephalopathy"[mh]) OR encephalopath*[tiab]'
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
        name: "S10050",
        buttons: true,
        id: "S10050",
        translations: {
          dk: "Cerebrale infektioner",
          en: "Cerebral infections",
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S10060",
        buttons: true,
        id: "S10060",
        translations: {
          dk: "Rygmarvsskade",
          en: "Spinal cord injury",
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Spinal Cord Injuries"[majr]'
          ],
          normal: [
            '"Spinal Cord Injuries"[mh] OR "spinal cord injury"[ti:~2] OR "spinal cord injuries"[ti:~2]'
          ],
          broad: [
            '"Spinal Cord Injuries"[mh] OR "spinal cord injury"[tiab:~2] OR "spinal cord injuries"[tiab:~2]'
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
        name: "S10070",
        buttons: true,
        id: "S10070",
        translations: {
          dk: "Hjernerystelse",
          en: "Concussion",
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Brain Concussion"[majr]'
          ],
          normal: [
            '"Brain Concussion"[mh] OR concussion*[ti]'
          ],
          broad: [
            '"Brain Concussion"[mh] OR concussion*[tiab]'
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
        name: "S10080",
        buttons: true,
        id: "S10080",
        translations: {
          dk: "Cerebral parese",
          en: "Cerebral palsy",
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            '"Cerebral Palsy"[majr]'
          ],
          normal: [
            '"Cerebral Palsy"[mh] OR "cerebral palsy"[ti]'
          ],
          broad: [
            '"Cerebral Palsy"[mh] OR "cerebral palsy"[tiab]'
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
    ],
    tooltip: {
      dk: "",
      en: ""
    }
  },
  {
    groupname: 'Sensomotoriske interventioner',
    id: 'S20',
    translations: {
      dk: 'Sensomotoriske interventioner',
      en: 'Sensorimotor interventions'
    },
    ordering: {
      dk: 2,
      en: 2
    },
    groups: [
      {
        name: 'S20010',
        buttons: true,
        id: 'S20010',
        translations: {
          dk: 'Constraint induced movement therapy (CIMT)',
          en: 'Constraint induced movement therapy (CIMT)'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"forced use"[ti] OR "constrain* induced movement therapy"[ti] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"forced use"[ti] OR "constrain* induced movement therapy"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"forced use"[tiab] OR "constrain* induced movement therapy"[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
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
        buttons: true,
        id: "S20020",
        translations: {
          dk: "High intensity gait training",
          en: "High intensity gait training"
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
            '"high intensity gait train*"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"high intensity gait train*"[tiab] AND (' + standardString['broad'] + ')'
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
        name: "S20030",
        buttons: true,
        id: "S20030",
        translations: {
          dk: "Task oriented training",
          en: "Task oriented training"
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
            '"task training"[ti:~1] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"task training"[tiab:~1] AND (' + standardString['broad'] + ')'
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
        name: "S20040",
        buttons: true,
        id: "S20040",
        translations: {
          dk: "Elstimulation",
          en: "Electrical stimulation"
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Electric Stimulation Therapy"[majr:noexp] OR "Transcranial Direct Current Stimulation"[majr] OR "Transcutaneous Electric Nerve Stimulation"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"Electric Stimulation Therapy"[mh:noexp] OR "Transcranial Direct Current Stimulation"[mh] OR "Transcutaneous Electric Nerve Stimulation"[mh] OR "functional electrical stimulat*"[ti] OR "Transcutaneous Electric Nerve Stimulat*"[ti] OR "Transcranial Direct Current Stimulat*"[ti] OR "neuromuscular electrical stimulat*"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Electric Stimulation Therapy"[mh:noexp] OR "Transcranial Direct Current Stimulation"[mh] OR "Transcutaneous Electric Nerve Stimulation"[mh] OR "functional electrical stimulat*"[tiab] OR "Transcutaneous Electric Nerve Stimulat*"[tiab] OR "Transcranial Direct Current Stimulat*"[tiab] OR "neuromuscular electrical stimulat*"[tiab] AND (' + standardString['broad'] + ')'
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
        name: "S20050",
        buttons: true,
        id: "S20050",
        translations: {
          dk: "Udholdenshedstræning",
          en: "Endurance training"
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Endurance Training"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"Endurance Training"[mh] OR "endurance training"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Endurance Training"[mh] OR "endurance training"[tiab] AND (' + standardString['broad'] + ')'
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
    groupname: 'Psyko-sociale Interventioner',
    id: 'S30',
    translations: {
      dk: 'Psyko-sociale Interventioner',
      en: 'Psychosocial Interventions'
    },
    ordering: {
      dk: 2,
      en: 2
    },
    groups: [
      {
        name: "S30010",
        buttons: true,
        id: "S30010",
        translations: {
          dk: "Mindfulness",
          en: "Mindfulness"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Mindfulness"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"Mindfulness"[mh] OR "mindfulness"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Mindfulness"[mh] OR "mindfulness"[tiab] AND (' + standardString['broad'] + ')'
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
        name: "S30020",
        buttons: true,
        id: "S30020",
        translations: {
          dk: "Acceptance and commitment therapy",
          en: "Acceptance and commitment therapy"
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Acceptance and Commitment Therapy"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"Acceptance and Commitment Therapy"[mh] OR "acceptance and commitment therap*"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Acceptance and Commitment Therapy"[mh] OR "acceptance and commitment therap*"[tiab] AND (' + standardString['broad'] + ')'
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
    groupname: 'Emotionelle/affektive interventioner',
    id: 'S40',
    translations: {
      dk: 'Emotionelle/affektive interventioner',
      en: 'Emotional/affective interventions'
    },
    ordering: {
      dk: 2,
      en: 2
    },
    groups: [
      {
        name: "S40010",
        buttons: true,
        id: "S40010",
        translations: {
          dk: "Selective Serotonin Reuptake Inhibitors (SSRI)",
          en: "Selective Serotonin Reuptake Inhibitors (SSRI)"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Selective Serotonin Reuptake Inhibitors"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"Selective Serotonin Reuptake Inhibitors"[mh] OR "Selective Serotonin Reuptake Inhibitors"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Selective Serotonin Reuptake Inhibitors"[mh] OR "Selective Serotonin Reuptake Inhibitors"[tiab] AND (' + standardString['broad'] + ')'
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
        name: "S40020",
        buttons: true,
        id: "S40020",
        translations: {
          dk: "Psyko-sociale",
          en: "Psycho-social"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S40030",
        buttons: true,
        id: "S40030",
        translations: {
          dk: "Autonome",
          en: "Autonomous"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S40040",
        buttons: true,
        id: "S40040",
        translations: {
          dk: "Ernæring",
          en: "Nutrition"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S40050",
        buttons: true,
        id: "S40050",
        translations: {
          dk: "Kognitive",
          en: "Cognitive"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S40060",
        buttons: true,
        id: "S40060",
        translations: {
          dk: "Emotionelle/affektive",
          en: "Emotional/affective"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S40070",
        buttons: true,
        id: "S40070",
        translations: {
          dk: "Pårørende",
          en: "Relatives"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S40080",
        buttons: true,
        id: "S40080",
        translations: {
          dk: "Andre emner",
          en: "Other topics"
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
          dk: "F.eks. xxx, yyy og zzz",
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
    groupname: 'Andre Interventioner',
    id: 'S50',
    translations: {
      dk: 'Andre interventioner',
      en: 'Other interventions'
    },
    ordering: {
      dk: 5,
      en: 5
    },
    groups: [
      {
        name: "S50010",
        buttons: true,
        id: "S50010",
        translations: {
          dk: "Sondeernæring",
          en: "Enteral nutrition"
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Enteral Nutrition"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '"Enteral Nutrition"[mh] OR "tube feeding"[ti:~0] OR "enteral nutrition"[ti] AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '"Enteral Nutrition"[mh] OR "tube feeding"[tiab:~0] OR "enteral nutrition"[tiab] AND (' + standardString['broad'] + ')'
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
        name: "S50020",
        buttons: true,
        id: "S50020",
        translations: {
          dk: "Emne 2",
          en: "Topic 2"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S50030",
        buttons: true,
        id: "S50030",
        translations: {
          dk: "Emne 3",
          en: "Topic 3"
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
    groupname: 'Følgesygdomme og komplikationer',
    id: 'S60',
    translations: {
      dk: 'Følgesygdomme og komplikationer',
      en: 'Complications'
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
          dk: "Emne 1",
          en: "Topic 1"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S60020",
        buttons: true,
        id: "S60020",
        translations: {
          dk: "Emne 2",
          en: "Topic 2"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S60030",
        buttons: true,
        id: "S60030",
        translations: {
          dk: "Emne 3",
          en: "Topic 3"
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
    groupname: 'International Classification of Function (ICF)',
    id: 'S70',
    translations: {
      dk: 'International Classification of Function (ICF)',
      en: 'International Classification of Function (ICF)'
    },
    ordering: {
      dk: 7,
      en: 7
    },
    groups: [
      {
        name: "S70010",
        buttons: true,
        id: "S70010",
        translations: {
          dk: "Aktivitet",
          en: "Activity"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S70020",
        buttons: true,
        id: "S70020",
        translations: {
          dk: "Krop",
          en: "Body"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S70030",
        buttons: true,
        id: "S70030",
        translations: {
          dk: "Deltagelse",
          en: "Participation"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S70040",
        buttons: true,
        id: "S70040",
        translations: {
          dk: "Omgivelser",
          en: "Surroundings"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "S70050",
        buttons: true,
        id: "S70050",
        translations: {
          dk: "Personlige faktorer",
          en: "Personal factors"
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
    groupname: 'Andre emner',
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
        buttons: true,
        id: "SXX010",
        translations: {
          dk: "Emne 1",
          en: "Topic 1"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "SXX020",
        buttons: true,
        id: "SXX020",
        translations: {
          dk: "Emne 2",
          en: "Topic 2"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      },
      {
        name: "SXX030",
        buttons: true,
        id: "SXX030",
        translations: {
          dk: "Emne 3",
          en: "Topic 3"
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
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        }
      }
    ]
  },
];
