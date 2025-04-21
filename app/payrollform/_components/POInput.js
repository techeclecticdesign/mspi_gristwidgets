import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

function POInput({ value, error, onChange, onBlur, projectName }) {
  return (
    <Box sx={{ display: "flex", mt: -0.4, mb: 1.5 }}>
      <p className="text-xs flex mx-1 mt-1">PO #</p>
      <TextField
        size="small"
        variant="standard"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
        sx={{
          flex: 1,
          maxWidth: 70,
          mb: 0.35,
          pl: -1,
          "& .MuiInputBase-input": {
            fontSize: 11,
            color: error ? "red" : "inherit",
            height: 14,
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
        }}
      />
      <p className="text-[0.6em] ml-1 flex font-normal h-4 overflow-hidden">{projectName}</p>
    </Box>
  );
}

export default POInput;