import { useMemo } from 'react'
import type { HourlyEntry } from '../services/types'
import { getWeatherDescription } from '../services/weatherCode'

interface HourlyForecastProps {
  hourlyForecast: HourlyEntry[],
  isLoading: boolean
  selectedDate?: string
  onChangeDate?: (isoDate: string) => void
  availableDates?: Date[]
}

export default function HourlyForecast({ hourlyForecast, isLoading, selectedDate, onChangeDate, availableDates = [] }: HourlyForecastProps) {
  const options = useMemo(() => availableDates.map(d => d.toISOString().slice(0,10)), [availableDates])
  return (
    <div className="hourly-forecast">
            <div className="flex-flow">
              <h3>Hourly Forecast</h3>
              <select value={selectedDate} onChange={(e) => onChangeDate?.(e.target.value)} name="date" id="date-selector">
                {options.map(iso => (
                  <option key={iso} value={iso}>{new Date(iso).toLocaleDateString(undefined, { weekday:'long'})}</option>
                ))}
              </select>
            </div>
            <ul>
              {Array.from({ length: 8 }).map((_, i) => (
                <li key={i} className={(isLoading || !hourlyForecast) ? 'skeleton' : ''}>
                  {!isLoading && hourlyForecast ? (
                    <>
                      <div className="flex-flow">
                        <img src={getWeatherDescription(hourlyForecast[i]!.weatherCode).iconUrl} alt={getWeatherDescription(hourlyForecast[i]!.weatherCode).description} />
                      <p>{hourlyForecast[i]!.time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <p>{Math.round(hourlyForecast[i]!.temperature2m)}°</p>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
  )
}