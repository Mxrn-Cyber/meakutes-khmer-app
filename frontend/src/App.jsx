import { Routes, Route, BrowserRouter, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import VerifyBanner from "./components/VerifyBanner.jsx";
import Loading from "./components/Loading.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import { LanguageProvider, useLang } from "./i18n";
import { useScrollReveal } from "./utils/motion";
import { SiteImagesProvider } from "./siteImages.jsx";
import { hidePreloader } from "./preloader.js";
import { useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/useAuth";
import { TripProvider } from "./context/TripContext.jsx";
import { FeedbackProvider } from "./components/Feedback.jsx";

// Pages load on demand, so the first visit only downloads what it shows.
const Discover = lazy(() => import("./pages/Discover.jsx"));
const Popular = lazy(() => import("./pages/Popular.jsx"));
const NewsEvents = lazy(() => import("./pages/NewsEvents.jsx"));
const Article = lazy(() => import("./pages/Article.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const TripDetail = lazy(() => import("./pages/TripDetail.jsx"));
const AdminLayout = lazy(() => import("./admin/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard.jsx"));
const AdminDestinations = lazy(() => import("./admin/AdminDestinations.jsx"));
const AdminNews = lazy(() => import("./admin/AdminNews.jsx"));
const AdminTaxonomy = lazy(() => import("./admin/AdminTaxonomy.jsx"));
const AdminMedia = lazy(() => import("./admin/AdminMedia.jsx"));
const AdminSiteImages = lazy(() => import("./admin/AdminSiteImages.jsx"));
const AdminReviews = lazy(() => import("./admin/AdminReviews.jsx"));
const AdminUsers = lazy(() => import("./admin/AdminUsers.jsx"));

function NotFound() {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold">{t("notFound.title")}</h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">{t("notFound.text")}</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        {t("notFound.back")}
      </Link>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

function AppShell() {
  const { isLoading } = useAuth();
  const { pathname } = useLocation();
  // The admin panel has its own full-screen layout (see admin/AdminLayout.jsx).
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  // AdminLayout renders its own <main>; avoid nesting two.
  const Main = isAdminArea ? "div" : "main";
  useScrollReveal();
  // Hide the splash once we know who is logged in (the first screen is then final).
  useEffect(() => {
    if (!isLoading) hidePreloader();
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {isLoading && <Loading />}
      {!isAdminArea && <Navbar />}
      {!isAdminArea && <div className="h-16" aria-hidden="true" />}
      {!isAdminArea && <VerifyBanner />}
      <Main className={isAdminArea ? "" : "min-h-[60vh]"}>
        {/* Keyed by page so each page fades in when you navigate. */}
        <div key={isAdminArea ? "admin" : pathname} className={isAdminArea ? "" : "animate-page-in"}>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/news" element={<NewsEvents />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/trip/:id" element={<TripDetail />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="destinations" element={<AdminDestinations />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="taxonomy" element={<AdminTaxonomy />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="site-images" element={<AdminSiteImages />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </div>
      </Main>
      {!isAdminArea && <Footer />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <SiteImagesProvider>
      <AuthProvider>
        <TripProvider>
          <BrowserRouter>
            <FeedbackProvider>
              <AppShell />
            </FeedbackProvider>
          </BrowserRouter>
        </TripProvider>
      </AuthProvider>
      </SiteImagesProvider>
    </LanguageProvider>
  );
}

export default App;
