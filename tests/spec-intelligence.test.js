import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../shared/domain.js';
import { enrichProductSpecs, batchEnrichCatalog, MODEL_KNOWLEDGE_BASE } from '../shared/spec-intelligence.js';

test('Spec intelligence extracts technical specifications from product text and models', () => {
  const rawProduct = {
    code: 'HMG168',
    name: 'Máy xay thịt đa năng',
    brand: 'Haatz',
    category: 'Đồ điện',
    description: '• Công suất: 500W • Điện áp: 220V • Dung tích: Cối inox 2.5L; Cối thuỷ tinh 0,75L'
  };

  const enriched = enrichProductSpecs(rawProduct);
  assert.equal(enriched.power, '500 W');
  assert.equal(enriched.voltage, '220V / 50Hz');
  assert.equal(enriched.capacity, '2.5 L');
  assert.ok(enriched.material.includes('Inox 304'));
  assert.ok(enriched.features.includes('Máy xay thịt'));
  assert.equal(enriched.warranty, 12);
});

test('Spec intelligence provides 24 months warranty and Inox 316 for Lock&King by default', () => {
  const lkProduct = {
    code: 'LK-3024',
    name: 'Nồi lẻ Lock&king 24cm',
    brand: 'Lock&King',
    category: 'Dụng cụ nhà bếp'
  };

  const enriched = enrichProductSpecs(lkProduct);
  assert.equal(enriched.warranty, 24);
  assert.equal(enriched.dimensions, '24 cm');
  assert.equal(enriched.capacity, '4.5 L');
  assert.ok(enriched.material.includes('Inox 316'));
});

test('findRivalMatches automatically finds matching products from rival brands for Lock&King', () => {
  const catalog = [
    { id: 'lk-1', code: 'LK-ST18', brand: 'Lock&King', name: 'Ấm siêu tốc 1.8L', category: 'Ấm & bình', capacity: '1.8 L', power: '1500 W', online: 450000 },
    { id: 'hr-1', code: 'HR-EK1801', brand: 'Hare', name: 'Ấm siêu tốc 1.8L', category: 'Ấm & bình', capacity: '1.8 L', power: '1500 W', online: 420000 },
    { id: 'kl-1', code: 'KL-268', brand: 'Kailer', name: 'Ấm siêu tốc thủy tinh 1.8L', category: 'Ấm & bình', capacity: '1.8 L', power: '1800 W', online: 490000 },
    { id: 'lk-2', code: 'LK-3024', brand: 'Lock&King', name: 'Nồi lẻ 24cm', category: 'Dụng cụ nhà bếp' }
  ];

  const lk = catalog[0];
  const rivals = D.findRivalMatches(lk, catalog, 3);
  
  assert.ok(rivals.length >= 2);
  assert.ok(rivals.every(r => !D.own(r.product)));
  assert.ok(rivals.some(r => r.product.brand === 'Hare'));
  assert.ok(rivals.some(r => r.product.brand === 'Kailer'));
});
