import React from 'react';
import { Redirect } from 'react-router-dom'
import {Row, Col} from 'antd';

import exchanges from '../../../exchanges'

import MarketInfo from '../components/MarketInfo.jsx'
import CandleChart from '../components/CandleMACD/index.js';

import OrderBook from '../components/OrderBook.jsx';
import MarketDepth from '../components/MarketDepth.jsx';

class ExchangeMarketPage extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {
      valid: false,
      redirect: false
    }
    
  }

  componentDidMount() {
    this.setParams(this.props.match.params.exchange, this.props.match.params.market)
  }

  componentWillReceiveProps(newProps) {
    //console.log(newProps.match.params.exchange)
    //console.log(newProps.match.params.market)
    
    if (newProps.match.params.exchange !== this.state.exchangeEdges && newProps.match.params.market !== this.state.market) {
      this.setParams(newProps.match.params.exchange, newProps.match.params.market)
    }
  }
  
  setParams(exchange, market) {
    
    if (exchanges.hasOwnProperty(exchange)) {
      if ((exchanges[exchange]['markets']).hasOwnProperty(market)) {
        
        this.setState({
          exchangeName: exchanges[exchange]['name'],
          marketName: exchanges[exchange]['markets'][market]['name'],
          ticker: exchanges[exchange]['markets'][market]['ticker'],
          channels: exchanges[exchange]['markets'][market]['channels'],
          channel: exchanges[exchange]['markets'][market]['channels'][1], // default 15m
          valid: true
        })

      } else {
        this.setState({redirect:true})
      }
    } else {
      this.setState({redirect:true})
    }
  }

  setChannel = (channel) => {
    this.setState({channel: channel});
  }
  
  renderPage() {
    if (this.state.valid) {
      return (
        <div>
          <MarketInfo exchange={this.state.exchangeName} market={this.state.marketName} ticker={this.state.ticker}/>
          <div className='content-wrapper'>
            <div className='padding-bottom'>
              <CandleChart channels={this.state.channels} channel={this.state.channel} 
                           market={this.state.marketName} ticker={this.state.ticker}
                           setChannel={this.setChannel}
              />
            </div>
            <Row gutter={16}>
              <Col className='padding-bottom' xl={{span: 24}} xs={{span: 12}}>
                <MarketDepth channel={this.state.ticker} />
              </Col>
              <Col style={{height: '610px'}} className='padding-bottom' xl={{span: 24}} xs={{span: 24}}>
                <OrderBook channel={this.state.ticker} />
              </Col>
            </Row>
          </div>
        </div>
      )
    }
  }
  
  render() {
    if (this.state.redirect) {
      return <Redirect to='/' />
    } else {
      return (
        <div>
          {this.renderPage()}
        </div>
      );
    }
  }
}

export default ExchangeMarketPage;     