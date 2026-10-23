import Capacitor
import UIKit

/// Reads iOS 27 reserved regions when the SDK provides them, and reports none otherwise.
/// The selector is resolved at runtime so this file still compiles with the iOS 26 SDK.
enum ReservedRegionReader {
    static func regions(in view: UIView) -> [[String: Any]] {
        let selector = NSSelectorFromString("reservedRegionsWithKind:options:")
        guard view.responds(to: selector) else {
            return []
        }
        guard let raw = view.perform(selector, with: NSNumber(value: 0), with: NSNumber(value: 0)) else {
            return []
        }
        return dictionaries(from: raw.takeUnretainedValue())
    }

    private static func dictionaries(from value: AnyObject) -> [[String: Any]] {
        guard let items = value as? [AnyObject] else {
            return []
        }
        return items.compactMap(dictionary)
    }

    private static func dictionary(from item: AnyObject) -> [String: Any]? {
        guard let object = item as? NSObject, let rect = rectValue(object) else {
            return nil
        }
        let active = boolValue(object, key: "isActive") ?? boolValue(object, key: "active") ?? false
        return [
            "active": active,
            "x": rect.origin.x,
            "y": rect.origin.y,
            "width": rect.size.width,
            "height": rect.size.height,
        ]
    }

    private static func boolValue(_ object: NSObject, key: String) -> Bool? {
        object.value(forKey: key) as? Bool
    }

    private static func rectValue(_ object: NSObject) -> CGRect? {
        guard let value = object.value(forKey: "frame") as? NSValue else {
            return nil
        }
        return value.cgRectValue
    }
}

@objc(FoldPlugin)
public class FoldPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FoldPlugin"
    public let jsName = "Fold"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
    ]

    private var layoutObserver: NSObjectProtocol?

    override public func load() {
        layoutObserver = NotificationCenter.default.addObserver(
            forName: .tunerLayoutDidChange,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.publish()
        }
    }

    deinit {
        if let layoutObserver {
            NotificationCenter.default.removeObserver(layoutObserver)
        }
    }

    @objc func read(_ call: CAPPluginCall) {
        call.resolve(payload())
    }

    private func publish() {
        guard bridge != nil else {
            return
        }
        notifyListeners("change", data: payload())
    }

    private func payload() -> [String: Any] {
        guard let view = bridge?.viewController?.view else {
            return ["regions": []]
        }
        return ["regions": ReservedRegionReader.regions(in: view)]
    }
}
