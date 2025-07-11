import { useEffect, useRef, useState, useCallback } from "react";

import "./App.css";
import "@esri/calcite-components";

import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-locate";
import "@arcgis/map-components/dist/components/arcgis-feature-table";
import "@arcgis/map-components/dist/components/arcgis-placement";
import "@arcgis/charts-components/dist/components/arcgis-chart";

import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-shell-panel";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-navigation";
import "@esri/calcite-components/components/calcite-navigation-logo";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";
import "@esri/calcite-components/components/calcite-tile-group";
import "@esri/calcite-components/components/calcite-tile";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item-group";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-flow";
import "@esri/calcite-components/components/calcite-flow-item";
import "@esri/calcite-components/components/calcite-fab";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-dropdown";
import "@esri/calcite-components/components/calcite-dropdown-group";
import "@esri/calcite-components/components/calcite-dropdown-item";

import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-action-group";
import "@esri/calcite-components/components/calcite-action";

import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";

//import Geometry from "@arcgis/core/geometry/Geometry";
import type { TargetedEvent } from "@esri/calcite-components";
import What from "./What";
import When from "./When";
import Where from "./Where";
import DataDictionary from "./DataDictionary";
import Disclaimer from "./Disclaimer";
import FilterSegmentedControl from "./FilterSegmentedControl";
//import { useSearchParams } from "react-router-dom";
import Collection from "@arcgis/core/core/Collection";
import Definitions from "./Definitions";

// Description type
type Description = {
  group: string;
  descriptions: { description: string; count: number }[];
};

function App() {
  // const [searchParams, setSearchParams] = useSearchParams();

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
  const arcgisMap = useRef<HTMLArcgisMapElement>(null);
  const arcgisFeatureTable = useRef<HTMLArcgisFeatureTableElement>(null);

  const [showDataDictionary, setShowDataDictionary] = useState(false);
  const [showDefinitions, setShowDefinitions] = useState(false);

  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const incidentsLayer = useRef<__esri.FeatureLayer | null>(null);

  const crimeTypes = useRef<string[]>([]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 900;
      setIsMobile(isMobileView);
      setShowFilter(!isMobileView);
    };

    handleResize(); // call once to initialize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTableReady = (
    event: TargetedEvent<HTMLArcgisFeatureTableElement>
  ) => {
    event.target.tableTemplate = {
      columnTemplates: [
        {
          type: "field",
          fieldName: "case_number",
        },
        {
          type: "field",
          fieldName: "crime_category",
          label: "Crime Category",
        },
        {
          type: "field",
          fieldName: "crime_code",
        },
        {
          type: "field",
          fieldName: "crime_description",
        },

        {
          type: "field",
          fieldName: "crime_type",
        },
        {
          type: "field",
          fieldName: "reported_block_address",
        },
        {
          type: "field",
          fieldName: "city",
        },
        {
          type: "field",
          fieldName: "district",
        },
        {
          type: "field",
          fieldName: "reported_date",
        },
        {
          type: "field",
          fieldName: "reported_dayofwk",
        },
      ],
    } as __esri.TableTemplate;
  };
  const handleViewReady = async (
    event: TargetedEvent<HTMLArcgisMapElement, void>
  ) => {
    const view = await event.target.view.when();
    const table = view.map.allTables.getItemAt(1);
    const layer = view.map.allLayers.find(
      (layer: __esri.Layer) => layer.title === "Incidents"
    ) as __esri.FeatureLayer;

    incidentsLayer.current = layer as __esri.FeatureLayer;
    if (layer && layer.charts && layer.charts.length > 0) {
      setSelectedChart(layer.charts[0]);
    }
    if (table?.type === "feature") {
      const results = await (table as __esri.FeatureLayer).queryFeatures({
        where: "1=1",
        returnGeometry: false,
        outFields: ["*"],
      });
      setCategories(results.features);
    }

    // const where = searchParams.get('where');
    // const geometry = searchParams.get('geometry');
    // if (geometry) {
    //   setFilterGeometry(Geometry.fromJSON(geometry));
    // }

    // if (where) {
    //   setCombinedWhere(where);
    // }
  };

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => {
        // Capitalize after slash as well
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

    const where =
      Array.isArray(crimeTypes.current) && crimeTypes.current.length > 0
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
    console.log("Fetched Descriptions:", results.features);
    console.log("Count Results:", countResults.features);

    // Build a map of description to count
    const descriptionCountMap: Record<string, number> = {};
    countResults.features.forEach((f) => {
      descriptionCountMap[f.attributes.crime_description] =
        f.attributes.description_count;
    });

    // Map crime_category to its group
    const categoryToGroup: Record<string, string> = {};
    categories.forEach((category) => {
      categoryToGroup[category.attributes.crime_category] =
        category.attributes.crime_group;
    });

    // Group descriptions by group, and include counts
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
      // Avoid duplicates
      if (!groupDescriptions[group].some((d) => d.description === desc)) {
        groupDescriptions[group].push({ description: desc, count });
      }
    });

    // Convert to desired array format, now with counts
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
  }, [geometryFilter, categories, whenClause]);
  const handleDescriptionShow = (show: boolean) => {
    if (show) {
      //if (categories.length > 0) {

      fetchAllDescriptions();
      //}
    }
  };

  useEffect(() => {
    if (selectedSegment === "what") {
      fetchAllDescriptions();
    }
  }, [fetchAllDescriptions, selectedSegment]);

  const handleCrimeTypeChange = (types: string[]) => {
    if (types.length > 0) {
      crimeTypes.current = types;
    }
  };
  // Combine the two where clauses
  useEffect(() => {
    const combined =
      [whereClause, whenClause].filter((c) => c !== "1=1").join(" AND ") ||
      "1=1";
    setCombinedWhere(combined);
  }, [whereClause, whenClause]);

  // Apply the combined where clause to the map
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
    console.log("Combined where clause applied:", combinedWhere);
    // if (geometryFilter) {
    //   searchParams.set("geometry", JSON.stringify(geometryFilter.toJSON()));
    //   setSearchParams(searchParams);
    // } else {
    //   searchParams.delete("geometry");
    //   setSearchParams(searchParams);
    // }
    // if (combinedWhere !== '1=1') {
    //   searchParams.set("where", combinedWhere);
    // } else {
    //   searchParams.delete("where");
    //   setSearchParams(searchParams);
    // }
  }, [combinedWhere, geometryFilter]);
  // If map or table turns on, hide charts
  useEffect(() => {
    if (showMap || showTable) {
      setShowCharts(false);
    }
  }, [showMap, showTable]);

  // If charts turn on, hide map and table
  useEffect(() => {
    if (showCharts) {
      setShowMap(false);
      setShowTable(false);
    }
  }, [showCharts]);

  // If none are active, default to showing the map
  useEffect(() => {
    if (!showMap && !showTable && !showCharts) {
      setShowMap(true);
    }
  }, [showMap, showTable, showCharts]);

  const arcgisMapEl = (
    <arcgis-map
      ref={arcgisMap}
      itemId="8a9abcc6b1bd4b6492923810c88cc879"
      onarcgisViewReadyChange={handleViewReady}
      className="map-panel"
    >
      <arcgis-expand position="top-right" group="top-right">
        <arcgis-search />
      </arcgis-expand>
      <arcgis-zoom position="top-left" />
      <arcgis-locate position="top-left" />
      <arcgis-expand position="top-right" group="top-right">
        <arcgis-layer-list visibilityAppearance="checkbox" />
      </arcgis-expand>
      <arcgis-expand position="top-right" group="top-right">
        <arcgis-legend />
      </arcgis-expand>
      {/* <arcgis-placement position="bottom-left">
        <calcite-fab
          icon="filter"
          kind="inverse"
          textEnabled
          text={showFilter ? "Hide Filters" : "Show Filters"}
          onClick={() => setShowFilter((prev) => !prev)}
        ></calcite-fab>
      </arcgis-placement>
      <arcgis-placement position="bottom-right">
        <calcite-fab
          icon="table"
          kind="inverse"
          textEnabled
          text={showTable ? "Hide Table" : "Show Table"}
          onClick={() => setShowTable((prev) => !prev)}
        ></calcite-fab>
      </arcgis-placement> */}
    </arcgis-map>
  );

  const arcgisTableEl = (
    <>
      {incidentsLayer.current && (
        <arcgis-feature-table
          ref={arcgisFeatureTable}
          className="table-panel"
          onarcgisReady={handleTableReady}
          referenceElement={arcgisMap.current ?? undefined}
          layer={incidentsLayer.current}
          actionColumnConfig={{
            label: "Go to feature",
            icon: "zoom-to-object",
            callback: (event) =>
              arcgisMap.current?.goTo({ target: event.feature, zoom: 15 }),
          }}
          hideSelectionColumn
          hideMenuItemsExportSelectionToCsv
          menuConfig={{
            items: [
              {
                label: "Export to CSV",
                icon: "file-csv",
                clickFunction: async () => {
                  if (!arcgisFeatureTable.current) return;
                  const oids =
                    await arcgisFeatureTable.current?.layer?.queryObjectIds();
                  arcgisFeatureTable.current.highlightIds = new Collection(
                    oids
                  );
                  arcgisFeatureTable.current.exportSelectionToCSV();
                  arcgisFeatureTable.current.highlightIds.removeAll();
                },
              },
            ],
          }}
        />
      )}
    </>
  );

  const chartSelected = (
    event: TargetedEvent<HTMLCalciteSelectElement, void>
  ) => {
    setSelectedChart(event.target.selectedOption.value);
  };

  return (
    <>
      <calcite-shell id="shell" className={showFilter ? "show-filter" : ""}>
        <calcite-navigation slot="header">
          <calcite-navigation-logo
            slot="logo"
            heading="Crime Mapper"
            thumbnail="badge.png"
          />
          <div slot="content-end">
            <calcite-dropdown slot="content-end" scale="l" width="l">
              <calcite-action
                slot="trigger"
                icon="hamburger"
                scale="l"
                appearance="transparent"
                text={"Menu"}
              ></calcite-action>
              <calcite-dropdown-group selectionMode="none" groupTitle="Menu">
                <calcite-dropdown-item
                  onClick={() => setShowDataDictionary(true)}
                  iconStart="book"
                >
                  Data Dictionary
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  onClick={() => setShowDefinitions(true)}
                  iconStart="open-book"
                >
                  Offense Definitions
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  onClick={() => setShowDisclaimer(true)}
                  iconStart="script"
                >
                  Disclaimer
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  iconStart="data"
                  href="https://data.raleighnc.gov/datasets/24c0b37fa9bb4e16ba8bcaa7e806c615_0/explore?location=35.796813%2C-78.624284%2C9.61&showTable=true"
                  target="_blank"
                >
                  Crime Incidents Open Dataset
                </calcite-dropdown-item>
              </calcite-dropdown-group>
            </calcite-dropdown>
          </div>
        </calcite-navigation>
        <calcite-shell-panel
          slot="panel-start"
          width-scale="l"
          resizable={!isMobile}
          collapsed={!showFilter}
        >
          <calcite-action-bar
            slot="action-bar"
            expanded={!isMobile}
            expandDisabled={isMobile}
          >
            <calcite-action-group>
              <calcite-action
                icon="filter"
                textEnabled
                text="Filter"
                active={showFilter}
                onClick={() => setShowFilter((prev) => !prev)}
              ></calcite-action>
            </calcite-action-group>
            <calcite-action-group>
              <calcite-action
                icon="map"
                textEnabled
                text="Map"
                active={showMap}
                onClick={() => setShowMap((prev) => !prev)}
              ></calcite-action>
              <calcite-action
                icon="table"
                textEnabled
                text="Table"
                active={showTable}
                onClick={() => setShowTable((prev) => !prev)}
              ></calcite-action>
              <calcite-action
                icon="pie-chart"
                textEnabled
                text="Charts"
                active={showCharts}
                onClick={() => setShowCharts((prev) => !prev)}
              ></calcite-action>
            </calcite-action-group>
          </calcite-action-bar>
          <FilterSegmentedControl
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
          <calcite-panel className="filter-panel">
            <div hidden={selectedSegment !== "what"}>
              <What
                categories={categories}
                allDescriptions={allDescriptions}
                onWhereChange={setWhereClause}
                onDescriptionShow={handleDescriptionShow}
                onCrimeTypeChange={handleCrimeTypeChange}
                isMobile={isMobile}
                onFilterPanelClose={() => setShowFilter(false)}
                open={showFilter}
              />
            </div>
            <div hidden={selectedSegment !== "when"}>
              <When
                onWhereChange={setWhenClause}
                isMobile={isMobile}
                onFilterPanelClose={() => setShowFilter(false)}
                open={showFilter}
              />
            </div>
            <div hidden={selectedSegment !== "where"}>
              <Where
                arcgisMap={arcgisMap.current}
                onGeometryChange={setFilterGeometry}
                isMobile={isMobile}
                onFilterPanelClose={() => setShowFilter(false)}
                open={showFilter}
              />
            </div>
            {/* {isMobile && (
              <div slot="footer">
                <calcite-fab
                  scale="l"
                  icon="filter"
                  kind="brand"
                  textEnabled
                  text={showFilter ? "Hide Filters" : "Show Filters"}
                  onClick={() => setShowFilter((prev) => !prev)}
                ></calcite-fab>
              </div>
            )} */}
          </calcite-panel>
        </calcite-shell-panel>
        <div
          className={`main-container ${showTable ? "show-table" : ""} ${
            showMap ? "show-map" : ""
          } ${showCharts ? "show-charts" : ""}`}
        >
          {arcgisMapEl}
          {arcgisTableEl}
          <calcite-panel className="charts-panel">
            {arcgisMap.current &&
              incidentsLayer.current &&
              incidentsLayer.current.charts && (
                <>
                  <calcite-select
                    label={"Select chart"}
                    oncalciteSelectChange={chartSelected}
                  >
                    {incidentsLayer.current.charts.map((chart, i) => {
                      console.log(chart);
                      return (
                        <calcite-option
                          key={`chart-${i}`}
                          label={chart.title.content.text}
                          value={chart}
                        ></calcite-option>
                      );
                    })}
                  </calcite-select>

                  <arcgis-chart
                    view={arcgisMap.current.view}
                    layer={incidentsLayer.current}
                    model={selectedChart}
                    legendPosition={isMobile ? "bottom": "right"}
                  ></arcgis-chart>
                  {/* <arcgis-chart
                    view={arcgisMap.current.view}
                    layer={incidentsLayer.current}
                    model={incidentsLayer.current.charts[1]}
                  ></arcgis-chart> */}
                </>
              )}
          </calcite-panel>
        </div>
      </calcite-shell>
      <DataDictionary
        open={showDataDictionary}
        onClose={() => setShowDataDictionary(false)}
      />
      <Definitions
        open={showDefinitions}
        onClose={() => setShowDefinitions(false)}
      />
      <Disclaimer
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  );
}

export default App;
