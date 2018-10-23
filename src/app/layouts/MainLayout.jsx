import React from 'react';
import {Layout, Menu, Icon, Avatar, Col} from 'antd';
import {Link} from 'react-router-dom';
import UserMenu from '../components/UserMenu.jsx'

const SubMenu = Menu.SubMenu;
const {Header, Content, Footer, Sider} = Layout;
const parent = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'row'
}
const right = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
}

class MainLayout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: true,
      theme: 'light'
    };
  }

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  }

  render() {
    return (
      <Layout style={parent}>

        <Sider
          trigger={null}
          collapsible
          collapsed={this.state.collapsed}
          theme={this.state.theme}
          width={225}
        >
          <div className="logo">
              <Link to='/'>
                <Avatar shape="circle" size="large" src='../../public/assets/logo.png'/>
                <h5>Bitcoin Hub</h5>
              </Link>
          </div>
          <Menu theme={this.state.theme} mode="inline">
            <Menu.Item>
              <Link to='/home'>
                <Avatar shape="circle" size="medium" src="../../public/assets/currencies/bitcoin.png"/>
                <span className="nav-text">Dashboard</span>
              </Link>
            </Menu.Item>

            <Menu.Divider>
            </Menu.Divider>
            
            <SubMenu
              title={<span>
                <Avatar shape="circle" size="medium" src="../../public/assets/exchanges/bitfinex.png"/>
                <span className="nav-text">Bitfinex</span>
              </span>}
            >
              <Menu.Item><Link to='/markets/bitfinex/btcusd'>BTC/USD</Link></Menu.Item>
            </SubMenu>
            
            <SubMenu
              title={<span>
                       <Avatar shape="circle" size="medium" src="../../public/assets/exchanges/hitbtc.png"/>
                       <span className="nav-text">HitBTC</span>
                     </span>}
            >
              <Menu.Item><Link to='/markets/hitbtc/btcusd'>BTC/USD</Link></Menu.Item>
            </SubMenu>
            
          </Menu>
        </Sider>

        <Layout style={right}>
          <Header style={{background: '#f79925', padding: 0}}>
            <Col span={12}>
              <Icon
                className="trigger"
                type={this.state.collapsed ? 'menu-unfold' : 'menu-fold'}
                onClick={this.toggle}
              />
            </Col>
            <Col span={5} offset={7}>
              <UserMenu/>
            </Col>
          </Header>
          <Content>
            <div>
              {this.props.children}
            </div>
          </Content>
          <Footer style={{textAlign: 'center', height: '50px', lineHeight: '0'}}>
            Copyright © 2018 COMP5703CP225. All rights reserved.
          </Footer>
        </Layout>


      </Layout>
    );
  }
}

export default MainLayout;