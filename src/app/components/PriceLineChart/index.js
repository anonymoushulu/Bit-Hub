import React from 'react';
import io from 'socket.io-client';
import LoadingAnimation from '../LoadingAnimation.jsx';
import {Card} from 'antd';
import Chart from './Chart.js'

const channels = ['bitfinex:1h:BTCUSD', 'hitbtc:1h:BTCUSD'];
const colors = ['#a6c863', '#398bb8'];

class ChartComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      socketStatusColour: '#c2c2c2',
      bitfinexData: null,
      hitbtcData: null,
    }
  }

  componentDidMount() {
    this.socket = io.connect('/candles', {reconnect: true},);

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
      const dataPoints = this.toDateArr(data);
      if (dataPoints.length >= 150) {
        this.setState({
          bitfinexData: dataPoints
        })
      } else if (this.state.bitfinexData !== null && dataPoints.length <= 3) {
        this.setState({
          bitfinexData: this.updateChart(this.state.bitfinexData, dataPoints)
        })
      }
    })
  }

  renderHitBTC() {

    this.socket.emit('channel', channels[1]);

    this.socket.on(channels[1], data => {
      const dataPoints = this.toDateArr(data);
      if (dataPoints.length >= 150) {
        this.setState({
          hitbtcData: dataPoints
        })
      } else if (this.state.hitbtcData !== null && dataPoints.length <= 3) {
        this.setState({
          hitbtcData: this.updateChart(this.state.hitbtcData, dataPoints)
        })
      }
    })
  }

  updateChart(chartData, newDataArr) {
    let lastNewData = newDataArr[newDataArr.length - 1];
    let lastChartData = chartData[chartData.length - 1];
    let len = newDataArr.length;
    if (lastNewData.timestamp === lastChartData.timestamp) { // update old data points
      chartData.splice(-len, len);
      chartData = chartData.concat(newDataArr);
    } else if (lastNewData.timestamp > lastChartData.timestamp) { // add a new data point
      chartData.push(lastNewData);
    }
    return chartData;
  }

  toDateArr = (dataPoints) => {
    for (let i = 0; i < dataPoints.length; i++) {
      dataPoints[i].date = new Date(dataPoints[i].timestamp);
    }
    return dataPoints
  }

  combineBitfinexHitBTC = (bitfinex, hitbtc) => {
    
    for (let i = 0; i < bitfinex.length; i++) {
      if (bitfinex[0].timestamp && hitbtc[0].timestamp) {
        if (bitfinex[i].timestamp === hitbtc[i].timestamp) {
          bitfinex[i].hitbtc = hitbtc[i].close;
        }
      }
    }

    return bitfinex;
  }

  displayChart() {
    if (this.state.bitfinexData && this.state.hitbtcData) {
      return (
        <Chart type={"hybrid"} data={this.combineBitfinexHitBTC(this.state.bitfinexData, this.state.hitbtcData)}
               colors={colors}/>
      )
    } else {
      return (<LoadingAnimation/>)
    }
  }

  render() {
    return (
      <Card
        title={<div style={{display: 'inline-flex'}}>
          <h6>Price BTC/USD</h6>
          <p style={{color: colors[0], margin: '0px 24px 0px 48px'}}>Bitfinex</p>
          <p style={{color: colors[1], margin: '0px 24px 0px 24px'}}>HitBTC</p>
        </div>}
        extra={<div>
          <span className='realtimeIndicator ' style={{backgroundColor: this.state.socketStatusColour}}></span>
          <span>real-time</span>
        </div>}
      >
        {this.displayChart()}
      </Card>
    )
  }
}

export default ChartComponent;