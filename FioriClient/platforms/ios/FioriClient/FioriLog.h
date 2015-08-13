//
//  FioriLog.h
//  FioriExampleApp
//
//  Created by Sinbad Flyce on 7/24/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#ifndef __FioriLog_h__
#define __FioriLog_h__

#ifdef DEBUG
#define FLog(...) NSLog(__VA_ARGS__)
#else
#define FLog(...)
#endif

#endif
