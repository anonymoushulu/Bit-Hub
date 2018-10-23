import React, {Component} from 'react';
import { Form, Input, Button } from 'antd';
import auth from "../services/auth/auth";

import { Link, Redirect } from 'react-router-dom'

const FormItem = Form.Item;

class LoginForm extends Component {

  state = {
    confirmDirty: false
  };

  constructor(props){
    super(props);
    this.Auth = new auth();
    this.state = {
      redirectLogin: false
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.Auth.register(values.name, values.email, values.password)
          .then(res => {
            this.props.setStatusMessage({type: 'success', message: res.message.toString()})
            this.setState({ redirectLogin: true })
          })
          .catch(err => {
            this.props.setStatusMessage({type: 'error', message: err.toString()})
          })
      }
    });
  }

  handleConfirmBlur = (e) => {
    const value = e.target.value;
    this.setState({ confirmDirty: this.state.confirmDirty || !!value });
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
      form.validateFields(['confirm'], { force: true });
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

    if (this.state.redirectLogin) {
      return <Redirect to='/login'/>
    } else {
      return (
        <div className="login-form">
          <Form onSubmit={this.handleSubmit}>
            <FormItem>
              {getFieldDecorator('name', {
                rules: [{}, {
                  required: true, message: 'Please fill in this field.',
                }],
              })(
                <Input placeholder="Full Name" />
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('email', {
                rules: [{
                  type: 'email', message: 'Please input a valid email address.',
                }, {
                  required: true, message: 'Please fill in this field.',
                }],
              })(
                <Input placeholder="Email Address" />
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('password', {
                rules: [{
                  required: true, message: 'Please fill in this field.',
                }, {
                  validator: this.validateToNextPassword,
                }],
              })(
                <Input type="password" placeholder="Password" />
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
                <Input type="password" onBlur={this.handleConfirmBlur} placeholder="Confirm Password" />
              )}
            </FormItem>
            <FormItem {...tailFormItemLayout}>
              <Button type="primary" htmlType="submit">Register</Button>
            </FormItem>
          </Form>
          <div className="p-4">
            <div className="hint-text small"> Already have an account?  <Link to='/login'>Login</Link> </div>
          </div>
        </div>
      );
    }
  }
}

export default Form.create()(LoginForm);