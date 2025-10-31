import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "/api/stock";

const StockFinder = () => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newStockItem, setNewStockItem] = useState({
        item_name: '',
        purchase_qty: 0,
        assign_qty: 0,
        stock_balance: 0,
    });
    const [editingStockItemId, setEditingStockItemId] = useState(null);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        fetchStockItems();
    }, []);

    const fetchStockItems = async () => {
        try {
            const response = await axios.get(API_URL);
            setStockItems(response.data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewStockItem({ ...newStockItem, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editingStockItemId) {
                await axios.put(`${API_URL}/${editingStockItemId}`, newStockItem);
            } else {
                await axios.post(API_URL, newStockItem);
            }
            setNewStockItem({
                item_name: '',
                purchase_qty: 0,
                assign_qty: 0,
                stock_balance: 0,
            });
            setEditingStockItemId(null); // Exit edit mode
            fetchStockItems(); // Refresh the list
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchStockItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleEditClick = (item) => {
        setEditingStockItemId(item.id);
        setNewStockItem({
            item_name: item.item_name || '',
            purchase_qty: item.purchase_qty || 0,
            assign_qty: item.assign_qty || 0,
            stock_balance: item.stock_balance || 0,
        });
    };

    if (loading) return <p>Loading stock items...</p>;
    if (error) return <p>Error loading stock items: {error}</p>;

    return (
        <div className="container mt-4">
            <h2>Stock Finder</h2>
            <p>Manage your stock items here.</p>
            
            {stockItems.length === 0 ? (
                <p>No stock items found. Add some using the form below!</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Item Name</th>
                            <th>Purchase Qty</th>
                            <th>Assign Qty</th>
                            <th>Stock Balance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockItems.map(item => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.item_name}</td>
                                <td>{item.purchase_qty}</td>
                                <td>{item.assign_qty}</td>
                                <td>{item.stock_balance}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(item)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <h3 className="mt-5">{editingStockItemId ? "Edit Stock Item" : "Add New Stock Item"}</h3>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="item_name" className="form-label">Item Name</label>
                        <input type="text" className="form-control" id="item_name" name="item_name" value={newStockItem.item_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="purchase_qty" className="form-label">Purchase Quantity</label>
                        <input type="number" className="form-control" id="purchase_qty" name="purchase_qty" value={newStockItem.purchase_qty} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="assign_qty" className="form-label">Assign Quantity</label>
                        <input type="number" className="form-control" id="assign_qty" name="assign_qty" value={newStockItem.assign_qty} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="stock_balance" className="form-label">Stock Balance</label>
                        <input type="number" className="form-control" id="stock_balance" name="stock_balance" value={newStockItem.stock_balance} onChange={handleInputChange} required />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">{editingStockItemId ? "Update Stock Item" : "Add Stock Item"}</button>
                {editingStockItemId && <button type="button" className="btn btn-secondary ms-2" onClick={() => setEditingStockItemId(null)}>Cancel Edit</button>}
            </form>
        </div>
    );
};

export default StockFinder;