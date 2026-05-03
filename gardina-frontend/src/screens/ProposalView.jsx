import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { measurementsAPI } from '../services/api';
import { formatTime24, formatDateKZ } from '../utils/dateUtils';
import Icon from '../components/common/Icon';

const ProposalView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [measurement, setMeasurement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await measurementsAPI.getById(id);
                setMeasurement(response.data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!measurement) return <div className="p-10 text-center text-red-500">Proposal not found</div>;

    const totalCost = measurement.windows.reduce((sum, w) => sum + (w.priceBreakdown?.clientCheck?.total || 0), 0) + (measurement.deliveryCost || 0);

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans p-8 print:p-0 max-w-4xl mx-auto">
            {/* Print Controls - Hidden when printing */}
            <div className="fixed top-4 right-4 print:hidden flex gap-2 z-50">
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow hover:brightness-110 flex items-center gap-2"
                >
                    <Icon name="print" />
                    Басып шығару (PDF)
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200"
                >
                    Артқа
                </button>
            </div>

            {/* HEADER */}
            <header className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-primary uppercase tracking-wide">Gardina</h1>
                    <p className="text-sm text-gray-500 mt-1">Перделер салоны</p>
                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                        <p>📍 Мекен-жайы: Төле би 123</p>
                        <p>📞 Тел: +7 (777) 123-45-67</p>
                        <p>📷 Instagram: @gardina.kz</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black text-gray-900 mb-2">СМЕТА</h2>
                    <p className="text-lg text-gray-600">#{measurement.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500 mt-1">Күні: {formatDateKZ(new Date())}</p>
                </div>
            </header>

            {/* CLIENT INFO */}
            <section className="mb-10 flex gap-12">
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Тапсырыс беруші</p>
                    <h3 className="text-xl font-bold">{measurement.clientName}</h3>
                    <p className="text-gray-600">{measurement.address}</p>
                    <p className="text-gray-600">{measurement.clientPhone}</p>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Дизайнер</p>
                    <h3 className="text-xl font-bold">{measurement.designerName || 'Gardina'}</h3>
                </div>
            </section>

            {/* ROOMS TABLE */}
            <section className="mb-10">
                <h3 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4 uppercase">Бөлмелер тізімі</h3>

                {measurement.windows.map((window, index) => (
                    <div key={window.id} className="mb-8 break-inside-avoid">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-3 border-l-4 border-primary">
                            <h4 className="font-bold text-lg text-gray-800">
                                {index + 1}. {window.roomName} <span className="text-sm font-normal text-gray-500 ml-2">(Терезе #{window.windowNumber})</span>
                            </h4>
                            <span className="font-bold text-gray-900">
                                {window.priceBreakdown?.clientCheck?.total?.toLocaleString()} ₸
                            </span>
                        </div>

                        {/* Main Image if available */}
                        {window.designPhotos && window.designPhotos.length > 0 && (
                            <div className="flex gap-4 mb-4 overflow-hidden h-32">
                                {window.designPhotos.slice(0, 3).map((p, i) => (
                                    <img key={i} src={p.url} alt="Design" className="h-full w-auto rounded-md object-cover" />
                                ))}
                            </div>
                        )}

                        {/* Items Table */}
                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500 text-xs text-left">
                                    <th className="py-2 pl-2">Атауы</th>
                                    <th className="py-2 text-right">Мөлшер</th>
                                    <th className="py-2 text-right">Баға</th>
                                    <th className="py-2 text-right pr-2">Сома</th>
                                </tr>
                            </thead>
                            <tbody>
                                {window.priceBreakdown?.clientCheck?.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                                        <td className="py-2 pl-2 text-gray-800">{item.name}</td>
                                        <td className="py-2 text-right text-gray-600">{item.qty} {item.unit}</td>
                                        <td className="py-2 text-right text-gray-600">{item.price?.toLocaleString()}</td>
                                        <td className="py-2 text-right pr-2 font-medium">{item.total?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </section>

            {/* TOTALS */}
            <section className="flex justify-end break-inside-avoid">
                <div className="w-64 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">Маталар мен қызметтер:</span>
                        <span className="font-bold">{(totalCost - (measurement.deliveryCost || 0)).toLocaleString()} ₸</span>
                    </div>
                    {measurement.deliveryCost > 0 && (
                        <div className="flex justify-between mb-2 text-sm border-b border-gray-200 pb-2">
                            <span className="text-gray-600">Жеткізу:</span>
                            <span className="font-bold">{measurement.deliveryCost.toLocaleString()} ₸</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-primary mt-2">
                        <span>ЖАЛПЫ:</span>
                        <span>{totalCost.toLocaleString()} ₸</span>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
                <p>Gardina — перделер мен жабындылар</p>
                <p className="mt-1">Рахмет, бізді таңдағаныңызға!</p>
            </footer>
        </div>
    );
};

export default ProposalView;
