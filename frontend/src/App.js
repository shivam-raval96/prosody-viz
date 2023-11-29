// src/App.js
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Homepage from './components/homepage';
import AboutPage from './components/about';
//import TextRender from './components/textrender';
import './App.css';

const handleNavigation = (e) => {
  e.preventDefault();
  // Use React Router's navigate function or history.push
};
function App() { 

  return (
    <>
      <nav class="shift navbar navbar-expand-lg navbar-light">
        <a class="navbar-brand" href="#">SpeechViz</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav mr-auto">
            <li class="nav-item active">
              <Link to="/" className="link">Home</Link>
            </li>
            <li class="nav-item">
              <Link to="/about" className="link">About</Link>
            </li>
          </ul>
        </div>
      </nav>
    
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
    </>
  );
}

export default App;