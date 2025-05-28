import { useState, useEffect } from "react";
import type { TargetedEvent } from "@esri/calcite-components";

type Description = { group: string; descriptions: string[] };

interface WhatProps {
  categories: __esri.Graphic[];
  allDescriptions: Description[];
  onWhereChange: (where: string) => void;
}

export default function What({
  categories,
  allDescriptions,
  onWhereChange,
}: WhatProps) {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [selectedCrimeGroups, setSelectedCrimeGroups] = useState<string[]>([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [groupSelections, setGroupSelections] = useState<
    Record<string, string[]>
  >({});

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
          next[desc.group] = [...desc.descriptions];
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
  };

  // Gather all selected descriptions for filtering
  const allSelectedDescriptions = descriptions.flatMap(
    (desc) => groupSelections[desc.group] ?? []
  );

  // Compute the where clause and provide it to the parent
  useEffect(() => {
    let whereClause = "1=1";
    if (allSelectedDescriptions.length > 0) {
      whereClause = `upper(crime_description) IN ('${allSelectedDescriptions
        .join("','")
        .toUpperCase()}')`;
    } else if (selectedCrimeGroups.length > 0) {
      whereClause = `crime_category IN ('${selectedCrimeTypes.join("','")}')`;
    }
    onWhereChange(whereClause);
  }, [
    allSelectedDescriptions,
    selectedCrimeGroups,
    selectedCrimeTypes,
    onWhereChange,
  ]);

  // Optionally, apply the where clause to the map here if you want
  // (or let App.tsx do it)

  return (
    <>
      <calcite-flow>
        <calcite-flow-item
          heading="Filter by Crime Group"
          selected={!showDescriptionFilter}
        >
          <calcite-tile-group
            label="label"
            selection-mode="multiple"
            selection-appearance="border"
            oncalciteTileGroupSelect={tileSelected}
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
          >
            <calcite-list
              label="Park features"
              selection-appearance="icon"
              selection-mode="multiple"
            >
              {descriptions?.map((item: Description) => (
                <calcite-list-item-group key={item.group} heading={item.group}>
                  {item.descriptions.map((description) => (
                    <calcite-list-item
                      label={description}
                      value={description}
                      key={description}
                      selected={groupSelections[item.group]?.includes(
                        description
                      )}
                      oncalciteListItemSelect={(
                        e: TargetedEvent<HTMLCalciteListItemElement, void>
                      ) => {
                        const prev = groupSelections[item.group] ?? [
                          ...item.descriptions,
                        ];
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
            position: "absolute",
            left: "50%",
            bottom: "24px",
            transform: "translateX(-50%)",
            zIndex: 10,
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
