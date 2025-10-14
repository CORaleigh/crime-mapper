/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import type { TargetedEvent } from "@esri/calcite-components";

type Description = {
  group: string;
  descriptions: { description: string; count: number }[];
};

export const useApp = () => {
  const [whereClause, setWhereClause] = useState("1=1");
  const [whenClause, setWhenClause] = useState("CURRENT_TIMESTAMP - 90");
  const [combinedWhere, setCombinedWhere] = useState("1=1");
  const [geometryFilter, setFilterGeometry] = useState<__esri.Geometry | null>(
    null
  );
  const [showMap, setShowMap] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [selectedChart, setSelectedChart] = useState(undefined);
  const [categories, setCategories] = useState<__esri.Graphic[]>([]);
  const [allDescriptions, setAllDescriptions] = useState<Description[]>([]);
  const [selectedSegment, setSelectedSegment] = useState("what");
  const [showDataDictionary, setShowDataDictionary] = useState(false);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [darkTheme, setDarkTheme] = useState(() => {
    const value = localStorage.getItem("crimeMapper.darkTheme");
    if (!value) return true;
    return value === "true";
  });
  const [saveSearch, setSaveSearch] = useState(() => {
    const value = localStorage.getItem("crimeMapper.saveSearch");
    if (!value) return true;
    return value === "true";
  });

  const [showViolentCrimeOnly, setShowViolentCrimeOnly] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );

  const arcgisMap = useRef<HTMLArcgisMapElement>(null);
  const arcgisFeatureTable = useRef<HTMLArcgisFeatureTableElement>(null);
  const incidentsLayer = useRef<__esri.FeatureLayer | null>(null);
  const crimeTypes = useRef<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 900;
      setIsMobile(isMobileView);
      setShowFilter(!isMobileView);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTableReady = (
    event: TargetedEvent<HTMLArcgisFeatureTableElement>
  ) => {
    event.target.tableTemplate = {
      columnTemplates: [
        { type: "field", fieldName: "case_number" },
        { type: "field", fieldName: "crime_category", label: "Crime Category" },
        { type: "field", fieldName: "crime_code" },
        { type: "field", fieldName: "crime_description" },
        { type: "field", fieldName: "crime_type" },
        { type: "field", fieldName: "reported_block_address" },
        { type: "field", fieldName: "city" },
        { type: "field", fieldName: "district" },
        { type: "field", fieldName: "reported_date" },
        { type: "field", fieldName: "reported_dayofwk" },
      ],
    } as __esri.TableTemplate;
  };

  const handleViewReady = async (
    event: TargetedEvent<HTMLArcgisMapElement, void>
  ) => {
    const view = await event.target.view.when();
    const layer = view.map.allLayers.find(
      (layer: __esri.Layer) => layer.title === "Incidents"
    ) as __esri.FeatureLayer;

    incidentsLayer.current = layer as __esri.FeatureLayer;
    if (layer && layer.charts && layer.charts.length > 0) {
      setSelectedChart(layer.charts[0]);
    }

    updateCategories("1=1");
  };

  const updateCategories = async (where: string) => {
    const table = arcgisMap.current?.view.map?.allTables.getItemAt(0);
    if (table?.type === "feature") {
      const results = await (table as __esri.FeatureLayer).queryFeatures({
        where: where,
        returnGeometry: false,
        outFields: ["*"],
        orderByFields: ["crime_group", "crime_category"],
      });
      setCategories(results.features);
    }
  };

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => {
        return word
          .split("/")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join("/");
      })
      .join(" ");
  };

  const fetchAllDescriptions = useCallback(async () => {
    if (!arcgisMap.current) return;
    if (!arcgisMap.current.ready) return;
    const layer = arcgisMap.current.view.map?.allLayers.find(
      (layer) => layer.title === "Incidents"
    ) as __esri.FeatureLayer | undefined;
    if (!layer) return;

    const where = showViolentCrimeOnly
      ? `crime_code in ('11','12','13','17A','20A','20B','25G')`
      : Array.isArray(crimeTypes.current) && crimeTypes.current.length > 0
      ? `crime_category IN ('${crimeTypes.current.join(
          "', '"
        )}') and ${whenClause}`
      : "1=1";

    const results = await (layer as __esri.FeatureLayer).queryFeatures({
      returnDistinctValues: true,
      outFields: ["crime_category", "crime_description"],
      where: where,
      geometry: geometryFilter,
      orderByFields: ["crime_category", "crime_description"],
    });

    const countResults = await (layer as __esri.FeatureLayer).queryFeatures({
      where: where,
      returnGeometry: false,
      outStatistics: [
        {
          statisticType: "count",
          onStatisticField: "crime_description",
          outStatisticFieldName: "description_count",
        },
      ],
      groupByFieldsForStatistics: ["crime_description"],
      outFields: ["description_count", "crime_description"],
      orderByFields: ["crime_description"],
    });

    const descriptionCountMap: Record<string, number> = {};
    countResults.features.forEach((f) => {
      descriptionCountMap[f.attributes.crime_description] =
        f.attributes.description_count;
    });

    const categoryToGroup: Record<string, string> = {};
    categories.forEach((category) => {
      categoryToGroup[category.attributes.crime_category] =
        category.attributes.crime_group;
    });

    const groupDescriptions: Record<
      string,
      { description: string; count: number }[]
    > = {};
    results.features.forEach((feature) => {
      const { crime_category, crime_description } = feature.attributes;
      const group = categoryToGroup[crime_category];
      if (!group) return;
      if (!groupDescriptions[group]) {
        groupDescriptions[group] = [];
      }
      const desc = toTitleCase(crime_description);
      const count = descriptionCountMap[crime_description] ?? 0;
      if (!groupDescriptions[group].some((d) => d.description === desc)) {
        groupDescriptions[group].push({ description: desc, count });
      }
    });

    const result: {
      group: string;
      descriptions: { description: string; count: number }[];
    }[] = Object.entries(groupDescriptions).map(([group, descArr]) => ({
      group,
      descriptions: descArr.sort((a, b) =>
        a.description.localeCompare(b.description)
      ),
    }));

    setAllDescriptions(result.filter((item) => item.descriptions.length > 0));
  }, [showViolentCrimeOnly, whenClause, geometryFilter, categories]);

  const handleDescriptionShow = (show: boolean) => {
    if (show) {
      fetchAllDescriptions();
    }
  };

  const handleSaveSearchSettingsChange = (
    event: TargetedEvent<HTMLCalciteSwitchElement, void>
  ) => {
    setSaveSearch(event.target.checked);
    if (event.target.checked) {
      localStorage.setItem("crimeMapper.saveSearch", "true");
    } else {
      localStorage.clear();
      localStorage.setItem("crimeMapper.saveSearch", "false");
    }
  };

  const handleThemeChange = (
    event: TargetedEvent<HTMLCalciteSwitchElement, void>
  ) => {
    setDarkTheme(event.target.checked);
    localStorage.setItem(
      "crimeMapper.darkTheme",
      event.target.checked ? "true" : "false"
    );
    if (event.target.checked) {
      document.body.classList.remove("calcite-mode-light");
      document.body.classList.add("calcite-mode-dark");
    } else {
      document.body.classList.remove("calcite-mode-dark");
      document.body.classList.add("calcite-mode-light");
    }
  };

  useEffect(() => {
    console.log("selectedSegment changed:", selectedSegment);
    console.log("fetchAllDescriptions function");
    if (selectedSegment === "what") {
      fetchAllDescriptions();
    }
  }, [selectedSegment]);

  const handleCrimeTypeChange = (types: string[]) => {
    if (types.length > 0) {
      crimeTypes.current = types;
    }
  };

  useEffect(() => {
    const combined =
      [whereClause, whenClause].filter((c) => c !== "1=1").join(" AND ") ||
      "1=1";
    setCombinedWhere(combined);
    console.log("Combined Where Clause:", combined);
  }, [whereClause, whenClause]);

  useEffect(() => {
    if (!arcgisMap.current) return;
    if (!arcgisFeatureTable.current) if (!arcgisMap.current.ready) return;
    const layerView = arcgisMap.current?.layerViews.find(
      (layerView) => layerView.layer.title === "Incidents"
    );
    if (layerView && layerView.layer.type === "feature") {
      (layerView as __esri.FeatureLayerView).filter = {
        where: combinedWhere,
        geometry: geometryFilter,
      };
      if (arcgisFeatureTable.current?.layerView) {
        (
          arcgisFeatureTable.current.layerView as __esri.FeatureLayerView
        ).filter = {
          where: combinedWhere,
          geometry: geometryFilter,
        };
        (
          arcgisFeatureTable.current.layer as __esri.FeatureLayer
        ).definitionExpression = combinedWhere;
        arcgisFeatureTable.current.filterGeometry =
          geometryFilter as unknown as
            | __esri.Extent
            | __esri.Multipoint
            | __esri.Point
            | __esri.Polygon
            | __esri.Polyline
            | __esri.Mesh
            | null;
        arcgisFeatureTable.current.refresh();
      }
    }
  }, [combinedWhere, geometryFilter]);

  useEffect(() => {
    if (showMap || showTable) {
      setShowCharts(false);
    }
  }, [showMap, showTable]);

  useEffect(() => {
    if (showCharts) {
      setShowMap(false);
      setShowTable(false);
    }
  }, [showCharts]);

  useEffect(() => {
    if (!showMap && !showTable && !showCharts) {
      setShowMap(true);
    }
  }, [showMap, showTable, showCharts]);

  useEffect(() => {
    
    if (!darkTheme) {
      document.body.classList.remove("calcite-mode-dark");
      document.body.classList.add("calcite-mode-light");

    } else {
      document.body.classList.remove("calcite-mode-light");
    }
  }, []);

  const chartSelected = (
    event: TargetedEvent<HTMLCalciteSelectElement, void>
  ) => {
    setSelectedChart(event.target.selectedOption.value);
  };

  const handleViolentCrimeFilterChange = (show: boolean) => {
    updateCategories(show ? "violent_crime = 'Yes'" : "1=1");
    setShowViolentCrimeOnly(show);
  };

  const handleTopCrimeFilterChange = (show: boolean) => {
    updateCategories(show ? "top_crime = 'Yes'" : "1=1");
  };

  return {
    // State
    showFilter,
    setShowFilter,
    showMap,
    setShowMap,
    showTable,
    setShowTable,
    showCharts,
    setShowCharts,
    showDataDictionary,
    setShowDataDictionary,
    showDefinitions,
    setShowDefinitions,
    showDisclaimer,
    setShowDisclaimer,
    showSettings,
    setShowSettings,
    saveSearch,
    selectedSegment,
    setSelectedSegment,
    selectedChart,
    categories,
    allDescriptions,
    isMobile,
    darkTheme,

    // Refs
    arcgisMap,
    arcgisFeatureTable,
    incidentsLayer,

    // Handlers
    handleTableReady,
    handleViewReady,
    handleDescriptionShow,
    handleCrimeTypeChange,
    setWhereClause,
    setWhenClause,
    setFilterGeometry,
    chartSelected,
    handleViolentCrimeFilterChange,
    handleTopCrimeFilterChange,
    handleSaveSearchSettingsChange,
    handleThemeChange,
  };
};
