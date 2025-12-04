import React from "react";
import type { TargetedEvent } from "@esri/calcite-components";

interface FilterSegmentedControlProps {
  selectedSegment: string;
  setSelectedSegment: (value: string) => void;
}

const FilterSegmentedControl: React.FC<FilterSegmentedControlProps> = ({ selectedSegment, setSelectedSegment }) => (
  <calcite-segmented-control
    slot="header"
    scale="l"
    layout="horizontal"
    width="full"
    oncalciteSegmentedControlChange={(event: TargetedEvent) => {
      setSelectedSegment(
        (event.target as HTMLCalciteSegmentedControlElement).value
      );
    }}
    value={selectedSegment}
  >
    <calcite-segmented-control-item
      checked={selectedSegment === 'what'}
      value="what"
      icon-start="speech-bubble"
    >
      What
    </calcite-segmented-control-item>
    <calcite-segmented-control-item checked={selectedSegment === 'where'} value="where" icon-start="pin-tear">
      Where
    </calcite-segmented-control-item>
    <calcite-segmented-control-item checked={selectedSegment === 'when'} value="when" icon-start="clock">
      When
    </calcite-segmented-control-item>
  </calcite-segmented-control>
);

export default FilterSegmentedControl;
