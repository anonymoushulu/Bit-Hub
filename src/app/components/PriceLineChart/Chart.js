import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import { LineSeries } from "react-stockcharts/lib/series";

import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
  MouseCoordinateX,
  MouseCoordinateY
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import { fitWidth } from "react-stockcharts/lib/helper";

class LineChart extends React.Component {
  render() {
    const { type, data: initialData, width, ratio, interpolation } = this.props;
    const { gridProps } = this.props;
    const margin = { left: 30, right: 50, top: 10, bottom: 30 };

    const height = 400;

    const gridHeight = height - margin.top - margin.bottom;
    const gridWidth = width - margin.left - margin.right;

    const showGrid = true;

    const yGrid = showGrid ? {
      innerTickSize: -1 * gridWidth,
      tickStrokeDasharray: 'Solid',
      tickStrokeOpacity: 0.1,
      tickStrokeWidth: 0.6
    } : {};

    const xGrid = showGrid ? {
      innerTickSize: -1 * gridHeight,
      tickStrokeDasharray: 'Solid',
      tickStrokeOpacity: 0.1,
      tickStrokeWidth: 0.6
    } : {};
    
    const xScaleProvider = discontinuousTimeScaleProvider.inputDateAccessor(
      d => d.date
    );
    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(
      initialData
    );

    const xExtents = [132, this.props.data.length];
    
    return (
      <ChartCanvas
        height={height}
        ratio={ratio}
        width={width}
        margin={margin}
        type={type}
        seriesName="BTC/USD"
        data={data}
        xScale={xScale}
        xAccessor={xAccessor}
        displayXAccessor={displayXAccessor}
        xExtents={xExtents}
        clamp={'both'}
      >
        <Chart id={1} yExtents={d => [d.high, d.low]}>
          <XAxis axisAt="bottom" orient="bottom" {...xGrid}/>
          <YAxis axisAt="right" orient="right" ticks={5} {...gridProps} {...yGrid} />
          
          <MouseCoordinateX
            at="bottom"
            orient="bottom"
            displayFormat={timeFormat("%Y-%m-%d %H:%M:%S")}
            rectRadius={5}
          />
          
          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")}
          />

          <LineSeries
            yAccessor={d => d.close}
            interpolation={interpolation}
            stroke={this.props.colors[0]}
            strokeWidth={2}
          />
          
          <LineSeries
            yAccessor={d => d.hitbtc}
            interpolation={interpolation}
            stroke={this.props.colors[1]}
            strokeWidth={2}
          />
          
        </Chart>

        <CrossHairCursor />
      </ChartCanvas>
    );
  }
}

LineChart.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]).isRequired
};

LineChart.defaultProps = {
  type: "hybrid"
};
LineChart = fitWidth(LineChart);

export default LineChart;