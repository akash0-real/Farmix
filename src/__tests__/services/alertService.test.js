describe('alertService', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('normalizes severity values', () => {
    const { normalizeSeverity } = require('../../services/alertService');

    expect(normalizeSeverity('HIGH')).toBe('high');
    expect(normalizeSeverity('medium')).toBe('moderate');
    expect(normalizeSeverity('unknown')).toBe('low');
  });

  it('maps severity to radius', () => {
    const { getSeverityRadiusKm } = require('../../services/alertService');

    expect(getSeverityRadiusKm('high')).toBe(20);
    expect(getSeverityRadiusKm('moderate')).toBe(8);
    expect(getSeverityRadiusKm('low')).toBe(3);
  });

  it('publishes a new disease alert with severity radius', () => {
    const { publishDiseaseAlert, getCommunityAlerts } = require('../../services/alertService');

    const alert = publishDiseaseAlert({
      diseaseName: 'Leaf Blight',
      crop: 'Tomato',
      severity: 'High',
      locationName: 'Demo Village',
    });

    expect(alert.title).toContain('Leaf Blight');
    expect(alert.radiusKm).toBe(20);
    expect(alert.severity).toBe('high');

    const alerts = getCommunityAlerts();
    expect(alerts[0].id).toBe(alert.id);
    expect(alerts[0].radiusKm).toBe(20);
  });

  it('notifies subscribers when alert list updates', () => {
    const {
      subscribeToCommunityAlerts,
      publishDiseaseAlert,
    } = require('../../services/alertService');

    const listener = jest.fn();
    const unsubscribe = subscribeToCommunityAlerts(listener);

    publishDiseaseAlert({ diseaseName: 'Rust', crop: 'Wheat', severity: 'moderate' });

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
