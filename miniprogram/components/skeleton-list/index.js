Component({
  properties: { count: { type: Number, value: 3 } },
  methods: {
    activate() {
      this.triggerEvent('action')
    },
  },
})
