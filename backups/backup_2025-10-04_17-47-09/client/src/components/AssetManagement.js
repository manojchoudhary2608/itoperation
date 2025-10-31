
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Container, Row, Col } from 'react-bootstrap';

const API_URL = "/api/assets";

const AssetManagement = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [newAsset, setNewAsset] = useState({
        asset_tag: '',
        serial_number: '',
        asset_type: '',
        make: '',
        model: '',
        assigned_to: '',
        gaid: '',
        email_id: '',
        status: 'In Stock',
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
    const [formError, setFormError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL);
            setAssets(response.data.data || []);
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
                    headers: { 'Content-Type': 'application/json' }
                });
                alert("Assets uploaded successfully!");
                fetchAssets();
            } catch (err) {
                const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                alert(`Error uploading assets: ${errorDetails}`);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                }
            }
        };
        reader.readAsText(file);
    };

    const handleShowModal = (asset = null) => {
        setFormError(null);
        if (asset) {
            setEditingAssetId(asset.id);
            setNewAsset({
                asset_tag: asset.asset_tag || '',
                serial_number: asset.serial_number || '',
                asset_type: asset.asset_type || '',
                make: asset.make || '',
                model: asset.model || '',
                assigned_to: asset.assigned_to || '',
                gaid: asset.gaid || '',
                email_id: asset.email_id || '',
                status: asset.status || 'In Stock',
                cpu: asset.cpu || '',
                ram: asset.ram || '',
                storage: asset.storage || '',
                purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
                warranty_expiration_date: asset.warranty_expiration_date ? asset.warranty_expiration_date.split('T')[0] : '',
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
        } else {
            setEditingAssetId(null);
            setNewAsset({
                asset_tag: '', serial_number: '', asset_type: '', make: '', model: '',
                assigned_to: '', gaid: '', email_id: '', status: 'In Stock', cpu: '', ram: '',
                storage: '', purchase_date: '', warranty_expiration_date: '', notes: '',
                monitor1_asset_tag: '', monitor1_serial_number: '', monitor2_asset_tag: '',
                monitor2_serial_number: '', headset_asset_tag: '', headset_serial_number: '',
                yubikey_number: '', webcam_number: '', reporting_manager: '', manager_email_id: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAssetId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editingAssetId) {
                await axios.put(`${API_URL}/${editingAssetId}`, newAsset);
            } else {
                await axios.post(API_URL, newAsset);
            }
            handleCloseModal();
            fetchAssets();
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this asset?')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchAssets();
            } catch (err) {
                setError(err.response?.data?.error || err.message);
            }
        }
    };

    const filteredAssets = Array.isArray(assets) ? assets.filter(asset =>
        Object.values(asset).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    ) : [];

    if (loading) return <p>Loading assets...</p>;
    if (error) return <p>Error loading assets: {error}</p>;

    return (
        <Container fluid className="mt-4">
            <h2>Asset Management</h2>
            <p>This is where you will manage your IT assets.</p>

            <Row className="mb-3">
                <Col md={5}>
                    <Form.Control
                        type="text"
                        placeholder="Search by any field..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </Col>
                <Col className="d-flex justify-content-end">
                    <Button variant="success" onClick={() => fileInputRef.current.click()} className="me-2">
                        Bulk Upload CSV
                    </Button>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        Add New Asset
                    </Button>
                </Col>
            </Row>

            <Table striped bordered hover responsive="sm" size="sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Asset Tag</th>
                        <th>Type</th>
                        <th>Make</th>
                        <th>Model</th>
                        <th>Assigned To</th>
                        <th>GAID</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAssets.length > 0 ? filteredAssets.map(asset => (
                        <tr key={asset.id}>
                            <td>{asset.id}</td>
                            <td>{asset.asset_tag}</td>
                            <td>{asset.asset_type}</td>
                            <td>{asset.make}</td>
                            <td>{asset.model}</td>
                            <td>{asset.assigned_to}</td>
                            <td>{asset.gaid}</td>
                            <td>{asset.status}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShowModal(asset)} className="me-2">Edit</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(asset.id)}>Delete</Button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="9" className="text-center">No assets found.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingAssetId ? "Edit Asset" : "Add New Asset"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {formError && <div className="alert alert-danger">{formError}</div>}
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Asset Tag</Form.Label><Form.Control type="text" name="asset_tag" value={newAsset.asset_tag} onChange={handleInputChange} required /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Serial Number</Form.Label><Form.Control type="text" name="serial_number" value={newAsset.serial_number} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Asset Type</Form.Label><Form.Select name="asset_type" value={newAsset.asset_type} onChange={handleInputChange} required><option value="">Select Type</option><option value="Laptop">Laptop</option><option value="Desktop">Desktop</option><option value="Monitor">Monitor</option><option value="Headset">Headset</option><option value="Webcam">Webcam</option><option value="Yubikey">Yubikey</option><option value="Printer">Printer</option><option value="Keyboard">Keyboard</option><option value="Mouse">Mouse</option></Form.Select></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Make</Form.Label><Form.Control type="text" name="make" value={newAsset.make} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Model</Form.Label><Form.Control type="text" name="model" value={newAsset.model} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select name="status" value={newAsset.status} onChange={handleInputChange} required><option value="In Stock">In Stock</option><option value="Assigned">Assigned</option><option value="In Repair">In Repair</option><option value="Lost">Lost</option><option value="Not working">Not working</option><option value="In Transit">In Transit</option></Form.Select></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Assigned To</Form.Label><Form.Control type="text" name="assigned_to" value={newAsset.assigned_to} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>GAID (Employee ID)</Form.Label><Form.Control type="text" name="gaid" value={newAsset.gaid} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Email ID</Form.Label><Form.Control type="email" name="email_id" value={newAsset.email_id} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Purchase Date</Form.Label><Form.Control type="date" name="purchase_date" value={newAsset.purchase_date} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Warranty Expiration</Form.Label><Form.Control type="date" name="warranty_expiration_date" value={newAsset.warranty_expiration_date} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Reporting Manager</Form.Label><Form.Control type="text" name="reporting_manager" value={newAsset.reporting_manager} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Manager Email ID</Form.Label><Form.Control type="email" name="manager_email_id" value={newAsset.manager_email_id} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>CPU</Form.Label><Form.Control type="text" name="cpu" value={newAsset.cpu} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>RAM</Form.Label><Form.Control type="text" name="ram" value={newAsset.ram} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Storage</Form.Label><Form.Control type="text" name="storage" value={newAsset.storage} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Monitor 1 Tag</Form.Label><Form.Control type="text" name="monitor1_asset_tag" value={newAsset.monitor1_asset_tag} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Monitor 1 SN</Form.Label><Form.Control type="text" name="monitor1_serial_number" value={newAsset.monitor1_serial_number} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Monitor 2 Tag</Form.Label><Form.Control type="text" name="monitor2_asset_tag" value={newAsset.monitor2_asset_tag} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Monitor 2 SN</Form.Label><Form.Control type="text" name="monitor2_serial_number" value={newAsset.monitor2_serial_number} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Headset Tag</Form.Label><Form.Control type="text" name="headset_asset_tag" value={newAsset.headset_asset_tag} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Headset SN</Form.Label><Form.Control type="text" name="headset_serial_number" value={newAsset.headset_serial_number} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>YubiKey Number</Form.Label><Form.Control type="text" name="yubikey_number" value={newAsset.yubikey_number} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Webcam Number</Form.Label><Form.Control type="text" name="webcam_number" value={newAsset.webcam_number} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control as="textarea" rows={3} name="notes" value={newAsset.notes} onChange={handleInputChange} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    <Button variant="primary" onClick={handleSubmit}>{editingAssetId ? "Update Asset" : "Save Asset"}</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AssetManagement;
