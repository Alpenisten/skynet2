const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

async function callDeepSeek(prompt) {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "deepseek-chat", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
  });
  const json = await res.json();
  return json.choices?.[0]?.message?.content || null;
}

export async function generatePTTOptions(flight, briefing) {
  const prompt = `
You are SkyNet II Control, an advanced ATC surveillance system. A flight has an anomaly. Generate exactly 3 response options.

FLIGHT: ${flight?.callsign || "UNKNOWN"}
ANOMALY: ${flight?.anomalyType || "UNKNOWN"}
${briefing ? `BRIEFING: ${briefing}` : ""}

Always refer to yourself as "SkyNet II Control" in the ATC transmission text.

For each option generate THREE versions:
1. "display" - Plain English, what the controller wants to do (shown in the button)
2. "atc" - Same instruction where ATC identifies as "SkyNet II Control" in proper radio phraseology
3. "pilot" - Realistic pilot readback/response in radio phraseology

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "options": [
    { "display": "...", "atc": "...", "pilot": "..." },
    { "display": "...", "atc": "...", "pilot": "..." },
    { "display": "...", "atc": "...", "pilot": "..." }
  ]
}
`.trim();

  try {
    const text = await callDeepSeek(prompt);
    if (!text) throw new Error("no response");
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed.options || null;
  } catch {
    return [
      {
        display: "Request immediate altitude confirmation and squawk ident",
        atc:     `${flight?.callsign || "TRAFFIC"}, squawk ident and confirm altitude immediately`,
        pilot:   `Ident, altitude confirming flight level ${Math.round((flight?.alt || 35000) / 100)}, ${flight?.callsign || "TRAFFIC"}`,
      },
      {
        display: "Direct to nearest airport with priority handling",
        atc:     `${flight?.callsign || "TRAFFIC"}, turn left heading 270, descend flight level 150, expect priority handling`,
        pilot:   `Left heading 270, descending flight level 150, ${flight?.callsign || "TRAFFIC"}`,
      },
      {
        display: "Hold current position and await further instructions",
        atc:     `${flight?.callsign || "TRAFFIC"}, hold present position, standby for further instructions`,
        pilot:   `Holding present position, standing by, ${flight?.callsign || "TRAFFIC"}`,
      },
    ];
  }
}

export async function encodeCustomTransmission(flight, customText) {
  const prompt = `
You are SkyNet II Control, an advanced ATC surveillance system. Convert this instruction into proper ATC radio format and generate a realistic pilot response.

FLIGHT: ${flight?.callsign || "UNKNOWN"}
CONTROLLER INSTRUCTION: ${customText}

Always identify yourself as "SkyNet II Control" in the ATC transmission.
Use proper aviation radio phraseology.

Respond ONLY with valid JSON, no markdown:
{
  "display": "Plain english version of what you are instructing",
  "atc": "The ATC transmission where you identify as SkyNet II Control",
  "pilot": "The pilot response in radio phraseology"
}
`.trim();

  try {
    const text = await callDeepSeek(prompt);
    if (!text) throw new Error("no response");
    const clean  = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return parsed;
  } catch {
    return {
      display: customText,
      atc:     `${flight?.callsign || "TRAFFIC"}, ${customText.toLowerCase()}`,
      pilot:   `Roger, ${flight?.callsign || "TRAFFIC"}`,
    };
  }
}