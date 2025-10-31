import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "/api/it_expenses";
const INR_TO_USD_EXCHANGE_RATE = 0.012; // Example fixed rate, e.g., 1 INR = 0.012 USD

const ITExpense = () => {
    const [itExpenses, setItExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newItExpense, setNewItExpense] = useState({
        vendor_name: '',
        invoice_number: '',
        invoice_date: '',
        items: [], // Array to hold multiple items
        invoice_file: null, // To store the file object for upload
    });
    const [selectedFile, setSelectedFile] = useState(null); // State to hold the actual file object
    const [editingItExpenseId, setEditingItExpenseId] = useState(null);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        fetchItExpenses();
    }, []);

    const fetchItExpenses = async () => {
        try {
            const response = await axios.get(API_URL);
            // Backend now returns invoices with nested items
            setItExpenses(response.data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItExpense(prevExpense => ({
            ...prevExpense,
            [name]: value
        }));
    };

    const handleAddItem = () => {
        setNewItExpense(prevExpense => ({
            ...prevExpense,
            items: [...prevExpense.items, { item_name: '', quantity: 0, price: 0, tax_percentage: 0, currency: 'INR' }]
        }));
    };

    const handleRemoveItem = (index) => {
        setNewItExpense(prevExpense => ({
            ...prevExpense,
            items: prevExpense.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        setNewItExpense(prevExpense => {
            const updatedItems = prevExpense.items.map((item, i) => {
                if (i === index) {
                    let updatedItem = { ...item, [name]: name === 'quantity' || name === 'price' || name === 'tax_percentage' ? parseFloat(value) : value };

                    // If currency is changed, ensure price is consistent (e.g., convert to INR if USD was entered)
                    if (name === 'currency') {
                        if (value === 'INR' && item.currency === 'USD') {
                            updatedItem.price = updatedItem.price / INR_TO_USD_EXCHANGE_RATE; // Convert USD price to INR
                        } else if (value === 'USD' && item.currency === 'INR') {
                            updatedItem.price = updatedItem.price * INR_TO_USD_EXCHANGE_RATE; // Convert INR price to USD
                        }
                    }

                    // Recalculate item_amount after change
                    updatedItem.item_amount = calculateItemAmount(updatedItem.quantity, updatedItem.price, updatedItem.tax_percentage);
                    return updatedItem;
                }
                return item;
            });
            return { ...prevExpense, items: updatedItems };
        });
    };

    // Helper to calculate item amount including tax
    const calculateItemAmount = (quantity, price, tax_percentage) => {
        const qty = parseFloat(quantity) || 0;
        const prc = parseFloat(price) || 0;
        const tax = parseFloat(tax_percentage) || 0;
        return qty * prc * (1 + tax / 100);
    };

    // Helper to calculate total amount of all items
    const calculateTotalAmount = () => {
        return newItExpense.items.reduce((sum, item) => sum + (item.item_amount || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        // Basic validation for items
        if (newItExpense.items.length === 0) {
            setFormError("Please add at least one item to the invoice.");
            return;
        }

        // Prepare data for backend
        const payload = {
            vendor_name: newItExpense.vendor_name,
            invoice_number: newItExpense.invoice_number,
            invoice_date: newItExpense.invoice_date,
            items: newItExpense.items,
        };

        if (selectedFile) {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = async () => {
                payload.invoice_file_base64 = reader.result.split(',')[1]; // Get base64 string
                payload.invoice_file_name = selectedFile.name;
                await sendInvoiceData(payload);
            };
            reader.onerror = (error) => {
                setFormError("Error reading file: " + error);
            };
        } else {
            await sendInvoiceData(payload);
        }
    };

    const sendInvoiceData = async (payload) => {
        try {
            if (editingItExpenseId) {
                await axios.put(`${API_URL}/${editingItExpenseId}`, payload);
            } else {
                await axios.post(API_URL, payload);
            }
            setNewItExpense({
                vendor_name: '',
                invoice_number: '',
                invoice_date: '',
                items: [],
                invoice_file: null,
            });
            setSelectedFile(null);
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

    const handleEditClick = (invoice) => {
        setEditingItExpenseId(invoice.id);
        setNewItExpense({
            vendor_name: invoice.vendor_name || '',
            invoice_number: invoice.invoice_number || '',
            invoice_date: invoice.invoice_date ? invoice.invoice_date.split('T')[0] : '',
            items: invoice.items.map(item => ({ ...item, currency: item.currency || 'INR' })) || [], // Deep copy items and set default currency
            invoice_file: null, // File input is reset on edit
        });
        setSelectedFile(null);
    };

    if (loading) return <p>Loading IT expenses...</p>;
    if (error) return <p>Error loading IT expenses: {error}</p>;

    return (
        <div className="container mt-4" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
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
                            <th>Date</th>
                            <th>Total Amount</th>
                            <th>Items</th>
                            <th>Invoice File</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itExpenses.map(invoice => (
                            <tr key={invoice.id}>
                                <td>{invoice.id}</td>
                                <td>{invoice.vendor_name}</td>
                                <td>{invoice.invoice_number}</td>
                                <td>{invoice.invoice_date}</td>
                                <td>{invoice.total_amount ? invoice.total_amount.toFixed(2) : '0.00'}</td>
                                <td>
                                    {invoice.items && invoice.items.length > 0 ? (
                                        <ul>
                                            {invoice.items.map(item => (
                                                <li key={item.id || Math.random()}>
                                                    {item.item_name} (Qty: {item.quantity}, Price: {item.price} {item.currency}, Tax: {item.tax_percentage}%) - Amount: {item.item_amount ? item.item_amount.toFixed(2) : '0.00'} INR
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        "No items"
                                    )}
                                </td>
                                <td>
                                    {invoice.invoice_file_path ? (
                                        <a href={`${API_URL}/download/${invoice.id}`} target="_blank" rel="noopener noreferrer">Download</a>
                                    ) : (
                                        "N/A"
                                    )}
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(invoice)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(invoice.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="card mt-5">
                <div className="card-header">
                    <h3 className="mb-0">{editingItExpenseId ? "Edit IT Expense" : "Add New IT Expense"}</h3>
                </div>
                <div className="card-body">
                    {formError && <div className="alert alert-danger">{formError}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="vendor_name" className="form-label">Vendor Name</label>
                                <input type="text" className="form-control" id="vendor_name" name="vendor_name" value={newItExpense.vendor_name} onChange={handleInputChange} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="invoice_number" className="form-label">Invoice Number</label>
                                <input type="text" className="form-control" id="invoice_number" name="invoice_number" value={newItExpense.invoice_number} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="invoice_date" className="form-label">Invoice Date</label>
                                <input type="date" className="form-control" id="invoice_date" name="invoice_date" value={newItExpense.invoice_date} onChange={handleInputChange} required />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="invoice_file" className="form-label">Invoice File</label>
                                <input type="file" className="form-control" id="invoice_file" name="invoice_file" onChange={(e) => setSelectedFile(e.target.files[0])} />
                            </div>
                        </div>

                        <h4 className="mt-4">Items</h4>
                        {newItExpense.items.map((item, index) => (
                            <div key={index} className="row mb-2 align-items-end border p-2 rounded">
                                <div className="col-md-4 mb-2">
                                    <label htmlFor={`item_name_${index}`} className="form-label">Item Name</label>
                                    <input type="text" className="form-control" id={`item_name_${index}`} name="item_name" value={item.item_name} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label htmlFor={`quantity_${index}`} className="form-label">Quantity</label>
                                    <input type="number" className="form-control" id={`quantity_${index}`} name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label htmlFor={`price_${index}`} className="form-label">Price</label>
                                    <input type="number" step="0.01" className="form-control" id={`price_${index}`} name="price" value={item.price} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label htmlFor={`currency_${index}`} className="form-label">Currency</label>
                                    <select className="form-select" id={`currency_${index}`} name="currency" value={item.currency} onChange={(e) => handleItemChange(index, e)}>
                                        <option value="INR">INR</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label htmlFor={`tax_percentage_${index}`} className="form-label">Tax (%)</label>
                                    <input type="number" step="0.01" className="form-control" id={`tax_percentage_${index}`} name="tax_percentage" value={item.tax_percentage} onChange={(e) => handleItemChange(index, e)} required />
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label className="form-label">Amount</label>
                                    <p className="form-control-static">{item.item_amount ? item.item_amount.toFixed(2) : '0.00'} INR</p>
                                </div>
                                <div className="col-md-1 mb-2 d-flex align-items-end">
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(index)}>Remove</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn btn-success btn-sm mt-2" onClick={handleAddItem}>Add Item</button>

                        <div className="text-end mt-3">
                            <h5>Total Amount: {calculateTotalAmount().toFixed(2)} INR ({ (calculateTotalAmount() * INR_TO_USD_EXCHANGE_RATE).toFixed(2) } USD)</h5>
                        </div>

                        <div className="mt-4">
                            <button type="submit" className="btn btn-primary">{editingItExpenseId ? "Update IT Expense" : "Add IT Expense"}</button>
                            {editingItExpenseId && <button type="button" className="btn btn-secondary ms-2" onClick={() => setEditingItExpenseId(null)}>Cancel Edit</button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ITExpense;