import { useState, useEffect } from "react";
import { useSearchParamHelpers } from "./useSearchParamHelpers";

export type Preset = "week" | "month" | "90days" | "";

/**
 * Returns start and end dates based on the selected preset.
 */
function getPresetDates(preset: Preset): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  let start = "";
  switch (preset) {
    case "week":
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      break;
    case "month":
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      break;
    case "90days":
      start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      break;
    default:
      start = "";
  }
  return { start, end };
}

interface UseWhenProps {
  onWhereChange: (where: string) => void;
}

/**
 * Custom hook that handles date filtering logic for the "When" filter.
 */
export function useWhen({ onWhereChange }: UseWhenProps) {
  const { updateSearchParam, getSearchParam } = useSearchParamHelpers();

  const [preset, setPreset] = useState<Preset>(() => {
    return getSearchParam("when") as Preset;
  });

  // Validate range and update where clause
  useEffect(() => {
    let where = "1=1";

    if (preset) updateSearchParam("when", preset);

    const { start, end } = getPresetDates(preset);
    if (start && end) {
      where = `(reported_date >= DATE '${start}' AND reported_date <= DATE '${end}')`;
    }

    onWhereChange(where);
  }, [preset]);

  useEffect(() => {
    const storedPreset = getSearchParam("when");
    if (storedPreset) {
      setPreset(storedPreset as Preset);
    }
  }, []);

  return {
    preset,
    setPreset,
  };
}
