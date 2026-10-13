import { createContext } from 'react'

import { DropdownTreeSelectClassNames } from '../types'

export const EMPTY_CLASS_NAMES: DropdownTreeSelectClassNames = {}

/** Extra class names (`classNames` prop) for elements rendered deep inside the tree */
const ClassNamesContext = createContext<DropdownTreeSelectClassNames>(EMPTY_CLASS_NAMES)

export default ClassNamesContext
