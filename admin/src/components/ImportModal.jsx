import { useState } from 'react';
import {
  Modal,
  Button,
  Typography,
  Field,
  Flex,
  SingleSelect,
  SingleSelectOption,
  Box,
  Alert,
} from '@strapi/design-system';
import { Cloud } from '@strapi/icons';

// Constants
const VALID_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const VALID_FILE_EXTENSIONS = ['.xlsx', '.xls'];

/**
 * Modal component for importing users from Excel
 */
const ImportModal = ({ isOpen, onClose, roles, onImport }) => {
  const [file, setFile] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (selectedFile) => {
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = VALID_FILE_TYPES.includes(selectedFile.type);
    const isValidExtension = VALID_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!isValidType && !isValidExtension) {
      throw new Error(`Please upload a valid Excel file (${VALID_FILE_EXTENSIONS.join(', ')})`);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    try {
      validateFile(selectedFile);
      setFile(selectedFile);
      setError('');
    } catch (err) {
      setError(err.message);
      setFile(null);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSelectedRole('');
    setError('');
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    if (!selectedRole) {
      setError('Please select a role for the imported users');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onImport(file, selectedRole);
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to import users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal.Root open={isOpen} onOpenChange={handleClose}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>Import Users from Excel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Flex direction="column" gap={4}>
            {error && (
              <Alert variant="danger" onClose={() => setError('')} title="Error">
                {error}
              </Alert>
            )}

            <Field.Root name="file" required>
              <Flex direction="column" alignItems="stretch" gap={1}>
                <Field.Label>
                  Import File
                </Field.Label>
                <Box
                  as="label"
                  padding={4}
                  background="neutral100"
                  borderColor="neutral200"
                  borderStyle="dashed"
                  borderWidth="1px"
                  hasRadius
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="file"
                    accept={VALID_FILE_EXTENSIONS.join(',')}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                    aria-label="Upload Excel file"
                  />
                  <Flex direction="column" alignItems="center" gap={2}>
                    <Cloud width="32px" height="32px" />
                    <Typography variant="pi" textColor="neutral600">
                      {file ? file.name : 'Click to upload Excel file (.xlsx)'}
                    </Typography>
                  </Flex>
                </Box>
              </Flex>
            </Field.Root>

            <Field.Root name="role" required>
              <Flex direction="column" alignItems="stretch" gap={1}>
                <Field.Label>
                  User Role
                </Field.Label>
                <SingleSelect
                  placeholder="Select a role for imported users"
                  value={selectedRole}
                  onChange={setSelectedRole}
                >
                  {roles && roles.length > 0 ? (
                    roles.map((role) => (
                      <SingleSelectOption key={role.id} value={String(role.id)}>
                        {role.name}
                      </SingleSelectOption>
                    ))
                  ) : (
                    <SingleSelectOption value="" disabled>
                      No roles available
                    </SingleSelectOption>
                  )}
                </SingleSelect>
              </Flex>
            </Field.Root>
          </Flex>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} variant="tertiary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading} disabled={isLoading}>
            Import Users
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export { ImportModal };
