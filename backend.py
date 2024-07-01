from flask import Flask, send_from_directory, url_for, request
from werkzeug.utils import secure_filename
from flask_cors import CORS #comment this on deployment
from flask_restful import reqparse
import pandas as pd
import io
from ast import literal_eval
import numpy as np
import heapq
import json
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

def process_audio_data(filename):
    #Maybe adjust based on audio?
    MIN_SENTENCE_CONFIDENCE_THRESHOLD=0.4 #For sentence confidence
    MIN_WORD_CONFIDENCE_THRESHOLD=0.3 #For sentence confidence 
    

    #TRANSCRIPTION PROCESS
    audio=whisper.load_audio(filename)
    results=whisper.transcribe(model, audio, language="en")
        
    with open('muddledData.json','w') as f:
        json.dump(results,f,indent=2,ensure_ascii=True)
    #BASIC FEATURES (w/o transcription needed)
             
    """audio,sr = librosa.load(filename)"""
    FRAME_SIZE = 512
    HOP_LENGTH = 512
    
    ae = amplitude_envelope(audio, FRAME_SIZE, HOP_LENGTH)
    frames = range(len(ae))
    t = librosa.frames_to_time(frames, hop_length=HOP_LENGTH)


    snd = parselmouth.Sound(filename)

    pitch = snd.to_pitch()
    pitch_values = pitch.selected_array['frequency']

    tck = interpolate.splrep(t, ae, s=0)
    xnew = np.arange(0, pitch.xs()[-1], 0.01)
    ynew = interpolate.splev(xnew, tck, der=0)

    tckp = interpolate.splrep(pitch.xs(), pitch_values, s=0)
    xnewp = np.arange(0, pitch.xs()[-1], 0.01)
    ynewp = interpolate.splev(xnewp, tckp, der=0)
    pvals = [p if (p >= 50 and p <= 350) else None for p in ynewp]
    ynewp = np.array(pvals,dtype=float)
    inte = []
    pit = []

    """with open(filename, 'rb') as f:
        print("Reading "+filename)
        results = stt.recognize(audio = f, content_type = 'audio/wav', model = 'en-US_Multimedia', timestamps = True, speaker_labels = True).get_result()
   """ 
    #Transcription Values Calculation
    

    lst = []

        
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
    df_word["post_space"] = np.append(np.array(df_word["Start"][1:]) - np.array(df_word["End"][:-1]),0)
    

    post =  df_word['Start'][1:].values - df_word['End'][:-1].values
    df_word["time"] = df_word["Start"] + (df_word["End"] - df_word["Start"])/2

    df_word['post_space'] = np.append(post,[np.nan])
    
    for i in range(len(df_word)):
            t1 = df_word['Start'][i]
            t2 = df_word['End'][i]
            idx_amp = (xnew>t1) & (xnew<t2)
            int_avg = np.nanmean(ynew[idx_amp])
            inte.append(int_avg)
            idx_p = (xnewp>t1) & (xnewp<t2)
            
            pit_avg = np.nanmean(ynewp[idx_p])
            pit.append(pit_avg)

    df_word['amplitude'] = inte
    df_word['pitch'] = pit

    return df_word



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

    args = parser.parse_args()
    url = args['url']
    filename = args['filename']
    _, title = download_audio_youtube("https://www.youtube.com/watch?v="+url, filename)



    
    df_word = process_audio_data(filename)
    #df_word = pd.read_csv('kndebate.csv')#.drop(columns=['num1','num2','num3'])
    ###FIX TO BRING BACK TITLE
    df_word.to_csv('TranscribedAudio1.csv',index=False)
    
    
    return df_word.to_json(orient="split"), title

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

    filename = secure_filename(file.filename)
    file.save('./'+filename)

    audio = AudioSegment.from_file(filename)
    audio = audio.set_channels(1)  # Set to mono
    audio = audio.set_frame_rate(16000)  # Set the frame rate to 16000 Hz
    audio.export(filename, format="wav", codec="pcm_s16le")  # Export as 16-bit PCM WAV

    df_word = process_audio_data(filename)
    df_word.to_csv('TranscribedAudio2.csv',index=False)

    return df_word.to_json(orient="split")

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

    audio = AudioSegment.from_file(filename)
    audio = audio.set_channels(1)  # Set to mono
    audio = audio.set_frame_rate(16000)  # Set the frame rate to 16000 Hz
    audio.export(filename, format="wav", codec="pcm_s16le")  # Export as 16-bit PCM WAV

    df_word = process_audio_data(filename)
    df_word.to_csv('TranscribedAudio3.csv',index=False)

##Faulty use of "Success" as return variable
    print("SUCCESS")
    return df_word.to_json(orient="split"), file.filename


# Run app in debug mode
if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=8000)