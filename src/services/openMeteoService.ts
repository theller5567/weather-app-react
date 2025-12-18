import { fetchWeatherApi } from "openmeteo";
import { withRetry } from "./retry";
import type {
  Coordinates,
  UnitOptions,
  CurrentWeather,
  HourlyEntry,
  DailyEntry,
} from "./types";
// import { getWeatherDescription } from "./weatherCode";

const DEFAULT_UNITS: Required<UnitOptions> = {
  temperatureUnit: "fahrenheit",
  windSpeedUnit: "kmh",
  precipitationUnit: "mm",
  timezone: "auto",
};

function withDefaults(options?: UnitOptions): Required<UnitOptions> {
  return { ...DEFAULT_UNITS, ...(options ?? {}) } as Required<UnitOptions>;
}

function toDate(value: number | string | bigint): Date {
  if (typeof value === "bigint") return new Date(Number(value) * 1000);
  return typeof value === "number" ? new Date(value * 1000) : new Date(value);
}

function toEpochMs(base: number | bigint, index: number, interval: number | bigint): number {
  const b = typeof base === "bigint" ? Number(base) : base;
  const i = typeof interval === "bigint" ? Number(interval) : interval;
  return (b + index * i) * 1000;
}

export async function getCurrentWeather(
  coords: Coordinates,
  options?: UnitOptions
): Promise<CurrentWeather> {
  const units = withDefaults(options);
  const params = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code",
      "is_day",
    ],
    temperature_unit: units.temperatureUnit,
    wind_speed_unit: units.windSpeedUnit,
    precipitation_unit: units.precipitationUnit,
    timezone: units.timezone,
  } as const;

  const res = await withRetry(() => fetchWeatherApi("https://api.open-meteo.com/v1/forecast", params));
  const response = res[0];
  const current = response.current();
  if (!current) throw new Error("Missing current weather data");

  const data: CurrentWeather = {
    time: toDate(current.time()),
    temperature2m: current.variables(0)!.value(),
    apparentTemperature: current.variables(1)!.value(),
    relativeHumidity2m: current.variables(2)!.value(),
    precipitation: current.variables(3)!.value(),
    windSpeed10m: current.variables(4)!.value(),
    windDirection10m: current.variables(5)!.value(),
    weatherCode: current.variables(6)!.value(),
    isDay: current.variables(7)!.value() === 1,
  };

  return data;
}

export async function getHourlyForecastForDate(
  coords: Coordinates,
  dateISO: string,
  options?: UnitOptions
): Promise<HourlyEntry[]> {
  const units = withDefaults(options);
  const params = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    hourly: [
      "temperature_2m",
      "precipitation_probability",
      "weather_code",
      "wind_speed_10m",
    ],
    start_date: dateISO,
    end_date: dateISO,
    temperature_unit: units.temperatureUnit,
    wind_speed_unit: units.windSpeedUnit,
    timezone: units.timezone,
  } as const;

  const res = await withRetry(() => fetchWeatherApi("https://api.open-meteo.com/v1/forecast", params));
  const response = res[0];
  const hourly = response.hourly();
  if (!hourly) return [];

  const time = hourly.time();
  const interval = hourly.interval();
  const temperatures = hourly.variables(0)!.valuesArray()!;
  const precipProb = hourly.variables(1)!.valuesArray()!;
  const weatherCodes = hourly.variables(2)!.valuesArray()!;
  const windSpeeds = hourly.variables(3)!.valuesArray()!;

  const out: HourlyEntry[] = [];
  for (let i = 0; i < temperatures.length; i++) {
    out.push({
      time: new Date(toEpochMs(time, i, interval)),
      temperature2m: temperatures[i]!,
      precipitationProbability: precipProb[i]!,
      weatherCode: weatherCodes[i]!,
      windSpeed10m: windSpeeds[i]!,
    });
  }
  return out;
}

export async function getDailyForecast(
  coords: Coordinates,
  options?: UnitOptions
): Promise<DailyEntry[]> {
  const units = withDefaults(options);
  const params = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
    ],
    temperature_unit: units.temperatureUnit,
    wind_speed_unit: units.windSpeedUnit,
    precipitation_unit: units.precipitationUnit,
    timezone: units.timezone,
  } as const;

  const res = await withRetry(() => fetchWeatherApi("https://api.open-meteo.com/v1/forecast", params));
  const response = res[0];
  const daily = response.daily();
  if (!daily) return [];

  const time = daily.time();
  const interval = daily.interval();
  const wmo = daily.variables(0)!.valuesArray()!;
  const tmax = daily.variables(1)!.valuesArray()!;
  const tmin = daily.variables(2)!.valuesArray()!;
  const precip = daily.variables(3)!.valuesArray()!;

  const out: DailyEntry[] = [];
  for (let i = 0; i < wmo.length; i++) {
    out.push({
      date: new Date(toEpochMs(time, i, interval)),
      weatherCode: wmo[i]!,
      temperature2mMax: tmax[i]!,
      temperature2mMin: tmin[i]!,
      precipitationSum: precip[i]!,
    });
  }
  return out;
}

export function toApiDateISO(date: Date, timezone: string | undefined): string {
  // If API timezone is provided (e.g., "America/New_York"), format the date in that zone at 00:00.
  // Fallback to local date if not provided.
  try {
    if (timezone && 'Intl' in globalThis && 'DateTimeFormat' in Intl) {
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
      const parts = Object.fromEntries(fmt.formatToParts(date).map(p => [p.type, p.value]));
      return `${parts.year}-${parts.month}-${parts.day}`;
    }
  } catch {}
  return date.toISOString().slice(0,10);
}

// WMO weather code documentation moved to weatherCode.ts for usage.