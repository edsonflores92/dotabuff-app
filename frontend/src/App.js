import { useState } from 'react';

function App() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHeroes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/heroes');
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Error al obtener héroes');
      }

      setHeroes(json.heroes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Dotabuff Heroes</h1>
      <button onClick={fetchHeroes} disabled={loading}>
        {loading ? 'Cargando...' : 'Cargar héroes'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <ul>
        {heroes.map((hero, index) => (
          <li key={index}>{hero}</li>
        ))}
      </ul>

      {!loading && heroes.length === 0 && !error && (
        <p>Pulsa el botón para cargar la lista de héroes.</p>
      )}
    </div>
  );
}

export default App;
