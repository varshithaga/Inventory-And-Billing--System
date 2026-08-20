/// <reference types="vite/client" />

// Minimal surface of the Google Identity Services widget (loaded at runtime
// from https://accounts.google.com/gsi/client) that LoginPage uses for
// "Sign in with Google". See https://developers.google.com/identity/gsi/web.
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleIdButtonOptions {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  width?: number;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: GoogleIdConfig) => void;
        renderButton: (parent: HTMLElement, options: GoogleIdButtonOptions) => void;
        prompt: () => void;
      };
    };
  };
}
