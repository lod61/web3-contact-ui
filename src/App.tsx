import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import ContractInteractor from './ContractInteractor';

function App() {
  return (
    <Router>
      <ContractInteractor />
    </Router>
  );
}

export default App;
