import {useState} from 'react';
import Display from './Display'
import styled from 'styled-components';


const ConsoleStyle = styled.div`
    margin: 20px;
  `;


const InputStyle = styled.input`
  font-size: 24px;
  font-family: Consolas;
  text-align: left;
  background-color: black;
  padding: 0px;
  color: green;
  background: black;
  border: 0px;
  outline:none;

`;

const NoWidth = styled.div`
  display: flex;
  font-size: 24px;
  font-family: Consolas;
  text-align: left;
  background-color: black;
  padding: 0px;
  color: green;

  background: black;
  border: 0px;
  outline:none;
`;

const WithWidth = styled(NoWidth)`
  width: 420px;
`;


function Console(){

  let [command,changeCommand] = useState({command:"none",call: 0});
  
  function sendCommand(){
    let newCommand = document.getElementById("command").value;
    changeCommand({command:newCommand,call:(command.call + 1)})
  }

 function pressEnter(e) {
    if (e.key === 'Enter') {
      sendCommand()
    }
  }

  return(
    <ConsoleStyle>
      <Display command={command.command} call={command.call}/>
      <WithWidth>
        <NoWidth>>></NoWidth>
        <InputStyle autoFocus key="input1" autoComplete="off" id="command" type="text" onKeyPress={pressEnter} />
      </WithWidth>
    </ConsoleStyle>
  )
}

export default Console;