// src/AreaPlot.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const AreaPlot = ({ audio, width, height }) => {
  const margin = {left: 100, top:200}

  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);


    // Set up scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(audio.time))
      .range([margin.left, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(audio.amp))
      .range([height / 2, margin.top]);

    

    // Create area generators
    const areaTop = d3.area()
      .x((d, i) => xScale(audio.time[i]))
      .y0(height / 2)
      .y1(d => yScale(d));

    const areaBottom = d3.area()
      .x((d, i) => xScale(audio.time[i]))
      .y0(height / 2)
      .y1(d => height - yScale(d));

    // Clear previous content
    svg.selectAll('*').remove();

    const g = svg.append('g');


    g.append('path')
      .datum(audio.amp)
      .attr('fill', 'lightcoral')
      .attr('d', areaTop);

    g.append('path')
      .datum(audio.amp)
      .attr('fill', 'lightcoral') // Change the fill color for differentiation
      .attr('d', areaBottom);

    // Set up zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 5]) // zoom limits (0.5x to 5x)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);



  }, [audio, width, height]);




  return (
    <>
    <div class="container">
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
    </>
  );
};

export default AreaPlot;


   


/*

 


    return (
        <svg ref={svgRef} width={width} height={height}></svg>
    );
}

export default ZoomableAreaChart;

function ZoomableAreaChart({ audio, width, height }) {

    const svgRef = useRef(null);
    const margin = {left: 100, top:200}
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();  // Clear previous SVG content
    
        const xScale = d3.scaleTime()
            .domain(d3.extent(audio.time))
            .range([margin.left, width]);
    
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(audio.amp)])
            .range([height, margin.top]);
    
        const area = d3.area()
            .x((d, i) => xScale(audio.time[i]))
            .y0(height)
            .y1(d => yScale(d));
    
        svg.append('path')
            .datum(audio.amp)
            .attr('fill', 'steelblue')
            .attr('d', area);
    
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', zoomed);
    
        svg.call(zoom);
    
        function zoomed(event) {
            const newXScale = event.transform.rescaleX(xScale);
            const newYScale = event.transform.rescaleY(yScale);
    
            svg.selectAll('path')
                .attr('d', area.x((d, i) => newXScale(audio.time[i])).y1(d => newYScale(d)));
        }
    
    }, [audio]);
    
    return (
        <svg ref={svgRef} width={width} height={height}></svg>
    );
}

export default ZoomableAreaChart;*/
