/**
 * Info Endpoint - Capability Advertisement
 *
 * GET /api/info
 * Returns executor capabilities for intelligent routing
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROTOCOL_VERSION = '1.0';
const IMPLEMENTATION_VERSION = '1.0.0';

interface InfoResponse {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    isolation: 'none' | 'process' | 'container' | 'vm';
    executionModes: string[];
    maxExecutionTimeMs: number;
    maxRequestBodyBytes: number;
    supportsStreaming: boolean;
    supportsCallbacks: boolean;
    supportsCaching: boolean;
  };
  runtime?: {
    platform?: string;
    nodeVersion?: string;
    region?: string;
  };
}

export async function GET(): Promise<NextResponse<InfoResponse>> {
  return NextResponse.json(
    {
      name: 'Vercel Sandbox Executor',
      version: IMPLEMENTATION_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        isolation: 'vm',
        executionModes: ['sync'],
        maxExecutionTimeMs: 120000,
        maxRequestBodyBytes: 10485760,
        supportsStreaming: false,
        supportsCallbacks: false,
        supportsCaching: false,
      },
      runtime: {
        platform: 'linux',
        nodeVersion: '22.x',
        region: process.env.VERCEL_REGION || undefined,
      },
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
