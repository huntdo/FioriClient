cordova.define("com.sap.mp.cordova.plugins.toolbar.toolbar", function(require, exports, module) { // 3.8.0 
var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec');

/**
 * The Toolbar plugin allows an application to create a native toolbar using JavaScript.
 * On Android, a double tap gesture is used to display/hide the toolbar.
 * On iOS, A long press with 2 fingers will display the toolbar.
 * On Windows Phone 8.1, the toolbar icon is always visible in the right bottom corner. Clicking on this icon will display the toolbar buttons.
 * On Windows 8.1, A right mouse click or Press Windows+Z or Swipe from the top or bottom edge of the screen to display the toolbar. Click anywhere on the screen to hide it.
 * @namespace
 * @alias Toolbar
 * @memberof sap
 */
var toolbar = {
    /**
     * Adds a custom item to the toolbar.
	 * Top placement is not supported on Windows Phone 8.1. In this case the items will be added to the bottom toolbar.
     * @param {Object} item - Properties used for creating the toolbar item.
     * @param {String} item.label - The text for the toolbar item.
     * @param {String} item.icon - The name of the icon to display for the toolbar item.  The name is resolved to the platforms assets.
     * @param {number} item.showAsAction - Sets how this item should be display with the Action Bar.  One of `SHOW_AS_ACTION_ALWAYS`, `SHOW_AS_ACTION_IF_ROOM`, or `SHOW_AS_ACTION_NEVER`.  Optionally you may OR the value with `SHOW_AS_ACTION_WITH_TEXT`.  Defaults to `SHOW_AS_ACTION_NEVER`.  Android Only.  
     * @param {Function} callback - Callback function that is invoked when the item is clicked.
     * @example
     * sap.Toolbar.addItem({ "label" : "Refresh", "icon" : "smp_reload", "showAsAction" : sap.Toolbar.SHOW_AS_ACTION_ALWAYS }, function() {
     *     window.location.reload();
     * });
     */
    addItem : function(item, callback) {
        argscheck.checkArgs("of", "toolbar.addItem", arguments);
        exec(callback, null, "toolbar", "add", [item]);
    },
    /**
     * Clears all the custom items from the toolbar.
     * @param {Function} callback - Callback function that is invoked when the clear is finished.
     * @example
     * sap.Toolbar.clear(function() {
     *     console.log("Cleared toolbar");
     * });
     */
    clear : function(callback) {
    	items = [];
        callbacks = [];
    	
        exec(callback, callback, "toolbar", "clear", []);
    },
    /**
     * Shows the toolbar
     * @example
     * sap.Toolbar.show();
     */
    show : function(callback) {
        exec(callback, callback, "toolbar", "show", []);
    },
    
    /**
     * Always show this item as a button in an Action Bar.  It is recommended that at most 2 items have this set.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_ALWAYS : 2,
    /**
     * Show this item as a button in an Action Bar if the system decides there is room for it.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_IF_ROOM : 1,
    /**
     * Never show this item as a button in an Action Bar.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_NEVER : 0,
    /**
     * When this item is in the action bar, always show it with a text label even if it also has an icon specified.  Android Only.
     * @constant
     * @type {number}
     */
    SHOW_AS_ACTION_WITH_TEXT: 4
};


document.addEventListener("deviceready", function() {
	// If the menu button is pressed, make sure the toolbar is showing
	// (otherwise the menu buttons will not work).
	document.addEventListener("menubutton", function() {
	    toolbar.show();
	}, false);
});

module.exports = toolbar;

});
