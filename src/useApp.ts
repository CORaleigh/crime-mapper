/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from "react";
import type { TargetedEvent } from "@esri/calcite-components";

type Description = {
  group: string;
  descriptions: { description: string; count: number }[];
};

export const useApp = () => {
  const [whereClause, setWhereClause] = useState<string | undefined>(undefined);
  const [whenClause, setWhenClause] = useState<string | undefined>(undefined);
  const [combinedWhere, setCombinedWhere] = useState<string | undefined>(
    undefined
  );
  const [geometryFilter, setFilterGeometry] = useState<
    __esri.Polygon | __esri.Extent | null
  >(null);
  const [showMap, setShowMap] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [tableReady, setTableReady] = useState(false);

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
  const [showAbout, setShowAbout] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const [showViolentCrimeOnly, setShowViolentCrimeOnly] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );

  const arcgisMap = useRef<HTMLArcgisMapElement>(undefined);
  const arcgisFeatureTable = useRef<HTMLArcgisFeatureTableElement>(null);
  const incidentsLayer = useRef<__esri.FeatureLayer | null>(null);
  const incidentsLayerView = useRef<__esri.FeatureLayerView | null>(null);

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
    
    arcgisFeatureTable.current = event.target;
    arcgisFeatureTable.current.referenceElement = arcgisMap.current;
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
    setTableReady(true);
  };

  const handleViewReady = async (
    event: TargetedEvent<HTMLArcgisMapElement, void>
  ) => {
    
    const view = await event.target.view.when();
    const layer = view.map.allLayers.find(
      (layer: __esri.Layer) => layer.title === "Offenses"
    ) as __esri.FeatureLayer;

    incidentsLayer.current = layer as __esri.FeatureLayer;
    arcgisMap.current = event.target;

    if (layer && layer.charts && layer.charts.length > 0) {
      incidentsLayerView.current = (await event.target.whenLayerView(
        layer
      )) as __esri.FeatureLayerView;

      setSelectedChart(layer.charts[0]);
    }

    updateCategories("1=1");
        setMapReady(true);

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
      (layer) => layer.title === "Offenses"
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

  const handleDescriptionShow = useCallback(
    (show: boolean) => {
      if (show) {
        fetchAllDescriptions();
      }
    },
    [fetchAllDescriptions]
  );

  const handleThemeChange = useCallback(() => {
    setTheme((prev: "light" | "dark") => {
      const newTheme = prev === "light" ? "dark" : "light";
      const body = document.querySelector("body");
      if (body) {
        body.classList.remove(
          newTheme === "light" ? "calcite-mode-dark" : "calcite-mode-light"
        );
        body.classList.add(
          newTheme === "light" ? "calcite-mode-light" : "calcite-mode-dark"
        );
      }
      return newTheme;
    });
  }, []);
  useEffect(() => {
    if (selectedSegment === "what") {
      fetchAllDescriptions();
    }
  }, [selectedSegment, fetchAllDescriptions]);

  const handleCrimeTypeChange = (types: string[]) => {
    if (types.length > 0) {
      crimeTypes.current = types;
    }
  };

  useEffect(() => {
    if (whereClause === undefined && whenClause === undefined) return;
    const combined = [whereClause, whenClause]
      .filter((c) => c !== undefined)
      .join(" AND ");

    setCombinedWhere(combined);
  }, [whereClause, whenClause]);

  // 1️⃣ ArcGIS update
  useEffect(() => {
    if (!incidentsLayerView.current) return;
    console.log(geometryFilter);
    incidentsLayerView.current.filter = {
      where: combinedWhere,
      geometry: geometryFilter,
    };
    
    if (tableReady && arcgisFeatureTable.current) {
      const layer = arcgisFeatureTable.current.layer as __esri.FeatureLayer;
      layer.definitionExpression = combinedWhere;
      arcgisFeatureTable.current.filterGeometry = geometryFilter;
      arcgisFeatureTable.current.refresh();
      layer.refresh();
    }
  }, [combinedWhere, geometryFilter, incidentsLayerView.current]);

  // 2️⃣ URL sync (debounced, optional)

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
    mapReady,
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
    showAbout,
    setShowAbout,
    showFaq,
    setShowFaq,
    showHelp,
    setShowHelp,
    selectedSegment,
    setSelectedSegment,
    selectedChart,
    categories,
    allDescriptions,
    isMobile,
    whereClause,
    theme,
    // Refs
    arcgisMap,
    arcgisFeatureTable,
    incidentsLayer,
    incidentsLayerView,

    // Handlers
    handleTableReady,
    handleViewReady,
    handleDescriptionShow,
    handleCrimeTypeChange,
    setWhereClause,
    setWhenClause,
    geometryFilter,
    setFilterGeometry,
    chartSelected,
    handleViolentCrimeFilterChange,
    handleTopCrimeFilterChange,
    handleThemeChange,
  };
};
