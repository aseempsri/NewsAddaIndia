# Debug Nginx Routing Issue

## Check What's Actually Being Returned

```bash
# See full response (not just grep)
curl -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/696d247abbe90425ac65db27

# Check response headers
curl -I -H "User-Agent: WhatsApp/2.0" https://newsaddaindia.com/news/696d247abbe90425ac65db27

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log | grep "news/696d247abbe90425ac65db27"

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Alternative: Use Map Directive (More Reliable)

The `if` directive in nginx has limitations. A better approach is to use the `map` directive, but it needs to be in the main nginx.conf file (http context), not in the server block.

## Quick Fix: Test Direct Backend Access

```bash
# Test if backend route works directly
curl -H "User-Agent: WhatsApp/2.0" http://localhost:3000/news/696d247abbe90425ac65db27 | grep "og:image"

# If this works, the issue is nginx routing
# If this doesn't work, the issue is the backend route
```
