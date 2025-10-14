// Simple mock API: listings in-memory; saved searches in localStorage

const MOCK_LISTINGS = [
  {
    marketplace_id: 'mock_1',
    title: 'Gaming Laptop - RTX 3060',
    price: 850.0,
    city: 'Los Angeles',
    category: 'Electronics',
    image_url: 'https://picsum.photos/seed/rtx3060/800/450',
    url: 'https://facebook.com/marketplace/item/123',
    published_at: new Date(Date.now() - 2*60*60*1000).toISOString(),
    condition: 'Like New',
  },
  {
    marketplace_id: 'mock_2',
    title: 'Toyota Tacoma TRD Sport Wheels',
    price: 600.0,
    city: 'Woodland Hills',
    category: 'Vehicles',
    image_url: 'https://picsum.photos/seed/tacoma/800/450',
    url: 'https://facebook.com/marketplace/item/456',
    published_at: new Date(Date.now() - (27*60*60*1000)).toISOString(),
    condition: 'Good',
  },
  {
    marketplace_id: 'mock_3',
    title: 'Commercial Pizza Oven - Excellent',
    price: 3500.0,
    city: 'Encino',
    category: 'Appliances',
    image_url: 'https://picsum.photos/seed/pizzaoven/800/450',
    url: 'https://facebook.com/marketplace/item/789',
    published_at: new Date(Date.now() - (3*24*60*60*1000)).toISOString(),
    condition: 'Like New',
  },
]

function relativeTime(iso) {
  const pub = new Date(iso)
  const sec = Math.floor((Date.now() - pub.getTime())/1000)
  if (sec < 3600) return `${Math.max(1, Math.floor(sec/60))}m ago`
  if (sec < 86400) return `${Math.floor(sec/3600)}h ago`
  return `${Math.floor(sec/86400)}d ago`
}

export async function apiSearch(payload) {
  // Fake latency
  await new Promise(r => setTimeout(r, 300))

  let results = MOCK_LISTINGS.filter(item => {
    if (payload.category && item.category !== payload.category) return false
    if (payload.price_min != null && item.price < payload.price_min) return false
    if (payload.price_max != null && item.price > payload.price_max) return false
    if (payload.condition && payload.condition !== 'Any' && item.condition !== payload.condition) return false
    const diff = Date.now() - new Date(item.published_at).getTime()
    if (payload.date_range === 'last_24h' && diff > 24*60*60*1000) return false
    if (payload.date_range === 'last_3d' && diff > 3*24*60*60*1000) return false
    if (payload.date_range === 'last_7d' && diff > 7*24*60*60*1000) return false
    if (payload.query && !item.title.toLowerCase().includes(payload.query.toLowerCase())) return false
    return true
  }).map(x => ({ ...x, relative_time: relativeTime(x.published_at) }))

  if (payload.sort_by === 'price_asc') results.sort((a,b)=>a.price-b.price)
  else if (payload.sort_by === 'price_desc') results.sort((a,b)=>b.price-a.price)
  else if (payload.sort_by === 'date_asc') results.sort((a,b)=>a.published_at.localeCompare(b.published_at))
  else results.sort((a,b)=>b.published_at.localeCompare(a.published_at))

  return { listings: results, total: results.length, query: payload.query || '' }
}

const SAVED_KEY = 'mf_saved_searches'
function getSaved() { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]') }
function setSaved(v) { localStorage.setItem(SAVED_KEY, JSON.stringify(v)) }

export async function apiSavedList() {
  await new Promise(r => setTimeout(r, 150))
  return getSaved()
}

export async function apiSavedCreate(entry) {
  await new Promise(r => setTimeout(r, 150))
  const arr = getSaved()
  const obj = { _id: crypto.randomUUID(), notifications: { email:false, push:false }, created_at: new Date().toISOString(), ...entry }
  arr.push(obj); setSaved(arr); return obj
}

export async function apiSavedDelete(id) {
  await new Promise(r => setTimeout(r, 150))
  setSaved(getSaved().filter(x => x._id !== id))
  return { ok:true }
}

export async function apiSavedPatchNotif(id, patch) {
  await new Promise(r => setTimeout(r, 150))
  const arr = getSaved().map(x => x._id === id ? { ...x, notifications: { ...(x.notifications||{}), ...patch } } : x)
  setSaved(arr)
  return arr.find(x=>x._id===id)?.notifications || {email:false,push:false}
}

export async function apiAuthStatus() {
  await new Promise(r => setTimeout(r, 120))
  return { authenticated: false, message: 'Mock auth. Use Playwright for real login.' }
}
