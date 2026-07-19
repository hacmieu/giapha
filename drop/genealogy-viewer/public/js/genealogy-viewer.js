/**
 * Genealogy Viewer - GoJS Integration (static / Cloudflare Drop)
 * Phả Đồ Gia Phả - Trần tộc Chanh Thôn / Họ Trần Chi 4
 *
 * Data source: ./data/gojs_data.json (no Django API)
 */

'use strict';

let genealogyData = null;
let myDiagram = null;
let personModalReturnFocus = null;

/** Relative path for static Drop package (override via window.GIAPHA_DATA_URL) */
var GIAPHA_STATIC_DATA_URL = (typeof window !== 'undefined' && window.GIAPHA_DATA_URL)
    ? window.GIAPHA_DATA_URL
    : './data/gojs_data.json';

var GIAPHA_ASSET_BASE = (typeof window !== 'undefined' && window.GIAPHA_ASSET_BASE)
    ? window.GIAPHA_ASSET_BASE
    : './';

function portraitUrl(kind) {
    var file = kind === 'spouse' ? 'img/portrait-spouse.svg' : 'img/portrait-dinh.svg';
    return GIAPHA_ASSET_BASE.replace(/\/?$/, '/') + file;
}

var GIAPHA_PORTRAIT_DINH = portraitUrl('dinh');
var GIAPHA_PORTRAIT_SPOUSE = portraitUrl('spouse');
// Màu sắc theo thế hệ
const GEN_COLORS = {
    4:  { bg: "#7c3aed", text: "#fff" },
    5:  { bg: "#1d4ed8", text: "#fff" },
    6:  { bg: "#0369a1", text: "#fff" },
    7:  { bg: "#047857", text: "#fff" },
    8:  { bg: "#b45309", text: "#fff" },
    9:  { bg: "#b91c1c", text: "#fff" },
    10: { bg: "#9d174d", text: "#fff" },
    11: { bg: "#374151", text: "#fff" },
    12: { bg: "#1f2937", text: "#fff" },
};

function getGenColor(gen) {
    return (GEN_COLORS[gen] || { bg: "#4b5563", text: "#fff" }).bg;
}

function getGivenInitial(name) {
    const parts = String(name || '').trim().split(/\s+/);
    return (parts[parts.length - 1] || 'T').charAt(0).toUpperCase();
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ──────────────────────────────────────────────
// Khởi tạo GoJS Diagram
// ──────────────────────────────────────────────
function initDiagram() {
    const $ = window.go.GraphObject.make;
    const go = window.go;

    myDiagram = $(go.Diagram, "myDiagramDiv", {
        "undoManager.isEnabled": false,
        allowDelete: false,
        allowCopy: false,
        layout: $(go.TreeLayout, {
            angle: 90,
            layerSpacing: 50,
            nodeSpacing: 15,
            compaction: go.TreeLayout.CompactionBlock,
            sorting: go.TreeLayout.SortingAscending
        }),
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
    });

    // Khi load: zoom 70% và đưa node Tổ (gốc cây) vào giữa trên cùng khung nhìn
    myDiagram.addDiagramListener("InitialLayoutCompleted", function() {
        applyInitialView();
    });

    // Zoom bằng chuột/chạm cũng cập nhật thanh trượt
    myDiagram.addDiagramListener("ViewportBoundsChanged", function() {
        syncZoomSlider();
    });

    // ── Node template: photo-card style ───────
    myDiagram.nodeTemplate = $(go.Node, "Auto",
        {
            cursor: "pointer",
            selectionAdorned: true,
            selectionAdornmentTemplate: $(go.Adornment, "Auto",
                $(go.Shape, "RoundedRectangle",
                    { fill: null, stroke: "#d50000", strokeWidth: 3, parameter1: 8 }),
                $(go.Placeholder)
            ),
            toolTip: $(go.Adornment, "Auto",
                $(go.Shape, { fill: "#fffde7", stroke: "#f59e0b", parameter1: 6 }),
                $(go.TextBlock, { margin: 8, font: "12px Arial", maxSize: new go.Size(220, NaN), wrap: go.TextBlock.WrapFit },
                    new go.Binding("text", "", function(d) {
                        let lines = [d.name];
                        if (d.spouses) lines.push("Vợ: " + d.spouses);
                        if (d.birthYear) lines.push("Năm sinh: " + d.birthYear);
                        if (d.location) lines.push("Nơi ở: " + d.location);
                        if (d.notes) lines.push("GC: " + d.notes);
                        return lines.join("\n");
                    })
                )
            ),
            click: function(e, node) { showPersonInfo(node.data); }
        },

        // Outer shape — fill & border based on generation
        $(go.Shape, "RoundedRectangle",
            { parameter1: 8, strokeWidth: 2 },
            new go.Binding("fill", "generation", function(gen) {
                if (gen === 4) return "#fef3c7";   // vàng nhạt — Tổ
                if (gen === 5) return "#eff6ff";   // xanh dương nhạt
                if (gen === 6) return "#f0f9ff";
                if (gen === 7) return "#f0fdf4";   // xanh lá nhạt
                if (gen === 8) return "#fff7ed";   // cam nhạt
                if (gen === 9) return "#fef2f2";   // đỏ nhạt
                return "#faf5ff";                  // tím nhạt — Đời 10-12
            }),
            new go.Binding("stroke", "generation", function(gen) {
                if (gen === 4)  return "#78350f";  // nâu — Tổ
                if (gen === 5)  return "#1d4ed8";  // xanh dương
                if (gen === 6)  return "#0369a1";
                if (gen === 7)  return "#047857";  // xanh lá
                if (gen === 8)  return "#b45309";  // cam
                if (gen === 9)  return "#b91c1c";  // đỏ
                if (gen === 10) return "#7e22ce";  // tím
                if (gen === 11) return "#6b21a8";
                return "#4c1d95";                  // Đời 12
            }),
            new go.Binding("strokeWidth", "generation", function(gen) {
                return gen === 4 ? 3 : 2;
            })
        ),

        // Kích thước cố định để mọi node cao bằng nhau
        $(go.Panel, "Vertical",
            {
                margin: new go.Margin(8, 8, 8, 8),
                desiredSize: new go.Size(108, 138),
                defaultAlignment: go.Spot.Center
            },

            // Portrait vẽ bằng shape GoJS (không phụ thuộc tải ảnh ngoài)
            $(go.Panel, "Spot",
                { margin: new go.Margin(0, 0, 6, 0) },
                // Nền + vùng cắt
                $(go.Panel, "Spot",
                    { isClipping: true },
                    $(go.Shape, "RoundedRectangle",
                        { width: 52, height: 62, parameter1: 6, strokeWidth: 0, fill: "#f2ead9" }),
                    // Vai áo theo màu thế hệ
                    $(go.Shape, "Ellipse",
                        {
                            width: 46, height: 34, strokeWidth: 0,
                            alignment: new go.Spot(0.5, 1, 0, 8)
                        },
                        new go.Binding("fill", "generation", getGenColor)
                    ),
                    // Đầu
                    $(go.Shape, "Circle",
                        {
                            width: 21, height: 21, strokeWidth: 0, fill: "#d9b28c",
                            alignment: new go.Spot(0.5, 0.32)
                        }
                    )
                ),
                // Viền khung portrait
                $(go.Shape, "RoundedRectangle",
                    { width: 52, height: 62, parameter1: 6, fill: null, strokeWidth: 1.5 },
                    new go.Binding("stroke", "generation", function(gen) {
                        return gen === 4 ? "#78350f" : "#c8943e";
                    })
                )
            ),

            // Name — cao cố định 2 dòng
            $(go.TextBlock,
                {
                    width: 104,
                    height: 32,
                    maxLines: 2,
                    overflow: go.TextBlock.OverflowEllipsis,
                    wrap: go.TextBlock.WrapFit,
                    textAlign: "center",
                    verticalAlignment: go.Spot.Center,
                    font: "bold 10pt 'Arial', sans-serif",
                    stroke: "#111827"
                },
                new go.Binding("text", "name")
            ),

            // Generation label
            $(go.TextBlock,
                {
                    font: "9pt Arial",
                    stroke: "#374151",
                    textAlign: "center",
                    margin: new go.Margin(2, 0, 0, 0)
                },
                new go.Binding("text", "generation", function(g) { return "Đời " + g; }),
                new go.Binding("stroke", "generation", function(gen) {
                    if (gen === 4)  return "#78350f";
                    if (gen <= 6)   return "#1e40af";
                    if (gen === 7)  return "#065f46";
                    if (gen === 8)  return "#92400e";
                    if (gen === 9)  return "#991b1b";
                    return "#6b21a8";
                })
            ),

            // Birth year — luôn giữ dòng để chiều cao đồng đều
            $(go.TextBlock,
                {
                    height: 12,
                    font: "8pt Arial",
                    stroke: "#6b7280",
                    textAlign: "center",
                    margin: new go.Margin(1, 0, 0, 0)
                },
                new go.Binding("text", "birthYear", function(y) { return y ? "(" + y + ")" : " "; })
            )
        )
    );

    // ── Link template ──────────────────────────
    myDiagram.linkTemplate = $(go.Link,
        { routing: go.Link.Orthogonal, corner: 6, selectable: false },
        $(go.Shape, { strokeWidth: 1.5, stroke: "#9ca3af" })
    );

    return myDiagram;
}

// ──────────────────────────────────────────────
// Load dữ liệu static JSON và render diagram
// ──────────────────────────────────────────────
function applyGenealogyData(data) {
    const diagramDiv = document.getElementById('myDiagramDiv');
    diagramDiv.innerHTML = '';
    genealogyData = data;

    if (!myDiagram) {
        initDiagram();
    }

    // Làm sạch fatherId: GoJS TreeModel chỉ chấp nhận undefined (không phải null)
    const validKeys = new Set(data.nodeDataArray.map(function(n) { return n.key; }));
    data.nodeDataArray.forEach(function(n) {
        if (!n.fatherId || !validKeys.has(n.fatherId)) {
            delete n.fatherId;   // phải dùng delete, không được gán null
        }
    });

    myDiagram.model = new window.go.TreeModel({
        nodeParentKeyProperty: "fatherId",
        nodeKeyProperty: "key",
        nodeDataArray: data.nodeDataArray
    });

    updateStats(data.metadata, data.nodeDataArray);
    populateGenerationFilter(data.nodeDataArray);
    initSearchAutocomplete();
    initPersonModal();
}

function loadStaticGenealogy(dataUrl) {
    const url = dataUrl || GIAPHA_STATIC_DATA_URL;
    const diagramDiv = document.getElementById('myDiagramDiv');
    diagramDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:16px;">⏳ Đang tải phả đồ...</div>';

    fetch(url)
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
            return r.json();
        })
        .then(applyGenealogyData)
        .catch(function(err) {
            diagramDiv.innerHTML = '<div style="color:red;padding:20px;">❌ Lỗi tải dữ liệu: ' + err.message +
                '<br><small>Mở qua HTTP (Cloudflare Drop / local server), không mở file:// trực tiếp.</small></div>';
        });
}

/** Backward-compatible aliases (Django viewer used IDs) */
function loadGenealogyById(_genealogyId) {
    loadStaticGenealogy();
}

function loadGenealogy() {
    loadStaticGenealogy();
}

// ──────────────────────────────────────────────
// Hiển thị hồ sơ thành viên trong modal
// ──────────────────────────────────────────────
function showPersonInfo(data) {
    if (!data) return;

    // Giữ vị trí ngữ cảnh: chọn và đưa node vào vùng nhìn trước khi mở hồ sơ.
    if (myDiagram) {
        const node = myDiagram.findNodeForKey(data.key);
        if (node) {
            myDiagram.select(node);
            myDiagram.commandHandler.scrollToPart(node);
        }
    }

    const modal = document.getElementById('personModal');
    if (!modal) return;

    const father = data.fatherId && genealogyData
        ? genealogyData.nodeDataArray.find(function(person) { return person.key === data.fatherId; })
        : null;
    const children = genealogyData
        ? genealogyData.nodeDataArray.filter(function(person) { return person.fatherId === data.key; })
        : [];
    const branchPeople = collectDescendants(data.key);
    const descendants = branchPeople.filter(function(person) { return person.key !== data.key; });
    const rootGeneration = Number(data.generation) || 0;
    const maxDescendantGeneration = branchPeople.reduce(function(max, person) {
        return Math.max(max, Number(person.generation) || max);
    }, rootGeneration);
    const fieldRaw = function(label, html, wide) {
        if (html === undefined || html === null || html === '') return '';
        return '<div class="profile-field' + (wide ? ' wide' : '') + '">' +
            '<span class="profile-label">' + escapeHtml(label) + '</span>' +
            '<span class="profile-value">' + html + '</span>' +
            '</div>';
    };
    const field = function(label, value, wide) {
        if (value === undefined || value === null || value === '') return '';
        return fieldRaw(label, escapeHtml(value), wide);
    };
    // Link mở hồ sơ người khác (điều hướng qua data-key, bắt sự kiện ở initPersonModal)
    const personLink = function(person) {
        return '<button type="button" class="person-link" data-key="' + escapeHtml(String(person.key)) + '">' +
            escapeHtml(person.name || 'Chưa rõ') + '</button>';
    };

    const portrait = document.getElementById('personPortrait');
    if (portrait) {
        portrait.src = data.photo || GIAPHA_PORTRAIT_DINH;
        portrait.alt = 'Portrait ' + (data.name || 'thành viên');
    }
    document.getElementById('personMonogram').textContent = getGivenInitial(data.name);
    document.getElementById('personGeneration').textContent = 'Đời ' + (data.generation || '--');
    document.getElementById('personModalName').textContent = data.name || 'Chưa rõ họ tên';
    document.getElementById('personModalId').textContent = 'Mã gia phả · ' + (data.key || 'Chưa xác định');

    let body = '<section class="profile-section" aria-labelledby="section-vitals">' +
        '<h3 id="section-vitals">Thân thế</h3><div class="profile-grid">' +
        field('Năm sinh', data.birthYear || 'Chưa ghi') +
        field('Nơi ở', data.location || 'Chưa ghi') +
        '</div></section>';

    body += '<section class="profile-section" aria-labelledby="section-family">' +
        '<h3 id="section-family">Gia đình</h3><div class="profile-grid">' +
        (father
            ? fieldRaw('Thân phụ', personLink(father))
            : field('Thân phụ', 'Chưa xác định')) +
        field('Phối ngẫu', data.spouses || 'Chưa ghi') +
        (children.length
            ? fieldRaw('Con trong phả đồ (' + children.length + ')',
                '<span class="person-link-list">' + children.map(personLink).join('') + '</span>', true)
            : field('Con trong phả đồ', 'Chưa ghi')) +
        '</div></section>';

    if (descendants.length) {
        let generationOptions = '<option value="">Tất cả con cháu (' + descendants.length +
            ' người · đến Đời ' + maxDescendantGeneration + ')</option>';
        for (let gen = rootGeneration + 1; gen <= maxDescendantGeneration; gen += 1) {
            generationOptions += '<option value="' + gen + '">Đến Đời ' + gen + '</option>';
        }
        body += '<section class="profile-section branch-builder" aria-labelledby="section-branch">' +
            '<h3 id="section-branch">Vẽ nhánh hậu duệ</h3>' +
            '<p>Chọn đời cuối cần xem. Mặc định lấy toàn bộ con cháu trong nhánh này.</p>' +
            '<div class="branch-builder-controls">' +
            '<select id="branchEndGeneration" class="branch-generation-select" data-root-key="' +
                escapeHtml(String(data.key)) + '" aria-label="Đời cuối của nhánh hậu duệ">' +
                generationOptions + '</select>' +
            '<button type="button" class="branch-draw-btn" onclick="drawDescendantBranchFromModal()">Vẽ phả đồ nhánh này</button>' +
            '</div></section>';
    } else {
        body += '<section class="profile-section branch-builder" aria-labelledby="section-branch">' +
            '<h3 id="section-branch">Vẽ nhánh hậu duệ</h3>' +
            '<p>Người này chưa có con cháu trong dữ liệu phả đồ.</p></section>';
    }

    if (data.notes) {
        body += '<section class="profile-section" aria-labelledby="section-notes">' +
            '<h3 id="section-notes">Ghi chép gia phả</h3>' +
            '<p class="profile-note">' + escapeHtml(data.notes) + '</p></section>';
    }

    document.getElementById('personModalBody').innerHTML = body;
    personModalReturnFocus = document.activeElement;

    if (typeof modal.showModal === 'function') {
        if (!modal.open) modal.showModal();
    } else {
        modal.setAttribute('open', '');
    }
}

function initPersonModal() {
    const modal = document.getElementById('personModal');
    if (!modal || modal.dataset.ready === 'true') return;
    modal.dataset.ready = 'true';

    modal.addEventListener('click', function(event) {
        if (event.target === modal) closePersonModal();

        // Điều hướng hồ sơ: click link Thân phụ / con → mở hồ sơ người đó
        const link = event.target.closest ? event.target.closest('.person-link') : null;
        if (link && genealogyData) {
            const person = genealogyData.nodeDataArray.find(function(p) {
                return String(p.key) === link.dataset.key;
            });
            if (person) showPersonInfo(person);
        }
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.open) {
            event.preventDefault();
            closePersonModal();
        }
    });
    modal.addEventListener('close', function() {
        if (personModalReturnFocus && typeof personModalReturnFocus.focus === 'function') {
            personModalReturnFocus.focus();
        }
        personModalReturnFocus = null;
    });
}

function closePersonModal() {
    const modal = document.getElementById('personModal');
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) {
        modal.close();
    } else {
        modal.removeAttribute('open');
    }
}

// ──────────────────────────────────────────────
// Cập nhật thống kê
// ──────────────────────────────────────────────
function updateStats(meta, people) {
    meta = meta || {};
    people = people || [];
    const el = function(id) { return document.getElementById(id); };
    const generations = people.map(function(person) { return Number(person.generation); })
        .filter(function(generation) { return Number.isFinite(generation); });
    const actualRange = generations.length
        ? [Math.min.apply(null, generations), Math.max.apply(null, generations)]
        : meta.generationRange;

    if (el('totalPeople')) {
        el('totalPeople').textContent = people.length || meta.totalPeople || 0;
    }
    if (el('totalRelationships')) {
        const relationshipCount = people.filter(function(person) { return !!person.fatherId; }).length;
        el('totalRelationships').textContent = relationshipCount || meta.totalRelationships || 0;
    }
    if (el('generationRange') && actualRange) {
        el('generationRange').textContent = actualRange[0] + '-' + actualRange[1];
    }
}

function populateGenerationFilter(people) {
    const select = document.getElementById('filterGeneration');
    if (!select) return;
    const generations = Array.from(new Set(people.map(function(person) {
        return Number(person.generation);
    }).filter(function(generation) {
        return Number.isFinite(generation);
    }))).sort(function(a, b) { return a - b; });

    select.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Tất Cả';
    select.appendChild(allOption);
    generations.forEach(function(generation) {
        const option = document.createElement('option');
        option.value = String(generation);
        option.textContent = 'Đến đời thứ ' + generation;
        select.appendChild(option);
    });
}

// ──────────────────────────────────────────────
// Tìm kiếm (autocomplete)
// ──────────────────────────────────────────────
var _searchAC = null;
function initSearchAutocomplete() {
    var input = document.getElementById('searchInput');
    if (!input || !genealogyData || typeof autocompleteInit === 'undefined') return;
    if (_searchAC) _searchAC.destroy();
    var acData = genealogyData.nodeDataArray.map(function(n) {
        return { id: n.key, name: n.name, gender: n.gender, generation: n.generation };
    });
    _searchAC = autocompleteInit(input, {
        data: acData,
        displayField: 'name',
        valueField: 'id',
        maxResults: 15,
        iconFn: function(item) { return item.gender === 'male' ? '👨' : '👩'; },
        infoFn: function(item) {
            return item.generation ? 'Đời ' + item.generation : '';
        },
        onSelect: function(item) {
            var match = genealogyData.nodeDataArray.find(function(n) { return n.key === item.id; });
            if (match && myDiagram) {
                setMobilePane('diagram');
                requestAnimationFrame(function() {
                    var node = myDiagram.findNodeForKey(match.key);
                    if (node) {
                        myDiagram.select(node);
                        myDiagram.commandHandler.scrollToPart(node);
                        showPersonInfo(match);
                    }
                });
            }
        }
    });
}

// Legacy compatibility
function searchPerson(query) {
    if (!genealogyData || !myDiagram || !query.trim()) return;
    const q = query.toLowerCase();
    const match = genealogyData.nodeDataArray.find(function(n) {
        return n.name.toLowerCase().includes(q) || n.key.includes(q);
    });
    if (match) {
        const node = myDiagram.findNodeForKey(match.key);
        if (node) {
            myDiagram.select(node);
            myDiagram.commandHandler.scrollToPart(node);
            showPersonInfo(match);
        }
    }
}

// ──────────────────────────────────────────────
// Vẽ riêng một nhánh hậu duệ
// ──────────────────────────────────────────────
var branchViewRootKey = null;

/** Lấy người gốc + toàn bộ con cháu, có thể dừng tại đời tuyệt đối endGeneration. */
function collectDescendants(rootKey, endGeneration) {
    if (!genealogyData || !genealogyData.nodeDataArray) return [];

    const allPeople = genealogyData.nodeDataArray;
    const root = allPeople.find(function(person) { return String(person.key) === String(rootKey); });
    if (!root) return [];

    const childrenByFather = new Map();
    allPeople.forEach(function(person) {
        if (!person.fatherId) return;
        const fatherKey = String(person.fatherId);
        if (!childrenByFather.has(fatherKey)) childrenByFather.set(fatherKey, []);
        childrenByFather.get(fatherKey).push(person);
    });

    const limit = endGeneration ? Number(endGeneration) : Infinity;
    const result = [];
    const queue = [root];
    const seen = new Set();

    while (queue.length) {
        const person = queue.shift();
        const key = String(person.key);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(person);

        const children = childrenByFather.get(key) || [];
        children.forEach(function(child) {
            const generation = Number(child.generation) || 0;
            if (generation <= limit) queue.push(child);
        });
    }
    return result;
}

function createTreeModel(nodes) {
    const keys = new Set(nodes.map(function(person) { return String(person.key); }));
    const copies = nodes.map(function(person) {
        const copy = Object.assign({}, person);
        if (!copy.fatherId || !keys.has(String(copy.fatherId))) delete copy.fatherId;
        return copy;
    });
    return new window.go.TreeModel({
        nodeParentKeyProperty: "fatherId",
        nodeKeyProperty: "key",
        nodeDataArray: copies
    });
}

function drawDescendantBranchFromModal() {
    const select = document.getElementById('branchEndGeneration');
    if (!select || !myDiagram) return;

    const rootKey = select.dataset.rootKey;
    const endGeneration = select.value ? Number(select.value) : null;
    const people = collectDescendants(rootKey, endGeneration);
    if (!people.length) return;

    const root = people[0];
    branchViewRootKey = rootKey;
    closePersonModal();
    setMobilePane('diagram');

    requestAnimationFrame(function() {
        myDiagram.model = createTreeModel(people);
        const banner = document.getElementById('branchViewBanner');
        const text = document.getElementById('branchViewText');
        if (text) {
            text.textContent = 'Nhánh ' + (root.name || 'Chưa rõ') + ' · ' +
                (endGeneration ? 'đến Đời ' + endGeneration : 'tất cả con cháu') +
                ' · ' + people.length + ' người';
        }
        if (banner) banner.removeAttribute('hidden');

        const generationFilter = document.getElementById('filterGeneration');
        if (generationFilter) generationFilter.value = '';
    });
}

function showFullTree() {
    if (!genealogyData || !myDiagram) return;
    branchViewRootKey = null;
    myDiagram.model = createTreeModel(genealogyData.nodeDataArray);

    const banner = document.getElementById('branchViewBanner');
    if (banner) banner.setAttribute('hidden', '');
    const generationFilter = document.getElementById('filterGeneration');
    if (generationFilter) generationFilter.value = '';
    setMobilePane('diagram');
}

// ──────────────────────────────────────────────
// Lọc theo thế hệ
// ──────────────────────────────────────────────
function filterByGeneration() {
    const gen = document.getElementById('filterGeneration').value;
    if (!myDiagram || !genealogyData) return;

    myDiagram.startTransaction("filter");
    myDiagram.nodes.each(function(node) {
        if (!gen) {
            node.visible = true;
        } else {
            // Giữ toàn bộ các đời trước để quan hệ cha-con không bị đứt.
            node.visible = Number(node.data.generation) <= Number(gen);
        }
    });
    // Ẩn link nếu cả 2 đầu đều ẩn
    myDiagram.links.each(function(link) {
        link.visible = link.fromNode && link.toNode &&
                       link.fromNode.visible && link.toNode.visible;
    });
    myDiagram.commitTransaction("filter");
    myDiagram.layout.invalidateLayout();
    myDiagram.layoutDiagram(true);
}

// ──────────────────────────────────────────────
// Thay đổi chế độ hiển thị
// ──────────────────────────────────────────────
function changeViewMode() {
    if (!myDiagram) return;
    const mode = document.getElementById('viewMode').value;
    if (mode === 'tree') {
        myDiagram.layout = window.go.GraphObject.make(window.go.TreeLayout, {
            angle: 90,
            layerSpacing: 40,
            nodeSpacing: 10,
            compaction: window.go.TreeLayout.CompactionBlock
        });
    } else {
        myDiagram.layout = window.go.GraphObject.make(window.go.ForceDirectedLayout, {
            defaultSpringLength: 60,
            defaultElectricalCharge: 200
        });
    }
}

// ──────────────────────────────────────────────
// Zoom / Di chuyển
// ──────────────────────────────────────────────
function zoomToFit()    { if (myDiagram) myDiagram.zoomToFit(); }
function centerDiagram(){ if (myDiagram) myDiagram.commandHandler.scrollToPart(myDiagram.nodes.first()); }

/** View mặc định: scale 0.7, node Tổ căn giữa ngang, cách mép trên 24px */
var initialViewPending = false;
function applyInitialView() {
    if (!myDiagram) return;
    // Div đang ẩn (mobile mở tab Điều khiển): hoãn tới khi tab Phả đồ được mở
    if (!myDiagram.div || myDiagram.div.offsetWidth === 0) {
        initialViewPending = true;
        return;
    }
    initialViewPending = false;
    myDiagram.scale = 0.7;
    var root = myDiagram.findTreeRoots().first();
    if (root) {
        var b = root.actualBounds;
        myDiagram.position = new window.go.Point(
            b.centerX - myDiagram.viewportBounds.width / 2,
            b.y - 24
        );
    }
}

function goToRoot() { applyInitialView(); }

/** Zoom bằng thanh trượt — neo vào tâm khung nhìn hiện tại */
function setDiagramZoom(value) {
    if (!myDiagram) return;
    var scale = parseFloat(value);
    if (!scale) return;
    var center = myDiagram.viewportBounds.center;
    myDiagram.scale = scale;
    myDiagram.centerRect(new window.go.Rect(center.x, center.y, 1, 1));
}

/** Đồng bộ thanh trượt khi zoom bằng chuột/chạm */
function syncZoomSlider() {
    var slider = document.getElementById('zoomSlider');
    if (!slider || !myDiagram) return;
    var s = Math.min(2, Math.max(0.2, myDiagram.scale));
    if (Math.abs(parseFloat(slider.value) - s) > 0.01) slider.value = s.toFixed(2);
}

function toggleDiagramControls() {
    var panel = document.getElementById('dcPanel');
    var toggle = document.querySelector('.dc-toggle');
    if (!panel) return;
    var willOpen = panel.hasAttribute('hidden');
    if (willOpen) {
        panel.removeAttribute('hidden');
        syncZoomSlider();
    } else {
        panel.setAttribute('hidden', '');
    }
    if (toggle) toggle.setAttribute('aria-expanded', String(willOpen));
}

/** Mobile: tách Phả đồ / Điều khiển thành 2 tab — mặc định chỉ hiện phả đồ full màn hình */
function setMobilePane(pane) {
    var showControls = pane === 'controls';
    document.body.classList.toggle('mobile-pane-controls', showControls);

    var tabDiagram = document.getElementById('tabDiagram');
    var tabControls = document.getElementById('tabControls');
    if (tabDiagram) {
        tabDiagram.classList.toggle('is-active', !showControls);
        tabDiagram.setAttribute('aria-selected', String(!showControls));
    }
    if (tabControls) {
        tabControls.classList.toggle('is-active', showControls);
        tabControls.setAttribute('aria-selected', String(showControls));
    }

    // Quay lại phả đồ: GoJS cần cập nhật kích thước div đã hiện lại
    if (!showControls && myDiagram) {
        requestAnimationFrame(function() {
            try {
                myDiagram.requestUpdate();
                if (initialViewPending) applyInitialView();
                if (typeof myDiagram.focus === 'function') myDiagram.focus();
            } catch (err) { /* ignore */ }
        });
    }
}

/** Pan theo hướng (dx, dy ∈ {-1,0,1}), bước ~60% khung nhìn */
function panDiagram(dx, dy) {
    if (!myDiagram) return;
    var vp = myDiagram.viewportBounds;
    myDiagram.position = new window.go.Point(
        myDiagram.position.x + dx * vp.width * 0.6,
        myDiagram.position.y + dy * vp.height * 0.6
    );
}

// ──────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────
function exportAsImage() {
    if (!myDiagram) return;
    const blob = myDiagram.makeImageData({
        scale: 1.5,
        background: "white",
        returnType: "blob",
        callback: function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'giapha.png';
            a.click();
            URL.revokeObjectURL(url);
        }
    });
}

function downloadJSON() {
    if (!genealogyData) return;
    const blob = new Blob([JSON.stringify(genealogyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'giapha_data.json';
    a.click();
    URL.revokeObjectURL(url);
}
