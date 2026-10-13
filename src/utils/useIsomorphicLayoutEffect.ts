import { useEffect, useLayoutEffect } from 'react'

// useLayoutEffect warns when rendered on the server; fall back to useEffect there
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default useIsomorphicLayoutEffect
