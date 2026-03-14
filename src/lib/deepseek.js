const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

export async function analyzeFlightWithAI(flight) {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    return "DeepSeek API-nyckel saknas. Lägg till VITE_DEEPSEEK_API_KEY i din .env-fil.";
  }

  const prompt = `
You are SKYNET — an advanced aviation surveillance AI.
Analyze this flight contact and provide a concise tactical briefing.

CALLSIGN:    ${flight.callsign}
ORIGIN:      ${flight.origin || "UNKNOWN"}
DESTINATION: ${flight.destination || "UNKNOWN"}
AIRCRAFT:    ${flight.equipment || "UNKNOWN"}
ALTITUDE:    ${flight.alt} ft
SPEED:       ${flight.speed} kts
HEADING:     ${flight.heading}°
SQUAWK:      ${flight.squawk}
ANOMALY:     ${flight.anomaly ? flight.anomalyType : "NONE"}

Respond in exactly three short sections:
SITUATION: (one sentence)
ASSESSMENT: (two sentences max)
ACTION REQUIRED: (one sentence)
`.trim();

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "deepseek-chat",
        max_tokens:  300,
        messages:    [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`DeepSeek svarade med status ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content || "Ingen analys tillgänglig.";
  } catch (err) {
    console.error("DeepSeek-anrop misslyckades:", err.message);
    return "Analys ej tillgänglig — kontrollera din API-nyckel och nätverksanslutning.";
  }
}