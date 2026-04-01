/**
 * Genealogy Viewer - GoJS Integration
 * Phả Đồ Gia Phả - Họ Trần Chi 4
 */

'use strict';

let genealogyData = null;
let myDiagram = null;

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
            layerSpacing: 40,
            nodeSpacing: 10,
            compaction: go.TreeLayout.CompactionBlock,
            sorting: go.TreeLayout.SortingAscending
        }),
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
    });

    // ── Node template ──────────────────────────
    myDiagram.nodeTemplate = $(go.Node, "Auto",
        {
            cursor: "pointer",
            toolTip: $(go.Adornment, "Auto",
                $(go.Shape, { fill: "#fffde7", stroke: "#f59e0b" }),
                $(go.TextBlock, { margin: 6, font: "12px Arial" },
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
        $(go.Shape, "RoundedRectangle",
            {
                parameter1: 4,
                strokeWidth: 1.5,
                stroke: "#1f2937"
            },
            new go.Binding("fill", "generation", getGenColor)
        ),
        $(go.Panel, "Vertical",
            { margin: new go.Margin(5, 8, 5, 8) },
            $(go.TextBlock,
                {
                    maxSize: new go.Size(130, NaN),
                    wrap: go.TextBlock.WrapFit,
                    textAlign: "center",
                    font: "bold 11px 'Arial', sans-serif",
                    stroke: "#ffffff"
                },
                new go.Binding("text", "name")
            ),
            $(go.TextBlock,
                {
                    font: "10px Arial",
                    stroke: "#d1fae5",
                    textAlign: "center",
                    margin: new go.Margin(1, 0, 0, 0)
                },
                new go.Binding("text", "generation", function(g) { return "Đời " + g; })
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
// Load dữ liệu từ API và render diagram
// ──────────────────────────────────────────────
function loadGenealogyById(genealogyId) {
    const diagramDiv = document.getElementById('myDiagramDiv');
    diagramDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b7280;font-size:16px;">⏳ Đang tải dữ liệu (<strong>' + genealogyId + '</strong>)...</div>';

    fetch('/api/genealogy/' + genealogyId + '/gojs_data/')
        .then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function(data) {
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

            // Gán model GoJS TreeModel (parent xác định bằng fatherId)
            myDiagram.model = new window.go.TreeModel({
                nodeParentKeyProperty: "fatherId",
                nodeKeyProperty: "key",
                nodeDataArray: data.nodeDataArray
            });

            updateStats(data.metadata);

            // Zoom vừa vặn sau khi layout xong
            myDiagram.addDiagramListener("InitialLayoutCompleted", function() {
                myDiagram.zoomToFit();
            });
        })
        .catch(function(err) {
            diagramDiv.innerHTML = '<div style="color:red;padding:20px;">❌ Lỗi tải dữ liệu: ' + err.message + '</div>';
        });
}

function loadGenealogy() {
    const sel = document.getElementById('genealogySelect');
    if (sel && sel.value) {
        loadGenealogyById(sel.value);
    }
}

// ──────────────────────────────────────────────
// Hiển thị thông tin người được chọn
// ──────────────────────────────────────────────
function showPersonInfo(data) {
    if (!data) return;
    document.getElementById('noSelection').style.display = 'none';
    const panel = document.getElementById('selectedInfo');
    panel.style.display = 'block';

    let html = '<strong style="font-size:13px;">' + data.name + '</strong><br>';
    html += '<span style="color:#6b7280;font-size:11px;">ID: ' + data.key + '</span><br>';
    html += '<span style="font-size:12px;">🏛 Đời thứ ' + data.generation + '</span><br>';
    if (data.spouses) html += '<span style="font-size:12px;">💑 Vợ: ' + data.spouses + '</span><br>';
    if (data.birthYear) html += '<span style="font-size:12px;">📅 Năm sinh: ' + data.birthYear + '</span><br>';
    if (data.location) html += '<span style="font-size:12px;">📍 ' + data.location + '</span><br>';
    if (data.notes) html += '<span style="font-size:11px;color:#6b7280;">📝 ' + data.notes + '</span><br>';

    document.getElementById('personInfo').innerHTML = html;

    // Highlight node
    if (myDiagram) {
        const node = myDiagram.findNodeForKey(data.key);
        if (node) {
            myDiagram.select(node);
            myDiagram.commandHandler.scrollToPart(node);
        }
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
// Tìm kiếm
// ──────────────────────────────────────────────
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
