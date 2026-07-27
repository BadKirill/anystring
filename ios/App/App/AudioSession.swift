import Capacitor
import Foundation

/// Legacy Capacitor seam. Web Audio under the silent switch is controlled from
/// JS via `navigator.audioSession.type` — touching the app AVAudioSession from
/// native interrupts WKWebView and can silence tones (iOS 26).
@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioSessionPlugin"
    public let jsName = "AudioSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "activate", returnType: CAPPluginReturnPromise)
    ]

    @objc func activate(_ call: CAPPluginCall) {
        call.resolve()
    }
}
