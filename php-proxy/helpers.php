<?php
/**
 * Helper functions for the PHP Proxy
 */

/**
 * Check if origin is allowed and return the appropriate CORS header value
 * @param string|null $origin The request origin
 * @return string|null The allowed origin or null if not allowed
 */
function getAllowedOrigin($origin) {
    if (empty($origin)) {
        return null;
    }
    
    // Parse the origin to get the host
    $parsed = parse_url($origin);
    $host = $parsed['host'] ?? '';
    
    foreach (ALLOWED_DOMAINS as $pattern) {
        // Check for wildcard subdomain pattern
        if (strpos($pattern, '*.') === 0) {
            $baseDomain = substr($pattern, 2); // Remove "*."
            // Match exact domain or any subdomain
            if ($host === $baseDomain || 
                substr($host, -strlen('.' . $baseDomain)) === '.' . $baseDomain) {
                return $origin;
            }
        } 
        // Check for exact match
        elseif ($host === $pattern) {
            return $origin;
        }
    }
    
    return null;
}

