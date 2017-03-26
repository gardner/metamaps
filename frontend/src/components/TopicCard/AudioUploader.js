import React, { Component, PropTypes } from 'react'

import Recorder from 'react-recorder'

class AudioUploader extends Component {
  constructor(props) {
    super(props)

    this.state = {
      command: 'none'
    }
  }

  command = cmd => () => {
    this.setState({ command: cmd })
  }

  onStop = blob => {
    const now = new Date()
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}:${now.getMinutes()}`
    const filename = `metamaps-recorded-audio-${date}.webm`
    const file = new File([blob], filename, { type: 'video/webm', lastModifiedDate: now })

    this.props.uploadAttachment(file).then(success => {
      if (!success) {
        this.command('none')
      }
    })
  }

  render() {
    return (
      <div className="audio-uploader">
        <Recorder command={this.state.command} onStop={this.onStop} />
        {this.state.command === 'start' && (
          <div className="upload-audio-recording">
            <div className="stop upload-audio-stop" onClick={this.command('stop')}>Stop</div>
            Recording...
          </div>
        )}
        {this.state.command === 'none' && (
          <div className="start upload-audio-start" onClick={this.command('start')}>
            Click to record <br />
            (max 30 seconds)
          </div>
        )}
        <div className="attachment-cancel" onClick={this.props.cancel} />
      </div>
    )
  }
}

AudioUploader.propTypes = {
  uploadAttachment: PropTypes.func,
  cancel: PropTypes.func
}

export default AudioUploader
