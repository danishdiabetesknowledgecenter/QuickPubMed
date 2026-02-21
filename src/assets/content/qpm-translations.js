import { aiURL } from "../../config/settings.js";

export const messages = {
  standardString: {
    dk: "test",
    en: "test",
  },
  tooltiptext: {
    dk: "Dansk",
    en: "English",
  },
  andOperator: {
    dk: "OG",
    en: "AND",
  },
  orOperator: {
    dk: "ELLER",
    en: "OR",
  },
  manualInput: {
    dk: "eller indtast søgeord",
    en: "or enter search term",
  },
  manualInput_mobile: {
    dk: "/søgeord",
    en: "/search term",
  },
  manualInputTermTranslated: {
    dk: "AI-oversættelse",
    en: "AI translation",
  },
  manualInputTerm: {
    dk: "Søgeord",
    en: "Search term",
  },
  select: {
    dk: "Tilføj",
    en: "Add",
  },
  choselimits: {
    dk: "Vælg afgrænsning eller indtast søgeord",
    en: "Select limit or enter search term",
  },
  search: {
    dk: "Søg",
    en: "Search",
  },
  checkboxTitle: {
    dk: "Markér for at tilføje denne afgrænsning.",
    en: "Check to add this limit.",
  },
  searchHeaderShown: {
    dk: "Søg efter artikler, der handler om:",
    en: "Search for records about:",
  },
  searchHeaderHidden: {
    dk: "Din søgning:",
    en: "Your search:",
  },
  searchHeaderSubtitle: {
    dk: "OBS! Søgeord på engelsk kan indtastes.",
    en: "NB! Your can enter your search terms.",
  },
  searchToggleWithAI: {
    dk: "Indtast med AI-oversættelse",
    en: "AI-assisted input",
  },
  hoversearchToggleWithAI: {
    dk: "Hvis du selv indtaster søgeord, kan du bruge kunstig intelligens (AI) til at oversætte fra fx dansk til en søgning, som fungerer i PubMed. <br><br><strong>Du har slået denne funktion til</strong>.",
    en: "If you enter search terms manually, you can use artificial intelligence (AI) to translate from any language into a search query that works in PubMed.<br><br><strong>You have enabled this feature</strong>.",
  },
  searchToggleWithoutAI: {
    dk: "Indtast med AI-oversættelse (slået fra)",
    en: "AI-assisted input (disabled)",
  },
  hoversearchToggleWithoutAI: {
    dk: "Hvis du selv indtaster søgeord, kan du bruge kunstig intelligens (AI) til at oversætte fra fx dansk til en søgning, som fungerer i PubMed. <br><br><strong>Du har <i>ikke</i> slået denne funktion til</strong>. Derfor bliver dine søgeord brugt, som de er indtastet. Dvs. at de skal skrives på engelsk, da de ellers ikke fungerer i PubMed.",
    en: "If you enter search terms manually, you can use artificial intelligence (AI) to translate from any language into a search query that works in PubMed.<br><br><strong>You have <i>not</i> enabled this feature</strong>. Therefore, your search terms will be used exactly as entered. This means they must be written in English, as they will not work in PubMed otherwise.",
  },
  advancedSearch: {
    dk: "Avanceret",
    en: "Advanced",
  },
  simpleSearch: {
    dk: "Simpel",
    en: "Simple",
  },
  searchMode: {
    dk: "søgning",
    en: "search",
  },
  reset: {
    dk: "Nulstil",
    en: "Reset",
  },
  subjectadvancedplaceholder: {
    dk: "Vælg emne eller indtast søgeord",
    en: "Select topic or enter search term",
  },
  subjectadvancedplaceholder_mobile: {
    dk: "Vælg emne/indtast søgeord",
    en: "Select topic/enter search term",
  },
  subjectsimpleplaceholder: {
    dk: "Vælg emne eller indtast søgeord",
    en: "Select topic or enter search term",
  },
  subjectadvancedplaceholder_notopics: {
    dk: "Indtast søgeord",
    en: "Enter search term",
  },
  subjectadvancedplaceholder_mobile_notopics: {
    dk: "Indtast søgeord",
    en: "Enter search term",
  },
  subjectsimpleplaceholder_notopics: {
    dk: "Indtast søgeord",
    en: "Enter search term",
  },
  translatingPlaceholder: {
    dk: "AI-oversættelse i gang...",
    en: "AI translation...",
  },
  translatingStepSearchString: {
    dk: "Laver søgestreng",
    en: "Creating search string",
  },
  translatingStepMesh: {
    dk: "Undersøger MeSH-databasen",
    en: "Checking MeSH database",
  },
  translatingStepOptimize: {
    dk: "Optimerer søgestreng",
    en: "Optimizing search string",
  },
  noResult: {
    dk: "Ingen resultater matcher søgningen",
    en: "No records matched your search",
  },
  noResultTip: {
    dk: "Prøv eventuelt at fjerne nogle afgrænsninger, eller kontrollér for stavefejl, hvis du har indtastet søgeord.",
    en: "Try removing some limits, or check for spelling mistakes if you entered search terms.",
  },
  noDropdownContent: {
    dk: "Ingen matchende valgmuligheder i listen.",
    en: "No matches among the available options.",
  },
  noTopicDropdownContent: {
    dk: "Ingen matchende emner i listen. Klik på 'Avanceret søgning' for at tilføje manuelt input.",
    en: "No matches among the available topics. Click 'Advanced search' to enter a manual input.",
  },
  noLimitDropdownContent: {
    dk: "Ingen matchende afgrænsninger i listen.",
    en: "No matches among the available limits.",
  },
  addsubjectlimit: {
    dk: "Tilføj",
    en: "Add",
  },
  addsubject: {
    dk: "emne",
    en: "topic",
  },
  addlimit: {
    dk: "afgrænsning",
    en: "limit",
  },
  selectGroupLabel: {
    dk: "Klik for at se underemner",
    en: "Click for subtopics",
  },
  tagplaceholder: {
    dk: "Tryk på [Enter] for at lave et manuelt input",
    en: "Press [Enter] to add manual input",
  },
  scope: {
    dk: "Omfang",
    en: "Scope",
  },
  manualadd: {
    dk: "Tilføj søgeord manuelt",
    en: "Add search term manually",
  },
  narrow: {
    dk: "Smal",
    en: "Narrow",
  },
  normal: {
    dk: "Normal",
    en: "Standard",
  },
  broad: {
    dk: "Bred",
    en: "Broad",
  },
  tooltipNarrow: {
    dk: "Søgning med høj speci&shy;fi&shy;citet, dvs. langt de fleste artikler i søge&shy;resultatet er relevante, men samtidig må man forvente, at nogle relevante artikler ikke bliver fundet.",
    en: "Search with high specificity, i.e. the vast majority of records in the search result are relevant, but at the same time you must expect that some relevant records will not be found.",
  },
  tooltipNormal: {
    dk: "Søgning med god balance mellem specificitet og sensi&shy;ti&shy;vitet, dvs. søge&shy;resultatet inde&shy;holder mange relevante artikler, men også nogle få irrelevante.",
    en: "Search with a good balance between specificity and sensitivity, i.e. the search result contains many relevant records but also a few irrelevant ones.",
  },
  tooltipBroad: {
    dk: "Søgning med høj sensi&shy;ti&shy;vitet, dvs. at flere relevante, men også en del irrelevante, artikler bliver fundet.",
    en: "Search with high sensitivity, i.e. that there are several relevant, but also some irrelevant, records.",
  },
  getUrl: {
    dk: "Kopiér link",
    en: "Copy link",
  },
  showDetails: {
    dk: "Detaljer",
    en: "Details",
  },
  hideDetails: {
    dk: "Skjul detaljer",
    en: "Hide details",
  },
  searchString: {
    dk: "Søgestreng",
    en: "Search string",
  },
  showSearchString: {
    dk: "Vis søgestreng",
    en: "Show search string",
  },
  hideSearchString: {
    dk: "Skjul søgestreng",
    en: "Hide search string",
  },
  showFilterCategory: {
    dk: "Vis valgmuligheder",
    en: "Show options",
  },
  hideFilterCategory: {
    dk: "Skjul valgmuligheder",
    en: "Hide options",
  },
  is: {
    dk: "er",
    en: "is",
  },
  where: {
    dk: "Hvor",
    en: "Where",
  },
  limitsPreString: {
    dk: "Hvor afgrænsninger er",
    en: "Where limits are",
  },
  searchresult: {
    dk: "Søgeresultat",
    en: "Search result",
  },
  next: {
    dk: "Indlæs de næste",
    en: "Load next",
  },
  previous: {
    dk: "Forrige",
    en: "Previous",
  },
  showAbstract: {
    dk: "Vis abstract",
    en: "Show abstract",
  },
  hideAbstract: {
    dk: "Skjul abstract",
    en: "Hide abstract",
  },
  showInfo: {
    dk: "Vis info",
    en: "Show info",
  },
  hideInfo: {
    dk: "Skjul info",
    en: "Hide info",
  },
  youAreSearchingFor: {
    dk: "Din søgning:",
    en: "Your search:",
  },
  searchPreStringSingular: {
    dk: "Du søger på emnet",
    en: "You are searching for the topic",
  },
  searchPreStringPlural: {
    dk: "Du søger på emnerne",
    en: "You are searching for the topics",
  },
  youAreSearchingForAnd: {
    dk: "og",
    en: "and",
  },
  openInPubMed: {
    dk: "Åbn i PubMed",
    en: "Open in PubMed",
  },
  showPubMedLink: {
    dk: "Åbn søgning i PubMed",
    en: "Run search in PubMed",
  },
  createPubMedAlert: {
    dk: "Opret overvågning i PubMed",
    en: "Create alert in PubMed",
  },
  fillEmptyDropdownFirstAlert: {
    dk: "Tilføj et eller flere emner eller indtast søgeord i den tomme rullemenu først.",
    en: "Add one or more topics or enter search terms in the empty dropdown first.",
  },
  noAuthorsListed: {
    dk: "Ingen forfattere angivet",
    en: "No authors listed",
  },
  relatedPubmed: {
    dk: "Find lignende artikler",
    en: "Similar records in PubMed",
  },
  hoverrelatedPubmed: {
    dk: "Find artikler på PubMed, som ligner denne &ndash; de artikler, der vises, er bestemt ud fra algoritmer (åbner i nyt vindue)",
    en: "Find records on PubMed similar to this based on algorithms (opens in new tab)",
  },
  relatedPubmedReviews: {
    dk: "Find lignende systematiske reviews",
    en: "Similar systematic reviews in PubMed",
  },
  hoverrelatedPubmedReviews: {
    dk: "Find forskningsoversigter på PubMed, som ligner denne &ndash; de artikler, der vises, er bestemt ud fra algoritmer (åbner i nyt vindue)",
    en: "Find systematic reviews on PubMed similar to this based on algorithms (opens in new tab)",
  },
  alsoviewedPubmed: {
    dk: "Se, hvad andre også har kigget på",
    en: "Records frequently viewed together with this one in PubMed",
  },
  hoveralsoviewedPubmed: {
    dk: "Find artikler på PubMed, som andre har kigget på sammen med denne artikel (åbner i nyt vindue)",
    en: "Find records frequently viewed together with this one on PubMed (opens in new tab)",
  },
  UnpaywallLoading: {
    dk: "Søger efter PDF",
    en: "Searching for PDF",
  },
  UnpaywallWithPdf: {
    dk: "Download PDF",
    en: "Download PDF",
  },
  UnpaywallWithHtml: {
    dk: "Læs hele artiklen",
    en: "Read full-text article",
  },
  NoUnpaywall: {
    dk: "Ingen artikel tilgængelig",
    en: "No article available",
  },
  UnpaywallNoPdf: {
    dk: "Find PDF hos tidsskriftet",
    en: "Find PDF on the journal website",
  },
  hoverUnpaywall_pdf: {
    dk: "En PDF af fuldtekstartiklen er gratis tilgængelig (åbner i nyt vindue)",
    en: "PDF of full-text article is freely available (opens in new tab)",
  },
  hoverUnpaywall_html: {
    dk: "Hele artiklen er gratis tilgængelig (åbner i nyt vindue)",
    en: "The full-text article is freely available (opens in new tab)",
  },
  hoverUnpaywall_noPdf: {
    dk: "PDF af fuldtekstartiklen er ikke gratis tilgængelig, men der er muligvis adgang via tidsskriftets hjemmeside, eventuelt mod betaling (åbner i nyt vindue)",
    en: "PDF of the full-text article is not freely available, but you may be able to access it via the journal website, possibly for a fee (opens in new tab)",
  },
  hoverUnpaywall_loading: {
    dk: "Nogle artikler kan downloades i PDF-format, hvis de er gratis tilgængelige, eller der er givet adgang via din netværksforbindelse &ndash; hvis du ikke har adgang til PDF-versionen, vil du blot blive sendt ind på tidsskriftets hjemmeside (åbner i nyt vindue)",
    en: "Some journal articles can be downloaded in PDF format if they are available for free or accessible through your network connection &ndash; if you do not have access to the PDF version, you will be forwarded to the journal website (opens in new tab)",
  },
  GoogleScholar: {
    dk: "Søg efter denne artikel på Google Scholar",
    en: "Search for this record on Google Scholar",
  },
  hoverGoogleScholar: {
    dk: "",
    en: "",
  },
  openDoi: {
    dk: "Åbn tidsskrift",
    en: "Open journal",
  },
  searchMatches: {
    dk: "",
    en: "",
  },
  showing: {
    dk: "Viser",
    en: "Showing",
  },
  of: {
    dk: "af",
    en: "of",
  },
  pagesizePerPage: {
    dk: "pr. side",
    en: "per page",
  },
  noAbstract: {
    dk: "Denne artikel har ikke et abstract.",
    en: "This record has no abstract.",
  },
  noArticleAvailable: {
    dk: "Denne artikel kan desværre ikke vises lige nu.",
    en: "The requested record is currently unavailable.",
  },
  tryAgainLater: {
    dk: "Prøv igen senere",
    en: "Try again later",
  },
  hoverShareButton: {
    dk: "Kopiér link til denne søgning",
    en: "Copy link to current search",
  },
  hoverSearchButton: {
    dk: "",
    en: "",
  },
  hoverResetButton: {
    dk: "Nulstil hele søgeformularen, og start forfra",
    en: "Reset search form and start over",
  },
  hoverLimitButton: {
    dk: "Klik for at tilføje afgrænsning",
    en: "Click to add limit",
  },
  hoverShowPubMedLinkText: {
    dk: "Gennemfør søgningen i PubMed (åbner i nyt vindue)",
    en: "Run search in PubMed (open in a new tab)",
  },
  hoverShowPubMedLinkCreateAlertText: {
    dk: "Få tilsendt en e-mail, når der kommer nye resultater via denne søgning &ndash; fungerer kun, hvis du er logget ind på en PubMed-konto (åbner i nyt vindue)",
    en: "Receive an e-mail when this search returns new results &ndash; only works if you are logged in to a PubMed account (opens in new tab)",
  },
  hoverShowAbstractButton: {
    dk: "",
    en: "",
  },
  hoverOpenInPubMedButton: {
    dk: "Vis informationer om artiklen på PubMed (åbner i nyt vindue)",
    en: "Show PubMed record (opens in a new tab)",
  },
  hoverOpenDOIButton: {
    dk: "Få adgang til artiklen på tidsskriftets hjemmeside &ndash; muligvis mod betaling (åbner i nyt vindue)",
    en: "Get access to the article on the journal website &ndash; access charges may apply (opens in a new tab)",
  },
  hoverSearchString: {
    dk: "Klik på feltet for at kopiere søgestrengen",
    en: "Click on the input box to copy the search string",
  },
  hoverAddSubject: {
    dk: "Klik for at tilføje emne",
    en: "Click to add topic",
  },
  hoverAdvancedText: {
    dk: "Klik for at gå til avanceret søgning",
    en: "Click for advanced search mode",
  },
  hoverBasicText: {
    dk: "Klik for at gå til simpel søgning",
    en: "Click for simple search mode",
  },
  hoverDetailsText: {
    dk: "<div style='text-align: left; font-size: 0.9em; margin: 10px 0 0 0'><p>Her kan du:<ul style='list-style-position: outside; padding: 0 15px;'><li>få vist en læsevenlig udgave af din søgning</li><li>få vist PubMed-søgestrengen</li><li>gennemføre søgningen direkte i PubMed</li><li>oprette en overvågning.</li></ul></p></div>",
    en: "<div style='text-align: left; font-size: 0.9em; margin: 10px 0 0 0'><p>Options in 'Details':<ul style='list-style-position: outside; padding: 0 15px;'><li>show an easy-to-read version of your search;</li><li>show your PubMed search string;</li><li>run your search in PubMed; and</li><li>create an alert in PubMed.</li></ul></p></div>",
  },
  hoverShowFilterCategoryText: {
    dk: "Klik for at se og vælge afgrænsningskategorier",
    en: "Click to show and select filter categories",
  },
  hoverShowSearchStringText: {
    dk: "Vis den søgestreng, som sendes til PubMed",
    en: "Show the search string sent to PubMed",
  },
  hoverShowPrettyStringText: {
    dk: "Vis læsevenlig søgning",
    en: "Show easy-to-read search",
  },
  sortBy: {
    dk: "Sorter efter",
    en: "Sort by",
  },
  hideForm: {
    dk: "Skjul søgeformularen",
    en: "Hide search form",
  },
  showForm: {
    dk: "Vis søgeformularen",
    en: "Show search form",
  },
  subjects: {
    dk: "Emner",
    en: "Topics",
  },
  filters: {
    dk: "Afgrænsninger",
    en: "Limits",
  },
  SimpleFiltersHeader: {
    dk: "Afgrænsninger",
    en: "Limits",
  },
  AdvancedFiltersHeader: {
    dk: "Afgrænsninger",
    en: "Limits",
  },
  hoverFiltersHeader: {
    dk: "Hvis du vælger emner fra <strong>flere forskellige kate&shy;gorier</strong>, afgræn&shy;ses søgnin&shy;gen til artikler, der inde&shy;holder <strong>mindst ét emne fra hver kategori</strong>, dvs. der indsættes <strong>OG</strong> mellem kategorierne.<br><br>Hvis du vælger emner fra <strong>samme kategori</strong>, afgræn&shy;ses søgningen til artikler, der indeholder <strong>mindst ét af emnerne fra denne kategori</strong>, dvs. der ind&shy;sættes <strong>ELLER</strong> mellem emnerne <strong>inden for kategorien</strong>.",
    en: "If you select topics from <strong>multiple different categories</strong>, the search is limited to articles that contain <strong>at least one topic from each category</strong>, i.e. <strong>AND</strong> is inserted between categories.<br><br>If you select topics from <strong>the same category</strong>, the search is limited to articles that contain <strong>at least one of the topics from this category</strong>, i.e. <strong>OR</strong> is inserted between topics <strong>within the category</strong>.",
  },
  showAllSearchstrings: {
    dk: "Vis alle søgestrenge",
    en: "Show all search strings",
  },
  hideAllSearchstrings: {
    dk: "Skjul alle søgestrenge",
    en: "Hide all search strings",
  },
  comment: {
    dk: "Kommentar",
    en: "Comment",
  },
  aiSummarizeSearchResultButton: {
    dk: "Vælg opsummering på:",
    en: "Summarise in:",
  },
  hoverSummarizeSearchResultButton: {
    dk: "Brug kunstig intel&shy;ligens (AI) til at lave en dansk opsummering af søge&shy;resul&shy;tatet.",
    en: "Apply artificial intelligence (AI) to summarise the search result.",
  },
  aiSummarizeSelectedSearchResultHeaderNoCount: {
    dk: "Opsummering af de valgte artikler",
    en: "Summary of the selected records",
  },
  aiSummarizeSelectedSearchResultHeaderBeforeCount: {
    dk: "Opsummering af de ",
    en: "Summary of the ",
  },
  aiSummarizeSelectedSearchResultHeaderAfterCount: {
    dk: " valgte artikler",
    en: " selected records",
  },
  aiSummarizeFirstFewSearchResultHeaderBeforeCount: {
    dk: "Opsummering af de første ",
    en: "Summary of the first ",
  },
  aiSummarizeFirstFewSearchResultHeaderAfterCount: {
    dk: " artikler",
    en: " records",
  },
  aiSummarizeFirstFewSearchResultHeaderAfterCountWarning: {
    dk: "<strong>BEMÆRK</strong>: Denne opsummering er lavet med <strong>kunstig intelligens (AI)</strong>, hvilket nogle gange kan give unøjagtige eller forkerte resultater. Læs altid den originale artikel, før du anvender informationerne.",
    en: "<strong>NOTE</strong>: This summary is made with <strong>artificial intelligence (AI)</strong>, which can sometimes produce inaccurate or incorrect results. Always read the original article before using the information.",
  },
  unknownError: {
    dk: "Der er desværre opstået en fejl. Prøv eventuelt at opsummere igen, eller prøv igen senere.",
    en: "Unfortunately, an error has occurred. Try summarising again or try again later.",
  },
  noAbstractsError: {
    dk: "Resultaterne indeholder ingen abstracts.",
    en: "The search result contains no abstracts.",
  },
  tooLongAbstractsError: {
    dk: "Det er desværre ikke muligt at opsummere så mange abstracts. Vælg et lavere antal resultater herunder, og prøv igen.",
    en: "Unfortunately, it is not possible to summarise this many abstracts. Please select a lower number of results below and try again.",
  },
  aiSummarizeSearchErrorHeader: {
    dk: "Opsummeringen er ikke mulig",
    en: "Summary unavailable",
  },
  aiSummarizeAbstractButton: {
    dk: "Få nedenstående abstract opsummeret på dansk ved hjælp af kunstig intelligens.",
    en: "Summarise the following abstract using AI.",
  },
  aiSummarizeArticleButton: {
    dk: "Få artiklen opsummeret ved hjælp af kunstig intelligens.",
    en: "Summarise the article using AI.",
  },
  hoverSummarizeAbstractButton: {
    dk: "Brug kunstig intel&shy;ligens til at lave en dansk opsummering af dette abstract.",
    en: "Apply AI to summarise this abstract.",
  },
  hoverSummarizeArticleButton: {
    dk: "Brug kunstig intel&shy;ligens til at lave en dansk opsummering af denne artikel.",
    en: "Apply AI to summarise this article.",
  },
  aiSummarizeAbstractResultHeader: {
    dk: "Opsummering af artiklens abstract",
    en: "Summary of the abstract",
  },
  aiSummarizeAbstractErrorHeader: {
    dk: "Opsummeringen er ikke tilgængelig",
    en: "Summary unavailable",
  },
  aiAbstractSummaryConsentHeader: {
    dk: "Klik på et faneblad for at få opsummeret abstractet",
    en: "Click a tab to summarise the abstract",
  },
  aiSearchSummaryConsentHeader: {
    dk: "Vælg de artikler, du ønsker at få opsummeret, ved at markere dem. Dine valgte artikler vil blive vist under 'Markerede artikler' herunder.",
    en: "Select the records you wish to have summarised by selecting them. You can find your selected records under 'Selected records' below.",
  },
  aiSearchSummaryConsentHeaderTextBefore: {
    dk: "Markerer du <strong>ikke</strong> nogen, kan du vælge at få de første",
    en: "If <strong>none</strong> are selected, you can choose to summarise the first",
  },
  aiSearchSummaryConsentHeaderTextAfter: {
    dk: "artikler opsummeret.",
    en: "records.",
  },
  aiSearchSummarySelectedArticlesBefore: {
    dk: "Du har markeret",
    en: "You have selected",
  },
  aiSearchSummarySelectedArticlesAfterSingular: {
    dk: "artikel",
    en: "record",
  },
  aiSearchSummarySelectedArticlesAfterPlural: {
    dk: "artikler",
    en: "records",
  },
  aiSearchSummarySelectedArticlesAfter: {
    dk: ", som du kan få opsummeret ved at klikke på en af knapperne.",
    en: " which you can summarise by clicking one of the buttons below.",
  },
  aiSummaryConsentText: {
    dk: "<strong>OBS!</strong> Ved at klikke på knappen 'Hverdagssprog' eller 'Fagsprog' bekræfter du, at du er opmærksom på og accepterer, at opsummeringen er genereret ved hjælp af <strong>kunstig intelligens</strong> (AI).",
    en: "<strong>NOTE!</strong> By clicking the button 'Plain language' or 'Professional language', you confirm that you are aware of and accept that the summary is generated by using <strong>artificial intelligence</strong> (AI).",
  },
  readAboutAiSummaryText: {
    dk:
      "Læs mere om, <a href='" +
      aiURL +
      "' target='_blank' title='Læs mere om, hvordan den automatiske opsummering fungerer (åbner i nyt vindue)'>hvordan den automatiske opsummering fungerer</a>",
    en:
      "Read more about <a href='" +
      aiURL +
      "' target='_blank' title='Read more about how the AI summary works (opens in new tab)'>how the AI summary works</a>",
  },
  aiSummaryDisclaimer: {
    dk:
      "Denne opsummering er lavet med <strong>kunstig intelligens</strong> (AI). Læs mere om, <a href='" +
      aiURL +
      "' target='_blank' title='Læs mere om, hvordan den automatiske opsummering fungerer (åbner i nyt vindue)'>hvordan den automatiske opsummering fungerer</a>",
    en:
      "This summary is made with <strong>artificial intelligence</strong> (AI). Read more about <a href='" +
      aiURL +
      "' target='_blank' title='Read more about how the AI summary works (opens in new tab)'>how the AI summary works</a>",
  },
  translationDisclaimer: {
    dk:
      "Denne oversættelse er lavet med <strong>kunstig intelligens</strong> (AI). Læs mere om, <a href='" +
      aiURL +
      "' target='_blank' title='Læs mere om, hvordan den automatiske oversættelse fungerer (åbner i nyt vindue)'>hvordan den automatiske oversættelse fungerer</a>",
    en:
      "This translation is made with <strong>artificial intelligence</strong> (AI). Read more about <a href='" +
      aiURL +
      "' target='_blank' title='Read more about how the AI translation works (opens in new tab)'>how the AI translation works</a>",
  },
  aiSummaryWaitText: {
    dk: "Den kunstige intelligens er i gang med at opsummere...",
    en: "The AI is summarising...",
  },
  aiArticleSummaryWaitText: {
    dk: "Hele teksten i denne artikel er i gang med at blive opsummeret...",
    en: "The text in this article is being summarised...",
  },
  aiTranslationWaitText: {
    dk: "Den kunstige intelligens oversætter...",
    en: "The AI is translating...",
  },
  aiShortWaitTimeDisclaimer: {
    dk: "(Kan tage op til 30 sekunder)",
    en: "(May last up to 30 seconds)",
  },
  aiLongWaitTimeDisclaimer: {
    dk: "(Kan tage op til 60 sekunder)",
    en: "(May last up to 60 seconds)",
  },
  aiGeneratingText: {
    dk: "Den kunstige intelligens er i gang med at opsummere artiklen, og der er flere punkter på vej",
    en: "The AI is summarising the article, and more headings are on their way",
  },
  showTranslatedTitle: {
    dk: "Oversæt titel",
    en: "Translate title",
  },
  hideTranslatedTitle: {
    dk: "Skjul oversat titel",
    en: "Hide translated title",
  },
  retryText: {
    dk: "Prøv igen",
    en: "Retry",
  },
  stopText: {
    dk: "Stop",
    en: "Stop",
  },
  hoverretryText: {
    dk: "Bed den kunstige intelligens om at lave opsummeringen igen. Det kan give et lidt anderledes resultat.",
    en: "Ask the AI to regenerate the summary. It may produce a slightly different result.",
  },
  hoverAskQuestionText: {
    dk: "Klik for at få den kunstig intelligens til at generere spørgsmål til hele artiklen. Klik igen for at generere svar på ny.",
    en: "Click to have the AI generate questions for the full-text article. Click again to generate answers once more.",
  },
  copyText: {
    dk: "Kopiér tekst",
    en: "Copy text",
  },
  hovercopyText: {
    dk: "Kopiér den opsummerede tekst",
    en: "Copy the summarised text",
  },
  searchErrorGeneric: {
    dk: "Fejl: Søgeresultater kunne ikke hentes",
    en: "Error: Couldn't retrieve search results",
  },
  selectedResultTitle: {
    dk: "Markerede artikler",
    en: "Selected records",
  },
  hoverselectedResultTitle: {
    dk: "Oversigt over de artikler, som du har markeret. Markerede artikler kan f.eks. deles med andre.",
    en: "Your selected records. Selected records can be shared with others.",
  },
  hoverselectedResultTitleAI: {
    dk: "Oversigt over de artikler, som du har markeret. Markerede artikler kan enten opsummeres med kunstig intelligens (AI) eller deles med andre.",
    en: "Your selected records. Selected records can either be summarised using artificial intelligence (AI) or shared with others.",
  },
  selectedResultsAccordionHeader: {
    dk: "Få opsummeret søgeresultatet med AI",
    en: "Generate AI summary of search result",
  },
  hoverselectedResultsAccordionHeader: {
    dk: "Få opsummeret flere artikler ad gangen.",
    en: "Generate AI summary of multiple records",
  },
  selectedResultAccordionHeader: {
    dk: "Få opsummeret abstractet med AI",
    en: "Generate AI summary of abstract",
  },
  selectedResultAccordionHeaderNoAbstract: {
    dk: "Opsummering af hele artiklen med kunstig intelligens (AI)",
    en: "AI summary of full-text article",
  },
  hoverselectedResultAccordionHeader: {
    dk: "Få opsummeret dette abstract på dansk ved hjælp af kunstig intelligens (AI).",
    en: "Summarise this abstract using artificial intelligence (AI).",
  },
  hoverselectedResultAccordionHeaderNoAbstract: {
    dk: "Få opsummeret denne artikel på dansk ved hjælp af kunstig intelligens (AI).",
    en: "Summarise this article using artificial intelligence (AI).",
  },
  hovermarkedArticleCounter: {
    dk: "Antal artikler du har markeret.",
    en: "Number of selected records.",
  },
  selectedResultDeselectAllText: {
    dk: "Fravælg alle",
    en: "Deselect all",
  },
  hoverselectedResultDeselectAllText: {
    dk: "Klik for at fravælge alle markerede artikler.",
    en: "Click to deselect all checked records.",
  },
  selectedResultEmptyText: {
    dk: "<p>Du har ikke markeret nogen artikler.</p>",
    en: "<p>No records have been selected yet.</p>",
  },
  aiSummarizeSearchResultExplanation: {
    dk: "Markér de artikler, som du vil have opsummeret. Hvis du ikke markerer nogen, kan du vælge at få de første op til 25 artikler opsummeret.",
    en: "Select the records that you want to summarise. If you do not select any, you can choose to summarise up to the first 25 records.",
  },
  generatePdfQuestionsButtonText: {
    dk: "Vis opsummering af artiklen",
    en: "Show summary of the full-text article",
  },
  hideGeneratePdfQuestionsButtonText: {
    dk: "Skjul opsummering af artiklen",
    en: "Hide summary of the full-text article",
  },
  summarizeArticleAvailable: {
    dk: "OBS! Hele artiklens tekst kan muligvis opsummeres \u2013 vent et øjeblik, mens det tjekkes, om teksten er tilgængelig.",
    en: "NOTE! The full-text of this article may be available for summarisation \u2013 please wait while we check if the text is accessible.",
  },

  summarizeArticleHeader: {
    dk: "Opsummering af hele artiklen",
    en: "Summary of the full-text article",
  },

  generateQuestionsHeader: {
    dk: "Spørgsmål til denne artikel",
    en: "Questions for this article",
  },
  userQuestionsHeader: {
    dk: "Stil dine egne spørgsmål",
    en: "Ask your own questions",
  },
  userQuestionsNoAnswer: {
    dk: "Svar kunne ikke genereres",
    en: "No answer found",
  },
  userQuestionInputPlaceholder: {
    dk: "Skriv dit spørgsmål",
    en: "Enter your question",
  },
  userQuestionInputHoverText: {
    dk: "Skriv dit spørgsmål her, og klik på 'Spørg' eller tryk på 'Enter'-knappen",
    en: "Enter your question here, and click 'Ask' or press the 'Enter' key",
  },

  showMoreOptions: {
    dk: "Vis flere muligheder",
    en: "Show more options",
  },
  hideMoreOptions: {
    dk: "Skjul flere muligheder",
    en: "Hide more options",
  },
  scrapingError: {
    dk: "Det er desværre ikke muligt at opsummere hele artiklen.",
    en: "Unfortunately, it is not possible to summarise this article.",
  },
  askQuestionButtontext: {
    dk: "Spørg",
    en: "Ask",
  },
  loadingText: {
    dk: "Indlæser...",
    en: "Loading...",
  },
  summarizeArticleNotAvailable: {
    dk: "Det er desværre ikke muligt at opsummere hele artiklen.",
    en: "Unfortunately, it is not possible to summarise this article.",
  },
  summarizeArticleNotice: {
    dk: "OBS! Hele teksten i denne artikel er opsummeret.",
    en: "NOTE! The full-text of this article is summarised.",
  },
  summarizeArticleNoAbstractNotice: {
    dk: "OBS! Hele teksten i denne artikel kan opsummeres.",
    en: "NOTE! The full-text of this article can be summarised.",
  },
  summarizationInProgressDisclaimer: {
    dk: "Opsummeringen er i gang, vent venligst til den er færdig. Herefter kan du skifte fane.",
    en: "The summarisation is in progress, please wait until it is finished. After that, you can switch tabs.",
  },
  editor_typeTopics: {
    dk: "Emner",
    en: "Topics",
  },
  editor_typeFilters: {
    dk: "Afgrænsninger",
    en: "Limits",
  },
  editor_login: {
    dk: "Log ind",
    en: "Log in",
  },
  editor_logout: {
    dk: "Log ud",
    en: "Log out",
  },
  editor_saveAll: {
    dk: "Gem alle ændringer",
    en: "Save all changes",
  },
  editor_save: {
    dk: "Gem",
    en: "Save",
  },
  editor_load: {
    dk: "Hent",
    en: "Load",
  },
  editor_otherFunctions: {
    dk: "Andre funktioner",
    en: "Other functions",
  },
  editor_editJson: {
    dk: "Rediger i JSON",
    en: "Edit JSON",
  },
  editor_hideJson: {
    dk: "Skjul JSON-redigering",
    en: "Hide JSON editor",
  },
  editor_sortMode: {
    dk: "Sorteringstilstand",
    en: "Sort mode",
  },
  editor_searchPlaceholder: {
    dk: "Søg i emner (id eller navn)",
    en: "Search topics (id or name)",
  },
  editor_refreshHistory: {
    dk: "Opdater historik",
    en: "Refresh history",
  },
  editor_previewVersion: {
    dk: "Vis version",
    en: "Show version",
  },
  editor_hideVersion: {
    dk: "Skjul version",
    en: "Hide version",
  },
  editor_revertVersion: {
    dk: "Gendan valgt version",
    en: "Restore selected version",
  },
  editor_onlyDiff: {
    dk: "Vis kun forskelle",
    en: "Show only differences",
  },
  editor_saveHint: {
    dk: 'Ingen ændringer gennemføres, før du klikker "Gem alle ændringer".',
    en: 'No changes are applied until you click "Save all changes".',
  },
  editor_showAllTopics: {
    dk: "Vis alle emner",
    en: "Show all topics",
  },
  editor_hideAllTopics: {
    dk: "Skjul alle emner",
    en: "Hide all topics",
  },
  editor_noDomains: {
    dk: "Ingen domæner",
    en: "No domains",
  },
  editor_domainRequiredForTopics: {
    dk: "Domain er påkrævet for emner.",
    en: "Domain is required for topics.",
  },
  editor_itemIdLabel: {
    dk: "ID",
    en: "ID",
  },
  editor_itemOrderingFixedLabel: {
    dk: "Fast placering (ordering-tal)",
    en: "Fixed position (ordering number)",
  },
  editor_itemNameDkLabel: {
    dk: "Navn (dk)",
    en: "Name (dk)",
  },
  editor_itemNameEnLabel: {
    dk: "Navn (en)",
    en: "Name (en)",
  },
  editor_itemNarrowLabel: {
    dk: "Narrow (en linje pr. søgestreng)",
    en: "Narrow (one line per search string)",
  },
  editor_itemNormalLabel: {
    dk: "Normal (en linje pr. søgestreng)",
    en: "Standard (one line per search string)",
  },
  editor_itemBroadLabel: {
    dk: "Broad (en linje pr. søgestreng)",
    en: "Broad (one line per search string)",
  },
  editor_itemCommentDkLabel: {
    dk: "Kommentar (dk)",
    en: "Comment (dk)",
  },
  editor_itemCommentEnLabel: {
    dk: "Kommentar (en)",
    en: "Comment (en)",
  },
  editor_itemTooltipDkLabel: {
    dk: "Tooltip (dk)",
    en: "Tooltip (dk)",
  },
  editor_itemTooltipEnLabel: {
    dk: "Tooltip (en)",
    en: "Tooltip (en)",
  },
  editor_hideInFormByDefault: {
    dk: "Skjul i formular som standard",
    en: "Hide in form by default",
  },
  editor_saveMainCategory: {
    dk: "Gem hovedkategori",
    en: "Save main category",
  },
  editor_deleteMainCategory: {
    dk: "Slet hovedkategori",
    en: "Delete main category",
  },
  editor_categoryIdPrefixLabel: {
    dk: "Kategori ID/prefix",
    en: "Category ID/prefix",
  },
  editor_categoryNameDkLabel: {
    dk: "Kategorinavn (dk)",
    en: "Category name (dk)",
  },
  editor_categoryNameEnLabel: {
    dk: "Kategorinavn (en)",
    en: "Category name (en)",
  },
  editor_lockIdOnSortLabel: {
    dk: "Lås ID ved sortering",
    en: "Lock ID during sorting",
  },
  editor_showScopeButtonsLabel: {
    dk: "Vis scope-knapper (n/s/b)",
    en: "Show scope buttons (n/s/b)",
  },
  editor_showAlphabeticalOrderingLabel: {
    dk: "Vis alfabetisk (ordering = null)",
    en: "Show alphabetically (ordering = null)",
  },
  editor_currentListPositionLabel: {
    dk: "Aktuel placering i listen",
    en: "Current position in list",
  },
  editor_saveTopicFields: {
    dk: "Gem emnefelter",
    en: "Save topic fields",
  },
  editor_deleteSubtopic: {
    dk: "Slet underemne",
    en: "Delete subtopic",
  },
  editor_unknownItemLabel: {
    dk: "Ukendt",
    en: "Unknown",
  },
  editor_dropBefore: {
    dk: "Slip før",
    en: "Drop before",
  },
  editor_dropAsSubtopic: {
    dk: "Slip som underemne",
    en: "Drop as subtopic",
  },
  editor_dropAfter: {
    dk: "Slip efter",
    en: "Drop after",
  },
  editor_categoryFallbackLabel: {
    dk: "Kategori",
    en: "Category",
  },
  editor_dropCategoryBefore: {
    dk: "Slip kategori før",
    en: "Drop category before",
  },
  editor_dropCategoryAfter: {
    dk: "Slip kategori efter",
    en: "Drop category after",
  },
  editor_addSubtopic: {
    dk: "Tilføj underemne",
    en: "Add subtopic",
  },
  editor_addMainCategory: {
    dk: "Tilføj hovedkategori",
    en: "Add main category",
  },
  editor_usernamePlaceholder: {
    dk: "Brugernavn",
    en: "Username",
  },
  editor_passwordPlaceholder: {
    dk: "Password",
    en: "Password",
  },
  editor_currentVersionLabel: {
    dk: "Aktuel version",
    en: "Current version",
  },
  editor_selectedVersionLabel: {
    dk: "Valgt version",
    en: "Selected version",
  },
  editor_noDifferencesFound: {
    dk: "Ingen forskelle fundet.",
    en: "No differences found.",
  },
  editor_allDifferencesHiddenByFilter: {
    dk: "Alle linjer er skjult af det valgte filter.",
    en: "All differences are hidden by current filter.",
  },
  editor_infoAriaLabel: {
    dk: "Info",
    en: "Info",
  },
  editor_selectPreviousVersion: {
    dk: "Vælg en anden version",
    en: "Select another version",
  },
  editor_noHistoryFound: {
    dk: "Ingen historik fundet",
    en: "No history found",
  },
  editor_couldNotFetchHistory: {
    dk: "Kunne ikke hente historik.",
    en: "Could not fetch history.",
  },
  editor_selectRevisionFirst: {
    dk: "Vælg en revision først.",
    en: "Select a revision first.",
  },
  editor_selectedVersionMatchesCurrent: {
    dk: "Valgt version matcher allerede den aktuelle fil.",
    en: "Selected version already matches the current file.",
  },
  editor_couldNotLoadPreview: {
    dk: "Kunne ikke indlæse preview.",
    en: "Could not load preview.",
  },
  editor_autoLoggedOutAfterHidden: {
    dk: "Automatisk logget ud, fordi siden har været skjult i 1 time.",
    en: "Logged out automatically because the page was hidden for 1 hour.",
  },
  editor_securityBlockLocalApiOnly: {
    dk: "Sikkerhedsblokering: localhost-editor må kun bruge lokal API (localhost/127.0.0.1).",
    en: "Security block: localhost editor may only use local API (localhost/127.0.0.1).",
  },
  editor_apiReturnedPhpSource: {
    dk: "API svarer med PHP-kildekode. Brug en PHP-server og sæt data-content-api-base-url til den rigtige API-URL.",
    en: "API responds with PHP source code. Use a PHP server and set data-content-api-base-url to the correct API URL.",
  },
  editor_invalidJsonResponse: {
    dk: "Ugyldigt JSON svar fra serveren.",
    en: "Invalid JSON response from server.",
  },
  editor_requestFailed: {
    dk: "Request fejlede",
    en: "Request failed",
  },
  editor_sessionActive: {
    dk: "Session aktiv.",
    en: "Session active.",
  },
  editor_loginToContinue: {
    dk: "Log ind for at fortsætte.",
    en: "Log in to continue.",
  },
  editor_enterUsernameAndPassword: {
    dk: "Udfyld brugernavn og password.",
    en: "Enter username and password.",
  },
  editor_loginSuccessful: {
    dk: "Login lykkedes.",
    en: "Login successful.",
  },
  editor_loggedOut: {
    dk: "Du er logget ud.",
    en: "You are logged out.",
  },
  editor_loadedForDomain: {
    dk: "hentet for domain",
    en: "loaded for domain",
  },
  editor_loadedShort: {
    dk: "hentet",
    en: "loaded",
  },
  editor_invalidJson: {
    dk: "JSON er ugyldig.",
    en: "JSON is invalid.",
  },
  editor_noChangesToSave: {
    dk: "Ingen ændringer at gemme.",
    en: "No changes to save.",
  },
  editor_alreadySavedViaJsonButton: {
    dk: "Indholdet er allerede gemt via JSON-knappen.",
    en: "The content is already saved via the JSON button.",
  },
  editor_noNewVersionCreatedUnchanged: {
    dk: "Ingen ny version oprettet, fordi indholdet er uændret.",
    en: "No new version was created because content is unchanged.",
  },
  editor_savedAndVerifiedForDomain: {
    dk: "gemt og verificeret via API for domain",
    en: "saved and verified via API for domain",
  },
  editor_savedAndVerified: {
    dk: "gemt og verificeret via API",
    en: "saved and verified via API",
  },
  editor_savedFor: {
    dk: "gemt for",
    en: "saved for",
  },
  editor_savedShort: {
    dk: "gemt",
    en: "saved",
  },
  editor_topicIdPlaceholder: {
    dk: "Emne-id",
    en: "Topic ID",
  },
  editor_invalidTopicsJson: {
    dk: "Ugyldig topics JSON.",
    en: "Invalid topics JSON.",
  },
  editor_categoryNotFound: {
    dk: "Kategori ikke fundet.",
    en: "Category not found.",
  },
  editor_invalidMove: {
    dk: "Ugyldig flytning.",
    en: "Invalid move.",
  },
  editor_sourceTopicNotFound: {
    dk: "Kildeemne blev ikke fundet.",
    en: "Source topic not found.",
  },
  editor_cannotMoveTopicIntoItself: {
    dk: "Kan ikke flytte et emne ind i sig selv/underemne.",
    en: "Cannot move a topic into itself/subtopic.",
  },
  editor_couldNotExtractTopic: {
    dk: "Kunne ikke udtrække emnet.",
    en: "Could not extract topic.",
  },
  editor_targetTopicNotFound: {
    dk: "Mål-emne blev ikke fundet.",
    en: "Target topic not found.",
  },
  editor_targetPositionNotFound: {
    dk: "Målplacering blev ikke fundet.",
    en: "Target position not found.",
  },
  editor_topicUnlockedIdConfirmPrefix: {
    dk: "Emnet",
    en: "Topic",
  },
  editor_topicUnlockedIdConfirmSuffix: {
    dk: "har ulåst ID. Vil du opdatere ID automatisk ud fra den nye placering?",
    en: "has unlocked ID. Do you want to update ID automatically based on the new position?",
  },
  editor_invalidCategoryMove: {
    dk: "Ugyldig kategori-flytning.",
    en: "Invalid category move.",
  },
  editor_sourceCategoryNotFound: {
    dk: "Kilde-kategori blev ikke fundet.",
    en: "Source category not found.",
  },
  editor_targetCategoryNotFound: {
    dk: "Mål-kategori blev ikke fundet.",
    en: "Target category not found.",
  },
  editor_categoryDoesNotExist: {
    dk: "Kategori findes ikke.",
    en: "Category does not exist.",
  },
  editor_subtopicNotFound: {
    dk: "Underemne blev ikke fundet.",
    en: "Subtopic not found.",
  },
  editor_mainCategoryNotFound: {
    dk: "Hovedkategori blev ikke fundet.",
    en: "Main category not found.",
  },
  editor_parentTopicNotFound: {
    dk: "Forældre-emne blev ikke fundet.",
    en: "Parent topic not found.",
  },
  editor_cannotUpdateInvalidTopicsJson: {
    dk: "Kan ikke opdatere: JSON for topics er ugyldig.",
    en: "Cannot update: topics JSON is invalid.",
  },
  editor_categoryNotInCurrentJson: {
    dk: "Kategori findes ikke i den aktuelle JSON.",
    en: "Category does not exist in current JSON.",
  },
  editor_selectedTopicNotFound: {
    dk: "Valgt emne blev ikke fundet.",
    en: "Selected topic was not found.",
  },
  editor_idMustNotBeEmpty: {
    dk: "ID må ikke være tom.",
    en: "ID must not be empty.",
  },
  editor_idExistsInCategoryPrefix: {
    dk: "ID",
    en: "ID",
  },
  editor_idExistsInCategorySuffix: {
    dk: "findes allerede i kategorien.",
    en: "already exists in the category.",
  },
  editor_changesSavedLocallyForTopic: {
    dk: "Ændringer gemt lokalt i editor for emne",
    en: "Changes saved locally in editor for topic",
  },
  editor_clickSaveAllToWriteFile: {
    dk: "Klik \"Gem alle ændringer\" for at skrive til fil.",
    en: "Click \"Save all changes\" to write to file.",
  },
  editor_mainCategoryIdRequired: {
    dk: "Hovedkategori-ID må ikke være tom.",
    en: "Main category ID must not be empty.",
  },
  editor_categoryIdExistsPrefix: {
    dk: "Kategori-ID",
    en: "Category ID",
  },
  editor_categoryIdExistsSuffix: {
    dk: "findes allerede.",
    en: "already exists.",
  },
  editor_mainCategoryUpdatedLocallyPrefix: {
    dk: "Hovedkategori",
    en: "Main category",
  },
  editor_clickSaveAllAboveToWriteFile: {
    dk: "opdateret lokalt. Klik \"Gem alle ændringer\" ovenfor for at skrive til fil.",
    en: "updated locally. Click \"Save all changes\" above to write to file.",
  },
  editor_securityBlockActivePrefix: {
    dk: "Sikkerhedsblokering aktiv: apiBase",
    en: "Security block active: apiBase",
  },
  editor_securityBlockActiveSuffix: {
    dk: "er ikke lokal. Brug lokal PHP API for at undgå gem på eksternt miljø.",
    en: "is not local. Use local PHP API to avoid saving to external environment.",
  },
  editor_couldNotAddMainCategory: {
    dk: "Kunne ikke tilføje hovedkategori.",
    en: "Could not add main category.",
  },
  editor_newMainCategoryCreatedPrefix: {
    dk: "Ny hovedkategori",
    en: "New main category",
  },
  editor_createdAtBottomSuffix: {
    dk: "oprettet nederst.",
    en: "created at the bottom.",
  },
  editor_couldNotAddTopic: {
    dk: "Kunne ikke tilføje emne.",
    en: "Could not add topic.",
  },
  editor_subtopicLabel: {
    dk: "underemne",
    en: "subtopic",
  },
  editor_topicLabel: {
    dk: "emne",
    en: "topic",
  },
  editor_newLabelPrefix: {
    dk: "Nyt",
    en: "New",
  },
  editor_confirmDeleteSubtopicPrefix: {
    dk: "Vil du slette underemnet",
    en: "Do you want to delete subtopic",
  },
  editor_deleteFailed: {
    dk: "Sletning mislykkedes.",
    en: "Delete failed.",
  },
  editor_subtopicDeletedPrefix: {
    dk: "Underemne",
    en: "Subtopic",
  },
  editor_confirmDeleteMainCategoryPrefix: {
    dk: "Vil du slette hovedkategorien",
    en: "Do you want to delete main category",
  },
  editor_mainCategoryDeletedPrefix: {
    dk: "Hovedkategori",
    en: "Main category",
  },
  editor_moveFailed: {
    dk: "Flytning mislykkedes.",
    en: "Move failed.",
  },
  editor_mainCategoryMovedPrefix: {
    dk: "Hovedkategori",
    en: "Main category",
  },
  editor_topicMovedPrefix: {
    dk: "Emne",
    en: "Topic",
  },
  editor_movedWithPositionPrefix: {
    dk: "flyttet",
    en: "moved",
  },
  editor_activeApiLabel: {
    dk: "Aktiv API",
    en: "Active API",
  },
  editor_savedByLabel: {
    dk: "Gemt af",
    en: "Saved by",
  },
  editor_restoredFromLabel: {
    dk: "gendannet fra",
    en: "restored from",
  },
  editor_versionRestored: {
    dk: "Version gendannet",
    en: "Version restored",
  },
  editor_nowLabel: {
    dk: "nu",
    en: "now",
  },
  editor_restoreFailed: {
    dk: "Gendannelse mislykkedes.",
    en: "Restore failed.",
  },
  editor_diffPreviewLoaded: {
    dk: "Diff-preview indlæst.",
    en: "Diff preview loaded.",
  },
  editor_confirmRestoreSelectedVersion: {
    dk: "Vil du gendanne den valgte version? Dette overskriver den nuværende fil, men nuværende version snapshots først.",
    en: "Do you want to restore the selected version? This overwrites the current file, but the current version is snapshotted first.",
  },
  editor_helpCategoryId: {
    dk: "Unikt ID/prefix for hovedkategorien. Bruges som grundlag for underemne-ID'er.",
    en: "Unique ID/prefix for the top category. Used as base for child item IDs.",
  },
  editor_helpCategoryTranslationsDk: {
    dk: "Visningsnavn på dansk.",
    en: "Display name in Danish.",
  },
  editor_helpCategoryTranslationsEn: {
    dk: "Visningsnavn på engelsk.",
    en: "Display name in English.",
  },
  editor_helpCategoryTooltipDk: {
    dk: "Forklaringstekst på dansk, vist i brugerfladen.",
    en: "Help text in Danish, shown in the UI.",
  },
  editor_helpCategoryTooltipEn: {
    dk: "Forklaringstekst på engelsk, vist i brugerfladen.",
    en: "Help text in English, shown in the UI.",
  },
  editor_helpCategoryHiddenByDefault: {
    dk: "Når markeret, er kategorien skjult som standard i formularen.",
    en: "When checked, the category is hidden by default in the form.",
  },
  editor_helpItemId: {
    dk: "Unikt ID for underemnet.",
    en: "Unique ID for the child item.",
  },
  editor_helpItemLockIdOnSort: {
    dk: "Beholder ID ved sortering/flytning.",
    en: "Keeps ID when sorting/moving.",
  },
  editor_helpItemHiddenByDefault: {
    dk: "Når markeret, er underemnet skjult som standard i formularen.",
    en: "When checked, the child item is hidden by default in the form.",
  },
  editor_helpItemButtons: {
    dk: "Vis scope-knapper (n/s/b) for dette underemne i søgeformularen.",
    en: "Show scope buttons (n/s/b) for this child item in the search form.",
  },
  editor_helpItemOrderingAlphabetical: {
    dk: "Når markeret bruges alfabetisk visning i stedet for fast placering.",
    en: "When checked, alphabetical order is used instead of fixed ordering.",
  },
  editor_helpItemOrderingFixed: {
    dk: "Fast placering i listen, når alfabetisk visning ikke er valgt.",
    en: "Fixed position in the list when alphabetical mode is not enabled.",
  },
  editor_helpItemTranslationsDk: {
    dk: "Navn på dansk.",
    en: "Name in Danish.",
  },
  editor_helpItemTranslationsEn: {
    dk: "Navn på engelsk.",
    en: "Name in English.",
  },
  editor_helpItemSearchStringsNarrow: {
    dk: "Søgestrenge for narrow-scope (én pr. linje).",
    en: "Search strings for narrow scope (one per line).",
  },
  editor_helpItemSearchStringsNormal: {
    dk: "Søgestrenge for normal/standard scope (én pr. linje).",
    en: "Search strings for normal/standard scope (one per line).",
  },
  editor_helpItemSearchStringsBroad: {
    dk: "Søgestrenge for broad-scope (én pr. linje).",
    en: "Search strings for broad scope (one per line).",
  },
  editor_helpItemSearchStringCommentDk: {
    dk: "Kommentar på dansk til søgestrengen.",
    en: "Danish comment for the search string.",
  },
  editor_helpItemSearchStringCommentEn: {
    dk: "Kommentar på engelsk til søgestrengen.",
    en: "English comment for the search string.",
  },
  editor_helpItemTooltipDk: {
    dk: "Hjælpetekst på dansk, vist i brugerfladen.",
    en: "Help text in Danish, shown in the UI.",
  },
  editor_helpItemTooltipEn: {
    dk: "Hjælpetekst på engelsk, vist i brugerfladen.",
    en: "Help text in English, shown in the UI.",
  },
};
