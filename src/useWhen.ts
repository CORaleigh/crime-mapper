import { useState, useEffect } from "react";
import { updateLocalStorage } from "./types";

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

/**
 * Ensures the date range is valid (max 90 days and start <= end).
 */
function isRangeValid(start: string, end: string): boolean {
  if (!start || !end) return true;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 90 && diff >= 0;
}

interface UseWhenProps {
  onWhereChange: (where: string) => void;
}

/**
 * Custom hook that handles date filtering logic for the "When" filter.
 */
export function useWhen({ onWhereChange }: UseWhenProps) {
  const [preset, setPreset] = useState<Preset>(() => {
    const storedDateFilter = localStorage.getItem('crimeMapper.dateFilter');
    return storedDateFilter ? storedDateFilter as Preset : '90days'
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rangeError, setRangeError] = useState("");

  // Update dates when preset changes
  useEffect(() => {
    updateLocalStorage("crimeMapper.dateFilter", preset);
    if (preset !== "") {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    } else {
      setStartDate("");
      setEndDate("");
    }
  }, [preset]);

  // Validate range and update where clause
  useEffect(() => {
    let where = "1=1";

    if (preset === "") {
      // Custom date range
      if (startDate && endDate && !isRangeValid(startDate, endDate)) {
        setRangeError("Date range cannot exceed 90 days.");
        onWhereChange("1=0");
        return;
      }

      setRangeError("");
      if (startDate && endDate) {
        where = `(reported_date >= DATE '${startDate}' AND reported_date <= DATE '${endDate}')`;
      } else if (startDate) {
        where = `(reported_date >= DATE '${startDate}')`;
      } else if (endDate) {
        where = `(reported_date <= DATE '${endDate}')`;
      }
    } else {
      // Preset mode
      setRangeError("");
      const { start, end } = getPresetDates(preset);
      if (start && end) {
        where = `(reported_date >= DATE '${start}' AND reported_date <= DATE '${end}')`;
      }
    }

    onWhereChange(where);
  }, [preset, startDate, endDate, onWhereChange]);

  useEffect(() => {
    const storedPreset = localStorage.getItem('crimeMapper.dateFilter');
    if (storedPreset) {
        setPreset(storedPreset as Preset);
    }
  },[]);

  return {
    preset,
    setPreset,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    rangeError,
  };
}