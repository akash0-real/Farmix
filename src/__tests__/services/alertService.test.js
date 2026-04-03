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
    expect(alert.reportCount).toBe(1);

    const alerts = getCommunityAlerts();
    expect(alerts[0].id).toBe(alert.id);
    expect(alerts[0].radiusKm).toBe(20);
  });

  it('aggregates repeated disease reports within the same cluster window', () => {
    const { publishDiseaseAlert } = require('../../services/alertService');

    const first = publishDiseaseAlert({
      diseaseName: 'Rust',
      crop: 'Wheat',
      severity: 'moderate',
      locationName: 'Kolar',
    });

    const second = publishDiseaseAlert({
      diseaseName: 'Rust',
      crop: 'Wheat',
      severity: 'moderate',
      locationName: 'Kolar',
    });

    expect(second.id).toBe(first.id);
    expect(second.reportCount).toBe(2);
  });

  it('increments confirmed count when community confirmation is true', () => {
    const { publishDiseaseAlert } = require('../../services/alertService');

    const alert = publishDiseaseAlert({
      diseaseName: 'Leaf Spot',
      crop: 'Tomato',
      severity: 'high',
      locationName: 'Mysuru',
      communityConfirmed: true,
    });

    expect(alert.confirmedCount).toBe(1);
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
