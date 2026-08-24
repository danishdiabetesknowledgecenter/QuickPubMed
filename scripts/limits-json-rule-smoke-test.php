<?php
/**
 * Extra confidence check for Phase 4: loads REAL postValidation rules from
 * data/content/shared/limits.json (not synthetic examples) and runs them
 * through the PHP rule engine port, confirming accept/reject decisions match
 * what the rule text obviously implies. Complements
 * scripts/rule-engine-smoke-test.php, which only uses hand-written rules.
 *
 * Run: php scripts/limits-json-rule-smoke-test.php
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

function findFirstPostValidationRule(array $node, string $wantedId): ?array
{
    if (isset($node['semanticConfig']['postValidation']['rules']) && is_array($node['semanticConfig']['postValidation']['rules'])) {
        foreach ($node['semanticConfig']['postValidation']['rules'] as $rule) {
            if (($rule['id'] ?? '') === $wantedId) {
                return $rule;
            }
        }
    }
    foreach ($node as $value) {
        if (is_array($value)) {
            $found = findFirstPostValidationRule($value, $wantedId);
            if ($found !== null) {
                return $found;
            }
        }
    }
    return null;
}

$limitsPath = __DIR__ . '/../data/content/shared/limits.json';
$limits = json_decode((string) file_get_contents($limitsPath), true);
assertTrue(is_array($limits), 'limits.json parses as valid JSON');

// Real rule: L010010 "systematic-review" — requires "systematic review" /
// "meta-analysis" / "cochrane" in title, excludes "protocol" / "withdrawn" /
// "retracted" / "comment".
$rule = findFirstPostValidationRule($limits, 'systematic-review');
assertTrue($rule !== null, 'Found the real "systematic-review" rule in limits.json');

$ruleState = ['activeRules' => [$rule]];

$acceptCandidate = [
    'title' => 'A systematic review and meta-analysis of statin therapy',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'doi' => '10.1/real-rule-accept',
];
$rejectCandidateProtocol = [
    'title' => 'Systematic review protocol for evaluating statin therapy',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'doi' => '10.1/real-rule-reject-protocol',
];
$rejectCandidateUnrelated = [
    'title' => 'A randomized controlled trial of statin therapy',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'doi' => '10.1/real-rule-reject-unrelated',
];
$rejectCandidateRetracted = [
    'title' => 'Systematic review of statin therapy (retracted)',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'doi' => '10.1/real-rule-reject-retracted',
];

assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($acceptCandidate, $ruleState)['matches'] === true,
    'Real rule accepts a genuine systematic review title'
);
assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($rejectCandidateProtocol, $ruleState)['matches'] === false,
    'Real rule rejects a systematic review PROTOCOL (excludeAnyTextSignals: protocol)'
);
assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($rejectCandidateUnrelated, $ruleState)['matches'] === false,
    'Real rule rejects an unrelated RCT title (no requireAnyTextSignals match)'
);
assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($rejectCandidateRetracted, $ruleState)['matches'] === false,
    'Real rule rejects a RETRACTED systematic review (excludeAnyTextSignals: retracted)'
);

// Real rule: L010020 "cochrane-review" — DOI-only candidates must have a PMID.
// Journal membership ("Cochrane Database Syst Rev"[ta]) is enforced on the
// PubMed hard-filter path for those PMIDs, not in this metadata rule.
$cochraneRule = findFirstPostValidationRule($limits, 'cochrane-review');
assertTrue($cochraneRule !== null, 'Found the real "cochrane-review" rule in limits.json');
assertTrue(
    in_array('systematic review', (array) ($cochraneRule['requireAnyTextSignals'] ?? []), true) === false,
    'Cochrane-only rule does not treat "systematic review" as a sufficient text signal'
);

$cochraneRuleState = ['activeRules' => [$cochraneRule]];
$acceptCochranePmid = [
    'title' => 'Interventions for smoking cessation in pregnancy',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'pmid' => '32068997',
    'doi' => '10.1/cochrane-pmid-accept',
];
$rejectOverviewOfCochrane = [
    'title' => 'An overview of Cochrane systematic reviews of alternative medicine',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'doi' => '10.20518/tjph.1196149',
    'enriched' => [
        'venue' => 'Turkish Journal of Public Health',
    ],
];
$rejectCdsrVenueWithoutPmid = [
    'title' => 'Interventions for smoking cessation in pregnancy',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'doi' => '10.1/cochrane-reject-no-pmid',
    'enriched' => [
        'venue' => 'Cochrane Database of Systematic Reviews',
    ],
];
$rejectCochraneProtocol = [
    'title' => 'Cochrane review protocol for evaluating statin therapy',
    'source' => 'openAlex',
    'sources' => ['openAlex'],
    'pmid' => '32068998',
    'doi' => '10.1/cochrane-reject-protocol',
];

assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($acceptCochranePmid, $cochraneRuleState)['matches'] === true,
    'Cochrane-only rule accepts a candidate with a PMID'
);
assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($rejectOverviewOfCochrane, $cochraneRuleState)['matches'] === false,
    'Cochrane-only rule rejects an overview of Cochrane reviews without a PMID'
);
assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($rejectCdsrVenueWithoutPmid, $cochraneRuleState)['matches'] === false,
    'Cochrane-only rule rejects a CDSR-like venue when the candidate has no PMID'
);
assertTrue(
    muginSemanticQualityCandidateMatchesPostValidation($rejectCochraneProtocol, $cochraneRuleState)['matches'] === false,
    'Cochrane-only rule rejects a Cochrane protocol even when a PMID is present'
);

echo "\nAll real limits.json rule smoke tests passed.\n";
