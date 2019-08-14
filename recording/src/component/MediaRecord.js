import React from 'react';
import { Alert } from 'react-bootstrap';

const TIMESLICE = 2000;

export class MediaRecord  extends  React.Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: ''
        }
        this.chunks = []
        this.onStop = this.onStop.bind(this)
        this.onError = this.onError.bind(this)
        this.onDataAvailable = this.onDataAvailable.bind(this)
      }

    async getMedia() {
        let stream = null;
      
        try {
          stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
        } catch(err) {
          if(this.props.onError) {
            this.props.onError(err.message)
          } 
        }
        return stream;
    }

    async startRecord() {
        let stream = await this.getMedia();
        const mime = ['audio/wav', 'audio/mpeg', 'audio/webm', 'audio/ogg']
        .filter(MediaRecorder.isTypeSupported)[0];
        this.mediaRecorder = new MediaRecorder(stream,{
            mimeType: mime
        });
        this.mediaRecorder.addEventListener('dataavailable', this.onDataAvailable);
        this.mediaRecorder.addEventListener('stop', this.onStop);
        this.mediaRecorder.addEventListener('error', this.onError);
        this.mediaRecorder.start(TIMESLICE)
        this.props.onStatusUpdate('startRecording')
    }

    async stopRecord() {
        if(this.mediaRecorder) {
            this.mediaRecorder.stop()            
        }
    }

    onDataAvailable(e) {
        this.chunks.push(e.data)
        if(this.props.getChunks) {
            this.props.getChunks(e.data)
        }
    }

    onStop() {
        this.download()
        this.props.onStatusUpdate('stopRecording')
    }

    onError(e) {
        if(this.props.onStatusUpdate) {
            this.setState({
                errorMessage: e.message
            })
            this.props.onStatusUpdate('error')
        }         
    }  

    componentWillReceiveProps(nextProps) {
        if(nextProps.status != this.props.status) {
            if(nextProps.status == 'startRecording') {
                this.startRecord()
            }
            if(nextProps.status == 'stopRecording') {
                this.stopRecord()
            }
        }
    }

    download() {
        var blob = new Blob(this.chunks);
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        let typeFile = this.mediaRecorder.mimeType.match('\/.+$')[0].substring(1)
        a.download = `test.${typeFile}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

    render() {
        let variant = 'dark';
        if(this.props.status == 'startRecording') {
            variant = 'success'
        }
        if(this.state.errorMessage) {
            variant = 'danger'
        }
        return (
            <div>
                <Alert variant={variant}>
                    {this.state.errorMessage || this.props.message}
                </Alert>      

            </div>
        )    
    }
}