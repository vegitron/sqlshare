(function(){var A=YAHOO.util.Dom,g=YAHOO.util.Event,Q=YAHOO.env.ua,F=YAHOO.lang,R=YAHOO.widget.TabView.prototype,N=R.initAttributes,M=R.addTab,U=(Q.gecko&&Q.gecko>=1.9)||(Q.ie&&Q.ie>=8),G={},H={},f="A",O="aria-",V="usearia",C="element",Y="activeTab",b="role",X="presentation",I="tab",W="href",E="contentEl",S="tabpanel",B="labelledby",e="describedby",J="activeIndex",T="tablist",d="keypress",L="keydown",c="id";var a=function(h,i){h.setAttribute(b,i);};var Z=function(h,j,i){h.setAttribute((O+j),i);};var K=function(i){var h;if(A.getAncestorByClassName(i,this.TAB_PARENT_CLASSNAME)){if(i.nodeName.toUpperCase()===f){h=i;}else{h=A.getAncestorByTagName(i,f);}}return h;};var P=function(j){var h=K.call(this,g.getTarget(j)),i=g.getCharCode(j);if(h&&(i===13||i===32)&&(h.parentNode!==this.get(Y).get(C))){this.set(J,H[this.get(c)][h.id]);}};var D=function(m){var l=K.call(this,g.getTarget(m)),i=G[this.get(c)],h,j,k;if(l){h=l.parentNode;switch(g.getCharCode(m)){case 37:case 38:j=A.getPreviousSibling(h);if(!j){j=i[i.length-1];}break;case 39:case 40:j=A.getNextSibling(h);if(!j){j=i[0];}break;}if(j){k=A.getFirstChild(j);l.tabIndex=-1;k.tabIndex=0;k.focus();}}};F.augmentObject(R,{addTab:function(n,k){M.apply(this,arguments);var j=this.get(c),i=G[j],m,h,l,o;if(this.get(V)){m=n.get(C);h=A.getFirstChild(m);h.tabIndex=(this.get(Y)===n)?0:-1;o=h.id||A.generateId(h);H[j][o]=this.getTabIndex(n);a(m,X);a(h,I);h.removeAttribute(W);l=n.get(E);i[i.length]=l;a(l,S);Z(l,B,o);}},_setLabelledBy:function(i){var h=A.getFirstChild(this.get(C));if(this.get(V)&&h){Z(h,B,i);}},_setDescribedBy:function(i){var h=A.getFirstChild(this.get(C));if(this.get(V)&&h){Z(h,e,i);}},_setUseARIA:function(j){var h,i;if(j){i=this.get(c);if(!i){this.set(c,A.generateId());i=this.get(c);}G[i]=[];H[i]={};h=A.getFirstChild(this.get(C));if(!h){this.on("appendTo",function(){a(A.getFirstChild(this.get(C)),T);},null,this);}else{a(h,T);}this.on(d,P);this.on(L,D);}},initAttributes:function(h){this.setAttributeConfig(V,{value:(h.usearia||U),validator:F.isBoolean,writeOnce:true,method:this._setUseARIA});this.setAttributeConfig(B,{value:h.labelledby,validator:F.isString,method:this._setLabelledBy});this.setAttributeConfig(e,{value:h.describedby,validator:F.isString,method:this._setDescribedBy});if(U){this.set(V,true);}N.call(this,h);}},"initAttributes","_setUseARIA","_setLabelledBy","_setDescribedBy","addTab");}());YAHOO.register("tabviewariaplugin",YAHOO.widget.TabView,{version:"@VERSION@",build:"@BUILD@"});
