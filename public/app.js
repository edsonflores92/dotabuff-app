const button = document.getElementById('load-data');
const result = document.getElementById('result');

button.addEventListener('click', async () => {
  result.innerHTML = '<p>Cargando datos...</p>';

  try {
    const response = await fetch('/api/dotabuff');
    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'Error al consultar la API');
    }

    const data = json.data;
    result.innerHTML = `
      <h2>Datos de Dotabuff</h2>
      <p><strong>Hero:</strong> ${data.hero}</p>
      <p><strong>Victorias:</strong> ${data.wins}</p>
      <p><strong>Derrotas:</strong> ${data.losses}</p>
      <p><strong>Winrate:</strong> ${data.winrate}</p>
      <p><strong>Última actualización:</strong> ${data.lastUpdated}</p>
    `;
  } catch (error) {
    result.innerHTML = `<p>Error: ${error.message}</p>`;
  }
});
