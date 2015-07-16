

	var topAppBar = { commands: [] };
	var bottomAppBar = { commands: [] };
	var items = [];
	var callbacks = [];

	// AppBar properties
	var appBarProperties = ["placement", "sticky", "closedDisplayMode", "disabled"];

	function getAppBar(placement) {
		var appBarId = "appBar-" + placement;
		var appBarElement = document.getElementById(appBarId);
		if (appBarElement == null) {
			appBarElement = document.createElement("div");
			appBarElement.id = appBarId;

			new WinJS.UI.AppBar(appBarElement);
			document.body.appendChild(appBarElement);
		}

		var appBarObj = appBarElement.winControl;
		if (!appBarObj) {
			throw new Error("No toolbar found! - " + appBarId);
		}

		return appBarObj;
	}

	function initAppBar(appBar) {
		if (!appBar || !appBar.options || !appBar.options.placement)
			return;

		var appBarObj = getAppBar(appBar.options.placement);
		if (!appBarObj.hidden)
			return;

		if (appBar.commands.length > 0) {
			appBarObj.commands = appBar.commands;
			appBarObj.disabled = false;
			WinJS.UI.setOptions(appBarObj, appBar.options);
		} else {
			appBarObj.disabled = true;
		}

        // hide the appbar by default. call show() to show it. needed for fiori client.
		appBarObj.disabled = true;
		appBar.appBarObj = appBarObj;
	}

	function showAppBar(appBar) {
	    if (appBar.commands.length > 0) {
	        appBar.appBarObj.disabled = false;
			appBar.appBarObj.show();
		}
	}

	function createCommand(options, callback) {
		var commandElement = document.createElement('button');
		var command = new WinJS.UI.AppBarCommand(commandElement, options);
		command.onclick = function () {
			callback(null, { keepCallback : true });
		};

		return command;
	}

	function clearCommands(appBar) {
		if (!appBar || !appBar.options) {
			return;
		}

		var appBarObj = getAppBar(appBar.options.placement);
		for (var i = 0; i < appBar.commands.length; i++) {
			appBar.commands[i].dispose();
		}
		appBarObj.hideCommands(appBar.commands);
		appBarObj.disabled = true;
		appBar.commands = [];
	}

	function getOptions(options) {
		var commandOptions = { disabled: false };
		var appBarOptions = { placement: "bottom", sticky: false, closedDisplayMode: "compact", disabled: false };

		for (var prop in options) {
			if (appBarProperties.indexOf(prop) != -1) {
				appBarOptions[prop] = options[prop];
			} else {
				commandOptions[prop] = options[prop];
			}
		}

		return { appBarOptions: appBarOptions, commandOptions: commandOptions };
	}

	module.exports = {

		add: function (successCallback, errorCallback, args) {
			items.push(args[0]);
			callbacks.push(successCallback);

			clearCommands(topAppBar);
			clearCommands(bottomAppBar);

			for (var i = 0; i < items.length; i++) {
				var options = getOptions(items[i]);

				// Top placement is not supported on Windows Phone 8.1.
				// The item will be added to the bottom toolbar.
				if (WinJS.Utilities.isPhone && options.appBarOptions.placement == "top") {
					console && console.error && console.error("Error: Top placement is not supported on Windows Phone 8.1.!");					
					options.appBarOptions.placement = "bottom";
				}

				var placement = options.appBarOptions.placement;
				var command = createCommand(options.commandOptions, callbacks[i]);

				if (placement == "top") {
					topAppBar.commands.push(command);
					topAppBar.options = options.appBarOptions;
				} else if (placement == "bottom") {
					bottomAppBar.commands.push(command);
					bottomAppBar.options = options.appBarOptions;
				}
			}

			initAppBar(topAppBar);
			initAppBar(bottomAppBar);
		},

		clear: function (successCallback, errorCallback) {
			try {
				clearCommands(topAppBar);
				clearCommands(bottomAppBar);
				items = [];
				callbacks = [];

				successCallback && successCallback();
			} catch (ex) {
				errorCallback && errorCallback(ex);
			}
		},

		show: function (successCallback, errorCallback) {
			showAppBar(topAppBar);
			showAppBar(bottomAppBar);

			successCallback && successCallback();
		}

	};

	require("cordova/windows8/commandProxy").add("toolbar", module.exports);
