import whisper_timestamped as whisper
filename="Recording (10).wav"
model=whisper.load_model("medium")
import json
audio=whisper.load_audio(filename)
result=whisper.transcribe(model, audio, language="en")
with open('muddledData.json','w') as f:
    json.dump(result,f,indent=2,ensure_ascii=True)
        