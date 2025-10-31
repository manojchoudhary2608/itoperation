import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Container } from 'react-bootstrap';

axios.defaults.headers.common['Accept-Charset'] = 'utf-8';

const API_URL = "/api/new_hires";

const NewHire = () => {
    const [newHires, setNewHires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        mobile_number: '',
        date_of_joining: '',
        status: 'Open'
    });
    const fileInputRef = useRef(null);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: 'short', year: '2-digit' };
        return date.toLocaleDateString('en-GB', options).replace(/ /g, '-');
    };

    useEffect(() => {
        fetchNewHires();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const fetchNewHires = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL);
            setNewHires(response.data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
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
                alert("New hires uploaded successfully!");
                fetchNewHires(); // Refresh the list
            } catch (err) {
                const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                alert(`Error uploading new hires: ${errorDetails}`);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = null; // Clear the input
                }
            }
        };
        reader.readAsText(file);
    };

    const handleExportCsv = () => {
        if (newHires.length === 0) {
            alert("No new hires to export.");
            return;
        }

        const headers = ["ID", "Name", "Address", "Mobile Number", "Date of Joining", "Status"];
        const csvRows = [];
        csvRows.push(headers.join(',')); // Add headers

        for (const hire of newHires) {
            const values = [
                hire.id,
                `"${hire.name.replace(/"/g, '""')}"`,
                `"${hire.address.replace(/"/g, '""')}"`,
                `"${hire.mobile_number.replace(/"/g, '""')}"`,
                formatDate(hire.date_of_joining),
                hire.status
            ];
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'new_hires.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleShowModal = (hire = null) => {
        if (hire) {
            setEditingId(hire.id);
            setFormData({
                name: hire.name || '',
                address: hire.address || '',
                mobile_number: hire.mobile_number || '',
                date_of_joining: hire.date_of_joining ? hire.date_of_joining.split('T')[0] : '',
                status: hire.status || 'Open'
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                address: '',
                mobile_number: '',
                date_of_joining: '',
                status: 'Open'
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API_URL}/${editingId}`, formData);
            } else {
                await axios.post(API_URL, formData);
            }
            handleCloseModal();
            fetchNewHires();
        } catch (err) {
            console.error("Failed to save new hire", err);
            // In a real app, show an error to the user
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchNewHires();
            } catch (err) {
                console.error("Failed to delete new hire", err);
            }
        }
    };

    if (loading) return <p>Loading new hires...</p>;
    if (error) return <p>Error loading new hires: {error}</p>;

    const sortedAndFilteredNewHires = [...newHires]
        .filter(hire =>
            hire.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hire.mobile_number.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Primary sort: 'Open' status first
            if (a.status === 'Open' && b.status !== 'Open') {
                return -1;
            }
            if (a.status !== 'Open' && b.status === 'Open') {
                return 1;
            }

            // Secondary sort: by date_of_joining for 'Open' statuses
            if (a.status === 'Open' && b.status === 'Open') {
                const dateA = new Date(a.date_of_joining);
                const dateB = new Date(b.date_of_joining);
                return dateA - dateB;
            }

            return 0; // Maintain original order for other statuses or if dates are equal
        });

    return (
        <Container fluid className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>New Hire Management</h2>
                <div className="d-flex justify-content-center flex-grow-1">
                    <div className="input-group w-50">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by Name or Mobile Number"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                <div>
                    <Button variant="success" onClick={() => fileInputRef.current.click()} className="me-2">
                        Bulk Upload CSV
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <Button variant="primary" onClick={() => handleShowModal()} className="me-2">
                        Add New Hire
                    </Button>
                    <Button variant="secondary" onClick={handleExportCsv}>
                        Export CSV
                    </Button>
                </div>
            </div>

            <div style={{ height: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                <Table striped bordered hover responsive="sm" size="sm">
                    <thead>
                    <tr>
                        <th className="text-nowrap">ID</th>
                        <th>Name</th>
                        <th className="text-break">Address</th>
                        <th className="text-nowrap">Mobile Number</th>
                        <th className="text-nowrap">Date of Joining</th>
                        <th className="text-nowrap">Status</th>
                        <th className="text-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAndFilteredNewHires.map(hire => (
                        <tr key={hire.id}>
                            <td>{hire.id}</td>
                            <td>{hire.name}</td>
                            <td className="text-break">{hire.address}</td>
                            <td className="text-nowrap">{hire.mobile_number}</td>
                            <td className="text-nowrap">{formatDate(hire.date_of_joining)}</td>
                            <td className={hire.status === 'Open' ? 'bg-danger text-white' : hire.status === 'Close' ? 'bg-success text-white' : ''}>{hire.status}</td>
                            <td className="text-nowrap">
                                <Button variant="warning" size="sm" onClick={() => handleShowModal(hire)} className="me-2">Edit</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(hire.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            </div>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Edit New Hire' : 'Add New Hire'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Address</Form.Label>
                            <Form.Control as="textarea" rows={3} name="address" value={formData.address} onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mobile Number</Form.Label>
                            <Form.Control type="text" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Date of Joining</Form.Label>
                            <Form.Control type="date" name="date_of_joining" value={formData.date_of_joining} onChange={handleInputChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select name="status" value={formData.status} onChange={handleInputChange}>
                                <option value="Open">Open</option>
                                <option value="Close">Close</option>
                                <option value="Called Off">Called Off</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    <Button variant="primary" onClick={handleSubmit}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default NewHire;
