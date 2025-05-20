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

---

Let me know if you want this broken into a checklist or formatted for Notion/Confluence/etc!
