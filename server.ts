import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || '2011570170';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || 'cf0c2877970de62b8f7f0a3d636faed4';
// Long-lived Channel Access Token for the Messaging API (push messages).
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

// Helper to determine redirect URI
function getRedirectUri(req: express.Request): string {
  // If APP_URL is defined from AI Studio runtime environment, use it
  if (process.env.APP_URL) {
    const cleanAppUrl = process.env.APP_URL.replace(/\/$/, '');
    return `${cleanAppUrl}/auth/callback`;
  }
  
  // Fallback to request host
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${protocol}://${host}/auth/callback`;
}

// 1. API to generate LINE Login OAuth Authorization URL
app.get('/api/auth/line/url', (req, res) => {
  const redirectUri = (req.query.redirect_uri as string) || getRedirectUri(req);
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const nonce = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: redirectUri,
    state: state,
    scope: 'profile openid',
    nonce: nonce,
    bot_prompt: 'normal',
  });

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  res.json({
    url: authUrl,
    state,
    channelId: LINE_CHANNEL_ID,
    redirectUri,
  });
});

// 2. LINE OAuth Callback handler (Both with and without trailing slash)
const handleOAuthCallback = async (req: express.Request, res: express.Response) => {
  const { code, state, error, error_description } = req.query;

  if (error || !code) {
    const errMessage = (error_description as string) || (error as string) || 'User cancelled authorization';
    return res.send(`
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
  }

  try {
    const redirectUri = getRedirectUri(req);

    // Exchange code for Access Token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('LINE token error:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to exchange token');
    }

    // Fetch User Profile from LINE API
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

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

    // Render HTML that sends the user profile to the parent window via postMessage and closes
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
    res.status(500).send(`
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
};

app.get('/auth/callback', handleOAuthCallback);
app.get('/auth/callback/', handleOAuthCallback);

// Real LINE Messaging API push (local dev parity with api/line-push.ts on Vercel)
app.post('/api/line/push', async (req, res) => {
  const { userId, title, message } = req.body || {};
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    return res.status(503).json({ ok: false, error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' });
  }
  if (!userId || !title || !message) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: userId, title, message' });
  }
  try {
    const pushResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: `[BORROW HUB] ${title}\n\n${message}` }],
      }),
    });
    const pushData: any = await pushResponse.json().catch(() => ({}));
    if (!pushResponse.ok) {
      console.error('LINE push error:', pushResponse.status, pushData);
      return res
        .status(pushResponse.status)
        .json({ ok: false, error: pushData?.message || 'LINE push failed' });
    }
    res.json({ ok: true, sentTo: userId });
  } catch (err: any) {
    console.error('LINE push exception:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error' });
  }
});

// Friendship status check (local dev parity with api/line-friendship.ts on Vercel)
app.get('/api/line/friendship', async (req, res) => {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    return res.status(503).json({ ok: false, isFriend: null, error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' });
  }
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    return res.status(400).json({ ok: false, isFriend: null, error: 'userId is required' });
  }
  try {
    const statusResponse = await fetch(
      `https://api.line.me/v2/bot/friendship/status?user_id=${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` } }
    );
    const statusData: any = await statusResponse.json().catch(() => ({}));
    if (!statusResponse.ok) {
      console.error('LINE friendship check error:', statusResponse.status, statusData);
      return res
        .status(statusResponse.status)
        .json({ ok: false, isFriend: null, error: statusData?.message || 'LINE friendship check failed' });
    }
    res.json({ ok: true, isFriend: statusData.friendFlag === true });
  } catch (err: any) {
    console.error('LINE friendship check exception:', err);
    res.status(500).json({ ok: false, isFriend: null, error: err.message || 'Unknown error' });
  }
});

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    school: 'โรงเรียนสระแก้ว',
    channelId: LINE_CHANNEL_ID,
  });
});

// Vite middleware for development vs static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BORROW HUB server running on http://0.0.0.0:${PORT}`);
    console.log(`LINE Channel ID: ${LINE_CHANNEL_ID}`);
  });
}

startServer();
