/*!
 * React Dropdown Tree Select
 * A lightweight, fast and highly customizable tree select component.
 * Hrusikesh Panda <hrusikesh.panda@dowjones.com>
 * Copyright (c) 2017 Dow Jones, Inc. <support@dowjones.com> (http://dowjones.com)
 * license MIT
 * see https://github.com/dowjones/react-dropdown-tree-select
 */
import React, { forwardRef } from 'react'

import DropdownTreeSelectUnstyled, { DropdownTreeSelectHandle } from './headless/DropdownTreeSelectUnstyled'
import dropdownTreeSelectPropTypes from './headless/propTypes'
import { DropdownTreeSelectProps } from './types'

// The styles live only in this (styled) entry; `react-dropdown-tree-select/headless` stays CSS free
import './tag/index.css'
import './tags/index.css'
import './tree-node/index.css'
import './index.css'

export * from './types'
export * from './headless'
export type { DropdownTreeSelectHandle }

const DropdownTreeSelect = forwardRef<DropdownTreeSelectHandle, DropdownTreeSelectProps>(function DropdownTreeSelect(
  props,
  ref
) {
  return <DropdownTreeSelectUnstyled {...props} ref={ref} />
})

DropdownTreeSelect.propTypes = dropdownTreeSelectPropTypes as React.WeakValidationMap<
  DropdownTreeSelectProps & React.RefAttributes<DropdownTreeSelectHandle>
>

/** Type of the component instance exposed through `ref`, e.g. `useRef<DropdownTreeSelect>(null)` */
// eslint-disable-next-line @typescript-eslint/no-redeclare
type DropdownTreeSelect = DropdownTreeSelectHandle

export default DropdownTreeSelect
