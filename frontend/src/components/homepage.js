// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import CurveRender from './curverender';
import Legend from './legend';
import data2 from "../data/fernanda_hbs2.csv";
import data3 from "../data/martin_hbs2.csv";
//import TextRender from './components/textrender';
import * as d3 from 'd3';

function Homepage() {

  const [martin, setData] = useState([]);
  const [fernanda, setData2] = useState([]);
  const [pauseCheck, pauseCheckStatus] = useState(true);
  const [normalCheck, setNormalStatus] = useState(false);
  const [wordDensityCheck, setWordDensityCheck] = useState(false);
  const [pauseSlider, setPauseSlider] = useState(1.0);

  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoId, setVideoId] = useState(null);

  const handleVideoChange = (time, id) => {
    setVideoTime(time);
    setVideoId(id);
    setShowVideo(true);
  };

  const toggle = (event) => {
    pauseCheckStatus(event.target.checked);
    // You might want to update the data or do something else when the toggle is hit
  };
  const normalToggle = (event) => {
    setNormalStatus(event.target.checked);
    // You might want to update the data or do something else when the toggle is hit
  };

  const densityToggle = (event) => {
    setWordDensityCheck(event.target.checked);
    // You might want to update the data or do something else when the toggle is hit
  };

  const pauseSlide = (event) => {
    setPauseSlider(event.target.value);

    document.querySelector("#pauseRange").innerHTML = "Pause Length: " + event.target.value + " seconds"
    // You might want to update the data or do something else when the toggle is hit
  };





  // prepare data using d3
  useEffect(() => {
    grabData(data3, setData);
    grabData(data2, setData2);
   
  }, []);

  if (martin.length === 0 || fernanda.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="container-fluid">
        <div className="row no-gutters">
          <div className="col-lg-2">
        <div className="container-fluid">
          <div className="row no-gutters">
              <div class="card">
                <h3 class="card-header bg-white">Controls</h3>
              <div class="form-check form-switch">
                <input class="form-check-input" checked={pauseCheck} onChange={toggle} type="checkbox" id="pauseSwitch" />
                <label class="form-check-label" for="pauseSwitch">View Pause</label>
              </div>
              <div class="form-check form-switch">
                <input class="form-check-input" checked={normalCheck} onChange={normalToggle} type="checkbox" id="normalSwitch" />
                <label class="form-check-label" for="normalSwitch">Normalize</label>
              </div>
              <div class="form-check form-switch">
                <input class="form-check-input" checked={wordDensityCheck} onChange={densityToggle} type="checkbox" id="normalSwitch" />
                <label class="form-check-label" for="normalSwitch">View Word Density</label>
              </div>
              <label for="customRange3" id="pauseRange" class="form-label">Pause Length: 1.0 seconds</label>
              <input onChange={pauseSlide} type="range" class="form-range" min="0.5" max="2" step="0.1" value={pauseSlider} id="customRange3"></input>
          </div>


            <div class="card legend-card">
              <h3 class="card-header bg-white">Legend</h3>
            <div class="legend">
              <Legend width={200} height={50} toggleStatus={pauseCheck} normalizeStatus={normalCheck}/>
            </div>
            <p><b>Low Pitch</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>High Pitch</b></p>
            <hr></hr>
            <p>Volume is represented with the width and each line represents 30 seconds of speaking</p>
            <hr></hr>
            <p>Click on the graph to view the part of the audio/speech.</p>
            </div>
          </div>
        </div>
          </div>
          <div id="tooltip"></div>
          <div className="col-lg-5">
            <CurveRender videoHandler={handleVideoChange} wordDensityToggle={wordDensityCheck} audio={martin} width={window.innerWidth / 2} height={window.innerHeight - 100} toggleStatus={pauseCheck} normalizeStatus={normalCheck} name={"martin"} pauseSlider={pauseSlider} videoID={"O_JAZNbj8Pg"}/>
          </div>
          <div className="col-lg-5">
            <CurveRender videoHandler={handleVideoChange} wordDensityToggle={wordDensityCheck} audio={fernanda} width={window.innerWidth / 2} height={window.innerHeight - 100} toggleStatus={pauseCheck} normalizeStatus={normalCheck} name={"fernanda"} pauseSlider={pauseSlider} videoID={"u5JV88yPoGc"}/>
          </div>
        </div>
      </div>
      {showVideo && videoId && (
        <div className="videoPlayerContainer">
        <iframe
          id="ytplayer"
          type="text/html"
          width="260"
          height="280"
          // &start=${videoTime}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&start=${videoTime}`}
          frameBorder="0"
          class="videoPlayer"
        ></iframe>
        <button onClick={() => setShowVideo(false)} className="btn dismiss-button">
          Dismiss
        </button>
        </div>
    )}
    </>
  );
}

function grabData(data2, set_Data) {
  d3.csv(data2, function(d) {
    return {
      word: d.Word,
      start: +d.Start,
      end: +d.End,
      pitch: +d.pitch,
      vol: +d.amplitude
    };
  }).then(loadedData => {
    console.log(loadedData);
    let audio = {
      time: [],
      start: [],
      end: [],
      word: [],
      amp: [],
      pitch: []
    };
    for (let i = 0; i < loadedData.length; i++) {
      audio.time.push(loadedData[i].start);
      audio.start.push(loadedData[i].start);
      audio.end.push(loadedData[i].end);
      audio.word.push(loadedData[i].word);
      audio.amp.push(loadedData[i].vol);
      audio.pitch.push(loadedData[i].pitch);
    }
    console.log(audio);
    audio.amp = movingAverage(audio.amp, 10);
    audio.pitch = movingAverage(audio.pitch, 10);
    set_Data(audio);
  }).catch(error => {
    console.error("Error loading the CSV file:", error);
  });
}

function movingAverage(data, windowSize) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
      let start = Math.max(0, i - Math.floor(windowSize/2));
      let end = Math.min(data.length, i + Math.floor(windowSize/2) + 1);
      
      let sum = 0;
      for (let j = start; j < end; j++) {
          sum += data[j];
      }
      result.push(sum / (end - start));
  }
  return result;
}

export default Homepage;