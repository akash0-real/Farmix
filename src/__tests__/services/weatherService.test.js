import { fetchWeatherByLocation, mapWeatherCodeToKey } from '../../services/weatherService';

describe('weatherService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps weather codes to translation keys', () => {
    expect(mapWeatherCodeToKey(0)).toBe('weatherClearSky');
    expect(mapWeatherCodeToKey(61)).toBe('weatherRain');
    expect(mapWeatherCodeToKey(95)).toBe('weatherThunderstorm');
    expect(mapWeatherCodeToKey(999)).toBe('weatherUnknown');
  });

  it('fetches weather by location', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Kolar',
              admin1: 'Karnataka',
              latitude: 13.1367,
              longitude: 78.1299,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 30.2,
            apparent_temperature: 32.1,
            relative_humidity_2m: 54,
            precipitation: 0,
            weather_code: 1,
            wind_speed_10m: 11.4,
          },
        }),
      });

    const result = await fetchWeatherByLocation({
      village: 'Kolar',
      district: 'Kolar',
      state: 'Karnataka',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.locationName).toBe('Kolar, Karnataka');
    expect(result.conditionKey).toBe('weatherPartlyCloudy');
    expect(result.temperatureC).toBe(30.2);
  });
});

