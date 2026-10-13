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

export const virtualizedTrue = <DropdownTreeSelect data={data} virtualized />
export const virtualizedOptions = (
  <DropdownTreeSelect data={data} virtualized={{ itemHeight: 28, overscan: 5, height: 400 }} />
)
const virtualizationOptions: DropdownTreeSelectProps['virtualized'] = { height: 250 }
export const virtualizedTyped = <DropdownTreeSelect data={data} virtualized={virtualizationOptions} />

// @ts-expect-error itemHeight must be a number
export const invalidVirtualized = <DropdownTreeSelect data={data} virtualized={{ itemHeight: '32px' }} />
