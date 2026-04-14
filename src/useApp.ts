/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback, useReducer } from "react";

import type Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Layer from "@arcgis/core/layers/Layer";
import type FeatureLayerView from "@arcgis/core/views/layers/FeatureLayerView";
import type TableTemplate from "@arcgis/core/widgets/FeatureTable/support/TableTemplate";
import Collection from "@arcgis/core/core/Collection";
import HighlightOptions from "@arcgis/core/views/support/HighlightOptions";
import type { GeometryUnion } from "@arcgis/core/geometry/types";

type Description = {
  group: string;
  descriptions: { description: string; count: number }[];
};

export const useApp = () => {
  const [whereClause, setWhereClause] = useState<string | undefined>(undefined);
  const [whenClause, setWhenClause] = useState<string | undefined>(undefined);
  const [combinedWhere, setCombinedWhere] = useState<string | undefined>(
    undefined,
  );
  const [geometryFilter, setFilterGeometry] = useState<GeometryUnion | undefined>(
    undefined,
  );
  const [showMap, setShowMap] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [tableReady, setTableReady] = useState(false);

  const [showTable, setShowTable] = useState(false);
  const [showFilter, setShowFilter] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [categories, setCategories] = useState<Graphic[]>([]);
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
    typeof window !== "undefined" ? window.innerWidth >= 900 : false,
  );

  const arcgisMap = useRef<HTMLArcgisMapElement | null>(null);
  const arcgisFeatureTable = useRef<HTMLArcgisFeatureTableElement>(null);
  const incidentsLayer = useRef<FeatureLayer | null>(null);
  const incidentsLayerView = useRef<FeatureLayerView | null>(null);

  const crimeTypes = useRef<string[]>([]);

  const chartsLoaded = useRef(false);
  const tableLoaded = useRef(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

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

  const handleTableReady = async (
    event: HTMLArcgisFeatureTableElement["arcgisReady"],
  ) => {
    if (!arcgisMap.current) return;
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
        {
          type: "field",
          fieldName: "reported_date",
          initialSortPriority: 1,
          direction: "asc",
        },
        { type: "field", fieldName: "reported_dayofwk" },
      ],
    } as TableTemplate;
    setTableReady(true);
    setTimeout(() => {
      const panel =
        arcgisFeatureTable.current?.shadowRoot?.querySelector("calcite-panel");
      panel?.setAttribute("closable", "true");
      panel?.addEventListener("calcitePanelClose", () => {
        setShowTable(false);
      });

      setTimeout(() => {
        const expandAction = document.createElement("calcite-action");
        expandAction.setAttribute("slot", "header-actions-end");
        expandAction.setAttribute("text", "Expand");
        expandAction.setAttribute("icon", "chevrons-up");

        expandAction.addEventListener("click", () => {
          setShowMap((prev) => {
            expandAction.setAttribute(
              "icon",
              prev ? "chevrons-down" : "chevrons-up",
            );
            expandAction.setAttribute("text", prev ? "Expand" : "Collapse");
            expandAction.setAttribute("title", prev ? "Expand" : "Collapse");
            return !prev;
          });
        });

        const headerActionsEnd = panel?.shadowRoot?.querySelector(
          ".header-actions--end",
        );

        console.log(headerActionsEnd?.querySelector("#close"));

        const actionMenu = panel?.shadowRoot?.querySelector("#close");
        console.log("headerActionsEnd", headerActionsEnd, actionMenu);

        (headerActionsEnd as Node)?.insertBefore(
          expandAction,
          actionMenu as Node,
        );
      }, 500);
    }, 1000);
  };

  const handleViewReady = async (
    event: HTMLArcgisMapElement["arcgisViewReadyChange"],
  ) => {
    const view = await event.target.view.when();
    event.target.highlights = new Collection([
      new HighlightOptions({ name: "default", color: "yellow" }),
    ]);
    console.log(event.target.highlights);
    const layer = view?.map?.allLayers.find(
      (layer: Layer) => layer.title === "Offenses",
    ) as FeatureLayer;

    incidentsLayer.current = layer as FeatureLayer;
    arcgisMap.current = event.target;

    if (layer && layer.charts && layer.charts.length > 0) {
      incidentsLayerView.current = (await event.target.whenLayerView(
        layer,
      )) as FeatureLayerView;
    }

    updateCategories("1=1");
    setMapReady(true);
  };

  const updateCategories = async (where: string) => {
    const table = arcgisMap.current?.view.map?.allTables.getItemAt(0);
    if (table?.type === "feature") {
      const results = await (table as FeatureLayer).queryFeatures({
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
      (layer) => layer.title === "Offenses",
    ) as FeatureLayer | undefined;
    if (!layer) return;

    const where = showViolentCrimeOnly
      ? `crime_code in ('11','12','13','17A','20A','20B','25G')`
      : Array.isArray(crimeTypes.current) && crimeTypes.current.length > 0
        ? `crime_category IN ('${crimeTypes.current.join(
            "', '",
          )}') and ${whenClause}`
        : combinedWhere;

    const results = await (layer as FeatureLayer).queryFeatures({
      returnDistinctValues: true,
      outFields: ["crime_category", "crime_description"],
      where: where,
      geometry: geometryFilter,
      orderByFields: ["crime_category", "crime_description"],
    });

    const countResults = await (layer as FeatureLayer).queryFeatures({
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
        a.description.localeCompare(b.description),
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
    [fetchAllDescriptions],
  );

  const handleThemeChange = useCallback(() => {
    setTheme((prev: "light" | "dark") => {
      const newTheme = prev === "light" ? "dark" : "light";
      const body = document.querySelector("body");
      if (body) {
        body.classList.remove(
          newTheme === "light" ? "calcite-mode-dark" : "calcite-mode-light",
        );
        body.classList.add(
          newTheme === "light" ? "calcite-mode-light" : "calcite-mode-dark",
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
    incidentsLayerView.current.filter = {
      where: combinedWhere,
      geometry: geometryFilter,
    };

    if (tableReady && arcgisFeatureTable.current) {
      const layer = arcgisFeatureTable.current.layer as FeatureLayer;
      layer.definitionExpression = combinedWhere;
      //arcgisFeatureTable.current.refresh();
      //layer.refresh();
    }
  }, [combinedWhere, geometryFilter, incidentsLayerView.current]);

  // 2️⃣ URL sync (debounced, optional)

  useEffect(() => {
    if (showTable && showCharts) {
      setShowCharts(false);
    }
  }, [showMap, showTable]);

  useEffect(() => {
    if (showCharts && showTable) {
      setShowTable(false);
    }
  }, [showMap, showCharts]);

  useEffect(() => {
    if (!showMap && !showTable && !showCharts) {
      setShowMap(true);
    }
  }, [showMap, showTable, showCharts]);

  const handleViolentCrimeFilterChange = (show: boolean) => {
    updateCategories(show ? "violent_crime = 'Yes'" : "1=1");
    setShowViolentCrimeOnly(show);
  };

  const handleTopCrimeFilterChange = (show: boolean) => {
    updateCategories(show ? "top_crime = 'Yes'" : "1=1");
  };

  useEffect(() => {
    console.log("showTable changed", tableLoaded);
    if (showTable && !tableLoaded.current) {
      tableLoaded.current = true;
      forceUpdate();
    }

    //if (showTable) arcgisFeatureTable.current?.refresh();
  }, [showTable]);

  useEffect(() => {
    if (showCharts && !chartsLoaded.current) {
      chartsLoaded.current = true;
      forceUpdate();
    }
  }, [showCharts]);

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
    handleViolentCrimeFilterChange,
    handleTopCrimeFilterChange,
    handleThemeChange,
    combinedWhere,
    chartsLoaded,
    tableLoaded,
  };
};
