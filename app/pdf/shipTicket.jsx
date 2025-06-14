import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica' })

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: 'Helvetica',
    fontSize: 13,
    flexDirection: 'column',
  },
  blankLine: {
    width: 100,
    height: 12,
    marginLeft: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 8
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center'
  },
  fieldGroup: {
    flex: 1,
    flexDirection: 'row'
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: 50,
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: 12,
  },
  amountField: {
    width: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
    paddingBottom: 2,
    textAlign: 'center'
  },
  amountRow: {
    flexDirection: 'row',
    marginLeft: 20,
    marginTop: 30,
    marginBottom: 20
  }
})

export const ShipTicket = ({
  po_number,
  team,
  product_code,
  amount_requested,
  amount_completed,
  product,
  customer,
  date_completed
}) => {
  return (
    <Document>
      <Page size={[595.28, 420.945]} style={styles.page}>
        <View style={styles.half}>

          {/* Title */}
          <Text style={styles.title}>Maine State Prison Industries Shipping Ticket</Text>
          <Text style={[styles.subtitle, { marginBottom: 40 }]}>{product}</Text>

          {/* Row 1 */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>PO Number:</Text>
              <Text>{po_number}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Closed Date:</Text>
              <Text>{date_completed}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Product Code #:</Text>
              <Text>{product_code}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Team:</Text>
              <Text>{team}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.amountRow}>
            <View style={[styles.fieldGroup, { flex: 1, fontSize: 15 }]}>
              <Text style={styles.fieldLabel}>Amount Requested:</Text>
              <Text style={styles.amountField}>{amount_requested}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1, fontSize: 15 }]}>
              <Text style={styles.fieldLabel}>Amount Completed:</Text>
              <Text style={styles.amountField}>{amount_completed}</Text>
            </View>
          </View>

          {/* Comments */}
          <Text style={[styles.title, { marginTop: 30, marginBottom: 10 }]}>COMMENTS</Text>
          <View style={{ border: '1 solid #000', minHeight: 100, marginBottom: 12 }} />
        </View>
      </Page >
    </Document >
  )
}
