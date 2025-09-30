// Shared types for the weather service

export type TemperatureUnit = "celsius" | "fahrenheit";
export type WindSpeedUnit = "kmh" | "mph" | "ms" | "kn";
export type PrecipitationUnit = "mm" | "inch";

export interface UnitOptions {
  temperatureUnit?: TemperatureUnit;
  windSpeedUnit?: WindSpeedUnit;
  precipitationUnit?: PrecipitationUnit;
  timezone?: string; // e.g. "auto" or "America/New_York"
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  time: Date;
  temperature2m: number;
  apparentTemperature: number;
  relativeHumidity2m: number;
  windSpeed10m: number;
  windDirection10m: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
}

export interface HourlyEntry {
  time: Date;
  temperature2m: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed10m: number;
}

export interface DailyEntry {
  date: Date;
  weatherCode: number;
  temperature2mMax: number;
  temperature2mMin: number;
  precipitationSum: number;
}

export interface LocationSuggestion {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}


