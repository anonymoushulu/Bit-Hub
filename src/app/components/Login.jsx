import React, {Component} from 'react';
import { Form, Icon, Input, Button, Divider } from 'antd';
import auth from "../services/auth/auth";

import { Link, Redirect } from 'react-router-dom'

const FormItem = Form.Item;

class Login extends Component {

  constructor(props){
    super(props);
    this.Auth = new auth();
    this.state = {
      redirectLoginSuccess:false
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();

    this.props.form.validateFields((err, values) => {
      if (!err) {

        this.Auth.login(values.email, values.password)
          .then(() => {
            this.setState({ redirectLoginSuccess: true })
          })
          .catch(err => {
            this.props.setStatusMessage({type: 'error', message: err.toString()})
          })
      }
    });
  }

  render() {
    const {getFieldDecorator} = this.props.form;
    if (this.Auth.loggedIn()) {
      return <Redirect to='/home' />
    } else if (this.state.redirectLoginSuccess) {
      return <Redirect to='/home' />
    } else {
      return (
        <div className="login-form">
          <Form onSubmit={this.handleSubmit}>
            <FormItem>
              {getFieldDecorator('email', {
                rules: [{required: true, message: 'Please fill in this field.'}],
              })(
                <Input prefix={<Icon type="user" style={{color: 'rgba(0,0,0,.25)'}}/>} placeholder="Email"/>
              )}
            </FormItem>
            <FormItem>
              {getFieldDecorator('password', {
                rules: [{required: true, message: 'Please fill in this field.'}],
              })(
                <Input prefix={<Icon type="lock" style={{color: 'rgba(0,0,0,.25)'}}/>} type="password"
                       placeholder="Password"/>
              )}
            </FormItem>
            <FormItem>
              <Button type="primary" htmlType="submit" className="login-form-button btn btn-success btn-block">
                Log in
              </Button>
            </FormItem>
          </Form>
          <Divider>Or</Divider>
          <div>
              <a href="/api/auth/github" className="btn btn-primary btn-block social-btn github-btn"><i className="fab fa-github social-btn-i"></i> Log in with GitHub</a>
              <a href="/api/auth/google" className="btn btn-primary btn-block social-btn google-btn"><i className="fab fa-google social-btn-i"></i> Log in with Google</a>
          </div>
          <div className="p-4">
            <div className="hint-text small"> Don't have an account? <Link to='/register'>Sign up</Link> </div>
            <div className="hint-text small"> <Link to='/forgot'>Forgot password</Link> </div>
          </div>
        </div>
      );
    }
  }
}

export default Form.create()(Login);