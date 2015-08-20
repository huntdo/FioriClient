//
//  FioriDataStore.h
//  FioriExampleApp
//
//  Created by HuntDo on 19/8/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface FioriDataStore : NSObject

+ (instancetype) sharedDataStore;

@property (nonatomic, strong) NSString *userName;
@property (nonatomic, strong) NSString *password;
@property (nonatomic, strong) NSString *url;

- (void)saveUserName:(NSString *)userName password:(NSString *)password;
- (void)saveURLFiori:(NSString *)url;

- (id)objectForKeyedSubscript:(id <NSCopying>)key;
- (void)setObject:(id)obj forKeyedSubscript:(id <NSCopying>)key;

- (void)removeObjectForKeyedSubscript:(NSString<NSCopying> *)key;
- (void)clearData;

@end
