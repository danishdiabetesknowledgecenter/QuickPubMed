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
    qpmSemanticQualityCandidateMatchesPostValidation($acceptCandidate, $ruleState)['matches'] === true,
    'Real rule accepts a genuine systematic review title'
);
assertTrue(
    qpmSemanticQualityCandidateMatchesPostValidation($rejectCandidateProtocol, $ruleState)['matches'] === false,
    'Real rule rejects a systematic review PROTOCOL (excludeAnyTextSignals: protocol)'
);
assertTrue(
    qpmSemanticQualityCandidateMatchesPostValidation($rejectCandidateUnrelated, $ruleState)['matches'] === false,
    'Real rule rejects an unrelated RCT title (no requireAnyTextSignals match)'
);
assertTrue(
    qpmSemanticQualityCandidateMatchesPostValidation($rejectCandidateRetracted, $ruleState)['matches'] === false,
    'Real rule rejects a RETRACTED systematic review (excludeAnyTextSignals: retracted)'
);

echo "\nAll real limits.json rule smoke tests passed.\n";
