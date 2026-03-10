// (no direct React imports needed)
import type { TargetedEvent } from "@esri/calcite-components";
import { useWhat } from "./useWhat";
import { type Description } from "../../types";
import styles from "./What.module.css";

import type Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

interface WhatProps {
  categories: Graphic[];
  allDescriptions: Description[];
  onWhereChange: (where: string | undefined) => void;
  onDescriptionShow: (show: boolean) => void;
  onCrimeTypeChange: (types: string[]) => void;
  onFilterPanelClose: () => void;
  open: boolean;
  isMobile: boolean;
  onViolentCrimeFilterChange: (enabled: boolean) => void;
  onTopCrimeFilterChange: (enabled: boolean) => void;
  categoryTable: FeatureLayer;
  incidentsLayer: FeatureLayer | null;
  arcgisMap: HTMLArcgisMapElement | undefined;
}

export default function What(props: WhatProps) {
  const {
    categories,
    allDescriptions,
    onWhereChange,
    onDescriptionShow,
    onCrimeTypeChange,
    onFilterPanelClose,
    open,
    isMobile,
    onViolentCrimeFilterChange,
    onTopCrimeFilterChange,
    categoryTable,
    incidentsLayer,
    arcgisMap,
  } = props;

  const {
    // State
    descriptions,
    selectedCrimeGroups,
    showDescriptionFilter,
    groupSelections,
    filterViolentCrimes,
    filterTopCrimes,
    // Setters
    setShowDescriptionFilter,
    // Handlers
    tileSelected,
    listItemSelect,
    handleViolentCrimeSwitchChange,
    handleTopCrimeSwitchChange,
    removeAllFilters,
    selectAllInGroup,
  } = useWhat({
    categories,
    allDescriptions,
    onWhereChange,
    onDescriptionShow,
    onCrimeTypeChange,
    categoryTable,
    incidentsLayer,
    onViolentCrimeFilterChange,
    onTopCrimeFilterChange,
    arcgisMap,
  });

  return (
    <>
      <calcite-flow>
        <calcite-flow-item
          id="crime-group-flow"
          heading="Filter by Crime Group"
          selected={!showDescriptionFilter}
          closable={isMobile}
          oncalciteFlowItemClose={onFilterPanelClose}
          closed={!open}
        >
          {selectedCrimeGroups.length > 0 && (
            <div slot="header-actions-end">
              <calcite-action
                icon="trash"
                text="Remove Filter"
                textEnabled
                onClick={removeAllFilters}
              ></calcite-action>
            </div>
          )}
          <div
            style={{
              position: "sticky",
              top: 0,
              background: "var(--calcite-color-foreground-2)",
              zIndex: 2,
              paddingTop: "1rem",
              paddingBottom: "1rem",
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
            }}
          >
            <calcite-label layout="inline">
              <calcite-switch
                label="Violent Crimes"
                checked={filterViolentCrimes}
                oncalciteSwitchChange={handleViolentCrimeSwitchChange}
              />
              Violent Crimes
            </calcite-label>
            <calcite-label layout="inline">
              <calcite-switch
                label="Top Requested Crimes"
                checked={filterTopCrimes}
                oncalciteSwitchChange={handleTopCrimeSwitchChange}
              />
              Top Requested Crimes
            </calcite-label>
          </div>
          <calcite-alert
            open={filterViolentCrimes}
            label={""}
            kind="warning"
            icon="exclamation-mark-triangle-f"
            autoClose
            autoCloseDuration="medium"
          >
            <div slot="title">Sex Offenses Not Shown on Map</div>
            <div slot="message">
              Due to privacy concerns, this category is excluded from the map.
            </div>
          </calcite-alert>
          <calcite-tile-group
            label="label"
            selection-mode="multiple"
            selection-appearance="border"
            oncalciteTileGroupSelect={tileSelected}
            checked={filterTopCrimes}
          >
            
            {Array.from(
              new Map(
                categories.map((category) => [
                  category.attributes.crime_group,
                  category,
                ])
              ).values()
            ).map((category) => (
              <calcite-tile
                key={category.attributes.OBJECTID}
                data-crime-group={category.attributes.crime_group}
                selected={selectedCrimeGroups.includes(
                  category.attributes.crime_group
                )}
              >
                <div slot="content-top" className={styles.tileIcon}>
                  <img
                    src={`./icons/${category.attributes.icon_svg}`}
                    alt={category.attributes.crime_group}
                  />
                </div>
                <div slot="content-bottom" className={styles.tileText}>
                  <h3>{category.attributes.crime_group}</h3>
                </div>
              </calcite-tile>
            ))}
          </calcite-tile-group>
        </calcite-flow-item>
        {showDescriptionFilter && (
          <calcite-flow-item
            heading="Filter by Description"
            selected={!showDescriptionFilter}
            oncalciteFlowItemBack={() => setShowDescriptionFilter(false)}
            closable={isMobile}
            closed={!open}
            oncalciteFlowItemClose={onFilterPanelClose}
          >
            <calcite-list
              label="Descriptions"
              selection-appearance="icon"
              selection-mode="multiple"
            >
              {descriptions?.map((item: Description) => (
                <calcite-list-item-group key={item.group} heading={item.group}>
                  <div
                    style={{
                      display: "flex",
                      position: "absolute",
                      right: "1rem",
                    }}
                  >
                    <calcite-action
                      text="Select All"
                      scale="s"
                      textEnabled
                      icon="check-square"
                      onClick={() => {
                        selectAllInGroup(item, true);
                      }}
                      style={{ marginTop: "0.5rem" }}
                    ></calcite-action>
                    <calcite-action
                      text="Select None"
                      scale="s"
                      textEnabled
                      icon="square"
                      onClick={() => {
                        selectAllInGroup(item, false);
                      }}
                      style={{ marginTop: "0.5rem" }}
                    ></calcite-action>
                  </div>
                  {item.descriptions.map(
                    (description: { description: string; count: number }) => (
                      <calcite-list-item
                        label={`${description.description} (${description.count})`}
                        value={description.description}
                        key={description.description}
                        selected={groupSelections[item.group]?.includes(
                          description.description
                        )}
                        oncalciteListItemSelect={(
                          e: TargetedEvent<HTMLCalciteListItemElement, void>
                        ) => listItemSelect(item, e)}
                      ></calcite-list-item>
                    )
                  )}
                </calcite-list-item-group>
              ))}
            </calcite-list>
          </calcite-flow-item>
        )}
      </calcite-flow>
      {/* Center the FAB inside the panel with absolute positioning */}
      {selectedCrimeGroups.length > 0 && !showDescriptionFilter && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            position: "sticky",
            bottom: "24px",
            left: 0,
            zIndex: 10,
            background: "transparent",
          }}
        >
          <calcite-fab
            slot="footer"
            icon="filter"
            text-enabled
            text="Filter by Description"
            scale="l"
            onClick={() => setShowDescriptionFilter((prev: boolean) => !prev)}
          ></calcite-fab>
        </div>
      )}
    </>
  );
}
