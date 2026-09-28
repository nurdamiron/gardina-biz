/**
 * Unit tests for roomEstimate.js
 * Run with: node --test src/utils/roomEstimate.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRoomEstimate, roomFromWindow } from './roomEstimate.js';

// Real case from the demo salon: bedroom, cornice 3.2 m, blackout 4 800 ₸/m, default rates.
const bedroom = {
  name: 'Спальня',
  solutionType: 'classic',
  corniceLength: '3.2',
  fabricItems: [{ fabricName: 'Блэкаут «Антрацит»', fabricType: 'curtain', pricePerMeter: 4800 }],
};

test('classic room: fabric + sewing + tape + hooks + installation', () => {
  const { total, lines } = calculateRoomEstimate(bedroom);
  const byType = Object.fromEntries(lines.map((l) => [l.type, l.total]));
  assert.equal(byType.fabric, 33600); // ceil(3.2*2+0.5)=7 m × 4800
  assert.equal(byType.sewing, 11900); // 7 m × 1700
  assert.equal(byType.tape, 8000); // one 50 m roll
  assert.equal(byType.hooks, 500); // one plastic pack
  assert.equal(byType.installation, 4800); // 3.2 m × 1500
  assert.equal(total, 58800);
});

test('saved window (mm + priceBreakdown) gives the same total as the form', () => {
  const window = {
    id: 'w1',
    roomName: 'Спальня',
    dimensions: { width: 3200, height: 2700 },
    priceBreakdown: { solutionType: 'classic', fabricItems: bedroom.fabricItems },
  };
  assert.equal(calculateRoomEstimate(roomFromWindow(window)).total, 58800);
});

test('custom sewing and installation rates are respected', () => {
  const { total } = calculateRoomEstimate({ ...bedroom, sewingRate: '2000', installationRate: '0' });
  assert.equal(total, 33600 + 7 * 2000 + 8000 + 500);
});

test('empty room costs nothing', () => {
  assert.equal(calculateRoomEstimate({ solutionType: 'classic', corniceLength: '', fabricItems: [] }).total, 0);
});
