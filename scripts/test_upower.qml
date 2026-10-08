import QtQuick
import Quickshell
import Quickshell.Services.UPower

Scope {
  Timer {
    interval: 800
    running: true
    repeat: false
    onTriggered: {
      console.log("After 800ms:")
      console.log("displayDevice:", UPower.displayDevice)
      if (UPower.displayDevice) {
        console.log("isPresent:", UPower.displayDevice.isPresent)
        console.log("percentage:", UPower.displayDevice.percentage)
        console.log("state:", UPower.displayDevice.state)
      }
      console.log("devices count:", UPower.devices.values.length)
      for (var i = 0; i < UPower.devices.values.length; i++) {
        var d = UPower.devices.values[i]
        console.log("device", i, "type:", d.type, "model:", d.model, "present:", d.isPresent, "pct:", d.percentage)
      }
      Quickshell.process.exit(0)
    }
  }
}
