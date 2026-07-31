import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 py-12 overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.png" 
            alt="Qevn Logo" 
            className="h-16 w-auto object-contain rounded-2xl p-1 mb-2 shadow-sm"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">QEVN CRM</h1>
          <p className="text-xs text-muted-foreground mt-1">Client Follow-up & CRM Suite</p>
        </div>

        {children}
      </div>
    </div>
  );
}
