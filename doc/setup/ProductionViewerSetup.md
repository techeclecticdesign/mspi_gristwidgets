# 📘 Setting Up the Production Viewer in Grist

To configure the **Production Viewer** in Grist, you'll need to set up reference columns and choose the right widget options. This guide will walk you through the process step by step.

---

## ✅ Prerequisites

Before getting started, ensure the following:

- You’ve imported both the **Production** and **ProductionMaterials** data tables.
- Column names are aligned according to the [Importing Data Documentation](#).

---

## 🛠 Step-by-Step Setup

### 1. Configure the Reference Column

1. In the **ProductionMaterials** table, click the down arrow above the `po_number` field.
2. Choose **Column Options**.
3. Change the **Column Type** from `Text` to `Reference`.
4. Set the reference to point to the **Production** table.

---

### 2. Add a Custom Page for the Viewer

1. Click **Add New** on the left sidebar and select **Add Page**.
2. Under **Select Widget**, choose **Custom**.
3. Under **Select Data**, choose **Production**.
4. Click **Add Page**.
5. In the **Custom URL** field, enter:

   ```
   http://localhost:5173/productionviewer
   ```

6. Press **Enter** to confirm.

---

### 3. Set Access and Rename the Page

1. Click the `...` icon (top-right of the newly created table), then choose **Widget Options**.
2. Under **Access Level**, select **Full Document Access**.
3. Rename the new page to **Production Viewer**:
   - Click the `...` icon next to the page name on the sidebar.
   - Select **Rename**.

---

### 4. Add the ProductionMaterials Table as a Widget

1. With **Production Viewer** selected, click **Add New** → **Add Widget to Page**.
2. Set the following:
   - **Widget Type**: `Table` (leave default)
   - **Data Source**: `ProductionMaterial`
   - **Select By**: `PRODUCTION custom`
3. Click **Add to Page**.
4. Drag the widget below the **Production** table so they are side-by-side horizontally.

---

## 🔗 Create a Lookup Formula Column

To ensure SQL filters work correctly with your reference column, add a formula column that explicitly pulls out the referenced value.

1. Open the **ProductionMaterials** table.
2. Scroll to the right and click the `+` icon in the header row.
3. Choose **Add Formula Column**.
4. Enter the formula:

   ```python
   $po_number.po_number
   ```

5. Name the column: `po_number_lookup`.

---

## 🎉 You're Done!

The Production Viewer is now set up and ready to go. You can navigate between materials and production data seamlessly using the custom widget.
