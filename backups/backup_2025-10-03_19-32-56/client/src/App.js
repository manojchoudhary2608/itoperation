import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";

import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";

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
                                <a href="/login" className="nav-link" onClick={logOut}>
                                    Logout
                                </a>
                            </li>
                        </div>
                    )}
                </nav>

                <div className="container mt-3">
                    <Routes>
                        <Route path="/*" element={currentUser ? <Dashboard /> : <LoginPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

export default App;