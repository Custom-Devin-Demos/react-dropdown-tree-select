import { NodeDataSet } from '../types'

const toKebabCase = (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()

const getDataset = (o: NodeDataSet = {}) =>
  Object.keys(o).reduce<Record<string, any>>((acc, cur) => {
    acc[`data-${toKebabCase(cur)}`] = o[cur]
    return acc
  }, {})

export default getDataset
