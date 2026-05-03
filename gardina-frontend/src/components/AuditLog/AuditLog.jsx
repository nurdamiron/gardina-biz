import React, { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';
// Функция для форматирования времени в UTC+5
const formatInAlmatyTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    timeZone: 'Asia/Almaty',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Функция для генерации читаемого сообщения
const generateLogMessage = (log) => {
    const userName = log.user_name || 'Система';
    const entity = log.entity_type?.toLowerCase() || 'запись';
    const entityName = log.entity_name ? `"${log.entity_name}"` : '';

    switch (log.action_type) {
        case 'DEAL_CREATED':
            return `Пользователь ${userName} создал сделку ${entityName}.`;
        case 'ORDER_STATUS_UPDATED': {
            const oldStatus = log.changes?.old?.status || 'N/A';
            const newStatus = log.changes?.new?.status || 'N/A';
            return `Пользователь ${userName} изменил статус заказа ${entityName} с "${oldStatus}" на "${newStatus}".`;
        }
        default:
            return `Действие "${log.action_type}" выполнено пользователем ${userName}.`;
    }
};


const AuditLog = ({ entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!entityType || !entityId) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await auditAPI.getLogs(entityType, entityId);
        setLogs(response.data);
      } catch (err) {
        setError('Не удалось загрузить историю изменений.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [entityType, entityId]);

  if (loading) return <div>Загрузка истории...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (logs.length === 0) return <div>История изменений пуста.</div>;

  return (
    <div className="audit-log-container" style={{ fontFamily: 'sans-serif' }}>
      <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px' }}>История изменений</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {logs.map((log) => (
          <li key={log.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
            <p style={{ margin: '0 0 4px 0' }}>{generateLogMessage(log)}</p>
            <small style={{ color: '#666' }}>
              {formatInAlmatyTime(log.created_at)}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditLog;
