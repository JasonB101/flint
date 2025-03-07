import React, { useState, useEffect } from "react"
import Styles from "./PartResults.module.scss"

const PartResults = ({ parts, sortFilters }) => {
  const [groupedParts, setGroupedParts] = useState({})
  const [expandedGroups, setExpandedGroups] = useState({})
  const { sort, order, gradesDisqualifed } = sortFilters

  // Group parts by dealer name and phone, and apply filters and sorting
  useEffect(() => {
    if (!Array.isArray(parts) || parts.length === 0) {
      setGroupedParts({})
      return
    }

    // Step 1: Filter out parts with disqualified grades
    const filteredParts = parts.filter((part) => {
      // If no grade is specified or gradesDisqualified is empty, include the part
      if (
        !part.partGrade ||
        !Array.isArray(gradesDisqualifed) ||
        gradesDisqualifed.length === 0
      ) {
        return true
      }

      // Only include parts whose grades are NOT in the disqualified list
      return !gradesDisqualifed.includes(part.partGrade)
    })

    // Step 2: Group parts by dealer
    const groups = {}
    filteredParts.forEach((part) => {
      if (!part.dealerInfo) return

      const key = `${part.dealerInfo.name}-${part.dealerInfo.phone}`

      if (!groups[key]) {
        groups[key] = {
          dealerInfo: part.dealerInfo,
          parts: [],
        }
      }

      groups[key].parts.push(part)
    })

    // Step 3: Sort parts within each group by price (ascending by default)
    Object.values(groups).forEach((group) => {
      group.parts.sort((a, b) => {
        const priceA = typeof a.price === "number" ? a.price : Infinity
        const priceB = typeof b.price === "number" ? b.price : Infinity
        return priceA - priceB
      })
    })

    // Step 4: Convert groups object to array for sorting dealers
    const groupsArray = Object.entries(groups).map(([key, value]) => ({
      key,
      ...value,
    }))

    // Step 5: Sort dealers based on the selected sort criteria
    groupsArray.sort((a, b) => {
      let comparison = 0

      switch (sort) {
        case "price":
          // First check if any group has only non-numeric prices
          const hasNumericPriceA = a.parts.some(
            (part) => typeof part.price === "number"
          )
          const hasNumericPriceB = b.parts.some(
            (part) => typeof part.price === "number"
          )

          // If one has numeric prices and the other doesn't, the one with numeric prices comes first
          if (hasNumericPriceA && !hasNumericPriceB) {
            return -1 // A comes first (has numeric price)
          }
          if (!hasNumericPriceA && hasNumericPriceB) {
            return 1 // B comes first (has numeric price)
          }

          // If both have numeric prices, compare the lowest ones
          if (hasNumericPriceA && hasNumericPriceB) {
            const lowestPriceA = Math.min(
              ...a.parts.map((part) =>
                typeof part.price === "number" ? part.price : Infinity
              )
            )
            const lowestPriceB = Math.min(
              ...b.parts.map((part) =>
                typeof part.price === "number" ? part.price : Infinity
              )
            )
            comparison = lowestPriceA - lowestPriceB
          }
          break

        case "dist":
          // Use distance from the first part of each dealer
          const distanceA = a.parts[0]?.distance || Infinity
          const distanceB = b.parts[0]?.distance || Infinity
          comparison = distanceA - distanceB
          break

        case "numberOfParts":
          // Sort by number of parts
          comparison = a.parts.length - b.parts.length
          break

        default:
          // Default to price sort
          const defaultPriceA = Math.min(
            ...a.parts.map((part) =>
              typeof part.price === "number" ? part.price : Infinity
            )
          )
          const defaultPriceB = Math.min(
            ...b.parts.map((part) =>
              typeof part.price === "number" ? part.price : Infinity
            )
          )
          comparison = defaultPriceA - defaultPriceB
      }

      // Apply sort order
      return order === "asc" ? comparison : -comparison
    })

    // Step 6: Convert sorted array back to object
    const sortedGroups = {}
    groupsArray.forEach((group) => {
      sortedGroups[group.key] = {
        dealerInfo: group.dealerInfo,
        parts: group.parts,
      }
    })

    setGroupedParts(sortedGroups)
  }, [parts, sort, order, gradesDisqualifed])

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  // Open image in new tab
  const openImage = (url) => {
    window.open(url, "_blank")
  }

  // Format price as currency
  const formatPrice = (price) => {
    if (typeof price === "string" && price.toLowerCase().includes("call")) {
      return "Call for price"
    }

    if (typeof price !== "number" || isNaN(price)) {
      return price
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getLowestPrice = (parts) => {
    // Filter out non-numeric prices
    const numericPrices = parts
      .map((part) => part.price)
      .filter((price) => typeof price === "number" && !isNaN(price))

    if (numericPrices.length === 0) {
      return "Call for price"
    }

    return Math.min(...numericPrices)
  }

  // Format phone number
  const formatPhone = (phone) => {
    // Simple formatting, can be enhanced
    return phone
  }

  if (!parts || !Array.isArray(parts) || parts.length === 0) {
    return <div className={Styles.noResults}>No parts found</div>
  }

  // Count filtered parts (after grades filtering)
  const totalFilteredParts = Object.values(groupedParts).reduce(
    (total, group) => total + group.parts.length,
    0
  )

  return (
    <div className={Styles.partResultsWrapper}>
      <h2 className={Styles.resultsHeader}>
        {totalFilteredParts} parts from {Object.keys(groupedParts).length}{" "}
        shops
        {gradesDisqualifed?.length > 0 && (
          <span className={Styles.filterInfo}>
            (excluding grade{gradesDisqualifed.length > 1 ? "s" : ""}:{" "}
            {gradesDisqualifed.join(", ")})
          </span>
        )}
      </h2>
      <div className={Styles.scrollableResults}>
        {Object.entries(groupedParts).map(([groupKey, group]) => (
          <div key={groupKey} className={Styles.dealerGroup}>
            <div
              className={Styles.dealerHeader}
              onClick={() => toggleGroup(groupKey)}
            >
              <div className={Styles.dealerInfo}>
                <h3>{group.dealerInfo.name}</h3>
                <div className={Styles.dealerMeta}>
                  <span>{group.dealerInfo.location}</span>
                  <span>•</span>
                  {group.parts[0]?.distance && (
                    <>
                      <span className={Styles.distance}>
                        {group.parts[0].distance} miles
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatPhone(group.dealerInfo.phone)}</span>
                  {group.dealerInfo.website && (
                    <>
                      <span>•</span>
                      <a
                        href={group.dealerInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className={Styles.dealerStats}>
                {group.parts.length > 0 && (
                  <span className={Styles.lowestPrice}>
                    {formatPrice(getLowestPrice(group.parts))}
                  </span>
                )}
                <span className={Styles.partCount}>
                  {group.parts.length} parts
                </span>
                <span
                  className={`${Styles.expandIcon} ${
                    expandedGroups[groupKey] ? Styles.expanded : ""
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path
                      fill="currentColor"
                      d="M2.5 4.5l3.5 3.5 3.5-3.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {expandedGroups[groupKey] && (
              <div className={Styles.partsContainer}>
                {group.parts.map((part, index) => (
                  <div key={index} className={Styles.partCard}>
                    <div className={Styles.partHeader}>
                      <span className={Styles.partTitle}>
                        {part.year} {part.model} {part.part}
                      </span>
                      <span className={Styles.partPrice}>
                        {formatPrice(part.price)}
                      </span>
                    </div>

                    <div className={Styles.partDetails}>
                      {part.description && (
                        <div className={Styles.partDescription}>
                          {part.description.replace(/,/g, " ")}
                        </div>
                      )}

                      <div className={Styles.partMeta}>
                        {part.partGrade && (
                          <div className={Styles.detailItem}>
                            <span className={Styles.detailLabel}>Grade:</span>
                            <span className={Styles.detailValue}>
                              {part.partGrade}
                            </span>
                          </div>
                        )}

                        {part.stockNumber && (
                          <div className={Styles.detailItem}>
                            <span className={Styles.detailLabel}>Stock:</span>
                            <span className={Styles.detailValue}>
                              {part.stockNumber}
                            </span>
                          </div>
                        )}

                        {part.imageUrl && (
                          <button
                            className={Styles.imageButton}
                            onClick={() => openImage(part.imageUrl)}
                            title="View part image"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16">
                              <path d="M14.5 3h-13A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3zM14 12H2V5h12v7z" />
                              <path d="M10.5 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                              <path d="M11.5 11l-2-2-3 4h8l-3-2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PartResults
