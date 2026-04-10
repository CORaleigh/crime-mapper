// TablePanel.tsx
import Collection from "@arcgis/core/core/Collection";
import { useEffect, useState } from "react";
import "@arcgis/map-components/dist/components/arcgis-feature-table";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Graphic from "@arcgis/core/Graphic";

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
  //let highlights: ResourceHandle | null = null;

  const [showAlert, setShowAlert] = useState(false);
  const handleExportCSV = async () => {
    if (!arcgisFeatureTable?.current) return;

    const oids = await layer?.queryObjectIds(
      arcgisFeatureTable.current.filterGeometry
        ? { geometry: arcgisFeatureTable.current.filterGeometry }
        : undefined,
    );
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
    <>
      <arcgis-feature-table
        ref={arcgisFeatureTable}
        referenceElement={arcgisMap} // must be the DOM element
        layer={layer}
        hideSelectionColumn
        syncViewSelection
        selectionManager={arcgisMap?.selectionManager}
        pageSize={10000}
        hideProgress
        onarcgisSelectionChange={async (
          event: HTMLArcgisFeatureTableElement["arcgisSelectionChange"],
        ) => {
          if (
            !arcgisMap ||
            !event.target.selectionManager ||
            !event.target.selectionManager.selections[0] ||
            !event.target.selectionManager.selections[0].selection ||
            event.target.layer?.type !== "feature"
          )
            return;

          const showAll = arcgisFeatureTable.current?.shadowRoot?.querySelector(
            "calcite-action[title='Show all']",
          );
          let showSelection =
            arcgisFeatureTable.current?.shadowRoot?.querySelector(
              "calcite-action[title='Show selection']",
            );

          if (showAll) {
            (showAll as HTMLElement).click();
            setTimeout(() => {
              showSelection =
                arcgisFeatureTable.current?.shadowRoot?.querySelector(
                  "calcite-action[title='Show selection']",
                );
              if (showSelection) {
                (showSelection as HTMLElement).click();
              }
            }, 500);
          }

          event.target.selectionManager.remove(
            event.target.layer,
            event.detail.removed,
          );

          event.target.highlightIds = new Collection(
            event.target.selectionManager.selections[0].selection.map(
              (feature) => feature as number,
            ),
          );

          event.target.scrollToRow(
            event.target.selectionManager.selections[0].selection[0] as number,
          );
        }}
        onarcgisCellClick={async (
          event: HTMLArcgisFeatureTableElement["arcgisCellClick"],
        ) => {
          setShowAlert(false);
          if (
            arcgisFeatureTable.current?.highlightIds.includes(
              event.detail.feature?.getObjectId() as number,
            )
          ) {
            arcgisFeatureTable.current.highlightIds.remove(
              event.detail.feature?.getObjectId() as number,
            );
            arcgisFeatureTable.current?.highlightIds.removeAll();

            return;
          }
          arcgisMap?.selectionManager.clear();
          if (!arcgisMap) return;
          arcgisMap.goTo({ target: event.detail.feature, zoom: 15 });
          const result = await (
            event.target.layer as FeatureLayer
          ).queryFeatures({
            objectIds: [event.detail.feature?.getObjectId() as number],
          });
          if (result.features.length > 0) {
            const feature = result.features[0];
            if (!feature.geometry) {
              setShowAlert(true);
            }
          }

          const layer = arcgisMap.map?.layers.find(
            (l) => l.title === "Offenses",
          ) as FeatureLayer;
          if (!layer || !event.detail.feature) return;

          if (
            arcgisMap.selectionManager.selections[0]?.selection.includes(
              event.detail.feature.getObjectId() as number,
            )
          ) {
            arcgisMap.selectionManager.remove(layer, [
              event.detail.feature.getObjectId() as number,
            ]);
            return;
          }
          const features: Graphic[] = [event.detail.feature];
          arcgisMap.selectionManager.replace(layer, features);
        }}
        menuConfig={{
          items: [
            {
              label: "Export all to CSV",
              icon: "file-csv",
              clickFunction: handleExportCSV,
            },
          ],
        }}
        onarcgisReady={handleTableReady} // fires when table is ready
      />
      <calcite-alert
        open={showAlert}
        label={"Location not available for selected offense"}
        kind="warning"
        icon="exclamation-mark-triangle-f"
        autoClose
        autoCloseDuration="fast"
        oncalciteAlertClose={() => setShowAlert(false)}
      >
        <div slot="title">Location not available for selected offense</div>
        <div slot="message">
          For certain offenses, such as sex offenses, the location is not
          displayed on the map due to privacy concerns.
        </div>
      </calcite-alert>
    </>
  );
}
