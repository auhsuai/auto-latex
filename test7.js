const matchStr = "abc\\ndef\\r\\nghi";
console.log(matchStr.replace(/\\r?\\n/g, "^p"));
