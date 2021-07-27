import './App.css';
import Console from './components/Console'
import styled from 'styled-components';
import {useEffect} from 'react';

const AppStyle = styled.div`
    background-color: #666;
    width:100%;
    height:100%;
    margin:20px;
    display:flex;
    justify-content:center;
  `;

function App() {
  useEffect(() => {
    ;
    document.getElementsByTagName("html")[0].addEventListener('click', returnFocus);

    return function cleanup() {
      window.removeEventListener('click', returnFocus);
    }
  }, []);

  let returnFocus = () => {
    document.getElementById("command").focus();
  }

  return (
    <AppStyle id="app">
      <Console/>
    </AppStyle>
  );
}

export default App;
