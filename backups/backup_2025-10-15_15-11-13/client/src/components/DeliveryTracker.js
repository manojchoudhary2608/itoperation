import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = "/api/deliveries";

const DeliveryTracker = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newDelivery, setNewDelivery] = useState({
        name: '',
        address: '',
        asset_type: '',
        mobile_number: '',
        courier_partner: '',
        tracking_number: '',
        courier_date: '',
        it_status: 'Configured',
        final_status: 'Shipment Sent',
        delivery_date: '',
        new_joiner: 'No',
    });
    const [editingDeliveryId, setEditingDeliveryId] = useState(null);
    const [formError, setFormError] = useState(null);
    const fileInputRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: '2-digit' };
        return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
    };

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const response = await axios.get(API_URL);
            setDeliveries(response.data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                    headers: { 'Content-Type': 'application/json' }
                });
                alert("Deliveries uploaded successfully!");
                fetchDeliveries(); // Refresh the list
            } catch (err) {
                const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                alert(`Error uploading deliveries: ${errorDetails}`);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = null; // Clear the input
                }
            }
        };
        reader.readAsText(file);
    };

    const handleExportCsv = () => {
        if (deliveries.length === 0) {
            alert("No deliveries to export.");
            return;
        }

        const headers = ["ID", "Name", "Address", "Asset Type", "Mobile Number", "Courier Partner", "Tracking Number", "Courier Date", "IT Status", "Final Status", "Delivery Date", "New Joiner"];
        const csvRows = [];
        csvRows.push(headers.join(',')); // Add headers

        for (const delivery of deliveries) {
            const values = [
                delivery.id,
                `"${delivery.name.replace(/"/g, '""')}"`,
                `"${delivery.address.replace(/"/g, '""')}"`,
                `"${delivery.asset_type.replace(/"/g, '""')}"`,
                `"${delivery.mobile_number.replace(/"/g, '""')}"`,
                `"${delivery.courier_partner.replace(/"/g, '""')}"`,
                `"${delivery.tracking_number.replace(/"/g, '""')}"`,
                formatDate(delivery.courier_date),
                `"${delivery.it_status.replace(/"/g, '""')}"`,
                `"${delivery.final_status.replace(/"/g, '""')}"`,
                formatDate(delivery.delivery_date),
                delivery.new_joiner
            ];
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'deliveries.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewDelivery({ ...newDelivery, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editingDeliveryId) {
                await axios.put(`${API_URL}/${editingDeliveryId}`, newDelivery);
            } else {
                await axios.post(API_URL, newDelivery);
            }
            setNewDelivery({
                name: '',
                address: '',
                asset_type: '',
                mobile_number: '',
                courier_partner: '',
                tracking_number: '',
                courier_date: '',
                it_status: 'Configured',
                final_status: 'Shipment Sent',
                delivery_date: '',
                new_joiner: 'No',
            });
            setEditingDeliveryId(null); // Exit edit mode
            fetchDeliveries(); // Refresh the list
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchDeliveries(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleEditClick = (delivery) => {
        setEditingDeliveryId(delivery.id);
        setNewDelivery({
            name: delivery.name || '',
            address: delivery.address || '',
            asset_type: delivery.asset_type || '',
            mobile_number: delivery.mobile_number || '',
            courier_partner: delivery.courier_partner || '',
            tracking_number: delivery.tracking_number || '',
            courier_date: delivery.courier_date ? delivery.courier_date.split('T')[0] : '',
            it_status: delivery.it_status || 'Configured',
            final_status: delivery.final_status || 'Shipment Sent',
            delivery_date: delivery.delivery_date ? delivery.delivery_date.split('T')[0] : '',
            new_joiner: delivery.new_joiner || 'No',
        });
    };

    if (loading) return <p>Loading deliveries...</p>;
    if (error) return <p>Error loading deliveries: {error}</p>;

    const sortedAndFilteredDeliveries = [...deliveries]
        .filter(delivery =>
            delivery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            delivery.tracking_number.toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Delivery Tracker</h2>
                <div className="d-flex justify-content-center flex-grow-1">
                    <div className="input-group w-50">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by Name or Tracking Number"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                <div>
                    <button className="btn btn-success me-2" onClick={() => fileInputRef.current.click()}>
                        Bulk Upload CSV
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button className="btn btn-secondary" onClick={handleExportCsv}>
                        Export CSV
                    </button>
                </div>
            </div>
            
            {sortedAndFilteredDeliveries.length === 0 ? (
                <p>No deliveries found. Add some using the form below!</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Asset Type</th>
                            <th>Mobile</th>
                            <th>Courier</th>
                            <th>Tracking No.</th>
                            <th>Courier Date</th>
                            <th>IT Status</th>
                            <th>Final Status</th>
                            <th>Delivery Date</th>
                            <th>New Joiner</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredDeliveries.map(delivery => (
                            <tr key={delivery.id}>
                                <td>{delivery.id}</td>
                                <td>{delivery.name}</td>
                                <td>{delivery.address}</td>
                                <td>{delivery.asset_type}</td>
                                <td>{delivery.mobile_number}</td>
                                <td>{delivery.courier_partner}</td>
                                <td>{delivery.tracking_number}</td>
                                <td>{delivery.courier_date}</td>
                                <td>{delivery.it_status}</td>
                                <td>{delivery.final_status}</td>
                                <td>{delivery.delivery_date}</td>
                                <td>{delivery.new_joiner}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(delivery)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(delivery.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <h3 className="mt-5">{editingDeliveryId ? "Edit Delivery" : "Add New Delivery"}</h3>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="name" className="form-label">Name</label>
                        <input type="text" className="form-control" id="name" name="name" value={newDelivery.name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-8 mb-3">
                        <label htmlFor="address" className="form-label">Address</label>
                        <input type="text" className="form-control" id="address" name="address" value={newDelivery.address} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="asset_type" className="form-label">Asset Type</label>
                        <select className="form-select" id="asset_type" name="asset_type" value={newDelivery.asset_type} onChange={handleInputChange} required>
                            <option value="">Select Type</option>
                            <option value="CPU">CPU</option>
                            <option value="Monitor">Monitor</option>
                            <option value="Keyboard">Keyboard</option>
                            <option value="Mouse">Mouse</option>
                            <option value="RAM">RAM</option>
                            <option value="Headset">Headset</option>
                            <option value="Yubikey">Yubikey</option>
                            <option value="Cables">Cables</option>
                        </select>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="mobile_number" className="form-label">Mobile Number</label>
                        <input type="text" className="form-control" id="mobile_number" name="mobile_number" value={newDelivery.mobile_number} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="courier_partner" className="form-label">Courier Partner</label>
                        <select className="form-select" id="courier_partner" name="courier_partner" value={newDelivery.courier_partner} onChange={handleInputChange} required>
                            <option value="">Select Partner</option>
                            <option value="DTDC">DTDC</option>
                            <option value="Blue Dart">Blue Dart</option>
                            <option value="Shakdakshri">Shakdakshri</option>
                        </select>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="tracking_number" className="form-label">Tracking Number</label>
                        <input type="text" className="form-control" id="tracking_number" name="tracking_number" value={newDelivery.tracking_number} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="courier_date" className="form-label">Courier Date</label>
                        <input type="date" className="form-control" id="courier_date" name="courier_date" value={newDelivery.courier_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="it_status" className="form-label">IT Status</label>
                        <select className="form-select" id="it_status" name="it_status" value={newDelivery.it_status} onChange={handleInputChange} required>
                            <option value="Configured">Configured</option>
                            <option value="Ready to Ship">Ready to Ship</option>
                        </select>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="final_status" className="form-label">Final Status</label>
                        <select className="form-select" id="final_status" name="final_status" value={newDelivery.final_status} onChange={handleInputChange} required>
                            <option value="Shipment Sent">Shipment Sent</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="delivery_date" className="form-label">Delivery Date</label>
                        <input type="date" className="form-control" id="delivery_date" name="delivery_date" value={newDelivery.delivery_date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="new_joiner" className="form-label">New Joiner</label>
                        <select className="form-select" id="new_joiner" name="new_joiner" value={newDelivery.new_joiner} onChange={handleInputChange} required>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">{editingDeliveryId ? "Update Delivery" : "Add Delivery"}</button>
                {editingDeliveryId && <button type="button" className="btn btn-secondary ms-2" onClick={() => setEditingDeliveryId(null)}>Cancel Edit</button>}
            </form>
        </div>
    );
};

export default DeliveryTracker;