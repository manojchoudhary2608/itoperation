import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import "./App.css";

import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AssetManagement from "./components/AssetManagement";
import StockFinder from "./components/StockFinder";
import ITExpense from "./components/ITExpense";
import Offboarding from "./components/Offboarding"; // Import Offboarding component
import DeliveryTracker from "./components/DeliveryTracker";
import NewHire from "./components/NewHire";

const App = () => {
    const [currentUser, setCurrentUser] = useState(undefined);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    const logOut = () => {
        localStorage.removeItem("user");
        setCurrentUser(undefined);
    };

    return (
        <Router>
            <Navbar bg="primary" variant="dark" expand="lg">
                <Container fluid>
                    <Navbar.Brand as={Link} to="/">IT Operations Portal</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        {currentUser && (
                            <Nav className="ml-auto">
                                <Nav.Link as={Link} to="/assets">Asset Management</Nav.Link>
                                <Nav.Link as={Link} to="/stock">Stock Finder</Nav.Link>
                                <Nav.Link as={Link} to="/it_expenses">IT Expense</Nav.Link>
                                <Nav.Link as={Link} to="/offboarding">Off-boarding</Nav.Link>
                                <Nav.Link as={Link} to="/deliveries">Delivery Tracker</Nav.Link>
                                <Nav.Link as={Link} to="/new_hire">New Hire</Nav.Link>
                                <Nav.Link onClick={logOut}>Logout</Nav.Link>
                            </Nav>
                        )}
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid className="mt-3" style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '8px' }}>
                <Routes>
                    <Route path="/assets" element={currentUser ? <AssetManagement /> : <LoginPage />} />
                    <Route path="/stock" element={currentUser ? <StockFinder /> : <LoginPage />} />
                    <Route path="/it_expenses" element={currentUser ? <ITExpense /> : <LoginPage />} />
                    <Route path="/offboarding" element={currentUser ? <Offboarding /> : <LoginPage />} />
                    <Route path="/deliveries" element={currentUser ? <DeliveryTracker /> : <LoginPage />} />
                    <Route path="/new_hire" element={currentUser ? <NewHire /> : <LoginPage />} />
                    <Route path="/*" element={currentUser ? <Dashboard /> : <LoginPage />} />
                </Routes>
            </Container>
        </Router>
    );
};

export default App;