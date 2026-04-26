const MES_ABBR = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

type Props = {
  months: number[];
  active: number | null;
  onSelect: (month: number) => void;
  onAddMonth: () => void;
  onComparar?: () => void;
};

export function MonthNav({ months, active, onSelect, onAddMonth, onComparar }: Props) {
  const sorted = [...months].sort((a, b) => a - b);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottom: '1px solid var(--border)',
    }}>
      {sorted.map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: active === m ? '1.5px solid var(--primary)' : '1px solid var(--border)',
            background: active === m ? 'var(--primary-bg)' : 'var(--surface)',
            color: active === m ? 'var(--primary)' : 'var(--muted)',
            fontWeight: active === m ? 600 : 400,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {MES_ABBR[m - 1]}
        </button>
      ))}
      <button
        onClick={onAddMonth}
        style={{
          padding: '4px 12px',
          borderRadius: 6,
          border: active === null ? '1.5px solid var(--primary)' : '1px dashed var(--border)',
          background: active === null ? 'var(--primary-bg)' : 'transparent',
          color: active === null ? 'var(--primary)' : 'var(--muted)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        + Agregar mes
      </button>
      {sorted.length >= 2 && onComparar && (
        <button
          onClick={onComparar}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--primary)',
            background: 'var(--primary-bg)',
            color: 'var(--primary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            marginLeft: 4,
          }}
        >
          Comparar →
        </button>
      )}
    </div>
  );
}
