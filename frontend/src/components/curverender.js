// src/AreaPlot.js
import React, { useRef, useEffect, useState,useContext,createContext } from 'react';
import * as d3 from 'd3';
import { mean, round, min, max, std } from 'mathjs'
import axios from "axios";
const NumberContext = createContext();
  
const localDevURL = "http://127.0.0.1:8000/";
const AreaPlot = ({ videoHandler, audio, width, height, caedenceStatus, pauseStatus, normalizeStatus, tiledStatus, name, pauseSlider, speedSlider, timeSlider, videoID, wordDensityToggle, averageAmplitude, averageSpeed, averagePitch, phraseStart, phraseEnd,isOne,dtwCallback,dtwData}) => {
  const margin = {left: 0, top:200};
  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [pausespm, setPausespm] = useState(0);
  const [emphwords, setEmphwords] = useState(0);
  const [endings, setEndings] = useState([]);
  //const [currentAudio,setCurrentAudio] =useState(null);
  
  const [dataOne, setDataOne] =useState({ minDistIndex:-1, phraseStart:-1, phraseEnd:-1, dists: -1 });
  const [dataTwo, setDataTwo] =useState({ minDistIndex:-1, phraseStart:-1, phraseEnd:-1, dists: -1 });

  const svgRef = useRef();
  const zoomRef = useRef();

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
    setEndings([]);
    for (let i = 0; i < audio.time.length-1; i++) {
      if (caedenceStatus){
        if (audio.start[i+1] - audio.end[i] > pauseSlider) {
          //console.log(audio.start[i+1] - audio.end[i])
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
            endIndex=endings[j];
            //lastEnd=endings[j]; 
            startIndex=(j==0)?0:endings[j-1];
          }

          var XSCALEMULTI=50.0;
          // Set up scales
          
          var xScaleNew = d3.scaleLinear()
          .domain(d3.extent(audio.end.slice(startIndex, endIndex)))
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
              .attr('fill', 'black');}

              

    

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
          if(data!=null){
            new_g.append('path')
              .attr('d', curveFunc(data))
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
                //dtw_comparison(i)
                //setVideoTime(round(audio.start[i]-0.5))
                //makePointer(videoTime, xScaleNew)
                //videoHandler(round(audio.start[i]-0.5), videoID);
                
                let indice=return_phrase_index(i,phraseStart,phraseEnd);
                dtwCallback(indice,isOne);
              }).on("mouseout", function(d) {
                mouseOut(j, name, hoverWidth, pauseStatus);
                d3.select(this.parentNode).selectAll('.highlight-box').remove();
              });
          }

            // // mirror image of the top curve 
            //console.log("data: "+data);
            if(data!=null)
              new_g.append('path')
              .attr('d', curveFuncBottom(data))
              .attr('stroke', 'none')
              .attr('stroke-width', function (d) {
              return (audio.end[i] - audio.start[i]) * 10;
            })
            .attr('data-word', audio.word[i])  
            .attr('fill', fill).on("mouseover", function(event, d) {
              let possible = (i - 5);
              let startWord = possible >= 0 ? i - 5 : 0;
              let text = [];
              for (let k = startWord; k < i + 5; k++) {
                text.push(audio.word[k]);
              }
              let actualWord = audio.word[i];
              mouseOver(event, j, name, hoverWidth, pauseStatus, text, actualWord,i,phraseStart,phraseEnd);
            }).on("mouseout", function(d) {
              mouseOut(j, name, hoverWidth, pauseStatus);
              d3.select(this.parentNode).selectAll('.highlight-box').remove();
            }).on('click', function (d) {
              //dtw_comparison(i)
              //setVideoTime(round(audio.start[i]-0.5))
              //videoHandler(j*30, videoID);
              let indice=return_phrase_index(i,phraseStart,phraseEnd);
              dtwCallback(indice,isOne);
            })
            .attr('id', i);

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
             //TEXT 
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
             new_g.append('text')
             .attr('x', xScaleNew(audio.start[i]))
             .attr('y', (height - yScale(0) / 2) - (margin.top / 4) + (tiledStatus)*60+15*(i%5))
             .attr('fill', textFill)
             .attr('font-family', 'Arial')
             .attr('font-size', '20px')         
             .text(audio.word[i]);}

            /* 
            new_g.append('text')
            .attr('x', xScaleNew(audio.start[i]))
            .attr('y', /* appropriate y value *//*)
            .attr('data-word', audio.word[i]) // Set the data-word attribute
            .text(audio.word[i]);
          console.log("Added data-word: "+i+"-> "+audio.word[i]);*/
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
        Average Speaking Speed: {averageSpeed.toFixed(3)}<br/>
        Average Amplitude: {averageAmplitude.toFixed(3)}<br/>
        Average pitch: {averagePitch.toFixed(3)} Hz<br/>
        Dynamic Pitch Range: {3*pitchrange} Hz
      </div>
    </div>
    </>
  );
};

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
//const getSavedData= (isOne)=> {isOne?dataOne:dataTwo};
/*
function drawBoxAroundWord(groupIndex, groupName, word,i) {
  // Construct the correct selector for the group and the path element
  const groupId = `#${groupName}g${groupIndex}`;
  const pathSelector = `path[data-word='${word.replace("'", "\\'")}'][id='${i}']`; // Adjust to select path instead of text

  console.log(`Group ID: ${groupId}, Path Selector: ${pathSelector}`);

  const pathElement = d3.select(groupId).select(pathSelector);

  if (!pathElement.empty()) {
      const bbox = pathElement.node().getBBox();
      //console.log(`Bounding box - x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}`);

      // Select the group and append a rectangle to highlight the word
      const group = d3.select(groupId);
      group.append('rect')
           .attr('x', bbox.x - 2)  // Slight padding
           .attr('y', bbox.y - 2)
           .attr('width',bbox.width + 4)
           .attr('height',2* bbox.height + 4)
           .attr('fill', 'none')
           .attr('stroke', 'red')
           .attr('stroke-width', 2)
           .classed('highlight-box', true);  // Class for easy removal or styling
  } else {
      console.log("Path element not found or `data-word` attribute mismatch.");
  }
}
*/


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
const dtw_comparison = async (id) => {
  // Set the request payload
  const payload = {
    id: id
  };

  try {
    // Make the POST request to the backend
    const response = await axios.post(localDevURL +"get_DTW_comparison", payload);

    // Parse the response
    const { minDistIndex, isOne, phraseStart, phraseEnd, dists } = response.data;

    // Use the response data as needed
    console.log('Minimum Distance Index:', minDistIndex);
    console.log('Distances:', dists);

    // Return the data or handle it as needed
    return { minDistIndex, isOne, phraseStart, phraseEnd,dists };
  } catch (error) {
    console.error('Error making DTW comparison request:', error);
    // Handle the error as needed
    return null;
  }
};

export default AreaPlot;