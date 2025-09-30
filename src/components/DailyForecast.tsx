import type { DailyEntry } from "../services/types";
import { getWeatherDescription } from "../services/weatherCode";

interface DailyForecastProps {
  dailyForecast: DailyEntry[];
  isLoading: boolean;
}

export default function DailyForecast({
  dailyForecast,
  isLoading,
}: DailyForecastProps) {
  return (
    <div className="daily-forecast">
      <h3>Daily Forecast</h3>
      <ul>
        {Array.from({ length: 7 }).map((_, i) => (
          <li key={i} className={isLoading || !dailyForecast ? "skeleton" : ""}>
            {!isLoading && dailyForecast ? (
              <>
                <p>
                  {dailyForecast[i]!.date.toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </p>
                {(() => {
                  const meta = getWeatherDescription(
                    dailyForecast[i]!.weatherCode
                  );
                  return <img src={meta.iconUrl} alt={meta.description} />;
                })()}
                <div className="flex-flow">
                  <span className="high">
                    {Math.round(dailyForecast[i]!.temperature2mMax)}°
                  </span>
                  <span className="low">
                    {Math.round(dailyForecast[i]!.temperature2mMin)}°
                  </span>
                </div>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
