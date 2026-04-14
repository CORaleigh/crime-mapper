/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { type Description } from "../../types";
import { useSearchParamHelpers } from "../../useSearchParamHelpers";

import type Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

interface UseWhatParams {
  categories: Graphic[];
  allDescriptions: Description[];
  onWhereChange: (where: string | undefined) => void;
  onDescriptionShow: (show: boolean) => void;
  onCrimeTypeChange: (types: string[]) => void;
  categoryTable: FeatureLayer;
  incidentsLayer: FeatureLayer | null;
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

  const { updateSearchParam, deleteSearchParam, getSearchParam } =
    useSearchParamHelpers();
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
            (f) => f.attributes.crime_category,
          );
          const whereClause = `crime_category IN ('${categories.join("','")}')`;
          onWhereChange(whereClause);
        } else if (field === "violent_crime") {
          onWhereChange(
            "crime_code in ('11','12','13','17A','20A','20B','25G')",
          );
        }
      } else {
        onWhereChange(undefined);
      }
    },
    [categoryTable, onWhereChange],
  );

  // Tile selection handler
  const tileSelected = useCallback(
    (event: HTMLCalciteTileGroupElement["calciteTileGroupSelect"]) => {
      const selectedTiles = event.target.selectedItems;
      event.target
        .querySelectorAll("calcite-tile")
        .forEach((tile) => tile.blur());
      const newSelectedCrimeGroups = Array.from(selectedTiles).map(
        (tile) => tile.dataset.crimeGroup as string,
      );
      setSelectedCrimeGroups(newSelectedCrimeGroups);

      const crimeTypes = categories
        .filter((c) =>
          newSelectedCrimeGroups.includes(c.attributes.crime_group),
        )
        .map((c) => c.attributes.crime_category);

      setSelectedCrimeTypes(crimeTypes);
      onCrimeTypeChange(crimeTypes);

      if (newSelectedCrimeGroups.length > 0) {
        updateSearchParam(
          "selectedCrimeGroups",
          JSON.stringify(newSelectedCrimeGroups),
        );
      } else {
        deleteSearchParam("selectedCrimeGroups");
      }
    },
    [categories, onCrimeTypeChange],
  );

  // List item select handler (moved from What.tsx)
  const listItemSelect = useCallback(
    (
      item: Description,
      event: HTMLCalciteListItemElement["calciteListItemSelect"],
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
      updateSearchParam(
        "groupSelections",
        JSON.stringify({
          ...groupSelections,
          [item.group]: Array.from(new Set(next)),
        }),
      );
    },
    [groupSelections, setGroupSelections],
  );

  const selectAllInGroup = useCallback(
    (item: Description, selectAll: boolean) => {
      const next = selectAll
        ? item.descriptions.map((d) => d.description) // ALL
        : []; // CLEAR

      setGroupSelections((prevState) => ({
        ...prevState,
        [item.group]: next,
      }));

      updateSearchParam(
        "groupSelections",
        JSON.stringify({
          ...groupSelections,
          [item.group]: next,
        }),
      );
    },
    [groupSelections],
  );

  const violentCrimeSelected = useCallback(
    async (checked: boolean) => {
      if (checked) {
        updateSearchParam("filterViolentCrimes", "true");
      } else {
        deleteSearchParam("filterViolentCrimes");
      }

      setFilterViolentCrimes(checked);
      // Clear any selected groups or descriptions
      setSelectedCrimeGroups([]);
      setSelectedCrimeTypes([]);
      setDescriptions([]);

      // If violent crimes is being checked, uncheck top crimes
      if (checked) {
        deleteSearchParam("filterTopCrimes");

        setFilterTopCrimes(false);
      }

      // Provide to parent
      onViolentCrimeFilterChange?.(checked);

      // Apply the filter
      await filterByTopOrViolentCrimes(
        "violent_crime",
        !checked && !filterTopCrimes,
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
    ],
  );
  // Switch handlers (moved from What.tsx)
  const handleViolentCrimeSwitchChange = useCallback(
    async (event: HTMLCalciteSwitchElement["calciteSwitchChange"]) => {
      violentCrimeSelected(event.target.checked);
      deleteSearchParam("groupSelections");
      deleteSearchParam("selectedCrimeGroups");
    },
    [violentCrimeSelected],
  );

  const topCrimeSelected = useCallback(
    async (checked: boolean) => {
      if (checked) {
        updateSearchParam("filterTopCrimes", "true");
      } else {
        deleteSearchParam("filterTopCrimes");
      }

      setFilterTopCrimes(checked);
      // Clear any selected groups or descriptions
      setSelectedCrimeGroups([]);
      setSelectedCrimeTypes([]);
      setDescriptions([]);

      // If top crimes is being checked, uncheck violent crimes
      if (checked) {
        deleteSearchParam("filterViolentCrimes");

        setFilterViolentCrimes(false);
      }
      // Provide to parent

      onTopCrimeFilterChange?.(checked);

      // Apply the filter
      await filterByTopOrViolentCrimes(
        "top_crime",
        !checked && !filterViolentCrimes,
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
    ],
  );

  const handleTopCrimeSwitchChange = useCallback(
    async (event: HTMLCalciteSwitchElement["calciteSwitchChange"]) => {
      topCrimeSelected(event.target.checked);
      deleteSearchParam("groupSelections");
      deleteSearchParam("selectedCrimeGroups");
    },
    [topCrimeSelected],
  );

  const removeAllFilters = () => {
    setSelectedCrimeGroups([]);
    deleteSearchParam("groupSelections");
    deleteSearchParam("selectedCrimeGroups");
  };
  // Derived data
  const allSelectedDescriptions = descriptions.flatMap(
    (desc) => groupSelections[desc.group] ?? [],
  );

  // Update filtered descriptions when group selection changes
  useEffect(() => {
    setDescriptions(
      allDescriptions.filter((item) =>
        selectedCrimeGroups.includes(item.group),
      ),
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
    if (getSearchParam("groupSelections") === null) return;
    if (groupSelections && Object.keys(groupSelections).length === 0) {
      deleteSearchParam("groupSelections");
    } else {
      updateSearchParam("groupSelections", JSON.stringify(groupSelections));
    }
  }, [groupSelections]);

  useEffect(() => {
    if (allSelectedDescriptions.length > 0) {
      // If any descriptions are selected, filter by them
      onWhereChange(
        `upper(crime_description) IN ('${allSelectedDescriptions
          .join("','")
          .toUpperCase()}')`,
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
      onWhereChange(undefined);
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

  useEffect(() => {
    if (!incidentsLayer || !arcgisMap || categories.length === 0) return;
    (async () => {
      await arcgisMap?.whenLayerView(incidentsLayer as FeatureLayer);
      const violentCrimes = getSearchParam("filterViolentCrimes") === "true";
      const topCrimes = getSearchParam("filterTopCrimes") === "true";
      if (topCrimes) {
        topCrimeSelected(true);
      } else if (violentCrimes) {
        violentCrimeSelected(true);
      }
      const storedCrimeGroups = getSearchParam("selectedCrimeGroups");

      if (storedCrimeGroups) {
        setSelectedCrimeGroups(JSON.parse(storedCrimeGroups));
        const crimeTypes = categories
          .filter((c) => storedCrimeGroups.includes(c.attributes.crime_group))
          .map((c) => c.attributes.crime_category);

        setSelectedCrimeTypes(crimeTypes);
      }

      const groupSelections = getSearchParam("groupSelections");
      if (groupSelections) {
        setGroupSelections(JSON.parse(groupSelections));
      }
    })();
  }, [arcgisMap, incidentsLayer, categories.length]);

  useEffect(() => {
    setTimeout(() => {
      const group = document.querySelector("calcite-tile-group");
      if (group && group.shadowRoot) {
        const container = group.shadowRoot.querySelector(".container");
        if (container) {
          container.setAttribute("style", "grid-auto-flow: row");
        }
      }
    });
  }, []);
  return {
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
  };
}
