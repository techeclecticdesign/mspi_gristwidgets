"use client";

import { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import useNewProductionData from "@/app/hooks/useNewProductionData";
import { filterArrayStartsWith, getTemplateWoodEntries } from "@/app/lib/util";
import { downloadPdfFromEndpoint } from "@/app/lib/pdf";

export default function ProductionPage({ modalCallback }) {
  const {
    prodStandards,
    prodDescOptions,
    prodCodeOptions,
    workersByName,
    leadersList = [],
    nhifmList = [],
    templates,
    customers
  } = useNewProductionData();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [printSlipOpen, setPrintSlipOpen] = useState(false);
  const [productType, setProductType] = useState("");
  const [selectedProd, setSelectedProd] = useState(null); // options for stock product code list
  const [productCode, setProductCode] = useState(""); // dynamically generated product code
  const [prodCodeEnabled, setProdCodeEnabled] = useState(true);
  const [team, setTeam] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [prodDescEnabled, setProdDescEnabled] = useState(true);
  const [amountRequested, setAmountRequested] = useState("");
  const [requestedEnabled, setRequestedEnabled] = useState(true);
  const [price, setPrice] = useState("");
  const [woodType, setWoodType] = useState("");
  const [woodEnabled, setWoodEnabled] = useState(true);
  const [customer, setCustomer] = useState("");
  const [customerDesc, setCustomerDesc] = useState("");
  const [contractorNote, setContractorNote] = useState("");
  const [clerkNotes, setClerkNotes] = useState("");
  const [paidNHDays, setPaidNHDays] = useState(false);
  const generatedPoRef = useRef(null);
  const woodEntriesRef = useRef([]);
  const woodTypeOptions = [
    "Ash", "Birch", "Cedar", "Cherry", "Mahogany", "Oak", "Pine", "Poplar", "Other"
  ];
  const fixedTeamTypes = ["Weatherend", "Engraving"];
  const isTeamFixed = fixedTeamTypes.includes(productType);
  const teamOptions = isTeamFixed
    ? [productType]
    : productType === "NHIFM"
      ? nhifmList
      : leadersList;
  const codeOptions = prodCodeOptions || [];
  const descOptions = prodDescOptions || [];
  const customerOptions = customers.map(c =>
    c.customer_desc ? `${c.customer_name} ${c.customer_desc}` : c.customer_name
  );
  const sxPattern = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#666'
      },
      fontSize: '0.8rem',
    },
    '& .MuiOutlinedInput-root:not(.MuiInputBase-multiline)': {
      height: '32px',
      padding: '0',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.8rem',
    },
    fontSize: '0.8rem'
  }

  const handleProductTypeChange = e => {
    const value = e.target.value;
    setProductType(value);
    setSelectedProd(null);
    setPrice("");

    if (value === "Stock") {
      setProductCode("");
      setProdCodeEnabled(true);
      setWoodType("");
      setWoodEnabled(true);
      setProductDesc("");
      setProdDescEnabled(true);
      setAmountRequested("");
      setRequestedEnabled(true);
      setCustomer("Stock");
    }

    if (value === "Engraving") {
      setProductCode(value);
      setProdCodeEnabled(false);
      setWoodType("");
      setWoodEnabled(false);
      setProdDescEnabled(false);
      setProductDesc(value);
      setAmountRequested("1");
      setRequestedEnabled(false);
      setCustomer("");
    }

    if (value === "NHIFM") {
      setProductCode(autofillProductCode(value));
      setProdCodeEnabled(false);
      setWoodType("");
      setWoodEnabled(false);
      setProdDescEnabled(true);
      setProductDesc("");
      setAmountRequested("");
      setRequestedEnabled(false);
      setCustomer("NHIFM");
    }

    if (value === "Special" || value === "Weatherend") {
      setProductCode(autofillProductCode(value));
      setProdCodeEnabled(false);
      setWoodType("");
      setWoodEnabled(false);
      setProductDesc("");
      setProdDescEnabled(true);
      setAmountRequested("1");
      setRequestedEnabled(false);
      setCustomer("");
    }

    if (value === "Wood Bags" || value === "Wood Pellets") {
      setProductCode(value);
      setProdCodeEnabled(false);
      setWoodType("");
      setWoodEnabled(false);
      setProductDesc(value);
      setProdDescEnabled(false);
      setAmountRequested("25");
      setRequestedEnabled(false);
      setCustomer("Stock");
    }

    if (value === "Electronics") {
      setProductCode(value);
      setProdCodeEnabled(false);
      setWoodType("");
      setWoodEnabled(false);
      setProductDesc(autofillElectronicsDesc);
      setProdDescEnabled(false);
      setAmountRequested("1");
      setRequestedEnabled(false);
      setCustomer("");
    }

    if (fixedTeamTypes.includes(value)) {
      setTeam(value);
    } else {
      setTeam("");
    }
  };

  const handleProdCodeChange = (value) => {
    setSelectedProd(value);
    setProductCode(value?.code ?? "");
    if (value?.code) {
      const found = descOptions.find(opt => opt.code === value.code);
      if (found) {
        setProductDesc(found.desc);
      }
    }
    if (productType === "Stock") {
      setCustomer(productType ?? "");
      if (!prodStandards[productCode]) return;
      setAmountRequested(prodStandards[productCode].default_amount ?? "");
      setPrice(prodStandards[productCode].customer_price ?? "");
      setClerkNotes(prodStandards[productCode].production_notes) || "";
      setClerkNotes(prodStandards[productCode].production_notes) || "";
      const matchedDesc = descOptions.find(opt => opt.code === value.code);
      if (matchedDesc) {
        setProductDesc(matchedDesc.desc);
      }
      // TODO setWoodType
    } else {
      // TODO customer -> autocomplete with customer list
      return;
    }
  }

  const handleDescChange = (value) => {
    setSelectedProd(value || null);
    setProductCode(value?.code || "");
    setProductDesc(value?.desc || "");
    if (productType === "Stock") {
      setCustomer(productType ?? "");
      if (!prodStandards[productCode]) return;
      setAmountRequested(prodStandards[productCode].default_amount ?? "");
      setPrice(prodStandards[productCode].customer_price ?? "");

      // TODO setWoodType
    } else {
      // TODO customer -> autocomplete with customer list
      return;
    }
  }

  const handleCustomerChange = (val) => {
    setCustomer(val);
    const found = customers.find(c =>
      `${c.customer_name} ${c.customer_desc}` === val
    );
    if (found) setCustomerDesc(found.customer_desc);
    else setCustomerDesc("");
  };

  const handleTeamChange = (value) => {
    setTeam(value);
  }

  useEffect(() => {
    if (["NHIFM", "Weatherend", "Special"].includes(productType)) {
      if ("NHIFM" && !team) return;
      setProductCode(autofillProductCode(productType));
    }
  }, [productType, team]);

  const autofillProductCode = (productType) => {
    if (productType === "Special" || productType === "Weatherend") {
      // auto-generate special code
      const twoDigitYear = new Date().getFullYear().toString().slice(-2);
      const codeList = codeOptions.map(opt => opt.code);
      const filteredResult = filterArrayStartsWith(codeList, twoDigitYear + "  Special").sort().reverse();
      if (filteredResult.length === 0) {
        return twoDigitYear + " Special 001";
      }
      const updatedStr = filteredResult[0].replace(/\d{3}$/, match => {
        const incremented = (parseInt(match, 10) + 1).toString().padStart(3, '0');
        return incremented;
      });
      return updatedStr ?? "";
    }
    // auto-generate nhifm code
    if (productType === "NHIFM" && team && workersByName[team]) {
      const nhifmId = workersByName[team].nhifm_id;
      const codeList = codeOptions.map(opt => opt.code);
      const filteredResult = filterArrayStartsWith(codeList, nhifmId).sort().reverse();
      if (filteredResult.length === 0) {
        return nhifmId + ".001";
      }
      const updatedStr = filteredResult[0].replace(/\d{3}$/, match => {
        const incremented = (parseInt(match, 10) + 1).toString().padStart(3, '0');
        return incremented;
      });
      return updatedStr ?? "";
    }
    return "";
  }

  const autofillElectronicsDesc = () => {
    const now = new Date();
    const month = now.toLocaleString("default", {
      month: "short"
    });
    const year = now.getFullYear().toString().slice(-2);
    return `Electronics ${month} ${year}`;
  }

  const isValidQuantity = (qty) => {
    const trimmed = String(qty).trim();
    if (trimmed === "") return true;
    return /^\d+(\.\d+)?$/.test(trimmed);
  }

  const validateForm = () => {
    if (!productType) {
      setToastMsg("You must select a Product Type.");
      setToastOpen(true);
      return false;
    }
    if (!isValidQuantity(amountRequested)) {
      setToastMsg("Amount requested must be a valid number.");
      setToastOpen(true);
      return false;
    }
    if (!isValidQuantity(price)) {
      setToastMsg("Price must be a valid number.");
      setToastOpen(true);
      return false;
    }
    if (["Stock", "Special", "NHIFM"].includes(productType) && !team) {
      setToastMsg("You must select a team for this project.");
      setToastOpen(true);
      return false;
    }
    if (["Special", "Engraving", "Weatherend"].includes(productType) && !customer) {
      setToastMsg("You must choose or enter a customer in the for field.");
      setToastOpen(true);
      return false;
    }
    return true;
  }

  const resetForm = () => {
    setProductType("");
    setSelectedProd(null);
    setProductCode("");
    setProdCodeEnabled(true);
    setTeam("");
    setProductDesc("");
    setProdDescEnabled(true);
    setAmountRequested("");
    setRequestedEnabled(true);
    setPrice("");
    setWoodType("");
    setWoodEnabled(true);
    setCustomer("");
    setCustomerDesc("");
    setContractorNote("");
    setClerkNotes("");
    setPaidNHDays(false);
  };

  const submitTables = async () => {
    console.log(productDesc);
    const payload = {
      productType,
      workersByName,
      team,
      productCode,
      amountRequested,
      customer,
      productDesc,
      customers,
      customer,
      customerDesc,
      contractorNote,
      paidNHDays
    }
    try {
      const res = await fetch("/api/newproduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const resData = await res.json();
      // pull out the newly created record and its PO number
      const newPo = resData.po_number;
      // send newRow back so parent can close modal & select that row
      if (modalCallback) modalCallback(newPo);
      return newPo;
    } catch (error) {
      console.error("Submit failed", error);
    }
  };

  const handleSubmit = async () => {
    // TODO - after successful submission, clear all fields.
    if (!validateForm()) return;
    const newPo = await submitTables();
    const woodEntries = getTemplateWoodEntries(templates[productCode], productCode);
    if (!newPo) return;
    if (woodEntries.length > 0) {
      generatedPoRef.current = newPo;
      setPrintSlipOpen(true);
    }
    if (!newPo) return;
    if (woodEntries.length > 0) {
      generatedPoRef.current = newPo;
      woodEntriesRef.current = woodEntries;
      setPrintSlipOpen(true);
    }
  }

  const handlePrintSlipYes = async () => {
    await downloadPdfFromEndpoint(
      `/api/pdf/woodslip?ponumber=${generatedPoRef.current}&productcode=${productCode}`
    );
    setPrintSlipOpen(false);
    resetForm();
  };

  const handlePrintSlipNo = () => {
    setPrintSlipOpen(false);
    resetForm();
  };

  return (
    <div className="relative p-2 grid grid-cols-2 gap-2">
      {modalCallback && (
        <IconButton
          size="small"
          onClick={modalCallback}
          style={{ position: "absolute", top: 4, right: -24 }}
        >
          <CloseIcon />
        </IconButton>
      )}
      {/* Product Type */}
      <TextField
        select
        size="small"
        label="Product Type"
        value={productType}
        onChange={e => handleProductTypeChange(e)}
        SelectProps={{ native: true }}
        sx={sxPattern}
      >
        <option value="" hidden />
        <option value="Stock">Stock</option>
        <option value="Engraving">Engraving</option>
        <option value="Special">Special</option>
        <option value="NHIFM">NHIFM</option>
        <option value="Weatherend">Weatherend</option>
        <option value="Wood Bags">Woodbag</option>
        <option value="Wood Pellets">Wood Pellets</option>
        <option value="Electronics">Electronics</option>
      </TextField>
      {/* Product Code */}
      {
        productType === "Stock" && codeOptions.length > 0 ? (
          <Autocomplete
            openOnFocus
            size="small"
            options={codeOptions}
            value={selectedProd}
            getOptionLabel={opt => opt.code}
            isOptionEqualToValue={(opt, val) => opt.code === val.code}
            onChange={(_, value) => handleProdCodeChange(value)}
            renderInput={params => (
              <TextField
                {...params}
                label="Product Code"
                variant="outlined"
                sx={sxPattern}
              />
            )}
          />
        ) : (
          <TextField
            size="small"
            variant="outlined"
            label="Product Code"
            // will always show your auto-gen code
            value={productCode}
            disabled={!prodCodeEnabled}
            InputProps={{ readOnly: true }}
            sx={sxPattern}
          />
        )
      }
      {/* Team */}
      <Autocomplete
        disabled={isTeamFixed}
        size="small"
        options={teamOptions}
        value={teamOptions.includes(team) ? team : ""}
        getOptionLabel={opt => opt ?? ""}
        onChange={(_, val) => handleTeamChange(val)}
        renderInput={params => (
          <TextField
            {...params}
            label="Team"
            variant="outlined"
            disabled={isTeamFixed}
            sx={sxPattern}
          />
        )}
      />
      {/* Product Desc */}
      {
        productType === "Stock" && descOptions.length > 0 ? (
          <Autocomplete
            openOnFocus
            size="small"
            disabled={!prodDescEnabled}
            options={descOptions}
            value={selectedProd}
            getOptionLabel={opt => opt.desc}
            isOptionEqualToValue={(opt, val) => opt.code === val?.code}
            onChange={(_, opt) => handleDescChange(opt)}
            renderOption={(props, opt) => (
              <li {...props} key={opt.code}>
                {opt.label}
              </li>
            )}
            renderInput={params => (
              <TextField {...params}
                label="Product Desc"
                variant="outlined"
                sx={sxPattern}
              />
            )}
          />
        ) : (
          <TextField
            size="small"
            variant="outlined"
            label="Product Desc"
            value={productDesc || ""}
            disabled={!prodDescEnabled}
            onChange={e => setProductDesc(e.target.value)}
            sx={sxPattern}
          />
        )
      }
      {/* Amount Requested */}
      <div className="col-span-2 grid grid-cols-5 gap-4">
        <TextField
          className="col-span-1"
          size="small"
          label="Quantity"
          disabled={!requestedEnabled}
          value={amountRequested}
          onChange={e => setAmountRequested(e.target.value)}
          sx={sxPattern}
        />
        {/* Price */}
        <TextField
          className="col-span-1"
          size="small"
          label="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
          sx={sxPattern}
        />
        {/* Wood Type */}
        <Autocomplete
          className="col-span-1"
          disableClearable
          openOnFocus
          disabled={!woodEnabled}
          size="small"
          options={woodTypeOptions}
          value={woodType}
          onChange={(_, val) => setWoodType(val)}
          getOptionLabel={opt => opt}
          renderInput={params => (
            <TextField
              {...params}
              label="Wood"
              sx={sxPattern}
            />
          )}
        />
        {/* For */}
        {["Special", "Engraving"].includes(productType) ? (
          <Autocomplete
            className="col-span-2"
            freeSolo
            size="small"
            options={customerOptions}
            renderOption={(props, option, { index }) => (
              <li
                {...props}
                key={`${option}-${index}`}
                style={{ fontSize: '0.75rem' }}
              >
                {option}
              </li>
            )}
            value={customer}
            onChange={(_, val) => handleCustomerChange(val)}
            onInputChange={(_, val) => handleCustomerChange(val)}
            renderInput={params => (
              <TextField
                className="col-span-2"
                {...params}
                label="For"
                sx={sxPattern}
              />
            )}
          />
        ) : (
          <TextField
            className="col-span-2"
            size="small"
            label="For"
            value={customer}
            onChange={e => setCustomer(e.target.value)}
            sx={sxPattern}
          />
        )}
      </div>
      {/* Contractor Note */}
      <div className="col-span-2">
        <TextField
          size="small"
          fullWidth
          label="Contractor Note"
          onChange={e => setContractorNote(e.target.value)}
          value={contractorNote}
          sx={sxPattern}
        />
      </div>
      {/* Clerk Notes */}
      <div className="col-start-3 row-start-1 row-span-6 flex flex-col">
        <TextField
          size="small"
          multiline
          rows={5.3}
          label="Clerk Notes"
          value={clerkNotes}
          InputProps={{ readOnly: true }}
          sx={sxPattern}
        />
        {/* Paid NH Days */}
        <Tooltip
          title="Allows worker to be paid for doing this project on their NHIFM scheduled days"
          arrow
        >
          <FormControlLabel
            className="mt-2 ml-2"
            control={
              <Checkbox
                checked={paidNHDays}
                onChange={e => setPaidNHDays(e.target.checked)}
                size="small"
              />
            }
            label="Paid NH Days"
          />
        </Tooltip>
      </div>
      {/* Submit Button */}
      <div className="col-span-3 flex justify-center mt-[-16px]">
        <Button
          variant="contained"
          sx={{
            width: '250px',
            height: '35px'
          }}
          onClick={handleSubmit}
        >
          Create Project
        </Button>
      </div>
      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert sx={{ width: '400px' }} severity="error" onClose={() => setToastOpen(false)}>
          {toastMsg}
        </Alert>
      </Snackbar>
      <Dialog
        open={printSlipOpen}
        onClose={handlePrintSlipNo}
      >
        <DialogTitle>Print Wood Slip?</DialogTitle>
        <DialogActions>
          <Button onClick={handlePrintSlipNo}>No</Button>
          <Button onClick={handlePrintSlipYes}>Yes</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
