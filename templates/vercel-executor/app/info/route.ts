/**
 * Info Endpoint (root path)
 *
 * GET /info
 * TPMJS expects info at /info, not /api/info
 * This re-exports from the api version for backwards compatibility
 */

export { GET, OPTIONS } from '../api/info/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
