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
  onGeometryChange: (geometry: __esri.Polygon | null) => void;
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
    setBufferDistance,
    selectedTool,
    arcgisSearch,
    distanceInput,
    handleSelectChange,
    handleActionClick,
    handleClearClick,
    handleSearchComplete,
    handleSearchReady,
    refreshDistance,
    clear,
    filterLayers,
    handleFilterLayerChange,
    selectedFilterLayerName,
    handleComboboxChange,
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
        <calcite-label>
          Area Filter:
          <calcite-select
            label="Area Filter"
            value={mode}
            oncalciteSelectChange={handleSelectChange}
            scale="l"
          >
            <calcite-option value="city">City-wide</calcite-option>
            <calcite-option value="extent">Current Extent</calcite-option>
            <calcite-option value="search">Address</calcite-option>
            <calcite-option value="district">District or Place</calcite-option>
            <calcite-option value="draw">Drawn Graphic</calcite-option>
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

        {mode === "search" && arcgisMap && (
          <calcite-label>
            <arcgis-search
              ref={arcgisSearch}
              referenceElement={arcgisMap}
              includeDefaultSourcesDisabled
              onarcgisSearchComplete={handleSearchComplete}
              onarcgisSearchClear={handleClearClick}
              resultGraphicDisabled
              onarcgisReady={handleSearchReady}
              allPlaceholder="Search by address or area"
              placeholder="Search by address or area"
              popupDisabled
            />
          </calcite-label>
        )}
        {mode === "district" && (
          <>
            <calcite-label>
              Select layer name
              <calcite-select
                scale="l"
                label="Select layer name"
                oncalciteSelectChange={handleFilterLayerChange}
              >
                {filterLayers.map((layer: FilterLayer) => (
                  <calcite-option key={layer.name} value={layer.name}>
                    {layer.name}
                  </calcite-option>
                ))}
              </calcite-select>
            </calcite-label>
            {filterLayers.find((l) => l.name === selectedFilterLayerName)
              ?.values && (
              <calcite-label>
                <calcite-combobox
                  scale="l"
                  label="Select feature"
                  selectionMode="single"
                  oncalciteComboboxChange={handleComboboxChange}
                  placeholder="Select feature"
                >
                  {filterLayers
                    .find((l) => l.name === selectedFilterLayerName)
                    ?.values?.map((v) => (
                      <calcite-combobox-item
                        key={v}
                        text-label={v}
                        value={v}
                      ></calcite-combobox-item>
                    ))}
                </calcite-combobox>
              </calcite-label>
            )}
          </>
        )}

        {(mode === "draw" || mode === "search" || mode === "district") && (
          <calcite-label>
            Buffer Distance:
            <div style={{ display: "flex", alignItems: "center" }}>
              <calcite-input-number
                ref={distanceInput}
                step={bufferUnits === "miles" ? 0.1 : 50}
                min={0}
                max={bufferUnits === "miles" ? 5 : 20000}
                value={bufferDistance.toString()}
                scale="l"
                clearable
                oncalciteInputNumberChange={(e) => {
                  
                  setBufferDistance(
                    Number((e.target as HTMLCalciteInputNumberElement).value)
                  );
                }}
              ></calcite-input-number>
              <calcite-select label="units" scale="l" oncalciteSelectChange={handleUnitsChanged}>
                <calcite-option selected={bufferUnits === "miles"} value="miles">miles</calcite-option>
                <calcite-option selected={bufferUnits === "feet"} value="feet">feet</calcite-option>
              </calcite-select>
              <calcite-action
                icon="refresh"
                text="Refresh"
                onClick={refreshDistance}
              />
            </div>
          </calcite-label>
        )}
      </div>
    </calcite-panel>
  );
}
