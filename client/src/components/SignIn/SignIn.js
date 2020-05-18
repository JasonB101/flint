import React, { useContext, useState, useEffect } from 'react'
import Styles from "./SignIn.module.scss"
import { Form, Button, Col } from "react-bootstrap";
import { storeContext } from '../../Store';
import flintLogo from "../../media/logos/bluebook.png"


const SignIn = (props) => {
    const storeData = useContext(storeContext);
    const { login, logout } = storeData;
    const [form, setForm] = useState({
        email: "",
        password: "",
        errorMessage: ""
    })

    useEffect(() => {
        logout()
    }, [])

    const handleChange = (input) => {
        setForm({
            ...form,
            errorMessage: "",
            [input.name]: input.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        login(form)
            .then(() => {
                props.history.push("/inventory")
            })
            .catch(err => {
                setForm({
                    ...form,
                    errorMessage: err.response.data.message
                })
                // setTimeout(() => {
                //     setForm({
                //         ...form,
                //         errorMessage: "",
                //     })
                // }, 5000)
            })
    }


    return (
        <div className={Styles.wrapper}>
            <div className={Styles.signInBox}>
                <div className={Styles.title}>
                    <img alt="logo" src={flintLogo} />
                    <h2>Sign In</h2>
                </div>
                <Form onSubmit={handleSubmit}>
                    <Form.Row>
                        <Form.Group as={Col} controlId="formGridEmail">
                            <Form.Control plaintext className={Styles.inputBox} onChange={(e) => handleChange(e.target)}
                                type="text" placeholder="email" name="email" value={form.email} />
                        </Form.Group>
                    </Form.Row>
                    <Form.Row>
                        <Form.Group as={Col} controlId="formPassword">
                            <Form.Control plaintext className={Styles.inputBox} onChange={(e) => handleChange(e.target)}
                        type="password" name="password" placeholder="password" value={form.password} />
                        </Form.Group>
                    </Form.Row>
                    {form.errorMessage && <p>{form.errorMessage}</p>}
                    <div className="spacer"></div>
                    <Button type="submit" variant="primary" className={Styles.signInButton}>Sign In</Button>
                </Form>

            </div>

        </div>
    )
}

export default SignIn
