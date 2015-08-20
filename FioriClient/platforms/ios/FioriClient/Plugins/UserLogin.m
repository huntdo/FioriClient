//
//  UserLogin.m
//  FioriClient
//
//  Created by Hunt Do on 8/19/15.
//
//

#import "UserLogin.h"
#import "FioriDataStore.h"
#import "FioriNetworking.h"
#import "MBProgressHUD.h"

@interface UserLogin () <UIWebViewDelegate>

@property (strong, nonatomic) MBProgressHUD *jabbaTheHud;
@property (strong, nonatomic) CDVInvokedUrlCommand *loginCommand;

@end

@implementation UserLogin

//********************************************************************************//
#pragma mark - Store information

-(void)saveURLIntoStore:(CDVInvokedUrlCommand*)command {
    
    NSString *url = [[command.arguments objectAtIndex:0] stringValue];
    [FioriDataStore sharedDataStore].url = url;
    
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

-(void)getURLFromStore:(CDVInvokedUrlCommand*)command {
    
    NSString *url = [FioriDataStore sharedDataStore].url;
    
    if (url) {
        
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:url] callbackId:command.callbackId];
    }
    else {
        
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT] callbackId:command.callbackId];
    }
}

-(void)saveAccountIntoStore:(CDVInvokedUrlCommand*)command {
    
    NSString *userName = [[command.arguments objectAtIndex:0] stringValue];
    NSString *pass = [[command.arguments objectAtIndex:1] stringValue];
    
    [FioriDataStore sharedDataStore].userName = userName;
    [FioriDataStore sharedDataStore].password = pass;
    
    //-- call back
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

-(void)getAccountFromStore:(CDVInvokedUrlCommand*)command {
    
    NSString *userName = [FioriDataStore sharedDataStore].userName;
    NSString *pass = [FioriDataStore sharedDataStore].password;
    
    NSDictionary *dictAccount = [NSDictionary dictionaryWithObjectsAndKeys:userName, @"user_name", pass, @"password", nil];
    
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:dictAccount] callbackId:command.callbackId];
}


//********************************************************************************//
#pragma mark - Login

-(void)login:(CDVInvokedUrlCommand*)command
{
    self.loginCommand = command;
    
    NSString *userName = [FioriDataStore sharedDataStore].userName;
    NSString *pass = [FioriDataStore sharedDataStore].password;
    NSString *url = [FioriDataStore sharedDataStore].url;
    
    [self loginAttemptWithUsername:userName andPassword:pass forURL:url];
    
}

- (void) loginAttemptWithUsername:(NSString *)username
                      andPassword:(NSString *)password
                           forURL:(NSString *)urlString {
    
    dispatch_async(dispatch_get_main_queue(), ^{
        
        self.jabbaTheHud = [MBProgressHUD showHUDAddedTo:self.webView animated:YES];
        self.jabbaTheHud.mode = MBProgressHUDModeIndeterminate;
        self.jabbaTheHud.labelText = @"Loading...";
        
    });
    
    [[[FioriNetworking alloc] init] openFioriWebView:self.webView
                                    forBaseURLString:urlString
                                        withUsername:username
                                         andPassword:password
                                          completion:^(bool didLogin, bool rightURL, NSString *redirectedURL) {
        
        if (!rightURL) {
            
            [self.jabbaTheHud hide:YES];
            
            UIAlertView *newAlertView = [[UIAlertView alloc] initWithTitle:@"No URL"
                                                                   message:@"No URL Found on server, or locally. Please provide a working Fiori URL:"
                                                                  delegate:self
                                                         cancelButtonTitle:@"Cancel"
                                                         otherButtonTitles:@"Enter", nil];
            
            newAlertView.alertViewStyle = UIAlertViewStylePlainTextInput;
            newAlertView.tag = 0;
            [newAlertView show];
            return;
        }
        
        //EA-948
      //  [FioriDataStore sharedDataStore][@"url"] = urlString;
        
        if (!didLogin) {
            
            [self.jabbaTheHud hide:YES];
            
            if ([username isEqualToString:@""] || username == nil) {
                
                UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"Please Enter Credentials"
                                                                    message:@"Please Enter Fiori Credentials"
                                                                   delegate:self
                                                          cancelButtonTitle:@"Cancel"
                                                          otherButtonTitles:@"Login", nil];
                
                alertView.alertViewStyle = UIAlertViewStyleLoginAndPasswordInput;
                alertView.tag = 1;
                [alertView show];
                
            } else {
                UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"Invalid Credentials"
                                                                    message:@"Received Invalid Credentials"
                                                                   delegate:self
                                                          cancelButtonTitle:@"Cancel"
                                                          otherButtonTitles:@"Try Again", nil];
                
                alertView.alertViewStyle = UIAlertViewStyleLoginAndPasswordInput;
                alertView.tag = 1;
                [alertView show];
            }
            //            [[alertView textFieldAtIndex:0] setText:[FioriDataStore sharedDataStore][@"username"]];
            return;
            
        }
        if (rightURL && didLogin) {
            self.webView.delegate = self;
            
            //-- send callback
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:redirectedURL] callbackId:self.loginCommand.callbackId];
        }
    }];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex {
    
    if (alertView.tag == 0) {
        
        //No URL
        if (alertView.cancelButtonIndex == buttonIndex) {
            
            UIAlertView *newAlertView = [[UIAlertView alloc] initWithTitle:@"No URL"
                                                                   message:@"No URL Found on server, or locally. Please provide a working Fiori URL:"
                                                                  delegate:nil
                                                         cancelButtonTitle:@"Cancel"
                                                         otherButtonTitles:@"Enter", nil];
            
            newAlertView.alertViewStyle = UIAlertViewStylePlainTextInput;
            newAlertView.tag = 0;
            [newAlertView show];
            
        } else {
            
            [self loginAttemptWithUsername:[FioriDataStore sharedDataStore].userName
                               andPassword:[FioriDataStore sharedDataStore].password
                                    forURL:[NSString stringWithFormat:@"%@", [[alertView textFieldAtIndex:0] text]]];
        }
    }
    
    if (alertView.tag == 1) {
        
        if (alertView.cancelButtonIndex == buttonIndex) {
            
            UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"Invalid Credentials"
                                                                message:@"Received Invalid Credentials"
                                                               delegate:self
                                                      cancelButtonTitle:@"Cancel"
                                                      otherButtonTitles:@"Try Again", nil];
            
            [[alertView textFieldAtIndex:0] setText:[FioriDataStore sharedDataStore].userName];
            alertView.alertViewStyle = UIAlertViewStyleLoginAndPasswordInput;
            alertView.tag = 1;
            [alertView show];
            
        } else {
            
            [self loginAttemptWithUsername:[[alertView textFieldAtIndex:0] text]
                               andPassword:[[alertView textFieldAtIndex:1] text]
                                    forURL:[FioriDataStore sharedDataStore].url];
            
            NSLog(@"CREDENTIALS ENTERED username:%@ pass:%@", [alertView textFieldAtIndex:0], [alertView textFieldAtIndex:1]);
        }
    }
}

- (BOOL)webView:(UIWebView *)webView
        shouldStartLoadWithRequest:(NSURLRequest *)request
                    navigationType:(UIWebViewNavigationType)navigationType {
    
    NSString *requestURLasString = [NSString stringWithFormat:@"%@", request.URL];
    NSLog(@"STARTED LOADING REQUEST: %@", requestURLasString);
    NSString *endOfRequestURL = [requestURLasString lastPathComponent];
    
    if ([endOfRequestURL isEqualToString:@"logoff"]) {
        [[FioriDataStore sharedDataStore] clearData];
        NSURLRequest *req = [[NSURLRequest alloc] initWithURL:[NSURL URLWithString:@"about:blank"]];
        [self.webView loadRequest:req];
        
        //-- send callback
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsString:@""] callbackId:self.loginCommand.callbackId];
    }
    return YES;
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    
    NSString *requestURLasString = [NSString stringWithFormat:@"%@", webView.request.URL];
    NSString *endOfRequestURL = [requestURLasString lastPathComponent];
    NSLog(@"FINISHED LOADING REQUEST: %@", requestURLasString);
    
    if ([requestURLasString isEqualToString:@"about:blank"]) {
        [self loginAttemptWithUsername:@"" andPassword:@"" forURL:[FioriDataStore sharedDataStore].url];
    }
    
    if ([endOfRequestURL isEqualToString:@"logoff"]) {
        
        [[FioriDataStore sharedDataStore] clearData];
        NSURLRequest *req = [[NSURLRequest alloc] initWithURL:[NSURL URLWithString:@"about:blank"]];
        [self.webView loadRequest:req];
       
        //-- send callback
        [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_NO_RESULT messageAsString:@""] callbackId:self.loginCommand.callbackId];
    }
    [self.jabbaTheHud hide:YES];
}

- (void) dismiss:(UIAlertView *)alert {
    
    [alert dismissWithClickedButtonIndex:0 animated:YES];
    exit(0);
}


@end
