import type { FC } from "react";
import "@arcgis/charts-components/dist/components/arcgis-chart";

interface ChartPanelProps {
  view: __esri.MapView;
  layer: __esri.FeatureLayer | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedChart: any; // you can type this properly if you have the model type
  geometryFilter?: __esri.Polygon | __esri.Extent | null;
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
      legendPosition="right"
      runtimeDataFilters={{
        geometry: geometryFilter?.toJSON(),
      }}
    />
  );
};

export default ChartPanel;