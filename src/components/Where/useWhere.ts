/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from "react";
import * as bufferOperator from "@arcgis/core/geometry/operators/bufferOperator.js";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource.js";
import LayerSearchSource from "@arcgis/core/widgets/Search/LayerSearchSource.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import type { TargetedEvent } from "@esri/calcite-components";
import Graphic from "@arcgis/core/Graphic";
import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator.js";
import { useSearchParamHelpers } from "../../useSearchParamHelpers";
import * as unionOperator from "@arcgis/core/geometry/operators/unionOperator.js";

type Mode = "city" | "extent" | "draw" | "search";

interface UseWhereProps {
  arcgisMap: HTMLArcgisMapElement | null;
  onGeometryChange: (geometry: __esri.Polygon | null) => void;
  incidentsLayer?: __esri.FeatureLayer | null;
}

export function useWhere({
  arcgisMap,
  onGeometryChange,
  incidentsLayer,
}: UseWhereProps) {
  const [mode, setMode] = useState<Mode>("city");
  const [bufferDistance, setBufferDistance] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<string>("");
  const { updateSearchParam, deleteSearchParam, getSearchParam } =
    useSearchParamHelpers();

  const arcgisSearch = useRef<HTMLArcgisSearchElement>(null);
  const sketchVm = useRef<SketchViewModel | null>(null);
  const graphic = useRef<__esri.Graphic | null>(null);
  const distanceInput = useRef<HTMLCalciteInputNumberElement>(null);
  const extentWatcher = useRef<IHandle | null>(null);

  /** Helper — get or create the sketch layer */
  const getSketchLayer = useCallback((mapEl: HTMLArcgisMapElement) => {
    if (!mapEl?.view?.map) return null;
    let sketchLayer = mapEl.view.map.findLayerById("sketch-layer");
    if (!sketchLayer) {
      sketchLayer = new GraphicsLayer({ id: "sketch-layer", listMode: "hide" });
      mapEl.view.map.add(sketchLayer);
    }
    return sketchLayer as __esri.GraphicsLayer;
  }, []);

  /** Handle draw completion */
  const handleSketchCreated = useCallback(
    (event: __esri.SketchCreateEvent) => {
      if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap);
      if (!sketchLayer || !distanceInput.current) return;

      graphic.current = event.graphic;
      if (event.state === "complete") {
        setSelectedTool("");
        sketchLayer.removeAll();
        updateGeometry(sketchLayer, Number(distanceInput.current.value || 0));
      }
    },
    [arcgisMap, getSketchLayer]
  );

  /** Initialize sketch VM once the map is ready */
  useEffect(() => {
    if (!arcgisMap?.ready || sketchVm.current) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    if (!sketchLayer) return;

    sketchVm.current = new SketchViewModel({
      creationMode: "single",
      layer: sketchLayer,
      view: arcgisMap.view,
      updateOnGraphicClick: false,
    });
    // @ts-expect-error (Event type not declared properly)
    sketchVm.current.on("create", handleSketchCreated);
  }, [arcgisMap?.ready, getSketchLayer, handleSketchCreated]);

  /** Update geometry (apply buffer + draw) */
  const updateGeometry = useCallback(
    (sketchLayer: __esri.GraphicsLayer, distance: number) => {
      if (!graphic.current) return;
      const newGraphic = graphic.current.clone();

      if (distance > 0 && newGraphic.geometry) {
        const buffered = bufferOperator.execute(newGraphic.geometry, distance, {
          unit: "miles",
        });
        newGraphic.geometry = buffered;
      }

      newGraphic.symbol = {
        type: "simple-fill",
        color: [17, 35, 63, 0],
        outline: {
          color: [17, 35, 63, 1],
          width: 3,
        },
      };

      sketchLayer.removeAll();
      sketchLayer.add(newGraphic);
      setTimeout(() => arcgisMap?.view.goTo(newGraphic), 1000);

      const generalized = generalizeOperator
        .execute(newGraphic.geometry as __esri.GeometryUnion, 5)
        ?.toJSON();
      updateSearchParam("where", JSON.stringify(generalized));

      onGeometryChange(new Polygon(generalized));
    },
    [arcgisMap?.view, onGeometryChange]
  );

  /** Clear all graphics and reset */
  const clear = useCallback(() => {
    onGeometryChange(null);
    deleteSearchParam("where");
    graphic.current = null;
    if (!arcgisMap) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    sketchLayer?.removeAll();
  }, [arcgisMap, getSketchLayer, onGeometryChange]);

  /** Handle area filter select */
  const handleSelectChange = useCallback(
    async (e: Event) => {
      const value = (e.target as HTMLCalciteSelectElement).value as Mode;
      setMode(value);

      deleteSearchParam("where");

      getSketchLayer(arcgisMap as HTMLArcgisMapElement)?.removeAll();
      // Clear existing graphics when switching modes

      if (value === "city" || value === "extent") clear();

      if (value === "extent" && arcgisMap?.view) {
        await arcgisMap.view.when();
        extentWatcher.current?.remove?.();
        extentWatcher.current = arcgisMap.view.watch("extent", (extent) => {
          if (extent) onGeometryChange(extent.clone());
        });
        onGeometryChange(new Polygon(arcgisMap.view.extent.clone()));
      } else {
        onGeometryChange(null);
        extentWatcher.current?.remove?.();
      }
    },
    [arcgisMap, clear, onGeometryChange]
  );

  /** Handle draw tool button clicks */
  const handleActionClick = useCallback(
    (event: React.MouseEvent<HTMLCalciteActionElement>) => {
      const tool = event.currentTarget.getAttribute("value")?.toLowerCase();
      if (tool && sketchVm.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sketchVm.current.create(tool as any);
        setSelectedTool(tool);
      }
    },
    []
  );

  const handleClearClick = useCallback(() => {
    clear();
    setSelectedTool("");
  }, [clear]);

  /** Handle search result complete */
  const handleSearchComplete = useCallback(
    (
      event: TargetedEvent<
        HTMLArcgisSearchElement,
        __esri.SearchViewModelSearchCompleteEvent
      >
    ) => {
      if (!arcgisMap || event.detail.numResults === 0) return;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      const resultGraphic = event.detail.results[0]?.results[0].feature;
      if (!resultGraphic) return;

      graphic.current = resultGraphic;
      const distance =
        resultGraphic.geometry?.type === "point" && bufferDistance === 0
          ? 1
          : bufferDistance;
      setBufferDistance(distance);

      const sketchLayer = getSketchLayer(arcgisMap);
      if (!sketchLayer) return;
      sketchLayer.removeAll();
      updateGeometry(sketchLayer, distance);
    },
    [arcgisMap, bufferDistance, getSketchLayer, updateGeometry]
  );

  /** Refresh buffer after distance change */
  const refreshDistance = useCallback(() => {
    if (!arcgisMap) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    if (!sketchLayer) return;
    sketchLayer.removeAll();
    updateGeometry(sketchLayer, Number(distanceInput.current?.value || 0));
  }, [arcgisMap, getSketchLayer, updateGeometry]);

  /** Setup custom search sources */
  const addSource = useCallback(
    (
      arcgisSearch: HTMLArcgisSearchElement,
      layerName: string,
      outFields: string[],
      searchFields: string[],
      displayField: string,
      minSuggestCharacters: number
    ) => {
      if (!arcgisMap?.view?.map) return;
      const layer = arcgisMap.view.map.allLayers.find(
        (layer: __esri.Layer) => layer.title === layerName
      );
      if (!layer) return;
      const source = new LayerSearchSource({
        layer: layer,
        name: layerName,
        outFields: outFields,
        searchFields: searchFields,
        displayField: displayField,
        minSuggestCharacters: minSuggestCharacters,
        getSuggestions: async (params: __esri.GetSuggestionsParametersParams) => {
          if (layer.type !== "feature") return [];

          const domain = (layer as __esri.FeatureLayer).getFieldDomain(searchFields[0]);
          if (domain && domain.type === "coded-value") {
            const codedValues = (domain as __esri.CodedValueDomain).codedValues.filter((cv) =>
              cv.name.toLowerCase().includes(params.suggestTerm.toLowerCase())
            );
            return codedValues.map((cv: __esri.CodedValue) => ({
              key: cv.code,
              text: cv.name,
              sourceIndex: params.sourceIndex,
            }));
          }
          const results = await (layer as __esri.FeatureLayer).queryFeatures({
            returnDistinctValues: true,
            outFields,
            returnGeometry: false,
            orderByFields: searchFields,
            num: 6,
            where: `${searchFields[0]} LIKE '%${params.suggestTerm}%'`
          });

          return results.features.map((feature: __esri.Graphic) => ({
            key: feature.getAttribute(outFields[0]),
            text: feature.getAttribute(outFields[0]),
            sourceIndex: params.sourceIndex,
          }));
        },
        getResults: async (params: __esri.GetResultsHandlerParams): Promise<__esri.SearchResult[]>  => {
          
          if (layer.type !== "feature") return [];

          const results = await (layer as __esri.FeatureLayer).queryFeatures({
            outFields,
            returnGeometry: true,
            where: `${searchFields[0]} = '${params.suggestResult.key}'`
          });
          const geoms = results.features.map((feature: __esri.Graphic) => {
            return feature.geometry;
          });
          const union = unionOperator.executeMany(geoms as __esri.GeometryUnion[]);
          return [{
            feature: new Graphic({ attributes: results.features[0].attributes, geometry: union }),
            name: layerName,
          }] as __esri.SearchResult[]
          // return results.features.map((feature: __esri.Graphic) => ({
          //   feature: { geometry: union},
          //   name: layerName,
          // })) as __esri.SearchResult[];
        }
      });
      arcgisSearch.sources.add(source);
    },
    [arcgisMap]
  );

  /** When <arcgis-search> is ready */
  const handleSearchReady = useCallback(async () => {
    if (!arcgisSearch.current) return;
    await arcgisMap?.view.when();
    const locatorSource = new LocatorSearchSource({
      name: "Address or Place",
      url: "https://maps.raleighnc.gov/arcgis/rest/services/Locators/Locator/GeocodeServer",
      singleLineFieldName: "SingleLine",
    });
    arcgisSearch.current.sources.add(locatorSource);
    addSource(
      arcgisSearch.current,
      "Police Districts",
      ["DISTRICT"],
      ["DISTRICT"],
      "DISTRICT",
      3
    );
    addSource(
      arcgisSearch.current,
      "Raleigh Neighborhood Registry",
      ["Name"],
      ["Name"],
      "Name",
      3
    );
    addSource(
      arcgisSearch.current,
      "City Council Districts",
      ["COUNCIL_PERSON", "COUNCIL_DIST"],
      ["COUNCIL_PERSON", "COUNCIL_DIST"],
      "COUNCIL_PERSON",
      1
    );
    setTimeout(() => {
      const input = arcgisSearch.current?.shadowRoot
        ?.querySelector("calcite-autocomplete")
        ?.shadowRoot?.querySelector("calcite-input")
        ?.shadowRoot?.querySelector("input");
      if (input) {
        input.style.fontSize = "16px";
      }
    }, 500);
  }, [addSource]);

  /** On mount, check for stored geometry */

  useEffect(() => {
    if (!incidentsLayer || !arcgisMap) return;

    (async () => {
      await arcgisMap?.whenLayerView(incidentsLayer as __esri.FeatureLayer);
      // On mount, check for stored geometry
      const storedGeometry = getSearchParam("where")
        ? getSearchParam("where")
        : null;

      if (storedGeometry) {
        const geometry = Polygon.fromJSON(JSON.parse(storedGeometry));
        graphic.current = new Graphic({ geometry });
        const sketchLayer = getSketchLayer(arcgisMap);
        updateGeometry(sketchLayer as __esri.GraphicsLayer, bufferDistance);
      }
    })();
  }, [arcgisMap, incidentsLayer]);

  return {
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
  };
}
