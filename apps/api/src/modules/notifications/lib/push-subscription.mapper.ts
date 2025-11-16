import type { ObjectId } from "mongodb";
import type {
  PushSubscription,
  PushSubscriptionDocument,
} from "../domain/push-subscription";

export function toPushSubscription(
  doc: PushSubscriptionDocument,
): PushSubscription {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    endpoint: doc.endpoint,
    keys: doc.keys,
    deviceInfo: doc.deviceInfo,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toPushSubscriptionDocument(
  subscription: Omit<PushSubscription, "id">,
  _id: ObjectId,
  userId: ObjectId,
): PushSubscriptionDocument {
  return {
    _id,
    userId,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    deviceInfo: subscription.deviceInfo,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}
