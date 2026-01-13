/**
Toast notification system for DataFlex Web Applications.

@author Harm Wibier (Data Access Worldwide)
@version 1.0
@copyright Copyright (c) 2025, Data Access Europe B.V.
@license BSD-3-Clause
*/

const wpt = {
    TopRight: 0,
    BottomRight: 1,
    BottomLeft: 2,
    TopLeft: 3,
    TopCenter: 4,
    BottomCenter: 5
}

const C_ToastFadeInMS = 500;
const C_ToastFadeOutMS = 500;

class ToastUI {
    aActiveToasts = [];
    iToastCount = 0;
    aContainers = {};


    renderToastContainer(sContainerClass) {
        let eContainer = document.createElement("div");
        eContainer.className = "WebToastContainer " + sContainerClass;
        eContainer.popover = "manual";

        document.body.appendChild(eContainer);

        eContainer.addEventListener("click", (oEvent) => {
            const sId = oEvent.target.closest(".WebToast")?.dataset.df_toast_id;
            if (!sId) return;

            const iIndex = this.aActiveToasts.findIndex(tToast => tToast.sId === sId);
            if (iIndex === -1) return;

            if (oEvent.target.classList.contains("WebToast_closebtn")) {
                this.hideToastById(sId);
            } else {
                this.aActiveToasts[iIndex].oSource.fire("OnToastClick", [sId]);
            }
        });

        eContainer.showPopover();

        return eContainer;
    }

    renderToast(tToastData) {
        let eToast = document.createElement("div");
        eToast.dataset.df_toast_id = tToastData.sId;

        eToast.className = "WebToast WebToast_hidden " + tToastData.sCssClass;
        if (tToastData.bShowIcon) {
            eToast.classList.add("WebToast_icon");
        }
        if (tToastData.bAllowHtml) {
            eToast.innerHTML = tToastData.sMessage;
        } else {
            eToast.textContent = tToastData.sMessage;
        }
        if (tToastData.iWidth > 0) {
            eToast.style.width = Math.min(document.documentElement.clientWidth - 20, tToastData.iWidth) + "px";
        }
        if (tToastData.bCloseButton) {
            let eCloseBtn = document.createElement("span");
            eCloseBtn.className = "WebToast_closebtn";
            eToast.appendChild(eCloseBtn);
            eToast.classList.add("WebToast_with_closebtn");
        }
        return eToast;
    }

    getToastContainerClass(ePosition) {
        switch (ePosition) {
            case wpt.TopCenter:
                return "WebToastCon_top_center";
            case wpt.BottomCenter:
                return "WebToastCon_bottom_center";
            case wpt.TopRight:
                return "WebToastCon_top_right";;
            case wpt.BottomRight:
                return "WebToastCon_bottom_right";
            case wpt.BottomLeft:
                return "WebToastCon_bottom_left";
            case wpt.TopLeft:
                return "WebToastCon_top_left";
        }
        return "WebToastCon_top_center";
    }

    getToastContainer(ePosition) {
        if (this.aContainers[ePosition]) {
            return this.aContainers[ePosition];
        }
        this.aContainers[ePosition] = this.renderToastContainer(this.getToastContainerClass(ePosition));
        return this.aContainers[ePosition];
    }


    showToast(tToastData) {
        this.removeToast(tToastData.sId);

        tToastData.eElem = this.renderToast(tToastData);

        const eContainer = this.getToastContainer(tToastData.ePosition);
        if (tToastData.bNewestOnTop && eContainer.childNodes.length > 0) {
            eContainer.insertBefore(tToastData.eElem, eContainer.childNodes[0]);
        } else {
            eContainer.appendChild(tToastData.eElem);
        }

        this.aActiveToasts.push(tToastData);

        if (tToastData.iDurationMs > 0) {
            tToastData.tHideTimout = setTimeout(() => {
                tToastData.tHideTimout = null;
                this.hideToastById(tToastData.sId);
            }, tToastData.iDurationMs + C_ToastFadeInMS);
        }

        setTimeout(() => {
            tToastData.eElem.classList.remove("WebToast_hidden");
        }, 10);
    }

    removeToast(sToastId) {
        const iIndex = this.aActiveToasts.findIndex(tToast => tToast.sId === sToastId);
        if (iIndex === -1) return;
        const tToastData = this.aActiveToasts[iIndex];
        
        if (tToastData.tHideTimout) {
            clearTimeout(tToastData.tHideTimout);
            tToastData.tHideTimout = null;
        }
        if (tToastData.tFadeTimeout) {
            clearTimeout(tToastData.tFadeTimeout);
            tToastData.tFadeTimeout = null;
        }

        if (tToastData.eElem && tToastData.eElem.parentNode) {
            const eParent = tToastData.eElem.parentNode;
            eParent.removeChild(tToastData.eElem);
            if (eParent.childNodes.length === 0) {
                eParent.hidePopover();
                eParent.parentNode.removeChild(eParent);
                delete this.aContainers[tToastData.ePosition];
            }
        }
        this.aActiveToasts.splice(iIndex, 1);
    }

    hideToastById(sToastId) {
        const iIndex = this.aActiveToasts.findIndex(tToast => tToast.sId === sToastId);
        if (iIndex === -1) return;
        const tToastData = this.aActiveToasts[iIndex];
        tToastData.eElem.classList.add("WebToast_hidden");

        if (tToastData.tHideTimout) {
            clearTimeout(tToastData.tHideTimout);
            tToastData.tHideTimout = null;
        }

        if (C_ToastFadeOutMS > 0) {
            tToastData.tFadeTimeout =setTimeout(() => {
                this.removeToast(sToastId);
            }, C_ToastFadeOutMS);
        } else {
            this.removeToast(sToastId);
        }

        tToastData.oSource.fire("OnToastHide", [sToastId]);
    }

    hideAllToast() {
        this.aActiveToasts.forEach(tToastData => {
            this.hideToastById(tToastData.sId);
        });
    }

    hideLastToast() {
        if (this.aActiveToasts.length === 0) return;
        this.hideToastById(this.aActiveToasts[this.aActiveToasts.length - 1].sId);
    }

    genId() {
        this.iToastCount++;
        return "df_toast_" + this.iToastCount;
    }
}

// Singleton instance allowing usage of multiple df.WebToast objects
df.oToastUI = new ToastUI();

/*
Public class WebToast.
*/
df.WebToast = class WebToast extends df.WebObject {
    constructor(sName, oParent) {
        super(sName, oParent);

        this.prop(df.tInt, "piDurationMs", 5000);
        this.prop(df.tInt, "pePosition", wpt.TopCenter);
        this.prop(df.tInt, "piWidth", 0);
        this.prop(df.tBool, "pbShowCloseButton", false);
        this.prop(df.tString, "psCssClass", "");
        this.prop(df.tBool, "pbPreventDuplicate", false);
        this.prop(df.tBool, "pbNewestOnTop", false);
        this.prop(df.tBool, "pbAllowHtml", false);
        this.prop(df.tBool, "pbShowIcon", true);

        this.event("OnToastHide", df.cCallModeDefault);
        this.event("OnToastClick", df.cCallModeDefault);
    }

    showToast(sCssClass, sMessage) {
        let tToastData = {
            iDurationMs: this.piDurationMs,
            ePosition: this.pePosition,
            iWidth: this.piWidth,
            bCloseButton: this.pbShowCloseButton,
            sCssClass: sCssClass + " " + this.psCssClass,
            bAllowHtml: this.pbAllowHtml,
            bNewestOnTop: this.pbNewestOnTop,
            bShowIcon: this.pbShowIcon,

            sId: df.oToastUI.genId(),
            sMessage: sMessage,

            oSource: this
        };

        df.oToastUI.showToast(tToastData);
    }

    hideLastToast() {
        df.oToastUI.hideLastToast();
    }
    hideAllToast() {
        df.oToastUI.hideAllToast();
    }
    hideToastById(sToastId) {
        df.oToastUI.hideToastById(sToastId)
    }

    showCustomToast() {
        let tToastData = this._tActionData;

        if (!tToastData.sId) {
            tToastData.sId = df.oToastUI.genId();
        }
        tToastData.oSource = this;
        tToastData.sCssClass = tToastData.sCssClass + " " + this.psCssClass;

        df.oToastUI.showToast(tToastData);
    }
}


