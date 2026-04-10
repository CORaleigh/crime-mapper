import "./App.css";
import "@esri/calcite-components";

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
import "@esri/calcite-components/components/calcite-tooltip";

import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";

// ArcGIS SDK imports

import styles from "./Shell.module.css";
// Import the custom hook
import { useApp } from "./useApp";
import About from "./components/About/About";
import Faq from "./components/Faq/Faq";
import Help from "./components/Help/Help";
import { lazy, Suspense } from "react";
import FallbackLoader from "./components/FallbackLoader/FallbackLoader";
// Import custom components
const MapPanel = lazy(() => import("./components/MapPanel/MapPanel"));
const TablePanel = lazy(() => import("./components/TablePanel/TablePanel"));
const ChartPanel = lazy(() => import("./components/ChartPanel/ChartPanel"));

const What = lazy(() => import("./components/What/What"));
const When = lazy(() => import("./components/When/When"));
const Where = lazy(() => import("./components/Where/Where"));
const DataDictionary = lazy(
  () => import("./components/DataDictionary/DataDictionary"),
);
const Disclaimer = lazy(() => import("./components/Disclaimer/Disclaimer"));
const Definitions = lazy(() => import("./components/Definitions/Definitions"));
const FilterSegmentedControl = lazy(
  () => import("./components/FilterSegmentedControl/FilterSegmentedControl"),
);
function App() {
  const {
    showFilter,
    setShowFilter,
    showMap,
    setShowMap,
    mapReady,
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
    showAbout,
    setShowAbout,
    showFaq,
    setShowFaq,
    showHelp,
    setShowHelp,
    selectedSegment,
    setSelectedSegment,
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
    handleViolentCrimeFilterChange,
    handleTopCrimeFilterChange,
    handleThemeChange,
    combinedWhere
  } = useApp();

  const arcgisMapEl = (
    <div className={styles.mapPanel}>
      <MapPanel
        handleViewReady={handleViewReady}
        arcgisMapRef={arcgisMap}
        arcgisFeatureTableRef={arcgisFeatureTable}
      ></MapPanel>
    </div>
  );

  const arcgisTableEl = (
    <>
      {incidentsLayer.current && mapReady && arcgisMap.current && (
        <div className={styles.tablePanel}>
          <TablePanel
            layer={incidentsLayer.current}
            arcgisMap={arcgisMap.current}
            arcgisFeatureTable={arcgisFeatureTable}
            handleTableReady={handleTableReady}
            where={combinedWhere}
          ></TablePanel>
        </div>
        // <arcgis-feature-table
        //   ref={arcgisFeatureTable}
        //   className={styles.tablePanel}
        //   onarcgisReady={handleTableReady}
        //   referenceElement={arcgisMap.current ?? undefined}
        //   layer={incidentsLayer.current}
        //   actionColumnConfig={{
        //     label: "Go to feature",
        //     icon: "zoom-to-object",
        //     callback: (event) =>
        //       arcgisMap.current?.goTo({ target: event.feature, zoom: 15 }),
        //   }}
        //   hideSelectionColumn
        //   hideMenuItemsExportSelectionToCsv
        //   menuConfig={{
        //     items: [
        //       {
        //         label: "Export to CSV",
        //         icon: "file-csv",
        //         clickFunction: async () => {
        //           if (!arcgisFeatureTable.current) return;
        //           const oids =
        //             await arcgisFeatureTable.current?.layer?.queryObjectIds();
        //           arcgisFeatureTable.current.highlightIds = new Collection(
        //             oids,
        //           );
        //           arcgisFeatureTable.current.exportSelectionToCSV();
        //           arcgisFeatureTable.current.highlightIds.removeAll();
        //         },
        //       },
        //     ],
        //   }}
        // />
      )}
    </>
  );

  const arcgisChartEl = (
    <div className={styles.chartsPanel}>
      {mapReady &&
        arcgisMap.current &&
        incidentsLayer.current &&
        incidentsLayer.current.charts &&
        incidentsLayerView.current && (
          <>
            {mapReady && arcgisFeatureTable.current && (
              <Suspense fallback={<FallbackLoader></FallbackLoader>}>
                <ChartPanel
                  view={arcgisMap.current.view}
                  layer={incidentsLayer.current}
                  geometryFilter={geometryFilter}
                  theme={theme}
                  onClose={() => setShowCharts(false)}
                  open={showCharts}
                  toggleMap={() => setShowMap(prev => !prev)}
                ></ChartPanel>
              </Suspense>
            )}
          </>
        )}
    </div>
  );

  return (
    <>
      <calcite-shell id="shell" className={showFilter ? styles.showFilter : ""}>
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
                text={"Menu"}
              ></calcite-action>
              <calcite-dropdown-group selectionMode="none" groupTitle="Menu">
                <calcite-dropdown-item
                  onClick={() => setShowAbout(true)}
                  iconStart="information"
                >
                  About
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  iconStart="file-pdf"
                  onClick={() => setShowHelp(true)}
                  // href="./crime-mapper-help.pdf"
                  // target="_blank"
                >
                  Help
                </calcite-dropdown-item>
                <calcite-dropdown-item
                  onClick={() => setShowFaq(true)}
                  iconStart="information"
                >
                  FAQ
                </calcite-dropdown-item>
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
            className={styles.shellActionBar}
            slot="action-bar"
            expanded={!isMobile}
            expandDisabled={isMobile}
          >
            <calcite-action-group>
              <calcite-action
                id="filter-action"
                icon="filter"
                textEnabled
                text="Filter"
                active={showFilter}
                onClick={() => setShowFilter((prev) => !prev)}
              ></calcite-action>
              <calcite-tooltip reference-element="filter-action" closeOnClick>
                <span>{showFilter ? "Hide filter" : "Show filter"}</span>
              </calcite-tooltip>
            </calcite-action-group>
            <calcite-action-group>
              <calcite-action
                id="map-action"
                icon="map"
                textEnabled
                text="Map"
                active={showMap}
                onClick={() => setShowMap((prev) => !prev)}
              ></calcite-action>
              <calcite-tooltip reference-element="map-action" closeOnClick>
                <span>{showMap ? "Hide map" : "Show map"}</span>
              </calcite-tooltip>
              <calcite-action
                id="table-action"
                icon="table"
                textEnabled
                text="Table"
                active={showTable}
                onClick={() => setShowTable((prev) => !prev)}
              ></calcite-action>
              <calcite-tooltip reference-element="table-action" closeOnClick>
                <span>{showTable ? "Hide table" : "Show table"}</span>
              </calcite-tooltip>
              <calcite-action
                id="chart-action"
                icon="pie-chart"
                textEnabled
                text="Charts"
                active={showCharts}
                onClick={() => setShowCharts((prev) => !prev)}
              ></calcite-action>
              <calcite-tooltip reference-element="chart-action" closeOnClick>
                <span>{showTable ? "Hide chart" : "Show chart"}</span>
              </calcite-tooltip>
            </calcite-action-group>
            <calcite-action-group slot="actions-end" menuPlacement="bottom-end">
              <calcite-action
                icon="speech-bubble-exclamation"
                textEnabled
                text="Report Crime"
                onClick={() =>
                  window.open("https://crc.raleighpd.org/", "_blank")
                }
              ></calcite-action>
              <calcite-action
                id="theme-action"
                text={theme === "light" ? "Light" : "Dark"}
                icon={theme === "light" ? "brightness" : "moon"}
                textEnabled
                onClick={handleThemeChange}
              ></calcite-action>
              <calcite-tooltip reference-element="theme-action" closeOnClick>
                <span>
                  {theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"}
                </span>
              </calcite-tooltip>
            </calcite-action-group>
          </calcite-action-bar>
          <FilterSegmentedControl
            selectedSegment={selectedSegment}
            setSelectedSegment={setSelectedSegment}
          />
          <calcite-panel
            className="filter-panel"
        
          >
            {mapReady && arcgisMap.current && (
              <Suspense fallback={<FallbackLoader />}>
                <div hidden={selectedSegment !== "what"}>
                  <What
                    categories={categories}
                    allDescriptions={allDescriptions}
                    onWhereChange={setWhereClause}
                    onDescriptionShow={handleDescriptionShow}
                    onCrimeTypeChange={handleCrimeTypeChange}
                    onFilterPanelClose={() => setShowFilter(false)}
                    open={showFilter}
                    onViolentCrimeFilterChange={handleViolentCrimeFilterChange}
                    onTopCrimeFilterChange={handleTopCrimeFilterChange}
                    categoryTable={
                      arcgisMap.current?.view?.map?.allTables?.getItemAt(
                        0,
                      ) as FeatureLayer
                    }
                    incidentsLayer={incidentsLayer.current}
                    arcgisMap={arcgisMap.current}
                  />
                </div>
              </Suspense>
            )}

            {mapReady && (
              <Suspense fallback={<FallbackLoader />}>
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
              </Suspense>
            )}

            {mapReady && (
              <Suspense fallback={<FallbackLoader />}>
                <div hidden={selectedSegment !== "when"}>
                  <When
                    onWhereChange={setWhenClause}
                    onFilterPanelClose={() => setShowFilter(false)}
                    open={showFilter}
                  />
                </div>
              </Suspense>
            )}
          </calcite-panel>
        </calcite-shell-panel>
        <div
          className={[
            styles.mainContainer,
            showTable && styles.showTable,
            showMap && styles.showMap,
            showCharts && styles.showCharts,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {arcgisMapEl}
          {arcgisTableEl}
          {arcgisChartEl}
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
      <About open={showAbout} onClose={() => setShowAbout(false)} />
      <Faq open={showFaq} onClose={() => setShowFaq(false)} />
      <Help open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}

export default App;
