import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica' })

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  centeredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  centeredSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: 'auto',
  },
  fieldLabel: {
    width: '12%',
    fontWeight: 'bold',
    marginLeft: '7%'
  },
  fieldValue: {
    width: '25%',
  },
  table: {
    display: 'table',
    width: '85%',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginHorizontal: 'auto',
    marginTop: 30
  },
  tableRow: {
    flexDirection: 'row',
    height: 24,
  },
  headerCell: {
    paddingVertical: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    backgroundColor: '#eee',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerCell2Row: {
    paddingVertical: 2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    backgroundColor: '#eee',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    fontSize: 9
  },
  descCell: {
    paddingVertical: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    flex: 2,
    textAlign: 'right',
  },
  descHeaderCell: {
    paddingVertical: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    backgroundColor: '#eee',
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 2,
  },
  numCell: {
    paddingVertical: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    flex: 1,
    textAlign: 'center',
  },
  footNote: {
    fontSize: 9,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    marginHorizontal: 35,
    marginTop: 3
  }
})

export const Costout = ({
  poNumber,
  team,
  product,
  productName,
  amountCompleted,
  dateCompleted,
  customerPrice,
  origDeptUnitCost,
  prevDeptUnitCost,
  avgDeptUnitCost,
  origMatUnitCost,
  prevMatUnitCost,
  avgMatUnitCost
}) => (
  <Document>
    <Page size={[595.28, 420.945]} style={styles.page}>
      {/* Header */}
      <View>
        <Text style={styles.centeredTitle}>MSP Industries</Text>
        <Text style={styles.centeredSubtitle}>Inflation Adjusted Cost Out Report</Text>
      </View>

      {/* PO Field */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>PO #:</Text>
        <Text style={styles.fieldValue}>{poNumber}</Text>
        <Text style={styles.fieldLabel}>Price:</Text>
        <Text style={styles.fieldValue}>{customerPrice}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Product:</Text>
        <Text style={styles.fieldValue}>
          {productName}{product}
        </Text>
        <Text style={styles.fieldLabel}>Amount:</Text>
        <Text style={styles.fieldValue}>{amountCompleted}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Team:</Text>
        <Text style={styles.fieldValue}>{team}</Text>
        <Text style={styles.fieldLabel}>Completed:</Text>
        <Text style={styles.fieldValue}>
          {new Date(dateCompleted * 1000).toLocaleDateString()}
        </Text>
      </View>

      {/* Cost table */}
      <View style={styles.table}>
        {/* Efficiency Header */}
        <View style={styles.tableRow}>
          <Text style={styles.descHeaderCell}>Category</Text>
          <Text style={styles.headerCell}>Current Cost</Text>
          <Text style={styles.headerCell}>Previous Cost</Text>
          <Text style={styles.headerCell}>Average Cost</Text>
        </View>

        {/* Dynamic labor rows */}
        {Object.keys(origDeptUnitCost).map(dept => (
          <View style={styles.tableRow} key={dept}>
            <Text style={styles.descCell}>
              {dept} Labor Unit Cost&nbsp;&nbsp;
            </Text>
            <Text style={styles.numCell}>
              ${origDeptUnitCost[dept].toFixed(2)}
            </Text>
            <Text style={styles.numCell}>
              ${(prevDeptUnitCost[dept] || 0).toFixed(2)}
            </Text>
            <Text style={styles.numCell}>
              ${avgDeptUnitCost[dept].toFixed(2)}
            </Text>
          </View>
        ))}

        {/* Material row */}
        <View style={styles.tableRow}>
          <Text style={styles.descCell}>Material Unit Cost&nbsp;&nbsp;</Text>
          <Text style={styles.numCell}>${origMatUnitCost.toFixed(2)}</Text>
          <Text style={styles.numCell}>${prevMatUnitCost.toFixed(2)}</Text>
          <Text style={styles.numCell}>${avgMatUnitCost.toFixed(2)}</Text>
        </View>

        {/* Total Unit Cost row */}
        <View style={styles.tableRow}>
          <Text style={styles.descCell}>Total Unit Cost&nbsp;&nbsp;</Text>
          <Text style={styles.numCell}>
            ${(
              Object.values(origDeptUnitCost).reduce((sum, v) => sum + v, 0) +
              origMatUnitCost
            ).toFixed(2)}
          </Text>
          <Text style={styles.numCell}>
            ${(
              Object.values(prevDeptUnitCost).reduce((sum, v) => sum + v, 0) +
              prevMatUnitCost
            ).toFixed(2)}
          </Text>
          <Text style={styles.numCell}>
            ${(
              Object.values(avgDeptUnitCost).reduce((sum, v) => sum + v, 0) +
              avgMatUnitCost
            ).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footnote */}
      <Text style={styles.footNote}>
        All prices shown have been made cost-neutral, adjusting for inflation, wage changes over time, etc.
      </Text>
    </Page>
  </Document>
)
