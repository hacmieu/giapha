/**
 * autocomplete-search.js  — Generic autocomplete dropdown
 * Works with both client-side arrays and server-side AJAX.
 *
 * Usage:
 *   autocompleteInit(inputElement, {
 *       // DATA — provide ONE of these:
 *       data: [...],                           // client-side array of objects
 *       fetchUrl: '/api/members/',             // OR server-side URL (?q= appended)
 *
 *       // FIELDS
 *       displayField: 'name',                  // field to show as main text (default: 'name')
 *       valueField: 'id',                      // field to use as value (default: 'id')
 *       iconFn: null,                          // function(item) => icon string (optional)
 *       infoFn: null,                          // function(item) => secondary text (optional)
 *
 *       // BEHAVIOR
 *       minChars: 1,                           // min chars before search (default: 1)
 *       maxResults: 15,                        // max items shown (default: 15)
 *       debounceMs: 200,                       // debounce for AJAX (default: 200)
 *       onSelect: function(item) {},           // callback when item selected
 *       onClear: function() {},                // callback when cleared
 *       submitForm: false,                     // auto-submit parent form on select
 *   });
 *
 * Returns: { refresh(newData), destroy() }
 */
(function(global) {
    'use strict';

    function removeDiacritics(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').replace(/\u0110/g, 'D');
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function highlightMatch(text, query) {
        var idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return escapeHtml(text);
        return escapeHtml(text.substring(0, idx)) +
            '<span class="ac-highlight">' + escapeHtml(text.substring(idx, idx + query.length)) + '</span>' +
            escapeHtml(text.substring(idx + query.length));
    }

    function autocompleteInit(input, opts) {
        opts = opts || {};
        var displayField = opts.displayField || 'name';
        var valueField   = opts.valueField   || 'id';
        var minChars     = opts.minChars != null ? opts.minChars : 1;
        var maxResults   = opts.maxResults   || 15;
        var debounceMs   = opts.debounceMs   || 200;
        var iconFn       = opts.iconFn       || null;
        var infoFn       = opts.infoFn       || null;
        var onSelect     = opts.onSelect     || null;
        var onClear      = opts.onClear      || null;
        var submitForm   = opts.submitForm   || false;
        var fetchUrl     = opts.fetchUrl     || null;
        var clientData   = opts.data         || null;
        var selectedIdx  = -1;
        var debounceTimer = null;
        var abortCtrl    = null;

        // Create wrapper & dropdown
        var parent = input.parentNode;
        var wrapper = document.createElement('div');
        wrapper.className = 'ac-wrapper';
        wrapper.style.position = 'relative';
        parent.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Clear button
        var clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ac-clear';
        clearBtn.innerHTML = '&times;';
        clearBtn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;font-size:18px;color:#9ca3af;cursor:pointer;display:none;padding:0 4px;line-height:1;';
        wrapper.appendChild(clearBtn);

        // Dropdown
        var dropdown = document.createElement('div');
        dropdown.className = 'ac-dropdown';
        dropdown.style.cssText = 'position:absolute;z-index:999;width:100%;margin-top:4px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);max-height:280px;overflow-y:auto;display:none;';
        wrapper.appendChild(dropdown);

        input.setAttribute('autocomplete', 'off');

        function showDropdown() { dropdown.style.display = 'block'; }
        function hideDropdown() { dropdown.style.display = 'none'; selectedIdx = -1; }

        function renderItems(items, query) {
            selectedIdx = -1;
            if (!items || items.length === 0) {
                dropdown.innerHTML = '<div class="ac-empty" style="padding:10px 16px;color:#9ca3af;font-size:13px;">Không tìm thấy</div>';
                showDropdown();
                return;
            }
            dropdown.innerHTML = items.map(function(item, i) {
                var name = item[displayField] || '';
                var icon = iconFn ? iconFn(item) : '';
                var info = infoFn ? infoFn(item) : '';
                var highlighted = highlightMatch(name, query);
                return '<div class="ac-item" data-idx="' + i + '" style="display:flex;align-items:center;gap:8px;padding:8px 16px;cursor:pointer;transition:background .15s;">' +
                    (icon ? '<span style="font-size:16px;flex-shrink:0;">' + icon + '</span>' : '') +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:13px;font-weight:500;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + highlighted + '</div>' +
                        (info ? '<div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(info) + '</div>' : '') +
                    '</div></div>';
            }).join('');
            showDropdown();

            // Bind click
            var els = dropdown.querySelectorAll('.ac-item');
            for (var j = 0; j < els.length; j++) {
                (function(idx) {
                    els[idx].addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        pickItem(items[idx]);
                    });
                })(j);
            }
        }

        function pickItem(item) {
            input.value = item[displayField] || '';
            clearBtn.style.display = 'block';
            hideDropdown();
            if (onSelect) onSelect(item);
            if (submitForm) {
                var form = input.closest('form');
                if (form) form.submit();
            }
        }

        function highlightItem() {
            var els = dropdown.querySelectorAll('.ac-item');
            for (var k = 0; k < els.length; k++) {
                els[k].style.background = k === selectedIdx ? '#eff6ff' : '';
            }
            if (els[selectedIdx]) els[selectedIdx].scrollIntoView({ block: 'nearest' });
        }

        // Client-side filter
        function filterClient(query) {
            if (!clientData) return [];
            var q = query.toLowerCase();
            var qNorm = removeDiacritics(q);
            return clientData.filter(function(item) {
                var name = (item[displayField] || '').toLowerCase();
                return name.includes(q) || removeDiacritics(name).includes(qNorm);
            }).slice(0, maxResults);
        }

        // Server-side fetch
        function fetchServer(query) {
            if (abortCtrl) abortCtrl.abort();
            abortCtrl = new AbortController();
            var sep = fetchUrl.includes('?') ? '&' : '?';
            var url = fetchUrl + sep + 'q=' + encodeURIComponent(query) + '&page_size=' + maxResults;
            fetch(url, { signal: abortCtrl.signal })
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    var items = Array.isArray(data) ? data : (data.results || []);
                    renderItems(items, query);
                })
                .catch(function(err) {
                    if (err.name !== 'AbortError') console.error(err);
                });
        }

        function doSearch(query) {
            if (fetchUrl) {
                fetchServer(query);
            } else {
                renderItems(filterClient(query), query);
            }
        }

        // Events
        var currentItems = [];
        input.addEventListener('input', function() {
            var q = this.value.trim();
            clearBtn.style.display = q ? 'block' : 'none';
            if (q.length < minChars && minChars > 0) { hideDropdown(); return; }
            if (fetchUrl) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() { doSearch(q); }, debounceMs);
            } else {
                doSearch(q);
            }
        });

        input.addEventListener('keydown', function(e) {
            var els = dropdown.querySelectorAll('.ac-item');
            if (!els.length || dropdown.style.display === 'none') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, els.length - 1);
                highlightItem();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                highlightItem();
            } else if (e.key === 'Enter') {
                if (selectedIdx >= 0 && els[selectedIdx]) {
                    e.preventDefault();
                    els[selectedIdx].click();
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });

        input.addEventListener('focus', function() {
            var q = this.value.trim();
            if (q.length >= minChars || minChars === 0) doSearch(q);
        });

        clearBtn.addEventListener('click', function() {
            input.value = '';
            clearBtn.style.display = 'none';
            hideDropdown();
            input.focus();
            if (onClear) onClear();
        });

        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) hideDropdown();
        });

        return {
            refresh: function(newData) { clientData = newData; },
            setFetchUrl: function(url) { fetchUrl = url; },
            destroy: function() {
                wrapper.parentNode.insertBefore(input, wrapper);
                wrapper.parentNode.removeChild(wrapper);
            }
        };
    }

    // Inject minimal CSS
    var style = document.createElement('style');
    style.textContent = '.ac-highlight{background:#fef08a;font-weight:700;} .ac-item:hover{background:#eff6ff !important;} .ac-dropdown::-webkit-scrollbar{width:6px;} .ac-dropdown::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px;}';
    document.head.appendChild(style);

    global.autocompleteInit = autocompleteInit;
})(window);
