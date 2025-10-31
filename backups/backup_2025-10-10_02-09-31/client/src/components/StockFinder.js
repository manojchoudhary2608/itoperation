import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import AssignItemModal from './AssignItemModal'; // New import

const API_URL = "/api/stock";

const StockFinder = () => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formError, setFormError] = useState(null); // Keep for bulk upload errors
    const fileInputRef = useRef(null);

    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [existingItemNames, setExistingItemNames] = useState([]);

    const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const [isAssignItemModalOpen, setIsAssignItemModalOpen] = useState(false); // New state for AssignItemModal

    useEffect(() => {
        fetchStockItems();
    }, []);

    const fetchStockItems = async () => {
        try {
            const response = await axios.get(API_URL);
            setStockItems(response.data.data);
            // Extract unique item names from the fetched stock items
            const uniqueItemNames = [...new Set(response.data.data.map(item => item.item_name))];
            setExistingItemNames(uniqueItemNames);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            try {
                await axios.post(`${API_URL}/bulk-upload`, { csvData: text }, {
                    headers: { 'Content-Type': 'application/json' }
                });
                alert("Stock items uploaded successfully!");
                fetchStockItems(); // Refresh the list
            } catch (err) {
                const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
                alert(`Error uploading stock items: ${errorDetails}`);
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = null; // Clear the input
                }
            }
        };
        reader.readAsText(file);
    };

    const onAddItem = async (itemData) => { // Renamed from handleSubmit, adapted for modal
        try {
            await axios.post(API_URL, itemData);
            fetchStockItems(); // Refresh the list
        } catch (err) {
            // Error handling for the modal will be done within the modal itself
            throw err; // Re-throw to allow modal to catch and display error
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

    const onEditItem = async (id, itemData) => { // New function for editing
        try {
            await axios.put(`${API_URL}/${id}`, itemData);
            fetchStockItems(); // Refresh the list
        } catch (err) {
            throw err; // Re-throw to allow modal to catch and display error
        }
    };

    const onAssignItem = async (itemName, quantityToAssign) => { // New function for assigning
        try {
            // Find the item by name to get its ID and current quantities
            const item = stockItems.find(i => i.item_name === itemName);
            if (!item) {
                throw new Error(`Item "${itemName}" not found.`);
            }

            const updatedAssignQty = item.assign_qty + quantityToAssign;
            const updatedPurchaseQty = item.purchase_qty; // Purchase quantity doesn't change on assign

            await axios.put(`${API_URL}/${item.id}`, {
                item_name: itemName,
                purchase_qty: updatedPurchaseQty,
                assign_qty: updatedAssignQty,
            });
            fetchStockItems(); // Refresh the list
        } catch (err) {
            throw err; // Re-throw to allow modal to catch and display error
        }
    };

    const handleEditClick = (item) => { // Modified to open modal
        setItemToEdit(item);
        setIsEditItemModalOpen(true);
    };

    if (loading) return <p>Loading stock items...</p>;
    if (error) return <p>Error loading stock items: {error}</p>;

    return (
        <div className="container mt-4">
            <h2>Stock Finder</h2>
            <p>Manage your stock items here.</p>
            
            <div className="d-flex justify-content-end mb-3">
                <button className="btn btn-success me-2" onClick={() => fileInputRef.current.click()}>
                    Bulk Upload CSV
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv"
                    style={{ display: 'none' }}
                />
                <button className="btn btn-primary me-2" onClick={() => setIsAddItemModalOpen(true)}>
                    Add New Stock Item
                </button>
                <button className="btn btn-info" onClick={() => setIsAssignItemModalOpen(true)}>
                    Assign Item
                </button>
            </div>

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
            {/* The inline add/edit form is removed */}
            <AddItemModal
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                onAddItem={onAddItem}
                existingItemNames={existingItemNames}
            />

            <EditItemModal
                isOpen={isEditItemModalOpen}
                onClose={() => setIsEditItemModalOpen(false)}
                onEditItem={onEditItem}
                itemData={itemToEdit}
            />

            <AssignItemModal // New AssignItemModal
                isOpen={isAssignItemModalOpen}
                onClose={() => setIsAssignItemModalOpen(false)}
                onAssignItem={onAssignItem}
                existingItemNames={existingItemNames}
            />
        </div>
    );
};

export default StockFinder;