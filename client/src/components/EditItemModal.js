import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditItemModal = ({ isOpen, onClose, onEditItem, itemData }) => {
    const [id, setId] = useState(null);
    const [itemName, setItemName] = useState('');
    const [purchaseQty, setPurchaseQty] = useState(0);
    const [assignQty, setAssignQty] = useState(0);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (isOpen && itemData) {
            setId(itemData.id);
            setItemName(itemData.item_name || '');
            setPurchaseQty(itemData.purchase_qty || 0);
            setAssignQty(itemData.assign_qty || 0);
            setFormError(null);
        }
    }, [isOpen, itemData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!itemName.trim()) {
            setFormError("Item Name cannot be empty.");
            return;
        }
        if (purchaseQty < 0 || assignQty < 0) {
            setFormError("Quantities cannot be negative.");
            return;
        }

        try {
            await onEditItem(id, {
                item_name: itemName,
                purchase_qty: parseInt(purchaseQty, 10),
                assign_qty: parseInt(assignQty, 10),
            });
            onClose(); // Close modal on success
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Stock Item</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="editItemName" className="form-label">Item Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="editItemName"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="editPurchaseQty" className="form-label">Purchase Quantity</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="editPurchaseQty"
                                    value={purchaseQty}
                                    onChange={(e) => setPurchaseQty(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="editAssignQty" className="form-label">Assign Quantity</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="editAssignQty"
                                    value={assignQty}
                                    onChange={(e) => setAssignQty(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Update Item</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditItemModal;
