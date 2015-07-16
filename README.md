SAP Fiori Client
================
The SAP Fiori Client is a native mobile application runtime container for SAP Fiori built using Kapsel plugins. The SAP Fiori Client provides access to native device functionality via plugins such as the ability to scan a barcode, take a picture, access the calendar, print or take a voice recording as well as providing the ability to use enterprise services of the SMP server. 

This document describes how to setup the development environment and use the script to create an instance of the SAP Fiori Client. For additional details see [http://scn.sap.com/docs/DOC-56080](http://scn.sap.com/docs/DOC-56080 "SAP Fiori Client in Getting Started with Kapsel"), [http://help.sap.com/fiori-client](http://help.sap.com/fiori-client "SAP Fiori Client"), or [http://help.sap.com/saphelp_smp308sdk/helpdata/en/b2/99923cc0b94400acab320c812cc026/content.htm](http://help.sap.com/saphelp_smp308sdk/helpdata/en/b2/99923cc0b94400acab320c812cc026/content.htm "SAP Fiori Client in SAP Mobile Platform")


Requirements
------------
The SAP Fiori Client script supports the Android and iOS operating systems.

In order to create the SAP Fiori Client application, you will need access to a properly configured Cordova development environment.

For the iOS version of the application, the environment should include an installation of the latest compatible version of the Xcode IDE.

For the Android version of the application, the environment should include an installation of the latest compatible version of the Android Developer Tools (ADT) as well as Apache Ant (http://ant.apache.org/).  You must modify the system’s environment to add the Ant bin folder as well as the ADT sdk\tools and sdk\platform-tools folders to the system path.

With the platform SDKs installed, you will also need a functional Cordova development environment. To install a Cordova development, perform the following steps:

1.	Install Git (http://git-scm.com/)
2.	Install node.js (http://nodejs.org/)
3.	Install Apache Cordova (instructions below)
		
To install Cordova, the command will differ depending on whether the development environment is running Windows or Macintosh OS X. 

On Windows, open a terminal window and issue the following command:

	npm install -g cordova@4.2.0

For Macintosh OS X, open a terminal window and issue the following command:

	sudo npm install -g cordova@4.2.0

Finally, install the SMP SDK using the installation settings appropriate for your environment (since you're reading this document, it's assumed this step has already been completed).

The SAP Fiori Client script will add several Cordova plugins to the project. If you are running in a corporate environment with a proxy, you may need to change the proxy settings for git, npm and plugman depending on your environment. To do this, open a terminal window and execute the following commands:

	git config --global http.proxy http://PROXY_ADDRESS[:port]
	git config --global https.proxy http://PROXY_ADDRESS[:port]
	npm config set proxy http://PROXY_ADDRESS[:port]
	npm config set https-proxy http://PROXY_ADDRESS[:port]

You will need to substitute the correct proxy server address (and optionally port) for PROXY_ADDRESS[:port] in the commands shown. For example, if your environment directs outbound traffic to a host called proxy using port 8080, you would use the following commands:

	git config --global http.proxy http://proxy:8080
	git config --global https.proxy http://proxy:8080
	npm config set proxy http://proxy:8080
	npm config set https-proxy http://proxy:8080

Create a file named 

	C:\Users\i82xxx\.plugman\config
 or
 
	/Users/i82xxx/.plugman/config

Its contents should be the proxy server such as 

	proxy=http://proxy.phl.sap.corp:8080

Creating the SAP Fiori Client Application
-----------------------------------------
To create an instance of the SAP Fiori Client application, you must follow the steps outlined in the sections that follow.

###Script Configuration
In order for the script to be able to operate correctly, it needs several pieces of information. Rather than require that all of the possible configuration options be passed to the script on the command line, settings are instead written to a configuration file and a path to the configuration file is passed to the script when it executes. This allows organizations to easily create multiple instances of the SAP Fiori Client application by simply passing different configuration files to the script.   

Open a terminal window then navigate to the SMP installation’s KapselSDK\apps\fiori_client folder. In the folder is the default configuration file, config.json. The file contents consist of a simple JSON object as shown below:

	{
		"packageName": "",
		"targetFolder": ""
		"appName": "",
		"platforms": ["ios", "android"],
	}

To configure the script, simply populate the different properties in the file using the following list as a guide:

+ packageName - Defines the unique package name for the Cordova application created by the script. The package name is how this particular application will be identified on mobile devices and in app stores. The package name is traditionally the application name bundled, in reverse domain order, with the creating company's internet domain name. So, if the developer's company name is companyname.com and an application called FioriClient was being created, the package name would be com.companyname.FioriClient. 

+ targetFolder - Specifies the target folder for the SAP Fiori Client application. Only a single folder name can be specified, and the folder cannot already exist within the Fiori Client script folder. The script will create the SAP Fiori Client application project in a sub-folder using the provided folder name.

+ appName - The title for the application being created by the script. The value provided here will appear on a target mobile device home screen as the name of the application. Both Android and iOS have limits restricting the length of this value.

+ platforms - a JavaScript array containing values specifying the target platforms for the mobile application. Available options are Android or iOS and at least one value must be provided.

The following is an example of a properly configured config.json file:

	{
		"packageName": "com.mycompany.FioriClient",
		"targetFolder": "fc_app",
		"appName": "Fiori",
		"platforms": ["ios", "android"]
	} 

Create one or more configuration files as needed for your environment.

For Android it is recommended to use [https://crosswalk-project.org/#documentation/about](https://crosswalk-project.org/#documentation/about "Crosswalk") to create the application.  The advantage to using crosswalk is that the webview will be the same Chromium webview on all Android devices instead of the Android Webview (which differs on each device according to the device version, and is known to have some issues).  To use Crosswalk, add the option "crosswalkLocation" to the config.json file and set the value to be the location of the bin folder of your Crosswalk download.

The following is an example of a config.json file that will use Crosswalk:

	{
		"packageName": "com.mycompany.FioriClient",
		"targetFolder": "FioriClient",
		"appName": "Fiori",
		"platforms": ["android"],
		"crosswalkLocation": "C:\\Crosswalk\\crosswalk-cordova-11.40.277.7-arm\\bin"
	}

###Executing the Script
With a configuration file in place, execute the following commands:

	npm install
	node create_fiori_client.js path_to_config_file

The first command installs any required npm modules used by the script. The second command executes the create_fiori_client.js JavaScript application ans tells the script which configuration file to use.to create the application project. The script will use the values provided in the configuration file to create a new Cordova project (in the specified target folder) and add all of the required components (Cordova and Kapsel plugins, copy over the application’s web application content).

The script performs a lot of steps, so expect the process to take some time. Because of all the things it does and the fact that some required components like the Cordova plugins are being retrieved from a remote location, the process may encounter problems and quit. Watch the terminal window output for any error messages. If you encounter any, you will need to fix the error and run the node script again.

** Note: The script cannot create a new project in an existing folder, so if you correct errors encountered by the script, you may need to delete the target folder before executing the command again.  