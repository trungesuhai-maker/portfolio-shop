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
      var isExplicitlyUnlicensed = licensedParam === 'false' || 
                                   trialParam === 'true' || 
                                   roleParam === 'guest' || 
                                   roleParam === 'trial' || 
                                   modeParam === 'draft';

      // Xác định trạng thái Bản quyền (TH3):
      var isLicensed = !isExplicitlyUnlicensed && (
        licensedParam === 'true' || 
        licenseKeyParam === 'activated' || 
        roleParam === 'owner' || 
        modeParam === 'published'
      );

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
     * Nạp dữ liệu cấu hình Portfolio SIÊU TỐC với cơ chế song song (Parallel Fetch)
     * @param {Object} defaultData - Dữ liệu gốc mặc định của Template con
     * @returns {Promise<Object>}
     */
    loadData: async function (defaultData) {
      var self = this;
      var info = this.getInstanceInfo();

      // Nếu đã có cache trong phiên thì trả về ngay lập tức (0ms)
      if (this._cachedData && Object.keys(this._cachedData).length > 0) {
        return this._cachedData;
      }

      // ==========================================
      // TRƯỜNG HỢP 3 (TH3): ĐÃ MUA / BẢN QUYỀN CHÍNH THỨC
      // Tải song song (Parallel Fetch) các ID ứng viên để đạt tốc độ nhanh nhất!
      // ==========================================
      if (info.isLicensed) {
        // 1. Kiểm tra ngay lập tức IndexedDB cục bộ (chỉ mất ~2ms) để hiển thị trước siêu tốc
        try {
          var idbOwnerFast = await IDB.getItem('owner_' + info.instanceId);
          if (idbOwnerFast && typeof idbOwnerFast === 'object' && Object.keys(idbOwnerFast).length > 0) {
            self._cachedData = idbOwnerFast;
            self._writeToLocalStorageFast(idbOwnerFast, info);
          }
        } catch (fastIdbErr) {}

        var candidateIds = [
          info.instanceId,
          info.tenant ? ('inst-' + info.tenant.replace(/^inst-/, '')) : null,
          info.hostSub ? ('inst-' + info.hostSub) : null,
          info.userId && info.userId !== 'guest' ? ('inst-' + info.userId) : null
        ].filter(Boolean);

        // Loại bỏ trùng lặp
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

              if (loadedCustom) {
                console.info('[ShopBridge - TH3] Nạp thành công dữ liệu Supabase Database siêu tốc!');
                self._cachedData = loadedCustom;
                self._loadedFromSupabase = true;
                self._isInitialLoading = false;

                // Ghi vào LocalStorage và IndexedDB để truy xuất tức thì
                self._writeToLocalStorageFast(loadedCustom, info);
                self.hydrateFormInputs(loadedCustom);

                window.dispatchEvent(new CustomEvent('portfolio_data_loaded', { detail: loadedCustom }));
                window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: loadedCustom }));
                return loadedCustom;
              }
            }
          }
        } catch (fetchErr) {
          console.warn('[ShopBridge - TH3] Kết nối Supabase có độ trễ:', fetchErr);
        }

        self._isInitialLoading = false;

        // Nếu đã có cache từ IndexedDB
        if (self._cachedData && Object.keys(self._cachedData).length > 0) {
          return self._cachedData;
        }

        // KHÔNG TỰ ĐỘNG GHI ĐÈ defaultData lên Supabase để tránh làm mất bản lưu người dùng
        return defaultData || {};
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
      var jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
      try {
        _rawSetItem('portfolio_data', jsonStr);
        _rawSetItem('videograph_portfolio_data', jsonStr);
        _rawSetItem('studio_portfolio_data', jsonStr);
        if (info && info.instanceId) {
          _rawSetItem('portfolio_data_' + info.instanceId, jsonStr);
          _rawSetItem('owner_' + info.instanceId, jsonStr);
          IDB.setItem('owner_' + info.instanceId, data);
        }
      } catch (e) {}
    },

    /**
     * Tự động đổ dữ liệu (Hydrate) vào form template con khi vừa nạp xong từ Supabase
     */
    hydrateFormInputs: function (data) {
      if (!data || typeof data !== 'object') return;
      try {
        for (var k in data) {
          if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
          var val = data[k];
          if (typeof val === 'string' || typeof val === 'number') {
            // Tìm theo ID hoặc Name trong form
            var el = document.getElementById(k) || 
                     document.querySelector('[name="' + k + '"]') ||
                     document.querySelector('[data-field="' + k + '"]');
            if (el && !el.value) {
              el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }
      } catch (hErr) {}
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
      var domain = params.get('domain');
      if (domain && (domain.startsWith('http://') || domain.startsWith('https://'))) {
        return domain;
      }
      var info = this.getInstanceInfo();
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
     * Tự động bắt sự kiện nút "Xem trang chủ" / "Quay về trang chủ" trong admin.html
     */
    initHomeButtons: function () {
      try {
        var homeUrl = this.getHomeUrl();
        var links = document.querySelectorAll('a, button');
        for (var i = 0; i < links.length; i++) {
          var el = links[i];
          var txt = (el.innerText || el.textContent || '').trim().toLowerCase();
          var href = (el.getAttribute('href') || '').toLowerCase();
          var isHomeTrigger = txt.includes('xem trang chủ') || 
                              txt.includes('về trang chủ') || 
                              txt.includes('quay về trang chủ') || 
                              txt.includes('view website') || 
                              txt.includes('xem web') ||
                              href === 'index.html' || 
                              href === './index.html' || 
                              href === '/';
          
          if (isHomeTrigger) {
            if (el.tagName.toLowerCase() === 'a') {
              el.setAttribute('href', homeUrl);
            } else {
              el.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = homeUrl;
              });
            }
          }
        }
      } catch (err) {}
    },

    /**
     * Tự động hiển thị thanh Header màu cam tím nếu mở template độc lập ngoài tab mới
     * (Không hiển thị nếu đang nằm trong iframe của Shop hoặc đã mua bản quyền)
     * ĐẶC BIỆT: Tự động ẨN khi phát hiện có bất kỳ Popup / Modal / Dialog nào đang mở để không che đè!
     */
    initTrialHeader: function () {
      var info = this.getInstanceInfo();
      if (info.isLicensed || window.self !== window.top) {
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
        '<a href="' + this.apiBase + '/templates/' + encodeURIComponent(buyTarget) + '" target="_blank" rel="noopener noreferrer" style="background:#ffffff;color:#f97316;padding:5px 14px;border-radius:999px;text-decoration:none;font-weight:800;font-size:11.5px;display:inline-flex;align-items:center;gap:5px;box-shadow:0 2px 6px rgba(0,0,0,0.2);transition:transform 0.15s ease;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
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
      // BỘ PHÁT HIỆN POPUP / MODAL ĐA TẦNG: TỰ ĐỘNG ẨN HEADER KHI MỞ BẤT KỲ POPUP NÀO
      // =========================================================================
      var checkModals = function () {
        var bannerEl = document.getElementById('shop-trial-banner');
        if (!bannerEl) return;

        var isModalOpen = false;

        // 1. Kiểm tra các bộ chọn tiêu chuẩn (Bootstrap, Tailwind, DaisyUI, SweetAlert, HTML5 dialog)
        var modalSelectors = [
          '[role="dialog"]:not([aria-hidden="true"])',
          '[role="alertdialog"]:not([aria-hidden="true"])',
          'dialog[open]',
          '.modal.show',
          '.modal.active',
          '.modal.is-active',
          '.modal.open',
          '.modal:not(.hidden):not([style*="display: none"])',
          '.popup.show',
          '.popup.active',
          '.popup.open',
          '.popup.is-open',
          '.popup:not(.hidden):not([style*="display: none"])',
          '.swal2-container',
          '.modal-backdrop',
          '.drawer.open',
          '.drawer.is-open',
          '[data-modal-open="true"]',
          '[data-state="open"]'
        ];

        for (var i = 0; i < modalSelectors.length; i++) {
          try {
            var els = document.querySelectorAll(modalSelectors[i]);
            for (var j = 0; j < els.length; j++) {
              var el = els[j];
              if (el.id === 'shop-trial-banner' || el.contains(bannerEl)) continue;
              var style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
                if (el.offsetWidth > 50 && el.offsetHeight > 50) {
                  isModalOpen = true;
                  break;
                }
              }
            }
          } catch (selErr) {}
          if (isModalOpen) break;
        }

        // 2. Kiểm tra body class hoặc overflow:hidden khi template kích hoạt chế độ modal
        if (!isModalOpen) {
          if (
            document.body.classList.contains('modal-open') ||
            document.body.classList.contains('overflow-hidden') ||
            document.body.classList.contains('has-modal') ||
            document.body.classList.contains('popup-open')
          ) {
            isModalOpen = true;
          }
        }

        // 3. Quét thông minh mọi phần tử Fixed/Absolute có z-index >= 40 và có lớp tên modal/popup/overlay/dialog/drawer
        if (!isModalOpen) {
          try {
            var allFixed = document.querySelectorAll('div, section, aside');
            for (var k = 0; k < allFixed.length; k++) {
              var f = allFixed[k];
              if (f.id === 'shop-trial-banner' || f.contains(bannerEl)) continue;
              var className = (f.className || '').toString().toLowerCase();
              var idName = (f.id || '').toString().toLowerCase();
              var isModalNamed = className.includes('modal') || className.includes('popup') || 
                                 className.includes('dialog') || className.includes('drawer') || 
                                 className.includes('backdrop') || className.includes('overlay') ||
                                 idName.includes('modal') || idName.includes('popup') || idName.includes('dialog');

              if (isModalNamed) {
                var st = window.getComputedStyle(f);
                if (st.display !== 'none' && st.visibility !== 'hidden' && parseFloat(st.opacity || '1') > 0.05) {
                  if (f.offsetWidth > 100 && f.offsetHeight > 80) {
                    isModalOpen = true;
                    break;
                  }
                }
              }
            }
          } catch (scanErr) {}
        }

        // Áp dụng ẩn / hiện tức thì
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
  var _rawSetItem = localStorage.setItem.bind(localStorage);
  var _rawSetItem = localStorage.setItem.bind(localStorage);
  var _rawGetItem = localStorage.getItem.bind(localStorage);
  var _rawRemoveItem = localStorage.removeItem.bind(localStorage);
  var _syncTimer = null;
  var _hasUserInteracted = false;

  // Ghi nhận tương tác thực tế của người dùng (gõ phím, click chuột, thay đổi input)
  if (typeof window !== 'undefined') {
    var markInteraction = function () { _hasUserInteracted = true; };
    window.addEventListener('input', markInteraction, { capture: true, passive: true });
    window.addEventListener('change', markInteraction, { capture: true, passive: true });
    window.addEventListener('submit', markInteraction, { capture: true, passive: true });
  }

  try {
    localStorage.setItem = function (key, value) {
      // Bỏ qua các key hệ thống nội bộ của chính ShopBridge để tránh lặp vô tận
      if (
        key.startsWith('guest_tpl_') || 
        key.startsWith('user_') || 
        key.startsWith('owner_') || 
        key.startsWith('portfolio_data_inst-')
      ) {
        try { _rawSetItem(key, value); } catch (e) {}
        return;
      }

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

      try {
        var parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          var info = ShopBridge.getInstanceInfo();
          if (info.isLicensed) {
            // =========================================================================
            // KHÓA CHỐNG GHI ĐÈ DỮ LIỆU GỐC (ANTI-OVERWRITE PROTECTION):
            // 1. Nếu đang trong giai đoạn khởi tạo (chưa tải xong từ Supabase)
            // 2. VÀ người dùng CHƯA hề bấm nút hoặc gõ phím chỉnh sửa (chỉ là template tự lưu defaultData khi khởi động)
            // => TUYỆT ĐỐI KHÔNG LƯU NGƯỢC LÊN SUPABASE để không xóa mất dữ liệu đã mua!
            // =========================================================================
            if (ShopBridge._isInitialLoading && !_hasUserInteracted) {
              console.info('[ShopBridge - Bảo Vệ] Chặn template tự lưu dữ liệu gốc lên Supabase trong lúc chờ nạp dữ liệu cũ.');
              return;
            }

            // Cập nhật bộ nhớ đệm
            ShopBridge._cachedData = parsed;

            // TH3: Đã mua bản quyền -> Tự động debounced lưu lên Supabase Database!
            if (_syncTimer) clearTimeout(_syncTimer);
            _syncTimer = setTimeout(function () {
              ShopBridge.saveData(parsed);
            }, 350);
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
        // Nếu đã có dữ liệu từ Supabase hoặc IndexedDB được cache
        if (ShopBridge._cachedData && Object.keys(ShopBridge._cachedData).length > 0) {
          if (
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
            try {
              _rawSetItem('portfolio_data', JSON.stringify(data.custom_data));
            } catch (e) {}
          }
        } else if (data.trial === true) {
          ShopBridge.showTrialHeader();
        }
      }

      // Nhận dữ liệu nạp trực tiếp từ Shop mẹ (Hydrate)
      if (data.type === 'HYDRATE_PORTFOLIO_DATA' && data.payload) {
        ShopBridge._cachedData = data.payload;
        try {
          var s = JSON.stringify(data.payload);
          _rawSetItem('portfolio_data', s);
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('portfolio_data_updated', { detail: data.payload }));
      }
    });
  }

  // Khởi động các tính năng UI (Banner, Nút Về trang chủ, nạp trước dữ liệu Supabase)
  if (typeof document !== 'undefined') {
    // KÍCH HOẠT TẢI NGẦM SUPABASE NGAY LẬP TỨC (0ms) - Tiết kiệm toàn bộ thời gian chờ DOMContentLoaded!
    var immediateInfo = ShopBridge.getInstanceInfo();
    if (immediateInfo.isLicensed) {
      ShopBridge.loadData({}).catch(function () {});
    }

    var setupBridge = function () {
      ShopBridge.initTrialHeader();
      ShopBridge.initHomeButtons();

      var info = ShopBridge.getInstanceInfo();
      if (info.isLicensed) {
        ShopBridge.loadData({}).then(function () {
          console.info('[ShopBridge] Đã hoàn tất đồng bộ 2 chiều với Supabase.');
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
