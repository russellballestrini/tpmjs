/**
 * Health Check Endpoint
 *
 * GET /api/health
 * Returns the health status of the executor
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROTOCOL_VERSION = '1.0';
const IMPLEMENTATION_VERSION = '1.0.0';

interface HealthResponse {
  status: 'ok';
  protocolVersion: string;
  implementationVersion: string;
  runtime?: string;
  timestamp?: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json(
    {
      status: 'ok',
      protocolVersion: PROTOCOL_VERSION,
      implementationVersion: IMPLEMENTATION_VERSION,
      runtime: 'node',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TPMJS-Protocol-Version',
      },
    }
  );
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TPMJS-Protocol-Version',
    },
  });
}
