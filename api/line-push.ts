/**
 * Vercel Serverless Function — `POST /api/line/push`
 *
 * Sends a push message to a specific LINE user through the LINE Messaging API.
 *
 * Requirements:
 *  - `LINE_CHANNEL_ACCESS_TOKEN` env var (long-lived channel access token)
 *    must be set in Vercel (LINE Developers Console → Channel → Messaging API tab).
 *  - The recipient must have ADDED your LINE Official Account as a friend,
 *    otherwise LINE returns HTTP 400.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Read at call time so it can be changed at runtime (and tested easily).
  const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set.');
    res.status(503).json({
      ok: false,
      error: 'ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN ใน Environment Variables ของ Vercel — ระบบจะแสดงการแจ้งเตือนในแอปเท่านั้น ยังไม่ส่งเข้า LINE จริง',
      hint: 'LINE Developers Console → Channel BORROW HUB → แท็บ Messaging API → รับ Channel access token (long-lived) → ไปตั้งที่ Vercel Settings → Environment Variables',
    });
    return;
  }

  const { userId, title, message } = req.body || {};

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing required field: userId (LINE user ID)' });
    return;
  }
  if (!title || !message) {
    res.status(400).json({ ok: false, error: 'Missing required fields: title, message' });
    return;
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
      const friendly =
        pushResponse.status === 400
          ? `400: ผู้ใช้ยังไม่ได้แอดเพื่อน OA, userId ไม่ถูกต้อง หรือ Login ใช้ channel คนละตัวกับ token ที่ใช้ push — ต้องใช้ LINE_CHANNEL_ID เดียวกันกับ access token (userId: ${userId.slice(0, 6)}…)`
          : pushResponse.status === 401
          ? '401: Channel Access Token ไม่ถูกต้อง หมดอายุ หรือถูก Revoke แล้ว'
          : `${pushResponse.status}: ${pushData?.message || 'ข้อผิดพลาดจาก LINE API'}`;
      res.status(pushResponse.status).json({ ok: false, error: friendly });
      return;
    }

    res.status(200).json({ ok: true, sentTo: userId });
  } catch (err: any) {
    console.error('LINE push exception:', err);
    res.status(500).json({ ok: false, error: err.message || 'Unknown error contacting LINE API' });
  }
}