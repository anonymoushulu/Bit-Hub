import React from "react";
import CountDown from 'ant-design-pro/lib/CountDown';

const arr15m = [15,30,45,60];

const getTargetTime = (interval) => {

  const currentDate = new Date();

  if (interval === '1m') {
    return currentDate.getTime() + (60 - currentDate.getSeconds()) * 1000;
  }
  else if (interval === '15m') {
    let leftMin = 0;
    let currentMin = currentDate.getMinutes();
    for (let i = 0; i < arr15m.length; i++) {
      if (arr15m[i] > currentMin) {
        leftMin = arr15m[i] - currentMin;
        break;
      }
    }
    return currentDate.getTime() + (60 - currentDate.getSeconds()) * 1000 + (leftMin - 1) * 60000;
  }
  else if (interval === '1h') {
    return currentDate.getTime() + (60 - currentDate.getSeconds()) * 1000 + (59 - currentDate.getMinutes()) * 60000;
  }
}

export default class Timer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      interval: this.props.interval
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      interval: nextProps.interval
    })
  }

  render() {
    return (
      <CountDown style={{float:'right', fontSize: 15}} target={getTargetTime(this.state.interval)}/>
    )
  }
}

