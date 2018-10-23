import React from 'react';

class BlankLayout extends React.PureComponent {

  render() {
    return (
      <div>
        <div className="blank-layout-wrapper">
          <div className="blank-layout-content">
            <div className="blank-layout-top">
              {this.props.children}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BlankLayout;