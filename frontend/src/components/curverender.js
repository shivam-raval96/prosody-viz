// src/AreaPlot.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const AreaPlot = ({ videoHandler, audio, width, height, toggleStatus, normalizeStatus, name, pauseSlider, videoID}) => {
  const margin = {left: 0, top:200};
  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

  const svgRef = useRef();
  const zoomRef = useRef();

  let timeSeparation = 30;

  useEffect(() => {
    const svg = d3.select(svgRef.current);


    svg.
    attr("style", "background-color: #ffffff");

    // Clear previous content
    svg.selectAll('*').remove();

    var yScale = d3.scaleLinear()
      .domain(d3.extent(audio.amp))
      .range([height / 2, margin.top]);

    var noZeroes = audio.pitch.filter(function(d) { return d !== 0; });
    let smallest = d3.min(noZeroes);
    console.log("smallest", smallest);

    let domain = [0, 125, 300];
    if (normalizeStatus) {

      domain = [smallest, d3.median(noZeroes), d3.max(audio.pitch)];
    }
    let scaleAnomaly = d3.scaleDiverging(t => d3.interpolateSpectral(1 - t))
    .domain(domain);
    if (!normalizeStatus) {
      scaleAnomaly = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
      .domain(domain);
    }

   
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
      new_g.attr("transform", `translate(0,${separation*j})`);
      new_g.attr("id", name + "g" + j);
      // Draw area paths
      for (let i = endings[j-1]; i < endings[j]; i++) {
        let data;
        if (audio.start[i+1] - audio.end[i] > pauseSlider) {
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
          .range([margin.left, 1800])
          .clamp(true);

          var curveFunc = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return yScale(d[1]) })     // Y position of top line breaks
          .y0(height/2);
      
          var curveFuncBottom = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return height - yScale(d[1]) })     // Y position of top line breaks
          .y0(height/2);

          if (!toggleStatus) {
            new_g.append('line')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('x1', xScaleNew(audio.start[i]))
            .attr('y1', height/2)
            .attr('x2', xScaleNew(audio.end[i+1]))
            .attr('y2', height/2);
          }
      
          if (audio.start[i+1] - audio.end[i] > pauseSlider) {
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
          let fill, stroke;
          if (!toggleStatus) {
            fill = scaleAnomaly(audio.pitch[i]);
            stroke = '#000000';
          } else {
            fill = '#20202011';
            stroke = 'none';
          }
            new_g.append('path')
              .attr('d', curveFunc(data))
              .attr('stroke', stroke)
              .attr('stroke-width', function (d) {
                return (audio.end[i] - audio.start[i]) * 10;
              })
              .attr('id', i)
              .attr('fill', fill ).on("mouseover", function(d) {
                if (!toggleStatus) {
                  d3.select("#" + name + 'g' + j).selectAll('path').attr('stroke', 'black');
                }

              }).on('click', function (d) {
                videoHandler(j*30, videoID);
              }).on("mouseout", function(d) {
                if (!toggleStatus) {
                  d3.select('#' + name + 'g' + j).selectAll('path').attr('stroke', function (d) {
                    let id = d3.select(this).attr('id');
                    if (!toggleStatus) {
                      return '#00000022';
                    } else {
                      return 'none';
                    }
                  });
                }
              });

            // // mirror image of the top curve 
            new_g.append('path')
            .attr('d', curveFuncBottom(data))
            .attr('stroke', stroke)
            .attr('stroke-width', function (d) {
              return (audio.end[i] - audio.start[i]) * 10;
            })
            .attr('fill', fill).on("mouseover", function(d) {
              if (!toggleStatus) {
                d3.select("#" + name + 'g' + j).selectAll('path').attr('stroke', 'black');
              }

            }).on("mouseout", function(d) {
              if (!toggleStatus) {
                d3.select('#' + name + 'g' + j).selectAll('path').attr('stroke', function (d) {
                  let id = d3.select(this).attr('id');
               //   setShowVideo(false);
                  if (!toggleStatus) {
                    return '#00000022';
                  } else {
                    return 'none';
                  }
                });
              }
            }).on('click', function (d) {
              videoHandler(j*30, videoID);

            })
            .attr('id', i);

            let textFill;
            if (!toggleStatus) {
              textFill = 'black';
            } else {
              textFill = 'none';
            }
            new_g.append('text')
            .attr('x', xScaleNew(audio.start[i]))
            .attr('y', (height - yScale(0) / 2) - (margin.top / 6) + 20*(i%4))
            .attr('fill', textFill)
            .attr('font-family', 'Arial')
            .attr('font-size', '15px')
            .text(audio.word[i]);
      }
  }

    // svg.call(zoomBehavior);
    if (!zoomRef.current) {
      // If we haven't stored a zoom state yet, initialize it.
      zoomRef.current = d3.zoomIdentity.scale(.3).translate(window.innerWidth / 5, -window.innerHeight / 1.5);
    }

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        zoomRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomRef.current);

  }, [normalizeStatus, pauseSlider, toggleStatus, width, height, showVideo, videoTime]);


  return (
    <>
    <div class="container">
      <svg ref={svgRef} height={height}></svg>
    </div>
    </>
  );
};

export default AreaPlot;