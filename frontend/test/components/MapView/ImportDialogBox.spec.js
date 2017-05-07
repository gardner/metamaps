/* global describe, it */
import React from 'react'
import ImportDialogBox from '../../../src/components/MapView/ImportDialogBox.js'
import Dropzone from 'react-dropzone'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'

describe('ImportDialogBox', function() {
  const csvExport = sinon.spy()
  const jsonExport = sinon.spy()
  const onExport = format => () => {
    if (format === 'csv') {
      csvExport()
    } else if (format === 'json') {
      jsonExport()
    }
  }

  it('has an Export CSV button', () => {
    const wrapper = shallow(<ImportDialogBox onExport={onExport} />)
    const button = wrapper.find('.export-csv')
    expect(button).to.exist
    button.simulate('click')
    expect(csvExport).to.have.property('callCount', 1)
  })

  it('has an Export JSON button', () => {
    const wrapper = shallow(<ImportDialogBox onExport={onExport} />)
    const button = wrapper.find('.export-json')
    expect(button).to.exist
    button.simulate('click')
    expect(jsonExport).to.have.property('callCount', 1)
  })

  it('has a Download screenshot button', () => {
    const downloadScreenshot = sinon.spy()
    const wrapper = shallow(<ImportDialogBox onExport={() => null} downloadScreenshot={downloadScreenshot} />)
    const button = wrapper.find('.download-screenshot')
    expect(button).to.exist
    button.simulate('click')
    expect(downloadScreenshot).to.have.property('callCount', 1)
  })

  it('has a file uploader', () => {
    const uploadedFile = {}
    const onFileAdded = sinon.spy()
    const wrapper = shallow(<ImportDialogBox onExport={() => null} onFileAdded={onFileAdded} />)
    const dropzone = wrapper.find(Dropzone)
    dropzone.props().onDropAccepted([uploadedFile], { preventDefault: () => {} })
    expect(onFileAdded).to.have.property('callCount', 1)
    expect(onFileAdded.calledWith(uploadedFile)).to.equal(true)
  })
})
