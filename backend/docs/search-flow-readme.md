# Søgeflow i Mugin Scholar

Denne README beskriver søgeflowet i Mugin Scholar, fra brugeren vælger AI-oversættelse til eller fra, vælger emner og afgrænsninger, indtaster fri tekst og kombinerer PubMed med en eller flere semantiske kilder.

## Kanonisk live path

Den aktive runtime-sti er:

1. `SearchForm.vue` bygger et kanonisk request-payload (sources, topic/limit-valg, focus, sort, …).
2. `search()` / `searchMore()` kalder `backend/api/UnifiedSearch.php`.
3. `UnifiedSearch.php` kalder `muginPublicSearchRunSearch()` i `backend/app/public-search-lib.php` — samme orkestrator som public API (`public-api/v1/search.php`).
4. Hybrid ranking (fulde kvalitetssignaler + `focus`-profiler) aktiveres når `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED=true` via `backend/app/semantic-quality-lib.php`.

Redigerede søgestrenge fra «Vis søgestrenge» sendes som `queryOverrides` (JSON) eller URL-parametrene `qpubmed` / `qsemanticscholar` / `qopenalex` / `qelicit`. Når de er sat, vinder de over fritekst for de pågældende kilder, og LLM-oversættelse springes over for dem. En ikke-tom `q*` for en valgt kilde er nok til at starte søgningen uden `q`/`topic`. Øvrige valgte kilder oversættes stadig fra fritekst. `qpubmed` er kun emne/fritekst-delen; PubMed-afgrænsninger AND’es stadig fra formularens `limit=`. Uden `q*` er fritekst+LLM uændret.

Den ældre browser-side JS-pipeline i `SearchForm.vue` / `DropdownWrapper.vue` (lokal retrieval, merge, rerank, validering) er **dormant**: den er bevaret som kompatibilitets-/referencekode og vælges ikke ved runtime. Afsnittene nedenfor beskriver stadig den logiske model (emner, filtre, retrieval-trin), men den udførte orkestrering sker i PHP.

Primære filer for live path:

- `src/components/SearchForm.vue` (UI + UnifiedSearch-klient)
- `backend/api/UnifiedSearch.php`
- `backend/app/public-search-lib.php`
- `backend/app/semantic-quality-lib.php`
- `backend/api/OpenAlexSearch.php`, `SemanticScholarSearch.php`, `ElicitSearch.php`, `NlmSearch.php`, `NlmSummary.php`
- `backend/api/TranslateTitle.php`, `SemanticFinalRerank.php`
- `backend/app/helpers.php`

## Formål

Mugin Scholar har reelt to søgelag, som kan køre hver for sig eller sammen:

1. Et klassisk PubMed-lag, hvor emner, afgrænsninger og fri tekst bliver til en PubMed-søgestreng.
2. Et semantisk lag, hvor Semantic Scholar, OpenAlex og Elicit bruges til at hente kandidater, som senere valideres, flettes og vises sammen med PubMed-resultaterne.

AI-toggle bestemmer primært, om fri tekst og semantisk intention skal oversættes eller optimeres. Kildetoggles bestemmer, hvilke databaser der rent faktisk bruges.

## Debug-mode for søgeflow

Der findes nu en eksplicit debug-mode til fejlfinding af hele søgeflowet.

Den kan aktiveres på to måder:

- URL: `?muginDebug=searchflow`
- Widget-attribut: `data-debug-search-flow="true"`

Når debug er slået til, vises en hierarkisk log i browserkonsollen med `console.groupCollapsed` for hele flowet og de vigtigste undertrin:

- `01 Prepare`
- `02 PubMed query build`
- `03 Semantic intent`
- `04 Source retrieval`
- `04b Enrichment`
- `05 Merge and rerank`
- `06 Filter and validation`
- `07 Hydration`
- `08 Final result composition`

Debug-mode er bygget til at være billig i normal drift:

- Når debug er slået fra, laves kun lette guard-checks.
- Når debug er slået til, samles ekstra record-lister, merge-diagnostik og frafaldsårsager.
- Backend returnerer kun ekstra debugfelter i de normale kilde-responser, når flaget er aktivt.

Formålet er at kunne se:

- hvilke records hver kilde hentede
- hvilke records der blev droppet tidligt i backend-normalisering
- hvilke kandidater der blev flettet eller afvist senere
- hvilke records der endte i det endelige renderede resultat, og hvilke kilder de stammer fra

## Centrale begreber

### Emner og afgrænsninger

Valg i formularen bliver internt repræsenteret som elementer med blandt andet:

- `searchStrings`
- `scope`
- eventuelt `semanticConfig`
- eventuelt semantisk tilstand som PMIDs, DOI'er og kandidater

Et element kan derfor både være et almindeligt PubMed-element, et brugerdefineret fri-tekst-element eller et element, der senere udvides med semantiske resultater.

### Kildevalg

Mugin Scholar arbejder med disse kilde-nøgler:

- `pubmed`
- `semanticScholar`
- `openAlex`
- `elicit`

I `SearchForm.vue` holdes disse i `selectedTranslationSources`.

Vigtige regler:

- Hvis AI-funktionen er tilgængelig, sikrer systemet, at kildevalget aldrig bliver tomt. Standardfallback er `pubmed`.
- Semantiske kilder kan være valgt, selv om AI-toggle er slået fra.
- Når AI er slået fra, falder semantiske kilder tilbage til at bruge den rå tekst som query.

### AI-toggle kontra kildetoggles

Det er vigtigt at skelne mellem:

- `searchWithAI`: skal systemet oversætte eller optimere fri tekst?
- `searchWithPubMedBestMatch`, `searchWithSemanticScholar`, `searchWithOpenAlex`, `searchWithElicit`: hvilke kilder skal bruges?

Det betyder i praksis:

- AI kan være fra, mens PubMed stadig bruges.
- AI kan være fra, mens semantiske kilder stadig bruges med rå queries.
- AI kan være til, mens kun PubMed er valgt.
- AI kan være til, mens PubMed og en eller flere semantiske kilder bruges sammen.

## Sådan kombineres brugerens valg

### Emner

Emner ligger i `topics`.

Logikken i `getSearchString()` er:

- `OR` inden for samme emne-dropdown
- `AND` mellem flere emne-dropdowns

Hvis et element allerede indeholder logiske operatorer, pakkes det ind i parenteser efter behov, så den samlede streng forbliver syntaktisk korrekt.

For prædefinerede emner bruges deres egne `searchStrings` direkte i PubMed. AI-genereret PubMed-query bruges kun for fri tekst og erstatter ikke disse prædefinerede strenge.

### Afgrænsninger i simpel tilstand

I simpel tilstand ligger afgrænsninger i `limitData`, som er grupperet pr. kategori.

Logikken er:

- `OR` inden for samme kategori
- `AND` mellem kategorier

Eksempel:

- kategori `sprog`: `English OR Danish`
- kategori `studietype`: `Systematic review OR Meta-analysis`
- samlet: `(English OR Danish) AND (Systematic review OR Meta-analysis)`

### Afgrænsninger i avanceret tilstand

I avanceret tilstand ligger afgrænsninger i `limitDropdowns`.

Logikken er:

- `OR` inden for samme limit-dropdown
- `AND` mellem flere limit-dropdowns

Det giver brugeren mere eksplicit kontrol over, hvordan afgrænsninger grupperes.

## Fri tekst

Fri tekst oprettes i `DropdownWrapper.vue` som brugerdefinerede tags.

Der findes tre hovedforløb:

1. Fri tekst uden AI
2. Fri tekst med AI og kun PubMed
3. Fri tekst med semantiske kilder

### Flow 1: Fri tekst uden AI

Hvis brugeren indtaster fri tekst, og AI er slået fra:

- der oprettes et almindeligt brugerdefineret element
- teksten bruges direkte som søgeterm
- der køres ingen AI-oversættelse
- der genereres ingen semantisk intention

Hvis semantiske kilder er valgt samtidig, bruges den samme rå tekst også som semantisk query.

### Flow 2: Fri tekst med AI og kun PubMed

Hvis AI er slået til, `pubmed` er valgt, og ingen semantiske kilder er valgt:

- `DropdownWrapper.handleAddTag()` kører fri tekst gennem `buildPubMedSearchStringFromFreeText()`
- teksten oversættes til en PubMed-søgestreng
- hvis MeSH-validering er aktiv, køres `validateAndEnhanceMeshTerms()`
- resultatet gemmes som `pubmedGeneratedQuery`

I dette flow sker oversættelsen tidligt, allerede når tagget oprettes.

### Flow 3: Fri tekst med semantiske kilder

Hvis mindst en semantisk kilde er valgt:

- fri tekst bliver til et `pending semantic tag`
- selve beregningen udskydes til lige før søgning
- tagget markeres med `semanticFlowType: "deferred"`

Ved søgning vælger `SearchForm.prepareSemanticSearchStateBeforeSearch()` mellem to grene:

- globalt flow, når `searchWithAI === true` og formularen kan danne et samlet globalt intent-input
- tag-niveau-flow, når global-flowet ikke bruges

I global-flowet kaldes `preparePendingSemanticTags()` ikke nødvendigvis pr. tag. I stedet markeres ventende deferred tags som løst af den globale tilstand, og der bygges ét samlet state med `buildResolvedSemanticTagState(intentInput, ...)`.

Tag-niveau-flowet gælder stadig som fallback. For hvert ventende tag sker dette:

1. Hvis AI og PubMed er aktive, genereres en PubMed-streng for tagget.
2. Hvis AI og semantiske kilder er aktive, genereres en semantisk intention og en `semanticSourceQueryPlan`.
3. Hvis AI er inaktiv, bruges den rå tekst som semantisk query.
4. Semantic Scholar, OpenAlex og Elicit kaldes parallelt.
5. Kandidater flettes og genrangeres.
6. Ved sparsomme resultater kan en ekstra leksikalsk redning via PubMed køres som fallback, men kun hvis `PubMed` er valgt som kilde, og der ikke allerede er kørt en almindelig PubMed-retrieval i samme gren.

## Globalt semantisk intentionsflow

Ud over tag-niveau bygger `SearchForm` også en global semantisk intention for hele formularens samlede tilstand.

Det sker i `prepareSemanticSearchStateBeforeSearch()`:

- formularen bygger et samlet intentionstekst-grundlag via `semanticWordedIntentContext`
- hvis AI og globalt intent-input er aktive, markeres deferred tags som resolved af global state
- teksten sendes til `buildResolvedSemanticTagState(intentInput, null, { allowPubmedQueryGeneration: true, preferGeneratedPubmedQuery: true, pubmedSourceQuery })`
- dette bygger et globalt semantisk state
- dette state kan bidrage med egne PMIDs, DOI'er og kilde-specifikke filtre
- hvis `PubMed` er valgt, kan state'et også få en `pubmedGeneratedQuery` og en `pubmedSourceQuery`
- `pubmedSourceQuery` kan bruges til tidlig PubMed-retrieval som reel kilde før merge og genrangering

Det globale semantiske lag er vigtigt, fordi den semantiske søgning ikke kun styres af enkelt-tags, men også af den samlede kombination af emner og afgrænsninger.

## Kildeplaner og hårde filtre

For semantiske kilder bygger `DropdownWrapper` en `semanticSourceQueryPlan`.

Den plan indeholder:

- en query pr. kilde
- kilde-specifikke hints
- kilde-specifikke filtre

Nuværende kilde-specifikke filtre:

- Semantic Scholar: `publicationTypes`, `publicationDateOrYear`, `year`
- OpenAlex i LLM-schemaet: `language`, `sourceType`, `workType`
- OpenAlex i den interne resolved plan: `language`, `sourceType`, `workType`, `publicationYear`
- Elicit i LLM-schemaet: `typeTags`, `includeKeywords`, `excludeKeywords`
- Elicit i den interne resolved plan: `typeTags`, `includeKeywords`, `excludeKeywords`, `minYear`, `maxYear`, `minEpochS`, `maxEpochS`, `maxQuartile`, `hasPdf`, `pubmedOnly`, `retracted`

Disse filtre er tidlige retrieval-filtre. De bygges nu fra den kanoniske filterkontekst i formularen, hvor `limits.json` er autoritativ for hard filters og eksplicitte `sourceFilters`.

LLM må stadig bidrage med querytekst og bløde hints, men ikke længere udvide de kanoniske hard filters. `publicationYear` for OpenAlex tilføjes derfor først i den interne resolved plan fra canonical payload/hard filters, ikke fra LLM-outputtet. For Elicit defaultes `retracted` internt til `exclude_retracted`.

Retrieval-filtrene erstatter ikke den senere validering mod PubMed og de interne metadataregler.

## AI-proxy og structured output

`TranslateTitle.php` er en central del af søgeflowet, ikke kun en titeloversætter. Det samme endpoint bruges til:

- PubMed-query-translation
- semantisk intent-generation
- MeSH-optimering

Det semantiske intent-flow bruger `semanticIntentResponseSchema` i `src/assets/prompts/translation.js` som strict structured output. Schemaet kræver præcis de topfelter, prompten forventer: `semanticIntent`, `softFilterHints`, `sourceSpecificHints`, `sourceQueryPlan` og `meta`.

Frontend har stadig en robust fallback: hvis semantic intent-responsen ikke kan parses som JSON, falder flowet tilbage til simpel Semantic Scholar-translation. Det korrekte runtime-flow er dog, at `TranslateTitle.php` returnerer valid JSON efter schemaet, så `sourceQueryPlan.coreQuery`, source-specifikke queries og metadata kan bruges direkte.

## Lokal backend HTTP-håndtering

`muginHttpRequest()` i `backend/app/helpers.php` er fælles HTTP-lag for eksterne API-kald fra backend.

I lokal udvikling håndteres HTTP lidt anderledes end i produktion:

- ved localhost ryddes arvede shell-proxyindstillinger, så lokale proxyfejl ikke påvirker OpenAI/OpenAlex-kald
- PHP/cURL CA-problemer håndteres med native CA eller en konfigureret CA bundle. Usikker TLS-fallback er ikke en del af runtime-flowet.

Det forklarer tidligere OpenAI/OpenAlex SSL- og proxyfejl i lokal opsætning. Det er infrastruktur omkring kaldet, ikke en del af selve produktets søgesemantik.

## Hvordan den første PubMed-streng bygges

Den første query til PubMed bygges i `SearchForm.getSearchString()`.

Processen er:

1. Der bygges en `baseQuery` af alle ikke-semantiske elementer via `buildPubMedBaseQuery()`.
2. Der samles PMIDs fra semantiske elementer og globalt semantisk state via `buildSemanticPmidClause()`.
3. Hvis der findes semantiske PMIDs, bygges en `semanticClause` som en PMID-liste.
4. `getSearchString()` returnerer `baseQuery || semanticClause`.

Det giver tre praktiske hovedforløb:

- hvis `baseQuery` findes: den bruges som den første `finalQuery` fra `getSearchString()`
- hvis `baseQuery` mangler, men semantiske PMIDs findes: den første query er en ren PMID-liste
- hvis der findes semantiske tags, men ingen PMIDs: `buildSemanticPmidClause()` returnerer en intern no-match-placeholder, så flowet ikke fejlagtigt falder tilbage til en bred almindelig tekstsøgning

I hybridmode kan `baseQuery` stadig være brugerens rå fri tekst eller et deferred tag-display, selv om der findes en AI-genereret `pubmedGeneratedQuery` på global semantic state. Når der findes rerankede kandidater, er denne raw `finalQuery` primært fallback, debug- og control-state. De viste resultater kommer fra den hybride kandidatliste efter hard-filtervalidering.

`pubmedGeneratedQuery` bruges derfor ikke nødvendigvis som `finalQuery`. Den bruges som PubMed Best Match-kilde før merge og som grundlag for PubMed-retrieval eller lexical rescue, når den gren er aktiv.

Den senere valideringsquery bygges ikke her. Når rerankede PMIDs skal valideres mod hårde filtre, bygges `(<pmid-liste>) AND (<hard-filter-query>)` først i `resolveOrderedSearchPmids()`, og den streng eksponeres bagefter via `displaySearchString()`.

## Hård semantisk filtervalidering

Ved hybridsøgning bruges `getSemanticHardFilterValidationQuery()`.

Den udtrækker nu hårde afgrænsninger fra både emner og afgrænsninger gennem én fælles kanonisk filtertilstand.

Formålet er:

- semantiske kilder må gerne hente bredt
- men de endelige PubMed-match skal stadig opfylde de valgte hårde afgrænsninger

Det giver følgende håndhævelsesspor:

- PMID-records valideres mod den kanoniske PubMed-hardfilterquery
- PMIDs, der består denne validering, bliver trusted og springer den senere metadataregelvalidering over
- ikke-PMID-records og andre ikke-trusted refs valideres via metadataregler fra `semanticConfig.postValidation.rules`

Det er derfor især DOI-only og andre ikke-trusted kandidater, der stadig kan blive afvist senere, selv om de kom hjem fra en ekstern kilde.

## Retrieval og genrangering i detaljer

Denne sektion beskriver den logiske model for retrieval og genrangering. I live path udføres trinene i `muginPublicSearchRunSearch()` (PHP). Funktionsnavne fra `DropdownWrapper` / `semanticReranking.js` nedenfor er dormant JS-reference, medmindre andet er angivet.

### Overordnet retrieval-model

Mugin Scholar bruger en flertrinsmodel:

1. Formularen danner en klassisk PubMed-basequery og eventuelt en semantisk intention.
2. Eksterne semantiske kilder henter kandidater ud fra fri query og kilde-specifikke filtre.
3. Kandidater normaliseres til et fælles format.
4. Kandidater flettes på tværs af kilder ved PMID eller DOI.
5. De flettede kandidater genrangeres deterministisk.
6. Derefter valideres og hydreres resultater via PubMed og OpenAlex.
7. Eventuelt køres en ekstra LLM-baseret slutgenrangering på en lille topmængde.

Det er vigtigt at skelne mellem:

- retrieval: hvilke records hentes tidligt fra hvilke kilder
- genrangering: hvordan disse records sorteres internt
- validering og hydrering: hvordan metadata, abstracts og hårde filtre bagefter bruges til at afgøre, hvad der faktisk vises

Derudover skelner den nuværende arkitektur eksplicit mellem:

- `filterHydration`: data, der bruges til retrieval, pushdown og hard validering
- `displayMetadataHydration`: data, der kun bruges til at vælge den bedste `title` og `abstract` til visning

### Normaliseret kandidatformat

Alle kilder normaliseres til et fælles kandidatformat med felter som:

- `source`
- `rank`
- `pmid`
- `doi`
- `title`
- `score`
- `metadata`

Det gør det muligt at flette og sammenligne kandidater på tværs af kilder, selv om API'erne returnerer forskellige strukturer.

### Retrieval fra PubMed

PubMed indgår på flere forskellige måder:

- klassisk PubMed-retrieval, når den første query er en almindelig PubMed-query
- tidlig PubMed-retrieval som reel kilde før merge og genrangering, når `pubmedSourceQuery` findes
- validering af semantiske kandidater, når systemet arbejder med en PMID-whitelist
- leksikalsk redning via PubMed, men kun hvis `PubMed` er valgt som aktiv kilde, og der ikke allerede er kørt en tidlig standard-PubMed-retrieval

Ved leksikalsk redning vurderer `DropdownWrapper.shouldRunPubMedLexicalRescue()`, om retrieval er for tynd, blandt andet ud fra antal unikke flettede kandidater, samlet antal kildekandidater og konfigurerede minimumsgrænser.

Hvis `PubMed` ikke er valgt, returnerer funktionen altid `pubmed-not-selected`. Hvis der allerede køres en tidlig PubMed-retrieval via `pubmedSourceQuery`, springes rescue også over.

Hvis retrieval vurderes som sparsom og rescue er tilladt:

- systemet kører en ekstra PubMed-søgning på den genererede PubMed-query
- abstracts kan hentes for disse redningsrecords
- der beregnes en simpel leksikalsk score mod titel og abstract
- kun kandidater over en minimumstærskel tages med tilbage som en ekstra kilde

### Retrieval fra Semantic Scholar

Semantic Scholar bruges som en ren retrieval-kilde:

- query sendes til `SemanticScholarSearch.php`
- backend henter i batches
- hver artikel reduceres til PMID eller DOI plus titel, flad abstracttekst og basis-metadata

Vigtige karakteristika:

- Semantic Scholar kan bruge strukturerede filtre for `publicationTypes`, `year` og `publicationDateOrYear`
- retrieval er fri query-baseret
- Semantic Scholar bidrager primært med ranks, titel, abstract og identifikatorer

Det er vigtigt, at vores interne model og Semantic Scholar API ikke er helt det samme:

- internt holder vi stadig `sourceFormat` og `publicationType` adskilt
- men når Semantic Scholar-kaldet bygges, kan begge projektioner ende i API-feltet `publicationTypes`

Hvis backend kun kan levere et delvist resultat, kan payload markeres som `partial`, og systemet accepterer stadig kandidaterne som et degraderet retrieval-resultat.

### Retrieval fra OpenAlex

OpenAlex bruges på flere niveauer:

- primær semantisk retrieval via `search.semantic`
- eventuel keyword-søgning som supplement
- metadata- og DOI-hydrering efter retrieval-fasen

OpenAlex er især vigtig som filter-kompatibel metadata-rygrad for ikke-PMID-records, fordi den giver stabile kilde- og bibliografifelter, som kan bruges til post-validering.

OpenAlex kan bruge disse retrieval-filtre:

- `language`
- `sourceType`
- `workType`
- `publicationYear`

OpenAlex bruger `search.semantic` som primær mode, medmindre `sourceType`-filtre er aktive. Når `sourceType` er aktivt, bruges `keyword` som primær mode, fordi den kombination er mere robust mod OpenAlex' semantiske endpoint.

Hvis OpenAlex rammer `OPENALEX_SEMANTIC_RESULT_CAP`, udløses en ekstra keyword-søgning, og de to resultatsæt flettes bagefter. Det samme keyword-supplement bruges, når semantisk retrieval fejler helt med 0 kandidater.

OpenAlex retry'er ikke længere ved enhver warning. Backend forsøger i stedet at udlede, om konkrete filterparametre ser ud til at være problemet, og returnerer i så fald strukturerede `retryHints`. Frontend kan prøve flere hintede retry-felter sekventielt og accepterer det første retry-resultat uden warning eller error. Hvis `sourceType` ser ud til at give fejl, prøves altså en request uden `sourceType`, mens de øvrige filtre bevares.

I lokal udvikling kan frontend også prøve browser-proxy fallback ved backend-warning. Ved kendte upstream-fejl fra OpenAlex' semantiske embedding, fx at query ikke kan embeddes, springes browser-proxy fallback over, og flowet går i stedet videre til keyword fallback.

### Retrieval fra Elicit

Elicit bruges som en semantisk retrieval-kilde med naturligt sprog, via Elicits v2-endpoint (`POST /api/v2/search/papers`):

- queryen er ofte mere spørgsmålslignende end queryen til de øvrige kilder
- der kan sendes `typeTags`, `includeKeywords`, `excludeKeywords`, `minYear`, `maxYear`, `minEpochS`, `maxEpochS`, `maxQuartile`, `hasPdf`, `pubmedOnly` og `retracted`
- `retracted` defaultes internt til `exclude_retracted`
- `corpus` sendes explicit som `"elicit"` (Elicits fulde paper-indeks, ikke kun PubMed) og `searchMode` explicit som `"semantic"`
- `maxResults` er konfigureret til 300 pr. kald (`MUGIN_SEMANTIC_SOURCE_LIMITS['elicit']`), inden for Pro-planens grænse på 300 resultater pr. request

Elicit følger nu samme princip som OpenAlex ved retry:

- backend kan returnere `retryHints`
- frontend kan prøve flere hintede retry-felter sekventielt
- frontend accepterer det første retry-resultat uden warning eller error
- hvis der ikke findes et præcist hint, sker der ingen automatisk filter-retry

### Hvordan kilder flettes

Efter retrieval normaliseres alle kandidater og flettes i `rerankSemanticCandidates()`.

Fletning sker på basis af:

- `pmid:<pmid>` hvis PMID findes
- ellers `doi:<doi>` hvis DOI findes

Det betyder:

- samme record fra flere kilder bliver samlet som én kandidat
- hver kilde kan stadig bidrage med sin egen rank og eventuelle score
- hvis samme kandidat findes flere gange fra samme kilde, bevares den bedste rank

### Visningsmetadata og display-prioritet

Når en kandidat først er accepteret af filterflowet, vælges visningsmetadata separat fra selve filtreringen.

Prioriteten er:

- `PubMed` først for records med PMID
- `Semantic Scholar` derefter for `title` og især `abstract` på ikke-PMID-records
- `OpenAlex` som fallback til visning og som primær kilde til bibliografiske metadata

Det betyder, at OpenAlex gerne må være den vigtigste metadata-kilde til filtrering og hydrering, uden at OpenAlex nødvendigvis også er førstevalg til den tekst, brugeren ser i resultatlisten.

### Enrichment inden genrangering

Før selve genrangeringen kører et enrichment-lag (`04b Enrichment` i search-flow-debug). Det beriger kandidaterne med ekstra kvalitetssignaler, som senere bruges af både den deterministiske rerank og LLM-rerank. Enrichment består af to parallelle kald fra `DropdownWrapper.vue`:

- `ICiteLookup.php` — batch-kald (op til 500 PMIDs pr. batch) til NIH iCite, der leverer Relative Citation Ratio (RCR), NIH percentile, `is_clinical`, `cited_by_clin`, `apt` og `field_citation_rate`. iCite dækker kun PMIDs; DOI-only kandidater får `null` og falder tilbage på FWCI.
- `OpenAlexAuthorityLookup.php` — batch-kald (50 ids pr. batch) til OpenAlex for forfatter-h-index (`authorityAuthors.maxHIndex`) og journal-metrics (`authorityJournal.meanCitedness`, `hIndex`, `isInDoaj`).

Derudover bæres følgende signaler allerede direkte i retrieval-responsen uden ekstra kald:

- OpenAlex: `fwci`, `cited_by_count`, `counts_by_year`, `is_retracted`, `open_access.is_oa`, `primary_topic`, `authorships[].author.id`, `primary_location.source.id`.
- Semantic Scholar: `citationCount`, `influentialCitationCount`, `s2FieldsOfStudy`, `tldr`, `isOpenAccess`.
- Elicit (v2): `citedByCount`, `authors`. Elicit returnerer ikke noget publikationstype-felt på selve paper-objektet, så `pubTypes` kan ikke udledes fra Elicit alene — kun via merge med en anden kilde.

Ved fejl i enrichment (fx iCite nede) logges en warning, men rerank kører videre uden de manglende signaler.

### Mergeregler for enrichment-felter

`mergeSourceCandidates()` samler enrichment pr. merged record i `entry.enriched` med disse regler:

- `isRetracted` = `any(sources)` — enhver kilde der siger retracted vinder.
- `citedByCount` = `max(sources)` — højeste tal vinder.
- `fwci` = prioritet OpenAlex → S2.
- `rcr`, `nihPercentile`, `isClinical`, `citedByClin`, `apt` = kun iCite.
- `influentialCitationCount` = kun S2.
- `publicationYear` = prioritet OpenAlex → S2 → Elicit.
- `pubTypes` = union af alle kilder.
- `primaryTopicDisplayName` = OpenAlex.
- `s2FieldsOfStudy` = S2.
- `isOpenAccess` = `any(sources)`.
- `authorityAuthors`, `authorityJournal` = OpenAlex.

### Klassifikation og data quality (M2)

Mellem enrichment (`04b`) og den deterministiske rerank (`05`) klassificeres hver kandidat til én kanonisk publikationstype (`04c Classification` i search-flow-debug). Klassifikationen ligger i `src/utils/pubTypeClassifier.js` og kombinerer flere signaler i denne rækkefølge:

1. Match mod `guidelinePublisherAllowList` (fx WHO, NICE, CDC, Sundhedsstyrelsen, ADA) → `guideline_verified`.
2. `publicationTypes`-felter fra PubMed og S2 (fx `Guideline`, `Practice Guideline`, `Systematic Review`, `Meta-Analysis`, `Randomized Controlled Trial`) → `guideline_candidate`, `systematic_review_or_meta`, `clinical_trial`.
3. OpenAlex `workType` (`book-chapter`, `dissertation`, `preprint`, `review`, `report`).
4. Titelmønstre (fx "chapter", "thesis", "errata") som sidste fallback.

Hver klassifikation bærer også en `confidence` (`high`, `medium`, `low`), som indgår som multiplikator på tier-bonusen senere. Resultatet gemmes som `candidate.pubTypeClassification = { tier, confidence, signals[] }` og propageres helt ud til UI'et som type-badge.

Kandidater, der mangler titel, hard-droppes. Kandidater med tier `excluded` (fx errata, datasets, peer-reviews) filtreres væk før sortering når `pubTypeTiers` er aktiv. Alle andre records — også records uden abstract, forfatter eller årstal — beholdes og straffes via `dataQualityMultiplier` i stedet for at blive fjernet.

`computeDataQualityMultiplier` ganger `dataQualityPenalties.missingAbstract * missingAuthor * missingYear * veryShortAbstract`. Alle defaults er 1.0 (neutralt), så tuning er opt-in.

### Deterministisk genrangering

Den primære live genrangering ligger i `backend/app/semantic-quality-lib.php` (kaldes fra `muginPublicSearchRunSearch` når `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED=true`). `src/utils/semanticReranking.js` er dormant JS-reference. Hybrid-formlen er:

- `baseScore = sum(weightedRrf_sources) + pmidBonus + overlapBonus`  *(uændret RRF-kerne)*
- `additiveQualityBonus = pubTypeTierBonus + recencyBonus + oaBonus + clinicalBonus + topicOverlapBonus`
- `qualityMultiplier = citationImpactMultiplier * authorityMultiplier * retractionMultiplier * dataQualityMultiplier`
- `combinedScore = (baseScore + additiveQualityBonus) * qualityMultiplier`

`pubTypeTierBonus = pubTypeTiers[tier] * confidenceCoefficient(confidence)` hvor `confidenceCoefficient(high)=1.0`, `(medium)=0.7`, `(low)=0.4`. Hvis `pubTypeTiers` ikke er sat, er bonusen 0 for alle tiers og M2-adfærden er bagudkompatibel.

`topicOverlapBonus` er en **fair, additiv** emnebonus: den bruger capped `enriched.topicLabels` (max 8) fra OpenAlex `primaryTopicDisplayName` + `topics[]` display names + Semantic Scholar `s2FieldsOfStudy`. Match mod query-intent (tokens + frase-hit) giver kun bonus; manglende MeSH/PMID/emner giver **0**, aldrig minus. DOI-only med OpenAlex/S2-emner er førsteklasses. LLM finalRerank får capped `topics` (max 16: MeSH, OpenAlex-emner/delfelt/emneord, PubMed-keywords, S2) som additivt evidens — manglende topics eller MeSH må ikke sænke en kandidat.

Alle nye signaler defaulter til neutrale værdier så en uopdateret installation har 1:1 samme adfærd som før.

Den vægtede RRF er stadig hovedsignalet. Formlen er:

- `weightedRrf = (sourceWeight * rankScale * rrfK) / (rrfK + rank)`

Hvis en kandidat har et PMID, får den en ekstra bonus (`pmidBonus`). Hvis samme kandidat findes i mere end én kilde, får den en overlap-bonus. Hvis upstream-kilden leverer en numerisk score, normaliseres den inden for den enkelte kilde og bruges kun som tie-breaker.

Hvis kun én kilde faktisk leverer kandidater, skifter systemet til `single`-tilstand. Her bruges der ikke overlap-bonus, og sorteringen bliver i praksis bedste rank først og derefter score-tie-breaker.

### Citation-impact fallback-kaskade

`computeCitationImpactMultiplier` vælger det bedste tilgængelige citation-signal pr. kandidat i denne rækkefølge:

1. RCR (kun PMID, kommer fra iCite)
2. FWCI (OpenAlex, log-dæmpet)
3. `influentialCitationCount` (S2)
4. `citedByCount` (log-dæmpet)
5. Intet signal → neutral multiplier 1.0

Det sikrer, at DOI-only kandidater stadig får et citation-signal via FWCI, selv om iCite ikke kan nås via DOI.

### Retraction-håndtering

Retraction-flag styres via `retractionAction` i config, tri-state:

- `'none'` (default): ingen effekt.
- `'penalty'`: `combinedScore` ganges med `retractionPenalty`.
- `'filter'`: kandidaten fjernes fra resultatet før sortering. Tællingen eksponeres som `diagnostics.enrichmentSummary.filteredByRetraction`.

### Standardkonfiguration for genrangering

Genrangeringskonfigurationen ligger i `MUGIN_RERANK_CONFIG`.

De vigtigste parametre er:

- RRF-kerne: `sourceWeights`, `pmidBonus`, `overlapBonusPerExtraSource`, `rrfK`, `rankScale`, `scoreScale`, `fallbackSourceWeight`
- Kvalitets-bonus (additive): `pubTypeTiers` (M2), `pubTypeConfidenceCoefficients` (M2), `recencyHalfLifeYears`, `recencyBonusMax`, `recencyCurveEnabled` + `recencyCurve` (trappet recency, piecewise linear med plateau/gulv), `oaBonus`, `clinicalBonus`, `clinicalCitedByThreshold`, `topicOverlapBonus`
- Kvalitets-multiplier: `citationImpactClamp`, `authorityClamp`, `retractionAction`, `retractionPenalty`, `dataQualityPenalties` (M2)
- Klassifikation: `guidelinePublisherAllowList` (deles med `limits.json`)

Alle kvalitetsparametre defaulter til neutrale værdier, så installationer der ikke har opdateret deres config får præcis samme rangering som før.

### Diagnostik for genrangering

Den deterministiske genrangerer producerer også diagnostik:

- `sourceSummary`
- `sourceStats`
- `overlapSummary`
- `enrichmentSummary` — tællere for `withFwci`, `withRcr`, `withInfluentialCitations`, `withCitedByCount`, `withRetractionFlag`, `filteredByRetraction`, `withClinicalFlag`, `withCitedByClin`, `withPubTypeMatch`, `withOpenAccess`, `withTopicOverlap`, `withAuthorityData`, `withRecencySignal`, samt M2-tællere: `byPubTypeTier.{tier}`, `withoutAbstract`, `withoutAuthor`, `withoutYear`, `veryShortAbstract`, `totalDowngradedByQuality`
- detaljerede scorebidrag pr. kandidat (`contributions[]`, `scoreBreakdown`)

Det er nyttigt ved tuning, fordi man kan se, om en kandidat blev løftet af høj rank i én kilde, overlap på tværs af kilder, PMID-bonus, kvalitets-bonus eller kvalitets-multiplier.

### Fra genrangering til endelig visning

Efter den deterministiske genrangering sker der flere trin, før resultatet vises:

1. PMIDs valideres mod den endelige hard-filter-query i PubMed.
2. PMIDs, der består, markeres som trusted.
3. DOI-only-kandidater og andre ikke-trusted refs hydreres og kontrolleres mod metadatareglerne.
4. Resultaterne omsættes til `resultRefs`.
5. Metadata og abstracts hentes.
6. Første side kan eventuelt gennemgå en ekstra LLM-baseret slutgenrangering.

Det betyder, at en kandidat godt kan være højt genrangeret tidligt, men stadig blive sorteret fra senere, hvis den ikke overlever valideringen. Det gælder især DOI-only og andre ikke-trusted refs.

### LLM-baseret slutgenrangering

Ud over den deterministiske genrangering findes en valgfri ekstra slutgenrangering:

- den er konfigurationsstyret
- den bruges kun på side 1
- den bruges kun ved semantiske søgninger
- den springes over ved dato-sortering
- den kører kun på top N kandidater

Flowet er:

1. Top N hydrerede kandidater udvælges.
2. Manglende abstracts hentes om nødvendigt fra PubMed.
3. Kandidater sendes til `SemanticFinalRerank.php`.
4. Backend returnerer en permutation af kandidat-id'er.
5. Hvis permutation er gyldig, bruges den som endelig top-rækkefølge.
6. Ellers beholdes den deterministiske rækkefølge.

LLM-genrangeringen må ikke opfinde eller fjerne kandidater. Den må kun omrokere dem og fungerer kun som et sent finjusteringslag oven på den deterministiske pipeline.

### Hvor retrieval slutter, og validering begynder

I Mugin Scholar er retrieval og validering bevidst adskilt.

Retrieval handler om at hente gode kandidater tidligt, gerne lidt bredt og med kilde-specifikke queries og filtre.

Validering handler om at sikre, at de endelige records stadig passer til brugerens valgte afgrænsninger, og at PMID- og DOI-records kan vises med de metadata, systemet forventer.

## Hvad der sker, når brugeren klikker på søg

Det overordnede **live** flow i `SearchForm.search()` er:

1. Formularen nulstiller loading state.
2. `buildUnifiedSearchRequestPayload()` samler sources, query/topics/limits, focus, sort og responseOptions.
3. `callUnifiedSearchEndpointStreaming()` (eller ikke-streaming-varianten) POST'er til `UnifiedSearch.php`.
4. Serveren kører `muginPublicSearchRunSearch()` (retrieval, enrichment, hybrid rerank når unified engine er enabled, validering, hydration, evt. LLM-slutrerank).
5. Responsens `results` mappes til UI via `mapUnifiedSearchResponseResults()`.
6. Progress-events (SSE) spejles i process-detaljer, når streaming er aktiv.

*(Den gamle lokale JS-sekvens med `prepareSemanticSearchStateBeforeSearch()` → lokal merge/rerank er dormant og køres ikke.)*

## Konkret eksempel: fra brugerens valg til den endelige resultatliste

Nedenfor er et konkret eksempel på et realistisk hybridforløb.

### Brugerens valg

Brugeren gør følgende:

- slår AI til
- indtaster fri tekst: `Artificial intelligence`
- vælger afgrænsninger: systematiske reviews, Cochrane Reviews, engelsk, dansk, vestlige lande og fjern dyrestudier
- vælger kilder: PubMed, OpenAlex og Elicit

### Hvad systemet gør

1. Den frie tekst oprettes som et ventende semantisk tag, fordi der er valgt semantiske kilder.
2. Når brugeren klikker på søg, bygger `prepareSemanticSearchStateBeforeSearch()` normalt ét globalt semantic state for hele formularen, fordi AI og globalt intent-input er aktive. Tag-niveau-flowet bruges kun som fallback.
3. Fordi AI og PubMed er aktive, dannes der en PubMed-søgestreng, som efter MeSH-validering kan ende med termer som `"Artificial Intelligence"[mh]`, `"Machine Learning"[mh]` og relevante fritekstsynonymer.
4. Fordi AI og semantiske kilder også er aktive, dannes der en semantisk intention og en `semanticSourceQueryPlan`.
5. OpenAlex kaldes med sin semantiske query og sine filtre, medmindre `sourceType`-filtre gør keyword-mode til primær mode. Hvis OpenAlex rammer sit cap eller semantisk retrieval fejler helt med 0 kandidater, suppleres med keyword-søgning. Hvis backend returnerer retry-hints, kan frontend prøve flere hintede filterfelter sekventielt og acceptere første rene svar.
6. Elicit kaldes med en naturlig sproglig forskningsforespørgsel og sine resolved filtre. Også her kan frontend prøve flere hintede retry-felter sekventielt og acceptere første svar uden warning eller error.
7. Kandidater fra kilderne normaliseres og flettes ved PMID eller DOI.
8. Kandidaterne genrangeres med vægtet RRF, PMID-bonus, overlap-bonus og eventuel tie-breaker-score.
9. Hvis den semantiske høst er for tynd, og der ikke allerede er kørt en almindelig PubMed-retrieval i samme gren, kan PubMed lexical rescue supplere med ekstra kandidater.
10. De semantiske PMIDs valideres derefter mod en hård filterquery, så resultaterne stadig passer til brugerens afgrænsninger.
11. DOI-only-kandidater kan hydreres via OpenAlex, hvis de overlever de relevante regler.
12. Første side kan eventuelt få en ekstra LLM-baseret slutgenrangering, som kun må omrokere den eksisterende topmængde.
13. Til sidst vises resultaterne, og abstracts efterhentes robust for de synlige records.

Det centrale er, at brugerens valg først bruges til retrieval, derefter til genrangering og til sidst til streng validering og visning.

## Resultatflow i de tre vigtigste kombinationer

### Kun PubMed valgt

- der bruges ingen eksterne semantiske kilder
- `getSearchString()` producerer en almindelig PubMed-query
- `search()` kører almindelig PubMed-`esearch` og `esummary`
- resultater vises i PubMeds egen sortering

### PubMed og semantiske kilder valgt sammen

- fri tekst kan blive oversat til en PubMed-query
- samme input kan også blive omsat til semantisk query eller intention
- hvis der findes prædefinerede emner med egne PubMed-strenge, kan PubMed hentes tidligt som reel kilde før merge og genrangering
- eksterne kilder henter kandidater
- hvis der ikke allerede er kørt den tidlige PubMed-retrieval, kan PubMed lexical rescue bruges ved tynd harvest
- kandidater genrangeres og valideres
- PubMed bruges som kanonisk metadata- og filterlag for PMID-records
- PMIDs, der består PubMed-valideringen, bliver trusted og springer metadatareglerne over
- DOI-only-records kan stadig vises via OpenAlex-hydrering, hvis de overlever de hårde filterregler

### Kun semantiske kilder valgt

- semantiske kilder bruges stadig til retrieval
- systemet samler PMIDs og DOI'er fra kandidaterne
- PubMed lexical rescue bruges ikke, fordi PubMed ikke er valgt som kilde
- PubMed bruges stadig bagefter til validering, metadata og visning for PMID-records
- DOI-only-records kan stadig inkluderes via OpenAlex-hydrering

Det vil sige, at PubMed godt kan indgå som teknisk validerings- og visningslag, selv om brugeren ikke har valgt klassisk PubMed-retrieval som primær kilde.

## Ansvar fordelt på kode

### `SearchForm.vue` (live)

Ansvar:

- holder den samlede formularstate og valgte kilder
- bygger UnifiedSearch-payload
- kalder `UnifiedSearch.php` og mapper responsen til UI
- viser progress/process-detaljer fra SSE

### `DropdownWrapper.vue`

Ansvar (live): opretter/opdaterer tags og fri tekst i UI.

*(Dormant: lokal AI-oversættelse, kildeopslag, merge/rerank — erstattet af PHP-orkestratoren.)*

### `SearchResult.vue`

Ansvar:

- viser resultater
- håndterer efterhentning/visning af abstracts i resultatlisten

### Backend (live)

Ansvar:

- `UnifiedSearch.php`: first-party indgang → `muginPublicSearchRunSearch()`
- `public-search-lib.php` / `semantic-quality-lib.php`: orkestrering, hybrid rerank, validering
- `NlmSearch.php`, `NlmSummary.php`, `NlmFetch.php`: PubMed- og NLM-proxy
- `TranslateTitle.php`: AI-proxy til PubMed-translation, semantic intent, structured output og MeSH-optimering
- `SemanticScholarSearch.php`, `OpenAlexSearch.php`, `ElicitSearch.php`: kilde-proxies
- `OpenAlexWorkLookup.php`: hydrering af DOI-/OpenAlex-records
- `SemanticFinalRerank.php`: valgfri LLM-baseret slutgenrangering
- `helpers.php`: fælles HTTP-lag (`muginHttpRequest()`)

## Kort opsummering

Mugin Scholar er et hybridt søgesystem, hvor web og public API deler én PHP-orkestrator:

- formularen samler valg og kalder `UnifiedSearch.php`
- AI kan oversætte fri tekst til PubMed og/eller semantiske intentioner (server-side)
- semantiske kilder henter kandidater parallelt
- PubMed bruges både som retrieval-kilde og som validerings-/metadata-lag
- med `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED=true` kører fulde hybrid-profiler i PHP

Vigtigste live entry points:

- `SearchForm.search()` / `buildUnifiedSearchRequestPayload()`
- `backend/api/UnifiedSearch.php`
- `muginPublicSearchRunSearch()`
