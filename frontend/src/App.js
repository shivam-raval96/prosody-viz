// src/App.js
import React, { useState, useEffect } from 'react';
import CurveRender from './components/curverender';
import data2 from "./data/fernanda_hbs2.csv";
//import TextRender from './components/textrender';
import * as d3 from 'd3';

import './App.css';

function App() {

  const [data, setData] = useState([]);
  const [toggleStatus, setToggleStatus] = useState(false);

  const toggle = () => {
    setToggleStatus(!toggleStatus);
    // You might want to update the data or do something else when the toggle is hit
  };

  // prepare data using d3
  useEffect(() => {

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
      setData(audio);
    }).catch(error => {
      console.error("Error loading the CSV file:", error);
    });
  }, [toggleStatus]);

  if (data.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h3>SpeechViz</h3>
      <button onClick={toggle}>
        {toggleStatus ? 'Switch to Type A' : 'Switch to Type B'}
      </button>
      <CurveRender audio={data} width={1800} height={900} toggleStatus={toggleStatus}/>
    </>
  );
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

export default App;
/*



    const text_data = {
      time: [0.0,
        1.23,
        1.95,
        2.74,
        3.12,
        4.23,
        5.11,
        6.03,
        7.09,
        8.23,
        8.91,
        10.12,
        11.05,
        12.34,
        13.02,
        13.89,
        14.93,
        16.11,
        17.25,
        18.37,
        19.03,
        20.22,
        21.31,
        22.05,
        23.24,
        24.32,
        25.89,
        26.72,
        27.83,
        28.94,
        30.01,
        31.32,
        32.43,
        33.54,
        34.01,
        35.24,
        36.35,
        37.41,
        38.09,
        39.52,
        40.63,
        41.47,
        42.58,
        43.69,
        44.50,
        45.21,
        46.22,
        47.05,
        48.16,
        49.09,
        ],
      text: [
        "The", "wizard", "cast", "a", "mysterious", "spell",
        "She", "found", "her", "broomstick", "next", "to", "the", "ancient", "oak",
        "The", "owl", "delivered", "a", "letter", "at", "dawn",
        "In", "the", "forest", "a", "creature", "lurked", "in", "the", "shadows",
        "His", "potion", "glowed", "brightly", "under", "the", "moonlight",
        "The", "moon", "revealed", "hidden", "secrets",
        "The", "wizard", "cast", "a","very", "mysterious", "spell",
    ]
    }

    <TextRender textArray={text_data.text} xArray={text_data.time} width={800} height={800} />

*/