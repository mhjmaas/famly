import { io, type Socket } from "socket.io-client";

/**
 * Connect a Socket.IO client to the server
 * Handles connection errors and timeout scenarios
 *
 * @param baseUrl The server URL (e.g., http://localhost:3001)
 * @param token The authentication token (JWT or session token)
 * @param timeout Connection timeout in milliseconds (default: 5000)
 * @returns Promise resolving to connected socket
 */
export async function connectSocketClient(
  baseUrl: string,
  token: string,
  timeout: number = 5000,
): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    const timeoutHandle = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`Socket connection timeout after ${timeout}ms`));
    }, timeout);

    socket.on("connect", () => {
      clearTimeout(timeoutHandle);
      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Socket connection error: ${error.message}`));
    });

    socket.on("error", (error) => {
      clearTimeout(timeoutHandle);
      reject(new Error(`Socket error: ${error}`));
    });
  });
}

/**
 * Disconnect a Socket.IO client gracefully
 *
 * @param socket The socket to disconnect
 * @param timeout Timeout for disconnect operation (default: 2000)
 * @returns Promise that resolves when socket is disconnected
 */
export async function disconnectSocketClient(
  socket: Socket,
  timeout: number = 2000,
): Promise<void> {
  return new Promise((resolve) => {
    const timeoutHandle = setTimeout(() => {
      // Force disconnect if it's taking too long
      socket.disconnect();
      resolve();
    }, timeout);

    socket.on("disconnect", () => {
      clearTimeout(timeoutHandle);
      resolve();
    });

    socket.disconnect();
  });
}

/**
 * Wait for an event on a socket with timeout
 * Useful for waiting for server broadcasts or acknowledgments
 *
 * @param socket The socket to listen on
 * @param event The event name to wait for
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to the event data
 */
export async function waitForEvent<T = unknown>(
  socket: Socket,
  event: string,
  timeout: number = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    const handler = (data: T) => {
      clearTimeout(timeoutHandle);
      socket.off(event, handler);
      resolve(data);
    };

    socket.on(event, handler);
  });
}

/**
 * Emit an event and wait for acknowledgment
 *
 * @param socket The socket to emit on
 * @param event The event name
 * @param payload The event payload
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to the acknowledgment data
 */
export async function emitWithAck<T = unknown>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeout: number = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      reject(new Error(`Timeout waiting for acknowledgment: ${event}`));
    }, timeout);

    socket.emit(event, payload, (ack: T) => {
      clearTimeout(timeoutHandle);
      resolve(ack);
    });
  });
}

/**
 * Wait for multiple events (in any order)
 * Useful for testing broadcasts to multiple clients
 *
 * @param socket The socket to listen on
 * @param events Array of event names to wait for
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to a map of event data
 */
export async function waitForMultipleEvents<T = unknown>(
  socket: Socket,
  events: string[],
  timeout: number = 5000,
): Promise<Record<string, T>> {
  return new Promise((resolve, reject) => {
    const receivedEvents: Record<string, T> = {};
    const handlers: Record<string, (data: T) => void> = {};

    const timeoutHandle = setTimeout(() => {
      // Clean up listeners
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });

      const missing = events.filter((e) => !receivedEvents[e]);
      reject(new Error(`Timeout waiting for events: ${missing.join(", ")}`));
    }, timeout);

    events.forEach((event) => {
      handlers[event] = (data: T) => {
        receivedEvents[event] = data;

        if (Object.keys(receivedEvents).length === events.length) {
          clearTimeout(timeoutHandle);
          Object.entries(handlers).forEach(([e, handler]) => {
            socket.off(e, handler);
          });
          resolve(receivedEvents);
        }
      };

      socket.on(event, handlers[event]);
    });
  });
}

/**
 * Wait for a specific event or timeout
 * Returns null if timeout occurs instead of throwing
 *
 * @param socket The socket to listen on
 * @param event The event name
 * @param timeout Timeout in milliseconds
 * @returns Promise resolving to event data or null
 */
export async function waitForEventOrNull<T = unknown>(
  socket: Socket,
  event: string,
  timeout: number = 5000,
): Promise<T | null> {
  try {
    return await waitForEvent<T>(socket, event, timeout);
  } catch {
    return null;
  }
}
