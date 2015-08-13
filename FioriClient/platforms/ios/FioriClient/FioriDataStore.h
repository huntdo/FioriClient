//
//  FioriDataStore.h
//  FioriExampleApp
//
//  Created by Michael Voznesensky on 1/5/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface FioriDataStore : NSObject

+ (instancetype) sharedDataStore;

- (id) objectForKeyedSubscript:(id <NSCopying>)key;
- (void) setObject:(id)obj forKeyedSubscript:(id <NSCopying>)key;
- (void) commit;
- (void) clear;

@end
