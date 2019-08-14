import React from 'react';
import { Button, ButtonGroup, Alert } from 'react-bootstrap';

export class RecordingItem extends  React.Component {   
    render() {
        return (
            <div>
                <ButtonGroup aria-label="Basic example">
                    <Button disabled={this.props.status == 'startRecording'}
                            variant="secondary" onClick={() => {
                                if(this.props.onStartRecordingClick) {
                                    this.props.onStartRecordingClick()
                                }
                            }}>
                            Start Recording
                    </Button>
                    <Button disabled={this.props.status == 'stopRecording'} 
                            variant="secondary" onClick={() => {
                                if(this.props.onStopRecordingClick) {
                                    this.props.onStopRecordingClick()
                                }
                            }}>
                            Stop Recording
                    </Button>
                    <Button variant="secondary"  onClick={() => {
                                if(this.props.onGetPieceOfRecord) {
                                    this.props.onGetPieceOfRecord()
                                }
                            }}>
                            Small piece of audio file
                    </Button>
                </ButtonGroup>   
                <Alert>{this.props.status}</Alert>
            </div>
        )
    }
}