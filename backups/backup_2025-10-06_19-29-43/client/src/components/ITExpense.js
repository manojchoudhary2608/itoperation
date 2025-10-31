import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "/api/it_expenses";

const ITExpense = () => {
    const [itExpenses, setItExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newItExpense, setNewItExpense] = useState({
        vendor_name: '',
        invoice_number: '',
        item: '',
        quantity: 0,
        price: 0,
        tax_percentage: 0,
        amount: 0,
        date: '',
        invoice: '',
    });
    const [editingItExpenseId, setEditingItExpenseId] = useState(null);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        fetchItExpenses();
    }, []);

    const fetchItExpenses = async () => {
        try {
            const response = await axios.get(API_URL);
            setItExpenses(response.data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItExpense({ ...newItExpense, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editingItExpenseId) {
                await axios.put(`${API_URL}/${editingItExpenseId}`, newItExpense);
            } else {
                await axios.post(API_URL, newItExpense);
            }
            setNewItExpense({
                vendor_name: '',
                invoice_number: '',
                item: '',
                quantity: 0,
                price: 0,
                tax_percentage: 0,
                amount: 0,
                date: '',
                invoice: '',
            });
            setEditingItExpenseId(null); // Exit edit mode
            fetchItExpenses(); // Refresh the list
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`);
            fetchItExpenses(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleEditClick = (expense) => {
        setEditingItExpenseId(expense.id);
        setNewItExpense({
            vendor_name: expense.vendor_name || '',
            invoice_number: expense.invoice_number || '',
            item: expense.item || '',
            quantity: expense.quantity || 0,
            price: expense.price || 0,
            tax_percentage: expense.tax_percentage || 0,
            amount: expense.amount || 0,
            date: expense.date ? expense.date.split('T')[0] : '',
            invoice: expense.invoice || '',
        });
    };

    if (loading) return <p>Loading IT expenses...</p>;
    if (error) return <p>Error loading IT expenses: {error}</p>;

    return (
        <div className="container mt-4">
            <h2>IT Expense Tracker</h2>
            <p>Manage your IT expenses here.</p>
            
            {itExpenses.length === 0 ? (
                <p>No IT expenses found. Add some using the form below!</p>
            ) : (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Vendor</th>
                            <th>Invoice No.</th>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Tax (%)</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Invoice</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itExpenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{expense.id}</td>
                                <td>{expense.vendor_name}</td>
                                <td>{expense.invoice_number}</td>
                                <td>{expense.item}</td>
                                <td>{expense.quantity}</td>
                                <td>{expense.price}</td>
                                <td>{expense.tax_percentage}</td>
                                <td>{expense.amount}</td>
                                <td>{expense.date}</td>
                                <td>{expense.invoice}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(expense)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(expense.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <h3 className="mt-5">{editingItExpenseId ? "Edit IT Expense" : "Add New IT Expense"}</h3>
            {formError && <div className="alert alert-danger">{formError}</div>}
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="vendor_name" className="form-label">Vendor Name</label>
                        <input type="text" className="form-control" id="vendor_name" name="vendor_name" value={newItExpense.vendor_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="invoice_number" className="form-label">Invoice Number</label>
                        <input type="text" className="form-control" id="invoice_number" name="invoice_number" value={newItExpense.invoice_number} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label htmlFor="item" className="form-label">Item</label>
                        <input type="text" className="form-control" id="item" name="item" value={newItExpense.item} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-3 mb-3">
                        <label htmlFor="quantity" className="form-label">Quantity</label>
                        <input type="number" className="form-control" id="quantity" name="quantity" value={newItExpense.quantity} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="price" className="form-label">Price</label>
                        <input type="number" step="0.01" className="form-control" id="price" name="price" value={newItExpense.price} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="tax_percentage" className="form-label">Tax (%)</label>
                        <input type="number" step="0.01" className="form-control" id="tax_percentage" name="tax_percentage" value={newItExpense.tax_percentage} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-3 mb-3">
                        <label htmlFor="amount" className="form-label">Amount</label>
                        <input type="number" step="0.01" className="form-control" id="amount" name="amount" value={newItExpense.amount} onChange={handleInputChange} required />
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="date" className="form-label">Date</label>
                        <input type="date" className="form-control" id="date" name="date" value={newItExpense.date} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="invoice" className="form-label">Invoice</label>
                        <input type="text" className="form-control" id="invoice" name="invoice" value={newItExpense.invoice} onChange={handleInputChange} required />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">{editingItExpenseId ? "Update IT Expense" : "Add IT Expense"}</button>
                {editingItExpenseId && <button type="button" className="btn btn-secondary ms-2" onClick={() => setEditingItExpenseId(null)}>Cancel Edit</button>}
            </form>
        </div>
    );
};

export default ITExpense;