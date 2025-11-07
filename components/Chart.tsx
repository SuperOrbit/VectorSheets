import React, { useRef } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
} from 'chart.js';
import type { ChartData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

interface ChartProps extends ChartData {
  onSave?: (dataUrl: string) => void;
  isDarkMode?: boolean;
}

const Chart: React.FC<ChartProps> = ({ chartType, labels, datasets, title, onSave, isDarkMode = false }) => {
  const chartRef = useRef<ChartJS>(null);

  const colors = {
    pie: ['#4299E1', '#48BB78', '#F56565', '#ED8936', '#ECC94B', '#9F7AEA', '#38B2AC', '#805AD5', '#E53E3E', '#DD6B20'],
    bar: isDarkMode ? '#4299E1' : '#3B82F6',
    line: isDarkMode ? '#4299E1' : '#3B82F6',
  };

  const data = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: chartType === 'pie' 
        ? colors.pie 
        : colors.bar,
      borderColor: isDarkMode ? '#ffffff' : '#1e1e1e',
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: isDarkMode ? '#e5e7eb' : '#374151',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        titleColor: isDarkMode ? '#e5e7eb' : '#374151',
        bodyColor: isDarkMode ? '#e5e7eb' : '#374151',
        borderColor: isDarkMode ? '#2d2d2d' : '#e5e7eb',
        borderWidth: 1,
      },
    },
    scales: chartType !== 'pie' ? {
      x: {
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDarkMode ? '#2d2d2d' : '#e5e7eb',
        },
      },
      y: {
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDarkMode ? '#2d2d2d' : '#e5e7eb',
        },
      },
    } : undefined,
  };

  const handleSave = () => {
    if (chartRef.current) {
      const dataUrl = chartRef.current.toBase64Image();
      if (onSave) {
        onSave(dataUrl);
      }
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#2d2d2d]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button
          onClick={handleSave}
          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Save
        </button>
      </div>
      <div className="h-64 w-full">
        {chartType === 'bar' && <Bar ref={chartRef} options={options} data={data} />}
        {chartType === 'line' && <Line ref={chartRef} options={options} data={data} />}
        {chartType === 'pie' && <Pie ref={chartRef} options={options} data={data} />}
      </div>
    </div>
  );
};

export default Chart;
