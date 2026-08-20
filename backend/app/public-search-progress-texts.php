<?php
/**
 * Alle brugervenlige progress-tekster (dansk/engelsk) til det offentlige
 * search API's streaming progress-events (`event: progress` i SSE-svaret).
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
