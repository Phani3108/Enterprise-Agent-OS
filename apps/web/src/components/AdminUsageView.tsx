'use client';
/**
 * AdminUsageView — Usage & Monitoring section.
 * Shows: Control Plane
 */
import ControlPlane from './ControlPlane';

export function AdminUsageView() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <ControlPlane />
      </div>
    </div>
  );
}
