import React from 'react'
import Styles from './FilterOptions.module.scss'

const FilterOptions = ({ sortFilters, setSortFilters }) => {
  // Common part grades
  const availableGrades = ['A', 'B', 'C', 'X'];

  // Update sort type (price, distance, number of parts)
  const handleSortChange = (sortType) => {
    setSortFilters({
      ...sortFilters,
      sort: sortType
    });
  };

  // Update sort order (ascending or descending)
  const handleOrderChange = (orderType) => {
    setSortFilters({
      ...sortFilters,
      order: orderType
    });
  };

  // Toggle a grade in the disqualified list
  const handleGradeChange = (grade) => {
    const { gradesDisqualifed } = sortFilters;
    
    if (gradesDisqualifed.includes(grade)) {
      // Remove grade from disqualified list
      setSortFilters({
        ...sortFilters,
        gradesDisqualifed: gradesDisqualifed.filter(g => g !== grade)
      });
    } else {
      // Add grade to disqualified list
      setSortFilters({
        ...sortFilters,
        gradesDisqualifed: [...gradesDisqualifed, grade]
      });
    }
  };

  return (
    <div className={Styles.filterOptionsWrapper}>
      <div className={Styles.filterHeader}>
        <h3>Sort & Filter</h3>
      </div>
      
      <div className={Styles.filterSection}>
        <div className={Styles.sectionTitle}>Sort By</div>
        <div className={Styles.radioGroup}>
          <label className={Styles.radioLabel}>
            <input
              type="radio"
              name="sort"
              checked={sortFilters.sort === "price"}
              onChange={() => handleSortChange("price")}
            />
            <span>Price</span>
          </label>
          
          <label className={Styles.radioLabel}>
            <input
              type="radio"
              name="sort"
              checked={sortFilters.sort === "dist"}
              onChange={() => handleSortChange("dist")}
            />
            <span>Distance</span>
          </label>
          
          <label className={Styles.radioLabel}>
            <input
              type="radio"
              name="sort"
              checked={sortFilters.sort === "numberOfParts"}
              onChange={() => handleSortChange("numberOfParts")}
            />
            <span>Parts Count</span>
          </label>
        </div>
      </div>
      
      <div className={Styles.filterSection}>
        <div className={Styles.sectionTitle}>Order</div>
        <div className={Styles.radioGroup}>
          <label className={Styles.radioLabel}>
            <input
              type="radio"
              name="order"
              checked={sortFilters.order === "asc"}
              onChange={() => handleOrderChange("asc")}
            />
            <span>Ascending</span>
          </label>
          
          <label className={Styles.radioLabel}>
            <input
              type="radio"
              name="order"
              checked={sortFilters.order === "desc"}
              onChange={() => handleOrderChange("desc")}
            />
            <span>Descending</span>
          </label>
        </div>
      </div>
      
      <div className={Styles.filterSection}>
        <div className={Styles.sectionTitle}>Grade Filter</div>
        <div className={Styles.checkboxGroup}>
          {availableGrades.map(grade => (
            <label key={grade} className={Styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={sortFilters.gradesDisqualifed.includes(grade)}
                onChange={() => handleGradeChange(grade)}
              />
              <span>Grade {grade}</span>
            </label>
          ))}
        </div>
        <div className={Styles.helpText}>
          Checked grades will be excluded from results
        </div>
      </div>
    </div>
  )
}

export default FilterOptions