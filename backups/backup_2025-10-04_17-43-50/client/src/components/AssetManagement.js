
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = "/api/assets";

const AssetManagement = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newAsset, setNewAsset] = useState({
        asset_tag: '',
        serial_number: '',
        asset_type: '',
        make: '',
        model: '',
        assigned_to: '',
        gaid: '',
        email_id: '',
        status: 'In Stock', // Default status
        cpu: '',
        ram: '',
        storage: '',
        purchase_date: '',
        warranty_expiration_date: '',
        notes: '',
        monitor1_asset_tag: '',
        monitor1_serial_number: '',
        monitor2_asset_tag: '',
        monitor2_serial_number: '',
        headset_asset_tag: '',
        headset_serial_number: '',
        yubikey_number: '',
        webcam_number: '',
        reporting_manager: '',
        manager_email_id: '',
    });
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [formError, setFormError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await axios.get(API_URL);
            setAssets(response.data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAsset({ ...newAsset, [name]: value });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            try {
                await axios.post(`${API_URL}/bulk-upload`, { csvData: text }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                alert("Assets uploaded successfully!");
                fetchAssets(); // Refresh the list
            } catch (err) {
                const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                alert(`Error uploading assets: ${errorDetails}`);
            } finally {
                fileInputRef.current.value = null; // Clear the input
            }
        };
        reader.readAsText(file);
    };

    const filteredAssets = assets.filter(asset => {
        return (
            asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.gaid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.email_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.monitor1_asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.monitor1_serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.monitor2_asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.monitor2_serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.headset_asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.headset_serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.yubikey_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.webcam_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.reporting_manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.manager_email_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editingAssetId) {
                await axios.put(`${API_URL}/${editingAssetId}`, newAsset);
            } else {
                await axios.post(API_URL, newAsset);
            }
            setNewAsset({
                asset_tag: '',
                serial_number: '',
                asset_type: '',
                make: '',
                model: '',
                assigned_to: '',
                gaid: '',
                status: 'In Stock',
                cpu: '',
                ram: '',
                storage: '',
                purchase_date: '',
                warranty_expiration_date: '',
                notes: '',
            });
            setEditingAssetId(null); // Exit edit mode
            fetchAssets(); // Refresh the list
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchAssets(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleEditClick = (asset) => {
        setEditingAssetId(asset.id);
        setNewAsset({
            asset_tag: asset.asset_tag || '',
            serial_number: asset.serial_number || '',
            asset_type: asset.asset_type || '',
            make: asset.make || '',
            model: asset.model || '',
            assigned_to: asset.assigned_to || '',
            gaid: asset.gaid || '',
            status: asset.status || 'In Stock',
            cpu: asset.cpu || '',
            ram: asset.ram || '',
            storage: asset.storage || '',
            purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '', // Format date for input type="date"
            warranty_expiration_date: asset.warranty_expiration_date ? asset.warranty_expiration_date.split('T')[0] : '', // Format date for input type="date"
            notes: asset.notes || '',
            monitor1_asset_tag: asset.monitor1_asset_tag || '',
            monitor1_serial_number: asset.monitor1_serial_number || '',
            monitor2_asset_tag: asset.monitor2_asset_tag || '',
            monitor2_serial_number: asset.monitor2_serial_number || '',
            headset_asset_tag: asset.headset_asset_tag || '',
            headset_serial_number: asset.headset_serial_number || '',
            yubikey_number: asset.yubikey_number || '',
            webcam_number: asset.webcam_number || '',
            reporting_manager: asset.reporting_manager || '',
            manager_email_id: asset.manager_email_id || '',
        });
    };

    if (loading) return <p>Loading assets...</p>;
    if (error) return <p>Error loading assets: {error}</p>;

    return (
        <div className="container mt-4">
            <h2>Asset Management</h2>
            <p>This is where you will manage your IT assets.</p>
            
            <div className="d-flex justify-content-between align-items-center mb-3">
                <input
                    type="text"
                    className="form-control w-50"
                    placeholder="Search by GAID, Name, Email, Asset Tag, Serial Number..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
                <button className="btn btn-success" onClick={() => fileInputRef.current.click()}>
                    Bulk Upload CSV
                </button>
            </div>

            {filteredAssets.length === 0 ? (
                <p>No assets found. Add some using the form below!</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped table-hover table-sm">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Asset Tag</th>
                                <th>Type</th>
                                <th>Make</th>
                                <th>Model</th>
                                <th>Assigned To</th>
                                <th>GAID</th>
                                <th>Email ID</th>
                                <th>Status</th>
                                <th>Monitor 1 Tag</th>
                                <th>Monitor 1 SN</th>
                                <th>Monitor 2 Tag</th>
                                <th>Monitor 2 SN</th>
                                <th>Headset Tag</th>
                                <th>Headset SN</th>
                                <th>YubiKey No.</th>
                                                            <th>Webcam No.</th>
                                                            <th>Reporting Manager</th>
                                                            <th>Manager Email ID</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredAssets.map(asset => (
                                                            <tr key={asset.id}>
                                                                <td>{asset.id}</td>
                                                                <td>{asset.asset_tag}</td>
                                                                <td>{asset.asset_type}</td>
                                                                <td>{asset.make}</td>
                                                                <td>{asset.model}</td>
                                                                <td>{asset.assigned_to}</td>
                                                                <td>{asset.gaid}</td>
                                                                <td>{asset.email_id}</td>
                                                                <td>{asset.status}</td>
                                                                <td>{asset.monitor1_asset_tag}</td>
                                                                <td>{asset.monitor1_serial_number}</td>
                                                                <td>{asset.monitor2_asset_tag}</td>
                                                                <td>{asset.monitor2_serial_number}</td>
                                                                <td>{asset.headset_asset_tag}</td>
                                                                <td>{asset.headset_serial_number}</td>
                                                                <td>{asset.yubikey_number}</td>
                                                                <td>{asset.webcam_number}</td>
                                                                <td>{asset.reporting_manager}</td>
                                                                <td>{asset.manager_email_id}</td>
                                                                <td>
                                                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(asset)}>Edit</button>
                                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(asset.id)}>Delete</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>                </div>
            )}

            <h3 className="mt-5">{editingAssetId ? "Edit Asset" : "Add New Asset"}</h3>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="gaid" className="form-label">GAID (Employee ID)</label>
                        <input type="text" className="form-control" id="gaid" name="gaid" value={newAsset.gaid} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="email_id" className="form-label">Email ID</label>
                        <input type="email" className="form-control" id="email_id" name="email_id" value={newAsset.email_id} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="asset_tag" className="form-label">Asset Tag</label>
                        <input type="text" className="form-control" id="asset_tag" name="asset_tag" value={newAsset.asset_tag} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="serial_number" className="form-label">Serial Number</label>
                        <input type="text" className="form-control" id="serial_number" name="serial_number" value={newAsset.serial_number} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="asset_type" className="form-label">Asset Type</label>
                        <select className="form-select w-100" id="asset_type" name="asset_type" value={newAsset.asset_type} onChange={handleInputChange} required>
                            <option value="">Select Type</option>
                            <option value="Laptop">Laptop</option>
                            <option value="Desktop">Desktop</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Headset">Headset</option>
                            <option value="Webcam">Webcam</option>
                            <option value="Yubikey">Yubikey</option>
                            <option value="Printer">Printer</option>
                            <option value="Keyboard">Keyboard</option>
                            <option value="Mouse">Mouse</option>
                        </select>
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select className="form-select w-100" id="status" name="status" value={newAsset.status} onChange={handleInputChange} required>
                            <option value="In Stock">In Stock</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Repair">In Repair</option>
                            <option value="Lost">Lost</option>
                            <option value="Not working">Not working</option>
                            <option value="In Transit">In Transit</option>
                        </select>
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="make" className="form-label">Make</label>
                        <input type="text" className="form-control" id="make" name="make" value={newAsset.make} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="model" className="form-label">Model</label>
                        <input type="text" className="form-control" id="model" name="model" value={newAsset.model} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="assigned_to" className="form-label">Assigned To</label>
                        <input type="text" className="form-control" id="assigned_to" name="assigned_to" value={newAsset.assigned_to} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="purchase_date" className="form-label">Purchase Date</label>
                        <input type="date" className="form-control" id="purchase_date" name="purchase_date" value={newAsset.purchase_date} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="warranty_expiration_date" className="form-label">Warranty Expiration Date</label>
                        <input type="date" className="form-control" id="warranty_expiration_date" name="warranty_expiration_date" value={newAsset.warranty_expiration_date} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="cpu" className="form-label">CPU</label>
                        <input type="text" className="form-control" id="cpu" name="cpu" value={newAsset.cpu} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="ram" className="form-label">RAM</label>
                        <input type="text" className="form-control" id="ram" name="ram" value={newAsset.ram} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="storage" className="form-label">Storage</label>
                        <input type="text" className="form-control" id="storage" name="storage" value={newAsset.storage} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="monitor1_asset_tag" className="form-label">Monitor 1 Asset Tag</label>
                        <input type="text" className="form-control" id="monitor1_asset_tag" name="monitor1_asset_tag" value={newAsset.monitor1_asset_tag} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="monitor1_serial_number" className="form-label">Monitor 1 Serial Number</label>
                        <input type="text" className="form-control" id="monitor1_serial_number" name="monitor1_serial_number" value={newAsset.monitor1_serial_number} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="monitor2_asset_tag" className="form-label">Monitor 2 Asset Tag</label>
                        <input type="text" className="form-control" id="monitor2_asset_tag" name="monitor2_asset_tag" value={newAsset.monitor2_asset_tag} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="monitor2_serial_number" className="form-label">Monitor 2 Serial Number</label>
                        <input type="text" className="form-control" id="monitor2_serial_number" name="monitor2_serial_number" value={newAsset.monitor2_serial_number} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="headset_asset_tag" className="form-label">Headset Asset Tag</label>
                        <input type="text" className="form-control" id="headset_asset_tag" name="headset_asset_tag" value={newAsset.headset_asset_tag} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="headset_serial_number" className="form-label">Headset Serial Number</label>
                        <input type="text" className="form-control" id="headset_serial_number" name="headset_serial_number" value={newAsset.headset_serial_number} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="yubikey_number" className="form-label">YubiKey Number</label>
                        <input type="text" className="form-control" id="yubikey_number" name="yubikey_number" value={newAsset.yubikey_number} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="webcam_number" className="form-label">Webcam Number</label>
                        <input type="text" className="form-control" id="webcam_number" name="webcam_number" value={newAsset.webcam_number} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="reporting_manager" className="form-label">Reporting Manager</label>
                        <input type="text" className="form-control" id="reporting_manager" name="reporting_manager" value={newAsset.reporting_manager} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="manager_email_id" className="form-label">Manager Email ID</label>
                        <input type="email" className="form-control" id="manager_email_id" name="manager_email_id" value={newAsset.manager_email_id} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Notes</label>
                    <textarea className="form-control" id="notes" name="notes" rows="3" value={newAsset.notes} onChange={handleInputChange}></textarea>
                </div>

                <button type="submit" className="btn btn-primary">{editingAssetId ? "Update Asset" : "Add Asset"}</button>
                {editingAssetId && <button type="button" className="btn btn-secondary ms-2" onClick={() => setEditingAssetId(null)}>Cancel Edit</button>}
            </form>
        </div>
    );
};

export default AssetManagement;
