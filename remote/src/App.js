import React from 'react';
import Websocket from 'react-websocket';
import { RecordingItem } from './component/RecordingItem';
import './App.css';
import BSON from 'bson';
import toBuffer from 'blob-to-buffer';
import { Alert } from 'react-bootstrap';

const BASE64_MARKER = ';base64,';

export class App extends  React.Component {

  constructor(props) {
    super(props);
    this.state = {
      recording: null,
      error: ''
    };
  }
  
  handleData(data) {
    toBuffer(data, (err, buffer) => {
      let res = BSON.deserialize(buffer)
      if(res.type == 'updateListRecordUsers') {
        this.setState({ 
          recording: res.data.recording 
        });
      }
      if(res.type == 'recordData') {    
        debugger;
        if(res.data.chunk) {
          this.setState({ 
            error: ''
          });              
          let binary= this.convertDataURIToBinary(res.data.chunk);
          let blob=new Blob([binary], { 'type' : 'audio/webm; codecs=opus' });
          let audioURL = window.URL.createObjectURL(blob);
          this.refs.audio_tag.src = audioURL;      
          this.refs.audio_tag.play()
        } else {
          this.setState({ 
            error: 'Empty data'
          });          
        }
      }
    })
  }

  convertDataURIToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
  
    for(let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }  

  handleOpen() {
    this.sendMessage({type: 'info', data: {
      user: 'remote'
    }})
    this.setState({
      error: ''
    })    
  }

  handleError() {
    this.setState({
      error: 'Some trouble with websocket connection'
    })
  }

  sendMessage(msg) {
    if(!this.refWebSocket) {
      this.setState({
        error: 'Some trouble with websocket connection'
      })
      return;
    }
    this.refWebSocket.sendMessage(BSON.serialize(msg))
  }

  render() {
    return (
      <div className="App">

            <RecordingItem status={this.state.recording && this.state.recording.status}
            onStartRecordingClick={() => {
              this.sendMessage({type: 'startRecording' })
            }}
            onStopRecordingClick={() => {
              this.sendMessage({type: 'stopRecording'})
            }}            
            onGetPieceOfRecord={() => {
              this.sendMessage({type: 'getPieceOfRecord'})
            }}                        
            />
          <Websocket url='ws://localhost:8086'
              onMessage={this.handleData.bind(this)}
              onOpen={this.handleOpen.bind(this)}
              onClose={this.handleError.bind(this)}
              reconnect={true} debug={true}
              ref={Websocket => {
                this.refWebSocket = Websocket;
              }}
          />  
          <audio ref="audio_tag" controls autoPlay/>
          <Alert variant='danger' show={this.state.error}>{this.state.error}</Alert>
      </div>
    );
  }
}

export default App;
