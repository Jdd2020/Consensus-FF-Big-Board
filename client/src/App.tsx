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

  const getSortIndicator = (columnName: string) => {
    if (!sortConfig || sortConfig.key !== columnName) {
      return ' ↕️'; // Both arrows when not sorted
    }
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
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
    <div style={{ padding: '2rem' }}>
      <h1>Half PPR ADP Data</h1>
      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <>
          <style>
            {`
              .fade-out {
                opacity: 1;
                transition: opacity 0.5s ease-out, transform 0.5s ease-out;
              }
              .fade-out.fading {
                opacity: 0;
                transform: scale(0.95);
              }
              .drafted-row {
                background-color: #f0f0f0 !important;
              }
            `}
          </style>
          <table border={1} cellPadding={8} cellSpacing={0} style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ 
                  cursor: 'default',
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  Drafted
                </th>
                {/* Name column first */}
                {data[0] && 'Name' in data[0] && (
                  <th 
                    key="Name"
                    onClick={() => requestSort('Name')}
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: '#f5f5f5',
                      userSelect: 'none',
                      padding: '8px',
                      textAlign: 'left'
                    }}
                  >
                    Name{getSortIndicator('Name')}
                  </th>
                )}
                {/* All other columns except Name */}
                {Object.keys(data[0]).filter(key => key !== 'Name').map((key) => (
                  <th 
                    key={key}
                    onClick={() => requestSort(key)}
                    style={{ 
                      cursor: 'pointer', 
                      backgroundColor: '#f5f5f5',
                      userSelect: 'none',
                      padding: '8px',
                      textAlign: 'left'
                    }}
                  >
                    {key}{getSortIndicator(key)}
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
                    className={`fade-out ${isFading ? 'fading' : ''} ${isDrafted ? 'drafted-row' : ''}`}
                  >
                    <td style={{ padding: '8px', textAlign: 'center' }}>
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
                      <td key="Name" style={{ padding: '8px', fontWeight: 'bold' }}>{row.Name}</td>
                    )}
                    {/* All other columns except Name */}
                    {Object.entries(row).filter(([key]) => key !== 'Name').map(([key, val], i) => (
                      <td key={key} style={{ padding: '8px' }}>{val}</td>
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
};

export default App;
