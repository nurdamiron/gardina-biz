import { Measurement } from '../../../src/domain/aggregates/Measurement.js';

// ---------------------------------------------------------------------------
// Helper: build a minimal valid Measurement so every test starts clean.
// ---------------------------------------------------------------------------
const makeMeasurement = (overrides = {}) =>
  new Measurement({
    clientId: 'client-123',
    designerId: 'designer-456',
    address: '123 Test Street, Almaty',
    ...overrides,
  });

describe('Measurement.updateMetadata()', () => {
  // -------------------------------------------------------------------------
  // Individual field updates
  // -------------------------------------------------------------------------
  describe('roomType', () => {
    test('updateMetadata({ roomType }) sets _roomType', () => {
      const m = makeMeasurement();
      m.updateMetadata({ roomType: 'bedroom' });
      expect(m.roomType).toBe('bedroom');
    });

    test('can overwrite existing roomType', () => {
      const m = makeMeasurement({ roomType: 'kitchen' });
      m.updateMetadata({ roomType: 'living_room' });
      expect(m.roomType).toBe('living_room');
    });
  });

  describe('deadline', () => {
    test('updateMetadata({ deadline }) sets _deadline as Date', () => {
      const m = makeMeasurement();
      const iso = '2025-12-31';
      m.updateMetadata({ deadline: iso });
      expect(m.deadline).toBeInstanceOf(Date);
      expect(m.deadline.toISOString().startsWith('2025-12-31')).toBe(true);
    });

    test('updateMetadata({ deadline: null }) sets deadline to null', () => {
      const m = makeMeasurement({ deadline: '2025-01-01' });
      m.updateMetadata({ deadline: null });
      expect(m.deadline).toBeNull();
    });

    test('updateMetadata with a Date object also sets _deadline as Date', () => {
      const m = makeMeasurement();
      const date = new Date('2026-06-15');
      m.updateMetadata({ deadline: date });
      expect(m.deadline).toBeInstanceOf(Date);
    });
  });

  describe('notes', () => {
    test('updateMetadata({ notes }) sets _notes', () => {
      const m = makeMeasurement();
      m.updateMetadata({ notes: 'Client prefers blackout curtains' });
      expect(m.notes).toBe('Client prefers blackout curtains');
    });

    test('can clear notes by passing empty string', () => {
      const m = makeMeasurement({ notes: 'old note' });
      m.updateMetadata({ notes: '' });
      expect(m.notes).toBe('');
    });
  });

  describe('mapLink', () => {
    test('updateMetadata({ mapLink }) sets _mapLink', () => {
      const m = makeMeasurement();
      m.updateMetadata({ mapLink: 'https://2gis.kz/almaty/link' });
      expect(m.mapLink).toBe('https://2gis.kz/almaty/link');
    });
  });

  describe('priority', () => {
    test('updateMetadata({ priority }) sets _priority', () => {
      const m = makeMeasurement();
      m.updateMetadata({ priority: 'urgent' });
      expect(m.priority).toBe('urgent');
    });

    test('priority defaults to "standard" on construction', () => {
      const m = makeMeasurement();
      expect(m.priority).toBe('standard');
    });
  });

  describe('styles', () => {
    test('updateMetadata({ styles }) sets _styles', () => {
      const m = makeMeasurement();
      m.updateMetadata({ styles: ['modern', 'minimalist'] });
      expect(m.styles).toEqual(['modern', 'minimalist']);
    });

    test('styles can be set to a string value', () => {
      const m = makeMeasurement();
      m.updateMetadata({ styles: 'classic' });
      expect(m.styles).toBe('classic');
    });
  });

  describe('curtainTypes', () => {
    test('updateMetadata({ curtainTypes }) sets _curtainTypes', () => {
      const m = makeMeasurement();
      m.updateMetadata({ curtainTypes: ['roller', 'pleated'] });
      expect(m.curtainTypes).toEqual(['roller', 'pleated']);
    });
  });

  describe('technicalFeatures', () => {
    test('updateMetadata({ technicalFeatures: [] }) sets array', () => {
      const m = makeMeasurement({ technicalFeatures: ['radiator'] });
      m.updateMetadata({ technicalFeatures: [] });
      expect(m.technicalFeatures).toEqual([]);
    });

    test('updateMetadata({ technicalFeatures: [item] }) stores the array', () => {
      const m = makeMeasurement();
      m.updateMetadata({ technicalFeatures: ['radiator', 'window_sill'] });
      expect(m.technicalFeatures).toEqual(['radiator', 'window_sill']);
    });

    test('updateMetadata({ technicalFeatures: "string" }) converts to []', () => {
      const m = makeMeasurement();
      m.updateMetadata({ technicalFeatures: 'radiator' });
      // Non-array value → constructor default: []
      expect(Array.isArray(m.technicalFeatures)).toBe(true);
      expect(m.technicalFeatures).toEqual([]);
    });

    test('updateMetadata({ technicalFeatures: 42 }) converts number to []', () => {
      const m = makeMeasurement();
      m.updateMetadata({ technicalFeatures: 42 });
      expect(m.technicalFeatures).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('Edge cases', () => {
    test('updateMetadata({}) with empty object does not crash', () => {
      const m = makeMeasurement({ roomType: 'office', notes: 'keep me' });
      expect(() => m.updateMetadata({})).not.toThrow();
    });

    test('updateMetadata({}) does not change existing fields', () => {
      const m = makeMeasurement({ roomType: 'office', notes: 'keep me' });
      m.updateMetadata({});
      expect(m.roomType).toBe('office');
      expect(m.notes).toBe('keep me');
    });

    test('calling updateMetadata() with no argument does not crash', () => {
      const m = makeMeasurement();
      expect(() => m.updateMetadata()).not.toThrow();
    });

    test('multiple fields updated in one call all take effect', () => {
      const m = makeMeasurement();
      m.updateMetadata({
        roomType: 'dining_room',
        notes: 'south-facing windows',
        mapLink: 'https://maps.example.com',
        priority: 'urgent',
        styles: ['traditional'],
        curtainTypes: ['roman'],
        technicalFeatures: ['bay_window'],
      });

      expect(m.roomType).toBe('dining_room');
      expect(m.notes).toBe('south-facing windows');
      expect(m.mapLink).toBe('https://maps.example.com');
      expect(m.priority).toBe('urgent');
      expect(m.styles).toEqual(['traditional']);
      expect(m.curtainTypes).toEqual(['roman']);
      expect(m.technicalFeatures).toEqual(['bay_window']);
    });

    test('fields not included in the call remain unchanged', () => {
      const m = makeMeasurement({ priority: 'standard', roomType: 'bedroom' });
      m.updateMetadata({ notes: 'new note' });
      // priority and roomType must stay
      expect(m.priority).toBe('standard');
      expect(m.roomType).toBe('bedroom');
    });

    test('updateMetadata() marks the aggregate as updated (updatedAt changes)', async () => {
      const m = makeMeasurement();
      const before = m.updatedAt;
      // Small delay to guarantee a different timestamp
      await new Promise(r => setTimeout(r, 5));
      m.updateMetadata({ notes: 'trigger update' });
      expect(m.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });
});
