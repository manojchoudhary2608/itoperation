import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Container, Row, Col, Dropdown, DropdownButton, InputGroup } from 'react-bootstrap';

const API_URL = "/api/assets";

const AssetManagement = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [showReplacePeripheralModal, setShowReplacePeripheralModal] = useState(false);
    const [peripheralToReplace, setPeripheralToReplace] = useState(null);
    const [peripheralSearchTerm, setPeripheralSearchTerm] = useState('');
    const [newPeripheralId, setNewPeripheralId] = useState('');
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
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeStep, setUpgradeStep] = useState(1);
    const [gaidForUpgrade, setGaidForUpgrade] = useState('');
    const [assetToUpgrade, setAssetToUpgrade] = useState(null);
    const [newPrimaryAssetId, setNewPrimaryAssetId] = useState('');
    const [oldAssetNewStatusForUpgrade, setOldAssetNewStatusForUpgrade] = useState('Not working');
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

    const handleShowReplacePeripheralModal = (peripheral) => {
        setPeripheralToReplace(peripheral);
        setShowReplacePeripheralModal(true);
    };

    const handleCloseReplacePeripheralModal = () => {
        setShowReplacePeripheralModal(false);
        setPeripheralToReplace(null);
        setPeripheralSearchTerm('');
        setNewPeripheralId('');
    };

    const handleCloseUpgradeModal = () => {
        setShowUpgradeModal(false);
        setUpgradeStep(1);
        setGaidForUpgrade('');
        setAssetToUpgrade(null);
        setNewPrimaryAssetId('');
        setOldAssetNewStatusForUpgrade('Not working');
    };

    const handleUpgradeStep1 = () => {
        if (!gaidForUpgrade) return alert('Please enter a GAID.');
        const asset = assets.find(a => a.gaid === gaidForUpgrade && (a.asset_type === 'Laptop' || a.asset_type === 'Desktop'));
        if (!asset) {
            return alert(`No primary asset (Laptop/Desktop) found for GAID: ${gaidForUpgrade}`);
        }
        setAssetToUpgrade(asset);
        setUpgradeStep(2);
    };

    const handleUpgradeSubmit = async () => {
        if (!newPrimaryAssetId) return alert('Please select a new primary asset.');
        try {
            await axios.post(`${API_URL}/upgrade-primary`, {
                oldAssetId: assetToUpgrade.id,
                oldAssetNewStatus: oldAssetNewStatusForUpgrade,
                newAssetId: newPrimaryAssetId
            });
            alert('Primary asset replaced successfully!');
            handleCloseUpgradeModal();
            fetchAssets();
        } catch (err) {
            alert(`Replacement failed: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleConfirmPeripheralReplacement = async () => {
        if (!newPeripheralId) {
            alert("Please select a replacement peripheral.");
            return;
        }
        try {
            await axios.post(`${API_URL}/swap-peripheral`, {
                primaryAssetId: editingAssetId,
                field: peripheralToReplace.field,
                newPeripheralId: newPeripheralId
            });
            alert("Peripheral replaced successfully!");
            handleCloseReplacePeripheralModal();
            handleCloseModal(); // Close the main edit modal as well
            fetchAssets();
        } catch (err) {
            alert(`Peripheral replacement failed: ${err.response?.data?.error || err.message}`);
        }
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

    const handleExportCSV = () => {
        if (filteredAssets.length === 0) {
            alert("No data to export.");
            return;
        }

        const headers = Object.keys(filteredAssets[0]);
        const csvContent = [
            headers.join(','),
            ...filteredAssets.map(row => 
                headers.map(header => {
                    let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    // Escape commas and quotes
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                        cell = `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'assets.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const filteredAssets = useMemo(() => {
        if (!Array.isArray(assets)) return [];
        return assets.filter(asset => {
            const searchTermMatch = Object.values(asset).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            const typeMatch = typeFilter ? asset.asset_type === typeFilter : true;
            const statusMatch = statusFilter ? asset.status === statusFilter : true;
            return searchTermMatch && typeMatch && statusMatch;
        });
    }, [assets, searchTerm, typeFilter, statusFilter]);

    const assetTypes = useMemo(() => [...new Set(assets.map(a => a.asset_type))], [assets]);
    const assetStatuses = useMemo(() => [...new Set(assets.map(a => a.status))], [assets]);
    const inStockAssets = useMemo(() => assets.filter(a => a.status === 'In Stock'), [assets]);

    const clearFilters = () => {
        setSearchTerm('');
        setTypeFilter('');
        setStatusFilter('');
    };

    if (loading) return <p>Loading assets...</p>;
    if (error) return <p>Error loading assets: {error}</p>;

    return (
        <Container fluid className="mt-4" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <h2>Asset Management</h2>

            <Row className="mb-3 align-items-center">
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Search by any field..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </Col>
                <Col md={4} className="d-flex">
                    <DropdownButton size="sm" id="type-filter-dropdown" title={typeFilter || "Filter by Type"} onSelect={(e) => setTypeFilter(e)} className="me-2">
                        {assetTypes.map(type => <Dropdown.Item key={type} eventKey={type}>{type}</Dropdown.Item>)}
                    </DropdownButton>
                    <DropdownButton size="sm" id="status-filter-dropdown" title={statusFilter || "Filter by Status"} onSelect={(e) => setStatusFilter(e)} className="me-2">
                        {assetStatuses.map(status => <Dropdown.Item key={status} eventKey={status}>{status}</Dropdown.Item>)}
                    </DropdownButton>
                    <Button size="sm" variant="secondary" onClick={clearFilters}>Clear Filters</Button>
                </Col>
                <Col md={4} className="d-flex justify-content-end">
                    <Button size="sm" variant="secondary" onClick={handleExportCSV} className="me-2">
                        Export to CSV
                    </Button>
                    <Button size="sm" variant="success" onClick={() => fileInputRef.current.click()} className="me-2">
                        Bulk Upload CSV
                    </Button>
                    <Button size="sm" variant="info" onClick={() => setShowUpgradeModal(true)} className="me-2">
                        Upgrade/Replace Asset
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleShowModal()}>
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
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Monitor 1 Tag</Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control type="text" name="monitor1_asset_tag" value={newAsset.monitor1_asset_tag} onChange={handleInputChange} />
                                        <Button variant="outline-secondary" onClick={() => handleShowReplacePeripheralModal({ type: 'Monitor', field: 'monitor1' })}>Replace</Button>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Monitor 1 SN</Form.Label><Form.Control type="text" name="monitor1_serial_number" value={newAsset.monitor1_serial_number} onChange={handleInputChange} /></Form.Group></Col>
                        </Row>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Monitor 2 Tag</Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control type="text" name="monitor2_asset_tag" value={newAsset.monitor2_asset_tag} onChange={handleInputChange} />
                                        <Button variant="outline-secondary" onClick={() => handleShowReplacePeripheralModal({ type: 'Monitor', field: 'monitor2' })}>Replace</Button>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}><Form.Group className="mb-3"><Form.Label>Monitor 2 SN</Form.Label><Form.Control type="text" name="monitor2_serial_number" value={newAsset.monitor2_serial_number} onChange={handleInputChange} /></Form.Group></Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Headset Tag</Form.Label>
                                    <InputGroup size="sm">
                                        <Form.Control type="text" name="headset_asset_tag" value={newAsset.headset_asset_tag} onChange={handleInputChange} />
                                        <Button variant="outline-secondary" onClick={() => handleShowReplacePeripheralModal({ type: 'Headset', field: 'headset' })}>Replace</Button>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
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

            {peripheralToReplace && (
                <Modal show={showReplacePeripheralModal} onHide={handleCloseReplacePeripheralModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Replace {peripheralToReplace.type}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Select a new {peripheralToReplace.type} from stock.</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Search by Asset Tag..."
                                className="mb-2"
                                value={peripheralSearchTerm}
                                onChange={(e) => setPeripheralSearchTerm(e.target.value)}
                            />
                            <Form.Select value={newPeripheralId} onChange={(e) => setNewPeripheralId(e.target.value)}>
                                <option value="">Select replacement...</option>
                                {inStockAssets
                                    .filter(asset => 
                                        asset.asset_type === peripheralToReplace.type &&
                                        asset.asset_tag.toLowerCase().includes(peripheralSearchTerm.toLowerCase())
                                    )
                                    .map(asset => (
                                        <option key={asset.id} value={asset.id}>
                                            {asset.asset_tag} ({asset.make} {asset.model})
                                        </option>
                                    ))}
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseReplacePeripheralModal}>Cancel</Button>
                        <Button variant="primary" onClick={handleConfirmPeripheralReplacement}>Confirm Replacement</Button>
                    </Modal.Footer>
                </Modal>
            )}

            <Modal show={showUpgradeModal} onHide={handleCloseUpgradeModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Upgrade/Replace Primary Asset</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {upgradeStep === 1 && (
                        <Form.Group>
                            <Form.Label><strong>Step 1:</strong> Enter the GAID of the employee.</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter GAID..."
                                value={gaidForUpgrade}
                                onChange={(e) => setGaidForUpgrade(e.target.value)}
                            />
                        </Form.Group>
                    )}
                    {upgradeStep === 2 && assetToUpgrade && (
                        <>
                            <p>Replacing asset <strong>{assetToUpgrade.asset_tag}</strong> for employee <strong>{assetToUpgrade.assigned_to}</strong>.</p>
                            <Form.Group className="mb-3">
                                <Form.Label><strong>Step 2:</strong> Set the status for the OLD asset.</Form.Label>
                                <Form.Select value={oldAssetNewStatusForUpgrade} onChange={(e) => setOldAssetNewStatusForUpgrade(e.target.value)}>
                                    <option value="Not working">Not working</option>
                                    <option value="In Repair">In Repair</option>
                                    <option value="Lost">Lost</option>
                                    <option value="In Stock">In Stock</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label><strong>Step 3:</strong> Select the NEW asset from stock.</Form.Label>
                                {/* I will add a search box here in the next step */}
                                <Form.Select value={newPrimaryAssetId} onChange={(e) => setNewPrimaryAssetId(e.target.value)}>
                                    <option value="">Select replacement...</option>
                                    {inStockAssets
                                        .filter(asset => asset.asset_type === 'Laptop' || asset.asset_type === 'Desktop')
                                        .map(asset => (
                                            <option key={asset.id} value={asset.id}>
                                                {asset.asset_tag} ({asset.make} {asset.model})
                                            </option>
                                        ))}
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseUpgradeModal}>Cancel</Button>
                    {upgradeStep === 1 && (
                        <Button variant="primary" onClick={handleUpgradeStep1}>Find Asset</Button>
                    )}
                    {upgradeStep === 2 && (
                        <Button variant="primary" onClick={handleUpgradeSubmit}>Complete Replacement</Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AssetManagement;
