import type { CurrentWeather, LocationSuggestion } from '../services/types'
import { getWeatherDescription } from '../services/weatherCode'
import PropagateLoader from 'react-spinners/PropagateLoader'

interface CurrentWeatherProps {
  currentWeather: CurrentWeather | null
  isLoading: boolean
  location: LocationSuggestion | null
  windUnit?: string
  precipUnit?: string
}

export default function CurrentWeather({ currentWeather, isLoading, location, windUnit = 'km/h', precipUnit = 'mm' }: CurrentWeatherProps) {
  return (
    <div className="today-weather">
            {isLoading || !currentWeather || !location ? (
              <div className="today-weather__hero skeleton" role="status" aria-label="Loading current weather">
                <div><PropagateLoader color="#fff" loading={isLoading} size={15} /></div>
                <p>Loading current weather...</p>
              </div>
            ) : (
              <div className="today-weather__hero">
                <div className="place">
                  <p>{`${location.name}${location.admin1 ? `, ${location.admin1}` : ''}, ${location.country}`}</p>
                  <p>{currentWeather.time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="temp">
                    <img src={getWeatherDescription(currentWeather.weatherCode).iconUrl} alt={getWeatherDescription(currentWeather.weatherCode).description} />
                  <p>{`${Math.round(currentWeather.temperature2m)}°`}</p>
                </div>
              </div>
            )}
            <div className="data-items flow-col">
              {(() => {
                const statKeys = ["feels-like","humidity","wind","precipitation"] as const;
                type StatKey = typeof statKeys[number];
                const getters: Record<StatKey, (cw: CurrentWeather) => number> = {
                  "feels-like": (cw) => cw.apparentTemperature,
                  humidity: (cw) => cw.relativeHumidity2m,
                  wind: (cw) => cw.windSpeed10m,
                  precipitation: (cw) => cw.precipitation,
                };
                const units: Record<StatKey, string> = {
                  "feels-like": "°",
                  humidity: "%",
                  wind: ` ${windUnit}`,
                  precipitation: ` ${precipUnit}`,
                };
                return statKeys.map((key) => (
                  <div key={key} data-id={key} className={isLoading ? 'skeleton' : ''} style={{minHeight: 'var(--stat-card-h)'}}>
                    {!isLoading && currentWeather && (
                      <>
                        <p>{key.replace('-', ' ')}</p>
                        <p>{`${Math.round(getters[key](currentWeather))}${units[key]}`}</p>
                      </>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
  )
}