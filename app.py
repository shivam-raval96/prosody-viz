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
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watson import SpeechToTextV1
from pydub import AudioSegment
#import parselmouth
import librosa
from scipy.io import wavfile
import resampy
from scipy import interpolate
#import pysptk

try:
     _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
     pass
else:
    ssl._create_default_https_context = _create_unverified_https_context
 



apikey = '_K65u9xgONT0FHDv47PToenDbjW2rBnlveyMircBSJOh'
url = 'https://api.us-east.speech-to-text.watson.cloud.ibm.com/instances/cfbb148c-742d-4321-8ce5-d49ff0afa632'
authenticator = IAMAuthenticator(apikey)
stt  = SpeechToTextV1(authenticator = authenticator)
stt.set_service_url(url)

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


# Serve home route
@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")
# Performs selected dimensionality reduction method (reductionMethod) on uploaded data (data), considering selected parameters (perplexity, selectedCol)
@app.route("/transcribe", methods=["POST"])
def generate():
    '''if 'file' not in request.files:
            return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
            return 'No selected file', 400

    filename = secure_filename(file.filename)
    file.save('./'+filename)


    audio = AudioSegment.from_file(filename)  # replace with your file and format
    audio = audio.set_channels(1)  # Set to mono
    audio = audio.set_frame_rate(16000)  # Set the frame rate to 16000 Hz
    audio.export(filename, format="wav", codec="pcm_s16le")  # Export as 16-bit PCM WAV

    audio,sr = librosa.load(filename)
    FRAME_SIZE = 512
    HOP_LENGTH = 512
    ae = amplitude_envelope(audio, FRAME_SIZE, HOP_LENGTH)
    frames = range(len(ae))
    t = librosa.frames_to_time(frames, hop_length=HOP_LENGTH)


    snd = parselmouth.Sound(filename)
    pitch = snd.to_pitch()
    fs, x = wavfile.read(filename)
    # We can resample this to any sampling rate we like, say 16000 Hz
    y_low = resampy.resample(x, fs, 16000)
    #assert fs == 16000
    f0 = pysptk.rapt(y_low.astype(np.float32), fs=16000, hopsize=80, min=60, max=500, otype="f0")
    xval = np.linspace(0,pitch.xs()[-1], len(f0))

    tck = interpolate.splrep(t, ae, s=0)
    xnew = np.arange(0, pitch.xs()[-1], 0.01)
    ynew = interpolate.splev(xnew, tck, der=0)

    tckp = interpolate.splrep(xval, f0, s=0)
    xnewp = np.arange(0, pitch.xs()[-1], 0.01)
    ynewp = interpolate.splev(xnewp, tckp, der=0)

    ynewp[ynewp<50] = np.nan
    ynewp[ynewp>350] = np.nan

    time = xnew
    time_new = []
    inte = []
    pit = []


    with open(filename, 'rb') as f:
        results = stt.recognize(audio = f, content_type = 'audio/wav', model = 'en-US_Multimedia', timestamps = True, speaker_labels = True).get_result()
        
    df_word = pd.DataFrame(results['results'][0]['alternatives'][0]['timestamps'])

    df_word = df_word.rename(columns={0: "Word", 1:"Start",2: "End"}).reset_index(drop=True)
    df_word["length"] = df_word["Word"].apply(len)
    df_word['time_spent'] = df_word['End'] - df_word['Start']
    df_word['std_time_spent'] = df_word['time_spent']/df_word['length']
    df_word["speed"] = df_word["length"]/df_word["time_spent"]
    #df_word["post_space"] = np.append(np.array(df_word["Start"][1:]) - np.array(df_word["End"][:-1]),0)


    post =  df_word['Start'][1:].values - df_word['End'][:-1].values
    df_word["time"] = df_word["Start"] + (df_word["End"] - df_word["Start"])/2

    df_word['post_space'] = np.append(post,[np.nan])

    for i in range(len(df_word)):
        t1 = df_word['Start'][i]
        t2 = df_word['End'][i]
        idx1 = (time>t1) & (time<t2)
        int_avg = np.nanmean(ynew[idx1])
        inte.append(int_avg)
        pit_avg = np.nanmean(ynewp[idx1])
        pit.append(pit_avg)

    df_word['amplitude'] = inte/max(inte)
    df_word['pitch'] = pit'''


    df_word = pd.read_csv('martin_hbs2.csv').drop(columns=['num1','num2','num3'])
    
    
    return df_word.to_json(orient="split")




# Run app in debug mode
if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=8000)