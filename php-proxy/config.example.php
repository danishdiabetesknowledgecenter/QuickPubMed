<?php
/**
 * Configuration file for QuickPubMed PHP Proxy
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

// Load helper functions
require_once __DIR__ . '/helpers.php';
