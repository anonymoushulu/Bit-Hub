import React, { Component } from 'react';
import { Table, Card, Row, Col } from 'antd';
import io from 'socket.io-client';
import LoadingAnimation from './LoadingAnimation.jsx';

const { Column } = Table;
const refreshInterval = 3; // refresh per 3 seconds

class OrderBookTable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      socketStatusColour: '#c2c2c2',
      loading: true
    }
  }

  componentDidMount() {
    this.socket = io.connect('/books', { reconnect: true });
    this.socket.on('connect', () => {
      this.setState({
        socketStatusColour: '#136e00'
      })
      this.renderBids();
      this.renderAsks();
    });
    this.socket.on('disconnect', () => {
      this.setState({
        socketStatusColour: '#800a00'
      })
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.channel !== this.props.channel) {
      this.socket.emit('leave', prevProps.channel + ':bid:-1:' + refreshInterval);
      this.socket.emit('leave', prevProps.channel + ':ask:1:' + refreshInterval);
      this.renderBids();
      this.renderAsks();
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

    renderBids() {
        this.setState({
            loading: true
        });
        let channel = this.props.channel + ':bid:-1:' + refreshInterval;
        this.socket.emit('channel', channel);
        this.socket.on(channel, data => {
          this.setState({
              bids: toBookArr(data),
              loading: false
          })
        })
    }
    renderAsks() {
        this.setState({
            loading: true
        });
        let channel = this.props.channel + ':ask:1:' + refreshInterval;
        this.socket.emit('channel', channel);
        this.socket.on(channel, data => {
            this.setState({
                asks: toBookArr(data),
                loading: false
            })
        })
    }

  displayTable() {
    if (!this.state.loading && this.state.bids && this.state.asks) {
      return (
        <div style={{whiteSpace: 'nowrap'}}>
          <Row gutter={16}>
            <Col span={12}>
              <Table dataSource={this.state.bids} size='small'>
                <Column
                  title="Sum"
                  dataIndex="sum"
                  key="bidSum"
                  width='33%'
                  align='center'
                />
                <Column
                  title="Amount"
                  dataIndex="amount"
                  key='bidAmount'
                  width='33%'
                  align='center'
                />
                <Column
                  title="Bid (USD)"
                  dataIndex="price"
                  key='bidPrice'
                  className='green'
                  width='33%'
                  align='center'
                />
              </Table>
              <Col span={12}>
                <p>{this.state.bids.btcAmount + ' BTC'}</p>
              </Col>
            </Col>
            
            <Col span={12}>
              <Table dataSource={this.state.asks} size='small'>
                <Column
                  title="Ask (USD)"
                  dataIndex="price"
                  key='askPrice'
                  className='red'
                  width='33%'
                  align='center'
                />
                <Column
                  title="Amount"
                  dataIndex="amount"
                  key='askAmount'
                  width='33%'
                  align='center'
                />
                <Column
                  title="Sum"
                  dataIndex="sum"
                  key='askSum'
                  width='33%'
                  align='center'
                />
              </Table>
              <Col span={12}></Col>
              <Col style={{textAlign: 'right'}} span={12}>
                <p>{this.state.asks.btcAmount + ' BTC'}</p>
              </Col>
            </Col>
          </Row>
        </div>
      )
    } else {
      return (<LoadingAnimation/>)
    }
  }

  render() {
    return (
      <Card
        title={<div style={{ display: 'inline-flex'}}>
          <h6>Books</h6>
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

export default OrderBookTable;

const toBookArr = (arr) => {
  for (let i = 0; i < arr.length; i++) {
    arr[i].key = arr[i]['_id'];
    arr[i].price = parseFloat(arr[i].price).toFixed(1);
    arr[i].amount = Math.abs(arr[i].amount).toFixed(2);
    if (i === 0) {
      arr[i].sum = arr[i].amount;
    } else {
      arr[i].sum = (parseFloat(arr[i - 1].sum) + parseFloat(arr[i].amount)).toFixed(2);
    }
  }
  arr.btcAmount = arr[arr.length-1].sum;
  return arr;
}
