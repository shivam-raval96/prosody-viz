// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import CurveRender from './curverender';
import Legend from './legend';

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
//import data3 from "../data/obama_speech.csv"; //k0jJL_YFyIU //Barack Obama's final speech as president – video highlights
import data3 from "../data/martin_hbs2.csv"; //O_JAZNbj8Pg //Augmenting Human and Machine Intelligence with Data Visualization (Martin Wattenberg)
//import data3 from "../data/finale.csv"; //4lIr8rgo5zE
import data2 from "../data/fernanda_hbs2.csv"; //u5JV88yPoGc //Augmenting Human and Machine Intelligence with Data Visualization (Fernanda Viégas)
//import data2 from "../data/obama_interview.csv"; //x3zgCVqqf3Q //Obama: War in Ukraine ‘a wake-up call to Europe’ and democracies around the world

import { AudioVisualizer, LiveAudioVisualizer } from 'react-audio-visualize';
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import axios from "axios";
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Slider from '@mui/material/Slider';
import FileUploadIcon from '@mui/icons-material/FileUpload';

//import TextRender from './components/textrender';
import * as d3 from 'd3';
const localDevURL = "http://127.0.0.1:8000/";

function Homepage() {

  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [tiled, setTiled] = useState(false);
  const [error, setError] = useState();
  
  const [file, setFile] = useState();
  const [uploadedFile, setUploadedFile] = useState();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileURL, setUploadedFileURL] =useState();


  const [speaker1, setData] = useState(null);
  const [speaker2, setData2] = useState(null);


  const [speaker1url, setSpeaker1url] = useState("O_JAZNbj8Pg");
  const [speaker2url, setSpeaker2url] = useState("u5JV88yPoGcls");

  const [videotitle1, setVideoTitle1] = useState("");
  //const [videotitle1, setVideoTitle1] = useState("The Possibility of Explanation | Finale Doshi-Velez | TEDxBoston");
  const [videotitle2, setVideoTitle2] = useState("");

  const [pauseCheck, pauseCheckStatus] = useState(false);
  const [caedenceCheck, setcaedenceCheck] = useState(false);

  const [normalCheck, setNormalStatus] = useState(false);
  const [wordDensityCheck, setWordDensityCheck] = useState(false);
  const [pauseSlider, setPauseSlider] = useState(1.0);

  const [speedSlider, setSpeedSlider] = useState(0.03);
  const [timeSlider, setTimeSlider] = useState(30);
  const [speedvalue, setValue] = React.useState([0.05,0.07]);


  const [blob, setBlob] = useState(null);
  const [blob2, setBlob2] = useState(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [audioUrl2, setAudioUrl2] = useState(null);


  const recorder = useAudioRecorder();
  const recorder2 = useAudioRecorder();


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
  const toggleCaedence = (event) => {
    setcaedenceCheck(event.target.checked);
  };
  const toggleTiled = (event) => {
    console.log(event.target.checked)
    setTiled(event.target.checked);
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

  const speedSlide = (event) => {
    setSpeedSlider(event.target.value);

    document.querySelector("#speedRange").innerHTML = "Show slowly utterred words below " + event.target.value + " s"
    // You might want to update the data or do something else when the toggle is hit
  };

  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });
  
  const handleUpload = async (event, callback,callback2,callback3) => {
      
    const file = event.target.files[0];
    //Temporarily all on 1
    callback3(true)
    if (file) {
      console.log('File uploaded:', file.name);
      // Perform further actions with the file if needed
    }
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(localDevURL + "upload-transcribe", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then((response) => {
        let loadedData = response.data.data
        let audio = {
          time: [],
          start: [],
          end: [],
          word: [],
          amp: [],
          pitch: []
        };

        loadedData.forEach((e) => {
          audio.time.push(e[1])
          audio.start.push(e[1])
          audio.end.push(e[2])
          audio.word.push(e[0])
          audio.amp.push(e[9]) //8
          audio.pitch.push(e[10]);//11
      });
      

      
      audio.amp = movingAverage(audio.amp, 10);
      audio.pitch = movingAverage(audio.pitch, 10);
      callback(audio);
      callback2(response.statusText);
      callback3(false);
      });

      //if (!response.ok) throw new Error('Something went wrong');
      
    } catch (error) {
      console.error('Error:', error);
      callback3(false);
    }
  };
/*  function InputFileUpload() {
    
    return (
      
    );
  }*/
  const handleChange = (event, newValue) => {
    setValue(newValue);
  }
  

  const timeSlide = (event) => {
    setTimeSlider(event.target.value);

    document.querySelector("#timeRange").innerHTML = "Each line represents " + event.target.value + " seconds of speaking"
    // You might want to update the data or do something else when the toggle is hit
  };
  const sendAudioToTranscribe= async (audioBlob, filename, callback, callback2, callback3) => {
    callback3(true);
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
  
    try {
        const response = await axios.post(localDevURL + "rec-transcribe", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((response) => {
          let loadedData = response.data.data
          let audio = {
            time: [],
            start: [],
            end: [],
            word: [],
            amp: [],
            pitch: []
          };
  
          loadedData.forEach((e) => {
            audio.time.push(e[1])
            audio.start.push(e[1])
            audio.end.push(e[2])
            audio.word.push(e[0])
            audio.amp.push(e[9]) //8
            audio.pitch.push(e[10]);//11
        });
        
  
        
        audio.amp = movingAverage(audio.amp, 10);
        audio.pitch = movingAverage(audio.pitch, 10);
        callback(audio)
        callback2(response.statusText)
        callback3(false)

        });
  
        
  
    } catch (error) {
        console.error('Error:', error);
        callback3(false);
    }
    
  };

  const handleSend = async (filename, url, callback, callback2, callback3) => {
    callback3(true)
  
    try {
        const response = await axios.post(localDevURL + "transcribe", {
          filename: filename,
          url: url

        }).then((response) => {
          let loadedData = response.data.data
          let audio = {
            time: [],
            start: [],
            end: [],
            word: [],
            amp: [],
            pitch: []
          };
  
          loadedData.forEach((e) => {
            audio.time.push(e[1])
            audio.start.push(e[1])
            audio.end.push(e[2])
            audio.word.push(e[0])
            audio.amp.push(e[9]) //8
            audio.pitch.push(e[10]);//11
        });
        
  
        
        audio.amp = movingAverage(audio.amp, 5);
        audio.pitch = movingAverage(audio.pitch, 3);
        callback(audio)
        callback2(response.statusText)
        callback3(false)


        });
  
        
  
    } catch (error) {
        console.error('Error:', error);
        callback3(false)

    }
  };

  // prepare data using d3
  useEffect(() => {
    grabData(data3, setData);
    grabData(data2, setData2);

  }, []);

    useEffect(() => {
      if(blob){sendAudioToTranscribe(blob,'rec1.wav',setData,setVideoTitle1,setLoading1)
      const newAudioUrl = URL.createObjectURL(blob);
      setAudioUrl(newAudioUrl);
      setSpeaker1url("Enter YouTube link")
      setVideoTitle1("Audio Recording")
    // Clean up
    return () => {
      URL.revokeObjectURL(newAudioUrl);
    };
      }
    }, [blob]);

    useEffect(() => {
      if(blob2){sendAudioToTranscribe(blob2,'rec2.wav',setData2,setVideoTitle2,setLoading2)
      const newAudioUrl2 = URL.createObjectURL(blob2);
      setAudioUrl2(newAudioUrl2);
      setSpeaker2url("Enter YouTube link")
      setVideoTitle2("Audio Recording")

    // Clean up
    return () => {
      URL.revokeObjectURL(newAudioUrl2);
    };
      }
  
    }, [blob2]);
  


  //if (speaker1.length === 0 || speaker2.length === 0) {
  //  return <div>Loading...</div>;
 // }

  return (
    <>
      <div className="container-fluid">
        <div className="row no-gutters">
          
          <div className="col-lg-2">
            
          <div className="upload2">
          </div>
        <div className="container-fluid">
          
          <div className="row no-gutters">
              <div className="card">
                <h3 className="card-header bg-white">Controls</h3>
              <div className="form-check form-switch">
                <input className="form-check-input" checked={pauseCheck} onChange={toggle} type="checkbox" id="pauseSwitch" />
                <label className="form-check-label" for="pauseSwitch">View Only Pauses</label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" checked={caedenceCheck} onChange={toggleCaedence} type="checkbox" id="caedenceSwitch" />
                <label className="form-check-label" for="caedenceSwitch">Cut off at Pauses</label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" checked={tiled} onChange={toggleTiled} type="checkbox" id="tiledSwitch" />
                <label className="form-check-label" for="tiledSwitch">Tiled View</label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" checked={normalCheck} onChange={normalToggle} type="checkbox" id="normalSwitch" />
                <label className="form-check-label" for="normalSwitch">Normalize</label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" checked={wordDensityCheck} onChange={densityToggle} type="checkbox" id="normalSwitch" />
                <label className="form-check-label" for="normalSwitch">View Word Density</label>
              </div>
              <label for="customRange3" id="pauseRange" className="form-label">Pause Length: 1.0 seconds</label>
              <input onChange={pauseSlide} type="range" className="form-range" min="0.2" max="2" step="0.1" value={pauseSlider} id="customRange3"></input>
              <hr/>
              <label for="customRange4" id="speedRange" className="form-label">Show emphasized words</label>
              <Slider
                  value={speedvalue}
                  onChange={handleChange}
                  valueLabelDisplay="auto"
                  step={0.01}
                  min={0.02}
                  max={0.12}
                />
              <label for="customRange5" id="timeRange" className="form-label">Each line represents 30 seconds of speaking</label>
              <input onChange={timeSlide} type="range" className="form-range" min="10" max="90" step="10" value={timeSlider} id="customRange5"></input>

      </div>


            <div className="card legend-card">
              <h3 className="card-header bg-white">Legend</h3>
            <div className="legend">
              <Legend width={225} height={40} pauseStatus={pauseCheck} normalizeStatus={normalCheck}/>
            </div>
            <p><b>Low Pitch</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>High Pitch</b></p>
            <hr></hr>
            Volume is represented with the width
            <hr/>
            Click on the graph to view the part of the audio/speech.<hr/>
            </div>
          </div>
        </div>
        
          </div>
          <div id="tooltip"></div>
          <div className="rec1" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AudioRecorder onRecordingComplete={setBlob} recorderControls={recorder} />
          <div>
          {audioUrl && <audio controls className="player1" src={audioUrl}></audio>}
          </div>
        
       
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            >
            Upload file
              <VisuallyHiddenInput type="file" 
              accept=".wav,video/mp4"
              onChange={(event) => handleUpload(event,setData,setVideoTitle1,setLoading1 )}
              />
          </Button>     
          </div>
          
          
          
          
          <div className="title1">
          Video Title: {videotitle1}
          </div>
          <div className="url1">
          <Tooltip title="Enter Youtube link">
          <TextField
          label="Speaker 1"
          id="outlined-size-small"
          defaultValue="Enter Youtube link"
          value={speaker1url}
          onChange={(e)=>setSpeaker1url(e.target.value)}
          size="small"
        />
                  
        </Tooltip>
        
        <IconButton aria-label="send">

        {(loading1)?<CircularProgress size="1.5rem"  color="inherit"style={{}}/>:<SendIcon onClick={()=>handleSend('rec1.wav',speaker1url,setData,setVideoTitle1,setLoading1)}/>}

        </IconButton>
        
        
        </div>
        
        <div className="rec2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
          <AudioRecorder onRecordingComplete={setBlob2} recorderControls={recorder2} />
          
          <div>
          {audioUrl2 && <audio controls className="player2" src={audioUrl2}></audio>}
          </div>
          
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon />}
            >
            Upload file
              <VisuallyHiddenInput type="file" 
              accept=".wav,video/mp4"
              onChange={(event) => handleUpload(event,setData2,setVideoTitle2,setLoading2 )}
              />
          </Button>   
          
          </div>
          
          <div className="title2">
          Video Title: {videotitle2}
          </div>
          <div className="url2">
          <Tooltip title="Enter Youtube link">
           <TextField
          label="Speaker 2"
          id="outlined-size-small"
          value={speaker2url}
          onChange={(e)=>setSpeaker2url(e.target.value)}
          size="small"
        /> 
        </Tooltip> 
        <IconButton aria-label="send">

        {(loading1)?<CircularProgress size="1.5rem"  color="inherit"style={{}}/>:<SendIcon onClick={()=>handleSend('rec2.wav',speaker2url,setData2,setVideoTitle2,setLoading2)}/>}

        </IconButton>
        </div>
          <div className="col-lg-5 speaker1">
            {(speaker1)?<CurveRender videoHandler={handleVideoChange} wordDensityToggle={wordDensityCheck} audio={speaker1} width={window.innerWidth / 2} height={window.innerHeight *0.8} caedenceStatus ={caedenceCheck} pauseStatus={pauseCheck} normalizeStatus={normalCheck} tiledStatus={tiled} name={"speaker1"} pauseSlider={pauseSlider} speedSlider={speedvalue} videoID={speaker1url} timeSlider={timeSlider} videoTime={videoTime}/>:null}
          </div>
          <div className="col-lg-5 speaker2">
          {(speaker2)?<CurveRender videoHandler={handleVideoChange} wordDensityToggle={wordDensityCheck} audio={speaker2} width={window.innerWidth / 2} height={window.innerHeight *0.8} caedenceStatus ={caedenceCheck} pauseStatus={pauseCheck} normalizeStatus={normalCheck} tiledStatus={tiled} name={"speaker2"} pauseSlider={pauseSlider} speedSlider={speedvalue} timeSlider={timeSlider} videoID={speaker2url}/>:null}
          </div>
        </div>
      </div>
      {showVideo && videoId && (
        <div className="videoPlayerContainer">
        <iframe
          id="ytplayer"
          type="text/html"
          width="250"
          height="250"
          // &start=${videoTime}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&start=${videoTime}`}
          frameBorder="0"
          className="videoPlayer"
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
    let audio = {
      time: [],
      start: [],
      end: [],
      word: [],
      amp: [],
      pitch: [],
      iskeyword:[]
    };
    for (let i = 0; i < loadedData.length; i++) {
      audio.time.push(loadedData[i].start);
      audio.start.push(loadedData[i].start);
      audio.end.push(loadedData[i].end);
      audio.word.push(loadedData[i].word);
      audio.amp.push(loadedData[i].vol);
      audio.pitch.push(loadedData[i].pitch);
    }
    audio.amp = movingAverage(audio.amp, 5);
    audio.pitch = movingAverage(audio.pitch, 3);
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