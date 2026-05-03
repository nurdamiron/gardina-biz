/**
 * Unit tests for calculations.js
 * Run with: node --test src/utils/calculations.test.js
 * Requires Node >= 18 (uses node:test + node:assert).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

import {
  FABRIC_COEFFICIENTS,
  TAPE_ROLLS,
  HOOK_TYPES,
  JALOUSIE_MATERIALS,
  ZEBRA_SYSTEMS,
  ROMAN_MECHANISMS,
  DEFAULT_SEWING_RATE,
  calculateCurtainMeters,
  calculateTulleMeters,
  calculateFabricMeters,
  calculateTotalTapeMeters,
  calculateTapeRolls,
  calculateHookPacks,
  calculateHooksQuantity,
  calculateClassicRoom,
  calculateJalousieRoom,
  calculateZebraRoom,
  calculateRomanRoom,
  calculateMeasurementTotal,
  formatPrice,
} from './calculations.js';

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

/** Assert two numbers are equal within a small delta. */
function assertClose(actual, expected, delta = 0.001, msg = '') {
  assert.ok(
    Math.abs(actual - expected) <= delta,
    `${msg} — expected ${expected}, got ${actual}`
  );
}

// ─────────────────────────────────────────────────────────────
// 1. calculateCurtainMeters
// ─────────────────────────────────────────────────────────────

describe('calculateCurtainMeters', () => {
  it('applies formula ceil(length × 2 + 0.5)', () => {
    // 3 × 2 + 0.5 = 6.5  → ceil = 7
    assert.equal(calculateCurtainMeters(3), 7);
  });

  it('handles exact integer result (no ceiling needed)', () => {
    // 1 × 2 + 0.5 = 2.5 → ceil = 3
    assert.equal(calculateCurtainMeters(1), 3);
  });

  it('handles decimal cornice length', () => {
    // 2.5 × 2 + 0.5 = 5.5 → ceil = 6
    assert.equal(calculateCurtainMeters(2.5), 6);
  });

  it('handles large value', () => {
    // 10 × 2 + 0.5 = 20.5 → ceil = 21
    assert.equal(calculateCurtainMeters(10), 21);
  });

  it('returns 0 for zero input', () => {
    assert.equal(calculateCurtainMeters(0), 0);
  });

  it('returns 0 for negative input', () => {
    assert.equal(calculateCurtainMeters(-5), 0);
  });

  it('returns 0 for null input', () => {
    assert.equal(calculateCurtainMeters(null), 0);
  });

  it('returns 0 for undefined input', () => {
    assert.equal(calculateCurtainMeters(undefined), 0);
  });

  it('returns 0 for NaN input', () => {
    assert.equal(calculateCurtainMeters(NaN), 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 2. calculateTulleMeters
// ─────────────────────────────────────────────────────────────

describe('calculateTulleMeters', () => {
  it('applies formula ceil(length × 3 + 0.5)', () => {
    // 3 × 3 + 0.5 = 9.5 → ceil = 10
    assert.equal(calculateTulleMeters(3), 10);
  });

  it('handles decimal cornice length', () => {
    // 2.5 × 3 + 0.5 = 8.0 → ceil = 8
    assert.equal(calculateTulleMeters(2.5), 8);
  });

  it('handles large value', () => {
    // 10 × 3 + 0.5 = 30.5 → ceil = 31
    assert.equal(calculateTulleMeters(10), 31);
  });

  it('handles value of 1', () => {
    // 1 × 3 + 0.5 = 3.5 → ceil = 4
    assert.equal(calculateTulleMeters(1), 4);
  });

  it('returns 0 for zero input', () => {
    assert.equal(calculateTulleMeters(0), 0);
  });

  it('returns 0 for negative input', () => {
    assert.equal(calculateTulleMeters(-1), 0);
  });

  it('returns 0 for null', () => {
    assert.equal(calculateTulleMeters(null), 0);
  });

  it('returns 0 for undefined', () => {
    assert.equal(calculateTulleMeters(undefined), 0);
  });

  it('returns 0 for NaN', () => {
    assert.equal(calculateTulleMeters(NaN), 0);
  });

  it('tulle result is always >= curtain result for same length', () => {
    [1, 2, 3, 5, 10].forEach(len => {
      assert.ok(calculateTulleMeters(len) >= calculateCurtainMeters(len));
    });
  });
});

// ─────────────────────────────────────────────────────────────
// 3. calculateFabricMeters
// ─────────────────────────────────────────────────────────────

describe('calculateFabricMeters', () => {
  it('uses coefficient 2 for curtain type', () => {
    assert.equal(FABRIC_COEFFICIENTS.curtain, 2);
    // 3 × 2 + 0.5 = 6.5 → 7
    assert.equal(calculateFabricMeters(3, 'curtain'), 7);
  });

  it('uses coefficient 3 for tulle type', () => {
    assert.equal(FABRIC_COEFFICIENTS.tulle, 3);
    // 3 × 3 + 0.5 = 9.5 → 10
    assert.equal(calculateFabricMeters(3, 'tulle'), 10);
  });

  it('falls back to coefficient 2 for unknown fabric type', () => {
    // unknown → 2 (same as curtain)
    assert.equal(calculateFabricMeters(3, 'velvet'), calculateFabricMeters(3, 'curtain'));
  });

  it('falls back to coefficient 2 for undefined type', () => {
    assert.equal(calculateFabricMeters(3, undefined), calculateFabricMeters(3, 'curtain'));
  });

  it('falls back to coefficient 2 for null type', () => {
    assert.equal(calculateFabricMeters(3, null), calculateFabricMeters(3, 'curtain'));
  });

  it('handles zero cornice length', () => {
    // 0 × 2 + 0.5 = 0.5 → ceil = 1  (no guard here, unlike the top-level fns)
    assert.equal(calculateFabricMeters(0, 'curtain'), 1);
  });

  it('handles decimal cornice length with curtain', () => {
    // 2.5 × 2 + 0.5 = 5.5 → 6
    assert.equal(calculateFabricMeters(2.5, 'curtain'), 6);
  });
});

// ─────────────────────────────────────────────────────────────
// 4. calculateTotalTapeMeters
// ─────────────────────────────────────────────────────────────

describe('calculateTotalTapeMeters', () => {
  it('sums meters for a single classic room with one curtain item', () => {
    const rooms = [
      {
        solutionType: 'classic',
        corniceLength: '3',
        fabricItems: [{ fabricType: 'curtain' }],
      },
    ];
    // 3m cornice, curtain → ceil(3×2+0.5) = 7
    assert.equal(calculateTotalTapeMeters(rooms), 7);
  });

  it('sums meters for a single classic room with one tulle item', () => {
    const rooms = [
      {
        solutionType: 'classic',
        corniceLength: '3',
        fabricItems: [{ fabricType: 'tulle' }],
      },
    ];
    // ceil(3×3+0.5) = 10
    assert.equal(calculateTotalTapeMeters(rooms), 10);
  });

  it('sums multiple fabric items in a single room', () => {
    const rooms = [
      {
        solutionType: 'classic',
        corniceLength: '3',
        fabricItems: [{ fabricType: 'curtain' }, { fabricType: 'tulle' }],
      },
    ];
    // 7 + 10 = 17
    assert.equal(calculateTotalTapeMeters(rooms), 17);
  });

  it('sums meters across multiple classic rooms', () => {
    const rooms = [
      {
        solutionType: 'classic',
        corniceLength: '3',
        fabricItems: [{ fabricType: 'curtain' }],
      },
      {
        solutionType: 'classic',
        corniceLength: '2',
        fabricItems: [{ fabricType: 'curtain' }],
      },
    ];
    // room1: ceil(3×2+0.5)=7  room2: ceil(2×2+0.5)=5
    assert.equal(calculateTotalTapeMeters(rooms), 12);
  });

  it('ignores non-classic rooms', () => {
    const rooms = [
      {
        solutionType: 'jalousie_h',
        corniceLength: '3',
        fabricItems: [{ fabricType: 'curtain' }],
      },
      {
        solutionType: 'zebra',
        corniceLength: '3',
        fabricItems: [{ fabricType: 'tulle' }],
      },
    ];
    assert.equal(calculateTotalTapeMeters(rooms), 0);
  });

  it('supports legacy item.type field (no fabricType)', () => {
    const rooms = [
      {
        solutionType: 'classic',
        corniceLength: '3',
        fabricItems: [{ type: 'curtain' }], // legacy: uses .type
      },
    ];
    assert.equal(calculateTotalTapeMeters(rooms), 7);
  });

  it('prefers item.fabricType over item.type when both present', () => {
    const rooms = [
      {
        solutionType: 'classic',
        corniceLength: '3',
        // fabricType=tulle should win over type=curtain
        fabricItems: [{ fabricType: 'tulle', type: 'curtain' }],
      },
    ];
    assert.equal(calculateTotalTapeMeters(rooms), 10); // tulle result
  });

  it('returns 0 for empty rooms array', () => {
    assert.equal(calculateTotalTapeMeters([]), 0);
  });

  it('returns 0 when classic room has no fabricItems', () => {
    const rooms = [
      { solutionType: 'classic', corniceLength: '3', fabricItems: [] },
    ];
    assert.equal(calculateTotalTapeMeters(rooms), 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 5. calculateTapeRolls & calculateHookPacks
// ─────────────────────────────────────────────────────────────

describe('calculateTapeRolls', () => {
  it('calculates rolls needed for exact multiple', () => {
    assert.equal(calculateTapeRolls(100, 50), 2);
  });

  it('rounds up for partial roll', () => {
    assert.equal(calculateTapeRolls(51, 50), 2);
  });

  it('one roll for meters less than roll size', () => {
    assert.equal(calculateTapeRolls(25, 50), 1);
  });

  it('uses default roll size of 50 when not supplied', () => {
    // 75m / 50 = 1.5 → 2
    assert.equal(calculateTapeRolls(75), 2);
  });

  it('returns 0 for 0 meters', () => {
    assert.equal(calculateTapeRolls(0, 50), 0);
  });

  it('returns 0 for negative meters', () => {
    assert.equal(calculateTapeRolls(-10, 50), 0);
  });
});

describe('calculateHookPacks', () => {
  it('calculates packs for exact multiple', () => {
    assert.equal(calculateHookPacks(200, 100), 2);
  });

  it('rounds up for partial pack', () => {
    assert.equal(calculateHookPacks(101, 100), 2);
  });

  it('one pack when fewer than pack size', () => {
    assert.equal(calculateHookPacks(50, 100), 1);
  });

  it('uses default pack size of 100 when not supplied', () => {
    assert.equal(calculateHookPacks(150), 2);
  });

  it('returns 0 for 0 hooks', () => {
    assert.equal(calculateHookPacks(0, 100), 0);
  });

  it('returns 0 for negative hooks', () => {
    assert.equal(calculateHookPacks(-5, 100), 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 6. calculateHooksQuantity
// ─────────────────────────────────────────────────────────────

describe('calculateHooksQuantity', () => {
  it('returns tapeMeters × 5', () => {
    assert.equal(calculateHooksQuantity(10), 50);
  });

  it('rounds up fractional result', () => {
    // 7.1 × 5 = 35.5 → 36
    assert.equal(calculateHooksQuantity(7.1), 36);
  });

  it('returns 0 for 0 meters', () => {
    assert.equal(calculateHooksQuantity(0), 0);
  });

  it('works for large meter values', () => {
    assert.equal(calculateHooksQuantity(100), 500);
  });
});

// ─────────────────────────────────────────────────────────────
// 7. calculateClassicRoom
// ─────────────────────────────────────────────────────────────

describe('calculateClassicRoom', () => {
  it('calculates roomTotal for a single curtain item', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [{ fabricType: 'curtain', pricePerMeter: 5000 }],
    };
    // meters = ceil(3×2+0.5) = 7
    // fabricCost = 7 × 5000 = 35 000
    // sewingTotal = 7 × DEFAULT_SEWING_RATE (1700) = 11 900
    // corniceTotal = 0 (no cornice)
    // roomTotal = 35 000 + 11 900 = 46 900
    const result = calculateClassicRoom(room);
    assert.equal(result.totalFabricMeters, 7);
    assert.equal(result.totalFabricCost, 35_000);
    assert.equal(result.sewingTotal, 7 * DEFAULT_SEWING_RATE);
    assert.equal(result.corniceTotal, 0);
    assert.equal(result.roomTotal, 35_000 + 7 * DEFAULT_SEWING_RATE);
  });

  it('calculates roomTotal for curtain + tulle combination', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [
        { fabricType: 'curtain', pricePerMeter: 4000 },
        { fabricType: 'tulle', pricePerMeter: 2000 },
      ],
    };
    // curtain: ceil(3×2+0.5)=7m → 7×4000=28 000
    // tulle:   ceil(3×3+0.5)=10m → 10×2000=20 000
    // totalMeters = 17, fabricCost = 48 000
    // sewingTotal = 17 × 1700 = 28 900
    const result = calculateClassicRoom(room);
    assert.equal(result.totalFabricMeters, 17);
    assert.equal(result.totalFabricCost, 48_000);
    assert.equal(result.sewingTotal, 17 * DEFAULT_SEWING_RATE);
    assert.equal(result.corniceTotal, 0);
    assert.equal(result.roomTotal, 48_000 + 17 * DEFAULT_SEWING_RATE);
  });

  it('includes cornice cost when cornice.needed is true', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [{ fabricType: 'curtain', pricePerMeter: 5000 }],
      cornice: { needed: true, pricePerMeter: 3000 },
    };
    // corniceTotal = 3 × 3000 = 9 000
    const result = calculateClassicRoom(room);
    assert.equal(result.corniceTotal, 9_000);
    assert.ok(result.roomTotal > 0);
    // verify it is summed into roomTotal
    const expectedCornice = 3 * 3000;
    assert.equal(
      result.roomTotal,
      result.totalFabricCost + result.sewingTotal + expectedCornice
    );
  });

  it('excludes cornice when cornice.needed is false', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [{ fabricType: 'curtain', pricePerMeter: 5000 }],
      cornice: { needed: false, pricePerMeter: 3000 },
    };
    const result = calculateClassicRoom(room);
    assert.equal(result.corniceTotal, 0);
  });

  it('uses custom sewingRate from room when provided', () => {
    const room = {
      corniceLength: '3',
      sewingRate: 2000,
      fabricItems: [{ fabricType: 'curtain', pricePerMeter: 0 }],
    };
    // meters = 7, sewingTotal = 7 × 2000 = 14 000
    const result = calculateClassicRoom(room);
    assert.equal(result.sewingTotal, 7 * 2000);
  });

  it('supports legacy item.type field instead of fabricType', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [{ type: 'curtain', pricePerMeter: 5000 }],
    };
    const result = calculateClassicRoom(room);
    assert.equal(result.totalFabricMeters, 7);
    assert.equal(result.totalFabricCost, 35_000);
  });

  it('prefers fabricType over type when both present', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [{ fabricType: 'tulle', type: 'curtain', pricePerMeter: 2000 }],
    };
    // tulle → 10m, curtain → 7m
    const result = calculateClassicRoom(room);
    assert.equal(result.totalFabricMeters, 10);
  });

  it('handles empty fabricItems', () => {
    const room = { corniceLength: '3', fabricItems: [] };
    const result = calculateClassicRoom(room);
    assert.equal(result.totalFabricMeters, 0);
    assert.equal(result.totalFabricCost, 0);
    assert.equal(result.sewingTotal, 0);
    assert.equal(result.roomTotal, 0);
  });

  it('handles zero corniceLength', () => {
    const room = {
      corniceLength: '0',
      fabricItems: [{ fabricType: 'curtain', pricePerMeter: 5000 }],
    };
    // calculateFabricMeters(0,'curtain') = ceil(0+0.5) = 1
    const result = calculateClassicRoom(room);
    assert.ok(result.totalFabricMeters >= 0); // does not throw
  });

  it('handles missing pricePerMeter (defaults to 0)', () => {
    const room = {
      corniceLength: '3',
      fabricItems: [{ fabricType: 'curtain' }],
    };
    const result = calculateClassicRoom(room);
    assert.equal(result.totalFabricCost, 0);
    assert.equal(result.roomTotal, result.sewingTotal);
  });
});

// ─────────────────────────────────────────────────────────────
// 8. calculateJalousieRoom
// ─────────────────────────────────────────────────────────────

describe('calculateJalousieRoom', () => {
  it('calculates area × pricePerSqm for aluminum material', () => {
    const aluminumPrice = JALOUSIE_MATERIALS.find(m => m.id === 'aluminum').pricePerSqm;
    const room = { width: '2', height: '1.5', material: 'aluminum' };
    const result = calculateJalousieRoom(room);
    assertClose(result.area, 3.0);
    assert.equal(result.productTotal, Math.round(3.0 * aluminumPrice));
    assert.equal(result.installTotal, 0);
    assert.equal(result.roomTotal, result.productTotal);
  });

  it('calculates area × pricePerSqm for wood material', () => {
    const woodPrice = JALOUSIE_MATERIALS.find(m => m.id === 'wood').pricePerSqm;
    const room = { width: '2', height: '2', material: 'wood' };
    const result = calculateJalousieRoom(room);
    assert.equal(result.productTotal, Math.round(4 * woodPrice));
  });

  it('calculates area × pricePerSqm for plastic material', () => {
    const plasticPrice = JALOUSIE_MATERIALS.find(m => m.id === 'plastic').pricePerSqm;
    const room = { width: '1', height: '1', material: 'plastic' };
    const result = calculateJalousieRoom(room);
    assert.equal(result.productTotal, Math.round(1 * plasticPrice));
  });

  it('adds installation cost when installation.needed is true', () => {
    const room = {
      width: '2',
      height: '1.5',
      material: 'aluminum',
      installation: { needed: true, price: 5000 },
    };
    const result = calculateJalousieRoom(room);
    assert.equal(result.installTotal, 5000);
    assert.equal(result.roomTotal, result.productTotal + 5000);
  });

  it('uses default installation price of 3000 when price not specified', () => {
    const room = {
      width: '2',
      height: '1.5',
      material: 'aluminum',
      installation: { needed: true },
    };
    const result = calculateJalousieRoom(room);
    assert.equal(result.installTotal, 3000);
  });

  it('excludes installation when installation.needed is false', () => {
    const room = {
      width: '2',
      height: '1.5',
      material: 'aluminum',
      installation: { needed: false, price: 5000 },
    };
    const result = calculateJalousieRoom(room);
    assert.equal(result.installTotal, 0);
  });

  it('defaults to aluminum when material not specified', () => {
    const aluminumPrice = JALOUSIE_MATERIALS.find(m => m.id === 'aluminum').pricePerSqm;
    const room = { width: '2', height: '1.5' };
    const result = calculateJalousieRoom(room);
    assertClose(result.area, 3.0);
    assert.equal(result.productTotal, Math.round(3.0 * aluminumPrice));
  });

  it('handles zero dimensions gracefully', () => {
    const room = { width: '0', height: '0', material: 'aluminum' };
    const result = calculateJalousieRoom(room);
    assert.equal(result.area, 0);
    assert.equal(result.productTotal, 0);
    assert.equal(result.roomTotal, 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 9. calculateZebraRoom
// ─────────────────────────────────────────────────────────────

describe('calculateZebraRoom', () => {
  it('calculates area × pricePerSqm for open system', () => {
    const openPrice = ZEBRA_SYSTEMS.find(s => s.id === 'open').pricePerSqm;
    const room = { width: '2', height: '1.5', system: 'open' };
    const result = calculateZebraRoom(room);
    assertClose(result.area, 3.0);
    assert.equal(result.productTotal, Math.round(3.0 * openPrice));
    assert.equal(result.installTotal, 0);
    assert.equal(result.roomTotal, result.productTotal);
  });

  it('calculates area × pricePerSqm for cassette system', () => {
    const cassettePrice = ZEBRA_SYSTEMS.find(s => s.id === 'cassette').pricePerSqm;
    const room = { width: '2', height: '2', system: 'cassette' };
    const result = calculateZebraRoom(room);
    assert.equal(result.productTotal, Math.round(4 * cassettePrice));
  });

  it('adds installation when installation.needed is true', () => {
    const room = {
      width: '2',
      height: '1.5',
      system: 'open',
      installation: { needed: true, price: 4500 },
    };
    const result = calculateZebraRoom(room);
    assert.equal(result.installTotal, 4500);
    assert.equal(result.roomTotal, result.productTotal + 4500);
  });

  it('uses default installation price of 4000 when price not specified', () => {
    const room = {
      width: '2',
      height: '1.5',
      system: 'open',
      installation: { needed: true },
    };
    const result = calculateZebraRoom(room);
    assert.equal(result.installTotal, 4000);
  });

  it('excludes installation when installation.needed is false', () => {
    const room = {
      width: '2',
      height: '1.5',
      system: 'open',
      installation: { needed: false, price: 4500 },
    };
    const result = calculateZebraRoom(room);
    assert.equal(result.installTotal, 0);
  });

  it('defaults to open system when system not specified', () => {
    const openPrice = ZEBRA_SYSTEMS.find(s => s.id === 'open').pricePerSqm;
    const room = { width: '2', height: '1.5' };
    const result = calculateZebraRoom(room);
    assert.equal(result.productTotal, Math.round(3.0 * openPrice));
  });

  it('handles zero dimensions gracefully', () => {
    const room = { width: '0', height: '0', system: 'open' };
    const result = calculateZebraRoom(room);
    assert.equal(result.area, 0);
    assert.equal(result.productTotal, 0);
    assert.equal(result.roomTotal, 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 10. calculateRomanRoom
// ─────────────────────────────────────────────────────────────

describe('calculateRomanRoom', () => {
  it('sets romanWidth = width + 0.1', () => {
    const room = { width: '2' };
    const result = calculateRomanRoom(room);
    assertClose(result.romanWidth, 2.1);
  });

  it('calculates fabricTotal = romanWidth × pricePerMeter', () => {
    const room = {
      width: '2',
      fabric: { pricePerMeter: 10000 },
    };
    const result = calculateRomanRoom(room);
    // romanWidth = 2.1, fabricTotal = 2.1 × 10000 = 21 000
    assertClose(result.fabricTotal, 21_000);
  });

  it('uses chain mechanism price', () => {
    const chainPrice = ROMAN_MECHANISMS.find(m => m.id === 'chain').price;
    const room = { width: '2', mechanism: 'chain' };
    const result = calculateRomanRoom(room);
    assert.equal(result.mechanismTotal, chainPrice);
  });

  it('uses motor mechanism price', () => {
    const motorPrice = ROMAN_MECHANISMS.find(m => m.id === 'motor').price;
    const room = { width: '2', mechanism: 'motor' };
    const result = calculateRomanRoom(room);
    assert.equal(result.mechanismTotal, motorPrice);
  });

  it('uses 0 for mechanismTotal when no mechanism specified', () => {
    const room = { width: '2' };
    const result = calculateRomanRoom(room);
    assert.equal(result.mechanismTotal, 0);
  });

  it('uses default system price of 12000 when room.system not provided', () => {
    const room = { width: '2' };
    const result = calculateRomanRoom(room);
    assert.equal(result.systemTotal, 12_000);
  });

  it('uses room.system.price when provided', () => {
    const room = { width: '2', system: { price: 8000 } };
    const result = calculateRomanRoom(room);
    assert.equal(result.systemTotal, 8000);
  });

  it('uses default sewing cost of 8000 when room.sewing not provided', () => {
    const room = { width: '2' };
    const result = calculateRomanRoom(room);
    assert.equal(result.sewingTotal, 8000);
  });

  it('uses room.sewing when provided', () => {
    const room = { width: '2', sewing: 12000 };
    const result = calculateRomanRoom(room);
    assert.equal(result.sewingTotal, 12000);
  });

  it('adds installation when installation.needed is true', () => {
    const room = { width: '2', installation: { needed: true, price: 5000 } };
    const result = calculateRomanRoom(room);
    assert.equal(result.installTotal, 5000);
  });

  it('uses default installation price of 4000 when price not specified', () => {
    const room = { width: '2', installation: { needed: true } };
    const result = calculateRomanRoom(room);
    assert.equal(result.installTotal, 4000);
  });

  it('computes correct roomTotal as sum of all components', () => {
    const room = {
      width: '2',
      fabric: { pricePerMeter: 10000 },
      mechanism: 'chain',
      system: { price: 8000 },
      sewing: 9000,
      installation: { needed: true, price: 3000 },
    };
    const result = calculateRomanRoom(room);
    const expected =
      result.fabricTotal +
      result.mechanismTotal +
      result.systemTotal +
      result.sewingTotal +
      result.installTotal;
    assert.equal(result.roomTotal, expected);
  });

  it('handles zero width gracefully', () => {
    const room = { width: '0' };
    const result = calculateRomanRoom(room);
    assertClose(result.romanWidth, 0.1);
    assert.equal(result.fabricTotal, 0);
  });
});

// ─────────────────────────────────────────────────────────────
// 11. calculateMeasurementTotal
// ─────────────────────────────────────────────────────────────

describe('calculateMeasurementTotal', () => {
  // A minimal classic room for reuse
  const makeClassicRoom = (corniceLength = '3', pricePerMeter = 5000) => ({
    solutionType: 'classic',
    corniceLength,
    fabricItems: [{ fabricType: 'curtain', pricePerMeter }],
  });

  it('grandTotal equals roomsTotal + accessoriesTotal + installationTotal + deliveryTotal', () => {
    const rooms = [makeClassicRoom()];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(
      result.grandTotal,
      result.roomsTotal + result.accessoriesTotal + result.installationTotal + result.deliveryTotal
    );
  });

  it('sums classic room costs into roomsTotal', () => {
    const rooms = [makeClassicRoom('3', 5000)];
    const result = calculateMeasurementTotal(rooms, {}, {});
    const roomCalc = calculateClassicRoom(rooms[0]);
    assert.equal(result.roomsTotal, roomCalc.roomTotal);
  });

  it('sums jalousie room costs into roomsTotal', () => {
    const aluminumPrice = JALOUSIE_MATERIALS.find(m => m.id === 'aluminum').pricePerSqm;
    const rooms = [{ solutionType: 'jalousie_h', width: '2', height: '1.5', material: 'aluminum' }];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.roomsTotal, Math.round(3 * aluminumPrice));
  });

  it('sums zebra room costs into roomsTotal', () => {
    const openPrice = ZEBRA_SYSTEMS.find(s => s.id === 'open').pricePerSqm;
    const rooms = [{ solutionType: 'zebra', width: '2', height: '1.5', system: 'open' }];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.roomsTotal, Math.round(3 * openPrice));
  });

  it('sums roman room costs into roomsTotal', () => {
    const rooms = [{ solutionType: 'roman', width: '2' }];
    const result = calculateMeasurementTotal(rooms, {}, {});
    const roomCalc = calculateRomanRoom(rooms[0]);
    assert.equal(result.roomsTotal, roomCalc.roomTotal);
  });

  it('sums multiple rooms of different types', () => {
    const rooms = [
      makeClassicRoom(),
      { solutionType: 'jalousie_v', width: '2', height: '1.5', material: 'aluminum' },
    ];
    const result = calculateMeasurementTotal(rooms, {}, {});
    const classicCalc = calculateClassicRoom(rooms[0]);
    const jalousieCalc = calculateJalousieRoom(rooms[1]);
    assert.equal(result.roomsTotal, classicCalc.roomTotal + jalousieCalc.roomTotal);
  });

  it('returns 0 roomsTotal for unknown solutionType', () => {
    const rooms = [{ solutionType: 'unknown' }];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.roomsTotal, 0);
  });

  it('computes accessoriesTotal using default tape roll (50m) and plastic hooks', () => {
    const rooms = [makeClassicRoom('3')]; // 7 tape meters
    const result = calculateMeasurementTotal(rooms, {}, {});

    // Tape: ceil(7/50)=1 roll × 8000 = 8000
    const tapeRolls = Math.ceil(7 / 50);
    const tapeTotal = tapeRolls * TAPE_ROLLS[2].price;

    // Hooks: ceil(7×5)=35 hooks → ceil(35/100)=1 pack × 500
    const hooksQty = Math.ceil(7 * 5);
    const hookPacks = Math.ceil(hooksQty / 100);
    const hooksTotal = hookPacks * HOOK_TYPES[0].pricePerPack;

    assert.equal(result.accessoriesTotal, tapeTotal + hooksTotal);
  });

  it('includes extras in accessoriesTotal', () => {
    const rooms = [makeClassicRoom()];
    const extras = [{ total: 3000 }, { total: 2000 }];
    const result = calculateMeasurementTotal(rooms, { extras }, {});
    // base accessories + 5000 extras
    const baseResult = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.accessoriesTotal, baseResult.accessoriesTotal + 5000);
  });

  it('accessoriesTotal is 0 when no classic rooms exist', () => {
    const rooms = [{ solutionType: 'jalousie_h', width: '1', height: '1', material: 'aluminum' }];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.accessoriesTotal, 0);
  });

  it('calculates installationTotal per-room when installationMethod is per_room', () => {
    const rooms = [makeClassicRoom(), makeClassicRoom()];
    const settings = { installationMethod: 'per_room', installationRatePerRoom: 5000 };
    const result = calculateMeasurementTotal(rooms, {}, settings);
    assert.equal(result.installationTotal, 2 * 5000);
  });

  it('uses default per-room rate of 5000 when not specified', () => {
    const rooms = [makeClassicRoom()];
    const settings = { installationMethod: 'per_room' };
    const result = calculateMeasurementTotal(rooms, {}, settings);
    assert.equal(result.installationTotal, 5000);
  });

  it('calculates installationTotal per-meter (default) using totalCorniceMeters', () => {
    // corniceLength 3m room → installationByMeter = round(3 × 1000) = 3000
    const rooms = [makeClassicRoom('3')];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.installationTotal, Math.round(3 * 1000));
  });

  it('respects custom installationRatePerMeter', () => {
    const rooms = [makeClassicRoom('3')];
    const settings = { installationRatePerMeter: 2000 };
    const result = calculateMeasurementTotal(rooms, {}, settings);
    assert.equal(result.installationTotal, Math.round(3 * 2000));
  });

  it('includes delivery in grandTotal', () => {
    const rooms = [makeClassicRoom()];
    const settings = { delivery: 10000 };
    const result = calculateMeasurementTotal(rooms, {}, settings);
    assert.equal(result.deliveryTotal, 10000);
    assert.equal(result.grandTotal, result.roomsTotal + result.accessoriesTotal + result.installationTotal + 10000);
  });

  it('returns zero delivery when not specified', () => {
    const rooms = [makeClassicRoom()];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.deliveryTotal, 0);
  });

  it('handles empty rooms array', () => {
    const result = calculateMeasurementTotal([], {}, {});
    assert.equal(result.roomsTotal, 0);
    assert.equal(result.accessoriesTotal, 0);
    assert.equal(result.grandTotal, 0);
  });

  it('tracks totalCorniceMeters only for classic rooms', () => {
    const rooms = [
      makeClassicRoom('4'),
      { solutionType: 'jalousie_h', width: '2', height: '1', material: 'aluminum' },
    ];
    const result = calculateMeasurementTotal(rooms, {}, {});
    assert.equal(result.totalCorniceMeters, 4);
  });
});

// ─────────────────────────────────────────────────────────────
// 12. formatPrice
// ─────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('appends the ₸ symbol', () => {
    const result = formatPrice(1000);
    assert.ok(result.includes('₸'), `expected ₸ in "${result}"`);
  });

  it('rounds floating point values before formatting', () => {
    const result1 = formatPrice(999.4);
    const result2 = formatPrice(999.6);
    // 999.4 rounds to 999, 999.6 rounds to 1000 — they must differ
    assert.notEqual(result1, result2);
  });

  it('formats 0 correctly', () => {
    const result = formatPrice(0);
    assert.ok(result.includes('₸'));
    assert.ok(result.includes('0'));
  });

  it('formats negative values without throwing', () => {
    assert.doesNotThrow(() => formatPrice(-500));
  });

  it('handles very large values without throwing', () => {
    assert.doesNotThrow(() => formatPrice(999_999_999));
  });

  it('returns a string', () => {
    assert.equal(typeof formatPrice(5000), 'string');
  });
});
