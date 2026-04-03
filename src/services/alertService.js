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
    reportCount: 14,
    confirmedCount: 3,
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
    reportCount: 9,
    confirmedCount: 0,
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
  communityConfirmed = false,
}) {
  const normalizedSeverity = normalizeSeverity(severity);
  const radiusKm = getSeverityRadiusKm(normalizedSeverity);
  const safeDisease = diseaseName || 'Possible crop disease';
  const safeCrop = crop || 'Crop';
  const nowIso = new Date().toISOString();

  const existingAlertIndex = communityAlerts.findIndex(item => {
    const sameType = item.type === 'disease';
    const sameDisease = String(item.diseaseName || '').toLowerCase() === safeDisease.toLowerCase();
    const sameCrop = String(item.crop || '').toLowerCase() === safeCrop.toLowerCase();
    const sameLocation = String(item.locationName || '').toLowerCase() === String(locationName || '').toLowerCase();
    const sameSeverity = normalizeSeverity(item.severity) === normalizedSeverity;
    const recentEnough = Date.now() - new Date(item.createdAt).getTime() <= 1000 * 60 * 60 * 6;
    return sameType && sameDisease && sameCrop && sameLocation && sameSeverity && recentEnough;
  });

  if (existingAlertIndex >= 0) {
    const existing = communityAlerts[existingAlertIndex];
    const updated = {
      ...existing,
      createdAt: nowIso,
      reportCount: Number(existing.reportCount || 1) + 1,
      confirmedCount:
        Number(existing.confirmedCount || 0) + (communityConfirmed ? 1 : 0),
    };

    communityAlerts = [
      updated,
      ...communityAlerts.slice(0, existingAlertIndex),
      ...communityAlerts.slice(existingAlertIndex + 1),
    ].slice(0, 30);
    notifyListeners();
    return updated;
  }

  const alert = {
    id: `disease-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${safeDisease} risk detected`,
    message: `${safeCrop} farmers within ${radiusKm} km should inspect fields for early symptoms.`,
    severity: normalizedSeverity,
    radiusKm,
    locationName,
    diseaseName: safeDisease,
    crop: safeCrop,
    type: 'disease',
    createdAt: nowIso,
    reportCount: 1,
    confirmedCount: communityConfirmed ? 1 : 0,
  };

  communityAlerts = [alert, ...communityAlerts].slice(0, 30);
  notifyListeners();
  return alert;
}
