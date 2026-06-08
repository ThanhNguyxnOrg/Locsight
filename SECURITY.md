# 🔒 Security Policy

## 🛡️ Supported Versions

| Version | Supported |
|:---|:---|
| 1.0.x | ✅ Yes |
| < 1.0 | ❌ No |

## 🐛 Reporting a Vulnerability

If you discover a security vulnerability in **Locsight**, please report it responsibly:

1. **Do NOT** open a public issue
2. 📧 Email: [Create a private security advisory](https://github.com/ThanhNguyxnOrg/Locsight/security/advisories/new)
3. Include:
   - 📋 Description of the vulnerability
   - 🔄 Steps to reproduce
   - 💥 Potential impact
   - 💡 Suggested fix (if any)

## ⏱️ Response Time

| Action | Timeline |
|:---|:---|
| 📬 Acknowledgment | Within 48 hours |
| 🔍 Assessment | Within 1 week |
| 🔧 Fix release | Within 2 weeks |

## 🔐 Security Features

Locsight includes a built-in **Secrets Scanner** that detects:
- 🔑 AWS Access Keys
- 🐙 GitHub Personal Access Tokens
- 🔍 Google API Keys
- 🔒 Private Keys (RSA, DSA, EC)
- 🧮 High-entropy strings (potential passwords/tokens)

> ⚠️ All detected credentials are **automatically masked** before display. Only partial prefix/suffix is shown.

## 📌 Best Practices

- 🚫 Never commit secrets to source control
- 📄 Use `.analyzer.json` to exclude sensitive directories
- 🔐 Add sensitive files to `.gitignore`
- 🔄 Rotate any exposed credentials immediately

---

<p align="center">
  <sub>🛡️ Security is a shared responsibility. Thank you for helping keep Locsight safe.</sub>
</p>
