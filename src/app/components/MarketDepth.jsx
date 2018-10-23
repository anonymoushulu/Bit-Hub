import React, { Component } from 'react';
import { Card } from 'antd';
import { Chart, Geom, Axis, Tooltip } from "bizcharts";
import io from 'socket.io-client';
import LoadingAnimation from './LoadingAnimation.jsx';

const refreshInterval = 5; // refresh per 5 seconds

class MarketDepthChart extends Component {

    constructor(props) {
        super(props);
        this.state = {
            socketStatusColour: '#c2c2c2',
            loading: true,
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
            this.socket.emit('leave', prevProps.channel + ':bid:1:' + refreshInterval);
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
        let channel = this.props.channel + ':bid:1:' + refreshInterval;
        this.socket.emit('channel', channel);
        this.socket.on(channel, data => {
            const bidData = toDepthBid(data);
            this.setState({
                bid: bidData,
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
            const askData = toDepthAsk(data);
            this.setState({
                ask: askData,
                loading: false
            })
        })
    }

    displayChart() {
        if (!this.state.loading && this.state.bid && this.state.ask) {
            const scale = {
                volume: {
                    type: 'linear',
                    tickInterval: 100,
                    nice: true
                },
                price: {
                    type: 'linear',
                    tickInterval: 10,
                    nice: false
                }
            }
            return (
                <Chart padding='auto' animate={false} scale={scale} renderer='canvas' width={600} height={150} data={this.state.bid.concat(this.state.ask)} forceFit>
                    <Axis name="volume" />
                    <Axis name="price" />
                    <Tooltip crosshairs={{
                        type: 'line',
                        style: {
                            lineWidth: 1,
                        }
                    }} />
                    <Geom
                        type='line'
                        active={false}
                        position='price*volume'
                        color={['side', ['#016d15', '#d20000']]}
                    />
                    <Geom
                        type='area'
                        active={false}
                        position='price*volume'
                        color={['side', ['#016d15', '#d20000']]}
                    />
                </Chart>
            )
        } else {
            return (<LoadingAnimation />)
        }
    }

    render() {
        return (
            <Card
                title={<div style={{ display: 'inline-flex' }}>
                    <h6>Depth Chart</h6>
                </div>}
                extra={<div>
                    <span className='realtimeIndicator ' style={{ backgroundColor: this.state.socketStatusColour }}></span>
                    <span>real-time</span>
                </div>}
            >
                {this.displayChart()}
            </Card>
        );
    }
}

export default MarketDepthChart;

const toDepthBid = (arr) => {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (i === arr.length - 1) {
            arr[i].volume = arr[i].amount;
        } else {
            arr[i].volume = arr[i + 1].volume + arr[i].amount;
        }
        arr[i].side = 'Bid';
    }
    return arr;
}
const toDepthAsk = (arr) => {
    for (let i = 0; i < arr.length; i++) {
        arr[i].amount = Math.abs(arr[i].amount);
        if (i === 0) {
            arr[i].volume = arr[i].amount;
        } else {
            arr[i].volume = arr[i - 1].volume + arr[i].amount;
        }
        arr[i].side = 'Ask';
    }
    return arr;
}
