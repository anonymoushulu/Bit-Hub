import React, {Component} from 'react';
import {Card, Icon, Avatar} from 'antd';
import auth from "../services/auth/auth";
import {Link} from 'react-router-dom';

class UserProfile extends Component {

  constructor(props) {
    super(props);
    this.Auth = new auth();
    const profile = this.Auth.getProfile();

    this.state = {
      email: profile.email,
      name: profile.name,
      photo: profile.photo,
      createdAt: profile.createdAt,
      provider:profile.provider,
      redirect: false
    }

  }

  render(){

    //display local-login user profile
    if(this.state.provider === 'local'){

      return(

        <div>
          <Card className="page-header">
            <h3>User Profile</h3>
          </Card>
          <Card style={{width: '40%', margin: '0 auto'}} actions={[<Link to="/change-password"><Icon type="unlock"/></Link>, <Link to="/change-name"><Icon type="edit"/></Link>]}>
            <div className="user-profile">
              <div className="user-details">
                <div className="user-avatar">
                  <Avatar className="user-avatar-circle" style={{ backgroundColor: '#f79925'}}>
                    {this.state.name[0].toUpperCase()}
                  </Avatar>
                </div>
                <div className="user-summary">
                  <div className="full-name">{this.state.name}</div>
                  <div className="user-email">{this.state.email}</div>
                  <div className="user-joined">joined {this.state.createdAt}</div>
                  <div className="user-type">from {this.state.provider}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }
    //display social-login user profile
    else{
      return(

        <div>
          <Card className="page-header">
            <h3>User Profile</h3>
          </Card>
          <Card style={{width: '40%', margin: '0 auto'}}>
            <div className="user-profile">
              <div className="user-details">
                <div className="user-avatar">
                  <Avatar className="user-avatar-circle" shape="circle" size="large" icon="user" src={this.state.photo}/>
                </div>
                <div className="user-summary">
                  <div className="full-name">{this.state.name}</div>
                  <div className="user-email">{this.state.email}</div>
                  <div className="user-joined">joined {this.state.createdAt}</div>
                  <div className="user-type">from {this.state.provider}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

  }
}

export default UserProfile;