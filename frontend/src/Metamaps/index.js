import Account from './Account'
import Active from './Map/Active'
import Admin from './Admin'
import AutoLayout from './Map/AutoLayout'
import Cable from './Map/Cable'
import Control from './Map/Control'
import Create from './Map/Create'
import DataModel from './DataModel'
import Debug from './Debug'
import Filter from './Map/Filter'
import GlobalUI, {
  ReactApp, Search, CreateMap, ImportDialog
} from './GlobalUI'
import Import from './Map/Import'
import JIT from './Map/JIT'
import Listeners from './Map/Listeners'
import Loading from './Loading'
import Map, { CheatSheet } from './Map'
import Mapper from './Mapper'
import Mouse from './Map/Mouse'
import Organize from './Map/Organize'
import PasteInput from './Map/PasteInput'
import Realtime from './Map/Realtime'
import Selected from './Map/Selected'
import Settings from './Settings'
import Synapse from './Map/Synapse'
import SynapseCard from './Map/SynapseCard'
import Topic from './Map/Topic'
import Util from './Util'
import Visualize from './Map/Visualize'

const Metamaps = window.Metamaps || {}
Metamaps.Account = Account
Metamaps.Active = Active
Metamaps.Admin = Admin
Metamaps.AutoLayout = AutoLayout
Metamaps.Cable = Cable
Metamaps.Control = Control
Metamaps.Create = Create
Metamaps.DataModel = DataModel
Metamaps.Debug = Debug
Metamaps.Filter = Filter
Metamaps.Import = Import
Metamaps.JIT = JIT
Metamaps.Listeners = Listeners
Metamaps.Loading = Loading
Metamaps.Map = Map
Metamaps.Map.CheatSheet = CheatSheet
Metamaps.Maps = {}
Metamaps.Mapper = Mapper
Metamaps.Mouse = Mouse
Metamaps.Organize = Organize
Metamaps.PasteInput = PasteInput
Metamaps.Realtime = Realtime
Metamaps.Selected = Selected
Metamaps.Settings = Settings
Metamaps.Synapse = Synapse
Metamaps.SynapseCard = SynapseCard
Metamaps.Topic = Topic
Metamaps.Util = Util
Metamaps.Views = Views
Metamaps.Visualize = Visualize

Metamaps.GlobalUI = GlobalUI
Metamaps.GlobalUI.ReactApp = ReactApp
Metamaps.GlobalUI.Search = Search
Metamaps.GlobalUI.CreateMap = CreateMap
Metamaps.GlobalUI.ImportDialog = ImportDialog

document.addEventListener('DOMContentLoaded', function() {
  // initialize all the modules
  for (const prop in Metamaps) {
    // this runs the init function within each sub-object on the Metamaps one
    if (Metamaps.hasOwnProperty(prop) &&
      Metamaps[prop] != null &&
      Metamaps[prop].hasOwnProperty('init') &&
      typeof (Metamaps[prop].init) === 'function'
    ) {
      console.log(prop)
      Metamaps[prop].init(Metamaps.ServerData)
    }
  }
})

export default Metamaps
