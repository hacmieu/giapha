/**
 * GoJS Diagram Search - Autocomplete component
 * Reusable across any GoJS diagram page.
 *
 * Usage:
 *   1. Include HTML snippet (see gojsSearchHTML())
 *   2. Call gojsSearchInit(diagram, options) after diagram is loaded
 *
 * Options:
 *   - wrapperId:   wrapper element id (default: 'search-wrapper')
 *   - inputId:     input element id (default: 'search-person')
 *   - dropdownId:  dropdown element id (default: 'search-dropdown')
 *   - clearBtnId:  clear button id (default: 'search-clear')
 *   - nameField:   node data field for name (default: 'n')
 *   - genderField: node data field for gender (default: 's')
 *   - extraInfo:   function(nodeData) => string for secondary line (optional)
 *   - onSelect:    function(node, diagram) => called after selecting (optional)
 *   - maxResults:  max dropdown items (default: 20)
 */

(function(global) {
    'use strict';

    // --- Helpers ---
    function removeDiacritics(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    function highlightMatch(name, query) {
        var idx = name.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return escapeHtml(name);
        return escapeHtml(name.substring(0, idx)) +
            '<span class="bg-yellow-200 font-bold">' + escapeHtml(name.substring(idx, idx + query.length)) + '</span>' +
            escapeHtml(name.substring(idx + query.length));
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function flashNode(node) {
        if (!node) return;
        var count = 0;
        var interval = setInterval(function() {
            node.opacity = node.opacity < 1 ? 1 : 0.3;
            count++;
            if (count >= 6) {
                clearInterval(interval);
                node.opacity = 1;
            }
        }, 200);
    }

    // --- Main ---
    function gojsSearchInit(diagram, opts) {
        opts = opts || {};
        var wrapperId   = opts.wrapperId   || 'search-wrapper';
        var inputId     = opts.inputId     || 'search-person';
        var dropdownId  = opts.dropdownId  || 'search-dropdown';
        var clearBtnId  = opts.clearBtnId  || 'search-clear';
        var nameField   = opts.nameField   || 'n';
        var genderField = opts.genderField || 's';
        var maxResults  = opts.maxResults  || 20;
        var extraInfo   = opts.extraInfo   || null;
        var onSelect    = opts.onSelect    || null;

        var input    = document.getElementById(inputId);
        var dropdown = document.getElementById(dropdownId);
        var clearBtn = document.getElementById(clearBtnId);
        var wrapper  = document.getElementById(wrapperId);

        if (!input || !dropdown || !wrapper) {
            console.warn('gojsSearchInit: missing DOM elements', wrapperId, inputId, dropdownId);
            return;
        }

        var searchData = [];
        var selectedIdx = -1;

        // Build search data from diagram model
        function refresh() {
            searchData = diagram.model.nodeDataArray
                .filter(function(n) { return n[nameField] && !n.isGroup; })
                .map(function(n) {
                    return {
                        key: n.key,
                        name: n[nameField],
                        gender: n[genderField],
                        _data: n
                    };
                })
                .sort(function(a, b) { return a.name.localeCompare(b.name); });
        }

        function showResults(query) {
            var q = query.toLowerCase();
            var qNorm = removeDiacritics(q);

            var matches = searchData.filter(function(d) {
                return d.name.toLowerCase().includes(q) || removeDiacritics(d.name.toLowerCase()).includes(qNorm);
            }).slice(0, maxResults);

            selectedIdx = -1;

            if (matches.length === 0) {
                dropdown.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400">Không tìm thấy</div>';
                dropdown.classList.remove('hidden');
                return;
            }

            dropdown.innerHTML = matches.map(function(m, i) {
                var icon = m.gender === 'male' ? '👨' : '👩';
                var info = extraInfo ? extraInfo(m._data) : '';
                var highlighted = highlightMatch(m.name, query);
                return '<div class="search-item flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-blue-50 transition" data-key="' + m.key + '" data-idx="' + i + '">' +
                    '<span class="text-lg">' + icon + '</span>' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="text-sm font-medium text-gray-800 truncate">' + highlighted + '</div>' +
                        (info ? '<div class="text-xs text-gray-500">' + escapeHtml(info) + '</div>' : '') +
                    '</div></div>';
            }).join('');
            dropdown.classList.remove('hidden');

            dropdown.querySelectorAll('.search-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    selectResult(parseInt(this.dataset.key));
                });
            });
        }

        function highlightItem(items) {
            items.forEach(function(el, i) {
                el.classList.toggle('bg-blue-50', i === selectedIdx);
            });
            if (items[selectedIdx]) items[selectedIdx].scrollIntoView({ block: 'nearest' });
        }

        function selectResult(key) {
            dropdown.classList.add('hidden');
            var nodeData = diagram.model.nodeDataArray.find(function(n) { return n.key === key; });
            if (!nodeData) return;
            input.value = nodeData[nameField];

            var node = diagram.findNodeForKey(key);
            if (node) {
                diagram.clearSelection();
                diagram.select(node);
                diagram.commandHandler.scrollToPart(node);
                flashNode(node);
                if (onSelect) onSelect(node, diagram);
            }
        }

        // --- Event listeners ---
        input.addEventListener('input', function() {
            var q = this.value.trim();
            if (clearBtn) clearBtn.classList.toggle('hidden', !q);
            if (q.length < 1) { dropdown.classList.add('hidden'); return; }
            showResults(q);
        });

        input.addEventListener('keydown', function(e) {
            var items = dropdown.querySelectorAll('.search-item');
            if (!items.length || dropdown.classList.contains('hidden')) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
                highlightItem(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIdx = Math.max(selectedIdx - 1, 0);
                highlightItem(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIdx >= 0 && items[selectedIdx]) {
                    items[selectedIdx].click();
                } else if (items.length > 0) {
                    items[0].click();
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.add('hidden');
            }
        });

        input.addEventListener('focus', function() {
            if (this.value.trim().length >= 1) showResults(this.value.trim());
        });

        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                input.value = '';
                dropdown.classList.add('hidden');
                clearBtn.classList.add('hidden');
                input.focus();
            });
        }

        // Initial data build
        refresh();

        // Return API for external use
        return { refresh: refresh };
    }

    // Expose globally
    global.gojsSearchInit = gojsSearchInit;
    global.gojsFlashNode = flashNode;

})(window);
