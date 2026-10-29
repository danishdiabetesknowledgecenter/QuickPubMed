<?php
/**
 * Alle brugervenlige progress- og advarselstekster (dansk/engelsk) til det
 * offentlige search API. Progress-events bruger messageKey/groupKey.
 * Feltet warnings i søgesvaret bruger de samme tekster.
 *
 * Denne fil indeholder KUN tekst - ingen logik - saa det er let at overskue
 * og oversaette alle tekster ét sted. Selve opslaget sker i
 * muginPublicSearchGetPublicProgressMessageCopy() i backend/app/public-search-lib.php.
 *
 * Teksterne her er bevidst uafhaengige af webappens frontend-kildefil
 * (src/assets/content/translations.js), som ikke noedvendigvis er til stede
 * paa en ren API-deployment. Redigér KUN teksterne her, hvis du vil aendre,
 * hvad en API-klient viser til sin slutbruger, mens vedkommende venter paa
 * et soegeresultat.
 *
 * Hver noegle er enten:
 * - en messageKey: teksten vist for det konkrete progress-stadie, eller
 * - en groupKey: teksten for den overordnede gruppe, stadiet hoerer til.
 *
 * Tilfoej en ny noegle her, hvis du tilfoejer et nyt progress-stadie i
 * public-search-lib.php (soeg efter "muginPublicSearchEmitProgress" for at se
 * hvor stadierne udsendes).
 */

if (!defined('MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS')) {
    define('MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS', [

        // ===== messageKeys - i den raekkefoelge en soegning typisk gennemloeber =====

        'semanticSearchProgressPreparing' => [
            'dk' => 'Forbereder søgningen ud fra dine valgte søgeord, afgrænsninger og databaser.',
            'en' => 'Preparing the search based on your query, filters, and selected sources.',
        ],
        'semanticSearchProgressSemanticIntent' => [
            'dk' => 'Fortolker og tilpasser søgningen til de valgte databaser.',
            'en' => 'Interpreting and adapting the search for the selected databases.',
        ],
        'semanticSearchProgressSemanticIntentSingle' => [
            'dk' => 'Fortolker og tilpasser søgningen til den valgte database.',
            'en' => 'Interpreting and adapting the search for the selected database.',
        ],
        'semanticSearchProgressSemanticQuery' => [
            'dk' => 'Fortolker og tilpasser søgningen til de valgte databaser.',
            'en' => 'Interpreting and adapting the search for the selected databases.',
        ],
        'semanticSearchProgressSearchString' => [
            'dk' => 'Laver en PubMed-søgestreng ud fra din fritekst.',
            'en' => 'Building a PubMed search string from your free text.',
        ],
        'semanticSearchProgressPubmedQueryReview' => [
            'dk' => 'Tjekker den første PubMed-søgestreng mod de første resultater.',
            'en' => 'Checking the first PubMed search string against the first results.',
        ],
        'semanticSearchProgressPubmedQueryReviewRevised' => [
            'dk' => 'Tjekker den rettede PubMed-søgestreng mod de første resultater.',
            'en' => 'Checking the revised PubMed search string against the first results.',
        ],
        'semanticSearchProgressPubmedQueryReviewAgain' => [
            'dk' => 'Tjekker den næste rettelse af PubMed-søgestrengen mod de første resultater.',
            'en' => 'Checking the next revision of the PubMed search string against the first results.',
        ],
        'semanticSearchProgressMesh' => [
            'dk' => 'Tjekker og forfiner PubMed-søgestrengen med MeSH.',
            'en' => 'Checking and refining the PubMed search string with MeSH.',
        ],
        'semanticSearchProgressPubMedBestMatch' => [
            'dk' => 'Søger i PubMed.',
            'en' => 'Searching PubMed.',
        ],
        'semanticSearchProgressSemanticScholar' => [
            'dk' => 'Søger i Semantic Scholar.',
            'en' => 'Searching Semantic Scholar.',
        ],
        'semanticSearchProgressOpenAlex' => [
            'dk' => 'Søger i OpenAlex.',
            'en' => 'Searching OpenAlex.',
        ],
        'semanticSearchProgressElicit' => [
            'dk' => 'Søger i Elicit.',
            'en' => 'Searching Elicit.',
        ],
        'semanticSearchProgressRerank' => [
            'dk' => 'Reranker kandidaterne på tværs af databaserne.',
            'en' => 'Reranking candidates across databases.',
        ],
        'semanticSearchProgressRerankSingle' => [
            'dk' => 'Rangerer kandidaterne.',
            'en' => 'Ranking the candidates.',
        ],
        'semanticSearchProgressFinalizeCollect' => [
            'dk' => 'Matcher kandidaterne og forbereder filtervalidering.',
            'en' => 'Matching candidates and preparing filter validation.',
        ],
        'semanticSearchProgressFinalizeValidatePmid' => [
            'dk' => 'Kontrollerer PMID-resultater mod PubMed-søgningen.',
            'en' => 'Validating PMID results against the PubMed search.',
        ],
        'semanticSearchProgressFinalizeValidateDoiFetch' => [
            'dk' => 'Henter metadata for DOI-resultater og tjekker filtrene.',
            'en' => 'Fetching DOI metadata and checking filters.',
        ],
        'semanticSearchProgressFinalizeHydrate' => [
            'dk' => 'Henter artikeloplysninger fra databaserne.',
            'en' => 'Fetching article details from the sources.',
        ],
        'semanticSearchProgressFinalizeHydratePubMed' => [
            'dk' => 'Henter artikeloplysninger fra PubMed.',
            'en' => 'Fetching article details from PubMed.',
        ],
        'semanticSearchProgressFinalizeHydrateOpenAlex' => [
            'dk' => 'Henter artikeloplysninger fra OpenAlex.',
            'en' => 'Fetching article details from OpenAlex.',
        ],
        'semanticSearchProgressFinalizeHydrateMixed' => [
            'dk' => 'Henter artikeloplysninger fra PubMed og OpenAlex.',
            'en' => 'Fetching article details from PubMed and OpenAlex.',
        ],
        'semanticSearchProgressFinalizeSort' => [
            'dk' => 'Sorterer resultaterne efter dato.',
            'en' => 'Sorting the results by date.',
        ],
        'semanticSearchProgressFinalRerank' => [
            'dk' => 'Kontrollerer den endelige rangering.',
            'en' => 'Checking the final ranking.',
        ],
        'semanticSearchProgressCacheHit' => [
            'dk' => 'Bruger et gemt resultat fra en tidligere søgning.',
            'en' => 'Using a cached result from an earlier search.',
        ],
        'semanticSearchProgressDoiHydrationWarning' => [
            'dk' => 'Nogle eksterne resultater kunne ikke valideres via OpenAlex eller eksisterende Semantic Scholar-data og er derfor ikke medtaget.',
            'en' => 'Some external results could not be validated via OpenAlex or existing Semantic Scholar data and are therefore not included.',
        ],
        'semanticSearchProgressPubMedFailed' => [
            'dk' => 'PubMed svarede ikke. Resultater fra andre kilder bruges.',
            'en' => 'PubMed did not respond. Results from other sources are used.',
        ],
        'semanticSearchProgressPubMedFallbackUsed' => [
            'dk' => 'De ekstra kilder gav ingen brugbare resultater. PubMed-resultater vises som sikker fallback.',
            'en' => 'The extra sources returned no usable results. PubMed results are shown as a safe fallback.',
        ],
        'semanticSearchProgressSemanticScholarFailed' => [
            'dk' => 'Semantic Scholar svarede ikke. Resultater fra andre kilder bruges.',
            'en' => 'Semantic Scholar did not respond. Results from other sources are used.',
        ],
        'semanticSearchProgressSemanticScholarPartial' => [
            'dk' => 'Semantic Scholar returnerede kun delvise resultater. De tilgængelige resultater bruges.',
            'en' => 'Semantic Scholar returned partial results. The available results are used.',
        ],
        'semanticSearchProgressSemanticScholarRateLimited' => [
            'dk' => 'Semantic Scholar er midlertidigt utilgængelig på grund af API-begrænsning.',
            'en' => 'Semantic Scholar is temporarily unavailable because of an API limit.',
        ],
        'semanticSearchProgressOpenAlexFailed' => [
            'dk' => 'OpenAlex svarede ikke. Resultater fra andre kilder bruges.',
            'en' => 'OpenAlex did not respond. Results from other sources are used.',
        ],
        'semanticSearchProgressOpenAlexPartial' => [
            'dk' => 'OpenAlex returnerede kun delvise resultater. De tilgængelige resultater bruges.',
            'en' => 'OpenAlex returned partial results. The available results are used.',
        ],
        'semanticSearchProgressOpenAlexRateLimited' => [
            'dk' => 'OpenAlex er midlertidigt utilgængelig på grund af API-begrænsning.',
            'en' => 'OpenAlex is temporarily unavailable because of an API limit.',
        ],
        'semanticSearchProgressOpenAlexRecovered' => [
            'dk' => 'OpenAlex kunne ikke bruge alle filtre. Kilden blev brugt med forenklet filtergrundlag.',
            'en' => 'OpenAlex could not use all filters. The source was used with simplified filters.',
        ],
        'semanticSearchProgressOpenAlexSemanticFilterSupplement' => [
            'dk' => 'Søger i OpenAlex.',
            'en' => 'Searching OpenAlex.',
        ],
        'semanticSearchProgressOpenAlexKeywordFallback' => [
            'dk' => 'OpenAlex\' semantiske søgning svarede ikke. Kilden blev brugt med keywordsøgning som fallback.',
            'en' => 'OpenAlex semantic search did not respond. The source was used with keyword search as fallback.',
        ],
        'semanticSearchProgressOpenAlexFallbackRecovered' => [
            'dk' => 'OpenAlex blev brugt via en fallback-rute. Resultater fra kilden bruges.',
            'en' => 'OpenAlex was used through a fallback route. Results from the source are used.',
        ],
        'semanticSearchProgressElicitFailed' => [
            'dk' => 'Elicit svarede ikke. Resultater fra andre kilder bruges.',
            'en' => 'Elicit did not respond. Results from other sources are used.',
        ],
        'semanticSearchProgressElicitPartial' => [
            'dk' => 'Elicit returnerede kun delvise resultater. De tilgængelige resultater bruges.',
            'en' => 'Elicit returned partial results. The available results are used.',
        ],
        'semanticSearchProgressElicitRateLimited' => [
            'dk' => 'Elicit er midlertidigt utilgængelig på grund af API-begrænsning.',
            'en' => 'Elicit is temporarily unavailable because of an API limit.',
        ],
        'semanticSearchProgressElicitRecovered' => [
            'dk' => 'Elicit kunne ikke bruge alle filtre. Kilden blev brugt med forenklet filtergrundlag.',
            'en' => 'Elicit could not use all filters. The source was used with simplified filters.',
        ],
        'semanticSearchWarningTopicMissingSearchStrings' => [
            'dk' => 'Emnet {id} har ingen søgestrenge for omfanget {scope}.',
            'en' => 'Topic {id} has no search strings for scope {scope}.',
        ],
        'semanticSearchWarningSourceFormatsMetadataOnly' => [
            'dk' => 'Kildeformat kunne ikke håndhæves i PubMed-filteret og bruges kun, hvor metadata findes.',
            'en' => 'Source format could not be enforced in the PubMed filter query and is only applied where metadata is available.',
        ],
        'semanticSearchWarningLexicalRescueFailed' => [
            'dk' => 'Den ekstra PubMed-søgning kunne ikke gennemføres. De øvrige resultater bruges.',
            'en' => 'The extra PubMed search could not be completed. The other results are used.',
        ],
        'semanticSearchWarningSourceAccessLimited' => [
            'dk' => 'API-nøglen har ikke adgang til: {denied}. Resultaterne er begrænset til: {allowed}.',
            'en' => 'This API key is not authorized for source(s): {denied}. Results were limited to: {allowed}.',
        ],

        // ===== groupKeys - overordnede grupper, flere messageKeys hoerer under =====

        'semanticSearchProcessGroupPrepare' => [
            'dk' => 'Oversætter og tilpasser søgningen',
            'en' => 'Translating and adapting the search',
        ],
        'semanticSearchProcessGroupSources' => [
            'dk' => 'Søger i databaser',
            'en' => 'Searching sources',
        ],
        'semanticSearchProcessGroupPrepareAndSearchSingle' => [
            'dk' => 'Tilpasser søgningen og søger i databasen',
            'en' => 'Adapting the search and searching the database',
        ],
        'semanticSearchProcessGroupMatch' => [
            'dk' => 'Reranker, matcher og filtrerer resultaterne',
            'en' => 'Reranking, matching and filtering the results',
        ],
        'semanticSearchProcessGroupDisplay' => [
            'dk' => 'Henter detaljer og færdiggør rækkefølgen',
            'en' => 'Fetching details and finishing the ranking',
        ],

    ]);
}
