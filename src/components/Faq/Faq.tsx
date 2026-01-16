import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-link";

import { useEffect, useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer?: string;
  list?: string[];
  link?: FaqLink;
}
interface FaqSection {
  id: string;
  title: string;
  faqs: FaqItem[];
}

interface FaqData {
  sections: FaqSection[];
}

interface FaqProps {
  open: boolean;
  onClose: () => void;
}

interface FaqLink {
  label: string;
  url: string;
}

export default function Faq({ open, onClose }: FaqProps) {
  const [sections, setSections] = useState<FaqSection[]>([]);

  useEffect(() => {
    fetch("./faq.json")
      .then((res) => res.json())
      .then((data: FaqData) => setSections(data.sections));
  }, []);

  return (
    <calcite-dialog
      open={open}
      modal
      heading="Frequently Asked Questions"
      oncalciteDialogClose={onClose}
      placement="cover"
    >
      {sections.map((section) => (
        <div key={section.id} style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>{section.title}</h2>

          {section.faqs.map((item) => (
            <div key={item.id} style={{ marginBottom: "1rem" }}>
              <h3 style={{ marginBottom: "0.25rem" }}>{item.question}</h3>

              {item.answer && <p>{item.answer}</p>}
              {item.link && (
                <p>
                  <calcite-link
                    href={item.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.link.label}
                  </calcite-link>
                </p>
              )}
              {item.list && (
                <ul>
                  {item.list.map((listItem, index) => (
                    <li key={`${item.id}-list-item-${index}`}>{listItem}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </calcite-dialog>
  );
}
