import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const Landing        = lazy(() => import("./pages/Landing"));
const Login          = lazy(() => import("./pages/Login"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const ProjectView    = lazy(() => import("./pages/ProjectView"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Careers        = lazy(() => import("./pages/Careers"));
const Projects       = lazy(() => import("./pages/Projects"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/projects" element={<Projects />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:projectId"
            element={
              <ProtectedRoute>
                <ProjectView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
