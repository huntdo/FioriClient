cordova.define("com.sap.mp.cordova.plugins.e2etrace.E2ETrace", function(require, exports, module) { var exec = require('cordova/exec');

/**
 * Provides end-to-end trace support.
 *	
 * @namespace
 * @alias E2ETrace
 * @memberof sap
 */

E2ETrace = function() {
	/**
	 * Turn tracing on.
	 * @param {String} [transactionName] The name of the transaction for this trace.  Defaults to 'kapsel' if not specified.
	 * @example
	 * sap.E2ETrace.startTrace();
	 */
	this.startTrace = function(transactionName) {
		// setup xhook
		xhook.enable();

		if(transactionName === undefined) {
		    transactionName = 'kapsel';
		}

		// start the trace
		exec(null, null, "E2ETrace", "startTrace", [transactionName]);
	}

	/**
	 * Turn tracing off.
	 * @example
	 * sap.E2ETrace.endTrace();
	 */
	this.endTrace = function() {
		// shutdown xhook
		xhook.disable();
		
		// end the trace
		exec(null, null, "E2ETrace", "endTrace", []);
	}

	/**
	 * Set the trace level.  The trace level can be set to HIGH, MEDIUM, LOW, or NONE.
	 * @example
	 * sap.E2ETrace.setTraceLevel(sap.E2ETrace.HIGH);
	 */
	this.setTraceLevel = function(level) {
		if( level !== "HIGH" &&
			level !== "MEDIUM" &&
			level !== "LOW" &&
			level !== "NONE"
		) {
			// Use default
			level = sap.E2ETrace.LOW;
		}
		exec(null, null, "E2ETrace", "setTraceLevel", [level]);
	}

	/**
	 * Upload trace data to an SMP server.
	 * @example
	 * sap.E2ETrace.uploadTrace(success, error);
	 */
	this.uploadTrace = function(successCallback, errorCallback) {
	    sap.Logon.unlock(function (connectionInfo) {
            //Add application ID required for REST call
            connectionInfo.applicationId = sap.Logon.applicationId;

            exec(successCallback, errorCallback, "E2ETrace", "uploadTrace", [connectionInfo]);
        });
	}
}

/**
 * Constant representing HIGH trace level.
 * @member of sap.E2ETrace
 * @constant
 * @type String
 * @example
 * sap.E2ETrace.setTraceLevel(sap.E2ETrace.HIGH);
 */
E2ETrace.prototype.HIGH = "HIGH";

/**
 * Constant representing MEDIUM trace level.
 * @member of sap.E2ETrace
 * @constant
 * @type String
 * @example
 * sap.E2ETrace.setTraceLevel(sap.E2ETrace.MEDIUM);
 */
E2ETrace.prototype.MEDIUM = "MEDIUM";

/**
 * Constant representing LOW trace level.
 * @member of sap.E2ETrace
 * @constant
 * @type String
 * @example
 * sap.E2ETrace.setTraceLevel(sap.E2ETrace.LOW);
 */
E2ETrace.prototype.LOW = "LOW";

/**
 * Constant representing NONE trace level.
 * @member of sap.E2ETrace
 * @constant
 * @type String
 * @example
 * sap.E2ETrace.setTraceLevel(sap.E2ETrace.NONE);
 */
E2ETrace.prototype.NONE = "NONE";

document.addEventListener('deviceready', function () {
    xhook.before(function(request) {
        exec(null, null, "E2ETrace", "traceBefore", [request]);
    });
    xhook.after(function(request,response) {
        exec(null, null, "E2ETrace", "traceAfter", [request.url,response]);
    });
});

module.exports = new E2ETrace();

});
