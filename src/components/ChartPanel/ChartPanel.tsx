/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, memo, type FC, useMemo } from "react";
import "@arcgis/charts-components/dist/components/arcgis-chart";

import type MapView from "@arcgis/core/views/MapView";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Polygon from "@arcgis/core/geometry/Polygon";
import type Extent from "@arcgis/core/geometry/Extent";
import type { ChartModel, WebChart } from "@arcgis/charts-components";

interface ChartPanelProps {
  view: MapView;
  layer: FeatureLayer | null;
  geometryFilter?: Polygon | Extent | null;
  theme?: "light" | "dark";
}

const ChartPanel: FC<ChartPanelProps> = ({
  view,
  layer,
  geometryFilter,
  theme,
}) => {
  const [chart, setChart] = useState<ChartModel | WebChart | undefined>();
  const panelRef = useRef<HTMLCalcitePanelElement>(null);
  const [selectedChart, setSelectedChart] = useState(undefined);
  const runtimeDataFilters = useMemo(() => {
    if (!geometryFilter) return undefined;

    return {
      geometry: geometryFilter.toJSON(),
    };
  }, [geometryFilter]);
  useEffect(() => {
    console.log("Layer changed:", layer);
    if (layer && layer.charts && layer.charts.length > 0) {
      setSelectedChart(layer.charts[0] as any);
    }
  }, [layer]);

  useEffect(() => {
    if (!selectedChart) return;
    const chartModel = selectedChart as any;
    chartModel["background"] =
      theme === "light" ? [255, 255, 255, 255] : [34, 34, 34, 255];
    chartModel["backgroundColor"] =
      theme === "light" ? [255, 255, 255, 255] : [34, 34, 34, 255];
    if ("legend" in chartModel) {
      if ("body" in chartModel.legend) {
        chartModel.legend.body.color =
          theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];
      }
    }
    if ("axes" in chartModel) {
      for (const axisKey in chartModel.axes) {
        const axis = chartModel.axes[axisKey];
        if ("labels" in axis) {
          axis.labels.color =
            theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];
          axis.labels.content.color =
            theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];
        }
        if ("lineSymbol" in axis) {
          axis.lineSymbol.color =
            theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];
        }
        if ("title" in axis) {
          axis.title.color =
            theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];
          axis.title.content.color =
            theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];            
        }
        if ("grid" in axis) {
          axis.grid.color =
            theme === "light" ? [0, 0, 0, 255] : [255, 255, 255, 255];
        }
      }
    }

    setChart({ ...chartModel } as ChartModel | WebChart);
  }, [theme, selectedChart]);

  useEffect(() => {
    if (!panelRef.current || !selectedChart) return;
    const chartModel = selectedChart as any;
    if ("axes" in chartModel) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Access the new dimensions
        const { width } = entry.contentRect;

        if ("legend" in chartModel) {
          chartModel.legend.position = width > 500 ? "right" : "bottom";
        }
        setChart({ ...chartModel } as ChartModel | WebChart);
      }
    });

    resizeObserver.observe(panelRef.current);
  }, [panelRef, selectedChart]);
  const chartSelected = (
    event: HTMLCalciteSelectElement["calciteSelectChange"],
  ) => {
    setSelectedChart(event.target.selectedOption.value);
  };
  if (!layer) return null;

  return (
    <calcite-panel heading="Charts" ref={panelRef}>
      <calcite-select
        label={"Select chart"}
        oncalciteSelectChange={chartSelected}
      >
        {layer?.charts?.map((chart: any, i: number) => {
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
        view={view}
        layer={layer}
        model={chart}
        runtimeDataFilters={runtimeDataFilters}
      />
    </calcite-panel>
  );
};

export default memo(ChartPanel);
