"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestDrill = void 0;
const params_1 = require("firebase-functions/params");
const https_1 = require("firebase-functions/v2/https");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropicKey = (0, params_1.defineSecret)('ANTHROPIC_KEY');
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
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // Extract first {...} block in case there's surrounding text
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