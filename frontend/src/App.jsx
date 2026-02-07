import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { PrivateRoute } from './components/PrivateRoute'
import { AdminRoute } from './components/AdminRoute'
import api from './services/api' // Ensure this points to your updated api.js with withCredentials: true

// Public pages
import Home from './pages/Home'
import AboutSection from './pages/about/AboutSection'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Faculties from './pages/Faculties'
import FacultyDetail from './pages/FacultyDetail'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import PaymentSuccess from './pages/PaymentSuccess'
import HallOfFame from './pages/HallOfFame'
import ZakatCalculator from './pages/ZakatCalculator'
import ZakatSuccess from './pages/zakat/ZakatSuccess'
import ZakatFailure from './pages/zakat/ZakatFailure'
import Blogs from './pages/Blogs'
import BlogDetail from './pages/BlogDetail'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import ZakatNisab from './pages/ZakatNisab'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Terms from './pages/Terms'

// Auth pages
import Login from './pages/auth/Login'
import AdminLogin from './pages/auth/AdminLogin'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// User pages
import Dashboard from './pages/user/Dashboard'
import Donations from './pages/user/Donations'
import Donate from './pages/user/Donate'
import Profile from './pages/user/Profile'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminProjects from './pages/admin/Projects'
import AdminFaculties from './pages/admin/Faculties'
import AdminDonations from './pages/admin/Donations'
import AdminDonors from './pages/admin/Donors'
import AdminMedia from './pages/admin/Media'
import AdminAdmins from './pages/admin/Admins'
import AdminHallOfFame from './pages/admin/HallOfFame'
import ContentEditor from './pages/admin/ContentEditor'
import SiteAssets from './pages/admin/SiteAssets'
import AdminBlogs from './pages/admin/Blogs'
import AdminEvents from './pages/admin/Events'
import AdminAboutUs from './pages/admin/AboutUs'
import AdminTestimonials from './pages/admin/Testimonials'

// Layout
import Layout from './components/Layout'
import AdminLayout from './components/admin/AdminLayout'
import ScrollToTop from './components/ScrollToTop'

function CategoryToFacultiesRedirect() {
  const { slug } = useParams()
  return <Navigate to={slug ? `/faculties?category=${encodeURIComponent(slug)}` : '/faculties'} replace />
}

function App() {
  // 🚀 PERFORMANCE FIX: Warm up the Render backend immediately on load
  // This helps eliminate the 3-minute "Cold Start" delay for payments
  useEffect(() => {
    const warmUp = async () => {
      try {
        await api.get('/health');
        console.log("🚀 Backend warmed up and connection established");
      } catch (e) {
        console.log("🌙 Backend is still waking up...");
      }
    }
    warmUp();
  }, []);

  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            
            {/* FIXED: Added 'about-us' alias to match Footer links */}
            <Route path="about-us" element={<Navigate to="/about/who-we-are" replace />} />
            <Route path="about" element={<Navigate to="/about/who-we-are" replace />} />
            <Route path="about/:section" element={<AboutSection />} />
            
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="faculties" element={<Faculties />} />
            <Route path="faculties/:facultyName" element={<FacultyDetail />} />
            <Route path="categories" element={<Faculties />} />
            <Route path="categories/:slug" element={<CategoryToFacultiesRedirect />} />
            
            {/* FIXED: Added 'media' alias to match Footer links */}
            <Route path="media" element={<Gallery />} />
            <Route path="gallery" element={<Gallery />} />
            
            <Route path="contact" element={<Contact />} />
            <Route path="hall-of-fame" element={<HallOfFame />} />
            <Route path="donate" element={<Donate />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="zakat-calculator" element={<ZakatCalculator />} />
            <Route path="zakat/nisab" element={<ZakatNisab />} />
            <Route path="zakat/success" element={<ZakatSuccess />} />
            <Route path="zakat/failure" element={<ZakatFailure />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="blogs/:slug" element={<BlogDetail />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:slug" element={<EventDetail />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms" element={<Terms />} />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* User routes */}
          <Route path="/user" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="donations" element={<Donations />} />
            <Route path="donate" element={<Donate />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="faculties" element={<AdminFaculties />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="assets" element={<SiteAssets />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="donors" element={<AdminDonors />} />
            <Route path="hall-of-fame" element={<AdminHallOfFame />} />
            <Route path="content" element={<ContentEditor />} />
            <Route path="blogs" element={<AdminBlogs />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="about-us" element={<AdminAboutUs />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="admins" element={<AdminAdmins />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App