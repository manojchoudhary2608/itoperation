import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ViewExpenseModal from './ViewExpenseModal';
import ITExpenseModal from './ITExpenseModal';
import './ITExpense.css'; // Import the new CSS file

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
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [showForm, setShowForm] = useState(false); // State to control form visibility
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const handleViewClick = (expense) => {
        setSelectedExpense(expense);
        setShowViewModal(true);
    };

    useEffect(() => {
        fetchItExpenses();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter expenses based on search term
    const filteredExpenses = itExpenses.filter(invoice =>
        invoice.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleSubmit = async (itExpenseData, file) => {
        setFormError(null);
        console.log("handleSubmit called with data:", itExpenseData, "and file:", file);

        // Basic validation for items
        if (itExpenseData.items.length === 0) {
            setFormError("Please add at least one item to the invoice.");
            console.log("Validation failed: No items.");
            return;
        }

        // Prepare data for backend
        const payload = {
            vendor_name: itExpenseData.vendor_name,
            invoice_number: itExpenseData.invoice_number,
            invoice_date: itExpenseData.invoice_date,
            items: itExpenseData.items,
        };
        console.log("Payload prepared:", payload);

        if (file) {
            console.log("File selected, reading as DataURL.");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                payload.invoice_file_base64 = reader.result.split(',')[1]; // Get base64 string
                payload.invoice_file_name = file.name;
                console.log("File read, calling sendInvoiceData with file.");
                await sendInvoiceData(payload);
            };
            reader.onerror = (error) => {
                setFormError("Error reading file: " + error);
                console.error("FileReader error:", error);
            };
        } else {
            console.log("No file selected, calling sendInvoiceData directly.");
            await sendInvoiceData(payload);
        }
    };

    const sendInvoiceData = async (payload) => {
        console.log("sendInvoiceData called with payload:", payload);
        try {
            console.log("Attempting axios call.");
            if (editingItExpenseId) {
                await axios.put(`${API_URL}/${editingItExpenseId}`, payload);
                console.log("Axios PUT successful.");
            } else {
                await axios.post(API_URL, payload);
                console.log("Axios POST successful.");
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
            setShowForm(false); // Close the modal
            setEditingItExpenseId(null); // Exit edit mode
            console.log("Form submission successful, state reset.");
        } catch (err) {
            setFormError(err.response?.data?.error || err.message);
            console.error("Form submission failed:", err.response?.data?.error || err.message, err);
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

    const handleExportCsv = () => {
        if (itExpenses.length === 0) {
            alert("No IT expenses to export.");
            return;
        }

        const headers = [
            "Invoice ID", "Vendor Name", "Invoice Number", "Invoice Date", "Total Amount (INR)", "Total Amount (USD)",
            "Item ID", "Item Name", "Quantity", "Price (INR)", "Price (USD)", "Tax (%)", "Item Amount (INR)", "Item Amount (USD)"
        ];
        const csvRows = [];
        csvRows.push(headers.join(',')); // Add headers

        itExpenses.forEach(invoice => {
            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(item => {
                    const priceINR = item.currency === 'INR' ? item.price : item.price / INR_TO_USD_EXCHANGE_RATE;
                    const priceUSD = item.currency === 'USD' ? item.price : item.price * INR_TO_USD_EXCHANGE_RATE;
                    const itemAmountINR = item.item_amount;
                    const itemAmountUSD = item.item_amount * INR_TO_USD_EXCHANGE_RATE;

                    const values = [
                        invoice.id,
                        `"${invoice.vendor_name.replace(/"/g, '""')}"`,
                        `"${invoice.invoice_number.replace(/"/g, '""')}"`,
                        invoice.invoice_date,
                        invoice.total_amount ? invoice.total_amount.toFixed(2) : '0.00',
                        invoice.total_amount ? (invoice.total_amount * INR_TO_USD_EXCHANGE_RATE).toFixed(2) : '0.00',
                        item.id,
                        `"${item.item_name.replace(/"/g, '""')}"`,
                        item.quantity,
                        priceINR.toFixed(2),
                        priceUSD.toFixed(2),
                        item.tax_percentage,
                        itemAmountINR.toFixed(2),
                        itemAmountUSD.toFixed(2)
                    ];
                    csvRows.push(values.join(','));
                });
            } else {
                // Handle invoices with no items
                const values = [
                    invoice.id,
                    `"${invoice.vendor_name.replace(/"/g, '""')}"`,
                    `"${invoice.invoice_number.replace(/"/g, '""')}"`,
                    invoice.invoice_date,
                    invoice.total_amount ? invoice.total_amount.toFixed(2) : '0.00',
                    invoice.total_amount ? (invoice.total_amount * INR_TO_USD_EXCHANGE_RATE).toFixed(2) : '0.00',
                    '', '', '', '', '', '', '', '' // Empty fields for item details
                ];
                csvRows.push(values.join(','));
            }
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'it_expenses.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <p>Loading IT expenses...</p>;
    if (error) return <p>Error loading IT expenses: {error}</p>;

    return (
        <div className="container mt-4" style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2>IT Expense Tracker</h2>
                    <p className="mb-0">Manage your IT expenses here.</p>
                </div>
                <div className="d-flex justify-content-center flex-grow-1">
                    <div className="input-group w-50">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by Vendor or Invoice No."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                <div>
                    <button className="btn btn-primary me-2" onClick={() => setShowForm(true)}>
                        Add IT Expense
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportCsv}>
                        Export CSV
                    </button>
                </div>
            </div>

            {filteredExpenses.length === 0 ? (
                <p>No IT expenses found. Add some using the form below!</p>
            ) : (
                <div style={{ height: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                <table className="table table-striped it-expense-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Vendor</th>
                            <th>Invoice No.</th>
                            <th>Date</th>
                            <th>Total Amount (INR/USD)</th>
                            <th className="text-center">Items</th>
                            <th>Invoice File</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(invoice => (
                            <tr key={invoice.id}>
                                <td>{invoice.id}</td>
                                <td>{invoice.vendor_name}</td>
                                <td>{invoice.invoice_number}</td>
                                <td>{invoice.invoice_date}</td>
                                <td>{invoice.total_amount ? `${invoice.total_amount.toFixed(2)} INR (${(invoice.total_amount * INR_TO_USD_EXCHANGE_RATE).toFixed(2)} USD)` : '0.00 INR (0.00 USD)'}</td>
                                <td>
                                    {invoice.items && invoice.items.length > 0 ? (
                                        <ul>
                                            {invoice.items.map(item => (
                                                <li key={item.id || Math.random()}>
                                                    {item.item_name} (Qty: {item.quantity})
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
                                    <button className="btn btn-sm btn-info me-2" onClick={() => handleViewClick(invoice)}>View</button>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditClick(invoice)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(invoice.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}
            <ViewExpenseModal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                expense={selectedExpense}
            />
            <ITExpenseModal
                isOpen={showForm || editingItExpenseId !== null}
                onClose={() => {
                    setShowForm(false);
                    setEditingItExpenseId(null);
                    setNewItExpense({
                        vendor_name: '',
                        invoice_number: '',
                        invoice_date: '',
                        items: [],
                        invoice_file: null,
                    }); // Clear form data on close
                    setSelectedFile(null);
                }}
                onSubmit={handleSubmit}
                formData={newItExpense}
                setFormData={setNewItExpense}
                initialData={editingItExpenseId !== null ? itExpenses.find(item => item.id === editingItExpenseId) : null}
            />
        </div>
    );
};

export default ITExpense;
