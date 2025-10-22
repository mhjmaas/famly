import { getEnv } from "./env";

class Settings {
  private env = getEnv();

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === "development";
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === "production";
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === "test";
  }

  get port(): number {
    return this.env.PORT;
  }

  get mongodbUri(): string {
    return this.env.MONGODB_URI;
  }

  get betterAuthSecret(): string {
    return this.env.BETTER_AUTH_SECRET;
  }

  get betterAuthUrl(): string {
    return this.env.BETTER_AUTH_URL;
  }
}

export const settings = new Settings();
