import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica' })

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: 'Helvetica',
    fontSize: 14,
    flexDirection: 'column',
  },
  half: {
    flex: 1,
    borderBottom: '1 solid #000',
    paddingBottom: 8,
  },
  bottomHalf: {
    flex: 1,
    paddingTop: 8,
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
    flexDirection: 'row',
    alignItems: 'center'
  },
  topFieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: '80px',
    alignItems: 'center',
  },
  bottomFieldRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginLeft: '60px',
    alignItems: 'center',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: 12,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    marginLeft: '10px',
  },
  authLabel: {
    flex: 1.5,
    fontWeight: 'bold',
  },
  authDateLabel: {
    flex: 0.5,
    fontWeight: 'bold',
    textAlign: 'right',
    marginRight: 6,
  },
  authBlank: {
    flex: 1.7,
    height: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
  dateBlank: {
    flex: 1,
    height: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderStyle: 'solid',
  },
})

export const CompletionSlips = ({
  po_number,
  team,
  product_code,
  amount_requested,
  product,
  customer,
  start_date
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.half}>
          {/* Top Half: Job Completion Slip */}
          <Text style={styles.title}>MSP INDUSTRIES JOB COMPLETION SLIP</Text>
          <Text style={[styles.subtitle, { marginBottom: 40 }]}>{product}</Text>

          {/* Row 1 */}
          <View style={styles.topFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Team:</Text>
              <Text>{team}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>For:</Text>
              <Text>{customer}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.topFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Start Date:</Text>
              <Text>{start_date}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Product Code #:</Text>
              <Text>{product_code}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.topFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Amount Requested:</Text>
              <Text>{amount_requested}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>PO Number:</Text>
              <Text>{po_number}</Text>
            </View>
          </View>

          {/* Comments */}
          <Text style={[styles.title, { marginTop: 30, marginBottom: 10 }]}>COMMENTS</Text>
          <View style={{ border: '1 solid #000', minHeight: 100, marginBottom: 12 }} />

          {/* Signature */}
          <View style={[styles.topFieldRow, { marginLeft: 20 }]}>
            <View style={[styles.fieldGroup, { flex: 1.2 }]}>
              <Text style={styles.fieldLabel}>Quantity Shipped:</Text>
              <Text></Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 2 }]}>
              <Text style={styles.fieldLabel}>Checked By:</Text>
              <Text></Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Cut Date:</Text>
              <Text></Text>
            </View>
          </View>

          <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 6, marginTop: 12 }}>
            PLEASE REMEMBER TO GIVE TWO WEEKS NOTICE FOR NEW JOBS
          </Text>
        </View>

        <View style={styles.bottomHalf}>
          {/* Bottom Half: Finishing Slip */}
          <Text style={styles.title}>MSP INDUSTRIES FINISHING SLIP</Text>
          <Text style={[styles.subtitle, { marginBottom: 50 }]}>{product}</Text>
          {/* Row 1 */}
          <View style={styles.bottomFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Team:</Text>
              <Text>{team}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>For:</Text>
              <Text>{customer}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.bottomFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Start Date:</Text>
              <Text>{start_date}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Product Code #:</Text>
              <Text>{product_code}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.bottomFieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Amount Requested:</Text>
              <Text>{amount_requested}</Text>
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>PO Number:</Text>
              <Text>{po_number}</Text>
            </View>
          </View>

          {/* Auth */}
          <View style={[styles.authRow, { marginTop: 60 }]}>
            <Text style={styles.authLabel}>Stain/Paint Authorization</Text>
            <View style={styles.authBlank} />
            <Text style={styles.authDateLabel}>Date</Text>
            <View style={styles.dateBlank} />
          </View>
          <View style={styles.authRow}>
            <Text style={styles.authLabel}>Sealing Authorization</Text>
            <View style={styles.authBlank} />
            <Text style={styles.authDateLabel}>Date</Text>
            <View style={styles.dateBlank} />
          </View>
          <View style={styles.authRow}>
            <Text style={styles.authLabel}>Final Authorization</Text>
            <View style={styles.authBlank} />
            <Text style={styles.authDateLabel}>Date</Text>
            <View style={styles.dateBlank} />
          </View>
        </View>
      </Page >
    </Document >
  )
}
