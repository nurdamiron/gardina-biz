/**
 * Single source of truth for a room's estimate.
 *
 * The estimate the designer sends to the client (MeasurementSummary), the room card in the
 * measurement form and the payments page (MeasurementDetails) used to compute totals with
 * three different formulas, so one room could show 58 800 ₸, 45 500 ₸ and 54 300 ₸ at once.
 * All of them now call calculateRoomEstimate().
 */
import {
  calculateTapeRolls,
  calculateHooksQuantity,
  calculateHookPacks,
  TAPE_ROLLS,
  HOOK_TYPES,
  JALOUSIE_MATERIALS,
  ZEBRA_SYSTEMS,
} from './calculations.js';

const FABRIC_COEFFICIENTS = { curtain: 2, tulle: 3 };
export const DEFAULT_SEWING_RATE = 1700;
export const DEFAULT_INSTALLATION_RATE = 1500;

const num = (v, fallback) => (v !== undefined && v !== null && v !== '' && !isNaN(parseInt(v, 10)) ? parseInt(v, 10) : fallback);

export const fabricMeters = (corniceLength, item) => {
  const coefficient = FABRIC_COEFFICIENTS[item.fabricType || item.type] || 2;
  return Math.ceil(corniceLength * coefficient + 0.5);
};

/**
 * @returns {{ total: number, lines: Array<{ type: string, qty: number, unit: string, price: number, total: number, meta?: object }> }}
 * Line types: fabric, sewing, cornice, tape, hooks, extra, installation, product, mechanism, system.
 * Units: m, roll, pack, piece, sqm.
 */
export const calculateRoomEstimate = (room) => {
  const lines = [];
  const add = (line) => { if (line.total > 0) lines.push(line); };

  if (room.solutionType === 'classic' || !room.solutionType) {
    const cornice = parseFloat(room.corniceLength) || 0;
    const sewingRate = num(room.sewingRate, DEFAULT_SEWING_RATE);
    const installationRate = num(room.installationRate, DEFAULT_INSTALLATION_RATE);

    let fabricTotalMeters = 0;
    (room.fabricItems || []).forEach((item) => {
      const meters = fabricMeters(cornice, item);
      fabricTotalMeters += meters;
      add({ type: 'fabric', qty: meters, unit: 'm', price: item.pricePerMeter || 0, total: meters * (item.pricePerMeter || 0),
        meta: { name: item.fabricName || item.fabricCode || '' } });
    });

    add({ type: 'sewing', qty: fabricTotalMeters, unit: 'm', price: sewingRate, total: fabricTotalMeters * sewingRate });

    if (room.cornice?.needed) {
      const price = room.cornice?.pricePerMeter || 0;
      add({ type: 'cornice', qty: cornice, unit: 'm', price, total: cornice * price, meta: { name: room.cornice?.name } });
    }

    if (fabricTotalMeters > 0) {
      const roll = TAPE_ROLLS.find((t) => t.id === room.tape?.rollId) || TAPE_ROLLS[2];
      const rolls = calculateTapeRolls(fabricTotalMeters, roll.meters);
      add({ type: 'tape', qty: rolls, unit: 'roll', price: roll.price, total: rolls * roll.price, meta: { rollMeters: roll.meters } });

      const hook = HOOK_TYPES.find((h) => h.id === room.hooks?.type) || HOOK_TYPES[0];
      const packs = calculateHookPacks(calculateHooksQuantity(fabricTotalMeters), hook.qtyPerPack);
      add({ type: 'hooks', qty: packs, unit: 'pack', price: hook.pricePerPack, total: packs * hook.pricePerPack });
    }

    (room.extras || []).forEach((extra) => {
      add({ type: 'extra', qty: extra.quantity || 1, unit: extra.unit || 'piece', price: extra.pricePerUnit || 0, total: extra.total || 0,
        meta: { name: extra.name } });
    });

    add({ type: 'installation', qty: cornice, unit: 'm', price: installationRate, total: cornice * installationRate });
  } else if (room.solutionType === 'jalousie_h' || room.solutionType === 'jalousie_v') {
    const area = parseFloat(((parseFloat(room.width) || 0) * (parseFloat(room.height) || 0)).toFixed(2));
    const material = JALOUSIE_MATERIALS.find((m) => m.id === (room.material || 'aluminum'));
    const price = material?.pricePerSqm || 8500;
    add({ type: 'product', qty: area, unit: 'sqm', price, total: Math.round(area * price), meta: { solutionType: room.solutionType } });
    if (room.installation?.needed) {
      const p = room.installation?.price || 4000;
      add({ type: 'installation', qty: 1, unit: 'piece', price: p, total: p });
    }
  } else if (room.solutionType === 'zebra') {
    const area = parseFloat(((parseFloat(room.width) || 0) * (parseFloat(room.height) || 0)).toFixed(2));
    const system = ZEBRA_SYSTEMS.find((s) => s.id === (room.system || 'open'));
    const price = system?.pricePerSqm || 6500;
    add({ type: 'product', qty: area, unit: 'sqm', price, total: Math.round(area * price), meta: { solutionType: 'zebra', name: system?.name } });
    if (room.installation?.needed) {
      const p = room.installation?.price || 4000;
      add({ type: 'installation', qty: 1, unit: 'piece', price: p, total: p });
    }
  } else if (room.solutionType === 'roman') {
    const romanWidth = parseFloat(((parseFloat(room.width) || 0) + 0.1).toFixed(2));
    const quantity = room.quantity || 1;
    const fabricPrice = room.fabric?.pricePerMeter || 0;
    add({ type: 'fabric', qty: romanWidth * quantity, unit: 'm', price: fabricPrice,
      total: parseFloat((romanWidth * fabricPrice * quantity).toFixed(2)), meta: { name: room.fabric?.name || room.fabric?.fabricName || '' } });
    const mech = room.mechanism === 'motor' ? 25000 : 5000;
    add({ type: 'mechanism', qty: quantity, unit: 'piece', price: mech, total: mech * quantity });
    add({ type: 'system', qty: quantity, unit: 'piece', price: 12000, total: 12000 * quantity });
    add({ type: 'sewing', qty: quantity, unit: 'piece', price: 8000, total: 8000 * quantity });
    if (room.installation?.needed) {
      const p = room.installation?.price || 4000;
      add({ type: 'installation', qty: 1, unit: 'piece', price: p, total: p });
    }
  }

  return { total: lines.reduce((sum, l) => sum + l.total, 0), lines };
};

/** Saved measurement window (sizes in mm, details in priceBreakdown) -> room shape used by the forms. */
export const roomFromWindow = (w) => {
  const pb = w.priceBreakdown || {};
  const widthMm = w.dimensions?.width || w.dimensions?.widthCenter || 0;
  const heightMm = w.dimensions?.height || w.dimensions?.heightCenter || 0;
  const m = (mm) => (mm > 0 ? (mm / 1000).toString() : '');
  return {
    id: w.id,
    name: w.roomName,
    solutionType: w.solutionType || pb.solutionType || 'classic',
    corniceLength: m(widthMm),
    ceilingHeight: m(heightMm),
    fabricItems: pb.fabricItems || [],
    sewingRate: pb.sewingRate,
    cornice: pb.cornice || { needed: false },
    tape: pb.tape || {},
    hooks: pb.hooks || {},
    extras: pb.extras || [],
    installationRate: pb.installationRate,
    width: m(widthMm),
    height: m(heightMm),
    material: pb.material || 'aluminum',
    slat: pb.slat || 25,
    system: pb.system || 'open',
    color: pb.color || '',
    mechanism: pb.mechanism || 'chain',
    fabric: pb.fabric || {},
    installation: pb.installation || { needed: false },
    sewing: pb.sewing,
    quantity: pb.quantity || 1,
    photos: w.designPhotos || [],
  };
};

const LINE_LABEL = {
  fabric: ['measurements.estimate.fabrics', 'Маталар'],
  sewing: ['measurements.estimate.sewing', 'Тігу'],
  cornice: ['measurements.estimate.cornice', 'Карниз'],
  tape: ['measurements.estimate.tape', 'Таспа'],
  hooks: ['measurements.estimate.hooks', 'Ілгектер'],
  extra: ['measurements.estimate.extras', 'Қосымша'],
  installation: ['measurements.estimate.installation', 'Орнату'],
  mechanism: ['measurements.estimate.mechanism', 'Механизм'],
  system: ['measurements.estimate.system', 'Жүйе/Карниз'],
};

export const unitLabel = (unit, t) => t(`measurements.units.${unit}`, { m: 'м', roll: 'рулон', pack: 'қап', piece: 'дн', sqm: 'м²' }[unit] || unit);

/** Human label for an estimate line in the current UI language. */
export const estimateLineName = (line, t) => {
  if (line.type === 'product') {
    const key = line.meta?.solutionType || 'product';
    const base = t(`measurements.estimate.${key}`, key);
    return line.meta?.name ? `${base} ${line.meta.name}` : base;
  }
  if ((line.type === 'fabric' || line.type === 'extra') && line.meta?.name) return line.meta.name;
  if (line.type === 'cornice' && line.meta?.name) return line.meta.name;
  const [key, fallback] = LINE_LABEL[line.type] || [line.type, line.type];
  return t(key, fallback);
};
