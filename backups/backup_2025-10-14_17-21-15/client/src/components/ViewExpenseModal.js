import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const INR_TO_USD_EXCHANGE_RATE = 0.012; // Example fixed rate, e.g., 1 INR = 0.012 USD

const ViewExpenseModal = ({ isOpen, onClose, expense }) => {
    if (!isOpen || !expense) {
        return null;
    }

    return (
        <Modal show={isOpen} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>View IT Expense</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p><strong>Vendor:</strong> {expense.vendor_name}</p>
                <p><strong>Invoice Number:</strong> {expense.invoice_number}</p>
                <p><strong>Invoice Date:</strong> {expense.invoice_date}</p>
                <p><strong>Total Amount:</strong> {expense.total_amount ? expense.total_amount.toFixed(2) : '0.00'} INR ({expense.total_amount ? (expense.total_amount * INR_TO_USD_EXCHANGE_RATE).toFixed(2) : '0.00'} USD)</p>
                <h5>Items:</h5>
                {expense.items && expense.items.length > 0 ? (
                    <ul>
                        {expense.items.map(item => (
                            <li key={item.id || Math.random()}>
                                {item.item_name} (Qty: {item.quantity})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No items</p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ViewExpenseModal;