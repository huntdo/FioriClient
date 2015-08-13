cordova.define("com.sap.mp.cordova.plugins.fioriclient.FioriClient", function(require, exports, module) { /*jslint browser:true*/
/*global sap*/
/*global $*/
/*global cordova*/
/*global device*/
/*global module*/
/*global require*/
/*global console*/

/** @namespace sap */

/**
 * The FioriClient plugin leverages the Cordova infrastructure
 * to add logic that is needed by the Fiori Client application
 * whenever a page load event occurs. This allows the app to initialize,
 * tweak and enhance the behavior of the web view and existing plugins
 * to create a more rich user experience consistent with the original
 * native implementations of the Fiori Client.
 * <br/> <br/> This plugin encapsulates the Fiori Client logic, including
 * responding to changes in application settings and initializing the toolbar.
 * It's only meant to be used in the context of the Fiori Client application,
 * which is further explained <a href="https://wiki.wdf.sap.corp/wiki/display/SMP30/Kapsel+Scripts+for+Creating+the+SAP+Fiori+Client">Here</a>.
 * It should therefore only be added via the create_fiori_client
 * Node.js script, which is also included in the Kapsel SDK.
 *
 * @namespace
 * @alias FioriClient
 * @memberof sap
 */

    /// Bundle used to store localized strings. This is loaded when the deviceready event occurs.
    var bundle = null;
    /// Text used to indicate that the Fiori URL has been changed.
    var fioriURLChangedText = null;
    /// Text used to indicate that the page is loading.
    var loadingThePageText = null;


    var context = {};

    var httpsConversionInEffect = false;

    // This function will convert a url from https to http if necessary.
    // It is only necessary on Android if AuthProxy is intercepting requests.
    // In that case AuthProxy will convert the requests to HTTPS before sending.
    // The callback function will be called with the (possibly) modified url.
    var doHttpsConversionIfNeeded = function(url, callback) {
        if (device.platform.toLowerCase().indexOf("android") >= 0) {
            sap.AuthProxy.isInterceptingRequests(function(isInterceptingRequests){
                if (isInterceptingRequests && url.toLowerCase().indexOf("https") == 0) {
                    // Since AuthProxy is intercepting the request, make sure it is sent initially with http.
                    // When AuthProxy sends the request over the network, it will be converted to https
                    // (since we are calling the addHTTPSConversionHost function with the fiori URL).
                    var splitArray = url.split('://');
                    splitArray.shift();
                    url = "http://" + splitArray.join('://');
                    httpsConversionInEffect = true;
                    // Save the fact that httpsConversion is in effect so we know next time the app starts.
                    sap.AppPreferences.setPreferenceValue('httpsConversionInEffect', true, function(){}, function(){});
                    sap.AuthProxy.addHTTPSConversionHost(function(){callback(url)}, function(){callback(url)}, url);
                } else {
                    httpsConversionInEffect = false;
                    // Save the fact that httpsConversion is not in effect so we know next time the app starts.
                    sap.AppPreferences.setPreferenceValue('httpsConversionInEffect', false, function(){}, function(){});
                    callback(url);
                }
            })
        } else {
            callback(url);
        }
    }
    
    //the only parameters supported are appID, fioriUrlIsSMP, authtype, and afaria.
    //in the current version, "afaria" as a parameter is not supported
    //sample:
    //https://torn00461340a.amer.global.corp.sap:8081/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html?sap-client=100&sap-language=EN&appid=fiori&fioriURLIsSMP=true
    var handleFioriUrlWithFakeParameter = function(url) {
        var vars = [], hash;
        var config = {};
        var fakeParamCount = 0;
        var questionMarkIndex = url.indexOf('?');
        if (questionMarkIndex > 0){                               
            var hashes = url.slice(questionMarkIndex + 1).split('&');
            for (var i = hashes.length-1; i >=0; i--) {
                hash = hashes[i].split('=');
                if (hash[0]){
                    if (hash[0].toLowerCase() == "appid"){
                        config.appID = hash[1];
                        fakeParamCount++;
                    }
                    else if (hash[0].toLowerCase() == "fioriurlissmp"){
                        config.fioriURLIsSMP = (hash[1].toLowerCase() === "true");
                        fakeParamCount++;
                    }
                    else if (hash[0].toLowerCase() == "certificate"){
                        config.certificate = hash[1];
                        fakeParamCount++;
                    }
                    else if (hash[0].toLowerCase() == "authtype"){
                        //for current version only a single authtype element is supported and
                        //only SAML auth type is tested
                        config.auth = [];
                        var authElement = {};
                        authElement.type = hash[1];
                        config.auth.push(authElement);
                        fakeParamCount++;
                    }
                    else{
                        break;
                    }
                }
                else{
                    //when getting the first no fake parameter, exit the loop
                    break;    
                }
            }
            
            console.log("Number of fake parameter found in fioriUrl: " + fakeParamCount);

            //reassembly the fiori url without fake parameter
            for (var j = 0; j < fakeParamCount; j++){
                hashes.pop();
            }

            if (hashes.length > 0){
                config.fioriURL = url.slice(0, questionMarkIndex) + '?' + hashes.join('&');
            }
            else{
                config.fioriURL = url.slice(0, questionMarkIndex)
            }
        }
        else{
            config.fioriURL = url;
        }
        return config;
    }
    
    var onSubmitScreen = function(context, screenContext, onGetConfigData, showScreen, showNotification){
        if (context.operation.currentScreenID == "enterFioriConfiguration"){
            if (screenContext.cancelled) {
                context.operation.currentScreenState = "show";
                context.operation.currentScreenID = "chooseDemoMode";
                showScreen(context, screenContext);
                return;
            }

            var fioriConfig = {};
            if (screenContext.fioriConfiguration){
                screenContext.fioriConfiguration = screenContext.fioriConfiguration.trim();
            }
            
            var checkRequiredConfiguration = function (fioriConfig) {
                var requiredConfigValues = ['appID', 'fioriURL', 'fioriURLIsSMP'];
      
                //if configuration is not complete, then set state to done and let logonController move
                //to next config source type
                for(var i=0; i<requiredConfigValues.length; i++){
                    var value = requiredConfigValues[i];
                    if ( (fioriConfig[value] === undefined || fioriConfig[value] === '') &&
                        (context.appConfig[value] === undefined || context.appConfig[value] === '')) {
                        screenContext.valueStateText = "Missing configuration for '" + value +"', please try again";
                        context.operation.currentScreenState = "show";
                        showScreen(context, screenContext);
                        return false;
                    }
                }

                //merge the screen context to appConfig
                parseAppConfig(onGetConfigData, fioriConfig, context);
                return true;
            };
            
            //if user input a string starts with '{', then it means this is a json string for ugly url, instead of a real url
            //or email
            if (screenContext.fioriConfiguration[0] != '{'){
                //if user inputs an email, then switch the configuration source type to "mobileplace"
                if ( isEmail(screenContext.fioriConfiguration)){
                    context.operation.currentScreenState = "done";
                    context.operation.currentConfigState = "begin";
                    context.operation.data = screenContext.fioriConfiguration;
                    context.operation.currentConfigType = "mobilePlace";
                    onGetConfigData(context);
                    return;
                }
                else if (!isUrl(screenContext.fioriConfiguration)){
                    displayErrorBox(bundle.get("invalid_fiori_url_message"));
                    return;
                }
                else{
                    //the fiori url may contain fake parameter for appid and isforsmp, if so, set the parameter value to 
                    //context.operation, and then remove the fake parameter from the url, as server may not reject the url
                    //with unknown parameters
                    fioriConfig = handleFioriUrlWithFakeParameter(screenContext.fioriConfiguration);
                    fioriConfig.urlWithFakeParameters = screenContext.fioriConfiguration;
                     
                    if (!isWindows()){ 
                    // checking URL reachability
                    sap.AuthProxy.sendRequest2("HEAD", fioriConfig.fioriURL, { "Accept-Encoding": "identity"}, null,
                            function(result) {
                                // On android the success callback can be invoked with a 404 error, which indicates
                                // the server is not reachable.  Check for the 404.
                                if (result && result.status && result.status === 404) {
                                    console.log("fioriclient.js: Checking reachability is failed. The entered URL is not reachable. " + JSON.stringify(result));
                                    displayErrorBox(bundle.get("url_not_reachable_message"));
                                } else {
                                    checkRequiredConfiguration(fioriConfig);
                                }
                            },
                            function(e){
                                if (e && e.errorCode && (e.errorCode === sap.AuthProxy.ERR_CLIENT_CERTIFICATE_VALIDATION || e.errorCode === sap.AuthProxy.ERR_SERVER_CERTIFICATE_VALIDATION)) {
                                    // The error callback was invoked because the connect failed due to invalid
                                    // certificate.  This means that the server is reachable.
                                    checkRequiredConfiguration(fioriConfig);
                                    return;
                                }
                                //error messages for possible request errors as references
                                //{"errorCode":-1,"description":"Unknown Error. Details : Unable to resolve host \"wrongdewdfgwp00926.wdf.sap.corp\": No address associated with hostname."} 
                                //{"errorCode":-1,"description":"Unknown Error. Details : failed to connect to test.wdf.sap.corp/10.78.188.9 (port 8001): connect failed: ETIMEDOUT (Connection timed out)."} (*timeout max. 2min)
                                console.log("fioriclient.js: Checking reachability is failed. The entered URL is not reachable. " + JSON.stringify(e));
                                displayErrorBox(bundle.get("url_not_reachable_message"));
                            },
                            15, // 15 seconds, Max Timeout: 30 sec (15x2)
                            null, true );
                    }
                    else {
                        // windows net apis dont return detailed error codes making it difficult to deteremine server reachability
                        // re-evaluate in Windows 10.
                        checkRequiredConfiguration(fioriConfig);
                    }
                }
            }
            else{
                try{
                    fioriConfig = JSON.parse(screenContext.fioriConfiguration);
                    if(!checkRequiredConfiguration(fioriConfig)) return;
                }
                catch(e){
                    displayErrorBox(bundle.get("invalid_config_data_message"));
                    return;
                }
            }
             
            var displayErrorBox = function (message) {
                screenContext.valueStateText = message;
                context.operation.currentScreenState = "show";
                showScreen(context, screenContext);
            };

        } else if (context.operation.currentScreenID == "chooseDemoMode"){
            var useDemoMode = screenContext.demoMode;
            context.operation.mustWriteToAppPreferences = true;
            if (useDemoMode) {
                fioriConfig = {
                    demoMode:true,
                    appID:"fioriDemoMode",
                    fioriURL:"https://www.sapfioritrial.com",
                    fioriURLIsSMP: false
                };
                parseAppConfig(onGetConfigData, fioriConfig, context);
            } else {
                context.appConfig.demoMode = false;
                context.operation.currentScreenState = "show";
                context.operation.currentScreenID = "enterFioriConfiguration";
                showScreen(context, screenContext);
            }
        }
   };
    
   var loadConfigurationFromAppConfig = function(onSuccess, context) {
        var config =  require('fiori_client/appConfig');
        try {
            parseAppConfig(onSuccess, config, context);
        }
        catch (e) {
            sap.Logger.error(e.toString());
            sap.Logger.error('Failed to load the appConfig.js file.');
            navigator.notification.alert(e.toString(), null, 'Error');
            return;
        }
    };
    
    //this method also handles config from mobile place. In both case, the config is a json string
    var handleConfigFromMobilePlace = function(onSuccess, context){
        try {
            parseAppConfig(onSuccess, context.operation.data, context);
        }
        catch (e) {
            if (context.operation.currentConfigType == "mobilePlace"){
                context.operation.logonView.context.operation.logonView.showNotification("ERR_MOBILE_PLACE_CONFIG_INVALID");
            }
            else{
                context.operation.logonView.context.operation.logonView.showNotification("ERR_MDM_CONFIG_INVALID");
            }
            return;
        }
    }
    
    var loadSavedConfiguration = function(onSuccess, context) {
            var preferenceValuesToRead = ['appID', 'fioriURL', 'fioriURLIsSMP', 'LogLevel', 'certificate', 'demoMode', 'previous_fiori_urls', 'SwitchToProduction', 'urlWithFakeParameters'];
            if (device.platform.toLowerCase().indexOf("android") >= 0) {
                preferenceValuesToRead.push('httpsConversionInEffect');
            }
            sap.AppPreferences.getPreferenceValues(preferenceValuesToRead, function(fioriConfig) {
                if (device.platform.toLowerCase().indexOf("android") >= 0) {
                    if (fioriConfig.httpsConversionInEffect) {
                        httpsConversionInEffect = true;
                        sap.AuthProxy.addHTTPSConversionHost(function(){},function(){},fioriConfig.fioriURL);
                    }
                }
                try {
                    parseAppConfig(onSuccess, fioriConfig, context);
                }
                catch (e) {
                    sap.Logger.error(e.toString());
                    sap.Logger.error('Failed to load the appConfig.js file.');
                    navigator.notification.alert(e.toString(), null, 'Error');
                    return;
                }
            }, function() {
                   //do not have saved config
                   context.operation.currentConfigState = "done";
                   setTimeout(function(){
                       onSuccess(context);
                   }, 0)
            }
        );
    };
    
    //this method lets application delegate to handle the configuration in context.
    //if the config type is saved or appconfig.js, it is expected this method will handle it as the logic belongs to app dev
    //for other config source types, this method can decide whether skip it by changing the status from begin to done, or customize the context data, and
    //then advance the configstate to next state.
    var onGetAppConfig = function(contextParam, onSuccess, onError){
        var innerSuccess = function(context) {
            if (context && context.smpConfig) {
                if (device.platform.toLowerCase().indexOf("android") >= 0) {
                    // On Android we have to do some extra work if we are intercepting all requests.
                    sap.AuthProxy.isInterceptingRequests(function(isInterceptingRequests){
                        if (isInterceptingRequests) {
                            if (context.smpConfig.https) {
                                // Since AuthProxy is intercepting the request, make sure it is sent initially with http.
                                // When AuthProxy sends the request over the network, it will be converted to https
                                // (since we are calling the addHTTPSConversionHost function with the fiori URL).
                                context.smpConfig.https = false;
                                httpsConversionInEffect = true;
                                // Save the fact that httpsConversion is in effect so we know next time the app starts.
                                sap.AppPreferences.setPreferenceValue('httpsConversionInEffect', true, function(){}, function(){});
                                sap.AuthProxy.addHTTPSConversionHost(function(){onSuccess(context)}, function(){onSuccess(context)}, "http://" + context.smpConfig.serverHost);
                            } else {
                                // The original url was http, so don't do https conversion
                                httpsConversionInEffect = false;
                                sap.AppPreferences.setPreferenceValue('httpsConversionInEffect', false, function(){}, function(){});
                                onSuccess(context);
                            }
                        } else {
                            onSuccess(context);
                        }
                    });
                } else {
                    onSuccess(context);
                }
            } else {
                onSuccess(context);
            }
        }

        if (!context){
            context = contextParam;
        }
        
        var configType = context.operation.currentConfigType;
        if (!configType){
            configType = context.operation.configSources[context.operation.currentConfigIndex];
        }
        
        console.log("fioriClient onGetAppConfig, currentConfigIndex=" +  context.operation.currentConfigIndex + ", currentConfigType="+ configType +", currentConfigState="+ context.operation.currentConfigState );

        if (configType == "saved"){
            //if application has complete config, return state to "complete", otherwise return "done" to move to next config source
            loadSavedConfiguration(innerSuccess, context );
        }
        else if ( configType == "appConfig.js" && context.operation.currentConfigState == "run" ){
            loadConfigurationFromAppConfig(innerSuccess, context );
        }
        else if ((configType == "mobilePlace" ||
                  configType == "mdm" ) && context.operation.currentConfigState == "run"){
            handleConfigFromMobilePlace(innerSuccess, context);
        }
        else {
            if (  context.operation.currentConfigState =="begin"){
                context.operation.currentConfigState = "run";
            }
            else if (  context.operation.currentConfigState =="run"){
                context.operation.currentConfigState = "done";
            }
            setTimeout(function(){
                innerSuccess(context);
            }, 0);
        }
    };
    
    var onRegistrationError = function(error){
        logonErrorCallback(error);
    };
    
    var onRegistrationSuccess = function(result) {
        //registration succeeded, save the preference if necessary
        if (context.operation.mustWriteToAppPreferences){
                    
            sap.Logger.info('Registration was successful.', 'FIORI_CLIENT');
            if (context.appConfig.isForSMP){
                var serverHost = result.registrationContext.serverHost;
                var serverPort = result.registrationContext.serverPort?":"+result.registrationContext.serverPort:"";
                var scheme = result.registrationContext.https ? 'https' : 'http';
                if (httpsConversionInEffect) {
                    // If https conversion is in effect, then Logon would have used http to
                    // register (which AuthProxy would have converted to https).  Persist it
                    // as it was originally intended, as https.
                    scheme = "https";
                }
                // Set the hardcoded Fiori URL to be the server the application registered to
                // concatenated with the Fiori launchpad URL. This value will then be stored
                // in AppPreferences, where it will be retrieved from then on.
                context.appConfig.fioriURL = scheme + '://' + serverHost + serverPort + context.appConfig.endpointSuffix;
            }
            sap.AppPreferences.setPreferenceValues(context.appConfig,
                function(){
                    sap.Logger.info('Logon was successful.', 'FIORI_CLIENT');
                    context.smpRegContext = result;
                    context.operation.mustWriteToAppPreferences = false;
                    logonCompletedCallback();
                },
                function(e){
                    throw new Error(e);
                }
            );
        }
        else {
            sap.Logger.info('Logon was successful.', 'FIORI_CLIENT');
            context.smpRegContext = result;
            logonCompletedCallback();
        }
    };

    var logonCompletedCallback = function () {
       
        sap.AppPreferences.getPreferenceValue('skipShowFirstUseTips', function(skipShowFirstUseTips) {
            if (skipShowFirstUseTips === true) {
                // Windows does not have this variable. 
                if (isWindows() || sap.FioriClient.loadByIndexPage ){
                    setTimeout(goToFioriURL, 1000);
                }
            }
            else{
                setTimeout(showFirstUseTips, 1000);
            }
        }, function(error) {
            setTimeout(showFirstUseTips, 1000);
        });
    };
    
    // Reloads the entire application on windows
    var resetWindowsApp = function () {
        if (isWindows()) {
            fireEvent ("resetSettings"); // needs to reset the webview cookies and reload the app
            sap.Logger.debug('Reload application', 'ResetSettings');
        }
    }

    var logonErrorCallback = function(error) {
        var resetApp = function(){
            var logonCore = sap.logon.Core;
            if (isWindows()) {
                  logonCore.reset(function() {
                    resetWindowsApp();
                  },
                  function (){
                     resetWindowsApp();
                  });
              }
              else {
                  onDeviceReady();
              }
        }
        
        if (error && error.errorDomain === "MAFLogon" && (error.errorCode === "0" || error.errorCode === "1")){
            // not an error. This is a result of user cancelling sso screen or cancelling registration.
            resetApp();
        }
        else {
            // error. display an error.
            var msg = error;
            try {
                msg = JSON.stringify(error);
            }
            catch (e){
                // not json.
                msg = error;
            }
            sap.Logger.error('Logon encountered an error. Details: ' + msg, 'FIORI_CLIENT');
            navigator.notification.alert( 
                "Error processing action: " + msg, 
                function(){
                    resetApp();
                }
                , 'Error'
            );
        }
    };
    
    var retrieveAppID = function(callback) {
        var getAppIDSuccess = function(retrievedAppID) {
            //only override the appconfig's appid if retrieved appid from native side is not empty
            if (retrievedAppID != null){
               context.appConfig.appID = retrievedAppID;
            }
            callback();
        };
        var getAppIDFromAppPreferencesFailed = function(error) {
            sap.Logger.info(error, 'FIORI_CLIENT');
            // The App ID wasn't found, so the value won't be changed.
            callback();
        };
        sap.AppPreferences.getPreferenceValue('appID', getAppIDSuccess, getAppIDFromAppPreferencesFailed);
    };

    var retrieveFioriURLIsSMP = function(callback) {
        var getFioriURLIsSMPSuccess = function(retrievedFioriURLIsSMP) {
            if (retrievedFioriURLIsSMP != null) {
                context.appConfig.fioriURLIsSMP = retrievedFioriURLIsSMP;
            }
            callback();
        };
        var getFioriURLIsSMPFromAppPreferencesFailed = function(error) {
            sap.Logger.info(error, 'FIORI_CLIENT');
            // The fioriURLIsSMP flag wasn't found, so the value won't be changed.
            callback();
        };
        sap.AppPreferences.getPreferenceValue('fioriURLIsSMP', getFioriURLIsSMPSuccess, getFioriURLIsSMPFromAppPreferencesFailed);
    };
    
    var isUrl = function(url) {
        if (typeof(url) !== 'string') {
            return false;
        }
        var regexp = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
        return regexp.test(url);
    };
    
    //the email validation regex is from http://www.w3resource.com/javascript/form/email-validation.php
    var isEmail = function(emailAddress) {
        if (typeof(emailAddress) !== 'string') {
            return false;
        }
        var regexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
        return regexp.test(emailAddress);
    };
    
    var goToFioriURL = function(errorCallback) {
        sap.FioriClient.getFioriURL(function (retrievedFioriURL) {
            if (!context.smpRegContext){
                // If sap.FioriClient.context.smpRegContext is null, don't allow the user
                // to skip the logon plugin by changing the URL.
                // sap.FioriClient.context.smpRegContext will be set once logon is successful.
                // Once logon completes and the app navigates to the URL, sap.FioriClient.context.smpRegContext will
                // be undefined, so it will pass this test.
                return;
            }
            
            if (!isUrl(retrievedFioriURL)) {
                errorCallback();
                return;
            }
            
            setFioriURL(retrievedFioriURL);
            
            // Add extra query string to force page reload.
            var buster = "smphomebuster=" + Math.random()*10000000000000000;

            if (retrievedFioriURL.indexOf("?") != -1)
            {
                // Add query right after ?
                // Do not assume there is only one ? in the URL,
                // they are legal characters in the query or fragment.
                var splitOnQuestionMark = retrievedFioriURL.split("?");
                var preFirstQuestionMark = splitOnQuestionMark.shift();
                var postFirstQuestionMark = splitOnQuestionMark.join("?");
                retrievedFioriURL = preFirstQuestionMark + "?" + buster + "&"+ postFirstQuestionMark;
            }
            else
            {
                if (retrievedFioriURL.indexOf("#") != -1)
                {
                    // Need to add query before anchor
                    retrievedFioriURL = retrievedFioriURL.split("#")[0] + "?" + buster + "#" + retrievedFioriURL.split("#")[1];
                }
                else
                {
                    // No anchor or query so create one.
                    retrievedFioriURL = retrievedFioriURL + '?' + buster;
                }
            }
            if (cordova.require("cordova/platform").id.indexOf("windows") === 0) {
                //load it in a webview.
                // TODO: add other relevant information for SMP.
                var data = {};
                data.url = retrievedFioriURL;
                data.smpRegContext = context.smpRegContext;
                fireEvent("fioriurl_initial_set", data);
            }
            else {
                window.location.href = retrievedFioriURL;

                // In almost all cases, just setting window.location.href to retrievedFioriURL is enough
                // to load the fiori URL.  However, if the platform is Android, AuthProxy is
                // intercepting, and the new URL is same as old URL, then window.location.href needs to
                // be set multiple times.
                if(isAndroid()){

                    var innerSuccess = function(previousFioriURLs){
                        if (previousFioriURLs) {
                            var previousUrlsArray = previousFioriURLs.split("^");
                            var previousUrl = previousUrlsArray[0];
                            // Helper function to robustly compare urls.
                            var removeSchemeAndQuery = function(url) {
                                if (url.toLowerCase().indexOf("https://") == 0) {
                                    url = url.substring("https://".length, url.length);
                                } else if (url.toLowerCase().indexOf("http://") == 0) {
                                    url = url.substring("http://".length, url.length);
                                }
                                if (url.indexOf("?") > 0) {
                                    url = url.substring(0,url.indexOf("?"));
                                }
                                return url;
                            }
                            var previousUrlToCompare = removeSchemeAndQuery(previousUrl);
                            var retreivedFioriUrlToCompare = removeSchemeAndQuery(retrievedFioriURL);
                            var urlsAreSame =  previousUrlToCompare == retreivedFioriUrlToCompare;
                            if (urlsAreSame) {
                                // In this case assigning to window.location.href must be done 5 more times before it has any effect.
                                var count = 0;
                                var loadFioriUrl = function() {
                                    count++;
                                    window.location.href = retrievedFioriURL;
                                    if (count <= 5) {
                                        setTimeout(loadFioriUrl, 1000);
                                    }
                                }
                                loadFioriUrl();
                            }
                        }
                    }

                    var compareCurrentUrlWithPreviousUrl = function() {
                        sap.AppPreferences.getPreferenceValue('previous_fiori_urls', innerSuccess);
                    }

                    sap.AuthProxy.isInterceptingRequests(function(isInterceptingRequests){
                        if (isInterceptingRequests) {
                            compareCurrentUrlWithPreviousUrl();
                        }
                    });

                }
            }
        });
    };

    var setFioriURL = function(fioriURL) {
        // On Android, check to see if httpsConversion is in effect.  If it is, be sure
        // to persist the fiori URL as was originally intended (https).
        if (device.platform.toLowerCase().indexOf("android") >= 0 && httpsConversionInEffect) {
            if (fioriURL.toLowerCase().indexOf("http://") == 0) {
                var splitArray = fioriURL.split('://');
                splitArray.shift();
                fioriURL = "https://" + splitArray.join('://');
            }
        }
        sap.CacheManager.setUrl(fioriURL);
        // Make sure this value is synchronized with app preferences.
        sap.AppPreferences.setPreferenceValue('fioriURL', fioriURL, null, null);
        // Save an additional copy so that we can detect when the value is changed in the Settings menu.
        sap.AppPreferences.setPreferenceValue('previousFioriURL', fioriURL, null, null);
    };

    var getPreviousFioriURL = function(callback) {
        var innerSuccess = function(previousFioriUrl) {
            doHttpsConversionIfNeeded(previousFioriUrl, callback);
        }
        sap.AppPreferences.getPreferenceValue('previousFioriURL', innerSuccess, null);
    };

    var getFioriURL = function(callback) {
        function getFioriURLFromAppPreferencesFailed(error) {
            sap.Logger.info(error, 'FIORI_CLIENT');
            // The Fiori URL wasn't found, so use the hardcoded value.
            doHttpsConversionIfNeeded(context.appConfig.fioriURL, callback);
        }
        function getFioriURLFromAppPreferencesSuccess(url) {
            if (url != null) {
                doHttpsConversionIfNeeded(url, callback);
            } else {
                doHttpsConversionIfNeeded(context.appConfig.fioriURL, callback);
            }
        }
        sap.AppPreferences.getPreferenceValue('fioriURL', getFioriURLFromAppPreferencesSuccess, getFioriURLFromAppPreferencesFailed);
    };

    var clearBrowserCache = function(shouldDisplayPrompt) {
        sap.AppPreferences.setPreferenceValue('ClearBrowserCache', false);
        sap.CacheManager.clearCache();
        if (shouldDisplayPrompt) {
            navigator.notification.alert("", null, bundle.get('cache_cleared'));
        }
    };

    var applySettings = function() {
        getFioriURL(function (fioriURL) {
            getPreviousFioriURL(function (previousFioriURL){
                if (fioriURL && previousFioriURL && fioriURL !== previousFioriURL) {
                    clearBrowserCache(false);
                    goToFioriURL(fioriURL);
                    /** Fixing the issue 1472008622: Annoying "OK" button while resetting URL from settings
                        After discussing with Kanthi and Jonathan we decided to remvoe the navigation alert Temporarily commenting out
                    
                    navigator.notification.alert(loadingThePageText ?
                                                 loadingThePageText : 'Loading the page.',
                                                 null,
                                                 fioriURLChangedText ?
                                                 fioriURLChangedText : 'Fiori URL changed');
                    */
                }
            });
        });
        sap.AppPreferences.getPreferenceValue('ClearBrowserCache', function (result) {
            if (result) {
                clearBrowserCache(true);
            }
        }, null);
        sap.AppPreferences.getPreferenceValue('LogLevel', function(logLevel){
                                                if(logLevel != null) {
                                                     sap.Logger.setLogLevel(logLevel);
                                                }
                                             },  null);

    };
    
    //if source is 'apppreference', then the fioriConfiguration is coming from appPreference plugin, and
    //the value is already parsed as name&value pair settings
    //if source is 'user', then the savedFioriUrl is coming from messagebox's user input, the input may
    //be a simple url or a json string containing mobile place, SMP or other settings we may add later.
    //The settings also need to be saved in apppreference once it is validated
    var parseAppConfig = function(callback, fioriConfiguration, context) {

        var configType = context.operation.currentConfigType;
        if (!configType){
            configType = context.operation.configSources[context.operation.currentConfigIndex];
        }

        var requiredConfigValues = ['appID', 'fioriURL', 'fioriURLIsSMP'];
      
        //set the context appConfig property with the input configuration object
        if (fioriConfiguration){
            for (var name in fioriConfiguration) {
               if (fioriConfiguration.hasOwnProperty(name)) {
                    context.appConfig[name] = fioriConfiguration[name];
               }
            }
        }

        // If demo mode is enabled, skip config types except user so that the chooseDemoMode
        // screen shows again.
        if (fioriConfiguration.demoMode && configType != "user") {
            context.operation.currentConfigState = "done";
            setTimeout(function(){
                callback(context);
            }, 0);
            return;
        }

        //if configuration is not complete, then set state to done and let logonController move
        //to next config source type
        for(var i=0; i<requiredConfigValues.length; i++){
            var value = requiredConfigValues[i];
            if ((fioriConfiguration[value] === undefined || fioriConfiguration[value] === '') &&
                (context.appConfig[value] === undefined || context.appConfig[value] === '')) {
                    context.operation.currentConfigState = "done";
                    setTimeout(function(){
                        callback(context);
                        }, 0);
                return;
            }
        }
        
        //if configure source is not saved, then save the configuraiton to later use
        if (configType != "saved"){
            //once registatation succeeded, this flag will tell onsuccess callback delegate to save the appPreference
            context.operation.mustWriteToAppPreferences = true;
        }

        if (context.appConfig.hasOwnProperty("LogLevel")) {
               sap.Logger.setLogLevel(context.appConfig["LogLevel"], null, null);
        }
        
        if (context.appConfig.fioriURL && !isUrl(context.appConfig.fioriURL)) {
            errorText = context.appConfig.fioriURL + ' is not a valid URL.';
            throw new Error(errorText);
        }

        onConfigurationValidated(context, callback);
    };
    
    var onConfigurationValidated = function(context, callback){
       var splitArray = context.appConfig.fioriURL.split('://');
       context.smpConfig.https = splitArray.shift() === 'https';
       context.smpConfig.serverHost = splitArray.join('://');
       
       //set auth element
       if (context.appConfig.auth){
            context.smpConfig.auth = context.appConfig.auth;
       }
       
       if(context.appConfig.fioriURL) {
           var indexOfColon = context.smpConfig.serverHost.indexOf(':');
           if (indexOfColon !== -1 && indexOfColon < context.smpConfig.serverHost.indexOf('/')) {
               var splitURL = context.smpConfig.serverHost.split(':');
               context.smpConfig.serverHost = splitURL[0];
               context.smpConfig.serverPort = splitURL[1].split('/')[0];
               context.appConfig.endpointSuffix = '/' + splitURL[1].split('/').slice(1).join('/');
           } else {
               var restOfURL = context.smpConfig.serverHost;
               var indexOfFirstSlash = restOfURL.indexOf('/');
               context.smpConfig.serverPort = "";  //set port to empty string to indicate using the default port
			   if (indexOfFirstSlash != -1){
			   		context.smpConfig.serverHost = restOfURL.substring(0, indexOfFirstSlash);
               		context.appConfig.endpointSuffix = restOfURL.substring(indexOfFirstSlash);
			   }
			   else{
			   		context.smpConfig.serverHost = restOfURL;
				    context.appConfig.endpointSuffix = "";
			   }
            }
           //set application settings to smp specific setting
           context.appConfig.isForSMP = context.appConfig.fioriURLIsSMP;

           initClient(bundle, context, callback);
        }
    };
   
    var loadTranslations = function(success) {
        // Load required translations
        var i18n = require('com.sap.mp.cordova.plugins.i18n.i18n');
        i18n.load({
                path: "plugins/com.sap.mp.cordova.plugins.fioriclient/www"
            },
            function(loadedBundle){
                bundle = loadedBundle;
                success();
            });
    };
    
    var showSettings = function() {
        function setupPreferences() {
            // Webapppath is different on windows
            var webappPath;
            
            if (isWindows()) {
                webappPath = "ms-appx:///www/plugins/com.sap.mp.cordova.plugins.fioriclient/www/validation.html";
            } else {
                webappPath = "file:///android_asset/www/plugins/com.sap.mp.cordova.plugins.fioriclient/www/validation.html";
            }

            var preferencesJSON = {
                "webapppath" : webappPath,
                "validationfunction" : "validationFunction",
                "preferences" : []               
            };
            
            //if fioriURLIsSMP is false, then delete APPID and FioriUrlIsSMP, and ResetSettings field, and also make FioriUrl field as editable so it has the same user experience as fiori 1.0
            var urlPreference = {};
            urlPreference[bundle.get("sap_fiori_url")] = [
                    {
                        "key" : "fioriURL",
                        "type" : "edittext",
                        "title" : bundle.get("fiori_url"),
                        "summary": bundle.get("sap_fiori_url"),
                        "defaultvalue": "",
                        "readonly":true,
                        "regex": "^(http|https)://(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(/|/([\\w#!:.?+=&%@!\\-/]))?"  //TODO: the regex attribute (and the native code in settings screen) should be deleted as the url in settings screen is readonly. 
                    }
                ];
            preferencesJSON["preferences"].push(urlPreference);

            if (context.appConfig.fioriURLIsSMP){
                var isSmpPreference = {};
                isSmpPreference[bundle.get("proxy_through_smp")] = [
                        {
                            "key" : "fioriURLIsSMP",
                            "type": "checkbox",
                            "title": bundle.get("proxy_through_smp"),
                            "summary": bundle.get("connect_through_smp"),
                            "defaultvalue": false,
                            "readonly":true
                        }    
                    ];
                var appIdPreference = {};
                appIdPreference[bundle.get("app_id")] = [
                        {
                            "key" : "appID",
                            "type" : "edittext",
                            "title" : bundle.get("app_id"),
                            "summary": bundle.get("app_id"),
                            "defaultvalue": "",
                            "readonly":true
                        }
                    ];
                preferencesJSON["preferences"].push(isSmpPreference, appIdPreference);
            }

            var loggingPreference = {};
            loggingPreference[bundle.get("logging")] = [
                    {
                        "key" : "LogLevel",
                        "type" : "list",
                        "title" : bundle.get("log_level"),
                        "summary": bundle.get("log_level"),
                        "defaultvalue" : "ERROR",
                        "listentries" : [ bundle.get("log_level_error"), bundle.get("log_level_warn"), bundle.get("log_level_info"), bundle.get("log_level_debug") ], 
                        "listvalues" : [ "ERROR", "WARN", "INFO", "DEBUG" ]
                    }
                ];

            preferencesJSON["preferences"].push(loggingPreference);

            // "Clear browser cache" button is not available on windows platform.
            if (!isWindows()) {
                var cachePreference = {};
                cachePreference[bundle.get("cache")] = [
                        {
                            "key" : "ClearBrowserCache",
                            "type": "button",
                            "title": bundle.get("clear_cache"),
                            "summary": bundle.get("tap_to_clear_cache"),
                            "defaultvalue": "",
                            "postClickToast": bundle.get("cache_cleared_successfully")
                        }
                    ];
                preferencesJSON["preferences"].push(cachePreference);
            }

            if (context.appConfig.demoMode) {
                var switchToProductionPreference = {};
                switchToProductionPreference[bundle.get("demo_mode")] = [
                        {
                            "key" : "SwitchToProduction",
                            "type": "button",
                            "title": bundle.get("switch_to_production_mode"),
                            "summary": bundle.get("tap_to_switch_to_production_mode"),
                            "defaultvalue": "",
                            "postClickToast": bundle.get("app_reset")
                        }
                    ];
                preferencesJSON["preferences"].push(switchToProductionPreference);
            }
            var resetPreference = {};
            resetPreference[bundle.get("reset_settings")] = [
                    {
                        "key" : "ResetSettings",
                        "type": "button",
                        "title": bundle.get("clear_all_app_settings"),
                        "summary": bundle.get("tap_to_clear_settings"),
                        "defaultvalue": "",
                        "postClickToast": bundle.get("app_reset")
                    }
                ];
            preferencesJSON["preferences"].push(resetPreference);

            sap.AppPreferences.configurePreferencesScreen(preferencesJSON,
                  function(){
                        sap.AppPreferences.showPreferencesScreen(successCallback, errorCallback)
                  },
                  errorCallback);
        }

        function successCallback(result) {
            var previousFioriURLs;
            var switchToProduction;
            var previousLogLevel;
            
            if (result == "reset"){
                // Some preferences must be kept when all others are reset.
                // This function saves those settings back after the reset cleared everything.
                var resaveSomePreferences = function() {
                    var preferencesToSave = {};
                    preferencesToSave['previous_fiori_urls'] = previousFioriURLs;
                    preferencesToSave['SwitchToProduction'] = switchToProduction;
                    //save log level so that the debug log level can be applied during initial configuration
                    preferencesToSave['LogLevel'] = previousLogLevel;

                    sap.AppPreferences.setPreferenceValues(preferencesToSave);
                }
                var deleteRegistration = function() {
                   var onDeleteRegistration = function(){
                     console.log("successCallback for deleteregistration");
                     if (cordova.require("cordova/platform").id == "ios"){
                         sap.CacheManager.clearCache();
       
                         var preferencesToSave = {};
                         preferencesToSave['previous_fiori_urls'] = previousFioriURLs;
                         preferencesToSave['SwitchToProduction'] = switchToProduction;
                         //save log level so that the debug log level can be applied during initial configuration
                         preferencesToSave['LogLevel'] = previousLogLevel;
                         sap.logon.Core.reset(null, null, preferencesToSave);
                      }
                      else{
                         sap.logon.Core.reset(resaveSomePreferences, resaveSomePreferences);
                         sap.CacheManager.clearCache();
                         // Reloads the entire application on windows
                         resetWindowsApp();
                      }
                   }
               
                   sap.logon.Core.deleteRegistration(onDeleteRegistration, onDeleteRegistration );
                }

                var prepareToDeleteRegistration = function(){
                    if (device.platform.toLowerCase().indexOf("android") >= 0) {
                        sap.AuthProxy.stopIntercepting(deleteRegistration,deleteRegistration);
                    } else {
                        deleteRegistration();
                    }
                }
                // The only thing we don't want to get rid of are the previous urls.
                // So, get them before resetting, then save them back afterward.
                sap.AppPreferences.getPreferenceValues(["previous_fiori_urls", "SwitchToProduction", "LogLevel"], function(preferences) {
                    if (preferences.previous_fiori_urls) {
                        // use ^ to delimit the urls, since ^ is not allowed in a url.
                        previousFioriURLs = preferences.previous_fiori_urls
                        // Add the current url if it isn't already included in the previous urls.
                        if (previousFioriURLs.indexOf(context.appConfig.urlWithFakeParameters) < 0) {
                            previousFioriURLs = context.appConfig.urlWithFakeParameters + "^" + previousFioriURLs;
                        } else {
                            // The current fiori url is already in the list of previous urls, so move it to the front.
                            previousUrlsArray = previousFioriURLs.split("^");
                            var index = previousUrlsArray.indexOf(context.appConfig.urlWithFakeParameters);
                            previousUrlsArray.unshift(previousUrlsArray.splice(index, 1));
                        }
                    } else {
                        previousFioriURLs = context.appConfig.urlWithFakeParameters;
                    }
                    previousLogLevel = preferences.LogLevel;
                    switchToProduction = preferences.SwitchToProduction;
                    prepareToDeleteRegistration();
                }, function(result) {
                    sap.Logger.error("Error callback while attempting to read previous fiori urls.  Continuing to reset the application.");
                    prepareToDeleteRegistration();
                });
            }
            else{
          
                console.log("successCallback called " + JSON.stringify(result));
                if( device.platform[0] === 'i') {
                    setTimeout(applySettings, 0);
                }
            }
        }

        function errorCallback(error) {   
            console.log("An error occurred:  " + JSON.stringify(error));
        }


        setupPreferences();

    
    };

    var print = function(bundle) {
        cordova.plugins.printer.isAvailable(function (available) {
                                            if (available) {
                                                if (cordova.require("cordova/platform").id != "ios"){
                                                    var page = location.href; // for current page
                                                    var path = window.location.pathname;
                                                    var currentPageName = path.substring(path.lastIndexOf('/') + 1);
                                                    cordova.plugins.printer.print(page, currentPageName, function () {});
                                                }
                                                else{
                                                    //test shows passing url or DOM outerHtml string does not print the content properly, so pass null to indicate
                                                    //native code to use the current UIWebView
                                                    cordova.plugins.printer.print(null, null, function () {});
                                                }
                                            } else {
                                                navigator.notification.alert(bundle.get("service_not_available"), function(){}, bundle.get("print_title"), bundle.get("ok"));
                                            }
        });
        
    };
               
    var showLog = function() {
        function fail(error) {
            console.log(error.code);
            alert(JSON.stringify(error));
        }

        // write file
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            fileSystem.root.getFile("fclog.html", {create: true, exclusive: false}, function(fileEntry){
                fileEntry.createWriter(function(writer){
                    sap.Logger.getFormattedLog(function(logEntries){
                        var logPage = '<!DOCTYPE html PUBLIC "-//IETF//DTD HTML 2.0//EN"><HTML><HEAD></HEAD>';
                        logPage += '<STYLE>button {-webkit-appearance: none; -moz-appearance: none; appearance: none;font-size: 30px;padding: 20px 20px 20px 20px; min-height: 90px; min-width: 220px; font-weight:bold; font-style:normal}, ';
						logPage += 'table {width: 100%;border-collapse: collapse;text-align: left;}th, td {text-align: left;}.odd th, .odd td {background: #ddd;}.even th, .even td {background: #fff;}</STYLE><BODY>';
						logPage += '<button onclick="window.location.href=\'#sendEmail=true\';">' + bundle.get("email_log") + '</button><p><table>';
                        logPage += logEntries;
                        logPage += '</table>';
                        logPage += '</BODY></HTML>';
                        writer.write(logPage);
                        setTimeout(function(){ module.exports.showLogFile(); }, 1);
                    }, function(){
                        var logPage = '<!DOCTYPE html PUBLIC "-//IETF//DTD HTML 2.0//EN"><HTML><HEAD></HEAD><BODY>';
                        logPage += bundle.get("no_entries_in_log");
                        logPage += '</BODY></HTML>';
                        writer.write(logPage);
                        setTimeout(function(){ module.exports.showLogFile(); }, 1);
                    });
                }, fail);
            }, fail);
        }, fail);
        
       
    };

    var showLogFile = function() {
        function fail(error) {
            console.log(error.code);
            alert(JSON.stringify(error));
        }

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
            fileSystem.root.getFile("fclog.html", {create: true, exclusive: false}, function(fileEntry){
                var path = "file:" + fileEntry.fullPath;
                var sendEmail = false;
                                                 
                function logViewerLoadStart(event) { // fired on iOS
                    if (event.url.lastIndexOf('sendEmail=true') != -1) {
                        windowRef.close();
                        sendEmail = true;
                    }
                }
                                                 
                function logViewerLoadStop(event) { // fired on Android and ios
                    console.log("logviewStop");
                    if (cordova.require("cordova/platform").id != "ios"){  //skip it for ios as this event is also fired on ios 8
                        if (event.url.lastIndexOf('sendEmail=true') != -1) {
                            setTimeout( function() {
                                windowRef.close();
                            }, 50);
                            sap.Logger.emailLog('',bundle.get("sap_fiori_client_log"));
                        }
                    }
                }
                                                 
                function logViewerExit(event) {
                    console.log("logviewExit");
                    if( sendEmail === true ) {
                        if (cordova.require("cordova/platform").id != "ios"){
                            setTimeout(function() { // Exit called to quickly some times
                                sap.Logger.emailLog('',bundle.get("sap_fiori_client_log"));
                                sendEmail = false;
                             }, 500);
                        }
                        else{
                            sap.Logger.emailLog('',bundle.get("sap_fiori_client_log"));
                            sendEmail = false;
                        }
                         
                    }
                    windowRef.removeEventListener('loadstart', logViewerLoadStart);
                    windowRef.removeEventListener('loadstop', logViewerLoadStop);
                    windowRef.removeEventListener('exit', logViewerExit);
                }
                                                 
                var windowRef = window.open(fileEntry.nativeURL, '_blank', 'location=no,EnableViewPortScale=yes,overridebackbutton=yes');
                windowRef.addEventListener('loadstart', logViewerLoadStart);
                windowRef.addEventListener('loadstop', logViewerLoadStop);
                windowRef.addEventListener('exit', logViewerExit);
                windowRef.addEventListener('backbutton', function(){
                    windowRef.close();
                });
            }, fail);
        }, fail);
    };

    var initClient = function(i18nBundle, context, callback) {
        bundle = i18nBundle;
        cacheClearedText = bundle.get('cache_cleared');
        fioriURLChangedText = bundle.get('fiori_url_changed');
        loadingThePageText = bundle.get('loading_the_page');

        // Adds only settings and about buttons on windows (other buttons are added from default.js)
        if (isWindows()) {
            sap.Toolbar.addItem({ "label": bundle.get("settings"), "icon": "settings", "showAsAction": sap.Toolbar.SHOW_AS_ACTION_NEVER, "section": "selection", "placement": "bottom" }, function () {
                showSettings();
            });
            
            sap.Toolbar.addItem({ "label": bundle.get("about"), "icon": "world", "showAsAction": sap.Toolbar.SHOW_AS_ACTION_NEVER, "section": "selection", "placement": "bottom" }, function () {
                window.navigator.notification.alert(bundle.get("version") + " " + bundle.get("version_value"), null, bundle.get("about_title"), bundle.get("ok"));
            });
        } else {
            var isAndroid = (device.platform == 'Android');

            if (!isAndroid) {
                sap.Toolbar.addItem({"label" : bundle.get("view_log"), "icon" : "smp_log", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_ALWAYS}, function () {
                    getFioriURL(function (fioriURL) {
                        showLog();
                    });
                });
            }

            sap.Toolbar.addItem({"label" : bundle.get("settings"), "icon" : "smp_settings", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_NEVER}, function () {
                                       showSettings();
                                       });
           
            if (isAndroid) {
                sap.Toolbar.addItem({"label" : bundle.get("view_log"), "icon" : "smp_home", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_NEVER}, function () {
                    showLog();
                });
                sap.Toolbar.addItem({"label" : bundle.get("about"), "icon" : "smp_about", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_NEVER}, function () {
                    window.navigator.notification.alert(bundle.get("version") + " " + bundle.get("version_value"), null, bundle.get("about_title"), bundle.get("ok"));
                });
            }
            
            //add a button for print
            sap.Toolbar.addItem({"label" : bundle.get("print"), "icon" : "smp_print", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_NEVER}, function () {
                print(bundle);
            });
        }      

        // TODO: Populate the settings menu.

        // Set an event listener to respond to changes in AppPreferences.
        document.addEventListener('resume', function () {
            // On iOS, the Fiori URL doesn't always get updated unless there is a small delay.
            if (!isWindows()) {
                // windows fc does not need to apply settings after resume.
                setTimeout(applySettings, 1000);
            }
        });

        context.operation.currentConfigState = "complete";
        callback(context)
        
        //if the current page is for error html pages, then automatically show the toolbar
        if (window.location.href.indexOf("www/CannotReachHost.html")!=-1 || window.location.href.indexOf("www/CertificateErrorPage.html")!=-1){
            window.sap.Toolbar.show();
        }
    };

    var onDeviceReady = function() {
               
        sap.Logger.info('Cordova container initialized', 'FIORI_CLIENT');

        //to check network status
        document.addEventListener("offline", function() 
            {
               sap.AppPreferences.setPreferenceValue('nonetwork', true, null, null);
            } , false);

        document.addEventListener("online", function() 
            {
               sap.AppPreferences.setPreferenceValue('nonetwork', false, null, null);
            } , false);
        loadTranslations(function(){
            sap.CacheManager.setCheckForUpdatesEvents(['onSapResumeSuccess']);
            var defaultoncacheinvalidated = sap.CacheManager.oncacheinvalidated;
            sap.CacheManager.oncacheinvalidated = function (){
                defaultoncacheinvalidated();
                goToFioriURL();
            };

            context = {
                    operation:{
                    logonView:sap.logon.LogonJsView
                },
            };

            context.operation.logonView.onShowScreen = function(screenId, screenEvents, currentContext) {
                var windowLocationString = window.location + "";
                if (screenId == "SCR_SET_PASSCODE_OPT_ON" && context.appConfig.demoMode) {
                    // If demo mode is enabled, we want to automatically disable the
                    // passcode without showing the setPasscode screen.
                    currentContext.passcodeEnabled = false;
                    screenEvents.onsubmit(currentContext);
                    return true;
                }
                if (screenId == "chooseDemoMode") {
                    // The user has just selected the Switch to Production Mode on the
                    // settings screen, so skip the choose demo mode screen.
                    if (context.appConfig.SwitchToProduction) {
                        currentContext.demoMode = false;
                        screenEvents.onsubmit(currentContext);
                        // Clear the switch to production preference so this only
                        // happens once every time the user switches to production.
                        context.appConfig.SwitchToProduction = false;
                        sap.AppPreferences.setPreferenceValue('SwitchToProduction',false);
                        return true;
                    }
                    // Every time the plugins load in demo mode from index.html, the chooseDemoMode screen
                    // would be shown.  But the chooseDemoMode screen should not be shown in fioriURL page or 
					// error screen. The solution is to check whether the window.location is from a local 
                    // index.html file (only the first time the plugins are loaded is window.location from 
				    // local index.html file), and if not, then directlying submit the screen without showing the 
					// chooseDemoMode screen.
                    //
                    var loadFromLocalIndexHtml = windowLocationString.toLowerCase().indexOf("file:") == 0
                            &&  windowLocationString.toLowerCase().indexOf("/www/index.html") != -1;
                         
                    if ( !loadFromLocalIndexHtml && (cordova.require("cordova/platform").id.indexOf("windows") !== 0) ) {
                        currentContext.demoMode = true;
                        screenEvents.onsubmit(currentContext);
                        return true;
                    }
                }
                if (screenId == "enterFioriConfiguration") {
                    currentContext.previous_fiori_urls = context.appConfig.previous_fiori_urls;
                }
                return false;
            }

            //Uncomment and modify the below block to bypass the logon regisration and passcode initialization screen
            //Please refer to Kapsel SDK Getting Started Guide for details - http://scn.sap.com/docs/DOC-49524
            context.operation.logonView.onShowScreen = function(screenId, screenEvents, currentContext) {
                if (screenId == "SCR_SSOPIN_SET") {
                    screenEvents.onskip();
                    return true;
                }
                else if (screenId =="SCR_UNLOCK") {
                    var context = {
                        unlockPasscode: "Password1@"
                    }
                    screenEvents.onsubmit(context);
                    return true;
                }
                else if (screenId == "SCR_REGISTRATION") {
                    currentContext.registrationContext.user ="demo";
                    currentContext.registrationContext.password = "mobile";
                    
                    screenEvents.onsubmit(currentContext.registrationContext);
                    return true;
                }
                else if (screenId == "SCR_SET_PASSCODE_MANDATORY") {
                    var context = {
                        passcode: "Password1@",
                        passcode_CONFIRM: "Password1@"
                    }
                    screenEvents.onsubmit(context);
                    return true;
                }
                else if (screenId == "SCR_SET_PASSCODE_OPT_ON") {
                    screenEvents.ondisable();
                    return true;
                }
                else if (screenId == "SCR_SET_PASSCODE_OPT_OFF") {
                    var context = {};
                    screenEvents.onsubmit(context);
                    return true;
                }
                return false;  //skip the default value
            };

            context.operation.onshowNotification = function(screenId, notifcationKey) {
                if (screenId == "SCR_SSOPIN_SET" || screenId == "SCR_UNLOCK" || screenId == "SCR_REGISTRATION" || screenId == "SCR_SET_PASSCODE_MANDATORY" || screenId == "SCR_SET_PASSCODE_OPT_ON" || screenId == "SCR_SET_PASSCODE_OPT_OFF" ) {
                    alert(notifcationKey);
                    return true;
                }
                return false;
            };
            

            sap.Logon.loadConfiguration(sap.FioriClient, context);
		});
    }


    // Set up the toolbar plugin buttons.
    document.addEventListener('deviceready', onDeviceReady);
    

    var showFirstUseTips = function() {
        sap.AppPreferences.setPreferenceValue('skipShowFirstUseTips', true);
        sap.Logger.info('Showing first use tips dialog.', 'FIORI_CLIENT');
        var firstUseIAB = window.open('FirstUseTips.html', '_blank', 'location=no,EnableViewPortScale=yes,toolbar=no');

       if (isIOS()) {
            firstUseIAB.addEventListener('loadstart', function (event) {
                // Need loadstart for iOS
                if (event.url.match("closewindow")) {
                    firstUseIAB.close();
                    sap.FioriClient.goToFioriURL();
                }
            });
        }
        
        if (isWindows() || isAndroid()) {
            firstUseIAB.addEventListener('loadstop', function (event) {
                // Need loadstop for Android and Windows.
                if (event.url.match("closewindow")) {
                    firstUseIAB.close();
                    sap.FioriClient.goToFioriURL();
                }
            });
        }
    }

    // Returns whether platform is windows or not
    var isWindows = function() {
        return device.platform.toLowerCase().indexOf("windows") === 0;
    };
    
    var isAndroid = function () {
        return device.platform.toLowerCase().indexOf("android") === 0;
    };

    var isIOS = function () {
        return device.platform.toLowerCase().indexOf("ios") === 0;
    }
           
    //expose public property and method
    module.exports = {
        onSubmitScreen : onSubmitScreen ,
        onGetAppConfig : onGetAppConfig,
        onRegistrationSuccess : onRegistrationSuccess,
        onRegistrationError : onRegistrationError,
        retrieveAppID : retrieveAppID,
        retrieveFioriURLIsSMP : retrieveFioriURLIsSMP,
        goToFioriURL : goToFioriURL,
        setFioriURL : setFioriURL,
        getFioriURL : getFioriURL,
        clearBrowserCache : clearBrowserCache,
        showLogFile : showLogFile,
    };


});
