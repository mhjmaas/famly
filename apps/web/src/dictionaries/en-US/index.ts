import { deepMerge } from "../utils";
import app from "./app.json";
import authCommon from "./auth/common.json";
import authGetStarted from "./auth/get-started.json";
import authSignIn from "./auth/signin.json";
import contributionGoals from "./contribution-goals.json";
import dashboardAiSettings from "./dashboard/ai-settings.json";
import dashboardCalendar from "./dashboard/calendar.json";
import dashboardChat from "./dashboard/chat.json";
import dashboardDiary from "./dashboard/diary.json";
import dashboardFamily from "./dashboard/family.json";
import dashboardHome from "./dashboard/home.json";
import dashboardLocations from "./dashboard/locations.json";
import dashboardMemberDetail from "./dashboard/member-detail.json";
import dashboardMemories from "./dashboard/memories.json";
import dashboardNavigation from "./dashboard/navigation.json";
import dashboardRewards from "./dashboard/rewards.json";
import dashboardSettings from "./dashboard/settings.json";
import dashboardShoppingLists from "./dashboard/shopping-lists.json";
import dashboardTasks from "./dashboard/tasks.json";
import features from "./features.json";
import footer from "./footer.json";
import hero from "./hero.json";
import languageSelector from "./language-selector.json";
import metadata from "./metadata.json";
import navigation from "./navigation.json";
import notifications from "./notifications.json";
import pricing from "./pricing.json";
import privacy from "./privacy.json";
import profile from "./profile.json";
import pwa from "./pwa.json";

type DictionaryFragments = typeof app &
  typeof hero &
  typeof metadata &
  typeof navigation &
  typeof pricing &
  typeof profile &
  typeof pwa &
  typeof footer &
  typeof features &
  typeof privacy &
  typeof languageSelector &
  typeof contributionGoals &
  typeof notifications &
  typeof authCommon &
  typeof authSignIn &
  typeof authGetStarted &
  typeof dashboardChat &
  typeof dashboardDiary &
  typeof dashboardHome &
  typeof dashboardTasks &
  typeof dashboardFamily &
  typeof dashboardRewards &
  typeof dashboardSettings &
  typeof dashboardCalendar &
  typeof dashboardLocations &
  typeof dashboardMemories &
  typeof dashboardNavigation &
  typeof dashboardMemberDetail &
  typeof dashboardAiSettings &
  typeof dashboardShoppingLists;

const dictionary: DictionaryFragments = deepMerge<DictionaryFragments>(
  metadata,
  navigation,
  hero,
  features,
  privacy,
  pricing,
  footer,
  app,
  languageSelector,
  profile,
  pwa,
  contributionGoals,
  notifications,
  authCommon,
  authSignIn,
  authGetStarted,
  dashboardNavigation,
  dashboardHome,
  dashboardFamily,
  dashboardMemberDetail,
  dashboardTasks,
  dashboardShoppingLists,
  dashboardRewards,
  dashboardCalendar,
  dashboardLocations,
  dashboardMemories,
  dashboardAiSettings,
  dashboardDiary,
  dashboardChat,
  dashboardSettings,
);

export default dictionary;
