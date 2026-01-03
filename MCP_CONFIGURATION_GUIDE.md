# Hostinger MCP Server Configuration Guide

## 📍 Where to Place the Configuration

The MCP (Model Context Protocol) server configuration for Cursor IDE should be placed in your **Cursor settings file**.

### Location on Windows:

**Option 1: User Settings (Recommended)**
```
%APPDATA%\Cursor\User\settings.json
```

**Full path example:**
```
C:\Users\aseems\AppData\Roaming\Cursor\User\settings.json
```

**Option 2: Workspace Settings (Project-specific)**
```
.vscode/settings.json
```
(If you want this configuration only for this project)

---

## 🔧 How to Add the Configuration

### Method 1: Using Cursor Settings UI

1. Open Cursor IDE
2. Press `Ctrl + ,` (or go to **File → Preferences → Settings**)
3. Click the **Open Settings (JSON)** icon (top right)
4. Add the MCP configuration to the JSON file

### Method 2: Direct File Edit

1. Press `Ctrl + Shift + P` to open command palette
2. Type: `Preferences: Open User Settings (JSON)`
3. Add the configuration

---

## 📝 Configuration to Add

Add this to your `settings.json` file:

```json
{
  "mcpServers": {
    "hostinger-mcp": {
      "command": "npx",
      "args": [
        "hostinger-api-mcp@latest"
      ],
      "env": {
        "API_TOKEN": ""
      }
    }
  }
}
```

**Important:** If you already have other settings in your `settings.json`, add the `mcpServers` section inside the existing JSON object (don't create a duplicate root object).

---

## ✅ Example: Complete settings.json

If your `settings.json` already has other settings, it should look like this:

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  // ... your other settings ...
  
  "mcpServers": {
    "hostinger-mcp": {
      "command": "npx",
      "args": [
        "hostinger-api-mcp@latest"
      ],
      "env": {
        "API_TOKEN": ""
      }
    }
  }
}
```

---

## 🔒 Security Note

⚠️ **Important:** Your API token is sensitive information!

- The `settings.json` file is typically stored locally
- Consider using environment variables if possible
- Don't commit this file to Git if it contains secrets
- Add `settings.json` to `.gitignore` if storing tokens

---

## 🧪 Verify Configuration

After adding the configuration:

1. **Restart Cursor IDE** (close and reopen)
2. Check if the MCP server is available:
   - Look for Hostinger-related commands in the command palette
   - Check Cursor's MCP server status (if available in settings)

---

## 📚 Alternative: Workspace-Specific Configuration

If you want this configuration only for this project:

1. Create `.vscode/settings.json` in your project root
2. Add the same configuration there
3. This will only apply to this workspace

**File location:**
```
NewsAddaIndia/.vscode/settings.json
```

---

## 🆘 Troubleshooting

### Configuration not working?

1. **Check JSON syntax** - Make sure there are no syntax errors
2. **Restart Cursor** - MCP servers load on startup
3. **Check Cursor version** - Ensure you're using a version that supports MCP
4. **Verify API token** - Make sure the token is valid and has proper permissions

### Can't find settings.json?

1. Press `Ctrl + Shift + P`
2. Type: `Preferences: Open User Settings (JSON)`
3. This will create/open the file if it doesn't exist

---

## 📖 Additional Resources

- [Cursor IDE Documentation](https://cursor.sh/docs)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Hostinger API Documentation](https://www.hostinger.com/api)

---

**Need help?** Check Cursor's documentation or Hostinger MCP server repository for more details.


