import React, {Component} from 'react';
import { Redirect } from 'react-router-dom'

class SocialLogin extends Component {

  constructor(props) {
    super(props);
    this.state = {valid: false}
  }

  componentDidMount(){
    const query = new URLSearchParams(this.props.location.search)
    
    let token = query.get('token')
    //console.log(token)

    if (token) {  
      localStorage.setItem('id_token', token)
      this.setState({valid: true})
    }
  }

  render() {
    if (this.state.valid) {
      return <Redirect to='/home' />
    } else {
      return <Redirect to='/login' />
    }
  }
}

export default SocialLogin;