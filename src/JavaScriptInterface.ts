/**
 * JavaScript Interface for React Native WebView
 * 
 * This module provides functionality to expose JavaScript interfaces from React Native
 * to the WebView, allowing the webview to call arbitrary functions that execute on the
 * React Native layer.
 */

export interface JavaScriptInterfaceMethod {
  /**
   * The name of the method as it will appear in JavaScript
   */
  name: string;
  
  /**
   * The function to execute when called from JavaScript
   * @param args - Arguments passed from JavaScript
   * @returns Promise that resolves with the result to return to JavaScript
   */
  handler: (...args: any[]) => Promise<any> | any;
}

export interface JavaScriptInterfaceObject {
  /**
   * The name of the interface object (e.g., 'Android', 'iOS', 'NativeAPI')
   */
  name: string;
  
  /**
   * Methods available on this interface object
   */
  methods: JavaScriptInterfaceMethod[];
}

export interface JavaScriptInterfaceConfig {
  /**
   * Array of interface objects to expose to the WebView
   */
  interfaces: JavaScriptInterfaceObject[];
  
  /**
   * Whether to enable debug logging for interface calls
   * @default false
   */
  enableDebugLogging?: boolean;
}

/**
 * Internal interface for method call messages
 */
export interface JavaScriptInterfaceCall {
  type: 'JS_INTERFACE_CALL';
  interfaceName: string;
  methodName: string;
  args: any[];
  callId: string;
}

/**
 * Internal interface for method response messages
 */
export interface JavaScriptInterfaceResponse {
  type: 'JS_INTERFACE_RESPONSE';
  callId: string;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * Utility class for managing JavaScript interfaces
 */
export class JavaScriptInterfaceManager {
  private interfaces: Map<string, Map<string, JavaScriptInterfaceMethod['handler']>> = new Map();
  private enableDebugLogging: boolean = false;

  constructor(config?: JavaScriptInterfaceConfig) {
    if (config) {
      this.configure(config);
    }
  }

  /**
   * Configure the interface manager with interface objects
   */
  configure(config: JavaScriptInterfaceConfig): void {
    this.enableDebugLogging = config.enableDebugLogging || false;
    this.interfaces.clear();

    for (const interfaceObj of config.interfaces) {
      const methodMap = new Map<string, JavaScriptInterfaceMethod['handler']>();
      
      for (const method of interfaceObj.methods) {
        methodMap.set(method.name, method.handler);
      }
      
      this.interfaces.set(interfaceObj.name, methodMap);
    }
  }

  /**
   * Handle a method call from JavaScript
   */
  async handleCall(call: JavaScriptInterfaceCall): Promise<JavaScriptInterfaceResponse> {
    const { interfaceName, methodName, args, callId } = call;

    if (this.enableDebugLogging) {
      console.log(`[JavaScriptInterface] Calling ${interfaceName}.${methodName}(${JSON.stringify(args)})`);
    }

    try {
      const interfaceMap = this.interfaces.get(interfaceName);
      if (!interfaceMap) {
        throw new Error(`Interface '${interfaceName}' not found`);
      }

      const handler = interfaceMap.get(methodName);
      if (!handler) {
        throw new Error(`Method '${methodName}' not found on interface '${interfaceName}'`);
      }

      const result = await handler(...args);

      if (this.enableDebugLogging) {
        console.log(`[JavaScriptInterface] ${interfaceName}.${methodName} returned:`, result);
      }

      return {
        type: 'JS_INTERFACE_RESPONSE',
        callId,
        success: true,
        result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (this.enableDebugLogging) {
        console.error(`[JavaScriptInterface] Error in ${interfaceName}.${methodName}:`, errorMessage);
      }

      return {
        type: 'JS_INTERFACE_RESPONSE',
        callId,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate JavaScript code to inject interface objects into the WebView
   */
  generateInjectionScript(): string {
    const interfaceNames = Array.from(this.interfaces.keys());
    
    if (interfaceNames.length === 0) {
      return '';
    }

    const interfaceDefinitions = interfaceNames.map(interfaceName => {
      const methodMap = this.interfaces.get(interfaceName)!;
      const methodNames = Array.from(methodMap.keys());
      
      const methodDefinitions = methodNames.map(methodName => `
        ${methodName}: function(...args) {
          return new Promise((resolve, reject) => {
            const callId = 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Store the promise callbacks
            window.__jsInterfaceCallbacks = window.__jsInterfaceCallbacks || {};
            window.__jsInterfaceCallbacks[callId] = { resolve, reject };
            
            // Send the call to React Native
            const message = {
              type: 'JS_INTERFACE_CALL',
              interfaceName: '${interfaceName}',
              methodName: '${methodName}',
              args: args,
              callId: callId
            };
            
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify(message));
            } else {
              reject(new Error('ReactNativeWebView not available'));
            }
          });
        }`).join(',');

      return `
        window.${interfaceName} = {${methodDefinitions}
        };`;
    }).join('\n');

    return `
      (function() {
        // Initialize callback storage
        window.__jsInterfaceCallbacks = window.__jsInterfaceCallbacks || {};
        
        // Handle responses from React Native
        window.__handleJSInterfaceResponse = function(response) {
          const callback = window.__jsInterfaceCallbacks[response.callId];
          if (callback) {
            delete window.__jsInterfaceCallbacks[response.callId];
            
            if (response.success) {
              callback.resolve(response.result);
            } else {
              callback.reject(new Error(response.error || 'Unknown error'));
            }
          }
        };
        
        // Define interface objects
        ${interfaceDefinitions}
      })();
    `;
  }

  /**
   * Get the list of configured interface names
   */
  getInterfaceNames(): string[] {
    return Array.from(this.interfaces.keys());
  }

  /**
   * Check if an interface exists
   */
  hasInterface(name: string): boolean {
    return this.interfaces.has(name);
  }

  /**
   * Check if a method exists on an interface
   */
  hasMethod(interfaceName: string, methodName: string): boolean {
    const interfaceMap = this.interfaces.get(interfaceName);
    return interfaceMap ? interfaceMap.has(methodName) : false;
  }
}
