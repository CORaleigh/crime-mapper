import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-input-date-picker";
import "@esri/calcite-components/components/calcite-select";
import "@esri/calcite-components/components/calcite-option";
import { useWhen } from "./useWhen";

interface WhenProps {
  onWhereChange: (where: string | undefined) => void;
  onFilterPanelClose: () => void;
  open: boolean;
}

export default function When({
  onWhereChange,
  onFilterPanelClose,
  open,
}: WhenProps) {
  const {
    preset,
    setPreset
  } = useWhen({ onWhereChange });

  return (
    <calcite-panel
      heading="Filter by Date"
      closed={!open}
      closable
      oncalcitePanelClose={onFilterPanelClose}
    >
      <div style={{ padding: "1rem" }}>
        <calcite-label scale="l" layout="inline">
          Show offenses in the
          <calcite-select
            label="Preset"
            value={preset}
            scale="l"
            oncalciteSelectChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setPreset((e.target as HTMLCalciteSelectElement).value as any)
            }
            style={{ marginLeft: "0.5rem", width: "160px" }}
          >
            <calcite-option value="week">past week</calcite-option>
            <calcite-option value="month">past month</calcite-option>
            <calcite-option value="90days">past 90 days</calcite-option>
            {/* <calcite-option value="">Custom Range</calcite-option> */}
          </calcite-select>
        </calcite-label>
      </div>
    </calcite-panel>
  );
}