import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Flex,
} from '@strapi/design-system';
import { Page } from '@strapi/strapi/admin';
import { Download, Upload, Check } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useFetchClient, useAuth } from '@strapi/strapi/admin';
import { getTranslation } from '../utils/getTranslation';
import { ImportModal } from '../components/ImportModal';

// Constants
const SUPER_ADMIN_CODE = 'strapi-super-admin';
const API_BASE = '/admin-users-import';

/**
 * Download a file from a URL
 */
const downloadFile = async (url, filename, token) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(objectUrl);
  document.body.removeChild(link);
};

const HomePage = () => {
  const { formatMessage } = useIntl();
  const { get, post } = useFetchClient();
  const token = useAuth('HomePage', (state) => state.token);
  const user = useAuth('HomePage', (state) => state.user);

  // Check if user is Super Admin (plugin is Super Admin only)
  const isSuperAdmin = user?.roles?.some(role => role.code === SUPER_ADMIN_CODE) || false;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoadingRoles(true);
      const response = await get(`${API_BASE}/roles`);
      setRoles(response.data?.roles || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setError('Failed to load user roles');
    } finally {
      setIsLoadingRoles(false);
    }
  }, [get]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDownloadTemplate = async () => {
    try {
      await downloadFile(
        `${API_BASE}/template`,
        'user-import-template.xlsx',
        token
      );
    } catch (err) {
      console.error('Failed to download template:', err);
      setError('Failed to download template');
    }
  };

  const handleImport = async (file, roleId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roleId', roleId);

      const response = await post(`${API_BASE}/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult(response.data);
      setError('');
    } catch (err) {
      console.error('Import error:', err);
      const errorMessage = err.response?.data?.error?.message ||
        'Failed to import users. Please check the file format and try again.';
      throw new Error(errorMessage);
    }
  };

  const handleDownloadResults = async () => {
    if (!importResult?.resultId) return;

    try {
      await downloadFile(
        `${API_BASE}/results/${importResult.resultId}`,
        'user-import-results.xlsx',
        token
      );
      setImportResult(null);
    } catch (err) {
      console.error('Failed to download results:', err);
      setError('Failed to download results');
    }
  };

  // Only Super Admin can access this plugin
  if (!isSuperAdmin) {
    return (
      <Page.Main>
        <Page.Title>
          {formatMessage({ id: getTranslation('plugin.name') })}
        </Page.Title>
        <Box padding={8}>
          <Alert variant="danger" title="Access Denied">
            This plugin is only accessible to Super Admin users.
          </Alert>
        </Box>
      </Page.Main>
    );
  }

  return (
    <>
      <Page.Main>
        <Page.Title>
          {formatMessage({ id: getTranslation('plugin.name') })}
        </Page.Title>
        <Box padding={8}>
          <Flex direction="column" alignItems="stretch" gap={6}>
            {error && (
              <Alert
                variant="danger"
                onClose={() => setError('')}
                title="Error"
                closeLabel="Close"
              >
                {error}
              </Alert>
            )}

            {importResult && (
              <Alert
                variant="success"
                onClose={() => setImportResult(null)}
                title="Import Complete"
                closeLabel="Close"
              >
                <Flex direction="column" alignItems="stretch" gap={2}>
                  <Typography>
                    Successfully imported {importResult.successCount} out of {importResult.totalProcessed} users.
                  </Typography>
                  {importResult.errorCount > 0 && (
                    <Typography textColor="danger600">
                      {importResult.errorCount} users failed to import.
                    </Typography>
                  )}
                  <Button
                    onClick={handleDownloadResults}
                    startIcon={<Download />}
                    variant="success-light"
                    size="S"
                  >
                    Download Results with Invitation Links
                  </Button>
                </Flex>
              </Alert>
            )}

            <Box background="neutral0" padding={6} hasRadius shadow="filterShadow">
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography variant="delta" as="h3">
                  Step 1: Download Template
                </Typography>
                <Typography>
                  Download the Excel template to see the required format for user import.
                  The template includes the following columns: email, firstname, and lastname.
                </Typography>
                <Button
                  onClick={handleDownloadTemplate}
                  startIcon={<Download />}
                  variant="secondary"
                >
                  Download Template
                </Button>
              </Flex>
            </Box>

            <Box background="neutral0" padding={6} hasRadius shadow="filterShadow">
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography variant="delta" as="h3">
                  Step 2: Import Users
                </Typography>
                <Typography>
                  Upload your completed Excel file with user information.
                  You'll need to specify the role for all imported users.
                </Typography>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  startIcon={<Upload />}
                  variant="default"
                  disabled={isLoadingRoles}
                >
                  Import Users
                </Button>
              </Flex>
            </Box>

            <Box background="neutral0" padding={6} hasRadius shadow="filterShadow">
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography variant="delta" as="h3">
                  Step 3: Download Results
                </Typography>
                <Typography>
                  After importing, you'll receive an Excel file with all imported users
                  and their unique invitation links. Share these links with users to allow
                  them to set their passwords and activate their accounts.
                </Typography>
                <Flex alignItems="center" gap={2}>
                  <Check />
                  <Typography textColor="success600">
                    Results will be available for download after successful import
                  </Typography>
                </Flex>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Page.Main>

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roles={roles}
        onImport={handleImport}
      />
    </>
  );
};

export { HomePage };
