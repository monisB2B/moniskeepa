import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const keepaToDate = (minutes) => new Date((minutes + 21564000) * 60000);

const extractPriceHistory = (product) => {
  const csv = product.csv || {};
  const arr = csv.NEW || csv['1'] || [];
  const result = [];
  for (let i = 0; i < arr.length; i += 2) {
    const time = keepaToDate(arr[i]);
    const price = arr[i + 1] / 100;
    result.push({ time, price });
  }
  return result;
};

function App() {
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/bestsellers');
        const data = await res.json();
        setBestsellers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const viewChart = async (asin) => {
    setModalOpen(true);
    setLoadingChart(true);
    try {
      const res = await fetch(`/api/product/${asin}`);
      const product = await res.json();
      const history = extractPriceHistory(product);
      setChartData({
        labels: history.map((h) => h.time.toLocaleDateString()),
        datasets: [
          {
            label: 'New Price ($)',
            data: history.map((h) => h.price),
            borderColor: 'rgb(34,197,94)',
            backgroundColor: 'rgba(34,197,94,0.2)'
          }
        ]
      });
    } catch (e) {
      console.error(e);
      setChartData(null);
    } finally {
      setLoadingChart(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            Amazon Renewed Smartphone Best Sellers
          </h1>
          <button
            className="border px-2 py-1 rounded"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="border-4 border-t-transparent border-green-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Rank</th>
                  <th className="p-2">ASIN</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {bestsellers.map(({ rank, asin }) => (
                  <tr
                    key={asin}
                    className="border-t border-gray-300 dark:border-gray-700"
                  >
                    <td className="p-2">{rank}</td>
                    <td className="p-2">
                      <a
                        className="text-blue-600 dark:text-blue-400 underline"
                        href={`https://www.amazon.com/dp/${asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {asin}
                      </a>
                    </td>
                    <td className="p-2">
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded"
                        onClick={() => viewChart(asin)}
                      >
                        View chart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded w-11/12 md:w-3/4 lg:w-1/2 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 dark:text-gray-400"
              onClick={() => setModalOpen(false)}
            >
              ✖
            </button>
            {loadingChart ? (
              <div className="flex justify-center items-center h-64">
                <div className="border-4 border-t-transparent border-green-500 rounded-full w-12 h-12 animate-spin"></div>
              </div>
            ) : chartData ? (
              <Line data={chartData} />
            ) : (
              <p>No data</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
