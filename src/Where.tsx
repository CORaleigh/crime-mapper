import { useEffect, useRef, useState } from "react";
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
import Collection from "@arcgis/core/core/Collection.js";

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
  const [bufferDistance, setBufferDistance] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const sketchVm = useRef<SketchViewModel>(null);
  const searchSources = new Collection([
    new LocatorSearchSource({
      url: "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
    }),
  ]);
  // Handle selection change
  const handleSelectChange = async (e: Event) => {
    const value = (e.target as HTMLCalciteSelectElement).value as
      | "city"
      | "extent"
      | "draw"
      | "search";
    setMode(value);
    clear();
    if (value === "extent" && arcgisMap?.view) {
      await arcgisMap?.view.when();
      onGeometryChange(arcgisMap?.view.extent.clone());
    }
  };
  const handleSketchCreated = (event: __esri.SketchCreateEvent) => {
    const sketchLayer = arcgisMap?.view?.map.findLayerById(
      "sketch-layer"
    ) as __esri.GraphicsLayer;
    if (!sketchLayer) return;
    if (event.state === "complete") {
      setSelectedTool("");
      sketchLayer.removeAll();
      if (bufferDistance > 0 && event.graphic.geometry) {
        const buffered = bufferOperator.execute(
          event.graphic.geometry,
          bufferDistance,
          { unit: "miles" }
        );
        onGeometryChange(buffered as __esri.Geometry);
        event.graphic.geometry = buffered;
      }
      sketchLayer.add(event.graphic);
      arcgisMap?.view.goTo(event.graphic);

      onGeometryChange(event.graphic.geometry ?? null);
    }
  };

  useEffect(() => {
    let sketchLayer = arcgisMap?.view?.map.findLayerById("sketch-layer");
    if (!sketchLayer) {
      sketchLayer = new GraphicsLayer({ id: "sketch-layer" });
      arcgisMap?.view.map.add(
        sketchLayer,
        arcgisMap?.view.map.layers.length + 1
      );
      sketchVm.current = new SketchViewModel({
        creationMode: "single",
        layer: sketchLayer as __esri.GraphicsLayer,
        view: arcgisMap?.view,
      });
      sketchVm.current.on("create" as any, handleSketchCreated);
    }
  }, [arcgisMap?.view, arcgisMap?.view.map]);

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
    const sketchLayer = arcgisMap?.view?.map.findLayerById(
      "sketch-layer"
    ) as __esri.GraphicsLayer;
    if (!sketchLayer) return;
    sketchLayer.removeAll();
    setSelectedTool("");
    onGeometryChange(null);
  };

  const handleSearchComplete = (event: TargetedEvent<HTMLArcgisSearchElement, __esri.SearchSearchCompleteEvent>) => {
    if (event.detail.numResults === 0 ) return;
    const sketchLayer = arcgisMap?.view?.map.findLayerById(
      "sketch-layer"
    ) as __esri.GraphicsLayer;
    if (!sketchLayer) return;    
    sketchLayer.removeAll();
    const graphic = event.detail.results[0].results[0].feature;
      if (bufferDistance > 0 && graphic.geometry) {
        const buffered = bufferOperator.execute(
          graphic.geometry,
          bufferDistance,
          { unit: "miles" }
        );
        onGeometryChange(buffered as __esri.Geometry);
        graphic.geometry = buffered;
        graphic.symbol = {
            type: 'simple-fill',
            style: 'none',
            outline: {
                type: 'simple-line',
                color: 'black',
                width: 2
            }
        }
        sketchLayer.add(graphic);
        requestAnimationFrame(() => {
        arcgisMap?.view.goTo(graphic);

        });
      }    
  }

  const clear = () => {
    onGeometryChange(null);
    const sketchLayer = arcgisMap?.view?.map.findLayerById(
      "sketch-layer"
    ) as __esri.GraphicsLayer;
    if (!sketchLayer) return; 
    sketchLayer.removeAll();
  }

  useEffect(() => {
    if (mode !== "draw") {
      const sketchLayer = arcgisMap?.view?.map.findLayerById("sketch-layer");
      console.log(arcgisMap?.view?.map.layers);
      if (sketchLayer) {
        (sketchLayer as __esri.GraphicsLayer).removeAll();
      }
    }
  }, [mode, arcgisMap?.view?.map]);
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
            <calcite-option value="search">Address</calcite-option>
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
              referenceElement={arcgisMap}
              includeDefaultSourcesDisabled
              sources={searchSources}
              onarcgisComplete={handleSearchComplete}
              onarcgisClear={clear}
              resultGraphicDisabled
            ></arcgis-search>
          </calcite-label>
        )}
        {mode === "draw" ||
          (mode == "search" && (
            <calcite-label>
              Buffer Distance:
              <calcite-input-number
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
              />
            </calcite-label>
          ))}
      </div>
    </calcite-panel>
  );
}
