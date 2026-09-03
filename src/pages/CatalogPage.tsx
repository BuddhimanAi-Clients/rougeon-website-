import { useState } from 'react'
import type { FormEvent } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ArrowDown, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { apiRequest } from '../lib/api'
import type { PaginatedProducts } from '../types/catalog'
import type { ApiData, Category } from '../types/commerce'

export function CatalogPage() {
  const [params, setParams] = useSearchParams(); const [search, setSearch] = useState(params.get('search') ?? '')
  const queryString = params.toString()
  const products = useInfiniteQuery({
    queryKey: ['products', 'infinite', queryString], initialPageParam: 1,
    queryFn: ({ pageParam }) => apiRequest<PaginatedProducts>(`/api/v1/products?${new URLSearchParams({ limit: '12', page: String(pageParam), ...Object.fromEntries(params) })}`),
    getNextPageParam: (last) => last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  })
  const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await apiRequest<ApiData<Category[]>>('/api/v1/categories')).data })
  function updateParam(name: string, value: string) { const next = new URLSearchParams(params); value ? next.set(name, value) : next.delete(name); setParams(next) }
  function submitSearch(event: FormEvent) { event.preventDefault(); updateParam('search', search.trim()) }
  const list = products.data?.pages.flatMap((page) => page.data) ?? []; const first = products.data?.pages[0]
  return <div className="page-shell catalog-page"><header className="page-hero compact"><p>ROGUEON / CATALOGUE</p><h1>SHOP THE<br />CURRENT SYSTEM.</h1></header><section className="catalog-controls" aria-label="Product filters"><form onSubmit={submitSearch} className="catalog-search"><Search aria-hidden="true"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or SKU" aria-label="Search products"/><button type="submit">Search</button></form><label><SlidersHorizontal aria-hidden="true"/><span>Category</span><select value={params.get('categorySlug') ?? ''} onChange={(event) => updateParam('categorySlug', event.target.value)}><option value="">All categories</option>{categories.data?.flatMap((category) => [category, ...category.children]).map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label><label><span>Sort</span><select value={params.get('sort') ?? 'newest'} onChange={(event) => updateParam('sort', event.target.value)}><option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label></section>{products.isPending ? <div className="catalog-product-grid">{Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton" key={index}/>)}</div> : products.isError ? <div className="collection-state"><p>THE CATALOGUE IS OFFLINE</p><span>Check the backend connection and try again.</span><button onClick={() => products.refetch()}>Try again</button></div> : list.length === 0 ? <div className="collection-state"><p>NO MATCHES FOUND</p><span>Try a broader category or search phrase.</span><button onClick={() => { setSearch(''); setParams({}) }}>Clear filters</button></div> : <><div className="catalog-summary"><span>{first?.pagination.total} pieces</span><span>{list.length} loaded</span></div><div className="catalog-product-grid">{list.map((product) => <ProductCard product={product} key={product.id}/>)}</div>{products.hasNextPage && <div className="catalog-load-more"><button className="outline-button" disabled={products.isFetchingNextPage} onClick={() => products.fetchNextPage()}>{products.isFetchingNextPage ? 'Loading more…' : <>Load more <ArrowDown /></>}</button></div>}</>}</div>
}
