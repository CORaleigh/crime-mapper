import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-input-number";
import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-action-group";
import "@esri/calcite-components/components/calcite-action";
import "@arcgis/map-components/dist/components/arcgis-search";
import { useWhere } from "./useWhere";

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
    handleSuggestionsComplete
  } = useWhere({ arcgisMap, onGeometryChange, incidentsLayer });

  return (
    <calcite-panel
      heading="Where"
      closed={!open}
      closable={isMobile}
      oncalcitePanelClose={onFilterPanelClose}
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
            <calcite-option value="draw">Drawn Graphic</calcite-option>
            <calcite-option value="search">Address or Area</calcite-option>
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
              onarcgisSuggestComplete={handleSuggestionsComplete}
              resultGraphicDisabled
              onarcgisReady={handleSearchReady}
              allPlaceholder="Search by address or area"
              placeholder="Search by address or area"
              popupDisabled
            />
          </calcite-label>
        )}

        {(mode === "draw" || mode === "search") && (
          <calcite-label>
            Buffer Distance:
            <calcite-input-number
              ref={distanceInput}
              step={0.1}
              min={0}
              max={5}
              suffixText="miles"
              value={bufferDistance.toString()}
              scale="l"
              clearable
              oncalciteInputNumberChange={(e) => {
                setBufferDistance(
                  Number((e.target as HTMLCalciteInputNumberElement).value)
                );
              }}
            >
              <calcite-action
                icon="refresh"
                slot="action"
                text="Refresh"
                onClick={refreshDistance}
              />
            </calcite-input-number>
          </calcite-label>
        )}
      </div>
    </calcite-panel>
  );
}
