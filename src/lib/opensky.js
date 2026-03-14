import { IATA_CITIES, AIRPORT_COORDS } from "../data/airports";
import { AIRLINE_NAMES }               from "../data/airlines";
import { AIRCRAFT_NAMES }              from "../data/aircraft";

const BASE_URL = "https://opensky-network.org/api";

// Cache så vi inte slår upp samma kod flera gånger
const airportCache  = {};
const airlineCache  = {};
const aircraftCache = {};

export function lookupAirport(iata) {
  if (!iata || iata.length !== 3) return iata;
  if (airportCache[iata]) return airportCache[iata];
  const result = IATA_CITIES[iata] || iata;
  airportCache[iata] = result;
  return result;
}

export function lookupAirline(callsign) {
  if (!callsign) return null;
  const key = callsign.replace(/[0-9]/g, "").substring(0, 3).toUpperCase();
  if (!key || key.length < 2) return null;
  if (airlineCache[key]) return airlineCache[key];
  const result = AIRLINE_NAMES[key] || null;
  airlineCache[key] = result;
  return result;
}

export function lookupAircraft(equipCode) {
  if (!equipCode) return null;
  const code = equipCode.toUpperCase();
  if (aircraftCache[code]) return aircraftCache[code];
  const result = AIRCRAFT_NAMES[code] || null;
  aircraftCache[code] = result;
  return result;
}

export function getAirportCoords(iata) {
  return AIRPORT_COORDS[iata] || null;
}

// Hämtar live-flights från OpenSky
// Returnerar en array av flight-objekt i samma format som mockFlights
export async function fetchOpenSkyFlights() {
  try {
    const res = await fetch(`${BASE_URL}/states/all`);
    if (!res.ok) throw new Error(`OpenSky svarade med status ${res.status}`);
    const json = await res.json();
    if (!json.states) return [];

    return json.states
      .filter(s => s[5] !== null && s[6] !== null) // måste ha lat/lon
      .map(s => {
        const callsign    = (s[1] || "").trim();
        const lon         = s[5];
        const lat         = s[6];
        const alt         = Math.round((s[7] || 0) * 3.28084); // meter → fot
        const speed       = Math.round((s[9] || 0) * 1.94384); // m/s → knop
        const heading     = Math.round(s[10] || 0);
        const onGround    = s[8] || false;
        const icao24      = s[0] || "";
        const hdRad       = heading * (Math.PI / 180);
        const dist        = 5;
        const startLat    = lat - Math.cos(hdRad) * dist;
        const startLon    = lon - Math.sin(hdRad) * dist / Math.max(0.1, Math.cos(lat * Math.PI / 180));

        return {
          id:          icao24 + callsign,
          callsign:    callsign || icao24,
          origin:      null,
          destination: null,
          equipment:   null,
          lat, lon, startLat, startLon,
          alt, speed, heading, icao24,
          squawk:      s[15] || "2341",
          onGround,
          anomaly:     false,
          anomalyType: null,
        };
      });
  } catch (err) {
    console.error("OpenSky fetch misslyckades:", err.message);
    return null; // null = använd mockdata som fallback
  }
}