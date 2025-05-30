import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-button";

interface DisclaimerProps {
  open: boolean;
  onClose: () => void;
}

export default function Disclaimer({ open, onClose }: DisclaimerProps) {
  return (
    <calcite-dialog
      open={open}
      oncalciteDialogClose={onClose}
      heading="Disclaimer"
      scale="l"
      width="m"
      closeDisabled
    >
      <p>
        The Raleigh Police Department does not guarantee the accuracy of the
        information contained herein. While all attempts are made to ensure the
        correctness and suitability of information under our control and to
        correct any errors brought to our attention, no representation or
        guarantee can be made as to the correctness or suitability of the
        information that is presented, referenced, or implied. Data is provided
        by initial reports received and processed by the Raleigh Police
        Department. Crime data may be amended or corrected by the Raleigh Police
        Department at any time to reflect changes in the investigation, nature,
        or accuracy of the initial report and the Raleigh Police Department is
        not responsible for any error or omission, or for the use of or the
        results obtained from the use of this information.
      </p>
      <p>
        This data does not reflect the official crime index totals as reported
        to North Carolina Department of Public Safety - State Bureau of
        Investigations nor that of the FBI's UCR report. Raleigh Police
        Department has not authorized any person, business or media source to
        make representations or base opinion on this data. Misuse of the data
        may subject a party to criminal prosecution for false advertising under
        NC GS § 14-117. The Raleigh Police Department may, at its discretion,
        discontinue or modify this service at any time without notice.
      </p>
      <div slot="footer">
        <calcite-button kind="brand" scale="l" width="full" onClick={onClose}>
          OK
        </calcite-button>
      </div>
    </calcite-dialog>
  );
}
