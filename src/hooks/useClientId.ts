import React, { useState } from 'react'
import { clientIdGenerator } from '../utils'

const reactUseId = (React as { useId?: () => string }).useId

/**
 * Default client id for a dropdown instance: `rdts` + `React.useId()` (React 18+, stable across SSR/hydration),
 * falling back to the incremental `rdtsN` counter on React 16.8/17.
 */
const useClientId: () => string =
  typeof reactUseId === 'function'
    ? () => `rdts${reactUseId().replace(/[^a-zA-Z0-9_-]/g, '')}`
    : () => useState(() => clientIdGenerator.get({}))[0]

export default useClientId
