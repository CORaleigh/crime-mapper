import { useEffect, useRef, useState } from "react";

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
import "@arcgis/map-components/components/arcgis-placement";

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
import "@esri/calcite-components/components/calcite-dropdown-item";

import type { TargetedEvent } from "@esri/calcite-components";
import What from "./What";
import When from "./When";
import Where from "./Where";
import DataDictionary from "./DataDictionary";
import Disclaimer from "./Disclaimer";

// Description type
type Description = { group: string; descriptions: string[] };

function App() {
  const [whereClause, setWhereClause] = useState("1=1"); // from <Where>
  const [whenClause, setWhenClause] = useState("1=1"); // from <When>
  const [combinedWhere, setCombinedWhere] = useState("1=1");
  const [geometryFilter, setFilterGeometry] = useState<__esri.Geometry | null>(
    null
  );
  const [showTable, setShowTable] = useState(true);
  const [categories, setCategories] = useState<__esri.Graphic[]>([]);
  const [allDescriptions, setAllDescriptions] = useState<Description[]>([]);
  const [selectedSegment, setSelectedSegment] = useState("what");
  const arcgisMap = useRef<HTMLArcgisMapElement>(null);
  const arcgisFeatureTable = useRef<HTMLArcgisFeatureTableElement>(null);

  const incidentsLayer = useRef<__esri.FeatureLayer | null>(null);
  const [showDataDictionary, setShowDataDictionary] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(true);

  const viewReady = async (
    event: TargetedEvent<HTMLArcgisMapElement, void>
  ) => {
    const view = await event.target?.view?.when();
    const table = view.map.allTables.getItemAt(1);
    const layer = arcgisMap.current?.map.allLayers.find(
      (layer) => layer.title === "Incidents"
    );
    incidentsLayer.current = layer as __esri.FeatureLayer;
    if (table?.type === "feature") {
      const results = await (table as __esri.FeatureLayer).queryFeatures({
        where: "1=1",
        returnGeometry: false,
        outFields: ["*"],
      });
      setCategories(results.features);
    }
  };

  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Fetch all possible descriptions once
  useEffect(() => {
    const fetchAllDescriptions = async () => {
      const layer = arcgisMap.current?.map.allLayers.find(
        (layer) => layer.title === "Incidents"
      );
      if (!layer) return;
      const results = await (layer as __esri.FeatureLayer).queryFeatures({
        returnDistinctValues: true,
        outFields: ["crime_category", "crime_description"],
        where: "1=1",
        orderByFields: ["crime_category", "crime_description"],
      });

      // Map crime_category to its group
      const categoryToGroup: Record<string, string> = {};
      categories.forEach((category) => {
        categoryToGroup[category.attributes.crime_category] =
          category.attributes.crime_group;
      });

      // Group descriptions by group
      const groupDescriptions: Record<string, Set<string>> = {};
      results.features.forEach((feature) => {
        const { crime_category, crime_description } = feature.attributes;
        const group = categoryToGroup[crime_category];
        if (!group) return;
        if (!groupDescriptions[group]) {
          groupDescriptions[group] = new Set();
        }
        groupDescriptions[group].add(toTitleCase(crime_description));
      });

      // Convert to desired array format
      const result: Description[] = Object.entries(groupDescriptions).map(
        ([group, descSet]) => ({
          group,
          descriptions: Array.from(descSet).sort(),
        })
      );
      setAllDescriptions(result.filter((item) => item.descriptions.length > 0));
    };

    if (categories.length > 0) {
      fetchAllDescriptions();
    }
  }, [categories]);

  // Combine the two where clauses
  useEffect(() => {
    let combined = "1=1";
    if (whereClause !== "1=1" && whenClause !== "1=1") {
      combined = `(${whereClause}) AND (${whenClause})`;
    } else if (whereClause !== "1=1") {
      combined = whereClause;
    } else if (whenClause !== "1=1") {
      combined = whenClause;
    }
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
  }, [combinedWhere, geometryFilter]);

  return (
    <>
      <calcite-shell>
        <calcite-navigation slot="header">
          <calcite-navigation-logo
            slot="logo"
            heading="Crime Mapper"
            thumbnail="badge.png"
          />
          <div slot="content-end">
            <calcite-dropdown slot="content-end" scale="l">
              <calcite-action
                slot="trigger"
                icon="hamburger"
                scale="l"
                appearance="transparent"
                text={"Menu"}
              ></calcite-action>
              <calcite-dropdown-item  onClick={() => setShowDataDictionary(true)}>Data Dictionary</calcite-dropdown-item>
            </calcite-dropdown>
          </div>
        </calcite-navigation>
        <calcite-shell-panel slot="panel-start" width-scale="l" resizable>
          <calcite-segmented-control
            scale="l"
            layout="horizontal"
            width="full"
            oncalciteSegmentedControlChange={(event: TargetedEvent) => {
              setSelectedSegment(
                (event.target as HTMLCalciteSegmentedControlElement).value
              );
            }}
            value={selectedSegment}
          >
            <calcite-segmented-control-item
              checked
              value="what"
              icon-start="speech-bubble"
            >
              What
            </calcite-segmented-control-item>
            <calcite-segmented-control-item value="where" icon-start="pin-tear">
              Where
            </calcite-segmented-control-item>
            <calcite-segmented-control-item value="when" icon-start="clock">
              When
            </calcite-segmented-control-item>
          </calcite-segmented-control>
          <calcite-panel>
            {
              <div hidden={selectedSegment !== "what"}>
                <What
                  categories={categories}
                  allDescriptions={allDescriptions}
                  onWhereChange={setWhereClause}
                />
              </div>
            }
            {
              <div hidden={selectedSegment !== "when"}>
                <When onWhereChange={setWhenClause} />
              </div>
            }
            {
              <div hidden={selectedSegment !== "where"}>
                <Where
                  arcgisMap={arcgisMap.current}
                  onGeometryChange={setFilterGeometry}
                />
              </div>
            }
          </calcite-panel>
        </calcite-shell-panel>
        <arcgis-map
          ref={arcgisMap}
          itemId="8a9abcc6b1bd4b6492923810c88cc879"
          onarcgisViewReadyChange={viewReady}
          className={showTable ? "show-table" : ""}
        >
          <arcgis-expand position="top-right">
            <arcgis-search position="top-right" />
          </arcgis-expand>
          <arcgis-zoom position="top-left" />
          <arcgis-locate position="top-left" />
          <arcgis-expand position="top-right">
            <arcgis-layer-list position="top-right" />
          </arcgis-expand>
          <arcgis-expand position="top-right">
            <arcgis-legend position="top-right" />
          </arcgis-expand>
          <arcgis-placement position="bottom-right">
            <calcite-fab
              icon="table"
              kind="inverse"
              textEnabled
              text={showTable ? "Hide Table" : "Show Table"}
              onClick={() => setShowTable((prev) => !prev)}
            ></calcite-fab>
          </arcgis-placement>
        </arcgis-map>
        {incidentsLayer.current && (
          <arcgis-feature-table
            ref={arcgisFeatureTable}
            referenceElement={arcgisMap.current}
            layer={incidentsLayer.current}
            className={showTable ? "show-table" : ""}
          />
        )}
      </calcite-shell>
      <DataDictionary open={showDataDictionary} onClose={() => setShowDataDictionary(false)}/>
      <Disclaimer open={showDisclaimer} onClose={() => setShowDisclaimer(false)}/>

    </>
  );
}

export default App;
