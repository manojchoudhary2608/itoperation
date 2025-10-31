import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ITExpenseModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [newItExpense, setNewItExpense] = useState({
        vendor_name: '',
        invoice_number: '',
        invoice_date: '',
        items: [],
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (initialData) {
            setNewItExpense(initialData);
        } else {
            setNewItExpense({
                vendor_name: '',
                invoice_number: '',
                invoice_date: '',
                items: [],
            });
        }
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
                    return { ...item, [name]: value };
                }
                return item;
            });
            return { ...prevExpense, items: updatedItems };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(newItExpense, selectedFile);
    };

    return (
        <Modal show={isOpen} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>{initialData ? "Edit IT Expense" : "Add New IT Expense"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
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
                            <div className="col-md-1 mb-2 d-flex align-items-end">
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(index)}>Remove</button>
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn btn-success btn-sm mt-2" onClick={handleAddItem}>Add Item</button>

                    <div className="mt-4">
                        <Button type="submit" variant="primary">{initialData ? "Update IT Expense" : "Add IT Expense"}</Button>
                        <Button variant="secondary" className="ms-2" onClick={onClose}>Cancel</Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
};

export default ITExpenseModal;