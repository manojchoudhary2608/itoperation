
import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const formatUsername = (email) => {
    if (!email) return '';
    const parts = email.split('@')[0].split('.');
    if (parts.length > 0) {
        const firstName = parts[0];
        return firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }
    return email; // Fallback to full email if parsing fails
};

const Dashboard = () => {
    const currentUser = getCurrentUser();

    return (
        <div>
            <header className="jumbotron" style={{ padding: '1rem' }}>
                <h4 className="mb-0">
                    Welcome, <strong>{formatUsername(currentUser?.username)}</strong>!
                </h4>
                <p className="mb-0">Role: <strong>{currentUser?.role}</strong></p>
            </header>

            <Row xs={1} md={2} lg={4} className="g-3 dashboard-row">
                <Col>
                    {currentUser.permissions?.assets ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>💻</div>
                                <Card.Title className="mt-2">Asset Management</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Manage IT assets, including laptops, desktops, and peripherals.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col>
                    {currentUser.permissions?.stock ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>📦</div>
                                <Card.Title className="mt-2">Stock Finder</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                    Search and manage your inventory of available assets.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col>
                    {currentUser.permissions?.it_expenses ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>💸</div>
                                <Card.Title className="mt-2">IT Expense</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                        Track and manage IT-related expenses and budgets.
                                    </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col>
                    {currentUser.permissions?.deliveries ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>🚚</div>
                                <Card.Title className="mt-2">Delivery Tracker</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                        Track incoming and outgoing IT equipment shipments.
                                    </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col>
                    {currentUser.permissions?.offboarding ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>👋</div>
                                <Card.Title className="mt-2">Off-boarding</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                        Manage the asset return process for departing employees.
                                    </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col>
                    {currentUser.permissions?.new_hire ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>🆕</div>
                                <Card.Title className="mt-2">New Hire</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                        Onboard new employees and manage their initial setup.
                                    </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
                <Col>
                    {currentUser.permissions?.user_management ? (
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
                    ) : (
                        <Card className="h-100 text-center" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                            <Card.Body>
                                <div style={{ fontSize: '2.5rem' }}>👥</div>
                                <Card.Title className="mt-2">User Management</Card.Title>
                                <Card.Text style={{ fontSize: '0.9rem' }}>
                                        Manage users and their permissions.
                                    </Card.Text>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
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
