// src/AreaPlot.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const AreaPlot = ({ videoHandler, audio, width, height, toggleStatus, normalizeStatus, name, pauseSlider, videoID, wordDensityToggle}) => {
  const margin = {left: 0, top:200};
  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

  const svgRef = useRef();
  const zoomRef = useRef();

  let timeSeparation = 30;
  let hoverWidth = 5;

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

    let domain = [75, 125, 250];
    if (normalizeStatus) {

      domain = [smallest, d3.median(noZeroes), d3.max(audio.pitch)];
    }
    let scaleAnomaly = d3.scaleDiverging(t => d3.interpolateSpectral(1 - t))
    .domain(domain);
    if (!normalizeStatus) {
      scaleAnomaly = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
      .domain(domain);
    }

    let pitchScale = d3.scaleLinear()
    .domain(domain)
    .range([0, 0]);

   
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
    let separation = 300;
    for (let j = 0; j < endings.length; j++) {
      var new_g = g.append('g');
      new_g.attr("transform", `translate(0,${separation*j})`);
      new_g.attr("id", name + "g" + j);
      // Draw area paths
      for (let i = endings[j-1]; i < endings[j]; i++) {
        let data;
        if (audio.start[i+1] - audio.end[i] > pauseSlider) {
          data = [[audio.start[i], audio.amp[i], audio.pitch[i]], [audio.end[i], audio.amp[i+1], audio.pitch[i+1]]];
           // data to be used for drawing the area path, should be an array of 2 elements
        } else {
          data = [[audio.start[i], audio.amp[i], audio.pitch[i]], [audio.start[i + 1], audio.amp[i+1], audio.pitch[i+1]]];
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
          .y1(function(d) { return yScale(d[1]) + pitchScale(d[2])})     // Y position of top line breaks
          .y0(function (d) {
            return height/2 + pitchScale(d[2]);
          });
      
          var curveFuncBottom = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return height - yScale(d[1]) + pitchScale(d[2]) })     // Y position of top line breaks
          .y0(function (d) {
            return height/2 + pitchScale(d[2]);
          });

          // if (!toggleStatus) {
          //   new_g.append('line')
          //   .attr('stroke', 'white')
          //   .attr('stroke-width', 2)
          //   .attr('x1', xScaleNew(audio.start[i]))
          //   .attr('y1', height/2)
          //   .attr('x2', xScaleNew(audio.end[i+1]))
          //   .attr('y2', height/2);
          // }
      
          if (audio.start[i+1] - audio.end[i] > pauseSlider) {
            let pause_data = [[audio.end[i], audio.amp[i+1], audio.pitch[i+1]], [audio.start[i+1], audio.amp[i+1], audio.pitch[i+1]]]; // data to be used for drawing the area path, should be an array of 2 elements
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
              .attr('stroke', 'none')
              .attr('stroke-width', function (d) {
                return (audio.end[i] - audio.start[i]) * 10;
              })
              .attr('id', i)
              .attr('fill', fill ).on("mouseover", function(event, d) {
                let possible = (i - 5);
                let startWord = possible >= 0 ? i - 5 : i;
                let text = [];
                for (let k = startWord; k < i + 5; k++) {
                  text.push(audio.word[k]);
                }
                let actualWord = audio.word[i];
                mouseOver(event, j, name, hoverWidth, toggleStatus, text, actualWord);
              }).on('click', function (d) {
                videoHandler(j*30, videoID);
              }).on("mouseout", function(d) {
                mouseOut(j, name, hoverWidth, toggleStatus);
              });

            // // mirror image of the top curve 
            new_g.append('path')
            .attr('d', curveFuncBottom(data))
            .attr('stroke', 'none')
            .attr('stroke-width', function (d) {
              return (audio.end[i] - audio.start[i]) * 10;
            })
            .attr('fill', fill).on("mouseover", function(event, d) {
              let possible = (i - 5);
              let startWord = possible >= 0 ? i - 5 : i;
              let text = [];
              for (let k = startWord; k < i + 5; k++) {
                text.push(audio.word[k]);
              }
              let actualWord = audio.word[i];
              mouseOver(event, j, name, hoverWidth, toggleStatus, text, actualWord);
            }).on("mouseout", function(d) {
              mouseOut(j, name, hoverWidth, toggleStatus);
            }).on('click', function (d) {
              videoHandler(j*30, videoID);

            })
            .attr('id', i);

            // OUTLINES 
            new_g.append('line')
              .attr('stroke', "black")
              .attr('stroke-width', 2)
              .attr('x1', function (d) {
                console.log(xScaleNew(data[0]));
                return xScaleNew(data[0][0]);
              })
              .attr('class', "outline")
              .attr('y1', yScale(data[0][1]) + pitchScale(audio.pitch[i]))
              .attr('x2', xScaleNew(data[1][0]))
              .attr('y2', yScale(data[1][1]) + pitchScale(audio.pitch[i+1]))

            new_g.append('line')
            .attr('stroke', "black")
            .attr('stroke-width', 2)
            .attr('x1', function (d) {
              console.log(xScaleNew(data[0]));
              return xScaleNew(data[0][0]);
            })
            .attr('class', "outline")
            .attr('y1', height - yScale(data[0][1]) + pitchScale(audio.pitch[i]))
            .attr('x2', xScaleNew(data[1][0]))
            .attr('y2', height - yScale(data[1][1]) + pitchScale(audio.pitch[i+1]))

            // Lines + Word Separation 
            if (wordDensityToggle) {
              new_g.append('line')
                .attr('stroke', "black")
                .attr('stroke-width', function (d) {
                  return (audio.end[i] - audio.start[i]) * 10;
                })
                .attr('x1', function (d) {
                  console.log(xScaleNew(data[0]));
                  return xScaleNew(data[0][0]);
                })
                .on("mouseover", function(event, d) {
                  let possible = (i - 5);
                  let startWord = possible >= 0 ? i - 5 : i;
                  let text = [];
                  for (let k = startWord; k < i + 5; k++) {
                    text.push(audio.word[k]);
                  }
                  let actualWord = audio.word[i];
                  mouseOver(event, j, name, hoverWidth, toggleStatus, text, actualWord);
    
                }).on("mouseout", function(d) {
                  mouseOut(j, name, hoverWidth, toggleStatus);
                })
                .attr('y1', yScale(data[0][1]) + pitchScale(audio.pitch[i]))
                .attr('x2', xScaleNew(data[0][0]))
                .attr('y2', height - yScale(data[0][1]) + pitchScale(audio.pitch[i]))
            }


            // TEXT 
            // let textFill;
            // if (!toggleStatus) {
            //   textFill = 'black';
            // } else {
            //   textFill = 'none';
            // }
            // new_g.append('text')
            // .attr('x', xScaleNew(audio.start[i]))
            // .attr('y', (height - yScale(0) / 2) - (margin.top / 6) + 20*(i%4))
            // .attr('fill', textFill)
            // .attr('font-family', 'Arial')
            // .attr('font-size', '15px')
            // .text(audio.word[i]);
      }
  }

    // svg.call(zoomBehavior);
    if (!zoomRef.current) {
      // If we haven't stored a zoom state yet, initialize it.
      zoomRef.current = d3.zoomIdentity.scale(.3).translate(window.innerWidth / 11, -window.innerHeight / 1.5);
    }

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.2, 5])
      .on('zoom', (event) => {
        zoomRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomRef.current);

  }, [normalizeStatus, pauseSlider, toggleStatus, width, height, showVideo, videoTime, wordDensityToggle]);


  return (
    <>
    <div class="container">
      <svg ref={svgRef} height={height}></svg>
    </div>
    </>
  );
};

function mouseOver(event, j, name, hoverWidth, toggleStatus, text, actualWord) {
  if (!toggleStatus) {
    d3.select("#" + name + 'g' + j).selectAll('.outline').attr('stroke', 'black').attr('stroke-width', hoverWidth);
  }

  console.log(text);
  let actual = "";
  console.log(actualWord);
  for (let i = 0; i < text.length; i++) {
    if (i != 5) {
      actual += " " + text[i];
    } else {
      actual += " " + "<b>" + text[i] + "</b>" + " ";
    }
  }
  let tooltip = d3.select("#tooltip");

  tooltip.html(actual)
  .style("visibility", "visible")
  .style("top", (event.pageY - 100) + "px")
  .style("left", (event.pageX - 200) + "px");
}

function mouseOut(j, name, hoverWidth, toggleStatus) {
  if (!toggleStatus) {
    d3.select("#" + name + 'g' + j).selectAll('.outline').attr('stroke-width', 2).attr('stroke', function (d) {
      if (!toggleStatus) {
        return '#000000';
      } else {
        return 'none';
      }
    });
  }

  // if (!toggleStatus) {
  //   for (let i=0; i < j; i++) {
  //     d3.select("#" + name + 'g' + i).selectAll('.outline').attr('stroke-width', 2).attr('stroke', '#000000');
  //   }
  // }

  d3.select("#tooltip").style("visibility", "hidden");


}

export default AreaPlot;