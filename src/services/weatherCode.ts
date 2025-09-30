// Map WMO weather codes to human-readable descriptions and local icon URLs
// Source: https://open-meteo.com/en/docs

import iconDrizzle from "../assets/images/icon-drizzle.webp";
import iconFog from "../assets/images/icon-fog.webp";
import iconOvercast from "../assets/images/icon-overcast.webp";
import iconPartlyCloudy from "../assets/images/icon-partly-cloudy.webp";
import iconRain from "../assets/images/icon-rain.webp";
import iconSnow from "../assets/images/icon-snow.webp";
import iconStorm from "../assets/images/icon-storm.webp";
import iconSunny from "../assets/images/icon-sunny.webp";

export function getWeatherDescription(code: number): { description: string; iconUrl: string } {
  switch (code) {
    case 0:
      return { description: "Clear sky", iconUrl: iconSunny };

    case 1:
    case 2:
    case 3:
      return { description: "Mainly clear, partly cloudy, and overcast", iconUrl: iconPartlyCloudy };

    case 45:
    case 48:
      return { description: "Fog and depositing rime fog", iconUrl: iconFog };

    case 51:
    case 53:
    case 55:
      return { description: "Drizzle: Light, moderate, and dense intensity", iconUrl: iconDrizzle };

    case 56:
    case 57:
      return { description: "Freezing Drizzle: Light and dense intensity", iconUrl: iconDrizzle };

    case 61:
    case 63:
    case 65:
      return { description: "Rain: Slight, moderate and heavy intensity", iconUrl: iconRain };

    case 66:
    case 67:
      return { description: "Freezing Rain: Light and heavy intensity", iconUrl: iconRain };

    case 71:
    case 73:
    case 75:
      return { description: "Snow fall: Slight, moderate, and heavy intensity", iconUrl: iconSnow };

    case 77:
      return { description: "Snow grains", iconUrl: iconSnow };

    case 80:
    case 81:
    case 82:
      return { description: "Rain showers: Slight, moderate, and violent", iconUrl: iconRain };

    case 85:
    case 86:
      return { description: "Snow showers slight and heavy", iconUrl: iconSnow };

    case 95:
      return { description: "Thunderstorm: Slight or moderate", iconUrl: iconStorm };

    case 96:
    case 99:
      return { description: "Thunderstorm with slight and heavy hail", iconUrl: iconStorm };

    default:
      return { description: "Unknown weather", iconUrl: iconOvercast };
  }
}


