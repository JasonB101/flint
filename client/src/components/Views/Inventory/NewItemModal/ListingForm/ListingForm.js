import React, { useState } from "react";
import { Modal, Form, Button, Col } from "react-bootstrap";

const ListingForm = (props) => {
    const { toggleModal, submitNewItem, itemForm } = props;
    const [inputForm, setInput] = useState({
        title: `Engine Computer ECU ECM PCM ${itemForm.partNo}`,
        mpn: itemForm.partNo,
        sku: itemForm.sku,
        brand: "",
        listPrice: "",
        conditionId: 3000,
        conditionDescription: "",
        acceptOfferHigh: "",
        shippingService: "USPSPriority",
        declineOfferLow: "",
        description: "Please double check the part number you are looking for and do your own research to be sure this part is compatible with your vehicle. Some ECU’s (Engine Control Unit) need to be reprogrammed with your vehicle's VIN. This process is not done by me. Please research the specific process your vehicle’s ECU may need before purchasing this ECU.\n\nThank you!",
        location: "",
    })

    const handleChange = ({ target }) => {
        const { name, value } = target;
        const updateForm = {
            ...inputForm,
            [name]: value,
        }
        if (name === "listPrice") {
            updateForm.acceptOfferHigh = (+value - 4.99).toFixed(2);
            updateForm.declineOfferLow = (+value - 14.99).toFixed(2);
        }
        setInput(updateForm);
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

    const handleShippingSelect = (e) => {
        setInput({
          ...inputForm,
          shippingService: e.target.value
        });
      }

    async function saveChanges(e) {
        e.preventDefault();
        let ebayForm = inputForm;
        const successfullyListed = await submitNewItem({ ...ebayForm, ...itemForm });
        if (successfullyListed === true) {
            toggleModal(false)
        }
    }

    return (
        <Form onSubmit={saveChanges}>
            <Form.Row>
                <Form.Group as={Col} controlId="formGridTitle">
                    <Form.Label>Title</Form.Label>
                    <Form.Control required value={inputForm.title} maxLength="80" name="title" onChange={handleChange} placeholder="" />
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
                <Form.Group as={Col} controlId="formGridDescription">
                    <Form.Label>Item Description</Form.Label>
                    <Form.Control as="textarea" rows="6" value={inputForm.description} name="description" onChange={handleChange} placeholder="Item Specifics" />
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
            <Form.Label>Shipping Service</Form.Label>
            <Form.Row>
                <Form.Group md={8} as={Col} controlId="formGridConditionId">
                    <Form.Control as="select" name="conditionId" onChange={handleShippingSelect}>
                        <option>USPSPriority</option>
                        <option>USPSFirstClass</option>
                    </Form.Control>
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
            <Form.Row>
                <Form.Group as={Col} controlId="formGridLocation">
                    <Form.Label>Stock Location</Form.Label>
                    <Form.Control value={inputForm.location} name="location" onChange={handleChange} placeholder="Section A, Shelf 1" />
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