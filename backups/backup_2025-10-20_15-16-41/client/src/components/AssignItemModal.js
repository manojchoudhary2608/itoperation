import React, { useState, useEffect } from 'react';

const AssignItemModal = ({ isOpen, onClose, onAssignItem, existingItemNames }) => {
    const [selectedItemName, setSelectedItemName] = useState('');
    const [assignQty, setAssignQty] = useState(0);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSelectedItemName('');
            setAssignQty(0);
            setFormError(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (!selectedItemName.trim()) {
            setFormError("Please select an Item Name.");
            return;
        }
        if (assignQty <= 0) {
            setFormError("Assign Quantity must be greater than 0.");
            return;
        }

        try {
            await onAssignItem(selectedItemName, parseInt(assignQty, 10));
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
                        <h5 className="modal-title">Assign Stock Item</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {formError && <div className="alert alert-danger">{formError}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="assignItemSelection" className="form-label">Select Item to Assign</label>
                                <select
                                    className="form-select"
                                    id="assignItemSelection"
                                    value={selectedItemName}
                                    onChange={(e) => setSelectedItemName(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select an Item --</option>
                                    {existingItemNames.map((name, index) => (
                                        <option key={index} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="assignQty" className="form-label">Quantity to Assign</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="assignQty"
                                    value={assignQty}
                                    onChange={(e) => setAssignQty(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Assign Item</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignItemModal;
