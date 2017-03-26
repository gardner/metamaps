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
    } else if (content_type.match(/^audio\//) || content_type === 'video/ogg') {
      return 'audio-file-type'
    } else {
      return 'unknown-file-type'
    }
  }

  getFileIcon = file => {
    // TODO these icons are not suitable for use - get real ones
    if (file.content_type === 'text/plain') {
      return 'http://www.iconsdb.com/icons/preview/black/text-file-xxl.png'
    } else if (file.content_type === 'application/pdf') {
      return 'https://image.flaticon.com/icons/svg/29/29587.svg'
    } else if (file.content_type.match(/^image\//)) {
      return file.url
    } else if (file.content_type.match(/^audio\//) || file.content_type === 'video/ogg') {
      return 'https://cdn0.iconfinder.com/data/icons/huge-business-vector-icons/60/music_notes-512.png'
    } else {
      return 'https://image.flaticon.com/icons/png/512/8/8235.png'
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
