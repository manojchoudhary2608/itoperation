import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Container } from 'react-bootstrap';

const API_URL = "/api/new_hires";

const NewHire = () => {
    const [newHires, setNewHires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        mobile_number: '',
        date_of_joining: '',
        status: 'Open'
    });

    useEffect(() => {
        fetchNewHires();
    }, []);

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

    return (
        <Container fluid className="mt-4">
            <h2>New Hire Management</h2>
            <Button variant="primary" onClick={() => handleShowModal()} className="mb-3">
                Add New Hire
            </Button>

            <Table striped bordered hover responsive="sm" size="sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Mobile Number</th>
                        <th>Date of Joining</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {newHires.map(hire => (
                        <tr key={hire.id}>
                            <td>{hire.id}</td>
                            <td>{hire.name}</td>
                            <td>{hire.address}</td>
                            <td>{hire.mobile_number}</td>
                            <td>{hire.date_of_joining}</td>
                            <td>{hire.status}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShowModal(hire)} className="me-2">Edit</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(hire.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

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
