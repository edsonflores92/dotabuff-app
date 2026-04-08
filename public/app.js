const button = document.getElementById('load-data');
const result = document.getElementById('result');
const tooltip = document.createElement('div');
const counterpickCache = {};

tooltip.className = 'tooltip hidden';
document.body.appendChild(tooltip);

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

const statsButton = document.getElementById('load-stats');
const heroesButton = document.getElementById('load-heroes');

statsButton.addEventListener('click', async () => {
  try {
    const response = await fetch('/stats');
    const json = await response.json();
    console.log('Respuesta de /stats:', json);
  } catch (error) {
    console.error('Error al consultar /stats:', error);
  }
});

heroesButton.addEventListener('click', async () => {
  result.innerHTML = '<p>Cargando héroes...</p>';

  try {
    const response = await fetch('/heroes');
    const json = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Error al consultar héroes');
    }

    if (!Array.isArray(json.heroes) || json.heroes.length === 0) {
      result.innerHTML = '<p>No se encontraron héroes.</p>';
      return;
    }

    // Agrupar héroes por rol
    const herosByRole = {
      'Hard Carry': [],
      'Mid': [],
      'Off Lane': [],
      'Support': []
    };

    json.heroes.forEach(hero => {
      if (herosByRole[hero.role]) {
        herosByRole[hero.role].push(hero);
      }
    });

    // Ordenar cada sección por winrate
    Object.keys(herosByRole).forEach(role => {
      herosByRole[role].sort((a, b) => b.winrate - a.winrate);
    });

    result.innerHTML = `
      <h2>Héroes de Dotabuff</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h3>🛡️ Hard Carry</h3>
          <ul>
            ${herosByRole['Hard Carry'].map(hero => `<li><span class="hero-name" data-hero-id="${hero.id}">${hero.name}</span> - ${hero.winrate}%</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>⚡ Mid</h3>
          <ul>
            ${herosByRole['Mid'].map(hero => `<li><span class="hero-name" data-hero-id="${hero.id}">${hero.name}</span> - ${hero.winrate}%</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>⚔️ Off Lane</h3>
          <ul>
            ${herosByRole['Off Lane'].map(hero => `<li><span class="hero-name" data-hero-id="${hero.id}">${hero.name}</span> - ${hero.winrate}%</li>`).join('')}
          </ul>
        </div>
        <div>
          <h3>🏥 Support</h3>
          <ul>
            ${herosByRole['Support'].map(hero => `<li><span class="hero-name" data-hero-id="${hero.id}">${hero.name}</span> - ${hero.winrate}%</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    attachHeroTooltips();
  } catch (error) {
    result.innerHTML = `<p>Error: ${error.message}</p>`;
  }
});

function attachHeroTooltips() {
  document.querySelectorAll('.hero-name').forEach(el => {
    el.addEventListener('mouseenter', async event => {
      const heroId = event.target.dataset.heroId;
      const heroName = event.target.textContent;
      const rect = event.target.getBoundingClientRect();
      const x = rect.right + 12;
      const y = rect.top + window.scrollY;

      showTooltip('<p>Cargando info...</p>', x, y);
      
      if (counterpickCache[heroId]) {
        showTooltip(formatCounterpickData(heroName, counterpickCache[heroId]), x, y);
        return;
      }

      try {
        const response = await fetch(`/counterpicks/${heroId}`);
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Error al consultar counterpicks');
        }

        counterpickCache[heroId] = json;
        showTooltip(formatCounterpickData(heroName, json), x, y);
      } catch (error) {
        showTooltip(`<p>Error: ${error.message}</p>`, x, y);
      }
    });

    el.addEventListener('mouseleave', hideTooltip);
  });
}

function showTooltip(html, x, y) {
  tooltip.innerHTML = html;
  tooltip.classList.remove('hidden');
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;

  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth - 10) {
    tooltip.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight + window.scrollY - 10) {
    tooltip.style.top = `${window.innerHeight + window.scrollY - rect.height - 10}px`;
  }
}

function hideTooltip() {
  tooltip.classList.add('hidden');
}

function formatCounterpickData(heroName, data) {
  const counters = (data.bestCounters || []).slice(0, 5).sort((a, b) => b.winrate - a.winrate);
  const picks = (data.bestPicks || []).slice(0, 5);

  return `
    <div>
      <strong>${heroName}</strong>
      <p style="margin: 0.4rem 0 0.6rem; font-size: 0.95rem; color: #cbd5e1;">Counterpicks reales desde OpenDota</p>
      <div><strong>Counter Pick</strong></div>
      <ul>${counters.map(item => `<li>${item.heroName} — ${item.winrate}%</li>`).join('')}</ul>
      <div><strong>Best Pick</strong></div>
      <ul>${picks.map(item => `<li>${item.heroName} — ${item.winrate}%</li>`).join('')}</ul>
    </div>
  `;
}

