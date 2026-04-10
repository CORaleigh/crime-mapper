/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, memo, type FC, useMemo } from "react";
import "@arcgis/charts-components/dist/components/arcgis-chart";
import "@arcgis/charts-components/dist/components/arcgis-charts-action-bar";

import type MapView from "@arcgis/core/views/MapView";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Polygon from "@arcgis/core/geometry/Polygon";
import type Extent from "@arcgis/core/geometry/Extent";
import type { ChartModel, WebChart } from "@arcgis/charts-components";
import type FeatureReductionCluster from "@arcgis/core/layers/support/FeatureReductionCluster";

interface ChartPanelProps {
  view: MapView;
  layer: FeatureLayer | null;
  geometryFilter?: Polygon | Extent | null;
  theme?: "light" | "dark";
  onClose: () => void;
  toggleMap: () => void;
  open: boolean;
}

const ChartPanel: FC<ChartPanelProps> = ({
  view,
  layer,
  geometryFilter,
  theme,
  onClose,
  toggleMap,
  open,
}) => {
  const [chart, setChart] = useState<ChartModel | WebChart | undefined>();
  const chartRef = useRef<HTMLArcgisChartElement>(null);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLCalcitePanelElement>(null);
  const [selectedChart, setSelectedChart] = useState(undefined);
  const runtimeDataFilters = useMemo(() => {
    if (!geometryFilter) return undefined;

    return {
      geometry: geometryFilter.toJSON(),
    };
  }, [geometryFilter]);
  useEffect(() => {
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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Access the new dimensions
        const { width } = entry.contentRect;

        if ("legend" in chartModel) {
          chartModel.legend.position = width > 500 ? "right" : "bottom";
        }
        console.log("axes" in chartModel);
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
    <calcite-panel
      heading="Charts"
      ref={panelRef}
      closable
      oncalcitePanelClose={() => {
        onClose();
        chartRef.current?.clearSelection();
        (layer.featureReduction as FeatureReductionCluster).maxScale = 0;
      }}
      closed={!open}
    >
      {/* <calcite-action
        slot="header-actions-end"
        text="Export"
        title="Export"
        icon="export"
        onClick={() => {
          if (!chartRef.current) return;
          chartRef.current.exportAsImage();
        }}
      ></calcite-action> */}
      <calcite-action
        slot="header-actions-end"
        text={expanded ? "Collapse" : "Expand"}
        title={expanded ? "Collapse" : "Expand"}
        icon={expanded ? "chevrons-down" : "chevrons-up"}
        onClick={() => {
          setExpanded(!expanded);
          toggleMap();
        }}
      ></calcite-action>
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
        ref={chartRef}
        view={view}
        layer={layer}
        model={chart}
        selectionTheme={{selectedElementsTheme: {elementOutlineColor: [255, 255, 0, 255], elementOutlineWidth: 4}}}
        runtimeDataFilters={runtimeDataFilters}
        syncSelectionsBetweenChartAndLayerViewPolicy="enabled"
        onarcgisSelectionComplete={(
          event: HTMLArcgisChartElement["arcgisSelectionComplete"],
        ) => {
          if (!event.detail.selectionData.selectionOIDs) return;
          (layer.featureReduction as FeatureReductionCluster).maxScale =
            event.detail.selectionData.selectionOIDs.length === 0 ? 0 : 1000000;
        }}
      >
        {/* <arcgis-charts-action-bar slot="action-bar" legendToggle="active"> </arcgis-charts-action-bar> */}
      </arcgis-chart>
    </calcite-panel>
  );
};

export default memo(ChartPanel);
