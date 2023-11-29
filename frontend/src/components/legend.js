import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// set up react component
const Legend = ({width, height, toggleStatus, normalizeStatus}) => {
    const margin = {left: 0, top:200}

    const svgRef = useRef();
    
    useEffect(() => {

        const svg = d3.select(svgRef.current);

        svg.
        attr("style", "background-color: #fffaf1");
    
        // Clear previous content
        svg.selectAll('*').remove();

        let domain = [0, 125, 300];
        if (normalizeStatus) {
          domain = [0, 150, 300];
        }
        let scaleAnomaly = d3.scaleDiverging(t => d3.interpolateSpectral(1 - t))
        .domain(domain);
        if (!normalizeStatus) {
          scaleAnomaly = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
          .domain(domain);
        }
    
            /// legend !! 
        //Append a defs (for definition) element to your SVG
        var defs = svg.append("defs");

        //Append a linearGradient element to the defs and give it a unique id
        var linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        //Vertical gradient
        linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

            //Append multiple color stops by using D3's data/enter step
        linearGradient.selectAll("stop")
        .data( scaleAnomaly.range() )
        .enter().append("stop")
        .attr("offset", function(d,i) { return i/(scaleAnomaly.range().length-1); })
        .attr("stop-color", function(d) { return d; });

        //Draw the rectangle and fill with gradient
        svg.append("rect")
            .attr("width", 200)
            .attr("height", height)
            .style("fill", "url(#linear-gradient)");

        let legendAxisDomain = [0, 300];
        if (!normalizeStatus) {
        legendAxisDomain = [0, 300];
        }
        // // Add an axis to show the scale
        // const axisScale = d3.scaleLinear()
        // .range([0, 300])
        // .domain(legendAxisDomain);

        // const axisBottom = d3.axisRight(axisScale)
        // .ticks();

        // svg.append('g')
        // .attr('class', 'axis axis--y')
        // .attr('transform', `translate(20,${0})`)
        // .call(axisBottom);

        /// END LEGEND !!
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