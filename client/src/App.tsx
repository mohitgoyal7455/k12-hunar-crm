import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Spinner } from './components/Spinner';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { InquiryPage } from './pages/InquiryPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// The dashboard is only for staff — keep it out of the public bundle.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InquiryPage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Suspense
              fallback={
                <div className="grid min-h-dvh place-items-center text-slate">
                  <Spinner className="size-6" />
                </div>
              }
            >
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
