/**
 * @file scan.js
 * @update 2012/06/18 23:52
 * @author Paolo Rovelli
 * @version 1.6
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
Components.utils.import("resource://emailcoinfilter/email.js");

/**
 * Defines the EmailCoinFilter scan class.
 *
 * @author Paolo Rovelli
 */
emailcoinfilter.Scan = {
emailCounter: 0,
spamCounter: 0,
folderCounter: 0,
progressCounter: 0,

//Methods:

/**
 * Scans all the emails in the selected folders.
 *
 * @param folders  the folders to be scanned.
 * @param gui  true if there is a GUI in which display the scan progress, false otherwise.
 * @return  the array (nsIMutableArray) of the email of Spam if at least one is Spam, false otherwise.
 */
scanFolders: function(folders, gui) {
  console.log("scanFolders");
  var isSpamFound = false;
  var spamList = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
  this.folderCount = folders.length;
  
  for each (let folder in folders) {
    let emails = folder.messages;
    this.progressCounter += 100 / folders.length;
    
    while ( emails.hasMoreElements() ) {
      emailHeader = emails.getNext().QueryInterface(Components.interfaces.nsIMsgDBHdr);
      emailURI = emailHeader.folder.getUriForMsg(emailHeader);
      
      var email = new emailcoinfilter.Email(emailURI, emailHeader);
      
      if ( this.scanEmail(email, gui) ) {  // this email is Spam!
        isSpamFound = true;
        spamList.appendElement(email.header, false /*weak*/);
      }
    }
  }

  if (isSpamFound )
  return spamList;
  else
  return null;
},

/**
 * Scans the displayed/selected emails.
 *
 * @param emailURIs  the URIs of the emails to be scanned.
 * @param gui  true if there is a GUI in which display the scan progress, false otherwise.
 * @return  true if at least one email is Spam, false otherwise.
 */ 
 scanEmails: function(emailURIs, gui) {
  var isSpamFound = false;

  for each (let emailURI in emailURIs) {
  messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);
  emailHeader = messenger.messageServiceFromURI(emailURI).messageURIToMsgHdr(emailURI);
  // email header from the email URI
  this.progressCounter += 100 / emailURIs.length;

  var email = new emailcoinfilter.Email(emailURI, emailHeader);

  if (this.scanEmail(email, gui)) {// this email is Spam!
    isSpamFound = true;
  }
}

return isSpamFound;
},

/**
 * Scan an email.
 *
 * @param email  the email to be scanned (Email class).
 * @param gui  true if there is a GUI in which display the scan progress, false otherwise.
 * @return  true if the email is Spam, false otherwise.
 */ 
 scanEmail: function(email, gui) {
  this.emailCounter++;

  //Update the scan window:
  if (gui == true && emailcoinfilter.ScanWindow != null) {// there is a GUI in which display the scan progress...
    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanTimeEndLabel").setAttribute("style", "visibility: hidden;");
    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ProgressBox").setAttribute("value", this.progressCounter);
    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanEmail").setAttribute("value", email.folder.name + ":" + email.id);
    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanEmailCounter").setAttribute("value", this.emailCounter);

    var emailSenderInfo = email.author;
    if (email.author != null) {
      if (!email.isEmailAddressInAddressBooks) {
        emailSenderInfo += " [unknown]";
      }
      if (emailcoinfilter.Scan.isInBlacklist(email.author) || emailcoinfilter.Scan.isInBlacklist(email.authorDomain)) {// the sender's email address or its domain is inside the Blacklist
        emailSenderInfo += " (blacklisted)";
      }
    }// email.author != null
    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-EmailSender").setAttribute("value", emailSenderInfo);

    //Adds Spam information from the "Received" message's header:
    /**
     * emailReceivedInfo[0]: from
     * emailReceivedInfo[1]: by
     */
    var emailReceivedInfo = Array(2);
    emailReceivedInfo[0] = "";
    // Received From
    emailReceivedInfo[1] = "";
    // Received By

    /**
     * received[0]: from
     * received[1]: IP (from)
     * received[2]: by
     * received[3]: IP (by)
     */
    var received = email.getReceivedInfo;

    //Received From:
    if (received[0] != null) {
      emailReceivedInfo[0] = received[0];
    }
    if (received[1] != null) {
      emailReceivedInfo[0] += " (" + received[1] + ")";
    }

    //Received By:
    if (received[2] != null) {
      emailReceivedInfo[1] = received[2];
    }
    if (received[3] != null) {
      emailReceivedInfo[1] += " (" + received[3] + ")";
    }

    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ReceivedHeaderFrom").setAttribute("value", emailReceivedInfo[0]);
    emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ReceivedHeaderBy").setAttribute("value", emailReceivedInfo[1]);

    //Adds Spam information from the "X-Spam-Status" message's header:
    var xSpamScore = email.getXSpamScore;
    var xSpamRequired = email.getXSpamRequired;
    if (xSpamScore != "---" && xSpamRequired != "---") {
      emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-XSpamStatus").setAttribute("value", xSpamScore + " / " + xSpamRequired);
    } else {
      emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-XSpamStatus").setAttribute("value", "---");
    }
  }

  if (email.checkSpam) {
    this.spamCounter++;

    //Flag the email as Spam (junk):
    this.markEmailAs(email, Components.interfaces.nsIJunkMailPlugin.JUNK, "100", "user");

    //Update the scan window:
    if (gui == true && emailcoinfilter.ScanWindow != null) {// there is a GUI in which display the scan progress...
      emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanSpamCounter").setAttribute("value", this.spamCounter);

      var spamScoreLabel = (email.spamScore * 100 / emailcoinfilter.Preferences.getSpamMinValue()).toPrecision(3);
      if (spamScoreLabel >= 100) {
        spamScoreLabel = "> 100%";
      } else {// spamScore < 100
        spamScoreLabel = "~ " + spamScoreLabel + "%";
      }
      emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-SpamRate").setAttribute("value", spamScoreLabel);
    }

    return true;
  } else {// !email.checkSpam
    //Flag the email as NOT Spam (junk):
    this.markEmailAs(email, Components.interfaces.nsIJunkMailPlugin.GOOD, "0", "user");

    //Update the scan window:
    if (gui == true && emailcoinfilter.ScanWindow != null) {// there is a GUI in which display the scan progress...
      var spamScoreLabel = (email.spamScore * 100 / emailcoinfilter.Preferences.getSpamMinValue()).toPrecision(3);
      if (spamScoreLabel >= 100) {
        spamScoreLabel = "> 100%";
      } else {// spamScore < 100
        spamScoreLabel = "~ " + spamScoreLabel + "%";
      }
      emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-SpamRate").setAttribute("value", spamScoreLabel);
    }

    return false;
  }
},

/**
 * Marks an email as Junk or Not Junk.
 *
 * @param email  the email to be marked (Email class).
 * @param classification  the new message classification (0:UNCLASSIFIED, 1:GOOD, 2:JUNK).
 * @param junkscore  the new message junk score ("0":GOOD, "100":JUNK).
 * @param junkscoreorigin  the new message junk score ("user", "filter", ...).
 */ 
markEmailAs: function(email, classification, junkscore, junkscoreorigin) {
gJunkService = Components.classes["@mozilla.org/messenger/filter-plugin;1?name=bayesianfilter"].getService(Components.interfaces.nsIJunkMailPlugin);
oldJunkscore = email.header.getStringProperty("junkscore");
oldJunkscoreorigin = email.header.getStringProperty("junkscoreorigin");

oldClassification = Components.interfaces.nsIJunkMailPlugin.UNCLASSIFIED;
if (oldJunkscoreorigin == "user") {
  switch( oldJunkscore ) {
    case "0":
      oldClassification = Components.interfaces.nsIJunkMailPlugin.GOOD;
      break;

    case "100":
      oldClassification = Components.interfaces.nsIJunkMailPlugin.JUNK;
      break;
  }
}

//Set the message classification and origin:
db = email.folder.msgDatabase;
db.setStringPropertyByHdr(email.header, "junkscore", junkscore);
db.setStringPropertyByHdr(email.header, "junkscoreorigin", junkscoreorigin);

if (classification != oldClassification) {
  gJunkService.setMessageClassification(email.uri, oldClassification, classification, null, null);
}
},

/**
 * Defines if an email address or an email domain is into the Blacklist or not.
 *
 * @param author  the email address or domain of the author of the message.
 * @return  true if the email address or its domain is present inside the Blacklist, false otherwise.
 */ 
 isInBlacklist: function(author) {
  for ( i = 0; i < emailcoinfilter.Preferences.getBlacklist().length; i++) {
    if (author == emailcoinfilter.Preferences.getBlacklist()[i]) {
      return true;
      // the email domain IS present inside the Blacklist!
    }
  }

  return false;
  // the email address and its domain are NOT present inside the Blacklist!
},

/**
 * Defines if an email address or an email domain is into the Whitelist or not.
 *
 * @param author  the email address or domain of the author of the message.
 * @return  true if the email address or its domain is present inside the Whitelist, false otherwise.
 */ 
 isInWhitelist: function(author) {
  for ( i = 0; i < emailcoinfilter.Preferences.getWhitelist().length; i++) {
    if (author == emailcoinfilter.Preferences.getWhitelist()[i]) {
      return true;
      // the email domain IS present inside the Whitelist!
    }
  }

  return false;
  // the email address and its domain are NOT present inside the Whitelist!
 },
}
