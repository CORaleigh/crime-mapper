import React, { forwardRef } from "react";
import "@arcgis/map-components/dist/components/arcgis-map";
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
import type { TargetedEvent } from "@arcgis/map-components";

interface MapPanelProps {
  handleViewReady: (event: TargetedEvent<HTMLArcgisMapElement, void>) => void;
  arcgisMapRef: React.RefObject<HTMLArcgisMapElement | undefined>;
}

export const MapPanel = forwardRef<HTMLArcgisMapElement, MapPanelProps>(
  ({ handleViewReady }, ref) => {
    return (
      <arcgis-map
        itemId="8a9abcc6b1bd4b6492923810c88cc879"
        onarcgisViewReadyChange={handleViewReady}
        className={styles.mapPanel}
        ref={ref}
      >
        <arcgis-expand slot="top-right" group="top-right" label="Search">
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

        <arcgis-expand slot="top-right" group="top-right" label="Layers">
          <arcgis-layer-list visibilityAppearance="checkbox" />
        </arcgis-expand>

        <arcgis-expand slot="top-right" group="top-right" label="Legend">
          <arcgis-legend />
        </arcgis-expand>

        <arcgis-basemap-toggle slot="bottom-right" />
      </arcgis-map>
    );
  },
);

export default MapPanel;
