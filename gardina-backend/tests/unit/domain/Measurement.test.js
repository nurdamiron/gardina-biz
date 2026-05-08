import { Measurement } from '../../../src/domain/aggregates/Measurement.js';

describe('Measurement Aggregate', () => {
  describe('Constructor', () => {
    test('should create Measurement with required fields', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      expect(measurement.clientId).toBe('client-123');
      expect(measurement.designerId).toBe('designer-456');
      expect(measurement.address).toBe('Test Address');
      expect(measurement.status).toBe(Measurement.STATUS.SCHEDULED);
    });

    test('should throw error without clientId', () => {
      expect(() => new Measurement({
        designerId: 'designer-456',
        address: 'Test Address',
      })).toThrow('Client ID is required');
    });

    test('should allow creation without designerId (nullable)', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        address: 'Test Address',
      });
      expect(measurement.designerId).toBeNull();
      expect(measurement.clientId).toBe('client-123');
    });

    test('should throw error without address', () => {
      expect(() => new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
      })).toThrow('Address is required');
    });
  });

  describe('create() factory method', () => {
    test('should create Measurement with SCHEDULED status', () => {
      const measurement = Measurement.create({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        scheduledAt: new Date(),
      });

      expect(measurement.status).toBe(Measurement.STATUS.SCHEDULED);
      expect(measurement.scheduledAt).toBeInstanceOf(Date);
    });
  });

  describe('start()', () => {
    test('should start measurement and change status', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.SCHEDULED,
      });

      measurement.start();

      expect(measurement.status).toBe(Measurement.STATUS.IN_PROGRESS);
      expect(measurement.startedAt).toBeInstanceOf(Date);
    });

    test('should throw error if not scheduled', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.COMPLETED,
      });

      expect(() => measurement.start()).toThrow('Can only start scheduled measurements');
    });
  });

  describe('addWindow()', () => {
    test('should add window to measurement', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      const windowData = {
        id: 'window-1',
        roomName: 'Living Room',
        dimensions: { widthCenter: 2000, heightCenter: 1500 },
        mountingType: 'wall',
      };

      measurement.addWindow(windowData);

      expect(measurement.windows.length).toBe(1);
      expect(measurement.windows[0].windowNumber).toBe(1);
      expect(measurement.windows[0].roomName).toBe('Living Room');
    });

    test('should auto-increment window numbers', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      measurement.addWindow({ id: 'w1', roomName: 'Room 1', dimensions: { widthCenter: 2000, heightCenter: 1500 } });
      measurement.addWindow({ id: 'w2', roomName: 'Room 2', dimensions: { widthCenter: 2000, heightCenter: 1500 } });
      measurement.addWindow({ id: 'w3', roomName: 'Room 3', dimensions: { widthCenter: 2000, heightCenter: 1500 } });

      expect(measurement.windows[0].windowNumber).toBe(1);
      expect(measurement.windows[1].windowNumber).toBe(2);
      expect(measurement.windows[2].windowNumber).toBe(3);
    });

    test('should throw error if measurement is completed', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.COMPLETED,
      });

      expect(() => measurement.addWindow({
        id: 'window-1',
        dimensions: {},
      })).toThrow('Cannot add window to completed measurement');
    });
  });

  describe('addPhoto()', () => {
    test('should add photo to measurement', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      const photoData = {
        id: 'photo-1',
        type: 'room',
        url: 'https://example.com/photo.jpg',
      };

      measurement.addPhoto(photoData);

      expect(measurement.photos.length).toBe(1);
      expect(measurement.photos[0].type).toBe('room');
    });

    test('should throw error if measurement is completed', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.COMPLETED,
      });

      expect(() => measurement.addPhoto({
        id: 'photo-1',
        type: 'room',
        url: 'test.jpg',
      })).toThrow('Cannot add photo to completed measurement');
    });
  });

  describe('updateBudget()', () => {
    test('should update budget range', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      measurement.updateBudget(50000, 100000);

      expect(measurement.budgetMin).toBe(50000);
      expect(measurement.budgetMax).toBe(100000);
    });
  });

  describe('complete()', () => {
    test('should complete measurement with windows', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.IN_PROGRESS,
      });

      measurement.addWindow({
        id: 'window-1',
        dimensions: { widthCenter: 2000, heightCenter: 1500 },
      });

      measurement.complete();

      expect(measurement.status).toBe(Measurement.STATUS.COMPLETED);
      expect(measurement.completedAt).toBeInstanceOf(Date);
    });

    test('should throw error without windows', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      expect(() => measurement.complete()).toThrow(
        'Cannot complete measurement without windows'
      );
    });

    test('should throw error if already completed', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.COMPLETED,
      });

      expect(() => measurement.complete()).toThrow('Measurement already completed');
    });
  });

  describe('cancel()', () => {
    test('should cancel measurement', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      measurement.cancel();

      expect(measurement.status).toBe(Measurement.STATUS.CANCELLED);
    });

    test('should throw error if already completed', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        status: Measurement.STATUS.COMPLETED,
      });

      expect(() => measurement.cancel()).toThrow('Cannot cancel completed measurement');
    });
  });

  describe('isOverdue()', () => {
    test('should return true if past deadline and not completed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        deadline: pastDate,
        status: Measurement.STATUS.IN_PROGRESS,
      });

      expect(measurement.isOverdue()).toBe(true);
    });

    test('should return false if completed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
        deadline: pastDate,
        status: Measurement.STATUS.COMPLETED,
      });

      expect(measurement.isOverdue()).toBe(false);
    });

    test('should return false without deadline', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      expect(measurement.isOverdue()).toBe(false);
    });
  });

  describe('toJSON()', () => {
    test('should serialize to JSON', () => {
      const measurement = new Measurement({
        clientId: 'client-123',
        designerId: 'designer-456',
        address: 'Test Address',
      });

      const json = measurement.toJSON();

      expect(json.clientId).toBe('client-123');
      expect(json.address).toBe('Test Address');
      expect(json.windows).toEqual([]);
      expect(json.photos).toEqual([]);
    });
  });
});
