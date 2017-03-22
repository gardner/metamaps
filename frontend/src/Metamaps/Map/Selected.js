const Selected = () => {
  const toExport = {
    reset: function() {
      var self = toExport
      self.Nodes = []
      self.Edges = []
    },
    Nodes: [],
    Edges: []
  }
  return toExport
}

export default Selected
