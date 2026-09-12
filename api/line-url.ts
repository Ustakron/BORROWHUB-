/**
 * Vercel Serverless Function — `GET /api/auth/line/url`
 *
 * Generates the LINE Login OAuth2 authorization URL.
 *
 * This replaces the Express route in server.ts (`GET /api/auth/line/url`)
 * so that LINE Login works when the app is deployed to Vercel as a static
 * frontend + serverless backend (the long-running Express server does not
 * run on Vercel).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// The channel used for LINE Login (OAuth authorize URL).
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || '2011554399';

/** Determine the public base URL of the current deployment. */
function getBaseUrl(req: VercelRequest): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || 'https';
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers['host'] || 'localhost:3000';
  return `${proto}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Prefer the redirect_uri the frontend computed; otherwise derive it.
  const qsRedirect = req.query.redirect_uri;
  const redirectUri =
    (typeof qsRedirect === 'string' ? qsRedirect : Array.isArray(qsRedirect) ? qsRedirect[0] : undefined) ||
    `${getBaseUrl(req)}/auth/callback`;

  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const nonce = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'profile openid',
    nonce,
    bot_prompt: 'normal',
  });

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

  res.status(200).json({
    url: authUrl,
    state,
    channelId: LINE_CHANNEL_ID,
    redirectUri,
  });
}
