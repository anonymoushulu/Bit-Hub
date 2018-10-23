import React from "react";
import PropTypes from "prop-types";

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
  BarSeries,
  CandlestickSeries,
  LineSeries,
  MACDSeries,
} from "react-stockcharts/lib/series";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
  CrossHairCursor,
  EdgeIndicator,
  CurrentCoordinate,
  MouseCoordinateX,
  MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
  OHLCTooltip,
  MovingAverageTooltip,
  MACDTooltip,
} from "react-stockcharts/lib/tooltip";
import { ema, macd, sma } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";

const macdAppearance = {
  stroke: {
    macd: "#FF0000",
    signal: "#00F300",
  },
  fill: {
    divergence: "#4682B4"
  },
};

class CandleStickChart extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      xExtents: [0, this.props.data.length + 40]
    };
    this.handleDownloadMore = this.handleDownloadMore.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    
    //console.log(prevProps.data.length - this.props.data.length)
    
    if (prevProps.data.length - this.props.data.length <= -5) {
      this.setState({
        xExtents: [0, this.props.data.length]
      })
    }
  }

  handleDownloadMore(start, end) {
    if (Math.ceil(start) === end) return;
    
    //console.log(start, end)
    //console.log("rows to download", rowsToDownload, start, end)
    
    this.props.downloadHistorical(start, end+10, this.props.data[0].timestamp)

  }

  render() {

    const { type, data: initialData, width, ratio } = this.props;
    let { xExtents } = this.state;

    const ema26 = ema()
      .id(0)
      .options({ windowSize: 26 })
      .merge((d, c) => { d.ema26 = c; })
      .accessor(d => d.ema26);

    const ema12 = ema()
      .id(1)
      .options({ windowSize: 12 })
      .merge((d, c) => {d.ema12 = c;})
      .accessor(d => d.ema12);

    const macdCalculator = macd()
      .options({
        fast: 12,
        slow: 26,
        signal: 9,
      })
      .merge((d, c) => {d.macd = c;})
      .accessor(d => d.macd);

    const smaVolume50 = sma()
      .id(3)
      .options({
        windowSize: 50,
        sourcePath: "volume",
      })
      .merge((d, c) => {d.smaVolume50 = c;})
      .accessor(d => d.smaVolume50);

    const calculatedData = smaVolume50(macdCalculator(ema12(ema26(initialData))));
    const xScaleProvider = discontinuousTimeScaleProvider
      .inputDateAccessor(d => d.date);
    const {
      data,
      xScale,
      xAccessor,
      displayXAccessor,
    } = xScaleProvider(calculatedData);

    const height = 600;
    const margin = { left: 25, right: 60, top: 20, bottom: 30 }

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

    return (
      <ChartCanvas height={600}
                   width={width}
                   ratio={ratio}
                   margin={margin}
                   type={type}
                   seriesName={this.props.name}
                   data={data}
                   xScale={xScale}
                   xAccessor={xAccessor}
                   xExtents={xExtents}
                   displayXAccessor={displayXAccessor}
                   pointsPerPxThreshold={5}
                   onLoadMore={this.handleDownloadMore}
                   ref={node => { this.node = node }}
      >
        <Chart id={1} height={400}
               yExtents={[d => [d.high, d.low], ema26.accessor(), ema12.accessor()]}
               padding={{ top: 10, bottom: 20 }}
        >
          <YAxis axisAt="right" orient="right" ticks={5} {...yGrid} />

          <MouseCoordinateY
            at="right"
            orient="right"
            displayFormat={format(".2f")}
          />

          <CandlestickSeries
            stroke={d => d.close > d.open ? "#016d15" : "#d20000"}
            wickStroke={d => d.close > d.open ? "#016d15" : "#d20000"}
            fill={d => d.close > d.open ? "#016d15" : "#d20000"} />
          <LineSeries yAccessor={ema26.accessor()} stroke={ema26.stroke()}/>
          <LineSeries yAccessor={ema12.accessor()} stroke={ema12.stroke()}/>

          <CurrentCoordinate yAccessor={ema26.accessor()} fill={ema26.stroke()} />
          <CurrentCoordinate yAccessor={ema12.accessor()} fill={ema12.stroke()} />

          <EdgeIndicator itemType="last" orient="right" edgeAt="right"
                         yAccessor={d => d.close}
                         fill={d => d.close > d.open ? "#016d15" : "#d20000"}
                         textFill={d => d.close > d.open ? "#ffffff" : "#ffffff"}
          />

          <OHLCTooltip origin={[0, -10]} xDisplayFormat={timeFormat("%Y-%m-%d %H:%M:%S")} />

          <MovingAverageTooltip
            onClick={e => console.log(e)}
            origin={[0, 15]}
            options={[
              {
                yAccessor: ema26.accessor(),
                type: "EMA",
                stroke: ema26.stroke(),
                windowSize: ema26.options().windowSize,
              },
              {
                yAccessor: ema12.accessor(),
                type: "EMA",
                stroke: ema12.stroke(),
                windowSize: ema12.options().windowSize,
              },
            ]}
          />
        </Chart>
        <Chart id={2} height={150}
               yExtents={[d => d.volume, smaVolume50.accessor()]}
               origin={(w, h) => [0, h - 300]}
        >

          <BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#d6e6dc" : "#feb9b9"} />


        </Chart>
        <Chart id={3} height={150}
               yExtents={macdCalculator.accessor()}
               origin={(w, h) => [0, h - 150]} padding={{ top: 10, bottom: 10 }}
        >
          <XAxis axisAt="bottom" orient="bottom" {...xGrid} />
          <YAxis axisAt="right" orient="right" ticks={2} />

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

          <MACDSeries yAccessor={d => d.macd}
                      {...macdAppearance} />
          <MACDTooltip
            origin={[0, 15]}
            yAccessor={d => d.macd}
            options={macdCalculator.options()}
            appearance={macdAppearance}
          />
        </Chart>
        <CrossHairCursor />
      </ChartCanvas>
    );
  }
}

CandleStickChart.propTypes = {
  data: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired,
  ratio: PropTypes.number.isRequired,
  type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
};

CandleStickChart.defaultProps = {
  type: "hybrid",
};

CandleStickChart = fitWidth(CandleStickChart);

export default CandleStickChart;