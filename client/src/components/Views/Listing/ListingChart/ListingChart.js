import React, { useState, useRef, useEffect } from 'react';
import Styles from './ListingChart.module.scss';

const ListingChart = ({ options }) => {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: '', label: '', position: 'above' });
  const [containerWidth, setContainerWidth] = useState(800);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!options.data || !options.data[0] || !options.data[0].dataPoints) {
    return <div className={Styles.wrapper}>No data available</div>;
  }

  const dataPoints = options.data[0].dataPoints;
  const chartWidth = Math.max(containerWidth, 600);
  const chartHeight = 300;
  const padding = { top: 30, right: 50, bottom: 40, left: 100 };
  
  const values = dataPoints.map(point => point.y);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  
  const barWidth = Math.max((chartWidth - padding.left - padding.right) / dataPoints.length - 8, 20);
  const barSpacing = Math.min(8, (chartWidth - padding.left - padding.right) / dataPoints.length - barWidth);

  const formatValue = (value) => {
    return Math.round(value);
  };

  const formatLabel = (point) => {
    let label = point.label || point.x?.toString() || '';
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
      value: `${formatValue(point.y)} items`,
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
      
      <div className={Styles.chartContainer}>
        <svg 
          width={chartWidth} 
          height={chartHeight + 20}
          className={Styles.chart}
          viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
        >
          {/* Grid lines */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={chartWidth - padding.right}
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
                {formatValue(tick.value)}
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
                  height={Math.max(barHeight, 2)}
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
                  {formatLabel(point)}
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
            x2={chartWidth - padding.right}
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
    </div>
  );
};

export default ListingChart;