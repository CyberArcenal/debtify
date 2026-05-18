import React from 'react';
import Modal from '../../../../components/UI/Modal';
import Button from '../../../../components/UI/Button';

interface Props { isOpen: boolean; methodName?: string; onClose: () => void; onConfirm: () => void; loading: boolean; }
const DeleteConfirmationModal: React.FC<Props> = ({ isOpen, methodName, onClose, onConfirm, loading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Method" size="sm">
    <p>Delete "{methodName}"? This action cannot be undone.</p>
    <div className="flex justify-end gap-2 mt-4"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={loading}>Delete</Button></div>
  </Modal>
);
export default DeleteConfirmationModal;