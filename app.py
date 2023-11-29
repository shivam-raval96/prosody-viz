from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='frontend/build', static_url_path='')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return send_from_directory(app.static_folder, 'index.html')

# Add other Flask routes or API endpoints here
@app.errorhandler(404)   
def not_found(e):   
  return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(use_reloader=True, port=5000, threaded=True)