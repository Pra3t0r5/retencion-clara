import type { PayslipData, F572Data } from '../engine/schemas';
import { UploadForms } from './UploadForms';

// [AI] DataModal is an organism (Atomic Design) — single responsibility: manage
// the open/close lifecycle of the bottom sheet. UploadForms (the existing form
// organism) is composed inside unchanged. Separation allows each to be tested
// and modified independently.

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayslipData | null;
  f572: F572Data | null;
  onPayslipChange: (d: PayslipData) => void;
  onF572Change: (d: F572Data) => void;
}

export function DataModal({ isOpen, onClose, payslip, f572, onPayslipChange, onF572Change }: DataModalProps) {
  if (!isOpen) return null;

  function handlePayslip(d: PayslipData) {
    onPayslipChange(d);
    onClose();
  }

  function handleF572(d: F572Data) {
    onF572Change(d);
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          maxHeight: '90dvh',
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Handle */}
        <div style={{
          width: 36, height: 4,
          background: 'var(--color-border)',
          borderRadius: 2,
          margin: '12px auto 0',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5) var(--space-2)',
        }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
            Cargar datos
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-border)',
              border: 'none',
              borderRadius: '50%',
              width: 28, height: 28,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 14,
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '0 var(--space-5) var(--space-6)' }}>
          <UploadForms
            payslip={payslip}
            f572={f572}
            onPayslipChange={handlePayslip}
            onF572Change={handleF572}
          />
        </div>
      </div>
    </div>
  );
}
