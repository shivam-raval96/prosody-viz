// src/AreaPlot.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { mean, round, min, max, std } from 'mathjs'

const AreaPlot = ({ videoHandler, audio, width, height, caedenceStatus, pauseStatus, normalizeStatus, tiledStatus, name, pauseSlider, speedSlider, timeSlider, videoID, wordDensityToggle}) => {
  const margin = {left: 0, top:200};
  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [pausespm, setPausespm] = useState(0);
  const [emphwords, setEmphwords] = useState(0);

  

  const svgRef = useRef();
  const zoomRef = useRef();

  let timeSeparation = timeSlider;
  let hoverWidth = 10;

  var [avgpitch,pitchrange,emphwordcount,pauses, wordspm] = [0,0,0,0,0]
  avgpitch = round(mean(audio.pitch),0)
  wordspm = round(audio.word.length/audio.end[audio.word.length-1]*60,0)
  pitchrange = (round(std(audio.pitch),0))
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

    let domain = [75, 125, 280];
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
      if (caedenceStatus){
        if (audio.start[i+1] - audio.end[i] > pauseSlider) {
          console.log(audio.start[i+1] - audio.end[i])
          endings.push(i);
        }
      }else{
        if (audio.end[i] - lastEnd > timeSeparation) {
          endings.push(i);
          lastEnd = audio.end[i];
        }
      }
    }
    endings.push(audio.time.length-1)
    let offset = 0;
    let endIndex = endings[0];
    let startIndex = 0;
    lastEnd = 0;
    let separation = (tiledStatus)?340:380;
    for (let j = 0; j < endings.length; j++) {
      var new_g = g.append('g');
      new_g.attr("transform", `translate(0,${separation*(j+1)})`);
      new_g.attr("id", name + "g" + j);
      // Draw area paths
      for (let i = (j==0)? 0 :endings[j-1]; i < endings[j]; i++) {

        let data;
        if (audio.start[i+1] - audio.end[i] > pauseSlider) {
          pauses++
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
          
          if (tiledStatus){
            let outlinewidth = 5
            var tileFunc = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return 0+separation})     // Y position of top line breaks
          .y0(function (d) {return 200+separation});


          var curveFunc = d3.area()
          .x(function(d) { return xScaleNew(d[0]) })      // Position of both line breaks on the X axis
          .y1(function(d) { return  yScale(d[1]) -185+separation })     // Y position of top line breaks
          .y0(function (d) {
            return height/2 -185+separation;
          });
      
      
          //pauses
          if (audio.start[i+1] - audio.end[i] > pauseSlider) {
            let pause_data = [[audio.end[i], audio.amp[i+1], audio.pitch[i+1]], [audio.start[i+1], audio.amp[i+1], audio.pitch[i+1]]]; // data to be used for drawing the area path, should be an array of 2 elements
            new_g.append('path')
            .attr('d', tileFunc(pause_data))
            .attr('stroke', 'black')
            .attr('stroke-width', outlinewidth).attr('class', "outline pauses")
            .attr('fill', pauseStatus?'black':'white');

            

            
          }
          let fill, stroke;
          if (!pauseStatus) {
            fill = scaleAnomaly(audio.pitch[i]);
            stroke = '#000000';
          } else {
            fill = '#20202011';
            stroke = 'none';
          }
            
            new_g.append('path')
              .attr('d', tileFunc(data))
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
                mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord);
              }).on('click', function (d) {
                setVideoTime(round(audio.start[i]-0.5))
                makePointer(videoTime, xScaleNew)
                videoHandler(round(audio.start[i]-0.5), videoID);
              }).on("mouseout", function(d) {
                mouseOut(j, name, hoverWidth, pauseStatus,outlinewidth);
              });

              if (!pauseStatus){
              new_g.append('path')
              .attr('d', curveFunc(data))
              .attr('stroke', 'none')
              .attr('stroke-width', function (d) {
                return (audio.end[i] - audio.start[i]) * 10;
              })
              .attr('id', i)
              .attr('fill', 'black');}

              

    

            // OUTLINES 
            new_g.append('line')
              .attr('stroke', "black")
              .attr('stroke-width', outlinewidth)
              .attr('x1', function (d) {
                return xScaleNew(data[0][0]);
              })
              .attr('class', "outline")
              .attr('y1', 0+separation)
              .attr('x2', xScaleNew(data[1][0]))
              .attr('y2', 0+separation)

            new_g.append('line')
            .attr('stroke', "black")
            .attr('stroke-width', outlinewidth)
            .attr('x1', function (d) {
              return xScaleNew(data[0][0]);
            })
            .attr('class', "outline")
            .attr('y1', 200+separation)
            .attr('x2', xScaleNew(data[1][0]))
            .attr('y2', 200+separation)


            // Lines + Word Separation 
            if (wordDensityToggle) {
              new_g.append('line')
                .attr('stroke', "black")
                .attr('stroke-width', function (d) {
                  return (audio.end[i] - audio.start[i]) * 10;
                })
                .attr('x1', function (d) {
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
                  mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord);
    
                }).on("mouseout", function(d) {
                  mouseOut(j, name, hoverWidth, pauseStatus,outlinewidth);
                })
                .attr('y1', 0+separation )
                .attr('x2', xScaleNew(data[0][0]))
                .attr('y2', 200+separation)
            }
          }else{

          

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

          // if (!pauseStatus) {
          //   new_g.append('line')
          //   .attr('stroke', 'white')
          //   .attr('stroke-width', 2)
          //   .attr('x1', xScaleNew(audio.start[i]))
          //   .attr('y1', height/2)
          //   .attr('x2', xScaleNew(audio.end[i+1]))
          //   .attr('y2', height/2);
          // }
      
          //pauses
          if (audio.start[i+1] - audio.end[i] > pauseSlider) {
            let pause_data = [[audio.end[i], audio.amp[i+1], audio.pitch[i+1]], [audio.start[i+1], audio.amp[i+1], audio.pitch[i+1]]]; // data to be used for drawing the area path, should be an array of 2 elements
            new_g.append('path')
            .attr('d', curveFunc(pause_data))
            .attr('stroke', 'none')
            .attr('stroke-width', 5)
            .attr('fill', pauseStatus?'black':'gray');

            new_g.append('path')
            .attr('d', curveFuncBottom(pause_data))
            .attr('stroke', 'none')
            .attr('stroke-width', 5)
            .attr('fill', pauseStatus?'black':'gray');

            
          }
          let fill, stroke;
          if (!pauseStatus) {
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
                mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord);
              }).on('click', function (d) {
                setVideoTime(round(audio.start[i]-0.5))
                makePointer(videoTime, xScaleNew)
                videoHandler(round(audio.start[i]-0.5), videoID);
              }).on("mouseout", function(d) {
                mouseOut(j, name, hoverWidth, pauseStatus);
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
              mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord);
            }).on("mouseout", function(d) {
              mouseOut(j, name, hoverWidth, pauseStatus);
            }).on('click', function (d) {
              setVideoTime(round(audio.start[i]-0.5))
              videoHandler(j*30, videoID);

            })
            .attr('id', i);

            // OUTLINES 
            new_g.append('line')
              .attr('stroke', "black")
              .attr('stroke-width', 2)
              .attr('x1', function (d) {
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
                  mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord);
    
                }).on("mouseout", function(d) {
                  mouseOut(j, name, hoverWidth, pauseStatus);
                })
                .attr('y1', yScale(data[0][1]) + pitchScale(audio.pitch[i]))
                .attr('x2', xScaleNew(data[0][0]))
                .attr('y2', height - yScale(data[0][1]) + pitchScale(audio.pitch[i]))
            }

          }
             //TEXT 
             let textFill;
             if (!pauseStatus) {
               textFill = 'black';
             } else {
               textFill = 'none';
             }
             let speed = (audio.end[i]-audio.start[i])/audio.word[i].length
             if(speed>speedSlider[0] && speed<speedSlider[1]){
            emphwordcount++
             new_g.append('text')
             .attr('x', xScaleNew(audio.start[i]))
             .attr('y', (height - yScale(0) / 2) - (margin.top / 4) + (tiledStatus)*60+15*(i%5))
             .attr('fill', textFill)
             .attr('font-family', 'Arial')
             .attr('font-size', '20px')
             .text(audio.word[i]);}
      }
  }
      console.log(emphwordcount)
      setPausespm(round(pauses/audio.end[audio.word.length-1]*60,0))
      setEmphwords(round(emphwordcount/audio.end[audio.word.length-1]*60,0))

    // svg.call(zoomBehavior);
    if (!zoomRef.current) {
      // If we haven't stored a zoom state yet, initialize it.
      zoomRef.current = d3.zoomIdentity.scale(.3).translate(window.innerWidth / 11, -window.innerHeight / 1.5);
    }

    const zoomBehavior = d3.zoom()
      .scaleExtent([0.05, 5])
      .on('zoom', (event) => {
        zoomRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomRef.current);


    function makePointer(videoTime, scale){
      
    }

    var index=endings.findIndex(function(number) {
      return number > videoTime;
    });
    //console.log(videoTime, endings, index)


  }, [audio, normalizeStatus, pauseSlider, speedSlider, timeSlider, caedenceStatus, pauseStatus, tiledStatus, width, height, showVideo, videoTime, wordDensityToggle]);


  return (
    <>
    <div className="container">
      <svg ref={svgRef} height={height}></svg>
      
      <div className="stats" style={{ height: height*0.25 }}>
        <h6><b>Speaker stats</b></h6>
        Pauses per minute: {pausespm}<br/>
        Words per minute: {wordspm}<br/>
        Emphasized Words per min: {emphwords}<br/>
        Average pitch: {avgpitch} Hz<br/>
        Dynamic Pitch Range: {3*pitchrange} Hz
      </div>
    </div>
    </>
  );
};

function mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord) {
  if (!pauseStatus) {
    d3.select("#" + name + 'g' + j).selectAll('.outline').attr('stroke', 'black').attr('stroke-width', hoverWidth);
  }

  let actual = "";
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

function mouseOut(j, name, hoverWidth, pauseStatus) {
  if (!pauseStatus) {
    d3.select("#" + name + 'g' + j).selectAll('.outline').attr('stroke-width', 2).attr('stroke', function (d) {
      if (!pauseStatus) {
        return '#000000';
      } else {
        return 'none';
      }
    });
  }

  // if (!pauseStatus) {
  //   for (let i=0; i < j; i++) {
  //     d3.select("#" + name + 'g' + i).selectAll('.outline').attr('stroke-width', 2).attr('stroke', '#000000');
  //   }
  // }

  d3.select("#tooltip").style("visibility", "hidden");


}

export default AreaPlot;