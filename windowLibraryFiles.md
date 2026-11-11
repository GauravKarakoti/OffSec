# Obtaining Code Execution via Windows Library Files

> **Topic:** Windows Library (`.library-ms`) files, WebDAV, and remote code execution  
> **Context:** A controlled penetration-testing lab using Kali Linux and a Windows 11 target.

## 1. Overview

A Windows Library file (`.library-ms`) is an XML-based configuration file that describes a Windows library and the locations it includes. In this demonstration, a crafted library configuration points to a remote WebDAV location controlled by the tester.

When the target opens the library, Windows accesses the remote location. The demonstration then uses a shortcut placed on the remote share to cause a program to run. The resulting connection provides a PowerShell session in the lab.

The general flow is:

1. Set up a WebDAV share on the Kali machine.
2. Create a crafted `.library-ms` file that references the WebDAV share.
3. Make the target open the library file.
4. Place and invoke a shortcut from the remote location.
5. Receive and verify the resulting session.

## 2. Lab environment

| Component | Role |
|---|---|
| Kali Linux | Attacker/test machine; hosts the WebDAV share and listener |
| Windows 11 | Lab target |
| WsgiDAV | Serves the remote WebDAV directory |
| Windows Library file | Points Windows Explorer to the remote location |
| Windows shortcut (`.lnk`) | Used in the demonstration to initiate program execution |
| Netcat | Receives the connection in the lab |

Your own addresses, interface, and directory paths will be different.

## 3. Set up the WebDAV directory

On Kali, create a directory for the WebDAV content and a placeholder file:

```bash
mkdir -p /home/kali/webdav
touch /home/kali/webdav/test.txt
```

Start WsgiDAV, configured to listen on port 80 and serve that directory:

```bash
/home/kali/.local/bin/wsgidav \
  --host=0.0.0.0 \
  --port=80 \
  --auth=anonymous \
  --root=/home/kali/webdav/
```

WsgiDAV serving on:

```text
http://0.0.0.0:80
```

### Important security note

The demonstration enables anonymous access and exposes a writable share. This is suitable only for an isolated, temporary lab. Do not expose an anonymous writable WebDAV server to an untrusted network or the public internet. Use authentication, TLS, firewall restrictions, and a disposable lab environment where appropriate.

## 4. Create the Windows Library file

Create [`config.Library-ms`](./windowsLibraryFiles.Library-ms) in the Windows user's Desktop directory and edits it as XML in Visual Studio Code.

### What the XML fields do

- `libraryDescription`: Root element defining a Windows Library.
- `name`: Resource-based display name.
- `version`: Library file format version.
- `isLibraryPinned`: Indicates whether the library is pinned.
- `iconReference`: Selects the icon displayed for the library.
- `templateInfo` / `folderType`: Specifies the library's folder template.
- `searchConnectorDescriptionList`: Lists locations included in the library.
- `simpleLocation` / `url`: Specifies the remote location Windows should access.

The remote location changed to a WebDAV path resembling:

```text
\\LAB-SERVER\DavWWWRoot
```

The exact path and serialization data are environment-dependent.

## 5. Open the library on Windows

The demonstration transfers or places `config.Library-ms` on the Windows target and opens it in File Explorer.

Windows displays a notice that some library features are unavailable because the location is unsupported. Despite that notice, the remote location is accessed and the remote directory contents become visible.

Visual Studio Code displays an **untrusted files** prompt. This is a separate application trust warning; it is not the Windows Library security mechanism.

## 6. Shortcut stage

The demonstration uses a [Windows shortcut (`.lnk`)](./windowLibraryFiles.lnk) associated with the remote library location. The shortcut is the execution stage: when opened by the target, it launches the configured program.

A shortcut can contain a target path and optional arguments. Because a malicious shortcut can execute commands, inspect shortcut properties and targets before opening files received from untrusted sources.

**Safety note:** This document intentionally does not reproduce a weaponized shortcut target or reverse-shell command. Reproduce this stage only with a benign test program in a disposable, authorized lab.

## 7. Transfer and listener observations

The tester transfers `config.Library-ms` to a Windows-accessible share using `smbclient`. Start a Netcat listener on port `4444`:

```bash
nc -nvlp 4444
```

After the shortcut stage, the listener receives a connection from the Windows machine. The resulting prompt is Windows PowerShell.

The tester runs:

```powershell
whoami
```

The output identifies the account under which the process is running. This confirms that the demonstration achieved command execution in the lab context; it does not, by itself, imply administrator or SYSTEM privileges.

## 8. Attack chain summary

```text
Kali Linux
   |
   | 1. Host a WebDAV directory
   v
WsgiDAV WebDAV server
   |
   | 2. Library file references remote location
   v
Windows target opens config.Library-ms
   |
   | 3. Explorer accesses the remote location
   v
Remote directory / shortcut is presented
   |
   | 4. Shortcut is opened in the demonstration
   v
Program execution on Windows
   |
   | 5. Outbound connection reaches the lab listener
   v
PowerShell session
   |
   | 6. Verify execution context
   v
whoami
```

## 9. Key takeaways

- `.library-ms` files are XML configuration files used by Windows Libraries.
- A library can reference remote locations, including WebDAV-backed locations.
- A remote location can make attacker-controlled content appear in a user's Explorer workflow.
- A shortcut (`.lnk`) can launch a program when opened; therefore, shortcuts from untrusted locations must be treated as potentially executable content.
- A successful callback proves code execution under the context of the launched process, not necessarily privilege escalation.
- The attack relies on user interaction in the demonstrated workflow.

## 10. Defensive measures

1. **Treat unexpected Library files as untrusted.** Do not open `.library-ms` files received through unsolicited messages or downloads.
2. **Inspect shortcut files.** Check the target and arguments of `.lnk` files before execution.
3. **Restrict WebDAV where it is not required.** Apply endpoint and network controls to limit unnecessary outbound WebDAV/HTTP access.
4. **Apply egress filtering.** Restrict unexpected outbound connections, especially to untrusted hosts and unusual ports.
5. **Use endpoint protection and application control.** Monitor suspicious process launches and block unapproved execution paths.
6. **Monitor Windows Explorer activity.** Investigate unexpected remote library access and shortcut execution.
7. **Keep systems patched.** Apply current Windows security updates and organizational hardening baselines.
8. **Train users.** Explain that a Library file or shortcut is not automatically safe just because it looks like a normal Windows folder or document.

## 11. Useful investigation questions

- Which remote locations are referenced by the Library file?
- Does the Library file point to an HTTP/WebDAV resource outside the organization?
- Which process opened the shortcut?
- What process was launched, with what command line and parent process?
- Which account owned the resulting process?
- Was the outbound connection expected and authorized?
- Did the activity result in only user-level execution, or is there separate evidence of privilege escalation?