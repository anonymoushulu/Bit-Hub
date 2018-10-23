import React, {Component} from 'react';
import {Card} from 'antd';
import {Link} from 'react-router-dom';

import Login from "../components/Login.jsx"
import Register from "../components/Register.jsx"
import Forgot from "../components/forgotPassword.jsx"

class LandingPage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      url: this.props.match.url,
      login: false,
      register: false,
      forgot: false,
      statusMessage: ''
    }
  }

  componentDidMount() {
    this.checkUrl(this.state.url)
  }

  componentWillReceiveProps(newProps) {
    this.checkUrl(newProps.match.url)

    if (this.state.statusMessage.type === 'error') {
      this.setState({statusMessage: ''})
    }
  }

  checkUrl(url) {
    if (url === '/register') {
      this.setState({
        login: false,
        register: true,
        forgot: false
      })
    }
    else if(url === '/forgot') {
      this.setState({
        login: false,
        register: false,
        forgot: true
      })
    }
    else{
      this.setState({
        login: true,
        register: false,
        forgot: false
      })
    }
  }

  setStatusMessage = (message) => {
    this.setState({statusMessage: {type: message.type, message: message.message}});
  }

  renderForm() {
    if (this.state.login) {
      return (
        <Login setStatusMessage={this.setStatusMessage}/>
      )
    }
    else if(this.state.forgot) {
      return(
        <Forgot setStatusMessage={this.setStatusMessage}/>
      )
    }
    else {
      return (
        <Register setStatusMessage={this.setStatusMessage}/>
      )
    }
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

  render() {
    return (
      <Card className="landing-card">
        <Link to="/">
          <div id="logo" className="p-4">
            <img alt="logo" className="login-logo" src='../../public/assets/logo.png'/>
            <h1 className="login-logo-title">Bitcoin Hub</h1>
          </div>
        </Link>
        {this.renderStatusMessage()}
        {this.renderForm()}
      </Card>
    );
  }
}

export default LandingPage;