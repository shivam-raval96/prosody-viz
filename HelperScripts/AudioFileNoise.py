from pydub import AudioSegment
import numpy as np
import os

def add_noise_to_audio(file_path, noise_level=0.05):
    # Load the audio file
    audio = AudioSegment.from_wav(file_path)
    
    # Convert audio to numpy array
    audio_samples = np.array(audio.get_array_of_samples())
    
    # Generate noise
    noise = np.random.normal(0, noise_level, audio_samples.shape)
    
    # Add noise to audio
    noisy_audio_samples = audio_samples + noise
    
    # Ensure the noisy samples are within the valid range for int16
    noisy_audio_samples = np.clip(noisy_audio_samples, -2**15, 2**15-1)
    
    # Convert back to an AudioSegment
    noisy_audio = audio._spawn(noisy_audio_samples.astype(np.int16).tobytes())
    
    # Save the noisy audio
    output_file_path = os.path.splitext(file_path)[0] + "_with_noise.wav"
    noisy_audio.export(output_file_path, format="wav")
    
    print(f"Noisy audio file saved at: {output_file_path}")

# Example usage
input_file_path = "..\\AudioFiles\\TedTalkExcerpt2.wav"  # Replace with your audio file path
add_noise_to_audio(input_file_path, noise_level=1000)
