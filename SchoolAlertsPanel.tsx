import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, Shield, CheckCircle, XCircle, 
  Filter, RefreshCw, Eye, MessageSquare, TrendingUp,
  Calendar, User, Hash
} from 'lucide-react';
import './SchoolAlertsPanel.css';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  messageHash: string;
  riskScore: number;
  riskLevel: RiskLevel;
  categories: {
    category: string;
    score: number;
    keywords: string[];
  }[];
  userHash: string;
  createdAt: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface DashboardStats {
  today: {
    total: number;
    high: number;
    critical: number;
    blocked: number;
  };
  thisWeek: {
    total: number;
    byDay: { date: string; count: number }[];
  };
  byCategory: Record<string, number>;
  trend: 'up' | 'down' | 'stable';
  pendingReview: number;
}

interface SchoolAlertsPanelProps {
  schoolId: string;
  apiUrl?: string;
  refreshInterval?: number;
}

const categoryLabels: Record<string, string> = {
  offensive_language: 'Linguaggio offensivo',
  bullying: 'Bullismo',
  threats: 'Minacce',
  self_harm: 'Autolesionismo',
  grooming: 'Adescamento',
  hate_speech: 'Linguaggio di odio',
  normal: 'Normale',
};

const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Basso', color: '#22c55e', bgColor: '#dcfce7' },
  medium: { label: 'Medio', color: '#f59e0b', bgColor: '#fef3c7' },
  high: { label: 'Alto', color: '#ef4444', bgColor: '#fee2e2' },
  critical: { label: 'Critico', color: '#dc2626', bgColor: '#fecaca' },
};

export const SchoolAlertsPanel: React.FC<SchoolAlertsPanelProps> = ({
  schoolId,
  apiUrl = 'http://localhost:3000',
  refreshInterval = 30000,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterRiskLevel, setFilterRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [filterReviewed, setFilterReviewed] = useState<boolean | 'all'>('all');
  const [reviewNotes, setReviewNotes] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('schoolId', schoolId);
      if (filterRiskLevel !== 'all') params.append('riskLevel', filterRiskLevel);
      if (filterReviewed !== 'all') params.append('reviewed', String(filterReviewed));
      params.append('page', String(page));
      params.append('limit', '20');

      const response = await fetch(`${apiUrl}/api/v1/school-panel/alerts?${params}`);
      if (!response.ok) throw new Error('Errore fetch alerts');

      const data = await response.json();
      setAlerts(data.alerts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Errore fetch alerts:', error);
    }
  }, [apiUrl, schoolId, filterRiskLevel, filterReviewed, page]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/school-panel/dashboard/${schoolId}`);
      if (!response.ok) throw new Error('Errore fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Errore fetch stats:', error);
    }
  }, [apiUrl, schoolId]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAlerts, fetchStats]);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchAlerts, fetchStats, refreshInterval]);

  // Review alert
  const handleReview = async (alertId: string) => {
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/school-panel/alerts/${alertId}/review?schoolId=${schoolId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewedBy: 'current-user-id',
            notes: reviewNotes,
          }),
        }
      );

      if (!response.ok) throw new Error('Errore review');

      // Update local state
      setAlerts(prev =>
        prev.map(a =>
          a.id === alertId
            ? { ...a, reviewed: true, reviewedBy: 'current-user', reviewNotes }
            : a
        )
      );

      setSelectedAlert(null);
      setReviewNotes('');
      fetchStats();
    } catch (error) {
      console.error('Errore review:', error);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="school-panel-loading">
        <RefreshCw size={32} className="spin" />
        <p>Caricamento dati...</p>
      </div>
    );
  }

  return (
    <div className="school-alerts-panel">
      {/* Header */}
      <header className="panel-header">
        <div className="panel-title">
          <Shield size={28} />
          <div>
            <h1>Pannello Sicurezza</h1>
            <p>Monitoraggio messaggi studenti</p>
          </div>
        </div>
        <button className="refresh-btn" onClick={() => { fetchAlerts(); fetchStats(); }}>
          <RefreshCw size={18} />
          Aggiorna
        </button>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card today-total">
            <div className="stat-icon">
              <MessageSquare size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.today.total}</span>
              <span className="stat-label">Messaggi oggi</span>
            </div>
          </div>

          <div className="stat-card today-high">
            <div className="stat-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.today.high}</span>
              <span className="stat-label">Rischio alto</span>
            </div>
          </div>

          <div className="stat-card today-critical">
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.today.critical}</span>
              <span className="stat-label">Critici</span>
            </div>
          </div>

          <div className="stat-card today-blocked">
            <div className="stat-icon">
              <Shield size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.today.blocked}</span>
              <span className="stat-label">Bloccati</span>
            </div>
          </div>

          <div className="stat-card pending">
            <div className="stat-icon">
              <Eye size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.pendingReview}</span>
              <span className="stat-label">Da rivedere</span>
            </div>
          </div>

          <div className={`stat-card trend ${stats.trend}`}>
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {stats.trend === 'up' ? '↗' : stats.trend === 'down' ? '↘' : '→'}
              </span>
              <span className="stat-label">
                Trend {stats.trend === 'up' ? 'crescente' : stats.trend === 'down' ? 'decrescente' : 'stabile'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value as RiskLevel | 'all')}
          >
            <option value="all">Tutti i livelli</option>
            <option value="low">Basso</option>
            <option value="medium">Medio</option>
            <option value="high">Alto</option>
            <option value="critical">Critico</option>
          </select>
        </div>

        <div className="filter-group">
          <CheckCircle size={16} />
          <select
            value={String(filterReviewed)}
            onChange={(e) => setFilterReviewed(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
          >
            <option value="all">Tutti gli stati</option>
            <option value="false">Da rivedere</option>
            <option value="true">Rivisti</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Rischio</th>
              <th>Categorie</th>
              <th>Utente</th>
              <th>Data</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr
                key={alert.id}
                className={`alert-row ${alert.riskLevel} ${alert.reviewed ? 'reviewed' : ''}`}
              >
                <td>
                  <span
                    className="risk-badge"
                    style={{
                      backgroundColor: riskLevelConfig[alert.riskLevel].bgColor,
                      color: riskLevelConfig[alert.riskLevel].color,
                    }}
                  >
                    {alert.riskScore}
                    <small>{riskLevelConfig[alert.riskLevel].label}</small>
                  </span>
                </td>
                <td>
                  <div className="categories-list">
                    {alert.categories
                      .filter(c => c.category !== 'normal')
                      .slice(0, 2)
                      .map((cat, idx) => (
                        <span key={idx} className="category-tag">
                          {categoryLabels[cat.category] || cat.category}
                        </span>
                      ))}
                    {alert.categories.filter(c => c.category !== 'normal').length > 2 && (
                      <span className="category-more">
                        +{alert.categories.filter(c => c.category !== 'normal').length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <code className="user-hash">{alert.userHash?.slice(0, 8)}...</code>
                </td>
                <td>{formatDate(alert.createdAt)}</td>
                <td>
                  {alert.reviewed ? (
                    <span className="status-badge reviewed">
                      <CheckCircle size={14} />
                      Rivisto
                    </span>
                  ) : (
                    <span className="status-badge pending">
                      <Eye size={14} />
                      Da rivedere
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <Eye size={16} />
                    Dettagli
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {alerts.length === 0 && (
          <div className="no-alerts">
            <CheckCircle size={48} />
            <p>Nessun alert trovato</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Precedente
          </button>
          <span>Pagina {page} di {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Successiva →
          </button>
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="alert-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <header className="alert-modal-header" style={{ backgroundColor: riskLevelConfig[selectedAlert.riskLevel].bgColor }}>
              <AlertTriangle size={24} style={{ color: riskLevelConfig[selectedAlert.riskLevel].color }} />
              <h2>Dettaglio Alert</h2>
              <button className="close-btn" onClick={() => setSelectedAlert(null)}>
                <XCircle size={20} />
              </button>
            </header>

            <div className="alert-modal-body">
              <div className="alert-info-grid">
                <div className="info-item">
                  <Hash size={16} />
                  <span>ID: <code>{selectedAlert.id}</code></span>
                </div>
                <div className="info-item">
                  <User size={16} />
                  <span>Utente: <code>{selectedAlert.userHash}</code></span>
                </div>
                <div className="info-item">
                  <Calendar size={16} />
                  <span>Data: {formatDate(selectedAlert.createdAt)}</span>
                </div>
              </div>

              <div className="risk-section">
                <h3>Livello di Rischio</h3>
                <div
                  className="risk-score-large"
                  style={{ color: riskLevelConfig[selectedAlert.riskLevel].color }}
                >
                  {selectedAlert.riskScore}
                  <span>/100</span>
                </div>
                <p className="risk-level-name">
                  {riskLevelConfig[selectedAlert.riskLevel].label}
                </p>
              </div>

              <div className="categories-section">
                <h3>Categorie Rilevate</h3>
                <ul>
                  {selectedAlert.categories
                    .filter(c => c.category !== 'normal')
                    .map((cat, idx) => (
                      <li key={idx}>
                        <span className="cat-name">
                          {categoryLabels[cat.category] || cat.category}
                        </span>
                        <span className="cat-score">{Math.round(cat.score * 100)}%</span>
                        {cat.keywords.length > 0 && (
                          <span className="cat-keywords">
                            Keywords: {cat.keywords.join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>

              {!selectedAlert.reviewed && (
                <div className="review-section">
                  <h3>Revisione</h3>
                  <textarea
                    placeholder="Note sulla revisione..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                  <button
                    className="review-btn"
                    onClick={() => handleReview(selectedAlert.id)}
                  >
                    <CheckCircle size={18} />
                    Segna come rivisto
                  </button>
                </div>
              )}

              {selectedAlert.reviewed && (
                <div className="reviewed-info">
                  <CheckCircle size={18} />
                  <p>
                    Rivisto da <strong>{selectedAlert.reviewedBy}</strong>
                    {selectedAlert.reviewNotes && (
                      <>
                        <br />
                        <em>Note: {selectedAlert.reviewNotes}</em>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAlertsPanel;
