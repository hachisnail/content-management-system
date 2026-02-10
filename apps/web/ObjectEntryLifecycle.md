This detailed process is designed for a **small museum team** (likely 3-5 people handling multiple roles) operating in a limited space.

The workflow focuses on **Risk Management** (don't lose items, don't accept illegal items) and **Data Integrity** (ensure we legally own what we catalog).

---

### **Stage 1: Acquisition (The "Maybe" Phase)**

*The object is not yet museum property. It is in "Limbo."*

#### **Step 1.1: The Offer (Digital or Physical)**

* **Scenario A (Online):** Public user fills out the landing page form.
* **Scenario B (Walk-in/Purchase):** Curator manually enters data at the front desk.

**Data Fields to Capture:**

* **Source Type:** Donation / Purchase / Bequest (Will) / Exchange.
* **Donor/Seller Info:** Full Name, Email, Phone, Address (Identity verification).
* **Object Brief:** Title/Name (e.g., "19th Century Bicolano Abaca Loom").
* **Donor Story:** "My grandmother used this during the war..." (Crucial context).
* **Initial Photos:** Uploaded by donor or taken by staff at desk.

**The Check (Triage):**

* **Actor:** Collection Manager / Curator.
* **Action:** Review the offer *before* physical arrival (if online).
* **Checklist:**
* Does this fit our mission statement?
* Do we have space for it?
* Is it obviously hazardous (mold, termites, ammunition)?



#### **Step 1.2: Physical Intake (Temporary Custody)**

* **Trigger:** The object enters the physical museum space.
* **System Action:** Generate **Temporary Receipt (TR) Number** (e.g., `TR-2024-055`).

**Data Fields to Capture:**

* **Date Received:** Timestamp.
* **Received By:** Staff Member ID.
* **Temporary Location:** (Crucial for small spaces) e.g., "Intake Shelf A".
* **Intake Condition Check:** "Item appears stable" vs "Item has active insect infestation" (Isolation required).

**The Check (Risk Assessment):**

* **Actor:** Conservator / Handler.
* **Action:** *Immediate* pest check. If pests are found, mark status `QUARANTINE` in system.

#### **Step 1.3: The Committee Decision**

* **Actor:** Acquisition Committee (or Director).
* **Action:** Vote to Accession (Keep) or Decline.

**Data Fields:**

* **Decision Date:** Date of meeting.
* **Justification:** "High historical value" or "Duplicate of existing item."
* **Funding Source:** (If purchase) e.g., "Grant Fund 2024."

---

### **Stage 2: Accessioning (The Legal Transfer)**

*The object becomes a permanent asset. This is the most legally critical stage.*

#### **Step 2.1: Legal Title Transfer**

* **System Action:** Convert `Acquisition Record` to `Accession Draft`.
* **Output:** Generate **Deed of Gift** PDF.

**Required Fields for Deed:**

* **Legal Description:** Precise description of the item.
* **Credit Line:** How the donor wants to be thanked (e.g., "Gift of the Juan Dela Cruz Family").
* **Rights Transfer:** Copyright status (Did the donor own the copyright? Did they transfer it?).
* **Restrictions:** (Avoid if possible) e.g., "Must be displayed permanently."

**The Check (Verification):**

* **Actor:** Registrar / Admin.
* **Action:** Ensure Deed is **Signed and Countersigned**.
* **System Constraint:** Cannot finalize record until "Deed_Signed.pdf" is uploaded.

#### **Step 2.2: Provenance Research (The "Background Check")**

* **Goal:** Ensure the item wasn't stolen, looted, or illegally excavated.
* **User Question:** *What to check?*

**Provenance Checklist (Fields in System):**

1. **Chain of Ownership:** List all known previous owners (e.g., "Artist -> Gallery A -> Donor").
2. **Gaps in History:** specifically check 1933-1945 (WWII looting) or 1970s (Illicit trafficking conventions).
3. **Proof of Ownership:** Does the donor have a receipt, a will, or a photo of them with the object from 30 years ago?
4. **Cultural Property Check:**
* Is it an archaeological artifact? (Requires National Museum registration in PH).
* Does it contain endangered species materials? (Ivory, Tortoiseshell).


5. **Ethical Sourcing:** Was it acquired fairly?

#### **Step 2.3: Assigning the Accession Number**

* **System Action:** Generate Unique ID.
* **Format:** `[Year].[GroupID].[ItemID]` (e.g., `2024.12.01`).
* **Physical Action:** Staff applies the number to the object (using archival ink/tag).

---

### **Stage 3: Inventory (Management & Care)**

*The object is now "lived in" data.*

#### **Step 3.1: Cataloging (The Description)**

* **Actor:** Cataloger / Researcher.

**Data Fields:**

* **Classification:** (e.g., "Textile", "Ceramic", "Weaponry").
* **Dimensions:** Height, Width, Depth, Weight (Metric).
* **Materials:** (e.g., "Narra wood", "Brass", "Cotton").
* **Technique:** (e.g., "Hand-woven", "Carved").
* **Date of Creation:** Circa date (e.g., "c. 1890s").
* **Maker/Artist:** Name or Cultural Group (e.g., "Unknown Bicolano Artisan").

#### **Step 3.2: Condition Reporting**

* **Actor:** Conservator.

**Data Fields:**

* **Overall Condition:** Excellent / Good / Fair / Poor.
* **Specific Damages:** "Hairline crack on rim", "Fading on left side."
* **Treatment Needed:** Yes/No.
* **Handling Instructions:** "Gloves required," "Lift from base only."

#### **Step 3.3: Location Tracking (Home Location)**

* **Actor:** Collection Manager.
* **Fields:** `Building` > `Room` > `Unit` > `Shelf/Drawer`.
* **System Action:** When an object is moved for display, a "Movement Log" entry is created automatically in the Audit Trail.

---

### **Summary of Roles & Permissions**

| Role | Acquisition Phase | Accession Phase | Inventory Phase |
| --- | --- | --- | --- |
| **Guest (Donor)** | **Create** (Offer Form) | View Status (via Email) | N/A |
| **Front Desk** | **Create** (Walk-in), **Edit** (Physical Receipt) | View Only | View Only |
| **Curator** | **Approve/Reject**, Assess | **Edit** (Provenance), Verify Deed | **Edit** (Cataloging) |
| **Conservator** | **Edit** (Condition Check) | View Only | **Edit** (Condition/Handling) |
| **Admin** | Full Access | Finalize Record (Lock) | Audit Logs |

This addition transforms your system into a complete **Collection Management System (CMS)**.

Here is the **Process Draft** for Conservation and QR Location Tracking, followed by the **Code Implementation** for the "Mobile Client" and Conservation Module.

---

### **Phase 4: Conservation & Maintenance Process**

**Goal:** Prolong the life of the artifact and document interventions.
*Operational Standard:* Never alter an object without recording *what* was done and *why*.

#### **4.1 The Maintenance Lifecycle**

1. **Trigger Event:**
* **Routine Audit:** Staff notices mold during inventory check.
* **Incident:** Object dropped during exhibit install.
* **Preparation:** Object needs cleaning before display.


2. **Assessment (Triage):**
* **Action:** Conservator changes status to `Condition Check Needed`.
* **System:** Item is flagged in the **Conservation Dashboard**.


3. **Treatment Proposal:**
* Conservator proposes a method (e.g., "Clean with deionized water").
* **Approval:** Curator approves the treatment (Separation of duties).


4. **Intervention (The Work):**
* Object moved to **Conservation Lab** (Location Update).
* **Work Log:** Conservator logs chemicals used, time spent, and outcome.


5. **Completion:**
* Status returned to `Stable`.
* **Condition Report:** Updated with new notes (e.g., "Repaired crack on base").



---

### **Phase 5: QR Location Management (The "Mobile Client")**

**Goal:** "One-Scan" updates to prevent lost items.
*Operational Standard:* The database location must match physical location within 24 hours.

#### **5.1 The QR Workflow**

1. **Labeling:**
* **Generation:** System generates a unique QR code containing the `Artifact ID` (e.g., `ACC-2024.1`).
* **Printing:** Staff prints on **Archival Acid-Free Paper**.
* **Tagging:**
* *Small Items:* Tie-on tag (never stick directly).
* *Large Items:* Sewn label or B-72 Lacquer barrier.
* *Storage:* Label the **Box/Shelf**, not just the item.




2. **The "Move" (Mobile Client Interaction):**
* **Scenario:** Curator moves an item from *Storage* to *Reading Room*.
* **Action:**
1. Open Mobile Scanner on phone.
2. Scan Object QR.
3. Scan "Destination QR" (on the Reading Room door) OR select from dropdown.
4. Click **"Confirm Move"**.


* **System:** Updates location instantly + Creates Audit Log.



---

### **Code Implementation**

#### **1. The Conservation Module**

Create `web/src/features/conservation/pages/ConservationPage.jsx`.
*This dashboard tracks items that are damaged or under repair.*

```jsx
import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTable } from '../../../components/common/DataTable';
import { Stethoscope, AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react';

// Mock Data
const MOCK_JOBS = [
  { id: 'CON-24-001', artifact: 'Vintage Abaca Loom', artifactId: '2024.1.1', issue: 'Mold growth on frame', status: 'In Treatment', priority: 'High', assignedTo: 'Dr. Santos' },
  { id: 'CON-24-002', artifact: 'Ceremonial Sword', artifactId: '2023.5.12', issue: 'Rust on blade', status: 'Assessment', priority: 'Medium', assignedTo: 'Pending' },
];

export default function ConservationPage() {
  const [jobs, setJobs] = useState(MOCK_JOBS);

  const columns = [
    { key: 'artifact', label: 'Artifact', render: (row) => (
      <div>
        <div className="font-bold">{row.artifact}</div>
        <div className="text-xs opacity-50 font-mono">{row.artifactId}</div>
      </div>
    )},
    { key: 'issue', label: 'Condition Issue' },
    { key: 'status', label: 'Stage', render: (row) => (
      <span className={`badge ${
        row.status === 'In Treatment' ? 'badge-warning' : 
        row.status === 'Assessment' ? 'badge-info' : 'badge-success'
      }`}>{row.status}</span>
    )},
    { key: 'priority', label: 'Priority', render: (row) => (
      <div className={`flex items-center gap-1 font-bold text-xs ${row.priority === 'High' ? 'text-error' : 'text-warning'}`}>
        <AlertTriangle size={12} /> {row.priority}
      </div>
    )},
    { key: 'assignedTo', label: 'Conservator' }
  ];

  const actions = (row) => (
    <>
      <button className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2">
        <ClipboardList size={14}/> View Report
      </button>
      {row.status !== 'Completed' && (
        <button className="w-full text-left text-sm py-2 px-3 hover:bg-base-200 flex items-center gap-2 text-success">
          <CheckCircle size={14}/> Mark Complete
        </button>
      )}
    </>
  );

  return (
    <PageContainer title="Conservation Lab">
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats shadow-sm border border-base-200">
          <div className="stat">
            <div className="stat-figure text-error"><Stethoscope size={24} /></div>
            <div className="stat-title">Active Treatments</div>
            <div className="stat-value text-error">{jobs.filter(j => j.status !== 'Completed').length}</div>
            <div className="stat-desc">Items currently in lab</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <DataTable 
          title="Treatment Queue"
          columns={columns} 
          data={jobs}
          actions={actions}
        />
      </div>
    </PageContainer>
  );
}

```

#### **2. The "Special Client" (Mobile QR Scanner)**

Create `web/src/features/mobile/pages/QRScannerPage.jsx`.
*This page is designed to look like a Native App. It hides the sidebar/header and focuses on the camera.*

> **Note:** You will need a QR library. For now, I will scaffold the UI. In production, install `react-qr-reader` or `html5-qrcode`.

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, MapPin, Camera, Save } from 'lucide-react';
import { ConfirmationModal } from "@repo/ui";

// Mock Artifact Fetch
const fetchArtifactByQR = (qrCode) => {
  // In real app: API call to /inventory/lookup?qr={qrCode}
  return { 
    id: '2024.1.1', 
    name: 'Vintage Abaca Loom', 
    currentLocation: 'Storage A - Shelf 2', 
    image: null 
  };
};

export default function QRScannerPage() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [scannedItem, setScannedItem] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [modal, setModal] = useState({ isOpen: false });

  // Simulate a Scan Event
  const handleSimulateScan = () => {
    setScanning(false);
    setScannedItem(fetchArtifactByQR('MOCK_QR_CODE'));
  };

  const handleUpdateLocation = () => {
    // API Call to update location
    setModal({ isOpen: false });
    alert("Location Updated!");
    setScannedItem(null);
    setScanning(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Mobile Header */}
      <div className="p-4 flex items-center justify-between bg-zinc-900">
        <button onClick={() => navigate('/dashboard')} className="btn btn-circle btn-sm btn-ghost text-white">
          <ArrowLeft />
        </button>
        <h1 className="font-bold text-lg">Scanner Mode</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {scanning ? (
          /* Camera Viewport Simulation */
          <div className="w-full h-full relative bg-zinc-800 flex flex-col items-center justify-center">
            <Camera size={48} className="opacity-50 mb-4 animate-pulse" />
            <p className="text-sm opacity-70">Point camera at Artifact QR</p>
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 border-[30px] border-black/50 pointer-events-none">
              <div className="w-full h-full border-2 border-primary/50 relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
              </div>
            </div>

            {/* Dev Button to Simulate Scan */}
            <button onClick={handleSimulateScan} className="btn btn-primary absolute bottom-10 z-50">
              [DEV] Simulate Scan
            </button>
          </div>
        ) : (
          /* Result View */
          <div className="w-full h-full bg-base-100 text-base-content p-6 rounded-t-3xl mt-auto animate-in slide-in-from-bottom">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-base-200 rounded-lg flex items-center justify-center">
                 <Box size={32} className="opacity-50" />
              </div>
              <div>
                <div className="badge badge-primary badge-outline mb-1">{scannedItem.id}</div>
                <h2 className="text-xl font-bold">{scannedItem.name}</h2>
                <div className="text-sm opacity-60 flex items-center gap-1 mt-1">
                  <MapPin size={12} /> {scannedItem.currentLocation}
                </div>
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label"><span className="label-text font-bold">New Location</span></label>
              <select 
                className="select select-bordered w-full"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              >
                <option value="" disabled>Select destination...</option>
                <option value="Storage A">Storage A</option>
                <option value="Exhibit Hall B">Exhibit Hall B</option>
                <option value="Conservation Lab">Conservation Lab</option>
                <option value="Director Office">Director Office</option>
              </select>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                className="btn btn-outline flex-1"
                onClick={() => { setScannedItem(null); setScanning(true); }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary flex-1 gap-2"
                disabled={!newLocation}
                onClick={() => setModal({ isOpen: true })}
              >
                <Save size={18} /> Update
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {modal.isOpen && (
        <ConfirmationModal 
          isOpen={true}
          title="Confirm Move"
          message={`Move ${scannedItem?.name} to ${newLocation}?`}
          confirmText="Confirm Move"
          variant="primary"
          onClose={() => setModal({ isOpen: false })}
          onConfirm={handleUpdateLocation}
        />
      )}
    </div>
  );
}

```

#### **3. Register Routes**

Update `web/src/config/routeConfig.jsx`.

```jsx
import ConservationPage from '../features/conservation/pages/ConservationPage';
import QRScannerPage from '../features/mobile/pages/QRScannerPage';
import { Stethoscope, ScanLine } from 'lucide-react';

export const routeConfig = [
  // ... existing ...
  {
    type: 'section',
    label: 'Collection Care',
    children: [
      {
        path: '/conservation',
        permission: { action: 'readAny', resource: 'conservation' },
        element: (
          <PermissionGuard action="readAny" resource="conservation">
             <ConservationPage />
          </PermissionGuard>
        ),
        nav: { label: 'Conservation Lab', icon: Stethoscope },
      }
    ]
  },
  // Mobile Scanner (Hidden from sidebar usually, or added at bottom)
  {
    path: '/scanner',
    permission: { action: 'updateAny', resource: 'inventory' }, // Only staff can move items
    element: (
       <PermissionGuard action="updateAny" resource="inventory">
          <QRScannerPage />
       </PermissionGuard>
    ),
    nav: { label: 'Mobile Scanner', icon: ScanLine },
    // Optionally hide on Desktop using CSS or a 'hidden: true' flag if you want it accessibly only via direct link
  }
];

```

#### **4. Adding QR Generation to Inventory**

In your existing `InventoryPage.jsx`, add a "Print QR" action.

```jsx
// Inside InventoryPage.jsx column definitions or actions
const handlePrintQR = (item) => {
   // In a real app: Open a new window with just the QR code for printing
   const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.id}`;
   const win = window.open('', '_blank');
   win.document.write(`
     <html>
       <body style="display:flex; flex-col; align-items:center; justify-content:center; height:100vh;">
         <img src="${url}" />
         <h2 style="font-family:sans-serif; margin-top:10px;">${item.id}</h2>
         <p>${item.name}</p>
         <script>window.print();</script>
       </body>
     </html>
   `);
};

// Add button to row actions
<button onClick={() => handlePrintQR(row)} className="btn btn-xs btn-ghost gap-1">
  <QrCode size={14}/> Label
</button>

```

### **Summary of "Mobile Client" Logic**

1. **Access:** The `/scanner` route is a regular React page but styled without the sidebar (`PageContainer` is NOT used, custom layout is used).
2. **Security:** It is wrapped in `<PermissionGuard>`, so if a random visitor scans a QR code, they will be redirected to Login. If they log in but aren't staff, they get a 403.
3. **Workflow:** Staff walks around the museum with a phone, logs in once, and uses this dedicated view to rapidly audit or move items.