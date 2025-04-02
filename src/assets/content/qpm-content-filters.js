/**
 * Represents a filter in the application.
 * @typedef {Object} Filter
 * @property {string} id - The unique identifier of the filter.
 * @property {string} groupname - The name of the filter group.
 * @property {Object} translations - The translations for different languages.
 * @property {Object} ordering - The ordering information for different languages.
 * @property {Array<Choice>} choices - The choices associated with the filter.
 * @property {Object} tooltip - Tooltip information for different languages.
 */

/**
 * Represents a group within a filter.
 * @typedef {Object} Choice
 * @property {string} id - The unique identifier of the filter choice.
 * @property {string} name - The name of the filter choice.
 * @property {boolean} buttons - Indicates if buttons are used.
 * @property {boolean} [maintopic] - Indicates if this is a branch which has children.
 * @property {number} [subtopiclevel] - The nested level of the filter.
 * @property {string} [maintopicIdLevel1] - The ID of the parent.
 * @property {string} [maintopicIdLevel2] - The ID of the grand parent.
 * @property {Object} translations - The translations for different languages.
 * @property {Object} ordering - The ordering information for different languages.
 * @property {Object} [searchStrings] - Search strings for different scopes.
 * @property {Object} [searchStringComment] - Comments about the search strings.
 * @property {Object} tooltip - Tooltip information for different languages.
 * @property {boolean} [simpleSearch] - Indicates if simple search is enabled.
 * @property {boolean} [standardSimple] - Indicates if standard simple search is used.
 * @property {Object} [tooltip_simple] - Simple tooltip information.
 */

/** @type {Array<Filter>} */
export const filtrer = [
  {
    id: "L000",
    name: "L000",
    translations: {
      dk: "Skabelonkategori",
      en: "Template category",
    },
    // use null to mean unordered or any positive number to order this
    // element using the number as a priority with lower number being
    // higher priority (being shown earlier in the list).
    //? Maybe use negative values to represent elements always sorted last
    ordering: { dk: 0, en: 0 },
    choices: [
      {
        id: "L000010",
        name: "L000010",
        buttons: true,
        translations: {
          dk: "Afgrænsning 1",
          en: "Limit 1",
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
          dk: "",
          en: "",
        },
      },
      {
        id: "L000020",
        name: "L000020",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        translations: {
          dk: "Afgrænsning 2",
          en: "Limit 2",
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
        id: "L000020010",
        name: "L000020010",
        buttons: true,
        maintopic: true, // Angiver at dette element er en branch og har children elementer
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L000020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1",
          en: "Limit 2.1",
        },
        ordering: {
          dk: 3,
          en: 3,
        },
        tooltip: {
          dk: "Kommentar til denne afgrænsning.",
          en: "Comment about this topic.",
        },
      },
      {
        id: "L000020010010",
        name: "L000020010010",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "L000020010", // Angiver at dette element har et parent med dette id. (Afgrænsning 2.1)
        maintopicIdLevel2: "L000020", // Angiver at dette element har et grandparent med dette id (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1.1",
          en: "Limit 2.1.1",
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
          dk: "Kommentar til denne afgrænsning.",
          en: "Comment about this limit.",
        },
      },
      {
        id: "L000020010020",
        name: "L000020010020",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "L000020010", // Angiver at dette element har et parent med dette id. (Afgrænsning 2.1)
        maintopicIdLevel2: "L000020", // Angiver at dette element har et grandparent med dette id (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1.2",
          en: "Limit 2.1.2",
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
        id: "L000020010030",
        name: "L000020010030",
        buttons: true,
        subtopiclevel: 2, // Angiver at dette punkt ligger på 2. niveau (nedereste niveau)
        maintopicIdLevel1: "L000020010", // Angiver at dette element har et parent med dette id. (Afgrænsning 2.1)
        maintopicIdLevel2: "L000020", // Angiver at dette element har et grandparent med dette id (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.1.3",
          en: "Limit 2.1.3",
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
        id: "L000020020",
        name: "L000020020",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 1. niveau (miderste niveau)
        maintopicIdLevel1: "L000020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.2",
          en: "Limit 2.2",
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
        id: "L000020030",
        name: "L000020030",
        buttons: true,
        subtopiclevel: 1, // Angiver at dette punkt ligger på 2. niveau
        maintopicIdLevel1: "L000020", // Angiver at dette element har et parent med dette id. (Afgrænsning 2)
        translations: {
          dk: "Afgrænsning 2.3",
          en: "Limit 2.3",
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
        id: "L000030",
        name: "L000030",
        buttons: true,
        translations: {
          dk: "Afgrænsning 3",
          en: "Limit 3",
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
      dk: "",
      en: "",
    },
  },
  {
    id: "L010",
    name: "L010",
    isDefault: true,
    translations: {
      dk: "Reviewtype",
      en: "Review type",
    },
    ordering: {
      dk: 1,
      en: 1,
    },
    allowCustomInput: true,
    choices: [
      {
        id: "L010010",
        name: "L010010",
        buttons: true,
        translations: {
          dk: "Systematiske reviews",
          en: "Systematic reviews",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        simpleSearch: true,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler, hvor forskning systematisk er blevet indsamlet og gennemgået for at kunne vurdere, hvad man samlet set ved om et bestemt område.",
          en: "",
        },
        searchStrings: {
          narrow: [
            '(((((systematic*[tiab] AND review*[tiab] AND (medline[tiab] OR pubmed[tiab])) OR "systematic review"[tiab] OR "systematic literature"[tiab] OR "Meta-Analysis"[pt] OR meta-analy*[tiab] OR metaanaly*[tiab]) AND systematic[sb]) AND "Review"[pt]) OR "Cochrane Database Syst Rev"[ta]) NOT (protocol[ti] OR withdrawn[ti] OR "Retracted Publication"[pt])',
          ],
          normal: [
            '(systematic[sb] OR "Cochrane Database Syst Rev"[ta] OR ("Meta-Analysis"[pt] AND (search*[tiab] OR medline[tiab] OR pubmed[tiab] OR embase[tiab] OR cinahl[tiab]))) NOT (protocol[ti] OR withdrawn[ti] OR "Retracted Publication"[pt])',
          ],
          broad: [
            'systematic[sb] OR medline[tiab] OR pubmed[tiab] OR "Cochrane Database Syst Rev"[ta]',
          ],
        },
        searchStringComment: {
          dk: "Inkluderer udover systematiske reviews også metaanalyser, men ikke protokoller og artikler, som er trukket tilbage.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor forskning systematisk er blevet indsamlet og gennemgået for at kunne vurdere, hvad man samlet set ved om et bestemt område. Inkluderer udover systematiske reviews også metaanalyser, men ikke protokoller og artikler, som er trukket tilbage.",
          en: "",
        },
      },
      {
        id: "L010020",
        name: "L010020",
        buttons: false,
        translations: {
          dk: "Cochrane Reviews",
          en: "Cochrane Reviews",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        simpleSearch: true,
        standardSimple: false,
        tooltip_simple: {
          dk: "En særlig type forsk&shy;nings&shy;over&shy;sigter, som er ud&shy;arbej&shy;det efter strin&shy;gente metoder. Udgives af Cochrane Collaboration.",
          en: "",
        },
        searchStrings: {
          normal: [
            '"Cochrane Database Syst Rev"[ta]'
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
        id: "L010030",
        name: "L010030",
        buttons: false,
        translations: {
          dk: "Health Evidence",
          en: "Health Evidence",
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          normal: [
            '((39643008 39924762 39778431 39783962 39980013 39555961 39523481 39508277 39481539 39408238 39375006 39364789 39298713 39266933 39250878 39222689 39136500 39078846 39069716 39046308 39030553 38978627 38965721 38956175 38916824 38910533 38815494 38794717 38727771 38642385 38641818 38641320 38531052 38517995 38390312 38306363 38300694 38220510 38183054 38142513 38045667 38026322 38009414 38002654 37963101 37960319 37957775 37926437 37875170 37845187 37842295 37838299 37800068 37790916 37728724 37689140 37650824 37625030 37619781 37596488 37558553 37551161 37549197 37513574 37490288 37488260 37391571 37372656 37276984 37254718 37245685 37242214 37217038 37214251 37204620 36997475 36972801 36896895 36890466 36888890 36813546 36805371 36779907 36736057 36713951 36678193 36647042 36594235 36589795 36530883 36519956 36513271 36480969 36459907 36450440 36423358 36380456 36339633 36318674 36297075 36293659 36183316 36098720 36098300 36031150 36008559 35930592 35902429 35871956 35799947 35678196 35672940 35667728 35655374 35570250 35537861 35533131 35411702 35373905 35345509 35289514 35273056 35273011 35258463 35215542 35210284 35160245 35120528 35088407 35000144 34986271 34957791 34900827 34865645 34843670 34836356 34825839 34793562 34716594 34710147 34694005 34664329 34648979 34615674 34603479 34583608 34555181 34509590 34501572 34492544 34427595 34403455 34371867 34366228 34348965 34338787 34324218 34309961 34283229 34275771 34272960 34272127 34260997 34200592 34193471 34168293 34139330 34114650 34057201 34032824 33965297 33960110 33905087 33806997 33743839 33693499 33594445 33579237 33547579 33534729 33532614 33512717 33441384 33360516 33341999 33316148 33242455 33198717 33180775 33123206 33118936 33112239 33080479 33045905 33033085 33002545 32903679 32899917 32810195 32778032 32735227 32678471 32568666 32526091 32505214 32491181 32470201 32459654 32449201 32438908 32428300 32406186 32400300 32378196 32332487 32259237 32194215 32193015 32145487 32142510 32090119 31987117 31985700 31973038 31965748 31964667 31957306 31877685 31842988 31781857 31769843 31769532 31738997 31733163 31721428 31683759 31636052 31596494 31583250 31552570 31550487 31529625 31466731 31443185 31375180 31374573 31348529 31336986 31280431 31248094 31201437 31194900 31170176 31134284 31100793 31095079 31021975 30975686 30968941 30952576 30938046 30935396 30923163 30901325 30871517 30834852 30822496 30764511 30709362 30698533 30676058 30667501 30664494 30638909 30624760 30604592 30561620 30529576 30528217 30511918 30480773 30462877 30426553 30388861 30344509 30337466 30337465 30337464 30337347 30326501 30240042 30216635 30206335 30173219 30167936 30116744 30103263 30097811 30070019 30067587 30045740 30020090 30012382 30011314 30007585 30007275 29993339 29960809 29945775 29934481 29934478 29907356 29904998 29807048 29783064 29782556 29769078 29760355 29741425 29735475 29728346 29710788 29698713 29615442 29587686 29582538 29566684 29522789 29498547 29471267 29453742 29345109 29310610 29304148 29269890 29244241 29234435 29234414 29228855 29218018 29162585 29137055 29129039 29092883 28958212 28941313 28927313 28882745 28832911 28827256 28795682 28780542 28768248 28759943 28759107 28732572 28728958 28704405 28697259 28654627 28639706 28639319 28536448 28493887 28490559 28472859 28457933 28456513 28422560 28409688 28401529 28376441 30603319 28319239 28316796 28315575 28292300 28286340 28282465 28260263 28236296 28226200 28191333 28178985 28173623 28137729 28084431 28046205 28029178 28024276 28003299 27984672 27960229 27926892 27861583 27773709 27799615 27681948 27765575 27653960 27550905 27535644 27459860 27452771 27417680 27370357 27301799 27104337 27095386 27086572 27083868 27074879 27062957 27042966 26976529 26946250 26926674 26888087 26850782 26844102 26822261 26775902 26721635 26701961 26699083 26678256 26655787 26610169 26527511 26414227 26414020 26387772 26382010 26272648 26202820 26199208 26167912 26068956 26068707 25943398 25867111 25865179 25857236 25844997 25813278 25785892 25638454 25523815 25485258 25449822 25414390 25369829 25360605 25333677 25196409 25196407 25177158 25155549 25138651 25086326 25085464 25074749 25007189 24996963 24996616 24920422 24886756 24845604 24840137 24827704 24825181 24793589 24715694 24652723 24629126 24604481 24515533 24423095 24374411 24126648 24074752 23952917 23895512 23803878 23799096 23736950 23566428 23543567 23454537 23440843 23401706 23235643 23173137 23166346 23116535 24423035 22998334 22978747 22895964 24422952 22814301 22786521 22676438 22596383 22574949 22336803 22284386 22268959 22029725 22049569 21884451 21838525 21805298 21333011 21249647 20716457 20668156 20652464 20624868 20546277 20433212 20156481 20083615 19897665 19754634 19741185 19705560 19575688 19160202 18959614 18843736 18646153 18646120 18565462 18519931 18490689 18368998 17943839 17764214 17449231 17237299 16856038 16855995 16198213 16176199 16176186 15846748 15846663 15626569 15469640 15250842 15147610 12856082 12854339 11985934 10984843 10908550 10852140 10702762 8725861 7724911 3043158 3587198) NOT "Retracted Publication"[pt]) AND y_10[Filter]'
          ],
        },
        searchStringComment: {
          dk: "<a href='https://www.healthevidence.org' target='_blank'>Health Evidence</a> er en service fra canadiske McMaster University, der samler og kvalitets&shy;vurderer forsknings&shy;oversigter inden for folke&shy;sundheds&shy;området. Når denne afgræsning vælges, søges kun blandt de forsknings&shy;oversigter fra Health Evidence, som er relateret til diabetes og har en høj score for kvalitets&shy;vurdering (8-10). Kun artikler, som er mindre end 10 år gamle, og som ikke er trukket tilbage, vises.",
          en: "",
        },
        tooltip: {
          dk: "Health Evidence er en service fra canadiske McMaster University, der samler og kvalitets&shy;vurderer forsknings&shy;oversigter inden for folke&shy;sundheds&shy;området. Når denne afgræsning vælges, søges kun blandt de forsknings&shy;oversigter fra Health Evidence, som er relateret til diabetes og har en høj score for kvalitets&shy;vurdering (8-10). Kun artikler, som er mindre end 10 år gamle, og som ikke er trukket tilbage, vises.",
          en: "",
        },
      },
      {
        id: "L010040",
        name: "L010040",
        buttons: false,
        translations: {
          dk: "Guidelines",
          en: "Guidelines",
        },
        ordering: { 
          dk: 4, 
          en: 4 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          normal: [
            '"Guideline"[pt]'
          ],
        },
        searchStringComment: {
          dk: "Kun guidelines, der er udgivet i videnskabelige tidsskrifter, kan findes via PubMed. Guidelines, som er udgivet andre steder, vises ikke.",
          en: "",
        },
        tooltip: {
          dk: "Kun guidelines, der er udgivet i videnskabelige tidsskrifter, kan findes via PubMed. Guidelines, som er udgivet andre steder, vises ikke.",
          en: "",
        },
      },
      {
        id: "L010050",
        name: "L010050",
        buttons: false,
        translations: {
          dk: "Andre reviews",
          en: "Other reviews",
        },
        ordering: { 
          dk: 5, 
          en: 5 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          normal: [
            '("Review"[pt] OR review[ti]) NOT (systematic[sb] OR "Cochrane Database Syst Rev"[ta]) NOT (protocol[ti] OR withdrawn[ti] OR "Retracted Publication"[pt] OR "Comment"[pt])',
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
      dk: "Indeholder kun sekundære studietyper. Primære studietyper er placeret under 'Studietype'.",
      en: "Contains only secondary study types. Primary study types are placed under 'Study type'",
    },
  },
  {
    id: "L020",
    name: "L020",
    translations: {
      dk: "Studietype",
      en: "Study type",
    },
    ordering: { dk: 2, en: 2 },
    allowCustomInput: true,
    choices: [
      {
        id: "L020010",
        name: "L020010",
        buttons: true,
        translations: {
          dk: "Case-kontrol-studier",
          en: "Case-control studies",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: [
            '"Case-Control Studies"[majr]'
          ],
          normal: [
            '"Case-Control Studies"[mh] OR case-control[ti]'
          ],
          broad: [
            '"Case-Control Studies"[mh] OR case-control[tiab]'
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
        id: "L020020",
        name: "L020020",
        buttons: true,
        translations: {
          dk: "Incidens- og prævalensstudier",
          en: "Incidence and prevalence studies",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        simpleSearch: true,
        standardSimple: false,
        tooltip_simple: {
          dk: "Studier af antallet af personer, der diag&shy;nos&shy;ti&shy;ceres ud af en be&shy;folk&shy;nings&shy;gruppe inden for en bestemt tids&shy;periode (incidens) eller fore&shy;komsten af en sygdom eller anden faktor i en befolk&shy;nings&shy;gruppe (prævalens).",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Incidence"[majr] OR "Prevalence"[majr] OR prevalence[ti] OR incidence[ti]'
          ],
          normal: [
            '"Incidence"[mh] OR "Prevalence"[mh] OR prevalence[ti] OR incidence[ti]'
          ],
          broad: [
            '"Incidence"[mh] OR "Prevalence"[mh] OR prevalence[tiab] OR incidence[tiab]'
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
        id: "L020030",
        name: "L020030",
        buttons: true,
        translations: {
          dk: "Kohortestudier",
          en: "Cohortstudies",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: [
            '"Cohort Studies"[majr]'
          ],
          normal: [
            '"Cohort Studies"[mh] OR cohort[ti]'
          ],
          broad: [
            '"Cohort Studies"[mh] OR cohort[tiab]'
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
        id: "L020040",
        name: "L020040",
        buttons: true,
        translations: {
          dk: "Kvalitative studier",
          en: "Qualitative studies",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        simpleSearch: true,
        standardSimple: false,
        tooltip_simple: {
          dk: "Studier baseret på kvali&shy;ta&shy;tiv metode, som er en fælles&shy;betegnelse for en række forskellige under&shy;søgelses&shy;metoder såsom semi&shy;struk&shy;turerede inter&shy;views, del&shy;tager&shy;obser&shy;va&shy;tioner og fokus&shy;gruppe&shy;inter&shy;views. Den kvali&shy;ta&shy;tive til&shy;gang giver mulighed for at opnå viden om forhold, der oftest er svære at måle og beskrive med tal.",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Qualitative Research"[majr]'
          ],
          normal: [
            '"Qualitative Research"[mh] OR qualitative[ti]'
          ],
          broad: [
            '"Qualitative Research"[mh] OR qualitative[tiab] OR themes[tiab] OR interview*[tiab] OR psychology[sh:noexp] OR "Health Services Administration"[mh]',
          ],
        },
        searchStringComment: {
          dk: "Den brede søgning er baseret på filter fra Wong SS, Wilczynski NL, Haynes RB; Hedges Team. Developing optimal search strategies for detecting clinically relevant qualitative studies in MEDLINE. Stud Health Technol Inform. 2004;107(Pt 1):311-6 (PubMed ID: 15360825).",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L020050",
        name: "L020050",
        buttons: true,
        translations: {
          dk: "Randomiserede, kontrollerede forsøg",
          en: "Randomized controlled trials",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        simpleSearch: false,
        standardSimple: false,
        tooltip_simple: {
          dk: "",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Randomized Controlled Trial"[pt]'
          ],
          normal: [
            '"Randomized Controlled Trial"[pt] OR randomi*[ti]'
          ],
          broad: [
            '"Randomized Controlled Trial"[pt] OR randomi*[tiab]'
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
        id: "L020060",
        name: "L020060",
        buttons: true,
        translations: {
          dk: "Økonomiske studier",
          en: "Economics studies",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: [
            '"Costs and Cost Analysis"[majr]'
          ],
          normal: [
            '"Costs and Cost Analysis"[mh] OR cost*[ti] OR ecomomic*[ti]'
          ],
          broad: [
            '"Costs and Cost Analysis"[mh] OR cost*[tiab] OR ecomomic*[tiab]'
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
      dk: "Indeholder kun primære studietyper. Sekundære studietyper er placeret under 'Reviewtype'.",
      en: "Contains only primary study types. Secondary study types are placed under 'Review type'.",
    },
  },
  {
    id: "L030",
    name: "L030",
    isDefault: true,
    translations: {
      dk: "Sprog",
      en: "Language",
    },
    ordering: { 
      dk: 3, 
      en: 3 
    },
    allowCustomInput: true,
    choices: [
      {
        id: "L030010",
        name: "L030010",
        buttons: false,
        translations: {
          dk: "Engelsk",
          en: "English",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler skrevet på engelsk",
          en: "",
        },
        searchStrings: {
          normal: [
            '"English"[la]'
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
        id: "L030020",
        name: "L030020",
        buttons: false,
        translations: {
          dk: "Dansk",
          en: "Danish",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler skrevet på dansk",
          en: "",
        },
        searchStrings: {
          normal: [
            '"Danish"[la]'
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
        id: "L030030",
        name: "L030030",
        buttons: false,
        translations: {
          dk: "Norsk",
          en: "Norwegian",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          normal: [
            '"Norwegian"[la]'
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
        id: "L030040",
        name: "L030040",
        buttons: false,
        translations: {
          dk: "Svensk",
          en: "Swedish",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          normal: [
            '"Swedish"[la]'
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
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    id: "L040",
    name: "L040",
    isDefault: true,
    translations: {
      dk: "Geografi",
      en: "Geography",
    },
    ordering: { 
      dk: 4, 
      en: 4 
    },
    allowCustomInput: true,
    choices: [
      {
        id: "L040010",
        name: "L040010",
        buttons: true,
        translations: {
          dk: "Vestlige lande",
          en: "Western countries",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Mindsker sand&shy;syn&shy;lig&shy;heden for, at artikler, som <strong>ikke</strong> omhandler lande i Europa, USA, Canada, Australien og New Zealand, indgår i resul&shy;ta&shy;tet",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Europe"[mh] OR "United States"[mh] OR "Canada"[mh] OR "Australia"[mh] OR "New Zealand"[mh]',
          ],
          normal: [
            'all[sb] NOT (("Geographic Locations"[mh] OR "Developing Countries"[mh]) NOT ("Europe"[mh] OR "United States"[mh] OR "Canada"[mh] OR "Australia"[mh] OR "New Zealand"[mh]))',
          ],
          broad: [
            'all[sb] NOT (("Geographic Locations"[mh] OR "Developing Countries"[mh]) NOT ("Europe"[mh] OR "United States"[mh] OR "Canada"[mh] OR "Australia"[mh] OR "New Zealand"[mh]))',
          ],
        },
        searchStringComment: {
          dk: "Vestlige lande er her defineret som lande i Europa, USA, Canada, Australien og New Zealand. Der er udelukkende brugt [mh], at det er ikke muligt er bruge [majr], når man søger efter lande. En stor del af referencerne i PubMed er ikke indekseret under et land, og man risikerer derfor er ekskludere referencer unødigt ved at afgrænse søgningen til referencer, som er indekseret under et land. Derfor er normal og bred søgning (som er ens) konstrueret, så referencer, der IKKE er indekseret under et land, også inkluderes i resultatet. Samtidig frasorteres referencer, som er indekseret under et land, der ikke er defineret som vestligt (dog kun, hvis referencen ikke samtidig er indekseret under et vestligt land).",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L040020",
        name: "L040020",
        buttons: true,
        translations: {
          dk: "Europæiske lande",
          en: "European countries",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: [
            '"Europe"[mh] OR europe*[ti]'
          ],
          normal: [
            '"Europe"[mh] OR europe*[ti]'
          ],
          broad: [
            '"Europe"[mh] OR europe*[all]'
          ],
        },
        searchStringComment: {
          dk: "[majr] findes ikke for geografi - derfor [ti] -> [tiab] -> [all], da der så også søges i affiliation.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L040030",
        name: "L040030",
        buttons: true,
        translations: {
          dk: "Nordiske lande",
          en: "Nordic countries",
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        simpleSearch: false,
        standardSimple: false,
        tooltip_simple: {
          dk: "Artikler, som (blandt andet) omhandler Danmark, Norge, Sverige, Finland, Island og Grønland",
          en: "",
        },
        searchStrings: {
          narrow: [
            '"Scandinavian and Nordic Countries"[mh] OR scandinavia*[ti] OR nordic-countr*[ti] OR denmark*[ti] OR danish*[ti] OR (danes*[ti] NOT (("great danes"[ti] OR "Dogs"[mh]) NOT "Denmark"[mh])) OR norway*[ti] OR norwegian*[ti] OR swed*[ti] OR finnish*[ti] OR iceland*[ti] OR greenland*[ti]',
          ],
          normal: [
            '"Scandinavian and Nordic Countries"[mh] OR scandinavia*[tiab] OR nordic-countr*[tiab] OR denmark*[tiab] OR danish*[tiab] OR (danes*[tiab] NOT (("great danes"[tiab] OR "Dogs"[mh]) NOT "Denmark"[mh])) OR norway*[tiab] OR norwegian*[tiab] OR swed*[tiab] OR finnish*[tiab] OR iceland*[tiab] OR greenland*[tiab]',
          ],
          broad: [
            '"Scandinavian and Nordic Countries"[mh] OR scandinavia*[all] OR denmark*[all] OR danish*[all] OR (danes*[all] NOT (("great danes"[tiab] OR "Dogs"[mh]) NOT "Denmark"[mh])) OR norway*[all] OR norwegian*[all] OR swed*[all] OR finnish*[all] OR iceland*[all] OR greenland*[all]',
          ],
        },
        searchStringComment: {
          dk: "[majr] findes ikke for geografi - derfor [ti] -> [tiab] -> [all], da der så også søges i affiliation.",
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L040040",
        name: "L040040",
        buttons: true,
        translations: {
          dk: "Danmark",
          en: "Denmark",
        },
        ordering: { 
          dk: 4, 
          en: 4 
        },
        simpleSearch: false,
        standardSimple: false,
        searchStrings: {
          narrow: [
            '"Denmark"[mh] OR denmark*[ti] OR danish*[ti] OR dane*[ti]'
          ],
          normal: [
            '"Denmark"[mh] OR denmark*[tiab] OR danish*[tiab] OR dane*[tiab]'
          ],
          broad: [
            '"Denmark"[mh] OR denmark[all] OR danish[all] OR dane*[all]'
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
        id: "L040050",
        name: "L040050",
        buttons: true,
        translations: {
          dk: "Norge",
          en: "Norway",
        },
        ordering: { 
          dk: 6, 
          en: 6 
        },
        searchStrings: {
          narrow: [
            '"Norway"[mh] OR norway*[ti] OR norwegian*[ti]'
          ],
          normal: [
            '"Norway"[mh] OR norway*[tiab] OR norwegian*[tiab]'
          ],
          broad: [
            '"Norway"[mh] OR norway*[all] OR norwegian*[all]'
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
        id: "L040060",
        name: "L040060",
        buttons: true,
        translations: {
          dk: "Sverige",
          en: "Sweden",
        },
        ordering: { 
          dk: 5, 
          en: 5 
        },
        searchStrings: {
          narrow: [
            '"Sweden"[mh] OR sweden*[ti] OR swedish*[ti]'
          ],
          normal: [
            '"Sweden"[mh] OR sweden*[tiab] OR swedish*[tiab]'
          ],
          broad: [
            '"Sweden"[mh] OR sweden*[all] OR swedish*[all]'
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
    tooltip: {
      dk: "",
      en: "",
    },
  },
  {
    id: "L050",
    name: "L050",
    translations: {
      dk: "Køn",
      en: "Sex",
    },
    ordering: { 
      dk: 5, 
      en: 5 
    },
    allowCustomInput: false,
    choices: [
      {
        id: "L050010",
        name: "L050010",
        buttons: true,
        translations: {
          dk: "Kvinder",
          en: "Female",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Female"[mh] OR "Women"[majr]'
          ],
          normal: [
            '"Female"[mh] OR "Women"[mh]'
          ],
          broad: [
            '"Female"[mh] OR "Women"[mh] OR female*[tiab] OR woman*[tiab] OR women*[tiab]'
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
        id: "L050020",
        name: "L050020",
        buttons: true,
        translations: {
          dk: "Mænd",
          en: "Male",
        },
        ordering: { 
          dk: null, 
          en: null 
        },
        searchStrings: {
          narrow: [
            '"Male"[mh] OR "Men"[majr]'
          ],
          normal: [
            '"Male"[mh] OR "Men"[mh]'
          ],
          broad: [
            '"Male"[mh] OR "Men"[mh] OR male*[tiab] OR men[tiab]'
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
      dk: "",
      en: "",
    },
  },
  {
    id: "L060",
    name: "L060",
    translations: {
      dk: "Aldersgruppe",
      en: "Age group",
    },
    ordering: { 
      dk: 6, 
      en: 6 
    },
    allowCustomInput: false,
    choices: [
      {
        id: "L060010",
        name: "L060010",
        buttons: false,
        translations: {
          dk: "Spædbørn (0-23 måneder)",
          en: "Infant (0-23 months old)",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          normal: [
            '"Infant"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af spædbørn ("Infant"[mh]) er børn i alderen 0-23 måneder.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L060020",
        name: "L060020",
        buttons: false,
        translations: {
          dk: "Mindre børn (2-5 år)",
          en: "Preschool children (2-5 years old)",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          normal: [
            '"Child, Preschool"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af mindre børn ("Child, Preschool"[mh]) er børn i alderen 2-5 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L060030",
        name: "L060030",
        buttons: false,
        translations: {
          dk: "Større børn (6-12 år)",
          en: "Child (6-12 years old)",
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        searchStrings: {
          normal: [
            '"Child"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af børn ("Child"[mh]) er børn i alderen 6-12 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L060040",
        name: "L060040",
        buttons: false,
        translations: {
          dk: "Unge (13-18 år)",
          en: "Adolescent (13-18 years old)",
        },
        ordering: { 
          dk: 4, 
          en: 4 
        },
        searchStrings: {
          normal: [
            '"Adolescent"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af unge ("Adolescent"[mh]) er personer i alderen 13-18 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L060050",
        name: "L060050",
        buttons: false,
        translations: {
          dk: "Voksne (alle over 18 år)",
          en: "Adult (over 18 years old)",
        },
        ordering: { 
          dk: 5, 
          en: 5 
        },
        searchStrings: {
          normal: [
            '"Adult"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af voksne ("Adult"[mh]) er alle personer over 18 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L060060",
        name: "L060060",
        buttons: false,
        translations: {
          dk: "Unge voksne (19-24 år)",
          en: "Young adult (19-24 years old)",
        },
        ordering: { 
          dk: 6, 
          en: 6 
        },
        searchStrings: {
          normal: [
            '"Young Adult"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af unge voksne ("Young Adult"[mh]) er personer i alderen 19-24 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L060070",
        name: "L060070",
        buttons: false,
        translations: {
          dk: "Midaldrende (45-64 år)",
          en: "Middle aged (45-64 years old)",
        },
        ordering: { 
          dk: 7, 
          en: 7 
        },
        searchStrings: {
          normal: [
            '"Middle Aged"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af midaldrende ("Middle Aged"[mh]) er personer i alderen 45-64 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L60080",
        name: "L60080",
        buttons: false,
        translations: {
          dk: "Ældre (65-79 år)",
          en: "Aged (65-79 years old)",
        },
        ordering: { 
          dk: 8, 
          en: 8 
        },
        searchStrings: {
          normal: [
            '"Aged"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af ældre ("Aged"[mh]) er personer i alderen 65-79 år.',
          en: "",
        },
        tooltip: {
          dk: "",
          en: "",
        },
      },
      {
        id: "L60090",
        name: "L60090",
        buttons: false,
        translations: {
          dk: "Gamle (alle over 80 år)",
          en: "Old (80 years old and over)",
        },
        ordering: { 
          dk: 9, 
          en: 9 
        },
        searchStrings: {
          normal: [
            '"Aged, 80 and over"[mh]'
          ],
        },
        searchStringComment: {
          dk: 'NLM\'s definition af gamle ("Aged, 80 and over"[mh]) er alle personer over 80 år.',
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
    id: "L070",
    name: "L070",
    translations: {
      dk: "Publiceringsdato",
      en: "Publication date",
    },
    ordering: { 
      dk: 7, 
      en: 7 
    },
    allowCustomInput: false,
    choices: [
      {
        id: "L070010",
        name: "L070010",
        buttons: false,
        translations: {
          dk: "Seneste 1 år",
          en: "Last 1 year",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          normal: [
            'y_1[Filter]'
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
        id: "L070020",
        name: "L070020",
        buttons: false,
        translations: {
          dk: "Seneste 5 år",
          en: "Last 5 years",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          normal: [
            'y_5[Filter]'
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
        id: "L070030",
        name: "L070030",
        buttons: false,
        translations: {
          dk: "Seneste 10 år",
          en: "Last 10 years",
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        searchStrings: {
          normal: [
            'y_10[Filter]'
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
      dk: "",
      en: "",
    },
  },
  {
    id: "L080",
    name: "L080",
    isDefault: true,
    translations: {
      dk: "Tilhørsforhold",
      en: "Affiliation",
    },
    ordering: { 
      dk: 8, 
      en: 8 
    },
    allowCustomInput: true,
    choices: [
      {
        id: "L080010",
        name: "L080010",
        buttons: true,
        translations: {
          dk: "Danske institutioner",
          en: "Danish institutions",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        simpleSearch: false,
        searchStrings: {
          normal: [
            'denmark[ad] OR danish[ad] OR danmark[ad] OR dansk[ad] OR copenhagen[ad] OR aarhus[ad] OR arhus[ad] OR århus[ad] OR odense[ad] OR aalborg[ad] OR roskilde[ad]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til en dansk institution.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til en dansk institution.",
          en: "",
        },
      },
      {
        id: "L080020",
        name: "L080020",
        buttons: true,
        maintopic: true,
        translations: {
          dk: "Steno Diabetescentre",
          en: "Steno Diabetes Centers",
        },
        ordering: { 
          dk: 2, 
          en: 2 
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
        id: "L08002010",
        name: "L08002010",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Alle Steno Diabetes-centre",
          en: "All Steno Diabetes Centers",
        },
        ordering: { 
          dk: 3, 
          en: 3 
        },
        searchStrings: {
          normal: [
            '"steno diabetes"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til et Steno Diabetes Center.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til et Steno Diabetes Center.",
          en: "",
        },
      },
      {
        id: "L08002020",
        name: "L08002020",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Copenhagen",
          en: "Steno Diabetes Center Copenhagen",
        },
        ordering: { 
          dk: 4, 
          en: 4 
        },
        searchStrings: {
          normal: [
            '"steno copenhagen"[ad:~5] OR "steno herlev"[ad:~5] OR "steno gentofte"[ad:~5] OR "steno capital"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Copenhagen.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Copenhagen.",
          en: "",
        },
      },
      {
        id: "L08002030",
        name: "L08002030",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Færøerne",
          en: "Steno Diabetes Center Faroe Islands",
        },
        ordering: { 
          dk: 5, 
          en: 5 
        },
        searchStrings: {
          normal: [
            '"steno faroe"[ad:~5] OR "steno færøerne"[ad:~5] OR "steno tórshavn"[ad:~5] OR "steno torshavn"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Færøerne.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Færøerne.",
          en: "",
        },
      },
      {
        id: "L08002040",
        name: "L08002040",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Grønland",
          en: "Steno Diabetes Center Greenland",
        },
        ordering: { 
          dk: 6, 
          en: 6 
        },
        searchStrings: {
          normal: [
            '"steno greenland"[ad:~5] OR "steno grønland"[ad:~5] OR "steno gronland"[ad:~5] OR "steno groenland"[ad:~5] OR "steno nuuk"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Grønland.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Grønland.",
          en: "",
        },
      },
      {
        id: "L08002050",
        name: "L08002050",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Nordjylland",
          en: "Steno Diabetes Center North Denmark",
        },
        ordering: { 
          dk: 7, 
          en: 7 
        },
        searchStrings: {
          normal: [
            '"steno north"[ad:~5] OR "steno nordjylland"[ad:~5] OR "steno northjutland"[ad:~5] OR "steno aalborg"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Nordjylland.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Nordjylland.",
          en: "",
        },
      },
      {
        id: "L08002060",
        name: "L08002060",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Odense",
          en: "Steno Diabetes Center Odense",
        },
        ordering: { 
          dk: 8, 
          en: 8 
        },
        searchStrings: {
          normal: [
            '"steno odense"[ad:~5] OR "steno south"[ad:~5] OR  OR "steno southern"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Odense.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Odense.",
          en: "",
        },
      },
      {
        id: "L08002070",
        name: "L08002070",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Sjælland",
          en: "Steno Diabetes Center Zealand",
        },
        ordering: { 
          dk: 9, 
          en: 9 
        },
        searchStrings: {
          normal: [
            '"steno sjælland"[ad:~5] OR "steno sjaelland"[ad:~5] OR "steno zealand"[ad:~5] OR "steno holbæk"[ad:~5] OR "steno holbaek"[ad:~5] OR "steno falster"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Sjælland.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Sjælland.",
          en: "",
        },
      },
      {
        id: "L08002080",
        name: "L08002080",
        buttons: false,
        subtopiclevel: 1, // Angiver at dette element ligger på 1. niveau (midderste niveau)
        maintopicIdLevel1: "L080020", // Angiver at dette element har et parent med dette id. (Emne 2)
        translations: {
          dk: "Steno Diabetes Center Aarhus",
          en: "Steno Diabetes Center Aarhus",
        },
        ordering: { 
          dk: 10, 
          en: 10 
        },
        searchStrings: {
          normal: [
            '"steno aarhus"[ad:~5] OR "steno århus"[ad:~5] OR "steno arhus"[ad:~5] OR "steno central"[ad:~5]'
          ],
        },
        searchStringComment: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Aarhus.",
          en: "",
        },
        tooltip: {
          dk: "Artikler, hvor mindst en af forfatterne har afgivet tilhørsforhold til Steno Diabetes Center Aarhus.",
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
    id: "L090",
    name: "L090",
    isDefault: true,
    translations: {
      dk: "Tilgængelighed",
      en: "Availability",
    },
    ordering: { 
      dk: 9, 
      en: 9 
    },
    allowCustomInput: false,
    choices: [
      {
        id: "L090010",
        name: "L090010",
        buttons: false,
        translations: {
          dk: "Kun resultater med abstracts",
          en: "Only records with abstracts",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        searchStrings: {
          normal: [
            'fha[Filter]'
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
        id: "L090020",
        name: "L090020",
        buttons: false,
        translations: {
          dk: "Kun gratis tilgængelige artikler",
          en: "Only open access records",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          normal: [
            'ffrft[Filter]'
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
      dk: "",
      en: "",
    },
  },
  {
    id: "LXXX",
    name: "LXXX",
    isDefault: true,
    translations: {
      dk: "Andre afgrænsninger",
      en: "Other limits",
    },
    ordering: { 
      dk: 100, 
      en: 100 
    },
    allowCustomInput: false,
    choices: [
      {
        id: "LXXX010",
        name: "LXXX010",
        buttons: true,
        translations: {
          dk: "Fjern dyrestudier",
          en: "Remove animal studies",
        },
        ordering: { 
          dk: 1, 
          en: 1 
        },
        simpleSearch: false,
        standardSimple: true,
        tooltip_simple: {
          dk: "Artikler, som kun handler om dyr og ikke mennesker, fjernes.",
          en: "Records that only deal with animals and not humans are removed."
        },
        searchStrings: {
          narrow: [
            '"Humans"[mh]'
          ],
          normal: [
            'all[sb] NOT ("Animals"[mh] NOT "Humans"[mh])'
          ],
          broad: [
            'all[sb] NOT ("Animals"[mh] NOT "Humans"[mh])'
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
        id: "LXXX020",
        name: "LXXX020",
        buttons: true,
        translations: {
          dk: "Kun dyrestudier",
          en: "Only animal studies",
        },
        ordering: { 
          dk: 2, 
          en: 2 
        },
        searchStrings: {
          narrow: [
            '"Animals"[mh] NOT "Humans"[mh]'
          ],
          normal: [
            '("Animals"[mh] NOT "Humans"[mh]) OR ("Animals"[mh:noexp] AND "Humans"[mh])'
          ],
          broad: [
            '(all[sb] NOT ("Humans"[mh] NOT "Animals"[mh:noexp])) OR ("Animals"[mh:noexp] AND "Humans"[mh])'
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
    tooltip: {
      dk: "",
      en: "",
    },
  },
];