import React, { useState, useEffect } from 'react';

const INR_TO_USD_EXCHANGE_RATE = 0.012; // Example fixed rate, e.g., 1 INR = 0.012 USD

const ITExpenseModal = ({ isOpen, onClose, onSubmit, initialData, formError }) => {
    const [newItExpense, setNewItExpense] = useState(initialData);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        setNewItExpense(initialData);
        setSelectedFile(null);
    }, [initialData]);

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

                    if (name === 'currency') {
                        if (value === 'INR' && item.currency === 'USD') {
                            updatedItem.price = updatedItem.price / INR_TO_USD_EXCHANGE_RATE; // Convert USD price to INR
                        } else if (value === 'USD' && item.currency === 'INR') {
                            updatedItem.price = updatedItem.price * INR_TO_USD_EXCHANGE_RATE; // Convert INR price to USD
                        }
                    }

                    updatedItem.item_amount = calculateItemAmount(updatedItem.quantity, updatedItem.price, updatedItem.tax_percentage);
                    return updatedItem;
                }
                return item;
            });
            return { ...prevExpense, items: updatedItems };
        });
    };

    const calculateItemAmount = (quantity, price, tax_percentage) => {
        const qty = parseFloat(quantity) || 0;
        const prc = parseFloat(price) || 0;
        const tax = parseFloat(tax_percentage) || 0;
        return qty * prc * (1 + tax / 100);
    };

    const calculateTotalAmount = () => {
        return newItExpense.items.reduce((sum, item) => sum + (item.item_amount || 0), 0);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(newItExpense, selectedFile);
    };

    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{initialData.id ? "Edit IT Expense" : "Add New IT Expense"}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <form onSubmit={handleFormSubmit}>
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
                                <button type="submit" className="btn btn-primary">{initialData.id ? "Update IT Expense" : "Add IT Expense"}</button>
                                <button type="button" className="btn btn-secondary ms-2" onClick={onClose}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ITExpenseModal;