# Remote File Inclusion (RFI)

> Topic: Remote File Inclusion (RFI), its relationship to PHP file inclusion, and the security impact of loading attacker-controlled code.  
> Environment: Kali Linux terminal, `curl`, a PHP-based web application, and a PHP web-shell example.

## 1. Overview

Remote File Inclusion (RFI) is a vulnerability in which an application accepts a user-controlled value as a file or resource to include, and an attacker can cause the application to load content from a remote location.

In vulnerable PHP applications, this can happen when a request parameter is passed into an inclusion function without strict validation. If remote inclusion is enabled and the application does not constrain the input, the server may retrieve and execute attacker-controlled PHP code.

RFI can lead to remote code execution (RCE), depending on the application's implementation and server configuration.

## 2. RFI vs. LFI

| Feature | Remote File Inclusion (RFI) | Local File Inclusion (LFI) |
|---|---|---|
| Source of included file | Remote host or URL | File already present on the target server |
| Main weakness | Untrusted input controls a remote include | Untrusted input controls a local file path |
| Typical impact | Potential execution of remote code | Sensitive file disclosure; sometimes code execution |
| Key dependency | Remote inclusion capability and server configuration | File path handling and filesystem permissions |

Both vulnerabilities arise when applications treat untrusted input as a file reference.

## 3. Lab components shown

- **Kali Linux:** testing environment.
- **PHP web application:** the application being assessed.
- **Terminal:** used to inspect a PHP example and issue HTTP requests.
- **`curl`:** used to send requests to the application and observe responses.
- **PHP web-shell example:** a file shown under the PHP web-shell examples directory. The example accepts a request parameter and passes it to a system command function.

Only reproduce security testing in an isolated environment that you own or are explicitly authorized to assess.

## 4. Demonstration flow

1. Open a Kali Linux terminal and prepare the lab.
2. Review a PHP web-shell example located in the system's PHP web-shell examples directory.
3. Inspect the example's behavior: it reads a request parameter, invokes a system command, and displays the command output.
4. Identify a PHP application endpoint that accepts a page or file parameter.
5. Send an HTTP request to the lab application while supplying a remote resource reference through that parameter.
6. Observe the response from the application. The demonstration uses a harmless directory-listing operation to show that the [included PHP code](./remoteFileInclusion.php) is being interpreted in the target's server context.
7. Review the result and the security implications of allowing an untrusted remote resource to be included.

## 5. Understanding the PHP web-shell example

- Checks whether a request parameter is present.
- Reads the parameter's value.
- Passes that value to a server-side command-execution function.
- Prints the resulting output inside a preformatted block.
- Stops further script execution.

This is dangerous because it exposes an interface for running operating-system commands through an HTTP request. If such a file is reachable by an attacker, it can provide direct command execution with the privileges of the web-server process.

A web shell is not a legitimate application feature. It is a common post-exploitation tool and should never be left on a production server.

## 6. Why RFI is dangerous

Successful RFI may allow an attacker to:

- Execute PHP code on the target server.
- Read information accessible to the web-server account.
- Discover application files and server configuration.
- Access environment variables or application secrets when permissions allow.
- Modify files or application data when write permissions exist.
- Use the compromised server as a foothold for further activity.

The actual impact depends on PHP configuration, filesystem permissions, network egress controls, and the privileges of the web-server process.

## 7. Defensive measures

### 7.1 Avoid dynamic file inclusion

Do not pass raw request parameters to PHP inclusion functions such as `include`, `require`, `include_once`, or `require_once`.

Prefer a fixed allowlist that maps a short, known identifier to a predefined file:

```php
<?php
$pages = [
    'home' => __DIR__ . '/pages/home.php',
    'about' => __DIR__ . '/pages/about.php',
];

$page = $_GET['page'] ?? 'home';

if (!array_key_exists($page, $pages)) {
    http_response_code(404);
    exit('Page not found');
}

require $pages[$page];
```

This pattern does not accept arbitrary paths or URLs from the request.

### 7.2 Harden PHP configuration

- Disable URL-based file inclusion where it is not required.
- Keep `allow_url_include` disabled.
- Review `allow_url_fopen` separately; it controls URL-aware file access and is not the same setting as `allow_url_include`.
- Keep PHP and application dependencies updated.
- Avoid running the web server with unnecessary privileges.

### 7.3 Validate and constrain input

- Accept only expected identifiers, not arbitrary file paths.
- Use strict allowlists rather than trying to blacklist suspicious strings.
- Resolve approved paths against a known application directory.
- Reject unexpected schemes, path traversal sequences, and malformed values.
- Do not rely on input filtering as a replacement for safe design.

### 7.4 Restrict server capabilities

- Apply least-privilege filesystem permissions.
- Disable unnecessary command-execution functions when compatible with the application.
- Restrict outbound network access from the web server.
- Keep secrets outside the web root and limit the web process's access to them.
- Monitor for unexpected PHP files and suspicious changes.

### 7.5 Detect and respond

- Review web-server access and error logs for unusual file parameters and external resource references.
- Search for unexpected PHP files, especially in upload and writable directories.
- Remove unauthorized web shells.
- Rotate credentials and secrets that may have been exposed.
- Investigate the original inclusion flaw before restoring the application.

## 8. Safe verification checklist for an authorized lab

- [ ] Confirm that the target is an isolated lab or that written authorization exists.
- [ ] Identify the parameter that selects a page or resource.
- [ ] Review the source code to determine whether user input reaches a file-inclusion function.
- [ ] Check PHP configuration, including `allow_url_include`.
- [ ] Use a harmless, controlled test resource to verify the behavior.
- [ ] Avoid command-execution payloads and avoid accessing real user data.
- [ ] Confirm that invalid identifiers are rejected by an allowlist.
- [ ] Remove test files and restore the lab after testing.
- [ ] Document the finding, impact, and remediation.

## 9. Key takeaways

- RFI occurs when untrusted input can make an application include a remote resource.
- In vulnerable PHP configurations, remote PHP content may be executed by the server.
- A web shell can turn a file-inclusion flaw into a command-execution capability.
- The privileges of the web-server process determine what an attacker may be able to access or change.
- The strongest prevention is to avoid dynamic inclusion of user-controlled paths and use a strict allowlist of known files.
- Disabling remote inclusion, restricting filesystem and network access, and monitoring for web shells provide additional layers of defense.

## 10. Terminology

- **RFI:** Remote File Inclusion.
- **LFI:** Local File Inclusion.
- **RCE:** Remote Code Execution.
- **Web shell:** A server-side script that exposes functionality to interact with the server, often including command execution.
- **`include` / `require`:** PHP language constructs used to include and evaluate another file.
- **`allow_url_include`:** PHP configuration directive controlling URL-aware file inclusion.
- **Least privilege:** Giving a process or account only the permissions required for its task.
- **Allowlist:** A defined set of permitted values; inputs outside that set are rejected.