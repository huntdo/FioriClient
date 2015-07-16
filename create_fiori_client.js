#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
	os = require('os'),    
	unzip = require('unzip'),
	shelljs;
try {
    shelljs = require('shelljs');
} catch (e) {
    console.error('Missing the shelljs module. Please run "npm install" and try again.');
    process.exit(2);
}

// Check if the last argument can be considered a valid json
// file that can be used for configuration settings.
var configPath = process.argv.slice(-1)[0];
var useDefaultConfigPath = false;
if (configPath.indexOf('create_fiori_client.js') !== -1) {
    console.log('No config file specified.');
    useDefaultConfigPath = true;
} else if (configPath.indexOf('json') === -1) {
    console.log(configPath + ' is not a json file.');
    useDefaultConfigPath = true;
}
if (useDefaultConfigPath) {
    console.log('Searching for config.json in the current directory.');
    configPath = shelljs.pwd() + '/config.json';
}
try {
    var config = require(configPath);
} catch (e) {
    console.error('Config file not found at ' + configPath + '.');
    console.log(e);
    process.exit(2);
}
console.log('Config file found at ' + configPath + '.');

['packageName', 'targetFolder', 'appName', 'platforms'].forEach(function (property) {
    if (config[property] === undefined || config[property] === '') {
        console.error('Property ' + property + ' was not found. Please open the configuration file (config.json by default) and enter your settings.');
        process.exit(2);
    }
});

var haveIosPlatform = config.platforms.indexOf("ios") >= 0;
var haveAndroidPlatform =  config.platforms.indexOf("android") >= 0;

if (!haveIosPlatform && !haveAndroidPlatform) {
    console.error('No platforms specified. Please specify a platform in the configuration file.');
    process.exit(2);
}
console.log('platforms: ' + config.platforms);

var useCrosswalkForAndroid = false;
if(haveAndroidPlatform && config.crosswalkLocation) {
    useCrosswalkForAndroid = true;
}

var sdk_root = path.normalize(shelljs.pwd() + path.sep + '..' + path.sep + '..');
var osType = os.type();

//resolve to absolute path for supporting it
var targetFolder = path.resolve(config.targetFolder);
var targetFolderWithcrosswalk = targetFolder + '_withCrosswalk';


if (fs.existsSync(targetFolder) || fs.existsSync(targetFolderWithcrosswalk) ) {
    console.log('Directory "' + targetFolder + '" and/or "' + targetFolderWithcrosswalk + '" already exists. Delete it or rename it, then try again.');
    shelljs.exit(1);
}


console.log('Creating ' + config.appName + ' project.');

// If an error occurs, stop execution.
shelljs.config.fatal = true;

var isWindows = osType.indexOf('Win') === 0;


// Because the path separator is a backslash on windows, it needs to be doubly escaped.
// Since the seperator on OSX is a forward slash, the call to string.replace shouldn't affect it there.
shelljs.exec('cordova create ' + targetFolder + ' ' + config.packageName + ' "' + config.appName + '" "{\\"plugin_search_path\\":\\"' + path.join(sdk_root, 'plugins').replace(/\\/g,"\\\\") + '\\"}" --copy-from=' + path.join('assets','www').replace(/\\/g,"\\\\"));

if (useCrosswalkForAndroid) {
    shelljs.exec(path.join(config.crosswalkLocation, 'create') + ' ' + [targetFolderWithcrosswalk, config.packageName, config.appName].join(' '));
    shelljs.cp('-Rf', path.join('assets','www', '*'), path.join(targetFolderWithcrosswalk, 'assets', 'www'));  
	shelljs.cp('-f', path.join('assets', 'sap-supportability.properties'), path.join(targetFolderWithcrosswalk, 'assets')); 
}

shelljs.pushd(targetFolder);


if (!useCrosswalkForAndroid) {
    console.log('Adding platforms...');
    console.log(config.platforms.join(' '));
    shelljs.exec('cordova platform add ' + config.platforms.join(' '));
} else {
    if (haveIosPlatform) { //ios + android with crosswalk
        console.log('ios platform added. Android with crosswalk project was particularly created.');
        shelljs.exec('cordova platform add ' + 'ios');
    } else {
        console.log('No platforms added. Android with crosswalk project was particularly created.');
    }
} 


console.log('Adding SAP plugins...');

var plugins = [
    path.join(sdk_root,'plugins','logon'),
    path.join(sdk_root,'plugins','logger'),
    path.join(sdk_root,'plugins','apppreferences'),
    path.join(sdk_root,'plugins','settings'),
    path.join(sdk_root,'plugins','authproxy'),
    path.join(sdk_root,'plugins','online'),
    path.join(sdk_root,'plugins','toolbar'),
    path.join(sdk_root,'plugins','cachemanager'),
    path.join(sdk_root,'plugins','encryptedstorage'),
    path.join(sdk_root,'plugins','e2etrace'),
    path.join(sdk_root,'plugins','barcodescanner'),
    path.join(sdk_root,'plugins','fioriclient'),
    path.join(sdk_root,'plugins','attachmentviewer'),
    path.join(sdk_root,'plugins','calendar'),
    path.join(sdk_root,'plugins','print'),
    path.join(sdk_root,'plugins','voicerecording'),
    'org.apache.cordova.camera@0.3.5',
    'org.apache.cordova.contacts@0.2.16',
    'org.apache.cordova.file@1.3.3',
    'org.apache.cordova.geolocation@0.3.12',
    'org.apache.cordova.statusbar@0.1.10',
    'org.apache.cordova.splashscreen@0.3.0',
    'org.apache.cordova.network-information@0.2.14',
    'org.apache.cordova.media-capture@0.3.6',
    'org.apache.cordova.media@0.2.16'
];

if ( (useCrosswalkForAndroid == false && haveAndroidPlatform) || haveIosPlatform) {
    shelljs.exec('cordova plugin add ' + plugins.join(' ') + " --searchpath " + path.join(sdk_root, 'plugins'));  
}

if (useCrosswalkForAndroid) {
    console.log('add plugins for Android with crosswalk project ...')
    shelljs.cd(targetFolderWithcrosswalk);
    plugins.forEach(function (plugin, index) {
        shelljs.exec('plugman install --platform android --project . --plugin ' + plugin + " --searchpath " + path.join(sdk_root, 'plugins'));
    });
    shelljs.cd(targetFolder);
}


// Copy in custom assets
console.log('Copying assets');

if( haveIosPlatform ) {
	shelljs.cp('-f', path.join(__dirname, 'assets', 'Root.plist'), path.join('platforms', 'ios', config.appName, 'Resources', 'Settings.bundle', 'Root.plist'));
    shelljs.cp('-Rf', path.join(__dirname, 'assets', 'ios', 'icons', '*'), path.join('platforms', 'ios', config.appName, 'Resources', 'icons'));
    shelljs.cp('-Rf', path.join(__dirname, 'assets', 'ios', 'splash', '*'), path.join('platforms', 'ios', config.appName, 'Resources', 'splash'));

}
if ( haveAndroidPlatform ) {
	if (!useCrosswalkForAndroid) {
		shelljs.cp('-f', path.join(__dirname, 'assets', 'sap-supportability.properties'), path.join('platforms', 'android', 'assets'));
	}
	
    if (useCrosswalkForAndroid) {
        shelljs.cd(targetFolderWithcrosswalk);
    }
    var res = !useCrosswalkForAndroid ? path.join('platforms', 'android', 'res') : 'res';
    
    shelljs.cp('-Rf', path.join(__dirname, 'assets', 'android', '*'), path.join(res));

    if (useCrosswalkForAndroid) {
        shelljs.cd(targetFolder);
    }
}

// Update appConfig.js, assigning packageName to appID
var assignedAppID = '"appID": "' + config.packageName + '",';
var appConfigPath = path.join('www', 'appConfig.js');

if ( (useCrosswalkForAndroid == false && haveAndroidPlatform) || haveIosPlatform) {
    shelljs.sed('-i','"appID": "",',assignedAppID, appConfigPath);
}

if (useCrosswalkForAndroid) {
    shelljs.cd(targetFolderWithcrosswalk);
    shelljs.sed('-i','"appID": "",',assignedAppID, path.join('assets', appConfigPath));
    shelljs.cd(targetFolder);
} 

if (!useCrosswalkForAndroid) {
    console.log('Preparing...');
    shelljs.exec('cordova prepare');
} else {
    if (haveIosPlatform) { //ios + android with crosswalk
        console.log('Preparing for iOS ...');
        shelljs.exec('cordova prepare ios');
    } else {
        console.log('Preparing is not necessary for Android with crosswalk project.');
    }
}

if (haveAndroidPlatform) {
    var configxmlPath = path.join('res','xml','config.xml');
    if (!useCrosswalkForAndroid) {
        configxmlPath = path.join('platforms','android',configxmlPath);
    } else {
        shelljs.cd(targetFolderWithcrosswalk);    
    }

    shelljs.sed('-i','preference name="SAPKapselHandleHttpRequests" value="false"', 'preference name="SAPKapselHandleHttpRequests" value="true"', configxmlPath);

    if (useCrosswalkForAndroid) {
        shelljs.cd(targetFolder);
    }
}

if ( haveAndroidPlatform ) { 
    var manifestPath = !useCrosswalkForAndroid ? path.join('platforms', 'android', 'AndroidManifest.xml') : 'AndroidManifest.xml';

    if (useCrosswalkForAndroid) {
        shelljs.cd(targetFolderWithcrosswalk);
    }
	// Update the Android manifest to display toolbar.
	shelljs.sed('-i','android:theme="@android:style/Theme.Black.NoTitleBar"','android:theme="@android:style/Theme.Holo.Light"', manifestPath);
	shelljs.sed('-i','android:minSdkVersion="10"','android:minSdkVersion="11"', manifestPath);

    if (useCrosswalkForAndroid) {
        shelljs.cd(targetFolder);
    }
}

if( haveIosPlatform ) {
    // Set url schema for iOS
    var urlTypes = "\t<key>CFBundleURLTypes</key>\
    	\n\t<array>\
    	\n\t\t<dict>\
    	\n\t\t<key>CFBundleURLName</key>\
    	\n\t\t<string>" + config.packageName + "</string>\
    	\n\t\t<key>CFBundleURLSchemes</key>\
    	\n\t\t<array>\
    	\n\t\t\t<string>" + config.packageName + "</string>\
    	\n\t\t</array>\
    	\n\t\t</dict>\
    	\n\t</array>"

    shelljs.sed('-i','<dict>', "<dict>\n" + urlTypes, path.join("platforms", "ios", config.appName, config.appName + "-Info.plist"));
}

shelljs.popd();


console.log('App created in the ' + targetFolder + ' directory.');
var locationOfAppConfig = path.join('www', 'appConfig.js');

if (!useCrosswalkForAndroid)
{
    console.log('Make sure that you navigate to ' + targetFolder + path.sep + locationOfAppConfig + ' and enter your application settings, then run \'cordova prepare\'.');
}
