<?php
/**
 * Alle brugervenlige progress-tekster (dansk/engelsk) til det offentlige
 * search API's streaming progress-events (`event: progress` i SSE-svaret).
 *
 * Denne fil indeholder KUN tekst - ingen logik - saa det er let at overskue
 * og oversaette alle tekster ét sted. Selve opslaget sker i
 * qpmPublicSearchGetPublicProgressMessageCopy() i backend/app/public-search-lib.php.
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
 * public-search-lib.php (soeg efter "qpmPublicSearchEmitProgress" for at se
 * hvor stadierne udsendes).
 */

if (!defined('QPM_PUBLIC_SEARCH_PROGRESS_TEXTS')) {
    define('QPM_PUBLIC_SEARCH_PROGRESS_TEXTS', [

        // ===== messageKeys - i den raekkefoelge en soegning typisk gennemloeber =====

        'semanticSearchProgressPreparing' => [
            'dk' => 'Forbereder søgningen ud fra dine valgte søgeord, afgrænsninger og databaser.',
            'en' => 'Preparing the search based on your query, filters, and selected sources.',
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
        'semanticSearchProgressFinalizeCollect' => [
            'dk' => 'Matcher kandidaterne og forbereder filtervalidering.',
            'en' => 'Matching candidates and preparing filter validation.',
        ],
        'semanticSearchProgressFinalizeValidatePmid' => [
            'dk' => 'Bekræfter resultaterne hos PubMed.',
            'en' => 'Confirming the results with PubMed.',
        ],
        'semanticSearchProgressFinalizeValidateDoiFetch' => [
            'dk' => 'Henter flere detaljer om resultaterne.',
            'en' => 'Fetching more details about the results.',
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
        'semanticSearchProgressFinalizeRender' => [
            'dk' => 'Gør resultaterne klar til visning.',
            'en' => 'Preparing the results for display.',
        ],
        'semanticSearchProgressCacheHit' => [
            'dk' => 'Bruger et gemt resultat fra en tidligere søgning.',
            'en' => 'Using a cached result from an earlier search.',
        ],

        // ===== groupKeys - overordnede grupper, flere messageKeys hoerer under =====

        'semanticSearchProcessGroupPrepare' => [
            'dk' => 'Forbereder søgningen',
            'en' => 'Preparing the search',
        ],
        'semanticSearchProcessGroupSources' => [
            'dk' => 'Søger i databaser',
            'en' => 'Searching sources',
        ],
        'semanticSearchProcessGroupMatch' => [
            'dk' => 'Sammenholder og filtrerer resultaterne',
            'en' => 'Matching and filtering the results',
        ],
        'semanticSearchProcessGroupDisplay' => [
            'dk' => 'Samler resultaterne og gør dem klar til visning',
            'en' => 'Collecting the results and preparing them for display',
        ],

    ]);
}
