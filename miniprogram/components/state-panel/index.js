Component({
  properties: { title: String, description: String, action: String },
  methods: {
    activate() {
      this.triggerEvent('action')
    },
  },
})
