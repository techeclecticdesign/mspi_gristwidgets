"use client"
import { useGrist } from "./grist";

const TestPage = () => {
  const grist = useGrist();
  let tableData = [];

  if (grist) {
    grist.ready();
    grist.onRecords(function (records) {
      tableData = records;
      console.log(tableData);
    }
    )
  }
  return (
    <div>
      <h1>Barcode Scanner</h1>
      <p>Scan a barcode to see the result in the console.</p>
    </div>
  );
};

export default TestPage;
