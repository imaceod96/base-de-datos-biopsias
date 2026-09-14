// Área de contenido principal
// Simple componente que renderiza los hijos

import React from 'react';

export const ContentArea: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <main className="flex-1 p-6 bg-gray-50">{children}</main>;
};