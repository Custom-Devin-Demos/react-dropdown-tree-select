import { createContext } from 'react'

export const DEFAULT_LOADING_TEXT = 'Loading...'

/** Text shown on nodes whose children are being loaded (`texts.loadingChildren`) */
export const LoadingTextContext = createContext<string | undefined>(undefined)
