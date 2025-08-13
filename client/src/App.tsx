import React, { useEffect, useState } from 'react';

type AdpRow = {
  [key: string]: string | number | null;
};

type SortConfig = {
  key: string;
  direction: 'ascending' | 'descending';
} | null;

const App: React.FC = () => {
  const [data, setData] = useState<AdpRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [draftedPlayers, setDraftedPlayers] = useState<Set<number>>(new Set());
  const [fadingPlayers, setFadingPlayers] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAdp = async () => {
      try {
        const response = await fetch('http://localhost:5000/adp');
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        
        const result = await response.json();
        console.warn('ADP Data:', result);
        setData(result);
      } catch (err: any) {
        console.error('Full error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdp();
  }, []);

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    
    // Filter out drafted players (but not fading ones - they should still be visible during animation)
    sortableData = sortableData.filter((_, index) => !draftedPlayers.has(index));
    
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle null values
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        
        // Convert to numbers if both values are numeric
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        const bothNumeric = !isNaN(aNum) && !isNaN(bNum);
        
        let comparison = 0;
        if (bothNumeric) {
          comparison = aNum - bNum;
        } else {
          // String comparison
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          comparison = aStr.localeCompare(bStr);
        }
        
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableData;
  }, [data, sortConfig, draftedPlayers, fadingPlayers]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnName: string): React.ReactNode => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return <i className="fa-solid fa-sort sort-icon" aria-hidden="true" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <i className="fa-solid fa-sort-up sort-icon" aria-hidden="true" />
    ) : (
      <i className="fa-solid fa-sort-down sort-icon" aria-hidden="true" />
    );
  };

  const handleDraftPlayer = (originalIndex: number) => {
    if (draftedPlayers.has(originalIndex)) {
      // If unchecking, remove from drafted immediately
      setDraftedPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalIndex);
        return newSet;
      });
      setFadingPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(originalIndex);
        return newSet;
      });
    } else {
      // If checking, start fade animation
      setFadingPlayers(prev => new Set(prev).add(originalIndex));
      
      // After animation completes, add to drafted players
      setTimeout(() => {
        setDraftedPlayers(prev => new Set(prev).add(originalIndex));
        setFadingPlayers(prev => {
          const newSet = new Set(prev);
          newSet.delete(originalIndex);
          return newSet;
        });
      }, 500); // 500ms animation duration
    }
  };

  if (loading) return <p>Loading ADP data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="retro">
      <h1>
        <i className="fa-solid fa-terminal title-icon" aria-hidden="true"></i>
        Half PPR ADP Data
        <span className="caret" aria-hidden="true"></span>
      </h1>
      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <>
          <style>
            {`
              :root {
                --bg: #000807;
                --panel: #03110b;
                --grid: #092016;
                --text: #b8ffb8; /* terminal green */
                --muted: #84ff84;
                --accent: #00ff66; /* neon terminal */
                --accent2: #00ffaa; /* secondary */
                --line: rgba(0,255,102,0.18);
                --line-strong: rgba(0,255,102,0.35);
              }

              .retro {
                min-height: 100vh;
                padding: 2rem;
                background:
                  radial-gradient(1200px 800px at 20% -10%, rgba(0,255,170,0.06), transparent),
                  radial-gradient(1000px 600px at 100% 10%, rgba(0,255,102,0.08), transparent),
                  var(--bg);
                color: var(--text);
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                letter-spacing: 0.2px;
              }
              .retro::before {
                content: "";
                position: fixed; inset: 0;
                background: repeating-linear-gradient(180deg, rgba(0,255,102,0.035) 0px, rgba(0,255,102,0.035) 1px, transparent 2px, transparent 4px);
                pointer-events: none;
                mix-blend-mode: overlay;
              }

              h1 {
                margin: 0 0 1rem;
                font-size: 1.4rem;
                letter-spacing: 0.12em;
                color: var(--muted);
                text-shadow: 0 0 8px rgba(0,255,102,0.45), 0 0 16px rgba(0,255,170,0.25);
                display: flex; align-items: center; gap: 10px;
              }
              .title-icon { color: var(--accent); filter: drop-shadow(0 0 8px rgba(0,255,102,0.6)); }
              .caret { display: inline-block; width: 10px; height: 1.1em; margin-left: 6px; background: var(--accent); box-shadow: 0 0 10px rgba(0,255,102,0.8); animation: blink 1s steps(1, end) infinite; }
              @keyframes blink { 50% { opacity: 0; } }

              .retro-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                background: linear-gradient(180deg, rgba(9,32,22,0.55), rgba(5,18,12,0.85));
                 border: 1px solid var(--line-strong);
                box-shadow: 0 0 0 2px rgba(0,255,102,0.08), 0 0 24px rgba(0,255,102,0.12), inset 0 0 24px rgba(0,255,102,0.08);
                 border-radius: 8px;
                 overflow: hidden;
               }
              .retro-table thead th {
                position: sticky; top: 0;
                background: linear-gradient(180deg, #042015, #041a12);
                color: var(--muted);
                border-bottom: 1px solid var(--line-strong);
                padding: 10px 12px;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                font-size: 0.78rem;
              }
              .th-drafted { text-align: center; font-weight: 700; }
              .th-sortable { cursor: pointer; user-select: none; }
              .th-sortable:hover { color: var(--accent); text-shadow: 0 0 8px rgba(0,255,102,0.6); }
              .header-label { display: inline-flex; align-items: center; gap: 6px; }
              .sort-icon { margin-left: 6px; color: var(--muted); opacity: 0.9; filter: drop-shadow(0 0 6px rgba(0,255,102,0.35)); }
              .th-sortable:hover .sort-icon { color: var(--accent); opacity: 1; }

              .retro-table tbody tr {
                background: transparent;
                transition: background 120ms ease, transform 120ms ease;
              }
              .retro-table tbody tr:hover { background: rgba(0,255,102,0.06); }
              .retro-table tbody tr:nth-child(odd) { background: rgba(10,32,24,0.35); }

              .retro-table td {
                 padding: 10px 12px;
                 border-bottom: 1px solid var(--line);
                 color: var(--text);
                 font-size: 0.95rem;
               }
               .checkbox-cell { text-align: center; }
              input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--accent); filter: drop-shadow(0 0 6px rgba(0,255,102,0.6)); }
              .name-cell { font-weight: 700; color: #ceffce; text-shadow: 0 0 6px rgba(0,255,102,0.6); }

               /* Draft/Fade animations */
               .fade-out { opacity: 1; transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
               .fade-out.fading { opacity: 0; transform: scale(0.95); }
              .drafted-row { background-color: rgba(0,255,102,0.1) !important; color: #9bffc6; }
            `}
          </style>
          <table className="retro-table">
            <thead>
              <tr>
                <th className="th-drafted"><span className="header-label"><i className="fa-regular fa-square-check" aria-hidden="true"></i> Drafted</span></th>
                 {/* Name column first */}
                 {data[0] && 'Name' in data[0] && (
                  <th
                    key="Name"
                    onClick={() => requestSort('Name')}
                    className="th-sortable"
                  >
                    <span className="header-label"><i className="fa-solid fa-user" aria-hidden="true"></i> Name</span>{getSortIndicator('Name')}
                   </th>
                 )}
                 {/* All other columns except Name */}
                {Object.keys(data[0]).filter(key => key !== 'Name').map((key) => (
                  <th
                    key={key}
                    onClick={() => requestSort(key)}
                    className="th-sortable"
                  >
                    <span className="header-label">{key}</span>{getSortIndicator(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, sortedIndex) => {
                // Find the original index in the full data array
                const originalIndex = data.findIndex(originalRow => 
                  JSON.stringify(originalRow) === JSON.stringify(row)
                );
                
                const isFading = fadingPlayers.has(originalIndex);
                const isDrafted = draftedPlayers.has(originalIndex);
                
                return (
                  <tr 
                    key={originalIndex}
                    className={"fade-out " + (isFading ? 'fading ' : '') + (isDrafted ? 'drafted-row' : '')}
                  >
                    <td className="checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isDrafted || isFading}
                        onChange={() => handleDraftPlayer(originalIndex)}
                        style={{ cursor: 'pointer' }}
                        disabled={isFading}
                      />
                    </td>
                    {/* Name column first */}
                    {row.Name !== undefined && (
                      <td key="Name" className="name-cell">{row.Name}</td>
                    )}
                    {/* All other columns except Name */}
                    {Object.entries(row).filter(([key]) => key !== 'Name').map(([key, val], i) => (
                      <td key={key}>{val}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
