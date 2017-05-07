/* global describe, it */
import React from 'react'
import ImportDialogBox from '../../../src/components/MapView/ImportDialogBox.js'
import Dropzone from 'react-dropzone'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'

describe('ImportDialogBox', function() {
  it('has an Export CSV button', () => {
    const onExport = sinon.spy()
    const wrapper = shallow(<ImportDialogBox onExport={onExport} />)
    const button = wrapper.find('.export-csv') 
    expect(button).to.exist
    //button.simulate('click')
    expect(onExport).to.have.property('callCount', 1)
    expect(onExport.calledWith('csv')).to.equal(true)
  })

  it('has an Export JSON button', () => {
    const onExport = sinon.spy()
    const wrapper = shallow(<ImportDialogBox onExport={onExport} />)
    const button = wrapper.find('.export-json') 
    expect(button).to.exist
    //button.simulate('click')
    expect(onExport).to.have.property('callCount', 1)
    expect(onExport.calledWith('json')).to.equal(true)
  })

  it('has a Download screenshot button', () => {
    const onExport = sinon.spy()
    const wrapper = shallow(<ImportDialogBox onExport={onExport} />)
    const button = wrapper.find('.download-screenshot')
    expect(button).to.exist
    //button.simulate('click')
    expect(onExport).to.have.property('callCount', 1)
  })

  it('has a file uploader', () => {
    const uploadedFile = {}
    const onFileAdded = sinon.spy()
    const wrapper = shallow(<ImportDialogBox onExport={() => {}} onFileAdded={onFileAdded} />)
    const dropzone = wrapper.find(Dropzone)
    dropzone.props().onDropAccepted([uploadedFile], { preventDefault: () => {} })
    expect(onFileAdded).to.have.property('callCount', 1)
    expect(onFileAdded.calledWith(uploadedFile)).to.equal(true)
  })
})
