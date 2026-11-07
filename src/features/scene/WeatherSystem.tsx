import { DayNight } from './DayNight';
import { Rain } from './Rain';
import { Weather, useWeather } from './Weather';

export function WeatherSystem() {
  const enabled = useWeather(state => state.enabled);
  return enabled ? <><DayNight /><Weather /><Rain /><Rain snow /></> : null;
}
