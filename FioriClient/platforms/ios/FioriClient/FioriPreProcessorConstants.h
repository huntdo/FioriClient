//
//  FioriPreProcessorConstants.h
//  FioriExampleApp
//
//  Created by Michael Voznesensky on 1/5/15.
//  Copyright (c) 2015 OpenPeak. All rights reserved.
//

#ifndef FioriExampleApp_FioriPreProcessorConstants_h
#define FioriExampleApp_FioriPreProcessorConstants_h

#ifdef FIORI_LAUNCHPAD
#define FIORI_POSTFIX @"#"

#elif MY_TIMESHEET
#define FIORI_POSTFIX @"#TimeEntry-createTimeEntry"

#elif APPROVE_LEAVE_REQUEST
#define FIORI_POSTFIX @"#LeaveRequest-approveLeaveRequest"

#elif APPROVE_PURCHASE_ORDER
#define FIORI_POSTFIX @"#PurchaseOrder-approve"

#elif PURCHASE_ORDER_FROM_REQUISITION
#define FIORI_POSTFIX @"#PurchaseRequisition-process"

#elif CREATE_SALES_ORDER
#define FIORI_POSTFIX @"#SalesOrder-create"

#elif TRACK_SALES_ORDER
#define FIORI_POSTFIX @"#SalesOrder-track"

#elif MY_TRAVEL_REQUESTS
#define FIORI_POSTFIX @"#TravelRequest-create"

#elif MY_LEAVE_REQUESTS
#define FIORI_POSTFIX @"#LeaveRequest-createLeaveRequest"

#elif APPROVE_TRAVEL_EXPENSES
#define FIORI_POSTFIX @"TravelExpense-approve"

#elif SHOPPING_CART
#define FIORI_POSTFIX @"#"



#endif
#endif
