import React, { useState, useRef, useEffect } from "react";
import Styles from "./SalesChart.module.scss";

const SalesChart = ({ options }) => {
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
        <div className={Styles.noData}>No data available</div>
      </div>
    );
  }

  const dataPoints = options.data[0].dataPoints;
  
  const maxValue = Math.max(...dataPoints.map(d => d.y));
  const minValue = Math.min(...dataPoints.map(d => d.y));
  const range = maxValue - minValue;
  
  // Responsive chart dimensions
  const chartWidth = containerWidth;
  const chartHeight = 350;
  const padding = { top: 30, right: 50, bottom: 80, left: 100 };
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
    if (range === 0) return 20;
    const normalizedValue = Math.max(0, value - Math.min(0, minValue));
    const normalizedRange = maxValue - Math.min(0, minValue);
    return (normalizedValue / normalizedRange) * (chartHeight - padding.top - padding.bottom);
  };

  const getBarY = (value) => {
    const barHeight = getBarHeight(value);
    return chartHeight - padding.bottom - barHeight;
  };

  // Generate Y-axis ticks
  const yTicks = [];
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    const value = minValue + (range * i / tickCount);
    yTicks.push({
      value,
      y: chartHeight - padding.bottom - (i / tickCount) * (chartHeight - padding.top - padding.bottom)
    });
  }

  const handleMouseEnter = (point, index, event) => {
    const svgElement = event.currentTarget.closest('svg');
    const containerElement = containerRef.current?.querySelector(`.${Styles.chartContainer}`);
    
    if (!svgElement || !containerElement) return;
    
    // Calculate position in SVG coordinates
    const svgX = padding.left + (index * (barWidth + barSpacing)) + barWidth / 2;
    const barY = getBarY(point.y); // This is the top of the bar
    
    // Position tooltip 8px above the top of the bar
    const containerX = svgX;
    const containerY = barY - 8;
    
    setHoveredBar(index);
    setTooltip({
      show: true,
      x: containerX,
      y: containerY,
      value: formatCurrency(point.y),
      label: point.label || formatLabel(point),
      position: 'above'
    });
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
    setTooltip({ show: false, x: 0, y: 0, value: '', label: '', position: 'above' });
  };

  return (
    <div className={Styles.wrapper} ref={containerRef}>
      <div className={Styles.chartTitle}>{options.title?.text}</div>
      
      <div 
        className={Styles.chartContainer}
        style={dataPoints.length > 100 ? { 
          overflowX: 'auto',
          overflowY: 'visible', // Allow tooltip to show above chart
          width: '100%',
          position: 'relative'
        } : {}}
      >
        <svg 
          width={actualChartWidth} 
          height={chartHeight + 20}
          className={Styles.chart}
          viewBox={`0 0 ${actualChartWidth} ${chartHeight + 20}`}
          style={dataPoints.length > 100 ? { 
            minWidth: actualChartWidth,
            display: 'block'
          } : {}}
        >
          {/* Grid lines */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={actualChartWidth - padding.right}
                y2={tick.y}
                stroke="#e9ecef"
                strokeWidth="1"
                strokeDasharray={index === 0 ? "none" : "2,2"}
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
          ))}
          
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
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className={Styles.tooltipLabel}>{tooltip.label}</div>
            <div className={Styles.tooltipValue}>{tooltip.value}</div>
          </div>
        )}
      </div>
      
      {options.axisX?.title && (
        <div className={Styles.axisTitle}>
          {options.axisX.title}
        </div>
      )}
      
      {/* Show data insights for multi-year view */}
      {options.data[0].dataPoints.length > 1 && options.title?.text?.includes('by Year') && (
        <div className={Styles.insights}>
          <div className={Styles.insightItem}>
            Total Years
            <strong>{options.data[0].dataPoints.length}</strong>
          </div>
          <div className={Styles.insightItem}>
            Best Year
            <strong>
              {options.data[0].dataPoints.reduce((best, current) => 
                current.y > best.y ? current : best
              ).label}
              <br />
              {formatCurrency(options.data[0].dataPoints.reduce((best, current) => 
                current.y > best.y ? current : best
              ).y)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesChart;