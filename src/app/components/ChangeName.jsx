import React, {Component} from 'react';
import {Form, Card, Input, Button} from 'antd';
import auth from "../services/auth/auth";
import {Link} from 'react-router-dom';

const FormItem = Form.Item;

class ChangeName extends Component {

  state = {
    confirmDirty: false
  };

  constructor(props) {
    super(props);
    this.Auth = new auth();
    const profile = this.Auth.getProfile();

    this.state = {
      email: profile.email,
      name: profile.name,
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
    const email = this.state.email;
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.Auth.changeName(values.NewName, email)
          .then(res => {
            this.setStatusMessage({type: 'success', message: res.message.toString()})
          })
          .catch(err => {
            this.setStatusMessage({type: 'error', message: err.toString()})
          })
      }
    });
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
        <Card className="page-header">
          <h3>User Profile</h3>
        </Card>

        <Card style={{width: '40%', margin: '0 auto'}} title="Change Name" extra={<Link to="/profile">Back</Link>}>
          <Form onSubmit={this.handleSubmit} className="change-name">
            <FormItem>
              {getFieldDecorator('NewName', {
                rules: [{required: true, message: 'Please fill in this field.'}],
              })(
                <Input type="text" placeholder="New User Name"/>
              )}
            </FormItem>

            <FormItem {...tailFormItemLayout}>
              <Button type="primary" htmlType="submit">Update Name</Button>
            </FormItem>
            {this.renderStatusMessage()}
          </Form>
        </Card>
      </div>
    );
  }
}

export default Form.create()(ChangeName);