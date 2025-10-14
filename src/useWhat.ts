/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import type { TargetedEvent } from "@esri/calcite-components";
import { updateLocalStorage, type Description } from "./types";

interface UseWhatParams {
  categories: __esri.Graphic[];
  allDescriptions: Description[];
  onWhereChange: (where: string) => void;
  onDescriptionShow: (show: boolean) => void;
  onCrimeTypeChange: (types: string[]) => void;
  categoryTable: __esri.FeatureLayer;
  incidentsLayer: __esri.FeatureLayer | null;
  onViolentCrimeFilterChange?: (enabled: boolean) => void;
  onTopCrimeFilterChange?: (enabled: boolean) => void;
  arcgisMap: HTMLArcgisMapElement | null;
}

export function useWhat({
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
}: UseWhatParams) {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [selectedCrimeGroups, setSelectedCrimeGroups] = useState<string[]>([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState<string[]>([]);
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [groupSelections, setGroupSelections] = useState<
    Record<string, string[]>
  >({});
  const [filterViolentCrimes, setFilterViolentCrimes] = useState(false);
  const [filterTopCrimes, setFilterTopCrimes] = useState(false);

  // Filter helper
  const filterByTopOrViolentCrimes = useCallback(
    async (field: string, showAll: boolean) => {
      if (categoryTable && !showAll) {
        if (field === "top_crime") {
          const results = await categoryTable.queryFeatures({
            where: `${field} = 'Yes'`,
            returnDistinctValues: true,
            outFields: ["crime_category"],
          });
          const categories = results.features.map(
            (f) => f.attributes.crime_category
          );
          const whereClause = `crime_category IN ('${categories.join("','")}')`;
          onWhereChange(whereClause);
        } else if (field === "violent_crime") {
          onWhereChange(
            "crime_code in ('11','12','13','17A','20A','20B','25G')"
          );
        }
      } else {
        onWhereChange("1=1");
      }
    },
    [categoryTable, onWhereChange]
  );

  // Tile selection handler
  const tileSelected = useCallback(
    (event: TargetedEvent<HTMLCalciteTileGroupElement, void>) => {
      const selectedTiles = event.target.selectedItems;
      const newSelectedCrimeGroups = Array.from(selectedTiles).map(
        (tile) => tile.dataset.crimeGroup as string
      );
      setSelectedCrimeGroups(newSelectedCrimeGroups);

      const crimeTypes = categories
        .filter((c) =>
          newSelectedCrimeGroups.includes(c.attributes.crime_group)
        )
        .map((c) => c.attributes.crime_category);

      setSelectedCrimeTypes(crimeTypes);
      onCrimeTypeChange(crimeTypes);
      updateLocalStorage(
        "crimeMapper.selectedCrimeGroups",
        JSON.stringify(newSelectedCrimeGroups)
      );

      // Remove deselected groups from groupSelections in localStorage
      const storedSelections = JSON.parse(
        localStorage.getItem("crimeMapper.groupSelections") || "{}"
      );

      // Keep only the selected groups
      const updatedSelections: Record<string, string[]> = {};
      for (const group of newSelectedCrimeGroups) {
        if (storedSelections[group]) {
          updatedSelections[group] = storedSelections[group];
        }
      }

      updateLocalStorage(
        "crimeMapper.groupSelections",
        JSON.stringify(updatedSelections)
      );
    },
    [categories, onCrimeTypeChange]
  );

  // List item select handler (moved from What.tsx)
  const listItemSelect = useCallback(
    (
      item: Description,
      event: TargetedEvent<HTMLCalciteListItemElement, void>
    ) => {
      const prev =
        groupSelections[item.group] ??
        item.descriptions.map((d) => d.description);
      const checked = event.target.selected;
      const value = event.target.value;
      let next: string[];
      if (checked) {
        next = [...prev, value];
      } else {
        next = prev.filter((d: string) => d !== value);
      }
      setGroupSelections((prevState: Record<string, string[]>) => ({
        ...prevState,
        [item.group]: Array.from(new Set(next)),
      }));

      updateLocalStorage(
        "crimeMapper.groupSelections",
        JSON.stringify({
          ...groupSelections,
          [item.group]: Array.from(new Set(next)),
        })
      );
    },
    [groupSelections, setGroupSelections]
  );

  const violentCrimeSelected = useCallback(
    async (checked: boolean) => {
      updateLocalStorage(
        "crimeMapper.filterViolentCrimes",
        checked ? "true" : "false"
      );

      setFilterViolentCrimes(checked);
      // Clear any selected groups or descriptions
      setSelectedCrimeGroups([]);
      setSelectedCrimeTypes([]);
      setDescriptions([]);

      // If violent crimes is being checked, uncheck top crimes
      if (checked) {
        updateLocalStorage("crimeMapper.filterTopCrimes", "false");
        setFilterTopCrimes(false);
      }

      // Provide to parent
      onViolentCrimeFilterChange?.(checked);

      // Apply the filter
      await filterByTopOrViolentCrimes(
        "violent_crime",
        !checked && !filterTopCrimes
      );
    },
    [
      setFilterViolentCrimes,
      setSelectedCrimeGroups,
      setSelectedCrimeTypes,
      setDescriptions,
      setFilterTopCrimes,
      onViolentCrimeFilterChange,
      filterByTopOrViolentCrimes,
      filterTopCrimes,
    ]
  );
  // Switch handlers (moved from What.tsx)
  const handleViolentCrimeSwitchChange = useCallback(
    async (event: TargetedEvent<HTMLCalciteSwitchElement, void>) => {
      violentCrimeSelected(event.target.checked);
      updateLocalStorage("crimeMapper.groupSelections", JSON.stringify([]));
    },
    [violentCrimeSelected]
  );

  const topCrimeSelected = useCallback(
    async (checked: boolean) => {
      updateLocalStorage(
        "crimeMapper.filterTopCrimes",
        checked ? "true" : "false"
      );

      setFilterTopCrimes(checked);
      // Clear any selected groups or descriptions
      setSelectedCrimeGroups([]);
      setSelectedCrimeTypes([]);
      setDescriptions([]);

      // If top crimes is being checked, uncheck violent crimes
      if (checked) {
        updateLocalStorage("crimeMapper.filterViolentCrimes", "false");
        setFilterViolentCrimes(false);
      }
      // Provide to parent

      onTopCrimeFilterChange?.(checked);

      // Apply the filter
      await filterByTopOrViolentCrimes(
        "top_crime",
        !checked && !filterViolentCrimes
      );
    },
    [
      setFilterTopCrimes,
      setSelectedCrimeGroups,
      setSelectedCrimeTypes,
      setDescriptions,
      setFilterViolentCrimes,
      onTopCrimeFilterChange,
      filterByTopOrViolentCrimes,
      filterViolentCrimes,
    ]
  );

  const handleTopCrimeSwitchChange = useCallback(
    async (event: TargetedEvent<HTMLCalciteSwitchElement, void>) => {
      topCrimeSelected(event.target.checked);
      updateLocalStorage("crimeMapper.groupSelections", JSON.stringify([]));
    },
    [topCrimeSelected]
  );

  // Derived data
  const allSelectedDescriptions = descriptions.flatMap(
    (desc) => groupSelections[desc.group] ?? []
  );

  // Update filtered descriptions when group selection changes
  useEffect(() => {
    setDescriptions(
      allDescriptions.filter((item) => selectedCrimeGroups.includes(item.group))
    );
  }, [allDescriptions, selectedCrimeGroups]);

  // Manage groupSelections state
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
      for (const group in next) {
        if (!selectedCrimeGroups.includes(group)) {
          delete next[group];
        }
      }
      return next;
    });
  }, [selectedCrimeGroups, allDescriptions]);

  useEffect(() => {
    console.log("useWhat - Evaluating WHERE clause");
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
      filterByTopOrViolentCrimes("violent_crime", false);
    } else if (filterTopCrimes) {
      // If no groups or descriptions are selected but top crimes filter is on, filter by top crimes
      filterByTopOrViolentCrimes("top_crime", false);
    } else {
      onWhereChange("1=1");
    }
  }, [
    allSelectedDescriptions.join(","),
    selectedCrimeGroups.join(","),
    selectedCrimeTypes.join(","),
  ]);

  // Notify parent when description panel toggles
  useEffect(() => {
    onDescriptionShow(showDescriptionFilter);
  }, [showDescriptionFilter, onDescriptionShow]);

  // On mount, restore from localStorage
  useEffect(() => {
    if (!incidentsLayer || !arcgisMap || categories.length === 0) return;
    (async () => {
      await arcgisMap?.whenLayerView(incidentsLayer as __esri.FeatureLayer);
      const violentCrimes =
        localStorage.getItem("crimeMapper.filterViolentCrimes") === "true";
      const topCrimes =
        localStorage.getItem("crimeMapper.filterTopCrimes") === "true";
      if (topCrimes) {
        topCrimeSelected(true);
      } else if (violentCrimes) {
        violentCrimeSelected(true);
      }
      const storedCrimeGroups = localStorage.getItem(
        "crimeMapper.selectedCrimeGroups"
      );
      
      if (storedCrimeGroups) {
        setSelectedCrimeGroups(JSON.parse(storedCrimeGroups));
        console.log(categories)
        const crimeTypes = categories
            .filter((c) =>
            storedCrimeGroups.includes(c.attributes.crime_group)
            )
            .map((c) => c.attributes.crime_category);
        console.log(storedCrimeGroups);

        setSelectedCrimeTypes(crimeTypes);        
      }
      const groupSelections = localStorage.getItem(
        "crimeMapper.groupSelections"
      );
      if (groupSelections) {
        setGroupSelections(JSON.parse(groupSelections));
      }
    })();
  }, [arcgisMap, incidentsLayer, categories]);
  return {
    // State
    descriptions,
    selectedCrimeGroups,
    selectedCrimeTypes,
    showDescriptionFilter,
    groupSelections,
    filterViolentCrimes,
    filterTopCrimes,
    // Setters
    setSelectedCrimeGroups,
    setSelectedCrimeTypes,
    setDescriptions,
    setShowDescriptionFilter,
    setGroupSelections,
    setFilterViolentCrimes,
    setFilterTopCrimes,
    // Handlers
    tileSelected,
    listItemSelect,
    handleViolentCrimeSwitchChange,
    handleTopCrimeSwitchChange,
    filterByTopOrViolentCrimes,
  };
}
