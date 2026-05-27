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
    <div className="month-nav">
      {sorted.map(m => (
        <button
          key={m}
          className={`month-chip${active === m ? ' active' : ''}`}
          onClick={() => onSelect(m)}
        >
          {MES_ABBR[m - 1]}
        </button>
      ))}
      <button
        className={`month-chip add${active === null ? ' active' : ''}`}
        onClick={onAddMonth}
      >
        + Agregar mes
      </button>
      {sorted.length >= 2 && onComparar && (
        <button className="month-chip compare" onClick={onComparar}>
          ¿Por qué cambió? →
        </button>
      )}
    </div>
  );
}
