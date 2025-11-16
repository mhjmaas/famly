import type { ObjectId } from "mongodb";

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSubscriptionDocument {
  _id: ObjectId;
  userId: ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePushSubscriptionInput {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
  };
}
