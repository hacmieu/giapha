/**
 * Genealogy Viewer - GoJS Integration (static / Cloudflare Drop)
 * Phả Đồ Gia Phả - Họ Trần Chi 4
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
        initialAutoScale: go.Diagram.Fit,
        contentAlignment: go.Spot.TopCenter,
        layout: $(go.TreeLayout, {
            angle: 90,
            layerSpacing: 50,
            nodeSpacing: 15,
            compaction: go.TreeLayout.CompactionBlock,
            sorting: go.TreeLayout.SortingAscending
        }),
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
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

        $(go.Panel, "Vertical",
            { margin: new go.Margin(8, 8, 8, 8), minSize: new go.Size(90, NaN) },

            // Monogram: tránh tải hàng trăm ảnh placeholder không tồn tại
            $(go.Panel, "Spot",
                { margin: new go.Margin(0, 0, 6, 0) },
                $(go.Shape, "Circle",
                    { width: 34, height: 34, strokeWidth: 1.5 },
                    new go.Binding("fill", "generation", function(gen) {
                        return getGenColor(gen);
                    }),
                    new go.Binding("stroke", "generation", function(gen) {
                        return gen === 4 ? "#78350f" : "#ffffff";
                    })
                ),
                $(go.TextBlock,
                    { font: "bold 10pt Georgia, serif", stroke: "#ffffff" },
                    new go.Binding("text", "name", getGivenInitial)
                )
            ),

            // Name
            $(go.TextBlock,
                {
                    maxSize: new go.Size(110, NaN),
                    wrap: go.TextBlock.WrapFit,
                    textAlign: "center",
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

            // Birth year (show only if present)
            $(go.TextBlock,
                {
                    font: "8pt Arial",
                    stroke: "#6b7280",
                    textAlign: "center",
                    margin: new go.Margin(1, 0, 0, 0)
                },
                new go.Binding("text", "birthYear", function(y) { return y ? "(" + y + ")" : ""; }),
                new go.Binding("visible", "birthYear", function(y) { return !!y; })
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

    updateStats(data.metadata);
    initSearchAutocomplete();
    initPersonModal();

    myDiagram.addDiagramListener("InitialLayoutCompleted", function() {
        myDiagram.zoomToFit();
    });
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
    const field = function(label, value, wide) {
        if (value === undefined || value === null || value === '') return '';
        return '<div class="profile-field' + (wide ? ' wide' : '') + '">' +
            '<span class="profile-label">' + escapeHtml(label) + '</span>' +
            '<span class="profile-value">' + escapeHtml(value) + '</span>' +
            '</div>';
    };

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
        field('Thân phụ', father ? father.name : 'Chưa xác định') +
        field('Phối ngẫu', data.spouses || 'Chưa ghi') +
        field('Con trong phả đồ', children.length ? children.length + ' người' : 'Chưa ghi') +
        '</div></section>';

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
function updateStats(meta) {
    if (!meta) return;
    const el = function(id) { return document.getElementById(id); };
    if (el('totalPeople'))        el('totalPeople').textContent        = meta.totalPeople || 0;
    if (el('totalRelationships')) el('totalRelationships').textContent = meta.totalRelationships || 0;
    if (el('generationRange') && meta.generationRange)
        el('generationRange').textContent = meta.generationRange[0] + '-' + meta.generationRange[1];
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
                var node = myDiagram.findNodeForKey(match.key);
                if (node) {
                    myDiagram.select(node);
                    myDiagram.commandHandler.scrollToPart(node);
                    showPersonInfo(match);
                }
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
            node.visible = (String(node.data.generation) === gen);
        }
    });
    // Ẩn link nếu cả 2 đầu đều ẩn
    myDiagram.links.each(function(link) {
        link.visible = link.fromNode && link.toNode &&
                       link.fromNode.visible && link.toNode.visible;
    });
    myDiagram.commitTransaction("filter");
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
