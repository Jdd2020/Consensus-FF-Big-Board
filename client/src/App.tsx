import React, { useEffect, useState } from 'react';

type AdpRow = {
  [key: string]: string | number | null;
};

const App: React.FC = () => {
  const [data, setData] = useState<AdpRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <p>Loading ADP data...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Half PPR ADP Data</h1>
      {data.length === 0 ? (
        <p>No data found.</p>
      ) : (
        <table border={1} cellPadding={8} cellSpacing={0}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, i) => (
                  <td key={i}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default App;
