import Capacitor
import UIKit

extension Notification.Name {
    static let tunerLayoutDidChange = Notification.Name("tunerLayoutDidChange")
}

/// Landscape is offered only when the window is regular-width (Duo inner display).
/// Compact windows, including every current iPhone in portrait, stay portrait.
class TunerBridgeViewController: CAPBridgeViewController {
    override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
        if traitCollection.horizontalSizeClass == .regular {
            return .allButUpsideDown
        }
        return .portrait
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        pinWebViewToControllerBounds()
        NotificationCenter.default.post(name: .tunerLayoutDidChange, object: self)
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        guard traitCollection.horizontalSizeClass != previousTraitCollection?.horizontalSizeClass else {
            return
        }
        if #available(iOS 16.0, *) {
            setNeedsUpdateOfSupportedInterfaceOrientations()
        }
    }

    /// Capacitor installs the web view as the controller view, so it tracks the
    /// scene bounds. If a future bridge nests the web view, keep it filling the
    /// controller instead of a size captured from UIScreen.
    private func pinWebViewToControllerBounds() {
        guard let webView, webView !== view else {
            return
        }
        webView.frame = view.bounds
    }
}
