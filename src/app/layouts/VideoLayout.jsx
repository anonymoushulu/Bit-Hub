import React from 'react';

class VideoLayout extends React.PureComponent {
  render() {
    return (
      <div>
        <div className="video-layout-wrapper">
          <div className="video-layout-content">
            <div className="video-layout-top">
              {this.props.children}
            </div>
          </div>
        </div>
        <div className="video-wrapper">
          <video autoPlay loop muted playsInline>
            <source src="../../public/assets/video/video.mp4" type="video/mp4"/>
          </video>
        </div>
      </div>
    );
  }
}

export default VideoLayout;