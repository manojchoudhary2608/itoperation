import React, { useState, useEffect } from 'react';

const AddItemModal = ({ isOpen, onClose, onAddItem, existingItemNames }) => {
    const [selectedItemName, setSelectedItemName] = useState('');
    const [newItemName, setNewItemName] = useState('');
    const [purchaseQty, setPurchaseQty] = useState(0);
    const [isNewItemType, setIsNewItemType] = useState(false);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSelectedItemName('');
            setNewItemName('');
            setPurchaseQty(0);
            setIsNewItemType(false);
            setFormError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        let item_name_to_add = '';
        if (isNewItemType) {
            item_name_to_add = newItemName.trim();
        } else {
            item_name_to_add = selectedItemName.trim();
        }

        if (!item_name_to_add) {
            setFormError("Item Name cannot be empty.");
            return;
        }
        if (purchaseQty <= 0) {
            setFormError("Purchase Quantity must be greater than 0.");
            return;
        }

        try {
            await onAddItem({
                item_name: item_name_to_add,
                purchase_qty: parseInt(purchaseQty, 10),
                assign_qty: 0, // New items start with 0 assigned
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
                        <h5 className="modal-title">Add New Stock Item</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="itemTypeSelection" className="form-label">Select Existing Item or Add New</label>
                                <select
                                    className="form-select"
                                    id="itemTypeSelection"
                                    value={selectedItemName}
                                    onChange={(e) => {
                                        setSelectedItemName(e.target.value);
                                        setIsNewItemType(e.target.value === 'addNewItemType');
                                    }}
                                >
                                    <option value="">-- Select an Item --</option>
                                    {existingItemNames && existingItemNames.map((name, index) => (
                                        <option key={index} value={name}>{name}</option>
                                    ))}
                                    <option value="addNewItemType">-- Add New Item Type --</option>
                                </select>
                            </div>

                            {isNewItemType && (
                                <div className="mb-3">
                                    <label htmlFor="newItemName" className="form-label">New Item Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="newItemName"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        required={isNewItemType}
                                    />
                                </div>
                            )}

                            {!isNewItemType && selectedItemName && (
                                <div className="mb-3">
                                    <label htmlFor="selectedItemDisplay" className="form-label">Selected Item</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="selectedItemDisplay"
                                        value={selectedItemName}
                                        readOnly
                                    />
                                </div>
                            )}

                            <div className="mb-3">
                                <label htmlFor="purchaseQty" className="form-label">Purchase Quantity</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="purchaseQty"
                                    value={purchaseQty}
                                    onChange={(e) => setPurchaseQty(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Add Item</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddItemModal;
