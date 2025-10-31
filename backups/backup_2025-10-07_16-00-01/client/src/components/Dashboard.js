
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const Dashboard = () => {
    const currentUser = getCurrentUser();

    return (
        <div>
            <header className="jumbotron" style={{ padding: '1rem' }}>
                <h4 className="mb-0">
                    Welcome, <strong>{currentUser?.username}</strong>!
                </h4>
                <p className="mb-0">Role: <strong>{currentUser?.role}</strong></p>
            </header>

            <Row xs={1} md={2} lg={4} className="g-3">
                {currentUser.permissions?.assets && <Col>
                    <Link to="/assets" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>💻</div>
                                <Card.Title className="mt-2">Asset Management</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Manage IT assets, including laptops, desktops, and peripherals.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                {currentUser.permissions?.stock && <Col>
                    <Link to="/stock" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>📦</div>
                                <Card.Title className="mt-2">Stock Finder</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Search and manage your inventory of available assets.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                {currentUser.permissions?.it_expenses && <Col>
                    <Link to="/it_expenses" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>💸</div>
                                <Card.Title className="mt-2">IT Expense</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Track and manage IT-related expenses and budgets.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                {currentUser.permissions?.deliveries && <Col>
                    <Link to="/deliveries" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>🚚</div>
                                <Card.Title className="mt-2">Delivery Tracker</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Track incoming and outgoing IT equipment shipments.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                {currentUser.permissions?.offboarding && <Col>
                    <Link to="/offboarding" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>👋</div>
                                <Card.Title className="mt-2">Off-boarding</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Manage the asset return process for departing employees.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                {currentUser.permissions?.new_hire && <Col>
                    <Link to="/new_hire" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>🆕</div>
                                <Card.Title className="mt-2">New Hire</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Onboard new employees and manage their initial setup.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                {currentUser.permissions?.user_management && <Col>
                    <Link to="/user_management" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>👥</div>
                                <Card.Title className="mt-2">User Management</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Manage users and their permissions.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>}
                <Col>
                    <a href="http://lms.exelonglobal.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>📅</div>
                                <Card.Title className="mt-2">Leave Management</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Access the employee leave management system.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </a>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
