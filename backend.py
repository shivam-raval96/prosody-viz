from flask import Flask, send_from_directory, url_for, request
from werkzeug.utils import secure_filename
from flask_cors import CORS #comment this on deployment
from flask_restful import reqparse
from flask import jsonify
import pandas as pd
import io
from ast import literal_eval
import numpy as np
import heapq
import json
import math
import ssl
#from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
#from ibm_watson import SpeechToTextV1

from pydub import AudioSegment
import parselmouth
import librosa
from scipy.io import wavfile
import resampy
from scipy import interpolate
#import pysptk
from pytube import YouTube
import os
import whisper_timestamped as whisper

from dtaidistance import dtw
from dtaidistance import dtw_visualisation as dtwvis
from dtaidistance import dtw_ndim

try:
     _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
     pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
 

import sys

np.set_printoptions(threshold=sys.maxsize)

model=whisper.load_model("medium")

#apikey = '_K65u9xgONT0FHDv47PToenDbjW2rBnlveyMircBSJOh'
#url = 'https://api.us-east.speech-to-text.watson.cloud.ibm.com/instances/cfbb148c-742d-4321-8ce5-d49ff0afa632'
#authenticator = IAMAuthenticator(apikey)
#stt  = SpeechToTextV1(authenticator = authenticator)
#stt.set_service_url(url)

app = Flask(__name__, static_url_path='', static_folder='/build')
CORS(app)

FRAME_SIZE = 1024
HOP_LENGTH = 512
SAMPLE_RATE=16000.0

savedComparisonData1 =  pd.DataFrame(columns=['Amp', 'Pitch', 'Speed'])
savedComparisonData2=pd.DataFrame(columns=['Amp', 'Pitch', 'Speed'])
phraseStart1=[]
phraseStart2=[]
phraseEnd1=[]
phraseEnd2=[]
startTimeIndex1=[]

startTimeIndex2=[]
endTimeIndex1=[]
endTimeIndex2=[]
timeIndex=[]
#MFCC functions
def pre_emphasis(signal, pre_emphasis_coefficient=0.97):
    return np.append(signal[0], signal[1:] - pre_emphasis_coefficient * signal[:-1])
def framing(signal, frame_size, frame_stride, sample_rate):
    frame_length, frame_step = frame_size * sample_rate, frame_stride * sample_rate
    signal_length = len(signal)
    frame_length = int(round(frame_length))
    frame_step = int(round(frame_step))
    num_frames = int(np.ceil(float(np.abs(signal_length - frame_length)) / frame_step))

    pad_signal_length = num_frames * frame_step + frame_length
    z = np.zeros((pad_signal_length - signal_length))
    pad_signal = np.append(signal, z)
    
    indices = np.tile(np.arange(0, frame_length), (num_frames, 1)) + np.tile(np.arange(0, num_frames * frame_step, frame_step), (frame_length, 1)).T
    frames = pad_signal[indices.astype(np.int32, copy=False)]
    return frames
def windowing(frames):
    return frames * np.hamming(frames.shape[1])
def power_spectrum(frames, NFFT):
    mag_frames = np.absolute(np.fft.rfft(frames, NFFT))  # Magnitude of the FFT
    pow_frames = ((1.0 / NFFT) * (mag_frames ** 2))  # Power Spectrum
    return pow_frames
def mel_filter_bank(pow_frames, nfilt, NFFT, sample_rate):
    low_freq_mel = 0
    high_freq_mel = (2595 * np.log10(1 + (sample_rate / 2) / 700))  # Convert Hz to Mel
    mel_points = np.linspace(low_freq_mel, high_freq_mel, nfilt + 2)  # Equally spaced in Mel scale
    hz_points = (700 * (10**(mel_points / 2595) - 1))  # Convert Mel to Hz
    bin = np.floor((NFFT + 1) * hz_points / sample_rate)

    fbank = np.zeros((nfilt, int(np.floor(NFFT / 2 + 1))))
    for m in range(1, nfilt + 1):
        f_m_minus = int(bin[m - 1])   # left
        f_m = int(bin[m])             # center
        f_m_plus = int(bin[m + 1])    # right

        for k in range(f_m_minus, f_m):
            fbank[m - 1, k] = (k - bin[m - 1]) / (bin[m] - bin[m - 1])
        for k in range(f_m, f_m_plus):
            fbank[m - 1, k] = (bin[m + 1] - k) / (bin[m + 1] - bin[m])

    filter_banks = np.dot(pow_frames, fbank.T)
    filter_banks = np.where(filter_banks == 0, np.finfo(float).eps, filter_banks)  # Numerical Stability
    filter_banks = 20 * np.log10(filter_banks)  # dB
    return filter_banks
from scipy.fftpack import dct
def compute_mfcc(filter_banks, num_ceps):
    mfcc = dct(filter_banks, type=2, axis=1, norm='ortho')[:, 1 : (num_ceps + 1)]
    return mfcc
#---------------------------------------------------------------------------------------

def amplitude_envelope(signal, frame_size, hop_length):
    """Calculate the amplitude envelope of a signal with a given frame size nad hop length."""
    amplitude_envelope = []

    # calculate amplitude envelope for each frame
    for i in range(0, len(signal), hop_length):
        amplitude_envelope_current_frame = max(signal[i:i+frame_size])
        amplitude_envelope.append(amplitude_envelope_current_frame)

    return np.array(amplitude_envelope)




def download_audio_youtube(url, name):
    yt = YouTube(url,use_oauth=False, allow_oauth_cache=True)
    video = yt.streams.filter(only_audio=True).first()
    out_file = video.download(output_path='./')
    title = yt.title

    audio = AudioSegment.from_file(out_file)
    new_file = name
    #audio = audio.set_channels(1)  # Set to mono
    #audio = audio.set_frame_rate(16000)  # Set the frame rate to 16000 Hz
    audio.export(new_file, format="wav", codec="pcm_s16le")  # Export as 16-bit PCM WAV

    os.remove(out_file)

    return new_file, title
@app.route("/get_window", methods=["POST"])
#takes in timestamp and returns the start and end of the clause
def return_comparison_window():
    parser = reqparse.RequestParser()
    parser.add_argument('id', type=int)
    parser.add_argument('isOne', type=bool)
    args = parser.parse_args()
    id = args['id']
    isOne=args['isOne'] 

    retStart=-1
    retEnd=-1
    if isOne:
         for i in len(phraseStart1):
              if (phraseStart1[i]<=id and phraseEnd1[i]>=id):
                   retStart=phraseStart1[i]
                   retEnd=phraseEnd1[i]
                   break
    else:
         for i in len(phraseStart2):
              if (phraseStart2[i]<=id and phraseEnd2[i]>=id):
                   retStart= phraseStart2[i]
                   retEnd=phraseEnd2[i]
                   break
    result = {
        "startTime": retStart,
        "endTime": retEnd
    }
    return jsonify(result)
"""@app.route("/get_phrase_data", methods=["POST"])
def get_phrase_data():
    parser = reqparse.RequestParser()
    parser.add_argument('isOne', type=bool)
    args = parser.parse_args()
    isOne=args['isOne']"""
@app.route("/get_DTW_comparison", methods=["POST"])
def comparisonWindowDTW():
    parser = reqparse.RequestParser()
    parser.add_argument('startTime', type=float)
    parser.add_argument('endTime', type=float)
    parser.add_argument('isOne', type=bool)
    args = parser.parse_args()
    startTime = args['startTime']
    endTime=args['endTime']
    isOne=args['isOne'] 
    return CalculateWindowDTW(startTime,endTime,isOne)
def CalculateWindowDTW(startTime, endTime, isOne):
    print("STI1: "+str(startTimeIndex1))
    print("STI2: "+str(startTimeIndex2))
    print("ETI1: "+str(endTimeIndex1))
    print("ETI2: "+str(endTimeIndex2))
    print("ST: "+str(startTime))
    print("ET: "+str(endTime))
    if(startTime==None or endTime==None):
        print("MissingDTW")
        result = {
            "minDistIndex": -1,
            "isOne": isOne,
            "phraseStart": -1,
            "phraseEnd": -1,
            "dists": []  # Convert numpy array to list for JSON serialization
        }    
        return jsonify(result)
    windowData=(
        (savedComparisonData1 if isOne else savedComparisonData2)
        [(startTimeIndex1 if isOne else startTimeIndex2)[startTime]:
         (endTimeIndex1 if isOne else endTimeIndex2)[endTime]]
    )
    #MFCC calculation for reference sample
    
    print("WD shape: "+str(windowData.shape))
    emphasized_signal1 = pre_emphasis(windowData.iloc[:,0].to_numpy())
    
    print("ES shape: "+str(emphasized_signal1.shape))
    # Framing
    frame_size = 0.025
    frame_stride = 0.01
    frames1 = framing(emphasized_signal1, frame_size, frame_stride, SAMPLE_RATE)

    # Windowing
    frames1 = windowing(frames1)

    # Fourier Transform and Power Spectrum
    NFFT = 512
    pow_frames1 = power_spectrum(frames1, NFFT)

    # Mel Filter Bank
    nfilt = 40
    filter_banks1 = mel_filter_bank(pow_frames1, nfilt, NFFT, SAMPLE_RATE)

    # MFCCs
    num_ceps = 12
    mfcc1 = compute_mfcc(filter_banks1, num_ceps)

    #MFCC END
    #-----------------------------------------------------------

    print("PS1: "+str(phraseStart1))
    
    print("PS2: "+str(phraseStart2))
    
    print("PE1: "+str(phraseEnd1))
    
    print("PE2: "+str(phraseEnd2))
    dists=np.empty(len(phraseStart1 if (not isOne) else phraseStart2))
    minDist=np.inf
    start=-1
    end=-1
    minDistIndex=-1
    for i in range(len(phraseStart1 if (not isOne) else phraseStart2)-1):
        compWindowData=(savedComparisonData1 if (not isOne) else savedComparisonData2)[(startTimeIndex1 if (not isOne) else startTimeIndex2)[(phraseStart1 if (not isOne) else phraseStart2)[i]]:(endTimeIndex1 if (not isOne) else endTimeIndex2)[(phraseEnd1 if (not isOne) else phraseEnd2)[i+1]]]
        print(str(type(windowData))+" "+str(type(compWindowData)))
        try:
            # Ensure all data is numeric and convert to numpy array with type float64
            windowData_array = windowData.to_numpy(dtype='float64')
            compWindowData_array = compWindowData.to_numpy(dtype='float64')

 
            print("windowData_array shape:", windowData_array.shape)
            print("compWindowData_array shape:", compWindowData_array.shape)
                #MFCC calculation for comparison sample
            emphasized_signal2 = pre_emphasis(compWindowData.iloc[:,0].to_numpy())
            # Framing
            frame_size = 0.025
            frame_stride = 0.01
            frames2 = framing(emphasized_signal2, frame_size, frame_stride, SAMPLE_RATE)

            # Windowing
            frames2 = windowing(frames2)

            # Fourier Transform and Power Spectrum
            NFFT = 512
            pow_frames2 = power_spectrum(frames2, NFFT)

            # Mel Filter Bank
            nfilt = 40
            filter_banks2 = mel_filter_bank(pow_frames2, nfilt, NFFT, SAMPLE_RATE)

            # MFCCs
            num_ceps = 12
            mfcc2 = compute_mfcc(filter_banks2, num_ceps)

            #MFCC END
            #-----------------------------------------------------------



            # Calculate DTW distance
            d = dtw_ndim.distance_fast(mfcc1, mfcc2)
            dists[i]=d
            print("Dists "+str(i)+" : "+str(d))
            if(d<minDist):
                minDist=d
                start=(phraseStart1 if (not isOne) else phraseStart2)[i]
                end=(phraseEnd1 if (not isOne) else phraseEnd2)[i]
                minDistIndex=i
        except Exception as e:
            print(f"An error occurred: {e}")
    result = {
        "minDistIndex": minDistIndex,
        "isOne": isOne,
        "phraseStart": start,
        "phraseEnd": end,
        "dists": dists.tolist()  # Convert numpy array to list for JSON serialization
    }

    
    return jsonify(result)
@app.route("/get_DTW_matches", methods=["POST"])
def get_DTW_matches():
    
    parser = reqparse.RequestParser()
    parser.add_argument('isOne', type=bool)
    args = parser.parse_args()
    isOne=args['isOne'] 

    matches = []
    
    phraseStart=phraseStart1 if (isOne) else phraseStart2
    phraseEnd=phraseEnd1 if (isOne) else phraseEnd2
    for i in range(len(phraseStart) - 1):
        response = CalculateWindowDTW(phraseStart[i], phraseEnd[i + 1], isOne)

        try:
            result = response.get_json()  # This method directly gets the JSON content from the Flask response
            if 'dists' in result:
                matches.append(result['dists'])
            else:
                print(f"Key 'dists' not found in result: {result}")
        except Exception as e:
            print(f"Error handling response: {e}")


    print("MATCH: "+str(matches))
    response_data = {
        "phrase_matches": matches
    }

    
    return jsonify(response_data) 


#isData one is a bool: true for 1, false for 2
def process_audio_data(filename,isDataOne):
    #Maybe adjust based on audio?
    MIN_SENTENCE_CONFIDENCE_THRESHOLD=0.4 #For sentence confidence
    MIN_WORD_CONFIDENCE_THRESHOLD=0.3 #For word confidence 
    # Add explanation for what is confidence TODO
    

    #TRANSCRIPTION PROCESS
    audio=whisper.load_audio(filename)
    results=whisper.transcribe(model, audio, language="en")
    
    with open('muddledData.json','w') as f:
        json.dump(results,f,indent=2,ensure_ascii=True)
    #BASIC FEATURES (w/o transcription needed)
             
    """audio,sr = librosa.load(filename)"""
    FRAME_SIZE = 512
    HOP_LENGTH=512
    
    snd = parselmouth.Sound(filename)


    ae = amplitude_envelope(audio, FRAME_SIZE, HOP_LENGTH)
    #Figure out units TODO
    np.savetxt('ampData.txt',ae,fmt='%f')
    frames = range(len(ae))
    
    t = librosa.frames_to_time(frames,sr=SAMPLE_RATE, hop_length=HOP_LENGTH)

    pitch = snd.to_pitch(time_step=(HOP_LENGTH/SAMPLE_RATE))
    pitch_values = pitch.selected_array['frequency']
#CHECK IF THIS IS EVEN USEFUL TODO
    #print("t: "+str(t[-1])+" \n tlen: "+str(len(t)))
    tck = interpolate.splrep(t, ae, s=0) #Expand variable names TODO
    #print("TCK: \n"+str(tck[-1])+"TCK \n")
    #print("\n PXS :" +str(pitch.xs()[-1])+"\n")
    stepNum = (int)(pitch.xs()[-1]*100)
    xnew = np.linspace(0,pitch.xs()[-1],num=stepNum)
    #print(str(pitch.xs()[-1])+" time compari "+str(t[-1]))
    #print("TCK: \n"+str(xnew)+"TCK \n")
    #print("LEN: "+str(len(xnew))+" 2: "+str(len(ae)))
    ynew = interpolate.splev(xnew, tck, der=0)
    avg_amp=np.nanmean(ynew)
    tckp = interpolate.splrep(pitch.xs(), pitch_values, s=0)
    xnewp = np.linspace(0, pitch.xs()[-1], num=stepNum)
    ynewp = interpolate.splev(xnewp, tckp, der=0)
    pvals = [p if (p >= 50 and p <= 350) else 0 for p in ynewp]
    #pvals= ynewp
    #print("Y1: "+str(ynewp))
    ynewp = np.array(pvals,dtype=float)
    avg_pitch=np.nanmean([p if (p!=0) else np.nan for p in ynewp]) #Removes 0s
    ##print("Y2: "+str(ynewp))
    inte = []
    pit = []


    phraseStart=[0]
    phraseEnd=[]
    
    """with open(filename, 'rb') as f:
        print("Reading "+filename)
        results = stt.recognize(audio = f, content_type = 'audio/wav', model = 'en-US_Multimedia', timestamps = True, speaker_labels = True).get_result()
   """ 
    #Transcription Values Calculation
    

    lst = []

    punctuation_symbols=[",", ".", ";", "?", "!"]
        
  #  print("len1: "+str(len(results["segments"])))
    
    for i in range(len(results["segments"])):
        if results["segments"][i]["confidence"]<MIN_SENTENCE_CONFIDENCE_THRESHOLD:
            print("Skipping Sentence "+str(i))
            continue #Skips sentence fully
     #   print("len2: "+str(len(results["segments"][i]["words"])))
        for j in range(len(results["segments"][i]["words"])):
            if results["segments"][i]["words"][j]["confidence"]<MIN_WORD_CONFIDENCE_THRESHOLD:
                print("Skipping Word "+str(i)+ ", "+str(j))
                continue #Skips word    
            lst.append([results["segments"][i]["words"][j]["text"],results["segments"][i]["words"][j]["start"],results["segments"][i]["words"][j]["end"],0,0,0,0,0,0,0])
            
            
    #        print(results["segments"][i]["words"][j]["text"])
   # print(lst)
    """for i in range(len(results['results'])):
        df_word = df_word.append(results['results'][i]['alternatives'][0]['timestamps'])
    """
    
    df_word = pd.DataFrame(lst, columns=['Word', 'Start', 'End','length','time_spent','std_time_spent','speed','post_space','amplitude','pitch'])
    
    #, 3: "length", 4: "time_spent", 5: "std_time_spent", 6: "speed", 7: "post_space", 8: "amplitude", 9:"pitch"
#    df_word = df_word.rename(columns={0: "Word", 1:"Start",2: "End"}).reset_index(drop=True)


    df_word["length"] = df_word["Word"].apply(len)
    df_word['time_spent'] = df_word['End'] - df_word['Start']
    df_word['std_time_spent'] = df_word['time_spent']/df_word['length']
    df_word["speed"] = df_word["length"]/df_word["time_spent"]
    #USELESS FIRST LINE?
    df_word["post_space"] = np.append(np.array(df_word["Start"][1:]) - np.array(df_word["End"][:-1]),0)
    

    post =  df_word['Start'][1:].values - df_word['End'][:-1].values
    df_word["time"] = df_word["Start"] + (df_word["End"] - df_word["Start"])/2

    df_word['post_space'] = np.append(post,[0])
    

    #print("YNEW\n" +str(ynew)+ "YNEW \n")
    #Probably update with frontend pause duration
    MIN_CLAUSE_PAUSE_DURATION=0.5
    ##print("\n \n \n YNEWP" +str(ynewp))
    t2=0
    startTimeIndex=[]
    endTimeIndex=[]
    for i in range(len(df_word)):
            t1 = df_word['Start'][i]
            t2 = df_word['End'][i]
            idx_amp = (xnew>t1) & (xnew<t2)
            #print("IDX: "+str(idx_amp))

            # This will return 0 if no element is True unless you check if any True exists
            if idx_amp.any():
                index_of_first_true = np.argmax(idx_amp)
            else:
                index_of_first_true = -1

            if idx_amp.any():
                index_of_last_true = len(idx_amp) - np.argmax(idx_amp[::-1]) - 1
            else:
                index_of_last_true = -1  # or any indicator for "not found"
            print("Word "+str(i)+" index: "+str(index_of_first_true)+" - "+str(index_of_last_true))
            startTimeIndex.append(int(index_of_first_true))
            endTimeIndex.append(int(index_of_last_true))
            #print("IDX: "+ str(sum(1 for x in idx_amp if x != 0 and not math.isnan(x)))+ "Last time: "+ str(xnew[-1])+" start time: "+str(t1))
           
            #print(str(xnew)+"-- --"+ str(df_word['Start'][i]))
            #print(ynew[idx_amp]) 
            all_nan = np.all(np.isnan(ynew[idx_amp]))
            int_avg=0
            if(not all_nan):
                 int_avg = np.nanmean(ynew[idx_amp])
            print(int_avg)

            norm_int_avg=int_avg/(avg_amp)
            inte.append(norm_int_avg)
            

            idx_p = (xnewp>t1) & (xnewp<t2)
            pit_avg=0
            all_nan2 = np.all(np.isnan(ynewp[idx_p]))
            if(not all_nan2):
                pit_avg = np.nanmean(ynewp[idx_p])
            norm_pit_avg=(pit_avg/(avg_pitch))
            pit.append(norm_pit_avg)


            #Check for clause ending
            hasPunctuation=False
            for sym in punctuation_symbols:
                 if sym in df_word['Word'][i]:
                      hasPunctuation=True
                      break
            if hasPunctuation or df_word['post_space'][i]>MIN_CLAUSE_PAUSE_DURATION:
                phraseStart.append(i)
                phraseEnd.append(i-1)

    print(type(phraseEnd), phraseEnd)
    print("About to append t2:", t2)    

    phraseEnd.append(i)
    
    print("Start: "+str(startTimeIndex))    
    print("End: "+str(endTimeIndex))

    try:
        if(isDataOne):
            global startTimeIndex1, endTimeIndex1
            startTimeIndex1=startTimeIndex
            endTimeIndex1=endTimeIndex
            with open('startTime1.json','w') as f:
                json.dump(startTimeIndex,f,indent=2,ensure_ascii=True)
            with open('endTime1.json','w') as f:
                json.dump(endTimeIndex,f,indent=2,ensure_ascii=True)
        else:
            
            global startTimeIndex2, endTimeIndex2
            startTimeIndex2=startTimeIndex
            endTimeIndex2=endTimeIndex
            with open('startTime2.json','w') as f:
                json.dump(startTimeIndex,f,indent=2,ensure_ascii=True)
            with open('endTime2.json','w') as f:
                json.dump(endTimeIndex,f,indent=2,ensure_ascii=True)
    except Exception as e:
        print("Error occurred:", e)    

    df_word['amplitude'] = inte
    df_word['pitch'] = pit

#NORMALIZE TIME SPENT?

        
    tcks=interpolate.splrep(df_word['time'],df_word['std_time_spent'],s=0)
    xnews=np.linspace(0,pitch.xs()[-1],num=stepNum)
    ynews=interpolate.splev(xnews,tcks,der=0)
    avg_speed=np.nanmean(ynews)
         
    #YNEWS-Speaking speed array

    print("isOne: "+str(isDataOne))
    global phraseStart1, phraseEnd1, phraseStart2, phraseEnd2, savedComparisonData1, savedComparisonData2
    if(isDataOne):
         
         savedComparisonData1=pd.DataFrame(columns=['Amp', 'Pitch', 'Speed'])
         print("Length of ynew:", len(ynew))
         print("DataFrame size:", len(savedComparisonData1))
         print("ynewp: "+str(ynewp))
         savedComparisonData1['Amp']=[p/(avg_amp) for p in ynew]
         savedComparisonData1['Pitch']=[p/(avg_pitch) for p in ynewp]
         savedComparisonData1['Speed']=[p/avg_speed for p in ynews]
         
         phraseStart1=phraseStart
         phraseEnd1=phraseEnd
         savedComparisonData1.to_csv('ComparisonData1.csv',index=False)
         print(savedComparisonData1)
    else:
         
         savedComparisonData2=pd.DataFrame(columns=['Amp', 'Pitch', 'Speed'])
         print("Length of ynew:", len(ynew))
         print("DataFrame size:", len(savedComparisonData2))
         
         print("ynewp: "+str(ynewp))
         savedComparisonData2['Amp']=[p/(avg_amp) for p in ynew]
         savedComparisonData2['Pitch']=[p/(avg_pitch) for p in ynewp]
         savedComparisonData2['Speed']=[p/avg_speed for p in ynews]
         savedComparisonData2.to_csv('ComparisonData2.csv',index=False)

         phraseStart2=phraseStart
         phraseEnd2=phraseEnd
         print(savedComparisonData2)
    print("PS: "+str(phraseStart))

    print("PE: "+str(phraseEnd))
    try:
        if(isDataOne):
            with open('phraseStart1.json','w') as f:
                json.dump(phraseStart,f,indent=2,ensure_ascii=True)
            with open('phraseEnd1.json','w') as f:
                json.dump(phraseEnd,f,indent=2,ensure_ascii=True)
        else:
            with open('phraseStart2.json','w') as f:
                json.dump(phraseStart,f,indent=2,ensure_ascii=True)
            with open('phraseEnd2.json','w') as f:
                json.dump(phraseEnd,f,indent=2,ensure_ascii=True)
    except Exception as e:
        print("Error occurred:", e)
    """matches=[]
    for i in range(len(phraseStart)-1):
         print("Calculating window from: "+str(phraseStart[i])+" : "+str(phraseEnd[i+1]))
         matches.append(CalculateWindowDTW(phraseStart[i],phraseEnd[i+1],isDataOne)['minDistIndex'])"""

    matches = []
    for i in range(len(phraseStart) - 1):
        response = CalculateWindowDTW(phraseStart[i], phraseEnd[i + 1], isDataOne)

        try:
            result = response.get_json()  # This method directly gets the JSON content from the Flask response
            if 'dists' in result:
                matches.append(result['dists'])
            else:
                print(f"Key 'dists' not found in result: {result}")
        except Exception as e:
            print(f"Error handling response: {e}")
    print("Matches: ",matches)
    """response = CalculateWindowDTW(phraseStart[i], phraseEnd[i + 1], isDataOne)
        
        if response.status_code == 200:
            try:
                result = response.get_json()  # Use get_json() for Flask Response objects
                if 'minDistIndex' in result:
                    matches.append(result['minDistIndex'])
                else:
                    print(f"Key 'minDistIndex' not found in result: {result}")
            except ValueError as e:
                print(f"Error parsing JSON: {e}")
        else:
            print(f"Request failed with status code: {response.status_code}")
        """
    return df_word, avg_amp, avg_pitch, avg_speed, phraseStart,phraseEnd, matches
#Cut phrasestart and phrase end since they are global TODO



# Serve home route
@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")
# Performs selected dimensionality reduction method (reductionMethod) on uploaded data (data), considering selected parameters (perplexity, selectedCol)
@app.route("/transcribe", methods=["POST"])
def transcribe():

    parser = reqparse.RequestParser()
    parser.add_argument('url', type=str)
    parser.add_argument('filename', type=str)
    parser.add_argument('isOne', type=bool)

    args = parser.parse_args()
    url = args['url']
    filename = args['filename']
    isOne=args['isOne']
    print("https://www.youtube.com/watch?v="+str(url))
    _, title = download_audio_youtube("https://www.youtube.com/watch?v="+url, filename)



    
    df_word, avg_amp, avg_pitch, avg_speed, phrase_start, phrase_end, matches = process_audio_data(filename,isOne)
    #df_word = pd.read_csv('kndebate.csv')#.drop(columns=['num1','num2','num3'])
    ###FIX TO BRING BACK TITLE
    df_word.to_csv('TranscribedAudio1.csv',index=False)
    
    response_data = {
        "data": df_word.to_json(orient="split"),
        "title": title,
        "average_amplitude":avg_amp ,
        "average_pitch": avg_pitch,
        "average_speed": avg_speed,
        "phrase_start": phrase_start,
        "phrase_end": phrase_end, 
        "phrase_matches": matches
    }
    
    return jsonify(response_data)

@app.route("/rec-transcribe", methods=["POST"])
def rec_transcribe():
    if 'file' not in request.files:
            print("NO FILE PART")
            return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
            
            print("NO SELECTED PART")
            return 'No selected file', 400
    print("Reading file: "+file.filename)
    isOne = request.form.get('isOne',type=str)
    if(isOne=="0"):
         isOne=False
    else:
         isOne=True
    filename = secure_filename(file.filename)
    file.save('./'+filename)

    audio = AudioSegment.from_file(filename)
    audio = audio.set_channels(1)  # Set to mono
    audio = audio.set_frame_rate(16000)  # Set the frame rate to 16000 Hz
    audio.export(filename, format="wav", codec="pcm_s16le")  # Export as 16-bit PCM WAV

    df_word, avg_amp, avg_pitch,avg_speed,phrase_start,phrase_end,matches = process_audio_data(filename,isOne )
    df_word.to_csv('TranscribedAudio2.csv',index=False)
    
    response_data = {
        "data": df_word.to_json(orient="split"),
        "title": file.filename,
        "average_amplitude":avg_amp ,
        "average_pitch": avg_pitch,
        "average_speed": avg_speed,
        "phrase_start": phrase_start,
        "phrase_end": phrase_end, 
        "phrase_matches": matches 
        
    }
    
    return jsonify(response_data)

@app.route("/upload-transcribe", methods=["POST"])
def upload_transcribe():
    if 'file' not in request.files:
            print("NO FILE PART")
            return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
            
            print("NO SELECTED PART")
            return 'No selected file', 400
    print("Reading file: "+file.filename)

    filename = secure_filename(file.filename)
    file.save(filename)
    isOne = request.form.get('isOne',type=str)
    if(isOne=="0"):
         isOne=False
    else:
         isOne=True
    print("isOne"+str(isOne)+" -> "+str(bool(isOne)))
    audio = AudioSegment.from_file(filename)
    audio = audio.set_channels(1)  # Set to mono
    audio = audio.set_frame_rate(16000)  # Set the frame rate to 16000 Hz
    audio.export(filename, format="wav", codec="pcm_s16le")  # Export as 16-bit PCM WAV

    df_word, avg_amp, avg_pitch,avg_speed,phrase_start,phrase_end,matches = process_audio_data(filename,bool(isOne))
    df_word.to_csv('TranscribedAudio3.csv',index=False)

    print("SUCCESS")
    print(str(type(df_word.to_json(orient="split")))+ " : "+str(type(avg_amp))+ " : "+str(type(avg_pitch))+ " : "+str(type(avg_speed))+ " : "+str(type(phrase_start))+ " : "+str(type(phrase_end))+ " : "+str(type(matches)))
    response_data = {
        "data": df_word.to_json(orient="split"),
        "title": file.filename,
        "average_amplitude": float(avg_amp) if isinstance(avg_amp, np.generic) else avg_amp,
        "average_pitch": float(avg_pitch) if isinstance(avg_pitch, np.generic) else avg_pitch,
        "average_speed": float(avg_speed) if isinstance(avg_speed, np.generic) else avg_speed,
        "phrase_start": [int(x) for x in phrase_start],
        "phrase_end": [int(x) for x in phrase_end],
        "phrase_matches": matches
    }

    
    return jsonify(response_data)


# Run app in debug mode
if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=8000)