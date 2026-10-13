import React, { memo, useContext, useRef } from 'react'
import PropTypes from 'prop-types'

import ClassNamesContext from '../headless/ClassNamesContext'
import { buildTriggerProps } from '../headless/prop-getters'
import { InternalTreeNode, Mode, TextProps } from '../types'

export interface TriggerProps {
  onTrigger: (e: React.MouseEvent | React.KeyboardEvent) => void
  disabled?: boolean
  readOnly?: boolean
  showDropdown?: boolean
  mode?: Mode
  texts?: TextProps
  clientId?: string
  tags?: InternalTreeNode[]
  tabIndex?: number
  activeDescendant?: string
  children?: React.ReactNode
}

const Trigger = ({
  onTrigger,
  disabled,
  readOnly,
  showDropdown,
  mode,
  texts = {},
  clientId,
  tags,
  tabIndex,
  children,
}: TriggerProps) => {
  const triggerNode = useRef<HTMLAnchorElement | null>(null)
  const { trigger: className } = useContext(ClassNamesContext)

  return (
    <a
      {...buildTriggerProps({
        onTrigger,
        triggerRef: triggerNode,
        disabled,
        readOnly,
        showDropdown,
        mode,
        texts,
        clientId,
        tagIds: tags && tags.map(t => t._id),
        tabIndex,
        className,
      })}
    >
      {children}
    </a>
  )
}

Trigger.propTypes = {
  onTrigger: PropTypes.func,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  showDropdown: PropTypes.bool,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  texts: PropTypes.object,
  clientId: PropTypes.string,
  tags: PropTypes.array,
  tabIndex: PropTypes.number,
}

export default memo(Trigger)
