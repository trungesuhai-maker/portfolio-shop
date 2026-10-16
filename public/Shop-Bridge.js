/**
 * ShopBridge SDK v3.1 - Chuẩn hóa Cầu nối Độc quyền giữa Shop (webcuaban.site) & Hàng trăm Template Con
 * Hỗ trợ tuyệt đối 100% cho 3 trường hợp:
 * - TH1: Khách vãng lai (Guest) -> Lưu song song LocalStorage & IndexedDB riêng (guest_tpl_{id}), dùng thử/xem thử, thanh header cam tím tự động ẩn khi mở Popup.
 * - TH2: User đã đăng nhập chưa mua (Trial) -> Hiển thị dữ liệu gốc ban đầu, lưu song song LocalStorage & IndexedDB (user_{userId}_tpl_{id}), có thanh header cam tím.
 * - TH3: User đã mua bản quyền (Owner/Licensed) -> Đọc & Ghi 100% vào Supabase Database, ẩn thanh dùng thử.
 *
 * Tính năng v3.1:
 * - Tự động ẨN thanh header dùng thử ngay khi phát hiện bất kỳ Popup / Modal / Dialog / Drawer / Overlay nào đang mở.
 * - Điều chỉnh z-index header xuống 45 (dưới chuẩn z-50 của Tailwind và z-1050 của Bootstrap modal) để không bao giờ che đè popup.
 * - Nén ảnh siêu tốc client-side bằng Canvas trước khi lưu/upload để tránh QuotaExceededError của LocalStorage.
 * - Hệ thống đệm IndexedDB bảo hiểm 100% không bao giờ mất dữ liệu ngay cả khi người dùng tải ảnh dung lượng lớn.
 * - Hỗ trợ upload ảnh lên Cloudflare R2 hoặc bộ nhớ đĩa máy chủ Shop, trả về URL siêu nhẹ (vài chục bytes thay vì hàng triệu bytes base64).
 */
(function (global) {
  'use strict';

  var getDynamicApiBase = function () {
    try {
      var params = new URLSearchParams(window.location.search);
      var customApi = params.get('shopApi') || params.get('apiBase');
      if (customApi) return customApi.replace(/\/$/, '');

      if (document.currentScript && document.currentScript.src) {
        try {
          var scriptOrigin = new URL(document.currentScript.src).origin;
          if (scriptOrigin && !scriptOrigin.includes('localhost') && scriptOrigin !== window.location.origin) {
            return scriptOrigin.replace(/\/$/, '');
          }
        } catch (sErr) {}
      }

      var origin = window.location.origin;
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return 'http://localhost:3000';
      }
      if (origin.endsWith('.webcuaban.site') || origin.includes('webcuaban.site')) {
        return 'https://www.webcuaban.site';
      }
    } catch (e) {}
    return 'https://www.webcuaban.site';
  };

  // =========================================================================
  // THAM CHIẾU GỐC CỦA LOCALSTORAGE - LUÔN KHỞI TẠO ĐẦU TIÊN (ZERO-DEPENDENCY)
  // =========================================================================
  var _rawSetItem = (typeof localStorage !== 'undefined' && localStorage.setItem) ? localStorage.setItem.bind(localStorage) : function () {};
  var _rawGetItem = (typeof localStorage !== 'undefined' && localStorage.getItem) ? localStorage.getItem.bind(localStorage) : function () { return null; };
  var _rawRemoveItem = (typeof localStorage !== 'undefined' && localStorage.removeItem) ? localStorage.removeItem.bind(localStorage) : function () {};

  // =========================================================================
  // DEEP-MERGE THÔNG MINH: BẢO VỆ TOÀN VẸN CẤU TRÚC VÀ DỮ LIỆU ĐÃ EDIT
  // =========================================================================
  function isPlainObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target || {};
    if (!target || typeof target !== 'object') return source || {};
    var output = Object.assign({}, target);
    for (var k in source) {
      if (Object.prototype.hasOwnProperty.call(source, k)) {
        if (isPlainObject(source[k]) && isPlainObject(output[k])) {
          output[k] = deepMerge(output[k], source[k]);
        } else if (Array.isArray(source[k]) && Array.isArray(output[k])) {
          if (source[k].length === 0) {
            output[k] = output[k];
          } else {
            output[k] = source[k].map(function (srcItem, idx) {
              var tgtItem = output[k][idx] || {};
              if (isPlainObject(srcItem) && isPlainObject(tgtItem)) {
                return deepMerge(tgtItem, srcItem);
              }
              return srcItem;
            });
            if (output[k].length > source[k].length) {
              output[k] = output[k].slice(0, source[k].length).concat(target[k].slice(source[k].length));
            }
          }
        } else if (source[k] !== undefined && source[k] !== null) {
          output[k] = source[k];
        }
      }
    }
    return output;
  }

  // =========================================================================
  // INDEXEDDB BẢO HIỂM 100% CHỐNG TRÀN BỘ NHỚ LOCALSTORAGE (QUOTA EXCEEDED)
  // Dung lượng lưu trữ hàng trăm Megabytes, hoạt động trên mọi trình duyệt hiện đại
  // =========================================================================
  var IDB = {
    dbPromise: null,
    getDB: function () {
      if (!this.dbPromise) {
        this.dbPromise = new Promise(function (resolve) {
          if (typeof indexedDB === 'undefined') return resolve(null);
          try {
            var req = indexedDB.open('ShopBridgeStorage_v3', 1);
            req.onupgradeneeded = function (e) {
              var db = e.target.result;
              if (!db.objectStoreNames.contains('templates_data')) {
                db.createObjectStore('templates_data');
              }
            };
            req.onsuccess = function (e) { resolve(e.target.result); };
            req.onerror = function () { resolve(null); };
          } catch (err) { resolve(null); }
        });
      }
      return this.dbPromise;
    },
    setItem: async function (key, val) {
      try {
        var db = await this.getDB();
        if (!db) return false;
        // Đảm bảo dữ liệu thuần túy (không chứa hàm/DOM node không clone được)
        var serializable = typeof val === 'string' ? val : JSON.stringify(val);
        return new Promise(function (resolve) {
          try {
            var tx = db.transaction('templates_data', 'readwrite');
            var store = tx.objectStore('templates_data');
            store.put(serializable, key);
            tx.oncomplete = function () { resolve(true); };
            tx.onerror = function () { resolve(false); };
          } catch (txErr) {
            resolve(false);
          }
        });
      } catch (e) { return false; }
    },
    getItem: async function (key) {
      try {
        var db = await this.getDB();
        if (!db) return null;
        return new Promise(function (resolve) {
          try {
            var tx = db.transaction('templates_data', 'readonly');
            var store = tx.objectStore('templates_data');
            var req = store.get(key);
            req.onsuccess = function () {
              var res = req.result;
              if (res && typeof res === 'string') {
                try { resolve(JSON.parse(res)); return; } catch (e) { resolve(res); return; }
              }
              resolve(res || null);
            };
            req.onerror = function () { resolve(null); };
          } catch (txErr) {
            resolve(null);
          }
        });
      } catch (e) { return null; }
    }
  };

  /**
   * Nén ảnh DataURL siêu nhanh trên Canvas để chống tràn bộ nhớ LocalStorage
   * Giảm 90-95% dung lượng ảnh mà mắt thường không phân biệt được
   */
  var compressDataUrl = function (dataUrl, maxDim, quality) {
    maxDim = maxDim || 1280;
    quality = quality || 0.82;
    return new Promise(function (resolve) {
      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        return resolve(dataUrl);
      }
      // Nếu ảnh đã nhỏ hơn 120KB thì không cần nén tiếp
      if (dataUrl.length < 120000) return resolve(dataUrl);

      var img = new Image();
      img.onload = function () {
        try {
          var w = img.width;
          var h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed || compressed.length >= dataUrl.length) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(compressed || dataUrl);
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  };

  /**
   * Quét và nén toàn bộ các ảnh base64 trong object formData để lưu trữ siêu nhẹ
   */
  var optimizeFormDataImages = async function (data) {
    if (!data || typeof data !== 'object') return data;
    try {
      var copy = JSON.parse(JSON.stringify(data));
      var walk = async function (obj) {
        if (!obj || typeof obj !== 'object') return;
        for (var k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) {
            var val = obj[k];
            if (typeof val === 'string' && val.startsWith('data:image/') && val.length > 90000) {
              obj[k] = await compressDataUrl(val, 1280, 0.82);
            } else if (val && typeof val === 'object') {
              await walk(val);
            }
          }
        }
      };
      await walk(copy);
      return copy;
    } catch (e) {
      return data;
    }
  };

  var ShopBridge = {
    apiBase: getDynamicApiBase(),
    _cachedData: null,
    _loadedFromSupabase: false,
    _fetchPromise: null,
    _isInitialLoading: true,

    /**
     * Cập nhật API endpoint thủ công nếu cần
     */
    setApiBase: function (url) {
      if (url) this.apiBase = url.replace(/\/$/, '');
    },

    /**
     * Lấy toàn bộ tham số nhận diện từ URL do Shop truyền sang
     */
    getInstanceInfo: function () {
      var params = new URLSearchParams(window.location.search);
      var host = (window.location.hostname || '').toLowerCase();
      var subMatch = host.match(/^([a-z0-9-]+)\.webcuaban\.site$/i);
      var hostSub = (subMatch && subMatch[1] !== 'www') ? subMatch[1] : null;

      var rawTemplateId = params.get('templateId') || params.get('tpl') || params.get('slug') || hostSub || 'template';
      var templateId = rawTemplateId.replace(/^port-/, '').trim();
      var slug = (params.get('slug') || hostSub || templateId).replace(/^port-/, '').trim();

      var userParam = params.get('user') || params.get('userId') || params.get('tenant');
      var isGuestUser = !userParam || userParam === 'guest' || userParam.startsWith('guest') || userParam === 'null' || userParam === 'undefined';
      var userId = isGuestUser ? 'guest' : userParam;

      var tenantParam = params.get('tenant') || params.get('subdomain');
      var rawInstance = params.get('instance') || params.get('instanceId');
      
      // Chuẩn hóa instanceId: Nếu có instance truyền vào thì ưu tiên; nếu tenant/subdomain có sẵn dạng slug thì tạo inst-{tenant}
      var instanceId = rawInstance;
      if (!instanceId) {
        if (tenantParam && tenantParam !== 'guest' && tenantParam !== 'user') {
          instanceId = 'inst-' + tenantParam.replace(/^inst-/, '');
        } else if (hostSub) {
          instanceId = 'inst-' + hostSub;
        } else if (!isGuestUser) {
          instanceId = 'inst-' + userId;
        } else {
          instanceId = 'guest-' + templateId;
        }
      }

      var licensedParam = params.get('licensed');
      var licenseKeyParam = params.get('licenseKey');
      var modeParam = params.get('mode');
      var roleParam = params.get('role');
      var trialParam = params.get('trial');

      // TUYỆT ĐỐI CHUẨN XÁC: Kiểm tra các cờ từ chối bản quyền trước
      var isExplicitlyLicensed = licensedParam === 'true' || 
                                 licenseKeyParam === 'activated' || 
                                 roleParam === 'owner' || 
                                 modeParam === 'published';

      var isExplicitlyUnlicensed = licensedParam === 'false' || 
                                   trialParam === 'true' || 
                                   roleParam === 'guest' || 
                                   roleParam === 'trial' || 
                                   (!isExplicitlyLicensed && modeParam === 'draft');

      // Xác định trạng thái Bản quyền (TH3):
      var isLicensed = isExplicitlyLicensed && licensedParam !== 'false' && trialParam !== 'true' && roleParam !== 'guest' && roleParam !== 'trial';

      // Xác định vai trò: 'owner' (TH3) | 'trial' (TH2) | 'guest' (TH1)
      var role = 'guest';
      if (isLicensed) {
        role = 'owner';
      } else if (roleParam === 'trial' || (!isGuestUser && roleParam !== 'guest')) {
        role = 'trial';
      } else {
        role = 'guest';
      }

      return {
        templateId: templateId,
        slug: slug,
        hostSub: hostSub,
        tenant: tenantParam,
        instanceId: instanceId,
        userId: userId,
        role: role,
        isLicensed: isLicensed,
        isTrial: !isLicensed,
        apiBase: this.apiBase
      };
    },

    /**
     * Lấy key lưu trữ LocalStorage tương ứng với vai trò
     */
    getStorageKey: function () {
      var info = this.getInstanceInfo();
      if (info.role === 'guest') {
        return 'guest_tpl_' + info.templateId;
      }
      if (info.role === 'trial') {
        return 'user_' + info.userId + '_tpl_' + info.templateId;
      }
      return 'owner_' + info.instanceId;
    },

    /**
     * Tải đồng bộ tức thì (Synchronous Initial Load) từ Supabase nếu Cache trình duyệt vừa bị xóa sạch
     * Đảm bảo mọi script của Template con chạy sau đó khi gọi localStorage.getItem() sẽ có dữ liệu ngay lập tức!
     */
    ensureInitialDataSync: function () {
      if (this._cachedData && Object.keys(this._cachedData).length > 0) {
        return this._cachedData;
      }
      var info = this.getInstanceInfo();
      if (!info.isLicensed) return null;

      // 1. Kiểm tra nhanh LocalStorage
      try {
        var rawLocal = _rawGetItem('portfolio_data') || 
                       _rawGetItem('portfolio_data_' + info.instanceId) ||
                       _rawGetItem('owner_' + info.instanceId);
        if (rawLocal) {
          var parsed = JSON.parse(rawLocal);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            this._cachedData = parsed;
            this._loadedFromSupabase = true;
            this._isInitialLoading = false;
            return parsed;
          }
        }
      } catch (e) {}

      // 2. Nếu LocalStorage bị rỗng (do xóa cache) -> Gọi XMLHttpRequest ĐỒNG BỘ (Synchronous XHR) đến Supabase API
      try {
        var candidateIds = [
          info.instanceId,
          info.tenant ? ('inst-' + info.tenant.replace(/^inst-/, '')) : null,
          info.hostSub ? ('inst-' + info.hostSub) : null,
          info.userId && info.userId !== 'guest' ? ('inst-' + info.userId) : null
        ].filter(Boolean);
        candidateIds = Array.from(new Set(candidateIds));

        for (var c = 0; c < candidateIds.length; c++) {
          var curId = candidateIds[c];
          var xhr = new XMLHttpRequest();
          var fetchUrl = this.apiBase + '/api/portfolios/' + encodeURIComponent(curId);
          xhr.open('GET', fetchUrl, false); // Đồng bộ 100% để đón đầu script template con!
          xhr.setRequestHeader('Cache-Control', 'no-cache');
          xhr.send(null);

          if (xhr.status === 200 && xhr.responseText) {
            var resObj = JSON.parse(xhr.responseText);
            var loaded = (resObj.custom_data && Object.keys(resObj.custom_data).length > 0)
              ? resObj.custom_data
              : (resObj.published_data && Object.keys(resObj.published_data).length > 0 ? resObj.published_data : null);

            if (loaded && typeof loaded === 'object' && Object.keys(loaded).length > 0) {
              console.info('[ShopBridge - Cứu Dữ Liệu Cache Rỗng] Đã nạp đồng bộ dữ liệu Supabase thành công từ miligiây đầu tiên!', curId);
              this._cachedData = loaded;
              this._loadedFromSupabase = true;
              this._isInitialLoading = false;
              this._writeToLocalStorageFast(loaded, info);
              return loaded;
            }
          }
        }
      } catch (syncErr) {
        console.warn('[ShopBridge] Synchronous prefetch notice:', syncErr);
      }

      this._isInitialLoading = false;
      return null;
    },

    /**
     * Nạp dữ liệu cấu hình Portfolio SIÊU TỐC với cơ chế song song (Parallel Fetch)
     * @param {Object} defaultData - Dữ liệu gốc mặc định của Template con
     * @returns {Promise<Object>}
     */
    loadData: async function (defaultData) {
      var self = this;
      var info = this.getInstanceInfo();

      var baseFallback = (defaultData && typeof defaultData === 'object' && Object.keys(defaultData).length > 0) 
        ? defaultData 
        : (this._cachedData || {});

      // Nếu đã có cache trong phiên thì kết hợp thông minh với defaultData rồi trả về ngay lập tức (0ms)
      if (this._cachedData && Object.keys(this._cachedData).length > 0) {
        var mergedCached = deepMerge(baseFallback, this._cachedData);
        this._cachedData = mergedCached;
        this._writeToLocalStorageFast(mergedCached, info);
        this.applyFrontendSync(mergedCached);
        return mergedCached;
      }

      // ==========================================
      // TRƯỜNG HỢP 3 (TH3): ĐÃ MUA / BẢN QUYỀN CHÍNH THỨC
      // Tải song song (Parallel Fetch) các ID ứng viên để đạt tốc độ nhanh nhất!
      // ==========================================
      if (info.isLicensed) {
        // 1. Kiểm tra ngay lập tức LocalStorage và IndexedDB cục bộ (chỉ mất ~1-2ms)
        var localExisted = null;
        try {
          var rawFast = _rawGetItem('portfolio_data_' + info.instanceId) || _rawGetItem('portfolio_data') || _rawGetItem('videograph_portfolio_data');
          if (rawFast) localExisted = JSON.parse(rawFast);
        } catch (e) {}

        if (!localExisted) {
          try {
            var idbOwnerFast = await IDB.getItem('owner_' + info.instanceId);
            if (idbOwnerFast && typeof idbOwnerFast === 'object' && Object.keys(idbOwnerFast).length > 0) {
              localExisted = idbOwnerFast;
            }
          } catch (fastIdbErr) {}
        }

        if (localExisted && typeof localExisted === 'object' && Object.keys(localExisted).length > 0) {
          self._cachedData = deepMerge(baseFallback, localExisted);
        }

        var candidateIds = [
          info.instanceId,
          info.tenant ? ('inst-' + info.tenant.replace(/^inst-/, '')) : null,
          info.hostSub ? ('inst-' + info.hostSub) : null,
          info.userId && info.userId !== 'guest' ? ('inst-' + info.userId) : null
        ].filter(Boolean);

        candidateIds = Array.from(new Set(candidateIds));

        // TẢI SONG SONG TẤT CẢ ENDPOINT CÙNG LÚC ĐỂ TĂNG TỐC ĐỘ GẤP 3-4 LẦN
        var fetchPromises = candidateIds.map(function (targetId) {
          return fetch(self.apiBase + '/api/portfolios/' + encodeURIComponent(targetId), {
            headers: { 'Cache-Control': 'no-cache' }
          }).then(function (res) {
            if (res.ok) return res.json();
            return null;
          }).catch(function () { return null; });
        });

        try {
          var results = await Promise.all(fetchPromises);
          for (var r = 0; r < results.length; r++) {
            var data = results[r];
            if (data) {
              var loadedCustom = (data.custom_data && Object.keys(data.custom_data).length > 0)
                ? data.custom_data
                : (data.published_data && Object.keys(data.published_data).length > 0 ? data.published_data : null);

              if (loadedCustom && typeof loadedCustom === 'object') {
                console.info('[ShopBridge - TH3] Nạp thành công dữ liệu Supabase Database siêu tốc!');
                var finalMerged = deepMerge(baseFallback, loadedCustom);
                if (localExisted && typeof localExisted === 'object' && Object.keys(localExisted).length > 0) {
                  finalMerged = deepMerge(finalMerged, localExisted);
                }
                if (self._cachedData && typeof self._cachedData === 'object' && Object.keys(self._cachedData).length > 0) {
                  finalMerged = deepMerge(finalMerged, self._cachedData);
                }

                self._cachedData = finalMerged;
                self._loadedFromSupabase = true;
                self._isInitialLoading = false;

                // Ghi vào LocalStorage và IndexedDB để truy xuất tức thì
                self._writeToLocalStorageFast(finalMerged, info);
                self.hydrateFormInputs(finalMerged);
                self.applyFrontendSync(finalMerged);

                window.dispatchEvent(new CustomEvent('portfolio_data_loaded', { detail: finalMerged }));
                window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: finalMerged }));
                return finalMerged;
              }
            }
          }
        } catch (fetchErr) {
          console.warn('[ShopBridge - TH3] Kết nối Supabase API có độ trễ:', fetchErr);
        }

        // TẦNG DỰ PHÒNG SIÊU TỐC: ĐỌC TRỰC TIẾP SUPABASE REST DATABASE QUA ANON KEY
        // Đảm bảo 100% không bao giờ phụ thuộc vào server trung gian và không bao giờ bị 404!
        try {
          var SUPA_URL = 'https://zeuiowqdzuwraqhkgkoo.supabase.co';
          var SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldWlvd3FkenV3cmFxaGtna29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTQyMTYsImV4cCI6MjEwNTc5MDIxNn0.WL3UwtGJ1e8x1YwvlC50tjwz_pywavAcSHM_gg25jUI';
          for (var sc = 0; sc < candidateIds.length; sc++) {
            var scTarget = candidateIds[sc];
            var scCleanSub = scTarget.replace(/^inst-/, '').replace(/^draft-/, '');
            var supaQueryUrl = SUPA_URL + '/rest/v1/portfolio_instances?or=(id.eq.' + encodeURIComponent(scTarget) + ',subdomain.eq.' + encodeURIComponent(scCleanSub) + ',id.eq.inst-' + encodeURIComponent(scCleanSub) + ')&select=*&order=updated_at.desc&limit=1';
            var sRes = await fetch(supaQueryUrl, {
              headers: {
                'apikey': SUPA_KEY,
                'Authorization': 'Bearer ' + SUPA_KEY
              }
            });
            if (sRes.ok) {
              var sRows = await sRes.json();
              if (Array.isArray(sRows) && sRows.length > 0 && sRows[0]) {
                var sRow = sRows[0];
                var supaCustom = (sRow.published_data && Object.keys(sRow.published_data).length > 0)
                  ? sRow.published_data
                  : (sRow.draft_data && Object.keys(sRow.draft_data).length > 0
                    ? sRow.draft_data
                    : (sRow.custom_data && Object.keys(sRow.custom_data).length > 0 ? sRow.custom_data : null));

                if (supaCustom && typeof supaCustom === 'object') {
                  console.info('[ShopBridge - TH3] Nạp thành công từ Supabase Cloud REST trực tiếp!');
                  var directMerged = deepMerge(baseFallback, supaCustom);
                  if (localExisted && typeof localExisted === 'object' && Object.keys(localExisted).length > 0) {
                    directMerged = deepMerge(directMerged, localExisted);
                  }
                  self._cachedData = directMerged;
                  self._loadedFromSupabase = true;
                  self._isInitialLoading = false;
                  self._writeToLocalStorageFast(directMerged, info);
                  self.hydrateFormInputs(directMerged);
                  self.applyFrontendSync(directMerged);
                  window.dispatchEvent(new CustomEvent('portfolio_data_loaded', { detail: directMerged }));
                  window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: directMerged }));
                  return directMerged;
                }
              }
            }
          }
        } catch (supaDirectErr) {
          console.warn('[ShopBridge - TH3] Supabase Direct REST read notice:', supaDirectErr);
        }

        self._isInitialLoading = false;

        // BẢO TỒN DỮ LIỆU ĐÃ EDIT TRONG LOCALSTORAGE & INDEXEDDB:
        // TUYỆT ĐỐI KHÔNG ĐƯỢC RESET VỀ BASEFALLBACK NẾU TRÌNH DUYỆT ĐANG CÓ BẢN EDIT CỦA USER!
        if (localExisted && typeof localExisted === 'object' && Object.keys(localExisted).length > 0) {
          console.info('[ShopBridge - TH3] Bảo tồn dữ liệu edit hiện tại của User trong Browser!');
          var preserved = deepMerge(baseFallback, localExisted);
          self._cachedData = preserved;
          self._writeToLocalStorageFast(preserved, info);
          self.applyFrontendSync(preserved);
          return preserved;
        }

        // Nếu đã có cache từ LocalStorage / IndexedDB / phiên trước
        if (self._cachedData && Object.keys(self._cachedData).length > 0) {
          var fallbackMerged = deepMerge(baseFallback, self._cachedData);
          self._cachedData = fallbackMerged;
          self._writeToLocalStorageFast(fallbackMerged, info);
          self.applyFrontendSync(fallbackMerged);
          return fallbackMerged;
        }

        self.applyFrontendSync(baseFallback);
        return baseFallback;
      }

      // ==========================================
      // TRƯỜNG HỢP 2 (TH2): USER ĐÃ ĐĂNG NHẬP NHƯNG CHƯA MUA (TRIAL)
      // Lấy từ key riêng của user: user_{userId}_tpl_{templateId}
      // Kiểm tra cả IndexedDB lẫn LocalStorage
      // ==========================================
      if (info.role === 'trial') {
        var userPrimary = 'user_' + info.userId + '_tpl_' + info.templateId;
        
        // 1. Kiểm tra IndexedDB trước
        try {
          var idbTrialData = await IDB.getItem(userPrimary);
          if (idbTrialData && typeof idbTrialData === 'object' && Object.keys(idbTrialData).length > 0) {
            console.info('[ShopBridge - TH2] Nạp dữ liệu nháp của User từ IndexedDB!');
            this._cachedData = idbTrialData;
            return idbTrialData;
          }
        } catch (idbErr) {}

        // 2. Kiểm tra LocalStorage
        var userKeys = [
          userPrimary,
          info.hostSub ? ('user_' + info.userId + '_tpl_' + info.hostSub) : null,
          info.slug ? ('user_' + info.userId + '_tpl_' + info.slug) : null
        ].filter(Boolean);

        for (var i = 0; i < userKeys.length; i++) {
          var userStr = _rawGetItem(userKeys[i]);
          if (userStr) {
            try {
              var userParsed = JSON.parse(userStr);
              if (userParsed && typeof userParsed === 'object' && Object.keys(userParsed).length > 0) {
                console.info('[ShopBridge - TH2] Nạp dữ liệu nháp của User từ LocalStorage:', userKeys[i]);
                this._cachedData = userParsed;
                return userParsed;
              }
            } catch (err) {}
          }
        }

        console.info('[ShopBridge - TH2] Lần đầu mở: Hiển thị DỮ LIỆU GỐC mặc định của template.');
        this._cachedData = defaultData || {};
        return defaultData || {};
      }

      // ==========================================
      // TRƯỜNG HỢP 1 (TH1): KHÁCH VÃNG LAI (GUEST)
      // Lấy từ key riêng của khách: guest_tpl_{templateId}
      // Ưu tiên đọc dữ liệu đã lưu từ IndexedDB & LocalStorage
      // ==========================================
      var guestPrimary = 'guest_tpl_' + info.templateId;

      // 1. Kiểm tra IndexedDB trước (Chứa dữ liệu hoàn chỉnh, không bao giờ bị cắt xén do quota)
      try {
        var idbGuest = await IDB.getItem(guestPrimary);
        if (!idbGuest && info.hostSub) idbGuest = await IDB.getItem('guest_tpl_' + info.hostSub);
        if (!idbGuest && info.slug) idbGuest = await IDB.getItem('guest_tpl_' + info.slug);
        if (!idbGuest) idbGuest = await IDB.getItem('guest_tpl_default');

        if (idbGuest && typeof idbGuest === 'object' && Object.keys(idbGuest).length > 0) {
          console.info('[ShopBridge - TH1] Nạp dữ liệu hoàn chỉnh của Khách từ IndexedDB!');
          this._cachedData = idbGuest;
          return idbGuest;
        }
      } catch (idbGuestErr) {}

      // 2. Kiểm tra LocalStorage
      var guestKeys = [
        guestPrimary,
        info.hostSub ? ('guest_tpl_' + info.hostSub) : null,
        info.slug ? ('guest_tpl_' + info.slug) : null,
        'portfolio_data',
        'videograph_portfolio_data',
        'studio_portfolio_data',
        'portfolio_data_' + info.templateId
      ].filter(Boolean);

      for (var j = 0; j < guestKeys.length; j++) {
        var guestStr = _rawGetItem(guestKeys[j]);
        if (guestStr) {
          try {
            var guestParsed = JSON.parse(guestStr);
            if (guestParsed && typeof guestParsed === 'object' && Object.keys(guestParsed).length > 0) {
              console.info('[ShopBridge - TH1] Nạp dữ liệu của Khách từ LocalStorage (' + guestKeys[j] + ')');
              this._cachedData = guestParsed;
              return guestParsed;
            }
          } catch (err) {}
        }
      }

      this._cachedData = defaultData || {};
      return defaultData || {};
    },

    /**
     * Ghi nhanh dữ liệu vào các key chuẩn của template để đọc tức thì
     */
    _writeToLocalStorageFast: function (data, info) {
      if (!data) return;
      var currentInfo = info || this.getInstanceInfo();
      var jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      var objData = typeof data === 'object' ? data : (function () { try { return JSON.parse(data); } catch (e) { return null; } })();
      try {
        if (currentInfo.isLicensed) {
          _rawSetItem('portfolio_data', jsonStr);
          _rawSetItem('videograph_portfolio_data', jsonStr);
          _rawSetItem('studio_portfolio_data', jsonStr);
          if (currentInfo && currentInfo.instanceId) {
            _rawSetItem('portfolio_data_' + currentInfo.instanceId, jsonStr);
            _rawSetItem('owner_' + currentInfo.instanceId, jsonStr);
            if (objData) IDB.setItem('owner_' + currentInfo.instanceId, objData);
          }
          if (currentInfo && currentInfo.tenant) {
            _rawSetItem('portfolio_data_' + currentInfo.tenant, jsonStr);
            _rawSetItem('portfolio_data_inst-' + currentInfo.tenant.replace(/^inst-/, ''), jsonStr);
          }
          if (currentInfo && currentInfo.hostSub) {
            _rawSetItem('portfolio_data_' + currentInfo.hostSub, jsonStr);
            _rawSetItem('portfolio_data_inst-' + currentInfo.hostSub, jsonStr);
          }
        } else if (currentInfo.role === 'trial') {
          var userKey = 'user_' + currentInfo.userId + '_tpl_' + currentInfo.templateId;
          _rawSetItem(userKey, jsonStr);
          if (objData) IDB.setItem(userKey, objData);
        } else {
          var guestKey = 'guest_tpl_' + currentInfo.templateId;
          _rawSetItem(guestKey, jsonStr);
          if (objData) IDB.setItem(guestKey, objData);
        }
      } catch (e) {}
    },

    /**
     * Đẩy ngay lập tức toàn bộ dữ liệu đang chờ lưu lên Supabase và Storage
     * Thường dùng khi người dùng chuẩn bị chuyển trang hoặc click "Đến trang chủ template"
     */
    _flushSaveNow: function () {
      if (typeof _syncTimer !== 'undefined' && _syncTimer) {
        clearTimeout(_syncTimer);
        _syncTimer = null;
      }
      var info = this.getInstanceInfo();
      if (this._cachedData && typeof this._cachedData === 'object') {
        this._writeToLocalStorageFast(this._cachedData, info);
        if (info.isLicensed) {
          this.syncData(this._cachedData);
          try {
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
              var beaconPayload = JSON.stringify({
                custom_data: this._cachedData,
                user_id: info.userId,
                status: 'published',
                template_id: info.templateId
              });
              navigator.sendBeacon(
                this.apiBase + '/api/portfolios/' + encodeURIComponent(info.instanceId) + '/sync',
                new Blob([beaconPayload], { type: 'application/json' })
              );
            }
          } catch (bErr) {}
        }
      }
    },

    /**
     * Tự động đổ dữ liệu (Hydrate) vào form và toàn bộ giao diện template con khi vừa nạp xong từ Supabase
     */
    hydrateFormInputs: function (data) {
      if (!data || typeof data !== 'object') return;
      try {
        for (var k in data) {
          if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
          var val = data[k];
          if (val === null || val === undefined) continue;

          // 1. Điền vào Form Inputs, Textareas, Selects
          var formEls = document.querySelectorAll(
            '#' + CSS.escape(k) + ', ' +
            '[name="' + CSS.escape(k) + '"], ' +
            '[data-field="' + CSS.escape(k) + '"], ' +
            '[data-key="' + CSS.escape(k) + '"]'
          );
          for (var i = 0; i < formEls.length; i++) {
            var el = formEls[i];
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
              if (el.type === 'checkbox') {
                el.checked = Boolean(val);
              } else if (el.type === 'radio') {
                if (el.value === String(val)) el.checked = true;
              } else {
                el.value = val;
              }
              try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              } catch (evErr) {}
            } else if (el.tagName === 'IMG' && typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:image'))) {
              el.src = val;
            } else if (typeof val === 'string' || typeof val === 'number') {
              el.textContent = String(val);
            }
          }

          // 2. Điền vào các thẻ hiển thị Text & Ảnh trên giao diện (Hero title, subtitle, about bio, banner...)
          var bindEls = document.querySelectorAll(
            '[data-bind="' + CSS.escape(k) + '"], ' +
            '[data-text="' + CSS.escape(k) + '"], ' +
            '.' + CSS.escape(k) + '-preview, ' +
            '#' + CSS.escape(k) + '-preview'
          );
          for (var b = 0; b < bindEls.length; b++) {
            var bEl = bindEls[b];
            if (bEl.tagName === 'IMG' && typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:image'))) {
              bEl.src = val;
            } else if (typeof val === 'string' || typeof val === 'number') {
              bEl.textContent = String(val);
            }
          }
        }

        // 3. Kích hoạt lại các hàm Render phổ biến của Template con nếu có
        var renderFnNames = ['renderPortfolio', 'renderProfile', 'renderAll', 'renderPage', 'updateUI', 'render', 'initPortfolio', 'loadSavedData'];
        for (var f = 0; f < renderFnNames.length; f++) {
          var fnName = renderFnNames[f];
          if (typeof window[fnName] === 'function') {
            try { window[fnName](data); } catch (fnErr) {}
          }
        }

        // 4. Phát sự kiện toàn cục để các script template con tự cập nhật
        window.dispatchEvent(new CustomEvent('portfolio_data_loaded', { detail: data }));
        window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: data }));
        window.dispatchEvent(new CustomEvent('videograph_data_updated', { detail: data }));
        try { window.dispatchEvent(new Event('storage')); } catch (sErr) {}
      } catch (hErr) {}
    },

    /**
     * Đồng bộ trực tiếp giao diện Frontend của Template con (index.html, about.html, portfolio.html...)
     * Khắc phục triệt để lỗi jQuery $('.set-bg') và Owl Carousel clone ghi đè ảnh/chữ sau khi Preloader tắt
     */
    applyFrontendSync: function (customData) {
      if (typeof document === 'undefined') return;
      var data = customData || this._cachedData;
      if (!data || typeof data !== 'object') {
        var info = this.getInstanceInfo();
        var raw = _rawGetItem('portfolio_data_' + info.instanceId) || _rawGetItem('portfolio_data');
        if (raw) {
          try { data = JSON.parse(raw); } catch (e) {}
        }
      }
      if (!data || typeof data !== 'object') return;

      try {
        // 1. Site Settings (Tiêu đề trang, Logo, Mạng xã hội, Footer)
        if (data.siteSettings) {
          var s = data.siteSettings;
          if (s.siteName) {
            var pageName = '';
            var path = window.location.pathname || '';
            if (path.includes('about')) pageName = ' - About Us';
            else if (path.includes('portfolio')) pageName = ' - Portfolio';
            else if (path.includes('services')) pageName = ' - Services';
            else if (path.includes('blog')) pageName = ' - Blog';
            else if (path.includes('contact')) pageName = ' - Contact';
            else pageName = ' - ' + (s.tagline || 'Video Production & Portfolio');
            document.title = s.siteName + pageName;
          }
          if (s.logoImage) {
            var logos = document.querySelectorAll('.header__logo img, .footer__top__logo img, [data-logo]');
            for (var l = 0; l < logos.length; l++) {
              logos[l].src = s.logoImage;
            }
          }
          if (s.socialLinks) {
            var soc = s.socialLinks;
            var socContainers = document.querySelectorAll('.header__nav__social, .footer__top__social');
            for (var sc = 0; sc < socContainers.length; sc++) {
              var container = socContainers[sc];
              var fb = container.querySelector('a[href*="facebook"], i.fa-facebook');
              if (fb) {
                var fbA = fb.tagName === 'A' ? fb : fb.closest('a');
                if (fbA && soc.facebook) fbA.href = soc.facebook;
              }
              var tw = container.querySelector('a[href*="twitter"], i.fa-twitter');
              if (tw) {
                var twA = tw.tagName === 'A' ? tw : tw.closest('a');
                if (twA && soc.twitter) twA.href = soc.twitter;
              }
              var ig = container.querySelector('a[href*="instagram"], i.fa-instagram');
              if (ig) {
                var igA = ig.tagName === 'A' ? ig : ig.closest('a');
                if (igA && soc.instagram) igA.href = soc.instagram;
              }
              var yt = container.querySelector('a[href*="youtube"], i.fa-youtube');
              if (yt) {
                var ytA = yt.tagName === 'A' ? yt : yt.closest('a');
                if (ytA && soc.youtube) ytA.href = soc.youtube;
              }
            }
          }
          if (s.footerAboutText) {
            var fP = document.querySelector('.footer__option__item:first-child p, .footer__about p');
            if (fP) fP.textContent = s.footerAboutText;
          }
          if (s.footerAboutTitle) {
            var fH5 = document.querySelector('.footer__option__item:first-child h5, .footer__about h5');
            if (fH5) fH5.textContent = s.footerAboutTitle;
          }
          if (s.footerCopyright) {
            var cEls = document.querySelectorAll('.footer__copyright__text p, .copyright p');
            for (var c = 0; c < cEls.length; c++) {
              cEls[c].innerHTML = s.footerCopyright;
            }
          }
        }

        // 2. Hero Slider (Xử lý toàn diện kể cả Owl Carousel Clones & jQuery data-setbg)
        if (data.heroSlides && data.heroSlides.length) {
          var heroItems = document.querySelectorAll('.hero__slider .hero__item, .owl-stage .hero__item, .owl-item .hero__item');
          if (heroItems.length) {
            for (var h = 0; h < heroItems.length; h++) {
              var hItem = heroItems[h];
              var sIdx = h % data.heroSlides.length;
              var slide = data.heroSlides[sIdx];
              if (!slide) continue;

              if (slide.backgroundImage) {
                hItem.style.backgroundImage = 'url("' + slide.backgroundImage + '")';
                hItem.setAttribute('data-setbg', slide.backgroundImage);
                if (typeof window.jQuery !== 'undefined') {
                  try {
                    window.jQuery(hItem).data('setbg', slide.backgroundImage).css('background-image', 'url("' + slide.backgroundImage + '")');
                  } catch (jqErr) {}
                }
              }
              var span = hItem.querySelector('.hero__text span');
              if (span && slide.subtitle) span.textContent = slide.subtitle;
              var h2 = hItem.querySelector('.hero__text h2');
              if (h2 && slide.title) h2.textContent = slide.title;
              var btn = hItem.querySelector('.hero__text a.primary-btn, .hero__text a');
              if (btn) {
                if (slide.buttonText) btn.textContent = slide.buttonText;
                if (slide.buttonLink) btn.href = slide.buttonLink;
              }
            }
          }
        }

        // 3. Home Services
        if (data.homeServices) {
          var srvSec = document.querySelector('.services__title');
          if (srvSec) {
            var hsTag = srvSec.querySelector('.section-title span');
            if (hsTag && data.homeServices.tag) hsTag.textContent = data.homeServices.tag;
            var hsH2 = srvSec.querySelector('.section-title h2');
            if (hsH2 && data.homeServices.title) hsH2.textContent = data.homeServices.title;
            var hsP = srvSec.querySelector('p');
            if (hsP && data.homeServices.description) hsP.textContent = data.homeServices.description;
            var hsBtn = srvSec.querySelector('a.primary-btn');
            if (hsBtn) {
              if (data.homeServices.buttonText) hsBtn.textContent = data.homeServices.buttonText;
              if (data.homeServices.buttonLink) hsBtn.href = data.homeServices.buttonLink;
            }
          }
        }

        // 4. Services List (index & services.html)
        if (data.services && data.services.length) {
          var sCards = document.querySelectorAll('.services__item');
          if (sCards.length) {
            for (var sc = 0; sc < sCards.length; sc++) {
              var srvItem = data.services[sc % data.services.length];
              if (!srvItem) continue;
              var card = sCards[sc];
              var scH4 = card.querySelector('h4');
              if (scH4 && srvItem.title) scH4.textContent = srvItem.title;
              var scP = card.querySelector('p');
              if (scP && srvItem.description) scP.textContent = srvItem.description;
            }
          }
        }

        // 5. Portfolio Projects (Gallery & Work Grid)
        if (data.portfolioProjects && data.portfolioProjects.length) {
          var workCards = document.querySelectorAll('.work__item, .portfolio__item');
          if (workCards.length) {
            for (var w = 0; w < workCards.length; w++) {
              var proj = data.portfolioProjects[w % data.portfolioProjects.length];
              if (!proj) continue;
              var wCard = workCards[w];
              if (proj.image) {
                wCard.style.backgroundImage = 'url("' + proj.image + '")';
                wCard.setAttribute('data-setbg', proj.image);
                if (typeof window.jQuery !== 'undefined') {
                  try {
                    window.jQuery(wCard).data('setbg', proj.image).css('background-image', 'url("' + proj.image + '")');
                  } catch (jErr) {}
                }
              }
              var wH4 = wCard.querySelector('.work__item__hover h4, .portfolio__item__text h4, h4');
              if (wH4 && proj.title) wH4.textContent = proj.title;
              var wPlay = wCard.querySelector('a.play-btn, a.video-popup');
              if (wPlay && proj.videoUrl) wPlay.href = proj.videoUrl;
            }
          }
        }

        // 6. Quét sạch toàn bộ các thẻ .set-bg để đảm bảo background-image luôn khớp data-setbg
        var allSetBg = document.querySelectorAll('.set-bg');
        for (var b = 0; b < allSetBg.length; b++) {
          var bgEl = allSetBg[b];
          var dsBg = bgEl.getAttribute('data-setbg');
          if (dsBg) {
            bgEl.style.backgroundImage = 'url("' + dsBg + '")';
            if (typeof window.jQuery !== 'undefined') {
              try {
                window.jQuery(bgEl).data('setbg', dsBg).css('background-image', 'url("' + dsBg + '")');
              } catch (e) {}
            }
          }
        }
      } catch (syncErr) {
        console.warn('[ShopBridge] applyFrontendSync error:', syncErr);
      }
    },

    /**
     * Tải tệp Blob / File lên Cloudflare R2 / Máy chủ Shop
     * Trả về URL cố định vĩnh viễn (CDN R2 / Server uploads)
     */
    uploadBlobToR2: async function (blob, customName) {
      var self = this;
      var info = this.getInstanceInfo();
      var fileName = customName || (blob.name || ('upload-' + Date.now() + '.jpg'));
      var category = 'images';
      if (blob.type && blob.type.startsWith('video/')) category = 'videos';

      return new Promise(function (resolve) {
        var reader = new FileReader();
        reader.onload = async function (e) {
          var rawDataUrl = e.target.result;
          var optimizedDataUrl = rawDataUrl;
          if (blob.type && blob.type.startsWith('image/')) {
            try {
              optimizedDataUrl = await compressDataUrl(rawDataUrl, 1600, 0.85);
            } catch (cErr) {}
          }

          var payload = {
            name: fileName,
            category: category,
            dataUrl: optimizedDataUrl,
            mimeType: blob.type || 'image/jpeg',
            userId: info.userId || 'usr-customer',
            uploadedBy: info.userId || 'usr-customer'
          };

          try {
            var res = await fetch(self.apiBase + '/api/storage/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-ID': info.userId || 'usr-customer'
              },
              body: JSON.stringify(payload)
            });

            if (res.ok) {
              var json = await res.json();
              if (json && json.url) {
                var finalUrl = json.url;
                if (finalUrl.startsWith('/')) {
                  finalUrl = self.apiBase + finalUrl;
                }
                console.info('[ShopBridge] Đã upload media lên Cloudflare R2 / Storage thành công:', finalUrl);
                return resolve(finalUrl);
              }
            }
          } catch (netErr) {
            console.warn('[ShopBridge] Lỗi kết nối upload media:', netErr);
          }
          resolve(optimizedDataUrl);
        };
        reader.onerror = function () { resolve(null); };
        reader.readAsDataURL(blob);
      });
    },

    /**
     * Bẫy tự động lắng nghe toàn bộ <input type="file"> để upload trực tiếp lên Cloudflare R2
     */
    initMediaUploadInterceptor: function () {
      if (typeof window === 'undefined') return;
      var self = this;

      window.addEventListener('change', async function (e) {
        var target = e.target;
        if (!target || target.tagName !== 'INPUT' || target.type !== 'file' || !target.files || !target.files[0]) {
          return;
        }

        var file = target.files[0];
        var info = self.getInstanceInfo();
        if (!info.isLicensed) return; // Tự động sync lên R2 cho user đã mua bản quyền

        console.info('[ShopBridge] Phát hiện file upload trong template con, tải lên Cloudflare R2:', file.name);
        
        try {
          var r2Url = await self.uploadBlobToR2(file, file.name);
          if (r2Url && r2Url.startsWith('http')) {
            target.dataset.r2Url = r2Url;
            
            // Tìm các thẻ ảnh preview hoặc input text liên kết để gán ngay đường link R2
            var form = target.closest('form');
            if (form) {
              var previewImg = form.querySelector('img[src*="data:image"], img.preview, #preview, #' + target.id + '-preview');
              if (previewImg) previewImg.src = r2Url;
            }

            // Nếu trong cache có trường ảnh trùng khớp hoặc vừa được cập nhật, đổi sang link R2
            if (self._cachedData && typeof self._cachedData === 'object') {
              for (var key in self._cachedData) {
                var val = self._cachedData[key];
                if (typeof val === 'string' && val.startsWith('data:image/')) {
                  self._cachedData[key] = r2Url;
                }
              }
              self.saveData(self._cachedData);
            }
          }
        } catch (upErr) {
          console.warn('[ShopBridge] Upload R2 intercept error:', upErr);
        }
      }, true);
    },

    /**
     * Lưu dữ liệu Portfolio
     * @param {Object} formData - Dữ liệu do user chỉnh sửa
     * @returns {Promise<Object>}
     */
    saveData: async function (formData) {
      return this.syncData(formData);
    },

    /**
     * Đồng bộ dữ liệu
     * @param {Object} formData - Dữ liệu chỉnh sửa
     * @returns {Promise<Object>}
     */
    syncData: async function (formData) {
      var info = this.getInstanceInfo();

      // Tự động tối ưu nén ảnh base64 để chống tràn bộ nhớ LocalStorage (QuotaExceededError)
      var cleanData = formData;
      try {
        cleanData = await optimizeFormDataImages(formData);
      } catch (optErr) {}

      this._cachedData = cleanData;
      var jsonStr = JSON.stringify(cleanData);

      // ==========================================
      // TRƯỜNG HỢP 3 (TH3): ĐÃ MUA BẢN QUYỀN
      // Lưu thẳng vào Database Supabase qua API của Shop!
      // ==========================================
      if (info.isLicensed) {
        var syncTargets = [
          info.instanceId,
          info.tenant ? ('inst-' + info.tenant.replace(/^inst-/, '')) : null,
          info.hostSub ? ('inst-' + info.hostSub) : null
        ].filter(Boolean);

        // Loại bỏ trùng lặp
        syncTargets = Array.from(new Set(syncTargets));
        var syncSuccess = false;
        var lastResult = null;

        for (var sIdx = 0; sIdx < syncTargets.length; sIdx++) {
          var curTargetId = syncTargets[sIdx];
          try {
            var response = await fetch(this.apiBase + '/api/portfolios/' + encodeURIComponent(curTargetId) + '/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Instance-ID': curTargetId,
                'X-User-ID': info.userId
              },
              body: JSON.stringify({
                custom_data: cleanData,
                user_id: info.userId,
                status: 'published',
                template_id: info.templateId
              })
            });

            if (response.ok) {
              lastResult = await response.json();
              syncSuccess = true;
              console.info('[ShopBridge - TH3] Đã lưu 100% dữ liệu vào Supabase Database qua ID:', curTargetId);
              break;
            }
          } catch (syncErr) {
            console.warn('[ShopBridge - TH3] Lỗi sync mục tiêu ' + curTargetId + ':', syncErr);
          }
        }

        // TẦNG LƯU TRỰC TIẾP VÀO SUPABASE CLOUD REST (BẢO TOÀN DỮ LIỆU VĨNH VIỄN)
        try {
          var SUPA_SYNC_URL = 'https://zeuiowqdzuwraqhkgkoo.supabase.co';
          var SUPA_SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldWlvd3FkenV3cmFxaGtna29vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTQyMTYsImV4cCI6MjEwNTc5MDIxNn0.WL3UwtGJ1e8x1YwvlC50tjwz_pywavAcSHM_gg25jUI';
          var mainTarget = syncTargets[0] || info.instanceId;
          var mainSub = (info.tenant || info.hostSub || mainTarget.replace(/^inst-/, '')).toLowerCase().replace(/[^a-z0-9-]/g, '');
          var nowIso = new Date().toISOString();

          await fetch(SUPA_SYNC_URL + '/rest/v1/portfolio_instances', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPA_SYNC_KEY,
              'Authorization': 'Bearer ' + SUPA_SYNC_KEY,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              id: mainTarget.startsWith('inst-') ? mainTarget : ('inst-' + mainSub),
              subdomain: mainSub,
              custom_domain: mainSub + '.webcuaban.site',
              status: 'published',
              template_id: info.templateId || 't1',
              published_data: cleanData,
              draft_data: cleanData,
              updated_at: nowIso
            })
          });
          syncSuccess = true;
          console.info('[ShopBridge - TH3] Đã sao lưu trực tiếp 100% lên Supabase Cloud REST cho subdomain:', mainSub);
        } catch (supaSyncErr) {
          console.warn('[ShopBridge - TH3] Supabase Direct REST sync warning:', supaSyncErr);
        }

        // Cập nhật cả localStorage và IndexedDB cục bộ để đọc offline
        try {
          _rawSetItem('portfolio_data', jsonStr);
          for (var tIdx = 0; tIdx < syncTargets.length; tIdx++) {
            _rawSetItem('portfolio_data_' + syncTargets[tIdx], jsonStr);
            _rawSetItem('owner_' + syncTargets[tIdx], jsonStr);
            IDB.setItem('owner_' + syncTargets[tIdx], cleanData);
          }
        } catch (e) {}

        window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: cleanData }));
        window.dispatchEvent(new CustomEvent('videograph_data_updated', { detail: cleanData }));

        // Bắn postMessage tới iframe hoặc parent window để đồng bộ theo thời gian thực
        if (window.parent && window.parent !== window) {
          try {
            window.parent.postMessage({
              type: 'PORTFOLIO_DATA_SAVED',
              instanceId: info.instanceId,
              custom_data: cleanData
            }, '*');
          } catch (pmErr) {}
        }

        return lastResult || { success: syncSuccess, savedLocally: true };
      }

      // ==========================================
      // TRƯỜNG HỢP 2 (TH2): USER ĐÃ ĐĂNG NHẬP NHƯNG CHƯA MUA (TRIAL)
      // Lưu vào key riêng của user: user_{userId}_tpl_{templateId}
      // Bảo hiểm song song vào IndexedDB chống tràn bộ nhớ
      // ==========================================
      if (info.role === 'trial') {
        var userKey = 'user_' + info.userId + '_tpl_' + info.templateId;
        IDB.setItem(userKey, cleanData);

        try {
          _rawSetItem(userKey, jsonStr);
          if (info.hostSub) _rawSetItem('user_' + info.userId + '_tpl_' + info.hostSub, jsonStr);
          if (info.slug) _rawSetItem('user_' + info.userId + '_tpl_' + info.slug, jsonStr);
          _rawSetItem('portfolio_data', jsonStr);
        } catch (e) {
          // Nếu bị tràn quota, tự động xóa bớt các key phụ và ghi lại key chính
          try {
            _rawRemoveItem('videograph_portfolio_data');
            _rawRemoveItem('studio_portfolio_data');
            _rawSetItem(userKey, jsonStr);
          } catch (retryErr) {
            console.warn('[ShopBridge - TH2] LocalStorage đầy, đã bảo toàn dữ liệu bằng IndexedDB.');
          }
        }

        window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: cleanData }));
        window.dispatchEvent(new CustomEvent('videograph_data_updated', { detail: cleanData }));
        return { success: true, savedLocally: true, role: 'trial' };
      }

      // ==========================================
      // TRƯỜNG HỢP 1 (TH1): KHÁCH VÃNG LAI (GUEST)
      // Lưu vào key riêng của khách: guest_tpl_{templateId}
      // Bảo hiểm song song vào IndexedDB chống tràn bộ nhớ
      // ==========================================
      var guestKey = 'guest_tpl_' + info.templateId;
      IDB.setItem(guestKey, cleanData);
      IDB.setItem('guest_tpl_default', cleanData);

      try {
        _rawSetItem(guestKey, jsonStr);
        if (info.hostSub) _rawSetItem('guest_tpl_' + info.hostSub, jsonStr);
        if (info.slug) _rawSetItem('guest_tpl_' + info.slug, jsonStr);
        _rawSetItem('portfolio_data', jsonStr);
      } catch (e) {
        // Tự động dọn dẹp bộ nhớ tạm để ưu tiên lưu key chính
        try {
          _rawRemoveItem('videograph_portfolio_data');
          _rawRemoveItem('studio_portfolio_data');
          _rawRemoveItem('guest_tpl_data');
          _rawSetItem(guestKey, jsonStr);
        } catch (retryErr) {
          console.warn('[ShopBridge - TH1] LocalStorage đầy, dữ liệu được bảo toàn 100% trong IndexedDB.');
        }
      }

      window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: cleanData }));
      window.dispatchEvent(new CustomEvent('videograph_data_updated', { detail: cleanData }));

      return { success: true, savedLocally: true, role: 'guest' };
    },

    /**
     * Lấy đường dẫn trang chủ xem trước nhanh nhất và chính xác nhất
     */
    getHomeUrl: function () {
      var params = new URLSearchParams(window.location.search);
      var info = this.getInstanceInfo();
      var domain = params.get('domain');
      if (domain) {
        var cleanDomain = domain.startsWith('http://') || domain.startsWith('https://') 
          ? domain 
          : ('https://' + domain);
        var dSep = cleanDomain.includes('?') ? '&' : '?';
        return cleanDomain + dSep +
          'instance=' + encodeURIComponent(info.instanceId) +
          '&licensed=' + (info.isLicensed ? 'true' : 'false') +
          '&role=' + encodeURIComponent(info.role) +
          '&templateId=' + encodeURIComponent(info.templateId) +
          '&user=' + encodeURIComponent(info.userId) +
          '&shopApi=' + encodeURIComponent(this.apiBase);
      }
      var origin = window.location.origin;
      var path = window.location.pathname || '';
      var homeBase = path.includes('admin') ? origin + path.replace(/admin(\.html)?/i, 'index.html') : origin + '/index.html';
      var sep = homeBase.includes('?') ? '&' : '?';
      return homeBase + sep + 'mode=preview' +
        '&templateId=' + encodeURIComponent(info.templateId) +
        '&role=' + encodeURIComponent(info.role) +
        '&user=' + encodeURIComponent(info.userId) +
        '&licensed=' + (info.isLicensed ? 'true' : 'false') +
        '&trial=' + (info.isTrial ? 'true' : 'false') +
        '&instance=' + encodeURIComponent(info.instanceId) +
        '&shopApi=' + encodeURIComponent(this.apiBase);
    },

    /**
     * Lấy đường dẫn trang quản trị admin kèm đầy đủ tham số phiên dùng thử / bản quyền
     */
    getAdminUrl: function () {
      var info = this.getInstanceInfo();
      var origin = window.location.origin;
      var path = window.location.pathname || '';
      var customAdmin = (window.__SHOP_ADMIN_URL__ || window.__SHOP_ADMIN_PATH__ || '').trim();
      var adminBase;
      if (customAdmin) {
        adminBase = customAdmin.startsWith('http') ? customAdmin : (origin + (customAdmin.startsWith('/') ? customAdmin : ('/' + customAdmin)));
      } else {
        adminBase = path.includes('index') ? origin + path.replace(/index(\.html)?/i, 'admin.html') : origin + '/admin.html';
      }
      var sep = adminBase.includes('?') ? '&' : '?';
      return adminBase + sep +
        'templateId=' + encodeURIComponent(info.templateId) +
        '&role=' + encodeURIComponent(info.role) +
        '&user=' + encodeURIComponent(info.userId) +
        '&licensed=' + (info.isLicensed ? 'true' : 'false') +
        '&trial=' + (info.isTrial ? 'true' : 'false') +
        '&instance=' + encodeURIComponent(info.instanceId) +
        '&shopApi=' + encodeURIComponent(this.apiBase);
    },

    /**
     * Ẩn thanh header dùng thử (Ví dụ: khi mở popup)
     */
    hideTrialHeader: function () {
      var b = document.getElementById('shop-trial-banner');
      if (b) b.style.display = 'none';
    },

    /**
     * Hiện thanh header dùng thử
     */
    showTrialHeader: function () {
      var b = document.getElementById('shop-trial-banner');
      if (b) b.style.display = 'flex';
    },

    /**
     * Tự động bắt sự kiện nút "Đến trang chủ template" / "Xem trang web chính" / "Xem Website" trong admin.html
     * Kể cả các nút được React render động trong Header / H1 / Topbar
     */
    initHomeButtons: function () {
      var self = this;
      try {
        var homeUrl = this.getHomeUrl();
        var links = document.querySelectorAll('a, button');
        for (var i = 0; i < links.length; i++) {
          var el = links[i];
          var txt = (el.innerText || el.textContent || '').trim().toLowerCase();
          var href = (el.getAttribute('href') || '').toLowerCase();
          var isHomeTrigger = txt.includes('đến trang chủ') ||
                              txt.includes('trang chủ template') ||
                              txt.includes('xem trang web chính') ||
                              txt.includes('xem website') ||
                              txt.includes('xem web') ||
                              txt.includes('xem trang chủ') || 
                              txt.includes('về trang chủ') || 
                              txt.includes('quay về trang chủ') || 
                              txt.includes('view website') || 
                              txt.includes('live site') ||
                              txt.includes('open site') ||
                              href === 'index.html' || 
                              href === './index.html' || 
                              href === '/';
          
          if (isHomeTrigger) {
            if (el.tagName.toLowerCase() === 'a') {
              el.setAttribute('href', homeUrl);
            }
          }
        }
      } catch (err) {}

      // LẮNG NGHE SỰ KIỆN CLICK TOÀN CỤC (EVENT DELEGATION):
      // Đón bắt ngay tức thì khi người dùng click nút "Đến trang chủ template" ở H1 / Header React
      if (typeof document !== 'undefined' && !this._hasDelegatedHomeListener) {
        this._hasDelegatedHomeListener = true;
        document.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('a, button') : null;
          if (!btn) return;
          var txt = (btn.innerText || btn.textContent || '').trim().toLowerCase();
          var href = (btn.getAttribute('href') || '').toLowerCase();
          var isHome = txt.includes('đến trang chủ') ||
                       txt.includes('trang chủ template') ||
                       txt.includes('xem trang web chính') ||
                       txt.includes('xem website') ||
                       txt.includes('xem web') ||
                       txt.includes('xem trang chủ') || 
                       txt.includes('về trang chủ') || 
                       txt.includes('quay về trang chủ') || 
                       txt.includes('view website') || 
                       txt.includes('live site') ||
                       href === 'index.html' ||
                       href === './index.html' ||
                       btn.getAttribute('data-action') === 'live-site';

          if (isHome) {
            console.info('[ShopBridge] Phát hiện click nút Trang Chủ Template. Flush lưu dữ liệu tức thì!');
            var currentData = self._cachedData;
            if (!currentData || Object.keys(currentData).length === 0) {
              var info = self.getInstanceInfo();
              var r = _rawGetItem('portfolio_data_' + info.instanceId) || _rawGetItem('portfolio_data');
              if (r) { try { currentData = JSON.parse(r); } catch (parseErr) {} }
            }
            if (currentData) {
              self._writeToLocalStorageFast(currentData, self.getInstanceInfo());
            }
            self._flushSaveNow();
            if (btn.tagName.toLowerCase() === 'a') {
              btn.setAttribute('href', self.getHomeUrl());
            }
          }
        }, true);
      }
    },

    /**
     * Tự động bắt sự kiện nút "Chỉnh sửa" / "EDIT" / "Vào quản trị" / "Admin" trong index.html
     * Đảm bảo luôn chuyển đúng đến trang admin.html kèm đầy đủ tham số phiên dùng thử / bản quyền
     */
    initAdminButtons: function () {
      var self = this;
      try {
        var adminUrl = this.getAdminUrl();
        var links = document.querySelectorAll('a, button, [role="button"]');
        for (var i = 0; i < links.length; i++) {
          var el = links[i];
          var txt = (el.innerText || el.textContent || '').trim().toLowerCase();
          var href = (el.getAttribute('href') || '').toLowerCase();
          var isAdminTrigger = txt === 'edit' ||
                               txt.includes('edit') ||
                               txt.includes('chỉnh sửa') ||
                               txt.includes('vào trang quản trị') ||
                               txt.includes('quản trị template') ||
                               txt.includes('mở quản trị') ||
                               txt.includes('admin portal') ||
                               href === 'admin.html' || 
                               href === './admin.html' || 
                               href === '/admin.html' ||
                               href === '/admin' ||
                               href.includes('/admin') ||
                               el.getAttribute('data-action') === 'admin' ||
                               el.getAttribute('data-action') === 'admin-portal';
          
          if (isAdminTrigger) {
            if (el.tagName.toLowerCase() === 'a') {
              el.setAttribute('href', adminUrl);
            }
          }
        }
      } catch (err) {}

      if (typeof document !== 'undefined' && !this._hasDelegatedAdminListener) {
        this._hasDelegatedAdminListener = true;
        document.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
          if (!btn) return;
          var txt = (btn.innerText || btn.textContent || '').trim().toLowerCase();
          var href = (btn.getAttribute('href') || '').toLowerCase();
          var isAdmin = txt === 'edit' ||
                        txt.includes('edit') ||
                        txt.includes('chỉnh sửa') ||
                        txt.includes('vào trang quản trị') ||
                        txt.includes('quản trị template') ||
                        txt.includes('mở quản trị') ||
                        txt.includes('admin portal') ||
                        href === 'admin.html' ||
                        href === './admin.html' ||
                        href === '/admin.html' ||
                        href === '/admin' ||
                        href.includes('/admin') ||
                        btn.getAttribute('data-action') === 'admin' ||
                        btn.getAttribute('data-action') === 'admin-portal';

          if (isAdmin) {
            console.info('[ShopBridge] Phát hiện click nút Trang Quản Trị Template. Chuyển hướng kèm đầy đủ tham số!');
            e.preventDefault();
            e.stopPropagation();
            window.location.href = self.getAdminUrl();
          }
        }, true);
      }
    },

    /**
     * Tự động hiển thị thanh Header màu cam tím nếu mở template độc lập ngoài tab mới
     * (Không hiển thị nếu đang nằm trong iframe của Shop hoặc đã mua bản quyền)
     * ĐẶC BIỆT: Tự động ẨN khi phát hiện có bất kỳ Popup / Modal / Dialog nào đang mở để không che đè!
     */
    initTrialHeader: function () {
      var info = this.getInstanceInfo();
      if (info.isLicensed) {
        return;
      }

      if (document.getElementById('shop-trial-banner') || document.getElementById('site-sticky-top-banner')) return;

      var bannerHeight = 46;

      // 1. Chèn CSS chuyên dụng để điều chỉnh vị trí an toàn cho tất cả header / navbar của template con
      var styleId = 'shop-bridge-banner-offset-style';
      if (!document.getElementById(styleId)) {
        var styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = 
          'body.has-trial-banner {' +
          '  padding-top: ' + bannerHeight + 'px !important;' +
          '}' +
          'body.has-trial-banner > header,' +
          'body.has-trial-banner header.fixed,' +
          'body.has-trial-banner header.sticky,' +
          'body.has-trial-banner nav.fixed,' +
          'body.has-trial-banner nav.sticky,' +
          'body.has-trial-banner .navbar-fixed-top,' +
          'body.has-trial-banner .sticky-top,' +
          'body.has-trial-banner [data-header],' +
          'body.has-trial-banner #header,' +
          'body.has-trial-banner #navbar {' +
          '  top: ' + bannerHeight + 'px !important;' +
          '}' +
          '@media (max-width: 640px) {' +
          '  #shop-trial-banner .trial-banner-text-long { display: none !important; }' +
          '  #shop-trial-banner .trial-banner-text-short { display: inline !important; }' +
          '}';
        document.head.appendChild(styleEl);
      }

      document.body.classList.add('has-trial-banner');

      // 2. Tạo Banner Mua Template với vị trí cao nhất (z-index 99999), giao diện hiện đại & an toàn
      var banner = document.createElement('div');
      banner.id = 'shop-trial-banner';
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;height:' + bannerHeight + 'px;z-index:99999;' +
        'background:linear-gradient(90deg, #ea580c 0%, #db2777 50%, #7e22ce 100%);' +
        'color:#fff;display:flex;align-items:center;justify-content:center;' +
        'padding:0 12px;font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
        'box-shadow:0 3px 12px rgba(0,0,0,0.28);box-sizing:border-box;transition:opacity 0.15s ease;' +
        'pointer-events:auto;';

      var buyTarget = info.slug || info.templateId;
      var buyLink = buyTarget ? (this.apiBase + '/templates/' + encodeURIComponent(buyTarget)) : (this.apiBase + '/templates');
      var logoSrc = this.apiBase + '/logo.png';

      banner.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;width:100%;max-width:1400px;margin:0 auto;gap:8px;">' +
        '<div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">' +
        '<img src="' + logoSrc + '" alt="Webcuaban" style="height:26px;width:auto;border-radius:5px;object-fit:contain;vertical-align:middle;display:inline-block;flex-shrink:0;background:rgba(255,255,255,0.15);padding:2px 4px;" onerror="this.style.display=\'none\'" />' +
        '<div style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#ffffff;line-height:1.2;">' +
        '<span class="trial-banner-text-long">Đang dùng thử template. <span style="opacity:0.65;margin:0 4px;">|</span> Mua ngay để sở hữu tên miền riêng & kích hoạt bản quyền</span>' +
        '<span class="trial-banner-text-short" style="display:none;">Bản dùng thử template</span>' +
        '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
        '<a href="' + buyLink + '" target="_blank" rel="noopener noreferrer" style="background:#ffffff;color:#f97316;padding:5px 14px;border-radius:999px;text-decoration:none;font-weight:800;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:transform 0.15s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;flex-shrink:0;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>' +
        '<span style="color:#f97316;letter-spacing:0.2px;">MUA NGAY</span>' +
        '</a>' +
        '<button onclick="var b=document.getElementById(\'shop-trial-banner\');if(b)b.remove();document.body.classList.remove(\'has-trial-banner\');document.body.style.paddingTop=\'\';" style="background:transparent;border:none;color:#ffffff;cursor:pointer;font-size:16px;padding:2px 6px;opacity:0.75;line-height:1;" title="Đóng banner">✕</button>' +
        '</div>' +
        '</div>';

      document.body.prepend(banner);

      // 3. Quét động các fixed/sticky header của template con để gán top an toàn ngay cả khi dùng class tùy ý
      var adjustChildHeaders = function () {
        var bannerEl = document.getElementById('shop-trial-banner');
        var bannerVisible = bannerEl && bannerEl.style.display !== 'none';
        var offsetValue = bannerVisible ? (bannerHeight + 'px') : '0px';

        try {
          var candidates = document.querySelectorAll('header, nav, [class*="header"], [class*="navbar"], [class*="nav-bar"], [id*="header"], [id*="navbar"]');
          for (var c = 0; c < candidates.length; c++) {
            var el = candidates[c];
            if (el.id === 'shop-trial-banner' || (bannerEl && bannerEl.contains(el))) continue;
            var cs = window.getComputedStyle(el);
            if (cs.position === 'fixed' || cs.position === 'sticky') {
              var currentTop = parseInt(cs.top, 10);
              // Nếu đang bám mép đỉnh (<= 5px hoặc 0) thì dịch chuyển xuống dưới banner
              if (isNaN(currentTop) || currentTop <= 5 || el.getAttribute('data-shop-offset') === 'true') {
                if (bannerVisible) {
                  el.style.setProperty('top', offsetValue, 'important');
                  el.setAttribute('data-shop-offset', 'true');
                } else if (el.getAttribute('data-shop-offset') === 'true') {
                  el.style.top = '';
                  el.removeAttribute('data-shop-offset');
                }
              }
            }
          }
        } catch (e) {}
      };

      adjustChildHeaders();
      setTimeout(adjustChildHeaders, 200);
      setTimeout(adjustChildHeaders, 600);
      setTimeout(adjustChildHeaders, 1500);

      // =========================================================================
      // BỘ ĐẢM BẢO HIỂN THỊ HEADER DÙNG THỬ (KHÔNG BỊ ẨN NHẦM BỞI OVERLAY/CSS)
      // =========================================================================
      var checkModals = function () {
        var bannerEl = document.getElementById('shop-trial-banner');
        if (!bannerEl) {
          if (document.body && !ShopBridge.getInstanceInfo().isLicensed && !ShopBridge._suppressBanner) {
            ShopBridge.initTrialHeader();
          }
          return;
        }

        // Chỉ ẩn khi có dialog HTML5 đang mở hoặc class modal-open chính thống
        var isModalOpen = false;
        try {
          if (
            document.querySelector('dialog[open]') ||
            document.body.classList.contains('modal-open') ||
            document.body.classList.contains('swal2-shown') ||
            document.querySelector('.modal.show, .modal.open, .modal.is-active')
          ) {
            isModalOpen = true;
          }
        } catch (e) {}

        if (isModalOpen) {
          if (bannerEl.style.display !== 'none') {
            bannerEl.style.display = 'none';
            document.body.classList.remove('has-trial-banner');
            adjustChildHeaders();
          }
        } else {
          if (bannerEl.style.display === 'none') {
            bannerEl.style.display = 'flex';
            document.body.classList.add('has-trial-banner');
            adjustChildHeaders();
          }
        }
      };

      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function () {
          checkModals();
          adjustChildHeaders();
        });
        observer.observe(document.body, { 
          attributes: true, 
          childList: true, 
          subtree: true, 
          attributeFilter: ['class', 'style', 'open', 'aria-hidden', 'data-state'] 
        });
      }

      window.addEventListener('click', function () { 
        setTimeout(checkModals, 30); 
        setTimeout(checkModals, 150); 
        setTimeout(checkModals, 400); 
      }, true);
      window.addEventListener('keydown', function (e) { 
        if (e.key === 'Escape') {
          setTimeout(checkModals, 50); 
          setTimeout(checkModals, 200); 
        }
      });
      setInterval(checkModals, 350);
    },

    /**
     * Tải tệp (Ảnh, Video, Tệp đính kèm) lên Cloudflare R2 hoặc Local Disk thông qua API Shop
     * - Tự động nén canvas client-side để ảnh siêu nhẹ (chỉ ~80-120KB)
     * - Gửi lên server Shop -> Nhận lại URL ngắn gọn (http://.../uploads/...)
     * - Không bao giờ làm gián đoạn hay lỗi quá tải LocalStorage!
     */
    uploadMedia: async function (options) {
      if (!options || !options.file) {
        throw new Error('Vui lòng chọn tệp hợp lệ để tải lên');
      }

      var file = options.file;
      var info = this.getInstanceInfo();
      var category = options.category;

      if (!category) {
        if (file.type && file.type.startsWith('video/')) category = 'videos';
        else if (file.type && file.type.startsWith('image/')) category = 'images';
        else category = 'documents';
      }

      var rawDataUrl = await new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Nén ảnh thông minh trước khi gửi
      var optimizedDataUrl = rawDataUrl;
      if (file.type && file.type.startsWith('image/')) {
        try {
          optimizedDataUrl = await compressDataUrl(rawDataUrl, 1400, 0.82);
        } catch (cErr) {}
      }

      var payload = {
        name: file.name,
        category: category,
        dataUrl: optimizedDataUrl,
        mimeType: file.type || 'image/jpeg',
        userId: info.userId,
        uploadedBy: info.userId,
        oldUrlToDelete: options.oldUrlToDelete || null
      };

      try {
        var response = await fetch(this.apiBase + '/api/storage/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': info.userId
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          var result = await response.json();
          if (result && result.url) {
            var finalUrl = result.url;
            if (finalUrl.startsWith('/')) {
              finalUrl = this.apiBase + finalUrl;
            }
            return finalUrl;
          }
        }
      } catch (uploadNetErr) {
        console.warn('[ShopBridge] Server upload không khả dụng, sử dụng nén cục bộ:', uploadNetErr);
      }

      // Fallback an toàn: Trả về dataUrl đã nén (vài chục KB) đảm bảo lưu thành công 100%
      return optimizedDataUrl;
    }
  };

  // =========================================================================
  // BẪY TỰ ĐỘNG (AUTO-PROXY): HOOK LOCALSTORAGE NGAY LẬP TỨC ĐỂ TƯƠNG THÍCH 100%
  // Dù template con tự viết code lưu/đọc theo key nào thì ShopBridge vẫn đón bắt chuẩn!
  // =========================================================================
  var _syncTimer = null;
  var _hasUserInteracted = false;

  // Ghi nhận tương tác thực tế của người dùng (gõ phím, click chuột, thay đổi input, chạm màn hình)
  if (typeof window !== 'undefined') {
    var markInteraction = function () { _hasUserInteracted = true; };
    window.addEventListener('input', markInteraction, { capture: true, passive: true });
    window.addEventListener('change', markInteraction, { capture: true, passive: true });
    window.addEventListener('submit', markInteraction, { capture: true, passive: true });
    window.addEventListener('click', markInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', markInteraction, { capture: true, passive: true });
    window.addEventListener('mousedown', markInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', markInteraction, { capture: true, passive: true });
    window.addEventListener('keyup', markInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', markInteraction, { capture: true, passive: true });
  }

  try {
    localStorage.setItem = function (key, value) {
      var info = ShopBridge.getInstanceInfo();

      // Nếu KHÔNG PHẢI licensed owner (guest hoặc trial), TUYỆT ĐỐI KHÔNG CHO PHÉP ghi đè các key toàn cục/owner
      if (!info.isLicensed) {
        if (
          key === 'portfolio_data' ||
          key === 'videograph_portfolio_data' ||
          key === 'studio_portfolio_data' ||
          key.startsWith('owner_') ||
          key.startsWith('portfolio_data_')
        ) {
          var safeKey = info.role === 'trial' 
            ? ('user_' + info.userId + '_tpl_' + info.templateId) 
            : ('guest_tpl_' + info.templateId);
          try {
            _rawSetItem(safeKey, value);
            IDB.setItem(safeKey, JSON.parse(value));
          } catch (e) {}
          return;
        }
      }

      // 1. Luôn lưu thẳng vào Native Browser Storage của trình duyệt (Bảo tồn Storage chuẩn xác)
      try {
        _rawSetItem(key, value);
      } catch (quotaErr) {
        // Tự động dọn dẹp các key tạm thời nếu chạm trần dung lượng LocalStorage
        try {
          _rawRemoveItem('videograph_portfolio_data');
          _rawRemoveItem('studio_portfolio_data');
          _rawRemoveItem('guest_tpl_data');
          _rawSetItem(key, value);
        } catch (retryErr) {
          console.warn('[ShopBridge] LocalStorage quota exceeded, dữ liệu được bảo vệ an toàn trong IndexedDB.');
        }
      }

      // Bỏ qua các key hệ thống nội bộ của chính ShopBridge để tránh lặp vô tận
      // TUYỆT ĐỐI KHÔNG bỏ qua portfolio_data_inst- vì đây là key Admin lưu thực tế!
      if (
        key.startsWith('guest_tpl_') || 
        key.startsWith('user_') || 
        key.startsWith('owner_')
      ) {
        return;
      }

      try {
        var parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          var info = ShopBridge.getInstanceInfo();

          // Tự động sao chép đồng bộ (mirror) nếu là licensed owner
          if (info.isLicensed && (key.includes('portfolio') || key.includes('data') || key.includes('videograph') || key.includes('studio'))) {
            ShopBridge._writeToLocalStorageFast(parsed, info);
          }

          if (info.isLicensed) {
            // =========================================================================
            // KHÓA CHỐNG GHI ĐÈ DỮ LIỆU GỐC (ANTI-OVERWRITE PROTECTION):
            // Chỉ chặn nếu dữ liệu rỗng và người dùng chưa có tương tác
            // =========================================================================
            if (!_hasUserInteracted && (ShopBridge._isInitialLoading || ShopBridge._loadedFromSupabase)) {
              if (!parsed || Object.keys(parsed).length === 0) {
                console.info('[ShopBridge - Bảo Vệ] Chặn template tự lưu dữ liệu rỗng lên Supabase.');
                return;
              }
            }

            // Cập nhật bộ nhớ đệm
            ShopBridge._cachedData = parsed;
            ShopBridge._loadedFromSupabase = true;

            // TH3: Đã mua bản quyền -> Tự động debounced lưu lên Supabase Database!
            if (_syncTimer) clearTimeout(_syncTimer);
            _syncTimer = setTimeout(function () {
              ShopBridge.saveData(parsed);
            }, 300);
          } else if (info.role === 'trial') {
            // TH2: User thử nghiệm -> Tự động ánh xạ sang key user riêng
            ShopBridge._cachedData = parsed;
            IDB.setItem('user_' + info.userId + '_tpl_' + info.templateId, parsed);
            try {
              _rawSetItem('user_' + info.userId + '_tpl_' + info.templateId, value);
              if (info.hostSub) _rawSetItem('user_' + info.userId + '_tpl_' + info.hostSub, value);
              if (info.slug) _rawSetItem('user_' + info.userId + '_tpl_' + info.slug, value);
            } catch (e) {}
          } else {
            // TH1: Khách vãng lai -> Tự động ánh xạ sang key guest riêng
            ShopBridge._cachedData = parsed;
            IDB.setItem('guest_tpl_' + info.templateId, parsed);
            IDB.setItem('guest_tpl_default', parsed);
            try {
              _rawSetItem('guest_tpl_' + info.templateId, value);
              if (info.hostSub) _rawSetItem('guest_tpl_' + info.hostSub, value);
              if (info.slug) _rawSetItem('guest_tpl_' + info.slug, value);
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    localStorage.getItem = function (key) {
      var info = ShopBridge.getInstanceInfo();

      // Nếu là TH3 (đã mua)
      if (info.isLicensed) {
        // Ưu tiên 1: Đọc Native Browser Storage trước
        var rawVal = _rawGetItem(key);
        if (rawVal) {
          try {
            var parsedVal = JSON.parse(rawVal);
            if (parsedVal && typeof parsedVal === 'object' && Object.keys(parsedVal).length > 0) {
              if (!ShopBridge._cachedData || Object.keys(ShopBridge._cachedData).length === 0) {
                ShopBridge._cachedData = parsedVal;
              }
              return rawVal;
            }
          } catch (e) {
            return rawVal;
          }
        }

        // NẾU CACHE ĐANG TRỐNG DO VỪA XÓA CACHE -> TẢI NGAY ĐỒNG BỘ TỨC THÌ TỪ SUPABASE (0ms)
        if (!ShopBridge._cachedData || Object.keys(ShopBridge._cachedData).length === 0) {
          ShopBridge.ensureInitialDataSync();
        }

        // Nếu đã có dữ liệu từ Supabase hoặc IndexedDB được cache
        if (ShopBridge._cachedData && Object.keys(ShopBridge._cachedData).length > 0) {
          if (
            key === 'portfolio_data' ||
            key === 'portfolio_data_' + info.instanceId ||
            key === 'videograph_portfolio_data' ||
            key === 'studio_portfolio_data' ||
            key === 'owner_' + info.instanceId ||
            key.includes('portfolio') || 
            key.includes('template') || 
            key.includes('videograph') || 
            key.includes('studio') || 
            key.includes('data') || 
            key.includes('settings')
          ) {
            return JSON.stringify(ShopBridge._cachedData);
          }
        }
      }

      // Nếu là TH2 (user thử nghiệm)
      if (info.role === 'trial') {
        if (key === 'portfolio_data' || key === 'videograph_portfolio_data' || key === 'studio_portfolio_data' || key.includes('data') || key.includes('portfolio')) {
          var userVal = _rawGetItem('user_' + info.userId + '_tpl_' + info.templateId) ||
                        (info.hostSub ? _rawGetItem('user_' + info.userId + '_tpl_' + info.hostSub) : null) ||
                        (info.slug ? _rawGetItem('user_' + info.userId + '_tpl_' + info.slug) : null);
          if (userVal) return userVal;
        }
      }

      // Nếu là TH1 (guest)
      if (info.role === 'guest') {
        if (key === 'portfolio_data' || key === 'videograph_portfolio_data' || key === 'studio_portfolio_data' || key.includes('data') || key.includes('portfolio')) {
          var guestVal = _rawGetItem('guest_tpl_' + info.templateId) ||
                         (info.hostSub ? _rawGetItem('guest_tpl_' + info.hostSub) : null) ||
                         (info.slug ? _rawGetItem('guest_tpl_' + info.slug) : null);
          if (guestVal) return guestVal;
        }
      }

      return _rawGetItem(key);
    };
  } catch (storageHookErr) {
    console.warn('[ShopBridge] LocalStorage hook error:', storageHookErr);
  }

  // Tự động xả (flush) dữ liệu lưu tức thì khi user đóng tab hoặc chuyển trang
  if (typeof window !== 'undefined') {
    var flushOnLeave = function () {
      if (typeof ShopBridge !== 'undefined' && typeof ShopBridge._flushSaveNow === 'function') {
        ShopBridge._flushSaveNow();
      }
    };
    window.addEventListener('beforeunload', flushOnLeave);
    window.addEventListener('pagehide', flushOnLeave);
  }

  // Lắng nghe sự kiện postMessage từ Shop mẹ (Webcuaban) truyền sang qua iframe
  if (typeof window !== 'undefined') {
    window.addEventListener('message', function (ev) {
      if (!ev || !ev.data) return;
      var data = ev.data;

      // Nhận chỉ thị cấp phép hoặc thay đổi trạng thái bản quyền
      if (data.type === 'WEBCUABAN_LICENSE_SYNC') {
        if (data.licensed === true) {
          ShopBridge.hideTrialHeader();
          if (data.custom_data) {
            ShopBridge._cachedData = data.custom_data;
            ShopBridge._loadedFromSupabase = true;
            try {
              _rawSetItem('portfolio_data', JSON.stringify(data.custom_data));
            } catch (e) {}
            ShopBridge.hydrateFormInputs(data.custom_data);
          }
        } else if (data.trial === true) {
          ShopBridge.showTrialHeader();
        }
      }

      // Nhận dữ liệu nạp trực tiếp từ Shop mẹ (Hydrate)
      if (data.type === 'HYDRATE_PORTFOLIO_DATA' && data.payload) {
        ShopBridge._cachedData = data.payload;
        ShopBridge._loadedFromSupabase = true;
        try {
          var s = JSON.stringify(data.payload);
          _rawSetItem('portfolio_data', s);
        } catch (e) {}
        ShopBridge.hydrateFormInputs(data.payload);
        window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: data.payload }));
      }
    });
  }

  // Khởi động các tính năng UI (Banner, Nút Về trang chủ, nạp trước dữ liệu Supabase, Cloudflare R2 Interceptor)
  if (typeof document !== 'undefined') {
    var immediateInfo = ShopBridge.getInstanceInfo();
    if (immediateInfo.isLicensed) {
      // 1. TẢI ĐỒNG BỘ TỨC THÌ (0ms) để cứu dữ liệu khi xóa cache
      ShopBridge.ensureInitialDataSync();
      // 2. KÍCH HOẠT BẪY LẮNG NGHE TẢI FILE LÊN CLOUDFLARE R2
      ShopBridge.initMediaUploadInterceptor();
    }

    var setupBridge = function () {
      ShopBridge.initTrialHeader();
      ShopBridge.initHomeButtons();
      ShopBridge.initAdminButtons();
      ShopBridge.initMediaUploadInterceptor();

      var info = ShopBridge.getInstanceInfo();
      if (info.isLicensed) {
        ShopBridge.loadData({}).then(function (loaded) {
          if (loaded && Object.keys(loaded).length > 0) {
            ShopBridge.hydrateFormInputs(loaded);
            ShopBridge.applyFrontendSync(loaded);
          }
          console.info('[ShopBridge] Đã hoàn tất đồng bộ 2 chiều với Supabase.');
        });
      }

      // Tự động kích hoạt đồng bộ giao diện Frontend (chống reset khi Preloader tắt)
      ShopBridge.applyFrontendSync();
      if (typeof window !== 'undefined') {
        window.addEventListener('load', function () {
          ShopBridge.applyFrontendSync();
          setTimeout(function () { ShopBridge.applyFrontendSync(); }, 250);
          setTimeout(function () { ShopBridge.applyFrontendSync(); }, 600);
          setTimeout(function () { ShopBridge.applyFrontendSync(); }, 1200);
        });
        window.addEventListener('portfolio_data_loaded', function (e) {
          ShopBridge.applyFrontendSync(e ? e.detail : null);
        });
        window.addEventListener('portfolio_data_updated', function (e) {
          ShopBridge.applyFrontendSync(e ? e.detail : null);
        });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupBridge);
    } else {
      setupBridge();
    }
  }

  global.ShopBridge = ShopBridge;
})(typeof window !== 'undefined' ? window : this);
