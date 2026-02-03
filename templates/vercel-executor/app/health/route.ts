/**
 * Health Check Endpoint (root path)
 *
 * GET /health
 * TPMJS expects health at /health, not /api/health
 * This re-exports from the api version for backwards compatibility
 */

export { GET, OPTIONS } from '../api/health/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
