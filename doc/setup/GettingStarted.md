# Getting Started

---

## Setting up the Environment Variables

Environment variables for projects are stored in `.env` files.  
There are two environment files:

- /.env on the **main server**
- /src-tauri/.env on the **timeclock server**

Each file needs to be updated so that the environment variables match the **details of the production Grist server**.  
Initially, the `.env` files will contain values for the **development Grist server**, and you’ll need to modify them for production.

### For each `.env` file, collect the following:

- **IP address**
- **Grist API key**  
  > When logged into Grist:  
  > - Click your profile icon (top right)  
  > - Choose **Profile Settings**  
  > - Scroll down and copy the **API key**

- **Document ID**  
  > When in Grist:  
  > - Go to **Workspaces** and open your document  
  > - Click your profile icon (top right)  
  > - Choose **Document Settings**  
  > - Scroll down and copy the **Document ID**

✅ Make sure to place these three values in **each** of your `.env` files.

### Grist Widgets .env Specific Vars:

**Table #'s**
Once you have your tables imported, there are certain ones that need to have the correct table #
updated in the .env file.  Do the following for each item in the .env file that needs a table id:
> - Open the table in grist.
> - Inside the URL, the very last part of the url, after the last / slash, is a number.  Copy it.
> - replace the table id number in the .env for the given table with the number you copied.

---

## Migrating Data

Using the `TableLayout.md` document (found in `/docs`), follow these steps:

### 1. Export Tables from Access

- Export relevant **tables and queries** from Microsoft Access as `.xlsx` files.

### 2. Prepare the Tables

- Rename, delete, or add columns as needed to **match the layout** in `TableLayout.md`
- Double-check that:
  - Fields **align correctly**
  - Data is **not outdated**
  - You’re removing **unused/irrelevant fields**

> ⚠️ Note: The source data is **messy and noisy**, so be thorough.

### 3. Import into Grist

- In your Grist document, click **"Add New"**
- From the dropdown, select **"Import from file"**
- Choose the appropriate `.xlsx` file
- On the modal, click **"Import"**
- Rename the table to match the name in the `TableLayout.md` document

### 4. Add additional fields as needed

- There will be some fields, such as nhifm_id in the workers table, which will not be a part of the
original data that you imported.  You will need to create a new column, based on its name in the 
`TableLayout.md` document, and fill in the expected values.

## Creating Custom Widgets

A custom widget needs to be defined for each of the main pages that are a part of the MSPI Custom
Grist Widgets server.

### Custom Widget List

Before beginning you need to know the names, URL's, underlying tables, and order of the Custom
Widgets.  In the list below each name is paired with its URL.  The order of the widgets you create
must be the same as in this list.

| Name              | URL                                        | Table      |
|-------------------|---------------------------------------------|------------|
| Navigation        | http://localhost:5173/navigation/products   | Any        |
| Production Viewer | http://localhost:5173/productionviewer      | Production |
| Payroll Input     | http://localhost:5173/payrollform           | Any        |
| New Production    | http://localhost:5173/newproduction         | Any        |


### Creating the Custom Widgets

-Inside your Grist document, click on the 'Add New' button, then in the dropdown click on
'Add Page'.
-In the expanded menu that appears click on 'Custom'.
-Referring to the table above, choose the table that corresponds to the widget you are adding.  If
it says 'Any' just pick any table. (It makes you pick one even if you're not going to use it).
-Under Custom URL paste the URL corresponding to the widget you are adding from the table above.
-Click on 'Add Widget' and you are done.
