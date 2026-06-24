import { Chart, registerables } from 'chart.js';
import { getAIUsageStats } from "../services/ai";

Chart.register(...registerables);

let apiRequestsChart: Chart | null = null;
let tokensChart: Chart | null = null;

export const renderUsageCharts = (stats: ReturnType<typeof getAIUsageStats>, selectedProvider: string = 'all') => {
    const labels: string[] = [];
    const fullDates: string[] = [];
    const apiCallsData: number[] = [];
    const cacheHitData: number[] = [];
    const cacheMissData: number[] = [];
    const outputData: number[] = [];

    const isAll = selectedProvider === 'all';

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        const dateString = localD.toISOString().split('T')[0];
        labels.push(dateString.slice(5)); // "MM-DD"
        
        const parts = dateString.split('-');
        fullDates.push(`${parts[2]}/${parts[1]}/${parts[0]}`); // DD/MM/YYYY
        
        let dayStat;
        if (isAll) {
            dayStat = stats.daily[dateString] || { apiCalls: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0 };
            
            let sumProviders = 0;
            if (stats.daily[dateString]?.providers) {
                for (const p of Object.values(stats.daily[dateString].providers)) {
                    sumProviders += (p.apiCalls || 0);
                }
            }
            if (stats.daily[dateString]?.providers && Object.keys(stats.daily[dateString].providers).length > 0) {
                dayStat = { ...dayStat, apiCalls: sumProviders };
            }
        } else {
            dayStat = stats.daily[dateString]?.providers?.[selectedProvider] || { apiCalls: 0, cacheHitTokens: 0, cacheMissTokens: 0, completionTokens: 0 };
        }
        
        apiCallsData.push(dayStat.apiCalls);
        cacheHitData.push(dayStat.cacheHitTokens);
        cacheMissData.push(dayStat.cacheMissTokens);
        outputData.push(dayStat.completionTokens);
    }

    const apiDatasets: any[] = [];

    if (isAll) {
        const providers = ['openai', 'gemini', 'deepseek', 'kira'];
        const providerColors: Record<string, string> = { openai: '#93c5fd', gemini: '#60a5fa', deepseek: '#3b82f6', kira: '#2563eb' };
        const providerNames: Record<string, string> = { openai: 'OpenAI', gemini: 'Gemini', deepseek: 'DeepSeek', kira: 'Kira AI' };

        for (let p = 0; p < providers.length; p++) {
            const pName = providers[p];
            const pData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const localD = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
                const dateString = localD.toISOString().split('T')[0];
                const val = stats.daily[dateString]?.providers?.[pName]?.apiCalls || 0;
                pData.push(val);
            }
            if (pData.some(val => val > 0)) {
                apiDatasets.push({
                    label: providerNames[pName as keyof typeof providerNames] || pName,
                    data: pData,
                    backgroundColor: providerColors[pName] || '#94a3b8',
                    stack: 'Stack 0',
                    barPercentage: 0.6
                });
            }
        }
    } else {
        apiDatasets.push({
            label: 'API requests',
            data: apiCallsData,
            backgroundColor: '#3b82f6',
            barPercentage: 0.6
        });
    }

    const getOrCreateTooltip = (chart: any) => {
        let tooltipEl = chart.canvas.parentNode.querySelector('div.custom-chartjs-tooltip');
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.className = 'custom-chartjs-tooltip';
            
            const style = document.createElement('style');
            style.innerHTML = `
                .custom-chartjs-tooltip {
                    background: rgba(24, 24, 27, 0.95);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: white;
                    padding: 12px 14px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: 12px;
                    pointer-events: none;
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    opacity: 0;
                    transform: translateX(-50%);
                    transition: left 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.2s ease;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    min-width: max-content;
                    white-space: nowrap;
                    will-change: left, opacity;
                }
                .custom-chartjs-tooltip::before {
                    content: "";
                    position: absolute;
                    top: -7px;
                    left: var(--caret-x, 50%);
                    transform: translateX(-50%);
                    border-left: 7px solid transparent;
                    border-right: 7px solid transparent;
                    border-bottom: 7px solid rgba(255, 255, 255, 0.1);
                    transition: left 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                }
                .custom-chartjs-tooltip::after {
                    content: "";
                    position: absolute;
                    top: -6px;
                    left: var(--caret-x, 50%);
                    transform: translateX(-50%);
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-bottom: 6px solid rgba(24, 24, 27, 0.95);
                    transition: left 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.2);
                }
                .custom-chartjs-tooltip-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    color: #e4e4e7;
                    font-size: 12px;
                    font-weight: 600;
                }
                .custom-chartjs-tooltip-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                }
                .custom-chartjs-tooltip-row:last-child {
                    margin-bottom: 0;
                }
                .custom-chartjs-tooltip-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #d4d4d8;
                    font-size: 11px;
                }
                .custom-chartjs-tooltip-color {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    flex-shrink: 0;
                }
                .custom-chartjs-tooltip-value {
                    font-weight: 500;
                    color: #d4d4d8;
                    margin-left: 12px;
                    font-size: 11px;
                }
            `;
            document.head.appendChild(style);
            chart.canvas.parentNode.appendChild(tooltipEl);
        }
        return tooltipEl;
    };

    const externalTooltipHandler = (context: any, isTokens: boolean, isAllMode: boolean) => {
        const {chart, tooltip} = context;
        const tooltipEl = getOrCreateTooltip(chart);

        if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = '0';
            return;
        }

        if (tooltip.body) {
            const dataPoints = tooltip.dataPoints;
            if (!dataPoints || dataPoints.length === 0) {
                tooltipEl.style.opacity = '0';
                return;
            }
            
            const idx = dataPoints[0].dataIndex;
            const dateStr = fullDates[idx];
            
            let total = 0;
            dataPoints.forEach((dp: any) => total += dp.raw);
            const formattedTotal = new Intl.NumberFormat('en-US').format(total);
            const totalSuffix = isTokens ? 'tokens' : 'requests';

            const showRows = isAllMode || isTokens;

            let innerHtml = `
                <div class="custom-chartjs-tooltip-header" style="${showRows ? '' : 'margin-bottom: 0;'}">
                    <span>${dateStr}</span>
                    <span>${formattedTotal} ${totalSuffix}</span>
                </div>
            `;

            if (showRows) {
                dataPoints.forEach((dp: any) => {
                    const val = new Intl.NumberFormat('en-US').format(dp.raw);
                    const dataset = chart.data.datasets[dp.datasetIndex];
                    const bgColor = dataset.tooltipColor || dataset.backgroundColor;
                    
                    const showColor = (isAllMode || isTokens);
                    const colorBox = showColor ? `<div class="custom-chartjs-tooltip-color" style="background: ${bgColor}; border: 1px solid rgba(255,255,255,0.1);"></div>` : '';
                    
                    innerHtml += `
                        <div class="custom-chartjs-tooltip-row">
                            <div class="custom-chartjs-tooltip-label">
                                ${colorBox}
                                <span>${dataset.label}</span>
                            </div>
                            <div class="custom-chartjs-tooltip-value">${val} ${totalSuffix}</div>
                        </div>
                    `;
                });
            }

            tooltipEl.innerHTML = innerHtml;
        }

        const {offsetLeft: positionX} = chart.canvas;
        
        const desiredLeft = positionX + tooltip.caretX;
        let clampedLeft = desiredLeft;
        
        // Keep within bounds
        const tooltipWidth = tooltipEl.offsetWidth || 210;
        if (clampedLeft - tooltipWidth / 2 < 0) clampedLeft = tooltipWidth / 2;
        if (clampedLeft + tooltipWidth / 2 > chart.width) clampedLeft = chart.width - tooltipWidth / 2;

        const caretOffset = desiredLeft - clampedLeft;

        tooltipEl.style.opacity = '1';
        tooltipEl.style.left = clampedLeft + 'px';
        tooltipEl.style.setProperty('--caret-x', `calc(50% + ${caretOffset}px)`);
        tooltipEl.style.pointerEvents = 'none';
    };

    const ctxApi = document.getElementById("api-requests-chart") as HTMLCanvasElement;
    const ctxTokens = document.getElementById("tokens-chart") as HTMLCanvasElement;

    if (apiRequestsChart) apiRequestsChart.destroy();
    if (tokensChart) tokensChart.destroy();

    if (ctxApi) {
        apiRequestsChart = new Chart(ctxApi, {
            type: 'bar',
            data: {
                labels,
                datasets: apiDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        enabled: !isAll,
                        mode: 'index',
                        intersect: false,
                        displayColors: false,
                        filter: (item) => (item.raw as number) > 0,
                        external: isAll ? (context) => externalTooltipHandler(context, false, isAll) : undefined,
                        callbacks: !isAll ? {
                            title: (tooltipItems: any) => {
                                if (!tooltipItems || !tooltipItems.length) return '';
                                return fullDates[tooltipItems[0].dataIndex];
                            },
                            label: (context: any) => {
                                const val = new Intl.NumberFormat('en-US').format(context.raw as number);
                                return `${val} requests`;
                            }
                        } : {}
                    }
                },
                scales: {
                    y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false }, ticks: { color: '#666', font: { size: 10 }, precision: 0 } },
                    x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { color: '#666', font: { size: 10 }, maxTicksLimit: 7 } }
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
                        enabled: false,
                        mode: 'index',
                        intersect: false,
                        filter: (item) => (item.raw as number) > 0,
                        external: (context) => externalTooltipHandler(context, true, isAll)
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
