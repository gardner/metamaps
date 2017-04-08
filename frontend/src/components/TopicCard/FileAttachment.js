import React, { Component, PropTypes } from 'react'
import Dropzone from 'react-dropzone'

class FileAttachment extends Component {
  getFileTypeClass = content_type => {
    if (content_type === 'text/plain') {
      return 'text-file-type'
    } else if (content_type === 'application/pdf') {
      return 'pdf-file-type'
    } else if (content_type.match(/^image\//)) {
      return 'image-file-type'
    } else if (content_type.match(/^audio\//) ||
               content_type === 'video/ogg' ||
               content_type === 'video/webm') {
      return 'audio-file-type'
    } else {
      return 'unknown-file-type'
    }
  }

  getFileIcon = file => {
    // TODO move these icons onto our server
    if (file.content_type === 'text/plain') {
      return 'http://useiconic.com/open-iconic/svg/file.svg'
    } else if (file.content_type === 'application/pdf') {
      return 'http://useiconic.com/open-iconic/svg/document.svg'
    } else if (file.content_type.match(/^image\//)) {
      return 'http://useiconic.com/open-iconic/svg/image.svg'
    } else if (file.content_type.match(/^audio\//) ||
               file.content_type === 'video/ogg' ||
               file.content_type === 'video/webm') {
      return 'http://useiconic.com/open-iconic/svg/musical-note.svg'
    } else {
      return 'http://useiconic.com/open-iconic/svg/question-mark.svg'
    }
  }

  render() {
    const { file } = this.props
    return (
      <div className={`file ${this.getFileTypeClass(file.content_type)}`}
        style={{ clear: 'both' }}
      >
        <a href={file.url}>
          <img src={this.getFileIcon(file)}
            width="16" height="16"
            style={{ float: 'left', paddingLeft: '0.5em', paddingRight: '0.5em' }}
          />
          {file.file_name}
        </a>
        <div className="attachment-cancel" onClick={this.props.removeAttachment} />
      </div>
    )
  }
}


FileAttachment.propTypes = {
  file: PropTypes.shape({
    content_type: PropTypes.string,
    file_name: PropTypes.string,
    url: PropTypes.string
  }),
  authorizedToEdit: PropTypes.bool,
  removeAttachment: PropTypes.func
}

export default FileAttachment
