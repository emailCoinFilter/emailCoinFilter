/**
 * @file listener.js
 * @update 2012/02/28 10:03
 * @author emailCoinFilter@gmail.com
 * @author Paolo Rovelli
 * @version 0.1
 */

/**
 * Defines the EmailCoinFilter NameSpace.
 */
if ( typeof emailcoinfilter == "undefined") {
  var emailcoinfilter = {};
}

//Import code modules:
Components.utils.import("resource://emailcoinfilter/preferences.js");
Components.utils.import("resource://emailcoinfilter/email.js");
Components.utils.import("resource://emailcoinfilter/scan.js");
Components.utils.import("resource://emailcoinfilter/overlay.js");

processedEmailIds = new Array();

// new mail
emailcoinfilter.NewEmailListener = 
{
  notificationService : null,

  /**
   * Watch for new email.
   *
   * @param emailHeader  the new email header.
   */
  msgAdded : function(emailHeader) 
  {
    console.log("emailId is: " + emailHeader.messageId);
    console.log("email header is " + emailHeader.subject); 
    // make sure there is a bulk mail folder
    try
    {
     bulkMailFolderTest=emailHeader.folder.rootFolder.getChildNamed("Bulk Mail"); 
    }
    catch(err)
    {
      
      emailHeader.folder.rootFolder.createSubfolder("Bulk Mail",msgWindow);
    }

    if (emailHeader.folder.flags & Components.interfaces.nsMsgFolderFlags.Inbox) 
    {
//      console.log("inbox");
      found = false;
      for (i = 0; i < processedEmailIds.length; i++) {
        if (processedEmailIds[i] == emailHeader.messageId) {
          found = true;
        }
      }
//      found=true;
      if(!found)
      {
        processedEmailIds.push(emailHeader.messageId);
  
        if (!emailHeader.isRead) {// new email received!!
  //        console.log("isRead is false");
          emailURI = emailHeader.folder.getUriForMsg(emailHeader);
  //        console.log("got uri for message");
          //var email = new emailcoinfilter.Email(emailURI, emailHeader);
  //        console.log("got email for message");
  
          //TODO: this currently a bypass of the filter, this needs to be upgraded to check for a signed message
          if(emailHeader.subject.contains("Sent to bulk mail RE:") || emailHeader.subject.contains("My dogecoin address RE:"))
          {
            return;
          }

          mime2DecodedAuthor = emailHeader.mime2DecodedAuthor;  // the MIME2 decoded author of the message
          if ( mime2DecodedAuthor != null ) 
          {
            var posStart = mime2DecodedAuthor.search(/</i);
            var posEnd = mime2DecodedAuthor.search(/>/i);
            if ( (posStart > -1) && (posEnd > posStart) ) 
            {
              author = mime2DecodedAuthor.slice(posStart+1, posEnd);
  //            console.log("author is " + author);
              domain = mime2DecodedAuthor.substring( author.indexOf("@") );
  //            console.log("domain is " + domain);
            }
          }
          
          if (emailcoinfilter.Preferences.isWhitelistActive() && !(emailcoinfilter.Preferences.getWhitelist().length == 1 && emailcoinfilter.Preferences.getWhitelist()[0] == "")) 
          {// always receive emails from thrusted senders
            if (emailcoinfilter.Scan.isInWhitelist(author) || emailcoinfilter.Scan.isInWhitelist(email.domain)) 
            {// the sender's email address or its domain is inside the Whitelist
              console.log("inside whitelist");
              //TODO:  if option selected, process coin attachments
              
              return;
            }
          }
    
          // blacklist
          if (emailcoinfilter.Preferences.isBlacklistActive() && !(emailcoinfilter.Preferences.getBlacklist().length == 1 && emailcoinfilter.Preferences.getBlacklist()[0] == "")) 
          {// Blacklist active
            if (emailcoinfilter.Scan.isInBlacklist(author) || emailcoinfilter.Scan.isInBlacklist(domain)) 
            {// the sender's email address or its domain is inside the Blacklist
              // send email to bulk mail folder
              bulkMailFolder = emailHeader.folder.rootFolder.getChildNamed("Bulk Mail");
              bulkEmail = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
              bulkEmail.appendElement(emailHeader, false /*weak*/);
              Components.classes["@mozilla.org/messenger/messagecopyservice;1"].getService(Components.interfaces.nsIMsgCopyService).CopyMessages(emailHeader.folder, bulkEmail, bulkMailFolder, true/*isMove*/, null, msgWindow, true /*allowUndo*/);
            }
          }
          var foundEmailCoinAttachment=false;
          console.log("before MsgHdrToMimeMessage");
          MsgHdrToMimeMessage(emailHeader, this, function (aMsgHdr, aMimeMessage) 
          {
            sendBlockedMessage = function()
            {
              //does not have an email coin attachment 
              //console.log("reply to non email coin message");
              var am = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
              identity = am.defaultAccount.defaultIdentity;
              if (identity.email!=author)
              {
                var cf = Components.classes["@mozilla.org/messengercompose/composefields;1"].createInstance(Components.interfaces.nsIMsgCompFields);
                cf.to = author;
                cf.body = "I am using a filter for my emails. In order to get this message into my inbox you must attach a transaction of at least " +
                 emailcoinfilter.Preferences.getEmailCoinAmount() + " Dogecoin to the address " +
                 emailcoinfilter.Preferences.getEmailCoinAddresss() + " . To learn more about emailCoin go to http://emailCoinFilter.com\r\n";                  
                cf.subject = "Sent to bulk mail RE:" + emailHeader.subject;
                var params = Components.classes["@mozilla.org/messengercompose/composeparams;1"].createInstance(Components.interfaces.nsIMsgComposeParams);
                params.type = Components.interfaces.nsIMsgCompType.New;
                params.format = Components.interfaces.nsIMsgCompFormat.HTML;
                params.composeFields = cf;
                var msgSend = Components.classes["@mozilla.org/messengercompose/send;1"].createInstance(Components.interfaces.nsIMsgSend);
                var msgCompose = Components.classes["@mozilla.org/messengercompose/compose;1"].createInstance(Components.interfaces.nsIMsgCompose);
                msgCompose.initialize(params);
                delivermode = Components.interfaces.nsIMsgCompDeliverMode.Now;
                accountKey = am.defaultAccount.key;
                msgCompose.SendMsg(delivermode, identity, accountKey, null, null);
                
                //move message to bulk mail folder
                bulkMailFolder = emailHeader.folder.rootFolder.getChildNamed("Bulk Mail");
                bulkEmail = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
                bulkEmail.appendElement(emailHeader, false /*weak*/);
                Components.classes["@mozilla.org/messenger/messagecopyservice;1"].getService(Components.interfaces.nsIMsgCopyService).CopyMessages(emailHeader.folder, bulkEmail, bulkMailFolder, true/*isMove*/, null, msgWindow, true /*allowUndo*/);
                
              }
            };
            
            attachments = aMimeMessage.allUserAttachments || aMimeMessage.allAttachments;
            
            //console.log("attachments is " + attachments);
            if(attachments.length==0)
            {
              sendBlockedMessage();
            }
                      
            for ([index, att] in Iterator(attachments))
            {
              ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);  
              neckoURL = null;  
               
              neckoURL = ioService.newURI(att.url, null, null);  
              neckoURL.QueryInterface(Ci.nsIMsgMessageUrl);  
              uri = neckoURL.uri;  
              attInfo = new AttachmentInfo(att.contentType, att.url, att.name, uri, att.isExternal);
              
              chunks = [];  
              unicodeConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]  
                                     .createInstance(Ci.nsIScriptableUnicodeConverter);  
              unicodeConverter.charset = "UTF-8"; 
              
              listener = 
              {
                onStartRequest: function (aRequest, aContext) {},  
                onStopRequest: function (aRequest, aContext, aStatusCode) 
                {  
                  data = chunks.join("");
                  console.log("onStopRequest data is " + data);  
                  if(data.substring(0,12) == '{"emailCoin"')
                  {
                    foundEmailCoinAttachment=true;
                    var emailCoinAttachment = JSON.parse(data);
                    //console.log("is emailCoin attachment message " + emailCoinAttachment.message);
                    if(emailCoinAttachment.emailCoin=="transaction")
                    {
                      //TODO:
                      //if this is a signed transaction transmit
                      console.log("got signed transaction signingAddress of " + emailCoinAttachment.signingAddress);
                      console.log("got signed transaction message of " + emailCoinAttachment.message);
                      console.log("got signed transaction of " + emailCoinAttachment.transaction);
                      
                      
                      var sendrawtransactionReceived = function()
                      {  
                        if (httpRequest.responseText)
                        {
                          console.log("sendrawtransactionReceived response was " + httpRequest.responseText);
                          //TODO if successful delete this attachment 
                        }
                      };

                      var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
                      var requestObj = {};
                      requestObj.id = "emailCoin";
                      requestObj.method = "sendrawtransaction";
                      requestObj.params = [emailCoinAttachment.transaction];
                      var getInfoRequestString = JSON.stringify(requestObj);
                      httpRequest = new XMLHttpRequest();
                      httpRequest.open("POST", fullUrl, true);
                      httpRequest.onload = sendrawtransactionReceived;
                      httpRequest.onerror = function () { alert("Error rpc not open"); };
                      httpRequest.send(getInfoRequestString);
                    }
                    else if(emailCoinAttachment.emailCoin=="offer")
                    {
                      console.log("is offer");
                      var verifyMessageReceived = function()
                      {
                        console.log("got response of verify");
                        if (httpRequest.responseText)
                        {
                          console.log("got responseText of " +httpRequest.responseText);
                          var response = JSON.parse(httpRequest.responseText);
                          if(response.result == true)
                          {
                            console.log("got true");
                            //signed message checks out
                            console.log("reply with the emailCoin address");
                            var am = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Components.interfaces.nsIMsgAccountManager);
                            identity = am.defaultAccount.defaultIdentity;
                            if (identity.email!=author)
                            {
                              getMessageBody = function(aMessageHeader)  
                              {  
                                messenger = Components.classes["@mozilla.org/messenger;1"]  
                                                          .createInstance(Components.interfaces.nsIMessenger);  
                                listener = Components.classes["@mozilla.org/network/sync-stream-listener;1"]  
                                                         .createInstance(Components.interfaces.nsISyncStreamListener);  
                                uri = aMessageHeader.folder.getUriForMsg(aMessageHeader);  
                                messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, "");  
                                folder = aMessageHeader.folder;  
                                return folder.getMsgTextFromStream(listener.inputStream,aMessageHeader.Charset,65536,32768,false,true,{ });  
                              };
                              var cf = Components.classes["@mozilla.org/messengercompose/composefields;1"].createInstance(Components.interfaces.nsIMsgCompFields);
                              cf.to = author;
                              cf.subject = "My dogecoin address RE:" + emailHeader.subject;
                              cf.body = "The dogecoin address to get this message to my inbox is " + emailcoinfilter.Preferences.getEmailCoinAddresss() + " \r\n" ;//+
  //                                      getMessageBody(emailHeader );
                              var params = Components.classes["@mozilla.org/messengercompose/composeparams;1"].createInstance(Components.interfaces.nsIMsgComposeParams);
                              params.type = Components.interfaces.nsIMsgCompType.New;
                              params.format = Components.interfaces.nsIMsgCompFormat.HTML;
                              params.composeFields = cf;
                              var msgSend = Components.classes["@mozilla.org/messengercompose/send;1"].createInstance(Components.interfaces.nsIMsgSend);
                              var msgCompose = Components.classes["@mozilla.org/messengercompose/compose;1"].createInstance(Components.interfaces.nsIMsgCompose);
                              msgCompose.initialize(params);
                              delivermode = Components.interfaces.nsIMsgCompDeliverMode.Now;
                              accountKey = am.defaultAccount.key;
                              msgCompose.SendMsg(delivermode, identity, accountKey, null, null);
                            }                   
                          }
                        }
                      }; 
                      var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
                      var requestObj = {};
                      requestObj.id = "emailCoin";
                      requestObj.method = "verifymessage";
                      requestObj.params = [emailCoinAttachment.signingAddress, emailCoinAttachment.messageSignature, emailCoinAttachment.messageSigned];
                      var getInfoRequestString = JSON.stringify(requestObj);
                      httpRequest = new XMLHttpRequest();
                      httpRequest.open("POST", fullUrl, true);
                      httpRequest.onload = verifyMessageReceived;
                      httpRequest.onerror = function () { alert("Error rpc not open"); };
                      httpRequest.send(getInfoRequestString);
                    }                   
                  }
                  else
                  {
                    //TODO: if multiple attachments this may be prepature
                     sendBlockedMessage();  
                  }
                },  
                  
                onDataAvailable: function (aRequest, aContext, aStream, aOffset, aCount) 
                {  
                  // Fortunately, we have in Gecko 2.0 a nice wrapper  
                  data = NetUtil.readInputStreamToString(aStream, aCount);  
                  // Now each character of the string is actually to be understood as a byte  
                  //  of a UTF-8 string. So charCodeAt is what we want here...  
                  array = [];  
                  for ( i = 0; i < data.length; ++i)
                  {  
                    array[i] = data.charCodeAt(i);
                  }  
                  chunks.push(unicodeConverter.convertFromByteArray(array, array.length));
                },  
                  
                QueryInterface: XPCOMUtils.generateQI([Ci.nsISupports, Ci.nsIStreamListener, Ci.nsIRequestObserver])  
              };  
                
              url = Services.io.newURI(att.url, null, null);
              url = url.QueryInterface( Components.interfaces.nsIURL );
              channel = Services.io.newChannelFromURI(url);
              channel.asyncOpen(listener, null); 
            }
          }, true);
          console.log("after MsgHdrToMimeMessage");
  
        }
      }
    }
    return;
  },

  /**
   * Add the listener.
   *
   * @param emailHeader  the new email header.
   */
  load : function() 
  {
    //Overlay the Statusbar label:
    var spamCounterLabel = emailcoinfilter.Overlay.statusbarOverlay(0, 0);
    document.getElementById("emailcoinfilter-SpamCounterStat").setAttribute('label', spamCounterLabel);

    //Avoid duplicate initialization:
    removeEventListener("load", function() {
      emailcoinfilter.NewEmailListener.load();
    }, true);

    // console.log("regestering msgAddded");
    this.notificationService = Components.classes["@mozilla.org/messenger/msgnotificationservice;1"].getService(Components.interfaces.nsIMsgFolderNotificationService);
    this.notificationService.addListener(this, this.notificationService.msgAdded);
    //this.notificationService.addListener(emailcoinfilter.NewEmailListener, this.notificationService.msgAdded);
  },

  /**
   * Remove the listener.
   *
   * @param emailHeader  the new email header.
   */
  unload : function() 
  {
    removeEventListener("load", function() {
      emailcoinfilter.NewEmailListener.load();
    }, true);
    this.notificationService.removeListener(this);
  }
};
/* --- END Watch for New Mail. --- */

/* --- BEGIN Mozilla Preferences Listener class: --- */
/**
 * Defines the Mozilla preferences listener class.
 *
 * @param {string} branch_name
 * @param {Function} callback  must have the following arguments: branch, pref_leaf_name
 */
emailcoinfilter.MozPrefListener = function(branch_name, callback) {
  //Keeping a reference to the observed preference branch or it will get garbage collected.
  mozPrefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);

  this._branch = mozPrefService.getBranch(branch_name);
  this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
  this._callback = callback;
};

// Mozilla Preferences listener methods:
/**
 * Observe.
 *
 * @param subject
 * @param topic
 * @param data
 */
emailcoinfilter.MozPrefListener.prototype.observe = function(subject, topic, data) {
  if (topic == 'nsPref:changed')
    this._callback(this._branch, data);
};

/**
 * Register the listener.
 *
 * @param {boolean} trigger  if true triggers the registered function on registration, that is, when this method is called.
 */
emailcoinfilter.MozPrefListener.prototype.register = function(trigger) {
  this._branch.addObserver('', this, false);

  if (trigger) {
    that = this;
    this._branch.getChildList('', {}).forEach(function(pref_leaf_name) {
      that._callback(that._branch, pref_leaf_name);
    });
  }
};

/**
 * Unregister the listener.
 */
emailcoinfilter.MozPrefListener.prototype.unregister = function() {
  if (this._branch) {
    this._branch.removeObserver('', this);
  }
};
/* --- END Mozilla Preferences Listener class. --- */

/**
 * Defines the EmailCoinFilter preferences listener object.
 */
emailcoinfilter.PreferencesListener = new emailcoinfilter.MozPrefListener("extensions.emailcoinfilter.", function(branch, name) {

  switch (name) {
    case "whitelist.active":
    // extensions.emailcoinfilter.whitelist.active was changed!
    case "blacklist.active":
      // extensions.emailcoinfilter.blacklist.active was changed!
      //      if ((emailcoinfilter.Preferences.isWhitelistActive() &&
      //           !(emailcoinfilter.Preferences.getWhitelist().length == 1 &&
      //           emailcoinfilter.Preferences.getWhitelist()[0] == "")) ||
      //          (emailcoinfilter.Preferences.isBlacklistActive() &&
      //           !(emailcoinfilter.Preferences.getBlacklist().length == 1 &&
      //           emailcoinfilter.Preferences.getBlacklist()[0] == ""))) {// automatically scans incoming emails
      //Launch the window listener:
      // console.log("PreferencesListener added load event");
      addEventListener("load", function() {
        emailcoinfilter.NewEmailListener.load();
      }, true);
      //      }

      //TODO: when the 'automatic scan' preference has changed, it is needed to reboot Thunderbird!
      break;
  }
});

emailcoinfilter.PreferencesListener.register(true);
//emailcoinfilter.PreferencesListener.unregister();
