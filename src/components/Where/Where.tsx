import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-input-number";
import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-action-group";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-combobox";
import "@esri/calcite-components/components/calcite-combobox-item";

import "@arcgis/map-components/dist/components/arcgis-search";
import { useWhere, type FilterLayer } from "./useWhere";

interface WhereProps {
  onGeometryChange: (geometry: __esri.Polygon | __esri.Extent | null) => void;
  onFilterPanelClose: () => void;
  arcgisMap: HTMLArcgisMapElement | null;
  open: boolean;
  isMobile: boolean;
  incidentsLayer?: __esri.FeatureLayer | null;
}

export default function Where({
  onGeometryChange,
  onFilterPanelClose,
  arcgisMap,
  open,
  incidentsLayer,
  isMobile,
}: WhereProps) {
  const {
    graphic,
    mode,
    bufferDistance,
    selectedTool,
    arcgisSearch,
    distanceInput,
    handleSelectChange,
    handleActionClick,
    handleClearClick,
    handleSearchComplete,
    handleSearchReady,
    clear,
    filterLayers,
    handleFilterLayerChange,
    selectedFilterLayerName,
    selectedFeatureValue,
    handleComboboxChange,
    handleDistanceChange,
    handleUnitsChanged,
    bufferUnits
  } = useWhere({ arcgisMap, onGeometryChange, incidentsLayer });

  return (
    <calcite-panel
      heading="Where"
      closed={!open}
      closable={isMobile}
      oncalcitePanelClose={onFilterPanelClose}
      style={{ height: "100vh" }}
    >
      {graphic.current && (
        <div slot="header-actions-end">
          <calcite-action
            icon="trash"
            text="Remove Filter"
            textEnabled
            onClick={clear}
          ></calcite-action>
        </div>
      )}
      <div style={{ padding: "1rem" }}>
        <calcite-label scale="l">
          Filter by
          <calcite-select
            label="Area Filter"
            value={mode}
            oncalciteSelectChange={handleSelectChange}
            scale="l"
          >
            <calcite-option selected={mode === "city"} value="city">City-wide</calcite-option>
            <calcite-option selected={mode === "extent"} value="extent">Current Extent</calcite-option>
            <calcite-option selected={mode === "address"} value="address">Address</calcite-option>
            <calcite-option selected={mode === "district"} value="district">District or Place</calcite-option>
            <calcite-option selected={mode === "draw"} value="draw">Drawn Graphic</calcite-option>
          </calcite-select>
        </calcite-label>

        {mode === "draw" && (
          <calcite-action-bar layout="horizontal" expandDisabled expanded>
            <calcite-action-group expanded>
              {["point", "line", "polygon", "rectangle", "circle"].map((t) => (
                <calcite-action
                  key={t}
                  icon={t === "line" ? "line" : t}
                  value={t}
                  text={t}
                  textEnabled={false}
                  onClick={handleActionClick}
                  active={selectedTool === t}
                />
              ))}
            </calcite-action-group>
            <calcite-action-group expanded>
              <calcite-action
                icon="trash"
                text="Clear"
                value="clear"
                onClick={handleClearClick}
              />
            </calcite-action-group>
          </calcite-action-bar>
        )}

        {mode === "address" && arcgisMap && (
          <calcite-label>
            <arcgis-search
              ref={arcgisSearch}
              referenceElement={arcgisMap}
              includeDefaultSourcesDisabled
              onarcgisSearchComplete={handleSearchComplete}
              onarcgisSearchClear={handleClearClick}
              resultGraphicDisabled
              onarcgisReady={handleSearchReady}
              allPlaceholder="Search by address"
              placeholder="Search by address"
              popupDisabled
            />
          </calcite-label>
        )}
        {mode === "district" && (
          <>
            <calcite-label scale="l">
              Select layer
              <calcite-select
                scale="l"
                label="Select layer"
                oncalciteSelectChange={handleFilterLayerChange}
              >
                {filterLayers.map((layer: FilterLayer) => (
                  <calcite-option key={layer.name} value={layer.name} selected={layer.name === selectedFilterLayerName}>
                    {layer.name}
                  </calcite-option>
                ))}
              </calcite-select>
            </calcite-label>
            {filterLayers.find((l) => l.name === selectedFilterLayerName)
              ?.values && (
              <calcite-label scale="l">
                Select feature
                <calcite-combobox
                  scale="l"
                  label="Select feature..."
                  selectionMode="single"
                  oncalciteComboboxChange={handleComboboxChange}
                  placeholder="Select feature..."
                >
                  {filterLayers
                    .find((l) => l.name === selectedFilterLayerName)
                    ?.values?.map((v) => (
                      <calcite-combobox-item
                        key={v}
                        text-label={v}
                        value={v}
                        selected={v === selectedFeatureValue}
                      ></calcite-combobox-item>
                    ))}
                </calcite-combobox>
              </calcite-label>
            )}
          </>
        )}

        {(mode === "draw" || mode === "address" || mode === "district") && (
          <calcite-label scale="l">
            Buffer Distance
            <div className="buffer-distance">
              <calcite-input-number
                ref={distanceInput}
                step={bufferUnits === "miles" ? 0.1 : 50}
                min={0}
                max={bufferUnits === "miles" ? 5 : 20000}
                value={bufferDistance.toString()}
                scale="l"
                clearable
                oncalciteInputNumberChange={handleDistanceChange}
              ></calcite-input-number>
              <calcite-select label="units" scale="l" oncalciteSelectChange={handleUnitsChanged}>
                <calcite-option selected={bufferUnits === "miles"} value="miles">miles</calcite-option>
                <calcite-option selected={bufferUnits === "feet"} value="feet">feet</calcite-option>
              </calcite-select>

            </div>
                          {/* <calcite-action
                icon="refresh"
                text="Refresh"
                textEnabled
                onClick={refreshDistance}
              /> */}
          </calcite-label>
        )}
      </div>
    </calcite-panel>
  );
}
