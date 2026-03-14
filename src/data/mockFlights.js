const AIRLINES  = ["SAS","RYR","BAW","DLH","AFR","KLM","UAE","QTR","SIA","CCA","AAL","UAL","DAL","JAL","ANA","ETH","SVA","THY","MSR","TAP"];
const AIRPORTS  = ["ARN","LHR","CDG","FRA","AMS","JFK","LAX","DXB","SIN","NRT","PEK","SYD","GRU","CPT","DUB","ZRH","MAD","FCO","BKK","ICN","ORD","ATL"];
const EQUIPMENT = ["B738","A320","B77W","A359","B789","E190","A321","B737","A319","B744"];
const ANOMALY_TYPES = [
  "CIRCLING PATTERN", "ALTITUDE DEVIATION", "SPEED ANOMALY",
  "RESTRICTED AIRSPACE", "SQUAWK 7700", "NO TRANSPONDER SIGNAL",
  "HEADING REVERSAL", "LOW ALT HIGH SPEED",
];

export function generateMockFlights(n = 160) {
  return Array.from({ length: n }, (_, i) => {
    const airline  = AIRLINES[i % AIRLINES.length];
    const anomaly  = Math.random() < 0.09;
    const lat      = (Math.random() - 0.5) * 140;
    const lon      = (Math.random() - 0.5) * 360;
    const heading  = Math.round(Math.random() * 360);
    const dist     = 10 + Math.random() * 20;
    const hdRad    = heading * (Math.PI / 180);
    const startLat = lat - Math.cos(hdRad) * dist;
    const startLon = lon - Math.sin(hdRad) * dist / Math.max(0.1, Math.cos(lat * Math.PI / 180));

    return {
      id:          airline + (1000 + Math.floor(Math.random() * 8999)) + i,
      callsign:    airline + (1000 + Math.floor(Math.random() * 8999)),
      origin:      AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)],
      destination: AIRPORTS[Math.floor(Math.random() * AIRPORTS.length)],
      equipment:   EQUIPMENT[Math.floor(Math.random() * EQUIPMENT.length)],
      lat, lon, startLat, startLon,
      alt:         Math.round(5000 + Math.random() * 12000),
      speed:       Math.round(200 + Math.random() * 500),
      heading,
      icao24:      Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0"),
      squawk:      anomaly && Math.random() < 0.3 ? "7700" : "2341",
      onGround:    false,
      anomaly,
      anomalyType: anomaly ? ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)] : null,
    };
  });
}
