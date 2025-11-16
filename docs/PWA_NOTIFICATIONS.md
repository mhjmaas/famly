# PWA Notifications Guide

This guide explains how to set up and use push notifications in Famly.

## Overview

Famly supports Progressive Web App (PWA) push notifications, allowing users to receive real-time updates about:
- Task completions
- Karma grants
- Reward claims
- Chat messages
- Family member additions

## Prerequisites

- HTTPS connection (required for service workers and push notifications)
- Modern browser with Push API support (Chrome, Firefox, Edge, Safari 16.4+)
- VAPID keys configured

## Setup

### 1. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications.

```bash
# Install web-push globally (if not already installed)
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

This will output:
```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U

Private Key:
bdSiCslPz0NYLGlFQUlUYozf9h-EdNegaEqM6-qVW-I

=======================================
```

### 2. Configure Environment Variables

Add the generated keys to your `.env` file:

```bash
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
VAPID_PRIVATE_KEY=bdSiCslPz0NYLGlFQUlUYozf9h-EdNegaEqM6-qVW-I
```

**Important:**
- The public key must be prefixed with `NEXT_PUBLIC_` to be available in the browser
- Keep the private key secret and never commit it to version control
- Generate new keys for each environment (development, staging, production)

### 3. Restart Services

After updating environment variables, restart your services:

```bash
# If using Docker Compose
docker-compose down
docker-compose up -d

# If running locally
# Restart both API and web servers
```

## User Experience

### Permission Flow

1. **Initial Prompt**: After logging in, users see a drawer explaining the benefits of notifications
2. **Browser Permission**: If user clicks "Enable Notifications", the browser's native permission dialog appears
3. **Subscription**: Once granted, the app subscribes to push notifications automatically
4. **Install Prompt**: After enabling notifications, users may see a prompt to install the PWA

### Platform-Specific Behavior

#### Desktop (Chrome, Firefox, Edge)
- Native browser permission dialog
- Notifications appear in system notification center
- Install button available in address bar

#### Android (Chrome)
- Native permission dialog
- Notifications appear in notification shade
- "Add to Home Screen" prompt available

#### iOS (Safari 16.4+)
- Permission dialog available
- Notifications appear in notification center
- Manual installation via Share → "Add to Home Screen"

## Notification Types

### Task Completion
Sent to all family members when someone completes a task.

```
Title: Task Completed! 🎉
Body: John completed "Take out trash" and earned 10 karma!
```

### Karma Grant
Sent to the recipient when karma is granted.

```
Title: Karma Received! ⭐
Body: Mom granted you 50 karma for: Helping with dinner
```

### Reward Claim
Sent to all family members when someone claims a reward.

```
Title: Reward Claimed! 🎁
Body: Sarah claimed "Movie Night" for 100 karma
```

### Chat Message
Sent when a new message is received.

```
Title: New message from Dad
Body: Don't forget to pick up milk!
```

## Troubleshooting

### Notifications Not Working

1. **Check VAPID Keys**
   ```bash
   # Verify keys are set in .env
   grep VAPID .env
   ```

2. **Check Browser Support**
   - Open browser console (F12)
   - Check for errors related to service workers or push notifications
   - Verify: `'serviceWorker' in navigator && 'PushManager' in window`

3. **Check HTTPS**
   - Service workers require HTTPS (except on localhost)
   - Verify your site is served over HTTPS

4. **Check Permissions**
   - Browser Settings → Site Settings → Notifications
   - Ensure notifications are allowed for your domain

5. **Check Service Worker Registration**
   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then(console.log)
   ```

### Permission Denied

If a user denies notification permission:
- They must manually enable it in browser settings
- The app will not prompt again automatically
- Settings → Site Settings → Notifications → Allow

### Notifications Not Appearing

1. **Check Do Not Disturb**: Ensure system DND is off
2. **Check Browser Settings**: Notifications must be enabled
3. **Check Subscription**: Verify user is subscribed in Redux state
4. **Check Backend Logs**: Look for errors in notification sending

## Development

### Testing Notifications

1. **Send Test Notification**
   ```bash
   curl -X POST https://localhost:8443/api/v1/notifications/send \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{
       "userId": "user-id-here",
       "notification": {
         "title": "Test Notification",
         "body": "This is a test",
         "icon": "/web-app-manifest-192x192.png"
       }
     }'
   ```

2. **Check Subscription Status**
   - Open Redux DevTools
   - Check `notifications` state
   - Verify `isSubscribed: true` and `subscription` object exists

3. **Monitor Service Worker**
   - Chrome DevTools → Application → Service Workers
   - Check for errors or update issues

### Debugging

Enable verbose logging:

```typescript
// In browser console
localStorage.setItem('debug', 'pwa:*')
```

Check backend logs:

```bash
# Docker logs
docker-compose logs -f api | grep notification

# Local logs
# Check console output for notification-related messages
```

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 50+ | ✅ Full |
| Firefox | 44+ | ✅ Full |
| Edge | 17+ | ✅ Full |
| Safari | 16.4+ | ✅ Full |
| Opera | 37+ | ✅ Full |
| Samsung Internet | 5+ | ✅ Full |

## Security Considerations

1. **VAPID Keys**: Keep private key secure, rotate periodically
2. **HTTPS Only**: Never disable HTTPS in production
3. **User Consent**: Always respect user's notification preferences
4. **Data Privacy**: Notification content should not include sensitive data
5. **Rate Limiting**: Backend implements rate limiting to prevent abuse

## API Reference

### Subscribe Endpoint
```
POST /v1/notifications/subscribe
Authorization: Required (session cookie)

Body:
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-key",
    "auth": "base64-encoded-key"
  },
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "desktop"
  }
}

Response: 200 OK
{
  "success": true
}
```

### Unsubscribe Endpoint
```
DELETE /v1/notifications/unsubscribe
Authorization: Required (session cookie)

Body:
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}

Response: 200 OK
{
  "success": true,
  "deleted": true
}
```

### Send Notification (Internal)
```
POST /v1/notifications/send
Authorization: Required (internal only)

Body:
{
  "userId": "user-id",
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text",
    "icon": "/icon.png",
    "image": "/image.png",
    "data": {
      "url": "/app/tasks",
      "type": "task_completion"
    }
  }
}

Response: 200 OK
{
  "success": true,
  "sent": 2,
  "failed": 0
}
```

## Further Reading

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/rfc8292)
