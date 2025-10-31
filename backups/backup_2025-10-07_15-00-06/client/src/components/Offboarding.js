
import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Button, Alert, Row, Col } from 'react-bootstrap';

const API_URL = "/api/assets";

const Offboarding = () => {
    const [gaid, setGaid] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOffboard = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (!gaid) {
            setError('Please enter a GAID.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/offboard`, { gaid });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
            setGaid('');
        }
    };

    return (
        <Container className="mt-4">
            <h2>Employee Off-boarding</h2>
            <p>Enter the GAID of a departing employee to unassign all their assets and return them to stock.</p>
            
            <Row className="justify-content-md-center mt-4">
                <Col md={6}>
                    <Form onSubmit={handleOffboard}>
                        <Form.Group className="mb-3" controlId="formGaid">
                            <Form.Label>Employee GAID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter GAID"
                                value={gaid}
                                onChange={(e) => setGaid(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Processing...' : 'Start Off-boarding Process'}
                        </Button>
                    </Form>

                    {message && <Alert variant="success" className="mt-4">{message}</Alert>}
                    {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
                </Col>
            </Row>
        </Container>
    );
};

export default Offboarding;
