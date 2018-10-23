import React, { Component } from 'react';
import { Card } from 'antd';
import io from "socket.io-client";
import LoadingAnimation from './LoadingAnimation.jsx';

const channels = ['bitfinex:BTCUSD', 'hitbtc:BTCUSD'];

class CompareTable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      socketStatusColour: '#c2c2c2',
      green: '#016d15',
      red: '#d20000'
    }
  }

  componentDidMount() {
    this.socket = io.connect('/ticker', { reconnect: true });

    this.socket.on('connect', () => {
      this.setState({
        socketStatusColour: '#136e00'
      })
      this.renderBitfinex();
      this.renderHitBTC();
    });

    this.socket.on('disconnect', () => {
      this.setState({
        socketStatusColour: '#800a00'
      })
    });
  }

  componentWillUnmount() {
    this.socket.close();
  }

  renderBitfinex() {
    this.socket.emit('channel', channels[0]);

    this.socket.on(channels[0], data => {
      const lastPrice = data[0].lastPrice.toFixed(2);
      const volume = data[0].volume.toFixed(2);
      const dailyChangePerc = data[0].dailyChangePerc.toFixed(2);
      const dailyChange = data[0].dailyChange.toFixed(2);

      if (!this.state.bitfinexLastPrice) { // initial
        this.setState({
          bitfinexLastPrice: { value: lastPrice, colour: this.state.green },
          bitfinexVolume: { value: volume, colour: this.state.green },
          bitfinexDailyChangePerc: { value: dailyChangePerc, colour: this.state.green },
          bitfinexDailyChange: dailyChange,
        })
      } else { // updating
        this.setState(state => { // update price
          if (lastPrice !== state.bitfinexLastPrice.value) {
            return lastPrice >= state.bitfinexLastPrice.value
              ? { bitfinexLastPrice: { value: lastPrice, colour: this.state.green } }
              : { bitfinexLastPrice: { value: lastPrice, colour: this.state.red } }
          }
        })
        this.setState(state => { // update volume
          if (volume !== state.bitfinexVolume.value) {
            return volume > state.bitfinexVolume.value
              ? { bitfinexVolume: { value: volume, colour: this.state.green } }
              : { bitfinexVolume: { value: volume, colour: this.state.red } }
          }
        })
        dailyChange <= 0
          ? this.setState({ bitfinexDailyChangePerc: { value: dailyChangePerc, colour: this.state.red } })
          : this.setState({ bitfinexDailyChangePerc: { value: dailyChangePerc, colour: this.state.green } })

        this.setState({ bitfinexDailyChange: dailyChange });
      }
    })
  }

  renderHitBTC() {
    this.socket.emit('channel', channels[1]);

    this.socket.on(channels[1], data => {
      const lastPrice = data[0].lastPrice.toFixed(2);
      const volume = data[0].volume.toFixed(2);
      const dailyChangePerc = data[0].dailyChangePerc.toFixed(2);
      const dailyChange = data[0].dailyChange.toFixed(2);

      if (!this.state.hitbtcLastPrice) { // initial
        this.setState({
          hitbtcLastPrice: { value: lastPrice, colour: this.state.green },
          hitbtcVolume: { value: volume, colour: this.state.green },
          hitbtcDailyChangePerc: { value: dailyChangePerc, colour: this.state.green },
          hitbtcDailyChange: dailyChange,
        })
      } else { // updating
        this.setState(state => { // update price
          if (lastPrice !== state.hitbtcLastPrice.value) {
            return lastPrice >= state.hitbtcLastPrice.value
              ? { hitbtcLastPrice: { value: lastPrice, colour: this.state.green } }
              : { hitbtcLastPrice: { value: lastPrice, colour: this.state.red } }
          }
        })
        this.setState(state => { // update volume
          if (volume !== state.hitbtcVolume.value) {
            return volume > state.hitbtcVolume.value
              ? { hitbtcVolume: { value: volume, colour: this.state.green } }
              : { hitbtcVolume: { value: volume, colour: this.state.red } }
          }
        })
        dailyChange <= 0
          ? this.setState({ hitbtcDailyChangePerc: { value: dailyChangePerc, colour: this.state.red } })
          : this.setState({ hitbtcDailyChangePerc: { value: dailyChangePerc, colour: this.state.green } })

        this.setState({ hitbtcDailyChange: dailyChange });
      }
    })
  }

  displayTable() {
    if (this.state.bitfinexLastPrice && this.state.hitbtcLastPrice) {
      return (
        <table className='table table-hover'>
            <thead>
              <tr>
                <th>EXCHANGE</th>
                <th>PRICE</th>
                <th>24H VOL</th>
                <th>24H CHANGE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bitfinex</td>
                <td style={{color: this.state.bitfinexLastPrice.colour}}>{this.state.bitfinexLastPrice.value + ' USD'}</td>
                <td style={{color: this.state.bitfinexVolume.colour}}>{this.state.bitfinexVolume.value + ' BTC'}</td>
                <td style={{color: this.state.bitfinexDailyChangePerc.colour}}>{this.state.bitfinexDailyChange + ' (' + this.state.bitfinexDailyChangePerc.value + '%)'}</td>
              </tr>
              <tr>
                <td>HitBTC</td>
                <td style={{color: this.state.hitbtcLastPrice.colour}}>{this.state.hitbtcLastPrice.value + ' USD'}</td>
                <td style={{color: this.state.hitbtcVolume.colour}}>{this.state.hitbtcVolume.value + ' BTC'}</td>
                <td style={{color: this.state.hitbtcDailyChangePerc.colour}}>{this.state.hitbtcDailyChange + ' (' + this.state.hitbtcDailyChangePerc.value + '%)'}</td>
              </tr>
            </tbody>
          </table>
      )
    } else {
      return (<LoadingAnimation/>)
    }
  }

  render() {
    return (
      <Card style={{ height: '512px' }}
        title={<div style={{ display: 'inline-flex' }}>
          <h6> Exchanges</h6>
        </div>}
        extra={<div>
          <span className='realtimeIndicator ' style={{ backgroundColor: this.state.socketStatusColour }}></span>
          <span>real-time</span>
        </div>}
      >
        {this.displayTable()}
      </Card>
    );
  }
}

export default CompareTable;