import { useId, useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { useDeliveryBranches } from '../hooks/useDelivery'
import type { DeliveryBranch } from '../types/commerce'

type Props = {
  value: string | null
  onChange: (branch: DeliveryBranch | null) => void
  required?: boolean
}

const MAX_RESULTS = 40

function pretty(name: string) {
  return name.toLowerCase().replace(/(^|[\s\-(/])([a-z])/g, (_match, lead: string, letter: string) => lead + letter.toUpperCase())
}

export function deliveryAreaLabel(name: string | null | undefined) {
  return name ? pretty(name) : ''
}

/**
 * Searchable list of courier delivery areas. Customers type their town,
 * district or neighbourhood and pick a match, so the area is always one the
 * courier recognises and delivery can be priced exactly.
 */
export function DeliveryAreaSelect({ value, onChange, required }: Props) {
  const listId = useId()
  const branches = useDeliveryBranches()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    const all = branches.data ?? []
    if (!term) return all.slice(0, MAX_RESULTS)
    const starts: DeliveryBranch[] = []
    const contains: DeliveryBranch[] = []
    for (const branch of all) {
      const name = branch.name.toLowerCase()
      if (name.startsWith(term)) starts.push(branch)
      else if (name.includes(term) || branch.district?.toLowerCase().includes(term) || branch.areas?.toLowerCase().includes(term)) contains.push(branch)
    }
    return [...starts, ...contains].slice(0, MAX_RESULTS)
  }, [branches.data, query])

  function choose(branch: DeliveryBranch) {
    onChange(branch)
    setQuery('')
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive((index) => Math.min(index + 1, results.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive((index) => Math.max(index - 1, 0)) }
    else if (event.key === 'Enter' && open) { event.preventDefault(); const branch = results[active]; if (branch) choose(branch) }
    else if (event.key === 'Escape') setOpen(false)
  }

  const placeholder = branches.isPending ? 'Loading delivery areas…' : branches.isError ? 'Delivery areas unavailable' : 'Search your town or area'

  return (
    <div className="area-select">
      <div className="area-select-input">
        <Search aria-hidden="true" />
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          // The field is satisfied by a picked area, not by typed text.
          required={required && !value}
          disabled={branches.isPending}
          placeholder={value ? deliveryAreaLabel(value) : placeholder}
          className={value && !query ? 'has-value' : ''}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0) }}
          onFocus={() => setOpen(true)}
          onBlur={() => { setOpen(false); setQuery('') }}
          onKeyDown={onKeyDown}
        />
      </div>
      {branches.isError && <small className="area-select-note" role="alert">We could not load delivery areas. <button type="button" onClick={() => branches.refetch()}>Try again</button></small>}
      {open && !branches.isPending && !branches.isError && (
        <ul className="area-select-list" id={listId} role="listbox">
          {results.length === 0 && <li className="empty">No match. Try your district or the nearest town.</li>}
          {results.map((branch, index) => (
            <li
              key={branch.name}
              role="option"
              aria-selected={branch.name === value}
              className={index === active ? 'active' : ''}
              // mousedown fires before the input blur that closes the list.
              onMouseDown={(event) => { event.preventDefault(); choose(branch) }}
              onMouseEnter={() => setActive(index)}
            >
              <span><strong>{pretty(branch.name)}</strong>{branch.district && <em>{branch.district}</em>}{branch.areas && <small>{pretty(branch.areas)}</small>}</span>
              {branch.name === value && <Check aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
