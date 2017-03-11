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
    console.log(blob)
  }

  render() {
    return (
      <div className="audio-uploader">
        <Recorder command={this.state.command} onStop={this.onStop} />
        <div className="start" onClick={this.command('start')}>Start</div>
        <div className="stop" onClick={this.command('stop')}>Stop</div>
        {this.state.command === 'start' && (
          <span>Recording...</span>
        )}
        <div className="attachment-cancel" onClick={this.props.cancel} />
      </div>
    )
  }
}

AudioUploader.propTypes = {
  updateTopic: PropTypes.func,
  cancel: PropTypes.func
}

export default AudioUploader
