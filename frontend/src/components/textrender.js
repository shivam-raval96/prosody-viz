import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TextRenderer = ({ textArray, xArray, width, height }) => {
  const svgRef = useRef(null);
  const margin = {left: 100, top:200}

  var [zoom, setZoom] = useState(1)

  useEffect(() => {

    // Select the SVG element using D3 and set its dimensions
    const svg = d3.select('#plot1')
      .attr('width', width)
      .attr('height', height);

    // Set up scales
    const xScale = d3.scaleLinear()
    .domain(d3.extent(xArray))
    .range([margin.left, width]);

    const zoom2size = d3.scaleLinear()
    .domain([0.5,5])
    .range([4,20]);



    // Create a group element to hold the text elements
    const g = svg.append('g');

    // Clear previous content
    //svg.selectAll('*').remove();
    

    // Use D3 to render text at the specified points from the arrays
    g.selectAll('text')
      .data(textArray)
      .enter()
      .append('text')
      .text((d, i) => d)
      .attr('x', (d, i) => xScale(xArray[i]))
      .attr('y', height/2)
      .attr('font-family', 'Arial')
      .attr('font-size', zoom2size(zoom)+'px')
      .attr('fill', 'black');

    // Set up zoom behavior
    const zoomBehavior = d3.zoom()
    .scaleExtent([0.5, 5]) // zoom limits (0.5x to 5x)
    .on('zoom', (event) => {
        //svg.attr('transform', event.transform);
        svg.attr('transform', `translate(0,0)`); // Center the content

        setZoom(event.transform.k)
        console.log(zoom,event.transform.k)
    });

    svg.call(zoomBehavior);
  }, [textArray, xArray, zoom]);

  return (
    <>
      <div className="container">
        <svg ref={svgRef} width={width} height={height}></svg>
      </div>
    </>
  );
};

export default TextRenderer;
