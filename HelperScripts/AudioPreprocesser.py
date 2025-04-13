from backend import process_audio_data
import pickle
URLS = [

]

processed_data = []
for url in URLS:
    processed_data.append({process_audio_data(url)})

pickle.dump(processed_data,)