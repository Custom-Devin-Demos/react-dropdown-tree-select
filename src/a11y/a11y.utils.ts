import { render } from '@testing-library/react'
import axe from 'axe-core'

export function mountToDoc(reactElm: React.ReactElement) {
  const { container } = render(reactElm)
  return container
}

export function run(domNode: Element, rules: Record<string, { enabled: boolean }> = {}) {
  const config = {
    rules,
  }

  return new Promise<{ error: Error | null; violations: axe.Result[] }>(resolve => {
    axe.run(domNode, config, (error, { violations }) => {
      resolve({ error, violations })
    })
  })
}
