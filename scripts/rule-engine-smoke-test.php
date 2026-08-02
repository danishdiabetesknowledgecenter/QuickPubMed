<?php
/**
 * Quick smoke test for qpmSemanticQualityCandidateMatchesPostValidation(),
 * mirroring the "guideline" rule example from backend/docs/afgraensninger-oversigt.md
 * (L040/postValidation). Not a full parity harness (the rule engine has no
 * JS-side fixture set of its own yet), but exercises every branch type:
 * requireAnyTextSignals, excludeAnyTextSignals, metadataFieldConditions,
 * allowSourceProviders, matchStrategy=any, and ruleGroups OR-semantics.
 */

require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

// Candidate that should match a "guideline" rule via title text signal.
$guidelineCandidate = [
    'title' => 'WHO Clinical Practice Guideline for Diabetes',
    'source' => 'pubmed',
    'sources' => ['pubmed', 'openAlex'],
    'doi' => '',
    'openAlexId' => 'W123',
    'enriched' => ['pubTypes' => ['guideline'], 'publicationYear' => 2023],
    'pubTypeClassification' => ['tier' => 'guideline_verified', 'confidence' => 'high'],
];

$guidelineRuleState = [
    'activeRules' => [[
        'id' => 'guideline',
        'matchStrategy' => 'any',
        'textScopes' => ['candidateTitle'],
        'requireAnyTextSignals' => ['guideline', 'consensus statement', 'recommendation'],
    ]],
];
$result = qpmSemanticQualityCandidateMatchesPostValidation($guidelineCandidate, $guidelineRuleState);
assertTrue($result['matches'] === true, 'Guideline candidate matches requireAnyTextSignals rule');

// Candidate that should NOT match (no guideline-like text).
$nonGuidelineCandidate = $guidelineCandidate;
$nonGuidelineCandidate['title'] = 'A randomized trial of drug X in adults';
$result2 = qpmSemanticQualityCandidateMatchesPostValidation($nonGuidelineCandidate, $guidelineRuleState);
assertTrue($result2['matches'] === false, 'Non-guideline candidate fails requireAnyTextSignals rule');

// excludeAnyTextSignals: candidate matches base signal but is excluded by an erratum marker.
$excludedCandidate = $guidelineCandidate;
$excludedCandidate['title'] = 'Erratum: WHO Clinical Practice Guideline for Diabetes';
$excludeRuleState = [
    'activeRules' => [[
        'id' => 'guideline-not-erratum',
        'textScopes' => ['candidateTitle'],
        'requireAnyTextSignals' => ['guideline'],
        'excludeAnyTextSignals' => ['erratum'],
    ]],
];
$result3 = qpmSemanticQualityCandidateMatchesPostValidation($excludedCandidate, $excludeRuleState);
assertTrue($result3['matches'] === false, 'excludeAnyTextSignals correctly vetoes an otherwise-matching candidate');

// allowSourceProviders: candidate's merged 'sources' list includes 'openAlex'.
$providerRuleState = [
    'activeRules' => [[
        'id' => 'openalex-only',
        'allowSourceProviders' => ['openalex'],
    ]],
];
$result4 = qpmSemanticQualityCandidateMatchesPostValidation($guidelineCandidate, $providerRuleState);
assertTrue($result4['matches'] === true, 'allowSourceProviders matches via merged sources list');

// metadataFieldConditions: candidatePubTypeTier equalsAny check.
$metadataRuleState = [
    'activeRules' => [[
        'id' => 'tier-check',
        'metadataFieldConditions' => [
            ['field' => 'candidatePubTypeTier', 'operator' => 'equalsany', 'values' => ['guideline_verified']],
        ],
    ]],
];
$result5 = qpmSemanticQualityCandidateMatchesPostValidation($guidelineCandidate, $metadataRuleState);
assertTrue($result5['matches'] === true, 'metadataFieldConditions equalsany matches pubTypeTier snapshot');

// ruleGroups: OR-within-group, AND-across-groups.
$groupRuleState = [
    'ruleGroups' => [
        [
            'id' => 'group-a',
            'rules' => [
                ['id' => 'a1', 'requireAnyTextSignals' => ['guideline']],
            ],
        ],
        [
            'id' => 'group-b',
            'rules' => [
                ['id' => 'b1', 'requireAnyTextSignals' => ['nonexistent-signal-xyz']],
                ['id' => 'b2', 'allowSourceProviders' => ['pubmed']],
            ],
        ],
    ],
];
$result6 = qpmSemanticQualityCandidateMatchesPostValidation($guidelineCandidate, $groupRuleState);
assertTrue($result6['matches'] === true, 'ruleGroups: group-a passes via b1-analog, group-b passes via b2 (OR within group, AND across groups)');

// Empty rule state means "no restriction" -> always matches.
$emptyResult = qpmSemanticQualityCandidateMatchesPostValidation($guidelineCandidate, []);
assertTrue($emptyResult['matches'] === true, 'Empty rule state means unrestricted match');

echo "\nAll rule-engine smoke tests passed.\n";
