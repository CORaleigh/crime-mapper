import { useEffect, useState } from "react";
import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";

interface DictionaryEntry {
  title: string;
  description: string;
}

interface DataDictionaryProps {
  open: boolean;
  onClose: () => void;
}

export default function DataDictionary({ open, onClose }: DataDictionaryProps) {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);

  useEffect(() => {
    fetch("/dictionary.json")
      .then((res) => res.json())
      .then((data) => setEntries(data));
  }, []);

  return (
    <calcite-dialog open={open} modal heading="Data Dictionary" oncalciteDialogClose={onClose}>
        <calcite-list label={""}>
          {entries.map((entry) => (
            <calcite-list-item
              key={entry.title}
              label={entry.title}
              description={entry.description}
            />
          ))}
        </calcite-list>
    </calcite-dialog>
  );
}