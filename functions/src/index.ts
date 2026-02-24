import { defineSecret } from 'firebase-functions/params';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';

const anthropicKey = defineSecret('ANTHROPIC_KEY');

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
  // Strip markdown code fences if present
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  // Extract first {...} block in case there's surrounding text
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
