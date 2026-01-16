import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";

interface AboutProps {
  open: boolean;
  onClose: () => void;
}

export default function About({ open, onClose }: AboutProps) {
  return (
    <calcite-dialog
      open={open}
      modal
      heading="About Crime Mapper"
      oncalciteDialogClose={onClose}
      placement="cover"
    >
      <p>
        The Raleigh Police Department’s Crime Mapper provides the public with
        information about recent reported crime activity in Raleigh. Our goal is
        to support safer neighborhoods through a better-informed community and
        to strengthen community-oriented policing efforts.
      </p>
      <p>
        Crime Mapper uses an advanced mapping engine to provide interactive
        tools for viewing crime activity. Crime data is extracted on a regular
        basis from the Raleigh Police Department’s records system so the
        information available through your web browser is as current as
        possible.
      </p>
      <h2>Data Notes and Disclaimer</h2>
      <ul>
        <li>
          Crime Mapper displays a rolling 90 days of data and is updated daily.
        </li>
        <li>
          To enhance privacy and support accurate offense coding, incidents are
          displayed with a 1-day delay.
        </li>
        <li>
          Locations are generalized to the block level. Incidents are randomly
          stacked on the block and do not represent an exact address.
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
    </calcite-dialog>
  );
}
