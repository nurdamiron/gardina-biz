import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { measurementsAPI } from '../services/api';
import { formatTime24, formatDate } from '../utils/dateUtils';
import Icon from '../components/common/Icon';
import { useI18n } from '../contexts/I18nContext';

const ProposalView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, lang } = useI18n();
    const [measurement, setMeasurement] = useState(null);
    const [loading, setLoading] = useState(true);

    const fmt = (n) => (n || 0).toLocaleString(lang === 'kz' ? 'kk-KZ' : 'ru-RU');

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

    if (loading) return <div className="p-10 text-center">{t('proposals.loading')}</div>;
    if (!measurement) return <div className="p-10 text-center text-red-500">{t('proposals.notFound')}</div>;

    const totalCost = measurement.windows.reduce((sum, w) => sum + (w.priceBreakdown?.clientCheck?.total || 0), 0) + (measurement.deliveryCost || 0);

    return (
        <div className="min-h-screen bg-card text-foreground font-sans p-4 sm:p-8 print:p-0 max-w-4xl mx-auto">
            <div className="flex justify-between items-center gap-2 mb-6 print:hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-background-light rounded-lg transition-colors"
                >
                    <Icon name="arrow_back" size={18} />
                    {t('common.back')}
                </button>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-content font-semibold rounded-xl shadow-card hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    <Icon name="print" size={18} />
                    {t('proposals.print.button')}
                </button>
            </div>

            <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start border-b-2 border-primary pb-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-primary uppercase tracking-wide">Gardina</h1>
                    <p className="text-sm text-muted-foreground mt-1">{t('proposals.print.salonTagline')}</p>
                    <div className="mt-4 text-sm text-muted-foreground space-y-1.5">
                        <p className="flex items-center gap-2"><Icon name="location_on" size={15} className="text-muted-foreground" />{t('proposals.print.addressLine')}</p>
                        <p className="flex items-center gap-2"><Icon name="call" size={15} className="text-muted-foreground" />{t('proposals.print.phoneLine')}</p>
                        <p className="flex items-center gap-2"><Icon name="photo_camera" size={15} className="text-muted-foreground" />{t('proposals.print.instagramLine')}</p>
                    </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                    <h2 className="text-2xl sm:text-4xl font-black text-foreground mb-2">{t('proposals.print.estimate')}</h2>
                    <p className="text-lg text-muted-foreground">#{measurement.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('proposals.print.dateLabel')}: {formatDate(new Date(), lang)}</p>
                </div>
            </header>

            <section className="mb-10 flex gap-12">
                <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{t('proposals.print.customerLabel')}</p>
                    <h3 className="text-xl font-bold">{measurement.clientName}</h3>
                    <p className="text-muted-foreground">{measurement.address}</p>
                    <p className="text-muted-foreground">{measurement.clientPhone}</p>
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{t('proposals.print.designerLabel')}</p>
                    <h3 className="text-xl font-bold">{measurement.designerName || 'Gardina'}</h3>
                </div>
            </section>

            <section className="mb-10">
                <h3 className="text-lg font-bold border-b border-border pb-2 mb-4 uppercase">{t('proposals.print.roomsHeading')}</h3>

                {measurement.windows.map((window, index) => (
                    <div key={window.id} className="mb-8 break-inside-avoid">
                        <div className="flex items-center justify-between bg-muted p-3 rounded-lg mb-3 border-l-4 border-primary">
                            <h4 className="font-bold text-lg text-foreground">
                                {index + 1}. {window.roomName}{' '}
                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                    {t('proposals.print.windowSuffix', { n: window.windowNumber })}
                                </span>
                            </h4>
                            <span className="font-bold text-foreground">{fmt(window.priceBreakdown?.clientCheck?.total)} ₸</span>
                        </div>

                        {window.designPhotos && window.designPhotos.length > 0 && (
                            <div className="flex gap-4 mb-4 overflow-hidden h-32">
                                {window.designPhotos.slice(0, 3).map((p, i) => (
                                    <img key={i} src={p.url} alt="Design" className="h-full w-auto rounded-md object-cover" />
                                ))}
                            </div>
                        )}

                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-xs text-left">
                                    <th className="py-2 pl-2">{t('proposals.print.tableName')}</th>
                                    <th className="py-2 text-right">{t('proposals.print.tableQty')}</th>
                                    <th className="py-2 text-right">{t('proposals.print.tablePrice')}</th>
                                    <th className="py-2 text-right pr-2">{t('proposals.print.tableSum')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {window.priceBreakdown?.clientCheck?.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-border last:border-0">
                                        <td className="py-2 pl-2 text-foreground">{item.name}</td>
                                        <td className="py-2 text-right text-muted-foreground">{item.qty} {item.unit}</td>
                                        <td className="py-2 text-right text-muted-foreground">{fmt(item.price)}</td>
                                        <td className="py-2 text-right pr-2 font-medium">{fmt(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </section>

            <section className="flex justify-end break-inside-avoid">
                <div className="w-64 bg-muted p-6 rounded-xl border border-border">
                    <div className="flex justify-between mb-2 text-sm">
                        <span className="text-muted-foreground">{t('proposals.print.materialsServices')}:</span>
                        <span className="font-bold">{fmt(totalCost - (measurement.deliveryCost || 0))} ₸</span>
                    </div>
                    {measurement.deliveryCost > 0 && (
                        <div className="flex justify-between mb-2 text-sm border-b border-border pb-2">
                            <span className="text-muted-foreground">{t('proposals.print.delivery')}:</span>
                            <span className="font-bold">{fmt(measurement.deliveryCost)} ₸</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-black text-primary mt-2">
                        <span>{t('proposals.print.grandTotal')}:</span>
                        <span>{fmt(totalCost)} ₸</span>
                    </div>
                </div>
            </section>

            <footer className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                <p>{t('proposals.print.footerTagline')}</p>
                <p className="mt-1">{t('proposals.print.footerThanks')}</p>
            </footer>
        </div>
    );
};

export default ProposalView;
