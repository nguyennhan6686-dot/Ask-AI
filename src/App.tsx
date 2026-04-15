/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Quiz } from "./pages/Quiz";
import { Chatbot } from "./pages/Chatbot";
import { Teacher } from "./pages/Teacher";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Route gốc (/) bây giờ sẽ hiển thị trực tiếp Chatbot (dành cho iSpring) */}
        <Route path="/" element={
          <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4">
            <Chatbot />
          </div>
        } />
        
        {/* Các trang quản lý và học tập khác được chuyển sang sub-path */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="chat" element={<Chatbot />} />
          <Route path="teacher" element={<Teacher />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
