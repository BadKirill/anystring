import AVFoundation
import Capacitor
import Foundation

/// Keeps Anystring audible when the ring/silent switch is set to silent.
///
/// WKWebView runs in a separate process with its *own* audio session, so this
/// native category alone does not unmute Web Audio. The web layer also sets
/// `navigator.audioSession.type` and holds a muted silent `<audio>` element.
/// This plugin is a best-effort hint for any non-WebKit audio path.
enum AudioSessionConfigurator {
    /// True while WebKit captures the microphone.
    private static var capturing = false

    static func activate(capturing shouldCapture: Bool) {
        capturing = shouldCapture
        apply()
    }

    /// Re-arms the session after the app returns to the foreground.
    static func reactivate() {
        apply()
    }

    private static func apply() {
        // A capturing WebKit owns a play-and-record session, which already
        // ignores the silent switch; re-categorising it can drop the microphone.
        guard !capturing else {
            return
        }
        let session = AVAudioSession.sharedInstance()
        do {
            // Mixing leaves a backing track playing while the user picks notes.
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            CAPLog.print("Anystring: audio session unavailable:", error.localizedDescription)
        }
    }
}

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioSessionPlugin"
    public let jsName = "AudioSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "activate", returnType: CAPPluginReturnPromise)
    ]

    @objc func activate(_ call: CAPPluginCall) {
        AudioSessionConfigurator.activate(capturing: call.getString("mode") == "capture")
        call.resolve()
    }
}
