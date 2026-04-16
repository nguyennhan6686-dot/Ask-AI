/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Quiz } from "./pages/Quiz";
import { Chatbot } from "./pages/Chatbot";
import { Teacher } from "./pages/Teacher";
import { LoginPage } from "./pages/Login";
import { UnauthorizedPage } from "./pages/Unauthorized";
import { AccountManagement } from "./pages/AccountManagement";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Root Chatbot for iSpring */}
          <Route path="/" element={
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4">
              <Chatbot />
            </div>
          } />
          
          {/* Protected App Routes */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="chat" element={<Chatbot />} />
            
            {/* Admin Only */}
            <Route path="accounts" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AccountManagement />
              </ProtectedRoute>
            } />

            {/* Admin or Teacher (Teacher is currently mapped to Admin role in this logic) */}
            <Route path="teacher" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Teacher />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
