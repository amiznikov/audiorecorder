const RecordingItem = require("./RecordingItem");
const BSON = require('bson');
const fs = require('fs');

const {
  info,
  startRecording,
  stopRecording,
  getPieceOfRecord,
  recordData,
  updateStatus,
  audioChunk
} = require("./message-types");

var remote = null;
var recording = null;
var countRecordFile = 0
var mediaFile = null

const parseMessage = (json) => {
  try {
    return BSON.deserialize(json);
  } catch (err) {
    return {};
  }
};

const onDisconnect = ({ ws }) => {
  if(remote === ws) {
    remote = null;
  } else {
    if(recording.ws == ws) {
      recording = null
    }
  }
};

const onStartRecording = () => {
  if(recording) {
    mediaFile = fs.createWriteStream(`./test${countRecordFile}.webm`);
    countRecordFile++;
    recording.audioData = []    
    sendMessage('startRecording' ,recording.ws, {data: {message: 'Start recording'}})
  }
};

const onStopRecording = () => {
  if(recording) {
    sendMessage('stopRecording' ,recording.ws, {data: {message: 'Stop recording'}})
  }
};

const onGetPieceOfRecord = () => {
  if(recording) {
    if(recording.audioData && recording.audioData.length) {
      sendMessage('recordData', remote, {data: {
        chunk: recording.audioData[0]
      }})    
    } else {
      sendMessage('recordData', remote, {data: {
        chunk: null
      }})          
    }
  }
};

const onUpdateStatus = ({ data }) => {
  if(recording) {
    recording.data.status = data.status;
    updateListRecordingUsers()
  }
};

const onAudioChunk = ({data}) => {
  if(recording) {
    if(!recording.audioData) {
      recording.audioData = [data.audioData]
    } else {
      recording.audioData.push(data.audioData)
    }
    saveAudioRecord(data.audioData)
  }
}

const onInfoAboutConnection = ({ ws, data }) => {
  if(data.user == 'remote') {
    remote = ws;
    updateListRecordingUsers()
  }
  if(data.user == 'recording') {
    recording = new RecordingItem(ws, data)
    updateListRecordingUsers()
  }
};

const onPieceOfRecord = ({ ws, data }) => {
  sendMessage('recordData', remote, data)
}

const updateListRecordingUsers = () => {
  if(!recording || !remote) return;
  sendMessage('updateListRecordUsers', remote, {data: {recording: recording.data}})       
}

const sendMessage = (type, ws, data) => {
  let sendData = {type, ...data}
  ws.send(BSON.serialize(sendData)); 
}

const messageHandlerMap = {
  [info]: onInfoAboutConnection,
  [startRecording]: onStartRecording,
  [stopRecording]: onStopRecording,
  [getPieceOfRecord]: onGetPieceOfRecord,
  [recordData]: onPieceOfRecord,
  [updateStatus]: onUpdateStatus,
  [audioChunk]: onAudioChunk
};

const saveAudioRecord = (data) => {
  if(!data || !mediaFile) return;
  mediaFile.write(Buffer.from(data.replace('data:audio/webm; codecs=opus;base64,', ''), 'base64'))
}

const wsMessageHandler = ({ ws }) => {
  ws.on("close", () => onDisconnect({ ws }));
  
  return (message) => {
    const { type, data } = parseMessage(message);
    const handler = messageHandlerMap[type];

    if (handler) {
      handler({ ws, data });
    }
  };
};

module.exports = { wsMessageHandler };
