import { Routes, Route, HashRouter, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Discover from "./pages/Discover.jsx";
import Popular from "./pages/Popular.jsx";
import NewsEvents from "./pages/NewsEvents.jsx";
import Article from "./pages/Article.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Profile from "./pages/Profile.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Loading from "./components/Loading.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import TripDetail from "./pages/TripDetail.jsx";
import Translator from "./components/Translator.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { TripProvider } from "./context/TripContext.jsx";
import { FeedbackProvider } from "./components/Feedback.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminDestinations from "./admin/AdminDestinations.jsx";
import AdminNews from "./admin/AdminNews.jsx";
import AdminTaxonomy from "./admin/AdminTaxonomy.jsx";
import AdminMedia from "./admin/AdminMedia.jsx";
import AdminReviews from "./admin/AdminReviews.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";

function AppShell() {
  const { isLoading } = useAuth();
  const { pathname } = useLocation();
  // The admin panel has its own full-screen layout (see admin/AdminLayout.jsx).
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  // AdminLayout renders its own <main>; avoid nesting two.
  const Main = isAdminArea ? "div" : "main";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      {isLoading && <Loading />}
      {!isAdminArea && <Navbar />}
      {!isAdminArea && <div className="h-16" aria-hidden="true" />}
      <Translator />
      <Main className={isAdminArea ? "" : "min-h-[60vh]"}>
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
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-xl px-4 py-24 text-center">
                <p className="text-sm font-semibold text-brand-600">404</p>
                <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
                <p className="mt-3 text-gray-600 dark:text-gray-400">The page you are looking for does not exist.</p>
                <a href="#/" className="mt-6 inline-block rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Back to home</a>
              </div>
            }
          />
        </Routes>
      </Main>
      {!isAdminArea && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <HashRouter>
          <FeedbackProvider>
            <AppShell />
          </FeedbackProvider>
        </HashRouter>
      </TripProvider>
    </AuthProvider>
  );
}

export default App;
