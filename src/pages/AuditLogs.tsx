import { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronRight, User, Clock, Filter } from 'lucide-react';
import Card, { CardHeader } from '../components/common/Card';
import Button from '../components/common/Button';
import { Select } from '../components/common/Input';
import { auditService } from '../services/supabaseService';
import type { AuditLog, AuditLogFilter } from '../types';

const TABLE_OPTIONS = [
  { value: '', label: 'Tüm Tablolar' },
  { value: 'suppliers', label: 'Tedarikçiler' },
  { value: 'materials', label: 'Malzemeler' },
  { value: 'lots', label: 'Partiler' },
  { value: 'inspections', label: 'Muayeneler' },
  { value: 'switching_states', label: 'Seviye Geçişleri' },
  { value: 'settings', label: 'Ayarlar' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Tüm İşlemler' },
  { value: 'create', label: 'Oluşturma' },
  { value: 'update', label: 'Güncelleme' },
  { value: 'delete', label: 'Silme' },
];

const TABLE_LABELS: Record<string, string> = {
  suppliers: 'Tedarikçi',
  materials: 'Malzeme',
  lots: 'Parti',
  inspections: 'Muayene',
  switching_states: 'Seviye Geçişi',
  settings: 'Ayar',
};

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const labels: Record<string, string> = {
    create: 'Oluşturma',
    update: 'Güncelleme',
    delete: 'Silme',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[action] || ''}`}>
      {labels[action] || action}
    </span>
  );
}

function AuditLogItem({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <ActionBadge action={log.action} />
          <span className="font-medium text-gray-900 dark:text-white">
            {TABLE_LABELS[log.tableName] || log.tableName}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="hidden sm:inline">{log.userEmail || 'Sistem'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="hidden sm:inline">{formatDate(log.createdAt)}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="mt-4 space-y-4">
            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Kullanıcı:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{log.userEmail || 'Sistem'}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Tarih:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatDate(log.createdAt)}</span>
              </div>
            </div>

            {/* Changed Fields */}
            {log.changedFields && log.changedFields.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Değişen Alanlar:
                </p>
                <div className="flex flex-wrap gap-2">
                  {log.changedFields.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Old vs New Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {log.oldValues && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Önceki Değerler:
                  </p>
                  <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-lg overflow-auto max-h-48 border border-red-200 dark:border-red-800">
                    {JSON.stringify(log.oldValues, null, 2)}
                  </pre>
                </div>
              )}
              {log.newValues && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yeni Değerler:
                  </p>
                  <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg overflow-auto max-h-48 border border-emerald-200 dark:border-emerald-800">
                    {JSON.stringify(log.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Record ID */}
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-slate-700">
              Kayıt ID: <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded">{log.recordId}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilter>({});
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadLogs();
  }, [filters, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.query(filters, pageSize, page * pageSize);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Denetim Kayıtları"
          subtitle="Sistem üzerindeki tüm değişikliklerin geçmişi"
          action={
            <div className="flex items-center gap-2 text-blue-500">
              <History className="w-5 h-5" />
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="w-48">
            <Select
              label="Tablo"
              value={filters.tableName || ''}
              onChange={(e) => handleFilterChange('tableName', e.target.value)}
              options={TABLE_OPTIONS}
            />
          </div>
          <div className="w-48">
            <Select
              label="İşlem Tipi"
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              options={ACTION_OPTIONS}
            />
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={clearFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Temizle
            </Button>
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Yükleniyor...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Kayıt bulunamadı</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Henüz hiç değişiklik kaydı yok veya filtrelere uygun kayıt bulunamadı
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <Button
              variant="secondary"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              Önceki
            </Button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Sayfa {page + 1}
            </span>
            <Button
              variant="secondary"
              disabled={logs.length < pageSize}
              onClick={() => setPage(p => p + 1)}
            >
              Sonraki
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
