const generateUID = (prefix: string) => {
  let counter = 1

  let map = new WeakMap<object, number>()

  const get = (item: object) => {
    if (!map.has(item)) {
      map.set(item, counter++)
    }
    return `${prefix}${map.get(item)}`
  }

  const reset = () => {
    map = new WeakMap<object, number>()
    counter = 1
  }

  return { get, reset }
}

const clientIdGenerator = generateUID('rdts')
export default clientIdGenerator
