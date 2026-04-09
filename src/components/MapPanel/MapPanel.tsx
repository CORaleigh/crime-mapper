import React from "react";
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-popup";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-locate";
import "@arcgis/map-components/components/arcgis-basemap-toggle";

import Collection from "@arcgis/core/core/Collection";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource";
import styles from "./MapPanel.module.css";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Graphic from "@arcgis/core/Graphic";
import type { ObjectId } from "@arcgis/core/views/types";
import type FeatureLayerView from "@arcgis/core/views/layers/FeatureLayerView";

interface MapPanelProps {
  handleViewReady: (
    event: HTMLArcgisMapElement["arcgisViewReadyChange"],
  ) => void;

  arcgisMapRef: React.RefObject<HTMLArcgisMapElement | null>;
  arcgisFeatureTableRef?: React.RefObject<HTMLArcgisFeatureTableElement | null>;
}

export const MapPanel = ({
  handleViewReady,
  arcgisMapRef,
  arcgisFeatureTableRef,
}: MapPanelProps) => {
  return (
    <arcgis-map
      itemId="8a9abcc6b1bd4b6492923810c88cc879"
      onarcgisViewReadyChange={handleViewReady}
      className={styles.mapPanel}
      ref={arcgisMapRef}
    >
      <arcgis-popup
        slot="popup"
        onarcgisPropertyChange={async (
          e: HTMLArcgisPopupElement["arcgisPropertyChange"],
        ) => {
          const selectionManager = arcgisMapRef.current?.selectionManager;
          if (!selectionManager) return;
          if (e.target.open === false) selectionManager.clear();

          if (e.detail.name !== "selectedFeature") return;

          const view = arcgisMapRef.current?.view;

          if (!view) return;

          const layer = arcgisMapRef.current?.map?.layers.find(
            (l) => l.title === "Offenses",
          ) as FeatureLayer;
          const layerView = arcgisMapRef.current?.layerViews.find(
            (l) => l.layer.title === "Offenses",
          ) as FeatureLayerView;
          if (!layer) return;
          if (!e.target.selectedFeature) return;
          if (e.target.selectedFeature.layer?.title !== "Offenses") {
            selectionManager.clear();
            return;
          }

          selectionManager.clear();
          if (!arcgisFeatureTableRef?.current) return;
          if (!arcgisFeatureTableRef.current.selectionManager) {
            arcgisFeatureTableRef.current.selectionManager = selectionManager;
          }
          if (e.target.selectedFeature.isAggregate) {
            const aggregateIds =
              e.target.selectedFeature.getObjectId() as ObjectId;
            const oids = await layerView.queryObjectIds({
              aggregateIds: [aggregateIds],
            });

            selectionManager.replace(layer, oids);
            return;
          }

          const features: Graphic[] = [e.target.selectedFeature];
          selectionManager.replace(layer, features);
        }}
      />

      <arcgis-expand slot="top-right" group="top-right" label="Search" title="Search">
        <arcgis-search
          includeDefaultSourcesDisabled
          sources={
            new Collection([
              new LocatorSearchSource({
                url: "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
                placeholder: "Search by address",
                maxResults: 6,
                singleLineFieldName: "SingleLine",
              }),
            ])
          }
        />
      </arcgis-expand>

      <arcgis-zoom slot="top-left" />
      <arcgis-locate slot="top-left" />

      <arcgis-expand slot="top-right" group="top-right" label="Layers" title="Layers">
        <arcgis-layer-list visibilityAppearance="checkbox" />
      </arcgis-expand>

      <arcgis-expand slot="top-right" group="top-right" label="Legend" title="Legend">
        <arcgis-legend />
      </arcgis-expand>
      <div slot="top-right" className={styles.mapAction}>
        <calcite-action
          text="Screenshot"
          title="Screenshot"
          icon="camera"
       
          className="button"
          onClick={async () => {
            const downloadDataUrl = (dataUrl: string, fileName: string) => {
              const link = document.createElement("a");
              link.href = dataUrl;
              link.download = fileName; // Suggests a filename to the browser
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };
            const screenshot = await arcgisMapRef.current?.takeScreenshot();
            if (!screenshot) return;
            downloadDataUrl(screenshot.dataUrl, "crime-map-screenshot.png");
          }}
        ></calcite-action>
      </div>
      <arcgis-basemap-toggle slot="bottom-right" />
    </arcgis-map>
  );
};

export default MapPanel;
