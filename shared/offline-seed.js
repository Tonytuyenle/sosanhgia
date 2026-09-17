import {defaultWeights, norm} from './domain.js';
import {initialBrands, brandKey} from './brands.js';

const productKey = p => p.brand && p.code ? `${brandKey(p.brand)}::${norm(p.code)}` : '';
const seedBrands = seed => seed.brands || initialBrands.map(name => ({name}));
const validTracking = state => state.seedSync?.version === 1 &&
  Array.isArray(state.seedSync.productIds) && Array.isArray(state.seedSync.productKeys);

function tracking(state, products) {
  const ids = new Set(validTracking(state) ? state.seedSync.productIds : []);
  const keys = new Set(validTracking(state) ? state.seedSync.productKeys : []);
  for (const p of products) {
    if (p.id) ids.add(p.id);
    const key = productKey(p);
    if (key) keys.add(key);
  }
  return {version: 1, productIds: [...ids], productKeys: [...keys]};
}

function mergeBrands(current, incoming) {
  const result = [...(current || [])];
  const known = new Set(result.map(b => brandKey(typeof b === 'string' ? b : b.name)));
  for (const b of incoming) {
    const name = typeof b === 'string' ? b : b.name;
    if (name && !known.has(brandKey(name))) {
      result.push(typeof b === 'string' ? {name} : b);
      known.add(brandKey(name));
    }
  }
  return result;
}

export function createOfflineState(seed = {}) {
  const products = seed.products || [];
  return {
    products, brands: seedBrands(seed), images: seed.images || {},
    matches: seed.matches || [], weights: seed.weights || defaultWeights,
    opportunities: seed.opportunities || [], proposals: seed.proposals || [],
    follows: seed.follows || [], imports: seed.imports || [],
    seedSync: tracking({}, products)
  };
}

// Remember every seed identity, including products the user subsequently deletes.
// A legacy snapshot has no deletion history: keep its catalog and establish a
// baseline instead of guessing whether missing products were intentionally removed.
export function hydrateOfflineState(saved, seed = {}) {
  if (!saved) return {state: createOfflineState(seed), changed: true, added: 0};
  const incoming = seed.products || [];
  const products = [...(saved.products || [])];
  const ids = new Set(products.map(p => p.id).filter(Boolean));
  const keys = new Set(products.map(productKey).filter(Boolean));
  let added = 0;
  if (validTracking(saved)) {
    const seenIds = new Set(saved.seedSync.productIds);
    const seenKeys = new Set(saved.seedSync.productKeys);
    for (const p of incoming) {
      const key = productKey(p);
      if (ids.has(p.id) || (key && keys.has(key)) || seenIds.has(p.id) || (key && seenKeys.has(key))) continue;
      products.push(p);
      if (p.id) ids.add(p.id);
      if (key) keys.add(key);
      added++;
    }
  }
  const brands = mergeBrands(saved.brands, seedBrands(seed));
  const images = {...(seed.images || {}), ...(saved.images || {})};
  const seedSync = tracking(saved, incoming);
  const changed = added > 0 || brands.length !== (saved.brands || []).length ||
    Object.keys(images).length !== Object.keys(saved.images || {}).length ||
    JSON.stringify(seedSync) !== JSON.stringify(saved.seedSync);
  return {state: changed ? {...saved, products, brands, images, seedSync} : saved, changed, added};
}

// Caller must obtain confirmation: this operation intentionally applies the
// supplied catalog's values to existing products, unlike automatic hydration.
export function applyManualSeed(saved, seed = {}, reset = false) {
  const incoming = seed.products || [];
  if (reset) return {
    ...saved, products: incoming, brands: seedBrands(seed), images: seed.images || {},
    seedSync: tracking(saved, incoming)
  };
  const products = [...saved.products];
  const ids = new Map(products.map((p, i) => [p.id, i]));
  const keys = new Map(products.map((p, i) => [productKey(p), i]).filter(([key]) => key));
  for (const p of incoming) {
    const key = productKey(p);
    const index = ids.get(p.id) ?? (key ? keys.get(key) : undefined);
    if (index === undefined) {
      const nextIndex = products.push(p) - 1;
      if (p.id) ids.set(p.id, nextIndex);
      if (key) keys.set(key, nextIndex);
    } else {
      products[index] = {...products[index], ...p, id: products[index].id};
    }
  }
  return {
    ...saved, products, brands: mergeBrands(saved.brands, seedBrands(seed)),
    images: {...(saved.images || {}), ...(seed.images || {})},
    seedSync: tracking(saved, incoming)
  };
}
