
import React from 'react';

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

const logout = () => {
    localStorage.removeItem("user");
};

const Dashboard = () => {
    const currentUser = getCurrentUser();

    const handleLogout = () => {
        logout();
        window.location.reload();
    }

    return (
        <div className="container">
            <header className="jumbotron">
                <h3>
                    Welcome, <strong>{currentUser?.username}</strong>!
                </h3>
                <p>Role: <strong>{currentUser?.role}</strong></p>
            </header>
            <p>This is the IT Operations Portal dashboard. Modules for Asset Management, Expenses, Inventory, and Shipments will be built here.</p>
            <button onClick={handleLogout} className="btn btn-primary">Logout</button>
        </div>
    );
};

export default Dashboard;
