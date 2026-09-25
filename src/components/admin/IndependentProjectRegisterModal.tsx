import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import { INDEPENDENT_PROJECT_PRESETS } from '../../lib/contractValidator';
import { 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  FileCode2, 
  Sparkles, 
  Layers, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Copy,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

export const IndependentProjectRegisterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRegistered,
}) => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('project-a-designer');
  const [rawContractJson, setRawContractJson] = useState<string>('');
  const [validating, setValidating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings?: string[];
  } | null>(null);

  const [price, setPrice] = useState<number>(49);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string>('c2');

  // Load preset when changed
  useEffect(() => {
    if (selectedPresetKey && INDEPENDENT_PROJECT_PRESETS[selectedPresetKey]) {
      const preset = INDEPENDENT_PROJECT_PRESETS[selectedPresetKey];
      setRawContractJson(JSON.stringify(preset, null, 2));
      setPrice(preset.template_id === 'project-a-designer' ? 69 : 49);
      setSalePrice(preset.template_id === 'project-a-designer' ? 49 : undefined);
      setCategoryId(preset.metadata.category === 'designer' ? 'c2' : 'c1');
      setValidationResult({ valid: true, errors: [], warnings: [] });
    }
  }, [selectedPresetKey]);

  if (!isOpen) return null;

  const handleValidate = async () => {
    try {
      setValidating(true);
      let parsed;
      try {
        parsed = JSON.parse(rawContractJson);
      } catch (err) {
        setValidationResult({
          valid: false,
          errors: ['Cú pháp JSON không hợp lệ. Vui lòng kiểm tra lại dấu ngoặc và dấu phẩy.'],
        });
        toast.error('JSON không hợp lệ');
        return;
      }

      const res = await api.contracts.validate(parsed);
      setValidationResult(res);
      if (res.valid) {
        toast.success('Hợp đồng Integration Contract hợp lệ 100%!');
      } else {
        toast.error(`Phát hiện ${res.errors.length} lỗi trong hợp đồng.`);
      }
    } catch (err: any) {
      toast.error('Lỗi khi kiểm tra contract: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      let parsed;
      try {
        parsed = JSON.parse(rawContractJson);
      } catch (err) {
        toast.error('JSON không hợp lệ');
        return;
      }

      const res = await api.contracts.register({
        contract: parsed,
        price,
        salePrice,
        categoryId,
      });

      toast.success(res.message || 'Đã đăng ký AI Studio Project vào Shop!');
      onRegistered();
      onClose();
    } catch (err: any) {
      toast.error(err.error || 'Đăng ký thất bại');
    } finally {
      setRegistering(false);
    }
  };

  const currentPreset = INDEPENDENT_PROJECT_PRESETS[selectedPresetKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Đăng ký Portfolio Project Độc lập từ AI Studio
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                  Integration Contract v1.0
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kết nối các dự án AI Studio riêng biệt vào Shop mà không cần nhúng mã nguồn vào Shop.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Core Rule Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-indigo-300">Quy tắc cốt lõi của hệ thống:</p>
              <p>
                Mỗi Portfolio Template là một <strong>AI Studio Project riêng biệt</strong>. Shop <strong>chỉ lưu</strong>: 
                <code className="text-indigo-200 bg-indigo-950 px-1 py-0.5 rounded ml-1">template_id</code>, 
                <code className="text-indigo-200 bg-indigo-950 px-1 py-0.5 rounded ml-1">demo_url</code>, 
                <code className="text-indigo-200 bg-indigo-950 px-1 py-0.5 rounded ml-1">origin_url</code>, 
                <code className="text-indigo-200 bg-indigo-950 px-1 py-0.5 rounded ml-1">schema</code>, 
                <code className="text-indigo-200 bg-indigo-950 px-1 py-0.5 rounded ml-1">version</code>, và 
                <code className="text-indigo-200 bg-indigo-950 px-1 py-0.5 rounded ml-1">metadata</code>.
              </p>
              <p className="text-slate-400">
                Khi khách hàng mua, hệ thống tạo Instance độc lập kèm dữ liệu riêng (vd: john.shop.com & anna.shop.com). <strong>Template Master luôn bất biến</strong>.
              </p>
            </div>
          </div>

          {/* Preset Selector */}
          <div>
            <label className="block text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Chọn Dự Án AI Studio Mẫu Hoặc Dự Án Mới:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(INDEPENDENT_PROJECT_PRESETS).map(([key, preset]) => {
                const isSelected = selectedPresetKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPresetKey(key)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold truncate text-white">{preset.metadata.name.split(':')[0]}</div>
                    <div className="text-[11px] text-indigo-400 truncate mt-0.5">{preset.metadata.name.split(':')[1] || preset.metadata.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">{preset.template_id}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Details Overview */}
          {currentPreset && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-800/80 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block mb-1">Origin URL (Deploy AI Studio):</span>
                <a
                  href={currentPreset.origin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline flex items-center gap-1 truncate"
                >
                  {currentPreset.origin_url}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Demo URL (Xem thử):</span>
                <span className="text-slate-300 truncate block">{currentPreset.demo_url}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Trường Tuỳ Biến (Schema):</span>
                <span className="font-semibold text-emerald-400">
                  {currentPreset.schema.fields.length} trường ({currentPreset.schema.fields.map(f => f.key).join(', ')})
                </span>
              </div>
            </div>
          )}

          {/* Pricing & Category Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-1">Giá Bán ($ USD):</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[14px] placeholder:text-[14px] text-white focus:border-indigo-500 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-1">Giá Khuyến Mãi ($ USD - Tuỳ chọn):</label>
              <input
                type="number"
                value={salePrice || ''}
                placeholder="Trống nếu không giảm"
                onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[14px] placeholder:text-[14px] text-white focus:border-indigo-500 focus:outline-none font-sans"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-400 mb-1">Danh Mục Hiển Thị:</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[14px] text-white focus:border-indigo-500 focus:outline-none font-sans"
              >
                <option value="c1">Software Developer (c1)</option>
                <option value="c2">Creative Designer (c2)</option>
                <option value="c3">Content Creator (c3)</option>
                <option value="c4">Agency & Business (c4)</option>
              </select>
            </div>
          </div>

          {/* JSON Contract Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                Integration Contract JSON (portfolio-contract.json):
              </label>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(rawContractJson);
                  toast.success('Đã sao chép Contract JSON vào clipboard');
                }}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Sao chép JSON
              </button>
            </div>
            <textarea
              value={rawContractJson}
              onChange={(e) => setRawContractJson(e.target.value)}
              rows={12}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-200 focus:border-indigo-500 focus:outline-none resize-y"
              placeholder="Dán mã JSON Integration Contract tại đây..."
            />
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                validationResult.valid
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Hợp đồng hợp lệ và sẵn sàng đăng ký vào Marketplace</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Hợp đồng chưa đáp ứng đầy đủ tiêu chuẩn Integration Contract</span>
                  </>
                )}
              </div>
              {validationResult.errors.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 mt-2 text-rose-400">
                  {validationResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={validating}
            className="gap-2 font-bold text-xs"
          >
            {validating ? <Loading size={14} /> : <ShieldCheck className="w-4 h-4 text-indigo-400" />}
            Kiểm tra & Xác thực Contract
          </Button>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleRegister}
              disabled={registering || Boolean(validationResult && !validationResult.valid)}
              className="gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-500"
            >
              {registering ? <Loading size={16} /> : <Zap className="w-4 h-4" />}
              Đăng ký Dự Án vào Shop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
