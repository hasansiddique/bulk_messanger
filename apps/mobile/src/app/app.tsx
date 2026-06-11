import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/protected-route';
import { AddContactPage } from '../pages/add-contact-page';
import { CampaignDetailPage } from '../pages/campaign-detail-page';
import { CampaignsPage } from '../pages/campaigns-page';
import { ComposeMessagePage } from '../pages/compose-message-page';
import { EditContactPage } from '../pages/edit-contact-page';
import { GroupFormPage } from '../pages/group-form-page';
import { GroupsPage } from '../pages/groups-page';
import { HomePage } from '../pages/home-page';
import { ImportContactsPage } from '../pages/import-contacts-page';
import { LoginPage } from '../pages/login-page';
import { PhonebookPage } from '../pages/phonebook-page';
import { RegisterPage } from '../pages/register-page';
import { SendTemplatePage } from '../pages/send-template-page';
import { TemplatesPage } from '../pages/templates-page';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compose"
        element={
          <ProtectedRoute>
            <ComposeMessagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phonebook"
        element={
          <ProtectedRoute>
            <PhonebookPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phonebook/new"
        element={
          <ProtectedRoute>
            <AddContactPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phonebook/import"
        element={
          <ProtectedRoute>
            <ImportContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/phonebook/:id/edit"
        element={
          <ProtectedRoute>
            <EditContactPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates/send"
        element={
          <ProtectedRoute>
            <SendTemplatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/new"
        element={
          <ProtectedRoute>
            <GroupFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups/:id/edit"
        element={
          <ProtectedRoute>
            <GroupFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <CampaignsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns/:id"
        element={
          <ProtectedRoute>
            <CampaignDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
