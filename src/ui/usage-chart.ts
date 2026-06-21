import { Chart, registerables } from 'chart.js';
import { getAIUsageStats } from "../services/ai";

Chart.register(...registerables);

let apiRequestsChart: Chart | null = null;
let tokensChart: Chart | null = null;

export const renderUsageCharts = (stats: ReturnType<typeof getAIUsageStats>, selectedProvider: string = 'all') => {
    const labels: string[] = [];
    const apiCallsData: number[] = [];
    const cacheHitData: number[] = [];
    const cacheMissData: number[] = [];
    const outputData: number[] = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        labels.push(dateString.slice(5)); // "MM-DD"
        
        let dayStat;
        if (selectedProvider === 'all') {
            dayStat = stats.daily[dateString] || { apiCalls: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0 };
        } else {
            dayStat = stats.daily[dateString]?.providers?.[selectedProvider] || { apiCalls: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0 };
        }
        
        apiCallsData.push(dayStat.apiCalls);
        cacheHitData.push(dayStat.cacheHitTokens);
        cacheMissData.push(dayStat.cacheMissTokens);
        outputData.push(dayStat.completionTokens);
    }

    const ctxApi = document.getElementById("api-requests-chart") as HTMLCanvasElement;
    const ctxTokens = document.getElementById("tokens-chart") as HTMLCanvasElement;

    if (apiRequestsChart) apiRequestsChart.destroy();
    if (tokensChart) tokensChart.destroy();

    if (ctxApi) {
        apiRequestsChart = new Chart(ctxApi, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'API requests',
                    data: apiCallsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false }, ticks: { color: '#666', font: { size: 10 }, precision: 0 } },
                    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#666', font: { size: 10 }, maxTicksLimit: 7 } }
                }
            }
        });
    }

    if (ctxTokens) {
        tokensChart = new Chart(ctxTokens, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Input (Cache hit)', data: cacheHitData, backgroundColor: '#93c5fd', stack: 'Stack 0', barPercentage: 0.6 },
                    { label: 'Input (Cache miss)', data: cacheMissData, backgroundColor: '#3b82f6', stack: 'Stack 0', barPercentage: 0.6 },
                    { label: 'Output', data: outputData, backgroundColor: '#1d4ed8', stack: 'Stack 0', barPercentage: 0.6 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.raw} tokens`
                        }
                    }
                },
                scales: {
                    y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false }, ticks: { color: '#666', font: { size: 10 }, precision: 0 } },
                    x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#666', font: { size: 10 }, maxTicksLimit: 7 } }
                }
            }
        });
    }
};
