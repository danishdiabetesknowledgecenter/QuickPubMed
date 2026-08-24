<?php
/**
 * Phase 3 smoke test (unified-engine full-parity plan): verifies the
 * deterministic PubMed search-string sanitization pipeline ported from
 * src/utils/meshValidator.js, plus a live NLM canonicalization check.
 *
 * Run: php scripts/phase3-mesh-validation-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

// 1. extractMeshTerms
$terms = muginSemanticQualityExtractMeshTerms('"Diabetes Mellitus, Type 2"[mh] AND insulin[tiab]');
assertTrue(count($terms) === 1 && $terms[0]['term'] === 'Diabetes Mellitus, Type 2', 'extractMeshTerms finds quoted [mh] term');

// 2. quoteMeshTerms: unquoted [mh] term gets quoted.
assertTrue(
    muginSemanticQualityQuoteMeshTerms('Diabetes Mellitus[mh]') === '"Diabetes Mellitus"[mh]',
    'quoteMeshTerms wraps an unquoted [mh] term in quotes'
);
assertTrue(
    muginSemanticQualityQuoteMeshTerms('"Diabetes Mellitus"[mh]') === '"Diabetes Mellitus"[mh]',
    'quoteMeshTerms does not double-quote an already-quoted term'
);

// 3. normalizeFieldTags: verbose tag names collapse to short forms.
assertTrue(
    muginSemanticQualityNormalizeFieldTags('diabetes[Title/Abstract]') === 'diabetes[tiab]',
    'normalizeFieldTags converts [Title/Abstract] to [tiab]'
);
assertTrue(
    muginSemanticQualityNormalizeFieldTags('diabetes[MeSH Terms]') === 'diabetes[mh]',
    'normalizeFieldTags converts [MeSH Terms] to [mh]'
);

// 4. normalizeUnsupportedFieldTags: [ab] -> [tiab].
assertTrue(
    muginSemanticQualityNormalizeUnsupportedFieldTags('diabetes[ab]') === 'diabetes[tiab]',
    'normalizeUnsupportedFieldTags converts [ab] to [tiab]'
);

// 5. fixWildcardsInQuotedTerms: wildcard inside quotes is stripped of quotes.
assertTrue(
    muginSemanticQualityFixWildcardsInQuotedTerms('"carbohydrate count*"[tiab]') === 'carbohydrate count*[tiab]',
    'fixWildcardsInQuotedTerms un-quotes a wildcarded quoted term'
);

// 6. removeDuplicateTerms: case-insensitive OR-level dedupe.
assertTrue(
    muginSemanticQualityRemoveDuplicateTerms('diabetes[tiab] OR Diabetes[tiab] OR insulin[tiab]') === 'diabetes[tiab] OR insulin[tiab]',
    'removeDuplicateTerms removes a case-insensitive duplicate OR-clause'
);

// 7. normalizeBooleanOperatorsOutsideQuotes: lowercase "and"/"or" outside quotes uppercased; inside quotes untouched.
assertTrue(
    muginSemanticQualityNormalizeBooleanOperatorsOutsideQuotes('diabetes[tiab] and insulin[tiab]') === 'diabetes[tiab] AND insulin[tiab]',
    'normalizeBooleanOperatorsOutsideQuotes uppercases "and" outside quotes'
);
assertTrue(
    muginSemanticQualityNormalizeBooleanOperatorsOutsideQuotes('"type and 2"[tiab]') === '"type and 2"[tiab]',
    'normalizeBooleanOperatorsOutsideQuotes leaves lowercase "and" untouched inside quotes'
);

// 8. assertBalancedSyntax.
assertTrue(muginSemanticQualityAssertBalancedSyntax('(a[tiab] AND b[tiab])') === true, 'assertBalancedSyntax accepts balanced parens');
assertTrue(muginSemanticQualityAssertBalancedSyntax('(a[tiab] AND b[tiab]') === false, 'assertBalancedSyntax rejects unbalanced parens');
assertTrue(muginSemanticQualityAssertBalancedSyntax('"unterminated[tiab]') === false, 'assertBalancedSyntax rejects unbalanced quotes');

// 9. assertAllowedFieldTags.
assertTrue(muginSemanticQualityAssertAllowedFieldTags('diabetes[tiab]') === [], 'assertAllowedFieldTags accepts a valid tag');
assertTrue(
    muginSemanticQualityAssertAllowedFieldTags('diabetes[bogustag]') === ['bogustag'],
    'assertAllowedFieldTags flags an invalid tag'
);

// 10. Full deterministic sanitization pipeline, end-to-end.
$sanitized = muginSemanticQualitySanitizeSearchStringDeterministic(
    'Diabetes Mellitus[MeSH Terms] and "carbohydrate count*"[Title/Abstract] or Diabetes Mellitus[MeSH Terms]'
);
assertTrue($sanitized['valid'] === true, 'Full sanitization pipeline reports the sample string as valid');
assertTrue(
    strpos($sanitized['value'], '"Diabetes Mellitus"[mh]') !== false,
    'Full sanitization pipeline normalizes and quotes the MeSH term'
);
assertTrue(
    strpos($sanitized['value'], 'carbohydrate count*[tiab]') !== false,
    'Full sanitization pipeline fixes the wildcard-in-quotes issue and normalizes the tag'
);
assertTrue(
    strpos($sanitized['value'], ' AND ') !== false,
    'Full sanitization pipeline uppercases the boolean operator'
);

// 11. lowercaseNonMeshTerms: [mh]/[au] preserved, others lowercased.
assertTrue(
    muginSemanticQualityLowercaseNonMeshTerms('"Diabetes Mellitus"[mh] AND "SMITH J"[au] AND DIABETES[tiab]')
        === '"Diabetes Mellitus"[mh] AND "SMITH J"[au] AND diabetes[tiab]',
    'lowercaseNonMeshTerms preserves [mh]/[au] casing and lowercases [tiab]'
);

$configPath = __DIR__ . '/../backend/config/config.php';
$skipLive = getenv('MUGIN_SKIP_LIVE_SMOKES') === '1' || !is_file($configPath);
if ($skipLive) {
    echo "SKIP: live NLM MeSH checks (no config.php or MUGIN_SKIP_LIVE_SMOKES=1)\n";
    echo "\nAll Phase 3 MeSH-validation smoke tests passed.\n";
    exit(0);
}

// 12. Live NLM check (real network call): a well-known MeSH descriptor must validate,
// and canonicalization must produce a properly-cased/quoted [mh] term.
require_once $configPath;
require_once __DIR__ . '/../backend/app/public-search-lib.php';

$validation = muginPublicSearchValidateMeshTerm('diabetes mellitus, type 2');
assertTrue($validation['valid'] === true, 'Live NLM check: "diabetes mellitus, type 2" validates as a real MeSH descriptor');
assertTrue(!empty($validation['uid']), 'Live NLM check: a MeSH UID was returned for a valid descriptor');

$canonicalized = muginPublicSearchCanonicalizeAllMeshTermsWithNlm('"diabetes mellitus, type 2"[mh] AND insulin[tiab]');
assertTrue(
    strpos($canonicalized, '[mh]') !== false,
    'Live NLM canonicalization keeps a valid descriptor tagged [mh]'
);
assertTrue(
    stripos($canonicalized, 'insulin[tiab]') !== false,
    'Live NLM canonicalization leaves unrelated [tiab] terms untouched'
);

$hallucinatedCanonicalized = muginPublicSearchCanonicalizeAllMeshTermsWithNlm('"Totally Made Up Nonexistent MeSH Term Xyz123"[mh]');
assertTrue(
    strpos($hallucinatedCanonicalized, '[tiab]') !== false && strpos($hallucinatedCanonicalized, '[mh]') === false,
    'Live NLM canonicalization downgrades a hallucinated/invalid [mh] term to [tiab]'
);

echo "\nAll Phase 3 MeSH-validation smoke tests passed.\n";
