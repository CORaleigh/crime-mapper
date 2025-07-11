import { useCallback, useEffect, useRef, useState } from "react";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-input-number";
import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-action-group";
import "@esri/calcite-components/components/calcite-action";
import "@arcgis/map-components/dist/components/arcgis-search";

import * as bufferOperator from "@arcgis/core/geometry/operators/bufferOperator.js";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource.js";
import LayerSearchSource from "@arcgis/core/widgets/Search/LayerSearchSource.js";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import type { TargetedEvent } from "@esri/calcite-components";

interface WhereProps {
  onGeometryChange: (geometry: __esri.Geometry | null) => void;
  onFilterPanelClose: () => void;
  arcgisMap: HTMLArcgisMapElement | null;
  open: boolean;
  isMobile: boolean;
}

export default function Where({
  onGeometryChange,
  onFilterPanelClose,
  arcgisMap,
  open,
  isMobile,
}: WhereProps) {
  const [mode, setMode] = useState<"city" | "extent" | "draw" | "search">(
    "city"
  );
  const arcgisSearch = useRef<HTMLArcgisSearchElement>(null);
  const [bufferDistance, setBufferDistance] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const sketchVm = useRef<SketchViewModel>(null);
  const graphic = useRef<__esri.Graphic>(null);
  const distanceInput = useRef<HTMLCalciteInputNumberElement>(null);
  // Handle selection change
  const handleSelectChange = async (e: Event) => {
    const value = (e.target as HTMLCalciteSelectElement).value as
      | "city"
      | "extent"
      | "draw"
      | "search";
    setMode(value);
    if (value === 'city' || value == 'extent') {
      clear();

    }
    if (value === "extent" && arcgisMap?.view) {
      await arcgisMap?.view.when();
      onGeometryChange(arcgisMap?.view.extent.clone());
    }
  };
  const handleSketchCreated = (event: __esri.SketchCreateEvent) => {
    if (!arcgisMap) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    if (!sketchLayer) return;
    if (!distanceInput.current) return;
    graphic.current = event.graphic;
    if (event.state === "complete") {
      setSelectedTool("");
      sketchLayer.removeAll();
      setTimeout(() => {
      updateGeometry(sketchLayer, Number(distanceInput.current ? distanceInput.current.value : 0));

      })
    }
  };

  const getSketchLayer = (arcgisMap: HTMLArcgisMapElement) => {
    if (!arcgisMap || !arcgisMap.view || !arcgisMap.view.map) return;
    let sketchLayer = arcgisMap.view.map.findLayerById("sketch-layer");
    if (!sketchLayer) {
      sketchLayer = new GraphicsLayer({ id: "sketch-layer", listMode: "hide" });
      arcgisMap.view.map.add(
        sketchLayer,
        arcgisMap.view.map.layers.length + 1
      );
    }
    return sketchLayer as __esri.GraphicsLayer;
  };

  useEffect(() => {
    if (!arcgisMap?.ready) return;
    if (sketchVm.current) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    sketchVm.current = new SketchViewModel({
      creationMode: "single",
      layer: sketchLayer,
      view: arcgisMap?.view,
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    sketchVm.current.on("create", handleSketchCreated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arcgisMap?.ready]);

  const handleActionClick = (
    event: React.MouseEvent<HTMLCalciteActionElement>
  ) => {
    const target = event.currentTarget;
    const toolText = target.getAttribute("value")?.toLowerCase();
    if (toolText) {
      if (sketchVm.current) {
        sketchVm.current.create(
          toolText as
            | "point"
            | "multipoint"
            | "polyline"
            | "polygon"
            | "mesh"
            | "rectangle"
            | "circle"
            | "freehandPolygon"
            | "freehandPolyline"
        );
      }
      setSelectedTool(toolText);
    }
  };
  const handleClearClick = () => {
    if (!arcgisMap) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    if (!sketchLayer) return;
    sketchLayer.removeAll();
    setSelectedTool("");
    onGeometryChange(null);
  };

  const handleSearchComplete = (
    event: TargetedEvent<HTMLArcgisSearchElement, __esri.SearchViewModelSearchCompleteEvent>
  ) => {
    if (!arcgisMap) return;
    if (event.detail.numResults === 0) return;
    graphic.current = (event.detail.results[0]?.results[0] as any)?.feature;
    if (!graphic.current) return;

    const distance =
    graphic.current.geometry?.type === "point" && bufferDistance === 0 ? 1 : bufferDistance;
    setBufferDistance(distance);
    const sketchLayer = getSketchLayer(arcgisMap);
    if (!sketchLayer) return;
    sketchLayer.removeAll();
    updateGeometry(sketchLayer, distance);
  };

  const updateGeometry = useCallback((sketchLayer: __esri.GraphicsLayer, distance: number) => {
    if (!graphic.current) return;
    const newGraphic = graphic.current.clone();
    if (distance > 0 && graphic.current.geometry) {
      const buffered = bufferOperator.execute(
        newGraphic.geometry as __esri.GeometryUnion,
        distance,
        {
          unit: "miles",
        }
      );
      newGraphic.geometry = buffered;
    }
    newGraphic.symbol = {
      type: "simple-fill",
      style: "none",
      outline: {
        type: "simple-line",
        color: "black",
        width: 2,
      },
    };
    sketchLayer.removeAll();
    sketchLayer.add(newGraphic);
    requestAnimationFrame(() => {
      arcgisMap?.view.goTo(newGraphic);
    });
    onGeometryChange(newGraphic.geometry as __esri.GeometryUnion);
  }, [arcgisMap?.view, onGeometryChange]);

  const clear = () => {
    onGeometryChange(null);
    if (!arcgisMap) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    if (!sketchLayer) return;
    sketchLayer.removeAll();
  };

  useEffect(() => {
    if (mode !== "draw" && mode != "search") {
      if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap);
      if (sketchLayer) {
        (sketchLayer as __esri.GraphicsLayer).removeAll();
      }
    } else {
      setBufferDistance(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, arcgisMap?.view?.map]);

  const refreshDistance = useCallback(() => {
       if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap);
      if (sketchLayer) {
        (sketchLayer as __esri.GraphicsLayer).removeAll();
      } else {
        return;
      }
      updateGeometry(sketchLayer, Number(distanceInput.current ? distanceInput.current.value : 0));
  }, [arcgisMap, updateGeometry])
  const addSource = (
    arcgisSearch: HTMLArcgisSearchElement,
    layerName: string,
    outFields: string[],
    searchFields: string[],
    displayField: string,
    minSuggestCharacters: number
  ) => {
    if (!arcgisMap || !arcgisMap.view || !arcgisMap.view.map) return
    const layer = arcgisMap.view.map.allLayers.find(
      (layer: __esri.Layer) => layer.title === layerName
    );
    if (!layer) return;
    const source = new LayerSearchSource({
      layer: layer,
      outFields: outFields,
      searchFields: searchFields,
      displayField: displayField,
      minSuggestCharacters: minSuggestCharacters,
    });
    arcgisSearch.sources.add(source);
  };
  const handleSearchReady = () => {
    if (!arcgisSearch.current) return;
    const locatorSource = new LocatorSearchSource({
      name: "Address or Place",
      url: "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
    });
    arcgisSearch.current.sources.add(locatorSource);
    addSource(
      arcgisSearch.current,
      "Raleigh Police Districts",
      ["DISTRICT"],
      ["DISTRICT"],
      "DISTRICT",
      3
    );
    addSource(
      arcgisSearch.current,
      "Raleigh Neighborhood Registry",
      ["NAME"],
      ["NAME"],
      "NAME",
      3
    );
    addSource(
      arcgisSearch.current,
      "Raleigh City Council Districts",
      ["COUNCIL_PERSON", "COUNCIL_DIST"],
      ["COUNCIL_PERSON", "COUNCIL_DIST"],
      "COUNCIL_PERSON",
      1
    );
  };
  return (
    <calcite-panel
      heading="Where"
      closed={!open}
      closable={isMobile}
      oncalcitePanelClose={onFilterPanelClose}
    >
      <div style={{ padding: "1rem" }}>
        <calcite-label>
          Area Filter:
          <calcite-select
            label="Area Filter"
            value={mode}
            oncalciteSelectChange={handleSelectChange}
          >
            <calcite-option value="city">City-wide</calcite-option>
            <calcite-option value="extent">Current Extent</calcite-option>
            <calcite-option value="draw">Drawn Graphic</calcite-option>
            <calcite-option value="search">Address or Area</calcite-option>
          </calcite-select>
        </calcite-label>
        {mode === "draw" && (
          <calcite-label>
            <calcite-action-bar
              id="sketchActionBar"
              layout="horizontal"
              expandDisabled
            >
              <calcite-action-group>
                <calcite-action
                  icon="pin"
                  text="Point"
                  value="point"
                  onClick={handleActionClick}
                  active={selectedTool === "point"}
                ></calcite-action>
                <calcite-action
                  icon="line"
                  text="Line"
                  value="line"
                  onClick={handleActionClick}
                  active={selectedTool === "line"}
                ></calcite-action>
                <calcite-action
                  icon="polygon"
                  text="Area"
                  value="polygon"
                  onClick={handleActionClick}
                  active={selectedTool === "polygon"}
                ></calcite-action>
                <calcite-action
                  icon="rectangle"
                  text="Rectangle"
                  value="rectangle"
                  onClick={handleActionClick}
                  active={selectedTool === "rectangle"}
                ></calcite-action>
                <calcite-action
                  icon="circle"
                  text="Circle"
                  value="circle"
                  onClick={handleActionClick}
                  active={selectedTool === "circle"}
                ></calcite-action>
              </calcite-action-group>
              <calcite-action-group>
                <calcite-action
                  icon="trash"
                  text="Clear"
                  value="clear"
                  onClick={handleClearClick}
                ></calcite-action>
              </calcite-action-group>
            </calcite-action-bar>
          </calcite-label>
        )}
        {mode === "search" && arcgisMap && (
          <calcite-label>
            <arcgis-search
              ref={arcgisSearch}
              referenceElement={arcgisMap}
              includeDefaultSourcesDisabled
              onarcgisSearchComplete={handleSearchComplete}
              onarcgisSearchClear={clear}
              resultGraphicDisabled
              onarcgisReady={handleSearchReady}
              allPlaceholder="Search by address or area"
              placeholder="Search by address or area"
              popupDisabled
            ></arcgis-search>
          </calcite-label>
        )}
        {(mode === "draw" || mode == "search") && (
          <calcite-label>
            Buffer Distance:
            <calcite-input-number
              ref={distanceInput}
              step={0.1}
              min={0}
              max={5}
              placeholder="Enter buffer distance"
              suffixText="miles"
              value={bufferDistance.toString()}
              clearable
              oncalciteInputNumberChange={(e) =>
                setBufferDistance(
                  Number((e.target as HTMLCalciteInputNumberElement).value)
                )
              }
            >
              <calcite-action
                icon="refresh"
                slot="action"
                text={"Refresh"}
                onClick={refreshDistance}
              ></calcite-action>
            </calcite-input-number>
          </calcite-label>
        )}
      </div>
    </calcite-panel>
  );
}
