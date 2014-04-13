/**
 * @file buttons.js
 * @update 2012/06/18 23:52
 * @author emailCoinFilter@gmail.com
 * @author Paolo Rovelli
 */



/** 
 * Defines the EmailCoinFilter NameSpace.
 */
if ( typeof emailcoinfilter == "undefined" ) {	var emailcoinfilter = {}; }


//Import code modules:
Components.utils.import("resource://emailcoinfilter/preferences.js");
Components.utils.import("resource://emailcoinfilter/scan.js");
Components.utils.import("resource://emailcoinfilter/overlay.js");


/** 
 * Defines the EmailCoinFilter scan window.
 */
emailcoinfilter.ScanWindow = null;


/** 
 * Defines the EmailCoinFilter buttons class.
 * 
 */
emailcoinfilter.Buttons = function() {
	emailcoinfilter.Scan.emailCounter = 0;  // the number of email that are scanned in the current scan
	emailcoinfilter.Scan.spamCounter = 0;  // the number of Spam email that are found in the current scan
	emailcoinfilter.Scan.folderCounter = 0;  // the number of folders that are scanned in the current scan
	emailcoinfilter.Scan.progressCounter = 0;  // the scanning percentage of the current scan
	
	
	
	/** 
	 * Define the methods of the buttons.
	 * 
	 */
	var pub = {
		/** 
		 * Prints the scan result.
		 * 
		 * @param singleEmail  true if it is scanned a single email, false otherwise.
		 */
		scanResults: function(singleEmail) {
			var date = new Date();
			
			//Update the scan window:
			emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanStatus").setAttribute("value", "---");
			emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanTimeEnd").setAttribute("value", date.toLocaleString());
			emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanTimeEndLabel").setAttribute("style", "visibility: visible;");
			emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ProgressBox").setAttribute("value", "100");
			emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanFolderCounter").setAttribute("value", emailcoinfilter.Scan.folderCounter);
			//emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanEmailCounter").setAttribute("value", emailcoinfilter.Scan.emailCounter);
			//emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanSpamCounter").setAttribute("value", emailcoinfilter.Scan.spamCounter);
			
			if ( !singleEmail ) {
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanEmail").setAttribute("value", "");
				
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-EmailSender").setAttribute("value", "---");
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-SpamRate").setAttribute("value", "---");
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ReceivedHeaderFrom").setAttribute("value", "---");
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ReceivedHeaderBy").setAttribute("value", "---");
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-XSpamStatus").setAttribute("value", "---");
				//emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-SecurityInfo").collapsed = true;
			}
			else {  // singleEmail
				emailcoinfilter.ScanWindow.document.getElementById("emailcoinfilter-ScanSummary").collapsed = true;
			}
		},
		
		
		/** 
		 * Defines the action of the scan toolbar button.
		 */
		scan: function() {
			var singleEmail = false;
			
			emailcoinfilter.Scan.emailCounter = 0;
			emailcoinfilter.Scan.spamCounter = 0;
			emailcoinfilter.Scan.folderCounter = 1;
			emailcoinfilter.Scan.progressCounter = 0;
			
			emailcoinfilter.ScanWindow = window.open('chrome://emailcoinfilter/content/scan.xul','','chrome=yes,resizable=yes,centerscreen');
			//emailcoinfilter.ScanWindow.onclose = this.closeScanWindow;
			emailcoinfilter.ScanWindow.onunload = this.closeScanWindow;
			
			//Selected folders in the "folders tree":
			var selectedFolders = gFolderTreeView.getSelectedFolders();
			//Header of the displayed/selected emails:
			//var selectedEmails = gMessageDisplay.displayedMessage;
			//URI of the displayed/selected emails:
			var selectedEmailURIs = gFolderDisplay.selectedMessageUris;
			
			if ( selectedEmailURIs == null ) {  // No one email is selected...
				//var spamList = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
				var spamList = emailcoinfilter.Scan.scanFolders(selectedFolders, true);
				emailcoinfilter.Scan.folderCounter = selectedFolders.length;
				

				//spamList.clear();
				spamList = null;
			}
			else {  // selectedEmailURIs != null  // At least one email is selected...
				var isSpamFound = emailcoinfilter.Scan.scanEmails(selectedEmailURIs, true);
				
				if ( selectedEmailURIs.length == 1 ) {
					singleEmail = true;
				}
			}
			
			//Overlay the Statusbar label:
			spamCounterLabel = emailcoinfilter.Overlay.statusbarOverlay(emailcoinfilter.Scan.emailCounter, emailcoinfilter.Scan.spamCounter);
			document.getElementById("emailcoinfilter-SpamCounterStat").setAttribute('label', spamCounterLabel);
			
			//Update the scan window:
			this.scanResults(singleEmail);
			
			//Add the event in the Activity Manager:
			emailcoinfilter.Overlay.addActivityManagerEvent("indexMail", "EmailCoinFilter scan completed", "Spam: " + emailcoinfilter.Scan.spamCounter + "/" + emailcoinfilter.Scan.emailCounter);
		},
		
		
		/** 
		 * Defines the action when the scan window is closed.
		 */
		closeScanWindow: function() {
			if ( emailcoinfilter.ScanWindow != null ) {
				if ( emailcoinfilter.ScanWindow.closed ) {
					//emailcoinfilter.ScanWindow.close();
					emailcoinfilter.ScanWindow = null;
				}
			}
		},
		
		
		/** 
		 * Prints the source of the selected email.
		 */
		source: function() {
			// URI of the displayed/selected emails:
			var selectedEmailURIs = gFolderDisplay.selectedMessageUris;
			
			if ( selectedEmailURIs != null ) {  // At least one email is selected...
				//View message source:
				goDoCommand("cmd_viewPageSource");
			}  // selectedEmailURIs != null
		},
		
		
		/** 
		 * Adds the senders's email address or domain to the Blacklist.
		 * 
		 * @param dom  true if it is an email domain, otherwise it is an email address.
		 */
		addToBlacklist: function(dom) {
			if ( typeof dom == 'undefined' ) {
				dom = false;
			}
			
			let messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);
			
			//URI of the displayed/selected emails:
			var selectedEmailURIs = gFolderDisplay.selectedMessageUris;
			
			for each (let emailURI in selectedEmailURIs) {
				let emailHeader = messenger.messageServiceFromURI(emailURI).messageURIToMsgHdr(emailURI);  // email header from the email URI
				var email = new emailcoinfilter.Email(emailURI, emailHeader);
				
				if ( dom ) {
					if( !emailcoinfilter.Scan.isInBlacklist(email.authorDomain) ) {  // the sender's email domain is inside the Blacklist
						emailcoinfilter.Preferences.addToBlacklist( email.authorDomain );
					}
				}
				else {  // dom != true
					if ( !emailcoinfilter.Scan.isInBlacklist(email.author) ) {  // the sender's email address is inside the Blacklist
						emailcoinfilter.Preferences.addToBlacklist( email.author );
					}
				}
			}
		},
		
		
		/** 
		 * Adds the senders's email address or domain to the White.
		 * 
		 * @param dom  true if it is an email domain, otherwise it is an email address.
		 */
		addToWhitelist: function(dom) {
			if ( typeof dom == 'undefined' ) {
				dom = false;
			}
			
			let messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);
			
			//URI of the displayed/selected emails:
			var selectedEmailURIs = gFolderDisplay.selectedMessageUris;
			
			for each (let emailURI in selectedEmailURIs) {
				let emailHeader = messenger.messageServiceFromURI(emailURI).messageURIToMsgHdr(emailURI);  // email header from the email URI
				var email = new emailcoinfilter.Email(emailURI, emailHeader);
				
				if ( dom ) {
					if( !emailcoinfilter.Scan.isInWhitelist(email.authorDomain) ) {  // the sender's email domain is inside the Blacklist
						emailcoinfilter.Preferences.addToWhitelist( email.authorDomain );
					}
				}
				else {  // dom != true
					if ( !emailcoinfilter.Scan.isInWhitelist(email.author) ) {  // the sender's email address is inside the Blacklist
						emailcoinfilter.Preferences.addToWhitelist( email.author );
					}
				}
			}
		},
		
		
		/**
		 * Opens a new dialog.
		 * 
		 * @param url  the URL of the dialog.
		 */
		openWindow: function(url) {
			var alreadyOpen = false;
			let windowMediatorEnumerator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getEnumerator(null);
			
			while ( windowMediatorEnumerator.hasMoreElements() ) {
				var openedWindow = windowMediatorEnumerator.getNext();
				try {
					if( openedWindow.location == url ) {
						alreadyOpen = true;
					}
				} catch (e) {}
			}
			
			//Check if the dialog is already open:
			if ( !alreadyOpen ) {
				window.openDialog(url,'','');
			}
		}
	}  // pub
	
	return pub;
}();
