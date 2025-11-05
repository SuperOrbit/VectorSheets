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
}

const Chart: React.FC<ChartProps> = ({ chartType, labels, datasets, title, onSave }) => {
  const chartRef = useRef<ChartJS>(null);

  const data = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      backgroundColor: chartType === 'pie' ? ['#4299E1', '#48BB78', '#F56565', '#ED8936', '#ECC94B', '#9F7AEA'] : '#4299E1',
      borderColor: '#ffffff',
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
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
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {chartType === 'bar' && <Bar ref={chartRef} options={options} data={data} />}
      {chartType === 'line' && <Line ref={chartRef} options={options} data={data} />}
      {chartType === 'pie' && <Pie ref={chartRef} options={options} data={data} />}
      <button
        onClick={handleSave}
        className="mt-4 w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        Save Chart
      </button>
    </div>
  );
};

export default Chart;
