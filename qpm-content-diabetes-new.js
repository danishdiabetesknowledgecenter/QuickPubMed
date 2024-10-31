/**
 * If branch nodes include a children array
 * If lead node dont include a children array
 */
const treeselectOptions = [
  // Skabelonskategori (Branch node)
  {
    id: "S00",
    label: "Skabelonkategori",
    translations: {
      dk: "Skabelonkategori",
      en: "Template category",
    },
    ordering: {
      dk: 0,
      en: 0,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [
      // Topic 1 (Leaf node)
      {
        id: "S00010",
        label: "Topic 1",
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
      // Topic 2 (Branch node)
      {
        id: "S00020",
        label: "Topic 2",
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
        children: [
          // Topic 2.1 (Branch node)
          {
            id: "S00030",
            label: "Topic 2.1",
            translations: {
              dk: "Emne 2.1",
              en: "Topic 2.1",
            },
            ordering: {
              dk: 1,
              en: 1,
            },
            tooltip: {
              dk: "",
              en: "",
            },
            children: [
              // Topic 2.1.1 (Leaf node)
              {
                id: "S00040",
                label: "Topic 2.1.1",
                translations: {
                  dk: "Emne 2.1.1",
                  en: "Topic 2.1.1",
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
              // Topic 2.1.2 (Leaf node)
              {
                id: "S00050",
                label: "Topic 2.1.2",
                translations: {
                  dk: "Emne 2.1.2",
                  en: "Topic 2.1.2",
                },
                ordering: {
                  dk: 2,
                  en: 2,
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
              // Topic 2.1.3 (Leaf node)
              {
                id: "S00060",
                label: "Topic 2.1.3",
                translations: {
                  dk: "Emne 2.1.3",
                  en: "Topic 2.1.3",
                },
                ordering: {
                  dk: 3,
                  en: 3,
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
          },
          // Topic 2.2 (Leaf node)
          {
            id: "S00070",
            label: "Topic 2.2",
            translations: {
              dk: "Emne 2.2",
              en: "Topic 2.2",
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
          // Topic 2.3 (Leaf node)
          {
            id: "S00080",
            label: "Topic 2.3",
            translations: {
              dk: "Emne 2.3",
              en: "Topic 2.3",
            },
            ordering: {
              dk: 3,
              en: 3,
            },
            tooltip: {
              dk: "",
              en: "",
            },
          },
        ],
      },
      // Topic 3 (Leaf node)
      {
        id: "S00090",
        label: "Topic 3",
        translations: {
          dk: "Emne 3",
          en: "Topic 3",
        },
        ordering: {
          dk: 3,
          en: 3,
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
  },
  // Diabetestype
  {
    id: "S10",
    label: "Diabetestype",
    translations: {
      dk: "Diabetestype",
      en: "Diabetes type",
    },
    ordering: {
      dk: 1,
      en: 1,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Komplikationer
  {
    id: "S20",
    label: "Komplikationer",
    translations: {
      dk: "Komplikationer",
      en: "Complications",
    },
    ordering: {
      dk: 2,
      en: 2,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Medicinsk behandling
  {
    id: "S30",
    label: "Medicinsk behandling",
    translations: {
      dk: "Medicinsk behandling",
      en: "Medical treatment",
    },
    ordering: {
      dk: 3,
      en: 3,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Kost
  {
    id: "S40",
    label: "Kost",
    translations: {
      dk: "Kost",
      en: "Diet",
    },
    ordering: {
      dk: 4,
      en: 4,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Teknologi
  {
    id: "S50",
    label: "Teknologi",
    translations: {
      dk: "Teknologi",
      en: "Technology",
    },
    ordering: {
      dk: 5,
      en: 5,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Klinske retningslinjer
  {
    id: "S60",
    label: "Kliniske retningslinjer",
    translations: {
      dk: "Kliniske retningslinjer",
      en: "Clinical guidelines",
    },
    ordering: {
      dk: 6,
      en: 6,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Mental sunhed
  {
    id: "S70",
    label: "Mental sundhed",
    translations: {
      dk: "Mental sundhed",
      en: "Mental health",
    },
    ordering: {
      dk: 7,
      en: 7,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Forebyggelse og risikofaktorer
  {
    id: "S80",
    label: "Forebyggelse og risikofaktorer",
    translations: {
      dk: "Forebyggelse og risikofaktorer",
      en: "Prevention and resk factors",
    },
    ordering: {
      dk: 8,
      en: 8,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Særlige grupper
  {
    id: "S90",
    label: "Særlige grupper",
    translations: {
      dk: "Særlige grupper",
      en: "Special groups",
    },
    ordering: {
      dk: 9,
      en: 9,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // Andre emner
  {
    id: "SXX",
    label: "Andre emner",
    translations: {
      dk: "Andre emner",
      en: "Other topics",
    },
    ordering: {
      dk: 10,
      en: 10,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
  // COVID-19
  {
    id: "C10",
    label: "COVID-19",
    translations: {
      dk: "COVID-19",
      en: "COVID-19",
    },
    ordering: {
      dk: 11,
      en: 11,
    },
    tooltip: {
      dk: "",
      en: "",
    },
    children: [],
  },
];
