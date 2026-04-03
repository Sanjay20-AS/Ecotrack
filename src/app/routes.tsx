import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminOverviewScreen } from "./screens/admin/AdminOverviewScreen";
import { AdminUsersScreen } from "./screens/admin/AdminUsersScreen";
import { AdminCollectorsScreen } from "./screens/admin/AdminCollectorsScreen";
import { AdminWasteScreen } from "./screens/admin/AdminWasteScreen";
import { AdminAnalyticsScreen } from "./screens/admin/AdminAnalyticsScreen";
import { AdminFacilitiesScreen } from "./screens/admin/AdminFacilitiesScreen";
import { AdminCommunitiesScreen } from "./screens/admin/AdminCommunitiesScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { TrackWasteScreen } from "./screens/TrackWasteScreen";
import { CommunityScreen } from "./screens/CommunityScreen";
import { LocationsScreen } from "./screens/LocationsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MarketplaceScreen } from "./screens/MarketplaceScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { EducationScreen } from "./screens/EducationScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { HelpScreen } from "./screens/HelpScreen";
import { CollectorDashboardScreen } from "./screens/CollectorDashboardScreen";
import { CollectorPickupsScreen } from "./screens/CollectorPickupsScreen";
import { CollectorRoutesScreen } from "./screens/CollectorRoutesScreen";
import { CollectorHistoryScreen } from "./screens/CollectorHistoryScreen";
import { DonationTrackingScreen } from "./screens/DonationTrackingScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import CarbonFootprintScreen from "./screens/CarbonFootprintScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: LoginScreen },
      { path: "signup", Component: SignupScreen },
      { path: "onboarding", Component: OnboardingScreen },
      { path: "forgot-password", Component: ForgotPasswordScreen },
    ],
  },
  {
    path: "/app",
    Component: RootLayout,
    children: [
      // Shared routes (all roles)
      { index: true, Component: HomeScreen },
      { path: "community", Component: CommunityScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "profile/notifications", Component: NotificationsScreen },
      { path: "profile/settings", Component: SettingsScreen },
      { path: "help", Component: HelpScreen },
      { path: "marketplace", Component: MarketplaceScreen },
      { path: "analytics", Component: AnalyticsScreen },
      { path: "education", Component: EducationScreen },
      // Donor routes
      { path: "track", Component: TrackWasteScreen },
      { path: "locations", Component: LocationsScreen },
      { path: "my-donations", Component: DonationTrackingScreen },
      { path: "rewards", Component: RewardsScreen },
      { path: "carbon", Component: CarbonFootprintScreen },
      // Collector routes
      { path: "collector-dashboard", Component: CollectorDashboardScreen },
      { path: "pickups", Component: CollectorPickupsScreen },
      { path: "routes", Component: CollectorRoutesScreen },
      { path: "collector-history", Component: CollectorHistoryScreen },
    ],
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminOverviewScreen },
      { path: "users", Component: AdminUsersScreen },
      { path: "collectors", Component: AdminCollectorsScreen },
      { path: "waste", Component: AdminWasteScreen },
      { path: "analytics", Component: AdminAnalyticsScreen },
      { path: "facilities", Component: AdminFacilitiesScreen },
      { path: "communities", Component: AdminCommunitiesScreen },
    ],
  },
]);
