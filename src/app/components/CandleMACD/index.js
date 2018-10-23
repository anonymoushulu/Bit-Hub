import React from 'react';
import Chart from './Chart';
import Timer from './Timer.jsx';
import io from 'socket.io-client';
import LoadingAnimation from '../LoadingAnimation.jsx';
import {Card, Select} from 'antd';

const Option = Select.Option;

class ChartComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      selected: '15m',
      socketStatusColour: '#c2c2c2',
      data: null,
      historicalData: null,
      start: 0,
      loading: true,
      disabled: true
    }
  }

  componentDidMount() {

    this.socket = io.connect('/candles', {reconnect: true},);

    this.socket.on('connect', () => {

      this.setState({
        socketStatusColour: '#136e00'
      })

      this.renderChart()
    });

    this.socket.on('disconnect', () => {
      this.setState({
        socketStatusColour: '#800a00'
      })
    });
  }

  componentDidUpdate(prevProps, prevState) {

    if (prevProps.ticker !== this.props.ticker) {
      this.socket.emit('leave', prevProps.channel);

      this.setState({selected: '15m'});
      this.renderChart()

    } else if (prevProps.channel !== this.props.channel) {

      this.socket.emit('leave', prevProps.channel);
      this.renderChart()
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  renderChart() {

    this.setState({loading: true});

    this.socket.emit('channel', this.props.channel);

    this.socket.on(this.props.channel, data => {
      
      const dataPoints = this.toDateArr(data);

      if (dataPoints.length >= 20) {
        this.setState({
          data: dataPoints,
          loading: false
        })
      } else if (this.state.data !== null && dataPoints.length <= 3) {
        this.setState({
          data: this.appendNew(this.state.data, dataPoints)
        })
      }
    })
  }

  downloadHistorical = (start, end, timestamp) => {

    if (start !== this.state.start) {
      this.setState({start: start, end: end}, () => {

        const pointsToDownload = end - Math.ceil(start)
        const id = timestamp + '#' + pointsToDownload
        
        const params = {
          timestamp: timestamp,
          pointsToDownload: pointsToDownload
        }

        this.socket.emit('historical', params);

        //console.log(start)
        //console.log(end)
        //console.log(timestamp)

        this.socket.once(id, data => {
          //console.log(data[0].timestamp, data[0].exchange)
          //console.log(data[data.length-1].timestamp, data[data.length-1].exchange)
          //console.log(this.state.data[0].timestamp, this.state.data[0].exchange)
          //console.log(data[data.length-1].timestamp === this.state.data[0].timestamp)
          if (data[data.length-1].timestamp === this.state.data[0].timestamp) {
            this.setState({
              data: this.appendHistorical(this.toDateArr(data).concat(this.state.data))
            })
          }
        })
      })
    }
  }

  appendNew(chartData, newDataArr) {
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

  appendHistorical(array) {

    let a = array.concat();

    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        if (a[i].timestamp === a[j].timestamp)
          a.splice(j--, 1);
      }
    }

    return a;
  }

  handleChange(val) {
    
    if (this.state.data) {
      if (val === '1m') {
        this.setState({selected: '1m'})
        this.props.setChannel(this.props.channels[0])
      } else if (val === '15m') {
        this.setState({selected: '15m'})
        this.props.setChannel(this.props.channels[1])
      } else if (val === '1h') {
        this.setState({selected: '1h'})
        this.props.setChannel(this.props.channels[2])
      } else if (val === '1D') {
        this.setState({selected: '1D'})
        this.props.setChannel(this.props.channels[3])
      } else if (val === '7D') {
        this.setState({selected: '7D'})
        this.props.setChannel(this.props.channels[4])
      }
    }
  }

  toDateArr = (dataPoints) => {
    for (let i = 0; i < dataPoints.length; i++) {
      dataPoints[i].date = new Date(dataPoints[i].timestamp);
    }
    return dataPoints
  }

  displayChart() {
    if (!this.state.loading) {
      return (
        <div>
          {['1m', '15m', '1h'].includes(this.state.selected) && <Timer interval={this.state.selected}/>}
          <Chart type={"hybrid"} data={this.state.data} ticker={this.props.ticker} name={this.props.market}
                 downloadHistorical={this.downloadHistorical} historicalData={this.state.historicalData}
          />
        </div>
      )
    } else {
      return (<LoadingAnimation/>)
    }
  }

  render() {
    return (
      <Card
        title={<div style={{display: 'inline-flex'}}>
          <h6>Chart {this.props.market}</h6>
          <Select style={{paddingLeft: '20px'}} value={this.state.selected}
                  onChange={event => this.handleChange(event)}>
            <Option value="1m">1 minute</Option>
            <Option value="15m">15 minutes</Option>
            <Option value='1h'>1 hour</Option>
            <Option value="1D">1 day</Option>
            <Option value="7D">7 days</Option>
          </Select>
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
