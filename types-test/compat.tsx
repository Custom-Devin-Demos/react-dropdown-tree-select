// Type-level backward compatibility test: exercises the public typings the way consumers used the
// previous hand-written declarations. Compiled (not executed) by `yarn typecheck`.
import * as React from 'react'
import DropdownTreeSelect, {
  DropdownTreeSelectProps,
  DropdownTreeSelectState,
  Mode,
  NodeAction,
  NodeDataSet,
  ShowDropdownState,
  TextProps,
  TreeData,
  TreeNode,
  TreeNodeProps,
} from 'react-dropdown-tree-select'

const dataset: NodeDataSet = { tracking: 'abc', count: 1 }

const action: NodeAction = { className: 'fa fa-info', title: 'Info', text: 'i', custom: true }

const data: TreeNodeProps[] = [
  {
    label: 'Parent',
    value: 'parent',
    checked: false,
    disabled: false,
    expanded: true,
    className: 'parent',
    tagClassName: 'parent-tag',
    actions: [action],
    dataset,
    isDefaultValue: false,
    customField: { anything: 'goes' },
    children: [{ label: 'Child', value: 'child' }],
  },
]

const objectData: TreeData = { label: 'Root', value: 'root' }
const arrayData: TreeData = data

const texts: TextProps = {
  placeholder: 'Choose...',
  inlineSearchPlaceholder: 'Search...',
  noMatches: 'No matches found',
  label: 'Label',
  labelRemove: 'Remove',
}

const mode: Mode = 'multiSelect'
const showDropdown: ShowDropdownState = 'initial'

const onChange = (currentNode: TreeNode, selectedNodes: TreeNode[]): void => {
  const label: string = currentNode.label
  const value: string = currentNode.value
  const values: string[] = selectedNodes.map(n => n.value)
  void label
  void value
  void values
}
const onAction = (currentNode: TreeNode, currentAction: NodeAction): void => {
  void currentNode
  void currentAction
}
const onNodeToggle = (currentNode: TreeNode): void => {
  void currentNode
}
const searchPredicate = (currentNode: TreeNode, searchTerm: string): boolean =>
  currentNode.label.toLowerCase().indexOf(searchTerm) >= 0

const allProps: DropdownTreeSelectProps = {
  data: arrayData,
  clearSearchOnChange: true,
  keepTreeOnSearch: true,
  keepChildrenOnSearch: true,
  keepOpenOnSelect: true,
  texts,
  showDropdown,
  className: 'custom',
  onChange,
  onAction,
  onNodeToggle,
  onFocus: () => {},
  onBlur: () => {},
  mode,
  showPartiallySelected: true,
  disabled: false,
  readOnly: false,
  id: 'my-dropdown',
  searchPredicate,
  inlineSearchInput: true,
  tabIndex: 0,
  disablePoppingOnBackspace: true,
}

const modes: Mode[] = ['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']

const state: DropdownTreeSelectState = {
  showDropdown: 'default',
  searchModeOn: false,
  allNodesHidden: false,
  tree: [],
  tags: [],
}

export function Compat() {
  const ref = React.useRef<DropdownTreeSelect>(null)

  React.useEffect(() => {
    const instance = ref.current
    if (instance) {
      const node: HTMLDivElement = instance.node
      const searchInput: HTMLInputElement = instance.searchInput
      const keepDropdownActive: boolean = instance.keepDropdownActive
      instance.handleClick()
      void node
      void searchInput
      void keepDropdownActive
    }
  }, [])

  void state

  return (
    <div>
      <DropdownTreeSelect data={objectData} />
      <DropdownTreeSelect {...allProps} ref={ref} />
      <DropdownTreeSelect
        data={data}
        clearSearchOnChange
        keepTreeOnSearch
        keepChildrenOnSearch
        keepOpenOnSelect={false}
        texts={{ placeholder: 'Pick one' }}
        showDropdown="always"
        className="another"
        onChange={(currentNode, selectedNodes) => onChange(currentNode, selectedNodes)}
        onAction={(currentNode, currentAction) => onAction(currentNode, currentAction)}
        onNodeToggle={currentNode => onNodeToggle(currentNode)}
        onFocus={() => undefined}
        onBlur={() => undefined}
        mode="radioSelect"
        showPartiallySelected={false}
        disabled
        readOnly
        id="second"
        searchPredicate={searchPredicate}
        inlineSearchInput={false}
        tabIndex={-1}
        disablePoppingOnBackspace={false}
      />
      {modes.map(m => (
        <DropdownTreeSelect key={m} data={data} mode={m} />
      ))}
    </div>
  )
}

// @ts-expect-error data is required
export const missingData = <DropdownTreeSelect />

// @ts-expect-error mode must be one of the known modes
export const invalidMode = <DropdownTreeSelect data={data} mode="unknown" />

// Headless API
/* eslint-disable import/first */
import {
  DropdownTreeSelectClassNames,
  DropdownTreeSelectHandle,
  DropdownTreeSelectNode,
  DropdownTreeSelectTag,
  DropdownTreeSelectUnstyled,
  useDropdownTreeSelect,
  UseDropdownTreeSelectResult,
} from 'react-dropdown-tree-select/headless'
import {
  DropdownTreeSelectUnstyled as MainDropdownTreeSelectUnstyled,
  useDropdownTreeSelect as mainUseDropdownTreeSelect,
} from 'react-dropdown-tree-select'
/* eslint-enable import/first */
export const HeadlessCustomUI = () => {
  const ds: UseDropdownTreeSelectResult = useDropdownTreeSelect({ data, mode: 'multiSelect' })
  const node: DropdownTreeSelectNode | undefined = ds.tree[0]
  const tag: DropdownTreeSelectTag | undefined = ds.tags[0]
  const isOpen: boolean = ds.isOpen
  const searchTerm: string = ds.searchTerm
  ds.checkNode('id', true)
  ds.toggleNode('id')
  ds.removeTag('id')
  ds.setSearch('term')
  return (
    <div {...ds.getRootProps({ className: 'x' })}>
      <button {...ds.getTriggerProps()}>{isOpen ? searchTerm : ''}</button>
      <input {...ds.getInputProps({ onKeyDown: e => e.key })} />
      {tag && <span {...ds.getTagProps(tag)} />}
      {tag && <button {...ds.getTagRemoveProps(tag)} />}
      <ul {...ds.getListProps()}>{node && <li {...ds.getNodeProps(node)} />}</ul>
      {node && <input {...ds.getCheckboxProps(node)} />}
      {node && <i {...ds.getToggleProps(node)} />}
    </div>
  )
}

const classNames: DropdownTreeSelectClassNames = { root: 'a', checkbox: 'b' }
const unstyledRef = React.createRef<DropdownTreeSelectHandle>()
export const unstyled = <DropdownTreeSelectUnstyled ref={unstyledRef} data={data} classNames={classNames} />
export const MainEntryHeadless = () => {
  const ds = mainUseDropdownTreeSelect({ data })
  return <MainDropdownTreeSelectUnstyled data={data} classNames={{ node: String(ds.tree.length) }} />
}

// @ts-expect-error unknown classNames key
export const invalidClassNames = <DropdownTreeSelectUnstyled data={data} classNames={{ unknown: 'x' }} />
