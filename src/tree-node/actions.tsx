import PropTypes from 'prop-types'
import React, { memo } from 'react'

import Action from './action'
import { isEmpty } from '../utils'

import { NodeAction } from '../types'

export interface ActionsProps {
  id: string
  actions?: NodeAction[]
  onAction?: (nodeId: string, action: NodeAction) => void
  readOnly?: boolean
}

const Actions = ({ actions, id, ...rest }: ActionsProps) => {
  if (isEmpty(actions)) return null

  return (
    <>
      {actions!.map((a, idx) => {
        const actionId = a.id || `action-${idx}`
        return <Action key={actionId} {...rest} {...a} actionData={{ action: { ...a, id: actionId }, nodeId: id }} />
      })}
    </>
  )
}

Actions.propTypes = {
  id: PropTypes.string.isRequired,
  actions: PropTypes.array,
}

export default memo(Actions)
