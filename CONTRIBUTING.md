# 🤝 Contributing

> Thank you for your interest in contributing to **Locsight**! 🎉

---

## 🌟 How to Contribute

### 1. 🍴 Fork & Clone

```bash
git clone https://github.com/<your-username>/Locsight.git
cd Locsight
npm install
```

### 2. 🌿 Create a Branch

```bash
git checkout -b feature/my-awesome-feature
```

### 3. 💻 Make Your Changes

- 🦀 **Rust changes** → `src-tauri/src/`
- ⚛️ **React changes** → `src/`
- 📖 **Docs changes** → `docs/`

### 4. ✅ Test

```bash
# Rust tests
cd src-tauri && cargo test

# Frontend type check
npm run build
```

### 5. 📤 Push & Create PR

```bash
git push origin feature/my-awesome-feature
```

Then open a Pull Request on GitHub! 🚀

---

## 📝 Code Style

| Language | Style | Tool |
|:---|:---|:---|
| 🦀 Rust | Standard `rustfmt` | `cargo fmt` |
| ⚛️ TypeScript | Consistent with existing code | `tsc --noEmit` |
| 📄 Markdown | GitHub Flavored Markdown | — |

---

## 🏷️ Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new language support for Zig
fix: correct shebang detection for env scripts
docs: update FEATURES.md with secrets scanner details
refactor: simplify complexity calculation logic
test: add unit test for ULOC hashing
chore: update dependencies
```

---

## 🐛 Reporting Bugs

Please use the [Bug Report](https://github.com/ThanhNguyxnOrg/Locsight/issues/new?template=bug_report.md) template.

Include:
- 🖥️ OS and version
- 📋 Steps to reproduce
- ✅ Expected behavior
- ❌ Actual behavior
- 📸 Screenshots (if applicable)

---

## 💡 Suggesting Features

Use the [Feature Request](https://github.com/ThanhNguyxnOrg/Locsight/issues/new?template=feature_request.md) template.

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Every contribution matters — thank you! 💛</sub>
</p>
