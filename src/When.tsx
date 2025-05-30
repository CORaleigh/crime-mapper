import { useState, useEffect } from "react";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-input-date-picker";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";

interface WhenProps {
  onWhereChange: (where: string) => void;
  onFilterPanelClose: () => void;
  open: boolean;
  isMobile: boolean;

}

type Preset = "week" | "month" | "90days" | "";

function getPresetDates(preset: Preset): { start: string; end: string } {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  let start: string = "";
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

function isRangeValid(start: string, end: string): boolean {
  if (!start || !end) return true;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 90 && diff >= 0;
}

export default function When({ onWhereChange, onFilterPanelClose, open, isMobile }: WhenProps) {
  const [preset, setPreset] = useState<Preset>("90days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [rangeError, setRangeError] = useState<string>("");

  // Update dates when preset changes (only if not custom)
  useEffect(() => {
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
      // Custom range
      if (startDate && endDate && !isRangeValid(startDate, endDate)) {
        setRangeError("Date range cannot exceed 90 days.");
        onWhereChange("1=0");
        return;
      } else {
        setRangeError("");
        if (startDate && endDate) {
          where = `(reported_date >= DATE '${startDate}' AND reported_date <= DATE '${endDate}')`;
        } else if (startDate) {
          where = `(reported_date >= DATE '${startDate}')`;
        } else if (endDate) {
          where = `(reported_date <= DATE '${endDate}')`;
        }
      }
    } else {
      setRangeError("");
      const { start, end } = getPresetDates(preset);
      if (start && end) {
        where = `(reported_date >= DATE '${start}' AND reported_date <= DATE '${end}')`;
      }
    }
    onWhereChange(where);
  }, [preset, startDate, endDate, onWhereChange]);

  return (
    <calcite-panel heading="Filter by Date" closed={!open} closable={isMobile} oncalcitePanelClose={onFilterPanelClose}>
      <div style={{ padding: "1rem" }}>
        <calcite-label>
          Show incidents in
          <calcite-select
            label="Preset"
            value={preset}
            oncalciteSelectChange={(e) =>
              setPreset((e.target as HTMLCalciteSelectElement).value as Preset)
            }
            style={{ marginLeft: "0.5rem", width: "160px" }}
          >
            <calcite-option value="90days">Past 90 Days</calcite-option>
            <calcite-option value="month">Past Month</calcite-option>
            <calcite-option value="week">Past Week</calcite-option>
            <calcite-option value="">Custom</calcite-option>
          </calcite-select>
        </calcite-label>
        {preset === "" && (
          <calcite-label style={{ marginTop: "1rem" }}>
            Date Range:
            <calcite-input-date-picker
              range
              oncalciteInputDatePickerChange={(e) => {
                setStartDate(e.target.value[0] || "");
                setEndDate(e.target.value[1] || "");
              }}
              style={{ marginLeft: "0.5rem" }}
            />
            {rangeError && (
              <div
                style={{
                  color: "var(--calcite-color-status-danger)",
                  marginTop: "0.5rem",
                }}
              >
                {rangeError}
              </div>
            )}
          </calcite-label>
        )}
      </div>
    </calcite-panel>
  );
}
