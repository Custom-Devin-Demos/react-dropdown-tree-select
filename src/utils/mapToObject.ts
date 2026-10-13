const mapToObject = <V>(map: Map<string, V>): Record<string, V> => {
  const obj: Record<string, V> = Object.create(null)
  // eslint-disable-next-line no-restricted-syntax
  for (const [k, v] of map) {
    // We don’t escape the key '__proto__'
    // which can cause problems on older engines
    obj[k] = v
  }
  return obj
}

export default mapToObject
