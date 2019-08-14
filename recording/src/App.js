import React from 'react';
import Websocket from 'react-websocket';
import { MediaRecord } from './component/MediaRecord';
import './App.css';
import BSON from 'bson';
import toBuffer from 'blob-to-buffer';
import { Button } from 'react-bootstrap';

export class App extends  React.Component {
  constructor(props) {
    super(props);

    this.state = {
      status: '',
      message: 'Please wait',
      stopButton: false
    };
  }
  
  handleData(data) {
    toBuffer(data, (err, buffer) => {
      let res = BSON.deserialize(buffer)
        this.setState({
          status: res.type,
          message: res.data.message
        })
    })
  }

  handleOpen() {
    this.setState({
      stopButton: false
    })
    this.sendMessage({type: 'info', data: {
      user: 'recording',
      status: this.state.status,
    }})
  }

  sendMessage(msg) {
    if(!this.refWebSocket) return;
    this.refWebSocket.sendMessage(BSON.serialize(msg))
  }

  getPieceOfStream(chunk) {
    var blob = new Blob([chunk], { 'type' : 'audio/webm; codecs=opus' });
    var reader = new FileReader();
    reader.readAsDataURL(blob); 
    reader.onloadend = () => {
        var base64data = reader.result;  
        this.sendMessage({type: 'audioChunk', 
          data: {
            audioData: base64data
          }
      }) 
    }    
  }

  handleError() {
    this.setState({
      stopButton: true
    })
  }

  render() {
    return (
      <div className="App">
        <MediaRecord  
            status={this.state.status}
            message={this.state.message}
            getChunks={this.getPieceOfStream.bind(this)}
            onStatusUpdate={(status) => {
              this.sendMessage({type: 'updateStatus', data: {
                status: status,
              }})
            }}
        />    
        <Websocket 
            url='ws://localhost:8086'
            onMessage={this.handleData.bind(this)}
            onOpen={this.handleOpen.bind(this)}
            onClose={this.handleError.bind(this)}
            reconnect={true} debug={true}
            ref={Websocket => {
              this.refWebSocket = Websocket;
            }}
        />    
        <Button disabled={!this.state.stopButton}
                variant="secondary" onClick={() => {
                  this.setState({
                    status: 'stopRecording',
                    message: 'Stop Recording',
                    stopButton: false
                  })
                }}>
                Stop Recording
        </Button>          
      </div>
    );
  }

}

export default App;
