/** @type {import('next').NextConfig} */

// Security headers (HSTS, framing, MIME, referrer, permissions) are set in
// src/middleware.ts so they share a single code path with the per-request
// nonce-based Content-Security-Policy. next.config.js has no headers() here
// intentionally — a static headers() would run after middleware and overwrite
// the nonce-bearing CSP, breaking React hydration.

const nextConfig = {};

module.exports = nextConfig;
