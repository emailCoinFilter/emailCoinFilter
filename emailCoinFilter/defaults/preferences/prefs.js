/**
 * @file prefs.js
 * @update 2012/06/18 19:08
 * @author emailCoinFilter@gmail.com
 * @author Paolo Rovelli
 */

pref("extensions.emailcoinfilter.scan.spam", 0);
pref("extensions.emailcoinfilter.scan.email", 0);

pref("extensions.emailcoinfilter.emailCoin.address", "");
pref("extensions.emailcoinfilter.emailCoin.amount", 10);
pref("extensions.emailcoinfilter.emailCoin.fee", 0);
pref("extensions.emailcoinfilter.emailCoin.filterAmount", 10);
pref("extensions.emailcoinfilter.emailCoin.rpcAddress", "http://127.0.0.1:22555/");

pref("extensions.emailcoinfilter.lastLoopTime", 0);
pref("extensions.emailcoinfilter.lastTxId",0);

pref("extensions.emailcoinfilter.blacklist", "");
pref("extensions.emailcoinfilter.blacklist.active", true);
pref("extensions.emailcoinfilter.blacklist.delete", true);

pref("extensions.emailcoinfilter.whitelist", "");
pref("extensions.emailcoinfilter.whitelist.active", true);

pref("extensions.emailcoinfilter.header.received", true);
pref("extensions.emailcoinfilter.header.xspamstatus", true);

pref("extensions.emailcoinfilter@emailcoin.info description", "chrome://emailcoinfilter/locale/overlay.properties");
