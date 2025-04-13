import yt_dlp as youtube_dl

def download_audio(youtube_url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': '%(title)s.%(ext)s',
        'username': 'speechdiff@gmail.com',
        'password': 'HarvardDTAK2024',
        'quiet': True,
    }

    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])
        print("Audio has been downloaded")

# Example usage
youtube_url = 'https://www.youtube.com/watch?v=arj7oStGLkU'
download_audio(youtube_url)
