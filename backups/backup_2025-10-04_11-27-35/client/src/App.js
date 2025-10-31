import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import AssetManagement from "./components/AssetManagement"; // Import AssetManagement component
import StockFinder from "./components/StockFinder"; // Import StockFinder component
import ITExpense from "./components/ITExpense"; // Import ITExpense component
import DeliveryTracker from "./components/DeliveryTracker"; // Import DeliveryTracker component

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
            <div>
                <nav className="navbar navbar-expand navbar-dark bg-dark">
                    <Link to={"/"} className="navbar-brand">
                        IT Operations Portal
                    </Link>
                    {currentUser && (
                         <div className="navbar-nav ml-auto">
                            <li className="nav-item">
                                <Link to={"/assets"} className="nav-link">
                                    Asset Management
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to={"/stock"} className="nav-link">
                                    Stock Finder
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to={"/it_expenses"} className="nav-link">
                                    IT Expense
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to={"/deliveries"} className="nav-link">
                                    Delivery Tracker
                                </Link>
                            </li>
                            <li className="nav-item">
                                <a href="/login" className="nav-link" onClick={logOut}>
                                    Logout
                                </a>
                            </li>
                        </div>
                    )}
                </nav>

                <div className="container mt-3">
                    <Routes>
                        <Route path="/assets" element={currentUser ? <AssetManagement /> : <LoginPage />} /> {/* New Asset Management Route */}
                        <Route path="/stock" element={currentUser ? <StockFinder /> : <LoginPage />} /> {/* New Stock Finder Route */}
                        <Route path="/it_expenses" element={currentUser ? <ITExpense /> : <LoginPage />} /> {/* New IT Expense Route */}
                        <Route path="/deliveries" element={currentUser ? <DeliveryTracker /> : <LoginPage />} /> {/* New Delivery Tracker Route */}
                        <Route path="/*" element={currentUser ? <Dashboard /> : <LoginPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;