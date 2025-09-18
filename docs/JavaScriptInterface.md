# JavaScript Interface

The JavaScript Interface functionality allows you to expose React Native functions to the WebView, enabling JavaScript code running in the WebView to call arbitrary functions that execute on the React Native layer.

## Overview

This feature is similar to Android's `addJavascriptInterface` but works cross-platform on both iOS and Android. It allows you to:

- Expose React Native functions as JavaScript objects in the WebView
- Call these functions from JavaScript using promises
- Pass parameters and receive return values
- Handle both synchronous and asynchronous operations

## Basic Usage

```typescript
import React from 'react';
import { Alert } from 'react-native';
import WebView from 'react-native-webview';
import type { JavaScriptInterfaceConfig } from 'react-native-webview';

const MyComponent = () => {
  const javaScriptInterfaces: JavaScriptInterfaceConfig = {
    interfaces: [
      {
        name: 'Android', // Available as window.Android in WebView
        methods: [
          {
            name: 'getToken',
            handler: async () => {
              return 'secure-token-12345';
            },
          },
          {
            name: 'showAlert',
            handler: async (message: string) => {
              Alert.alert('Alert', message);
              return 'Alert shown';
            },
          },
        ],
      },
    ],
  };

  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      javaScriptInterfaces={javaScriptInterfaces}
    />
  );
};
```

## JavaScript Usage in WebView

Once the interfaces are configured, you can call them from JavaScript in the WebView:

```javascript
// Call a method that returns a value
const token = await window.Android.getToken();
console.log('Token:', token);

// Call a method with parameters
const result = await window.Android.showAlert('Hello from WebView!');
console.log('Result:', result);

// Handle errors
try {
  const data = await window.Android.someMethod();
} catch (error) {
  console.error('Error:', error.message);
}
```

## Configuration

### JavaScriptInterfaceConfig

```typescript
interface JavaScriptInterfaceConfig {
  interfaces: JavaScriptInterfaceObject[];
  enableDebugLogging?: boolean;
}
```

### JavaScriptInterfaceObject

```typescript
interface JavaScriptInterfaceObject {
  name: string; // The name of the interface object (e.g., 'Android', 'iOS', 'NativeAPI')
  methods: JavaScriptInterfaceMethod[];
}
```

### JavaScriptInterfaceMethod

```typescript
interface JavaScriptInterfaceMethod {
  name: string; // The name of the method as it will appear in JavaScript
  handler: (...args: any[]) => Promise<any> | any; // The function to execute
}
```

## Advanced Examples

### Multiple Interfaces

```typescript
const javaScriptInterfaces: JavaScriptInterfaceConfig = {
  interfaces: [
    {
      name: 'Android',
      methods: [
        {
          name: 'getToken',
          handler: async () => {
            return await SecureStorage.getItem('token');
          },
        },
      ],
    },
    {
      name: 'NativeAPI',
      methods: [
        {
          name: 'getDeviceInfo',
          handler: async () => {
            return {
              platform: Platform.OS,
              version: DeviceInfo.getVersion(),
            };
          },
        },
        {
          name: 'openCamera',
          handler: async () => {
            const result = await ImagePicker.openCamera();
            return result;
          },
        },
      ],
    },
  ],
  enableDebugLogging: __DEV__, // Enable logging in development
};
```

### Error Handling

```typescript
const javaScriptInterfaces: JavaScriptInterfaceConfig = {
  interfaces: [
    {
      name: 'API',
      methods: [
        {
          name: 'fetchData',
          handler: async (url: string) => {
            try {
              const response = await fetch(url);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return await response.json();
            } catch (error) {
              throw new Error(`Failed to fetch data: ${error.message}`);
            }
          },
        },
      ],
    },
  ],
};
```

### Complex Data Types

```typescript
const javaScriptInterfaces: JavaScriptInterfaceConfig = {
  interfaces: [
    {
      name: 'UserManager',
      methods: [
        {
          name: 'createUser',
          handler: async (userData: {
            name: string;
            email: string;
            age: number;
          }) => {
            // Validate input
            if (!userData.name || !userData.email) {
              throw new Error('Name and email are required');
            }
            
            // Create user
            const user = await UserService.create(userData);
            return {
              success: true,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
              },
            };
          },
        },
        {
          name: 'getUsers',
          handler: async (filters?: {
            limit?: number;
            offset?: number;
            search?: string;
          }) => {
            const users = await UserService.findAll(filters);
            return users.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
            }));
          },
        },
      ],
    },
  ],
};
```

## JavaScript Usage Examples

### Basic Calls

```javascript
// Simple method call
const token = await window.Android.getToken();

// Method with parameters
const result = await window.Android.showAlert('Hello World');

// Method with complex parameters
const user = await window.UserManager.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});
```

### Error Handling

```javascript
try {
  const data = await window.API.fetchData('https://api.example.com/data');
  console.log('Data received:', data);
} catch (error) {
  console.error('Failed to fetch data:', error.message);
  // Handle error appropriately
}
```

### Checking Interface Availability

```javascript
// Check if interface is available
if (window.Android && typeof window.Android.getToken === 'function') {
  const token = await window.Android.getToken();
} else {
  console.warn('Android interface not available');
}

// Or use a more robust check
function isInterfaceAvailable(interfaceName, methodName) {
  return window[interfaceName] && 
         typeof window[interfaceName][methodName] === 'function';
}

if (isInterfaceAvailable('Android', 'getToken')) {
  const token = await window.Android.getToken();
}
```

## Best Practices

### 1. Error Handling

Always handle errors in your interface methods:

```typescript
{
  name: 'safeMethod',
  handler: async (param: string) => {
    try {
      // Your logic here
      return result;
    } catch (error) {
      // Log error for debugging
      console.error('Error in safeMethod:', error);
      // Return user-friendly error
      throw new Error('Operation failed. Please try again.');
    }
  },
}
```

### 2. Input Validation

Validate inputs in your handlers:

```typescript
{
  name: 'validateInput',
  handler: async (email: string, age: number) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required');
    }
    if (!age || typeof age !== 'number' || age < 0) {
      throw new Error('Valid age is required');
    }
    // Process valid input
  },
}
```

### 3. Async Operations

Use async/await for better error handling:

```typescript
{
  name: 'asyncOperation',
  handler: async () => {
    const result1 = await someAsyncOperation();
    const result2 = await anotherAsyncOperation(result1);
    return result2;
  },
}
```

### 4. Debug Logging

Enable debug logging during development:

```typescript
const javaScriptInterfaces: JavaScriptInterfaceConfig = {
  interfaces: [...],
  enableDebugLogging: __DEV__, // Only in development
};
```

## Security Considerations

1. **Validate all inputs** from JavaScript to prevent injection attacks
2. **Don't expose sensitive operations** without proper authentication
3. **Use HTTPS** for any network requests made from interface methods
4. **Sanitize data** before passing it to native APIs
5. **Consider rate limiting** for expensive operations

## Troubleshooting

### Interface Not Available

If `window.Android` (or your interface) is undefined:

1. Ensure `javaScriptInterfaces` prop is set on WebView
2. Check that JavaScript is enabled (`javaScriptEnabled={true}`)
3. Wait for the page to load before calling interface methods
4. Enable debug logging to see interface injection

### Method Calls Failing

If method calls throw errors:

1. Check the method name spelling
2. Ensure parameters match the expected types
3. Look at console logs for detailed error messages
4. Verify the handler function is properly defined

### Performance Issues

If interface calls are slow:

1. Avoid heavy computations in handlers
2. Use async operations for I/O bound tasks
3. Consider caching results when appropriate
4. Minimize
