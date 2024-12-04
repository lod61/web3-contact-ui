import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import ContractInteractor from './ContractInteractor';

function App() {
  return (
    <Router basename="/">
      <ContractInteractor />
    </Router>
  );
}

export default App;
