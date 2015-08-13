//
//  FioriDataStore.m
//  FioriExampleApp
//
//  Created by Michael Voznesensky on 1/5/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#import "FioriDataStore.h"
#import <Security/Security.h>
#import "FioriLog.h"

@interface FioriDataStore ()

@property (strong, nonatomic) NSMutableDictionary *dataStore;

@end

@implementation FioriDataStore

+ (instancetype) sharedDataStore {
    static dispatch_once_t dispatch = 0;
    static FioriDataStore *_sharedDataStore = nil;
    dispatch_once(&dispatch, ^{
        _sharedDataStore = [[self alloc] init];
        if (_sharedDataStore.dataStore == nil) {
            _sharedDataStore.dataStore = [[NSMutableDictionary alloc] init];
        }
    });
    return _sharedDataStore;
}

- (void)setObject:(id)obj forKeyedSubscript:(NSString<NSCopying> *)key {
    if (!obj) {
        self.dataStore[key] = @"";
        return;
    }
    self.dataStore[key] = obj;
}

- (id)objectForKeyedSubscript:(NSString<NSCopying> *)key {
    FLog(@"self.datastore: %@", self.dataStore);
    return self.dataStore[key];
}

- (void) commit {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"fioriCredentials" object:nil userInfo:self.dataStore];
}


- (void) clear {
    self.dataStore[@"username"] = @"";
    self.dataStore[@"password"] = @"";
    [self commit];
}


@end
