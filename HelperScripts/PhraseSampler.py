from pydub import AudioSegment
import simpleaudio as sa
import json
import pandas as pd
import numpy as np
import asyncio

# Load audio files
def load_audio(file_path):
    return AudioSegment.from_file(file_path)

# Synchronous function to play audio
def play_audio_segment_sync(audio_segment):
    if len(audio_segment) == 0:
        print("Audio segment is empty, skipping playback.")
        return
    print(f"Channels: {audio_segment.channels}")
    print(f"Sample Width: {audio_segment.sample_width}")
    print(f"Frame Rate: {audio_segment.frame_rate}")
    print(f"Length (ms): {len(audio_segment)}")

    play_obj = sa.play_buffer(
        audio_segment.raw_data,
        num_channels=audio_segment.channels,
        bytes_per_sample=audio_segment.sample_width,
        sample_rate=audio_segment.frame_rate
    )
    
    play_obj.wait_done()

# Async function to run the synchronous play function
async def play_audio_segment(audio_segment):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, play_audio_segment_sync, audio_segment)

# Async function to play a sequence of audio segments
async def play_audio_sequence(sections):
    for section in sections:
        await play_audio_segment(section)

# Function to get a segment of audio
def get_audio_section(audio, start_ms, end_ms):
    return audio[start_ms:end_ms]

# Example usage of loading data from JSON files
def load_json(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        print(f"Data loaded successfully from {file_path}")
        return data
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {file_path}")
        return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

# Load start and end times from JSON files
startTimes1 = load_json('phraseStart1.json')
endTimes1 = load_json('phraseEnd1.json')
wordStartIndexes1 = load_json('startTime1.json')
wordEndIndexes1 = load_json('endTime1.json')

# Load the audio files
audio1 = load_audio("ozymandias_reading_2.wav")
audio2 = load_audio("ozymandias_reading_2.wav")

# Indexes for segments to play
index1 = 5
index2 = 2

# Calculate start and end times in milliseconds
start1, end1 = wordStartIndexes1[startTimes1[index1]+1]*10, wordEndIndexes1[endTimes1[index1]+1]*10
start2, end2 = wordStartIndexes1[startTimes1[index2]+1]*10, wordEndIndexes1[endTimes1[index2]+1]*10

# Get the audio sections
section1 = get_audio_section(audio1, start1, end1)
section2 = get_audio_section(audio2, start2, end2)

# Create a list of sections to play sequentially
sections = [section1, section1]

# Define the main async function to play the audio sequence
async def main():
    await play_audio_sequence(sections)
    await asyncio.sleep(10)


# Start the asyncio event loop
asyncio.run(main())

# Continue with other code while the audio is playing
print("Started playing audio sections sequentially in the background.")

"""from pydub import AudioSegment
import simpleaudio as sa
import json
import pandas as pd
import numpy as np
import asyncio

# Load audio files
def load_audio(file_path):
    return AudioSegment.from_file(file_path)

# Synchronous function to play audio
def play_audio_segment_sync(audio_segment):
    if len(audio_segment) == 0:
        print("Audio segment is empty, skipping playback.")
        return
    print(f"Channels: {audio_segment.channels}")
    print(f"Sample Width: {audio_segment.sample_width}")
    print(f"Frame Rate: {audio_segment.frame_rate}")
    print(f"Length (ms): {len(audio_segment)}")

    play_obj = sa.play_buffer(
        audio_segment.raw_data,
        num_channels=audio_segment.channels,
        bytes_per_sample=audio_segment.sample_width,
        sample_rate=audio_segment.frame_rate
    )
    
    play_obj.wait_done()

# Async function to run the synchronous play function
async def play_audio_segment(audio_segment):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, play_audio_segment_sync, audio_segment)

# Async function to play a sequence of audio segments
async def play_audio_sequence(sections):
    for section in sections:
        await play_audio_segment(section)

# Function to get a segment of audio
def get_audio_section(audio, start_ms, end_ms):
    return audio[start_ms:end_ms]

# Example usage of loading data from JSON files
def load_json(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        print(f"Data loaded successfully from {file_path}")
        return data
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {file_path}")
        return []
    except Exception as e:
        print(f"An error occurred: {e}")
        return []

# Load start and end times from JSON files
startTimes1 = load_json('phraseStart1.json')
endTimes1 = load_json('phraseEnd1.json')
wordStartIndexes1 = load_json('startTime1.json')
wordEndIndexes1 = load_json('endTime1.json')

# Load the audio files
audio1 = load_audio("ozymandias_reading_2.wav")
audio2 = load_audio("ozymandias_reading_2.wav")

# Indexes for segments to play
index1 = 2
index2 = 2

# Calculate start and end times in milliseconds
start1, end1 = wordStartIndexes1[startTimes1[index1]+1]*10, wordEndIndexes1[endTimes1[index1]+1]*10
start2, end2 = wordStartIndexes1[startTimes1[index2]+1]*10, wordEndIndexes1[endTimes2[index2]+1]*10

# Get the audio sections
section1 = get_audio_section(audio1, start1, end1)
section2 = get_audio_section(audio2, start2, end2)

# Create a list of sections to play sequentially
sections = [section1, section2]

# Define the main async function to play the audio sequence
async def main():
    await play_audio_sequence(sections)

# Start the asyncio event loop
asyncio.run(main())

# Continue with other code while the audio is playing
print("Started playing audio sections sequentially in the background.")
"""