import logo from './logo.svg';
import './App.css';
import CameraKit from './components/CameraKit/CameraKit';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';

function App() {

  return (
    <div style={{ height: '100vh', width: '100vw'}}>
      <div className='Col' style={{ height: '10vh' }}> {/* Set the height of the first Row */}
        Snap CameraKit Demo
      </div>
      <div className='Col' style={{ height: '80vh' }}> {/* Set the height of the second Row */}
        <CameraKit/>
      </div>
      <div className='Col' style={{ height: '10vh' }}> {/* Set the height of the third Row */}
        
      </div>
    </div>
  );
}

export default App;
