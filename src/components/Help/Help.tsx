import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-link";
import "@esri/calcite-components/components/calcite-tree";
import "@esri/calcite-components/components/calcite-tree-item";
import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-shell-panel";
import "@esri/calcite-components/components/calcite-fab";

import type { TargetedEvent } from "@arcgis/map-components";
import { useEffect, useState } from "react";

interface HelpSection {
  id: string;
  title: string;
  sections?: HelpSection[];
}
interface FaqItem {
  id: string;
  question: string;
  answer?: string;
  list?: string[];
  link?: FaqLink;
}
interface FaqLink {
  label: string;
  url: string;
}
interface FaqSection {
  id: string;
  title: string;
  faqs: FaqItem[];
}

interface FaqData {
  sections: FaqSection[];
}

interface HelpProps {
  open: boolean;
  onClose: () => void;
}

export default function Help({ open, onClose }: HelpProps) {
  function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(
      () => window.matchMedia(query).matches
    );

    useEffect(() => {
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);

      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }, [query]);

    return matches;
  }

  const isSmall = useMediaQuery("(max-width: 768px)");
  const [showToc, setShowToc] = useState<boolean>(!isSmall);



  const sections: HelpSection[] = [
    {
      id: "about",
      title: "About",
      sections: [{ id: "data-notes", title: "Data Notes & Disclaimer" }],
    },
    { id: "action-bar", title: "Action Bar Controls" },
    {
      id: "filter-panel",
      title: "Filter Panel",
      sections: [
        {
          id: "what",
          title: "What",
          sections: [
            { id: "filtering-desc", title: "Filtering by Description" },
          ],
        },
        {
          id: "where",
          title: "Where",
          sections: [
            { id: "address", title: "Address" },
            { id: "district", title: "District or Place" },
            { id: "drawing", title: "Drawing a Graphic" },
          ],
        },
        {
          id: "when",
          title: "When",
        },
      ],
    },

    {
      id: "using-map",
      title: "Using the Map",
      sections: [
        { id: "navigating", title: "Navigating the Map" },
        { id: "symbols", title: "Understanding Crime Symbols" },
        { id: "viewing-details", title: "Viewing Details" },
        {
          id: "map-tools",
          title: "Using Map Tools",
          sections: [
            { id: "top-left-tools", title: "Top-Left Tools" },
            { id: "top-right-tools", title: "Top-Right Map Tools" },
            { id: "basemap", title: "Basemap Toggle" },
          ],
        },
      ],
    },
    {
      id: "table",
      title: "Table",
      sections: [
        { id: "sort", title: "Sort by Column" },
        { id: "columns", title: "Showing or Hiding Columns" },
        { id: "export", title: "Exporting the Table to CSV" },
        {
          id: "zoom-offense",
          title: "Zooming to a Specific Offense",
        },
      ],
    },

    { id: "menu", title: "Menu" },
    {
      id: "faq",
      title: "Frequently Asked Questions",
      sections: [
        { id: "faq-about", title: "About" },
        { id: "faq-data-privacy", title: "Data & Privacy" },
        { id: "faq-using-map", title: "Using the Map" },
        { id: "faq-issues", title: "Issues & Troubleshooting" },
        { id: "faq-accessibility", title: "Accessibility" },
      ],
    },
  ];
  const [faqSections, setFaqSections] = useState<FaqSection[]>([]);

  useEffect(() => {
    fetch("./faq.json")
      .then((res) => res.json())
      .then((data: FaqData) => setFaqSections(data.sections));
  }, []);
  const scrollToSection = (id: string) => {
    console.log(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <calcite-dialog
      open={open}
      modal
      heading="Help"
      oncalciteDialogClose={onClose}
      placement="cover"
    >
      <calcite-shell contentBehind={isSmall}>
        <calcite-shell-panel
          slot="panel-start"
          position="start"
          width="m"
          collapsed={!showToc}
        >
          <calcite-panel>
            <calcite-tree
              oncalciteTreeSelect={(
                event: TargetedEvent<HTMLCalciteTreeElement, void>
              ) => {
                const item = event.target
                  .selectedItems[0] as HTMLCalciteTreeItemElement;
                if (item) {
                  scrollToSection(item.getAttribute("data-id") || "");
                  item.selected = false;
                }
              }}
            >
              {sections.map((section) => (
                <calcite-tree-item
                  key={section.id}
                  data-id={section.id}
                  expanded
                  onClick={(event) => {
                    (event.target as HTMLCalciteTreeItemElement).expanded =
                      true;
                    scrollToSection(section.id);
                  }}
                >
                  {section.sections && (
                    <calcite-tree slot="children">
                      {section.sections.map((subSection) => (
                        <calcite-tree-item
                          key={subSection.id}
                          data-id={subSection.id}
                          expanded
                        >
                          {subSection.title}
                        </calcite-tree-item>
                      ))}
                    </calcite-tree>
                  )}

                  {section.title}
                </calcite-tree-item>
              ))}
            </calcite-tree>
            <calcite-fab
              slot="fab"
              scale="l"
              style={{ position: "fixed", left: "10px", bottom: "10px" }}
              icon="sub-fields"
              onClick={() => setShowToc((prev) => !prev)}
            ></calcite-fab>
          </calcite-panel>
        </calcite-shell-panel>

        <calcite-panel>
          <calcite-fab
            slot="fab"
            scale="l"
            style={{ position: "fixed", left: "10px", bottom: "10px" }}
            icon={showToc ? "x" : "sub-fields"}
            onClick={() => setShowToc((prev) => !prev)}
          ></calcite-fab>
          <div
            onClick={() => {
              if (isSmall) {
                setShowToc(false);
              }
            }}
          >
            <h1 id="about">About</h1>
            <p>
              The Raleigh Police Department’s Crime Mapper provides the public
              with information about recent reported crime activity in Raleigh.
              Our goal is to support safer neighborhoods through a
              better-informed community and to strengthen community-oriented
              policing efforts.
            </p>
            <p>
              Crime Mapper uses an advanced mapping engine to provide
              interactive tools for viewing crime activity. Crime data is
              extracted on a regular basis from the Raleigh Police Department’s
              records system so the information available through your web
              browser is as current as possible.
            </p>
            <h2 id="data-notes">Data Notes and Disclaimer</h2>
            <ul>
              <li>
                Crime Mapper displays a rolling 90 days of data and is updated
                daily.
              </li>
              <li>
                To enhance privacy and support accurate offense coding,
                incidents are displayed with a 1-day delay.
              </li>
              <li>
                Locations are generalized to the block level. Incidents are
                randomly stacked on the block and do not represent an exact
                address.
              </li>
              <li>
                This map is a representation of reported incidents and is not
                all-inclusive. Some incidents may be updated, reclassified, or
                corrected after upload, so information may change over time.
              </li>
              <li>
                Certain sensitive offenses are not displayed to protect privacy.
              </li>
            </ul>
            <h1 id="action-bar">Action Bar Controls</h1>
            The action bar on the left side of the app controls which panels are
            visible on the right side of the screen.
            <div className="col-2">
              <div>
                <h2>Top Action Bar Buttons</h2>
                <h3>Filter</h3>
                Shows or hides the Filter panel, where you can filter incidents
                by What, Where and When
                <h3>Map</h3>
                Controls the Map panel:
                <ul>
                  <li>
                    If the Chart panel is visible, clicking Map will hide the
                    Chart panel and show the Map.
                  </li>
                  <li>
                    If the Table panel is visible, clicking Map will toggle the
                    Table panel between half-height and full-height.
                  </li>
                  <li>
                    If no other panel is visible, clicking Map does not change
                    the display.
                  </li>
                </ul>
                <h3>Table</h3>
                Shows or hides the Table panel beneath the Map. The table
                displays the incidents currently visible on the map and based on
                your filters.
                <h3>Chart</h3>
                Shows or hides the Charts panel beneath the Map. Charts reflect
                the incidents currently visible on the map and based on your
                filters.
                <h2>Bottom Action Bar Buttons</h2>
                <h3>Report Crime</h3>
                Opens the Raleigh Police Department website to report a crime.
                <h3>Dark/Light</h3>
                Switches the application between light mode and dark mode.
                <h3>Collapse</h3>
                Collapses the action bar to show icons only and hide text
                labels.
              </div>
              <img
                style={{ width: "146px", height: "518px" }}
                src="help/image003.png"
              ></img>
            </div>
            <h1 id="filter-panel">Filter Panel</h1>
            The filter panel allows you to filter by crime category (What),
            location (Where) and date (When).
            <h2 id="what">What</h2>
            <p>
              Use the What tab to filter incidents by crime group and crime
              description. Optional filters are available to show only Violent
              Crime categories or Top Requested Crime categories.
            </p>
            <p>
              To filter results, click one or more crime groups you are
              interested in. The map will update to show only incidents in the
              selected categories.
            </p>
            <img style={{ maxWidth: "500px" }} src="help/image004.png" />
            <p>To clear all selections, click Remove All in the header.</p>
            <p>
              <img style={{ maxWidth: "500px" }} src="help/image005.png" />
            </p>
            <h3 id="filtering-desc">Filtering by Description</h3>
            When one or more groups are selected, the Filter by Description
            button becomes available. Clicking this button displays a list of
            descriptions for the selected groups, allowing you to further refine
            your selection.
            <p>
              <img style={{ maxWidth: "500px" }} src="help/image006.png" />
            </p>
            In the list of descriptions, uncheck any you are not interested in
            and check the ones you want to include.
            <p>
              <img style={{ maxWidth: "500px" }} src="help/image007.png" />
            </p>
            <p>
              Use the Select All or Select None options to quickly select or
              clear all descriptions for a group.
            </p>
            <p>
              To go back to the main list of crime groups, click the Back button
              located to the left of Filter By Description.
            </p>
            <h2 id="where">Where</h2>
            The Where tab allows you to filter crimes based on an area of
            interest. There are five options:
            <ol>
              <li>
                <strong>City-wide</strong> – Displays all crimes regardless of
                location. This is the default setting.
              </li>
              <li>
                <strong>Current Extent</strong> – Displays only the crimes that
                occurred within the current map view.
              </li>
              <li>
                <strong>Address</strong> – Search for a specific address, crimes
                near this address will be displayed.
              </li>
              <li>
                <strong>District or Place</strong> – Select from a list of
                district or place types, crimes within or near the selected
                feature will be displayed.
              </li>
              <li>
                <strong>Drawn Graphic</strong> – Draw a shape directly on the
                map to define an area. Crimes within this area will be
                displayed.
              </li>
            </ol>
            These options allow you to focus your analysis on specific locations
            or regions of interest.
            <h3 id="address">Address</h3>
            <img style={{ maxWidth: "600px" }} src="help/image008.png"></img>
            <div>
              <ol>
                <li>
                  <strong>Enter an Address</strong> – start typing an address in
                  the text box, as you type suggested addresses will appear
                </li>
                <li>
                  <strong>Select from Suggestions</strong> – When the address
                  appears in the list of suggested addresses, click it to
                  select.
                </li>
                <li>
                  <strong>View Results on Map</strong> – After selecting an
                  address, the map will zoom to that area and display only the
                  crimes within it.
                </li>
                <li>
                  <strong>Adjust Search Distance</strong> – By default, the
                  buffer distance is set to 1 mile. You can adjust this distance
                  by entering a new value in the text box (decimals are
                  allowed). The units can also be changed between miles and
                  feet.
                  <p>
                    <img
                      style={{ maxWidth: "600px" }}
                      src="help/image009.png"
                    ></img>
                  </p>
                </li>
                <li>
                  The map will zoom to that area and filter the crimes on the
                  map.
                </li>
              </ol>
            </div>
            <h3 id="district">District or Place</h3>
            <img style={{ maxWidth: "600px" }} src="help/image010.png"></img>
            Use the District or Place option to filter crimes by specific areas
            within the city. Follow these steps:
            <ol>
              <li>
                <strong>Select a Category</strong> – Choose from the following
                district/place types:
                <ul>
                  <li>Police District</li>
                  <li>City Council District</li>
                  <li>Registered Neighborhood</li>
                  <li>Park</li>
                  <li>Greenway Trail</li>
                  <li>
                    Hospitality District (Note: this is a single area and does
                    not have a list of districts.)
                  </li>
                </ul>
              </li>
              <li>
                <strong>Choose Specific Areas</strong> – For categories with
                multiple areas (all except Hospitality District), a list of
                corresponding districts or places will appear. Check the ones
                you want to include in your filter. For those with a long list
                of places, you can type where it says Select Feature… to narrow
                down the list.
              </li>
              <li>
                <strong>Set Buffer Distance (Optional)</strong> – You can set a
                buffer distance in miles or feet to include crimes within a
                surrounding area.
              </li>
              <li>
                <strong>View Results on Map</strong> – The map will update to
                display only the crimes within the selected districts or places
                (including any buffer distance applied).
              </li>
            </ol>
            <h3 id="drawing">Drawing a Graphic</h3>
            <img style={{ maxWidth: "600px" }} src="help/image011.png"></img>
            The Draw Graphic option allows you to filter crimes by manually
            drawing an area on the map. Follow these steps:
            <ol>
              <li>
                <strong>Select a Shape</strong> – Choose the type of shape you
                want to draw: Point, Line, Polygon, Rectangle, or Circle.
              </li>
              <li>
                <strong>Draw the Shape on the Map</strong>
                <ul>
                  <li>
                    <strong>Point:</strong> Click once on the map to place the
                    point.
                  </li>
                  <li>
                    <strong>Line or Polygon:</strong> Click on the map to add
                    each vertex. When finished, double-click to complete the
                    shape.
                  </li>
                  <li>
                    <strong>Rectangle or Circle:</strong> Click and hold on the
                    map, then drag to adjust the size.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Apply Distance (Optional)</strong> – Adjust the search
                distance in miles or feet to include crimes within a surrounding
                area of the shape.
              </li>
              <li>
                <strong>View Results on Map</strong> – Once the graphic is drawn
                (and buffer applied, if desired), the map will update to show
                only the crimes within the defined area.
              </li>
            </ol>
            <h2 id="when">When</h2>
            <img style={{ maxWidth: "500px" }} src="help/image012.png" />
            The When tab allows you to filter crimes based on a three date
            ranges:
            <ol>
              <li>Past 90 Days - default</li>
              <li>Past Month</li>
              <li>Past Week</li>
            </ol>
            <h1 id="using-map">Using the Map</h1>
            <h2 id="navigating-map">Navigating the Map</h2>
            You can explore the map using your mouse, touch screen, or mobile
            device:
            <h3 id="zooming">Zooming</h3>
            <ul>
              <li>
                <strong>Mouse</strong> - Use the scroll wheel to zoom in and
                out.
              </li>
              <li>
                <strong>Touch Screen / Mobile / Tablet</strong> - Pinch to zoom
                in or out.
              </li>
            </ul>
            <h3 id="panning">Panning</h3>
            <ul>
              <li>
                <strong>Mouse</strong> - Click and hold on the map, then drag
                the cursor.
              </li>
              <li>
                <strong>Touch Screen / Mobile / Tablet</strong> - Drag your
                finger across the map.
              </li>
            </ul>
            <h2 id="symbols">Understanding Crime Symbols</h2>
            <ul>
              <li>
                Crime symbols vary in size and have number labels:
                <ul>
                  <li>
                    <strong>Size</strong> - Larger symbols indicate more crimes
                    occurred in that area.
                  </li>
                  <li>
                    <strong>Number Label</strong> - Shows the total number of
                    offenses in that area.
                  </li>
                  <li>
                    <strong>Icon</strong> - Represents the predominant offense
                    in that location.
                  </li>
                </ul>
              </li>

              <li>
                <strong>Dynamic Display</strong> - Zooming in or out will adjust
                symbol sizes and labels automatically.
              </li>
            </ul>
            <h2 id="viewing-details">Viewing Details</h2>
            Click on a crime symbol to view a popup with details about the
            offenses in that area.
            <ul>
              <li>
                <strong>Single Feature</strong> - Clicking on a crime symbol
                will display a popup with details about that specific feature.
              </li>
              <li>
                <strong>Cluster of Crimes</strong> - Clicking on a cluster will
                display additional information about all crimes within that
                cluster.
              </li>
            </ul>
            <div>
              When you click on a cluster of crimes on the map:
              <ul>
                <li>
                  The popup will show the total number of offenses in that
                  cluster and the predominant offense type.
                </li>
                <li>
                  To view a full list of all offenses in the cluster, click the
                  table icon in the upper-left corner of the popup (next to the
                  zoom button). This allows you to see both a summary and the
                  detailed records for any group of crimes.
                </li>
              </ul>
            </div>
            <img style={{ maxWidth: "300px" }} src="help/image013.png" />
            The list of offenses in a cluster displays:
            <ul>
              <li>
                <strong>Crime Category</strong> – The type of offense.
              </li>
              <li>
                <strong>Date of Crime</strong> – When the offense occurred.
              </li>
            </ul>
            <img style={{ maxWidth: "300px" }} src="help/image014.png" />
            <p>
              Selecting an offense from the list will display additional
              information about that specific crime, allowing you to view
              details for individual incidents within the cluster. When viewing
              the details of a specific offense from the cluster list:
              <ul>
                <li>
                  Use the &lt; &gt; buttons in the bottom-left corner of the
                  popup to move to the previous or next offense in the list.
                </li>
                <li>
                  To return to the full list of offenses, click the button in
                  the bottom-right corner (e.g., "5 of 24" in the screenshot).
                </li>
              </ul>
              <img style={{ maxWidth: "300px" }} src="help/image015.png" />
            </p>
            This makes it easy to browse through multiple offenses without
            returning to the main map each time.
            <h2 id="map-tools">Using Map Tools</h2>
            The map includes several tools to help you navigate and explore data
            more effectively.
            <img style={{ maxWidth: "600px" }} src="help/image016.png" />
            <h3>Top-Left Tools</h3>
            The following tools are available in the top-left corner of the map:
            <ol>
              <li>
                <strong>Zoom in / Zoom out</strong> - + button zooms in one
                level, - button zooms out one level.
              </li>
              <li>
                <strong>Zoom to Current Location</strong> – Centers the map on
                your current location. You will be prompted to allow the
                application to access your location. Note: Your device's
                location is not stored.
              </li>
            </ol>
            <h3 id="top-right-tools">Top-Right Tools</h3>
            The following tools are available in the top-right corner of the
            map:
            <ol>
              <li>
                <strong>Search</strong> – Enter an address and select it from
                the list of suggestions. The map will zoom to that location.
                Note: This tool does not filter the crimes; it only navigates
                the map.
                <p>
                  <img style={{ maxWidth: "300px" }} src="help/image017.png" />
                </p>
              </li>
              <li>
                <strong>Layers</strong> – Display additional layers on the map.
                Check or uncheck the layers you want to show or hide.
                <p>
                  <img style={{ maxWidth: "300px" }} src="help/image018.png" />
                </p>
              </li>
              <li>
                <strong>Legend</strong> – Display a legend that explains the
                meaning of the symbols and icons shown on the map.
                <p>
                  <img style={{ maxWidth: "300px" }} src="help/image019.png" />
                </p>
              </li>
            </ol>
            <h3>Basemap Toggle</h3>
            In the lower-left corner of the map, you can switch between the
            Street base map and Satellite imagery. Simply click the box to
            toggle between the two views.
            <p>
              <img style={{ maxWidth: "300px" }} src="help/image020.png" />
            </p>
            <p>
              <img style={{ maxWidth: "300px" }} src="help/image021.png" />
            </p>
            <h1 id="table">Table</h1>
            The table provides a detailed view of all crime incidents displayed
            on the map. It allows you to sort and explore individual offenses in
            a tabular format. Using the table, you can quickly find specific
            crimes, view details such as offense type, date, and location, and
            navigate directly to the corresponding feature on the map.
            <img style={{ maxWidth: "1000px" }} src="help/image022.png" />
            <h2 id="sort">Sort by Column</h2>
            To sort the table by a specific column:
            <ol>
              <li>
                <strong>Click the Column Header</strong> – Clicking once will
                sort the column in ascending order.
              </li>
              <li>
                <strong>Click Again</strong> – Clicking a second time will sort
                the column in descending order.
              </li>
              <li>
                <strong>Click a Third Time</strong> – Clicking a third time will
                return the table to its original order.
              </li>
            </ol>
            <h2 id="columns">Showing or Hiding Columns</h2>
            To customize which columns are visible in the table:
            <ol>
              <li>
                Click the first button in the upper-right corner of the table.
              </li>
              <li>
                Check the columns you want to show or uncheck the columns you
                want to hide.
              </li>
            </ol>
            <p>
              <img style={{ maxWidth: "300px" }} src="help/image023.png" />
            </p>
            <h2 id="export">Exporting the Table to CSV</h2>
            To export the table of offenses:
            <ol>
              <li>
                Click the "…" button in the upper-right corner of the table.
              </li>
              <li>Select "Export to CSV".</li>
              <li>
                A CSV file will be created, which you can download and open in
                spreadsheet software for further analysis.
              </li>
            </ol>
            This allows you to save and work with the data outside of the
            application.
            <p>
              <img style={{ maxWidth: "500px" }} src="help/image024.png" />
            </p>
            <h2 id="zoom-offense">Zooming to a Specific Offense</h2>
            To locate a specific offense on the map:
            <ol>
              <li>Find the offense in the table.</li>
              <li>Click the button on the far right of that row.</li>
              <li>
                The map will zoom to the location of the selected offense.
              </li>
            </ol>
            <p>
              <img style={{ maxWidth: "300px" }} src="help/image025.png" />
            </p>
            <h1 id="menu">Menu</h1>
            Use the hamburger menu (☰) in the top-right corner of the header to
            access additional information and options related to the
            application.
            <p>
              The menu includes the following items:
              <ul>
                <li>
                  <strong>About</strong> – Information about the application.
                </li>
                <li>
                  <strong>Help</strong> – Opens the help document for using the
                  app.
                </li>
                <li>
                  <strong>FAQ</strong> – Frequently Asked Questions about the
                  app.
                </li>
                <li>
                  <strong>Data Dictionary</strong> – Displays descriptions of
                  the data fields shown for each offense.
                </li>
                <li>
                  <strong>Offense Definitions</strong> – Provides definitions
                  for each offense category.
                </li>
                <li>
                  <strong>Disclaimer</strong> – Displays the disclaimer that
                  appears when the app loads.
                </li>
                <li>
                  <strong>Crime Incidents Open Dataset</strong> – Opens the
                  dataset used in the application on the Open Data portal.
                </li>
              </ul>
              <p>
                <img style={{ maxWidth: "300px" }} src="help/image026.png" />
              </p>
            </p>
            <h1 id="faq">Frequently Asked Questions</h1>
            {faqSections.map((section) => (
              <div key={section.id} style={{ marginBottom: "1.5rem" }}>
                <h2 id={section.id} style={{ marginBottom: "0.5rem" }}>
                  {section.title}
                </h2>

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
                          <li key={`${item.id}-list-item-${index}`}>
                            {listItem}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </calcite-panel>
      </calcite-shell>
    </calcite-dialog>
  );
}
