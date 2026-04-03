import { FALLBACK_MANDI_ROWS } from './mandiData';

let dataGovApiKey = '';
let mandiResourceId = '9ef84268-d588-465a-a308-a864a43d0070';
let dataGovBaseUrl = 'https://api.data.gov.in/resource';

try {
  // Keep keys/endpoints in src/config/localSecrets.js (gitignored).
  // eslint-disable-next-line global-require, import/no-unresolved
  const localSecrets = require('../config/localSecrets');
  dataGovApiKey = localSecrets.DATA_GOV_API_KEY || dataGovApiKey;
  mandiResourceId = localSecrets.MANDI_RESOURCE_ID || mandiResourceId;
  dataGovBaseUrl = localSecrets.DATA_GOV_BASE_URL || dataGovBaseUrl;
} catch (error) {
  // Fall back to defaults for hackathon/demo mode.
}

function toNumber(value) {
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function normalizeMandiRow(raw) {
  const crop = raw.commodity || raw.crop || 'Unknown crop';
  const market = raw.market || raw.market_name || 'Unknown market';
  const district = raw.district || raw.district_name || 'Unknown district';
  const state = raw.state || raw.state_name || 'Unknown state';
  const minPrice = toNumber(raw.min_price ?? raw.minPrice);
  const maxPrice = toNumber(raw.max_price ?? raw.maxPrice);
  const modalPrice = toNumber(raw.modal_price ?? raw.modalPrice);
  const arrivalDate = raw.arrival_date || raw.arrivalDate || new Date().toISOString().slice(0, 10);

  return {
    crop,
    market,
    district,
    state,
    minPrice,
    maxPrice,
    modalPrice,
    unit: 'INR/qtl',
    arrivalDate,
  };
}

function scoreRow(row, { state, district, crops }) {
  const rowState = String(row.state || '').toLowerCase();
  const rowDistrict = String(row.district || '').toLowerCase();
  const rowCrop = String(row.crop || '').toLowerCase();

  const wantedState = String(state || '').toLowerCase();
  const wantedDistrict = String(district || '').toLowerCase();
  const wantedCrops = (crops || []).map(c => String(c).toLowerCase());

  let score = 0;
  if (wantedState && rowState === wantedState) score += 40;
  if (wantedDistrict && rowDistrict === wantedDistrict) score += 35;
  if (wantedDistrict && rowDistrict.includes(wantedDistrict)) score += 15;

  if (wantedCrops.length) {
    const idx = wantedCrops.findIndex(crop => rowCrop.includes(crop));
    if (idx >= 0) {
      score += 30 - idx;
    }
  }

  return score;
}

function filterAndSortRows(rows, options) {
  return [...rows]
    .map(row => ({ row, score: scoreRow(row, options) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.row.modalPrice - a.row.modalPrice;
    })
    .map(item => item.row);
}

async function fetchFromDataGov({ state, district, limit }) {
  if (!dataGovApiKey) {
    throw new Error('Missing DATA_GOV_API_KEY');
  }

  const params = new URLSearchParams();
  params.set('api-key', dataGovApiKey);
  params.set('format', 'json');
  params.set('limit', String(Math.max(50, limit * 4)));

  if (state) {
    params.set('filters[state]', state);
  }

  if (district) {
    params.set('filters[district]', district);
  }

  const url = `${dataGovBaseUrl}/${mandiResourceId}?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Mandi API request failed.');
  }

  const records = Array.isArray(data?.records) ? data.records : [];
  return records.map(normalizeMandiRow);
}

export async function fetchMandiPrices({
  state,
  district,
  crops = [],
  limit = 12,
} = {}) {
  let rows = [];

  try {
    rows = await fetchFromDataGov({ state, district, limit });
  } catch (error) {
    rows = FALLBACK_MANDI_ROWS.map(normalizeMandiRow);
  }

  const ranked = filterAndSortRows(rows, { state, district, crops });
  return ranked.slice(0, limit);
}
