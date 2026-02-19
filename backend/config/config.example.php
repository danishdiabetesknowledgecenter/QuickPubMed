<?php
/**
 * Configuration file for QuickPubMed backend
 *
 * INSTRUCTIONS:
 * 1. Copy this file and rename to 'config.php'
 * 2. Insert your API keys below
 * 3. Upload config.php to your web server
 *
 * IMPORTANT: config.php should NEVER be committed to git!
 */

// ============ OpenAI Configuration ============
define('OPENAI_API_KEY', 'sk-INSERT-YOUR-API-KEY-HERE');
define('OPENAI_ORG_ID', '');
// Use Responses API for GPT-5.2 and newer models with JSON mode support
define('OPENAI_API_URL', 'https://api.openai.com/v1/responses');

// ============ NLM/PubMed Configuration ============
define('NLM_API_KEY', 'INSERT-YOUR-NLM-API-KEY-HERE');
define('NLM_EMAIL', 'your-email@example.com');
define('NLM_BASE_URL', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');

// Allowed domains for CORS
// Supports wildcards: *.example.com matches sub.example.com and example.com
define('ALLOWED_DOMAINS', [
    '*.example.com',
    'example.com',
    'localhost',
]);

// ============ Editor Authentication (No Database) ============
// Username for editor login
define('EDITOR_USER', 'editor');
// Generate with:
// php -r "echo password_hash('CHANGE-ME', PASSWORD_BCRYPT) . PHP_EOL;"
define('EDITOR_PASSWORD_HASH', '$2y$10$REPLACE_WITH_BCRYPT_HASH');
// Session timeout in seconds (default: 30 minutes)
define('EDITOR_SESSION_TIMEOUT', 1800);
// Set to true in production (HTTPS required for editor endpoints)
define('EDITOR_REQUIRE_HTTPS', true);
// Cookie SameSite policy for editor session: 'Lax', 'Strict', or 'None'
// Use 'None' only when editor UI runs on a different origin than the API.
define('EDITOR_COOKIE_SAMESITE', 'Lax');
// Optional exact-origin allowlist for editor CORS (useful for localhost dev)
define('EDITOR_ALLOWED_ORIGINS', [
    'http://localhost:5173',
]);
// Optional allowlist for editable content domains
// If empty, domains are discovered from backend/storage/content/<domain>/topics.json
define('EDITOR_ALLOWED_CONTENT_DOMAINS', [
    'diabetes',
    'dementia',
    'concussion',
    'neurorehabilitation',
    'overweight',
    'sdnu',
    'skincancer',
]);

// Load helper functions
require_once dirname(__DIR__) . '/app/helpers.php';
