/**
 * Vercel Serverless Function — LINE OAuth2 callback (`GET /auth/callback`)
 *
 * Exchanges the authorization `code` for an access token, fetches the LINE
 * profile, and renders the popup HTML page that posts the result back to the
 * parent window (via `postMessage`) — mirroring the Express handler in
 * server.ts so LINE Login works on Vercel.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || '2011554399';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '90bc8c44027203495663b57c69fdb135';

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

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const code = asString(req.query.code);
  const error = asString(req.query.error);
  const errorDescription = asString(req.query.error_description);

  if (error || !code) {
    const errMessage = errorDescription || error || 'User cancelled authorization';
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LINE Login Error</title>
          <style>
            body { font-family: 'Prompt', sans-serif; text-align: center; padding: 50px 20px; background: #f8fafc; color: #1e293b; }
            .card { background: white; max-width: 420px; margin: 0 auto; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .btn { background: #06C755; color: white; padding: 10px 20px; border-radius: 12px; text-decoration: none; display: inline-block; font-weight: bold; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3 style="color: #ef4444;">การเข้าสู่ระบบถูกยกเลิก</h3>
            <p style="font-size: 14px; color: #64748b;">${errMessage}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'LINE_LOGIN_ERROR', error: '${errMessage}' }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
            <a href="javascript:window.close()" class="btn">ปิดหน้าต่างนี้</a>
          </div>
        </body>
      </html>
    `);
    return;
  }

  try {
    // The redirect_uri must exactly match the one used at authorize time.
    const redirectUri = `${getBaseUrl(req)}/auth/callback`;

    // 1. Exchange code for Access Token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
    });

    const tokenData: any = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('LINE token error:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to exchange token');
    }

    // 2. Fetch User Profile from LINE API
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData: any = await profileResponse.json();

    if (!profileResponse.ok || !profileData.userId) {
      console.error('LINE profile error:', profileData);
      throw new Error('Failed to fetch LINE profile');
    }

    const payload = {
      userId: profileData.userId,
      displayName: profileData.displayName,
      pictureUrl: profileData.pictureUrl || '',
      statusMessage: profileData.statusMessage || '',
      email: tokenData.id_token ? 'authenticated via LINE' : '',
    };

    // 3. Render HTML that sends the profile to the parent window and closes
    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>LINE Login Success</title>
          <style>
            body { font-family: 'Prompt', -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #f8fafc; color: #0f2444; }
            .card { background: white; max-width: 440px; margin: 0 auto; padding: 32px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
            .logo { width: 56px; height: 56px; background: #06C755; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; margin: 0 auto 16px; }
            .avatar { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; border: 2px solid #06C755; }
            h3 { margin: 8px 0; color: #1B365D; font-size: 18px; }
            p { font-size: 13px; color: #64748b; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">LINE</div>
            ${payload.pictureUrl ? `<img src="${payload.pictureUrl}" class="avatar" />` : ''}
            <h3>เข้าสู่ระบบสำเร็จแล้ว</h3>
            <p>ยินดีต้อนรับคุณ <strong>${payload.displayName}</strong></p>
            <p style="font-size: 11px; color: #94a3b8; font-family: monospace;">LINE ID: ${payload.userId}</p>
            <p style="color: #059669; font-weight: bold; margin-top: 15px;">กำลังนำคุณเข้าสู่ BORROW HUB...</p>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: 'LINE_LOGIN_SUCCESS',
                  user: ${JSON.stringify(payload)}
                }, '*');
                setTimeout(() => {
                  window.close();
                }, 800);
              } else {
                window.location.href = '/';
              }
            } catch (err) {
              console.error(err);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth Callback Exception:', err);
    res.status(500);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Login Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h3 style="color: red;">เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์กับ LINE</h3>
          <p>${err.message || 'Unknown error'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'LINE_LOGIN_ERROR', error: '${err.message}' }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }
}