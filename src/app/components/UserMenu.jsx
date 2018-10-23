import React, {Component} from 'react';
import {Menu, Avatar} from 'antd';
import {Link, Redirect} from 'react-router-dom';
import auth from "../services/auth/auth";

const SubMenu = Menu.SubMenu;

class UserMenu extends Component {

  constructor(props) {
        super(props);
        this.Auth = new auth();
        const profile = this.Auth.getProfile();

        this.state = {
            email: profile.email,
            name: profile.name,
            photo: profile.photo,
            redirect: false
        }
    }
  
  handleLogout() {
    this.Auth.logout()
    this.setState({redirect: true})
  }

  render() {
    if (this.state.redirect) {
      return <Redirect to='/login'/>
    } else {
      return (
        <Menu
          mode="horizontal"
          id="user-menu"
        >
          <SubMenu title=
                     {<div id="full-name">
                       <Avatar shape="circle" size="large" src={this.state.photo} style={{ backgroundColor: '#f79925', color: '#314fa6', border: '1px solid #314fa6'}}>
                             {this.state.name[0].toUpperCase()}
                       </Avatar>
                       <span style={{padding: '10px', fontWeight: '600', color: '#314fa6'}}>{this.state.name}</span>
                     </div>}>
            <Menu.Item><Link to='/profile'>Profile</Link></Menu.Item>
            <Menu.Item onClick={() => this.handleLogout()}>Logout</Menu.Item>
          </SubMenu>
        </Menu>
      );
    }
  }
}

export default UserMenu;