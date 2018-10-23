import React from 'react';
import jwt from 'jsonwebtoken';

class Auth {
  constructor() {
    this.domain = window.location.protocol + "//" +  window.location.host
    this.fetch = this.fetch.bind(this)
    this.login = this.login.bind(this)
    this.getProfile = this.getProfile.bind(this)
    this.changeUserPassword = this.changeUserPassword.bind(this)
    this.changeName = this.changeName.bind(this)
    this.forgotPassword = this.forgotPassword.bind(this)
    this.resetPassword = this.resetPassword.bind(this)
  }

  login(email, password) {
    return this.fetch(`${this.domain}/api/auth/localAuth`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password
      })
    }).then(res => {
      this.setToken(res.token)
      return Promise.resolve(res);
    })
  }

  register(name, email, password) {
    return this.fetch(`${this.domain}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password
      })
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  changeUserPassword(OldPassword, password, email) {
    return this.fetch(`${this.domain}/api/auth/changeUserPassword`, {
      method: 'POST',
      body: JSON.stringify({
        OldPassword,
        password,
        email
      })
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  changeName(NewName, email) {
    return this.fetch(`${this.domain}/api/auth/changeName`, {
      method: 'POST',
      body: JSON.stringify({
        NewName,
        email
      })
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  forgotPassword(email) {
    return this.fetch(`${this.domain}/api/auth/forgotPassword`, {
      method: 'POST',
      body: JSON.stringify({
        email
      })
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  resetPassword(password, checkToken) {
    return this.fetch(`${this.domain}/api/auth/resetPassword`, {
      method: 'POST',
      body: JSON.stringify({
        password,
        checkToken
      })
    }).then(res => {
      return Promise.resolve(res);
    })
  }

  loggedIn() {
    const token = this.getToken() 
    return !!token && !this.isTokenExpired(token)
  }

  isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded.exp < Date.now() / 1000
    } catch (err) {
      return false;
    }
  }

  setToken(idToken) {
    localStorage.setItem('id_token', idToken)
  }

  getToken() {
    return localStorage.getItem('id_token')
  }

  logout() {
    localStorage.removeItem('id_token');
  }

  getProfile() {
    return jwt.decode(this.getToken());
  }


  fetch(url, options) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
    
    if (this.loggedIn()) {
      headers['Authorization'] = 'Bearer ' + this.getToken()
    }

    return fetch(url, { headers, ...options })
      .then(res => {
        if(res.ok) {
          return res.json()
        }
        return res.json().then(res => { throw new Error(res.message) })
      })
  }
}

          
export default Auth;