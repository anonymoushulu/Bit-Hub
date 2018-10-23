import React, {Component} from 'react';

const loading = {
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '500px'
}

class LoadingAnimation extends Component {
  render() {
    return (
      <div style={loading}>
        <h5>Loading...</h5>
        <i className='fas fa-sync-alt fa-w-16 fa-spin fa-lg'></i>
      </div>
    );
  }
}

export default LoadingAnimation;