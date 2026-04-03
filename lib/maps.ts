const DISTANCE_MATRIX_URL =
  "https://maps.googleapis.com/maps/api/distancematrix/json";

export interface DistanceResult {
  distanceMiles: number;
  distanceText: string;
  durationText: string;
  durationSeconds: number;
}

// ─── Demo fallback ────────────────────────────────────────────────────────────
// When GOOGLE_MAPS_API_KEY is not configured, generate realistic-looking
// distance data so the booking flow works end-to-end for demos.

function demoDistance(pickup: string, dropoff: string): DistanceResult {
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
    return h;
  };
  const seed = (hash(pickup) + hash(dropoff)) % 100;
  const miles = 6 + (seed % 28) + Math.round((seed % 10) * 0.3) / 10;
  const mins = Math.round(miles * 2.4 + 4);
  const milesStr = miles.toFixed(1);
  return {
    distanceMiles: miles,
    distanceText: `${milesStr} mi`,
    durationText: mins >= 60
      ? `${Math.floor(mins / 60)} hr ${mins % 60} min`
      : `${mins} mins`,
    durationSeconds: mins * 60,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getDistanceMatrix(
  pickupAddress: string,
  dropoffAddress: string
): Promise<DistanceResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Demo mode — no API key configured
  if (!apiKey || apiKey === "your-google-maps-api-key-here" || apiKey === "") {
    console.log("[maps] DEMO MODE — returning estimated distance");
    return demoDistance(pickupAddress, dropoffAddress);
  }

  const params = new URLSearchParams({
    origins: pickupAddress,
    destinations: dropoffAddress,
    units: "imperial",
    key: apiKey,
  });

  const res = await fetch(`${DISTANCE_MATRIX_URL}?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google Maps API HTTP error: ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(
      `Google Maps API error: ${data.status} — ${data.error_message ?? ""}`
    );
  }

  const element = data.rows?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    const elStatus = element?.status ?? "UNKNOWN";
    throw new Error(
      elStatus === "NOT_FOUND"
        ? "One or both addresses could not be found. Please check and try again."
        : elStatus === "ZERO_RESULTS"
        ? "No driving route found between these addresses."
        : `Could not calculate distance (${elStatus}).`
    );
  }

  const distanceMeters: number = element.distance.value;
  const distanceMiles = distanceMeters / 1609.344;

  return {
    distanceMiles,
    distanceText: element.distance.text,
    durationText: element.duration.text,
    durationSeconds: element.duration.value,
  };
}
