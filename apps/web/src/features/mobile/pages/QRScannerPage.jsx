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