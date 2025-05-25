import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica' })

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    fontSize: 14,
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
    marginBottom: 50,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: 'auto',
  },
  fieldLabel: {
    width: '12%',
    fontWeight: 'bold',
    marginLeft: '2%'
  },
  fieldValue: {
    width: '30%',
  },
  notesLabel: {
    fontSize: 12,
    marginTop: 30,
    marginLeft: '8%'
  },
  notesBox: {
    display: 'table',
    width: '85%',
    height: '40%',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginHorizontal: 'auto',
    backgroundColor: '#E5E4E2'
  },
})

export const ShipTicket = ({
  ponumber,
  team,
  desc,
  amount
}) => (
  <Document>
    <Page size={[595.28, 420.945]} style={styles.page}>
      {/* Header */}
      <View>
        <Text style={styles.centeredTitle}>MSP Industries</Text>
        <Text style={styles.centeredSubtitle}>Shipping Ticket</Text>
      </View>

      {/* PO Field */}
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>PO #:</Text>
        <Text style={styles.fieldValue}>{ponumber}</Text>
        <Text style={styles.fieldLabel}>Amount:</Text>
        <Text style={styles.fieldValue}>{amount}</Text>
      </View>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>Product:</Text>
        <Text style={styles.fieldValue}>{desc}</Text>
        <Text style={styles.fieldLabel}>Team:</Text>
        <Text style={styles.fieldValue}>{team}</Text>

      </View>

      {/* Notes box */}
      <Text style={styles.notesLabel}>Notes:</Text>
      <View style={styles.notesBox} />
    </Page>
  </Document >
)
