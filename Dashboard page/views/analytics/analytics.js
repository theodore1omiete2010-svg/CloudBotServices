import { showToast, escapeHTML } from "../../js/components/modals.js";

let chartInstance = null;

export function init() {
  bindEvents();
  renderChart();
}

function bindEvents() {
  document.getElementById('analyticsPeriodBtn')?.addEventListener('click', () => {
    showToast('Period selector will open.');
  });

  document.getElementById('analyticsExportBtn')?.addEventListener('click', () => {
    showToast('Exporting analytics data...');
  });

  window.addEventListener('cbs:theme-changed', () => {
    renderChart();
  });
}

function renderChart() {
  const canvas = document.getElementById('analyticsChart');
  if (!canvas) return;

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-soft);font-size:14px;">⚠️ Chart library unavailable.</div>`;
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#e5e9f0' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const lineColor = '#4a7cf7';
  const fillColor = isDark ? 'rgba(74, 124, 247, 0.15)' : 'rgba(74, 124, 247, 0.10)';

  try {
    chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Revenue',
          data: [92000, 108000, 126000, 159000],
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              color: textColor,
              font: { size: 10, weight: '500' }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return '₦' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              font: { size: 9 },
              color: textColor,
              callback: function(value) {
                return '₦' + (value / 1000) + 'K';
              }
            },
            grid: { color: gridColor },
            border: { color: gridColor }
          },
          x: {
            ticks: {
              font: { size: 9 },
              color: textColor
            },
            grid: { color: gridColor },
            border: { color: gridColor }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });
  } catch (err) {
    console.warn('Chart error:', err);
  }
}