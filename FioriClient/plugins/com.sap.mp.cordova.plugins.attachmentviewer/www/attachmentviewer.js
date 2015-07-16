     var setupAttachmentViewer = function() {
        var original_window_open = window.open;
        if (device.platform == 'Android' || device.platform[0] === 'i') {
            // Override window.open to use InAppBrowser by default.
            window.open = function(strUrl, strWindowName, strWindowFeatures) {
                // open it in the InAppBrowser
				var originalWindowNameEmpty = false;
                if (!strWindowName || strWindowName === '') {
                    // If the target isn't specified, use _blank so that InAppBrowser is shown.
                    strWindowName = '_blank';
					originalWindowNameEmpty = true;
                }
               
                if (device.platform == 'Android'){
                    if (!strWindowFeatures || strWindowFeatures === '') {
                        // Use these as default options.
                        console.log("setting window features.");
                        strWindowFeatures = 'location=no,toolbar=no';
                    }
                }
                else if (device.platform[0] === 'i'){
                    if (!strWindowFeatures || strWindowFeatures === '') {
                        // Use these as default options.
                        strWindowFeatures = 'location=no,EnableViewPortScale=yes';
                    }
                    // Percent escape spaces.
                    strUrl = strUrl.replace(/ /g, '%20');
                }

                if (platform === 'android' && strUrl.toLowerCase().indexOf("https://") == 0) {
                    if (sap.AuthProxy.isRedirectingRequestsSync()) {
                        // Make sure we are not opening an https url if AuthProxy is intercepting reqeusts.
                        // Http will allow AuthProxy to intercept the request and AuthProxy will switch it
                        // to https before sending it over the network.
                        strUrl = "http" + strUrl.substring(5);
                        if (!sap.AuthProxy.isHttpsConversionHost(strUrl)) {
                            sap.AuthProxy.addHTTPSConversionHost(function(){},function(){},strUrl);
                        }
                    }
                }
                var windowRef = original_window_open(strUrl, strWindowName, strWindowFeatures);
               
                if (device.platform == 'Android' && originalWindowNameEmpty){
                    windowRef.addEventListener('backbutton', function(){
                        windowRef.close();
                    });
                }
                return windowRef;
            };
        }
        
        var platform = cordova.require("cordova/platform").id;
        if (platform === 'ios' || platform === 'android')
        {
            document.addEventListener('click',function(e){
                e = e ||  window.event;
                var element = e.target || e.srcElement;
                if (element.href) {
                    // If a link of some sort has been clicked on Android, check to make sure it uses HTTP if it is an HTTPSConverionHost.
                    // Note that this method of checking the https conversion host list only works as long as the fiori attachments
                    // have the same host as the fiori server.  So far this is the case, but it is a potential concern for the future.
                    if (platform === 'android' && element.href.toLowerCase().indexOf("https://") == 0 && sap.AuthProxy.isHttpsConversionHost(element.href)) {
                        // Switch the href to http (native side will switch back to https)
                        element.href = "http" + element.href.substring(5);
                        // Stop this event, but click the element again so the event will trigger with the proper href value.
                        e.preventDefault();
                        e.stopPropagation();
                        element.click();
                    } else {
                       if (element.tagName == 'A' && (element.href.indexOf("http") === 0 || element.href.indexOf("https") === 0) && element.target == "_blank")
                        {
                            e.preventDefault();
                            var handleWnd = window.open(element.href, element.target);
                            var iabErrorHandle = function(event) {
                                handleWnd.close(event);
                                var i18n = require('com.sap.mp.cordova.plugins.i18n.i18n');
                                i18n.load({
                                    path: "plugins/com.sap.mp.cordova.plugins.attachmentviewer/www"
                                },
                                function(bundle){
                                          
                                    navigator.notification.alert(bundle.get("attachment_open_failed"), function(){}, bundle.get("attachment_viewer_page"), bundle.get("close"));
                                });
                                
                                      
                            }
                            var iabCloseHandle = function(event) {
                                handleWnd.removeEventListener('loaderror', iabErrorHandle);
                                      handleWnd.removeEventListener('exit', iabCloseHandle );
                            }
                                      
                                      
                            handleWnd.addEventListener('loaderror', iabErrorHandle);
                            handleWnd.addEventListener('exit', iabCloseHandle );

                        }
                    }
                }
            });
        }
    }

    document.addEventListener("deviceready",setupAttachmentViewer,false);
