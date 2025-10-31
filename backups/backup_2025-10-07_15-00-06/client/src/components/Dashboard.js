
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
            <header className="jumbotron">
                <h3>
                    Welcome, <strong>{currentUser?.username}</strong>!
                </h3>
                <p>Role: <strong>{currentUser?.role}</strong></p>
            </header>

            <Row xs={1} md={2} lg={3} className="g-4">
                <Col>
                    <Link to="/assets" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>💻</div>
                                <Card.Title className="mt-3">Asset Management</Card.Title>
                                <Card.Text>
                                    Manage IT assets, including laptops, desktops, and peripherals.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col>
                    <Link to="/stock" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>📦</div>
                                <Card.Title className="mt-3">Stock Finder</Card.Title>
                                <Card.Text>
                                    Search and manage your inventory of available assets.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col>
                    <Link to="/it_expenses" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>💸</div>
                                <Card.Title className="mt-3">IT Expense</Card.Title>
                                <Card.Text>
                                    Track and manage IT-related expenses and budgets.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col>
                    <Link to="/deliveries" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>🚚</div>
                                <Card.Title className="mt-3">Delivery Tracker</Card.Title>
                                <Card.Text>
                                    Track incoming and outgoing IT equipment shipments.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col>
                    <Link to="/offboarding" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>👋</div>
                                <Card.Title className="mt-3">Off-boarding</Card.Title>
                                <Card.Text>
                                    Manage the asset return process for departing employees.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col>
                    <Link to="/new_hire" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>🆕</div>
                                <Card.Title className="mt-3">New Hire</Card.Title>
                                <Card.Text>
                                    Onboard new employees and manage their initial setup.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Link>
                </Col>
                <Col>
                    <a href="http://lms.exelonglobal.com" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        <Card className="h-100 text-center">
                            <Card.Body>
                                <div style={{ fontSize: '3rem' }}>📅</div>
                                <Card.Title className="mt-3">Leave Management</Card.Title>
                                <Card.Text>
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
