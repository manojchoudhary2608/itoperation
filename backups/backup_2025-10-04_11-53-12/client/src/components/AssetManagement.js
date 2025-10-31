
import React, { useState, useEffect } from 'react';
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
    });
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [formError, setFormError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredAssets = assets.filter(asset => {
        return (
            asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.gaid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.email_id.toLowerCase().includes(searchTerm.toLowerCase())
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
        });
    };

    if (loading) return <p>Loading assets...</p>;
    if (error) return <p>Error loading assets: {error}</p>;

    return (
        <div className="container mt-4">
            <h2>Asset Management</h2>
            <p>This is where you will manage your IT assets.</p>
            
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search by GAID, Name, Email, Asset Tag, Serial Number..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {filteredAssets.length === 0 ? (
                <p>No assets found. Add some using the form below!</p>
            ) : (
                <table className="table table-striped">
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
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(asset)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(asset.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <h3 className="mt-5">{editingAssetId ? "Edit Asset" : "Add New Asset"}</h3>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="gaid" className="form-label">GAID (Employee ID)</label>
                        <input type="text" className="form-control" id="gaid" name="gaid" value={newAsset.gaid} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="email_id" className="form-label">Email ID</label>
                        <input type="email" className="form-control" id="email_id" name="email_id" value={newAsset.email_id} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="asset_tag" className="form-label">Asset Tag</label>
                        <input type="text" className="form-control" id="asset_tag" name="asset_tag" value={newAsset.asset_tag} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="serial_number" className="form-label">Serial Number</label>
                        <input type="text" className="form-control" id="serial_number" name="serial_number" value={newAsset.serial_number} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="asset_type" className="form-label">Asset Type</label>
                        <select className="form-select" id="asset_type" name="asset_type" value={newAsset.asset_type} onChange={handleInputChange} required>
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
                </div>

                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="make" className="form-label">Make</label>
                        <input type="text" className="form-control" id="make" name="make" value={newAsset.make} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="model" className="form-label">Model</label>
                        <input type="text" className="form-control" id="model" name="model" value={newAsset.model} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="assigned_to" className="form-label">Assigned To</label>
                        <input type="text" className="form-control" id="assigned_to" name="assigned_to" value={newAsset.assigned_to} onChange={handleInputChange} />
                    </div>

                </div>

                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select className="form-select" id="status" name="status" value={newAsset.status} onChange={handleInputChange} required>
                            <option value="In Stock">In Stock</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Repair">In Repair</option>
                            <option value="Lost">Lost</option>
                            <option value="Not working">Not working</option>
                            <option value="In Transit">In Transit</option>
                        </select>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="purchase_date" className="form-label">Purchase Date</label>
                        <input type="date" className="form-control" id="purchase_date" name="purchase_date" value={newAsset.purchase_date} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="warranty_expiration_date" className="form-label">Warranty Expiration Date</label>
                        <input type="date" className="form-control" id="warranty_expiration_date" name="warranty_expiration_date" value={newAsset.warranty_expiration_date} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="cpu" className="form-label">CPU (for Laptops/Desktops)</label>
                        <input type="text" className="form-control" id="cpu" name="cpu" value={newAsset.cpu} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="ram" className="form-label">RAM (for Laptops/Desktops)</label>
                        <input type="text" className="form-control" id="ram" name="ram" value={newAsset.ram} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="storage" className="form-label">Storage (for Laptops/Desktops)</label>
                        <input type="text" className="form-control" id="storage" name="storage" value={newAsset.storage} onChange={handleInputChange} />
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
