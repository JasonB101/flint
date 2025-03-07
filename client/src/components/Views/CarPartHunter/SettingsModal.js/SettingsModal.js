import React, { useState } from "react"
import Styles from "./SettingsModal.module.scss"
import FilterOptions from "./FilterOptions/FilterOptions"

const SettingsModal = ({
  carPartOptions,
  getPartSearchOptions,
  fetchAllParts,
  sortFilters,
  setSortFilters,
}) => {
  const { years, models, parts } = carPartOptions

  const [state, setState] = useState({
    year: "",
    model: "",
    part: "",
  })
  const [partSearchOptions, setPartSearchOptions] = useState(null)
  const [selectedOptions, setSelectedOptions] = useState({}) // Track selected checkboxes

  // Reset partSearchOptions when any dropdown changes
  const handleDropdownChange = (field, value) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (partSearchOptions) {
      setPartSearchOptions(null)
      setSelectedOptions({}) // Clear selections when options are reset
    }
  }

  // Smart submit handler that works for both getting options and searching
  const handleSmartSubmit = (e) => {
    e.preventDefault()

    if (partSearchOptions === null) {
      // First phase: Get options
      onSubmit(state)
    } else {
      // Second phase: Search with selected options
      searchSelectedOptions()
    }
  }

  async function onSubmit(formData) {
    const { year, model, part } = formData
    const partOptions = await getPartSearchOptions(year, model, part)
    setPartSearchOptions(partOptions)

    // Initialize all checkboxes as checked by default
    const initialSelections = {}
    if (Array.isArray(partOptions)) {
      partOptions.forEach((option, index) => {
        initialSelections[index] = false
      })
    }
    setSelectedOptions(initialSelections)
  }

  // Handle checkbox changes
  const handleCheckboxChange = (index) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Select all checkboxes
  const selectAll = () => {
    const allSelected = {}
    if (Array.isArray(partSearchOptions)) {
      partSearchOptions.forEach((_, index) => {
        allSelected[index] = true
      })
    }
    setSelectedOptions(allSelected)
  }

  // Deselect all checkboxes
  const deselectAll = () => {
    const allDeselected = {}
    if (Array.isArray(partSearchOptions)) {
      partSearchOptions.forEach((_, index) => {
        allDeselected[index] = false
      })
    }
    setSelectedOptions(allDeselected)
  }

  // Search for selected options
  const searchSelectedOptions = () => {
    if (!Array.isArray(partSearchOptions)) return

    const selectedPayloads = partSearchOptions
      .filter((_, index) => selectedOptions[index])
      .map((option) => option.payload)

    if (selectedPayloads.length > 0) {
      fetchAllParts(selectedPayloads)
    }
  }

  // Check if all selections are made to enable initial button
  const isFormValid = state.year && state.model && state.part

  // Check if any option is selected for the search phase
  const hasSelections = Object.values(selectedOptions).some(
    (selected) => selected
  )

  // Determine if button should be disabled based on current state
  const isButtonDisabled =
    !isFormValid || (partSearchOptions !== null && !hasSelections)

  // Get selected count for button text
  const selectedCount = Object.values(selectedOptions).filter(Boolean).length

  // Map options for each dropdown - keeping these exactly as they were
  const yearOptions = years.map((year) => (
    <option key={year} value={year}>
      {year}
    </option>
  ))

  const modelOptions = models.map((model) => (
    <option key={model} value={model}>
      {model}
    </option>
  ))

  const partOptions = parts.map((part) => (
    <option key={part} value={part}>
      {part}
    </option>
  ))

  const partSearchOptionsJSX =
    partSearchOptions &&
    partSearchOptions.map((option, index) => {
      // Split the label by comma
      const labelParts = option.label.split(",")
      const primaryText = labelParts[0].trim()
      const secondaryText = labelParts
        .slice(1)
        .join(" ")
        .trim()
        .replace(/[()]/g, "")
      return (
        <div key={index} className={Styles.optionItem}>
          <input
            type="checkbox"
            id={`option-${index}`}
            checked={!!selectedOptions[index]}
            onChange={() => handleCheckboxChange(index)}
            className={Styles.checkbox}
          />
          <label htmlFor={`option-${index}`} className={Styles.optionLabel}>
            <span className={Styles.primaryLabel}>{primaryText}</span>
            {secondaryText && (
              <span className={Styles.secondaryLabel}>{secondaryText}</span>
            )}
          </label>
        </div>
      )
    })

  return (
    <div className={Styles.settingsModalWrapper}>
      <div className={Styles.dropDownsWrapper}>
        <div className={Styles.formGroup}>
          <select
            id="yearSelect"
            className={`${Styles.dropDown} ${Styles.yearDropDown}`}
            value={state.year}
            onChange={(e) => handleDropdownChange("year", e.target.value)}
          >
            <option value="">Select Year</option>
            {yearOptions}
          </select>
        </div>

        <div className={Styles.formGroup}>
          <select
            id="modelSelect"
            className={`${Styles.dropDown} ${Styles.modelDropDown}`}
            value={state.model}
            onChange={(e) => handleDropdownChange("model", e.target.value)}
          >
            <option value="">Select Model</option>
            {modelOptions}
          </select>
        </div>

        <div className={Styles.formGroup}>
          <select
            id="partSelect"
            className={`${Styles.dropDown} ${Styles.partDropDown}`}
            value={state.part}
            onChange={(e) => handleDropdownChange("part", e.target.value)}
          >
            <option value="">Select Part</option>
            {partOptions}
          </select>
        </div>
      </div>

      {partSearchOptions &&
        Array.isArray(partSearchOptions) &&
        partSearchOptions.length > 0 && (
          <div className={Styles.searchOptionsContainer}>
            <div className={Styles.selectionControls}>
              <button className={Styles.selectAllButton} onClick={selectAll}>
                Select All
              </button>
              <button
                className={Styles.deselectAllButton}
                onClick={deselectAll}
              >
                Deselect All
              </button>
            </div>

            <div className={Styles.optionsList}>{partSearchOptionsJSX}</div>
          </div>
        )}
      <div className={Styles.buttonContainer}>
        <button
          className={`${Styles.submitButton} ${
            isButtonDisabled ? Styles.disabled : ""
          }`}
          onClick={handleSmartSubmit}
          disabled={isButtonDisabled}
        >
          {partSearchOptions
            ? `Search Selected (${selectedCount})`
            : "Get Options"}
        </button>
      </div>
      <div className="spacer"></div>
      <FilterOptions sortFilters={sortFilters} setSortFilters={setSortFilters} />
    </div>
  )
}

export default SettingsModal
