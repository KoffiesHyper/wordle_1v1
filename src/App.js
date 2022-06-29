import './App.css';
import Game from './Pages/Game/Game';
import Home from './Pages/Home/Home';
import { 
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom'
import { useState } from 'react';

function App() {
  const [matchID, setMatchID] = useState()


  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/match/:match_id' element={<Game />} />
      </Routes>
    </Router>
  );
}

export default App;
