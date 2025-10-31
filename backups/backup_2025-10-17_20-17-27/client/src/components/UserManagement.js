import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Container, Row, Col } from 'react-bootstrap';

const API_URL = "/api/users";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'User',
        permissions: {
            assets: false,
            stock: false,
            it_expenses: false,
            deliveries: false,
            offboarding: false,
            new_hire: false,
            user_management: false
        }
    });

    const modules = [
        'assets',
        'stock',
        'it_expenses',
        'deliveries',
        'offboarding',
        'new_hire',
        'user_management'
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL);
            setUsers(response.data.data || []);
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

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [name]: checked
            }
        }));
    };

    const handleShowModal = (user = null) => {
        if (user) {
            setEditingId(user.id);
            const userPermissions = user.permissions || {};
            const initialPermissions = modules.reduce((acc, module) => {
                acc[module] = userPermissions[module] || false;
                return acc;
            }, {});
            setFormData({
                username: user.username || '',
                password: '', // Password should not be shown, only updated
                role: user.role || 'User',
                permissions: initialPermissions
            });
        } else {
            setEditingId(null);
            setFormData({
                username: '',
                password: '',
                role: 'User',
                permissions: {
                    assets: false,
                    stock: false,
                    it_expenses: false,
                    deliveries: false,
                    offboarding: false,
                    new_hire: false,
                    user_management: false
                }
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
        const dataToSubmit = { ...formData };
        if (!dataToSubmit.password) {
            delete dataToSubmit.password; // Don't send empty password
        }

        try {
            if (editingId) {
                await axios.put(`${API_URL}/${editingId}`, dataToSubmit);
            } else {
                await axios.post(API_URL, dataToSubmit);
            }
            handleCloseModal();
            fetchUsers();
        } catch (err) {
            console.error("Failed to save user", err);
            alert(err.response?.data?.error || 'Failed to save user.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchUsers();
            } catch (err) {
                console.error("Failed to delete user", err);
                alert(err.response?.data?.error || 'Failed to delete user.');
            }
        }
    };

    if (loading) return <p>Loading users...</p>;
    if (error) return <p>Error loading users: {error}</p>;

    return (
        <Container fluid className="mt-4">
            <h2>User Management</h2>
            <Button variant="primary" onClick={() => handleShowModal()} className="mb-3">
                Add New User
            </Button>

            <Table striped bordered hover responsive="sm" size="sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                            <td>
                                <Button variant="warning" size="sm" onClick={() => handleShowModal(user)} className="me-2">Edit</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)} disabled={user.id === 1}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Edit User' : 'Add New User'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Username</Form.Label>
                                    <Form.Control type="text" name="username" value={formData.username} onChange={handleInputChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingId ? "Leave blank to keep current password" : ""} required={!editingId} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select name="role" value={formData.role} onChange={handleInputChange}>
                                <option value="User">User</option>
                                <option value="Administrator">Administrator</option>
                            </Form.Select>
                        </Form.Group>
                        <hr />
                        <h5>Module Permissions</h5>
                        <Row>
                            {modules.map(module => (
                                <Col md={4} key={module}>
                                    <Form.Check
                                        type="switch"
                                        id={`permission-${module}`}
                                        label={module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        name={module}
                                        checked={formData.permissions[module] || false}
                                        onChange={handlePermissionChange}
                                    />
                                </Col>
                            ))}
                        </Row>
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

export default UserManagement;
