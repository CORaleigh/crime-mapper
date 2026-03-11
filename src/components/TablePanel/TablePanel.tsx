// TablePanel.tsx
import Collection from "@arcgis/core/core/Collection";
import { useEffect } from "react";
import "@arcgis/map-components/dist/components/arcgis-feature-table";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
interface TablePanelProps {
  layer: FeatureLayer | null;
  arcgisMap: HTMLArcgisMapElement | undefined;
  arcgisFeatureTable: React.RefObject<HTMLArcgisFeatureTableElement | null>;
  handleTableReady: (
    event: HTMLArcgisFeatureTableElement["arcgisReady"],
  ) => void;
}

export default function TablePanel({
  layer,
  arcgisMap,
  arcgisFeatureTable,
  handleTableReady,
}: TablePanelProps) {
  // Only render if both map and layer exist
 // if (!layer || !arcgisMap || !mapReady) return null;
  const handleExportCSV = async () => {
    if (!arcgisFeatureTable?.current) return;

    const oids = await layer?.queryObjectIds();
    arcgisFeatureTable.current.highlightIds = new Collection(oids);
    arcgisFeatureTable.current.exportSelectionToCSV();
    arcgisFeatureTable.current.highlightIds.removeAll();
  };

  
   useEffect(() => {
    if (arcgisMap && arcgisFeatureTable.current) {
        arcgisFeatureTable.current.referenceElement = arcgisMap;
        arcgisFeatureTable.current.layer = layer;
    
    }
  }, [arcgisMap, arcgisFeatureTable, layer]);

  return (
    <arcgis-feature-table
      ref={arcgisFeatureTable}
      referenceElement={arcgisMap} // must be the DOM element
      layer={layer}
      hideSelectionColumn
      hideMenuItemsExportSelectionToCsv
      actionColumnConfig={{
        label: "Go to feature",
        icon: "zoom-to-object",
        callback: (event) =>
          arcgisMap?.goTo({ target: event.feature, zoom: 15 }),
      }}
      menuConfig={{
        items: [
          {
            label: "Export to CSV",
            icon: "file-csv",
            clickFunction: handleExportCSV,
          },
        ],
      }}
      onarcgisReady={handleTableReady} // fires when table is ready
    />
  );
}
