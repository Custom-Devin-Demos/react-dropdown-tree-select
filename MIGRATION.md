# Migrating from v2 to v3

v3 is a rewrite of the internals (TypeScript, function components and hooks) that keeps the public API: every prop keeps its name, type and default, the default export is still the styled `DropdownTreeSelect`, and the rendered DOM and CSS class names are unchanged unless you opt in to a new feature. Most apps upgrade without code changes; the points below cover what can behave differently.

- [React peer range](#react-peer-range)
- [Hooks rewrite and re-render semantics](#hooks-rewrite-and-re-render-semantics)
- [Ref surface](#ref-surface)
- [Types](#types)
- [`exports` map and deep imports](#exports-map-and-deep-imports)
- [CSS import paths](#css-import-paths)
- [Headless entry](#headless-entry)
- [Generated ids on React 18](#generated-ids-on-react-18)
- [Opt-in features](#opt-in-features)

## React peer range

`peerDependencies` are now `react` and `react-dom` `^16.8.0 || ^17.0.0 || ^18.0.0` (v2: `react` `^16.3.0 || ^17 || ^18`). Hooks require React 16.8+, so apps on React 16.3 - 16.7 have to upgrade React first. `react-dom` is now listed explicitly.

The component is `StrictMode` clean (no `UNSAFE_componentWillMount`/`UNSAFE_componentWillReceiveProps`, no side effects during render) and safe with concurrent rendering on React 18.

## Hooks rewrite and re-render semantics

All components are function components. The internal state lives in a hook and the tree model (`TreeManager`) is kept in a ref instead of being recreated from props.

**v2** rebuilt the whole tree from `data` in `UNSAFE_componentWillReceiveProps`, i.e. on **every** parent re-render, even when `data` did not change. Expanded nodes, the search term and the keyboard focus were reset to what `data` described each time.

**v3** builds the tree once and only rebuilds it when one of these props changes: `data` (by reference), `mode`, `showPartiallySelected`, `searchPredicate` or `id`. Re-rendering the parent with the same `data` reference keeps the internal state (expanded nodes, search, focus, loaded children) intact.

What to check:

- If you relied on a parent re-render to reset the tree, pass a new `data` reference (e.g. a fresh copy) or change the component `key`.
- If you build `data` inline in render (`data={[{ label, value }]}`), every render is a new reference and the tree is rebuilt as in v2. Memoize it (`useMemo`, state, or a module constant) to get the cheaper behaviour.
- When `data` is replaced, checked/expanded state comes from the new data; the keyboard focus is preserved.

## Ref surface

A `ref` on `DropdownTreeSelect` (or `DropdownTreeSelectUnstyled`) is forwarded with `useImperativeHandle` and exposes the members that were used from outside in v2:

| Member               | Description                                   |
| -------------------- | --------------------------------------------- |
| `node`               | The root `div.react-dropdown-tree-select`     |
| `searchInput`        | The search `input` element                    |
| `keepDropdownActive` | Whether the dropdown is kept open on blur     |
| `handleClick()`      | Toggles the dropdown, as clicking the trigger |

Other instance members (`state`, `props`, `setState`, internal handlers such as `onInputChange`) no longer exist. Type the ref as `useRef<DropdownTreeSelect>(null)` (still valid) or with the new `DropdownTreeSelectHandle` type.

## Types

Type declarations are now generated from the TypeScript source instead of the hand-written `types/react-dropdown-tree-select.d.ts`. **The `types/` folder has been removed** from the package.

- `package.json#types` still points to `dist/react-dropdown-tree-select.d.ts`, so `import DropdownTreeSelect, { TreeNode } from 'react-dropdown-tree-select'` keeps working.
- All v2 type names are still exported from the package root: `DropdownTreeSelectProps`, `DropdownTreeSelectState`, `TreeNode`, `TreeNodeProps`, `TreeData`, `Mode`, `ShowDropdownState`, `TextProps`, `NodeAction`, `NodeDataSet`.
- If you imported from the old path (`react-dropdown-tree-select/types/react-dropdown-tree-select`) or referenced it with `/// <reference path=... />`, import from `react-dropdown-tree-select` instead.
- New types: `VirtualizationOptions`, `DropdownTreeSelectClassNames`, `DropdownTreeSelectHandle`, `UseDropdownTreeSelectOptions`, `UseDropdownTreeSelectResult`, `DropdownTreeSelectNode`, `DropdownTreeSelectTag`.

## `exports` map and deep imports

`package.json` now has an `exports` map. With bundlers and Node versions that honour it, only these paths can be imported:

| Import path                                  | Resolves to                                                          |
| -------------------------------------------- | -------------------------------------------------------------------- |
| `react-dropdown-tree-select`                 | `dist/react-dropdown-tree-select.js` (+ `.d.ts`), imports the styles |
| `react-dropdown-tree-select/headless`        | `dist/headless.js` (+ `.d.ts`), no styles                            |
| `react-dropdown-tree-select/styles.css`      | `dist/styles.css`                                                    |
| `react-dropdown-tree-select/dist/styles.css` | `dist/styles.css` (v2 path, still supported)                         |
| `react-dropdown-tree-select/dist/*`          | any file in `dist/`                                                  |
| `react-dropdown-tree-select/package.json`    | `package.json`                                                       |

Deep imports into source files (e.g. `react-dropdown-tree-select/src/...`) were never published and are not supported; `types/...` is gone (see above). The `main`, `types` and UMD globals are unchanged.

## CSS import paths

The styled default export still imports its CSS, and `dist/styles.css` is still emitted. Both paths work:

```js
import 'react-dropdown-tree-select/styles.css' // new, preferred
import 'react-dropdown-tree-select/dist/styles.css' // v2 path, still supported
```

CDN links (`https://unpkg.com/react-dropdown-tree-select/dist/styles.css`) are unchanged.

## Headless entry

New and optional: `react-dropdown-tree-select/headless` exports the component logic without importing any CSS:

- `DropdownTreeSelectUnstyled`: same props, markup, class names and ref as `DropdownTreeSelect`, plus the `classNames` prop.
- `useDropdownTreeSelect(options)`: state, actions and prop getters to render your own markup.

If you previously overrode or reset all of the default styles, switch to `DropdownTreeSelectUnstyled` and drop the overrides. The UMD build `dist/headless.js` exposes the `ReactDropdownTreeSelectHeadless` global. See [Headless usage](README.md#headless-usage).

## Generated ids on React 18

Without an `id` prop, each instance generates an id that prefixes the node ids (`<id>-0`, `<id>-0-1`, ...) and the ARIA attributes.

- **React 18:** the id is `rdts` + `React.useId()` with non-alphanumeric characters removed (e.g. `rdtsr0`), so it is stable between server rendering and hydration.
- **React 16.8 / 17:** the v2 format (`rdts1`, `rdts2`, ...) is kept.

If tests, snapshots, CSS or analytics depend on generated ids, pass an explicit `id` prop.

## Opt-in features

These are off by default and don't change anything until you use them:

- [`virtualized`](README.md#virtualized): windowed rendering for very large trees. When enabled, **the scroll container is `div.virtualized-viewport` instead of `ul.root`** (`ul.root` gets an extra `virtualized` class and is rendered inside it, with absolutely positioned rows). Move CSS that sets `max-height`/`overflow` on `ul.root`, and code that reads/sets its `scrollTop`, to `.virtualized-viewport` (or use the `height` option). Without `virtualized` the list still uses infinite scroll in `ul.root` as in v2.
- [`loadChildren`](README.md#loadchildren) / `hasChildren` / `texts.loadingChildren` / [`onLoadChildrenError`](README.md#onloadchildrenerror): lazy loading of children. Lazy nodes get the `loading` (with `aria-busy`) and `load-error` classes.
- [`classNames`](README.md#classnames): extra class names per element.
