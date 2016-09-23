/* global describe, it */

import chai from 'chai'

import Import from '../src/Metamaps/Import'

const { expect } = chai

describe('Metamaps.Import.js', function () {
  it('has a topic whitelist', function () {
    expect(Import.topicWhitelist).to.deep.equal(
      ['id', 'name', 'metacode', 'x', 'y', 'description', 'link', 'permission']
    )
  })
})
