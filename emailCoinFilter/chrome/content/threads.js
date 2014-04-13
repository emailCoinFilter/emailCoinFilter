/**
 * @file threads.js
 * @update 2012/05/30 14:21
 * @author Paolo Rovelli
 */

/**
 * Defines the EmailCoinFilter NameSpace.
 */
if ( typeof emailcoinfilter == "undefined") {
  var emailcoinfilter = {};
}

/**
 * Defines the EmailCoinFilter column handler class.
 *
 */
emailcoinfilter.columnHandler = {
  //Functions that must be implemented:

  //From nsITreeView:

  /**
   * Gets an atomized list of properties for a given cell. Each property, x, that the view gives back will cause the CSS ::moz-tree-cell-*(x) pseudoelement to be matched on the treechildren element.
   *
   * @param {long} row  the index of the row.
   * @param {nsITreeColumn} col  the current column.
   * @param {nsISupportsArray} props  an array of the cell's current properties.
   */
  getCellProperties : function(row, col, props) {
  },

  /**
   * Gets an atomized list of properties for a given row. Each property, x, that the view gives back will cause the CSS ::moz-tree-row(x) pseudoelement to be matched on the treechildren element.
   *
   * @param {long} row  the index of the row.
   * @param {nsISupportsArray} props  an array of the cell's current properties.
   */
  getRowProperties : function(row, props) {
  },

  /**
   * Gets the image path for a given cell. If the empty string is returned, the ::moz-tree-image pseudoelement will be used.
   *
   * @param {long} row  the index of the row.
   * @param {nsITreeColumn} col  the index of the column.
   * @return  the image path of the cell.
   */
  getImageSrc : function(row, col) {
    return null;
  },

  /**
   * Gets the text for a given cell.
   *
   * @param {long} row  the index of the row.
   * @param {nsITreeColumn} col  the column of the cell.
   * @return  the text of the cell, or the empty string if the column consists only of an image.
   */
  getCellText : function(row, col) {
    //Get the message header:
    emailHeader = gDBView.db.GetMsgHdrForKey(gDBView.getKeyAt(row));

    var spamStatus = emailHeader.getStringProperty("x-spam-status");

    if (spamStatus != null && spamStatus != "") {
      var scorePos = spamStatus.indexOf("score=");
      var requiredPos = spamStatus.indexOf("required=");

      if (scorePos < 0) {
        scorePos = spamStatus.indexOf(" hits=");
      }

      if (scorePos >= 0 && requiredPos >= 0) {
        var xSpamScore = spamStatus.slice(scorePos + 6).slice(0, spamStatus.indexOf(" "));
        var xSpamRequired = spamStatus.slice(requiredPos + 9).slice(0, spamStatus.indexOf(" "));
        var xSpamRate = null;

        //Debug messages:
        //dump("> X-Spam-Score: " + xSpamScore + " (" + xSpamRequired + ")\n");

        if (xSpamScore < 0)
          xSpamScore = 0;

        return Math.round((xSpamScore * 100) / xSpamRequired);
        // round a number to the nearest integer
      }
    }
    return "";
  },

  //From nsIMsgCustomColumnHandler (extends nsITreeView):

  /**
   * Gets the string that the column should be sorted by, if the column displays a string.
   *
   * @param {nsIMsgDBHdr} hdr  the message's nsIMsgDBHdr.
   * @return  the string value that sorting will be done with.
   */
  getSortStringForRow : function(hdr) {
    return null;
  },

  /**
   * Gets the number that the column should be sorted by, if the column displays a number.
   *
   * @param {nsIMsgDBHdr} hdr  the message's nsIMsgDBHdr.
   * @return  the long value that sorting will be done with.
   */
  getSortLongForRow : function(hdr) {
    var spamStatus = hdr.getStringProperty("x-spam-status");

    if (spamStatus != null && spamStatus != "") {
      var scorePos = spamStatus.indexOf("score=");
      var requiredPos = spamStatus.indexOf("required=");

      if (scorePos < 0) {
        scorePos = spamStatus.indexOf(" hits=");
      }

      if (scorePos >= 0 && requiredPos >= 0) {
        var xSpamScore = spamStatus.slice(scorePos + 6).slice(0, spamStatus.indexOf(" "));
        var xSpamRequired = spamStatus.slice(requiredPos + 9).slice(0, spamStatus.indexOf(" "));

        //Debug messages:
        //dump("> X-Spam-Score: " + xSpamScore + " (" + xSpamRequired + ")\n");

        if (xSpamScore < 0)
          xSpamScore = 0;

        return Math.round((xSpamScore * 100) / xSpamRequired);
        // round a number to the nearest integer
      }
    }

    return 0;
  },

  /**
   * Gets if the column displays a string value.
   *
   * @return  true if the column displays a string value, false otherwise.
   */
  isString : function() {
    return false;
  }
};

/**
 * Defines the EmailCoinFilter tree column class.
 *
 */
emailcoinfilter.TreeCol = {
  /**
   * Adds the observer.
   */
  load : function() {
    mozObserverService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    mozObserverService.addObserver(emailcoinfilter.TreeCol.CreateDbObserver, "MsgCreateDBView", false);
    //window.document.getElementById('folderTree').addEventListener("select", addCustomColumnHandler, false);
  },

  /**
   * Gets fired whenever a view is created.
   */
  CreateDbObserver : {
    //Components.interfaces.nsIObserver

    /**
     * This method will be called when there is a notification for the topic that the observer has been registered for.
     *
     * @param aMsgFolder  the object whose change or action is being observed.
     * @param aTopic  indicates the specific change or action.
     * @param aData  an optional parameter or other auxiliary data further describing the change or action.
     */
    observe : function(aMsgFolder, aTopic, aData) {
      emailcoinfilter.TreeCol.addCustomColumnHandler();
    }
  },

  /**
   * Adds the custom column handler.
   */
  addCustomColumnHandler : function() {
    gDBView.addColumnHandler("emailcoinfilter-SpamLevelCol", emailcoinfilter.columnHandler);
  }
};

/**
 * Defines the EmailCoinFilter custom headers class.
 *
 */
emailcoinfilter.CustomHeaders = function() {
  mozPrefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var xHeader = "x-spam-status";

  //customHeaders:
  customHeaders = mozPrefs.getCharPref("mailnews.customHeaders");
  customHeaders = customHeaders.replace(/\s+/g, '');

  var customHeadersArray = new Array();
  if (customHeaders != "") {
    customHeadersArray = customHeaders.split(":");
  }

  var ctrl = false;
  for (var i = 0; i < customHeadersArray.length; i++) {
    if (customHeadersArray[i] == xHeader) {
      ctrl = true;
    }
  }

  if (!ctrl) {
    customHeadersArray.push(xHeader);
    var newCustomHeaders = customHeadersArray.join(": ");

    mozPrefs.setCharPref("mailnews.customHeaders", newCustomHeaders);
  }

  //customDBHeaders:
  customDBHeaders = mozPrefs.getCharPref("mailnews.customDBHeaders");
  customDBHeaders = customDBHeaders.replace(/\s+/g, ' ');

  var customDBHeadersArray = new Array();
  if (customDBHeaders != "") {
    customDBHeadersArray = customDBHeaders.split(" ");
  }

  ctrl = false;
  for (var i = 0; i < customDBHeadersArray.length; i++) {
    if (customDBHeadersArray[i] == xHeader) {
      ctrl = true;
    }
  }

  if (!ctrl) {
    customDBHeadersArray.push(xHeader);
    var newCustomDBHeaders = customDBHeadersArray.join(" ");

    mozPrefs.setCharPref("mailnews.customDBHeaders", newCustomDBHeaders);
  }
}();

window.addEventListener("load", function() {
  emailcoinfilter.TreeCol.load();
}, false);
