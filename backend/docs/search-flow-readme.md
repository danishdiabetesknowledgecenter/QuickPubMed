# Søgeflow i QuickPubMed

Denne README beskriver det faktiske søgeflow i QuickPubMed, fra brugeren vælger AI-oversættelse til eller fra, vælger emner og afgrænsninger, indtaster fri tekst og kombinerer PubMed med en eller flere semantiske kilder.

Dokumentet er skrevet ud fra den nuværende implementering i:

- `src/components/SearchForm.vue`
- `src/components/DropdownWrapper.vue`
- `src/components/SearchResult.vue`
- `backend/api/OpenAlexSearch.php`
- `backend/api/SemanticScholarSearch.php`
- `backend/api/ElicitSearch.php`
- `backend/api/SemanticFinalRerank.php`

## Formål

QuickPubMed har reelt to søgelag, som kan køre hver for sig eller sammen:

1. Et klassisk PubMed-lag, hvor emner, afgrænsninger og fri tekst bliver til en PubMed-søgestreng.
2. Et semantisk lag, hvor Semantic Scholar, OpenAlex og Elicit bruges til at hente kandidater, som senere valideres, flettes og vises sammen med PubMed-resultaterne.

AI-toggle bestemmer primært, om fri tekst og semantisk intention skal oversættes eller optimeres. Kildetoggles bestemmer, hvilke databaser der rent faktisk bruges.

## Debug-mode for søgeflow

Der findes nu en eksplicit debug-mode til fejlfinding af hele søgeflowet.

Den kan aktiveres på to måder:

- URL: `?qpmDebug=searchflow`
- Widget-attribut: `data-debug-search-flow="true"`

Når debug er slået til, vises en hierarkisk log i browserkonsollen med `console.groupCollapsed` for hele flowet og de vigtigste undertrin:

- `01 Prepare`
- `02 PubMed query build`
- `03 Semantic intent`
- `04 Source retrieval`
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

QuickPubMed arbejder med disse kilde-nøgler:

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

Ved søgning kalder `SearchForm.prepareSemanticSearchStateBeforeSearch()` alle relevante dropdowns, som derefter kalder `preparePendingSemanticTags()`.

For hvert ventende tag sker dette:

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
- denne tekst bruges til et globalt semantisk state
- dette state kan bidrage med egne PMIDs, DOI'er og kilde-specifikke filtre
- hvis `PubMed` er valgt, og der findes prædefinerede emner med egne PubMed-strenge, bygges også en `pubmedSourceQuery`
- denne query kan bruges til tidlig PubMed-retrieval som reel kilde før merge og genrangering

Det globale semantiske lag er vigtigt, fordi den semantiske søgning ikke kun styres af enkelt-tags, men også af den samlede kombination af emner og afgrænsninger.

## Kildeplaner og hårde filtre

For semantiske kilder bygger `DropdownWrapper` en `semanticSourceQueryPlan`.

Den plan indeholder:

- en query pr. kilde
- kilde-specifikke hints
- kilde-specifikke filtre

Nuværende kilde-specifikke filtre:

- Semantic Scholar: `publicationTypes`, `publicationDateOrYear`, `year`
- OpenAlex: `language`, `sourceType`, `workType`, `publicationYear`
- Elicit: `typeTags`, `includeKeywords`, `excludeKeywords`

Disse filtre er tidlige retrieval-filtre. De bygges nu fra den kanoniske filterkontekst i formularen, hvor `limits.json` er autoritativ for hard filters og eksplicitte `sourceFilters`.

LLM må stadig bidrage med querytekst og bløde hints, men ikke længere udvide de kanoniske hard filters.

Retrieval-filtrene erstatter ikke den senere validering mod PubMed og de interne metadataregler.

## Hvordan den første PubMed-streng bygges

Den første query til PubMed bygges i `SearchForm.getSearchString()`.

Processen er:

1. Der bygges en `baseQuery` af alle ikke-semantiske elementer via `buildPubMedBaseQuery()`.
2. Der samles PMIDs fra semantiske elementer og globalt semantisk state via `buildSemanticPmidClause()`.
3. Hvis der findes semantiske PMIDs, bygges en `semanticClause` som en PMID-liste.
4. `getSearchString()` returnerer `baseQuery || semanticClause`.

Det giver tre praktiske hovedforløb:

- hvis `baseQuery` findes: den bruges som den første PubMed-query
- hvis `baseQuery` mangler, men semantiske PMIDs findes: den første query er en ren PMID-liste
- hvis der findes semantiske tags, men ingen PMIDs: `buildSemanticPmidClause()` returnerer en intern no-match-placeholder, så flowet ikke fejlagtigt falder tilbage til en bred almindelig tekstsøgning

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

Denne sektion beskriver ikke bare, at der "hentes kandidater", men hvordan retrieval og genrangering faktisk er bygget op i den nuværende implementering.

### Overordnet retrieval-model

QuickPubMed bruger en flertrinsmodel:

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

Hvis OpenAlex rammer `OPENALEX_SEMANTIC_RESULT_CAP`, udløses en ekstra keyword-søgning, og de to resultatsæt flettes bagefter.

OpenAlex retry'er ikke længere ved enhver warning. Backend forsøger i stedet at udlede, om en konkret filterparameter ser ud til at være problemet, og returnerer i så fald et struktureret `retryHints`. Frontend laver højst ét nyt kald, hvor kun den ene fejlmistænkte parameter fjernes. Hvis `sourceType` ser ud til at give fejl, fjernes altså kun `sourceType`, mens `language`, `workType` og `publicationYear` bevares.

### Retrieval fra Elicit

Elicit bruges som en semantisk retrieval-kilde med naturligt sprog:

- queryen er ofte mere spørgsmålslignende end queryen til de øvrige kilder
- der kan sendes `typeTags`, `includeKeywords` og `excludeKeywords`

Elicit følger nu samme princip som OpenAlex ved retry:

- backend kan returnere `retryHints`
- frontend fjerner kun den filterparameter, som ser ud til at fejle
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

### Deterministisk genrangering

Den primære genrangering ligger i `src/utils/semanticReranking.js`.

Den bruger flere signaler:

- vægtet RRF som hovedsignal
- PMID-bonus
- overlap-bonus, når flere kilder peger på samme kandidat
- kilde-score som tie-breaker

Ved multi-source-retrieval bruges en vægtet version af Reciprocal Rank Fusion:

- en kandidat får et bidrag fra hver kilde, den optræder i
- høj placering i en kilde giver større bidrag end lav placering
- hver kilde har sin egen vægt

Formlen i praksis er:

- `weightedRrf = (sourceWeight * rankScale * rrfK) / (rrfK + rank)`

Hvis en kandidat har et PMID, får den en ekstra bonus (`pmidBonus`). Hvis samme kandidat findes i mere end én kilde, får den en overlap-bonus. Hvis upstream-kilden leverer en numerisk score, normaliseres den inden for den enkelte kilde og bruges kun som tie-breaker.

Hvis kun én kilde faktisk leverer kandidater, skifter systemet til `single`-tilstand. Her bruges der ikke overlap-bonus, og sorteringen bliver i praksis bedste rank først og derefter score-tie-breaker.

### Standardkonfiguration for genrangering

Genrangeringskonfigurationen ligger i `QPM_RERANK_CONFIG`.

De vigtigste parametre er:

- `sourceWeights`
- `pmidBonus`
- `overlapBonusPerExtraSource`
- `rrfK`
- `rankScale`
- `scoreScale`
- `fallbackSourceWeight`

### Diagnostik for genrangering

Den deterministiske genrangerer producerer også diagnostik:

- `sourceSummary`
- `sourceStats`
- `overlapSummary`
- detaljerede scorebidrag pr. kandidat

Det er nyttigt ved tuning, fordi man kan se, om en kandidat blev løftet af høj rank i én kilde, overlap på tværs af kilder, PMID-bonus eller tie-breaker-score.

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

I QuickPubMed er retrieval og validering bevidst adskilt.

Retrieval handler om at hente gode kandidater tidligt, gerne lidt bredt og med kilde-specifikke queries og filtre.

Validering handler om at sikre, at de endelige records stadig passer til brugerens valgte afgrænsninger, og at PMID- og DOI-records kan vises med de metadata, systemet forventer.

## Hvad der sker, når brugeren klikker på søg

Det overordnede flow i `SearchForm.search()` er:

1. Formularen nulstiller loading state.
2. Hvis semantiske kilder er valgt, forberedes ventende semantiske tags.
3. Eventuelt globalt semantisk state bygges.
4. `getSearchString()` beregner den query, som PubMed-laget skal bruge.
5. Hvis der findes genrangerede semantiske kandidater, bygges et hybridt resultatsæt.
6. PMIDs valideres mod PubMed og matchende PMIDs markeres som trusted.
7. DOI-only-kandidater og andre ikke-trusted refs hydreres via OpenAlex, hvis det er nødvendigt.
8. Resultater hentes og vises i den relevante orden.

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
2. Når brugeren klikker på søg, gør `prepareSemanticSearchStateBeforeSearch()` tagget klar.
3. Fordi AI og PubMed er aktive, dannes der en PubMed-søgestreng, som efter MeSH-validering kan ende med termer som `"Artificial Intelligence"[mh]`, `"Machine Learning"[mh]` og relevante fritekstsynonymer.
4. Fordi AI og semantiske kilder også er aktive, dannes der en semantisk intention og en `semanticSourceQueryPlan`.
5. OpenAlex kaldes med sin semantiske query og sine filtre. Hvis OpenAlex rammer sit cap, suppleres med en keyword-søgning. Hvis en specifik filterparameter fejler, retry'es kun uden netop den parameter.
6. Elicit kaldes med en naturlig sproglig forskningsforespørgsel og sine filtre. Også her fjernes kun den specifikke filterparameter, hvis et præcist retry-hint peger på den.
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

### `SearchForm.vue`

Ansvar:

- holder den samlede formularstate
- holder valgte kilder
- bygger `getSearchString()`
- starter søgeflowet
- bygger globalt semantisk state
- styrer hybridt resultatflow og hård filtervalidering

### `DropdownWrapper.vue`

Ansvar:

- opretter og opdaterer tags
- håndterer fri tekst
- kører AI-oversættelse
- kører semantiske kildeopslag
- bygger kildeplaner
- fletter og genrangerer semantiske kandidater

### `SearchResult.vue`

Ansvar:

- viser resultater
- står for hydrering af abstracts
- håndterer efterhentning af metadata i resultatlisten

### Backend-endpoints

Ansvar:

- `NlmSearch.php`, `NlmSummary.php`, `NlmFetch.php`: PubMed- og NLM-proxy
- `SemanticScholarSearch.php`: Semantic Scholar-proxy
- `OpenAlexSearch.php`: OpenAlex-proxy
- `ElicitSearch.php`: Elicit-proxy
- `OpenAlexWorkLookup.php`: hydrering af DOI-only-OpenAlex-records
- `SemanticFinalRerank.php`: valgfri LLM-baseret slutgenrangering

## Kort opsummering

QuickPubMed er ikke kun en simpel generator af PubMed-strenge.

Det er et hybridt søgesystem, hvor:

- formularen bygger klassiske booleske PubMed-strenge
- AI kan oversætte fri tekst til PubMed og/eller semantiske intentioner
- semantiske kilder kan hente kandidater parallelt
- PubMed både kan bruges som tidlig retrieval-kilde og som senere validerings- og metadata-lag
- resultatlisten derfor kan bestå af både klassiske PubMed-hits og semantisk hentede, senere validerede records

Hvis man vil forstå det operative søgeflow i koden, er de vigtigste entry points:

- `SearchForm.getSearchString()`
- `SearchForm.prepareSemanticSearchStateBeforeSearch()`
- `SearchForm.search()`
- `DropdownWrapper.handleAddTag()`
- `DropdownWrapper.buildResolvedSemanticTagState()`
