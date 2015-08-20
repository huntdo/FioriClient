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

#define kUserName   @"userName"
#define kPassword   @"password"
#define kURL        @"fioriUrl"

#define kOthersKey   @"othersKey"


#define Store [NSUserDefaults standardUserDefaults]

@interface FioriDataStore ()

@property (strong, nonatomic) NSMutableDictionary *dataStore;

@end

@implementation FioriDataStore

@synthesize userName = _userName, password = _password, url =_url;

+ (instancetype) sharedDataStore {
    
    static dispatch_once_t dispatch = 0;
    static FioriDataStore *_sharedDataStore = nil;
    
    dispatch_once(&dispatch, ^{
        
        _sharedDataStore = [[self alloc] init];
        if (_sharedDataStore) {
            
            _sharedDataStore = [FioriDataStore new];
        }
    });
    
    return _sharedDataStore;
}

- (id)init {
    
    self = [super init];
   
    if (self) {
        
        @try {
            
            self.dataStore = [Store objectForKey:kOthersKey];
            
            if (!self.dataStore)
                self.dataStore = [[NSMutableDictionary alloc] init];
        }
        @catch (NSException *exception) {
            
            if (!self.dataStore)
                self.dataStore = [[NSMutableDictionary alloc] init];
            
            NSLog(@"Exception: %@", [exception description]);
        }
    }
    
    return self;
}


- (void)setObject:(id)obj forKeyedSubscript:(NSString<NSCopying> *)key {
   
    if (!obj) {
        
        [self.dataStore removeObjectForKey:key];
    }
    self.dataStore[key] = obj;
    
    [Store setObject:self.dataStore forKey:kOthersKey];
    [Store synchronize];
}

- (id)objectForKeyedSubscript:(NSString<NSCopying> *)key {

    return self.dataStore[key];
}

- (void)removeObjectForKeyedSubscript:(NSString<NSCopying> *)key {
    
    [self.dataStore removeObjectForKey:key];
    [Store setObject:self.dataStore forKey:kOthersKey];
    [Store synchronize];
    
}

//********************************************************************************//
#pragma mark - setter/getters


- (NSString *)userName {
    
    _userName = [Store objectForKey:kUserName];
    return _userName;
}

- (void)setUserName:(NSString *)userName {
    
    _userName = userName;
    [Store setObject:userName forKey:kUserName];
    [Store synchronize];
}

- (NSString *)password {
    
    _password = [Store objectForKey:kPassword];
    return _password;
}

- (void)setPassword:(NSString *)password {
    
    _password = password;
    [Store setObject:password forKey:kPassword];
    [Store synchronize];
}

- (NSString *)url {
    
    _url = [Store objectForKey:kURL];
    return _url;
}

- (void)setUrl:(NSString *)url {
    
    _url = url;
    [Store setObject:url forKey:kPassword];
    [Store synchronize];
}

- (void)saveUserName:(NSString *)userName password:(NSString *)password {
    
    self.userName = userName;
    self.password = password;
}

- (void)saveURLFiori:(NSString *)url {
    
    self.url = url;
}

- (void) clearData {
  
    self.userName = nil;
    self.password = nil;
    self.url = nil;
    
}


@end
