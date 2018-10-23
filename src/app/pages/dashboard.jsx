import React, {Component} from 'react';
import Coinmarketcap from '../components/Coinmarketcap.jsx'
import PriceLineChart from '../components/PriceLineChart/index.js';
import CompareTable from '../components/CompareTable.jsx';
import BlockchainStats from '../components/BlockchainStats.jsx'
import {Row, Col} from 'antd';

class DashboardPage extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id='dashboard'>
        <Coinmarketcap exchange='coinmarketcap' market='Bitcoin' ticker='coinmarketcap:BTCUSD'
                       icon='../../public/assets/currencies/bitcoin.png'/>
        <div className={"content-wrapper"}>
          <Row>
            <BlockchainStats ticker='blockchaindotcom:BTC'/>
          </Row>
          <Row gutter={16}>
            <Col className='padding-bottom' xl={{span: 16}} xs={{span: 24}}>
              <PriceLineChart/>
            </Col>
            <Col className='padding-bottom' xl={{span: 8}} xs={{span: 24}}>
              <CompareTable/>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

export default DashboardPage;