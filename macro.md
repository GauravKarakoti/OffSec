# Leveraging Microsoft Word Macros

> Topic: Microsoft Word VBA macros, macro-enabled documents, automatic macro execution events, and the security risks of using macros to launch external processes.  
> Environment: Kali Linux, a Windows 11 virtual machine accessed over FreeRDP, Microsoft Word 2019, the VBA editor, PowerShell, and a Kali Netcat listener.

## 1. Overview

Microsoft Word supports macros: small programs written in Visual Basic for Applications (VBA) that automate tasks inside Office applications.

Macros can be useful for legitimate automation, but they can also be abused. A malicious document may contain VBA that starts another program or performs actions when the document is opened. This technique is commonly associated with phishing and initial-access attacks.

This is a high-risk behavior: the receiving side obtains an interactive PowerShell session on the Windows test machine.

## 2. Lab environment shown

- **Kali Linux:** attacker-side testing workstation.
- **Windows 11 virtual machine:** target workstation, accessed using FreeRDP.
- **Microsoft Word 2019:** used to create and open a Word document.
- **VBA editor:** used to create and inspect a macro.
- **PowerShell:** child process launched by the macro in the demonstration.
- **Netcat (`nc`):** listener shown on the Kali machine.
- **Base64 encoder:** shown as a way of representing command text.

Only reproduce this kind of testing in a disposable, isolated lab with systems you own or are explicitly authorized to assess. Do not send macro-enabled files to unsuspecting users.

## 3. Important concepts

### 3.1 VBA macros

VBA is the scripting language built into Microsoft Office. In Word, macros can automate document operations and interact with the Windows environment.

Macros are stored in macro-capable Office formats, such as:

- `.docm` — Word document that can contain macros.
- `.dotm` — Word template that can contain macros.

A regular `.docx` file does not store VBA macros in the same way.

### 3.2 Macro event procedures

[Word](./macro.doc) exposes event procedures that can run when a document or template is opened.

This matters because a macro does not necessarily need a user to click a visible button. Depending on the event, document settings, Office version, and macro security policy, code may be invoked as part of opening a document.

### 3.3 Launching external processes

VBA using the Windows Script Host `WScript.Shell` object to start PowerShell.

This is a significant security boundary: a Word macro that launches a command interpreter can move beyond document automation and begin interacting with the operating system.

### 3.4 PowerShell and Base64

[Encoding](./macro.py) is a representation change, not encryption: the original content can be recovered by decoding it.

PowerShell's encoded-command mechanism uses UTF-16LE bytes before Base64 encoding. This format is frequently encountered in incident response, so analysts should know how to recognize and safely decode it for inspection.

## 4. Demonstration flow

1. Start the Windows virtual machine and connect to it from Kali using FreeRDP.
2. Open Microsoft Word and create a blank document.
3. Open Word's Macro dialog and create a new macro.
4. Enter the VBA editor and inspect the generated macro procedure.
5. Add a VBA routine that launches PowerShell through the Windows Script Host.
6. Add document-opening event procedures that call the macro routine.
7. Save the document in a macro-capable format.
8. Reopen the document in the Windows VM.
9. Prepare a PowerShell command representation using Base64.
10. Start a Netcat listener on the Kali machine.
11. Observe the Windows PowerShell session connect back to the listener.

The macro-driven process launch resulted in a remote shell in the isolated demonstration environment.

The notes intentionally omit the reverse-shell command, listener/execution pairing, and a ready-to-use malicious macro.

## 5. Why this technique is dangerous

A malicious Office macro can potentially:

- Start command interpreters or other programs.
- Download or run additional scripts.
- Establish outbound network connections.
- Access files and data available to the logged-in user.
- Act as a first stage for further compromise.

The impact depends on the user's permissions, Office security settings, endpoint protection, network controls, and the behavior of the launched process.

A reverse shell is especially serious because it can give a remote operator an interactive interface to the compromised machine.

## 6. Defensive measures

### 6.1 Restrict macros

- Block macros from the internet where possible.
- Use organizational policy to disable or restrict VBA macros that are not required.
- Allow only signed macros from trusted publishers.
- Avoid enabling macros merely because a document asks the user to do so.

### 6.2 Use Protected View and trusted locations carefully

- Keep Protected View enabled for files from untrusted sources.
- Do not mark broad folders as trusted locations.
- Verify the sender and context before enabling editing or macros.
- Treat unexpected macro-enabled attachments as suspicious.

### 6.3 Monitor Office child processes

Security monitoring should pay particular attention when Office applications launch:

- `powershell.exe` or `pwsh.exe`
- `cmd.exe`
- `wscript.exe` or `cscript.exe`
- `mshta.exe`
- Other scripting engines or unexpected executables

Office applications launching command interpreters is not always malicious, but it is an important signal for investigation.

### 6.4 Apply endpoint and network controls

- Keep Microsoft Office and Windows updated.
- Use Microsoft Defender or another endpoint detection and response product.
- Enable attack surface reduction rules appropriate to the environment.
- Restrict unnecessary outbound network connections.
- Use standard-user accounts for everyday work.
- Maintain reliable backups.

### 6.5 Incident response

If a suspicious macro has been opened:

1. Disconnect the affected machine from the network if active compromise is suspected.
2. Preserve relevant alerts, process information, and logs.
3. Review Office process creation and child-process activity.
4. Check for unexpected scheduled tasks, startup entries, and scripts.
5. Run an endpoint security scan.
6. Rotate credentials that may have been exposed.
7. Rebuild the machine if compromise cannot be confidently contained.

## 7. Safe analysis checklist

- [ ] Use a disposable virtual machine with snapshots.
- [ ] Keep the VM isolated from personal and production networks.
- [ ] Inspect macro-enabled documents without enabling macros on a normal workstation.
- [ ] Review VBA source in the Office VBA editor or a suitable static-analysis tool.
- [ ] Identify automatic event procedures such as document-open handlers.
- [ ] Look for process-launching APIs and references to command interpreters.
- [ ] Inspect encoded strings as data; do not execute decoded content.
- [ ] Monitor process creation and network activity in the lab.
- [ ] Revert the VM snapshot after the exercise.

## 8. Key takeaways

- Word macros are designed for Office automation but can be abused to launch operating-system processes.
- Macro-enabled documents use formats such as `.docm` and `.dotm`.
- Document event procedures can trigger macro routines when a document is opened.
- A macro that launches PowerShell crosses from document automation into operating-system execution.
- Base64 is encoding, not encryption; it can obscure a command's appearance but does not make it safe.
- Office applications spawning scripting tools and unexpected outbound connections are valuable detection signals.
- Restricting macros, using Protected View, monitoring child processes, and applying least privilege reduce risk.

## 9. Terminology

- **VBA:** Visual Basic for Applications, the macro language used by Microsoft Office.
- **Macro:** A script that automates actions in an Office application.
- **`.docm`:** Word macro-enabled document format.
- **`.dotm`:** Word macro-enabled template format.
- **Document-open event:** An event procedure that can run when a Word document is opened.
- **PowerShell:** Microsoft's command-line shell and scripting language.
- **Windows Script Host:** Windows component that exposes scripting objects such as `WScript.Shell`.
- **Base64:** A text representation of binary data; it is not encryption.
- **Reverse shell:** A command session initiated from the target machine back to a listening system.
- **FreeRDP:** A client implementation used to connect to systems over Remote Desktop Protocol.
- **Netcat:** A networking utility often used to read from and write to network connections.