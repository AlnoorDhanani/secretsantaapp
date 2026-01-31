/**
 * Main App Component
 *
 * Handles routing between screens and global state.
 */

import React from 'react';
import { useDrawStore } from './store';
import { ToastProvider } from './components/ui';
import HomeScreen from './screens/HomeScreen';
import DrawEditor from './screens/DrawEditor';

function AppContent() {
  const { currentDraw } = useDrawStore();

  // If no draw is loaded, show home screen
  if (!currentDraw) {
    return <HomeScreen />;
  }

  // Otherwise show the draw editor
  return <DrawEditor />;
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
