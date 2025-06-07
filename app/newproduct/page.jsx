"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Radio from "@mui/material/Radio";
import Autocomplete from "@mui/material/Autocomplete";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataGrid, useGridApiRef } from "@mui/x-data-grid";

export default function Page() {
  const [rows, setRows] = useState([{ id: 0, stock: "", desc: "", qty: "", unit: "" }]);
  const [inventory, setInventory] = useState({});
  const [description, setDescription] = useState({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("error");
  const stockOptions = Object.keys(inventory);
  const descriptionOptions = Object.keys(description);
  const descRef = useRef();
  const amountRef = useRef();
  const priceRef = useRef();
  const notesRef = useRef();
  const radioRef = useRef("WS");
  const apiRef = useGridApiRef();

  const sxPattern = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: '#666' },
      fontSize: '0.8rem',
    },
    '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
      height: '32px',
      padding: 0,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.8rem',
    },
    fontSize: '0.8rem',
  };

  useEffect(() => {
    fetch("/api/inventory?indexByPk")
      .then(res => res.json())
      .then(({ inventory, description }) => {
        setInventory(inventory);
        setDescription(description);
      })
      .catch(err => console.error("inventory fetch failed", err));
  }, []);

  const validateForm = () => {
    const desc = descRef.current?.value.trim();
    if (!desc) {
      setToastMsg("You must enter a product description.");
      setToastOpen(true);
      setToastType("error");
      return false;
    }

    const defaultAmt = parseFloat(amountRef.current?.value);
    if (isNaN(defaultAmt) || defaultAmt < 0) {
      setToastMsg("Default amount must be a number greater than 0.");
      setToastOpen(true);
      setToastType("error");
      return false;
    }

    for (const r of rows) {
      console.log(r.id, r.stock);
      if (r.stock) {
        const q = parseFloat(r.qty);
        if (isNaN(q) || q <= 0) {
          setToastMsg(`Materials Row ${r.id + 1}: Quantity must be a positive number.`);
          setToastOpen(true);
          setToastType("error");
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    const data = {
      description: descRef.current?.value || "",
      defaultAmount: amountRef.current?.value || "",
      price: priceRef.current?.value || "",
      notes: notesRef.current?.value || "",
      format: radioRef.current || "WS",
      templates: rows.filter(r => r.stock || r.desc || r.qty || r.unit),
    };
    fetch("/api/newproduct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to submit");
        const descVal = descRef.current?.value || "";
        setToastMsg(`${descVal} was successfully created`);
        setToastOpen(true);
        setToastType("success");
        descRef.current.value = "";
        amountRef.current.value = "";
        priceRef.current.value = "";
        notesRef.current.value = "";
        radioRef.current = "WS";
        setRows([{ id: 0, stock: "", desc: "", qty: "", unit: "" }]);
      })
      .catch(err => {
        console.error(err);
        setToastMsg("Submission failed");
        setToastOpen(true);
      });
  };

  return (
    <>
      <h1 className="m-4 text-center font-bold text-xl">
        Create New Product
      </h1>
      <div className="grid grid-cols-4 gap-2 px-6">
        <div className="col-span-2">
          <TextField
            inputRef={descRef}
            fullWidth
            label="Product Description"
            size="small"
            sx={sxPattern}
          />
        </div>
        <div className="col-span-1">
          <TextField
            inputRef={amountRef}
            fullWidth
            label="Default Amount"
            size="small"
            sx={sxPattern}
          />
        </div>
        <div className="col-span-1">
          <TextField
            inputRef={priceRef}
            fullWidth
            label="Price"
            size="small"
            sx={sxPattern}
          />
        </div>
        <div className="col-span-3">
          <TextField
            inputRef={notesRef}
            fullWidth
            label="Production Notes"
            size="small"
            sx={sxPattern}
          />
        </div>
        <div className="col-span-1 ml-3 mt-[-4px]">
          <RadioGroup
            row
            name="formatOptions"
            defaultValue="WS"
            onChange={(e) => (radioRef.current = e.target.value)}
          >
            <FormControlLabel
              value="WS"
              control={<Radio size="small" />}
              label="WS"
            />
            <FormControlLabel
              value="Uph"
              control={<Radio size="small" />}
              label="Uph"
            />
          </RadioGroup>
        </div>
      </div>
      <Box border={1} borderColor="grey.400" borderRadius={1} className="m-2 p-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl">Materials</h1>
        </div>
        <div style={{ height: 210 }}>
          <DataGrid
            apiRef={apiRef}
            rows={rows}
            columns={[
              {
                field: "stock",
                headerName: "Stock Number",
                flex: 2,
                editable: true,
                renderEditCell: (params) => (
                  <Autocomplete
                    freeSolo
                    fullWidth
                    openOnFocus
                    autoHighlight
                    options={stockOptions}
                    value={params.value}
                    onChange={(_, val) => {
                      params.api.setEditCellValue({ id: params.id, field: 'stock', value: val });
                      setTimeout(() => {
                        params.api.stopCellEditMode({ id: params.id, field: 'stock' });
                      });
                    }}
                    renderInput={(inputParams) => (
                      <TextField {...inputParams} size="small" autoFocus sx={sxPattern} />
                    )}
                  />
                ),
              },
              {
                field: "desc",
                headerName: "Description",
                flex: 5,
                editable: true,
                renderEditCell: (params) => (
                  <Autocomplete
                    freeSolo
                    fullWidth
                    openOnFocus
                    autoHighlight
                    options={descriptionOptions}
                    value={params.value}
                    onChange={(_, val) => {
                      params.api.setEditCellValue({ id: params.id, field: 'desc', value: val });
                      setTimeout(() => {
                        params.api.stopCellEditMode({ id: params.id, field: 'desc' });
                      });
                    }}
                    renderInput={(inputParams) => (
                      <TextField {...inputParams} size="small" autoFocus sx={sxPattern} />
                    )}
                  />
                )
              },
              { field: "qty", headerName: "Quantity", flex: 1, editable: true },
              { field: "unit", headerName: "Unit", flex: 1 },
            ]}
            experimentalFeatures={{ newEditingApi: true }}

            processRowUpdate={(newRow, oldRow) => {
              // auto-fill dependent fields
              let filledRow;
              if (newRow.stock !== oldRow.stock) {
                const rec = inventory[newRow.stock] || {};
                filledRow = {
                  ...newRow,
                  desc: rec.material_description || "",
                  unit: rec.material_unit || newRow.unit,
                };
              } else if (newRow.desc !== oldRow.desc) {
                const rec = description[newRow.desc] || {};
                filledRow = {
                  ...newRow,
                  stock: rec.stock_number || newRow.stock,
                  unit: rec.material_unit || newRow.unit,
                };
              } else {
                filledRow = newRow;
              }

              // update React state with auto-add logic
              setRows(prev => {
                const updated = prev.map(r => r.id === filledRow.id ? filledRow : r);
                const last = updated[updated.length - 1];
                if (last.stock || last.desc || last.qty || last.unit) {
                  updated.push({ id: updated.length, stock: "", desc: "", qty: "", unit: "" });
                }
                return updated;
              });

              return filledRow;
            }}
            onProcessRowUpdateError={(err) => console.error("Row update failed:", err)}
            onCellClick={(cellParams) => {
              const colDef = apiRef.current.getColumn(cellParams.field);
              if (!colDef.editable) return;
              const currentMode = apiRef.current.getCellMode(cellParams.id, cellParams.field);
              if (currentMode === 'view') {
                apiRef.current.startCellEditMode({
                  id: cellParams.id,
                  field: cellParams.field,
                });
              }
            }}
            hideFooter
            rowHeight={28}
            headerHeight={28}
            sx={{
              '& .MuiDataGrid-cell, & .MuiDataGrid-columnHeader': {
                borderRight: '1px solid rgba(224,224,224,1)',
              },
              '& .MuiDataGrid-columnHeaders': {
                minHeight: 28,
                maxHeight: 28,
              },
              '& .MuiDataGrid-columnHeader': {
                lineHeight: '28px',
                paddingTop: 0,
                paddingBottom: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '0.75rem',
              },
            }}
          />
        </div>
      </Box >
      <Box textAlign="center" className="m-2">
        <Button variant="contained" onClick={handleSubmit}>Submit</Button>
      </Box>
      {/* Snackbar for validation errors */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={toastType}
          icon={toastType === "success" ? false : undefined}
          onClose={() => setToastOpen(false)}
          sx={{ width: '100%' }}
        >
          {toastMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
