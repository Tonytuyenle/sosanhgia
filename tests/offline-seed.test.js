import test from 'node:test';
import assert from 'node:assert/strict';
import {createOfflineState, hydrateOfflineState, applyManualSeed} from '../shared/offline-seed.js';

const item = {id: 'hare1', brand: 'Hare', code: 'HR-CD1208', distributorPrice: 690000, source: 'BẢNG GIÁ HARE', priceHistory: []};
const seed = {products: [item], brands: [{name: 'Hare'}], images: {'/api/assets/hare.jpg': 'data:image/jpeg;base64,AA=='}};

test('Edited quote prices and price history survive reload and JSON backup restoration', () => {
  const state = createOfflineState(seed);
  state.products = [{...item, distributorPrice: 700000, image: 'my-image', priceHistory: [{at: 'today'}]}];
  const restored = JSON.parse(JSON.stringify(state));
  const next = hydrateOfflineState(restored, seed);
  assert.equal(next.changed, false);
  assert.deepEqual(next.state.products, state.products);
});

test('Deleting every seeded product remains effective after reopening', () => {
  const state = {...createOfflineState(seed), products: []};
  assert.deepEqual(hydrateOfflineState(state, seed).state.products, []);
  const renamedId = {...seed, products: [{...item, id: 'new-source-id'}]};
  assert.deepEqual(hydrateOfflineState(state, renamedId).state.products, []);
});

test('An upgraded catalog adds genuinely new codes once and preserves local edits and deletions', () => {
  const state = {...createOfflineState(seed), products: []};
  const newItem = {...item, id: 'hare2', code: 'HR-NEW'};
  const upgraded = {...seed, products: [item, newItem]};
  const next = hydrateOfflineState(state, upgraded);
  assert.equal(next.added, 1);
  assert.deepEqual(next.state.products, [newItem]);
  assert.equal(hydrateOfflineState(next.state, upgraded).added, 0);
  const edited = {...next.state, products: [{...newItem, distributorPrice: 888000}]};
  assert.equal(hydrateOfflineState(edited, upgraded).state.products[0].distributorPrice, 888000);
});

test('Legacy snapshots establish a baseline without restoring missing products or overwriting values', () => {
  const legacy = {products: [{...item, distributorPrice: 123000}], brands: [], images: {}};
  const upgraded = {...seed, products: [item, {...item, id: 'other', code: 'OTHER'}]};
  const first = hydrateOfflineState(legacy, upgraded);
  assert.equal(first.state.products.length, 1);
  assert.equal(first.state.products[0].distributorPrice, 123000);
  assert.equal(first.state.seedSync.productIds.length, 2);
  assert.equal(hydrateOfflineState(first.state, upgraded).changed, false);
  assert.deepEqual(hydrateOfflineState({products: []}, upgraded).state.products, []);
});

test('Manual sync can intentionally restore deleted products and update values without breaking local IDs', () => {
  const saved = {...createOfflineState(seed), products: [{...item, id: 'local-hare', distributorPrice: 123000}]};
  const updated = applyManualSeed(saved, seed);
  assert.equal(updated.products.length, 1);
  assert.equal(updated.products[0].id, 'local-hare');
  assert.equal(updated.products[0].distributorPrice, 690000);
  assert.deepEqual(applyManualSeed({...saved, products: []}, seed).products, [item]);
  assert.deepEqual(applyManualSeed(saved, seed, true).products, [item]);
});

test('Adding embedded images alone persists them without replacing existing local image content', () => {
  const saved = createOfflineState({...seed, images: {}});
  const next = hydrateOfflineState(saved, seed);
  assert.equal(next.changed, true);
  assert.deepEqual(next.state.images, seed.images);
  const custom = {...saved, images: {'/api/assets/hare.jpg': 'custom-data'}};
  assert.equal(hydrateOfflineState(custom, seed).state.images['/api/assets/hare.jpg'], 'custom-data');
});
