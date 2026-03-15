const BASE_URL = "https://api.elevenlabs.io/v1";

async function textToSpeech(text, voiceId) {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ElevenLabs API-nyckel saknas i .env");
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key":   apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability:         0.45,
          similarity_boost:  0.80,
          style:             0.30,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs fel:", res.status, errText);
      return null;
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("ElevenLabs anrop misslyckades:", err.message);
    return null;
  }
}

function playAudio(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.volume = 1.0;
    audio.addEventListener("ended",  resolve);
    audio.addEventListener("error",  (e) => { console.error("Audio fel:", e); resolve(); });
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(err => {
        console.error("Play blockerad:", err.message);
        resolve();
      });
    }
  });
}

export async function transmitRadio(atcText, pilotText, onAtcStart, onPilotStart, onComplete) {
  const atcVoiceId   = import.meta.env.VITE_ELEVENLABS_ATC_VOICE;
  const pilotVoiceId = import.meta.env.VITE_ELEVENLABS_PILOT_VOICE;

  console.log("Genererar ljud för ATC:", atcText);
  console.log("Genererar ljud för pilot:", pilotText);

  const [atcUrl, pilotUrl] = await Promise.all([
    textToSpeech(atcText,   atcVoiceId),
    textToSpeech(pilotText, pilotVoiceId),
  ]);

  console.log("ATC URL:", atcUrl);
  console.log("Pilot URL:", pilotUrl);

  if (!atcUrl || !pilotUrl) {
    console.error("Kunde inte generera ljud — kontrollera API-nyckel");
    onComplete?.();
    return;
  }

  onAtcStart?.();
  await playAudio(atcUrl);
  URL.revokeObjectURL(atcUrl);

  await new Promise(r => setTimeout(r, 1000));

  onPilotStart?.();
  await playAudio(pilotUrl);
  URL.revokeObjectURL(pilotUrl);

  onComplete?.();
}