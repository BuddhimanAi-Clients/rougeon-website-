import { useEffect } from 'react'

const SITE = 'ROGUEON'

/** Sets the browser tab title for a page, e.g. "Shop | ROGUEON". */
export function usePageTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} — Official Store`
  }, [title])
}
