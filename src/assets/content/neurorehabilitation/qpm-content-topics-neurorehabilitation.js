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
  narrow: ['"Stroke"[mh] OR "brain injuries, traumatic"[mh] OR "Brain Neoplasms"[mh] OR "Spinal Cord Injuries"[mh] OR "Brain Concussion"[mh] OR "Cerebral Palsy"[mh]'],
  normal: ['"Stroke"[mh] OR "stroke"[ti] OR "apoplex*"[ti] OR "cerebrovascular accident*"[ti] OR "brain injuries, traumatic"[mh] OR "traumatic brain injury"[ti:~1] OR "traumatic brain injuries"[ti:~1] OR "Brain Neoplasms"[mh] OR "brain neoplasm*"[ti] OR "brain tumor*"[ti] OR "brain cancer"[ti:~2] OR "Spinal Cord Injuries"[mh] OR "spinal cord injury"[ti:~2] OR "spinal cord injuries"[ti:~2] OR "Brain Concussion"[mh] OR "concussion*"[ti] OR "Cerebral Palsy"[mh] OR "cerebral palsy"[ti]'],
  broad: ['"Stroke"[mh] OR "stroke"[tiab] OR "apoplex*"[tiab] OR "cerebrovascular accident*"[tiab] OR "brain injuries, traumatic"[mh] OR "traumatic brain injury"[tiab:~1] OR "traumatic brain injuries"[tiab:~1] OR "Brain Neoplasms"[mh] OR "brain neoplasm*"[tiab] OR "brain tumor*"[tiab] OR "brain cancer"[tiab:~2] OR "Spinal Cord Injuries"[mh] OR "spinal cord injury"[tiab:~2] OR "spinal cord injuries"[tiab:~2] OR "Brain Concussion"[mh] OR "concussion*"[tiab] OR "Cerebral Palsy"[mh] OR "cerebral palsy"[tiab]'],
}

export const topics = [
  {
    id: "S000",
    groupname: "S000",
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
        id: "S000010",
        name: "S000010",
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
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
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
        id: "S000020",
        name: "S000020",
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
        id: "S000020010",
        name: "S000020010",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midterste niveau)
        maintopicIdLevel1: "S000020", // Angiver at dette element har et parent med dette id. (Underemne 2)
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
        id: "S000020010010",
        name: "S000020010010",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "S000020010", // Angiver at dette element har et parent med dette id. (Underemne 2.1)
        maintopicIdLevel2: "S000020", // Angiver at dette element har et grandparent med dette id (Underemne 2)
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
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
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
        id: "S000020010020",
        name: "S000020010020",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 3. niveau
        maintopicIdLevel1: "S000020010", // Angiver at dette element har et parent med dette id. (Underemne 2.1)
        maintopicIdLevel2: "S000020", // Angiver at dette element har et grandparent med dette id (Underemne 2)
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
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
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
          en: "Subtopic 2.1.3"
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S000020020",
        name: "S000020020",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S000020010", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
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
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S000020030",
        name: "S000020030",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "S000020010", // Angiver at dette er punktet på 1. niveau til punktet med det angivne name.
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
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: "S000030",
        name: "S000030",
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
            'xxx AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'xxx AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            'xxx AND (' + standardString['broad'] + ')'
          ]
        },
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
    id: 'S010',
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
        id: 'S010010',
        name: 'S010010',
        buttons: true,
        
        translations: {
          dk: 'Cerebral Parese',
          en: 'Cerebral Palsy'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Cerebral Palsy"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Cerebral Palsy"[mh] OR "cerebral palsy"[ti]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Cerebral Palsy"[mh] OR "cerebral palsy"[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S010020',
        name: 'S010020',
        buttons: true,
        
        translations: {
          dk: 'Encephalopati',
          en: 'Encephalopathy'
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Acute Febrile Encephalopathy"[majr] OR "Hypoxia, Brain"[majr] OR "Chronic Traumatic Encephalopathy"[majr] OR "Encephalopathy, Bovine Spongiform"[majr] OR "Hepatic Encephalopathy"[majr] OR "Hypertensive Encephalopathy"[majr] OR "Sepsis-Associated Encephalopathy"[majr] OR "Wernicke Encephalopathy"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '(("Acute Febrile Encephalopathy"[mh] OR "Hypoxia, Brain"[mh] OR "Chronic Traumatic Encephalopathy"[mh] OR "Encephalopathy, Bovine Spongiform"[mh] OR "Hepatic Encephalopathy"[mh] OR "Hypertensive Encephalopathy"[mh] OR "Sepsis-Associated Encephalopathy"[mh] OR "Wernicke Encephalopathy"[mh]) OR encephalopath*[ti]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '("Acute Febrile Encephalopathy"[mh] OR "Hypoxia, Brain"[mh] OR "Chronic Traumatic Encephalopathy"[mh] OR "Encephalopathy, Bovine Spongiform"[mh] OR "Hepatic Encephalopathy"[mh] OR "Hypertensive Encephalopathy"[mh] OR "Sepsis-Associated Encephalopathy"[mh] OR "Wernicke Encephalopathy"[mh]) OR encephalopath*[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S010030',
        name: 'S010030',
        buttons: true,
        
        translations: {
          dk: 'Hjernerystelse',
          en: 'Concussion'
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            '"Brain Concussion"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Brain Concussion"[mh] OR concussion*[ti]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Brain Concussion"[mh] OR concussion*[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S010040',
        name: 'S010040',
        buttons: true,
        
        translations: {
          dk: 'Hjernetumorer',
          en: 'Brain tumours'
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Brain Neoplasms"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Brain Neoplasms"[mh] OR "brain neoplasm*"[ti] OR "brain tumor*"[ti] OR "brain tumour*"[ti] OR "brain cancer"[ti:~2]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Brain Neoplasms"[mh] OR "brain neoplasm*"[tiab] OR "brain tumor*"[tiab] OR "brain tumour*"[tiab] OR "brain cancer"[tiab:~2] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S010050',
        name: 'S010050',
        buttons: true,
        
        translations: {
          dk: 'Rygmarvsskade',
          en: 'Spinal cord injury'
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            '"Spinal Cord Injuries"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Spinal Cord Injuries"[mh] OR "spinal cord injury"[ti:~2] OR "spinal cord injuries"[ti:~2]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Spinal Cord Injuries"[mh] OR "spinal cord injury"[tiab:~2] OR "spinal cord injuries"[tiab:~2] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S010060',
        name: 'S010060',
        buttons: true,
        
        translations: {
          dk: 'Stroke',
          en: 'Stroke'
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            '"Stroke"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Stroke"[mh] OR stroke[ti] OR "apoplex*"[ti] OR "cerebrovascular accident*"[ti]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Stroke"[mh] OR stroke[tiab] OR "apoplex*"[tiab] OR "cerebrovascular accident*"[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S010070',
        name: 'S010070',
        buttons: true,
        
        translations: {
          dk: 'TBI',
          en: 'TBI'
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            '"Brain Injuries, Traumatic"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("brain injuries, traumatic"[mh] OR "traumatic brain injury"[ti:~1] OR "traumatic brain injuries"[ti:~1]) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"brain injuries, traumatic"[mh] OR "traumatic brain injury"[tiab:~1] OR "traumatic brain injuries"[tiab:~1] AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'Følger',
    id: 'S020',
    translations: {
      dk: 'Følger',
      en: 'Consequences'
    },
    ordering: {
      dk: 2,
      en: 2
    },
    groups: [
      {
        id: 'S020010',
        name: 'S020010',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Affektive',
          en: 'Affective'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010010',
        name: 'S020010010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Affekt- og adfærdsregulering (impulstyret og uhæmmet)',
          en: 'Affect and behavior regulation (impulsive and disinhibited)'
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Impulsive Behavior[mh] OR Inhibition, Psychological[mh] OR Emotional Regulation[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010020',
        name: 'S020010020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Affektive lidelser',
          en: 'Affective disorders'
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Affective Symptoms[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010030',
        name: 'S020010030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Aleksitymi (genkende følelser)',
          en: 'Alexithymia (recognizing emotions)'
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'alexithymia AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010040',
        name: 'S020010040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Angst',
          en: 'Anxiety'
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Anxiety[mh] OR Anxiety Disorders[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010050',
        name: 'S020010050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Apati',
          en: 'Apathy'
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Apathy[mh] OR "apathy" OR "abulia" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010060',
        name: 'S020010060',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Depression',
          en: 'Depression'
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Depression[mh] OR Depressive Disorder[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010070',
        name: 'S020010070',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Følelsesmæssig fladhed/ligegyldighed',
          en: 'Emotional flatness/indifference'
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Emotional blunting AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010080',
        name: 'S020010080',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Irritabilitet/aggression',
          en: 'Irritability/aggression'
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Irritable Mood[mh] OR Aggression[mh] OR Anger[mh] OR Frustration[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010090',
        name: 'S020010090',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Psykologisk stress/belastningsreaktion',
          en: 'Psychological stress/stress reaction'
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Stress, Psychological[mh] OR Psychological Distress[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010100',
        name: 'S020010100',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'PTSD',
          en: 'PTSD'
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Stress Disorders, Post-Traumatic[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020010110',
        name: 'S020010110',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020010',
        translations: {
          dk: 'Sorg og krisereaktioner',
          en: 'Grief and crisis reactions'
        },
        ordering: {
          dk: 12,
          en: 12
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Grief[mh] OR Prolonged Grief Disorder[mh] OR Adjustment Disorders[mh] OR Life Change Events[mh] OR Stress Disorders, Traumatic, Acute[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020',
        name: 'S020020',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Kognitive',
          en: 'Cognitive'
        },
        ordering: {
          dk: 13,
          en: 13
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020010',
        name: 'S020020010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Afasi og kommunikationsforstyrrelser',
          en: 'Aphasia and communication disorders'
        },
        ordering: {
          dk: 14,
          en: 14
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Aphasia[mh] OR Anomia[mh] OR Agrammatism OR Communication Disorders[mh] OR "Cognitive communication disorder*" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020020',
        name: 'S020020020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Agrafi (skriftsprog)',
          en: 'Agraphia (written language)'
        },
        ordering: {
          dk: 15,
          en: 15
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Agraphia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020030',
        name: 'S020020030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Akalkuli (regnefærdigheder)',
          en: 'Acalculia (arithmetic skills)'
        },
        ordering: {
          dk: 16,
          en: 16
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Dyscalculia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020040',
        name: 'S020020040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Aleksi (læsefærdigheder)',
          en: 'Alexia (reading skills)'
        },
        ordering: {
          dk: 17,
          en: 17
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Dyslexia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020050',
        name: 'S020020050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Anosognosi/anosodiafori (sygdomsindsigt)',
          en: 'Anosognosia/anosodiaphoria (disease awareness)'
        },
        ordering: {
          dk: 18,
          en: 18
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '("Agnosia"[mh] OR "Awareness"[mh] OR "Denial (Psychology)"[mh]) OR ("anosognosia") OR ("anosodiaphoria") OR ("self-awareness") AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020060',
        name: 'S020020060',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Apraksi',
          en: 'Apraxia'
        },
        ordering: {
          dk: 19,
          en: 19
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Apraxias[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020070',
        name: 'S020020070',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Eksekutive forstyrrelser',
          en: 'Executive dysfunction'
        },
        ordering: {
          dk: 20,
          en: 20
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Executive Function[mh] OR Judgment[mh] OR Decision Making[mh] OR Metacognition[mh] OR Problem Solving[mh] OR planning OR "set shift*" OR "dysexecutive" OR "executive problem*" OR "executive disorder*" OR "executive deficit*" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020080',
        name: 'S020020080',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Hukommelsesforstyrrelser',
          en: 'Memory disorders'
        },
        ordering: {
          dk: 21,
          en: 21
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Memory Disorders[mh] OR Learning Disabilities[mh] OR Memory, Episodic[mh] OR Spatial Memory[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020090',
        name: 'S020020090',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Kognitive forstyrrelser',
          en: 'Cognitive disorders'
        },
        ordering: {
          dk: 22,
          en: 22
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Neurocognitive Disorders[mh] OR Cognition Disorders[mh] OR Cognitive Dysfunction[mh] OR Cognition[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020100',
        name: 'S02002010',
        buttons: true,

        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Opmærksomhed og mentalt tempo',
          en: 'Attention and mental speed'
        },
        ordering: {
          dk: 23,
          en: 23
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Attention[mh] OR Processing Speed[mh] OR Psychomotor Performance[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020110',
        name: 'S020020110',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Orientering i tid og sted',
          en: 'Orientation to time and place'
        },
        ordering: {
          dk: 24,
          en: 24
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Orientation[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020120',
        name: 'S020020120',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Social kognition (indlevelsesevne, empati, situationsfornemmelse)',
          en: 'Social cognition (empathy, theory of mind, social awareness)'
        },
        ordering: {
          dk: 25,
          en: 25
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Social Cognition[mh] OR Theory of Mind[mh] OR Psychosocial Functioning[mh] OR empath* OR Social Skills[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020020130',
        name: 'S020020130',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020020',
        translations: {
          dk: 'Spændvidde og arbejdshukommelse',
          en: 'Span and working memory'
        },
        ordering: {
          dk: 26,
          en: 26
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Memory, Short-Term[mh] OR "working memory" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030',
        name: 'S020030',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Motoriske',
          en: 'Motor'
        },
        ordering: {
          dk: 27,
          en: 27
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030010',
        name: 'S020030010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Akinesi/hypokinesi',
          en: 'Akinesia/hypokinesia'
        },
        ordering: {
          dk: 28,
          en: 28
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Hypokinesia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030020',
        name: 'S020030020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Alien hand/limb syndrom',
          en: 'Alien hand/limb syndrome'
        },
        ordering: {
          dk: 29,
          en: 29
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Alien Limb Phenomenon[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030030',
        name: 'S020030030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Ataksi',
          en: 'Ataxia'
        },
        ordering: {
          dk: 30,
          en: 30
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Ataxia[mh] OR Cerebellar Ataxia[mh] OR Gait Ataxia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030040',
        name: 'S020030040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Atrofi (tab af muskelmasse)',
          en: 'Atrophy (loss of muscle mass)'
        },
        ordering: {
          dk: 31,
          en: 31
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Muscular Atrophy[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030050',
        name: 'S020030050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Dysartri',
          en: 'Dysarthria'
        },
        ordering: {
          dk: 32,
          en: 32
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Dysarthria[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030060',
        name: 'S020030060',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Dysfagi',
          en: 'Dysphagia'
        },
        ordering: {
          dk: 33,
          en: 33
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Deglutition Disorders[mh] OR Dysphagia AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030070',
        name: 'S020030070',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Dyskinesi',
          en: 'Dyskinesia'
        },
        ordering: {
          dk: 34,
          en: 34
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Dyskinesias[mh] OR Tremor[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030080',
        name: 'S020030080',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Facialisparese',
          en: 'Facial palsy'
        },
        ordering: {
          dk: 35,
          en: 35
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Facial paralysis[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030090',
        name: 'S020030090',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Finmotorik',
          en: 'Fine motor skills'
        },
        ordering: {
          dk: 36,
          en: 36
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'dexterity AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030100',
        name: 'S020030100',
        buttons: true,

        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Forflytning og mobilitet',
          en: 'Transfer and mobility'
        },
        ordering: {
          dk: 37,
          en: 37
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Moving and Lifting Patients[mh] OR Mobility Limitation[mh] OR ("transfer skill*" OR "ambulat* difficult*") OR Motor Activity[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030110',
        name: 'S020030110',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Gangfunktion',
          en: 'Gait function'
        },
        ordering: {
          dk: 38,
          en: 38
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Gait Disorders, Neurologic[mh] OR Gait Analysis[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030120',
        name: 'S020030120',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Hypertoni',
          en: 'Hypertonia'
        },
        ordering: {
          dk: 39,
          en: 39
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Muscle Hypertonia[mh] OR Dystonia[mh] OR Contracture[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030130',
        name: 'S020030130',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Motoriske forstyrrelser',
          en: 'Motor disorders'
        },
        ordering: {
          dk: 40,
          en: 40
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Motor Disorders[mh] OR Motor Skills Disorders[mh] OR Motor Skills[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030140',
        name: 'S020030140',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Paralyse',
          en: 'Paralysis'
        },
        ordering: {
          dk: 41,
          en: 41
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Paralysis[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030150',
        name: 'S020030150',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Parese',
          en: 'Paresis'
        },
        ordering: {
          dk: 42,
          en: 42
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Paresis[mh] OR hemipare* AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020030160',
        name: 'S020030160',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020030',
        translations: {
          dk: 'Øjenmotorik',
          en: 'Oculomotor function'
        },
        ordering: {
          dk: 43,
          en: 43
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Ocular Motility Disorders[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040',
        name: 'S020040',
        buttons: true,

        maintopic: true,
        translations: {
          dk: 'Perceptive',
          en: 'Perceptive'
        },
        ordering: {
          dk: 44,
          en: 44
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040010',
        name: 'S020040010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Agnosi (genkendelse)',
          en: 'Agnosia (recognition)'
        },
        ordering: {
          dk: 45,
          en: 45
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Agnosia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040020',
        name: 'S020040020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Akinetopsi ("bevægelsesblindhed")',
          en: 'Akinetopsia ("motion blindness")'
        },
        ordering: {
          dk: 46,
          en: 46
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Motion Perception[mh] OR "akinetopsia" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040030',
        name: 'S020040030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Akromatopsi ("farveblindhed")',
          en: 'Achromatopsia ("color blindness")'
        },
        ordering: {
          dk: 47,
          en: 47
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Color Perception[mh] OR "achromatopsia" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040040',
        name: 'S020040040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Allestesi',
          en: 'Allesthesia'
        },
        ordering: {
          dk: 48,
          en: 48
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Allesthesia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040050',
        name: 'S020040050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Auditive agnosier',
          en: 'Auditory agnosia'
        },
        ordering: {
          dk: 49,
          en: 49
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Auditory Perception[mh] OR Auditory Perceptual Disorders[mh] OR (Agnosia[mh] AND ("auditor*" OR "sound")) OR "amusia" OR "auditor* agnosia" OR "phonagnosia" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040060',
        name: 'S020040060',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Gustatoriske agnosier',
          en: 'Gustatory agnosia'
        },
        ordering: {
          dk: 50,
          en: 50
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Taste Perception[mh] OR (Agnosia[mh] AND ("gustator*" OR "taste")) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040070',
        name: 'S020040070',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Hallucinationer',
          en: 'Hallucinations'
        },
        ordering: {
          dk: 51,
          en: 51
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Hallucinations[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040080',
        name: 'S020040080',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Olfaktoriske agnosier',
          en: 'Olfactory agnosia'
        },
        ordering: {
          dk: 52,
          en: 52
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Olfactory Perception[mh] OR Anosmia[mh] OR (Agnosia[mh] AND ("olfactor*" OR "smell*" OR "odor*")) AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040090',
        name: 'S020040090',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Perceptionsforstyrrelser',
          en: 'Perceptual disorders'
        },
        ordering: {
          dk: 53,
          en: 53
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Perceptual Disorders[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040100',
        name: 'S020040100',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Prosopagnosi ("ansigtsblindhed")',
          en: 'Prosopagnosia ("face blindness")'
        },
        ordering: {
          dk: 54,
          en: 54
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Facial Recognition[mh] OR Prosopagnosia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040110',
        name: 'S020040110',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Spatiel neglekt',
          en: 'Spatial neglect'
        },
        ordering: {
          dk: 55,
          en: 55
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '("unilateral neglect") OR ("hemispatial neglect") OR ("spatial neglect") OR ("hemineglect") OR ("hemi inattention") OR ("hemi-inattention") OR ("visual neglect") OR ("auditory neglect") OR ("tactile neglect") OR ("allocentric neglect") OR ("egocentric neglect") OR ("sensory neglect") OR ("motor neglect") OR ("perceptual neglect") OR ("hemi agnosia") OR ("hemispatial agnosia") OR ("unilateral agnosia") OR ("neglect dyslexia") OR ("representational neglect") OR ("personal neglect") OR ("peripersonal neglect") OR ("extrapersonal neglect") OR ("ipsilateral neglect") OR ("vertical neglect") OR ("radial neglect") OR ("extinction to simultaneously stimuli") OR ("motor extinction") OR ("visual extinction") OR ("auditory extinction") OR ("tactile extinction") AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040120',
        name: 'S020040120',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Taktile agnosier (somatosensoriske agnosier)',
          en: 'Tactile agnosia (somatosensory agnosia)'
        },
        ordering: {
          dk: 56,
          en: 56
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Touch Perception[mh] OR Stereognosis[mh] OR (Agnosia[mh] AND ("tacti*" OR "touch" OR "kinesthe*)) OR "astereognosis" OR "ahylognosia" OR "amorphognosia" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020040130',
        name: 'S020040130',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020040',
        translations: {
          dk: 'Visuelle agnosier',
          en: 'Visual agnosia'
        },
        ordering: {
          dk: 57,
          en: 57
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Visual Perception[mh] OR (Agnosia[mh] AND ("visua*" OR "optic*" OR "sight")) OR "akinetopsia" OR "achromatopsia" OR "form agnosia" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050',
        name: 'S020050',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Psykiske',
          en: 'Psychological'
        },
        ordering: {
          dk: 58,
          en: 58
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050010',
        name: 'S020050010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Adfærdsproblemer',
          en: 'Behavioral problems'
        },
        ordering: {
          dk: 59,
          en: 59
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Disruptive, Impulse Control, and Conduct Disorders[mh] OR Conduct Disorder[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050020',
        name: 'S020050020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Alkohol, rygning og stoffer',
          en: 'Alcohol, smoking and drugs'
        },
        ordering: {
          dk: 60,
          en: 60
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Substance-Related Disorders[mh] OR Drinking Behavior[mh] OR Smoking[mh] OR Tobacco Use[mh] OR Drug-Seeking Behavior[mh] OR Marijuana Use[mh] OR Recreational Drug Use[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050030',
        name: 'S020050030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Identitet',
          en: 'Identity'
        },
        ordering: {
          dk: 61,
          en: 61
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Identity OR Life Change Events[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050040',
        name: 'S020050040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Mentalt helbred og velvære',
          en: 'Mental health and wellbeing'
        },
        ordering: {
          dk: 62,
          en: 62
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Mental Health[mh] OR Personal Satisfaction[mh] OR Psychological Well-Being[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050050',
        name: 'S020050050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Mestring og coping',
          en: 'Coping and adaptation'
        },
        ordering: {
          dk: 63,
          en: 63
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Self-Management[mh] OR Coping Skills[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050060',
        name: 'S020050060',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Personlig hygiejne og pleje',
          en: 'Personal hygiene and care'
        },
        ordering: {
          dk: 64,
          en: 64
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Self Care[mh] OR Self-Neglect[mh] OR "Self care" OR "self maintenance" OR Oral Health[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050070',
        name: 'S020050070',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Personlighedsforandringer',
          en: 'Personality changes'
        },
        ordering: {
          dk: 65,
          en: 65
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Personality Disorders[mh] OR Personality[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050080',
        name: 'S020050080',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Resiliens',
          en: 'Resilience'
        },
        ordering: {
          dk: 66,
          en: 66
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Resilience, Psychological[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050090',
        name: 'S020050090',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Risikoadfærd',
          en: 'Risk behavior'
        },
        ordering: {
          dk: 67,
          en: 67
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Risk-Taking[mh] OR Health Risk Behaviors[mh] OR Dangerous Behavior[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050100',
        name: 'S020050100',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Self-efficacy',
          en: 'Self-efficacy'
        },
        ordering: {
          dk: 68,
          en: 68
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Self Efficacy[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050110',
        name: 'S020050110',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Selvstændig livsførelse',
          en: 'Independent living'
        },
        ordering: {
          dk: 69,
          en: 69
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Independent Living[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020050120',
        name: 'S020050120',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020050',
        translations: {
          dk: 'Livskvalitet',
          en: 'Quality of life'
        },
        ordering: {
          dk: 70,
          en: 70
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Quality of Life[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060',
        name: 'S020060',
        buttons: true,
        maintopic: true,
        translations: {
          dk: 'Sensoriske',
          en: 'Sensory'
        },
        ordering: {
          dk: 71,
          en: 71
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060010',
        name: 'S020060010',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Følesans',
          en: 'Tactile sense'
        },
        ordering: {
          dk: 72,
          en: 72
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Touch[mh] OR Somatosensory Disorders[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060020',
        name: 'S020060020',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Hemianopsi',
          en: 'Hemianopsia'
        },
        ordering: {
          dk: 73,
          en: 73
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Hemianopsia[mh] OR hemianopsia OR hemianopia AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060030',
        name: 'S020060030',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Hovedpine',
          en: 'Headache'
        },
        ordering: {
          dk: 74,
          en: 74
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Headache[mh] OR "Headache Disorders"[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060040',
        name: 'S020060040',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Høresans',
          en: 'Hearing'
        },
        ordering: {
          dk: 75,
          en: 75
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Hearing[mh] OR Hearing Disorders[mh] OR "cortical deafness" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060050',
        name: 'S020060050',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Kortikal blindhed (Antons syndrom)',
          en: 'Cortical blindness (Anton syndrome)'
        },
        ordering: {
          dk: 76,
          en: 76
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Blindness, Cortical[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060060',
        name: 'S020060060',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Lugtesans (anosmi)',
          en: 'Olfaction (anosmia)'
        },
        ordering: {
          dk: 77,
          en: 77
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Smell[mh] OR Olfaction Disorders[mh] OR Anosmia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060070',
        name: 'S020060070',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Lyd- og lysfølsomhed',
          en: 'Sound and light sensitivity'
        },
        ordering: {
          dk: 78,
          en: 78
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '(Hyperacusis[mh] OR "noise sensitivit*") OR (Photophobia[mh] OR "light sensitivit*") AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060080',
        name: 'S020060080',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Proprioception',
          en: 'Proprioception'
        },
        ordering: {
          dk: 79,
          en: 79
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Proprioception[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060090',
        name: 'S020060090',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Sanseintegration',
          en: 'Sensory integration'
        },
        ordering: {
          dk: 80,
          en: 80
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Sensory processing" OR "Sensory integration" OR "Sensory processing disorder" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060100',
        name: 'S020060100',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Smagssans',
          en: 'Taste'
        },
        ordering: {
          dk: 81,
          en: 81
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Taste[mh] OR Taste Disorders[mh] OR Ageusia[mh] OR Dysgeusia[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060110',
        name: 'S020060110',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Smerter',
          en: 'Pain'
        },
        ordering: {
          dk: 82,
          en: 82
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Pain[mh] OR Pain Perception[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060120',
        name: 'S020060120',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Svimmelhed',
          en: 'Dizziness'
        },
        ordering: {
          dk: 83,
          en: 83
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Vertigo[mh] OR Dizziness[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060130',
        name: 'S020060130',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Synssans',
          en: 'Vision'
        },
        ordering: {
          dk: 84,
          en: 84
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Vision, Ocular[mh] OR "Vision Disorders"[mh] OR "cerebral visual impairment" OR "cortical visual impairment" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020060140',
        name: 'S020060140',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020060',
        translations: {
          dk: 'Vestibulærsans',
          en: 'Vestibular sense'
        },
        ordering: {
          dk: 85,
          en: 85
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Vestibular Diseases[mh] OR "Vestibular System"[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070',
        name: 'S020070',
        buttons: true,
        maintopic: true,
        translations: {
          dk: 'Social aktivitet',
          en: 'Social activity'
        },
        ordering: {
          dk: 86,
          en: 86
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070010',
        name: 'S020070010',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'ADL',
          en: 'ADL'
        },
        ordering: {
          dk: 87,
          en: 87
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Activities of Daily Living[mh] OR "activit* of daily living" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070020',
        name: 'S020070020',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Arbejde og beskæftigelse',
          en: 'Work and employment'
        },
        ordering: {
          dk: 88,
          en: 88
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Employment[mh] OR Occupations[mh] OR Retirement[mh] OR Return to Work[mh] OR "Return to work" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070030',
        name: 'S020070030',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Bilkørsel',
          en: 'Driving'
        },
        ordering: {
          dk: 89,
          en: 89
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Automobile Driving[mh] OR "licensing" OR "driving" OR "driver" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070040',
        name: 'S020070040',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Fritidsaktiviteter',
          en: 'Leisure activities'
        },
        ordering: {
          dk: 90,
          en: 90
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Leisure Activities[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070050',
        name: 'S020070050',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Fysisk inaktivitet',
          en: 'Physical inactivity'
        },
        ordering: {
          dk: 91,
          en: 91
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Sedentary Behavior[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070060',
        name: 'S020070060',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Kriminalitet',
          en: 'Crime'
        },
        ordering: {
          dk: 92,
          en: 92
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Crime[mh] OR Criminal Behavior[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070070',
        name: 'S020070070',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Motion',
          en: 'Exercise'
        },
        ordering: {
          dk: 93,
          en: 93
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Exercise[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020070080',
        name: 'S020070080',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020070',
        translations: {
          dk: 'Uddannelsesaktiviteter',
          en: 'Educational activities'
        },
        ordering: {
          dk: 94,
          en: 94
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Return to School[mh] OR "Education"[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080',
        name: 'S020080',
        buttons: true,
        maintopic: true,
        translations: {
          dk: 'Social deltagelse',
          en: 'Social participation'
        },
        ordering: {
          dk: 95,
          en: 95
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080010',
        name: 'S020080010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020080',
        translations: {
          dk: 'Pårørendes behov og belastninger',
          en: 'Caregiver burden'
        },
        ordering: {
          dk: 96,
          en: 96
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Caregiver Burden[mh] OR "family need*" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080020',
        name: 'S020080020',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020080',
        translations: {
          dk: 'Samfundsdeltagelse og socialt liv',
          en: 'Community participation and social life'
        },
        ordering: {
          dk: 97,
          en: 97
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Community Participation[mh] OR Social Participation[mh] OR "community reintegration" OR "community re-integration" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080030',
        name: 'S020080030',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020080',
        translations: {
          dk: 'Skilsmisse',
          en: 'Divorce'
        },
        ordering: {
          dk: 98,
          en: 98
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Divorce[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080040',
        name: 'S020080040',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020080',
        translations: {
          dk: 'Social isolation og ensomhed',
          en: 'Social isolation and loneliness'
        },
        ordering: {
          dk: 99,
          en: 99
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Social Isolation[mh] OR "loneliness" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080050',
        name: 'S020080050',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020080',
        translations: {
          dk: 'Sundhedsydelser, forbrug og omkostninger',
          en: 'Health services, utilization and costs'
        },
        ordering: {
          dk: 100,
          en: 100
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Health service utilization OR "health care cost*" OR "healthcare cost*" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020080060',
        name: 'S020080060',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020080',
        translations: {
          dk: 'Unmet needs',
          en: 'Unmet needs'
        },
        ordering: {
          dk: 101,
          en: 101
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Unmet need* AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090',
        name: 'S020090',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Somatiske primære',
          en: 'Somatic primary'
        },
        ordering: {
          dk: 102,
          en: 102
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090010',
        name: 'S020090010',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Agitation (rastløshed)',
          en: 'Agitation (restlessness)'
        },
        ordering: {
          dk: 103,
          en: 103
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Psychomotor Agitation[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090020',
        name: 'S020090020',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Arousal (energimobilisering)',
          en: 'Arousal (energy mobilization)'
        },
        ordering: {
          dk: 104,
          en: 104
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Arousal[mh] OR Wakefulness[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090030',
        name: 'S020090030',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Autonom dysfunktion (paroxystisk sympatisk hyperaktivitet)',
          en: 'Autonomic dysfunction (paroxysmal sympathetic hyperactivity)'
        },
        ordering: {
          dk: 105,
          en: 105
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"paroxysmal sympathetic hyperactivity" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090040',
        name: 'S020090040',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Bevidsthedsforstyrrelser',
          en: 'Consciousness disorders'
        },
        ordering: {
          dk: 106,
          en: 106
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Consciousness Disorders[mh] OR Persistent Vegetative State[mh] OR "vegetative state" OR "unresponsive wakefulness state" OR "minimal conscious state" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090050',
        name: 'S020090050',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Epilepsi',
          en: 'Epilepsy'
        },
        ordering: {
          dk: 107,
          en: 107
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Seizures[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090060',
        name: 'S020090060',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Fatigue (træthed)',
          en: 'Fatigue'
        },
        ordering: {
          dk: 108,
          en: 108
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Fatigue[mh] OR Lethargy[mh] OR fatigability OR "cognitive fatigue" OR "mental fatigue" OR "physical fatigue" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090070',
        name: 'S020090070',
        buttons: true,
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Konfusion',
          en: 'Confusion'
        },
        ordering: {
          dk: 109,
          en: 109
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Confusion[mh] OR Delirium[mh] OR "Post traumatic amnesia" OR "Post traumatic confusional state" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090080',
        name: 'S020090080',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Locked in syndrom',
          en: 'Locked-in syndrome'
        },
        ordering: {
          dk: 110,
          en: 110
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Locked-In Syndrome[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090090',
        name: 'S020090090',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Seksualitet',
          en: 'Sexuality'
        },
        ordering: {
          dk: 111,
          en: 111
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Sexuality[mh] OR Sexual Behavior[mh] OR Sexual Health[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S020090100',
        name: 'S020090100',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S020090',
        translations: {
          dk: 'Søvnforstyrrelser',
          en: 'Sleep disorders'
        },
        ordering: {
          dk: 112,
          en: 112
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Dyssomnias[mh] OR Sleep[mh] OR "sleep disturbance*" OR "sleep disorder*" OR "insomni*" OR "sleep apne*" OR "excessive daytime sleepiness" OR "sleep quality" AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
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
    groupname: 'Interventioner',
    id: 'S030',
    translations: {
      dk: 'Interventioner',
      en: 'Interventions'
    },
    ordering: {
      dk: 3,
      en: 3
    },
    groups: [
      {
        id: 'S030010',
        name: 'S030010',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Basale',
          en: 'Basic'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030010010',
        name: 'S030010010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030010',
        translations: {
          dk: 'Sonde ernæring',
          en: 'Tube feeding'
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            '"Enteral Nutrition"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'Enteral Nutrition[mh] OR "tube feeding"[ti:~0] OR "enteral nutrition"[ti] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Enteral Nutrition"[mh] OR "tube feeding"[tiab:~0] OR "enteral nutrition"[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030020',
        name: 'S030020',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Emotionelle/affektive',
          en: 'Emotional/affective'
        },
        ordering: {
          dk: 3,
          en: 3
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030020010',
        name: 'S030020010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030020',
        translations: {
          dk: 'SSRI – Selective Serotonin Reuptake Inhibitors',
          en: 'SSRI – Selective Serotonin Reuptake Inhibitors'
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            '"Selective Serotonin Reuptake Inhibitors"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            'Selective Serotonin Reuptake Inhibitors[mh] OR "Selective Serotonin Reuptake Inhibitors"[ti] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            '"Selective Serotonin Reuptake Inhibitors"[mh] OR "Selective Serotonin Reuptake Inhibitors"[tiab] AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030030',
        name: 'S030030',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Psyko-sociale',
          en: 'Psychosocial'
        },
        ordering: {
          dk: 5,
          en: 5
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030030010',
        name: 'S030030010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030030',
        translations: {
          dk: 'Mindfulness',
          en: 'Mindfulness'
        },
        ordering: {
          dk: 6,
          en: 6
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030030020',
        name: 'S030030020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030030',
        translations: {
          dk: 'Acceptance & commitment therapy',
          en: 'Acceptance & commitment therapy'
        },
        ordering: {
          dk: 7,
          en: 7
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030040',
        name: 'S030040',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Sensomotoriske',
          en: 'Sensorimotor'
        },
        ordering: {
          dk: 8,
          en: 8
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030040010',
        name: 'S030040010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030040',
        translations: {
          dk: 'CIMT/mCIMT – (modified) Constraint-induced Movement Therapy',
          en: 'CIMT/mCIMT – (modified) Constraint-induced Movement Therapy'
        },
        ordering: {
          dk: 9,
          en: 9
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
        id: 'S030040020',
        name: 'S030040020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030040',
        translations: {
          dk: 'HIGT – High Intensity Gait Training',
          en: 'HIGT – High Intensity Gait Training'
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            '"high intensity gait train*"[ti] AND (' + standardString['normal'] + ')'
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030040030',
        name: 'S030040030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030040',
        translations: {
          dk: 'Task Orientated Training',
          en: 'Task Orientated Training'
        },
        ordering: {
          dk: 11,
          en: 11
        },
        searchStrings: {
          narrow: [
            '"task training"[ti:~1] AND (' + standardString['normal'] + ')'
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030040040',
        name: 'S030040040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030040',
        translations: {
          dk: 'Udholdenhedstræning',
          en: 'Endurance training'
        },
        ordering: {
          dk: 12,
          en: 12
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
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S030040050',
        name: 'S030040050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S030040',
        translations: {
          dk: 'Elstimulation',
          en: 'Electrical stimulation'
        },
        ordering: {
          dk: 13,
          en: 13
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
    groupname: 'Måleredskaber',
    id: 'S040',
    translations: {
      dk: 'Måleredskaber',
      en: 'Measurement tools'
    },
    ordering: {
      dk: 4,
      en: 4
    },
    groups: [
      {
        id: 'S040010',
        name: 'S040010',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Funktionsevne',
          en: 'Functional capacity'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010010',
        name: 'S040010010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Functional Independence Measure (FIM)',
          en: 'Functional Independence Measure (FIM)'
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Functional independence measure"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010020',
        name: 'S040010020',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Early Functional Abilities (EFA)',
          en: 'Early Functional Abilities (EFA)'
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Early Functional abilities"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010030',
        name: 'S040010030',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Barthel Index (BI)',
          en: 'Barthel Index (BI)'
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Bartel index"[all] OR "barthel index"[all] OR "barthel 20"[all] OR "barthel 100"[all] OR "barthel 20"[all] OR "barthel 100"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010040',
        name: 'S040010040',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Early Rehabilitation Barthel Index (ERBI)',
          en: 'Early Rehabilitation Barthel Index (ERBI)'
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'ERBI[all] OR "early rehabilitation bart* inde*"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010050',
        name: 'S040010050',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Modified Rankin Scale (mRS)',
          en: 'Modified Rankin Scale (mRS)'
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Modified Rankin Scale"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010060',
        name: 'S040010060',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Glasgow Coma Scale (GCS)',
          en: 'Glasgow Coma Scale (GCS)'
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Glasgow Coma Scale"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040010070',
        name: 'S040010070',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040010',
        translations: {
          dk: 'Functional Oral Intake Scale (FOIS)',
          en: 'Functional Oral Intake Scale (FOIS)'
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"Functional Oral Intake Scale"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040020',
        name: 'S040020',
        buttons: true,
        
        maintopic: true,
        translations: {
          dk: 'Kognitive',
          en: 'Cognitive'
        },
        ordering: {
          dk: 9,
          en: 9
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S040020010',
        name: 'S040020010',
        buttons: true,
        
        subtopiclevel: 1,
        maintopicIdLevel1: 'S040020',
        translations: {
          dk: 'The Montreal Cognitive Assessment (MoCA)',
          en: 'The Montreal Cognitive Assessment (MoCA)'
        },
        ordering: {
          dk: 10,
          en: 10
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            '"moca"[all] OR "Montreal Cognitive Assessment"[all] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
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
    groupname: 'Sårbare grupper',
    id: 'S050',
    translations: {
      dk: 'Sårbare grupper',
      en: 'Vulnerable groups'
    },
    ordering: {
      dk: 5,
      en: 5
    },
    groups: [
      {
        id: 'S050010',
        name: 'S050010',
        buttons: true,
        
        translations: {
          dk: 'Civilstand',
          en: 'Marital status'
        },
        ordering: {
          dk: 1,
          en: 1
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Marital Status[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050020',
        name: 'S050020',
        buttons: true,
        
        translations: {
          dk: 'Etnicitet',
          en: 'Ethnicity'
        },
        ordering: {
          dk: 2,
          en: 2
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Ethnicity[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050030',
        name: 'S050030',
        buttons: true,
        
        translations: {
          dk: 'Patientinddragelse',
          en: 'Patient involvement'
        },
        ordering: {
          dk: 3,
          en: 3
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Patient Participation[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050040',
        name: 'S050040',
        buttons: true,
        
        translations: {
          dk: 'Pårørende',
          en: 'Relatives'
        },
        ordering: {
          dk: 4,
          en: 4
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Caregivers[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050050',
        name: 'S050050',
        buttons: true,
        
        translations: {
          dk: 'Sociodemografiske forhold',
          en: 'Sociodemographic factors'
        },
        ordering: {
          dk: 5,
          en: 5
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Sociodemographic Factors[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050060',
        name: 'S050060',
        buttons: true,
        
        translations: {
          dk: 'Socioøkonomisk status',
          en: 'Socioeconomic status'
        },
        ordering: {
          dk: 6,
          en: 6
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Socioeconomic Factors[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050070',
        name: 'S050070',
        buttons: true,
        
        translations: {
          dk: 'Sundhedskompetence',
          en: 'Health literacy'
        },
        ordering: {
          dk: 7,
          en: 7
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Health Literacy[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050080',
        name: 'S050080',
        buttons: true,
        
        translations: {
          dk: 'Uddannelsesbaggrund',
          en: 'Educational background'
        },
        ordering: {
          dk: 8,
          en: 8
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Educational Status[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        id: 'S050090',
        name: 'S050090',
        buttons: true,
        
        translations: {
          dk: 'Ulighed',
          en: 'Inequality'
        },
        ordering: {
          dk: 9,
          en: 9
        },
        searchStrings: {
          narrow: [
            ''
          ],
          normal: [
            'Health Inequities[mh] AND (' + standardString['normal'] + ')' 
          ],
          broad: [
            ''
          ]
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
];