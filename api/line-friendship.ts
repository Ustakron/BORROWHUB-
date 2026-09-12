/**
 * Vercel Serverless Function — `GET /api/line/friendship?userId=U...`
 *
 * Checks whether a specific LINE user has added your LINE OA as a friend,
 * using the Messaging API endpoint `GET /v2/bot/friendship/status`.
 * Used by the registration flow to require add-friend before finishing signup.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, isFriend: null, error: 'Method Not Allowed' });
    return;
  }

  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    res.status(503).json({
      ok: false,
      isFriend: null,
      error: 'LINE_CHANNEL_ACCESS_TOKEN ยังไม่ได้ตั้งค่า — ไม่สามารถตรวจสอบสถานะเพื่อนได้',
    });
    return;
  }

  const q = req.query.userId;
  const userId = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : undefined;
  if (!userId) {
    res.status(400).json({ ok: false, isFriend: null, error: 'Missing required query param: userId' });
    return;
  }

  try {
    const statusResponse = await fetch(
      `https://api.line.me/v2/bot/friendship/status?user_id=${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` } }
    );

    const statusData: any = await statusResponse.json().catch(() => ({}));

    if (!statusResponse.ok) {
      console.error('LINE friendship check error:', statusResponse.status, statusData);
      res.status(statusResponse.status).json({
        ok: false,
        isFriend: null,
        error: statusData?.message || 'LINE friendship check failed',
      });
      return;
    }

    res.status(200).json({ ok: true, isFriend: statusData.friendFlag === true });
  } catch (err: any) {
    console.error('LINE friendship check exception:', err);
    res.status(500).json({ ok: false, isFriend: null, error: err.message || 'Unknown error' });
  }
}