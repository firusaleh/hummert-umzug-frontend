// src/pages/fahrzeuge/Fahrzeuge.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import FahrzeugeList from './FahrzeugeList';

const Fahrzeuge = () => {
  const navigate = useNavigate();

  return (
    <div>
      <FahrzeugeList />
    </div>
  );
};

export default Fahrzeuge;