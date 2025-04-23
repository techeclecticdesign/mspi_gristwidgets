import React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

const DayRow = ({
  day,
  dayIndex,
  cells,
  onHoursFocus,
  onHoursChange,
  onHoursBlur,
  onDoubleClick,
}) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: -1 }}>
      <p className="text-xs flex w-4 ml-1 mt-2.5 mr-1">{day}</p>
      {["AM", "PM"].map((timeOfDay) => (
        <TextField
          key={timeOfDay}
          size="small"
          variant="standard"
          placeholder={timeOfDay}
          value={
            cells[dayIndex]?.[timeOfDay]?.value === "0"
              ? ""
              : cells[dayIndex]?.[timeOfDay]?.value || ""
          }
          error={cells[dayIndex]?.[timeOfDay]?.error || false}
          onFocus={onHoursFocus(dayIndex, timeOfDay)}
          onChange={onHoursChange(dayIndex, timeOfDay)}
          onBlur={onHoursBlur(dayIndex, timeOfDay)}
          onDoubleClick={() => onDoubleClick(dayIndex, timeOfDay)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur();
          }}
          sx={{
            flex: 1,
            height: 28,
            maxWidth: 28,
            "& .MuiInputBase-input": {
              fontSize: 10,
              paddingLeft: 0.2,
              height: 8,
              marginTop: 1.4,
            },
          }}
        />
      ))}
    </Box>
  );
};

export default DayRow;
