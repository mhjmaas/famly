import { combineReducers, configureStore } from "@reduxjs/toolkit";
import activitiesReducer from "./slices/activities.slice";
import chatReducer from "./slices/chat.slice";
import claimsReducer from "./slices/claims.slice";
import contributionGoalsReducer from "./slices/contribution-goals.slice";
import diaryReducer from "./slices/diary.slice";
import familyReducer from "./slices/family.slice";
import karmaReducer from "./slices/karma.slice";
import notificationsReducer from "./slices/notifications.slice";
import recipesReducer from "./slices/recipes.slice";
import rewardsReducer from "./slices/rewards.slice";
import settingsReducer from "./slices/settings.slice";
import shoppingListsReducer from "./slices/shopping-lists.slice";
import tasksReducer from "./slices/tasks.slice";
import userReducer from "./slices/user.slice";

// Define the root reducer map with proper types
const rootReducer = combineReducers({
  user: userReducer,
  karma: karmaReducer,
  family: familyReducer,
  tasks: tasksReducer,
  rewards: rewardsReducer,
  claims: claimsReducer,
  activities: activitiesReducer,
  settings: settingsReducer,
  notifications: notificationsReducer,
  contributionGoals: contributionGoalsReducer,
  chat: chatReducer,
  shoppingLists: shoppingListsReducer,
  diary: diaryReducer,
  recipes: recipesReducer,
});

// Infer RootState from the rootReducer
export type RootState = ReturnType<typeof rootReducer>;

export const makeStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    devTools: process.env.NODE_ENV !== "production",
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
