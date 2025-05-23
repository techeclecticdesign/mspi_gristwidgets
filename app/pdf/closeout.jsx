import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency } from "@/app/lib/util";

Font.register({ family: 'Helvetica' });

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  section: {
    marginVertical: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center'
  },
  table: {
    display: 'table',
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    height: 20
  },
  tableHeader: {
    backgroundColor: '#eee',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableCellDefault: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    width: '15%',
    flexGrow: 0,
  },
  tableCellDescription: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    width: '40%',
    flexGrow: 0,
  },
  tableFootDescription: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    width: '40%',
    flexGrow: 0,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  footerText: {
    fontWeight: 'bold'
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  footerCol: {
    width: '30%',
    alignItems: 'flex-start',
    margin: 'auto'
  },
  underline: {
    borderBottomWidth: 1,
    borderColor: '#000',
    width: '100%',
    marginVertical: 2,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    width: '90%'
  },
  line: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
    marginLeft: 4,
    height: 11
  },
});

export const Closeout = ({
  po_number,
  forField,
  product_code,
  amount_completed,
  start_date,
  customer_price,
  date_completed,
  product,
  closeoutMaterials,
  labor_breakdown,
  total_material_cost,
  total_labor_cost,
  production_cost,
  overhead,
  total_cost
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header fields */}
      <View style={styles.row}>
        <Text>PO Number: {po_number}</Text>
        <Text>For: {forField}</Text>
      </View>
      <View style={styles.row}>
        <Text>Product Code: {product_code}</Text>
        <Text>Quantity: {amount_completed}</Text>
      </View>
      <View style={styles.row}>
        <Text>Start Date: {start_date}</Text>
        <Text>Sale Price: {customer_price}</Text>
      </View>
      <View style={styles.row}>
        <Text>Closed Date: {date_completed}</Text>
        <Text>Production Cost: {production_cost}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>{product}</Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCellDefault}>Code</Text>
          <Text style={styles.tableCellDescription}>Expense Description</Text>
          <Text style={styles.tableCellDefault}>Amount</Text>
          <Text style={styles.tableCellDefault}>Unit Cost</Text>
          <Text style={styles.tableCellDefault}>Total</Text>
        </View>
        {/* Rows */}
        {labor_breakdown.map(([desc, hrs, rate], i) => (
          <View key={`lab-${i}`} style={styles.tableRow}>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDescription}>{desc}</Text>
            <Text style={styles.tableCellDefault}>{hrs.toFixed(3)}</Text>
            <Text style={styles.tableCellDefault}>{formatCurrency(rate)}</Text>
            <Text style={styles.tableCellDefault}>{formatCurrency(hrs * rate)}</Text>
          </View>
        ))}

        {/* Two blank rows between labor and materials */}
        {Array.from({ length: 2 }).map((_, i) => (
          <View key={`blank-between-${i}`} style={styles.tableRow}>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDescription}></Text>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDefault}></Text>
          </View>
        ))}

        {/* Material rows */}
        {closeoutMaterials.map((item, x) => (
          <View key={`mat-${x}`} style={styles.tableRow}>
            <Text style={styles.tableCellDefault}>{item.stock_number}</Text>
            <Text style={styles.tableCellDescription}>{item.material_description}</Text>
            <Text style={styles.tableCellDefault}>{item.amount}</Text>
            <Text style={styles.tableCellDefault}>{formatCurrency(item.unit_cost)}</Text>
            <Text style={styles.tableCellDefault}>{item.Total}</Text>
          </View>
        ))}

        {/* Bottom blank rows to pad to 29 total */}
        {Array.from({
          length: Math.max(
            0,
            29 - labor_breakdown.length - 2 - closeoutMaterials.length
          )
        }).map((_, i) => (
          <View key={`blank-bottom-${i}`} style={styles.tableRow}>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDescription}></Text>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDefault}></Text>
            <Text style={styles.tableCellDefault}></Text>
          </View>
        ))}
        <View style={styles.tableRow}>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableFootDescription}>Total Materials Cost</Text>
          <Text style={styles.tableCellDefault}>{total_material_cost}</Text>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableCellDefault}></Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableFootDescription}>Total Labor Cost</Text>
          <Text style={styles.tableCellDefault}>{total_labor_cost}</Text>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableCellDefault}></Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableFootDescription}>Overhead (20%)</Text>
          <Text style={styles.tableCellDefault}>{overhead}</Text>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableCellDefault}></Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableFootDescription}>Total Cost</Text>
          <Text style={styles.tableCellDefault}>{total_cost}</Text>
          <Text style={styles.tableCellDefault}></Text>
          <Text style={styles.tableCellDefault}></Text>
        </View>
      </View>
    </Page>
  </Document>
);

