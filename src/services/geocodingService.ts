import type { LocationSuggestion } from "./types";

// Open-Meteo Geocoding API
// Docs: https://open-meteo.com/en/docs/geocoding-api

export async function searchLocation(query: string, limit = 8): Promise<LocationSuggestion[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(limit));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{ id: number; name: string; country: string; admin1?: string; latitude: number; longitude: number; timezone?: string }>;
  };

  if (!data.results) return [];
  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}


