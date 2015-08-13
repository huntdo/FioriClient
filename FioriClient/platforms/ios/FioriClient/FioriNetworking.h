//
//  FioriNetworking.h
//  FioriExampleApp
//
//  Created by Michael Voznesensky on 1/5/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "UIKit/UIKit.h"

@interface FioriNetworking : NSObject
- (void) openFioriWebView:(UIWebView *)webView forBaseURLString:(NSString *)URLString withUsername:(NSString *)username andPassword:(NSString *)password completion:(void (^)(bool didLogin, bool rightURL))finishBlock;
@end
