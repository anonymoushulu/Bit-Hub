import React, {Component} from 'react';
import {Row, Col, Card} from 'antd';
import io from "socket.io-client";
import NumberFormat from 'react-number-format';

class BlockchainStats extends Component {

  constructor(props) {
    super(props);
    this.state = {
      socketStatusColour: '#c2c2c2',
      green: '#016d15',
      red: '#d20000',
      channel: this.props.ticker,
      block: {
        height: 0,
        foundBy: {
          description: 'N/A',
          link: '/home/#'
        }
      },
      blocksMined: 0,
      btcMined: 0,
      minutesBetweenBlocks: 0,
      difficulty: 0,
      hashRate: 0,
      totalBtc: 0,
      totalFeesBtc: 0,
      transactions: 0,
      totalBtcSent: 0,
      estimatedBtcSent: 0,
      estimatedUsdSent: 0,
      minerRevenueBtc: 0,
      minerRevenueUsd: 0,
      tradeVolumeBtc: 0,
      tradeVolumeUsd: 0
    }

  }

  componentDidMount() {
    this.socket = io.connect('/stats', {reconnect: true});

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
        channel: newProps.ticker
      }, () => {
        this.renderComponent()
      })
    }
  }

  renderComponent() {
    this.socket.emit('channel', this.state.channel)

    this.socket.on(this.state.channel, data => {
      if (data[0].block) {
        this.setState({
          block: data[0].block,
          blocksMined: data[0].blocksMined,
          btcMined: data[0].btcMined,
          minutesBetweenBlocks: data[0].minutesBetweenBlocks,
          difficulty: data[0].difficulty,
          hashRate: data[0].hashRate,
          totalBtc: data[0].totalBtc,
          totalFeesBtc: data[0].totalFeesBtc,
          transactions: data[0].transactions,
          totalBtcSent: data[0].totalBtcSent,
          estimatedBtcSent: data[0].estimatedBtcSent,
          estimatedUsdSent: data[0].estimatedUsdSent,
          minerRevenueBtc: data[0].minerRevenueBtc,
          minerRevenueUsd: data[0].minerRevenueUsd,
          tradeVolumeBtc: data[0].tradeVolumeBtc,
          tradeVolumeUsd: data[0].tradeVolumeUsd
        })
      } else if (data[0].blocksMined) {
        this.setState({
          blocksMined: data[0].blocksMined,
          btcMined: data[0].btcMined,
          minutesBetweenBlocks: data[0].minutesBetweenBlocks,
          difficulty: data[0].difficulty,
          hashRate: data[0].hashRate,
          totalBtc: data[0].totalBtc,
          totalFeesBtc: data[0].totalFeesBtc,
          transactions: data[0].transactions,
          totalBtcSent: data[0].totalBtcSent,
          estimatedBtcSent: data[0].estimatedBtcSent,
          estimatedUsdSent: data[0].estimatedUsdSent,
          minerRevenueBtc: data[0].minerRevenueBtc,
          minerRevenueUsd: data[0].minerRevenueUsd,
          tradeVolumeBtc: data[0].tradeVolumeBtc,
          tradeVolumeUsd: data[0].tradeVolumeUsd
        })
      }
    })
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    return (
      <div style={{whiteSpace: 'nowrap'}}> 
        <Row gutter={16}>

          <Col className='padding-bottom' xl={{span: 8}} xs={{span: 24}}>
            <Card style={{height: '270px'}}
                  title={<div style={{display: 'inline-flex'}}>
                    <h6>Block Summary (24h)</h6>
                  </div>}
                  extra={<div>
                    <span className='realtimeIndicator ' style={{backgroundColor: this.state.socketStatusColour}}></span>
                    <span>real-time</span>
                  </div>}
            >
              <Row type="flex" align="middle" justify="center" style={{padding: '20px'}}>
                <Col>
                  <h4>
                    <NumberFormat value={this.state.block.height} displayType={'text'} thousandSeparator={true}/> Blocks
                  </h4>
                </Col>
              </Row>

              <div style={{fontSize: '0.9em'}}>
                <Row>
                  <Col span={12}>
                    Blocks Mined
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b>{this.state.blocksMined}</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Bitcoin Mined
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b>{this.state.btcMined}</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Time Between Blocks
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b>{this.state.minutesBetweenBlocks} minutes</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Last Block Found by
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <a href={this.state.block.foundBy.link}><b>{this.state.block.foundBy.description}</b></a>
                  </Col>
                </Row>
              </div>
              
              <div style={{float: 'right', color: 'grey', paddingTop: '8px'}}>
                <small>Data Provided by Blockchain.com</small>
              </div>

            </Card>
          </Col>

          <Col className='padding-bottom' xl={{span: 8}} xs={{span: 24}}>
            <Card style={{height: '270px'}}
                  title={<div style={{display: 'inline-flex'}}>
                    <h6>Transaction Summary (24h)</h6>
                  </div>}
                  extra={<div>
                    <span className='realtimeIndicator ' style={{backgroundColor: this.state.socketStatusColour}}></span>
                    <span>real-time</span>
                  </div>}
            >

              <Row type="flex" align="middle" justify="center" style={{padding: '20px'}}>
                <Col>
                  <h4>
                    <NumberFormat value={this.state.transactions} displayType={'text'} thousandSeparator={true}/> Transactions
                  </h4>
                </Col>
              </Row>

              <div style={{fontSize: '0.9em'}}>
                <Row>
                  <Col span={12}>
                    Total Transaction Fees
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b>{this.state.totalFeesBtc.toFixed(2)} BTC</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Total Output Volume
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b><NumberFormat value={this.state.totalBtcSent.toFixed(2)} displayType={'text'} thousandSeparator={true}/> BTC</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Estimated Transaction Volume
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b><NumberFormat value={this.state.estimatedBtcSent.toFixed(2)} displayType={'text'} thousandSeparator={true}/> BTC</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b>(<NumberFormat value={this.state.estimatedUsdSent.toFixed(2)} displayType={'text'} thousandSeparator={true}/> USD)</b>
                  </Col>
                </Row>
              </div>

              <div style={{float: 'right', color: 'grey', paddingTop: '8px'}}>
                <small>Data Provided by Blockchain.com</small>
              </div>
              
            </Card>
          </Col>

          <Col className='padding-bottom' xl={{span: 8}} xs={{span: 24}}>
            <Card style={{height: '270px'}}
                  title={<div style={{display: 'inline-flex'}}>
                    <h6>Mining Summary (24h)</h6>
                  </div>}
                  extra={<div>
                    <span className='realtimeIndicator ' style={{backgroundColor: this.state.socketStatusColour}}></span>
                    <span>real-time</span>
                  </div>}
            >

              <Row type="flex" align="middle" justify="center" style={{padding: '20px'}}>
                <Col>
                  <h4>
                    <NumberFormat value={this.state.minerRevenueUsd.toFixed(2)} displayType={'text'} thousandSeparator={true}/> USD Revenue
                  </h4>
                </Col>
              </Row>

              <div style={{fontSize: '0.9em'}}>
                <Row>
                  <Col span={12}>
                    Miner Revenue
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b><NumberFormat value={this.state.minerRevenueBtc} displayType={'text'} thousandSeparator={true}/> BTC</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Difficulty
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b><NumberFormat value={this.state.difficulty} displayType={'text'} thousandSeparator={true}/></b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Hash Rate
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b><NumberFormat value={this.state.hashRate.toFixed(2)} displayType={'text'} thousandSeparator={true}/> GH/s</b>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    Left to Mine
                  </Col>
                  <Col style={{textAlign: 'right'}} span={12}>
                    <b><NumberFormat value={21000000 - this.state.totalBtc} displayType={'text'} thousandSeparator={true}/> BTC</b>
                  </Col>
                </Row>
                
              </div>

              <div style={{float: 'right', color: 'grey', paddingTop: '8px'}}>
                <small>Data Provided by Blockchain.com</small>
              </div>
              
            </Card>
          </Col>

        </Row>
      </div>
    );
  }
}

export default BlockchainStats;