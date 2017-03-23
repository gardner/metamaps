/* global $, Hogan, Bloodhound */

import GlobalUI from '../GlobalUI'

const toExport = (map) => {
const toExport = {
  isSwitchingSet: false, // indicates whether the metacode set switch lightbox is open
  selectedMetacodeSet: null,
  selectedMetacodeSetIndex: null,
  selectedMetacodeNames: [],
  newSelectedMetacodeNames: [],
  selectedMetacodes: [],
  newSelectedMetacodes: [],
  init: function(serverData) {
    toExport.newTopic.init()
    toExport.newSynapse.init()
    toExport.selectedMetacodeSet = serverData.selectedMetacodeSet
    toExport.selectedMetacodeSetIndex = serverData.selectedMetacodeSetIndex
    toExport.selectedMetacodes = serverData.selectedMetacodes
    toExport.newSelectedMetacodes = serverData.newSelectedMetacodes
    toExport.selectedMetacodeNames = serverData.newSelectedMetacodeNames
    toExport.newSelectedMetacodeNames = serverData.newSelectedMetacodeNames
    // // SWITCHING METACODE SETS
    $('#metacodeSwitchTabs').tabs({
      active: toExport.selectedMetacodeSetIndex
    }).addClass('ui-tabs-vertical ui-helper-clearfix')
    $('#metacodeSwitchTabs .ui-tabs-nav li').removeClass('ui-corner-top').addClass('ui-corner-left')
    $('.customMetacodeList li').click(toExport.toggleMetacodeSelected) // within the custom metacode set tab
    $('.selectAll').click(toExport.metacodeSelectorSelectAll)
    $('.selectNone').click(toExport.metacodeSelectorSelectNone)
  },
  toggleMetacodeSelected: function() {

    if ($(this).attr('class') !== 'toggledOff') {
      $(this).addClass('toggledOff')
      var valueToRemove = $(this).attr('id')
      var nameToRemove = $(this).attr('data-name')
      toExport.newSelectedMetacodes.splice(self.newSelectedMetacodes.indexOf(valueToRemove), 1)
      toExport.newSelectedMetacodeNames.splice(self.newSelectedMetacodeNames.indexOf(nameToRemove), 1)
    } else if ($(this).attr('class') === 'toggledOff') {
      $(this).removeClass('toggledOff')
      toExport.newSelectedMetacodes.push($(this).attr('id'))
      toExport.newSelectedMetacodeNames.push($(this).attr('data-name'))
    }
    toExport.updateSelectAllColors()
  },
  updateSelectAllColors: function() {
    $('.selectAll, .selectNone').removeClass('selected')
    if (toExport.metacodeSelectorAreAllSelected()) {
      $('.selectAll').addClass('selected')
    } else if (toExport.metacodeSelectorAreNoneSelected()) {
      $('.selectNone').addClass('selected')
    }
  },
  metacodeSelectorSelectAll: function() {
    $('.customMetacodeList li.toggledOff').each(toExport.toggleMetacodeSelected)
    toExport.updateSelectAllColors()
  },
  metacodeSelectorSelectNone: function() {
    $('.customMetacodeList li').not('.toggledOff').each(toExport.toggleMetacodeSelected)
    toExport.updateSelectAllColors()
  },
  metacodeSelectorAreAllSelected: function() {
    return $('.customMetacodeList li').toArray()
             .map(li => !$(li).is('.toggledOff')) // note the ! on this line
             .reduce((curr, prev) => curr && prev)
  },
  metacodeSelectorAreNoneSelected: function() {
    return $('.customMetacodeList li').toArray()
             .map(li => $(li).is('.toggledOff'))
             .reduce((curr, prev) => curr && prev)
  },
  metacodeSelectorToggleSelectAll: function() {
    // should be called when toExport.isSwitchingSet is true and .customMetacodeList is visible
    if (!toExport.isSwitchingSet) return
    if (!$('.customMetacodeList').is(':visible')) return

    // If all are selected, then select none. Otherwise, select all.
    if (toExport.metacodeSelectorAreAllSelected()) {
      toExport.metacodeSelectorSelectNone()
    } else {
      // if some, but not all, are selected, it still runs this function
      toExport.metacodeSelectorSelectAll()
    }
  },
  updateMetacodeSet: function(set, index, custom) {
    if (custom && toExport.newSelectedMetacodes.length === 0) {
      window.alert('Please select at least one metacode to use!')
      return false
    }

    var codesToSwitchToIds
    var metacodeModels = new DataModel.MetacodeCollection()
    toExport.selectedMetacodeSetIndex = index
    toExport.selectedMetacodeSet = 'metacodeset-' + set

    if (!custom) {
      codesToSwitchToIds = $('#metacodeSwitchTabs' + set).attr('data-metacodes').split(',')
      $('.customMetacodeList li').addClass('toggledOff')
      toExport.selectedMetacodes = []
      toExport.selectedMetacodeNames = []
      toExport.newSelectedMetacodes = []
      toExport.newSelectedMetacodeNames = []
    } else if (custom) {
      // uses .slice to avoid setting the two arrays to the same actual array
      toExport.selectedMetacodes = map.Create.newSelectedMetacodes.slice(0)
      toExport.selectedMetacodeNames = map.Create.newSelectedMetacodeNames.slice(0)
      codesToSwitchToIds = toExport.selectedMetacodes.slice(0)
    }

    // sort by name
    for (var i = 0; i < codesToSwitchToIds.length; i++) {
      metacodeModels.add(DataModel.Metacodes.get(codesToSwitchToIds[i]))
    }
    metacodeModels.sort()

    $('#metacodeImg, #metacodeImgTitle').empty()
    $('#metacodeImg').removeData('cloudcarousel')
    var newMetacodes = ''
    metacodeModels.each(function(metacode) {
      newMetacodes += '<img class="cloudcarousel" width="40" height="40" src="' + metacode.get('icon') + '" data-id="' + metacode.id + '" title="' + metacode.get('name') + '" alt="' + metacode.get('name') + '"/>'
    })

    $('#metacodeImg').empty().append(newMetacodes).CloudCarousel({
      titleBox: $('#metacodeImgTitle'),
      yRadius: 40,
      xRadius: 190,
      xPos: 170,
      yPos: 40,
      speed: 0.3,
      mouseWheel: true,
      bringToFront: true
    })

    GlobalUI.closeLightbox()
    $('#topic_name').focus()

    var mdata = {
      'metacodes': {
        'value': custom ? toExport.selectedMetacodes.toString() : map.Create.selectedMetacodeSet
      }
    }
    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/user/updatemetacodes',
      data: mdata,
      success: function(data) {
        console.log('selected metacodes saved')
      },
      error: function() {
        console.log('failed to save selected metacodes')
      }
    })
  },
  cancelMetacodeSetSwitch: function() {
    toExport.isSwitchingSet = false

    if (toExport.selectedMetacodeSet !== 'metacodeset-custom') {
      $('.customMetacodeList li').addClass('toggledOff')
      toExport.selectedMetacodes = []
      toExport.selectedMetacodeNames = []
      toExport.newSelectedMetacodes = []
      toExport.newSelectedMetacodeNames = []
    } else { // custom set is selected
      // reset it to the current actual selection
      $('.customMetacodeList li').addClass('toggledOff')
      for (var i = 0; i < toExport.selectedMetacodes.length; i++) {
        $('#' + toExport.selectedMetacodes[i]).removeClass('toggledOff')
      }
      // uses .slice to avoid setting the two arrays to the same actual array
      toExport.newSelectedMetacodeNames = self.selectedMetacodeNames.slice(0)
      toExport.newSelectedMetacodes = self.selectedMetacodes.slice(0)
    }
    $('#metacodeSwitchTabs').tabs('option', 'active', toExport.selectedMetacodeSetIndex)
    $('#topic_name').focus()
  },
  newTopic: {
    init: function() {
      $('#topic_name').keyup(function(e) {
        const ESC = 27

        if (e.keyCode === ESC) {
          toExport.newTopic.hide()
        } // if

        toExport.newTopic.name = $(this).val()
      })

      $('.pinCarousel').click(function() {
        if (toExport.newTopic.pinned) {
          $('.pinCarousel').removeClass('isPinned')
          toExport.newTopic.pinned = false
        } else {
          $('.pinCarousel').addClass('isPinned')
          toExport.newTopic.pinned = true
        }
      })

      var topicBloodhound = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: '/topics/autocomplete_topic?term=%QUERY',
          wildcard: '%QUERY'
        }
      })

      // initialize the autocomplete results for the metacode spinner
      $('#topic_name').typeahead(
        {
          highlight: true,
          minLength: 2
        },
        [{
          name: 'topic_autocomplete',
          limit: 8,
          display: function(s) { return s.label },
          templates: {
            suggestion: function(s) {
              return Hogan.compile($('#topicAutocompleteTemplate').html()).render(s)
            }
          },
          source: topicBloodhound
        }]
      )

      // tell the autocomplete to submit the form with the topic you clicked on if you pick from the autocomplete
      $('#topic_name').bind('typeahead:select', function(event, datum, dataset) {
        toExport.newTopic.beingCreated = false
        if (datum.rtype === 'topic') {
          Topic.getTopicFromAutocomplete(datum.id)
        } else if (datum.rtype === 'map') {
          Topic.getMapFromAutocomplete({
            id: datum.id,
            name: datum.label
          })
        }
      })

      // initialize metacode spinner and then hide it
      $('#metacodeImg').CloudCarousel({
        titleBox: $('#metacodeImgTitle'),
        yRadius: 40,
        xRadius: 190,
        xPos: 170,
        yPos: 40,
        speed: 0.3,
        mouseWheel: true,
        bringToFront: true
      })
      $('.new_topic').hide()
      $('#new_topic').attr('oncontextmenu', 'return false') // prevents the mouse up event from opening the default context menu on this element
    },
    name: null,
    newId: 1,
    beingtoExportd: false,
    metacode: null,
    x: null,
    y: null,
    addSynapse: false,
    pinned: false,
    open: function() {
      $('#new_topic').fadeIn('fast', function() {
        $('#topic_name').focus()
      })
      toExport.newTopic.beingCreated = true
      toExport.newTopic.name = ''
      //Map.setHasLearnedTopicCreation(true)
    },
    hide: function(force) {
      if (force || !toExport.newTopic.pinned) {
        $('#new_topic').fadeOut('fast')
      }
      if (force) {
        $('.pinCarousel').removeClass('isPinned')
        toExport.newTopic.pinned = false
      }
      if (map.DataModel.Topics.length === 0) {
        Map.setHasLearnedTopicCreation(false)
      }
      toExport.newTopic.beingCreated = false
    },
    reset: function() {
      $('#topic_name').typeahead('val', '')
    }
  },
  newSynapse: {
    init: function() {
      var synapseBloodhound = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: '/search/synapses?term=%QUERY',
          wildcard: '%QUERY'
        }
      })
      var existingSynapseBloodhound = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: '/search/synapses?topic1id=%TOPIC1&topic2id=%TOPIC2',
          prepare: function(query, settings) {
            if (map.Selected.Nodes.length < 2 && toExport.newSynapse.topic1id && self.newSynapse.topic2id) {
              settings.url = settings.url.replace('%TOPIC1', toExport.newSynapse.topic1id).replace('%TOPIC2', toExport.newSynapse.topic2id)
              return settings
            } else {
              return null
            }
          }
        }
      })

      // initialize the autocomplete results for synapse creation
      $('#synapse_desc').typeahead(
        {
          highlight: true,
          minLength: 2
        },
        [{
          name: 'synapse_autocomplete',
          display: function(s) { return s.label },
          templates: {
            suggestion: function(s) {
              return Hogan.compile("<div class='genericSynapseDesc'>{{label}}</div>").render(s)
            }
          },
          source: synapseBloodhound
        },
        {
          name: 'existing_synapses',
          limit: 50,
          display: function(s) { return s.label },
          templates: {
            suggestion: function(s) {
              return Hogan.compile($('#synapseAutocompleteTemplate').html()).render(s)
            },
            header: '<h3>Existing synapses</h3>'
          },
          source: existingSynapseBloodhound
        }]
      )

      $('#synapse_desc').keyup(function(e) {
        const ESC = 27

        if (e.keyCode === ESC) {
          toExport.newSynapse.hide()
        } // if

        toExport.newSynapse.description = $(this).val()
      })

      $('#synapse_desc').focusout(function() {
        if (toExport.newSynapse.beingCreated) {
          map.Synapse.createSynapseLocally()
        }
      })

      $('#synapse_desc').keydown(function(e) {
        const TAB = 9
        if (toExport.newSynapse.beingCreated && e.keyCode === TAB) {
          e.preventDefault()
          map.Synapse.createSynapseLocally()
        }
      })

      $('#synapse_desc').bind('typeahead:select', function(event, datum, dataset) {
        if (datum.id) { // if they clicked on an existing synapse get it
          Synapse.getSynapseFromAutocomplete(datum.id)
        } else {
          toExport.newSynapse.description = datum.value
          map.Synapse.createSynapseLocally()
        }
      })
    },
    beingtoExportd: false,
    description: null,
    topic1id: null,
    topic2id: null,
    newSynapseId: null,
    open: function() {
      $('#new_synapse').fadeIn(100, function() {
        $('#synapse_desc').focus()
      })
      toExport.newSynapse.beingCreated = true
    },
    hide: function() {
      $('#new_synapse').fadeOut('fast')
      $('#synapse_desc').typeahead('val', '')
      toExport.newSynapse.beingCreated = false
      toExport.newTopic.addSynapse = false
      toExport.newSynapse.topic1id = 0
      toExport.newSynapse.topic2id = 0
      map.Mouse.synapseStartCoordinates = []
      if (map.Visualize.mGraph) map.Visualize.mGraph.plot()
    }
  }
}
return toExport
}

export default toExport
