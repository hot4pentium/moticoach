import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import Anthropic from '@anthropic-ai/sdk';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';

admin.initializeApp();

const anthropicKey  = defineSecret('ANTHROPIC_KEY');
const vapidPrivKey  = defineSecret('VAPID_PRIVATE_KEY');

// Must match src/lib/notifications.ts
const VAPID_PUBLIC_KEY = 'BALTBBBA1cPIuie-rKNDECO0rSwDAQAB9u21n86XUM3Lx_DMzM0OylVD32LMx1seFpL04PlztokD-KAqUQflx-g';
const VAPID_SUBJECT    = 'mailto:admin@leaguematrix.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getUsersWithPush(uids: string[]): Promise<{ uid: string; sub: string }[]> {
  const db = admin.firestore();
  const results: { uid: string; sub: string }[] = [];
  await Promise.all(uids.map(async uid => {
    const snap = await db.doc(`users/${uid}`).get();
    const data = snap.data();
    if (data?.webPushSubscription && data?.notificationPrefs?.push !== false) {
      results.push({ uid, sub: data.webPushSubscription });
    }
  }));
  return results;
}

async function sendPushNotifications(
  subscribers: { uid: string; sub: string }[],
  payload: { title: string; body: string; url?: string; tag?: string },
  privateKey: string
): Promise<void> {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);
  await Promise.allSettled(
    subscribers.map(({ sub }) =>
      webpush.sendNotification(JSON.parse(sub), JSON.stringify(payload))
    )
  );
}

async function getTeamMemberUids(teamCode: string): Promise<string[]> {
  const db = admin.firestore();
  const snap = await db.collection(`teams/${teamCode}/members`).get();
  return snap.docs.map(d => d.id);
}

async function getUserEmail(uid: string): Promise<string | null> {
  try {
    const user = await admin.auth().getUser(uid);
    return user.email ?? null;
  } catch {
    return null;
  }
}

async function sendEmailNotification(
  uid: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const db = admin.firestore();
  const snap = await db.doc(`users/${uid}`).get();
  const prefs = snap.data()?.notificationPrefs;
  if (prefs?.email === false) return;

  const email = await getUserEmail(uid);
  if (!email) return;

  await db.collection('mail').add({
    to: [email],
    message: { subject, html: htmlBody },
  });
}

const APP_URL = 'https://leaguematrix.com';
const EMAIL_CTA = `<p style="margin-top:16px"><a href="${APP_URL}" style="background:#0d9fbc;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:14px">Open App →</a></p>`;

// ─── Trigger: new team chat message ───────────────────────────────────────────

export const onTeamChatMessage = onDocumentCreated(
  { document: 'teamChats/{teamCode}/messages/{msgId}', secrets: [vapidPrivKey] },
  async event => {
    const data = event.data?.data();
    if (!data) return;

    const { teamCode } = event.params;
    const senderId   = data.senderId   as string;
    const senderName = data.senderName as string;
    const text       = data.text       as string;
    const preview    = text.length > 80 ? text.slice(0, 77) + '…' : text;

    const allUids    = await getTeamMemberUids(teamCode);
    const recipients = allUids.filter(uid => uid !== senderId);
    if (recipients.length === 0) return;

    // Push
    const subscribers = await getUsersWithPush(recipients);
    if (subscribers.length > 0) {
      await sendPushNotifications(
        subscribers,
        { title: senderName, body: preview, url: APP_URL, tag: `chat-${teamCode}` },
        vapidPrivKey.value()
      );
    }

    // Email (fire-and-forget per recipient)
    const html = `<p style="font-family:sans-serif;color:#333"><strong>${senderName}</strong>: ${preview}</p>${EMAIL_CTA}`;
    await Promise.allSettled(recipients.map(uid =>
      sendEmailNotification(uid, `${senderName} sent a team message`, html)
    ));
  }
);

// ─── Trigger: new DM message ──────────────────────────────────────────────────

export const onDmMessage = onDocumentCreated(
  { document: 'dmConversations/{convId}/messages/{msgId}', secrets: [vapidPrivKey] },
  async event => {
    const data = event.data?.data();
    if (!data) return;

    const senderId    = data.senderId   as string;
    const senderName  = data.senderName as string;
    const text        = data.text       as string;
    const preview     = text.length > 80 ? text.slice(0, 77) + '…' : text;

    // convId = uid1_uid2 sorted — find the recipient
    const { convId } = event.params;
    const [uid1, uid2] = (convId as string).split('_');
    const recipientUid = uid1 === senderId ? uid2 : uid1;

    // Push
    const subscribers = await getUsersWithPush([recipientUid]);
    if (subscribers.length > 0) {
      await sendPushNotifications(
        subscribers,
        { title: `Message from ${senderName}`, body: preview, url: APP_URL, tag: `dm-${convId}` },
        vapidPrivKey.value()
      );
    }

    // Email
    const html = `<p style="font-family:sans-serif;color:#333"><strong>${senderName}</strong>: ${preview}</p>${EMAIL_CTA}`;
    await sendEmailNotification(
      recipientUid,
      `New message from ${senderName}`,
      html
    );
  }
);

// ─── suggestDrill ─────────────────────────────────────────────────────────────

export const suggestDrill = onCall({ secrets: [anthropicKey] }, async (request) => {
  const { sport, description, existingDrills } = request.data as {
    sport: string;
    description: string;
    existingDrills: string[];
  };

  const client = new Anthropic({ apiKey: anthropicKey.value() });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a sports coaching assistant. Suggest one specific drill for a ${sport} practice session.
Coach's description: "${description}"
Existing drills already planned: ${existingDrills.length > 0 ? existingDrills.join(', ') : 'none'}

Respond with ONLY a JSON object (no markdown, no explanation):
{"name": "drill name here", "duration": 10, "notes": "brief coaching tip or setup instruction"}

Duration must be one of: 5, 10, 15, 20, or 30 (minutes).`,
    }],
  });

  let raw = (message.content[0] as { type: string; text: string }).text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) raw = match[0];

  let suggestion: { name: string; duration: number; notes: string };
  try {
    suggestion = JSON.parse(raw);
  } catch {
    throw new HttpsError('internal', `Failed to parse AI response: ${raw}`);
  }

  const validDurations = [5, 10, 15, 20, 30];
  if (!validDurations.includes(suggestion.duration)) {
    suggestion.duration = 10;
  }

  return suggestion;
});
