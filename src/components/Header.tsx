import logo from "../assets/images/logo.svg";
import iconCheckmark from "../assets/images/icon-checkmark.svg";

import type { TemperatureUnit } from "../services/types";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

interface HeaderProps {
  tempUnit: TemperatureUnit;
  setTempUnit: Dispatch<SetStateAction<TemperatureUnit>>;
}

export default function Header({ tempUnit, setTempUnit }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  return (
    <nav>
      <div className="nav-logo">
        <img src={logo} alt="Weather App Logo" />
      </div>
      <div className="units-dropdown" ref={containerRef}>
        <button className="units-dropdown-button" aria-haspopup="menu" aria-controls="units-menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Units
        </button>
        {open && (
        <div id="units-menu" role="menu" className="dropdown-menu" data-metric={tempUnit === 'fahrenheit' ? 'imperial' : 'metric'}>
          <button onClick={() => { setTempUnit(prev => prev === 'fahrenheit' ? 'celsius' : 'fahrenheit') }}>
            Switch to {tempUnit === 'fahrenheit' ? 'Metric' : 'Imperial'}
          </button>
          <div className="unit">
            <p>Temperature</p>
            <div className="dropdown-menu-items">
              <div className="dropdown-menu-item metric" role="menuitemradio" aria-checked={tempUnit !== 'fahrenheit'} tabIndex={0} onKeyDown={(e) => { if (e.key==='Enter' || e.key===' ') setTempUnit('celsius') }} onClick={() => setTempUnit('celsius')}>
                <p>Celsius(°C)</p>
                <img src={iconCheckmark} alt="Checkmark" />
              </div>
              <div className="dropdown-menu-item imperial" role="menuitemradio" aria-checked={tempUnit === 'fahrenheit'} tabIndex={0} onKeyDown={(e) => { if (e.key==='Enter' || e.key===' ') setTempUnit('fahrenheit') }} onClick={() => setTempUnit('fahrenheit')}>
                <p>Fahrenheit(°F)</p>
                <img src={iconCheckmark} alt="Checkmark" />
              </div>
            </div>
          </div>
          <div className="unit">
            <p>Wind Speed</p>
            <div className="dropdown-menu-items">
              <div className="dropdown-menu-item metric">
                <p>km/h</p>
                <img src={iconCheckmark} alt="Checkmark" />
              </div>
              <div className="dropdown-menu-item imperial">
                <p>mph</p>
                <img src={iconCheckmark} alt="Checkmark" />
              </div>
            </div>
          </div>
          <div className="unit">
            <p>Precipitation</p>
            <div className="dropdown-menu-items">
              <div className="dropdown-menu-item metric">
                <p>Millimeters(mm)</p>
                <img src={iconCheckmark} alt="Checkmark" />
              </div>
              <div className="dropdown-menu-item imperial">
                <p>Inches(in)</p>
                <img src={iconCheckmark} alt="Checkmark" />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </nav>
  );
}
