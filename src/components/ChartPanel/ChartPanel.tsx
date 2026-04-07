import type { FC } from "react";
import "@arcgis/charts-components/dist/components/arcgis-chart";

import type MapView from "@arcgis/core/views/MapView";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Polygon from "@arcgis/core/geometry/Polygon";
import type Extent from "@arcgis/core/geometry/Extent";

interface ChartPanelProps {
  view: MapView;
  layer: FeatureLayer | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedChart: any; // you can type this properly if you have the model type
  geometryFilter?: Polygon | Extent | null;
}

const ChartPanel: FC<ChartPanelProps> = ({
  view,
  layer,
  selectedChart,
  geometryFilter,
}) => {
  if (!layer) return null;

  return (
    <arcgis-chart
      view={view}
      layer={layer}
      model={selectedChart}
      runtimeDataFilters={{
        geometry: geometryFilter?.toJSON(),
      }}
    />
  );
};

export default ChartPanel;