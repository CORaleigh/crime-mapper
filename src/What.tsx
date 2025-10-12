import { useState, useEffect, useCallback } from "react";
import type { TargetedEvent } from "@esri/calcite-components";

// Types
// Description type for crime descriptions grouped by crime group
type Description = {
  group: string;
  descriptions: { description: string; count: number }[];
};

// Props for What component
interface WhatProps {
  categories: __esri.Graphic[];
  allDescriptions: Description[];
  onWhereChange: (where: string) => void;
  onDescriptionShow: (show: boolean) => void;
  onCrimeTypeChange: (types: string[]) => void;
  onFilterPanelClose: () => void;
  open: boolean;
  isMobile: boolean;
  onViolentCrimeFilterChange: (enabled: boolean) => void;
  onTopCrimeFilterChange: (enabled: boolean) => void;
  categoryTable: __esri.FeatureLayer;
}

// What component for filtering by crime group and description
export default function What({
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
}: WhatProps) {
  // States
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [selectedCrimeGroups, setSelectedCrimeGroups] = useState<string[]>([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [groupSelections, setGroupSelections] = useState<
    Record<string, string[]>
  >({});
  const [filterViolentCrimes, setFilterViolentCrimes] = useState(false);
  const [filterTopCrimes, setFilterTopCrimes] = useState(false);

  // Functions
  // Function to filter by top or violent crimes
  const filterByTopOrViolentCrimes = useCallback(
    async (
      field: string,
      showAll: boolean,
      categoryTable: __esri.FeatureLayer
    ) => {
      
      if (categoryTable && !showAll) {
        if (field === "top_crime") {
          // Query the categories table for all categories where top_crime = 'Yes'
          // Then build a where clause to filter the main crimes layer
          await categoryTable
            .queryFeatures({
              where: `${field} = 'Yes'`,
              returnDistinctValues: true,
              outFields: ["crime_category"],
            })
            .then((results) => {
              const categories = results.features.map(
                (f) => f.attributes.crime_category
              );
              const whereClause = `crime_category IN ('${categories.join(
                "','"
              )}')`;

              onWhereChange(whereClause);
            });
        } else if (field === "violent_crime") {
          // Violent crimes are hard-coded since there is no field in the categories table
          onWhereChange(
            "crime_code in ('11','12','13','17A','20A','20B','25G')"
          );
        }
      } else {
        // Show all crimes
        
        onWhereChange("1=1");
      }
    },
    [onWhereChange]
  );

  // Handle tile selection for crime groups
  const tileSelected = (
    event: TargetedEvent<HTMLCalciteTileGroupElement, void>
  ) => {
    const selectedTiles = event.target.selectedItems;
    const newSelectedCrimeGroups = Array.from(selectedTiles).map(
      (tile) => tile.dataset.crimeGroup as string
    );
    setSelectedCrimeGroups(newSelectedCrimeGroups);

    // Always get ALL crime types for ALL selected groups
    const crimeTypes = categories
      .filter((category) =>
        newSelectedCrimeGroups.includes(category.attributes.crime_group)
      )
      .map((category) => category.attributes.crime_category);
    setSelectedCrimeTypes(crimeTypes);
    // Provide to parent
    onCrimeTypeChange(crimeTypes);
  };

  // Gather all selected descriptions for filtering
  const allSelectedDescriptions = descriptions.flatMap(
    (desc) => groupSelections[desc.group] ?? []
  );

  // Filter allDescriptions by selectedCrimeGroups
  useEffect(() => {
    setDescriptions(
      allDescriptions.filter((item) => selectedCrimeGroups.includes(item.group))
    );
  }, [allDescriptions, selectedCrimeGroups]);

  // When a group is added, if it doesn't exist in groupSelections, select all by default
  useEffect(() => {
    setGroupSelections((prev) => {
      const next = { ...prev };
      for (const desc of allDescriptions) {
        if (
          selectedCrimeGroups.includes(desc.group) &&
          next[desc.group] === undefined
        ) {
          next[desc.group] = desc.descriptions.map((d) => d.description);
        }
      }
      // Remove selections for groups that are no longer selected
      for (const group in next) {
        if (!selectedCrimeGroups.includes(group)) {
          delete next[group];
        }
      }
      return next;
    });
  }, [selectedCrimeGroups, allDescriptions]);

  // Compute the where clause and provide it to the parent
  useEffect(() => {
    if (allSelectedDescriptions.length > 0) {
      // If any descriptions are selected, filter by them
      onWhereChange(
        `upper(crime_description) IN ('${allSelectedDescriptions
          .join("','")
          .toUpperCase()}')`
      );
    } else if (selectedCrimeGroups.length > 0) {
      // If no descriptions are selected but groups are, filter by all types in those groups
      onWhereChange(`crime_category IN ('${selectedCrimeTypes.join("','")}')`);
    } else if (filterViolentCrimes) {
      // If no groups or descriptions are selected but violent crimes filter is on, filter by violent crimes
      filterByTopOrViolentCrimes("violent_crime", false, categoryTable);
    } else if (filterTopCrimes) {
      // If no groups or descriptions are selected but top crimes filter is on, filter by top crimes
      filterByTopOrViolentCrimes("top_crime", false, categoryTable);
    } else {
      onWhereChange("1=1");
    }
  }, [
    allSelectedDescriptions,
    selectedCrimeGroups,
    selectedCrimeTypes,
    onWhereChange,
    filterViolentCrimes,
    filterTopCrimes,
    filterByTopOrViolentCrimes,
    categoryTable,
  ]);

  useEffect(() => {
    onDescriptionShow(showDescriptionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDescriptionFilter]);

  return (
    <>
      <calcite-flow>
        <calcite-flow-item
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
                onClick={() => {
                  setSelectedCrimeGroups([]);
                }}
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
                oncalciteSwitchChange={async (event) => {
                  // If violent crimes is checked, uncheck top crimes
                  setFilterViolentCrimes(event.target.checked);
                  // Clear any selected groups or descriptions
                  setSelectedCrimeGroups([]);
                  setSelectedCrimeTypes([]);
                  setDescriptions([]);
                  // If violent crimes is being checked, uncheck top crimes
                  if (event.target.checked) {
                    setFilterTopCrimes(false);
                  }
                  // Provide to parent
                  onViolentCrimeFilterChange(event.target.checked);

                  // Apply the filter
                  await filterByTopOrViolentCrimes(
                    "violent_crime",
                    !event.target.checked && !filterTopCrimes,
                    categoryTable
                  );
                }}
              />
              Violent Crimes
            </calcite-label>
            <calcite-label layout="inline">
              <calcite-switch
                label="Top Crimes"
                checked={filterTopCrimes}
                oncalciteSwitchChange={useCallback(
                  async (
                    event: TargetedEvent<HTMLCalciteSwitchElement, void>
                  ) => {
                    // If top crimes is checked, uncheck violent crimes
                    setFilterTopCrimes(event.target.checked);
                    // Clear any selected groups or descriptions
                    setSelectedCrimeGroups([]);
                    setSelectedCrimeTypes([]);
                    setDescriptions([]);
                    // If top crimes is being checked, uncheck violent crimes
                    if (event.target.checked) {
                      setFilterViolentCrimes(false);
                    }
                    // Provide to parent
                    onTopCrimeFilterChange(event.target.checked);

                    // Apply the filter
                    await filterByTopOrViolentCrimes(
                      "top_crime",
                      !event.target.checked && !filterViolentCrimes,
                      categoryTable
                    );
                  },
                  [
                    onTopCrimeFilterChange,
                    filterViolentCrimes,
                    filterByTopOrViolentCrimes,
                    categoryTable,
                  ]
                )}
              />
              Top Crimes
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
                <div slot="content-top" className="tile-icon">
                  <img
                    src={category.attributes.icon}
                    alt={category.attributes.crime_group}
                  />
                </div>
                <div slot="content-bottom" className="tile-text">
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
                  {item.descriptions.map((description) => (
                    <calcite-list-item
                      label={`${description.description} (${description.count})`}
                      value={description.description}
                      key={description.description}
                      selected={groupSelections[item.group]?.includes(
                        description.description
                      )}
                      oncalciteListItemSelect={(
                        e: TargetedEvent<HTMLCalciteListItemElement, void>
                      ) => {
                        const prev =
                          groupSelections[item.group] ??
                          item.descriptions.map((d) => d.description);
                        const checked = e.target.selected;
                        const value = e.target.value;
                        let next: string[];
                        if (checked) {
                          next = [...prev, value];
                        } else {
                          next = prev.filter((d) => d !== value);
                        }
                        setGroupSelections((prev) => ({
                          ...prev,
                          [item.group]: Array.from(new Set(next)),
                        }));
                      }}
                    ></calcite-list-item>
                  ))}
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
            onClick={() => setShowDescriptionFilter((prev) => !prev)}
          ></calcite-fab>
        </div>
      )}
    </>
  );
}
