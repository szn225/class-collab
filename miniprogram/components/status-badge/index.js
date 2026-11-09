Component({
  properties: { status: String, label: String },
  methods: {
    activate() {
      this.triggerEvent('action')
    },
  },
})
