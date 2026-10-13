import partial from 'array.partial'

const identity = (c: any) => c

export default (node: any, childProp = 'children', childSelector: (c: any) => any = identity): boolean =>
  partial(node[childProp], (c: any) => childSelector(c).checked) ||
  node[childProp].some((c: any) => childSelector(c).partial)
