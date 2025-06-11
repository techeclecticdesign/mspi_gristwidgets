"use client";

import { useState, useRef, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import NewProduction from "@/app/components/NewProduction";
import { useGrist } from "../grist";
import useProdViewerData from "./_hooks/useProdViewerData";
import { downloadPdfFromEndpoint } from "@/app/lib/pdf";

const host = process.env.NEXT_PUBLIC_GRIST_HOST;
const inventory_page = process.env.NEXT_PUBLIC_INVENTORY_TABLE_PAGE;

export default function ProductionViewer() {
  const grist = useGrist();
  const gristRef = useRef(null);
  const tableDataRef = useRef([]);
  const searchInputRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCursor, setSearchCursor] = useState(-1);
  const [previewCB, setPreviewCB] = useState(false);
  const [costoutCB, setCostoutCB] = useState(false);
  const [closeOutCB, setCloseOutCB] = useState(false);
  const [noteType, setNoteType] = useState("clerk");
  const [clerkNotes, setClerkNotes] = useState("");
  const [contractorNotes, setContractorNotes] = useState("");
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    isLoading: dataLoading,
    prodStandards,
    refresh: refreshData
  } = useProdViewerData();

  const [priceInput, setPriceInput] = useState("");

  const customerPrice = selectedRow
    ? (prodStandards[selectedRow.product_code]?.customer_price ?? "")
    : "";

  const clerkNotesData = selectedRow
    ? (prodStandards[selectedRow.product_code]?.production_notes ?? "")
    : "";

  const contractorNotesData = selectedRow
    ? (selectedRow.contractor_memo ?? "")
    : "";

  useEffect(() => {
    setPriceInput(customerPrice);
  }, [customerPrice]);

  /* Switch Notes radiobutton to Clerk */
  useEffect(() => {
    setClerkNotes(clerkNotesData);
  }, [clerkNotesData]);

  /* Switch Notes radiobutton to Contractor */
  useEffect(() => {
    setContractorNotes(contractorNotesData);
  }, [contractorNotesData]);

  /* Switch Notes radiobutton to Clerk on record change */
  useEffect(() => {
    setNoteType("clerk");
  }, [selectedRow]);

  useEffect(() => {
    if (!grist) return;
    gristRef.current = grist;
    grist.ready({ requiredAccess: "read table" });
    grist.allowSelectBy();
    grist.onRecords((records) => {
      tableDataRef.current = records;
      setOptions(records.map(r => ({
        id: r.id,
        po_number: r.po_number,
        product: r.product,
      })));
    });
  }, [grist]);

  const handleChange = async (_evt, newOption) => {
    if (newOption) {
      const fullRow = tableDataRef.current.find(r => r.id === newOption.id) || null;
      setSelectedRow(fullRow);
      await grist.setSelectedRows([newOption.id]);
    } else {
      setSelectedRow(null);
      await grist.setSelectedRows([]);
    }
  };

  const findMatch = (startIdx) => {
    const term = searchTerm.trim().toLowerCase();
    const list = tableDataRef.current;
    for (let i = startIdx; i < list.length; i++) {
      const r = list[i];
      if (
        [r.po_number, r.product, r.product_code, r.team, r.customer]
          .some(f => f?.toString().toLowerCase().includes(term))
      ) {
        return i;
      }
    }
    return -1;
  };

  const handleSearchFirst = async () => {
    const idx = findMatch(0);
    if (idx !== -1) {
      const row = tableDataRef.current[idx];
      setSelectedRow(row);
      setSearchCursor(idx);
      await grist.setSelectedRows([row.id]);
    }
  };

  const handleSearchNext = async () => {
    const idx = findMatch(searchCursor + 1);
    if (idx !== -1) {
      const row = tableDataRef.current[idx];
      setSelectedRow(row);
      setSearchCursor(idx);
      await grist.setSelectedRows([row.id]);
    }
  };

  const handlePrintButton = () => {
    return;
  }

  const handleShipButton = async () => {
    if (!selectedRow) {
      return;
    }
    await downloadPdfFromEndpoint(
      `/api/pdf/shipticket?ponumber=${selectedRow.po_number}`);
  }

  const handleInventoryButton = () => {
    window.open(host + "/o/docs/qZ1weY6NyWVW/test/p/" + inventory_page, "_blank");
  };

  const handleTemplatesButton = () => {
    window.open(host + "/o/docs/qZ1weY6NyWVW/test/p/14", "_blank");
  };

  const handleCloseOutButton = async () => {
    if (!selectedRow) {
      return;
    }
    // If 'Completed' is empty, update the Grist table via widget API
    if (!selectedRow.cost_out_date) {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
      await gristRef.current.selectedTable.update({
        id: selectedRow.id,
        fields: { cost_out_date: today }
      });
      refreshData();
      setSelectedRow({ ...selectedRow, cost_out_date: today });
    }
    // print closeout
    if (closeOutCB) {
      await downloadPdfFromEndpoint(
        `/api/pdf/product-closeout?ponumber=${selectedRow.po_number}`
      );
    }
    // print costout
    if (costoutCB) {
      await downloadPdfFromEndpoint(
        `/api/pdf/worker-costout?ponumber=${selectedRow.po_number}&productcode=${selectedRow.product_code}`
      );
      return;
    }
  }

  const handleAddPoButton = () => {
    setPoModalOpen(true);
  };

  const handleModalCallback = async (newPo) => {
    setPoModalOpen(false);
    console.log("New PO arrived:", newPo);

    const fullRow = tableDataRef.current.find(r => r.po_number === newPo);
    if (!fullRow) return;

    setOptions(opts => [...opts, {
      id: fullRow.id,
      po_number: fullRow.po_number,
      product: fullRow.product || ""
    }]);

    setTimeout(() => handleChange(null, {
      id: fullRow.id,
      po_number: fullRow.po_number,
      product: fullRow.product || ""
    }), 200);
  }

  const handleClearField = async (field) => {
    if (!selectedRow) { return; }
    await gristRef.current.selectedTable.update({
      id: selectedRow.id,
      fields: { [field]: "" }
    });
    refreshData();
    setSelectedRow({ ...selectedRow, [field]: "" });
  };

  const handleDeletePoButton = () => {
    if (selectedRow) setDeleteDialogOpen(true);
  };

  const handleConfirmDeletePo = async () => {
    setDeleteDialogOpen(false);
    await fetch(`/api/cascadedelete?po_number=${selectedRow.po_number}`, { method: "DELETE" });
    refreshData();
    setSelectedRow(null);
  };

  const handleCancelDeletePo = () => setDeleteDialogOpen(false);

  const commonSx = {
    "& .MuiInputBase-input": {
      fontSize: 11,
      height: 22,
      padding: 0.6,
      mb: -0.6,
      pl: 1,
    },
    "& .MuiFormLabel-root": {
      fontSize: 12,
      height: 24,
      lineHeight: "0.85",
      pl: 1,
    },
    "& .MuiInputLabel-root.MuiInputLabel-shrink": {
      left: "9px",
      top: "-1px",
      transform: "scale(0.75)",
    },
    "& .MuiOutlinedInput-notchedOutline legend span": {
      paddingLeft: 0,
      paddingRight: 0,
    },
  };

  return (
    <>
      {/* Add New PO Modal */}
      <Dialog
        open={poModalOpen}
        onClose={() => setPoModalOpen(false)}
        fullScreen
        sx={{
          // container flush to top
          "& .MuiDialog-container": {
            alignItems: "flex-start",
            paddingTop: 0,               // remove any container padding
          },
          // paper with no margins
          "& .MuiDialog-paper": {
            margin: 0,
            marginTop: -3,
            width: "75%",
            maxWidth: "75%",
            height: "125%",
            borderRadius: 0,
          },
        }}
      >
        {/* Add PO Modal Form */}
        <DialogContent>
          <NewProduction modalCallback={handleModalCallback} />
        </DialogContent>
      </Dialog>
      {/* Delete PO Modal Confirm */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDeletePo}>
        <DialogContent>
          <p>This will delete this PO Number and all related data.<br />Are you sure you want to continue?</p>
          <Button onClick={handleConfirmDeletePo}>Yes</Button>
          <Button onClick={handleCancelDeletePo}>No</Button>
        </DialogContent>
      </Dialog >

      <div className={"ml-2 mt-2 grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-4"}>
        {/* Col 1 */}
        <div className="flex flex-col space-y-1.5">
          <Autocomplete
            size="small"
            options={options}
            getOptionLabel={opt => opt?.po_number ?? ""}
            renderOption={(props, opt) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest} style={{ fontSize: "0.7rem" }}>
                  {opt.po_number} — {opt.product}
                </li>
              );
            }}
            value={
              selectedRow
                ? { id: selectedRow.id, po_number: selectedRow.po_number ?? "", product: selectedRow.product ?? "" }
                : null
            } onChange={handleChange}
            renderInput={params => (
              <div className="flex items-center gap-1">
                <TextField
                  {...params}
                  label="PO Number"
                  variant="outlined"
                  sx={{
                    ...commonSx,
                    "& .MuiInputBase-input": {
                      ...commonSx["& .MuiInputBase-input"],
                      height: 15,
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleAddPoButton}
                  sx={{ height: 30, width: 30 }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleDeletePoButton} sx={{ height: 30, width: 30 }}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
              </div>
            )}
            sx={{ display: "block", width: "100%" }}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Product Code"
            value={selectedRow?.product_code ?? ""}
            sx={commonSx}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Description"
            value={selectedRow?.product ?? ""}
            sx={commonSx}
          />
          <TextField
            size="small"
            variant="outlined"
            label="Team&nbsp;"
            value={selectedRow?.team ?? ""}
            sx={commonSx}
          />
          <TextField
            size="small"
            variant="outlined"
            label="For&nbsp;&nbsp;"
            value={selectedRow?.customer ?? ""}
            sx={commonSx}
          />
          <div className="flex gap-1.5">
            <TextField
              size="small"
              variant="outlined"
              label="Requested"
              value={selectedRow?.amount_requested ?? ""}
              sx={commonSx}
            />
            <TextField
              size="small"
              variant="outlined"
              label="Completed"
              value={selectedRow?.amount_completed ?? ""}
              sx={commonSx}
            />
          </div>
        </div>
        {/* Col 2 */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex">
            <TextField
              size="small"
              variant="outlined"
              label="Search"
              inputRef={input => {
                searchInputRef.current = input;
              }}
              value={searchTerm}
              autoComplete="off"
              onChange={e => {
                setSearchTerm(e.target.value);
                setSearchCursor(-1);
              }}
              slotProps={{
                htmlInput: {
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target).blur();
                      handleSearchFirst();
                    }
                  },
                },
              }}
              sx={{
                ...commonSx,
                width: '50%',
                "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
                  borderColor: 'black'
                },
              }}
            />
            <Button
              size="small"
              variant="text"
              onClick={handleSearchFirst}
              sx={{
                height: "27px",
                fontSize: "0.65rem",
                fontWeight: "bold",
                minWidth: '50px'
              }}
            >
              First
            </Button>
            <Button
              size="small"
              variant="text"
              onClick={handleSearchNext}
              sx={{
                height: "27px",
                fontSize: "0.65rem",
                fontWeight: "bold",
                minWidth: '50px'
              }}
            >
              Next
            </Button>
          </div>
          <div className="flex gap-1 !mt-5">
            <Button
              size="small"
              variant="contained"
              onClick={handlePrintButton}
              sx={{
                height: "26px",
                fontSize: "0.65rem",
                fontWeight: "bold",
                flex: 1
              }}
            >
              Print
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleShipButton}
              sx={{
                height: "26px",
                fontSize: "0.65rem",
                fontWeight: "bold",
                flex: 1
              }}
            >
              Ship
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="small"
              variant="contained"
              onClick={handleInventoryButton}
              sx={{
                height: "26px",
                fontSize: "0.65rem",
                fontWeight: "bold",
                flex: 1
              }}
            >
              Inventory
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleTemplatesButton}
              sx={{
                height: "26px",
                fontSize: "0.65rem",
                fontWeight: "bold",
                flex: 1
              }}
            >
              Templates
            </Button>
          </div>
          <div className="flex gap-1.5 ml-6 !mt-5">
            <div className="w-1/2 mt-4 mr-2">
              <Button
                size="small"
                variant="contained"
                onClick={handleCloseOutButton}
                sx={{
                  backgroundColor: '#C70039',
                  height: '29px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  width: '100%',
                }}
              >
                Close Out
              </Button>
            </div>
            <div className="w-1/2 flex flex-col mt-2.5">
              <p className="text-xs font-bold ml-8 mt-[-14px] mb-[-2px]">Print</p>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={closeOutCB}
                    size="small"
                    onChange={e => setCloseOutCB(e.target.checked)}
                    sx={{ p: 0, pl: 0.5, pb: 0 }}
                  />
                }
                label="Close Out"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.75rem',
                    ml: 0.5,
                    mt: 0.3
                  },
                  m: 0,
                }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={costoutCB}
                    size="small"
                    onChange={e => setCostoutCB(e.target.checked)}
                    disabled={previewCB}
                    sx={{ p: 0, pl: 0.5 }}
                  />
                }
                label="Cost Out"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.75rem',
                    ml: 0.5,
                    mt: 0.2
                  },
                  m: 0,
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-span-2 flex flex-row flex-nowrap items-start gap-1.5 mr-2">
          {/* Col 3 (double wide) */}
          <div className="w-1/4 flex flex-col space-y-1.5">
            <TextField
              size="small"
              variant="outlined"
              label="Unit Price"
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              onBlur={async () => {
                if (selectedRow && priceInput !== customerPrice) {
                  await fetch("/api/prodstandards", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      product_code: selectedRow.product_code,
                      customer_price: priceInput,
                    }),
                  });
                  refreshData();
                }
              }}
              sx={{
                ...commonSx,
                width: 100
              }}
            />
            <TextField
              size="small"
              variant="outlined"
              label="Unit Cost"
              value={selectedRow?.price ?? ""}
              sx={{
                ...commonSx,
                width: 100
              }}
            />
            <TextField
              size="small"
              variant="outlined"
              label="Started"
              value={selectedRow?.start_date ?? ""}
              sx={{
                ...commonSx,
                width: 100
              }}
            />
            <TextField
              size="small"
              variant="outlined"
              label="Finish Done"
              value={selectedRow?.finishing_done ?? ""}
              sx={{
                ...commonSx,
                width: 100
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.preventDefault();
                  handleClearField('finishing_done');
                }
              }}
            />
            <TextField
              size="small"
              variant="outlined"
              label="Completed"
              value={selectedRow?.cost_out_date ?? ""}
              sx={{
                ...commonSx,
                width: 100
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.preventDefault();
                  handleClearField('cost_out_date');
                }
              }}
            />
            <TextField
              size="small"
              variant="outlined"
              label="Ship Ticket"
              value={selectedRow?.product_shipped ?? ""}
              sx={{
                ...commonSx,
                width: 100
              }}
              onKeyDown={e => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                  e.preventDefault();
                  handleClearField('product_shipped');
                }
              }}
            />
          </div>
          <div className="w-3/4 flex flex-col space-y-1.5">
            <div className="flex items-center gap-4">
              <p className="text-sm ml-4 mr-2">Notes:</p>
              <RadioGroup
                name="note-type"
                row
                value={noteType}
                onChange={(_, v) => setNoteType(v)}
              >
                <FormControlLabel
                  value="clerk"
                  control={<Radio size="small" />}
                  label="Clerk"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                />
                <FormControlLabel
                  value="contractor"
                  control={<Radio size="small" />}
                  label="Contractor"
                  sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                />
              </RadioGroup>
            </div>
            <TextField
              label=""
              multiline
              rows={4}
              size="small"
              sx={commonSx}
              value={noteType === "clerk" ? clerkNotes : contractorNotes}
              onChange={e => {
                if (noteType === "clerk") {
                  setClerkNotes(e.target.value);
                } else {
                  setContractorNotes(e.target.value);
                }
              }}
              onBlur={async () => {
                if (!selectedRow) { return; }
                if (noteType === "clerk" && clerkNotes !== clerkNotesData) {
                  await fetch("/api/prodstandards", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      product_code: selectedRow.product_code,
                      production_notes: clerkNotes,
                    }),
                  });
                  refreshData();
                }
                else if (noteType === "contractor" && contractorNotes !== contractorNotesData) {
                  await gristRef.current.updateRecords({
                    [selectedRow.id]: { contractor_memo: contractorNotes }
                  });
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
