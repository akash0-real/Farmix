import { fetchMandiPrices, normalizeMandiRow } from '../../services/mandiApi';

describe('mandiApi', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns fallback rows when api key/network is unavailable', async () => {
    const rows = await fetchMandiPrices({
      state: 'Karnataka',
      district: 'Kolar',
      crops: ['wheat'],
      limit: 5,
    });

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        crop: expect.any(String),
        market: expect.any(String),
        district: expect.any(String),
        state: expect.any(String),
        modalPrice: expect.any(Number),
      }),
    );
  });

  it('normalizes mandi row shape from remote payload', () => {
    const row = normalizeMandiRow({
      commodity: 'Wheat',
      market: 'Test Yard',
      district: 'Kolar',
      state: 'Karnataka',
      min_price: '2100',
      max_price: '2500',
      modal_price: '2400',
      arrival_date: '2026-04-03',
    });

    expect(row).toEqual(
      expect.objectContaining({
        crop: 'Wheat',
        market: 'Test Yard',
        district: 'Kolar',
        state: 'Karnataka',
        minPrice: 2100,
        maxPrice: 2500,
        modalPrice: 2400,
      }),
    );
  });
});
