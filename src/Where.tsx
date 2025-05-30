import { useEffect, useState } from "react";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-input-number";
import "@arcgis/map-components/dist/components/arcgis-sketch";
import * as bufferOperator from "@arcgis/core/geometry/operators/bufferOperator.js";

import type { TargetedEvent } from "@esri/calcite-components";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

interface WhereProps {
  onGeometryChange: (geometry: __esri.Geometry | null) => void;
  onFilterPanelClose: () => void;
  arcgisMap: HTMLArcgisMapElement | null;
  open: boolean
  isMobile: boolean;
}

export default function Where({ onGeometryChange, onFilterPanelClose, arcgisMap, open, isMobile }: WhereProps) {
  const [mode, setMode] = useState<"city" | "extent" | "draw">("city");
  const [bufferDistance, setBufferDistance] = useState<number>(0);

  // Handle selection change
  const handleSelectChange = async (e: Event) => {
    const value = (e.target as HTMLCalciteSelectElement).value as
      | "city"
      | "extent"
      | "draw";
    setMode(value);

    if (value === "city") {
      onGeometryChange(null); // null means city-wide (no geometry filter)
    } else if (value === "extent" && arcgisMap?.view) {
      await arcgisMap?.view.when();
      onGeometryChange(arcgisMap?.view.extent.clone());
    } else if (value === "draw") {
      // Drawing logic should be handled elsewhere, here we just notify parent to start drawing
      onGeometryChange(null); // Use a special value or trigger a drawing mode in parent
    }
  };
  const sketchCreated = (
    event: TargetedEvent<HTMLArcgisSketchElement, __esri.SketchCreateEvent>
  ) => {
    if (event.detail.state === "complete") {
      event.target.layer.removeAll();
      if (bufferDistance > 0 && event.detail.graphic.geometry) {
        const buffered = bufferOperator.execute(
          event.detail.graphic.geometry,
          bufferDistance,
          { unit: "miles" }
        );
        onGeometryChange(buffered as __esri.Geometry);
        event.detail.graphic.geometry = buffered;
      }
      event.target.layer.add(event.detail.graphic);
      onGeometryChange(event.detail.graphic.geometry ?? null);
    }
  };
  const sketchReady = (event: TargetedEvent<HTMLArcgisSketchElement, void>) => {
    let sketchLayer = arcgisMap?.view?.map.findLayerById("sketch-layer");
    if (!sketchLayer) {
      sketchLayer = new GraphicsLayer({ id: "sketch-layer" });
      arcgisMap?.view.map.add(sketchLayer, arcgisMap?.view.map.layers.length + 1);
      event.target.layer = sketchLayer as GraphicsLayer;
    }
  };
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
    <calcite-panel heading="Where" closed={!open} closable={isMobile} oncalcitePanelClose={onFilterPanelClose}>
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
          </calcite-select>
        </calcite-label>
        {mode === "draw" && (
          <div>
            <arcgis-sketch
              referenceElement={arcgisMap}
              hideSelectionToolsLassoSelection
              hideSelectionCountLabel
              hideSettingsMenu
              hideSelectionToolsRectangleSelection
              hideUndoRedoMenu
              hideDeleteButton
              hideDuplicateButton
              hideLabelsToggle

              creationMode="continuous"
              onarcgisCreate={sketchCreated}
              onarcgisReady={sketchReady}
              
            ></arcgis-sketch>
            <calcite-label>
              Buffer Distance:
              <calcite-input-number
                step={0.1}
                min={0}
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
          </div>
        )}
      </div>
    </calcite-panel>
  );
}
