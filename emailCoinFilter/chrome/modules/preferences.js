/**
 * @file preferences.js
 * @update 2012/05/21 16:03
 * @author emailCoinFilter@gmail.com
 * @author Paolo Rovelli
 */

var EXPORTED_SYMBOLS = ["emailcoinfilter"];

/**
 * Defines the EmailCoinFilter NameSpace.
 */
if ( typeof emailcoinfilter == "undefined") {
  var emailcoinfilter = {};
}

/**
 * EmailCoinFilter preferences object literals.
 *
 * @author Paolo Rovelli
 */
emailcoinfilter.Preferences = {
  mozPrefBranch : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.emailcoinfilter."), // nsIPrefBranch

  //Methods:
  getLastLoopTime : function () {
    return this.mozPrefBranch.getIntPref("lastLoopTime");
  },
  
  setLastLoopTime : function (time) {
    this.mozPrefBranch.setIntPref("lastLoopTime", time);
  },

  //Methods:
  getLastTxId : function () {
    return this.mozPrefBranch.getIntPref("lastTxId");
  },
  
  setLastTxId : function (time) {
    this.mozPrefBranch.setIntPref("lastTxId", time);
  },

  /**
   * Gets emailCoin Address.
   *
   * @return  the emailCoin Addresss.
   */
  getEmailCoinAddresss : function() {
    return this.mozPrefBranch.getCharPref("emailCoin.address");
  },

  /**
   * Gets emailCoin Fee.
   *
   * @return  the emailCoin Fee.
   */
  getEmailCoinFee : function() {
    return this.mozPrefBranch.getIntPref("emailCoin.fee");
  },
  
  /** Gets emailCoin rpc address and port.
   *
   * @return  the emailCoin rpc address and port.
   */
  getEmailCoinRpcAddress : function() {
    return this.mozPrefBranch.getCharPref("emailCoin.rpcAddress");
  },
  
  /** Gets emailCoin Amount.
   *
   * @return  the emailCoin Amount.
   */
  getEmailCoinAmount : function() {
    return this.mozPrefBranch.getIntPref("emailCoin.amount");
  },
  
  /**
   * Gets the found Spam counter.
   *
   * @return  the found Spam counter.
   */
  getSpamCounter : function() {
    return this.mozPrefBranch.getIntPref("scan.spam");
  },

  /**
   * Gets the scanned email counter.
   *
   * @return  the scanned email counter.
   */
  getEmailCounter : function() {
    return this.mozPrefBranch.getIntPref("scan.email");
  },

  /**
   * Gets if the automatic AntiSpam scan preference is active or not.
   *
   * @return  true if the automatic AntiSpam scan preference is active, false otherwise.
   */
  isAntiSpamActive : function() {
    return this.mozPrefBranch.getBoolPref("antispam.active");
  },

  /**
   * Gets if the automatic AntiHoax scan preference is active or not.
   *
   * @return  true if the automatic AntiHoax scan preference is active, false otherwise.
   */
  isAntiHoaxActive : function() {
    return this.mozPrefBranch.getBoolPref("antihoax.active");
  },

  /**
   * Gets if the blacklist preference is active or not.
   *
   * @return  true if the blacklist preference is active, false otherwise.
   */
  isBlacklistActive : function() {
    return this.mozPrefBranch.getBoolPref("blacklist.active");
  },

  /**
   * Gets if the whitelist preference is active or not.
   *
   * @return  true if the whitelist preference is active, false otherwise.
   */
  isWhitelistActive : function() {
    return this.mozPrefBranch.getBoolPref("whitelist.active");
  },

  /**
   * Gets if the delete Spam preference is active or not.
   *
   * @return  true if the delete Spam preference is active, false otherwise.
   */
  isDeleteSpamActive : function() {
    return this.mozPrefBranch.getBoolPref("antispam.delete");
  },

  /**
   * Gets if the delete Hoax preference is active or not.
   *
   * @return  true if the delete Hoax preference is active, false otherwise.
   */
  isDeleteHoaxActive : function() {
    return this.mozPrefBranch.getBoolPref("antihoax.delete");
  },

  /**
   * Gets if the delete Blacklist preference is active or not.
   *
   * @return  true if automatically delete blocked senders, false otherwise.
   */
  isDeleteBlacklistActive : function() {
    return this.mozPrefBranch.getBoolPref("blacklist.delete");
  },

  /**
   * Gets the Spam minimum value.
   *
   * @return  the Spam score threshold.
   */
  getSpamMinValue : function() {
    return this.mozPrefBranch.getIntPref("antispam.threshold");
  },

  /**
   * Gets the Hoax minimum value.
   *
   * @return  the Hoax score threshold.
   */
  getHoaxMinValue : function() {
    return this.mozPrefBranch.getIntPref("antihoax.threshold");
  },

  /**
   * Gets the AntiSpam "no-to" (no recipients) rule value.
   *
   * @return  the AntiSpam "no-to" rule value.
   */
  getAntiSpamNoToRuleValue : function() {
    return this.mozPrefBranch.getIntPref("antispam.rules.noto");
  },

  /**
   * Gets the AntiHoax "no-to" (no recipients) rule value.
   *
   * @return  the AntiHoax "no-to" rule value.
   */
  getAntiHoaxNoToRuleValue : function() {
    return this.mozPrefBranch.getIntPref("antihoax.rules.noto");
  },

  /**
   * Gets the AntiSpam "multiple-to" (multiple recipients) rule values.
   *
   * @return  the AntiSpam "multiple-to" rule values (add, every).
   */
  getAntiSpamMultipleToRuleValues : function() {
    var spamRuleValues = new Array(2);
    spamRuleValues[0] = this.mozPrefBranch.getIntPref("antispam.rules.multipleto.add");
    spamRuleValues[1] = this.mozPrefBranch.getIntPref("antispam.rules.multipleto.every");

    return spamRuleValues;
  },

  /**
   * Gets the AntiHoax "multiple-to" (multiple recipients) rule values.
   *
   * @return  the AntiHoax "multiple-to" rule values (add, every).
   */
  getAntiHoaxMultipleToRuleValues : function() {
    var hoaxRuleValues = new Array(2);
    hoaxRuleValues[0] = this.mozPrefBranch.getIntPref("antihoax.rules.multipleto.add");
    hoaxRuleValues[1] = this.mozPrefBranch.getIntPref("antihoax.rules.multipleto.every");

    return hoaxRuleValues;
  },

  /**
   * Gets the words that highly identify Spam emails.
   *
   * @return  the Spam words.
   */
  getSpamHighWords : function() {
    var spamValue = new Array(1);
    spamValue[0] = this.mozPrefBranch.getIntPref("antispam.words.high.value");
    spamWords = this.mozPrefBranch.getCharPref("antispam.words.high").toLowerCase().split("\n");

    if (spamWords.length == 0 || (spamWords.length == 1 && spamWords[0] == "")) {
      return spamValue;
    }

    return spamValue.concat(spamWords);
  },

  /**
   * Gets the words that lowly identify Spam emails.
   *
   * @return  the Spam words.
   */
  getSpamLowWords : function() {
    var spamValue = new Array(1);
    spamValue[0] = this.mozPrefBranch.getIntPref("antispam.words.low.value");
    spamWords = this.mozPrefBranch.getCharPref("antispam.words.low").toLowerCase().split("\n");

    if (spamWords.length == 0 || (spamWords.length == 1 && spamWords[0] == "")) {
      return spamValue;
    }

    return spamValue.concat(spamWords);
  },

  /**
   * Gets the words that highly identify Hoax emails.
   *
   * @return  the Hoax words.
   */
  getHoaxHighWords : function() {
    var hoaxValue = new Array(1);
    hoaxValue[0] = this.mozPrefBranch.getIntPref("antihoax.words.high.value");
    hoaxWords = this.mozPrefBranch.getCharPref("antihoax.words.high").toLowerCase().split("\n");

    if (hoaxWords.length == 0 || (hoaxWords.length == 1 && hoaxWords[0] == "")) {
      return hoaxValue;
    }

    return hoaxValue.concat(hoaxWords);
  },

  /**
   * Gets the words that lowly identify Hoax emails.
   *
   * @return  the Hoax words.
   */
  getHoaxLowWords : function() {
    var hoaxValue = new Array(1);
    hoaxValue[0] = this.mozPrefBranch.getIntPref("antihoax.words.low.value");
    hoaxWords = this.mozPrefBranch.getCharPref("antihoax.words.low").toLowerCase().split("\n");

    if (hoaxWords.length == 0 || (hoaxWords.length == 1 && hoaxWords[0] == "")) {
      return hoaxValue;
    }

    return hoaxValue.concat(hoaxWords);
  },

  /**
   * Gets if the X-Spam-Status header preference is active or not.
   *
   * @return  true if the X-Spam-Status header preference is active, false otherwise.
   */
  isXSpamStatusHeaderActive : function() {
    return this.mozPrefBranch.getBoolPref("header.xspamstatus");
  },

  /**
   * Gets if the received header preference is active or not.
   *
   * @return  true if the received header preference is active, false otherwise.
   */
  isReceivedHeaderActive : function() {
    return this.mozPrefBranch.getBoolPref("header.received");
  },

  /**
   * Gets the blacklist.
   *
   * @return  the blacklist.
   */
  getBlacklist : function() {
    return this.mozPrefBranch.getCharPref("blacklist").split("\n");
  },

  /**
   * Gets the whitelist.
   *
   * @return  the whitelist.
   */
  getWhitelist : function() {
    return this.mozPrefBranch.getCharPref("whitelist").split("\n");
  },

  /**
   * Add the number of new Spam found to the Spam counter.
   *
   * @param numToAdd the number of new Spam found.
   */
  addToSpamCounter : function(numToAdd) {
    this.mozPrefBranch.setIntPref("scan.spam", this.getSpamCounter() + numToAdd);
  },

  /**
   * Add the number of new email scanned to the email counter.
   *
   * @param numToAdd the number of new Spam found.
   */
  addToEmailCounter : function(numToAdd) {
    this.mozPrefBranch.setIntPref("scan.email", this.getEmailCounter() + numToAdd);
  },

  /**
   * Add an email address or domain to the blacklist preference string.
   *
   * @param itemToAdd  the email address or domain to be added to the blacklist preference array.
   */
  addToBlacklist : function(itemToAdd) {
    blacklist = this.mozPrefBranch.getCharPref("blacklist");

    if (blacklist == "") {
      blacklist = itemToAdd;
    } else {// blacklist.length != 1 || blacklist[0] != ""
      blacklist += "\n" + itemToAdd;
    }

    this.mozPrefBranch.setCharPref("blacklist", blacklist.replace(/[^\S\r\n]/g, "").replace(/[,;]/g, ""));
  },

  /**
   * Add an email address or domain to the whitelist preference string.
   *
   * @param itemToAdd  the email address or domain to be added to the whitelist preference array.
   */
  addToWhitelist : function(itemToAdd) {
    whitelist = this.mozPrefBranch.getCharPref("whitelist");

    if (whitelist == "") {
      whitelist = itemToAdd;
    } else {// blacklist.length != 1 || blacklist[0] != ""
      whitelist += "\n" + itemToAdd;
    }

    this.mozPrefBranch.setCharPref("whitelist", whitelist.replace(/[^\S\r\n]/g, "").replace(/[,;]/g, ""));
  }
};
