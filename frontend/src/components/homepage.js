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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';

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


  const [presetNumber, setPresetNumber] = useState(0);

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

  const [amplitudeScale, setAmplitudeScale] = useState(1.0); // New state for amplitude scale
  const [speedSlider, setSpeedSlider] = useState(0.03);
  const [timeSlider, setTimeSlider] = useState(30);
  const [speedvalue, setValue] = React.useState([0,0]);

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
//  const recorder2 = useAudioRecorder();

  const [legendOpen, setLegendOpen] = useState(true);


  const [videoPlaybackEnabled, setVideoPlaybackEnabled] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [videoTime, setVideoTime] = useState(0);
  const [videoId, setVideoId] = useState(null);


  const [dtwData1, setDtwData1] = useState(-1);
  const [dtwData2, setDtwData2] = useState(-1);


  const urlOptions = [
    [
    { name: "Ozymandias read by Richard Attenborough", url: "TiHqSX2f2Js" },
    { name: "Ozymandias read by Bryan Cranston", url: "Sum6A2enC6s" },
    { name: "Ozymandias - Ballad of Buster Scruggs", url: "GdQKUvv3bew" },
    { name: "Ozymandias (RedFrost)", url: "Tb2RVgLQV-A" },
    { name: "Ozymandias read by Tom O'Bedlam", url: "i7JOCJX-N7c" },
    { name: "Ozymandias read by Ben Kingsley", url: "krbX-9ugbI4" },
    { name: "Ozymandias (Everyday Poetry)", url: "--M2rCHbIBM" },
    { name: "Ozymandias (Pearls of Wisdom)", url: "BAYk2HX1AWk" }
    // { name: "Shortest Ted-Talk", url: "1aA1WGON49E" },
    // { name: "Test 3", url: "i5Q02YX2VTw" }
    ],
    [
      { name: "Barack Obama Introduction Speech", url: "XU-BUWZPVo0" },
      { name: "American Miss Personal Introduction", url: "moUg0GVGryg" },
      { name: "Generalizable Patterns for Humans and AI - TED", url: "J-X9qZ_JfTA" },
      { name: "AI Presentation", url: "WX7mTMXTuy4" },
      { name: "How to Study Hard", url: "YDV1mo7QlnA" },
      { name: "Confusion - Feynman", url: "lytxafTXg6c" },
      { name: "The Curiosity Gene", url: "HhPZ7yx8ttg" }
    ],
    [
    { name: "Privacy in Distributed Web Services", url: "-dEpRjA7QV4" },
    { name: "Usng Negotiation as a Tool", url: "3QdUPZ2tuu8" },
    { name: "Utilitarianism", url: "03ESwNlyG8k" },
    { name: "Three Minute Thesis", url: "dh0pJdgY6Lc" },
    { name: "Inside the Mind of a Master Procastinator", url: "arj7oStGLkU" }

    ]

  ];

  const [selectedUrl, setSelectedUrl] = useState(urlOptions[presetNumber][0]);

  //Video showing is disabled
  const handleVideoChange = (time, id, doesShowVideo = true) => {
    if(!videoPlaybackEnabled) return;
    setVideoTime(time);
    setVideoId(id);
    setShowVideo(doesShowVideo);
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
  };
  const toggleVideo = (event) => {
    setVideoPlaybackEnabled(event.target.checked);
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
  };

  const speedSlide = (event) => {
    setSpeedSlider(event.target.value);

    document.querySelector("#speedRange").innerHTML = "Show slowly utterred words below " + event.target.value + " s"
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
      console.log("Upload Started");
      const response = await axios.post(localDevURL + "upload-transcribe", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log("Upload Received");
      console.log("TITLE: "+response.data.title);
      const loadedData=response.data.data;
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
        const loadedData=response.data.data;
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
        <button
            onClick={() => setLegendOpen(true)}
            className={`btn btn-square ${
              "btn-outline-secondary"
            }`}
            style={{ width: "100%", marginBottom: "10px"}}
          >
            Show Legend
          </button>
        <div className="container-fluid" style={{width:"100%"}}>
          <div className="row no-gutters">
            <div className="card">
              <h3 className="card-header bg-white">Presets</h3>
              <div className="card-body">
                <div className="btn-group" role="group" aria-label="Preset Buttons"  style={{ display: "flex", justifyContent: "center" }} >
                  <button
                    className={`btn btn-square ${
                      presetNumber === 0 ? "btn-secondary" : "btn-outline-secondary"
                    }`}
                    style={{ width: "50%", flex: 1,padding: "4px" }}
                    onClick={() => setPresetNumber(0)}
                  >
                    Dramatic
                  </button>
                  <button
                    className={`btn btn-square ${
                      presetNumber === 1 ? "btn-secondary" : "btn-outline-secondary"
                    }`}
                    style={{  width: "50%",flex: 1,padding: "8px" }}
                    onClick={() => setPresetNumber(1)}
                  >
                    Public
                  </button>
                  <button
                    className={`btn btn-square ${
                      presetNumber === 2 ? "btn-secondary" : "btn-outline-secondary"
                    }`}
                    style={{  width: "50%",flex: 1,padding: "6px" }}
                    onClick={() => setPresetNumber(2)}
                  >
                    Science
                  </button>
                </div>
              </div>
            </div>
          </div>



          <div className="row no-gutters">
            <div className="card">
              <h3 className="card-header bg-white">Controls</h3>
              <div className="form-check form-switch">
                <Tooltip title="Video playback on click">
                <input className="form-check-input" checked={videoPlaybackEnabled} onChange={toggleVideo} type="checkbox" id="videoSwitch" />
                <label className="form-check-label" for="videoSwitch">Show Video Playback</label>
                </Tooltip>
              </div>
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
              <hr/>
              <label for="customRange3" id="pauseRange" className="form-label">Pause Length: 1.0 seconds</label>
              <input onChange={pauseSlide} type="range" className="form-range" min="0.2" max="2" step="0.1" value={pauseSlider} id="customRange3"></input>
              <hr/>
              
              {/* <Tooltip title="Depicts words with lengths within this range.">
              <label for="customRange4" id="speedRange" className="form-label">Show emphasized words</label>
              
              </Tooltip>
              <Slider
                  value={speedvalue}
                  onChange={handleChange}
                  valueLabelDisplay="auto"
                  step={0.01}
                  min={0.02}
                  max={0.12}
                /> */}
              <label for="customRange5" id="timeRange" className="form-label">Each line represents 30 seconds of speaking</label>
              <input onChange={timeSlide} type="range" className="form-range" min="10" max="90" step="10" value={timeSlider} id="customRange5"></input>
              <hr/>
              {/* <label htmlFor="amplitudeRange" id="amplitudeRange" className="form-label">
                  Amplitude Scale: {amplitudeScale.toFixed(2)}
                </label>
                <input
                  onChange={(e) => setAmplitudeScale(parseFloat(e.target.value))}
                  type="range"
                  className="form-range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={amplitudeScale}
                  id="amplitudeRange"
                />
              <hr/> */}
            </div>

            

            <Dialog
              open={legendOpen}
              onClose={() => setLegendOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                Legend
              </DialogTitle>
              <DialogContent dividers>
                <div className="legend">
                  <Legend width={'100%'} height={40} pauseStatus={pauseCheck} normalizeStatus={normalCheck}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>Low Pitch</b>
                  <b>High Pitch</b>
                </div>
                <hr />
                Volume is shown by width.
                <hr />
                Click on the graph to view the audio component.
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setLegendOpen(false)} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </div>
        </div>
        
          </div>
          <div id="tooltip"></div>
          <div className="rec1" style={{ width: '500px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <AudioRecorder
            onRecordingComplete={(audioBlob) => {
              // Simulate upload similar to handleUpload
              sendAudioToTranscribe(audioBlob, 'rec1.wav', setData, setVideoTitle1, setLoading1, true);
              const newAudioUrl = URL.createObjectURL(audioBlob);
              setAudioUrl(newAudioUrl);
              setSpeaker1url("Enter YouTube link");
              setVideoTitle1("Audio Recording");
            }}
            recorderControls={recorder}
          />
          {/* <div>
          {audioUrl && <audio controls style={{marginLeft: 'auto'}} className="player1" src={audioUrl} style={{transform: 'translateX(50%)',}}></audio>}
          </div> */}
        
       
              
          </div>
          
          <div className="url1" style={{ width: '500px', marginLeft: '180px' }}>
          
        
          <IconButton aria-label="send" sx={{ border: 'none',}}>

          {(loading1)?<CircularProgress sx={{ border: 'none',}} size="1.5rem"  color="inherit"style={{}}/>:<SendIcon sx={{ border: 'none',}} onClick={()=>handleSend('rec1.wav',speaker1url,setData,setVideoTitle1,setLoading1,true)}/>}

          </IconButton>
          
          
          </div>
          
          <div className="url2" style={{ width: '100px', marginLeft: '0' }}>
          
          <Select
            value={selectedUrl.url} // Use the `url` property of the selected option
            onChange={(e) => {
              console.log("SELECTED NEW URL: " + e.target.value );
              const selectedOption = urlOptions[presetNumber].find(option => option.url === e.target.value);
              setSelectedUrl(selectedOption); // Update the selected option
              setSpeaker2url(e.target.value); // Update speaker2url with the selected URL
              handleVideoChange(0,e.target.value,false);
              handleSend('rec2.wav',e.target.value,setData2,setVideoTitle2,setLoading2,false);
            }}
            size="small"
            sx={{ marginLeft: '-80px',width:  '300px'}} // Adjust width as needed
          >
            {urlOptions[presetNumber].map((option, index) => (
              <MenuItem key={index} value={option.url}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
          
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
                amplitudeScale={amplitudeScale}
                isLoading={loading1}
              />
              {/* <Ticks width={window.innerWidth / 2.6} timeSlider={timeSlider} /> */}
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
                amplitudeScale={amplitudeScale}
                isLoading={loading2}
              />
              {/* <Ticks width={window.innerWidth / 2.6} timeSlider={timeSlider} /> */}
            </>
          )}
        </div>
        {showVideo && videoId && (
        <div className="videoPlayerContainer">
        <button 
          onClick={() => setShowVideo(false)} 
          className="btn dismiss-button" style={{
          zIndex: 2
        }}>
          Dismiss
        </button>
        <iframe
          id="ytplayer"
          type="text/html"
          width="250"
          height="200"
          // &start=${videoTime}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&start=${videoTime}`}
          className="videoPlayer"
          style={{ zIndex: 1 }}
        ></iframe>
        
        </div>
        )}


        </div>
        
      </div>
      
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