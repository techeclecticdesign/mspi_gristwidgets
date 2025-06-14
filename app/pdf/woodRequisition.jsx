import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({ family: 'Helvetica' })

const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  fieldLabel: {
    width: '20%',
    fontWeight: 'bold',
  },
  fieldValue: {
    width: '30%',
  },
  table: {
    fontSize: 9,
    display: 'table',
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginTop: 12,
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 20,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  headerCell: {
    flex: 1,
    padding: 4,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  wideHeaderCell: {
    flex: 3,
    padding: 4,
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  cell: {
    flex: 1,
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  wideCell: {
    flex: 3,
    padding: 4,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  signatureContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  signatureLine: {
    width: '50%',
    borderBottomWidth: 1,
    borderColor: '#000',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#000',
  }
})

export const WoodRequisition = ({
  po_number,
  team,
  product_code,
  amount_requested,
  product,
  start_date,
  templates,
}) => {
  const renderRow = (item, idx) => {
    // decide what to show in Length column
    const unit = item.material_unit.toUpperCase()
    const lengthText = (unit === 'BDFT' || unit === 'BD FT') ? 'CUT AT' : item.material_unit

    return (
      <View style={styles.tableRow} key={idx}>
        <Text style={styles.cell}>{lengthText}</Text>
        <Text style={styles.wideCell}>{item.material_description}</Text>
        <Text style={styles.cell}>{item.stock_number}</Text>
        <Text style={styles.cell}>{item.material_amount}</Text>
        <Text style={styles.cell}></Text>
        <Text style={styles.wideCell}></Text>
      </View>
    )
  }
  const paddedTemplates = [
    ...templates,
    ...Array(Math.max(0, 8 - templates.length)).fill({ material_unit: '', material_description: '', stock_number: '', material_amount: '' }),
  ]

  return (
    <Document>
      <Page size={[595.28, 420.945]} style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>MAINE STATE PRISON</Text>
        <Text style={styles.subtitle}>WOOD REQUISITION</Text>

        {/* Fields */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>PO #:</Text>
          <Text style={styles.fieldValue}>{po_number}</Text>
          <Text style={styles.fieldLabel}>Contractor:</Text>
          <Text style={styles.fieldValue}>{team}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Product Code:</Text>
          <Text style={styles.fieldValue}>{product_code}</Text>
          <Text style={styles.fieldLabel}># of Units:</Text>
          <Text style={styles.fieldValue}>{amount_requested}</Text>
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Product Description:</Text>
          <Text style={styles.fieldValue}>{product}</Text>
          <Text style={styles.fieldLabel}>Date:</Text>
          <Text style={styles.fieldValue}>
            {new Date(start_date).toLocaleDateString()}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <Text style={styles.headerCell}>Length</Text>
            <Text style={styles.wideHeaderCell}>Species</Text>
            <Text style={styles.headerCell}>Stock #</Text>
            <Text style={styles.headerCell}>Bdft</Text>
            <Text style={styles.headerCell}>Cut Order</Text>
            <Text style={styles.wideHeaderCell}>Cut Order Notes</Text>
          </View>
          {/* Data Rows */}
          {paddedTemplates.map((tpl, i) => renderRow(tpl, i))}
        </View>
        {/* Signature Line */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine}></View>
          <Text style={styles.signatureLabel}>Staff Signature</Text>
        </View>
      </Page>
    </Document>
  )
}
