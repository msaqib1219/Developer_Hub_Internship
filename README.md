# Vulnerable App - Educational Security Testing Application

A deliberately intentional vulnerable Node.js/Express web application designed for cybersecurity education, ethical hacking training, and penetration testing practice. This application demonstrates common web vulnerabilities including SQL Injection, Cross-Site Request Forgery (CSRF), and Cross-Site Scripting (XSS).

⚠️ **WARNING**: This application is intentionally vulnerable. Do **NOT** use in production or connect to the public internet. Use only in isolated lab environments for educational purposes.

---

## 📋 Table of Contents

- [Features](#features)
- [Vulnerabilities Included](#vulnerabilities-included)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Application Endpoints](#application-endpoints)
- [Vulnerability Details](#vulnerability-details)
- [Testing & Exploitation](#testing--exploitation)
- [Security Reports](#security-reports)
- [Remediation Examples](#remediation-examples)
- [Docker Deployment](#docker-deployment)
- [Learning Resources](#learning-resources)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)

---

## ✨ Features

- **Educational Focus**: Designed specifically for learning cybersecurity concepts
- **Real Vulnerabilities**: Implements actual OWASP Top 10 vulnerabilities
- **Easy to Understand**: Clean, readable code with clear vulnerability examples
- **Hands-on Testing**: Integrates with industry-standard security tools
- **Comprehensive Documentation**: Detailed reports and remediation guidance
- **Lab Environment**: Minimal dependencies, quick setup in isolated environments
- **Docker Support**: Easy deployment in containerized environments

---

## 🐛 Vulnerabilities Included

### 1. **SQL Injection (SQLi)**
- **Location**: `/search` endpoint (POST)
- **Type**: User input directly used in SQL queries (now uses parameterized queries)
- **Risk**: Unauthorized database access, data exfiltration, data manipulation
- **CVSS Score**: 9.8 (Critical)
- **Testing Tool**: SQLMap, manual curl/Postman requests

### 2. **Cross-Site Request Forgery (CSRF)**
- **Location**: `/change-email` endpoint (POST)
- **Type**: State-changing requests without CSRF token validation (now protected)
- **Risk**: Unauthorized account modifications, email hijacking
- **CVSS Score**: 8.1 (High)
- **Testing Tool**: Burp Suite, custom HTML forms, curl

### 3. **Cross-Site Scripting (XSS)**
- **Location**: `/comments` endpoint (POST/GET)
- **Type**: Stored XSS - user input stored and rendered without sanitization
- **Risk**: Session hijacking, cookie theft, malware injection, phishing
- **CVSS Score**: 7.1 (High)
- **Testing Tool**: Browser DevTools, manual payload injection, Burp Suite

---

## 📦 Prerequisites

- **Node.js** v14+ (recommended v18+)
- **npm** v6+
- **SQLite3** (automatically included as dependency)
- **curl** or **Postman** (for API testing)
- **Git** (for cloning repository)

**Optional Security Tools:**
- SQLMap - SQL Injection testing
- Burp Suite Community - Web vulnerability scanner
- OWASP ZAP - Automated security scanning
- curl - Command-line HTTP requests

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vulnerable-app.git
cd vulnerable-app
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework
- `sqlite3` - Database engine
- `body-parser` - Request body parser
- `cookie-parser` - Cookie parsing middleware
- `csurf` - CSRF protection middleware
- `pug` - Template engine

### 3. Initialize Database
The database is automatically created on first run with sample data:
- **Users Table**: Contains demo users (admin/password123, testuser/testpass)
- **Comments Table**: Contains sample comments for XSS testing

---

## 🏃 Running the Application

### Local Development
```bash
node app.js
```

Expected output:
```
Vulnerable app listening at http://localhost:3001
Connected to the SQLite database.
SQL Injection vulnerability: POST /search
CSRF vulnerability: POST /change-email
XSS vulnerability: POST /add-comment (content displayed at GET /comments)
```

Visit: `http://localhost:3001`

### Using npm scripts
```bash
npm start  # Run the application
```

### Stop the Application
Press `Ctrl+C` in the terminal running the application.

---

## 🌐 Application Endpoints

| Method | Endpoint | Purpose | Vulnerability |
|--------|----------|---------|---|
| GET | `/` | Home page | None |
| GET | `/search` | Search form | SQL Injection |
| POST | `/search` | Execute search | SQL Injection |
| GET | `/profile` | User profile form | CSRF |
| POST | `/change-email` | Change email | CSRF |
| GET | `/comments` | View comments | XSS |
| POST | `/add-comment` | Add comment | XSS |

---

## 🔍 Vulnerability Details

### 1. SQL Injection (SQLi)

**Original Vulnerable Code:**
```javascript
// String concatenation - VULNERABLE
const query = `SELECT id, username, email FROM users WHERE username LIKE '%${searchTerm}%'`;
```

**Current Protected Code:**
```javascript
// Parameterized queries - SECURE
const query = "SELECT id, username, email FROM users WHERE username LIKE ?";
const searchTermParam = `%${searchTerm}%`;
db.all(query, [searchTermParam], (err, rows) => { ... });
```

**How to Test:**
```bash
# Test payload: ' OR '1'='1
curl -X POST http://localhost:3001/search \
  -d "searchTerm=' OR '1'='1" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

---

### 2. Cross-Site Request Forgery (CSRF)

**Original Vulnerable Code:**
```javascript
// No CSRF token validation
app.post('/change-email', (req, res) => {
    const newEmail = req.body.email;
    // Process without CSRF check
});
```

**Current Protected Code:**
```javascript
// CSRF protection enabled
const csrfProtection = csrf({ cookie: false });
app.post('/change-email', csrfProtection, (req, res) => {
    // Token validated by middleware
    const newEmail = req.body.email;
});
```

**How to Test:**
```bash
# Without CSRF token (should fail with 403)
curl -X POST http://localhost:3001/change-email \
  -d "email=newuser@example.com" \
  -H "Content-Type: application/x-www-form-urlencoded"

# With valid CSRF token (should succeed)
# Get token from /profile page first
```

---

### 3. Cross-Site Scripting (XSS)

**Original Vulnerable Code:**
```javascript
// Content stored without sanitization
db.run('INSERT INTO comments (author, content) VALUES (?, ?)', 
  [author, content], ...);

// Content rendered without escaping in Pug template
// In pug: = comment.content  (unescaped output)
```

**Current Protected Code:**
```javascript
// Use Pug's auto-escaping (default)
// In pug: = comment.content  (HTML-escaped)
// Or explicitly: !{comment.content} (avoid)
```

**How to Test:**
```bash
# XSS payload example
curl -X POST http://localhost:3001/add-comment \
  -d "author=Attacker&content=<script>alert('XSS')</script>" \
  -H "Content-Type: application/x-www-form-urlencoded"

# Then visit http://localhost:3001/comments to see payload execute
```

---

## 🧪 Testing & Exploitation

### Using SQLMap for SQL Injection
```bash
# Install SQLMap
pip install sqlmap

# Test the search endpoint
sqlmap -u "http://localhost:3001/search" \
  --data="searchTerm=test" \
  -p searchTerm \
  --dbs
```

### Using Burp Suite for CSRF
1. Open Burp Suite Community
2. Configure browser proxy to Burp (localhost:8080)
3. Visit `http://localhost:3001/profile`
4. Capture the POST request to `/change-email`
5. Remove CSRF token and observe 403 response

### Manual XSS Testing
1. Navigate to `http://localhost:3001/comments`
2. Click "Add Comment"
3. Submit payload: `<img src=x onerror=alert('XSS')>`
4. Return to comments page - payload executes

---

## 📊 Security Reports

This repository includes comprehensive security documentation:

### 1. **ETHICAL_HACKING_REPORT.md**
- Vulnerability testing methodology
- Exploitation techniques and results
- Proof-of-concept code
- Remediation verification

### 2. **PENETRATION_TEST_REPORT.md**
- Risk assessment and ratings
- Detailed vulnerability descriptions
- Before/after screenshots
- Recommendations and roadmap

### 3. **SECURITY_AUDIT_REPORT.md**
- Automated tool scan results (OWASP ZAP, Nikto)
- Dependency vulnerability analysis (npm audit)
- Configuration review
- OWASP Top 10 compliance status

---

## 🔧 Remediation Examples

### Fixing SQL Injection
```javascript
// ❌ BEFORE: Vulnerable
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ AFTER: Protected
const query = "SELECT * FROM users WHERE username = ?";
db.all(query, [username], (err, rows) => { ... });
```

### Fixing CSRF
```javascript
// ❌ BEFORE: Vulnerable
app.post('/change-email', (req, res) => { ... });

// ✅ AFTER: Protected
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false });
app.post('/change-email', csrfProtection, (req, res) => { ... });

// Include in form:
input(type='hidden' name='_csrf' value=csrfToken)
```

### Fixing XSS
```javascript
// ❌ BEFORE: Vulnerable (Pug template)
= comment.content  // Rendered as raw HTML

// ✅ AFTER: Protected
= comment.content  // Auto-escaped by default
// Or explicitly:
p!= escapeHtml(comment.content)
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t vulnerable-app:latest .
```

### Run Container
```bash
docker run -p 3001:3001 \
  --name vulnerable-app \
  vulnerable-app:latest
```

### Using Docker Compose
```bash
docker-compose up -d
```

Access the application at `http://localhost:3001`

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  vulnerable-app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - ./vulnerable_database.db:/app/vulnerable_database.db
```

---

## 📚 Learning Resources

### OWASP References
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [CSRF Protection](https://owasp.org/www-community/attacks/csrf)
- [XSS Prevention](https://owasp.org/www-community/attacks/xss/)

### Testing Tools Documentation
- [SQLMap Documentation](http://sqlmap.org/)
- [Burp Suite Community](https://portswigger.net/burp/communitydownload)
- [OWASP ZAP](https://www.zaproxy.org/)
- [curl Manual](https://curl.se/docs/manual.html)

### Educational Resources
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackTheBox](https://www.hackthebox.com/)
- [DVWA - Damn Vulnerable Web App](https://github.com/digininja/DVWA)
- [WebGoat](https://owasp.org/www-project-webgoat/)

---

## 🤝 Contributing

This is an educational project. Contributions are welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -m 'Add improvement'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Open a Pull Request

### Contribution Ideas
- Add more vulnerabilities (XXE, SSRF, etc.)
- Improve documentation and examples
- Create additional test cases
- Add more security tools integration
- Enhance remediation examples

---

## 📄 Project Structure

```
vulnerable-app/
├── app.js                          # Main Express application
├── package.json                    # Node.js dependencies
├── package-lock.json               # Lock file for dependencies
├── vulnerable_database.db          # SQLite database (auto-created)
├── Dockerfile                      # Docker container configuration
├── docker-compose.yml              # Docker Compose configuration
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
├── ETHICAL_HACKING_REPORT.md       # Week 5 testing report
├── PENETRATION_TEST_REPORT.md      # Penetration testing findings
├── SECURITY_AUDIT_REPORT.md        # Automated security audit results
└── views/                          # Pug template files
    ├── index.pug                   # Home page
    ├── search.pug                  # Search interface
    ├── profile.pug                 # User profile
    └── comments.pug                # Comments section
```

---

## 🔐 Security Considerations

### Design Philosophy
This application is **intentionally vulnerable** for educational purposes. The vulnerabilities are present to:
- Teach identification and exploitation techniques
- Demonstrate real-world security flaws
- Practice remediation and secure coding
- Understand attacker methodologies

### Safe Usage
- ✅ Use in isolated lab environments only
- ✅ Never connect to production networks
- ✅ Only run in controlled educational settings
- ✅ Document all testing activities
- ❌ Do not use as template for production applications
- ❌ Do not expose to internet
- ❌ Do not test against systems you don't own

---

## 📊 Vulnerability Summary

| Vulnerability | CVSS Score | Status | Testing Tools |
|---|---|---|---|
| SQL Injection | 9.8 (Critical) | Protected | SQLMap, curl |
| CSRF | 8.1 (High) | Protected | Burp Suite, curl |
| Stored XSS | 7.1 (High) | Present | Browser, Burp Suite |

---

## 🎓 Learning Outcomes

After working with this application, you will understand:
- ✓ How SQL Injection attacks work and their prevention
- ✓ CSRF attack vectors and protection mechanisms
- ✓ XSS vulnerabilities and secure output encoding
- ✓ Web application security testing methodologies
- ✓ Use of industry-standard security tools
- ✓ Secure code development practices
- ✓ Security documentation and reporting

---

## 📝 License

This educational project is provided as-is for learning purposes. No license restrictions apply to educational use.

---

## ⚠️ Disclaimer

**This application is provided SOLELY for educational and authorized security testing purposes.**

- Do not use this application for any unauthorized testing or hacking
- Unauthorized access to computer systems is illegal
- Always obtain written permission before conducting security tests
- This project is designed for lab environments only
- The authors assume no liability for misuse of this application
- By using this application, you agree to use it responsibly and legally

---

## 👥 Author

Created as part of the **Cybersecurity Internship Program** for educational security training.

**Internship Timeline:**
- Week 4: API Security & Threat Detection
- Week 5: Ethical Hacking & Vulnerability Testing
- Week 6: Security Audits & Deployment

---

## 📞 Support & Questions

For questions about:
- **Vulnerabilities**: Review the security reports in this repository
- **Testing**: See the ETHICAL_HACKING_REPORT.md for detailed examples
- **Remediation**: Check PENETRATION_TEST_REPORT.md for fixes
- **Tools**: Refer to tool documentation links in Learning Resources

---

**Last Updated**: June 9, 2026  
**Version**: 1.0.0  
**Status**: Educational Release
