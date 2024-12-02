import { aiURL } from "@/config/settings";

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
    en: "AI-translation",
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
    dk: "Vælg afgrænsning",
    en: "Add limit",
  },
  search: {
    dk: "Søg",
    en: "Search",
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
    en: "You are searching with AI-translation from danish to english.",
  },
  hoversearchToggleWithAI: {
    dk: "Hvis du selv indtaster søgeord, kan du bruge kunstig intelligens (AI) til at oversætte fra fx dansk til en søgning, som fungerer i PubMed. <br><br><strong>Du har slået denne funktion til</strong>.",
    en: "",
  },
  searchToggleWithoutAI: {
    dk: "Indtast med AI-oversættelse",
    en: "You are searching without AI-translation. Click to search in danish.",
  },
  hoversearchToggleWithoutAI: {
    dk: "Hvis du selv indtaster søgeord, kan du bruge kunstig intelligens (AI) til at oversætte fra fx dansk til en søgning, som fungerer i PubMed. <br><br><strong>Du har <i>ikke</i> slået denne funktion til</strong>. Derfor bliver dine søgeord brugt, som de er indtastet. Dvs. at de skal skrives på engelsk, da de ellers ikke fungerer i PubMed.",
    en: "",
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
  translatingPlaceholder: {
    dk: "AI-oversætter...",
    en: "AI-translating...",
  },
  noResult: {
    dk: "Ingen resultater matcher søgningen",
    en: "No records matched your search",
  },
  noResultTip: {
    dk: "Prøv eventuelt at fjerne nogle afgrænsninger, eller kontrollér for stavefejl, hvis du har indtastet søgeord.",
    en: "Try to remove some limits, or check for spelling mistakes if you have entered search terms.",
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
    dk: "Ingen matchende emner i listen. Manuelt input er kun muligt under de enkelte afgrænsninger.",
    en: "No matches among the available topics. Custom input is possible only for the individual limits.",
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
    dk: "Tilføj emne til den tomme dropdown-menu først",
    en: "Add the topic in the empty dropdown instead",
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
    en: "Find reviews on PubMed similar to this article based on algorithms (opens in new tab)",
  },
  alsoviewedPubmed: {
    dk: "Se, hvad andre også har kigget på",
    en: "Records frequently viewed together with this in PubMed",
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
    dk: "Læs hele artikel",
    en: "Read the whole article",
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
    en: "Some journal articles can be downloaded in PDF format if they are available for free or accessible through your network connection &ndash; if you do not have access to the PDF version, you will forwarded to the journal website (opens in new tab)",
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
    dk: "Få adgang til artiklen på tidsskriftets hjemmeside &ndash; koster muligvis penge (åbner i nyt vindue)",
    en: "Get access to the article on the journal website &ndash; access charges may apply (opens in a new tab)",
  },
  hoverSearchString: {
    dk: "Klik på feltet for at kopiere søgestrengen",
    en: "Click on the input box to copy search string",
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
    en: "<div style='text-align: left; font-size: 0.9em; margin: 10px 0 0 0'><p>Options i 'Details':<ul style='list-style-position: outside; padding: 0 15px;'><li>show an easy-to-read version of your search;</li><li>show your PubMed search string;</li><li>run your search in PubMed; and</li><li>create an alert in PubMed.</li></ul></p></div>",
  },
  hoverShowFilterCategoryText: {
    dk: "Klik her for at se og vælge afgrænsnings kategorier til søgning",
    en: "Click to show categories for selecting filters for searching",
  },
  hoverShowSearchStringText: {
    dk: "Vis den søgestreng, som sendes til PubMed",
    en: "Show the search string sent PubMed",
  },
  hoverShowPrettyStringText: {
    dk: "Vis læsevenlig søgning",
    en: "Show easy to read search",
  },
  sortBy: {
    dk: "Sorter efter",
    en: "Order by",
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
    en: "Summarize search results in:",
  },
  hoverSummarizeSearchResultButton: {
    dk: "Brug kunstig intel&shy;ligens (AI) til at lave en dansk opsummering af søge&shy;resul&shy;tatet.",
    en: "Apply artificial intelligence (AI) to summarize the search result.",
  },
  aiSummarizeSelectedSearchResultHeaderNoCount: {
    dk: "Opsummering af de valgte artikler",
    en: "Summary of the seleted records",
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
    dk: "Der er desværre opstået en fejl. Prøv eventuelt af opsummere igen, eller prøv igen senere.",
    en: "Unfortunately, an error has occurred. Try summarising again or try again later.",
  },
  noAbstractsError: {
    dk: "Resultaterne indeholder ingen abstracts.",
    en: "The search result contains no abstracts.",
  },
  tooLongAbstractsError: {
    dk: "Det er desværre ikke muligt at opsummere så mange abstracts. Vælg et lavere antal resultater herunder, og prøv igen.",
    en: "Unfortunately, it is not possible to summarize this many abstracts. Please select a lower number of results below and try again.",
  },
  aiSummarizeSearchErrorHeader: {
    dk: "Opsummeringen er ikke mulig",
    en: "Summary unavailable",
  },
  aiSummarizeAbstractButton: {
    dk: "Få nedenstående abstract opsummeret på dansk ved hjælp af kunstig intelligens.",
    en: "Get the following abstract summarized using artificial intelligence.",
  },
  aiSummarizeArticleButton: {
    dk: "Få artiklen opsummeret ved hjælp af kunstig intelligens.",
    en: "Have the article summarized using artificial intelligence.",
  },
  hoverSummarizeAbstractButton: {
    dk: "Brug kunstig intel&shy;ligens til at lave en dansk opsummering af dette abstract.",
    en: "Apply artificial intelligence to summarize this abstract.",
  },
  hoverSummarizeArticleButton: {
    dk: "Brug kunstig intel&shy;ligens til at lave en dansk opsummering af denne artikel.",
    en: "Apply artificial intelligence to summarize this article.",
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
    en: "Click a tab to summarize the abstract",
  },
  aiSearchSummaryConsentHeader: {
    dk: "Vælg de artikler, du ønsker at få opsummeret, ved at markere dem. Dine valgte artikler vil blive vist under 'Markerede artikler' herunder.",
    en: "Select the records you wish to have summarised by marking them. You can find your selected records under 'Selected records' below.",
  },
  aiSearchSummaryConsentHeaderText: {
    dk: "Markerer du <strong>ikke</strong> nogen, vil de første 5 artikler blive opsummeret.",
    en: "If <strong>none</strong> are selected, the first 5 records will be summarised.",
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
      "' target='_target' title='Læs mere om, hvordan den automatiske opsummering fungerer (åbner i nyt vindue)'>hvordan den automatiske opsummering fungerer</a>",
    en:
      "Read more about <a href='" +
      aiURL +
      "' target='_target' title='Read more about how the AI summary works (opens in new tab)'>how the AI summary works</a>",
  },
  aiSummaryDisclaimer: {
    dk:
      "Denne opsummering er lavet med <strong>kunstig intelligens</strong> (AI). Læs mere om, <a href='" +
      aiURL +
      "' target='_blank' title='Læs mere om, hvordan den automatiske opsummering fungerer (åbner i nyt vindue)'>hvordan den automatiske opsummering fungerer</a>",
    en:
      "This summary is made with <strong>artificial intelligence</strong> (AI). Read more about <a href='" +
      aiURL +
      "' target='_target' title='Read more about how the AI summary works (opens in new tab)'>how the AI summary works</a>",
  },
  translationDisclaimer: {
    dk:
      "Denne oversættelse er lavet med <strong>kunstig intelligens</strong>. Læs mere om, <a href='" +
      aiURL +
      "' target='_blank' title='Læs mere om, hvordan den automatiske oversættelse fungerer (åbner i nyt vindue)'>hvordan den automatiske oversættelse fungerer</a>",
    en:
      "This summary is made with <strong>artificial intelligence</strong>. Read more about <a href='" +
      aiURL +
      "' target='_target' title='Read more about how the AI summary works (opens in new tab)'>how the AI summary works</a>",
  },
  aiSummaryWaitText: {
    dk: "Den kunstige intelligens er i gang med at opsummere...",
    en: "The artificial intelligence is summarizing...",
  },
  aiTranslationWaitText: {
    dk: "Den kunstige intelligens oversætter...",
    en: "The artificial intelligence is translating...",
  },
  aiShortWaitTimeDisclaimer: {
    dk: "(Kan tage op til 30 sekunder)",
    en: "(May last up to 30 seconds)",
  },
  aiLongWaitTimeDisclaimer: {
    dk: "(Kan tage op til 60 sekunder)",
    en: "(May last up to 60 seconds)",
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
    en: "Ask the artificial intelligence to regenerate the summary. It may produce a slightly different result.",
  },
  hoverAskQuestionText: {
    dk: "Klik her for at få den kunstig intelligens til at generere spørgsmål til hele artiklen. Klik igen for at generere svar på ny",
    en: "Click to here to have the AI generate questions for the entire article. Click again to generate answers once more",
  },
  copyText: {
    dk: "Kopiér tekst",
    en: "Copy text",
  },
  hovercopyText: {
    dk: "Kopiér teksten",
    en: "Copy text",
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
    en: "Selected records",
  },
  hoverselectedResultTitleAI: {
    dk: "Oversigt over de artikler, som du har markeret. Markerede artikler kan enten opsummeres med kunstig intelligens (AI) eller deles med andre.",
    en: "Selected records",
  },
  selectedResultsAccordionHeader: {
    dk: "Opsummering med kunstig intelligens (AI)",
    en: "AI summary",
  },
  hoverselectedResultsAccordionHeader: {
    dk: "Få opsummeret flere artikler ad gangen.",
    en: "AI summary",
  },
  selectedResultAccordionHeader: {
    dk: "Opsummering af abstract med kunstig intelligens (AI)",
    en: "AI summary of abstract",
  },
  selectedResultAccordionHeaderNoAbstract: {
    dk: "Opsummering af hele artiklen med kunstig intelligens (AI)",
    en: "AI summary of article",
  },
  hoverselectedResultAccordionHeader: {
    dk: "Få opsummeret dette abstract på dansk ved hjælp af kunstig intelligens (AI).",
    en: "",
  },
  hoverselectedResultAccordionHeaderNoAbstract: {
    dk: "Få opsummeret denne artikel på dansk ved hjælp af kunstig intelligens (AI).",
    en: "",
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
    en: "<p>No articles have been selected yet.\nMark articles by clicking the heck box to the left of each search result.</p>",
  },
  aiSummarizeSearchResultExplanation: {
    dk: "Markér de artikler, som du vil have opsummeret. Hvis du ikke markerer nogen, vil de første 5 artikler blive opsummeret.",
    en: "Select the records that you want to summarise. If you do not select any, the first 5 records will be summarised.",
  },
  generatePdfQuestionsButtonText: {
    dk: "Opsummér hele artiklen",
    en: "Summarize the full article",
  },
  summarizeArticleHeader: {
    dk: "Opsummering af hele artiklen",
    en: "Summary of the full article",
  },
  generateQuestionsHeader: {
    dk: "Spørgsmål til denne artikel",
    en: "Questions for this article",
  },
  userQuestionsHeader: {
    dk: "Stil dine egne spørgsmål",
    en: "Ask your own questions",
  },
  userQuestionInputPlaceholder: {
    dk: "Skriv dit spørgsmål her",
    en: "Enter your question here",
  },
  userQuestionInputHoverText: {
    dk: "Skriv dit spørgsmål her, tryk på enter knappen for at sende",
    en: "Enter your question here, press the enter key to submit",
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
    dk: "Det var desværre ikke muligt at hente indholdet. Prøv igen senere.",
    en: "An error occurred. Please try again later.",
  },
  askQuestionButtontext: {
    dk: "Send",
    en: "Send",
  },
  loadingText: {
    dk: "Indlæser...",
    en: "Loading...",
  },
  summarizeArticleNotAvailable: {
    dk: "Det er desværre ikke muligt at opsummere hele artiklen.",
    en: "Unfortunately, it is not possible to summarize this article.",
  },
  summarizeArticleNotice: {
    dk: "OBS! Hele teksten i denne artikel kan opsummeres.",
    en: "Att. The full text of this article can be summarized.",
  },
};
