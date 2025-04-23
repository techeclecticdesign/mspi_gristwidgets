import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({ family: "Helvetica" });

const styles = StyleSheet.create({
  page: { padding: 24, fontFamily: "Helvetica", fontSize: 12 },
  header: { marginBottom: 12, fontSize: 16, textAlign: "center" },
  table: { display: "table", width: "auto", marginTop: 12 },
  row: { flexDirection: "row" },
  cell: {
    flex: 1,
    border: "1px solid #444",
    padding: 4,
  },
  headerCell: {
    flex: 1,
    backgroundColor: "#eee",
    border: "1px solid #444",
    padding: 4,
    fontWeight: "bold",
  },
});

export const PayrollReport = ({
  startIso,
  endIso,
  rows,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>
        Payroll Report — {startIso.slice(0, 10)} to {endIso.slice(0, 10)}
      </Text>
      <View style={styles.table}>
        <View style={styles.row}>
          {["Date", "MDOC", "PO#", "Period", "Lab Hrs", "Rate", "Clock Hrs"].map((t) => (
            <Text key={t} style={styles.headerCell}>
              {t}
            </Text>
          ))}
        </View>
        {rows.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.cell}>
              {new Date(r.date_worked * 1000).toISOString().slice(0, 10)}
            </Text>
            <Text style={styles.cell}>{r.mdoc}</Text>
            <Text style={styles.cell}>{r.po_number}</Text>
            <Text style={styles.cell}>{r.period}</Text>
            <Text style={styles.cell}>{r.laborsheet_hours}</Text>
            <Text style={styles.cell}>{r.hourly_rate}</Text>
            <Text style={styles.cell}>{r.timeclock_hours}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
