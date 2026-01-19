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

        // Log all userInfo for debugging
        NSLog("[ImageNotification] Received notification with userInfo: \(request.content.userInfo)")

        // Check for image URL in various locations
        var imageUrlString: String?

        // FCM sends image URL in fcm_options
        if let fcmOptions = request.content.userInfo["fcm_options"] as? [String: Any],
           let image = fcmOptions["image"] as? String {
            imageUrlString = image
            NSLog("[ImageNotification] Found image in fcm_options: \(image)")
        }

        // Check top-level imageUrl (FCM flattens data payload to top level)
        if imageUrlString == nil,
           let image = request.content.userInfo["imageUrl"] as? String {
            imageUrlString = image
            NSLog("[ImageNotification] Found image in top-level imageUrl: \(image)")
        }

        // Check gcm.notification.image (legacy format)
        if imageUrlString == nil,
           let image = request.content.userInfo["gcm.notification.image"] as? String {
            imageUrlString = image
            NSLog("[ImageNotification] Found image in gcm.notification.image: \(image)")
        }

        guard let imageUrlStr = imageUrlString,
              let imageUrl = URL(string: imageUrlStr) else {
            NSLog("[ImageNotification] No valid image URL found, delivering without image")
            contentHandler(bestAttemptContent)
            return
        }

        NSLog("[ImageNotification] Downloading image from: \(imageUrlStr)")

        // Download the image
        downloadImage(from: imageUrl) { attachment in
            if let attachment = attachment {
                NSLog("[ImageNotification] Successfully attached image")
                bestAttemptContent.attachments = [attachment]
            } else {
                NSLog("[ImageNotification] Failed to create attachment")
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
        NSLog("[ImageNotification] Starting download from: \(url.absoluteString)")
        
        let task = URLSession.shared.downloadTask(with: url) { (downloadedUrl, response, error) in
            if let error = error {
                NSLog("[ImageNotification] Download error: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let downloadedUrl = downloadedUrl else {
                NSLog("[ImageNotification] No downloaded URL")
                completion(nil)
                return
            }
            
            if let httpResponse = response as? HTTPURLResponse {
                NSLog("[ImageNotification] HTTP status: \(httpResponse.statusCode)")
                if httpResponse.statusCode != 200 {
                    NSLog("[ImageNotification] Non-200 status code")
                    completion(nil)
                    return
                }
            }

            // Determine file extension from URL or response
            var fileExtension = url.pathExtension
            if fileExtension.isEmpty {
                if let mimeType = response?.mimeType {
                    NSLog("[ImageNotification] MIME type: \(mimeType)")
                    switch mimeType {
                    case "image/jpeg":
                        fileExtension = "jpg"
                    case "image/png":
                        fileExtension = "png"
                    case "image/gif":
                        fileExtension = "gif"
                    case "image/webp":
                        fileExtension = "webp"
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
                NSLog("[ImageNotification] Moved file to: \(tempUrl.path)")
                let attachment = try UNNotificationAttachment(identifier: "image", url: tempUrl, options: nil)
                NSLog("[ImageNotification] Created attachment successfully")
                completion(attachment)
            } catch {
                NSLog("[ImageNotification] Error creating attachment: \(error.localizedDescription)")
                completion(nil)
            }
        }
        task.resume()
    }
}
