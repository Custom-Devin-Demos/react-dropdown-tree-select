const getPath = (e: Event): EventTarget[] => {
  const { path } = e as Event & { path?: EventTarget[] }
  if (path) return path

  let elem = e.target as Element
  const nodes: EventTarget[] = [elem]

  while (elem.parentElement) {
    elem = elem.parentElement
    nodes.unshift(elem)
  }

  return nodes
}

export default (e: unknown, node: Node | null | undefined): boolean => {
  if (!(e instanceof Event)) return false
  return !getPath(e).some(eventNode => eventNode === node)
}
