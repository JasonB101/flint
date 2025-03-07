import React, { useEffect, useState } from "react"
import Styles from "./CarPartHunter.module.scss"
import SettingsModal from "./SettingsModal.js/SettingsModal"
import PartResults from "./PartResults/PartResults"

const CarPartHunter = ({
  getCarPartOptions,
  getPartSearchOptions,
  getAllParts,
  items,
}) => {
  const [carPartOptions, setCarPartOptions] = useState({
    years: [],
    models: [],
    parts: [],
    partSearchOptions: [],
    carPartResults: [],
  })

  const [sortFilters, setSortFilters] = useState({
    sort: "price", //dist, numberOfParts
    order: "asc",
    gradesDisqualifed: [],
  })

  const fetchAllParts = async (payloads) => {
    const results = await getAllParts(payloads)
    setCarPartOptions((prev) => ({
      ...prev,
      carPartResults: results,
    }))

  }

  useEffect(() => {
    if (items.length !== 0 && carPartOptions.years.length === 0) {
      getYearModelPart()
    }
  }, [items])

  async function getYearModelPart() {
    const options = await getCarPartOptions()
    setCarPartOptions((prev) => ({
      ...prev,
      years: options.years,
      models: options.models,
      parts: options.parts,
    }))
  }
  return (
    <div className={Styles["carPartHunterWrapper"]}>
      <PartResults parts={carPartOptions.carPartResults} sortFilters={sortFilters}/>
      <div className="spacer"></div>
      <SettingsModal
        getPartSearchOptions={getPartSearchOptions}
        carPartOptions={carPartOptions}
        fetchAllParts={fetchAllParts}
        sortFilters ={sortFilters}
        setSortFilters={setSortFilters}
      />
    </div>
  )
}

export default CarPartHunter
