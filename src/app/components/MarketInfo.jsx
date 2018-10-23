import React, {Component} from 'react';
import {Row, Col, Card} from 'antd';
import io from "socket.io-client";

class MarketInfo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      socketStatusColour: '#c2c2c2',
      green: '#016d15',
      red: '#d20000',
      channel: this.props.ticker,
      lastPrice: {value: 0, colour: 0},
      volume: {value: 0, colour: 0},
      high: {value: 0, colour: 0},
      low: {value: 0, colour: 0},
      dailyChange: {value: 0},
      dailyChangePerc: {value: 0, colour: 0}
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
        lastPrice: {value: 0, colour: 0},
        volume: {value: 0, colour: 0},
        high: {value: 0, colour: 0},
        low: {value: 0, colour: 0},
        dailyChange: {value: 0, colour: 0},
        dailyChangePerc: {value: 0, colour: 0}
      }, () => {
        this.renderComponent()
      })
    }
  }

  renderComponent() {
    this.socket.emit('channel', this.state.channel)

    this.socket.on(this.state.channel, data => {

      const lastPrice = (Math.round(data[0].lastPrice * 100) / 100).toFixed(2)
      const volume = (Math.floor(data[0].volume * 100) / 100).toFixed(2)
      const high = (Math.floor(data[0].high * 100) / 100).toFixed(2)
      const low = (Math.floor(data[0].low * 100) / 100).toFixed(2)
      const dailyChange = (data[0].dailyChange).toFixed(2)
      const dailyChangePerc = (data[0].dailyChangePerc).toFixed(2)

      this.setState(state => {
        //console.log(lastPrice)
        //console.log(state.lastPrice.value)
        if (lastPrice !== state.lastPrice.value) {
          return lastPrice >= state.lastPrice.value
            ? {lastPrice: {value: lastPrice, colour: this.state.green}}
            : {lastPrice: {value: lastPrice, colour: this.state.red}}
        }
      })

      this.setState(state => {
        if (volume !== state.volume.value) {
          return volume > state.volume.value
            ? {volume: {value: volume, colour: this.state.green}}
            : {volume: {value: volume, colour: this.state.red}}
        }
      })

      this.setState(state => {
        if (high !== state.high.value) {
          return high > state.high.value
            ? {high: {value: high, colour: this.state.green}}
            : {high: {value: high, colour: this.state.red}}
        }
      })

      this.setState(state => {
        if (low !== state.low.value) {
          return low > state.low.value
            ? {low: {value: low, colour: this.state.green}}
            : {low: {value: low, colour: this.state.red}}
        }
      })

      dailyChange <= 0
        ? this.setState({dailyChangePerc: {value: dailyChangePerc, colour: this.state.red}})
        : this.setState({dailyChangePerc: {value: dailyChangePerc, colour: this.state.green}})

      this.setState({dailyChange: {value: dailyChange}})

    })
  }
  
  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    return (
      <Card className="page-header">
        <Row>
          <Col xl={{span: 6}} xxl={{span: 5}} xs={{span: 8}}>
            <h1
              style={{display: 'inline'}}>{this.props.exchange}::</h1>
            <h3 style={{display: 'inline', lineHeight: '30px'}}>{this.props.market}</h3>
          </Col>

          <Col className="market-info-card" xl={{span: 3}} xs={{span: 16}}>
            <h5 style={{color: this.state.lastPrice.colour}}>{this.state.lastPrice.value}</h5>
          </Col>

          <Col className="market-info-card" xl={{span: 3}} xs={{span: 6}}>
            <h6>24H VOL</h6>
            <h6 style={{color: this.state.volume.colour}}>{this.state.volume.value} BTC</h6>
          </Col>

          <Col className="market-info-card" xl={{span: 3}} xs={{span: 6}}>
            <h6>24H HIGH</h6>
            <h6 style={{color: this.state.high.colour}}>{this.state.high.value}</h6>
          </Col>

          <Col className="market-info-card" xl={{span: 3}} xs={{span: 6}}>
            <h6>24H LOW</h6>
            <h6 style={{color: this.state.low.colour}}>{this.state.low.value}</h6>
          </Col>

          <Col className="market-info-card" xl={{span: 3}} xs={{span: 6}}>
            <h6>24H CHANGE</h6>
            <h6
              style={{color: this.state.dailyChangePerc.colour}}>{this.state.dailyChange.value} ({this.state.dailyChangePerc.value}%)</h6>
          </Col>

          <Col xl={{span: 3}} xxl={{span: 4}} xs={{span: 24}}>
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

export default MarketInfo;