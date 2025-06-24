import React, { useState, useRef, useEffect } from "react";
import Styles from "./CashFlowChart.module.scss";

const CashFlowChart = ({ options }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: '', label: '', position: 'above' });
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(Math.max(400, width - 40)); // Min width 400px, with 40px padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!options || !options.data || !options.data[0] || !options.data[0].dataPoints) {
    return (
      <div className={Styles.wrapper} ref={containerRef}>
        <div className={Styles.noData}>No cash flow data available</div>
      </div>
    );
  }

  const dataPoints = options.data[0].dataPoints;
  
  const maxValue = Math.max(...dataPoints.map(d => d.y));
  const minValue = Math.min(...dataPoints.map(d => d.y));
  const range = maxValue - minValue;
  
  // Add padding to the actual data range
  const rangePadding = range * 0.1;
  let adjustedMaxValue = maxValue + rangePadding;
  let adjustedMinValue = minValue - rangePadding;
  
  // Ensure zero is included in the range for the visual reference
  if (adjustedMinValue > 0) {
    adjustedMinValue = 0;
  }
  if (adjustedMaxValue < 0) {
    adjustedMaxValue = 0;
  }
  
  // Round to nearest 100
  adjustedMaxValue = Math.ceil(adjustedMaxValue / 100) * 100;
  adjustedMinValue = Math.floor(adjustedMinValue / 100) * 100;
  
  const adjustedRange = adjustedMaxValue - adjustedMinValue;
  
  // Calculate the actual range needed, but keep zero-centered visualization
  const absMax = Math.max(Math.abs(maxValue), Math.abs(minValue));
  // Add 10% padding to prevent bars from touching edges
  const paddedAbsMax = absMax * 1.1;
  
  // Responsive chart dimensions
  const chartWidth = containerWidth;
  const chartHeight = 350;
  const padding = { top: 60, right: 50, bottom: 80, left: 100 }; // Increased top padding for tooltips
  const availableWidth = chartWidth - padding.left - padding.right;
  
  // Improved bar sizing for daily charts with many data points
  let barWidth, barSpacing, actualChartWidth;
  
  if (dataPoints.length > 100) {
    // For daily charts with many data points, calculate required width based on actual data
    barSpacing = 2; // Better spacing for readability
    barWidth = 5; // Slightly wider bars for better visibility
    const requiredWidth = (barWidth + barSpacing) * dataPoints.length + padding.left + padding.right;
    actualChartWidth = requiredWidth; // Use exact width needed for data points
  } else if (dataPoints.length > 50) {
    // Medium number of data points
    barSpacing = 2;
    barWidth = Math.max(6, (availableWidth - (barSpacing * (dataPoints.length - 1))) / dataPoints.length);
    actualChartWidth = chartWidth;
  } else {
    // Original logic for smaller datasets (weekly, monthly, yearly)
    barSpacing = Math.max(8, availableWidth * 0.02); // 2% of available width or minimum 8px
    barWidth = Math.max(20, (availableWidth - (barSpacing * (dataPoints.length - 1))) / dataPoints.length);
    actualChartWidth = chartWidth;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatLabel = (point) => {
    if (point.x instanceof Date) {
      return point.x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    let label = point.label || point.x?.toString() || '';
    // Truncate long labels
    if (label.length > 8) {
      label = label.substring(0, 8) + '...';
    }
    return label;
  };

  const getBarHeight = (value) => {
    if (adjustedRange === 0) return 20;
    return Math.abs(value) / adjustedRange * (chartHeight - padding.top - padding.bottom);
  };

  const getBarY = (value) => {
    // Calculate zero line position based on the adjusted range
    const zeroPosition = (adjustedMaxValue - 0) / adjustedRange;
    const zeroLine = padding.top + zeroPosition * (chartHeight - padding.top - padding.bottom);
    
    if (value >= 0) {
      const barHeight = (value / adjustedRange) * (chartHeight - padding.top - padding.bottom);
      return zeroLine - barHeight;
    } else {
      return zeroLine;
    }
  };

  // Generate Y-axis ticks based on the adjusted range
  const yTicks = [];
  const tickCount = 6;
  
  for (let i = 0; i <= tickCount; i++) {
    const value = adjustedMinValue + (adjustedRange * i / tickCount);
    yTicks.push({
      value,
      y: padding.top + ((tickCount - i) / tickCount) * (chartHeight - padding.top - padding.bottom)
    });
  }

  const handleMouseEnter = (point, index, event) => {
    const svgElement = event.currentTarget.closest('svg');
    const containerElement = containerRef.current?.querySelector(`.${Styles.chartContainer}`);
    
    if (!svgElement || !containerElement) return;
    
    // Calculate position in SVG coordinates
    const svgX = padding.left + (index * (barWidth + barSpacing)) + barWidth / 2;
    const barY = getBarY(point.y);
    
    // Position tooltip with better logic to prevent cutoff
    const containerX = svgX;
    let containerY = barY - 8;
    let position = 'above';
    
    // If tooltip would be cut off at the top, position it below the bar
    if (containerY - 60 < 0) { // Assuming tooltip height ~60px
      containerY = barY + getBarHeight(point.y) + 8;
      position = 'below';
    }
    
    setHoveredBar(index);
    setTooltip({
      show: true,
      x: containerX,
      y: containerY,
      value: formatCurrency(point.y),
      label: point.label || formatLabel(point),
      position: position
    });
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    setTooltip({ show: false, x: 0, y: 0, value: '', label: '', position: 'above' });
  };

  // Calculate zero line position - based on where zero falls in the adjusted range
  const zeroPosition = (adjustedMaxValue - 0) / adjustedRange;
  const zeroLineY = padding.top + zeroPosition * (chartHeight - padding.top - padding.bottom);

  return (
    <div className={Styles.wrapper} ref={containerRef}>
      <div className={Styles.chartTitle}>{options.title?.text}</div>
      
      <div className={Styles.chartContainer}>
        <svg 
          width={actualChartWidth} 
          height={chartHeight + 20}
          className={Styles.chart}
          viewBox={`0 0 ${actualChartWidth} ${chartHeight + 20}`}
        >
          {/* Grid lines */}
          {yTicks.map((tick, index) => {
            const isZeroLine = Math.abs(tick.value) < 0.01; // Handle floating point precision
            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={tick.y}
                  x2={actualChartWidth - padding.right}
                  y2={tick.y}
                  stroke={isZeroLine ? "#333" : "#e9ecef"}
                  strokeWidth={isZeroLine ? "2" : "1"}
                  strokeDasharray={isZeroLine ? "none" : "2,2"}
                />
                <text
                  x={padding.left - 15}
                  y={tick.y + 4}
                  textAnchor="end"
                  className={Styles.axisLabel}
                >
                  {formatCurrency(tick.value)}
                </text>
              </g>
            );
          })}
          
          {/* Bars */}
          {dataPoints.map((point, index) => {
            const x = padding.left + (index * (barWidth + barSpacing));
            const barHeight = getBarHeight(point.y);
            const y = getBarY(point.y);
            const isHovered = hoveredBar === index;
            
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)} // Minimum height for visibility
                  className={`${Styles.bar} ${point.y >= 0 ? Styles.positive : Styles.negative} ${isHovered ? Styles.hovered : ''}`}
                  onMouseEnter={(e) => handleMouseEnter(point, index, e)}
                  onMouseLeave={handleMouseLeave}
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 40}
                  textAnchor="middle"
                  className={Styles.barLabel}
                  transform={dataPoints.length > 12 ? `rotate(-45, ${x + barWidth / 2}, ${chartHeight - padding.bottom + 40})` : ''}
                >
                  {/* For daily charts (>100 data points), only show labels for Sundays */}
                  {dataPoints.length > 100 ? 
                    (point.x instanceof Date && point.x.getDay() === 0 ? formatLabel(point) : '') :
                    formatLabel(point)
                  }
                </text>
              </g>
            );
          })}
          
          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#333"
            strokeWidth="2"
          />
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={actualChartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#333"
            strokeWidth="2"
          />
        </svg>
        
        {/* Custom Tooltip */}
        {tooltip.show && (
          <div
            className={`${Styles.tooltip} ${Styles[tooltip.position]}`}
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <div className={Styles.tooltipLabel}>{tooltip.label}</div>
            <div className={Styles.tooltipValue}>{tooltip.value}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowChart; 