import {useState} from 'react';
import Display from './Display'

function Console(){
  let [command,changeCommand] = useState({command:"none",call: 0});
  
  function sendCommand(){
    let newCommand = document.getElementById("command").value;
    changeCommand({command:newCommand,call:(command.call + 1)})
  }

  return(
    <div>
      <Display command={command.command} call={command.call}/>
      <input id="command" type="text"/>
      <button onClick={sendCommand}>Enter</button>
    </div>
  )
}

export default Console;