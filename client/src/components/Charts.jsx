// Chart.js charts used on the admin panel.
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.font.family = "'Inter', sans-serif";

const DONUT_COLORS = ['#d4a843', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#64748b', '#ec4899'];

/** Doughnut chart from { labels, data }. `colors` can map a label to a fixed color. */
export function DonutChart({ chart, empty = 'No data yet.', colors = {} }) {
    if (!chart || chart.data.length === 0) return <p className="chart_empty">{empty}</p>;
    return (
        <div className="chart_canvas">
            <Doughnut
                data={{
                    labels: chart.labels,
                    datasets: [
                        {
                            data: chart.data,
                            backgroundColor: chart.labels.map((label, i) => colors[label] || DONUT_COLORS[i % DONUT_COLORS.length]),
                            borderWidth: 0,
                            hoverOffset: 4,
                        },
                    ],
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'right', labels: { color: '#e2e8f0', usePointStyle: true, boxWidth: 8 } },
                    },
                }}
            />
        </div>
    );
}
