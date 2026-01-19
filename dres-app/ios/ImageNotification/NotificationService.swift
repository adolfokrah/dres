//
//  NotificationService.swift
//  ImageNotification
//
//  Created by Adolphus Okrah on 19.01.26.
//

import UserNotifications

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // Check for image URL in various locations
        var imageUrlString: String?

        // FCM sends image URL in fcm_options
        if let fcmOptions = request.content.userInfo["fcm_options"] as? [String: Any],
           let image = fcmOptions["image"] as? String {
            imageUrlString = image
        }

        // Check top-level imageUrl (FCM flattens data payload to top level)
        if imageUrlString == nil,
           let image = request.content.userInfo["imageUrl"] as? String {
            imageUrlString = image
        }

        // Check gcm.notification.image (legacy format)
        if imageUrlString == nil,
           let image = request.content.userInfo["gcm.notification.image"] as? String {
            imageUrlString = image
        }

        guard let imageUrlStr = imageUrlString,
              let imageUrl = URL(string: imageUrlStr) else {
            contentHandler(bestAttemptContent)
            return
        }

        // Download the image
        downloadImage(from: imageUrl) { attachment in
            if let attachment = attachment {
                bestAttemptContent.attachments = [attachment]
            }
            contentHandler(bestAttemptContent)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }

    private func downloadImage(from url: URL, completion: @escaping (UNNotificationAttachment?) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { (downloadedUrl, response, error) in
            guard let downloadedUrl = downloadedUrl, error == nil else {
                completion(nil)
                return
            }

            // Determine file extension from URL or response
            var fileExtension = url.pathExtension
            if fileExtension.isEmpty {
                if let mimeType = response?.mimeType {
                    switch mimeType {
                    case "image/jpeg":
                        fileExtension = "jpg"
                    case "image/png":
                        fileExtension = "png"
                    case "image/gif":
                        fileExtension = "gif"
                    default:
                        fileExtension = "jpg"
                    }
                } else {
                    fileExtension = "jpg"
                }
            }

            // Create a unique file name
            let fileName = ProcessInfo.processInfo.globallyUniqueString + "." + fileExtension
            let tempUrl = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(fileName)

            do {
                try FileManager.default.moveItem(at: downloadedUrl, to: tempUrl)
                let attachment = try UNNotificationAttachment(identifier: "image", url: tempUrl, options: nil)
                completion(attachment)
            } catch {
                completion(nil)
            }
        }
        task.resume()
    }
}
