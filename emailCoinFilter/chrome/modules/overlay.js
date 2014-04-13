/**
 * @file overlay.js
 * @update 2012/03/29 15:02
 * @author Paolo Rovelli
 */

var EXPORTED_SYMBOLS = ["emailcoinfilter"];

/**
 * Defines the EmailCoinFilter NameSpace.
 */
if ( typeof emailcoinfilter == "undefined") {
  var emailcoinfilter = {};
}

//Import code modules:
Components.utils.import("resource://emailcoinfilter/preferences.js");

/**
 * Defines the EmailCoinFilter overlay class.
 *
 */
emailcoinfilter.Overlay = {
  /**
   * Overlay the statusbar.
   *
   * @param emailCounter  the number of email scanned.
   * @param spamCounter  the number of Spam found.
   * @return  the formatted Spam counter label [SpamFoundPercentage (spamTotalCounter/emailTotalCounter)].
   */
  statusbarOverlay : function(emailCounter, spamCounter) {
    
    var spamCounterLabel = "eMailCoinFilter";

    return spamCounterLabel;
  },

  /**
   * Adds an event in the Activity Manager.
   *
   * @param eventClass  the icon class of the new event in the Activity Manager.
   * @param eventTitle  the title of the new event in the Activity Manager.
   * @param eventDescription  the description of the new event in the Activity Manager.
   */
  addActivityManagerEvent : function(eventClass, eventTitle, eventDescription) {
    mozActivityManager = Components.classes["@mozilla.org/activity-manager;1"].getService(Components.interfaces.nsIActivityManager);
    mozEvent = Components.classes["@mozilla.org/activity-event;1"].createInstance(Components.interfaces.nsIActivityEvent);

    mozEvent.iconClass = eventClass;
    mozEvent.init(eventTitle, null, eventDescription, null, Date.now());

    mozActivityManager.addActivity(mozEvent);
  }
};
