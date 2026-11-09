import { DayNight } from './DayNight';
import { Rain } from './Rain';
import { Weather, useWeather } from './Weather';

export function WeatherSystem() {
  const enabled = useWeather(state => state.enabled);
  return <><DayNight />{enabled && <><Weather /><Rain /><Rain snow /></>}</>;
}
