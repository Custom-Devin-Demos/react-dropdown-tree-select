import PropTypes from 'prop-types'

const dropdownTreeSelectPropTypes = {
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
  clearSearchOnChange: PropTypes.bool,
  keepTreeOnSearch: PropTypes.bool,
  keepChildrenOnSearch: PropTypes.bool,
  keepOpenOnSelect: PropTypes.bool,
  texts: PropTypes.shape({
    placeholder: PropTypes.string,
    inlineSearchPlaceholder: PropTypes.string,
    noMatches: PropTypes.string,
    label: PropTypes.string,
    labelRemove: PropTypes.string,
  }),
  showDropdown: PropTypes.oneOf(['default', 'initial', 'always']),
  className: PropTypes.string,
  onChange: PropTypes.func,
  onAction: PropTypes.func,
  onNodeToggle: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  mode: PropTypes.oneOf(['multiSelect', 'simpleSelect', 'radioSelect', 'hierarchical']),
  showPartiallySelected: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  id: PropTypes.string,
  searchPredicate: PropTypes.func,
  inlineSearchInput: PropTypes.bool,
  tabIndex: PropTypes.number,
  disablePoppingOnBackspace: PropTypes.bool,
  classNames: PropTypes.objectOf(PropTypes.string),
  virtualized: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({ itemHeight: PropTypes.number, overscan: PropTypes.number, height: PropTypes.number }),
  ]),
}

export default dropdownTreeSelectPropTypes
