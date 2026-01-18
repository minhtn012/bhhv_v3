'use client'

import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

interface BrandInfo {
  name: string
  value: string
  updatedAt: string | null
  modelsCount: number
}

interface CrawlResult {
  success: boolean
  updated: string[]
  details: Array<{ brand: string; models: number; newModels: number; newModelNames: string[] }>
  errors: Array<{ brand: string; error: string }>
}

export default function CarDataManagementPage() {
  const [brands, setBrands] = useState<BrandInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [crawling, setCrawling] = useState(false)
  const [result, setResult] = useState<CrawlResult | null>(null)

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/car-brands')
      if (!res.ok) throw new Error('Failed to fetch brands')
      const data = await res.json()
      setBrands(data.data || [])
    } catch (error) {
      console.error('Error fetching brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBrands = useMemo(() => {
    if (!searchTerm) return brands
    return brands.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [brands, searchTerm])

  const toggleBrand = (name: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedBrands(new Set(filteredBrands.map(b => b.name)))
  }

  const deselectAll = () => {
    setSelectedBrands(new Set())
  }

  const handleCrawl = async (brandNames: string[]) => {
    if (brandNames.length === 0) return

    setCrawling(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/crawl-car-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brands: brandNames })
      })

      const data: CrawlResult = await res.json()
      setResult(data)
      await fetchBrands()
      setSelectedBrands(new Set())
    } catch (error) {
      console.error('Error crawling:', error)
    } finally {
      setCrawling(false)
    }
  }

  const handleUpdateSelected = () => {
    handleCrawl(Array.from(selectedBrands))
  }

  const handleUpdateAll = () => {
    if (!confirm('Update tất cả ' + brands.length + ' brands? Có thể mất vài phút.')) return
    handleCrawl(brands.map(b => b.name))
  }

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1d ago'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  // Stats
  const stats = useMemo(() => {
    const total = brands.length
    const updated = brands.filter(b => b.updatedAt).length
    const totalModels = brands.reduce((sum, b) => sum + b.modelsCount, 0)
    return { total, updated, totalModels }
  }, [brands])

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Car Data Management
          </h1>
          <p className="text-slate-400">
            Sync car brands and models from BHV API
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Brands</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Synced</p>
                <p className="text-2xl font-bold text-white">{stats.updated}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Models</p>
                <p className="text-2xl font-bold text-white">{stats.totalModels.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          {/* Search & Actions */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-4 py-2.5 text-sm text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2.5 text-sm text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-lg hover:bg-slate-600/50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Selection Info & Update Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">
                  {filteredBrands.length} brands shown
                </span>
                {selectedBrands.size > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                    {selectedBrands.size} selected
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdateSelected}
                  disabled={selectedBrands.size === 0 || crawling}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {crawling ? 'Syncing...' : 'Sync Selected'}
                </button>
                <button
                  onClick={handleUpdateAll}
                  disabled={crawling}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sync All
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          {crawling && (
            <div className="p-4 bg-blue-500/10 border-b border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-blue-400 font-medium">Syncing data from BHV...</p>
                  <p className="text-blue-400/70 text-sm">This may take a few minutes</p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className={`p-4 border-b ${result.success ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.success ? 'Sync completed successfully' : 'Sync completed with errors'}
                  </p>
                  {result.details && result.details.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {result.details.map((d, i) => (
                        <div key={i} className="text-sm">
                          <div>
                            <span className="text-white font-medium">{d.brand}</span>
                            <span className="text-slate-400"> - {d.models} models</span>
                            {d.newModels > 0 && (
                              <span className="text-green-400 font-medium"> (+{d.newModels} new)</span>
                            )}
                          </div>
                          {d.newModelNames && d.newModelNames.length > 0 && (
                            <p className="text-green-400/80 text-xs mt-0.5 pl-2">
                              New: {d.newModelNames.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <p className="text-red-400 text-sm mt-2">
                      Errors: {result.errors.map(e => e.brand).join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Brand List - Show ~20 items before scroll */}
          <div className="max-h-[1100px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-slate-400">Loading brands...</p>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No brands found
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredBrands.map(brand => (
                  <label
                    key={brand.name}
                    className="flex items-center justify-between p-4 hover:bg-slate-700/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(brand.name)}
                        onChange={() => toggleBrand(brand.name)}
                        className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0"
                      />
                      <div>
                        <span className="font-medium text-white">{brand.name}</span>
                        <span className="ml-2 text-sm text-slate-400">
                          {brand.modelsCount} models
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      brand.updatedAt
                        ? 'bg-slate-700/50 text-slate-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {formatRelativeTime(brand.updatedAt)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
