import { useState, useEffect } from "react";
import type { TargetedEvent } from "@esri/calcite-components";

type Description = { group: string; descriptions: { description: string; count: number }[] };

interface WhatProps {
  categories: __esri.Graphic[];
  allDescriptions: Description[];
  onWhereChange: (where: string) => void;
  onDescriptionShow: (show: boolean) => void;
  onCrimeTypeChange: (types: string[]) => void;
  onFilterPanelClose: () => void;
  open: boolean
  isMobile: boolean;
}

export default function What({
  categories,
  allDescriptions,
  onWhereChange,
  onDescriptionShow,
  onCrimeTypeChange,
  onFilterPanelClose,
  open,
  isMobile
}: WhatProps) {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [selectedCrimeGroups, setSelectedCrimeGroups] = useState<string[]>([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [groupSelections, setGroupSelections] = useState<Record<string, string[]>>({});

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
    
    onCrimeTypeChange(crimeTypes);
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
  }, [allSelectedDescriptions, selectedCrimeGroups, selectedCrimeTypes, onWhereChange]);

  useEffect(() => {
    onDescriptionShow(showDescriptionFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDescriptionFilter]);

  return (
    <>
      <calcite-flow>
      <calcite-flow-item
        heading="Filter by Crime Group"
        selected={!showDescriptionFilter} closable={isMobile}
        oncalciteFlowItemClose={onFilterPanelClose}
        closed={!open}
      >
        <div style={{ position: "sticky", top: 0, background: "var(--calcite-ui-foreground-1)", zIndex: 2 }}>
          {/* Optionally, you can add a custom header here if needed */}
        </div>
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
        closable={isMobile}
        closed={!open}
        oncalciteFlowItemClose={onFilterPanelClose}
        >
        <calcite-list
          label="Park features"
          selection-appearance="icon"
          selection-mode="multiple"
        >
          {descriptions?.map((item: Description) => (
          <calcite-list-item-group
            key={item.group}
            heading={item.group}
          >
            {item.descriptions.map((description) => (
            <calcite-list-item
              label={`${description.description} (${description.count})`}
              value={description.description}
              key={description.description}
              selected={groupSelections[item.group]?.includes(description.description)}
              oncalciteListItemSelect={(
                e: TargetedEvent<HTMLCalciteListItemElement, void>
              ) => {
                const prev = groupSelections[item.group] ?? item.descriptions.map((d) => d.description);
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