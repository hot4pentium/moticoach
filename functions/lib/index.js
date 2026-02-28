"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestDrill = exports.onDmMessage = exports.onTeamChatMessage = void 0;
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const admin = __importStar(require("firebase-admin"));
const webpush = __importStar(require("web-push"));
admin.initializeApp();
const anthropicKey = (0, params_1.defineSecret)('ANTHROPIC_KEY');
const vapidPrivKey = (0, params_1.defineSecret)('VAPID_PRIVATE_KEY');
// Must match src/lib/notifications.ts
const VAPID_PUBLIC_KEY = 'BALTBBBA1cPIuie-rKNDECO0rSwDAQAB9u21n86XUM3Lx_DMzM0OylVD32LMx1seFpL04PlztokD-KAqUQflx-g';
const VAPID_SUBJECT = 'mailto:admin@leaguematrix.com';
// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getUsersWithPush(uids) {
    const db = admin.firestore();
    const results = [];
    await Promise.all(uids.map(async (uid) => {
        var _a;
        const snap = await db.doc(`users/${uid}`).get();
        const data = snap.data();
        if ((data === null || data === void 0 ? void 0 : data.webPushSubscription) && ((_a = data === null || data === void 0 ? void 0 : data.notificationPrefs) === null || _a === void 0 ? void 0 : _a.push) !== false) {
            results.push({ uid, sub: data.webPushSubscription });
        }
    }));
    return results;
}
async function sendPushNotifications(subscribers, payload, privateKey) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey);
    await Promise.allSettled(subscribers.map(({ sub }) => webpush.sendNotification(JSON.parse(sub), JSON.stringify(payload))));
}
async function getTeamMemberUids(teamCode) {
    const db = admin.firestore();
    const snap = await db.collection(`teams/${teamCode}/members`).get();
    return snap.docs.map(d => d.id);
}
async function getUserEmail(uid) {
    var _a;
    try {
        const user = await admin.auth().getUser(uid);
        return (_a = user.email) !== null && _a !== void 0 ? _a : null;
    }
    catch (_b) {
        return null;
    }
}
async function sendEmailNotification(uid, subject, htmlBody) {
    var _a;
    const db = admin.firestore();
    const snap = await db.doc(`users/${uid}`).get();
    const prefs = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.notificationPrefs;
    if ((prefs === null || prefs === void 0 ? void 0 : prefs.email) === false)
        return;
    const email = await getUserEmail(uid);
    if (!email)
        return;
    await db.collection('mail').add({
        to: [email],
        message: { subject, html: htmlBody },
    });
}
const APP_URL = 'https://leaguematrix.com';
const EMAIL_CTA = `<p style="margin-top:16px"><a href="${APP_URL}" style="background:#0d9fbc;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-size:14px">Open App →</a></p>`;
// ─── Trigger: new team chat message ───────────────────────────────────────────
exports.onTeamChatMessage = (0, firestore_1.onDocumentCreated)({ document: 'teamChats/{teamCode}/messages/{msgId}', secrets: [vapidPrivKey] }, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const { teamCode } = event.params;
    const senderId = data.senderId;
    const senderName = data.senderName;
    const text = data.text;
    const preview = text.length > 80 ? text.slice(0, 77) + '…' : text;
    const allUids = await getTeamMemberUids(teamCode);
    const recipients = allUids.filter(uid => uid !== senderId);
    if (recipients.length === 0)
        return;
    // Push
    const subscribers = await getUsersWithPush(recipients);
    if (subscribers.length > 0) {
        await sendPushNotifications(subscribers, { title: senderName, body: preview, url: APP_URL, tag: `chat-${teamCode}` }, vapidPrivKey.value());
    }
    // Email (fire-and-forget per recipient)
    const html = `<p style="font-family:sans-serif;color:#333"><strong>${senderName}</strong>: ${preview}</p>${EMAIL_CTA}`;
    await Promise.allSettled(recipients.map(uid => sendEmailNotification(uid, `${senderName} sent a team message`, html)));
});
// ─── Trigger: new DM message ──────────────────────────────────────────────────
exports.onDmMessage = (0, firestore_1.onDocumentCreated)({ document: 'dmConversations/{convId}/messages/{msgId}', secrets: [vapidPrivKey] }, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const senderId = data.senderId;
    const senderName = data.senderName;
    const text = data.text;
    const preview = text.length > 80 ? text.slice(0, 77) + '…' : text;
    // convId = uid1_uid2 sorted — find the recipient
    const { convId } = event.params;
    const [uid1, uid2] = convId.split('_');
    const recipientUid = uid1 === senderId ? uid2 : uid1;
    // Push
    const subscribers = await getUsersWithPush([recipientUid]);
    if (subscribers.length > 0) {
        await sendPushNotifications(subscribers, { title: `Message from ${senderName}`, body: preview, url: APP_URL, tag: `dm-${convId}` }, vapidPrivKey.value());
    }
    // Email
    const html = `<p style="font-family:sans-serif;color:#333"><strong>${senderName}</strong>: ${preview}</p>${EMAIL_CTA}`;
    await sendEmailNotification(recipientUid, `New message from ${senderName}`, html);
});
// ─── suggestDrill ─────────────────────────────────────────────────────────────
exports.suggestDrill = (0, https_1.onCall)({ secrets: [anthropicKey] }, async (request) => {
    const { sport, description, existingDrills } = request.data;
    const client = new sdk_1.default({ apiKey: anthropicKey.value() });
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
    let raw = message.content[0].text.trim();
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (match)
        raw = match[0];
    let suggestion;
    try {
        suggestion = JSON.parse(raw);
    }
    catch (_a) {
        throw new https_1.HttpsError('internal', `Failed to parse AI response: ${raw}`);
    }
    const validDurations = [5, 10, 15, 20, 30];
    if (!validDurations.includes(suggestion.duration)) {
        suggestion.duration = 10;
    }
    return suggestion;
});
//# sourceMappingURL=index.js.map