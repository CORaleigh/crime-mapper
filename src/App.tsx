import "./App.css";
import "@esri/calcite-components";

// Import the map components
import "@arcgis/map-components/dist/components/arcgis-map";
import "@arcgis/map-components/dist/components/arcgis-layer-list";
import "@arcgis/map-components/dist/components/arcgis-search";
import "@arcgis/map-components/dist/components/arcgis-zoom";
import "@arcgis/map-components/dist/components/arcgis-legend";
import "@arcgis/map-components/dist/components/arcgis-expand";
import "@arcgis/map-components/dist/components/arcgis-locate";
import "@arcgis/map-components/dist/components/arcgis-feature-table";
import "@arcgis/map-components/components/arcgis-basemap-toggle";

// Import the chart component
import "@arcgis/charts-components/dist/components/arcgis-chart";

// Import calcite components
import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-shell-panel";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-navigation";
import "@esri/calcite-components/components/calcite-navigation-logo";
import "@esri/calcite-components/components/calcite-segmented-control";
import "@esri/calcite-components/components/calcite-segmented-control-item";
import "@esri/calcite-components/components/calcite-tile-group";
import "@esri/calcite-components/components/calcite-tile";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item-group";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-flow";
import "@esri/calcite-components/components/calcite-flow-item";
import "@esri/calcite-components/components/calcite-fab";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-dropdown";
import "@esri/calcite-components/components/calcite-dropdown-group";
import "@esri/calcite-components/components/calcite-dropdown-item";
import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-action-group";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import "@esri/calcite-components/components/calcite-switch";
import "@esri/calcite-components/components/calcite-alert";
import "@esri/calcite-components/components/calcite-sheet";
import "@esri/calcite-components/components/calcite-notice";

// Import custom components
import What from "./components/What/What";
import When from "./components/When/When";
import Where from "./components/Where/Where";
import DataDictionary from "./components/DataDictionary/DataDictionary";
import Disclaimer from "./components/Disclaimer/Disclaimer";
import FilterSegmentedControl from "./components/FilterSegmentedControl/FilterSegmentedControl";
import Definitions from "./components/Definitions/Definitions";

// ArcGIS SDK imports
import Collection from "@arcgis/core/core/Collection";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource";

// Import the custom hook
import { useApp } from "./useApp";

function App() {
  const {
    showFilter,
    setShowFilter,
    showMap,
    setShowMap,
    showTable,
    setShowTable,
    showCharts,
    setShowCharts,
    showDataDictionary,
    setShowDataDictionary,
    showDefinitions,
    setShowDefinitions,
    showDisclaimer,
    setShowDisclaimer,
    selectedSegment,
    setSelectedSegment,
    selectedChart,
    categories,
    allDescriptions,
    isMobile,
    theme,
    arcgisMap,
    arcgisFeatureTable,
    incidentsLayer,
    incidentsLayerView,
    handleTableReady,
    handleViewReady,
    handleDescriptionShow,
    handleCrimeTypeChange,
    setWhereClause,
    setWhenClause,
    geometryFilter,
    setFilterGeometry,
    chartSelected,
    handleViolentCrimeFilterChange,
    handleTopCrimeFilterChange,
    handleThemeChange,
  } = useApp();

  const arcgisMapEl = (
    <arcgis-map
      itemId="8a9abcc6b1bd4b6492923810c88cc879"
      onarcgisViewReadyChange={handleViewReady}
      className="map-panel"
      ref={arcgisMap}
    >
      <arcgis-expand position="top-right" group="top-right" label="Search">
        <arcgis-search
          includeDefaultSourcesDisabled
          sources={
            new Collection([
              new LocatorSearchSource({
                url: "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
                placeholder: "Search by address",
                maxResults: 6,
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

  const arcgisTableEl = (
    <>
      {incidentsLayer.current && (
        <arcgis-feature-table
          ref={arcgisFeatureTable}
          className="table-panel"
          onarcgisReady={handleTableReady}
          referenceElement={arcgisMap.current ?? undefined}
          layer={incidentsLayer.current}
          actionColumnConfig={{
            label: "Go to feature",
            icon: "zoom-to-object",
            callback: (event) =>
              arcgisMap.current?.goTo({ target: event.feature, zoom: 15 }),
          }}
          hideSelectionColumn
          hideMenuItemsExportSelectionToCsv
          menuConfig={{
            items: [
              {
                label: "Export to CSV",
                icon: "file-csv",
                clickFunction: async () => {
                  if (!arcgisFeatureTable.current) return;
                  const oids =
                    await arcgisFeatureTable.current?.layer?.queryObjectIds();
                  arcgisFeatureTable.current.highlightIds = new Collection(
                    oids
                  );
                  arcgisFeatureTable.current.exportSelectionToCSV();
                  arcgisFeatureTable.current.highlightIds.removeAll();
                },
              },
            ],
          }}
        />
      )}
    </>
  );

  return (
    <>
      <calcite-shell id="shell" className={showFilter ? "show-filter" : ""}>
        <calcite-navigation slot="header">
          <calcite-navigation-logo
            slot="logo"
            heading="Crime Mapper"
            thumbnail="badge.png"
          />
          <div slot="content-end">
            <calcite-dropdown slot="content-end" scale="l" width="l">
              <calcite-action
                slot="trigger"
                icon="hamburger"
                scale="l"
                appearance="transparent"
                text={"Menu"}
              ></calcite-action>
              <calcite-dropdown-group selectionMode="none" groupTitle="Menu">
                <calcite-dropdown-item
                  onClick={() => setShowDataDictionary(true)}
                  iconStart="book"
                >
                  Data Dictionary
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  onClick={() => setShowDefinitions(true)}
                  iconStart="open-book"
                >
                  Offense Definitions
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  onClick={() => setShowDisclaimer(true)}
                  iconStart="script"
                >
                  Disclaimer
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  iconStart="data"
                  href="https://data.raleighnc.gov/datasets/24c0b37fa9bb4e16ba8bcaa7e806c615_0/explore?location=35.796813%2C-78.624284%2C9.61&showTable=true"
                  target="_blank"
                >
                  Crime Incidents Open Dataset
                </calcite-dropdown-item>
              </calcite-dropdown-group>
            </calcite-dropdown>
          </div>
        </calcite-navigation>
        <calcite-shell-panel
          slot="panel-start"
          width-scale="l"
          resizable={!isMobile}
          collapsed={!showFilter}
        >
          <calcite-action-bar
            className="shellActionBar"
            slot="action-bar"
            expanded={!isMobile}
            expandDisabled={isMobile}
          >
            <calcite-action-group>
              <calcite-action
                icon="filter"
                textEnabled
                text="Filter"
                active={showFilter}
                onClick={() => setShowFilter((prev) => !prev)}
              ></calcite-action>
            </calcite-action-group>
            <calcite-action-group>
              <calcite-action
                icon="map"
                textEnabled
                text="Map"
                active={showMap}
                onClick={() => setShowMap((prev) => !prev)}
              ></calcite-action>
              <calcite-action
                icon="table"
                textEnabled
                text="Table"
                active={showTable}
                onClick={() => setShowTable((prev) => !prev)}
              ></calcite-action>
              <calcite-action
                icon="pie-chart"
                textEnabled
                text="Charts"
                active={showCharts}
                onClick={() => setShowCharts((prev) => !prev)}
              ></calcite-action>
            </calcite-action-group>
            <calcite-action-group slot="actions-end" menuPlacement="bottom-end">
              <calcite-action
                text={theme === "light" ? "Light" : "Dark"}
                icon={theme === "light" ? "brightness" : "moon"}
                textEnabled
                onClick={handleThemeChange}
              ></calcite-action>
            </calcite-action-group>
          </calcite-action-bar>
          <FilterSegmentedControl
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
          <calcite-panel className="filter-panel">
            <div hidden={selectedSegment !== "what"}>
              <What
                categories={categories}
                allDescriptions={allDescriptions}
                onWhereChange={setWhereClause}
                onDescriptionShow={handleDescriptionShow}
                onCrimeTypeChange={handleCrimeTypeChange}
                isMobile={isMobile}
                onFilterPanelClose={() => setShowFilter(false)}
                open={showFilter}
                onViolentCrimeFilterChange={handleViolentCrimeFilterChange}
                onTopCrimeFilterChange={handleTopCrimeFilterChange}
                categoryTable={
                  arcgisMap.current?.view.map?.allTables.getItemAt(
                    0
                  ) as __esri.FeatureLayer
                }
                incidentsLayer={incidentsLayer.current}
                arcgisMap={arcgisMap.current}
              />
            </div>
            <div hidden={selectedSegment !== "when"}>
              <When
                onWhereChange={setWhenClause}
                isMobile={isMobile}
                onFilterPanelClose={() => setShowFilter(false)}
                open={showFilter}
              />
            </div>
            <div hidden={selectedSegment !== "where"}>
              <Where
                arcgisMap={arcgisMap.current}
                onGeometryChange={setFilterGeometry}
                isMobile={isMobile}
                onFilterPanelClose={() => setShowFilter(false)}
                open={showFilter}
                incidentsLayer={incidentsLayer.current}
              />
            </div>
          </calcite-panel>
        </calcite-shell-panel>
        <div
          className={`main-container ${showTable ? "show-table" : ""} ${
            showMap ? "show-map" : ""
          } ${showCharts ? "show-charts" : ""}`}
        >
          {arcgisMapEl}
          {arcgisTableEl}
          <calcite-panel className="charts-panel">
            {arcgisMap.current &&
              incidentsLayer.current &&
              incidentsLayer.current.charts &&
              incidentsLayerView.current && (
                <>
                  <calcite-select
                    label={"Select chart"}
                    oncalciteSelectChange={chartSelected}
                  >
                    {incidentsLayer.current.charts.map((chart, i) => {
                      return (
                        <calcite-option
                          key={`chart-${i}`}
                          label={chart.title.content.text}
                          value={chart}
                        ></calcite-option>
                      );
                    })}
                  </calcite-select>
                  {arcgisFeatureTable.current && (
                    <arcgis-chart
                      view={arcgisMap.current.view}
                      layer={
                        arcgisFeatureTable.current?.layer as __esri.FeatureLayer
                      }
                      model={selectedChart}
                      legendPosition="right"
                      runtimeDataFilters={{
                        geometry: geometryFilter?.toJSON(),
                      }}
                    ></arcgis-chart>
                  )}
                </>
              )}
          </calcite-panel>
        </div>
      </calcite-shell>
      <DataDictionary
        open={showDataDictionary}
        onClose={() => setShowDataDictionary(false)}
      />
      <Definitions
        open={showDefinitions}
        onClose={() => setShowDefinitions(false)}
      />
      <Disclaimer
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  );
}

export default App;
