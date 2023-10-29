// src/App.js
import React from 'react';
import CurveRender from './components/curverender';
//import TextRender from './components/textrender';


import './App.css';


function App() {
    const audio_data = {
        time:Array.from({ length: 50 }, (_, index) => Number((index * 0.1).toFixed(1))),
        amp: Array.from({ length: 50 }, () => Math.random()),
        pitch:Array.from({ length: 50 }, () => 100 + Math.random() * 100)
    };



    return (
      <>
        <h3>SpeechViz</h3>
        <CurveRender audio={audio_data} width={800} height={800} />
      </>
    );
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