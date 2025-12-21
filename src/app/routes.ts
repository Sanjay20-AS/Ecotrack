import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { LoginScreen } from "./screens/LoginScreen";
import { SignupScreen } from "./screens/SignupScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { TrackWasteScreen } from "./screens/TrackWasteScreen";
import { CommunityScreen } from "./screens/CommunityScreen";
import { LocationsScreen } from "./screens/LocationsScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { MarketplaceScreen } from "./screens/MarketplaceScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { EducationScreen } from "./screens/EducationScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: LoginScreen },
      { path: "signup", Component: SignupScreen },
      { path: "onboarding", Component: OnboardingScreen },
    ],
  },
  {
    path: "/app",
    Component: RootLayout,
    children: [
      { index: true, Component: HomeScreen },
      { path: "track", Component: TrackWasteScreen },
      { path: "community", Component: CommunityScreen },
      { path: "locations", Component: LocationsScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "marketplace", Component: MarketplaceScreen },
      { path: "analytics", Component: AnalyticsScreen },
      { path: "education", Component: EducationScreen },
    ],
  },
]);
