# Privilege Escalation via Cross-Site Scripting (XSS)

> Topic: demonstrating how an XSS flaw in a WordPress environment can be abused to perform actions with a logged-in administrator's browser session.  
> Environment: Kali Linux, Firefox, Burp Suite Community Edition, a WordPress site, and browser developer tools.

## 1. Overview

Cross-Site Scripting (XSS) occurs when an application includes attacker-controlled content in a page without safely handling it. The browser then interprets that content as code belonging to the vulnerable site's origin.

If a privileged WordPress administrator views a page containing the injected script, the script may be able to make same-origin requests using that administrator's active session. This can turn an XSS issue into an account- or privilege-management issue.

## 2. Lab components shown

- **WordPress:** the target application, including its login and Users administration screens.
- **Firefox:** used to access the WordPress site and browser developer tools.
- **Burp Suite Community Edition:** used to observe HTTP traffic and inspect requests.
- **JavaScript:** used to illustrate how browser-side code can issue HTTP requests.
- **JavaScript compression/encoding utility:** shown during preparation of a compact representation of JavaScript.
- **Kali Linux:** the testing environment.

Use an isolated lab instance and test accounts only. Do not perform these steps against a website or account without explicit authorization.

## 3. Relevant concepts

### 3.1 Same-origin context

JavaScript executing in a page normally makes requests under the security context of that page's origin. When a user is authenticated, the browser may attach the site's session cookies to eligible same-origin requests.

This is why an XSS flaw can be more serious when an administrator visits the affected page.

### 3.2 Authenticated actions

WordPress administrative operations generally require more than simply being logged in. They may also require:

- A valid authentication session.
- A request-specific nonce, where applicable.
- The necessary WordPress capability or role.
- A request using the expected HTTP method and parameters.

A nonce helps protect against cross-site request forgery (CSRF), but it is **not a substitute for authorization** and does not make an XSS vulnerability harmless. Script executing in the trusted site's origin may be able to interact with pages and data available to that user.

### 3.3 Privilege escalation impact

The result includes the existing `admin` account and an additional account named `attacker`, with the Administrator role.

This illustrates the potential impact: if malicious script can cause an administrator's browser to perform a privileged action, the attacker may gain a persistent account rather than merely executing JavaScript temporarily in the victim's browser.

## 4. Demonstration flow

1. Open the WordPress site and authenticate to the lab.
2. Inspect the application and its HTTP traffic using browser developer tools and Burp Suite.
3. Examine WordPress administrative pages and the requests associated with user management.
4. Prepare JavaScript intended to make browser-side HTTP requests.
5. Demonstrate a character-code representation of JavaScript. [The helper](./privelegeEscalation.xss.js) iterates over a string and converts each character to its numeric character code, separating values with commas.
6. Use browser developer tools to inspect the resulting output and related requests.
7. Return to the WordPress Users page and observe the additional Administrator account.

The notes intentionally describe the exploit chain at a conceptual level rather than reproducing a ready-to-run payload for creating administrator accounts.

## 5. JavaScript encoding: what it means

- Accepts a string.
- Iterates through its characters.
- Reads each character's numeric code using `charCodeAt`.
- Joins the numeric values with commas.

This is a form of character-code representation. It is not encryption, and it does not make code safe. If another program converts those values back into characters and executes the result, the original JavaScript behavior is restored.

Also distinguish these operations:

| Operation | Purpose |
|---|---|
| Minification | Removes unnecessary whitespace and may shorten identifiers |
| Single-line formatting | Removes line breaks and often collapses whitespace |
| Character-code encoding | Represents characters using numeric codes |
| Encryption | Transforms data using a key so it cannot be read without decryption |

Encoding or minifying JavaScript does not neutralize malicious behavior.

## 6. Security lessons

### Why the issue is serious

- XSS executes in the context of a trusted website.
- The impact depends heavily on which user views the affected page.
- An administrator's browser may have access to privileged application functions.
- A successful attack can lead to persistent account creation or other unauthorized changes.
- Hiding or encoding a payload does not remove the underlying vulnerability.

### Defensive measures

1. **Prevent XSS at the source**
   - Contextually encode untrusted data before inserting it into HTML, attributes, URLs, or JavaScript.
   - Prefer safe DOM APIs such as `textContent` over unsafe HTML insertion.
   - Sanitize HTML when rich text is genuinely required, using a maintained sanitizer.

2. **Use a Content Security Policy (CSP)**
   - Deploy a restrictive CSP.
   - Avoid broad `unsafe-inline` allowances where possible.
   - Consider nonces or hashes for approved scripts.

3. **Apply least privilege**
   - Avoid using administrator accounts for routine browsing.
   - Give each WordPress account only the capabilities it needs.
   - Remove unused administrator accounts.

4. **Keep WordPress secure**
   - Update WordPress core, themes, and plugins.
   - Remove abandoned or unnecessary plugins and themes.
   - Review user accounts and administrative activity.

5. **Treat nonces correctly**
   - Validate nonces for the relevant operations.
   - Perform capability checks independently (for example, check that the current user has the required capability).
   - Remember that nonces are not authorization controls and do not protect against script execution in the same origin.

6. **Harden sessions and monitoring**
   - Use HTTPS and secure cookie settings.
   - Monitor unexpected administrator creation, role changes, and other sensitive events.
   - Revoke suspicious sessions and investigate the original injection point.

## 7. Suggested verification checklist for an authorized lab

- [ ] Confirm the lab is isolated and you have permission to test it.
- [ ] Identify the exact input or page where untrusted content is rendered.
- [ ] Determine whether the issue is reflected, stored, or DOM-based XSS.
- [ ] Use a harmless proof of execution to verify the vulnerability.
- [ ] Record the affected page, user role, and browser context.
- [ ] Verify whether the application uses output encoding and sanitization correctly.
- [ ] Check that sensitive server-side actions enforce capability checks.
- [ ] Remove test accounts and restore the lab after testing.
- [ ] Document the finding and recommend a fix.

## 8. Key takeaways

- XSS is not limited to displaying a pop-up; it can affect actions available to the user viewing the vulnerable page.
- The risk is especially high when a privileged administrator views attacker-controlled content.
- WordPress nonces and authentication checks serve different purposes; neither should replace server-side capability checks.
- Minification and character-code encoding are representation techniques, not security controls.
- The correct fix is to prevent script injection and enforce authorization on every sensitive server-side operation.

## 9. Terminology

- **XSS:** Cross-Site Scripting.
- **Stored XSS:** Malicious input is saved by the application and later rendered to users.
- **Reflected XSS:** Malicious input is immediately reflected in a response.
- **DOM-based XSS:** Client-side code introduces unsafe data into the page.
- **Nonce:** A value used to help validate that a request is associated with an expected interaction.
- **Capability check:** A server-side authorization check that verifies whether the current user may perform an action.
- **Same-origin policy:** A browser security mechanism that restricts how documents and scripts from different origins interact.