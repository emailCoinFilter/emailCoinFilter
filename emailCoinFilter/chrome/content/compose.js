/**
 * @file compose.js
 * @update 2012/02/28 10:03
 * @author emailCoinFilter@gmail.com
 * @author Paolo Rovelli
 * @version 0.1
 */

//Import code modules:
Components.utils.import("resource://emailcoinfilter/preferences.js");
//for debugging
console = (Components.utils.import("resource://gre/modules/devtools/Console.jsm", {})).console;

var coinOfferSignedMessageString;

var attachCoin = function()
{
  //TODO:
  //if known emailCoin address then just get a signed transaction and attach it
  var sendCoinAddress = document.getElementById("addressTextBox");
  var sendCoinAmount = document.getElementById("amountTextBox");
  console.log("amount is " + sendCoinAmount.value);
  if(sendCoinAddress.value!="")
  {
    var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
    var requestObj = {};
    requestObj.id = "emailCoin";
    requestObj.method = "listunspent";
    var getInfoRequestString = JSON.stringify(requestObj);
    httpRequest = new XMLHttpRequest();
    httpRequest.open("POST", fullUrl, true);
    httpRequest.onload = listUnspentReceived;
    httpRequest.onerror = function () { alert("Error rpc not open"); };
    httpRequest.send(getInfoRequestString);
  }
  else
  {
    //if unknown emailCoin address then send a signned message of the offer, msg ID ... 
    var coinOfferSignedMessage = {};
    // a transaction ID to ensure this is only redeemed once
    var txId=emailcoinfilter.Preferences.getLastTxId()+1;
    emailcoinfilter.Preferences.setLastTxId(txId);
    coinOfferSignedMessage.offerId = txId;
    var sendCoinAmount = document.getElementById("amountTextBox");  
    coinOfferSignedMessage.message = "This is an offer of " + sendCoinAmount.value + " Dogecoin to ensure this messages makes it to your inbox.";
    coinOfferSignedMessage.amount = emailcoinfilter.Preferences.getEmailCoinAmount();
    coinOfferSignedMessageString = JSON.stringify(coinOfferSignedMessage);
  
    var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
    var requestObj = {};
    requestObj.id = "emailCoin";
    requestObj.method = "signmessage";
    requestObj.params = [emailcoinfilter.Preferences.getEmailCoinAddresss(), coinOfferSignedMessageString];
    var getInfoRequestString = JSON.stringify(requestObj);
    
    httpRequest = new XMLHttpRequest();
    httpRequest.open("POST", fullUrl, true);
    httpRequest.onload = offerMessageReceived;
    httpRequest.onerror = function () { alert("Error rpc not open"); };
    httpRequest.send(getInfoRequestString);
  }
};

var spendingTx=[];
var totalSpending=0;
var listUnspentReceived = function()
{
  if (httpRequest.responseText)
  {
    console.log("response was " + httpRequest.responseText);
    var response = JSON.parse(httpRequest.responseText);
    if(response.result)
    {
      console.log("result is " + JSON.stringify(response.result));
      console.log("result array length is " + response.result.length);
        //find unspent amounts
      var sendAmount = document.getElementById("amountTextBox").value +
                       emailcoinfilter.Preferences.getEmailCoinFee();
      if(sendAmount<=0)
      {
        alert("eMailCoin Amount must be more than zero");
        return;
      }                 
      
      spendingTx=[];
      totalSpending=0;
      i=0;
      while(i<response.result.length && totalSpending<sendAmount)
      {
        console.log("txid is " + response.result[i].txid);
        console.log("vout is " + response.result[i].vout);
        unspentTx={};
        unspentTx.txid=response.result[i].txid;
        unspentTx.vout=response.result[i].vout;
        totalSpending=totalSpending+response.result[i].amount;
        spendingTx.push(unspentTx);
        console.log("sendAmount " + sendAmount + " totalSpending " + totalSpending);
        i++;      
      }
      console.log("spendingTx is " + JSON.stringify(spendingTx));
      var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
      var requestObj = {};
      requestObj.id = "emailCoin";
      requestObj.method = "lockunspent";
      requestObj.params = [true, spendingTx]; //FIXME: currently unlocking
      var getInfoRequestString = JSON.stringify(requestObj);    
      httpRequest = new XMLHttpRequest();
      httpRequest.open("POST", fullUrl, true);
      httpRequest.onload = lockUnspentReceived;
      httpRequest.send(getInfoRequestString);
    }
    else
    {
      alert(response.error.message);
    }
  }
};

var lockUnspentReceived = function()
{
  if (httpRequest.responseText)
  {
    console.log("lockUnspentReceived response was " + httpRequest.responseText);
    var response = JSON.parse(httpRequest.responseText);
  
    if(response.result)
    {
      var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
      var requestObj = {};
      requestObj.id = "emailCoin";
      requestObj.method = "createrawtransaction";
      var sendCoinAmount = document.getElementById("amountTextBox").value;
      var sendCoinAddress = document.getElementById("addressTextBox").value;
      //TODO: need to make sure total is correct with small miner fee
      var remaining = totalSpending - sendCoinAmount;
      var sendToAddressesString ='{"' + sendCoinAddress + '":' + sendCoinAmount + ',"'  + 
          emailcoinfilter.Preferences.getEmailCoinAddresss() + '":' + remaining + '}';
      
      sendToAddresses=JSON.parse(sendToAddressesString);
      requestObj.params = [spendingTx , sendToAddresses ];
      var getInfoRequestString = JSON.stringify(requestObj);
      console.log("requestObj is " +getInfoRequestString);
      
      httpRequest = new XMLHttpRequest();
      httpRequest.open("POST", fullUrl, true);
      httpRequest.onload = createRawTransactionReceived;
      httpRequest.send(getInfoRequestString);
    }
    else
    {
      alert(response.error.message);
    }
  }
};


var createRawTransactionReceived = function()
{
  if (httpRequest.responseText)
  {
    console.log("createRawTransactionReceived response was " + httpRequest.responseText);
    var response = JSON.parse(httpRequest.responseText);
    if(response.result)
    {
      var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
      var requestObj = {};
      requestObj.id = "emailCoinDecode";
      requestObj.method = "decoderawtransaction";
      requestObj.params = [response.result];
      var getInfoRequestString = JSON.stringify(requestObj);
      console.log("requestObj is " + getInfoRequestString);
      
      httpRequest = new XMLHttpRequest();
      httpRequest.open("POST", fullUrl, true);
      httpRequest.onload = decoderawtransactionReceived;
      httpRequest.send(getInfoRequestString);
    }
    if(response.result)
    {
      var fullUrl = emailcoinfilter.Preferences.getEmailCoinRpcAddress();
      var requestObj = {};
      requestObj.id = "emailCoinSign";
      requestObj.method = "signrawtransaction";
      requestObj.params = [response.result];
      var getInfoRequestString = JSON.stringify(requestObj);
      console.log("requestObj is " +getInfoRequestString);
      
      httpRequest = new XMLHttpRequest();
      httpRequest.open("POST", fullUrl, true);
      httpRequest.onload = signRawTransactionReceived;
      httpRequest.send(getInfoRequestString);
    }
    else
    {
      alert(response.error.message);
    }
  }
};

//debug
var decoderawtransactionReceived = function()
{  
  if (httpRequest.responseText)
  {
    console.log("decoderawtransactionReceived response was " + httpRequest.responseText);
  }
};

var signRawTransactionReceived = function()
{
  if (httpRequest.responseText)
  {
    console.log("responses was " + httpRequest.responseText);
    var response = JSON.parse(httpRequest.responseText);

    var coinOffer = {};
    coinOffer.emailCoin = "transaction";
    coinOffer.signingAddress = emailcoinfilter.Preferences.getEmailCoinAddresss();
    var sendCoinAmount = document.getElementById("amountTextBox");  
    coinOffer.message = "This is a signed transaction of " + sendCoinAmount.value + " Dogecoin to ensure this messages makes it to your inbox.";
    coinOffer.messageSigned = coinOfferSignedMessageString;
    coinOffer.transaction = response.result.hex;
    var coinOfferString = JSON.stringify(coinOffer);
    console.log("tranaction String is " + coinOfferString);

    //write this to a file so it can be attached to the email
    Components.utils.import("resource://gre/modules/FileUtils.jsm");
    Components.utils.import("resource://gre/modules/NetUtil.jsm");
    var file = FileUtils.getFile("TmpD", ["emailCoin.txt"]);
    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
    
    // You can also optionally pass a flags parameter here. It defaults to
    // FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
    var ostream = FileUtils.openSafeFileOutputStream(file);
    var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                    createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var istream = converter.convertToInputStream(coinOfferString);
    // The last argument (the callback) is optional.
    NetUtil.asyncCopy(istream, ostream, function(status) {
      if (!Components.isSuccessCode(status)) {
        // Handle error!
        return;
      }
    });

//TODO: need to delete old emailCoin.txt files

    var commandLine = Components.classes["@mozilla.org/toolkit/command-line;1"].createInstance();
    var uri = commandLine.resolveURI(file.path);
    var attachment = Components.classes["@mozilla.org/messengercompose/attachment;1"]
                               .createInstance(Components.interfaces.nsIMsgAttachment);
    // If uri is for a file and it exists set the attachment size.
    if (uri instanceof Components.interfaces.nsIFileURL)
    {
      if (uri.file.exists())
      {
        attachment.size = coinOfferString.length;
        attachment.name = "emailCoin.txt";
      }
      else
      {
        attachment = null;
      }
    }

    // Only want to attach if a file that exists
    if (attachment)
    {
      attachment.url = uri.spec;
      bucket = document.getElementById("attachmentBucket");
      addedAttachments = Components.classes["@mozilla.org/array;1"]
                                   .createInstance(Components.interfaces.nsIMutableArray);
      item = bucket.appendItem(attachment);
      addedAttachments.appendElement(attachment, false);
      document.getElementById("attachments-box").collapsed = false;
      document.getElementById("attachmentbucket-sizer").collapsed = false;
                                   
      var theText = "This mail is sent with a new technology that is designed to help you to take back control of your inbox. " +  
                    "To learn more about this empowering new technology visit http://emailCoinFilter.com";
      var editor = GetCurrentEditor();  
      var editor_type = GetCurrentEditorType();  
      editor.beginTransaction();  
      editor.endOfDocument(); // seek to end  
      if( editor_type == "textmail" || editor_type == "text" ) 
      {  
        editor.insertText( theText );  
        editor.insertLineBreak();  
      } 
      else 
      {  
        editor.insertHTML( "<p>" + theText + "</p>" );  
      }  
      editor.endTransaction();

   }
   else
   {
    var title = getComposeBundle().getString("errorFileAttachTitle");
    var msg = getComposeBundle().getFormattedString("errorFileAttachMessage",
                                                  [attachmentName]);
      Services.prompt.alert(window, title, msg);
    }

  }
  //need to delete file.path when done attaching
  
};   

var offerMessageReceived = function()
{
  if (httpRequest.responseText)
  {
    var response = JSON.parse(httpRequest.responseText);
    if(response.result)
    {
      var coinOffer = {};
      coinOffer.emailCoin = "offer";
      coinOffer.signingAddress = emailcoinfilter.Preferences.getEmailCoinAddresss();
      coinOffer.messageSigned = coinOfferSignedMessageString;
      coinOffer.messageSignature = response.result;
      var coinOfferString = JSON.stringify(coinOffer);
      console.log("coinOffer response is " + httpRequest.responseText);    
      console.log("coinOfferString is " + coinOfferString);
  
      //write this to a file so it can be attached to the email
      Components.utils.import("resource://gre/modules/FileUtils.jsm");
      Components.utils.import("resource://gre/modules/NetUtil.jsm");
      var file = FileUtils.getFile("TmpD", ["emailCoin.txt"]);
      file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, FileUtils.PERMS_FILE);
      
      // You can also optionally pass a flags parameter here. It defaults to
      // FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE;
      var ostream = FileUtils.openSafeFileOutputStream(file);
      var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
                      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      converter.charset = "UTF-8";
      var istream = converter.convertToInputStream(coinOfferString);
      // The last argument (the callback) is optional.
      NetUtil.asyncCopy(istream, ostream, function(status) {
        if (!Components.isSuccessCode(status)) {
          // Handle error!
          return;
        }
      });
  
     //TODO: need to delete old emailCoin.txt files
  
      var commandLine = Components.classes["@mozilla.org/toolkit/command-line;1"].createInstance();
      var uri = commandLine.resolveURI(file.path);
      var attachment = Components.classes["@mozilla.org/messengercompose/attachment;1"]
                                 .createInstance(Components.interfaces.nsIMsgAttachment);
      // If uri is for a file and it exists set the attachment size.
      if (uri instanceof Components.interfaces.nsIFileURL)
      {
        if (uri.file.exists())
        {
          attachment.size = coinOfferString.length;
          attachment.name = "emailCoin.txt";
        }
        else
        {
          attachment = null;
        }
      }

      // Only want to attach if a file that exists
      if (attachment)
      {
        attachment.url = uri.spec;
        bucket = document.getElementById("attachmentBucket");
        addedAttachments = Components.classes["@mozilla.org/array;1"]
                                     .createInstance(Components.interfaces.nsIMutableArray);
        item = bucket.appendItem(attachment);
        addedAttachments.appendElement(attachment, false);
        document.getElementById("attachments-box").collapsed = false;
        document.getElementById("attachmentbucket-sizer").collapsed = false;
                                     
        var theText = "This mail is sent with a new technology that is designed to help you to take back control of your inbox. " +  
                      "To learn more about this empowering new technology visit http://emailCoinFilter.com";
        var editor = GetCurrentEditor();  
        var editor_type = GetCurrentEditorType();  
        editor.beginTransaction();  
        editor.endOfDocument(); // seek to end  
        if( editor_type == "textmail" || editor_type == "text" ) 
        {  
          editor.insertText( theText );  
          editor.insertLineBreak();  
        } 
        else 
        {  
          editor.insertHTML( "<p>" + theText + "</p>" );  
        }  
        editor.endTransaction();
  
      }
      else
      {
        var title = getComposeBundle().getString("errorFileAttachTitle");
        var msg = getComposeBundle().getFormattedString("errorFileAttachMessage",
                                                     [attachmentName]);
        Services.prompt.alert(window, title, msg);
      }
    }
    else
    {
      alert(response.error.message);
    }
  }
  //need to delete file.path when done attaching
};

var loadCompose = function() 
{
  var amount = emailcoinfilter.Preferences.getEmailCoinAmount();
  var sendCoinAmount = document.getElementById("amountTextBox");
  sendCoinAmount.value=emailcoinfilter.Preferences.getEmailCoinAmount();
};

var unloadCompose = function() 
{
  console.log("close compose function");
};


addEventListener("load", function() { loadCompose();}, true);
addEventListener("close", function() { unloadCompose();}, true);
