"use client";

import { useState, useEffect, useRef } from "react";
import TextField from "@mui/material/TextField";
import BarcodeScanner from "../lib/barcode";
import { useGrist } from "../grist";

const BarcodePage = () => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const grist = useGrist();
  const tableDataRef = useRef([]);
  const gristRef = useRef(null);
  const tableId = "BillOfLading";

  useEffect(() => {
    if (grist) {
      gristRef.current = grist;
      grist.ready();
      grist.onRecords((records) => {
        tableDataRef.current = records;
      });
    }
  }, [grist]);

  useEffect(() => {
    const scanner = new BarcodeScanner({
      timeout: 50,
      shouldCapture: () => !isInputFocused,
      barcodeCallback: (scannedValue) => {
        console.log("Scanned value:", scannedValue);
        handleBarcodeValidation(scannedValue);
      },
    });

    return () => {
      scanner.destroy();
    };
  }, [isInputFocused]);

  const handleFocus = () => setIsInputFocused(true);
  const handleBlur = () => setIsInputFocused(false);

  const handleBarcodeValidation = (barcode) => {
    const existingEntry = tableDataRef.current.find(
      (entry) => entry["shipTicket"] === barcode
    );

    if (existingEntry) {
      setErrorMessage(`Error: Barcode "${barcode}" already exists.`);
    } else {
      if (gristRef.current) {
        gristRef.current.docApi.applyUserActions([
          ["AddRecord", tableId, null, { shipTicket: barcode }],
        ]);
      }
      setInputValue("");
      setErrorMessage("");
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleBarcodeValidation(inputValue);
    }
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div className="text-center w-full">
      <div className="mb-12 h-12 pt-4">
        <h1 className="text-2xl">Bill of Lading Data Entry</h1>
        <p className="text-lg">Type or scan shipping ticket number</p>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        <TextField
          helperText={"Enter ticket number"}
          variant="outlined"
          size="small"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          sx={{ width: "145px" }}
        />
      </form>
      {errorMessage && (
        <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
      )}
    </div>
  );
};

export default BarcodePage;
