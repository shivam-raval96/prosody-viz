// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import CurveRender from './curverender';
import Legend from './legend';

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
//import data3 from "../data/obama_speech.csv"; //k0jJL_YFyIU //Barack Obama's final speech as president – video highlights
import data3 from "../data/martin_hbs2.csv"; //O_JAZNbj8Pg //Augmenting Human and Machine Intelligence with Data Visualization (Martin Wattenberg)
//import data3 from "../data/TranscribedAudio1.csv";
//import data3 from "../data/finale.csv"; //4lIr8rgo5zE
import data2 from "../data/fernanda_hbs2.csv"; //u5JV88yPoGc //Augmenting Human and Machine Intelligence with Data Visualization (Fernanda Viégas)
//import data2 from "../data/TranscribedAudio2.csv";
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

  const[phraseMatches1, setPhraseMatches1] =useState([[]]); //index -> audio 1, value -> audio2 ; searching from audio 1 is O(1), searching from audio 2 is O(n)
  const[phraseMatches2, setPhraseMatches2] =useState([[]]); //index -> audio 1, value -> audio2 ; searching from audio 1 is O(1), searching from audio 2 is O(n)


  const [blob, setBlob] = useState(null);
  const [blob2, setBlob2] = useState(null);

  const [audioUrl, setAudioUrl] = useState(null);
  const [audioUrl2, setAudioUrl2] = useState(null);

  const [averageAmplitude1, setAverageAmplitude1] =useState(0);
  const [averageSpeed1, setAverageSpeed1] =useState(0);
  const [averagePitch1, setAveragePitch1] =useState(0);

  
  const [averageAmplitude2, setAverageAmplitude2] =useState(0);
  const [averageSpeed2, setAverageSpeed2] =useState(0);
  const [averagePitch2, setAveragePitch2] =useState(0);

  const [phraseStart1, setPhraseStart1]=useState([]);
  const [phraseStart2, setPhraseStart2]=useState([]);

  
  const [phraseEnd1, setPhraseEnd1]=useState([]);
  const [phraseEnd2, setPhraseEnd2]=useState([]);
  const recorder = useAudioRecorder();
  const recorder2 = useAudioRecorder();


  const [showVideo, setShowVideo] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoId, setVideoId] = useState(null);


  const [dtwData1, setDtwData1] = useState(-1);
  const [dtwData2, setDtwData2] = useState(-1);

  const handleVideoChange = (time, id) => {
    return;
    setVideoTime(time);
    setVideoId(id);
    setShowVideo(true);
  };

  
  const highlightDTWMatch= (i, isOne)=>{
    console.log("Path clicked with index:", i, isOne);
    console.log("PM: "+(isOne?phraseMatches1:phraseMatches2)[i]);
    if(i<0){return;}
    if(!isOne){
      setDtwData1(phraseMatches1[i]);
      console.log("DTWDATA1: "+dtwData1);

    }
    else{
      setDtwData2(phraseMatches2[i]);
      console.log("DTWDATA2: "+dtwData2);
    }
  }


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
  
  const handleUpload = async (event, callback,callback2,callback3,isOne) => {
      
    const file = event.target.files[0];
    
    console.log("isOne"+isOne)
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
    formData.append("isOne",isOne?"1":"0");

    try {
      const response = await axios.post(localDevURL + "upload-transcribe", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log("SOMETHING IS HAPPENING");
      console.log("TITLE: "+response.data.title);
      const loadedData=JSON.parse(response.data.data);
      //console.log("LD: "+loadedData);
      const title=response.data.title;
      
      const averageAmplitude=response.data.average_amplitude;
      const averagePitch=response.data.average_pitch;
      const averageSpeed=response.data.average_speed;
      const phraseStart=response.data.phrase_start;
      const phraseEnd=response.data.phrase_end;
      const matches=response.data.phrase_matches;

      console.log("ps: "+phraseStart);
      console.log("pe: "+phraseEnd);
      let audio = {
        time: [],
        start: [],
        end: [],
        word: [], 
        amp: [],
        pitch: [],
        min_var_pitch: [],
        avg_var_pitch: [],
        max_var_pitch: []
      };

      
      console.log("Check 0");
      console.log(loadedData);
      console.log(typeof loadedData);
      loadedData.data.forEach((e) => {
        audio.time.push(e[10])
        audio.start.push(e[1])
        audio.end.push(e[2])
        audio.word.push(e[0])
        audio.amp.push(e[11]) //8
        audio.pitch.push(e[9])
        audio.min_var_pitch.push(e[12])
        audio.avg_var_pitch.push(e[13])
        audio.max_var_pitch.push(e[14])
      });
      

      console.log("Check 1");
      if(isOne){
        setAverageAmplitude1(averageAmplitude);
        setAveragePitch1(averagePitch);
        setAverageSpeed1(averageSpeed);
        setPhraseStart1(phraseStart);
        setPhraseEnd1(phraseEnd);
        
        console.log("PMO: "+matches);
        setPhraseMatches1(matches);
      }
      else{
        setAverageAmplitude2(averageAmplitude);
        setAveragePitch2(averagePitch);
        setAverageSpeed2(averageSpeed);
        setPhraseStart2(phraseStart);
        setPhraseEnd2(phraseEnd);
        
        console.log("PMO: "+matches);
        
        setPhraseMatches2(matches);
        /*
        let temp=[matches.length];
        for(let i=0;i<matches.length;i++){
          temp[matches[i]]=i;
        }*/
      }
      
      console.log("Check 2");
      audio.amp = movingAverage(audio.amp, 10);
      audio.pitch = movingAverage(audio.pitch, 10);
      
      console.log("Check 3");
      callback(audio)
      console.log("AD: "+audio);
      callback2(title)
      callback3(false)
      try {
        
        const matchFormData = new FormData();
        matchFormData.append("isOne",((!isOne)?"1":"0"));
        const response = await axios.post(localDevURL + "get_DTW_matches", {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log("SOMETHING IS HAPPENING");
        //const loadedData=JSON.parse(response.data.data);
        const matches=response.data.phrase_matches;
        console.log("MATCHES: "+matches);
        if(!isOne){
          setPhraseMatches1(matches);
        }
        else{
          setPhraseMatches2(matches);
        }
      }
      catch (error) {
        console.error('Error:', error);
      }
      //#region Old Code
/*      }).then((response) => {
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
            audio.time.push(e[10])
            audio.start.push(e[1])
            audio.end.push(e[2])
            audio.word.push(e[0])
            audio.amp.push(e[8])
            audio.pitch.push(e[9]);
      });
      

      
      audio.amp = movingAverage(audio.amp, 10);
      audio.pitch = movingAverage(audio.pitch, 10);
      callback(audio);
      callback2(response.statusText);
      callback3(false);
      });
*/
//#endregion
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
  const sendAudioToTranscribe= async (audioBlob, filename, callback, callback2, callback3,isOne) => {
    callback3(true);
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("isOne",isOne?"1":"0");
  
    try {
        const response = await axios.post(localDevURL + "rec-transcribe", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log("RECEIVED DATA!!");
        const loadedData=JSON.parse(response.data.data);
        console.log(loadedData);
        const title=response.data.title;
        const averageAmplitude=response.data.average_amplitude;
        const averagePitch=response.data.average_pitch;
        const averageSpeed=response.data.average_speed;
        const phraseStart=response.data.phrase_start;
        const phraseEnd=response.data.phrase_end;
        const matches=response.data.phrase_matches;

        console.log("ps: "+phraseStart);
        console.log("pe: "+phraseEnd);
        let audio = {
          time: [],
          start: [],
          end: [],
          word: [],
          amp: [],
          pitch: [],
          min_var_pitch: [],
        avg_var_pitch: [],
        max_var_pitch: []
        };

        loadedData.data.forEach((e) => {
          audio.time.push(e[10])
          audio.start.push(e[1])
          audio.end.push(e[2])
          audio.word.push(e[0])
          audio.amp.push(e[11])
          audio.pitch.push(e[9])
          audio.min_var_pitch.push(e[12])
          audio.avg_var_pitch.push(e[13])
          audio.max_var_pitch.push(e[14])
        });
        console.log('AUDIO: ', audio);
        
  

        if(isOne){
          setAverageAmplitude1(roundToThreeSignificantDigits(averageAmplitude));
          setAveragePitch1(roundToThreeSignificantDigits(averagePitch));
          setAverageSpeed1(roundToThreeSignificantDigits(averageSpeed));
          setPhraseStart1(phraseStart);
          setPhraseEnd1(phraseEnd);
          setPhraseMatches1(matches);

        }
        else{
          setAverageAmplitude2(roundToThreeSignificantDigits(averageAmplitude));
          setAveragePitch2(roundToThreeSignificantDigits(averagePitch));
          setAverageSpeed2(roundToThreeSignificantDigits(averageSpeed));
          setPhraseStart2(phraseStart);
          setPhraseEnd2(phraseEnd);
          /*let temp=[matches.length];
          for(let i=0;i<matches.length;i++){
            temp[matches[i]]=i;
          }*/
          
          setPhraseMatches2(matches);
        }
        audio.amp = movingAverage(audio.amp, 10);
        audio.pitch = movingAverage(audio.pitch, 10);
        callback(audio)
        callback2(title)
        callback3(false)
    } catch (error) {
        console.error('Error:', error);
        callback3(false);
    }
    
  };

  const handleSend = async (filename, url, callback, callback2, callback3, isOne) => {
    callback3(true)
    try {
        const response = await axios.post(localDevURL + "transcribe", {
          filename: filename,
          url: url,
          isOne: isOne
        });
        
        console.log("SOMETHING IS HAPPENING: HANDLESEND");
        const loadedData=JSON.parse(response.data.data);
        console.log(loadedData.data[0]);
        const title=response.data.title;
        const averageAmplitude=response.data.average_amplitude;
        const averagePitch=response.data.average_pitch;
        const averageSpeed=response.data.average_speed;
        const phraseStart=response.data.phrase_start;
        const phraseEnd=response.data.phrase_end;
        const matches=response.data.phrase_matches;

        console.log("ps: "+phraseStart);
        console.log("pe: "+phraseEnd);
        let audio = {
          time: [],
          start: [],
          end: [],
          word: [],
          amp: [],
          pitch: [],
          min_var_pitch: [],
        avg_var_pitch: [],
        max_var_pitch: []
        };

        loadedData.data.forEach((e) => {
          // console.log('E: ', e)
          audio.time.push(e[10])
          audio.start.push(e[1])
          audio.end.push(e[2])
          audio.word.push(e[0])
          audio.amp.push(e[11]) //8
          audio.pitch.push(e[9])
          audio.min_var_pitch.push(e[12])
          audio.avg_var_pitch.push(e[13])
          audio.max_var_pitch.push(e[14])
        });
        
  

        if(isOne){
          setAverageAmplitude1(roundToThreeSignificantDigits(averageAmplitude));
          setAveragePitch1(roundToThreeSignificantDigits(averagePitch));
          setAverageSpeed1(roundToThreeSignificantDigits(averageSpeed));
          setPhraseStart1(phraseStart);
          setPhraseEnd1(phraseEnd);
          setPhraseMatches1(matches);

        }
        else{
          setAverageAmplitude2(roundToThreeSignificantDigits(averageAmplitude));
          setAveragePitch2(roundToThreeSignificantDigits(averagePitch));
          setAverageSpeed2(roundToThreeSignificantDigits(averageSpeed));
          setPhraseStart2(phraseStart);
          setPhraseEnd2(phraseEnd);
          /*let temp=[matches.length];
          for(let i=0;i<matches.length;i++){
            temp[matches[i]]=i;
          }*/
          setPhraseMatches2(matches);
        }
        audio.amp = movingAverage(audio.amp, 10);
        audio.pitch = movingAverage(audio.pitch, 10);
        callback(audio)
        callback2(title)
        callback3(false)

        try {
          const response = await axios.post(localDevURL + "get_DTW_matches", {
            isOne: !isOne
          });
          
          console.log("SOMETHING IS HAPPENING");
          const loadedData=JSON.parse(response.data.data);
          const matches=response.data.phrase_matches;
          if(!isOne){
            setPhraseMatches1(matches);
          }
          else{
            setPhraseMatches2(matches);
          }
        }
        catch (error) {
          console.error('Error:', error);
        }
        /*}).then((response) => {
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
            audio.time.push(e[10])
          audio.start.push(e[1])
          audio.end.push(e[2])
          audio.word.push(e[0])
          audio.amp.push(e[8])
          audio.pitch.push(e[9]);
        });
        
  
        
        audio.amp = movingAverage(audio.amp, 5);
        audio.pitch = movingAverage(audio.pitch, 3);
        callback(audio)
        callback2(response.statusText)
        callback3(false)


        });*/
  
        
  
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
      if(blob){sendAudioToTranscribe(blob,'rec1.wav',setData,setVideoTitle1,setLoading1,true)
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
      if(blob2){sendAudioToTranscribe(blob2,'rec2.wav',setData2,setVideoTitle2,setLoading2,false)
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
                <Tooltip title="Only depicts pauses">
                <input className="form-check-input" checked={pauseCheck} onChange={toggle} type="checkbox" id="pauseSwitch" />
                <label className="form-check-label" for="pauseSwitch">View Only Pauses</label>
                </Tooltip>
              </div>
              <div className="form-check form-switch">
                <Tooltip title="Forces a new line at each pause.">
                <input className="form-check-input" checked={caedenceCheck} onChange={toggleCaedence} type="checkbox" id="caedenceSwitch" />
                <label className="form-check-label" for="caedenceSwitch">Cut off at Pauses</label>
                </Tooltip>
              </div>
              <div className="form-check form-switch">
                <Tooltip title="Separates amplitude and pitch visualizations.">
                <input className="form-check-input" checked={tiled} onChange={toggleTiled} type="checkbox" id="tiledSwitch" />
                <label className="form-check-label" for="tiledSwitch">Tiled View</label>
                </Tooltip>
              </div>
              <div className="form-check form-switch">
                <Tooltip title="Normalized pitch coloring between both audio clips.">
                <input className="form-check-input" checked={normalCheck} onChange={normalToggle} type="checkbox" id="normalSwitch" />
                <label className="form-check-label" for="normalSwitch">Normalize</label>
                </Tooltip>
              </div>
              <div className="form-check form-switch">
                <Tooltip title="Adds additional visualizations for distinct words.">
                <input className="form-check-input" checked={wordDensityCheck} onChange={densityToggle} type="checkbox" id="normalSwitch" />
                <label className="form-check-label" for="normalSwitch">View Word Density</label>
                </Tooltip>
              </div>
              <label for="customRange3" id="pauseRange" className="form-label">Pause Length: 1.0 seconds</label>
              <input onChange={pauseSlide} type="range" className="form-range" min="0.2" max="2" step="0.1" value={pauseSlider} id="customRange3"></input>
              <hr/>
              
              <Tooltip title="Depicts words with lengths within this range.">
              <label for="customRange4" id="speedRange" className="form-label">Show emphasized words</label>
              
              </Tooltip>
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
              <Legend width={'calc(16vw - 30px)'} height={40} pauseStatus={pauseCheck} normalizeStatus={normalCheck}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>Low Pitch</b>
              <b>High Pitch</b>
            </div>
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
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon sx={{ border: 'none',}}/>}
            >
            Upload file   
              <VisuallyHiddenInput type="file" 
              accept=".wav,video/mp4/mp3"
              onChange={(event) => handleUpload(event,setData,setVideoTitle1,setLoading1,true)}
              />
          </Button> 
          <AudioRecorder onRecordingComplete={setBlob} recorderControls={recorder} />
          <div>
          {audioUrl && <audio controls style={{marginLeft: 'auto'}} className="player1" src={audioUrl} style={{transform: 'translateX(50%)',}}></audio>}
          </div>
        
       
              
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

        {(loading1)?<CircularProgress sx={{ border: 'none',}} size="1.5rem"  color="inherit"style={{}}/>:<SendIcon sx={{ border: 'none',}} onClick={()=>handleSend('rec1.wav',speaker1url,setData,setVideoTitle1,setLoading1,true)}/>}

        </IconButton>
        
        
        </div>
        
        <div className="rec2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
        <Button 
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<CloudUploadIcon disableRipple
              disableFocusRipple
              sx={{
                border: 'none',
              }}
            />}
            >
            Upload file
              <VisuallyHiddenInput type="file" 
              accept=".wav,video/mp4"
              onChange={(event) => handleUpload(event,setData2,setVideoTitle2,setLoading2,false )}
              />
          </Button>
          <AudioRecorder onRecordingComplete={setBlob2} recorderControls={recorder2} />
          
          <div>
          {audioUrl2 && <audio controls className="player2" src={audioUrl2} style={{transform: 'translateX(50%)',}}/>}
          </div>
             
          
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
        <IconButton aria-label="send" >

        {(loading2)?<CircularProgress sx={{ border: 'none',}} size="1.5rem"  color="inherit"/>:<SendIcon sx={{ border: 'none',}} onClick={()=>handleSend('rec2.wav',speaker2url,setData2,setVideoTitle2,setLoading2,false)}/>}

        </IconButton>
        </div>
        <div className="col-lg-5 speaker1">
          {speaker1 && (
            <>
              <CurveRender
                videoHandler={handleVideoChange}
                wordDensityToggle={wordDensityCheck}
                audio={speaker1}
                width={window.innerWidth / 2}
                height={window.innerHeight * 0.8}
                caedenceStatus={caedenceCheck}
                pauseStatus={pauseCheck}
                normalizeStatus={normalCheck}
                tiledStatus={tiled}
                name="speaker1"
                pauseSlider={pauseSlider}
                speedSlider={speedvalue}
                timeSlider={timeSlider}
                videoID={speaker1url}
                videoTime={videoTime}
                averageAmplitude={averageAmplitude1}
                averageSpeed={averageSpeed1}
                averagePitch={averagePitch1}
                phraseStart={phraseStart1}
                phraseEnd={phraseEnd1}
                isOne={true}
                dtwCallback={highlightDTWMatch}
                dtwData={dtwData1}
              />
              <Ticks width={window.innerWidth / 2.6} timeSlider={timeSlider} />
            </>
          )}
        </div>
        <div className="col-lg-5 speaker2">
          {speaker2 && (
            <>
              <CurveRender
                videoHandler={handleVideoChange}
                wordDensityToggle={wordDensityCheck}
                audio={speaker2}
                width={window.innerWidth / 2}
                height={window.innerHeight * 0.8}
                caedenceStatus={caedenceCheck}
                pauseStatus={pauseCheck}
                normalizeStatus={normalCheck}
                tiledStatus={tiled}
                name="speaker2"
                pauseSlider={pauseSlider}
                speedSlider={speedvalue}
                timeSlider={timeSlider}
                videoID={speaker2url}
                videoTime={videoTime}
                averageAmplitude={averageAmplitude2}
                averageSpeed={averageSpeed2}
                averagePitch={averagePitch2}
                phraseStart={phraseStart2}
                phraseEnd={phraseEnd2}
                isOne={false}
                dtwCallback={highlightDTWMatch}
                dtwData={dtwData2}
              />
              <Ticks width={window.innerWidth / 2.6} timeSlider={timeSlider} />
            </>
          )}
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
      iskeyword:[],
      min_var_pitch: [],
      avg_var_pitch: [],
      max_var_pitch: []
    };
    for (let i = 0; i < loadedData.length; i++) {
      audio.time.push(loadedData[i].start);
      audio.start.push(loadedData[i].start);
      audio.end.push(loadedData[i].end);
      audio.word.push(loadedData[i].word);
      audio.amp.push(loadedData[i].vol);
      audio.pitch.push(loadedData[i].pitch);
      audio.min_var_pitch.push(loadedData[i][12]);
      audio.avg_var_pitch.push(loadedData[i][13]);
      audio.max_var_pitch.push(loadedData[i][14]);
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
function roundToThreeSignificantDigits(num) {
  if (num === 0) return 0;
  
  const absNum = Math.abs(num);
  const sign = Math.sign(num);
  const log10 = Math.floor(Math.log10(absNum));
  const scale = Math.pow(10, log10 - 2); // Scale to bring three significant digits to the integer part
  
  const rounded = Math.round(absNum / scale) * scale;
  
  return sign * rounded;
}   

function Ticks({ width, timeSlider, marginLeft = 11 }) {
  const interval = 5; // Interval between tick marks (seconds)
  const maxValue = Math.ceil(timeSlider / interval) * interval; // Ensure the highest tick aligns with the interval
  const numTicks = maxValue / interval; // Total number of ticks
  const tickSpacing = width / numTicks; // Spacing between ticks

  return (
    <svg
      width={width}
      height={30}
      style={{
        display: 'block',
        marginLeft: `${marginLeft}px`, // Adjust alignment
      }}
    >
      {/* Base Line */}
      <line
        x1="0"
        y1="10"
        x2={width}
        y2="10"
        stroke="black"
        strokeWidth="1"
      />
      {/* Tick marks and labels */}
      {Array.from({ length: numTicks + 1 }).map((_, index) => {
        const x = index * tickSpacing; // Position of the tick
        const timeLabel = index * interval; // Tick label value
        return (
          <g key={index} transform={`translate(${x}, 10)`}>
            {/* Tick */}
            <line y1="0" y2="8" stroke="black" />
            {/* Label */}
            <text
              y="20"
              x="0"
              textAnchor="middle"
              style={{
                fontSize: '10px',
                fontFamily: 'Arial, sans-serif',
                fill: 'black',
              }}
            >
              {timeLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}



export default Homepage;