import Account from './Account'
import Active from './Active'
import Admin from './Admin'
import Debug from './Debug'
import GlobalUI, {
  ReactApp, Search, CreateMap, ImportDialog
} from './GlobalUI'
import Import from './Import'
import Loading from './Loading'
import Mapper from './Mapper'
import Topic from './Topic'
import Util from './Util'

const Metamaps = window.Metamaps || {}
Metamaps.Account = Account
Metamaps.Active = Active
Metamaps.Admin = Admin
Metamaps.Debug = Debug
Metamaps.GlobalUI = GlobalUI
Metamaps.GlobalUI.ReactApp = ReactApp
Metamaps.GlobalUI.Search = Search
Metamaps.GlobalUI.CreateMap = CreateMap
Metamaps.GlobalUI.ImportDialog = ImportDialog
Metamaps.Import = Import
Metamaps.Loading = Loading
Metamaps.Maps = {}
Metamaps.Mapper = Mapper
Metamaps.Topic = Topic
Metamaps.Util = Util

document.addEventListener('DOMContentLoaded', function() {
  // initialize all the modules
  for (const prop in Metamaps) {
    // this runs the init function within each sub-object on the Metamaps one
    if (Metamaps.hasOwnProperty(prop) &&
      Metamaps[prop] != null &&
      Metamaps[prop].hasOwnProperty('init') &&
      typeof (Metamaps[prop].init) === 'function'
    ) {
      Metamaps[prop].init(Metamaps.ServerData)
    }
  }
})

export default Metamaps
