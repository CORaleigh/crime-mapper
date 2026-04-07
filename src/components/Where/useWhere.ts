/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from "react";

import { useSearchParamHelpers } from "../../useSearchParamHelpers";

import * as bufferOperator from "@arcgis/core/geometry/operators/bufferOperator.js";
import * as unionOperator from "@arcgis/core/geometry/operators/unionOperator.js";
import * as generalizeOperator from "@arcgis/core/geometry/operators/generalizeOperator.js";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import LocatorSearchSource from "@arcgis/core/widgets/Search/LocatorSearchSource.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Polygon from "@arcgis/core/geometry/Polygon";
import Extent from "@arcgis/core/geometry/Extent";
import Graphic from "@arcgis/core/Graphic";
import Layer from "@arcgis/core/layers/Layer";
import Field from "@arcgis/core/layers/support/Field";
import CodedValueDomain from "@arcgis/core/layers/support/CodedValueDomain";
import type { GeometryUnion } from "@arcgis/core/geometry/types.js";
import type { CreateEvent } from "@arcgis/core/widgets/Sketch/types";
import Handles from "@arcgis/core/core/Handles.js";

type Mode = "city" | "extent" | "draw" | "address" | "district";

export type FilterLayer = {
  name: string;
  field?: string;
  values?: string[];
  prompt?: boolean;
  distance?: number;
  units?: string;
  generalize?: number;
};

interface UseWhereProps {
  arcgisMap: HTMLArcgisMapElement | null;
  onGeometryChange: (geometry: Polygon | Extent | null) => void;
  incidentsLayer?: FeatureLayer | null;
}

export function useWhere({
  arcgisMap,
  onGeometryChange,
  incidentsLayer,
}: UseWhereProps) {
  const [mode, setMode] = useState<Mode>("city");
  const [bufferDistance, setBufferDistance] = useState<number>(0);
  const [bufferUnits, setBufferUnits] = useState<string>("miles");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [selectedFilterLayerName, setSelectedFilterLayerName] =
    useState<string>("");
  const [selectedFeatureValue, setSelectedFeatureValue] = useState<string>("");
  const [filterLayers, setFilterLayers] = useState<FilterLayer[]>([
    { name: "Select a layer...", prompt: true },
    {
      name: "Police Districts",
      field: "DISTRICT",
      values: [],
      distance: 0,
      units: "miles",
    },
    {
      name: "Raleigh Neighborhood Registry",
      field: "Name",
      values: [],
      distance: 0,
      units: "miles",
    },
    {
      name: "Raleigh Parks",
      field: "NAME",
      values: [],
      distance: 0,
      units: "miles",
    },
    {
      name: "Raleigh Greenway Trails",
      field: "TRAIL_NAME",
      values: [],
      distance: 200,
      units: "feet",
    },
    {
      name: "City Council Districts",
      field: "COUNCIL_DIST",
      values: [],
      distance: 0,
      units: "miles",
    },
    {
      name: "Hospitality District",
      distance: 0,
      units: "miles",
    },
  ]);

  const { updateSearchParam, deleteSearchParam, getSearchParam } =
    useSearchParamHelpers();

  const arcgisSearch = useRef<HTMLArcgisSearchElement>(null);
  const sketchVm = useRef<SketchViewModel | null>(null);
  const graphic = useRef<Graphic | null | undefined>(null);
  const distanceInput = useRef<HTMLCalciteInputNumberElement>(null);
  const extentWatcher = useRef<Handles | null>(null);

  /** Helper: get or create sketch layer */
  const getSketchLayer = useCallback((mapEl: HTMLArcgisMapElement) => {
    if (!mapEl?.view?.map) return null;
    let sketchLayer = mapEl.view.map.findLayerById("sketch-layer");
    if (!sketchLayer) {
      sketchLayer = new GraphicsLayer({ id: "sketch-layer", listMode: "hide" });
      (sketchLayer as GraphicsLayer).effect =
        "drop-shadow(4px 0px 8px rgba(0, 0, 0, 0.8))";
      mapEl.view.map.add(sketchLayer, 1);
    }
    return sketchLayer as GraphicsLayer;
  }, []);

  /** Update geometry with explicit buffer */
  const updateGeometry = useCallback(
    async (sketchLayer: GraphicsLayer, distance: number, units: string) => {
      if (!graphic.current || !arcgisMap?.view) return;

      const newGraphic = graphic.current.clone();

      // Apply buffer
      if (distance > 0 && newGraphic.geometry) {
        const buffered = bufferOperator.execute(newGraphic.geometry, distance, {
          unit: units === "feet" ? "feet" : "miles",
        });
        newGraphic.geometry = buffered;
      }

      newGraphic.symbol = {
        type: "simple-fill",
        color: [17, 35, 63, 0],
        outline: { color: [17, 35, 63, 1], width: 3 },
      };

      sketchLayer.removeAll();
      sketchLayer.add(newGraphic);

      // Generalize AFTER goTo
      const generalized = generalizeOperator
        .execute(newGraphic.geometry as GeometryUnion, 5)
        ?.toJSON();

      if (mode === "draw") {
        updateSearchParam("where", JSON.stringify(generalized));
      }

      onGeometryChange(new Polygon(generalized));
      requestAnimationFrame(() => {
        arcgisMap.view.goTo(newGraphic.geometry?.extent?.clone().expand(1.5) as GeometryUnion);
      });
    },
    [arcgisMap?.view, mode, onGeometryChange, updateSearchParam],
  );

  /** Handle sketch draw completion */
  const handleSketchCreated = useCallback(
    (event: CreateEvent) => {
      if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap);
      if (!sketchLayer) return;

      graphic.current = event.graphic;

      if (event.state === "complete") {
        setSelectedTool("");
        sketchLayer.removeAll();
        updateGeometry(sketchLayer, bufferDistance, bufferUnits);
      }
    },
    [arcgisMap, bufferDistance, bufferUnits, getSketchLayer, updateGeometry],
  );

  /** Initialize SketchViewModel */
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    sketchVm.current.on("create", handleSketchCreated);
  }, [arcgisMap?.ready, getSketchLayer, handleSketchCreated]);

  /** Clear all graphics and reset */
  const clear = useCallback(() => {
    onGeometryChange(null);
    deleteSearchParam("where");
    deleteSearchParam("layer");
    deleteSearchParam("feature");
    deleteSearchParam("distance");
    deleteSearchParam("units");
    deleteSearchParam("address");

    graphic.current = null;
    if (!arcgisMap) return;
    const sketchLayer = getSketchLayer(arcgisMap);
    sketchLayer?.removeAll();
  }, [arcgisMap, getSketchLayer, onGeometryChange]);

  /** Handle mode change */
  const handleSelectChange = useCallback(
    async (e: Event) => {
      const value = (e.target as HTMLCalciteSelectElement).value as Mode;
      setMode(value);

      deleteSearchParam("where");
      deleteSearchParam("layer");
      deleteSearchParam("feature");
      deleteSearchParam("distance");
      deleteSearchParam("units");
      deleteSearchParam("address");
      arcgisSearch.current?.clear();

      if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap as HTMLArcgisMapElement);
      sketchLayer?.removeAll();

      setSelectedFilterLayerName(filterLayers[0].name);

      //if (value === "city" || value === "extent")
      clear();

      if (value === "extent" && arcgisMap?.view) {
        await arcgisMap.view.when();
        const handle = arcgisMap.view.watch("stationary", (stationary) => {
          if (stationary) {
            onGeometryChange(arcgisMap.view.extent.clone());
            handle.remove(); // remove watcher immediately
          }
        });
        onGeometryChange(arcgisMap.view.extent.clone());
      } else {
        extentWatcher.current?.remove?.();
        onGeometryChange(null);
      }

      if (value === "address") {
        setBufferDistance(1);
        setBufferUnits("miles");
      }
    },
    [arcgisMap, clear, filterLayers, getSketchLayer, onGeometryChange],
  );

  /** Get distinct values for a layer field */
  const getDistinctValues = useCallback(
    async (layerName: string, fieldName: string) => {
      if (!arcgisMap?.view?.map) return [];
      const layer = arcgisMap.view.map.allLayers.find(
        (layer: Layer) => layer.title === layerName,
      );
      if (!layer) return [];
      const field = (layer as FeatureLayer).fields.find(
        (f) => f.name === fieldName,
      );
      if (!field) return [];

      const results = await (layer as FeatureLayer).queryFeatures({
        where: `${fieldName} IS NOT NULL`,
        returnDistinctValues: true,
        outFields: [fieldName],
        returnGeometry: false,
        orderByFields: [fieldName],
      });

      return results.features.map((feature: Graphic) => {
        if (field.domain && field.domain.type === "coded-value") {
          const codedValue = (
            field.domain as CodedValueDomain
          ).codedValues.find(
            (cv) => cv.code === feature.getAttribute(fieldName),
          );
          return codedValue?.name;
        }
        return feature.getAttribute(fieldName);
      });
    },
    [arcgisMap],
  );

  /** Handle distance input change */
  const handleDistanceChange = useCallback(
    (e: HTMLCalciteInputNumberElement["calciteInputNumberChange"]) => {
      const newDistance = parseFloat(e.target.value);
      if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap);
      if (!sketchLayer) return;
      updateGeometry(sketchLayer, newDistance, bufferUnits);
      if (mode === "district" || mode === "address") {
        updateSearchParam("distance", newDistance.toString());
      }
      setBufferDistance(newDistance);
    },
    [arcgisMap, bufferUnits, getSketchLayer, updateGeometry],
  );

  /** Handle buffer units change */
  const handleUnitsChanged = useCallback(
    (e: HTMLCalciteSelectElement["calciteSelectChange"]) => {
      const newUnits = e.target.value;
      if (!arcgisMap) return;
      const sketchLayer = getSketchLayer(arcgisMap);
      if (!sketchLayer) return;

      // convert distance when switching units
      const convertedDistance =
        newUnits === "feet" ? bufferDistance * 5280 : bufferDistance / 5280;

      updateGeometry(sketchLayer, convertedDistance, newUnits);
      if (mode === "district" || mode === "address") {
        updateSearchParam("units", newUnits);
        updateSearchParam("distance", convertedDistance.toString());
      }
      setBufferUnits(newUnits);
      setBufferDistance(convertedDistance);
    },
    [arcgisMap, bufferDistance, getSketchLayer, updateGeometry],
  );

  /** Update filter layer selection */
  const updateFilterLayer = useCallback(
    async (layerName: string) => {
      updateSearchParam("layer", layerName);
      setSelectedFilterLayerName(layerName);

      const filterLayer = filterLayers.find((l) => l.name === layerName);
      if (!filterLayer || filterLayer.prompt) return;

      if (!filterLayer.field) {
        const layer = arcgisMap?.view.map?.allLayers.find(
          (l: Layer) => l.title === layerName,
        );
        if (!layer) return;
        const results = await (layer as FeatureLayer).queryFeatures({
          outFields: [],
          returnGeometry: true,
          where: `1=1`,
        });
        if (results.features.length > 0) {
          const sketchLayer = getSketchLayer(arcgisMap as HTMLArcgisMapElement);
          if (!sketchLayer) return;
          graphic.current = results.features[0];
          updateGeometry(sketchLayer, bufferDistance, bufferUnits);
        }
        return;
      }

      if (!filterLayer.values || filterLayer.values.length === 0) {
        const distinctValues = await getDistinctValues(
          filterLayer.name,
          filterLayer.field,
        );
        setFilterLayers((prev) =>
          prev.map((l) =>
            l.name === layerName ? { ...l, values: distinctValues } : l,
          ),
        );
      }
    },
    [
      arcgisMap,
      bufferDistance,
      bufferUnits,
      filterLayers,
      getDistinctValues,
      updateGeometry,
      updateSearchParam,
      getSketchLayer,
    ],
  );

  /** Feature selected */
  const featureSelected = useCallback(
    async (
      filterLayer: FilterLayer,
      value: string,
      distance?: number,
      units?: string,
    ) => {
      const layer = arcgisMap?.view.map?.allLayers.find(
        (l: Layer) => l.title === filterLayer.name,
      );
      if (!layer) return;

      const field = (layer as FeatureLayer).fields.find(
        (f: Field) => f.name === filterLayer.field,
      );
      if (!field) return;

      if (field.domain && field.domain.type === "coded-value") {
        const codedValue = (field.domain as CodedValueDomain).codedValues.find(
          (cv) => cv.name.toLowerCase() === value.toLowerCase(),
        );
        if (codedValue) value = codedValue.code as string;
      }

      const results = await (layer as FeatureLayer).queryFeatures({
        outFields: [field.name],
        returnGeometry: true,
        where: `${filterLayer.field} = '${value}'`,
      });

      const geoms = results.features.map((f) => f.geometry);
      const union = unionOperator.executeMany(geoms as GeometryUnion[]);

      const sketchLayer = getSketchLayer(arcgisMap!);
      if (!sketchLayer) return;

      graphic.current = new Graphic({ geometry: union });
      updateGeometry(
        sketchLayer,
        distance ?? bufferDistance,
        units ?? bufferUnits,
      );
    },
    [arcgisMap, bufferDistance, bufferUnits],
  );

  /** Handle filter selection change */
  const handleFilterLayerChange = useCallback(
    (e: HTMLCalciteSelectElement["calciteSelectChange"]) => {
      const layerName = e.target.value;
      updateFilterLayer(layerName);
      const filterLayer = filterLayers.find((l) => l.name === layerName);
      if (!filterLayer || filterLayer.prompt) return;

      setBufferDistance(filterLayer.distance || 0);
      setBufferUnits(filterLayer.units || "miles");
    },
    [updateFilterLayer],
  );

  /** Handle combobox selection */
  const handleComboboxChange = useCallback(
    (e: HTMLCalciteComboboxElement["calciteComboboxChange"]) => {
      const filterLayer = filterLayers.find(
        (l) => l.name === selectedFilterLayerName,
      );
      if (!filterLayer || !filterLayer.field) return;
      const value = e.target.value as string;
      updateSearchParam("feature", value);
      updateSearchParam("distance", bufferDistance.toString());
      updateSearchParam("units", bufferUnits);
      if (!value) clear();
      featureSelected(filterLayer, value);
    },
    [
      selectedFilterLayerName,
      bufferDistance,
      bufferUnits,
      filterLayers,
      featureSelected,
      clear,
      updateSearchParam,
    ],
  );

  /** Handle draw tool clicks */
  const handleActionClick = useCallback(
    (event: React.MouseEvent<HTMLCalciteActionElement>) => {
      const tool = event.currentTarget.getAttribute("value")?.toLowerCase();
      if (tool && sketchVm.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sketchVm.current.create(tool as any);
        setSelectedTool(tool);
      }
    },
    [],
  );

  const handleClearClick = useCallback(() => {
    clear();
    setSelectedTool("");
  }, [clear]);

  /** Handle search complete */
  const handleSearchComplete = useCallback(
    (
      event: HTMLArcgisSearchElement["arcgisSearchComplete"]) => {
      if (!arcgisMap || event.detail.numResults === 0) return;
      updateSearchParam("address", event.detail.searchTerm || "");
      updateSearchParam("distance", bufferDistance.toString());
      updateSearchParam("units", bufferUnits);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
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
      updateGeometry(sketchLayer, distance, bufferUnits);
    },
    [arcgisMap, bufferDistance, bufferUnits, getSketchLayer, updateGeometry],
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
    const addressParam = getSearchParam("address");
    if (addressParam) {
      arcgisSearch.current.search(addressParam);
    }
  }, [arcgisMap]);

  /** On mount, check for stored geometry */
  useEffect(() => {
    if (!arcgisMap || !incidentsLayer) return;

    (async () => {
      // wait for layer view
      await arcgisMap.whenLayerView(incidentsLayer);

      // check for stored geometry
      const storedGeometry = getSearchParam("where");
      if (storedGeometry) {
        const geometry = Polygon.fromJSON(JSON.parse(storedGeometry));
        graphic.current = new Graphic({ geometry });

        const sketchLayer = getSketchLayer(arcgisMap);
        if (sketchLayer) {
          // use current bufferDistance/units
          updateGeometry(sketchLayer, bufferDistance, bufferUnits);
        }
        return;
      }

      // get URL params
      const layerName = getSearchParam("layer");
      const featureValue = getSearchParam("feature");
      const distanceParam = getSearchParam("distance");
      const unitsParam = getSearchParam("units") || "miles";
      const addressParam = getSearchParam("address");
      if (addressParam) {
        setMode("address");
      }
      // parse distance
      const distance = distanceParam ? parseFloat(distanceParam) : 1; // fallback to 1 if undefined

      // restore state
      setBufferDistance(distance);
      setBufferUnits(unitsParam);

      if (!layerName || !featureValue) return;
      setMode("district");
      setSelectedFilterLayerName(layerName);
      setSelectedFeatureValue(featureValue);
      updateFilterLayer(layerName);
      // find filter layer
      const filterLayer = filterLayers.find((l) => l.name === layerName);
      if (!filterLayer) return;

      // pass explicit distance/units to featureSelected
      await featureSelected(filterLayer, featureValue, distance, unitsParam);
    })();
  }, [arcgisMap, incidentsLayer]);

  return {
    graphic,
    mode,
    bufferDistance,
    bufferUnits,
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
    setBufferUnits,
  };
}
