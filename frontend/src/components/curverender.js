// src/AreaPlot.js
import React, { useRef, useEffect, useState,useContext,createContext } from 'react';
import * as d3 from 'd3';
import { mean, round, min, max, std } from 'mathjs'
import axios from "axios";
const NumberContext = createContext();
  
const localDevURL = "http://127.0.0.1:8000/";
const AreaPlot = ({ videoHandler, audio, width, height, caedenceStatus, pauseStatus, normalizeStatus, tiledStatus, name, pauseSlider, speedSlider, timeSlider, videoID, wordDensityToggle, averageAmplitude, averageSpeed, averagePitch, phraseStart, phraseEnd,isOne,dtwCallback,dtwData, amplitudeScale, isLoading}) => {
  const margin = {left: 0, top:200};
  console.log(audio)
  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [pausespm, setPausespm] = useState(0);
  const [emphwords, setEmphwords] = useState(0);
  const [endings, setEndings] = useState([]);
  //const [currentAudio,setCurrentAudio] =useState(null);
  
  const [dataOne, setDataOne] =useState({ minDistIndex:-1, phraseStart:-1, phraseEnd:-1, dists: -1 });
  const [dataTwo, setDataTwo] =useState({ minDistIndex:-1, phraseStart:-1, phraseEnd:-1, dists: -1 });

  const [statsOpenOne, setStatsOpenOne] = useState(true); // New state for stats window
  const [statsOpenTwo, setStatsOpenTwo] = useState(true); // New state for stats window


  const svgRef = useRef();
  const zoomRef = useRef();

  const totalSpeechLength = getTotalSpeechLength(audio);

  let timeSeparation = timeSlider;
  let hoverWidth = 10;

  var [pitchrange,emphwordcount,pauses, wordspm] = [0,0,0,0,0]
  wordspm = round(audio.word.length/audio.end[audio.word.length-1]*60,0)
  pitchrange = (round(std(audio.pitch),0))
  useEffect(() => {
    console.log("DTW Changed: "+dtwData);
    if (dtwData) {
      handleDTWData(dtwData);
    }
  }, [dtwData]);
  const handleDTWData = (index) => {
    if (!Array.isArray(index)) {
      console.error("Expected an array but received:", index);
      return;
    } 

    const parsedIndexList = index.map(value => parseFloat(value));

    const minDist=Math.pow(Math.min(...parsedIndexList),1)+0.05;

    console.log("Received matching indices: ", parsedIndexList);
    console.log("Endings Length2: "+endings.length);
    for(let i=0;i<parsedIndexList.length;i++){
      console.log("Phrase "+i+" opacity: "+(0.8*minDist/(Math.pow(parsedIndexList[i],1)+0.05)));
      drawBoxAroundOneWordHelper(Math.floor(i),isOne,endings,phraseStart,phraseEnd, 0.8*minDist/(Math.pow(parsedIndexList[i],1)+0.05));
    }
  };
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    console.log("DTW: "+dtwData);


    svg.
    attr("style", "background-color: ffffff");

    // Clear previous content
    svg.selectAll('*').remove();

    // Calculate the midpoint of the amplitude (mean value)
    const [minAmp, maxAmp] = d3.extent(audio.amp);
    const midpointAmp = (minAmp + maxAmp) / 2;

    var yScale = d3.scaleLinear()
      .domain(d3.extent(audio.amp))
      .range([height/1.7*amplitudeScale, margin.top]);

    // Calculate the y position of the midpoint using the yScale
    const midpointY = yScale(midpointAmp);

    var noZeroes = audio.pitch.filter(function(d) { return d !== 0; });
    let smallest = d3.min(noZeroes);
    let largest = d3.max(noZeroes);
    let median = d3.median(noZeroes);
    let adj = (largest - median) * 0.5;

    let pitchMean = d3.mean(audio.pitch);
    let pitchStdDev = d3.deviation(audio.pitch);

    // Define the range of the data (audio.start and audio.end should be arrays of timestamps)
  const dataStart = d3.min(audio.start);
  const dataEnd = d3.max(audio.end);

  // Define the width of your SVG
  const svgWidth = parseInt(svg.style("width"), 10); // Or a fixed value, e.g., 800

  // Create a linear scale for x-axis mapping
  const xScale = d3.scaleLinear()
    .domain([dataStart, dataEnd]) // Input domain (data range)
    .range([0, svgWidth]); // Output range (pixels in SVG)


    let domain = [60, 150, 250];
    if (normalizeStatus) {
      domain = [30, 70, 100];
    }
    // let scaleAnomaly = d3.scaleDiverging(t => d3.interpolateRgb("#8B0000", "#d2b48c", "#5C4033")(1 - t))
    // .domain(domain);

    let scaleAnomaly = d3.scaleDiverging(t => {
      // Define a three-color interpolator
      const colorScale = d3.scaleLinear()
        .domain(domain) // Normalized domain for t
        // .range(["#5C4033", "#d2b48c", "#d36b6e"]) // Three colors: brown, tan (beige), pink (highest)
        .range(["#d3d3d3", "#8b0000", "#ff69b4"])
        .interpolate(d3.interpolateRgb); // Smooth interpolation
    
      return colorScale(t); // Map t to the interpolated color
    });

    const [lo, hi] = d3.extent(audio.pitch);          // fast min-&-max in one pass :contentReference[oaicite:0]{index=0}
    const mid      = (lo + hi) / 2;                   // neutral white

    scaleAnomaly = d3.scaleDiverging(t => d3.interpolateRdBu(1 - t))
                    .domain(
                      normalizeStatus
                        ? [lo, mid, hi]             // normalised diverging domain
                        : [60, 150, 250]            // original fixed domain
                    );

    let pitchScale = d3.scaleLinear()
    .domain([d3.min(audio.pitch), d3.max(audio.pitch)])
    .range([0, 0]);

   
    const g = svg.append('g');

    // Midpoint
        g.append('line')
        .attr('x1', margin.left)  // Starting x position (adjust as needed)
        .attr('x2', width - margin.right)  // Ending x position (adjust as needed)
        .attr('y1', midpointY)
        .attr('y2', midpointY)
        .attr('stroke', 'black')  // Line color
        .attr('stroke-width', 1);  // Line thickness
   
    console.log("Appending midpoint line at y:", midpointY);
    
    let lastEnd = 0;
    setEndings([]);
    for (let i = 0; i < audio.time.length-1; i++) {
      if (caedenceStatus){
        if (audio.start[i+1] - audio.end[i] > pauseSlider) {
          endings.push(i + 1);
        }
      }else{
        if (audio.end[i] - lastEnd > timeSeparation) {
          endings.push(i);
          lastEnd = audio.end[i];
        }
      }
    }   
    
    endings.push(audio.time.length-1)
    console.log("Endings Length: "+endings.length+" \n endings: "+endings.toString());
    let offset = 0;
    let endIndex = endings[0];
    let startIndex = 0;
    lastEnd = 0;
    let separation = (tiledStatus)?340:380;
    console.log("AD: "+audio);
    for (let j = 0; j < endings.length; j++) {
      var new_g = g.append('g');
      new_g.attr("transform", `translate(0,${separation*(j+1)})`);
      new_g.attr("id", name + "g" + j);
      
      const linesGroup = new_g.insert("g", ":first-child");

      // Compute the top and bottom for this row using your existing yScale range:
      // Note: yScale.range() was defined as: [ height/1.7 * amplitudeScale, margin.top ]
      const rowTop = margin.top; // smaller y: top
      const rowBottom = (height / 1.7) * amplitudeScale; // larger y: bottom
      const deltaY = rowBottom - rowTop;

      // Define the five positions:
      // The first (top) and fifth (bottom) represent the maximum amplitude.
      // The third line is centered (0%) and the second and fourth are at 50% intervals.
      const positions = [
        rowTop,
        rowTop + deltaY * 0.25,
        rowTop + deltaY * 0.5,
        rowTop + deltaY * 0.75,
        rowBottom
      ];
      const labels = ["100%", "50%", "0%", "50%", "100%"];

      let yOffset=21
      // For each position, append a horizontal line and a text label at the left edge.
      positions.forEach((yPos, i) => {
        linesGroup.append("line")
          .attr("x1", 0)
          .attr("x2", width*2.32)  // spans the entire row width
          .attr("y1", yPos+yOffset)
          .attr("y2", yPos+yOffset)
          .attr("stroke","black")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "4,0");  // dashed line

        linesGroup.append("text")
          .attr("x", -50)  // slight padding from the left edge
          .attr("y", yPos+yOffset) // adjust vertically, as needed
          .attr("fill", "black")
          .attr("font-size", "20px")
          .text(labels[i]);
      });


      /*endIndex=endings[j];
      lastEnd=endings[j];
      startIndex=(j==0)?0:endings[j-1];*/
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


          if (!caedenceStatus&&audio.end[i] - lastEnd > timeSeparation) {
            console.log("SEGMENTING");
            offset++;
            lastEnd = audio.end[i];
            endIndex = endings[offset];
            startIndex = endings[offset-1];
          }
          else if(caedenceStatus){
            console.log('CUT OFF AT PAUSES');
            endIndex=endings[j];
            //lastEnd=endings[j]; 
            startIndex=(j==0)?0:endings[j-1];

            console.log('Start, End: ', startIndex, endIndex)
          }

          var XSCALEMULTI=50.0;
          // Set up scales
          
          var xScaleNew = d3.scaleLinear()
          .domain(d3.extent(audio.end.slice(startIndex, endIndex + 1)))
          .range([margin.left, caedenceStatus?((audio.end[endIndex]-audio.start[startIndex])*XSCALEMULTI):1800])
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
            let pause_data;
    
            if (caedenceStatus) {
                // Pause placed at the end of the previous segment when caedenceStatus is true
                pause_data = [[audio.end[i], audio.amp[i], audio.pitch[i]], [audio.start[i+1], audio.amp[i+1], audio.pitch[i+1]]];
            } else {
                // Normal behavior: pause between current and next segment
                pause_data = [[audio.start[i], audio.amp[i], audio.pitch[i]], [audio.end[i], audio.amp[i+1], audio.pitch[i+1]]];
            }
    
            // Add the path for the pause area
            new_g.append('path')
                .attr('d', tileFunc(pause_data))
                .attr('stroke', 'black')
                .attr('stroke-width', outlinewidth)
                .attr('class', "outline pauses")
                .attr('fill', caedenceStatus ? 'gray' : (pauseStatus ? 'black' : 'white')); // Set fill to gray when caedenceStatus is true
        }
          

          let fill, stroke;
          console.log('PAUSESTATUS: ', pauseStatus)
          if (!pauseStatus) {
            fill = scaleAnomaly(audio.pitch[i]);
            console.log('CUR AUDIO: ', audio.pitch[i]);
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
          .attr('data-word', audio.word[i])  
          .attr('fill', fill ).on("mouseover", function(event, d) {
            let possible = (i - 5);
            let startWord = possible >= 0 ? i - 5 : 0;
            let text = [];
            for (let k = startWord; k < i + 5; k++) {
              text.push(audio.word[k]);
            }
            let actualWord = audio.word[i];
            mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord,i,phraseStart,phraseEnd);
          }).on('click', function (d) {
            //  const { minDistIndex, isOne, phraseStart, phraseEnd, dists } = dtw_comparison(i)
            //setNumber(minIndex)
            //setVideoTime(round(audio.start[i]-0.5))
            //makePointer(videoTime, xScaleNew)
            //videoHandler(round(audio.start[i]-0.5), videoID);
            
            let indice=return_phrase_index(i,phraseStart,phraseEnd);
            dtwCallback(indice,isOne);
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
              .attr('fill', 'black');
            }

              

    

            // OUTLINES 
            new_g.append('line')
              .attr('stroke', "black")
              .attr('pointer-events', 'none')
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
            .attr('pointer-events', 'none')
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
                  let startWord = possible >= 0 ? i - 5 : 0;
                  let text = [];
                  for (let k = startWord; k < i + 5; k++) {
                    text.push(audio.word[k]);
                  }
                  let actualWord = audio.word[i];
                  mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord,i,phraseStart,phraseEnd);
    
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
          if(data!=null){
            new_g.append('path')
              .attr('d', curveFunc(data))
              .attr('stroke', 'none')
              .attr('stroke-width', function () {
                return (audio.end[i] - audio.start[i]) * 10;
              })
              .attr('id', i) 
              .attr('data-word', audio.word[i])               
              .attr('fill', fill )
              .on("mouseover", function(event) {
                let possible = (i - 5);
                let startWord = possible >= 0 ? i - 5 : 0;
                let text = [];
                for (let k = startWord; k < i + 5; k++) {
                  text.push(audio.word[k]);
                }
                let actualWord = audio.word[i];
                mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord,i,phraseStart,phraseEnd);
              })
              .on('click', function (d) {
                videoHandler(round(audio.start[i]-0.5), videoID);
                
                let indice=return_phrase_index(i,phraseStart,phraseEnd);
                dtwCallback(indice,isOne);
              })
              .on("mouseout", function(d) {
                mouseOut(j, name, hoverWidth, pauseStatus);
                d3.select(this.parentNode).selectAll('.highlight-box').remove();
              });

              new_g.append('path')
              .attr('d', curveFuncBottom(data))
              .attr('stroke', 'none')
              .attr('stroke-width', function () {
                return (audio.end[i] - audio.start[i]) * 10;
              })
              .attr('data-word', audio.word[i])
              .attr('id', i)   
              .attr('fill', fill)
              .on("mouseover", function(event) {
                let possible = (i - 5);
                let startWord = possible >= 0 ? i - 5 : 0;
                let text = [];
                for (let k = startWord; k < i + 5; k++) {
                  text.push(audio.word[k]);
                }
                let actualWord = audio.word[i];
                mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord,i,phraseStart,phraseEnd);
              })
              .on("mouseout", function(d) {
                mouseOut(j, name, hoverWidth, pauseStatus);
                d3.select(this.parentNode).selectAll('.highlight-box').remove();
              })
              .on('click', function (d) {
                videoHandler(round(audio.start[i]-0.5), videoID);
                let indice=return_phrase_index(i,phraseStart,phraseEnd);
                dtwCallback(indice,isOne);
              });


              // OUTLINES 
              new_g.append('line')
                .attr('stroke', "black")
                .attr('stroke-width', 2)
                .attr('pointer-events', 'none')
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
                .attr('pointer-events', 'none')
                .attr('x1', function (d) {
                  return xScaleNew(data[0][0]);
                })
                .attr('pointer-events', 'none')
                .attr('class', "outline")
                .attr('y1', height - yScale(data[0][1]) + pitchScale(audio.pitch[i]))
                .attr('x2', xScaleNew(data[1][0]))
                .attr('y2', height - yScale(data[1][1]) + pitchScale(audio.pitch[i+1]))
            }
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
                  mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord,i,phraseStart,phraseEnd);
    
                }).on("mouseout", function(d) {
                  mouseOut(j, name, hoverWidth, pauseStatus);
                })
                .attr('y1', yScale(data[0][1]) + pitchScale(audio.pitch[i]))
                .attr('x2', xScaleNew(data[0][0]))
                .attr('y2', height - yScale(data[0][1]) + pitchScale(audio.pitch[i]))
            }
          }
          
             //Emphasized Text 
             let textFill;
             if (!pauseStatus) {
               textFill = 'black';
             } else {
               textFill = 'none';
             }
             let speed=0;
             if(audio.word[i]!=null){
              speed = (audio.end[i]-audio.start[i])/audio.word[i].length
             }
             if(speed>speedSlider[0] && speed<speedSlider[1]){
              emphwordcount++
              let xPos = xScaleNew(audio.start[i]);
              let yPos = (height - yScale(0) / 2) - (margin.top / 4) + (tiledStatus)*60+15*6;

              new_g.append('text')
              .attr('x', xPos)
              .attr('y', yPos)
              .attr('fill', textFill)
              .attr('font-family', 'Arial')
              .attr('font-size', '20px')         
              .text(audio.word[i])
              .attr('transform', `rotate(270 ${xPos}, ${yPos})`)
            }

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
//    drawBoxAroundWords()
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.05, 5])
      .on('zoom', (event) => {
        zoomRef.current = event.transform;
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior).call(zoomBehavior.transform, zoomRef.current);

    var index=endings.findIndex(function(number) {
      return number > videoTime;
    });
    //console.log(videoTime, endings, index)
    const uniqueId = isOne ? "1" : "2";
    // Create an object with your stats data. (Make sure these variables are in scope.)
    const statsData = { pausespm, wordspm, emphwords, averageSpeed, averageAmplitude, averagePitch, pitchrange, totalSpeechLength };
    createStatsWindow(svg, uniqueId, statsData)

    if (isLoading) {
      // Remove any prior overlay
      svg.selectAll(".loading-overlay").remove();

      svg.append("foreignObject")
        .attr("class", "loading-overlay")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("background", "rgba(0, 0, 0, 0.5)")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .html("<div style='color: white; font-size: 20px;'>Processing Audio...</div>");
    } else {
      svg.selectAll(".loading-overlay").remove();
    }


  }, [audio, normalizeStatus, pauseSlider, speedSlider, timeSlider, caedenceStatus, pauseStatus, tiledStatus, width, height, showVideo, videoTime, wordDensityToggle]);


  return (
    <>
    <div className="container">
      <svg ref={svgRef} height={height}></svg>
      
      {/* <div className="stats" style={{ width: width * 0.7, height: height*0.3, marginTop: height * 0.2 }}>
        <h6><b>Speaker stats</b></h6>
        Pauses per minute: {pausespm}<br/>
        Words per minute: {wordspm}<br/>
        Emphasized Words per min: {emphwords}<br/>
        Average Speaking Speed: {averageSpeed.toFixed(3)}<br/>
        Average Amplitude: {averageAmplitude.toFixed(3)}<br/>
        Average pitch: {averagePitch.toFixed(3)} Hz<br/>
        Dynamic Pitch Range: {3*pitchrange} Hz <br/>
        Total Speech Length: {totalSpeechLength} secs
      </div> */}
    </div>
    </>
  );
};

function createStatsWindow(svg, uniqueId, statsData) {
  const { pausespm, wordspm, emphwords, averageSpeed, averageAmplitude, averagePitch, pitchrange, totalSpeechLength } = statsData;
  const statsClass = `statsWindow-${uniqueId}`;

  // Remove any existing "Show Stats" text for this uniqueId to avoid duplicates
  d3.select(`#show-stats-${uniqueId}`).remove();

  // Append the stats window via foreignObject
  const statsFO = svg.append("foreignObject")
    .attr("x", 10)
    .attr("y", 10)
    .attr("width", 200)
    .attr("height", 150)
    .attr("class", statsClass);

  statsFO.append("xhtml:div")
    .html(`
      <div style="background: white; border: 1px solid #ccc; padding: 10px; font-size: 12px; position: relative;">
        <button id="minimize-btn-${uniqueId}" style="position: absolute; top: 2px; right: 2px; border: none; background: transparent; cursor: pointer;">&#x2715;</button>
        <h6><b>Speaker Stats</b></h6>
        Pauses per minute: ${pausespm}<br/>
        Words per minute: ${wordspm}<br/>
        Average Speaking Speed: ${averageSpeed.toFixed(3)}<br/>
        Average Amplitude: ${averageAmplitude.toFixed(3)}<br/>
        Average Pitch: ${averagePitch.toFixed(3)} Hz<br/>
        Dynamic Pitch Range: ${3 * pitchrange} Hz<br/>
        Total Speech Length: ${totalSpeechLength} secs
      </div>
    `);

  // Attach minimize event for this unique stats window
  d3.select(`#minimize-btn-${uniqueId}`).on("click", function() {
    statsFO.remove();
    // Append a small clickable text.
    svg.append("foreignObject")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", 100)
      .attr("height", 30)
      .attr("id", `show-stats-${uniqueId}`)
      .append("xhtml:button")
      .style("font-size", "12px")
      .style("cursor", "pointer")
      .text("Show Stats")
      .on("click", function() {
          d3.select(`#show-stats-${uniqueId}`).remove();
          createStatsWindow(svg, uniqueId, statsData);
      });
  });
}
function getTotalSpeechLength(audio) {
  // Check if audio.end exists and has at least one element
  if (audio && Array.isArray(audio.end) && audio.end.length > 0) {
    // Return the last value in the 'end' array, which represents the total speech length
    return audio.end[audio.end.length - 1];
  } else {
    // If the audio.end array is empty or undefined, return 0
    return 0;
  }
}


function mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord, i,phraseStart,phraseEnd) {
  if (!pauseStatus) {
    d3.select("#" + name + 'g' + j).selectAll('.outline').attr('stroke', 'black').attr('stroke-width', hoverWidth);
  }
  //console.log("PS: "+phraseStart);
  //console.log("PE: "+phraseEnd);
  let startEndIndex=[-1,-1];
  if(phraseStart!=null&&phraseEnd!=null){
    startEndIndex=return_phrase_bounds(i,phraseStart,phraseEnd);
  }
  //Bolds the fifth word(fifth is always the hovered one)
  let actual = "";
  let hasBolded=false;
  //console.log("id: "+(text.length-5+i-5)+" start: "+startEndIndex[0]+" end: "+startEndIndex[1]);

  for (let k = 0; k < text.length; k++) {
    //console.log("TL: "+text.length);
    
    //console.log("i: "+i);
    if (k == text.length-5){ //&& !(!hasBolded&&i==text.length-1)) {
      hasBolded=true;
      actual += " " + "<b>" + text[k] + "</b>" + " ";
    }
    else if(k+i-5>=startEndIndex[0]&&k+i-5<=startEndIndex[1]){
      actual += " " + "<i>" + text[k] + "</i>" + " ";
    } 
    else {
      actual += " " + text[k];
      
    }
  }
  let tooltip = d3.select("#tooltip");
 
  tooltip.html(actual)
  .style("visibility", "visible")
  .style("top", (event.pageY - 100) + "px")
  .style("left", (event.pageX - 200) + "px");
  //Get the right phrase bounds for the start and end
  if(phraseStart!=null&&phraseEnd!=null){
    drawBoxAroundWords(j,name,startEndIndex[0],startEndIndex[1],0.3);
  }
  //drawBoxAroundWord(j, name, actualWord,i);

}
function drawBoxAroundWords(groupIndex, groupName, i, j, opacity) {
  const groupId = `#${groupName}g${groupIndex}`;
  console.log(`Group ID: ${groupId}`);

  // Select the first and second word paths
  const pathSelector1 = `path[id='${i}']`;
  const pathSelector2 = `path[id='${j}']`;
  let isSeparate1=false;
  let isSeparate2=false;

  let pathElement1 = d3.select(groupId).select(pathSelector1);
  if(pathElement1.empty()){
    try{pathElement1=d3.select(`#${groupName}g${groupIndex-1}`).select(pathSelector1);}
    catch(e){console.log(e);}

    /*if(pathElement1.empty()) pathElement1=d3.select(groupId);
    else*/ isSeparate1=true;

    if(pathElement1.empty()){console.log("P1 still null");isSeparate1=true;}

  }
  
  //console.log("P1: "+pathElement1.toString());
  let pathElement2 = d3.select(groupId).select(pathSelector2);
  if(pathElement2.empty()){
    try{pathElement2=d3.select(`#${groupName}g${groupIndex+1}`).select(pathSelector2);}
    catch(e){console.log(e);}
    
    /*if(pathElement2.empty())pathElement2=d3.select(`#${groupName}g${groupIndex}`);
    else*/ isSeparate2=true;

    if(pathElement2.empty()){console.log("P2 still null");isSeparate2=true;    }
  }

  //console.log("P2: "+pathElement2.toString());
  if (!pathElement1.empty() && !pathElement2.empty()) {
      if(!isSeparate1&&!isSeparate2) drawBoxHelper(pathElement1,pathElement2,groupId,opacity);
      else {
        console.log("Box not drawn");
        console.log("Separate "+isSeparate1.toString()+isSeparate2.toString());
        var pathEnd1=d3.select(`#${groupName}g${groupIndex-1}`).select('path');
        var pathEnd2=d3.select(`#${groupName}g${groupIndex+1}`).select('path');

        drawBoxHelper(pathElement1,
          isSeparate1?pathEnd1:d3.select(groupId).select('path'),
          (isSeparate1?`#${groupName}g${groupIndex-1}`:groupId),
          opacity);
        drawBoxHelper(isSeparate2?pathEnd2:d3.select(groupId).select('path'),
          pathElement2,
          (isSeparate2?`#${groupName}g${groupIndex+1}`:groupId),
          opacity);

      }
  } else {
    console.log("Only One box drawn");
    console.log("Separate "+isSeparate1.toString()+isSeparate2.toString());
    if(!isSeparate1){
      drawBoxHelper(pathElement1,
        d3.select(groupId).select('path'),
        groupId,
        opacity);
    }
    if(!isSeparate2){
      drawBoxHelper(d3.select(groupId).select('path'),
        pathElement2,
        groupId,
        opacity);
    }
  }
}
function drawBoxHelper(pathElement1, pathElement2, groupId,opacity){
  if(pathElement1==null||pathElement2==null||pathElement1.empty()||pathElement2.empty())return;
  const bbox1 = pathElement1.node().getBBox();
  const bbox2 = pathElement2.node().getBBox();

  // Calculate encompassing bounding box
  const minX = /*Math.min(*/bbox1.x/*, bbox2.x)*/;
  const maxX = /*Math.max(bbox1.x + bbox1.width, */bbox2.x + bbox2.width/*)*/;
  const minY = Math.min(bbox1.y, bbox2.y);
  const maxY = Math.max(bbox1.y + bbox1.height, bbox2.y + bbox2.height);

  var width = maxX - minX;
  //TECHY SOLUTION USING THE LINE LENGTH IF maxX is ZERO TODO 
  if(width<0){
    width=1800-minX;
  }
  const height = Math.abs(maxY - minY);

  // Append a rectangle to highlight both words
  const group = d3.select(groupId);
  if(group==null||group.empty())return;
  const colorInterpolate = d3.interpolateRgb("green", "red");
  console.log(groupId+" -> " +d3.select(groupId).node());
  console.log(maxX+" "+minX+" "+minY+" "+width+" "+height+" "+colorInterpolate(1-opacity));
// Your existing code to append the rectangle
  group.append('rect')
    .attr('x', minX - 2)  // Slight padding
    .attr('y', minY - 2)
    .attr('width', width + 4)
    .attr('height', 2*height + 6)
    .attr('fill', colorInterpolate(1 - opacity))  // Dynamic fill color based on opacity
    .attr('fill-opacity', 0.5)  // Semi-transparent fill
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('rx', 5)  // Rounded corners, adjust as needed
    .attr('ry', 5)  // Rounded corners, adjust as needed
    .classed('highlight-box', true)
    .attr('pointer-events', 'none');  // Class for easy removal or styling

}
function drawBoxAroundOneWordHelper(phraseIndex,isOne,endings,phraseStart,phraseEnd,opacity){
  
  console.log("Endings length: "+endings.length);
  if(endings==null )return;
  console.log("Drawing from: "+phraseStart[phraseIndex]+" to "+phraseEnd[phraseIndex]+"\n "+phraseIndex+" \n"+phraseStart+" \n"+phraseEnd);
  for(let i=0;i<max(endings.length,3);i++){ //iterates through all lines
    
    drawBoxAroundWords(i.toString(),"speaker"+(isOne?"1":"2"),phraseStart[phraseIndex]+1,phraseEnd[phraseIndex]+1,opacity=opacity);
  }
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

  d3.select("#tooltip").style("visibility", "hidden");
}

function return_phrase_index(id,phraseStart,phraseEnd){
  for(let i=0;i<min(phraseStart.length,phraseEnd.length);i++){
    if(phraseStart[i]+1<=id&&phraseEnd[i]+1>=id){
      return i;
      
    }
  }
  return -1;
}
function return_phrase_bounds(id,phraseStart,phraseEnd){
  for(let i=0;i<min(phraseStart.length,phraseEnd.length);i++){
    if(phraseStart[i]+1<=id&&phraseEnd[i]+1>=id){
      return [phraseStart[i]+1,phraseEnd[i]+1];
      
    }
  }
  return [-1,-1];
}

export default AreaPlot;