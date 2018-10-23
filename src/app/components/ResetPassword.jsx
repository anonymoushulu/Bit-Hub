import React, {Component} from 'react';
import {Form, Card, Input, Button} from 'antd';
import auth from "../services/auth/auth";
import {Link} from 'react-router-dom'

const FormItem = Form.Item;

class ResetPassword extends Component {

    state = {
        confirmDirty: false
    };

    constructor(props) {
        super(props);
        this.Auth = new auth();
        this.state = {
            redirect: false
        }
    }

    setStatusMessage = (message) => {
        console.log(message);
        this.setState({statusMessage: {type: message.type, message: message.message}});
    }

    renderStatusMessage() {
        if (this.state.statusMessage) {
            if (this.state.statusMessage.type === 'error') {
                return (
                    <div className="alert alert-danger">
                        <span>{this.state.statusMessage.message}</span>
                    </div>
                )
            } else {
                return (
                    <div className="alert alert-success">
                        <span>{this.state.statusMessage.message}</span>
                    </div>
                )
            }
        }
    }

    handleSubmit = (e) => {
        e.preventDefault();
        
        const url = window.location.href.toString();
        const checkToken = url.substring(url.length-40);

        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.Auth.resetPassword(values.password, checkToken)
                    .then(res => {
                        this.setStatusMessage({type: 'success', message: res.message.toString()})
                    })
                    .catch(err => {
                        this.setStatusMessage({type: 'error', message: err.toString()})
                    })
            }
        });
    }

    handleConfirmBlur = (e) => {
        const value = e.target.value;
        this.setState({confirmDirty: this.state.confirmDirty || !!value});
    }

    compareToFirstPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && value !== form.getFieldValue('password')) {
            callback('Passwords must be identical.');
        } else {
            callback();
        }
    }

    validateToNextPassword = (rule, value, callback) => {
        const form = this.props.form;
        if (value && this.state.confirmDirty) {
            form.validateFields(['confirm'], {force: true});
        }
        callback();
    }

    render() {

        const {getFieldDecorator} = this.props.form;
        const tailFormItemLayout = {
            wrapperCol: {
                xs: {
                    span: 24,
                    offset: 0,
                },
                sm: {
                    span: 11,
                    offset: 6,
                },
            },
        };

        return (
            <div>
                <Card className="landing-card"  title="Reset Password">
                    <Form onSubmit={this.handleSubmit} className="change-password">
                        <FormItem>
                            {getFieldDecorator('password', {
                                rules: [{
                                    required: true, message: 'Please fill in this field.',
                                }, {
                                    validator: this.validateToNextPassword,
                                }],
                            })(
                                <Input type="password" placeholder="New Password"/>
                            )}
                        </FormItem>
                        <FormItem>
                            {getFieldDecorator('confirm', {
                                rules: [{
                                    required: true, message: 'Please confirm your password.',
                                }, {
                                    validator: this.compareToFirstPassword,
                                }],
                            })(
                                <Input type="password" onBlur={this.handleConfirmBlur} placeholder="Confirm New Password"/>
                            )}
                        </FormItem>
                        <FormItem {...tailFormItemLayout}>
                            <Button type="primary" htmlType="submit">Update Password</Button>
                        </FormItem>
                        <div className="p-4">
                            <div className="hint-text small"> Successfully Reset? <Link to='/login'>Login</Link> </div>
                        </div>
                        {this.renderStatusMessage()}
                    </Form>
                </Card>
            </div>
        );
    }
}

export default Form.create()(ResetPassword);