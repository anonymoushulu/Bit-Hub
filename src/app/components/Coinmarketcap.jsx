import React, {Component} from 'react';
import {Row, Col, Card, Avatar} from 'antd';
import io from "socket.io-client";
import NumberFormat from 'react-number-format';

class Coinmarketcap extends Component {

  constructor(props) {
    super(props);
    this.state = {
      socketStatusColour: '#c2c2c2',
      green: '#016d15',
      red: '#d20000',
      channel: this.props.ticker,
      price: {value: 0, colour: 0},
      dailyChangePerc: {value: 0, colour: 0},
      volume: {value: 0, colour: 0},
      circulatingSupply: {value: 0, colour: 0},
      maxSupply: {value: 0, colour: 0},
      marketCap: {value: 0, colour: 0}
    }
  }

  componentDidMount() {
    this.socket = io.connect('/ticker', {reconnect: true},);

    this.socket.on('connect', () => {
      this.setState({
        socketStatusColour: '#136e00'
      })
      this.renderComponent()
    });

    this.socket.on('disconnect', () => {
      this.setState({
        socketStatusColour: '#800a00'
      })
    });
  }

  componentWillReceiveProps(newProps) {
    if (newProps.ticker !== this.state.channel) {
      this.socket.emit('leave', this.state.channel);

      this.setState({
        channel: newProps.ticker,
        price: {value: 0, colour: 0},
        dailyChangePerc: {value: 0, colour: 0},
        volume: {value: 0, colour: 0},
        circulatingSupply: {value: 0, colour: 0},
        maxSupply: {value: 0, colour: 0},
        marketCap: {value: 0, colour: 0}
      }, () => {
        this.renderComponent()
      })
    }
  }

  renderComponent() {
    this.socket.emit('channel', this.state.channel)

    this.socket.on(this.state.channel, data => {

      const price = (Math.round(data[0].price * 100) / 100).toFixed(2)
      const dailyChangePerc = (data[0].dailyChangePerc).toFixed(2)
      const volume = (Math.floor(data[0].volume * 100) / 100).toFixed(2)
      const circulatingSupply = (data[0].circulatingSupply).toFixed(2)
      const maxSupply = (data[0].maxSupply).toFixed(2)
      const marketCap = (data[0].marketCap).toFixed(2)

      this.setState(() => {
        return dailyChangePerc >= 0
          ? {price: {value: price, colour: this.state.green}}
          : {price: {value: price, colour: this.state.red}}
      })

      this.setState({dailyChangePerc: {value: dailyChangePerc}})

      this.setState(state => {
        if (volume !== state.volume.value) {
          return volume > state.volume.value
            ? {volume: {value: volume, colour: this.state.green}}
            : {volume: {value: volume, colour: this.state.red}}
        }
      })
      
      this.setState(state => {
        if (marketCap !== state.marketCap.value) {
          return marketCap > state.marketCap.value
            ? {marketCap: {value: marketCap, colour: this.state.green}}
            : {marketCap: {value: marketCap, colour: this.state.red}}
        }
      })

      this.setState({circulatingSupply: {value: circulatingSupply}})

      this.setState({maxSupply: {value: maxSupply}})

    })
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    return (
      <Card className="page-header">
        <Row>
          <Col style={{whiteSpace: 'nowrap'}} xl={{span: 3}}  xs={{span: 8}}>
            <Avatar size={50} src={this.props.icon}/>
            <h2 style={{display: 'inline', verticalAlign: 'middle'}}>{this.props.market}</h2>
            <small style={{display: 'block', whiteSpace: 'normal', textAlign: 'center', color: 'grey'}}>Data Provided by Coinmarketcap.com</small>
          </Col>

          <Col className="market-info-card-dashboard" xl={{span: 4}} xs={{span: 16}}>
            <h5 style={{
              color: this.state.price.colour,
              height: '64px'
            }}>{this.state.price.value} ({this.state.dailyChangePerc.value}%)</h5>
          </Col>

          <Col className="market-info-card-dashboard" xl={{span: 4}} xs={{span: 12}}>
            <h6>Volume (24h)</h6>
            <h6 style={{color: this.state.volume.colour}}>
              <NumberFormat value={this.state.volume.value} displayType={'text'} thousandSeparator={true}/> USD
            </h6>
          </Col>

          <Col className="market-info-card-dashboard" xl={{span: 4}} xs={{span: 12}}>
            <h6>Market Cap</h6>
            <h6 style={{color: this.state.volume.colour}}>
              <NumberFormat value={this.state.marketCap.value} displayType={'text'} thousandSeparator={true}/> USD
            </h6>
          </Col>

          <Col className="market-info-card-dashboard" xl={{span: 4}} xs={{span: 12}}>
            <h6>Circulating Supply</h6>
            <h6>
              <NumberFormat value={this.state.circulatingSupply.value} displayType={'text'} thousandSeparator={true}/> BTC
            </h6>
          </Col>

          <Col className="market-info-card-dashboard" xl={{span: 4}} xs={{span: 12}}>
            <h6>Max Supply</h6>
            <h6>
              <NumberFormat value={this.state.maxSupply.value} displayType={'text'} thousandSeparator={true}/> BTC
            </h6>
          </Col>

          <Col xl={{span: 1}} xs={{span: 24}}>
            <div className='realtime-div'>
              <span className='realtimeIndicator ' style={{backgroundColor: this.state.socketStatusColour}}></span>
              <span>real-time</span>
            </div>
          </Col>
        </Row>
      </Card>
    );
  }
}

export default Coinmarketcap;