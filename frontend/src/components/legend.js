import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// set up react component
const Legend = ({width, height, pauseStatus, normalizeStatus}) => {
    const margin = {left: 0, top:200}

    const svgRef = useRef();
    
    useEffect(() => {

        const svg = d3.select(svgRef.current);

        svg.
        attr("style", "background-color: #fffaf1");
    
        // Clear previous content
        svg.selectAll('*').remove();

        let domain = [60, 150, 250];
        
        let scaleAnomaly =  d3.scaleLinear() // TODO: Not sure why these colors match, they don't exist in curverenderer.js, but the colors which do exist there seem to be blue/red, not blue/orange.
        .range(['#062f62', '#5f9bc8', '#dce4eb',
        '#f9e9de', '#f2a98a', '#b32833']) 
        .interpolate(d3.interpolateRgb)
        .domain(domain);


        if (pauseStatus) {
          scaleAnomaly =  d3.scaleLinear()
         .range(['#f0f0f0','#f0f0f0']) 
         .interpolate(d3.interpolateRgb)
         .domain(domain);
        }

    
        //Append a defs (for definition) element to your SVG
        var defs = svg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        var linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        //Vertical gradient
        linearGradient
        .attr("x1", "5%")
        .attr("y1", "0%")
        .attr("x2", "95%")
        .attr("y2", "0%");

        //Append multiple color stops by using D3's data/enter step
        linearGradient.selectAll("stop")
        .data( scaleAnomaly.range() )
        .enter().append("stop")
        .attr("offset", function(d,i) { return i/(scaleAnomaly.range().length-1); })
        .attr("stop-color", function(d) { return d; });

        //Draw the rectangle and fill with gradient
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "url(#linear-gradient)");

    });

    return (
        <>
        <div class="container">
          <svg ref={svgRef} height={height}></svg>
        </div>
        </>
      );
}

export default Legend;