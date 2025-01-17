import React, { useState } from "react"
import Styles from "./Churn.module.scss"

const ChurnSettings = ({ churnSettings, saveChurnSettings }) => {
  const [settings, setSettings] = useState(churnSettings)
  const [isSaving, setIsSaving] = useState(false)

  if (!churnSettings) return false

  const hasChanges = () => {
    return (
      +settings.priceReductionPercentage !==
        +churnSettings.priceReductionPercentage ||
      +settings.daysListedUntilPriceReduction !==
        +churnSettings.daysListedUntilPriceReduction ||
      +settings.maxPriceReduction !== +churnSettings.maxPriceReduction ||
      +settings.quantityToReList !== +churnSettings.quantityToReList ||
      settings.churnEnabled !== churnSettings.churnEnabled ||
      settings.allowPriceReduction !== churnSettings.allowPriceReduction ||
      settings.allowNegativeProfit !== churnSettings.allowNegativeProfit ||
      settings.allowReListWithWatchers !== churnSettings.allowReListWithWatchers
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveChurnSettings(settings)
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
    setIsSaving(false)
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }))
  }

  return (
    <div className={Styles.settingsWrapper}>
      <div
        className={`${Styles.mainToggle} ${
          !settings.churnEnabled ? Styles.disabled : ""
        }`}
      >
        <label className={Styles.switch}>
          <input
            type="checkbox"
            name="churnEnabled"
            checked={settings.churnEnabled}
            onChange={handleChange}
          />
          <span className={Styles.slider}></span>
        </label>
        <span>Automatic Churning</span>
      </div>

      <div className={Styles.settingsGrid}>
        <div className={Styles.setting}>
          <label>Price Reduction (%)</label>
          <input
            disabled={!settings.churnEnabled}
            type="range"
            name="priceReductionPercentage"
            min="0.01"
            max="0.5"
            step="0.01"
            value={settings.priceReductionPercentage}
            onChange={handleChange}
          />
          <span>{(settings.priceReductionPercentage * 100).toFixed(0)}%</span>
        </div>

        <div className={Styles.setting}>
          <label>Days Until Price Reduction</label>
          <input
            disabled={!settings.churnEnabled}
            type="range"
            name="daysListedUntilPriceReduction"
            min="1"
            max="90"
            value={settings.daysListedUntilPriceReduction}
            onChange={handleChange}
          />
          <span>{settings.daysListedUntilPriceReduction} days</span>
        </div>

        <div className={Styles.setting}>
          <label>Maximum Price Reduction ($)</label>
          <input
            disabled={!settings.churnEnabled}
            type="range"
            name="maxPriceReduction"
            min="5"
            max="100"
            value={settings.maxPriceReduction}
            onChange={handleChange}
          />
          <span>${settings.maxPriceReduction}.00</span>
        </div>

        <div className={Styles.setting}>
          <label>Quantity to Relist Daily</label>
          <input
            disabled={!settings.churnEnabled}
            type="range"
            name="quantityToReList"
            min="1"
            max="10"
            step="1"
            value={settings.quantityToReList}
            onChange={handleChange}
          />
          <span>{`${settings.quantityToReList} ${
            settings.quantityToReList > 1 ? "items" : "item"
          }`}</span>
        </div>

        <div className={Styles.toggles}>
          <div className={Styles.toggle}>
            <label className={Styles.switch}>
              <input
                type="checkbox"
                name="allowPriceReduction"
                checked={settings.allowPriceReduction}
                onChange={handleChange}
              />
              <span className={Styles.slider}></span>
            </label>
            <span>Allow Price Reduction</span>
          </div>

          <div className={Styles.toggle}>
            <label className={Styles.switch}>
              <input
                type="checkbox"
                name="allowNegativeProfit"
                checked={settings.allowNegativeProfit}
                onChange={handleChange}
              />
              <span className={Styles.slider}></span>
            </label>
            <span>Allow Negative Profit</span>
          </div>

          <div className={Styles.toggle}>
            <label className={Styles.switch}>
              <input
                type="checkbox"
                name="allowReListWithWatchers"
                checked={settings.allowReListWithWatchers}
                onChange={handleChange}
              />
              <span className={Styles.slider}></span>
            </label>
            <span>Allow Relist with Watchers</span>
          </div>
        </div>
      </div>
      <button
        className={Styles.saveButton}
        onClick={handleSave}
        disabled={!hasChanges() || isSaving}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  )
}

export default ChurnSettings
