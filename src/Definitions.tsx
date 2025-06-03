import { useEffect, useState } from "react";
import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";

interface DefinitionEntry {
  title: string;
  definition: string;
  definitions: DefinitionEntry[];
}

interface DefinitionsProps {
  open: boolean;
  onClose: () => void;
}

export default function Definitions({ open, onClose }: DefinitionsProps) {
  const [entries, setEntries] = useState<DefinitionEntry[]>([]);

  useEffect(() => {
    fetch("./definitions.json")
      .then((res) => res.json())
      .then((data) => setEntries(data));
  }, []);

  return (
    <calcite-dialog
      open={open}
      modal
      heading="Offense Definitions"
      oncalciteDialogClose={onClose}
    >
      <calcite-list label={""} displayMode="nested" filterEnabled filterPlaceholder="enter text to filter definitions">
        {entries.map((entry) => (
          <calcite-list-item
            open
            key={entry.title}
            label={entry.title}
            description={entry.definition}
          >
            {entry.definitions.map((subEntry) => (
              <calcite-list-item
                open
                key={subEntry.title}
                label={subEntry.title}
                description={subEntry.definition}
              ></calcite-list-item>
            ))}
          </calcite-list-item>
        ))}
      </calcite-list>
    </calcite-dialog>
  );
}
