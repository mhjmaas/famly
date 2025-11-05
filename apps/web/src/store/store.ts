import { combineReducers, configureStore } from "@reduxjs/toolkit";
import familyReducer from "./slices/family.slice";
import karmaReducer from "./slices/karma.slice";
import userReducer from "./slices/user.slice";

// Define the root reducer map with proper types
const rootReducer = combineReducers({
  user: userReducer,
  karma: karmaReducer,
  family: familyReducer,
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
