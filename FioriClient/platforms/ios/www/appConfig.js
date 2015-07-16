cordova.define('fiori_client/appConfig', function(require, exports, module) {
    /**
     * appConfig - This object is loaded when the client is starting up. It
     * determines the default values of each of its keys. Once the application
     * has loaded the values at runtime, these values are copied into AppPreferences,
     * where they can be modified by the user. From that point on, any value in AppPreferences
     * will override any value of the same key here.
     */
    var appConfig = {
        /**
         * appID - The appID used to identify the application to the data vault.
         * If you are using SMP, this should be consistent with the appID of the
         * target application. Note that this value is distinct from the packageName,
         * which is mainly used to identify your application in app stores.
         */
        "appID": "com.sap.fiori.client",
        /**
         * fioriURL - The full URL of the target application. If your application does not
         * use SMP, it will navigate directly to this URL once logon is completed. If your app
         * does use SMP, this URL is parsed and used in the following way:
         *   1. The URL scheme (which must be http or https) determines the inital value
         *      of the 'https' flag in the registration dialog. Similarly, the host and port
         *      in the URL determine their corresponding initial values in the registration dialog,
         *      with port defaulting to 443 if it's not specified.
         *   2. The URL suffix (everything after the host and port) is appended to the URL that
         *      the user registers to. Though this is likely to be the same as the scheme, host and
         *      port from 1., the user has the opportunity to change these values. In contrast,
         *      the suffix can't be changed.
         * If you are using SMP, you will ultimately want to specify the scheme, host and port of
         * your SMP server, followed by the suffix of the Fiori endpoint. For example:
         *
         * "https://my.smp.server:8081/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html"
         */
        "fioriURL": "",
        /**
         * fioriURLIsSMP - Set this to true if your are using SMP.
         * If set to true, the application will perform SMP registration.
         */
        "fioriURLIsSMP": false,
        
        /**
		 * certificate - Set the client certificate provider
         * for current version, only supports "afaria" as certificate provider. 
         * As afaria seeding data is not supported, so the only use of afaria is for client certificate. 
         */
         "certificate": "",

        /**
         * passcodePolicy - Specify the passcodePolicy of the data vault. Note: if you
         * are using SMP, the passcodePolicy is determined by the server.
         * For more information, see documentation of the logon plugin.
         * 
         */
         "passcodePolicy":  {
               "expirationDays":"0",
               "hasDigits":"false",
               "hasLowerCaseLetters":"false",
               "hasSpecialLetters":"false",
               "hasUpperCaseLetters":"false",
               "defaultAllowed":"true",
               "lockTimeout":"300",
               "minLength":"8",
               "minUniqueChars":"0",
               "retryLimit":"10"
          }
    };
    module.exports = appConfig;
});
