//
//  UserLogin.h
//  FioriClient
//
//  Created by Hunt Do on 8/19/15.
//
//

#import <Cordova/CDVPlugin.h>
#import <UIKit/UIKit.h>

@interface UserLogin : CDVPlugin

/**
 *  Normal user performs login to Fiori app
 *
 *  @param command
 */
-(void)login:(CDVInvokedUrlCommand*)command;

/**
 *  get/save Fiori's url
 *
 *  @param command
 */
-(void)saveURLIntoStore:(CDVInvokedUrlCommand*)command;
-(void)getURLFromStore:(CDVInvokedUrlCommand*)command;

/**
 *  get/save username and password
 *
 *  @param command
 */
-(void)saveAccountIntoStore:(CDVInvokedUrlCommand*)command;
-(void)getAccountFromStore:(CDVInvokedUrlCommand*)command;

@end
