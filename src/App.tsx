import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import ContractInteractor from './ContractInteractor';

function App() {
  return (
    <Router>
      <ContractInteractor />
    </Router>
  );
}

export default App;
