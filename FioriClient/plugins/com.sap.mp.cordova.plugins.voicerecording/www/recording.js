var exec = require("cordova/exec");
/**
 * @namespace sap.VoiceRecording
 */

/**
 * This type represents a recording of the current user of the enclosing {@link sap.VoiceRecording Recording} object.
 * An instance of this type can be obtained using the {@link sap.VoiceRecording.Recording#audioCapture audioCapture} function.
 * Until an instance of this type is in the memory, the encrypted file available to decrypt through this instance.
 * After e.g. stopping the application the encrypted file will remain in the filesystem. We recommend to call the Recording.destroy method before stopping the app.
 *
 * @constructor
 * @alias sap.VoiceRecording.Recording
 * @interface
 */
function Recording(encryptedFilePath, encryptionKey) {

    /**
     * Create a decrypted file from the encrypted file.
     *
     * @param {sap.VoiceRecording.Recording.GetAsFileSuccessCallback} successCallback Callback method upon success. Invoked with the decrypted file path.
     * @param {sap.VoiceRecording.Recording.GetAsFileErrorCallback} errorCallback Callback method upon failure.
     * @alias sap.VoiceRecording.Recording#getAsFile
     */
    this.getAsFile = function(successCallback, errorCallback) {
        var store = new sap.EncryptedStorage("storeName");
        store.decryptFile(
            encryptedFilePath,
            encryptionKey,
            function(decryptedFilePath) {
                console.log('decrypted file path: ' + decryptedFilePath);
                successCallback(decryptedFilePath);
            },
            function(_error) {
                var error = encryptedStorageError(_error);
                console.log("An error occurred at decryptFile: " + JSON.stringify(error));
                errorCallback(error);
            }
        );
    };

    /**
     * Deletes the file on encryptedFilePath.
     *
     * @param {sap.VoiceRecording.Recording.DestroySuccessCallback} [successCallback] Callback method upon success. Invoked with the FileEntry of the remove method.
     * @param {sap.VoiceRecording.Recording.DestroyErrorCallback} [errorCallback] Callback method upon failure.
     * @alias sap.VoiceRecording.Recording#destroy
     */
    this.destroy = function(successCallback, errorCallback) {
        deleteFile(encryptedFilePath, successCallback, errorCallback);
    };
}

/**
 * A new native audio recorder application appears. The user can start the recording with the red record button.
 * <h5>Prerequisites:</h5>
 * <ol>
 * <li>In the global scope, the audioCapture function is not available until after the deviceready event.</li>
 * </ol>
 * <h5>Usage:</h5>
 * <pre>
 * document.addEventListener(
 *     "deviceready",
 *     function() {
 *         sap.VoiceRecording.audioCapture(successCallback, errorCallback);
 *     },
 *     false
 *  );
 * </pre>
 *
 * Android specific part:
 * On nexus devices there are no preinstalled recording application. In this case the user will get an error message before the recording starts.
 * After that the user should install a third party recording application from the store. However most of the application will not work.
 * The reason is cordova media plugin is looking for an application which can hanlde a specific intent. (MediaStore.Audio.Media.RECORD_SOUND_ACTION)
 *
 * <h5>Media-Capture errors by error.code</h5>
 * <ul>
 * <li>CaptureError.CAPTURE_INTERNAL_ERR: The camera or microphone failed to capture image or sound.</li>
 * <li>CaptureError.CAPTURE_APPLICATION_BUSY: The camera or audio capture application is currently serving another capture request.</li>
 * <li>CaptureError.CAPTURE_INVALID_ARGUMENT: Invalid use of the API (e.g., the value of limit is less than one).</li>
 * <li>CaptureError.CAPTURE_NO_MEDIA_FILES: The user exits the camera or audio capture application before capturing anything.</li>
 * <li>CaptureError.CAPTURE_NOT_SUPPORTED: The requested capture operation is not supported.</li>
 * </ul>
 *
 * <h5>File errors by error.code</h5>
 * <ol>
 * <li>NOT_FOUND_ERR</li>
 * <li>SECURITY_ERR</li>
 * <li>ABORT_ERR</li>
 * <li>NOT_READABLE_ERR</li>
 * <li>ENCODING_ERR</li>
 * <li>NO_MODIFICATION_ALLOWED_ERR</li>
 * <li>INVALID_STATE_ERR</li>
 * <li>SYNTAX_ERR</li>
 * <li>INVALID_MODIFICATION_ERR</li>
 * <li>QUOTA_EXCEEDED_ERR</li>
 * <li>TYPE_MISMATCH_ERR</li>
 * <li>PATH_EXISTS_ERR</li>
 * </ol>
 *
 * <h5>Encrypted Storage errors by the returned number</h5>
 * <ol>
 * <li>JSON error</li>
 * <li>Bad password error</li>
 * <li>Greater than maxium size error</li>
 * <li>Datavault locked error</li>
 * <li>Database error</li>
 * <li>Datavault access error</li>
 * <li>File does not exists at path error</li>
 * <li>Write to file failed error</li>
 * </ol>
 *
 * @param {sap.VoiceRecording.Recording.AudioCaptureSuccessCallback} successCallback Callback method upon success. Invoked with the created Recording object.
 * @param {sap.VoiceRecording.Recording.AudioCaptureErrorCallback} errorCallback Callback method upon failure.
 * @alias sap.VoiceRecording.audioCapture
 */
var audioCapture = function(successCallback, errorCallback) {
    var rec = function() {
        var store = new sap.EncryptedStorage("storeName");
        cordova.exec(
            function(encryptionKey) {
                navigator.device.capture.captureAudio(
                    function(mediaFiles) {
                        var i, path, len;
                        for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                            path = mediaFiles[i].fullPath;
                            console.log('path: ' + path);
                        }
                        var colon = path.indexOf(":");
                        path = path.substring(colon + 1);

                        store.encryptFile(
                            path,
                            encryptionKey,
                            function(encryptedFilePath) {
                                console.log('encrypted file path: ' + encryptedFilePath);
                                deleteFile(path);
                                successCallback(new Recording(encryptedFilePath, encryptionKey));
                            },
                            function(_error) {
                                var error = encryptedStorageError(_error);
                                console.log("An error occurred at encryptFile: " + JSON.stringify(error));
                                errorCallback(error);
                            }
                        );

                    },
                    function(error) {
                        mediaCaptureError(error);
                        console.log("An error occurred at captureAudio: " + JSON.stringify(error));
                        errorCallback(error);
                    }
                );
            },
            function(error) {
                console.log("An error occurred at getEncryptionKeyAsString: " + JSON.stringify(error));
                errorCallback(error);
            },
            "VoiceRecording", "getEncryptionKeyAsString", []
        );
    };

    if (device.platform.toLowerCase() == "android") {
        var checkApps = function(successCallback, errorCallback) {
            cordova.exec(rec, function(error) {
                console.log("An error occurred while checking installed recording apps: " + JSON.stringify(error));
                errorCallback(error);
            }, "VoiceRecording", "isAppAvailable", []);
        };
        checkApps(successCallback, errorCallback);
    } else {
        rec();
    }
};

module.exports = {
    audioCapture: audioCapture
};

var deleteFile = function(path, successCallback, errorCallback) {
    var url = "file://" + path;
    window.resolveLocalFileSystemURL(
        url,
        function(fileEntry) {
            fileEntry.remove(
                function success(fileEntry) {
                    if (successCallback) {
                        successCallback(fileEntry);
                    }
                },
                function fail(error) {
                    fileError(error);
                    console.log("An error occurred at FileEntry.remove: " + JSON.stringify(error));
                    if (errorCallback) {
                        errorCallback(error);
                    }
                }
            );
        },
        function(error) {
            fileError(error);
            console.log("An error occurred at resolveLocalFileSystemURI: " + JSON.stringify(error));
            if (errorCallback) {
                errorCallback(error);
            }
        }
    );
};

var mediaCaptureError = function(error) {
    switch (error.code) {
        case CaptureError.CAPTURE_INTERNAL_ERR:
            error.message = "The camera or microphone failed to capture image or sound.";
            break;
        case CaptureError.CAPTURE_APPLICATION_BUSY:
            error.message = "The camera or audio capture application is currently serving another capture request.";
            break;
        case CaptureError.CAPTURE_INVALID_ARGUMENT:
            error.message = "Invalid use of the API (e.g., the value of limit is less than one).";
            break;
        case CaptureError.CAPTURE_NO_MEDIA_FILES:
            error.message = "The user exits the camera or audio capture application before capturing anything.";
            break;
        case CaptureError.CAPTURE_NOT_SUPPORTED:
            error.message = "The requested capture operation is not supported.";
            break;
        default:
            error.message = "Unknown error";
    }
};

var fileError = function(error) {
    switch (error.code) {
        case 1:
            error.message = "NOT_FOUND_ERR";
            break;
        case 2:
            error.message = "SECURITY_ERR";
            break;
        case 3:
            error.message = "ABORT_ERR";
            break;
        case 4:
            error.message = "NOT_READABLE_ERR";
            break;
        case 5:
            error.message = "ENCODING_ERR";
            break;
        case 6:
            error.message = "NO_MODIFICATION_ALLOWED_ERR";
            break;
        case 7:
            error.message = "INVALID_STATE_ERR";
            break;
        case 8:
            error.message = "SYNTAX_ERR";
            break;
        case 9:
            error.message = "INVALID_MODIFICATION_ERR";
            break;
        case 10:
            error.message = "QUOTA_EXCEEDED_ERR";
            break;
        case 11:
            error.message = "TYPE_MISMATCH_ERR";
            break;
        case 12:
            error.message = "PATH_EXISTS_ERR";
            break;
        default:
            error.message = "Unknown error";
    }
};

var encryptedStorageError = function(_error) {
    var error = new Error();
    error.code = _error;
    switch (error.code) {
        case 1:
            error.message = "JSON error";
            break;
        case 2:
            error.message = "Bad password error";
            break;
        case 3:
            error.message = "Greater than maxium size error";
            break;
        case 4:
            error.message = "Datavault locked error";
            break;
        case 5:
            error.message = "Database error";
            break;
        case 6:
            error.message = "Datavault access error";
            break;
        case 7:
            error.message = "File does not exists at path error";
            break;
        case 8:
            error.message = "Write to file failed error";
            break;
        default:
            error.message = "Unknown error";
    }
    return error;
};

//
// Callback definitions.
//

/**
 * Callback invoked to inform the user about the audio capture process.
 *
 * @callback sap.VoiceRecording.AudioCaptureSuccessCallback
 * @param {sap.VoiceRecording.Recording} The Recording object itself.
 */

/**
 * Callback invoked to inform the user about the audio capture process.
 *
 * @callback sap.VoiceRecording.AudioCaptureErrorCallback
 * @param {string} The error message.
 */

/**
 * Callback invoked to inform the user about the decryption process.
 *
 * @callback sap.VoiceRecording.GetAsFileSuccessCallback
 * @param {string} The path of the decrypted file.
 */

/**
 * Callback invoked to inform the user about the decryption process.
 *
 * @callback sap.VoiceRecording.GetAsFileErrorCallback
 * @param {string} The error message.
 */
