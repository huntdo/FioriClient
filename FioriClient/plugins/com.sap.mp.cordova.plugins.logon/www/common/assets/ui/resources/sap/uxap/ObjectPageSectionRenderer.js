jQuery.sap.require("sap.ui.core.Renderer");sap.uxap.ObjectPageSectionRenderer={};
sap.uxap.ObjectPageSectionRenderer.render=function(r,c){if(!c.getVisible()||!c._getInternalVisible()){return}r.write("<section ");r.addClass("sapUxAPObjectPageSection");r.writeClasses();r.writeControlData(c);r.write(">");if(c.getShowTitle()&&c._getInternalTitleVisible()){r.write("<div");r.writeAttributeEscaped("id",c.getId()+"-header");r.addClass("sapUxAPObjectPageSectionHeader");r.writeClasses();r.write(">");if(c._getInternalTitle()!=""){r.writeEscaped(c._getInternalTitle())}else{r.writeEscaped(c.getTitle())}r.write("</div>")}r.write("<div");r.addClass("sapUxAPObjectPageSectionContainer");r.writeClasses();r.write(">");jQuery.each(c.getSubSections(),function(i,s){r.renderControl(s)});r.write("</div>");r.write("</section>")};
