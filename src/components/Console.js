import {useState} from 'react';
import Display from './Display'

function Console(){
  let [command,changeCommand] = useState("none");
  function sendCommand(){
    command = document.getElementById("command").value;
    changeCommand(command)
  }

  return(
    <div>
      <Display command={command}/>
      <input id="command" type="text"/>
      <button onClick={sendCommand}>Enter</button>
    </div>
  )
}

export default Console;