'use client';

import React from 'react';
import { useDialer } from './dialer-context';
import { PostCallModal } from './post-call-modal';

export function Softphone() {
  const {
    postCallModalOpen,
    setPostCallModalOpen,
    lastCallData,
    savePostCallNotes
  } = useDialer();

  return (
    <PostCallModal
      isOpen={postCallModalOpen}
      onClose={() => setPostCallModalOpen(false)}
      callData={lastCallData}
      onSave={savePostCallNotes}
    />
  );
}
