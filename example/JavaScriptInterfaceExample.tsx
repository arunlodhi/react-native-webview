/**
 * Example demonstrating JavaScript Interface functionality
 * 
 * This example shows how to expose React Native functions to the WebView
 * so that JavaScript in the WebView can call them directly.
 */

import React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import type { JavaScriptInterfaceConfig } from 'react-native-webview';

const JavaScriptInterfaceExample: React.FC = () => {
  // Define the JavaScript interfaces that will be available in the WebView
  const javaScriptInterfaces: JavaScriptInterfaceConfig = {
    interfaces: [
      {
        name: 'Android', // This will be available as window.Android in the WebView
        methods: [
          {
            name: 'getToken',
            handler: async () => {
              // Simulate getting a token from secure storage
              return 'secure-token-12345';
            },
          },
          {
            name: 'showAlert',
            handler: async (message: string) => {
              Alert.alert('Alert from WebView', message);
              return 'Alert shown';
            },
          },
          {
            name: 'getUserInfo',
            handler: async () => {
              return {
                id: 123,
                name: 'John Doe',
                email: 'john@example.com',
              };
            },
          },
        ],
      },
      {
        name: 'NativeAPI', // This will be available as window.NativeAPI in the WebView
        methods: [
          {
            name: 'getDeviceInfo',
            handler: async () => {
              return {
                platform: 'ios', // or 'android'
                version: '1.0.0',
                buildNumber: '100',
              };
            },
          },
          {
            name: 'openCamera',
            handler: async () => {
              // Simulate opening camera
              Alert.alert('Camera', 'Camera would open here');
              return { success: true };
            },
          },
        ],
      },
    ],
    enableDebugLogging: true, // Enable debug logging for development
  };

  // HTML content that demonstrates calling the JavaScript interfaces
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>JavaScript Interface Example</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            button {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                margin: 5px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            button:hover {
                background-color: #0056b3;
            }
            .result {
                margin-top: 10px;
                padding: 10px;
                background-color: #f8f9fa;
                border-radius: 4px;
                border-left: 4px solid #007bff;
            }
            .error {
                border-left-color: #dc3545;
                background-color: #f8d7da;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>JavaScript Interface Example</h1>
            <p>This page demonstrates calling React Native functions from JavaScript.</p>
            
            <h2>Android Interface</h2>
            <button onclick="getToken()">Get Token</button>
            <button onclick="showAlert()">Show Alert</button>
            <button onclick="getUserInfo()">Get User Info</button>
            
            <h2>Native API Interface</h2>
            <button onclick="getDeviceInfo()">Get Device Info</button>
            <button onclick="openCamera()">Open Camera</button>
            
            <div id="results"></div>
        </div>

        <script>
            function displayResult(title, result, isError = false) {
                const resultsDiv = document.getElementById('results');
                const resultDiv = document.createElement('div');
                resultDiv.className = 'result' + (isError ? ' error' : '');
                resultDiv.innerHTML = '<strong>' + title + ':</strong><br><pre>' + 
                    JSON.stringify(result, null, 2) + '</pre>';
                resultsDiv.appendChild(resultDiv);
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
            }

            async function getToken() {
                try {
                    const token = await window.Android.getToken();
                    displayResult('Token', token);
                } catch (error) {
                    displayResult('Error getting token', error.message, true);
                }
            }

            async function showAlert() {
                try {
                    const result = await window.Android.showAlert('Hello from WebView!');
                    displayResult('Alert Result', result);
                } catch (error) {
                    displayResult('Error showing alert', error.message, true);
                }
            }

            async function getUserInfo() {
                try {
                    const userInfo = await window.Android.getUserInfo();
                    displayResult('User Info', userInfo);
                } catch (error) {
                    displayResult('Error getting user info', error.message, true);
                }
            }

            async function getDeviceInfo() {
                try {
                    const deviceInfo = await window.NativeAPI.getDeviceInfo();
                    displayResult('Device Info', deviceInfo);
                } catch (error) {
                    displayResult('Error getting device info', error.message, true);
                }
            }

            async function openCamera() {
                try {
                    const result = await window.NativeAPI.openCamera();
                    displayResult('Camera Result', result);
                } catch (error) {
                    displayResult('Error opening camera', error.message, true);
                }
            }

            // Test if interfaces are available
            window.addEventListener('load', function() {
                setTimeout(() => {
                    if (window.Android && window.NativeAPI) {
                        displayResult('Interfaces Status', 'JavaScript interfaces are available!');
                    } else {
                        displayResult('Interfaces Status', 'JavaScript interfaces are not available', true);
                    }
                }, 1000);
            });
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        javaScriptInterfaces={javaScriptInterfaces}
        javaScriptEnabled={true}
        style={styles.webview}
        onMessage={(event) => {
          console.log('WebView message:', event.nativeEvent.data);
        }}
        onError={(error) => {
          console.error('WebView error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default JavaScriptInterfaceExample;
