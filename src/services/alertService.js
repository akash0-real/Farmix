const SEVERITY_RADIUS_KM = {
  low: 3,
  moderate: 8,
  high: 20,
};

let communityAlerts = [
  {
    id: 'seed-2',
    title: 'Pest outbreak nearby',
    message: 'Armyworm activity reported in nearby fields.',
    severity: 'high',
    radiusKm: 20,
    locationName: 'Kolar cluster',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    type: 'pest',
  },
  {
    id: 'seed-1',
    title: 'Heavy rainfall expected',
    message: 'Irrigation advisory: avoid spraying before evening.',
    severity: 'moderate',
    radiusKm: 8,
    locationName: 'Mysuru zone',
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    type: 'weather',
  },
];

const listeners = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener(getCommunityAlerts()));
}

export function normalizeSeverity(severity) {
  const normalized = String(severity || '').trim().toLowerCase();

  if (normalized === 'high') {
    return 'high';
  }

  if (normalized === 'moderate' || normalized === 'medium') {
    return 'moderate';
  }

  return 'low';
}

export function getSeverityRadiusKm(severity) {
  return SEVERITY_RADIUS_KM[normalizeSeverity(severity)] || SEVERITY_RADIUS_KM.low;
}

export function getCommunityAlerts() {
  return [...communityAlerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function subscribeToCommunityAlerts(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);
  listener(getCommunityAlerts());

  return () => {
    listeners.delete(listener);
  };
}

export function publishDiseaseAlert({
  diseaseName,
  crop,
  severity,
  locationName = 'your area',
}) {
  const normalizedSeverity = normalizeSeverity(severity);
  const radiusKm = getSeverityRadiusKm(normalizedSeverity);
  const safeDisease = diseaseName || 'Possible crop disease';
  const safeCrop = crop || 'Crop';

  const alert = {
    id: `disease-${Date.now()}`,
    title: `${safeDisease} risk detected`,
    message: `${safeCrop} farmers within ${radiusKm} km should inspect fields for early symptoms.`,
    severity: normalizedSeverity,
    radiusKm,
    locationName,
    diseaseName: safeDisease,
    crop: safeCrop,
    type: 'disease',
    createdAt: new Date().toISOString(),
  };

  communityAlerts = [alert, ...communityAlerts].slice(0, 30);
  notifyListeners();
  return alert;
}
