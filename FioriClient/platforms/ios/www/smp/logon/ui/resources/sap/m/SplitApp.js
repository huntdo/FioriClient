/*!
 * SAP UI development toolkit for HTML5 (SAPUI5/OpenUI5)
 * (c) Copyright 2009-2015 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['jquery.sap.global','./SplitContainer','./library'],function(q,S,l){"use strict";var a=S.extend("sap.m.SplitApp",{metadata:{library:"sap.m",properties:{homeIcon:{type:"any",group:"Misc",defaultValue:null}},events:{orientationChange:{parameters:{landscape:{type:"boolean"}}}}}});a.prototype.init=function(){if(S.prototype.init){S.prototype.init.apply(this,arguments)}this.addStyleClass("sapMSplitApp");q.sap.initMobile({viewport:!this._debugZoomAndScroll,statusBar:"default",hideBrowser:true,preventScroll:!this._debugZoomAndScroll,rootId:this.getId()})};a.prototype.onBeforeRendering=function(){if(S.prototype.onBeforeRendering){S.prototype.onBeforeRendering.apply(this,arguments)}q.sap.initMobile({homeIcon:this.getHomeIcon()})};a.prototype.onAfterRendering=function(){if(S.prototype.onAfterRendering){S.prototype.onAfterRendering.apply(this,arguments)}var r=this.getDomRef().parentNode;if(r&&!r._sapui5_heightFixed){r._sapui5_heightFixed=true;while(r&&r!==document.documentElement){var $=q(r);if($.attr("data-sap-ui-root-content")){break}if(!r.style.height){r.style.height="100%"}r=r.parentNode}}};a.prototype.exit=function(){if(S.prototype.exit){S.prototype.exit.apply(this,arguments)}};a.prototype._onOrientationChange=function(){this.fireOrientationChange({landscape:sap.ui.Device.orientation.landscape})};return a},true);
