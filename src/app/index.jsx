import React from 'react';
import {render} from 'react-dom';
import {Switch, Redirect, Route, BrowserRouter as Router} from 'react-router-dom';
import './../scss/main.scss';

import auth from './services/auth/auth'

import VideoLayout from './layouts/VideoLayout.jsx';
import BlankLayout from './layouts/BlankLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';

import landing from './pages/landing.jsx';
import socialLogin from './components/SocialLogin.jsx';

import dashboard from './pages/dashboard.jsx';
import exchangeMarket from './pages/exchangeMarket.jsx';
import UserProfile from './components/UserProfile.jsx';
import ChangePassword from './components/ChangePassword.jsx';
import ChangeUserName from './components/ChangeName.jsx';
import ResetPassword from './components/ResetPassword.jsx';

const Auth = new auth();

const AppRoute = ({ component: Component, layout: Layout, ...rest }) => (
  <Route {...rest} render={props => (
    <Layout>
      <Component {...props} />
    </Layout>
  )} />
)
const ProtectedRoute = ({ component: Component, layout: Layout, ...rest}) => (
  <Route {...rest} render={props => (
    Auth.loggedIn() === true
      ? <Layout> <Component {...props} /> </Layout>
      : <Redirect to='/login' />
  )} />
)

class App extends React.Component {

  componentDidMount() {
    this.state = {success: null, error: null};
  }

  render () {
    return (
      <Router>
        <Switch>
          <ProtectedRoute exact path="/home" layout={MainLayout} component={dashboard} market='test'/>

          <ProtectedRoute exact path="/markets/:exchange/:market" layout={MainLayout} component={exchangeMarket} />

          <ProtectedRoute exact path="/profile" layout={MainLayout} component={UserProfile} />

          <ProtectedRoute exact path="/change-password" layout={MainLayout} component={ChangePassword} />

          <ProtectedRoute exact path="/change-name" layout={MainLayout} component={ChangeUserName} />

          <AppRoute exact path="/social-login" layout={BlankLayout} component={socialLogin} />

          <AppRoute exact path="/resetPassword/:resetString" layout={BlankLayout} component={ResetPassword} />

          <AppRoute path="/(login|register|forgot)/" layout={BlankLayout} component={landing} />
          <AppRoute path="/" layout={BlankLayout} component={landing} />
          
        </Switch>
      </Router>
    )
  }
}

render(<App/>, document.getElementById('root'));
