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

export const standardString = {
  narrow: '"Skin Neoplasms"[majr] OR "Keratosis, Actinic"[majr] OR "Bowen\'s Disease"[majr] OR "Carcinoma, Basal Cell"[majr] OR "Melanoma"[majr] OR "Carcinoma, Merkel Cell"[majr] OR "Lymphoma, T-Cell, Cutaneous"[majr] OR ("Lymphoma, B-Cell"[majr] AND "Skin Neoplasms"[majr]) OR ("Skin Neoplasms"[mh] AND "Carcinoma, Squamous Cell"[majr]) OR "Keratoacanthoma"[majr]',
  normal: '"Skin Neoplasms"[mh] OR "Keratosis, Actinic"[mh] OR "actinic keratos*"[ti] OR "actinic cheilit*"[ti] OR "solar keratos*"[ti] OR "Carcinoma, Merkel Cell"[mh] OR "merkel cell carcinom*"[ti] OR "merkel cell cancer*"[ti] OR "merkel cell tumo*"[ti] OR "Bowen\'s Disease"[mh] OR "Bowen disease"[ti] OR (("squamous cell carcinoma in situ"[ti] OR "SCCIS"[ti] OR "Carcinoma in Situ"[mh]) AND ("Skin Neoplasms"[mh] OR "skin"[ti] OR "cutaneous"[ti])) OR "Carcinoma, Basal Cell"[mh] OR "basal cell cancer"[ti] OR "basal cell tumo*"[ti] OR "BCC"[ti] OR "Melanoma"[mh] OR "melanom*"[ti] OR "lentigo maligna"[ti] OR "Hutchinson\'s freckle"[ti] OR "melanotic freckle"[ti] OR "Lymphoma, T-Cell, Cutaneous"[mh] OR ("Lymphoma, B-Cell"[mh] AND "Skin Neoplasms"[mh]) OR "cutaneous lymphom*"[ti] OR "mycosis fungoides*"[ti] OR "sezary"[ti] OR ("Skin Neoplasms"[mh] AND "Carcinoma, Squamous Cell"[mh]) OR "Keratoacanthoma"[mh] OR "cSCC"[ti] OR "cutaneous squamous cell carcinoma"[ti] OR "skin cancer"[ti] OR "skin tumo*"[ti] OR "cutaneous malignan*"[ti] OR "malignant cutan*"[ti]',
  broad: '"Skin Neoplasms"[mh] OR "Keratosis, Actinic"[mh] OR "actinic keratos*"[tiab] OR "actinic cheilit*"[tiab] OR "solar keratos*"[tiab] OR "Carcinoma, Merkel Cell"[mh] OR "merkel cell carcinom*"[tiab] OR "merkel cell cancer*"[tiab] OR "merkel cell tumo*"[tiab] OR "Bowen\'s Disease"[mh] OR "Bowen disease"[tiab] OR (("squamous cell carcinoma in situ"[tiab] OR "SCCIS"[tiab] OR "Carcinoma in Situ"[mh]) AND ("Skin Neoplasms"[mh] OR "skin"[tiab] OR "cutaneous"[tiab])) OR "Carcinoma, Basal Cell"[mh] OR "basal cell cancer"[tiab] OR "basal cell tumo*"[tiab] OR "BCC"[tiab] OR "Melanoma"[mh] OR "melanom*"[tiab] OR "lentigo maligna"[tiab] OR "Hutchinson\'s freckle"[tiab] OR "melanotic freckle"[tiab] OR "Lymphoma, T-Cell, Cutaneous"[mh] OR ("Lymphoma, B-Cell"[mh] AND "Skin Neoplasms"[mh]) OR "cutaneous lymphom*"[tiab] OR "mycosis fungoides*"[tiab] OR "sezary"[tiab] OR ("Skin Neoplasms"[mh] AND "Carcinoma, Squamous Cell"[mh]) OR "Keratoacanthoma"[mh] OR "cSCC"[tiab] OR "cutaneous squamous cell carcinoma"[tiab] OR "skin cancer"[tiab] OR "skin tumo*"[tiab] OR "cutaneous malignan*"[tiab] OR "malignant cutan*"[tiab]',
}

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
    groupname: 'Skin cancer and precancerous lesions', id: 'S10',
    translations: {
        dk: 'Hudkræft og forstadier',
        en: 'Skin cancer and precancerous lesions'
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
        name: 'All types', 
        buttons: true, 
        id: 'S10010',
        translations: {
          dk: 'Alle typer',
          en: 'All types'
        }, 
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [standardString['narrow']],
          normal: [standardString['normal']],
          broad: [standardString['broad']]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Actinic keratosis', 
        buttons: true, 
        id: 'S10020',
        translations: {
          dk: 'Aktiniske keratoser',
          en: 'Actinic keratosis'
        }, 
        ordering: { 
          dk: 1, 
          en: 1
        },
        searchStrings: {
          narrow: [
            '"Keratosis, Actinic"[majr]'
          ],
          normal: [
            '"Keratosis, Actinic"[mh] OR "actinic keratos*"[ti] OR "actinic cheilit*"[ti] OR "solar keratos*"[ti]'
          ],
          broad: [
            '"Keratosis, Actinic"[mh] OR "actinic keratos*"[tiab] OR "actinic cheilit*"[tiab] OR "solar keratos*"[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Merkel Cell Carcinoma', 
        buttons: true, 
        id: 'S10030',
        translations: {
          dk: 'Merkelcellekarcinom',
          en: 'Merkel Cell Carcinoma'
        }, 
        ordering: { 
          dk: null, 
          en: null
        },
        searchStrings: {
          narrow: [
            '"Carcinoma, Merkel Cell"[majr]'
          ],
          normal: [
            '"Carcinoma, Merkel Cell"[mh] OR "merkel cell carcinom*"[ti] OR "merkel cell cancer*"[ti] OR "merkel cell tumo*"[ti]'
          ],
          broad: [
            '"Carcinoma, Merkel Cell"[mh] OR "merkel cell carcinom*"[tiab] OR "merkel cell cancer*"[tiab] OR "merkel cell tumo*"[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Bowen\'s disease', 
        buttons: true, 
        id: 'S10040',
        translations: {
          dk: 'Bowens sygdom',
          en: 'Bowen\'s disease'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Bowen\'s Disease"[majr]'
          ],
          normal: [
            '"Bowen\'s Disease"[mh] OR "Bowen\'s disease"[ti] OR "Bowen disease"[ti] OR (("squamous cell carcinoma in situ"[ti] OR "SCCIS"[ti] OR "Carcinoma in Situ"[mh]) AND ("Skin Neoplasms"[mh] OR "skin"[ti] OR "cutaneous"[ti]))'
          ],
          broad: [
            '"Bowen\'s Disease"[mh] OR "Bowen\'s disease"[tiab] OR "Bowen disease"[tiab] OR (("squamous cell carcinoma in situ"[tiab] OR "SCCIS"[tiab] OR "Carcinoma in Situ"[mh]) AND ("Skin Neoplasms"[mh] OR "skin"[tiab] OR "cutaneous"[tiab]))'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Basal cell carcinoma', 
        buttons: true, 
        id: 'S10050',
        translations: {
          dk: 'Basalcellekarcinom',
          en: 'Basal cell carcinoma',
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Carcinoma, Basal Cell"[majr]'
          ],
          normal: [
            '"Carcinoma, Basal Cell"[mh] OR "basal cell cancer"[ti] OR "basal cell tumo*"[ti] or BCC[ti]'
          ],
          broad: [
            '"Carcinoma, Basal Cell"[mh] OR "basal cell cancer"[tiab] OR "basal cell tumo*"[tiab] or BCC[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Melanoma', 
        buttons: true, 
        id: 'S10060',
        translations: {
          dk: 'Melanom',
          en: 'Melanoma'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Melanoma"[majr]'
          ],
          normal: [
            '"Melanoma"[mh] OR "melanom*"[ti] OR "lentigo maligna"[ti] OR "Hutchinson\'s freckle"[ti] OR "Hutchinsons freckle"[ti] OR "melanotic freckle"[ti]'
          ],
          broad: [
            '"Nevi and Melanomas"[mh] OR "melanom*"[tiab] OR "lentigo maligna"[tiab] OR "Hutchinson\'s freckle"[tiab] OR "Hutchinsons freckle"[ti] OR "melanotic freckle"[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Cutaneous Lymphoma', 
        buttons: true, 
        id: 'S10070',
        translations: {
          dk: 'Kutant lymfom',
          en: 'Cutaneous Lymphoma',
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Lymphoma, T-Cell, Cutaneous"[majr] OR ("Lymphoma, B-Cell"[majr] AND "Skin Neoplasms"[majr])'
          ],
          normal: [
            '"Lymphoma, T-Cell, Cutaneous"[mh] OR ("Lymphoma, B-Cell"[mh] AND "Skin Neoplasms"[mh]) OR "cutaneous lymphom*"[ti] OR "mycosis fungoide*"[ti] OR "sezary"[ti]'
          ],
          broad: [
            '"Lymphoma, T-Cell, Cutaneous"[mh] OR ("Lymphoma, B-Cell"[mh] AND "Skin Neoplasms"[mh]) OR "cutaneous lymphom*"[tiab] OR "mycosis fungoide*"[tiab] OR "sezary"[tiab]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Squamous cell carcinoma', 
        buttons: true, 
        id: 'S10080',
        translations: {
          dk: 'Spinocellulært karcinom',
          en: 'Squamous cell carcinoma',
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Skin Neoplasms"[majr] AND "Carcinoma, Squamous Cell"[majr]) OR "Keratoacanthoma"[majr]'
          ],
          normal: [
            '("Skin Neoplasms"[mh] AND "Carcinoma, Squamous Cell"[mh]) OR "Keratoacanthoma"[mh] OR "cSCC"[ti] OR "cutaneous squamous cell carcinoma"[ti] OR "non-melanoma skin cancer"[ti]'
          ],
          broad: [
            '("Skin Neoplasms"[mh] AND "Carcinoma, Squamous Cell"[mh]) OR "Keratoacanthoma"[mh] OR "cSCC"[tiab] OR "squamous cell carcinoma"[tiab] OR "non-melanoma skin cancer"[tiab]'
          ]
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
    groupname: 'Prevention',
    id: 'S20', 
    translations: {
      dk: 'Forebyggelse',
      en: 'Prevention'
    }, 
    ordering: { 
      dk: 2, 
      en: 2 
    },
    groups: [
      {
        name: 'Lifestyle and diet', 
        buttons: true, 
        id: 'S20010',
        translations: {
          dk: 'Livsstil og kost',
          en: 'Lifestyle and diet'
        }, 
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '("Sunbathing"[majr] OR "Suntan"[majr] OR "Sunburn"[majr] OR "Diet, Food, and Nutrition"[majr] OR "Smoking"[majr]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Sunbathing"[mh] OR "Suntan"[mh] OR "Sunburn"[mh] OR "Diet, Food, and Nutrition"[mh] OR "Smoking"[mh] OR "sunbathing"[ti] OR "sunburn"[ti] OR "diet"[ti] or "smok*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Sunbathing"[mh] OR "Suntan"[mh] OR "Sunburn"[mh] OR "Diet, Food, and Nutrition"[mh] OR "Smoking"[mh] OR "sunbathing"[tiab] OR "sunburn"[tiab] OR "diet"[tiab] or "smok*"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Sun protection ', 
        buttons: true, 
        id: 'S20020',
        translations: {
          dk: 'Solbeskyttelse ',
          en: 'Sun protection '
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Sunscreening Agents"[majr] OR (("Protective Clothing"[majr] OR "Textiles"[majr]) AND "Ultraviolet Rays"[majr]) OR "Sun Protection Factor"[majr]'
          ],
          normal: [
            '"Sunscreening Agents"[mh] OR (("Protective Clothing"[mh] OR "Textiles"[mh]) AND "Ultraviolet Rays"[mh]) OR "Sun Protection Factor"[mh] OR "sunscreen"[ti] OR "photoprotect*"[ti] OR "sun protect*[ti] OR "skin cancer prevent*"[ti] OR "UV prot*"[ti] OR "Skin Neoplasms/prevention and control"[mh] OR "Melanoma/prevention and control"[mh] OR "Carcinoma, Basal Cell/prevention and control"[mh]'
          ],
          broad: [
            '"Sunscreening Agents"[mh] OR (("Protective Clothing"[mh] OR "Textiles"[mh]) AND "Ultraviolet Rays"[mh]) OR "Sun Protection Factor"[mh] OR "sunscreen"[tiab] OR "photoprotect*"[tiab] OR "sun protect*[tiab] OR "skin cancer prevent*"[tiab] OR "UV prot*"[tiab] OR "Skin Neoplasms/prevention and control"[mh] OR "Melanoma/prevention and control"[mh] OR "Carcinoma, Basal Cell/prevention and control"[mh]'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Chemoprevention', 
        buttons: true, 
        id: 'S20030',
        translations: {
          dk: 'Kemoprevention',
          en: 'Chemoprevention'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Chemoprevention"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Chemoprevention"[mh] OR "chemoprevent*"[ti] OR "chemo-prevent*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Chemoprevention"[mh] OR "chemoprevent*"[tiab] OR "chemo-prevent*"[tiab]) AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'Clinical measurements and diagnostics', 
    id: 'S30',
    translations: {
      dk: 'Kliniske målinger og diagnostik',
      en: 'Clinical measurements and diagnostics'
    }, 
    ordering: { 
      dk: 3, 
      en: 3 
    },
    groups: [
      {
        name: 'Dermoscopy', 
        buttons: true, 
        id: 'S30010',
        translations: {
          dk: 'Dermoskopi',
          en: 'Dermoscopy'
        }, 
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          narrow: [
            '"Dermoscopy"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Dermoscopy"[mh] OR "dermoscop*"[ti] OR "dermatoscop*"[ti] OR "epiluminescence"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Dermoscopy"[mh] OR "dermoscop*"[tiab] OR "dermatoscop*"[tiab] OR "epiluminescence"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Histopathology', 
        buttons: true, 
        id: 'S30020',
        translations: {
          dk: 'Histopatologi',
          en: 'Histopathology'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Skin Neoplasms/diagnosis"[majr] OR "Skin Neoplasms/pathology"[majr] OR "Skin Neoplasms/ultrastructure"[majr] OR (("Biopsy"[majr] OR "Pathology"[majr] OR "Histological Techniques"[majr]) AND (' + standardString['narrow'] + '))'
          ],
          normal: [
            '"Skin Neoplasms/diagnosis"[mh] OR "Skin Neoplasms/pathology"[mh] OR "Skin Neoplasms/ultrastructure"[mh] OR (("Biopsy"[mh] OR "biopsy"[ti] OR "Pathology"[mh] OR "histolog*"[ti] OR "Histological Techniques"[mh]) AND (' + standardString['normal'] + '))'
          ],
          broad: [
            '"Skin Neoplasms/diagnosis"[mh] OR "Skin Neoplasms/pathology"[mh] OR "Skin Neoplasms/ultrastructure"[mh] OR (("Biopsy"[mh] OR "biopsy"[tiab] OR "Pathology"[mh] OR "histolog*"[tiab] OR "Histological Techniques"[mh]) AND (' + standardString['broad'] + '))'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Non-invasive imaging', 
        buttons: true, 
        id: 'S30030',
        translations: {
          dk: 'Ikke-invasiv billeddannelse',
          en: 'Non-invasive imaging'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Microscopy, Confocal"[majr] OR "Tomography, Optical Coherence"[majr] OR "Ultrasonography"[majr] OR ("Skin/diagnostic imaging"[majr] NOT "Dermoscopy"[mh])) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Microscopy, Confocal"[mh] OR "Tomography, Optical Coherence"[mh] OR "Ultrasonography"[mh] OR ("Skin/diagnostic imaging"[mh] NOT "dermoscopy"[mh]) OR "reflectance confocal*"[ti] OR "RCM"[ti] OR "optical coherence*"[ti] OR "ultrasound"[ti] OR "confocal microscopy"[ti] OR "line-field confocal"[ti] OR "LC-OCT"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Microscopy, Confocal"[mh] OR "Tomography, Optical Coherence"[mh] OR "Ultrasonography"[mh] OR ("Skin/diagnostic imaging"[mh] NOT "dermoscopy"[mh]) OR "reflectance confocal*"[tiab] OR "RCM"[tiab] OR "optical coherence*"[tiab] OR "ultrasound"[tiab] OR "confocal microscopy"[tiab] OR "line-field confocal"[tiab] OR "LC-OCT"[tiab]) AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'Treatment', 
    id: 'S40',
    translations: {
      dk: 'Behandlingstyper',
      en: 'Treatment'
    }, 
    ordering: { 
      dk: 4, 
      en: 4 
    },
    groups: [
      {
        name: 'Topical', 
        buttons: true, 
        id: 'S40010',
        translations: {
          dk: 'Topikal',
          en: 'Topical'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Administration, Cutaneous"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Administration, Cutaneous"[mh] OR "topical"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Administration, Cutaneous"[mh] OR "topical"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Systemic', 
        buttons: true, 
        id: 'S40020',
        translations: {
          dk: 'Systemisk',
          en: 'Systemic'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Injections"[majr] OR "Infusions, Parenteral"[majr] OR "Administration, Intravenous"[majr] OR "Administration, Oral"[majr] OR "Chemotherapy, Cancer, Regional Perfusion"[majr]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Injections"[mh] OR "Infusions, Parenteral"[mh] OR "Administration, Intravenous"[mh] OR "Administration, Oral"[mh] OR "Chemotherapy, Cancer, Regional Perfusion"[mh] OR "systemic"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Injections"[mh] OR "Infusions, Parenteral"[mh] OR "Administration, Intravenous"[mh] OR "Administration, Oral"[mh] OR "Chemotherapy, Cancer, Regional Perfusion"[mh] OR "systemic"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Interventional', 
        buttons: true, 
        id: 'S40030',
        translations: {
          dk: 'Interventionel',
          en: 'Interventional'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Phototherapy"[majr] OR "Laser Therapy"[majr] OR "Lasers, Dye"[majr] OR "Lasers, Gas"[majr] OR "Lasers, Solid-State"[majr] OR "Dermatologic Surgical Procedures"[majr] OR "Surgical Procedures, Operative"[majr] OR "Radiotherapy"[majr] OR "Iontophoresis"[majr]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Phototherapy"[mh] OR "Laser Therapy"[mh] OR "Lasers, Dye"[mh] OR "Lasers, Gas"[mh] OR "Lasers, Solid-State"[mh] OR "Dermatologic Surgical Procedures"[mh] OR "Surgical Procedures, Operative"[mh] OR "Radiotherapy"[mh] OR "Iontophoresis"[mh] OR "mohs"[ti] OR "PDT"[ti] OR "photodynamic"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Phototherapy"[mh] OR "Laser Therapy"[mh] OR "Lasers, Dye"[mh] OR "Lasers, Gas"[mh] OR "Lasers, Solid-State"[mh] OR "Dermatologic Surgical Procedures"[mh] OR "Surgical Procedures, Operative"[mh] OR "Iontophoresis"[mh] OR "Radiotherapy"[mh] OR "mohs"[tiab] OR "PDT"[tiab] OR "photodynamic"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Side effects ', 
        buttons: true, 
        id: 'S40040',
        translations: {
          dk: 'Bivirkninger',
          en: 'Side effects '
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Cicatrix"[majr] OR "Dermatitis, Contact"[majr] OR "Drug-Related Side Effects and Adverse Reactions"[majr] OR "Hyperpigmentation"[majr] OR "Hypopigmentation"[majr] OR "Infections"[majr]) AND ("Administration, Cutaneous"[majr] OR ("Injections"[majr] OR "Infusions, Parenteral"[majr] OR "Administration, Intravenous"[majr] OR "Administration, Oral"[majr] OR "Chemotherapy, Cancer, Regional Perfusion"[majr]) OR ("Phototherapy"[majr] OR "Laser Therapy"[majr] OR "Lasers, Dye"[majr] OR "Lasers, Gas"[majr] OR "Lasers, Solid-State"[majr] OR "Dermatologic Surgical Procedures"[majr] OR "Surgical Procedures, Operative"[majr] OR "Radiotherapy"[majr] OR "Iontophoresis"[majr])) AND (' + standardString['narrow'] + ')'
          ], // Combined with sting from topical, systemic and interventional: narrow (remember to edit both)
          normal: [
            '("Cicatrix"[mh] OR "Dermatitis, Contact"[mh] OR "Drug-Related Side Effects and Adverse Reactions"[mh] OR "Hyperpigmentation"[mh] OR "Hypopigmentation"[mh] OR "Infections"[mh] OR "adverse"[ti] OR "allerg*"[ti] OR "dyspigm*"[ti] OR "hyperpigm*"[ti] OR "hypopigm*"[ti] OR "infect*"[ti] OR "scar*"[ti] OR "side effect*"[ti]) AND (("Administration, Cutaneous"[mh] OR "topical"[ti]) OR (("Injections"[mh] OR "Infusions, Parenteral"[mh] OR "Administration, Intravenous"[mh] OR "Administration, Oral"[mh] OR "Chemotherapy, Cancer, Regional Perfusion"[mh] OR "systemic"[ti]) OR ("Phototherapy"[mh] OR "Laser Therapy"[mh] OR "Lasers, Dye"[mh] OR "Lasers, Gas"[mh] OR "Lasers, Solid-State"[mh] OR "Dermatologic Surgical Procedures"[mh] OR "Surgical Procedures, Operative"[mh] OR "Radiotherapy"[mh] OR "Iontophoresis"[mh] OR "mohs"[ti] OR "PDT"[ti] OR "photodynamic"[ti]))) AND (' + standardString['normal'] + ')'
          ], // Combined with sting from topical, systemic and interventional: normal (remember to edit both)
          broad: [
            '("Cicatrix"[mh] OR "Dermatitis, Contact"[mh] OR "Drug-Related Side Effects and Adverse Reactions"[mh] OR "Hyperpigmentation"[mh] OR "Hypopigmentation"[mh] OR "Infections"[mh] OR "adverse"[tiab] OR "allerg*"[tiab] OR "dyspigm*"[tiab] OR "hyperpigm*"[tiab] OR "hypopigm*"[tiab] OR "infect*"[tiab] OR "scar*"[tiab] OR "side effect*"[tiab]) AND (("Administration, Cutaneous"[mh] OR "topical"[tiab]) OR ("Injections"[mh] OR "Infusions, Parenteral"[mh] OR "Administration, Intravenous"[mh] OR "Administration, Oral"[mh] OR "Chemotherapy, Cancer, Regional Perfusion"[mh] OR "systemic"[tiab]) OR ("Phototherapy"[mh] OR "Laser Therapy"[mh] OR "Lasers, Dye"[mh] OR "Lasers, Gas"[mh] OR "Lasers, Solid-State"[mh] OR "Dermatologic Surgical Procedures"[mh] OR "Surgical Procedures, Operative"[mh] OR "Iontophoresis"[mh] OR "Radiotherapy"[mh] OR "mohs"[tiab] OR "PDT"[tiab] OR "photodynamic"[tiab])) AND (' + standardString['broad'] + ')'
          ], // Combined with sting from topical, systemic and interventional: broad (remember to edit both)
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
    groupname: 'Risk assessment', 
    id: 'S50',
    translations: {
        dk: 'Risikovurdering',
        en: 'Risk assessment'
    }, 
    ordering: { 
      dk: 5, 
      en: 5 
    },
    groups: [
      {
        name: 'Transplant recipient', 
        buttons: true, 
        id: 'S50010',
        translations: {
          dk: 'Transplantationsmodtager',
          en: 'Transplant recipient'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Organ Transplantation"[majr] OR "Transplant Recipients"[majr]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Organ Transplantation"[mh] OR "Transplant Recipients"[mh] OR "organ transplant*"[ti] OR "OTR"[ti] OR "transplant recipient*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Organ Transplantation"[mh] OR "Transplant Recipients"[mh] OR "organ transplant*"[tiab] OR "OTR"[tiab] OR "transplant recipient*"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Skin type', 
        buttons: true, 
        id: 'S50020',
        translations: {
          dk: 'Hudtype',
          en: 'Skin type'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Ethnicity"[majr] OR "Hair Color"[majr] OR "Phenotype"[majr] OR "Skin Pigmentation"[majr] OR "White People"[majr]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Ethnicity"[mh] OR "Hair Color"[mh] OR "Phenotype"[mh] OR "Skin Pigmentation"[mh] OR "White People"[mh] OR "skin type*"[ti] OR "red hair*"[ti] OR "freckl*"[ti] OR "fitzpatrick"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Ethnicity"[mh] OR "Hair Color"[mh] OR "Phenotype"[mh] OR "Skin Pigmentation"[mh] OR "White People"[mh] OR "skin type*"[tiab] OR "red hair*"[tiab] OR "freckl*"[tiab] OR "fitzpatrick"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Elderly people', 
        buttons: true, 
        id: 'S50030',
        translations: {
          dk: 'Ældre',
          en: 'Elderly people'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Aged"[mh] OR "Aged, 80 and over"[mh]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Aged"[mh] OR "Aged, 80 and over"[mh] OR "elder*"[ti] OR "older adult*"[ti] "older patient*"[ti] OR "older person*"[ti] OR "older people"[ti] OR "older age"[ti] OR "geriatr*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Aged"[mh] OR "Aged, 80 and over"[mh] OR "elder*"[tiab] OR "older adult*"[tiab] "older patient*"[tiab] OR "older person*"[tiab] OR "older people"[tiab] OR "older age"[tiab] OR "geriatr*"[tiab]) AND (' + standardString['broad'] + ')'
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
        name: 'Children', 
        buttons: true, 
        id: 'S50040',
        translations: {
          dk: 'Børn',
          en: 'Children'
        }, 
        ordering: { 
          dk: null, 
          en: null },
        searchStrings: {
          narrow: [
            '("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh] OR "child*"[ti] OR "newborn*"[ti] OR "teenager*"[ti] OR "adolescent*"[ti] OR "infan*"[ti] OR "baby"[ti] OR "babies"[ti] OR "preterm*"[ti] OR "premature"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Adolescent"[mh] OR "Child"[mh] OR "Infant"[mh] OR "child*"[tiab] OR "newborn*"[tiab] OR "teenager*"[tiab] OR "adolescent*"[tiab] OR "infan*"[tiab] OR "baby"[tiab] OR "babies"[tiab] OR "preterm*"[tiab] OR "premature"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Genetics', 
        buttons: true, 
        id: 'S50050',
        translations: {
          dk: 'Genetik',
          en: 'Genetics'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Neoplastic Syndromes, Hereditary"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Neoplastic Syndromes, Hereditary"[mh] OR "hereditary"[ti] OR "genetic"[ti] OR "genodermat*"[ti] OR "Gorlin*"[ti] OR "basal cell nev*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Neoplastic Syndromes, Hereditary"[mh] OR "hereditary"[tiab] OR "genetic"[tiab] OR "genodermat*"[tiab] OR "Gorlin*"[tiab] OR "basal cell nev*"[tiab]) AND (' + standardString['broad'] + ')'
          ]
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
    groupname: 'Other topics', 
    id: 'S60',
    translations: {
      dk: 'Andre emner',
      en: 'Other topics'
    }, 
    ordering: { 
      dk: 6, 
      en: 6 
    },
    groups: [
      {
        name: 'Animal models', 
        buttons: true, 
        id: 'S60010',
        translations: {
          dk: 'Dyremodeller',
          en: 'Animal models'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Models, Animal"[majr] AND (' + standardString['narrow'] + ')'
            ],
          normal: [
            '("Models, Animal"[mh] OR "animal"[ti] OR "murine"[ti] OR "porcine"[ti] OR "rodent"[ti] OR "mouse"[ti] OR "mice"[ti] OR "rat"[ti] OR "pig"[ti] OR "hamster"[ti]) AND (' + standardString['normal'] + ')'
            ],
          broad: [
            '("Models, Animal"[mh] OR "animal"[tiab] OR "murine"[tiab] OR "porcine"[tiab] OR "rodent"[tiab] OR "mouse"[tiab] OR "mice"[tiab] OR "rat"[tiab] OR "pig"[tiab] OR "hamster"[tiab]) AND (' + standardString['broad'] + ')'
            ]
          },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Economics', 
        buttons: true, 
        id: 'S60020',
        translations: {
          dk: 'Økonomi',
          en: 'Economics'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Economics"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Economics"[mh] OR "health econ*"[ti] OR "healthcare spending"[ti] OR "finance*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Economics"[mh] OR "health econ*"[tiab] OR "healthcare spending"[tiab] OR "finance*"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Artificial intelligence (AI)', 
        buttons: true, 
        id: 'S60030',
        translations: {
          dk: 'Kunstig intelligens (AI)',
          en: 'Artificial intelligence (AI)'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Algorithms"[majr] AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Algorithms"[mh] OR "artificial intelligence"[ti] OR "augmented intelligence"[ti] OR "machine learning"[ti] OR "deep learning"[ti] OR "algorithm*"[ti] OR "neural net*"[ti] OR "convolut*"[ti] OR "language model*"[ti] OR "transformer*"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Algorithms"[mh] OR "artificial intelligence"[tiab] OR "augmented intelligence"[tiab] OR "machine learning"[tiab] OR "deep learning"[tiab] OR "algorithm*"[tiab] OR "neural net*"[tiab] OR "convolut*"[tiab] OR "language model*"[tiab] OR "transformer*"[tiab]) AND (' + standardString['broad'] + ')'
          ]
        },
        searchStringComment: {
          dk: "",
          en: ""
        },
        tooltip: {
          dk: "",
          en: ""
        }
      },
      {
        name: 'Teledermatology', 
        buttons: true, 
        id: 'S60040',
        translations: {
          dk: 'Teledermatologi',
          en: 'Teledermatology'
        }, 
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '("Telemedicine"[majr] OR "Remote Consultation"[majr] OR "Telenursing"[majr]) AND (' + standardString['narrow'] + ')'
          ],
          normal: [
            '("Telemedicine"[mh] OR "Remote Consultation"[mh] OR "Telenursing"[mh] OR "remote"[ti] OR "online"[ti] OR "virtual"[ti] OR "video"[ti] OR "teledermatol*"[ti] OR "telemed*"[ti] OR "store-and-forward"[ti]) AND (' + standardString['normal'] + ')'
          ],
          broad: [
            '("Telemedicine"[mh] OR "Remote Consultation"[mh] OR "Telenursing"[mh] OR "remote"[tiab] OR "online"[tiab] OR "virtual"[tiab] OR "video"[tiab] OR "teledermatol*"[tiab] OR "telemed*"[tiab] OR "store-and-forward"[tiab]) AND (' + standardString['broad'] + ')'
          ]
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
