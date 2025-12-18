import './styles.css'
import Search from './components/Search'
import type { LocationSuggestion, CurrentWeather as CurrentWeatherType, DailyEntry, HourlyEntry, TemperatureUnit, WindSpeedUnit, PrecipitationUnit } from './services/types'
import { getCurrentWeather, getDailyForecast, getHourlyForecastForDate, toApiDateISO } from './services/openMeteoService'
import { useEffect, useState } from 'react'
import DailyForecast from './components/DailyForecast'
import HourlyForecast from './components/HourlyForecast'
import CurrentWeather from './components/CurrentWeather'
import Header from './components/Header'
import iconError from './assets/images/icon-error.svg'
import iconRetry from './assets/images/icon-retry.svg'
import type { ApiErrorKind } from './services/retry'
import { classifyError } from './services/retry'
import { getCacheFresh, getCacheStale, makeKey, setCache } from './services/cache'

function reviveCurrentWeather(x: any): CurrentWeatherType | null {
  if (!x) return null;
  return { ...x, time: new Date(x.time) } as CurrentWeatherType;
}
function reviveHourly(arr: any[] | null): HourlyEntry[] {
  return (arr || []).map(e => ({ ...e, time: new Date(e.time) })) as HourlyEntry[];
}
function reviveDaily(arr: any[] | null): DailyEntry[] {
  return (arr || []).map(e => ({ ...e, date: new Date(e.date) })) as DailyEntry[];
}

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
  const [error, setError] = useState<{ kind: ApiErrorKind; message: string } | null>(null)
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
        const tz = (location?.timezone) || 'auto'
        const dateISO = toApiDateISO(new Date(selectedDate), tz)

        // Keys
        const kCur = makeKey({ type:'cur', lat: coords.latitude, lon: coords.longitude, t: tempUnit, w: windSpeedUnit, p: precipitationUnit })
        const kDaily = makeKey({ type:'daily', lat: coords.latitude, lon: coords.longitude, t: tempUnit, w: windSpeedUnit, p: precipitationUnit })
        const kHourly = makeKey({ type:'hourly', lat: coords.latitude, lon: coords.longitude, date: dateISO, t: tempUnit, w: windSpeedUnit })

        // Try cache first (fresh within 10 min)
        const freshCurRaw = getCacheFresh<any>(kCur, 10 * 60 * 1000)
        const freshDailyRaw = getCacheFresh<any[]>(kDaily, 10 * 60 * 1000)
        const freshHourlyRaw = getCacheFresh<any[]>(kHourly, 10 * 60 * 1000)
        const freshCur = freshCurRaw ? reviveCurrentWeather(freshCurRaw) : null
        const freshDaily = freshDailyRaw ? reviveDaily(freshDailyRaw) : null
        const freshHourly = freshHourlyRaw ? reviveHourly(freshHourlyRaw) : null
        if (freshCur && freshDaily && freshHourly) {
          setCurrentWeather(freshCur)
          setDailyForecast(freshDaily)
          setHourlyForecast(freshHourly)
          return
        }

        const [cur, daily, hourly] = await Promise.all([
          freshCur ? Promise.resolve(freshCur) : getCurrentWeather(coords, { temperatureUnit: tempUnit, windSpeedUnit, precipitationUnit }),
          freshDaily ? Promise.resolve(freshDaily) : getDailyForecast(coords,   { temperatureUnit: tempUnit, windSpeedUnit, precipitationUnit }),
          freshHourly ? Promise.resolve(freshHourly) : getHourlyForecastForDate(coords, dateISO, { temperatureUnit: tempUnit, windSpeedUnit })
        ])

        setCache(kCur, cur)
        setCache(kDaily, daily)
        setCache(kHourly, hourly)
        if (!cancelled) {setCurrentWeather(cur); setDailyForecast(daily); setHourlyForecast(hourly);}
      } catch (e) {
        if (!cancelled) {
          const cls = classifyError(e)
          // Fallback to stale cache if available
          const coords = { latitude: (location!.latitude), longitude: (location!.longitude) }
          const isImperial = tempUnit === 'fahrenheit'
          const windSpeedUnit: WindSpeedUnit = isImperial ? 'mph' : 'kmh'
          const precipitationUnit: PrecipitationUnit = isImperial ? 'inch' : 'mm'
          const tz = location?.timezone || 'auto'
          const dateISO = toApiDateISO(new Date(selectedDate), tz)
          const kCur = makeKey({ type:'cur', lat: coords.latitude, lon: coords.longitude, t: tempUnit, w: windSpeedUnit, p: precipitationUnit })
          const kDaily = makeKey({ type:'daily', lat: coords.latitude, lon: coords.longitude, t: tempUnit, w: windSpeedUnit, p: precipitationUnit })
          const kHourly = makeKey({ type:'hourly', lat: coords.latitude, lon: coords.longitude, date: dateISO, t: tempUnit, w: windSpeedUnit })
          const staleCurRaw = getCacheStale<any>(kCur)
          const staleDailyRaw = getCacheStale<any[]>(kDaily)
          const staleHourlyRaw = getCacheStale<any[]>(kHourly)
          const staleCur = staleCurRaw ? reviveCurrentWeather(staleCurRaw) : null
          const staleDaily = staleDailyRaw ? reviveDaily(staleDailyRaw) : null
          const staleHourly = staleHourlyRaw ? reviveHourly(staleHourlyRaw) : null
          if (staleCur || staleDaily || staleHourly) {
            if (staleCur) setCurrentWeather(staleCur)
            if (staleDaily) setDailyForecast(staleDaily)
            if (staleHourly) setHourlyForecast(staleHourly)
          }
          setError({ kind: cls.kind, message: cls.message })
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    const timeout = setTimeout(() => {
      run();
    }, 2000)
    return () => { cancelled = true; clearTimeout(timeout); };
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
              <h2>{(() => {
                switch (error.kind) {
                  case 'network':
                    return 'Connection problem';
                  case 'timeout':
                    return 'Request timed out';
                  case 'http_5xx':
                    return 'Service unavailable';
                  case 'http_4xx':
                    return 'Request error';
                  default:
                    return 'Something went wrong';
                }
              })()}</h2>
              <p>{(() => {
                switch (error.kind) {
                  case 'network':
                    return "We couldn't reach the weather service. Check your internet and try again.";
                  case 'timeout':
                    return 'The server took too long to respond. Please try again.';
                  case 'http_5xx':
                    return 'The weather service returned an error. Please try again later.';
                  case 'http_4xx':
                    return 'The request seems invalid or unavailable. Try another location or adjust your query.';
                  default:
                    return error.message || 'An unexpected error occurred.';
                }
              })()}</p>
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
