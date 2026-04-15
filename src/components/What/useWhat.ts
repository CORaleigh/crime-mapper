import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const [showDescriptionFilter, setShowDescriptionFilter] = useState(false);
  const [groupSelections, setGroupSelections] = useState<
    Record<string, string[]>
  >({});
  const [filterViolentCrimes, setFilterViolentCrimes] = useState(false);
  const [filterTopCrimes, setFilterTopCrimes] = useState(false);

  const initializedGroups = useRef<Set<string>>(new Set());

  const { updateSearchParam, deleteSearchParam, getSearchParam } =
    useSearchParamHelpers();

  const allSelectedDescriptions = useMemo(
    () => descriptions.flatMap((desc) => groupSelections[desc.group] ?? []),
    [descriptions, groupSelections],
  );

  const selectedNoChildren = useMemo(
    () =>
      selectedCrimeGroups.filter(
        (group) =>
          groupSelections[group] && groupSelections[group].length === 0,
      ),
    [selectedCrimeGroups, groupSelections],
  );

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
          const cats = results.features.map((f) => f.attributes.crime_category);
          onWhereChange(`crime_category IN ('${cats.join("','")}')`);
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
      event.target
        .querySelectorAll("calcite-tile")
        .forEach((tile) => tile.blur());

      const newSelectedCrimeGroups = Array.from(event.target.selectedItems).map(
        (tile) => tile.dataset.crimeGroup as string,
      );

      const nextGroupSelections = Object.fromEntries(
        Object.entries(groupSelections).filter(([group]) =>
          newSelectedCrimeGroups.includes(group),
        ),
      );

      setSelectedCrimeGroups(newSelectedCrimeGroups);

      if (newSelectedCrimeGroups.length === 0) {
        deleteSearchParam("groupSelections");
        deleteSearchParam("selectedCrimeGroups");
      } else {
        updateSearchParam(
          "groupSelections",
          JSON.stringify(nextGroupSelections),
        );
        updateSearchParam(
          "selectedCrimeGroups",
          JSON.stringify(newSelectedCrimeGroups),
        );
      }

      const crimeTypes = categories
        .filter((c) =>
          newSelectedCrimeGroups.includes(c.attributes.crime_group),
        )
        .map((c) => c.attributes.crime_category);

      onCrimeTypeChange(crimeTypes);
    },
    [
      categories,
      onCrimeTypeChange,
      updateSearchParam,
      deleteSearchParam,
      groupSelections,
    ],
  );

  // List item select handler
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
      const next = checked
        ? [...prev, value]
        : prev.filter((d: string) => d !== value);
      const deduped = Array.from(new Set(next));

      setGroupSelections((prevState) => ({
        ...prevState,
        [item.group]: deduped,
      }));

      updateSearchParam(
        "groupSelections",
        JSON.stringify({ ...groupSelections, [item.group]: deduped }),
      );
    },
    [groupSelections, updateSearchParam],
  );

  const selectAllInGroup = useCallback(
    (item: Description, selectAll: boolean) => {
      const next = selectAll ? item.descriptions.map((d) => d.description) : [];

      setGroupSelections((prevState) => ({
        ...prevState,
        [item.group]: next,
      }));

      updateSearchParam(
        "groupSelections",
        JSON.stringify({ ...groupSelections, [item.group]: next }),
      );
    },
    [groupSelections, updateSearchParam],
  );

  const violentCrimeSelected = useCallback(
    async (checked: boolean) => {
      if (checked) {
        updateSearchParam("filterViolentCrimes", "true");
      } else {
        deleteSearchParam("filterViolentCrimes");
      }

      setFilterViolentCrimes(checked);
      setSelectedCrimeGroups([]);
      setDescriptions([]);

      if (checked) {
        deleteSearchParam("filterTopCrimes");
        setFilterTopCrimes(false);
      }

      onViolentCrimeFilterChange?.(checked);
      await filterByTopOrViolentCrimes(
        "violent_crime",
        !checked && !filterTopCrimes,
      );
    },
    [
      updateSearchParam,
      deleteSearchParam,
      onViolentCrimeFilterChange,
      filterByTopOrViolentCrimes,
      filterTopCrimes,
    ],
  );

  const handleViolentCrimeSwitchChange = useCallback(
    async (event: HTMLCalciteSwitchElement["calciteSwitchChange"]) => {
      violentCrimeSelected(event.target.checked);
      deleteSearchParam("groupSelections");
      deleteSearchParam("selectedCrimeGroups");
    },
    [violentCrimeSelected, deleteSearchParam],
  );

  const topCrimeSelected = useCallback(
    async (checked: boolean) => {
      if (checked) {
        updateSearchParam("filterTopCrimes", "true");
      } else {
        deleteSearchParam("filterTopCrimes");
      }

      setFilterTopCrimes(checked);
      setSelectedCrimeGroups([]);
      setDescriptions([]);

      if (checked) {
        deleteSearchParam("filterViolentCrimes");
        setFilterViolentCrimes(false);
      }

      onTopCrimeFilterChange?.(checked);
      await filterByTopOrViolentCrimes(
        "top_crime",
        !checked && !filterViolentCrimes,
      );
    },
    [
      updateSearchParam,
      deleteSearchParam,
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
    [topCrimeSelected, deleteSearchParam],
  );

  const removeAllFilters = useCallback(() => {
    setSelectedCrimeGroups([]);
    setGroupSelections({});
    initializedGroups.current.clear();
    deleteSearchParam("groupSelections");
    deleteSearchParam("selectedCrimeGroups");
  }, [deleteSearchParam]);

  // Update filtered descriptions when group selection changes
  useEffect(() => {
    setDescriptions(
      allDescriptions.filter((item) =>
        selectedCrimeGroups.includes(item.group),
      ),
    );
  }, [allDescriptions, selectedCrimeGroups]);

  // Initialize groupSelections when descriptions become available
  useEffect(() => {
    setGroupSelections((prev) => {
      const next = { ...prev };
      for (const desc of descriptions) {
        if (next[desc.group] === undefined) {
          next[desc.group] = desc.descriptions.map((d) => d.description);
          initializedGroups.current.add(desc.group);
        }
      }
      for (const group in next) {
        if (!selectedCrimeGroups.includes(group)) {
          delete next[group];
          initializedGroups.current.delete(group);
        }
      }
      return next;
    });
  }, [descriptions, selectedCrimeGroups]);

  // Apply where clause based on current filter state
  useEffect(() => {
    if (allSelectedDescriptions.length > 0) {
      onWhereChange(
        `upper(crime_description) IN ('${allSelectedDescriptions.join("','").toUpperCase()}')`,
      );
    } else if (selectedCrimeGroups.length > 0) {
      const crimeTypes = categories
        .filter(
          (c) =>
            !selectedNoChildren.includes(c.attributes.crime_group) &&
            selectedCrimeGroups.includes(c.attributes.crime_group),
        )
        .map((c) => c.attributes.crime_category);

      onWhereChange(`crime_category IN ('${crimeTypes.join("','")}')`);
    } else if (filterViolentCrimes) {
      filterByTopOrViolentCrimes("violent_crime", false);
    } else if (filterTopCrimes) {
      filterByTopOrViolentCrimes("top_crime", false);
    } else {
      onWhereChange(undefined);
    }
  }, [
    allSelectedDescriptions,
    selectedCrimeGroups,
    selectedNoChildren,
    categories,
    filterViolentCrimes,
    filterTopCrimes,
    onWhereChange,
    filterByTopOrViolentCrimes,
  ]);

  // Notify parent when description panel toggles
  useEffect(() => {
    onDescriptionShow(showDescriptionFilter);
  }, [showDescriptionFilter, onDescriptionShow]);

  // Restore state from URL params on mount
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
        const parsed = JSON.parse(storedCrimeGroups);
        setSelectedCrimeGroups(parsed);
        const crimeTypes = categories
          .filter((c) => parsed.includes(c.attributes.crime_group))
          .map((c) => c.attributes.crime_category);
        onCrimeTypeChange(crimeTypes);
      }
      const storedGroupSelections = getSearchParam("groupSelections");
      if (storedGroupSelections) {
        setGroupSelections(JSON.parse(storedGroupSelections));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arcgisMap, incidentsLayer, categories.length]);

  // Fix Calcite tile group grid layout
  useEffect(() => {
    setTimeout(() => {
      const group = document.querySelector("calcite-tile-group");
      if (group?.shadowRoot) {
        const container = group.shadowRoot.querySelector(".container");
        if (container) {
          container.setAttribute("style", "grid-auto-flow: row");
        }
      }
    });
  }, []);

  return {
    descriptions,
    selectedCrimeGroups,
    showDescriptionFilter,
    groupSelections,
    filterViolentCrimes,
    filterTopCrimes,
    setShowDescriptionFilter,
    tileSelected,
    listItemSelect,
    handleViolentCrimeSwitchChange,
    handleTopCrimeSwitchChange,
    removeAllFilters,
    selectAllInGroup,
  };
}
