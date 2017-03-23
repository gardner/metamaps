/* global $, Hogan, Bloodhound, Countable */

import outdent from 'outdent'
import { browserHistory } from 'react-router'

import DataModel from '../DataModel'
import GlobalUI, { ReactApp } from '../GlobalUI'
import Util from '../Util'

const InfoBox = (map) => {
  const toExport = {
    isOpen: false,
    selectingPermission: false,
    changePermissionText: "<div class='tooltips'>As the creator, you can change the permission of this map, and the permission of all the topics and synapses you have authority to change will change as well.</div>",
    nameHTML: outdent`
      <span class="best_in_place best_in_place_name"
        id="best_in_place_map_{{id}}_name"
        data-bip-url="/maps/{{id}}"
        data-bip-object="map"
        data-bip-attribute="name"
        data-bip-type="textarea"
        data-bip-activator="#mapInfoName"
        data-bip-value="{{name}}"
      >{{name}}</span>`,
    descHTML: outdent`
      <span class="best_in_place best_in_place_desc"
        id="best_in_place_map_{{id}}_desc"
        data-bip-url="/maps/{{id}}"
        data-bip-object="map"
        data-bip-attribute="desc"
        data-bip-nil="Click to add description..."
        data-bip-type="textarea"
        data-bip-activator="#mapInfoDesc"
        data-bip-value="{{desc}}"
      >{{desc}}</span>`,
    userImageUrl: '',
    html: '',
    init: function(serverData, updateThumbnail) {
      var self = toExport

      self.updateThumbnail = updateThumbnail

      $('.mapInfoBox').click(function(event) {
        event.stopPropagation()
      })
      $('body').click(self.close)

      self.attachEventListeners()

      self.generateBoxHTML = Hogan.compile($('#mapInfoBoxTemplate').html())

      self.userImageUrl = serverData['user.png']

      var querystring = window.location.search.replace(/^\?/, '')
      if (querystring === 'new') {
        self.open()
        $('.mapInfoBox').addClass('mapRequestTitle')
        $('#mapInfoName').trigger('click')
        $('#mapInfoName textarea').focus()
        $('#mapInfoName textarea').select()
      }
    },
    toggleBox: function(event) {
      var self = toExport

      if (self.isOpen) self.close()
      else self.open()

      event.stopPropagation()
    },
    open: function() {
      var self = toExport
      $('.mapInfoIcon div').addClass('hide')
      $('.maptoExport').fadeIn(200, function() {
        self.isOpen = true
      })
    },
    close: function() {
      var self = toExport
      $('.mapInfoIcon div').removeClass('hide')
      $('.mapInfoBox').fadeOut(200, function() {
        self.isOpen = false
        self.hidePermissionSelect()
        $('.mapContributors .tip').hide()
      })
    },
    load: function() {
      var self = toExport

      var m = map.Active.Map

      var obj = m.pick('permission', 'topic_count', 'synapse_count')

      var isCreator = m.authorizePermissionChange(map.Active.Mapper)
      var canEdit = m.authorizeToEdit(map.Active.Mapper)
      var relevantPeople = m.get('permission') === 'commons' ? map.DataModel.Mappers : map.DataModel.Collaborators
      var shareable = m.get('permission') !== 'private'

      obj['name'] = canEdit ? Hogan.compile(self.nameHTML).render({id: m.id, name: m.get('name')}) : m.get('name')
      obj['desc'] = canEdit ? Hogan.compile(self.descHTML).render({id: m.id, desc: m.get('desc')}) : m.get('desc')
      obj['map_creator_tip'] = isCreator ? self.changePermissionText : ''

      obj['contributor_count'] = relevantPeople.length
      obj['contributors_class'] = relevantPeople.length > 1 ? 'multiple' : ''
      obj['contributors_class'] += relevantPeople.length === 2 ? ' mTwo' : ''
      obj['contributor_image'] = relevantPeople.length > 0 ? relevantPeople.models[0].get('image') : self.userImageUrl
      obj['contributor_list'] = self.createContributorList()

      obj['user_name'] = isCreator ? 'You' : m.get('user_name')
      obj['created_at'] = m.get('created_at_clean')
      obj['updated_at'] = m.get('updated_at_clean')

      self.generateBoxHTML = self.generateBoxHTML || Hogan.compile($('#mapInfoBoxTemplate').html())
      self.html = self.generateBoxHTML.render(obj)
      ReactApp.render()
      self.attachEventListeners()
    },
    attachEventListeners: function() {
      var self = toExport

      $('.maptoExport.canEdit .best_in_place').best_in_place()

      // because anyone who can edit the map can change the map title
      var bipName = $('.maptoExport .best_in_place_name')
      bipName.unbind('best_in_place:activate').bind('best_in_place:activate', function() {
        var $el = bipName.find('textarea')
        var el = $el[0]

        $el.attr('maxlength', '140')

        $('.mapInfoName').append('<div class="nameCounter forMap"></div>')

        var callback = function(data) {
          $('.nameCounter.forMap').html(data.all + '/140')
        }
        Countable.live(el, callback)
      })
      bipName.unbind('best_in_place:deactivate').bind('best_in_place:deactivate', function() {
        $('.nameCounter.forMap').remove()
      })

      $('.mapInfoName .best_in_place_name').unbind('ajax:success').bind('ajax:success', function() {
        var name = $(this).html()
        map.Active.Map.set('name', name)
        map.Active.Map.trigger('saved')
        // mobile menu
        $('#header_content').html(name)
        $('.maptoExport').removeClass('mapRequestTitle')
        document.title = `${name} | Metamaps`
        window.history.replaceState('', `${name} | Metamaps`, window.location.pathname)
      })

      $('.mapInfoDesc .best_in_place_desc').unbind('ajax:success').bind('ajax:success', function() {
        var desc = $(this).html()
        map.Active.Map.set('desc', desc)
        map.Active.Map.trigger('saved')
      })

      $('.mapInfoDesc .best_in_place_desc, .mapInfoName .best_in_place_name').unbind('keypress').keypress(function(e) {
        const ENTER = 13
        if (e.which === ENTER) {
          $(this).data('bestInPlaceEditor').update()
        }
      })

      $('.yourMap .mapPermission').unbind().click(self.onPermissionClick)
      // .yourMap in the unbind/bind is just a namespace for the events
      // not a reference to the class .yourMap on the .maptoExport
      $('.maptoExport.yourMap').unbind('.yourMap').bind('click.yourMap', self.hidePermissionSelect)

      $('.yourMap .mapInfoDelete').unbind().click(self.deleteActiveMap)
      $('.mapInfoThumbnail').unbind().click(self.updateThumbnail)

      $('.mapContributors span, #mapContribs').unbind().click(function(event) {
        $('.mapContributors .tip').toggle()
        event.stopPropagation()
      })
      $('.mapContributors .tip').unbind().click(function(event) {
        event.stopPropagation()
      })

      $('.maptoExport').unbind('.hideTip').bind('click.hideTip', function() {
        $('.mapContributors .tip').hide()
      })

      self.addTypeahead()
    },
    addTypeahead: function() {
      var self = toExport

      if (!map.Active.Map) return

      // for autocomplete
      var collaborators = {
        name: 'collaborators',
        limit: 9999,
        display: function(s) { return s.label },
        templates: {
          notFound: function(s) {
            return Hogan.compile($('#collaboratorSearchTemplate').html()).render({
              value: 'No results',
              label: 'No results',
              rtype: 'noresult',
              profile: self.userImageUrl
            })
          },
          suggestion: function(s) {
            return Hogan.compile($('#collaboratorSearchTemplate').html()).render(s)
          }
        },
        source: new Bloodhound({
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          remote: {
            url: '/search/mappers?term=%QUERY',
            wildcard: '%QUERY'
          }
        })
      }

      // for adding map collaborators, who will have edit rights
      if (map.Active.Mapper && map.Active.Mapper.id === map.Active.Map.get('user_id')) {
        $('.collaboratorSearchField').typeahead(
          {
            highlight: false
          },
          [collaborators]
        )
        $('.collaboratorSearchField').bind('typeahead:select', self.handleResultClick)
        $('.mapContributors .removeCollaborator').click(function() {
          self.removeCollaborator(parseInt($(this).data('id')))
        })
      }
    },
    removeCollaborator: function(collaboratorId) {
      var self = toExport
      map.DataModel.Collaborators.remove(map.DataModel.Collaborators.get(collaboratorId))
      var mapperIds = map.DataModel.Collaborators.models.map(function(mapper) { return mapper.id })
      $.post('/maps/' + map.Active.Map.id + '/access', { access: mapperIds })
      self.updateNumbers()
    },
    addCollaborator: function(newCollaboratorId) {
      var self = toExport

      if (map.DataModel.Collaborators.get(newCollaboratorId)) {
        GlobalUI.notifyUser('That user already has access')
        return
      }

      function callback(mapper) {
        map.DataModel.Collaborators.add(mapper)
        var mapperIds = map.DataModel.Collaborators.models.map(function(mapper) { return mapper.id })
        $.post('/maps/' + map.Active.Map.id + '/access', { access: mapperIds })
        var name = map.DataModel.Collaborators.get(newCollaboratorId).get('name')
        GlobalUI.notifyUser(name + ' will be notified')
        self.updateNumbers()
      }

      $.getJSON('/users/' + newCollaboratorId + '.json', callback)
    },
    handleResultClick: function(event, item) {
      var self = toExport

      self.addCollaborator(item.id)
      $('.collaboratorSearchField').typeahead('val', '')
    },
    updateNameDescPerm: function(name, desc, perm) {
      $('.maptoExport').removeClass('mapRequestTitle')
      $('.mapInfoName .best_in_place_name').html(name)
      $('.mapInfoDesc .best_in_place_desc').html(desc)
      $('.maptoExport .mapPermission').removeClass('commons public private').addClass(perm)
    },
    createContributorList: function() {
      var relevantPeople = map.Active.Map.get('permission') === 'commons' ? map.DataModel.Mappers : map.DataModel.Collaborators
      var activeMapperIsCreator = map.Active.Mapper && map.Active.Mapper.id === map.Active.Map.get('user_id')
      var string = ''
      string += '<ul>'

      relevantPeople.each(function(m) {
        var isCreator = map.Active.Map.get('user_id') === m.get('id')
        string += '<li><a href="/explore/mapper/' + m.get('id') + '">' + '<img class="rtUserImage" width="25" height="25" src="' + m.get('image') + '" />' + m.get('name')
        if (isCreator) string += ' (creator)'
        string += '</a>'
        if (activeMapperIsCreator && !isCreator) string += '<span class="removeCollaborator" data-id="' + m.get('id') + '"></span>'
        string += '</li>'
      })

      string += '</ul>'

      if (activeMapperIsCreator) {
        string += '<div class="collabSearchField"><span class="addCollab"></span><input class="collaboratorSearchField" placeholder="Add a collaborator"></input></div>'
      }
      return string
    },
    updateNumbers: function() {
      if (!map.Active.Map) return

      const self = toExport

      var relevantPeople = map.Active.Map.get('permission') === 'commons' ? map.DataModel.Mappers : map.DataModel.Collaborators

      let contributorsClass = ''
      if (relevantPeople.length === 2) {
        contributorsClass = 'multiple mTwo'
      } else if (relevantPeople.length > 2) {
        contributorsClass = 'multiple'
      }

      let contributorsImage = self.userImageUrl
      if (relevantPeople.length > 0) {
        // get the first contributor and use their image
        contributorsImage = relevantPeople.models[0].get('image')
      }
      $('.mapContributors img').attr('src', contributorsImage).removeClass('multiple mTwo').addClass(contributorsClass)
      $('.mapContributors span').text(relevantPeople.length)
      $('.mapContributors .tip').html(self.createContributorList())
      self.addTypeahead()
      $('.mapContributors .tip').unbind().click(function(event) {
        event.stopPropagation()
      })
      $('.mapTopics').text(map.DataModel.Topics.length)
      $('.mapSynapses').text(map.DataModel.Synapses.length)

      $('.mapEditedAt').html('<span>Last edited: </span>' + Util.nowDateFormatted())
    },
    onPermissionClick: function(event) {
      var self = toExport

      if (!self.selectingPermission) {
        self.selectingPermission = true
        $(this).addClass('minimize') // this line flips the drop down arrow to a pull up arrow
        if ($(this).hasClass('commons')) {
          $(this).append('<ul class="permissionSelect"><li class="public"></li><li class="private"></li></ul>')
        } else if ($(this).hasClass('public')) {
          $(this).append('<ul class="permissionSelect"><li class="commons"></li><li class="private"></li></ul>')
        } else if ($(this).hasClass('private')) {
          $(this).append('<ul class="permissionSelect"><li class="commons"></li><li class="public"></li></ul>')
        }
        $('.mapPermission .permissionSelect li').click(self.selectPermission)
        event.stopPropagation()
      }
    },
    hidePermissionSelect: function() {
      var self = toExport

      self.selectingPermission = false
      $('.mapPermission').removeClass('minimize') // this line flips the pull up arrow to a drop down arrow
      $('.mapPermission .permissionSelect').remove()
    },
    selectPermission: function(event) {
      var self = toExport

      self.selectingPermission = false
      var permission = $(this).attr('class')
      map.Active.Map.save({
        permission: permission
      })
      map.Active.Map.updateMapWrapper()
      const shareable = permission === 'private' ? '' : 'shareable'
      $('.mapPermission').removeClass('commons public private minimize').addClass(permission)
      $('.mapPermission .permissionSelect').remove()
      $('.maptoExport').removeClass('shareable').addClass(shareable)
      event.stopPropagation()
    },
    deleteActiveMap: function() {
      var confirmString = 'Are you sure you want to delete this map? '
      confirmString += 'This action is irreversible. It will not delete the topics and synapses on the map.'

      var doIt = window.confirm(confirmString)
      var m = map.Active.Map
      var mapper = map.Active.Mapper
      var authorized = map.authorizePermissionChange(mapper)

      if (doIt && authorized) {
        toExport.close()
        DataModel.Maps.map.Active.remove(m)
        DataModel.Maps.Featured.remove(m)
        DataModel.Maps.Mine.remove(m)
        DataModel.Maps.Shared.remove(m)
        m.destroy()
        browserHistory.push('/')
        GlobalUI.notifyUser('Map eliminated')
      } else if (!authorized) {
        window.alert("Hey now. We can't just go around willy nilly deleting other people's maps now can we? Run off and find something constructive to do, eh?")
      }
    }
  }
  return toExport
}

export default InfoBox
