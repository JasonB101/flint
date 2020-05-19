import React, { useState } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";
import getEbayCategoryId from "../../../../../lib/getEbayCategoryId"

const ListingForm = (props) => {
    const { toggleModal, submitNewItem, itemForm } = props;
    const [inputForm, setInput] = useState({
        title: "",
        mpn: itemForm.partNo,
        sku: itemForm.sku,
        brand: "",
        listPrice: "",
        conditionId: 3000,
        conditionDescription: "",
        acceptOfferHigh: "",
        declineOfferLow: "",
        description: "",
        categoryId: 33596
    })

    const handleChange = (e) => {
        setInput({
            ...inputForm,
            [e.target.name]: isNaN(+e.target.value) ? e.target.value : +e.target.value
        })
    }

    const handleSelect = (e) => {
        const condition = e.target.value
        switch (condition) {
            case "Used":
                setInput({
                    ...inputForm,
                    conditionId: 3000
                });
                break;
            case "For Parts":
                setInput({
                    ...inputForm,
                    conditionId: 7000
                });
                break;
            case "New":
                setInput({
                    ...inputForm,
                    conditionId: 1000
                });
                break;
            default:
        }
    }

    const handleCategorySelect = (e) => {
        setInput({
            ...inputForm,
            categoryId: getEbayCategoryId(e.target.value)
        });
    }

    function saveChanges(e) {
        let ebayForm = inputForm;
        submitNewItem({ ...ebayForm, ...itemForm})
        toggleModal(false)
    }

    return (
        <Form onSubmit={saveChanges}>
            <Form.Row>
                <Form.Group as={Col} controlId="formGridTitle">
                    <Form.Label>Title</Form.Label>
                    <Form.Control required value={inputForm.title} name="title" onChange={handleChange} placeholder="" />
                </Form.Group>
            </Form.Row>
            <Form.Label>Condition</Form.Label>
            <Form.Row>
                <Form.Group md={4} as={Col} controlId="formGridConditionId">
                    <Form.Control as="select" name="conditionId" onChange={handleSelect}>
                        <option>Used</option>
                        <option>For Parts</option>
                        <option>New</option>
                    </Form.Control>
                </Form.Group>
                <Form.Group as={Col} controlId="formGridConditionDescription">
                    <Form.Control value={inputForm.conditionDescription} name="conditionDescription" onChange={handleChange} placeholder="eg. 'Used, but in working condition'" />
                </Form.Group>
            </Form.Row>

            <Form.Label>Category</Form.Label>

            <Form.Row>
                <Form.Group md={8} as={Col} controlId="formGridConditionId">
                    <Form.Control as="select" name="conditionId" onChange={handleCategorySelect}>
                        <option>Engine Computer ECU</option>
                        <option>Computer Chip (Other)</option>
                        <option>Head Light</option>
                        <option>Tail Light</option>
                        <option>Climate Control</option>
                        <option>Interior Part (Other)</option>
                        <option>Exterior Mirror</option>
                        <option>Interior Mirror</option>
                        <option>Dash Parts</option>
                    </Form.Control>
                </Form.Group>
                <Form.Group md={4} as={Col} controlId="formGridCategoryId">
                    <Form.Control required value={inputForm.categoryId} name="categoryId" onChange={handleChange} placeholder="Category ID" />
                </Form.Group>
            </Form.Row>

            <Form.Row>
                <Form.Group as={Col} controlId="formGridDescription">
                    <Form.Label>Item Description</Form.Label>
                    <Form.Control as="textarea" rows="6" value={inputForm.description} name="description" onChange={handleChange} placeholder="Item Specifics"/>
                </Form.Group>
            </Form.Row>

            <Form.Label>Manufacturer</Form.Label>
            <Form.Row>
                <Form.Group as={Col} controlId="formGridBrand">

                    <Form.Control value={inputForm.brand} name="brand" onChange={handleChange} placeholder="Brand" />
                </Form.Group>
                <Form.Group as={Col} controlId="formGridMpn">
                    <Form.Control value={inputForm.mpn} name="mpn" onChange={handleChange} placeholder="Part Number" />
                </Form.Group>
            </Form.Row>
            <Form.Label>Money</Form.Label>
            <Form.Row>
                <Form.Group as={Col} controlId="formGridListPrice">
                    <Form.Control required value={inputForm.listPrice} name="listPrice" onChange={handleChange} placeholder="List Price" />
                </Form.Group>

                <Form.Group as={Col} controlId="formGridAcceptOfferHigh">

                    <Form.Control value={inputForm.acceptOfferHigh} name="acceptOfferHigh" onChange={handleChange} placeholder="Accepted Offer" />
                </Form.Group>
                <Form.Group as={Col} controlId="formGridDeclineOfferLow">

                    <Form.Control value={inputForm.declineOfferLow} name="declineOfferLow" onChange={handleChange} placeholder="Declined Offer" />
                </Form.Group>
            </Form.Row>

            <Modal.Footer>
                <Button onClick={() => toggleModal(false)} variant="secondary">Close</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
            </Modal.Footer>
        </Form>

    );
}

export default ListingForm;