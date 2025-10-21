import React, { useMemo, useState } from 'react'
import Layout from '../components/Layout'

const BASE = import.meta.env.VITE_BACKEND_URL || '';

const apiSearch = (body) =>
  fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  }).then(r => r.json()).catch(() => ({}));

const apiSavedCreate = (payload) =>
  fetch(`${BASE}/api/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit',
  }).then(r => r.json()).catch(() => ({}));

const categories = [ 'Vehicles','Electronics','Property Rentals','Tools','Furniture','Appliances','Clothing','Pets','Miscellaneous' ]
const conditions = ['Any','New','Like New','Good','Fair']
const dateRanges = [
  {label:'Any Time', value:'any'},
  {label:'Last 24 Hours', value:'last_24h'},
  {label:'Last 3 Days', value:'last_3d'},
  {label:'Last Week', value:'last_7d'},
]
const sortOptions = [
  {label:'Newest First', value:'date_desc'},
  {label:'Oldest First', value:'date_asc'},
  {label:'Price: Low to High', value:'price_asc'},
  {label:'Price: High to Low', value:'price_desc'},
]

export default function Search() {
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    category: '', price_min: '', price_max: '', location: 'Los Angeles', radius: 25, condition: 'Any', date_range: 'any', sort_by: 'date_desc'
  })

  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, [])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const { listings } = await apiSearch({
        query,
        category: filters.category || null,
        price_min: filters.price_min ? Number(filters.price_min) : null,
        price_max: filters.price_max ? Number(filters.price_max) : null,
        location: filters.location,
        radius: Number(filters.radius),
        condition: filters.condition,
        date_range: filters.date_range,
        sort_by: filters.sort_by,
      })
      setResults(listings || [])
    } catch (e) {
      alert('Search failed.')
    } finally {
      setLoading(false)
      setShowFilters(false)
    }
  }

  const saveSearch = async () => {
    try {
      await apiSavedCreate({ query, filters })
      alert('Search saved.')
    } catch {
      alert('Save failed.')
    }
  }

  const FiltersContent = (
    <div className="p-4 space-y-3">
      <div>
        <label className="block text-sm font-semibold mb-1">Category</label>
        <select value={filters.category} onChange={e=>setFilters({...filters, category:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
          <option value="">Any</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Min Price</label>
          <input type="number" value={filters.price_min} onChange={e=>setFilters({...filters, price_min:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"/>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Max Price</label>
          <input type="number" value={filters.price_max} onChange={e=>setFilters({...filters, price_max:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"/>
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Location</label>
        <input value={filters.location} onChange={e=>setFilters({...filters, location:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"/>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Radius (miles)</label>
        <input type="range" min="5" max="100" value={filters.radius} onChange={e=>setFilters({...filters, radius:e.target.value})} className="w-full"/>
        <div className="text-sm opacity-80">{filters.radius} miles</div>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1">Condition</label>
        <select value={filters.condition} onChange={e=>setFilters({...filters, condition:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
          {conditions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1">Date range</label>
          <select value={filters.date_range} onChange={e=>setFilters({...filters, date_range:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
            {dateRanges.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Sort by</label>
          <select value={filters.sort_by} onChange={e=>setFilters({...filters, sort_by:e.target.value})} className="w-full border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
            {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="mb-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
          <input
            placeholder="What are you looking for?"
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-3"
            value={query}
            onChange={e=>setQuery(e.target.value)}
          />
          <button onClick={fetchResults} className="button-primary">{loading ? 'Searching…' : 'Search'}</button>
          <button onClick={saveSearch} className="border rounded-xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-900">Save</button>
          <button onClick={()=>setShowFilters(true)} className="border rounded-xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-900">Filters</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((item, idx) => (
          <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="card border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition">
            <img src={item.image_url} alt={item.title} className="w-full aspect-video object-cover"/>
            <div className="p-4">
              <div className="text-xs inline-block px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">{item.category}</div>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <div className="text-sm opacity-80 mt-1">
                <span>${(item.price ?? 0).toLocaleString()}</span> • <span>{item.city}</span>
              </div>
              <div className="text-xs opacity-60 mt-1">{item.relative_time || 'just now'}</div>
            </div>
          </a>
        ))}
      </div>

      {showFilters && (
        <aside className="fixed md:hidden inset-0 bg-black/50 z-50 flex items-end" onClick={()=>setShowFilters(false)}>
          <div className="bg-white dark:bg-slate-900 w-full rounded-t-2xl max-h-[75vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
            {FiltersContent}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={()=>setShowFilters(false)} className="button-primary w-full">Apply Filters</button>
            </div>
          </div>
        </aside>
      )}

      <div className="hidden md:grid grid-cols-12 gap-4 mt-6">
        <div className="md:col-span-3">
          <div className="card border-slate-200 dark:border-slate-800 sticky top-24">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800"><h4 className="font-semibold">Filters</h4></div>
            {FiltersContent}
          </div>
        </div>
        <div className="md:col-span-9"></div>
      </div>
    </Layout>
  )
}
