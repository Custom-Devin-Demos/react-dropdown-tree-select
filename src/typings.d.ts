declare module 'array.partial' {
  function partial<T>(arr: T[], predicate: (item: T) => unknown): boolean
  export default partial
}

declare module 'react-infinite-scroll-component' {
  import * as React from 'react'

  const InfiniteScroll: React.ComponentType<any>
  export default InfiniteScroll
}
