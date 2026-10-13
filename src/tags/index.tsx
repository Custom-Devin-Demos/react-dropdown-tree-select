import React, { memo, useContext } from 'react'
import PropTypes from 'prop-types'
import Tag from '../tag'
import ClassNamesContext from '../headless/ClassNamesContext'
import { getDataset } from '../utils'

import { InternalTreeNode, Mode, TextProps } from '../types'

type OnTagRemove = (id: string, isKeyboardEvent: boolean) => void

const getTags = (
  tags: InternalTreeNode[] = [],
  onDelete: OnTagRemove,
  readOnly?: boolean,
  disabled?: boolean,
  labelRemove?: string
) =>
  tags.map(tag => {
    const { _id, label, tagClassName, dataset, tagLabel } = tag
    return (
      <li
        className={['tag-item', tagClassName].filter(Boolean).join(' ')}
        key={`tag-item-${_id}`}
        {...getDataset(dataset)}
      >
        <Tag
          label={tagLabel || label}
          id={_id}
          onDelete={onDelete}
          readOnly={readOnly}
          disabled={disabled || tag.disabled}
          labelRemove={labelRemove}
        />
      </li>
    )
  })

export interface TagsProps {
  tags?: InternalTreeNode[]
  onTagRemove: OnTagRemove
  readOnly?: boolean
  disabled?: boolean
  texts?: TextProps
  children?: React.ReactNode
  activeDescendant?: string
  mode?: Mode
  clientId?: string
}

const Tags = ({ tags, onTagRemove, texts = {}, disabled, readOnly, children }: TagsProps) => {
  const { tags: tagsClassName } = useContext(ClassNamesContext)
  const lastItem = children || <span className="placeholder">{texts.placeholder || 'Choose...'}</span>

  return (
    <ul className={tagsClassName ? `tag-list ${tagsClassName}` : 'tag-list'}>
      {getTags(tags, onTagRemove, readOnly, disabled, texts.labelRemove)}
      <li className="tag-item">{lastItem}</li>
    </ul>
  )
}

Tags.propTypes = {
  tags: PropTypes.array,
  onTagRemove: PropTypes.func,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  texts: PropTypes.object,
  children: PropTypes.node,
}

export default memo(Tags)
