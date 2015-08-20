//
//  FioriNetworking.m
//  FioriExampleApp
//
//  Created by Michael Voznesensky on 1/5/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#import "FioriNetworking.h"
#import "FioriDataStore.h"
#import "FioriPreProcessorConstants.h"
#import "FioriLog.h"

@interface FioriNetworking () <UIWebViewDelegate>

@end

@implementation FioriNetworking

- (void) openFioriWebView:(UIWebView *)webView
         forBaseURLString:(NSString *)URLString
             withUsername:(NSString *)username
              andPassword:(NSString *)password
               completion:(void (^)(bool didLogin, bool rightURL, NSString *redirectedURL))finishBlock {
    
//--    [self wipeFiori];
    
    if (!username || [username isEqualToString:@""]) {
        username = [FioriDataStore sharedDataStore].userName;
        if (!username || [username isEqualToString:@""]) {
            dispatch_async(dispatch_get_main_queue(), ^{
                FLog(@"NO LOGIN");
                finishBlock(false, true, nil);
            });
            return;
        }
    }
    if (!password || [password isEqualToString:@""]) {
        password = [FioriDataStore sharedDataStore].password;
        if (password == nil || [password isEqualToString:@""]) {
            dispatch_async(dispatch_get_main_queue(), ^{
                FLog(@"NO LOGIN");
                finishBlock(false, true, nil);
            });
            return;
        }
    }
    
    NSURL *url = [NSURL URLWithString:URLString];

    [FioriDataStore sharedDataStore].url = URLString;
    NSString *postString = [[NSString alloc] init];
    NSURL *redirectURL = nil;
    
    postString = [self getFioriDataFromURL:url withUsername:username andPassword:password redirectUrl:&redirectURL];
    if (!postString) {
        FLog(@"POSTRING FAILURE");
        finishBlock(false, false, nil);
        return;
    }
    FLog(@"URL + CREDENTIALS CORRECT");
    url = redirectURL != nil ? redirectURL : url;
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    [request addValue:@"application/x-www-form-urlencoded" forHTTPHeaderField:@"Content-Type"];
    [request setHTTPBody:[postString dataUsingEncoding:NSUTF8StringEncoding]];
    [request setHTTPMethod:@"POST"];
    FLog(@"SENDING OFF FIRST POST");
    [NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
        FLog(@"RECIEVED FIRST POST");
        NSString *contents = [NSString stringWithUTF8String:[data bytes]];
        NSString *secondxsrf = [self getValueFromHTMLField:contents fieldName:@"sap-login-XSRF"];
        NSString *url_scheme = [self getValueFromHTMLField:contents fieldName:@"sap-urlscheme"];
        NSString *client_scheme = [self getValueFromHTMLField:contents fieldName:@"sap-system-login"];
        
        if (client_scheme && client_scheme.length > 0 ) {
            dispatch_async(dispatch_get_main_queue(), ^{
                finishBlock(false, true, nil);
            });
        } else {
            NSURL *getURL = [NSURL URLWithString:[NSString stringWithFormat:@"%@%@", url, FIORI_POSTFIX]];
            NSMutableURLRequest *getRequest = [NSMutableURLRequest requestWithURL:getURL];
            FLog(@"LOAD THE PAGE");
            [getRequest setHTTPMethod:@"GET"];
            
            [FioriDataStore sharedDataStore].userName = username;
            [FioriDataStore sharedDataStore].password = password;
            [FioriDataStore sharedDataStore].url = URLString;
           // [[FioriDataStore sharedDataStore] commit];
            
            dispatch_async(dispatch_get_main_queue(), ^{
                
                [webView loadRequest:getRequest];
            
                finishBlock(true, true, getURL.absoluteString);
            });
        }
    }];
}
- (void) wipeFiori {
    [FioriDataStore sharedDataStore].userName = nil;
    [FioriDataStore sharedDataStore].password = nil;
    [FioriDataStore sharedDataStore].url = nil;
   // [[FioriDataStore sharedDataStore] commit];

}
- (NSString *) pullFioriLocalConfigWithUsername:(NSString *)username andPassword:(NSString *)password {
    
    NSString *xsrf = [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-login-XSRF"];
    NSString *urlScheme = [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-urlscheme"];
    NSString *systemLogin = [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-system-login"];
    NSString *basicAuth= [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-system-login-basic_auth"];
    NSString *accesibility = [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-accessibility"];
    NSString *cookiesDisabled = [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-system-login-cookie_disabled"];
    NSString *sapClient = [[FioriDataStore sharedDataStore] objectForKeyedSubscript:@"sap-client"];
    
    NSString *postString = @"";
    
    if (xsrf.length > 1) {
        
        postString = [NSString stringWithFormat:@"sap-system-login-oninputprocessing=%@&sap-urlscheme=%@&sap-system-login=%@&sap-system-login-basic_auth=%@&sap-client=%@&sap-language=EN&sap-accessibility=%@&sap-login-XSRF=%@&sap-system-login-cookie_disabled=%@&sap-user=%@&sap-password=%@", systemLogin?systemLogin:@"", urlScheme?urlScheme:@"", systemLogin?systemLogin:@"", basicAuth?basicAuth:@"", sapClient, accesibility?accesibility:@"", [self urlencode:xsrf], cookiesDisabled?cookiesDisabled:@"", username, password];

    } else {
        
         postString = [NSString stringWithFormat:@"sap-user=%@&sap-password=%@", username, password];
    }
    return postString;
}

- (NSString *) getFioriDataFromURL:(NSURL *)url
                      withUsername:(NSString *)username
                       andPassword:(NSString *)password
                       redirectUrl:(NSURL ** )redirectURL
{
    NSURLRequest * urlRequest = [NSURLRequest requestWithURL:url];
    NSHTTPURLResponse * response = nil;
    NSError * error = nil;
    FLog(@"SYNCHRONIOUS GET OF FIORI DATA STARTED");
    NSData * data = [NSURLConnection sendSynchronousRequest:urlRequest
                                          returningResponse:&response
                                                      error:&error];
    FLog(@"SYNCHRONIOUS GET OF FIORI DATA FINISHED");
    NSString *str = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    
    
    if (!str || [str isEqualToString:@""]) {
        return nil;
    }

    NSString *xsrf = [self getValueFromHTMLField:str fieldName:@"sap-login-XSRF"];
    [[FioriDataStore sharedDataStore] setObject:[self getValueFromHTMLField:str fieldName:@"sap-urlscheme"] forKeyedSubscript:@"sap-urlscheme"];
    [[FioriDataStore sharedDataStore] setObject:[self getValueFromHTMLField:str fieldName:@"sap-system-login"] forKeyedSubscript:@"sap-system-login"];
    [[FioriDataStore sharedDataStore] setObject:[self getValueFromHTMLField:str fieldName:@"sap-system-login-basic_auth"] forKeyedSubscript:@"sap-system-login-basic_auth"];
    [[FioriDataStore sharedDataStore] setObject:[self getValueFromHTMLField:str fieldName:@"sap-accessibility"] forKeyedSubscript:@"sap-accessibility"];
    [[FioriDataStore sharedDataStore] setObject:[self getValueFromHTMLField:str fieldName:@"sap-system-login-cookie_disabled"] forKeyedSubscript:@"sap-system-login-cookie_disabled"];
    [[FioriDataStore sharedDataStore] setObject:[self getValueFromHTMLField:str fieldName:@"sap-client"] forKeyedSubscript:@"sap-client"];
    
    [[FioriDataStore sharedDataStore] setObject:[xsrf stringByReplacingOccurrencesOfString:@"&#x3d;" withString:@"="] forKeyedSubscript:@"sap-login-XSRF"];
    
    [FioriDataStore sharedDataStore].userName = username;
    if (redirectURL) *redirectURL = response.URL;
    return  [self pullFioriLocalConfigWithUsername:username andPassword:password];
}

-(NSString *)getValueFromHTMLField:(NSString *)htmlPage fieldName:(NSString *)fieldName
{
    NSString *ret = nil;
    if ( fieldName && htmlPage ) {
        NSString *searchField = [NSString stringWithFormat:@"name=\"%@\"", fieldName];
        if ( searchField ) {
            NSUInteger start = [htmlPage rangeOfString:searchField].location;
            if ( start > 0 && start != NSNotFound ) {
                start += searchField.length;
                NSString *subString = [htmlPage substringFromIndex:start];
                if ( subString ) {
                    NSUInteger valueStart = [subString rangeOfString:@"value=\""].location;
                    if ( valueStart > 0 && valueStart != NSNotFound ) {
                        NSString *theValue = [subString substringFromIndex:valueStart+@"value=\"".length];
                        if ( theValue ) {
                            NSUInteger endQuote = [theValue rangeOfString:@"\""].location;
                            if ( endQuote > 0 && endQuote != NSNotFound ) {
                                ret = [theValue substringToIndex:endQuote];
                            }
                        }
                    }
                }
            }
        }
    }
    return ret;
}
- (NSString *)urlencode:(NSString *)str {
    
    NSMutableString *output = [NSMutableString new];
    const unsigned char *source = (const unsigned char *)[str UTF8String];
    unsigned long sourceLen = (source == NULL)? 0:strlen((const char *)source);
    for (int i = 0; i < sourceLen; ++i) {
        const unsigned char thisChar = source[i];
        if (thisChar == ' '){
            [output appendString:@"+"];
        } else if (thisChar == '.' || thisChar == '-' || thisChar == '_' || thisChar == '~' ||
                   (thisChar >= 'a' && thisChar <= 'z') ||
                   (thisChar >= 'A' && thisChar <= 'Z') ||
                   (thisChar >= '0' && thisChar <= '9')) {
            [output appendFormat:@"%c", thisChar];
        } else {
            [output appendFormat:@"%%%02X", thisChar];
        }
    }
    return output;
}

- (BOOL)webView:(UIWebView *)webView
            shouldStartLoadWithRequest:(NSURLRequest *)request
                        navigationType:(UIWebViewNavigationType)navigationType {
    
    FLog(@"Request is to: %@", request.URL);
    
    return YES;
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    
    [webView sizeToFit];
}

@end
