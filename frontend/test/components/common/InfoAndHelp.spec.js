/* global describe, it */
import React from 'react'
import { expect } from 'chai'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import InfoAndHelp from '../../../src/components/common/InfoAndHelp.js'
import MapInfoBox from '../../../src/components/MapView/MapInfoBox.js'

function assertContent({ currentUser, map }) {
  const onInfoClick = sinon.spy()
  const onHelpClick = sinon.spy()
  const onStarClick = sinon.spy()
  const wrapper = shallow(
    <InfoAndHelp map={map} currentUser={currentUser}
      onInfoClick={onInfoClick}
      onHelpClick={onHelpClick}
      onMapStar={onStarClick}
      mapIsStarred={false}
    />)

  if (map) {
    it('renders MapInfoBox', () => expect(wrapper.find(MapInfoBox)).to.exist)
    it('renders Map Info icon', () => {
      expect(wrapper.find('.mapInfoIcon')).to.exist
      expect(wrapper.find('.mapInfoIcon .tooltipsAbove').text()).to.equal('Map Info')
      wrapper.find('.mapInfoIcon').simulate('click')
      expect(onInfoClick).to.have.property('callCount', 1)
    })
  } else {
    it('does not render MapInfoBox', () => expect(wrapper.find(MapInfoBox).length).to.equal(0))
    it('does not render Map Info icon', () => expect(wrapper.find('.mapInfoIcon').length).to.equal(0))
  }

  if (map && currentUser) {
    it('renders Star icon', () => {
      expect(wrapper.find('.starMap')).to.exist
      wrapper.find('.starMap').simulate('click')
      expect(onStarClick).to.have.property('callCount', 1)
    })
  } else {
    it('does not render the Star icon', () => expect(wrapper.find('.starMap').length).to.equal(0))
  }

  // common content
  it('renders Help icon', function() {
    expect(wrapper.find('.openCheatsheet')).to.exist
    expect(wrapper.find('.openCheatsheet .tooltipsAbove').text()).to.equal('Help')
    wrapper.find('.openCheatsheet').simulate('click')
    expect(onHelpClick).to.have.property('callCount', 1)
  })
  it('renders clearfloat at the end', function() {
    const clearfloat = wrapper.find('.clearfloat')
    expect(clearfloat).to.exist
    expect(wrapper.find('.infoAndHelp').children().last()).to.eql(clearfloat)
  })
}

function assertStarLogic({ mapIsStarred }) {
  const onMapStar = sinon.spy()
  const onMapUnstar = sinon.spy()
  const wrapper = shallow(
    <InfoAndHelp map={{}} currentUser={{}}
      onMapStar={onMapStar}
      onMapUnstar={onMapUnstar}
      mapIsStarred={mapIsStarred}
    />)
  const starWrapper = wrapper.find('.starMap')
  starWrapper.simulate('click')
  if (mapIsStarred) {
    it('has unstar content', () => {
      expect(starWrapper.hasClass('starred')).to.equal(true)
      expect(starWrapper.find('.tooltipsAbove').text()).to.equal('Unstar')
      expect(onMapStar).to.have.property('callCount', 0)
      expect(onMapUnstar).to.have.property('callCount', 1)
    })
  } else {
    it('has star content', () => {
      expect(starWrapper.hasClass('starred')).to.equal(false)
      expect(starWrapper.find('.tooltipsAbove').text()).to.equal('Star')
      expect(onMapStar).to.have.property('callCount', 1)
      expect(onMapUnstar).to.have.property('callCount', 0)
    })
  }
}

describe('InfoAndHelp', function() {
  describe('no currentUser, map is present', function() {
    assertContent({ currentUser: null, map: {} })
  })
  describe('currentUser is present, map is present', function() {
    assertContent({ currentUser: {}, map: {} })
  })
  describe('no currentUser, no map', function() {
    assertContent({ currentUser: null, map: null })
  })
  assertStarLogic({ mapIsStarred: true })
  assertStarLogic({ mapIsStarred: false })
})
