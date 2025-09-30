import './styles.css'
import Search from './components/Search'
import type { LocationSuggestion, CurrentWeather as CurrentWeatherType, DailyEntry, HourlyEntry, TemperatureUnit, WindSpeedUnit, PrecipitationUnit } from './services/types'
import { getCurrentWeather, getDailyForecast, getHourlyForecastForDate } from './services/openMeteoService'
import { useEffect, useState } from 'react'
import DailyForecast from './components/DailyForecast'
import HourlyForecast from './components/HourlyForecast'
import CurrentWeather from './components/CurrentWeather'
import Header from './components/Header'
import iconError from './assets/images/icon-error.svg'
import iconRetry from './assets/images/icon-retry.svg'

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [location, setLocation] = useState<LocationSuggestion | null>(() => {
    const saved = localStorage.getItem('location')
    if (saved) {
      try { return JSON.parse(saved) as LocationSuggestion } catch {}
    }
    // default location
    return {
      id: 0,
      name: 'Atlanta',
      country: 'United States',
      admin1: 'Georgia',
      latitude: 33.749,
      longitude: -84.388,
      timezone: 'America/New_York',
    }
  })
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherType | null>(null)
  const [dailyForecast, setDailyForecast] = useState<DailyEntry[] | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyEntry[] | null>(null)
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>(() => (localStorage.getItem('tempUnit') as TemperatureUnit) || 'fahrenheit')
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [error, setError] = useState<string | null>(null)
  const [refreshId, setRefreshId] = useState<number>(0)
  
  useEffect(() => {
    if (!location) return;
    const coords = { latitude: location.latitude, longitude: location.longitude };
    const isImperial = tempUnit === 'fahrenheit'
    const windSpeedUnit: WindSpeedUnit = isImperial ? 'mph' : 'kmh'
    const precipitationUnit: PrecipitationUnit = isImperial ? 'inch' : 'mm'
    let cancelled = false;
    async function run() {
      try {
        setError(null)
        // Kick off all data requests in parallel
        const [cur, daily, hourly] = await Promise.all([
          getCurrentWeather(coords, { temperatureUnit: tempUnit, windSpeedUnit, precipitationUnit }),
          getDailyForecast(coords,   { temperatureUnit: tempUnit, windSpeedUnit, precipitationUnit }),
          getHourlyForecastForDate(coords, selectedDate, { temperatureUnit: tempUnit, windSpeedUnit })
        ]);
        if (!cancelled) {setCurrentWeather(cur); setDailyForecast(daily); setHourlyForecast(hourly);}
      } catch (e) {
        if (!cancelled) setError('Unable to connect to the weather service. Please check your network and try again.')
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    setTimeout(() => {
      run();
    }, 2000)
    
    return () => { cancelled = true };
  }, [location, tempUnit, selectedDate, refreshId])

  useEffect(() => {
    localStorage.setItem('tempUnit', tempUnit)
  }, [tempUnit])

  useEffect(() => {
    if (location) {
      localStorage.setItem('location', JSON.stringify(location))
    }
  }, [location])

  return (
    <>
      <main>
        <Header tempUnit={tempUnit} setTempUnit={setTempUnit}/>
        <header><h1 className="tx-center">How’s the sky looking today?</h1></header>
        <Search onSelect={(loc) => { setLocation(loc); setIsLoading(true); }} />
        {error ? (
          <section aria-busy={false}>
            <div className="error-screen" role="alert" aria-live="assertive">
              <img src={iconError} alt="" aria-hidden="true" />
              <h2>Something went wrong</h2>
              <p>We couldn’t connect to the server (API error). Please try again in a few moments.</p>
              <button className="btn-retry" onClick={() => { setIsLoading(true); setError(null); setRefreshId((n) => n + 1) }}>
                <img src={iconRetry} alt="" aria-hidden="true" />
                Retry
              </button>
            </div>
          </section>
        ) : (
        <section id="main-content" aria-busy={isLoading}>
          <CurrentWeather
            currentWeather={currentWeather}
            isLoading={isLoading}
            location={location}
            windUnit={tempUnit === 'fahrenheit' ? 'mph' : 'km/h'}
            precipUnit={tempUnit === 'fahrenheit' ? 'in' : 'mm'}
          />
          <DailyForecast dailyForecast={dailyForecast || []} isLoading={isLoading} />
          <HourlyForecast
            hourlyForecast={hourlyForecast || []}
            isLoading={isLoading}
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
            availableDates={(dailyForecast || []).map(d => d.date)}
          />
        </section>
        )}
      </main>
    </>
  )
}

export default App
