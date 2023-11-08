// src/AreaPlot.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const AreaPlot = ({ audio, width, height, toggleStatus }) => {
  const margin = {left: 100, top:300}

  const svgRef = useRef();
  const zoomRef = useRef();

  let timeSeparation = 15;

  useEffect(() => {
    const svg = d3.select(svgRef.current);


    svg.
    attr("style", "background-color: #fffaf1");

    // Clear previous content
    svg.selectAll('*').remove();

    var yScale = d3.scaleLinear()
      .domain(d3.extent(audio.amp))
      .range([height / 2, margin.top]);

    var noZeroes = audio.pitch.filter(function(d) { return d !== 0; });
    let smallest = d3.min(noZeroes);
    console.log("smallest", smallest);


    const scaleAnomaly = d3.scaleDiverging(t => d3.interpolateSpectral(1 - t))
    .domain([smallest, d3.median(noZeroes), d3.max(audio.pitch)]);

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
    .attr("x2", "0%")
    .attr("y2", "100%");

        //Append multiple color stops by using D3's data/enter step
    linearGradient.selectAll("stop")
    .data( scaleAnomaly.range() )
    .enter().append("stop")
    .attr("offset", function(d,i) { return i/(scaleAnomaly.range().length-1); })
    .attr("stop-color", function(d) { return d; });

    //Draw the rectangle and fill with gradient
    svg.append("rect")
        .attr("width", 20)
        .attr("height", 300)
        .style("fill", "url(#linear-gradient)");

    // Add an axis to show the scale
    const axisScale = d3.scaleLinear()
    .range([0, 300])
    .domain(d3.extent(audio.pitch));

    const axisBottom = d3.axisRight(axisScale)
      .ticks();

    svg.append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', `translate(20,${0})`)
      .call(axisBottom);

    /// END LEGEND !!
    const g = svg.append('g');

    let lastEnd = 0;
    let endings = [];
    for (let i = 0; i < audio.time.length-1; i++) {
        if (audio.end[i] - lastEnd > timeSeparation) {
          endings.push(i);
          lastEnd = audio.end[i];
        }
    }

    let offset = 0;
    let endIndex = endings[0];
    let startIndex = 0;
    lastEnd = 0;
    let separation = 250;
    for (let j = 0; j < endings.length; j++) {
      var new_g = g.append('g');
       new_g.attr("transform", `translate(0,${separation*j})`)
      // Draw area paths
      for (let i = endings[j-1]; i < endings[j]; i++) {
        let data;
        if (audio.start[i+1] - audio.end[i] > .5) {
          data = [[audio.start[i], audio.amp[i]], [audio.end[i], audio.amp[i+1]]];
           // data to be used for drawing the area path, should be an array of 2 elements
        } else {
          data = [[audio.start[i], audio.amp[i]], [audio.start[i + 1], audio.amp[i+1]]];
        }

          if (audio.end[i] - lastEnd > timeSeparation) {
            offset++;
            lastEnd = audio.end[i];
            endIndex = endings[offset];
            startIndex = endings[offset-1];
          }

                  // Set up scales
          var xScaleNew = d3.scaleLinear()
          .domain(d3.extent(audio.end.slice(startIndex, endIndex)))
          .range([margin.left, width])
          .clamp(true);

          // Set up scales
          var textScale = d3.scaleLinear()
          .domain([startIndex, endIndex])
          .range([margin.left, width])
          .clamp(true);

          // var yScale = d3.scaleLinear()
          // .domain(d3.extent(audio.amp))
          // .range([segmentHeight * (offset + 1), segmentHeight * offset + margin.top]);


          var curveFunc = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return yScale(d[1]) })     // Y position of top line breaks
          .y0(height/2);
      
          var curveFuncBottom = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return height - yScale(d[1]) })     // Y position of top line breaks
          .y0(height/2);

          if (toggleStatus) {
            new_g.append('line')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('x1', xScaleNew(audio.start[i]))
            .attr('y1', height/2)
            .attr('x2', xScaleNew(audio.end[i+1]))
            .attr('y2', height/2);
          }
      
          if (audio.start[i+1] - audio.end[i] > .5) {
            let pause_data = [[audio.end[i], audio.amp[i+1]], [audio.start[i+1], audio.amp[i+1]]]; // data to be used for drawing the area path, should be an array of 2 elements
            new_g.append('path')
            .attr('d', curveFunc(pause_data))
            .attr('stroke', 'none')
            .attr('fill', 'black');

            new_g.append('path')
            .attr('d', curveFuncBottom(pause_data))
            .attr('stroke', 'none')
            .attr('fill', 'black');
          }
          console.log("toggleStatus: ", toggleStatus);
          let fill; 
          if (toggleStatus) {
            fill = scaleAnomaly(audio.pitch[i]);
          } else {
            fill = 'silver';
          }
            new_g.append('path')
              .attr('d', curveFunc(data))
              .attr('stroke', '#00000022')
              .attr('fill', fill );

            // // mirror image of the top curve 
            new_g.append('path')
            .attr('d', curveFuncBottom(data))
            .attr('stroke', '#00000022')
            .attr('fill', fill);

            let textFill;
            if (toggleStatus) {
              textFill = 'black';
            } else {
              textFill = 'none';
            }
            new_g.append('text')
            .attr('x', xScaleNew(audio.start[i]))
            .attr('y', (height - yScale(0) / 2) - 120 + 15*(i%3))
            .attr('fill', textFill)
            .attr('font-family', 'Arial')
            .attr('font-size', '15px')
            .text(audio.word[i]);
      }
  }

    // svg.call(zoomBehavior);
    if (!zoomRef.current) {
      // If we haven't stored a zoom state yet, initialize it.
      zoomRef.current = d3.zoomIdentity;
    }

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        zoomRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomRef.current);

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
